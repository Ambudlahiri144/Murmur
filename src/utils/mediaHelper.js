const API_URL = 'http://localhost:5000';

/**
 * Creates a proxied URL to safely fetch media from Cloudinary
 * while adhering to cross-origin policies, and also handles old local URLs.
 * @param {string} originalUrl - The direct URL to the media.
 * @returns {string|undefined} The corrected URL for the media source.
 */
export const getProxiedUrl = (originalUrl) => {
    if (!originalUrl) {
        return undefined;
    }

    // Don't modify local blob URLs (used for previews)
    if (originalUrl.startsWith('blob:')) {
        return originalUrl;
    }

    // --- The Fix ---
    // If the URL is a local path (starts with '/'), serve it directly from the backend's static folder.
    if (originalUrl.startsWith('/')) {
        return `${API_URL}${originalUrl}`;
    }

    // Otherwise, assume it's a full Cloudinary URL and use the proxy.
    return `${API_URL}/api/media/stream?url=${encodeURIComponent(originalUrl)}`;
};
