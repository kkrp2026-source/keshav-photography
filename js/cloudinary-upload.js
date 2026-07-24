// ===== CLOUDINARY UPLOAD & FETCH UTILITY =====
// Uploads images to Cloudinary CDN (unsigned preset)
// Fetches images from Vercel serverless API (works in incognito/any browser)
// Deletes images via serverless API (removes from Cloudinary permanently)

const CLOUDINARY_CONFIG = {
    cloudName: 'apojnx4i',
    uploadPreset: 'kp_unsigned' // Create this unsigned preset in Cloudinary dashboard
};

// Admin secret - set this after login (stored in sessionStorage for security)
function getAdminToken() {
    return sessionStorage.getItem('kp_admin_token') || '';
}

function setAdminToken(token) {
    sessionStorage.setItem('kp_admin_token', token);
}

// ===== UPLOAD =====

/**
 * Upload a single file to Cloudinary using unsigned upload
 * @param {File} file - The file to upload
 * @param {string} folder - Cloudinary folder path (e.g., 'kp/gallery/wedding')
 * @param {string[]} tags - Tags to apply (e.g., ['gallery', 'wedding'])
 * @returns {Promise<{url: string, publicId: string, width: number, height: number}>}
 */
async function uploadToCloudinary(file, folder = 'kp', tags = []) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('folder', folder);
    if (tags.length > 0) {
        formData.append('tags', tags.join(','));
    }

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
        { method: 'POST', body: formData }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Upload failed');
    }

    const data = await response.json();

    // Return optimized URL with auto-format and quality
    const optimizedUrl = data.secure_url.replace('/upload/', '/upload/f_auto,q_auto/');

    return {
        url: optimizedUrl,
        publicId: data.public_id,
        width: data.width,
        height: data.height,
        originalUrl: data.secure_url,
        tags: data.tags || tags
    };
}

/**
 * Upload multiple files to Cloudinary
 * @param {File[]} files - Array of files
 * @param {string} folder - Cloudinary folder path
 * @param {string[]} tags - Tags to apply
 * @param {function} onProgress - Progress callback (current, total)
 * @returns {Promise<Array>}
 */
async function uploadMultipleToCloudinary(files, folder = 'kp', tags = [], onProgress = null) {
    const results = [];
    for (let i = 0; i < files.length; i++) {
        const result = await uploadToCloudinary(files[i], folder, tags);
        results.push(result);
        if (onProgress) onProgress(i + 1, files.length);
    }
    return results;
}

// ===== FETCH IMAGES (from serverless API) =====

/**
 * Fetch images from the serverless API (works in any browser/incognito)
 * @param {object} options - Query options
 * @param {string} options.folder - Folder to search (e.g., 'kp/gallery/wedding')
 * @param {string} options.tag - Tag to filter by
 * @param {string} options.type - Type filter: 'gallery', 'banners', 'portfolio', 'worlds', 'about'
 * @param {number} options.maxResults - Max images to return
 * @returns {Promise<Array>}
 */
async function fetchCloudinaryImages(options = {}) {
    const params = new URLSearchParams();
    if (options.folder) params.append('folder', options.folder);
    if (options.tag) params.append('tag', options.tag);
    if (options.type) params.append('type', options.type);
    if (options.maxResults) params.append('max_results', options.maxResults);

    const response = await fetch(`/api/images?${params.toString()}`);

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to fetch images');
    }

    const data = await response.json();
    return data.resources || [];
}

/**
 * Fetch gallery photos (for gallery.html and international-shoots.html)
 * @param {string} category - Optional category filter (e.g., 'wedding')
 * @returns {Promise<Array>}
 */
async function fetchGalleryPhotos(category = null) {
    const folder = category ? `kp/gallery/${category}` : 'kp/gallery';
    return fetchCloudinaryImages({ folder });
}

/**
 * Fetch hero banners
 * @returns {Promise<Array>}
 */
async function fetchBanners() {
    return fetchCloudinaryImages({ folder: 'kp/banners' });
}

/**
 * Fetch portfolio items
 * @returns {Promise<Array>}
 */
async function fetchPortfolio() {
    return fetchCloudinaryImages({ folder: 'kp/portfolio' });
}

/**
 * Fetch about images
 * @returns {Promise<Array>}
 */
async function fetchAboutImages() {
    return fetchCloudinaryImages({ folder: 'kp/about' });
}

/**
 * Fetch world cover images
 * @returns {Promise<Array>}
 */
async function fetchWorldCovers() {
    return fetchCloudinaryImages({ folder: 'kp/worlds' });
}

// ===== DELETE (via serverless API) =====

/**
 * Delete an image from Cloudinary via the serverless API
 * @param {string} publicId - The Cloudinary public_id to delete
 * @returns {Promise<{success: boolean}>}
 */
async function deleteFromCloudinary(publicId) {
    const response = await fetch('/api/delete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Admin-Token': getAdminToken()
        },
        body: JSON.stringify({ publicId })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to delete image');
    }

    return response.json();
}

// ===== UTILITY =====

/**
 * Get a Cloudinary thumbnail URL
 * @param {string} url - Full Cloudinary URL
 * @param {number} width - Desired width
 * @returns {string}
 */
function getCloudinaryThumb(url, width = 300) {
    if (!url || !url.includes('cloudinary')) return url;
    return url.replace('/upload/', `/upload/w_${width},c_scale,f_auto,q_auto/`);
}

/**
 * Extract category from a Cloudinary resource's folder path
 * e.g., 'kp/gallery/wedding' -> 'wedding'
 * @param {string} folder
 * @returns {string}
 */
function getCategoryFromFolder(folder) {
    if (!folder) return 'uncategorized';
    const parts = folder.split('/');
    return parts[parts.length - 1] || 'uncategorized';
}
