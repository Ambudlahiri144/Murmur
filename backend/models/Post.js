import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user', 
    required: true,
  },
  media: [{
    mediaType: {
      type: String,
      enum: ['image', 'video'],
      required: true,
    },
    url: {
      type: String,
      required: true,
    }
  }],
  caption: {
    type: String,
    default: '',
  },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
    }
  }],
  // --- The Fix is Here ---
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user'
    },
    text: {
      type: String,
      required: true
    },
    // Add fields to store the commenter's name and avatar
    name: {
      type: String,
      required: true
    },
    avatar: {
      type: String
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  date: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('post', PostSchema);
