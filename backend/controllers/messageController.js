import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { getReceiverSocketId, io } from '../socket.js';

// @desc    Send a message to a user
// @access  Private
export const sendMessage = async (req, res) => {
    try {
        const { message } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user.id;

        // Find if a conversation already exists between these two users
        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] },
        });

        // If no conversation exists, create a new one
        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId],
            });
        }

        // Create the new message
        const newMessage = new Message({
            sender: senderId,
            receiver: receiverId,
            message,
        });

        if (newMessage) {
            conversation.messages.push(newMessage._id);
        }

        // Save both the new message and the updated conversation
        await Promise.all([conversation.save(), newMessage.save()]);
        
        // --- SOCKET.IO REAL-TIME LOGIC ---
        const receiverSocketId = getReceiverSocketId(receiverId);
		if (receiverSocketId) {
			// io.to(<socket_id>).emit() used to send events to specific client
			io.to(receiverSocketId).emit("newMessage", newMessage);
		}

        res.status(201).json(newMessage);

    } catch (err) {
        console.error("Error in sendMessage controller: ", err.message);
        res.status(500).send("Internal Server Error");
    }
};

// @desc    Get messages for a conversation
// @access  Private



// @desc    Get all conversations for a user
// @access  Private
export const getConversations = async (req, res) => {
    try {
        const loggedInUserId = req.user.id;
        // Find all conversations for the current user and populate participants' info
        const conversations = await Conversation.find({ participants: loggedInUserId }).populate({
            path: 'participants',
            select: 'name profilePicture'
        });

        // Filter out the current user from the participants list to easily display the other person
        const formattedConversations = conversations.map(convo => {
            const otherParticipant = convo.participants.find(p => p._id.toString() !== loggedInUserId);
            return {
                _id: convo._id,
                otherParticipant: otherParticipant,
                // you can add last message preview here later
            };
        });

        res.status(200).json(formattedConversations);

    } catch (err) {
        console.error("Error in getConversations controller: ", err.message);
        res.status(500).send("Internal Server Error");
    }
};

// @desc    Share a post with one or more users
// @access  Private
export const sharePost = async (req, res) => {
    try {
        const { postId, recipients } = req.body;
        const senderId = req.user.id;

        if (!postId || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
            return res.status(400).json({ msg: 'Post ID and at least one recipient are required.' });
        }

        // Process all sharing requests concurrently
        const sharePromises = recipients.map(async (receiverId) => {
            // Find or create a conversation between the sender and receiver
            let conversation = await Conversation.findOneAndUpdate(
                { participants: { $all: [senderId, receiverId] } },
                { $setOnInsert: { participants: [senderId, receiverId] } },
                { new: true, upsert: true } // Creates the conversation if it doesn't exist
            );

            // Create the new message that references the shared post
            const newMessage = new Message({
                sender: senderId,
                receiver: receiverId,
                messageType: 'post',
                post: postId,
            });

            await newMessage.save();
            conversation.messages.push(newMessage._id);
            await conversation.save();

            // Emit the message in real-time via socket.io
            const receiverSocketId = getReceiverSocketId(receiverId);
            if (receiverSocketId) {
                // Populate the message with post details before sending over the socket
                const populatedMessage = await Message.findById(newMessage._id).populate({
                    path: 'post',
                    populate: {
                        path: 'user',
                        select: 'name profilePicture'
                    }
                });
                io.to(receiverSocketId).emit("newMessage", populatedMessage);
            }
        });

        await Promise.all(sharePromises);

        res.status(200).json({ msg: "Post shared successfully." });

    } catch (err) {
        console.error("Error in sharePost controller: ", err.message);
        res.status(500).send("Internal Server Error");
    }
};

export const getMessages = async (req, res) => {
    try {
        const { id: userToChatWithId } = req.params;
        const senderId = req.user.id;

        const conversation = await Conversation.findOne({
            participants: { $all: [senderId, userToChatWithId] },
        }).populate({
            path: "messages", // First, populate the messages array
            populate: {
                path: "post", // Then, inside each message, populate the 'post' field
                populate: {
                    path: "user", // And inside each post, populate the author's info
                    select: "name profilePicture"
                }
            }
        });

        if (!conversation) {
            return res.status(200).json([]);
        }

        res.status(200).json(conversation.messages);

    } catch (err) {
        console.error("Error in getMessages controller: ", err.message);
        res.status(500).send("Internal Server Error");
    }
};