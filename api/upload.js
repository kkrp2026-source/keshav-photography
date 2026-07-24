// API endpoint to get a signed upload signature (optional - for signed uploads)
// Also serves as a metadata store endpoint
// POST /api/upload  body: { publicId, category, type, title, ... }
// This stores metadata about uploads so they can be retrieved without searching

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
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Admin auth check
    const adminToken = req.headers['x-admin-token'];
    if (adminToken !== process.env.ADMIN_SECRET) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const { action } = req.body;

        if (action === 'sign') {
            // Generate a signed upload signature
            const timestamp = Math.round(new Date().getTime() / 1000);
            const folder = req.body.folder || 'kp';
            const tags = req.body.tags || [];

            const signature = cloudinary.utils.api_sign_request(
                { timestamp, folder, tags: tags.join(',') },
                process.env.CLOUDINARY_API_SECRET
            );

            return res.status(200).json({
                signature,
                timestamp,
                apiKey: process.env.CLOUDINARY_API_KEY,
                cloudName: process.env.CLOUDINARY_CLOUD_NAME,
                folder
            });
        }

        // Tag an existing resource
        if (action === 'tag') {
            const { publicId, tags } = req.body;
            if (!publicId || !tags) {
                return res.status(400).json({ error: 'publicId and tags are required' });
            }
            const result = await cloudinary.uploader.add_tag(tags, [publicId]);
            return res.status(200).json({ success: true, result });
        }

        return res.status(400).json({ error: 'Invalid action. Use "sign" or "tag".' });
    } catch (error) {
        console.error('Upload API error:', error);
        return res.status(500).json({ error: error.message || 'Server error' });
    }
};
