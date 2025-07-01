import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  // New field to distinguish between text and shared posts
  messageType: {
    type: String,
    enum: ['text', 'post'],
    default: 'text'
  },
  message: { // Used for standard text messages
    type: String,
    default: ''
  },
  post: { // Used for shared post messages
    type: mongoose.Schema.Types.ObjectId,
    ref: 'post',
    default: null
  }
}, { timestamps: true });

export default mongoose.model('message', MessageSchema);
