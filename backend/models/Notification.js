import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
    // The user who receives the notification
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    // The user who triggered the notification (e.g., who liked the post)
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    type: {
        type: String,
        required: true,
        enum: ['follow', 'like', 'comment', 'message'],
    },
    post: { // Optional: The post that was liked or commented on
        type: mongoose.Schema.Types.ObjectId,
        ref: 'post',
    },
    read: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

export default mongoose.model('notification', NotificationSchema);
