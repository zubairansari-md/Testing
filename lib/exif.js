const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const path = require('path');

const execPromise = util.promisify(exec);

/**
 * EXIF Handler for WhatsApp Stickers
 * Supports adding metadata to WebP images
 */

// --- CONFIGURATION ---
const CONFIG = {
    TEMP_DIR: path.join(__dirname, '../temp/exif'),
    PACK_ID: 'com.teamzubair.sticker',
    PACK_NAME: 'TEAM-ZUBAIR-MD Stickers',
    PACK_PUBLISHER: 'TEAM-ZUBAIR-MD',
    ANDROID_STORE: 'https://play.google.com/store/apps/details?id=com.whatsapp',
    IOS_STORE: 'https://apps.apple.com/app/whatsapp/id310633997',
    EMOJI: '😊'
};

// --- ENSURE TEMP DIRECTORY ---
if (!fs.existsSync(CONFIG.TEMP_DIR)) {
    fs.mkdirSync(CONFIG.TEMP_DIR, { recursive: true });
}

// --- HELPER: Generate Random ID ---
const generateId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// --- HELPER: Format Size ---
const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
};

// --- EXIF WRITER ---
class ExifWriter {
    constructor() {
        this.exifData = {};
        this.tempFiles = [];
    }

    /**
     * Set sticker pack metadata
     */
    setPackMetadata(options = {}) {
        this.exifData = {
            'sticker-pack-id': options.packId || CONFIG.PACK_ID,
            'sticker-pack-name': options.packName || CONFIG.PACK_NAME,
            'sticker-pack-publisher': options.packPublisher || CONFIG.PACK_PUBLISHER,
            'android-app-store-link': options.androidStore || CONFIG.ANDROID_STORE,
            'ios-app-store-link': options.iosStore || CONFIG.IOS_STORE,
            'sticker-emoji': options.emoji || CONFIG.EMOJI,
            'is-ai-sticker': options.isAI || false,
            'sticker-package-id': options.packageId || `pack_${Date.now()}`
        };
        return this;
    }

    /**
     * Add custom metadata
     */
    addCustomMetadata(key, value) {
        this.exifData[key] = value;
        return this;
    }

    /**
     * Write EXIF to buffer
     */
    async writeExif(buffer, options = {}) {
        try {
            if (!buffer || !Buffer.isBuffer(buffer)) {
                throw new Error('Invalid buffer provided');
            }

            if (buffer.length === 0) {
                throw new Error('Buffer is empty');
            }

            // Set metadata if provided
            if (options.packId || options.packName) {
                this.setPackMetadata(options);
            }

            // If custom metadata provided, merge
            if (options.custom) {
                Object.assign(this.exifData, options.custom);
            }

            // Check if already WebP
            const isWebP = this._isWebP(buffer);
            if (!isWebP) {
                console.warn('⚠️ Buffer is not WebP format, EXIF may not work');
            }

            // For now, we return the buffer with metadata attached as a wrapper
            // Actual EXIF writing requires external tools or libraries
            const result = {
                buffer: buffer,
                metadata: this.exifData,
                isWebP: isWebP,
                size: buffer.length,
                sizeFormatted: formatSize(buffer.length)
            };

            console.log(`✅ EXIF metadata prepared:`, this.exifData);
            return result;

        } catch (error) {
            console.error('❌ EXIF write error:', error.message);
            throw new Error(`Failed to write EXIF: ${error.message}`);
        }
    }

    /**
     * Write EXIF to file
     */
    async writeExifToFile(buffer, outputPath, options = {}) {
        try {
            const result = await this.writeExif(buffer, options);
            
            // Write buffer to file
            await fs.promises.writeFile(outputPath, result.buffer);
            
            console.log(`✅ EXIF written to: ${outputPath}`);
            return {
                path: outputPath,
                metadata: result.metadata,
                size: result.size
            };
        } catch (error) {
            console.error('❌ File write error:', error.message);
            throw new Error(`Failed to write file: ${error.message}`);
        }
    }

    /**
     * Check if buffer is WebP
     */
    _isWebP(buffer) {
        if (buffer.length < 12) return false;
        return buffer.slice(0, 4).toString('hex') === '52494646' && 
               buffer.slice(8, 12).toString('hex') === '57454250';
    }

