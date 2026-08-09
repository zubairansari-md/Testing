const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// --- CONFIGURATION ---
const CONFIG = {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'],
    TIMEOUT: 60000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 2000
};

// --- UPLOAD SERVICES ---
const SERVICES = [
    {
        name: 'Telegraph',
        url: 'https://telegra.ph/upload',
        upload: async (buffer, options = {}) => {
            const form = new FormData();
            const filename = options.filename || `file_${Date.now()}.jpg`;
            form.append('file', buffer, filename);

            const response = await axios.post('https://telegra.ph/upload', form, {
                headers: form.getHeaders(),
                timeout: CONFIG.TIMEOUT
            });

            if (response.data && response.data[0] && response.data[0].src) {
                return {
                    url: 'https://telegra.ph' + response.data[0].src,
                    service: 'Telegraph',
                    id: response.data[0].src
                };
            }
            throw new Error('Telegraph upload failed');
        }
    },
    {
        name: 'ImgBB',
        url: 'https://api.imgbb.com/1/upload',
        upload: async (buffer, options = {}) => {
            const apiKey = options.apiKey || process.env.IMGBB_API_KEY || 'YOUR_IMGBB_API_KEY';
            if (!apiKey || apiKey === 'YOUR_IMGBB_API_KEY') {
                throw new Error('ImgBB API key not configured');
            }

            const form = new FormData();
            form.append('key', apiKey);
            form.append('image', buffer.toString('base64'));
            form.append('name', options.filename || `file_${Date.now()}`);

            const response = await axios.post('https://api.imgbb.com/1/upload', form, {
                headers: form.getHeaders(),
                timeout: CONFIG.TIMEOUT
            });

            if (response.data && response.data.success && response.data.data) {
                return {
                    url: response.data.data.url,
                    service: 'ImgBB',
                    id: response.data.data.id,
                    delete: response.data.data.delete_url
                };
            }
            throw new Error('ImgBB upload failed');
        }
    },
    {
        name: 'FreeImage',
        url: 'https://freeimage.host/api/1/upload',
        upload: async (buffer, options = {}) => {
            const apiKey = options.apiKey || process.env.FREEIMAGE_API_KEY || 'YOUR_FREEIMAGE_API_KEY';
            if (!apiKey || apiKey === 'YOUR_FREEIMAGE_API_KEY') {
                throw new Error('FreeImage API key not configured');
            }

            const form = new FormData();
            form.append('key', apiKey);
            form.append('source', buffer, options.filename || 'file.jpg');
            form.append('format', 'json');

            const response = await axios.post('https://freeimage.host/api/1/upload', form, {
                headers: form.getHeaders(),
                timeout: CONFIG.TIMEOUT
            });

            if (response.data && response.data.status_code === 200) {
                return {
                    url: response.data.image.url,
                    service: 'FreeImage',
                    id: response.data.image.id,
                    thumb: response.data.image.thumb
                };
            }
            throw new Error('FreeImage upload failed');
        }
    }
];

// --- HELPER: Validate Buffer ---
const validateBuffer = (buffer) => {
    if (!buffer || !Buffer.isBuffer(buffer)) {
        throw new Error('Invalid buffer provided');
    }
    if (buffer.length === 0) {
        throw new Error('Buffer is empty');
    }
    if (buffer.length > CONFIG.MAX_FILE_SIZE) {
        throw new Error(`File too large: ${formatSize(buffer.length)} (max: ${formatSize(CONFIG.MAX_FILE_SIZE)})`);
    }
    return true;
};

// --- HELPER: Format Size ---
const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
};

// --- HELPER: Get Image Info ---
const getImageInfo = async (buffer) => {
    try {
        const metadata = await sharp(buffer).metadata();
        return {
            width: metadata.width,
            height: metadata.height,
            format: metadata.format,
            size: buffer.length,
            sizeFormatted: formatSize(buffer.length)
        };
    } catch (error) {
        return {
            width: 0,
            height: 0,
            format: 'unknown',
            size: buffer.length,
            sizeFormatted: formatSize(buffer.length)
        };
    }
};

// --- HELPER: Optimize Image ---
const optimizeImage = async (buffer, options = {}) => {
    try {
        const maxWidth = options.maxWidth || 2000;
        const maxHeight = options.maxHeight || 2000;
        const quality = options.quality || 80;

        let optimized = sharp(buffer);
        
        // Resize if needed
        const metadata = await optimized.metadata();
        if (metadata.width > maxWidth || metadata.height > maxHeight) {
            optimized = optimized.resize(maxWidth, maxHeight, {
                fit: 'inside',
                withoutEnlargement: true
            });
        }

        // Convert to JPEG if not supported
        if (!CONFIG.SUPPORTED_FORMATS.includes(metadata.format)) {
            optimized = optimized.jpeg({ quality: quality });
        }

        return await optimized.toBuffer();
    } catch (error) {
        console.error('Image optimization error:', error.message);
        return buffer;
    }
};

