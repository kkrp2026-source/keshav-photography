// ===== CLOUDINARY UPLOAD UTILITY =====
// Uses Cloudinary Upload Widget for client-side uploads (unsigned)
// Images are stored on Cloudinary CDN and only URLs are saved in localStorage

const CLOUDINARY_CONFIG = {
    cloudName: 'apojnx4i',
    uploadPreset: 'kp_unsigned' // You must create this unsigned preset in Cloudinary dashboard
};

/**
 * Upload a single file to Cloudinary using the Upload API (unsigned)
 * @param {File} file - The file to upload
 * @param {string} folder - Cloudinary folder path (e.g., 'kp/gallery/wedding')
 * @returns {Promise<{url: string, publicId: string, width: number, height: number}>}
 */
async function uploadToCloudinary(file, folder = 'kp') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('folder', folder);
    
    // Auto-format to WebP for optimal delivery
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
        originalUrl: data.secure_url
    };
}

/**
 * Upload multiple files to Cloudinary
 * @param {File[]} files - Array of files to upload
 * @param {string} folder - Cloudinary folder path
 * @param {function} onProgress - Callback for progress updates (index, total)
 * @returns {Promise<Array>}
 */
async function uploadMultipleToCloudinary(files, folder = 'kp', onProgress = null) {
    const results = [];
    for (let i = 0; i < files.length; i++) {
        const result = await uploadToCloudinary(files[i], folder);
        results.push(result);
        if (onProgress) onProgress(i + 1, files.length);
    }
    return results;
}

/**
 * Get a Cloudinary thumbnail URL from a full URL
 * @param {string} url - Full Cloudinary URL
 * @param {number} width - Desired width
 * @returns {string}
 */
function getCloudinaryThumb(url, width = 300) {
    if (!url || !url.includes('cloudinary')) return url;
    return url.replace('/upload/', `/upload/w_${width},c_scale,f_auto,q_auto/`);
}
