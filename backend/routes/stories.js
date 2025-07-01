import express from 'express';
import auth from '../middleware/auth.js';
import { createStory, getStoryFeed } from '../controllers/storyController.js';
import multer from 'multer';
import { postStorage } from '../config/cloudinary.js'; // We can reuse the same storage config

const router = express.Router();
const upload = multer({ storage: postStorage });

// @route   POST api/stories
// @desc    Create a story
// @access  Private
router.post('/', [auth, upload.single('storyMedia')], createStory);

// @route   GET api/stories
// @desc    Get story feed for the user
// @access  Private
router.get('/', auth, getStoryFeed);

export default router;
