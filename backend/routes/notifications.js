import express from 'express';
import auth from '../middleware/auth.js';
import { getNotifications, markNotificationsAsRead } from '../controllers/notificationController.js';

const router = express.Router();

// @route   GET api/notifications
// @desc    Get user's notifications
// @access  Private
router.get('/', auth, getNotifications);

// @route   PUT api/notifications/read
// @desc    Mark notifications as read
// @access  Private
router.put('/read', auth, markNotificationsAsRead);

export default router;
