import express from 'express';
import { sendMessage, getMessages, getConversations,sharePost } from '../controllers/messageController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/messages/conversations
// @desc    Get all conversations for the logged-in user
// @access  Private
router.get('/conversations', auth, getConversations);

// @route   GET /api/messages/:id
// @desc    Get messages for a conversation with a specific user
// @access  Private
router.get('/:id', auth, getMessages);

// @route   POST /api/messages/send/:id
// @desc    Send a message to a specific user
// @access  Private
router.post('/send/:id', auth, sendMessage);
router.post('/share', auth, sharePost);

export default router;