// --- MAIN: uploadImage ---
async function uploadImage(buffer, options = {}) {
    const startTime = Date.now();
    
    try {
        // --- Validate Input ---
        validateBuffer(buffer);

        // --- Get Image Info ---
        const info = await getImageInfo(buffer);
        console.log(`📸 Uploading image: ${info.width}x${info.height}, ${info.sizeFormatted}`);

        // --- Optimize Image ---
        if (options.optimize !== false) {
            buffer = await optimizeImage(buffer, options);
            console.log(`🔧 Optimized: ${formatSize(buffer.length)}`);
        }

        // --- Choose Service ---
        let services = options.services || ['Telegraph', 'ImgBB', 'FreeImage'];
        let selectedServices = SERVICES.filter(s => services.includes(s.name));

        if (selectedServices.length === 0) {
            selectedServices = SERVICES;
        }

        // --- Attempt Upload with Retry ---
        let lastError = null;
        let result = null;

        for (const service of selectedServices) {
            for (let attempt = 1; attempt <= CONFIG.RETRY_ATTEMPTS; attempt++) {
                try {
                    console.log(`📤 Uploading to ${service.name} (Attempt ${attempt})...`);
                    
                    const uploadResult = await service.upload(buffer, {
                        filename: options.filename || `file_${Date.now()}.jpg`,
                        apiKey: options.apiKey
                    });

                    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
                    console.log(`✅ Uploaded to ${service.name} in ${elapsed}s: ${uploadResult.url}`);

                    result = {
                        ...uploadResult,
                        size: buffer.length,
                        sizeFormatted: formatSize(buffer.length),
                        width: info.width,
                        height: info.height,
                        timestamp: new Date().toISOString(),
                        elapsed: elapsed
                    };

                    return result;

                } catch (error) {
                    console.error(`❌ ${service.name} attempt ${attempt} failed:`, error.message);
                    lastError = error;
                    
                    if (attempt < CONFIG.RETRY_ATTEMPTS) {
                        await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY * attempt));
                    }
                }
            }
        }

        throw new Error(`All upload services failed. Last error: ${lastError?.message || 'Unknown'}`);

    } catch (error) {
        console.error('❌ Upload error:', error.message);
        throw new Error(`Failed to upload image: ${error.message}`);
    }
}

// --- Upload from File ---
async function uploadFile(filePath, options = {}) {
    try {
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }
        const buffer = fs.readFileSync(filePath);
        return await uploadImage(buffer, options);
    } catch (error) {
        console.error('❌ File upload error:', error.message);
        throw new Error(`Failed to upload file: ${error.message}`);
    }
}

// --- Upload from URL ---
async function uploadFromUrl(url, options = {}) {
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: CONFIG.TIMEOUT
        });
        const buffer = Buffer.from(response.data);
        return await uploadImage(buffer, options);
    } catch (error) {
        console.error('❌ URL upload error:', error.message);
        throw new Error(`Failed to upload from URL: ${error.message}`);
    }
}

// --- Multiple Uploads ---
async function uploadMultiple(buffers, options = {}) {
    const results = [];
    for (const buffer of buffers) {
        try {
            const result = await uploadImage(buffer, options);
            results.push({ success: true, result });
        } catch (error) {
            results.push({ success: false, error: error.message });
        }
    }
    return results;
}

// --- Get Supported Services ---
function getSupportedServices() {
    return SERVICES.map(s => s.name);
}

// --- Add Custom Service ---
function addService(name, uploadFunction) {
    SERVICES.push({
        name: name,
        upload: uploadFunction
    });
}

// --- EXPORT ---
module.exports = uploadImage;

// --- Export Additional Functions ---
module.exports.uploadFile = uploadFile;
module.exports.uploadFromUrl = uploadFromUrl;
module.exports.uploadMultiple = uploadMultiple;
module.exports.getSupportedServices = getSupportedServices;
module.exports.addService = addService;
module.exports.getImageInfo = getImageInfo;
module.exports.optimizeImage = optimizeImage;
module.exports.validateBuffer = validateBuffer;
module.exports.formatSize = formatSize;
module.exports.CONFIG = CONFIG;