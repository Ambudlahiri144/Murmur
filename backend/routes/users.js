import express from 'express';
import auth from '../middleware/auth.js';
import { deleteUserAccount } from '../controllers/userController.js';

const router = express.Router();

// @route   DELETE api/users/me
// @desc    Delete current user's account
// @access  Private
router.delete('/me', auth, deleteUserAccount);

export default router;
