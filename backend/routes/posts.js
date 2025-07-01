import express from 'express';
import auth from '../middleware/auth.js';
import { createPost, getMyPosts, getAllPosts, deletePost, getPostsByUserId,getExplorePosts,commentOnPost,likePost,unlikePost,getPostById } from '../controllers/postController.js';
import multer from 'multer';
import { postStorage } from '../config/cloudinary.js';

const router = express.Router();

// Initialize multer with the Cloudinary storage engine
const upload = multer({ storage: postStorage });

// --- GET Routes ---
// @route   GET api/posts
// @desc    Get all posts for the main feed
// @access  Private
router.get('/', auth, getAllPosts);

// @route   GET api/posts/me
// @desc    Get all posts for current user
// @access  Private
router.get('/me', auth, getMyPosts);
router.get('/user/:userId', auth, getPostsByUserId);
router.get('/explore', auth, getExplorePosts);

// --- POST Route ---
// @route   POST api/posts
// @desc    Create a post with images or videos
// @access  Private
router.post('/', [auth, upload.array('postMedia', 10)], createPost);
router.post('/comment/:id', auth, commentOnPost);


// --- PUT Routes for Liking/Unliking ---
// @route   PUT api/posts/like/:id
// @desc    Like a post
// @access  Private
router.put('/like/:id', auth, likePost);

// @route   PUT api/posts/unlike/:id
// @desc    Unlike a post
// @access  Private
router.put('/unlike/:id', auth, unlikePost);


// --- DELETE Route ---
// @route   DELETE api/posts/:id
// @desc    Delete a post by its ID
// @access  Private
router.delete('/:id', auth, deletePost);
router.get('/:id', auth, getPostById);

export default router;