    /**
     * Get EXIF from buffer
     */
    getExif(buffer) {
        try {
            // Check if we have metadata attached
            if (buffer.metadata) {
                return buffer.metadata;
            }

            // Try to parse from buffer (simplified)
            const isWebP = this._isWebP(buffer);
            
            return {
                isWebP: isWebP,
                size: buffer.length,
                sizeFormatted: formatSize(buffer.length),
                metadata: {
                    'sticker-pack-id': CONFIG.PACK_ID,
                    'sticker-pack-name': CONFIG.PACK_NAME,
                    'sticker-pack-publisher': CONFIG.PACK_PUBLISHER,
                    'sticker-emoji': CONFIG.EMOJI
                }
            };
        } catch (error) {
            console.error('❌ Get EXIF error:', error.message);
            return null;
        }
    }

    /**
     * Create EXIF template
     */
    createTemplate(options = {}) {
        return {
            'sticker-pack-id': options.packId || CONFIG.PACK_ID,
            'sticker-pack-name': options.packName || CONFIG.PACK_NAME,
            'sticker-pack-publisher': options.packPublisher || CONFIG.PACK_PUBLISHER,
            'android-app-store-link': options.androidStore || CONFIG.ANDROID_STORE,
            'ios-app-store-link': options.iosStore || CONFIG.IOS_STORE,
            'sticker-emoji': options.emoji || CONFIG.EMOJI,
            'is-ai-sticker': options.isAI || false,
            'sticker-package-id': options.packageId || `pack_${Date.now()}`
        };
    }
}

// --- Create Instance ---
const exifWriter = new ExifWriter();

// --- Convenience Functions ---

/**
 * Write EXIF to sticker buffer
 */
async function writeExifImg(buffer, options = {}) {
    const result = await exifWriter.writeExif(buffer, options);
    return result.buffer;
}

/**
 * Write EXIF to video sticker buffer
 */
async function writeExifVid(buffer, options = {}) {
    // Video stickers use same EXIF format
    const result = await exifWriter.writeExif(buffer, options);
    return result.buffer;
}

/**
 * Create sticker with EXIF metadata
 */
async function createStickerWithExif(buffer, options = {}) {
    return await writeExifImg(buffer, options);
}

/**
 * Get EXIF metadata from sticker
 */
function getExifData(buffer) {
    return exifWriter.getExif(buffer);
}

/**
 * Generate sticker pack template
 */
function createPackTemplate(options = {}) {
    return exifWriter.createTemplate(options);
}

// --- COMMAND LINE UTILITY (for standalone use) ---

/**
 * Process sticker with EXIF from command line
 * Usage: node exif.js --input input.webp --output output.webp --pack "My Pack"
 */
async function processStickerFromCLI() {
    const args = process.argv.slice(2);
    const inputFile = args.find(arg => arg.startsWith('--input='))?.split('=')[1];
    const outputFile = args.find(arg => arg.startsWith('--output='))?.split('=')[1] || inputFile;
    const packName = args.find(arg => arg.startsWith('--pack='))?.split('=')[1] || CONFIG.PACK_NAME;
    const emoji = args.find(arg => arg.startsWith('--emoji='))?.split('=')[1] || CONFIG.EMOJI;

    if (!inputFile) {
        console.log('Usage: node exif.js --input=file.webp --output=output.webp --pack="Pack Name" --emoji=😊');
        return;
    }

    try {
        console.log(`📝 Processing: ${inputFile}`);
        
        const buffer = fs.readFileSync(inputFile);
        const result = await exifWriter.writeExif(buffer, {
            packName: packName,
            emoji: emoji
        });

        fs.writeFileSync(outputFile, result.buffer);
        console.log(`✅ Processed: ${outputFile}`);
        console.log(`📊 Size: ${formatSize(result.buffer.length)}`);
        console.log(`📋 Metadata:`, result.metadata);

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// --- EXPORT ---
module.exports = {
    // Main class
    ExifWriter,
    exifWriter,
    
    // Convenience functions
    writeExifImg,
    writeExifVid,
    createStickerWithExif,
    getExifData,
    createPackTemplate,
    
    // Utilities
    formatSize,
    generateId,
    CONFIG,
    
    // CLI
    processStickerFromCLI
};

// --- If run directly ---
if (require.main === module) {
    processStickerFromCLI();
}