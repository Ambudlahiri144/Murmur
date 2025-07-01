import User from '../models/User.js';
import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import { getReceiverSocketId, io } from '../socket.js';
// @desc    Get current user's profile
// @access  Private
export const getMyProfile = async (req, res) => {
    try {
        // req.user.id is available from the auth middleware
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get user profile by ID
// @access  Public
export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('-password');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
             return res.status(404).json({ msg: 'User not found' });
        }
        res.status(500).send('Server Error');
    }
};
export const getFollowingList = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate({
            path: 'following.user',
            select: 'name profilePicture' // Select the fields you need
        });

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const followingDetails = user.following.map(f => f.user);

        res.json(followingDetails);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
// @desc    Update user profile (name and bio)
// @access  Private
export const updateProfileDetails = async (req, res) => {
    const { name, bio } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        if (name) user.name = name;
        if (bio || bio === '') user.bio = bio; 

        await user.save();
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get user suggestions
// @access  Private
export const getUserSuggestions = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 3;
        const userId = new mongoose.Types.ObjectId(req.user.id);

        const users = await User.aggregate([
            { $match: { _id: { $ne: userId } } }, 
            { $sample: { size: limit } },         
            { $project: { password: 0 } }        
        ]);
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Upload profile picture
// @access  Private
export const uploadProfilePicture = async (req, res) => {
  if (req.file) {
     try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        
        // Save the secure URL from Cloudinary directly
        user.profilePicture = req.file.path; 
        await user.save();
        
        // Send back the full URL
        res.json({ msg: 'Profile picture uploaded successfully', filePath: user.profilePicture });

     } catch(err) {
        console.error(err.message);
        res.status(500).send('Server Error');
     }
  } else {
    res.status(400).json({ msg: 'Please upload a file' });
  }
};

export const followUser = async (req, res) => {
    try {
        const userToFollow = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user.id);

        if (!userToFollow || !currentUser) {
            return res.status(404).json({ msg: 'User not found' });
        }

        if (currentUser.following.some(follow => follow.user.toString() === req.params.id)) {
            return res.status(400).json({ msg: 'You are already following this user' });
        }

        currentUser.following.unshift({ user: req.params.id });
        await currentUser.save();
        
        userToFollow.followers.unshift({ user: req.user.id });
        await userToFollow.save();

        // Create and emit notification
        const newNotification = new Notification({
            user: req.params.id, // The user being followed
            from: req.user.id,
            type: 'follow',
        });
        await newNotification.save();

        const receiverSocketId = getReceiverSocketId(req.params.id);
        if (receiverSocketId) {
            // The fix is here: Populate the 'from' field before emitting
            const populatedNotification = await Notification.findById(newNotification._id).populate('from', 'name profilePicture');
            io.to(receiverSocketId).emit("newNotification", populatedNotification);
        }

        res.json({ msg: 'User followed' });

    } catch (err) { 
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Unfollow a user
// @access  Private
export const unfollowUser = async (req, res) => {
    try {
        const userToUnfollow = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user.id);

        if (!userToUnfollow || !currentUser) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Check if not following
        if (!currentUser.following.some(follow => follow.user.toString() === req.params.id)) {
            return res.status(400).json({ msg: 'You are not following this user' });
        }

        // Remove from following list of current user
        currentUser.following = currentUser.following.filter(
            ({ user }) => user.toString() !== req.params.id
        );
        await currentUser.save();
        
        // Remove from followers list of the user being unfollowed
        userToUnfollow.followers = userToUnfollow.followers.filter(
            ({ user }) => user.toString() !== req.user.id
        );
        await userToUnfollow.save();

        res.json({ msg: 'User unfollowed' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

export const searchUsers = async (req, res) => {
    try {
        const searchQuery = req.query.q;
        if (!searchQuery) {
            return res.json([]);
        }

        // Use a regular expression for a case-insensitive, partial match search
        const users = await User.find({
            name: { $regex: searchQuery, $options: 'i' }
        }).select('-password').limit(10); // Limit results to 10

        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
