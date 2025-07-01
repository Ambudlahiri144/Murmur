import User from '../models/User.js';
import Post from '../models/Post.js';
import Notification from '../models/Notification.js';
import Story from '../models/Story.js';
import { cloudinary } from '../config/cloudinary.js';

// A helper function to extract public_id from Cloudinary URL
const getPublicId = (url) => {
    const parts = url.split('/');
    const publicIdWithFormat = parts[parts.length - 1];
    return publicIdWithFormat.split('.')[0];
};

// @desc    Delete user account and all associated data
// @access  Private
export const deleteUserAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // --- 1. Delete all media from Cloudinary ---
        // Profile Picture
        if (user.profilePicture) {
            await cloudinary.uploader.destroy(getPublicId(user.profilePicture));
        }
        // Posts and Stories
        const userPosts = await Post.find({ user: userId });
        for (const post of userPosts) {
            for (const media of post.media) {
                await cloudinary.uploader.destroy(getPublicId(media.url), { resource_type: media.mediaType });
            }
        }
        const userStories = await Story.find({ user: userId });
        for (const story of userStories) {
             await cloudinary.uploader.destroy(getPublicId(story.media.url), { resource_type: story.media.mediaType });
        }
        
        // --- 2. Delete all data from Database ---
        await Post.deleteMany({ user: userId });
        await Story.deleteMany({ user: userId });
        await Notification.deleteMany({ $or: [{ user: userId }, { from: userId }] });
        // Remove user from other users' followers/following lists
        await User.updateMany({}, { $pull: { followers: { user: userId }, following: { user: userId } } });
        // Remove user's comments from all posts
        await Post.updateMany({}, { $pull: { comments: { user: userId } } });

        // --- 3. Finally, delete the user ---
        await user.deleteOne();

        res.json({ msg: 'User account permanently deleted' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
