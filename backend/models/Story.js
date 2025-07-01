import mongoose from 'mongoose';

const StorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user', 
    required: true,
  },
  media: {
    mediaType: {
      type: String,
      enum: ['image', 'video'],
      required: true,
    },
    url: {
      type: String,
      required: true,
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    // This creates a TTL index that automatically deletes the document after 24 hours (86400 seconds)
    expires: 86400, 
  },
});

export default mongoose.model('story', StorySchema);
