// API endpoint to delete an image from Cloudinary
// POST /api/delete  body: { publicId: "kp/gallery/wedding/abc123" }

const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports = async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    // Simple admin auth check via header
    const adminToken = req.headers['x-admin-token'];
    if (adminToken !== process.env.ADMIN_SECRET) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const { publicId } = req.body;

        if (!publicId) {
            return res.status(400).json({ error: 'publicId is required' });
        }

        const result = await cloudinary.uploader.destroy(publicId, {
            invalidate: true
        });

        if (result.result === 'ok' || result.result === 'not found') {
            return res.status(200).json({ success: true, result: result.result });
        } else {
            return res.status(400).json({ success: false, result: result.result });
        }
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        return res.status(500).json({ error: error.message || 'Failed to delete image' });
    }
};
