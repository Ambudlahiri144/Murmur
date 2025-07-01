import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  profilePicture: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: '',
    maxLength: 150
  },
  // --- New Fields for Followers/Following ---
  followers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user'
    }
  }],
  following: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user'
    }
  }],
  date: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('user', UserSchema);
