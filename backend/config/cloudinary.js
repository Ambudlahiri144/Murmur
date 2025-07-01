import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure storage for posts (allows images and videos)
const postStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'murmur_posts',
    resource_type: 'auto', // Automatically detect if it's an image or video
    allowed_formats: ['jpeg', 'jpg', 'png', 'mp4', 'mov'],
  },
});

// Configure storage for profile pictures (images only)
const profilePictureStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'murmur_profile_pictures',
      resource_type: 'image',
      allowed_formats: ['jpeg', 'jpg', 'png'],
      transformation: [{ width: 500, height: 500, crop: 'fill' }]
    },
});

export { cloudinary, postStorage, profilePictureStorage };
