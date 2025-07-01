import Story from '../models/Story.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// @desc    Create a new story
export const createStory = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ msg: 'Please upload a file for the story.' });
    }

    try {
        const newStory = new Story({
            user: req.user.id,
            media: {
                mediaType: req.file.mimetype.startsWith('image') ? 'image' : 'video',
                url: req.file.path // The secure URL from Cloudinary
            }
        });

        await newStory.save();
        
        // We'll use this for real-time updates later
        // req.io.emit('new-story', newStory);

        res.status(201).json(newStory);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get story feed for the current user
export const getStoryFeed = async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        const followingIds = currentUser.following.map(f => f.user);

        // Include the current user's ID to also get their own stories
        const userIdsForStories = [new mongoose.Types.ObjectId(req.user.id), ...followingIds];

        // Fetch stories from the user and people they follow
        const stories = await Story.find({
            user: { $in: userIdsForStories }
        }).populate('user', ['name', 'profilePicture']).sort({ createdAt: -1 });

        // Group stories by user
        const groupedStories = stories.reduce((acc, story) => {
            const userId = story.user._id.toString();
            if (!acc[userId]) {
                acc[userId] = {
                    userId: story.user._id,
                    username: story.user.name,
                    userAvatar: story.user.profilePicture,
                    stories: []
                };
            }
            acc[userId].stories.push({
                _id: story._id,
                media: story.media,
                createdAt: story.createdAt
            });
            return acc;
        }, {});

        res.json(Object.values(groupedStories));
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
