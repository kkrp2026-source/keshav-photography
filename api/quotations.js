// API endpoint to store/retrieve quotation records centrally (cross-device).
// Records are kept as a single JSON document in Cloudinary (raw resource),
// so every admin device sees the same list.
//
// GET  /api/quotations            -> { records: [...] }
// POST /api/quotations            -> body: { action: 'save', record: {...} }  (adds one)
//                                     body: { action: 'delete', code: 'XXXX' } (removes one)
//
// Requires admin token for POST (same ADMIN_SECRET used by upload/delete).

const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const PUBLIC_ID = 'kp/data/quotations';

async function readRecords() {
    try {
        const resource = await cloudinary.api.resource(PUBLIC_ID, { resource_type: 'raw' });
        const url = resource.secure_url + '?t=' + Date.now(); // cache-bust
        const resp = await fetch(url);
        if (!resp.ok) return [];
        const data = await resp.json();
        return Array.isArray(data) ? data : [];
    } catch (e) {
        // Not found yet -> empty list
        return [];
    }
}

function writeRecords(records) {
    const json = JSON.stringify(records);
    const dataUri = 'data:application/json;base64,' + Buffer.from(json).toString('base64');
    return cloudinary.uploader.upload(dataUri, {
        resource_type: 'raw',
        public_id: PUBLIC_ID,
        overwrite: true,
        invalidate: true
    });
}

module.exports = async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        return res.status(500).json({ error: 'Cloudinary not configured' });
    }

    try {
        if (req.method === 'GET') {
            const records = await readRecords();
            const code = req.query && req.query.code;

            // Public: fetch a single quotation's full data by code (for the viewer).
            if (code) {
                const found = records.find(r => r.code === code);
                if (!found) return res.status(404).json({ error: 'Quotation not found' });
                return res.status(200).json({ record: found, data: found.data || null });
            }

            // Listing: strip the heavy `data` field to keep the table light.
            const light = records.map(r => ({
                code: r.code,
                clientName: r.clientName,
                brideName: r.brideName,
                groomName: r.groomName,
                createdAt: r.createdAt,
                link: r.link
            }));
            return res.status(200).json({ records: light });
        }

        if (req.method === 'POST') {
            // Admin auth
            const adminToken = req.headers['x-admin-token'];
            if (adminToken !== process.env.ADMIN_SECRET) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { action, record, code } = req.body || {};
            let records = await readRecords();

            if (action === 'save') {
                if (!record || !record.code) {
                    return res.status(400).json({ error: 'record with a code is required' });
                }
                // de-dupe by code, newest first
                records = records.filter(r => r.code !== record.code);
                records.unshift(record);
                await writeRecords(records);
                return res.status(200).json({ success: true, records });
            }

            if (action === 'delete') {
                if (!code) return res.status(400).json({ error: 'code is required' });
                records = records.filter(r => r.code !== code);
                await writeRecords(records);
                return res.status(200).json({ success: true, records });
            }

            return res.status(400).json({ error: 'Invalid action. Use "save" or "delete".' });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Quotations API error:', error);
        return res.status(500).json({ error: error.message || 'Server error' });
    }
};
