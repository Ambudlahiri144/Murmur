import axios from 'axios';

// This controller will fetch media from Cloudinary and stream it to the client
export const streamMedia = async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) {
            return res.status(400).send('No URL provided');
        }

        // Fetch the media from the Cloudinary URL
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream'
        });

        // Set the content type from the Cloudinary response
        res.setHeader('Content-Type', response.headers['content-type']);
        // Pipe the stream from Cloudinary directly to the client
        response.data.pipe(res);

    } catch (err) {
        console.error('Media proxy error:', err.message);
        res.status(500).send('Error fetching media');
    }
};
