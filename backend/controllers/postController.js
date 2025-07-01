import Post from '../models/Post.js';
import User from '../models/User.js';
import { cloudinary } from '../config/cloudinary.js';
import Notification from '../models/Notification.js';
import { getReceiverSocketId, io } from '../socket.js'; 
import mongoose from 'mongoose';
// @desc    Create a new post
export const createPost = async (req, res) => {
    const { caption } = req.body;
    
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ msg: 'Please upload at least one image or video.' });
    }
    
    try {
        const mediaFiles = req.files.map(file => ({
            mediaType: file.mimetype.startsWith('image') ? 'image' : 'video',
            url: file.path 
        }));

        const newPost = new Post({
            caption,
            media: mediaFiles,
            user: req.user.id,
        });

        const post = await newPost.save();
        res.json(post);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Delete a post
export const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        if (post.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        for (const media of post.media) {
            const urlParts = media.url.split('/');
            const publicIdWithFormat = urlParts[urlParts.length - 1];
            const publicId = publicIdWithFormat.split('.')[0];
            
            await cloudinary.uploader.destroy(publicId, { 
                resource_type: media.mediaType 
            });
        }

        await post.deleteOne();
        res.json({ msg: 'Post removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post not found' });
        }
        res.status(500).send('Server Error');
    }
};


// @desc    Get all posts for the user's feed (self + following)
export const getAllPosts = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const userIds = [req.user.id, ...user.following.map(f => f.user)];
        const posts = await Post.find({ user: { $in: userIds } })
            .sort({ date: -1 })
            .populate('user', ['name', 'profilePicture']);
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
// @desc    Get all posts for the currently logged-in user
export const getMyPosts = async (req, res) => {
    try {
        // The fix is here: Adding .populate() to attach user data to the posts.
        const posts = await Post.find({ user: req.user.id })
            .sort({ date: -1 })
            .populate('user', ['name', 'profilePicture']);
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get posts by a specific user ID
export const getPostsByUserId = async (req, res) => {
    try {
        // The fix is here: Adding .populate() to attach user data to the posts.
        const posts = await Post.find({ user: req.params.userId })
            .sort({ date: -1 })
            .populate('user', ['name', 'profilePicture']);
            
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Posts not found' });
        }
        res.status(500).send('Server Error');
    }
};

// @desc    Get all posts for the explore page (excluding own posts)
export const getExplorePosts = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);

        const posts = await Post.find({ user: { $ne: userId } })
            .sort({ date: -1 })
            .populate('user', ['name', 'profilePicture']);
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
export const likePost = async (req, res) => {
    try {
        const post = await Post.findByIdAndUpdate(
            req.params.id,
            { $addToSet: { likes: { user: req.user.id } } },
            { new: true }
        );

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        // Create and emit notification only if liking someone else's post
        if (post.user.toString() !== req.user.id) {
             const notification = new Notification({
                user: post.user,
                from: req.user.id,
                type: 'like',
                post: post._id,
            });
            await notification.save();
            const receiverSocketId = getReceiverSocketId(post.user.toString());
            if (receiverSocketId) {
                // The fix is here: Populate the 'from' field before emitting
                const populatedNotification = await Notification.findById(notification._id).populate('from', 'name profilePicture');
                io.to(receiverSocketId).emit("newNotification", populatedNotification);
            }
        }

        res.json(post.likes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Unlike a post
// @access  Private
export const unlikePost = async (req, res) => {
    try {
        // Use findByIdAndUpdate with $pull.
        // This atomically removes all instances of the user's like from the array.
        const post = await Post.findByIdAndUpdate(
            req.params.id,
            { $pull: { likes: { user: req.user.id } } },
            { new: true }
        );

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        res.json(post.likes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Comment on a post
export const commentOnPost = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        
        const newComment = {
            text: req.body.text,
            user: req.user.id,
            name: user.name,
            avatar: user.profilePicture
        };

        const updatedPost = await Post.findByIdAndUpdate(
            req.params.id,
            { 
                $push: { 
                    comments: { 
                        $each: [newComment], 
                        $position: 0 
                    } 
                } 
            },
            { new: true }
        );

        if (!updatedPost) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        // Only send a notification if commenting on someone else's post
        if (updatedPost.user.toString() !== req.user.id) {
            const notification = new Notification({
                user: updatedPost.user,
                from: req.user.id,
                type: 'comment',
                post: updatedPost._id,
            });
            await notification.save();
            const receiverSocketId = getReceiverSocketId(updatedPost.user.toString());
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("newNotification", notification);
            }
        }

        res.json(updatedPost.comments);
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
export const getPostById = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate('user', ['name', 'profilePicture']);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        res.json(post);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post not found' });
        }
        res.status(500).send('Server Error');
    }
};