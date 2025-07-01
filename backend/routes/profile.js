import express from 'express';
import multer from 'multer';
import { 
    uploadProfilePicture, 
    getUserProfile, 
    getMyProfile, 
    updateProfileDetails,
    getUserSuggestions,
    followUser,
    unfollowUser,
    searchUsers,
    getFollowingList // <-- Import the new function
} from '../controllers/profileController.js';
import auth from '../middleware/auth.js';
import { profilePictureStorage } from '../config/cloudinary.js';

const router = express.Router();

// Initialize multer with the Cloudinary storage engine for profile pictures
const upload = multer({ storage: profilePictureStorage });

// --- Specific routes first ---

// @route   GET api/profile/me
// @desc    Get current logged-in user's profile
// @access  Private
router.get('/me', auth, getMyProfile);

// @route   GET api/profile/suggestions
// @desc    Get user suggestions
// @access  Private
router.get('/suggestions', auth, getUserSuggestions);

// @route   GET api/profile/following
// @desc    Get a list of users the current user is following
// @access  Private
router.get('/following', auth, getFollowingList);

// @route   GET api/profile/search
// @desc    Search for users
// @access  Private
router.get('/search', auth, searchUsers);


// --- PUT/POST Routes for Updates ---
// @route   PUT api/profile/me
// @desc    Update current user's name and bio
// @access  Private
router.put('/me', auth, updateProfileDetails);

// @route   POST api/profile/upload
// @desc    Upload profile picture
// @access  Private
router.post('/upload', [auth, upload.single('profilePicture')], uploadProfilePicture);

// @route   PUT api/profile/follow/:id
// @desc    Follow a user
// @access  Private
router.put('/follow/:id', auth, followUser);

// @route   PUT api/profile/unfollow/:id
// @desc    Unfollow a user
// @access  Private
router.put('/unfollow/:id', auth, unfollowUser);


// --- Dynamic route last ---

// @route   GET api/profile/:userId
// @desc    Get user profile by ID
// @access  Public
router.get('/:userId', getUserProfile);

export default router;
