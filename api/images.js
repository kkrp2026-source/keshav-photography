// API endpoint to list images from Cloudinary by folder/tag
// GET /api/images?folder=kp/gallery/wedding
// GET /api/images?tag=wedding
// GET /api/images (returns all from kp/ folder)

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

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { folder, tag, type, max_results } = req.query;
        const limit = parseInt(max_results) || 100;

        let result;

        if (tag) {
            // Search by tag
            result = await cloudinary.api.resources_by_tag(tag, {
                max_results: limit,
                resource_type: 'image'
            });
        } else if (folder) {
            // Search by folder prefix
            result = await cloudinary.search
                .expression(`folder:${folder}/*`)
                .sort_by('created_at', 'desc')
                .max_results(limit)
                .execute();
        } else {
            // Get all from kp folder
            result = await cloudinary.search
                .expression('folder:kp/*')
                .sort_by('created_at', 'desc')
                .max_results(limit)
                .execute();
        }

        // Normalize response
        const resources = (result.resources || []).map(r => ({
            publicId: r.public_id,
            url: r.secure_url.replace('/upload/', '/upload/f_auto,q_auto/'),
            width: r.width,
            height: r.height,
            folder: r.folder || r.public_id.substring(0, r.public_id.lastIndexOf('/')),
            tags: r.tags || [],
            createdAt: r.created_at,
            // Extract category from folder path (e.g., kp/gallery/wedding -> wedding)
            category: extractCategory(r.public_id, r.folder, r.tags)
        }));

        // Group by type if requested
        if (type) {
            const filtered = resources.filter(r => {
                const cat = r.category;
                if (type === 'gallery') return r.folder?.includes('gallery');
                if (type === 'banners') return r.folder?.includes('banners');
                if (type === 'portfolio') return r.folder?.includes('portfolio');
                if (type === 'worlds') return r.folder?.includes('worlds');
                if (type === 'about') return r.folder?.includes('about');
                return true;
            });
            return res.status(200).json({ resources: filtered, total: filtered.length });
        }

        return res.status(200).json({ resources, total: resources.length });
    } catch (error) {
        console.error('Cloudinary API error:', error);
        return res.status(500).json({ error: error.message || 'Failed to fetch images' });
    }
};

function extractCategory(publicId, folder, tags) {
    // Try to get category from folder structure: kp/gallery/wedding/img -> wedding
    const parts = (folder || publicId || '').split('/');
    if (parts.length >= 3) return parts[2]; // kp/gallery/CATEGORY or kp/worlds/CATEGORY
    if (parts.length >= 2) return parts[1]; // kp/banners -> banners
    // Fallback to first tag
    if (tags && tags.length > 0) return tags[0];
    return 'uncategorized';
}
