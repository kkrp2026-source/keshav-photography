// API endpoint to send form data via WhatsApp Business Cloud API
// POST /api/whatsapp  body: { message: "text" }

module.exports = async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
    const RECIPIENT_NUMBER = process.env.WHATSAPP_RECIPIENT_NUMBER;

    if (!PHONE_NUMBER_ID || !ACCESS_TOKEN || !RECIPIENT_NUMBER) {
        return res.status(500).json({ error: 'WhatsApp not configured' });
    }

    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const url = `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: RECIPIENT_NUMBER,
                type: 'text',
                text: { body: message }
            })
        });

        const data = await response.json();

        if (response.ok) {
            return res.status(200).json({ success: true, messageId: data.messages?.[0]?.id });
        } else {
            console.error('WhatsApp API error:', data);
            return res.status(400).json({ error: data.error?.message || 'Failed to send' });
        }
    } catch (error) {
        console.error('WhatsApp send error:', error);
        return res.status(500).json({ error: error.message || 'Server error' });
    }
};
