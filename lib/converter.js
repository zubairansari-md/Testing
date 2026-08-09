const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const crypto = require('crypto');
const { promisify } = require('util');

// --- CONFIGURATION ---
const CONFIG = {
    TEMP_DIR: path.join(__dirname, '../temp'),
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    CLEANUP_INTERVAL: 3600000, // 1 hour
    MAX_AGE: 3600000, // 1 hour
    AUDIO_BITRATE: '128k',
    AUDIO_SAMPLERATE: 44100,
    AUDIO_CHANNELS: 2
};

// --- ENSURE TEMP DIRECTORY ---
if (!fsSync.existsSync(CONFIG.TEMP_DIR)) {
    fsSync.mkdirSync(CONFIG.TEMP_DIR, { recursive: true });
}

// --- HELPER: Get File Size ---
const getFileSize = async (filePath) => {
    try {
        const stats = await fs.stat(filePath);
        return stats.size;
    } catch {
        return 0;
    }
};

// --- HELPER: Format Size ---
const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
};

// --- HELPER: Get File Extension ---
const getFileExtension = (ext) => {
    const validExtensions = ['mp3', 'mp4', 'm4a', 'aac', 'ogg', 'wav', 'flac', 'opus', 'webm', 'mkv', 'avi', 'mov'];
    const cleanExt = ext.toLowerCase().replace(/^\./, '');
    return validExtensions.includes(cleanExt) ? cleanExt : 'mp3';
};

// --- HELPER: Validate Audio Buffer ---
const validateAudioBuffer = (buffer) => {
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

// --- HELPER: Cleanup Old Files ---
const cleanupOldFiles = async () => {
    try {
        const files = await fs.readdir(CONFIG.TEMP_DIR);
        const now = Date.now();
        let deleted = 0;

        for (const file of files) {
            const filePath = path.join(CONFIG.TEMP_DIR, file);
            try {
                const stats = await fs.stat(filePath);
                if (now - stats.mtimeMs > CONFIG.MAX_AGE) {
                    await fs.unlink(filePath);
                    deleted++;
                }
            } catch (err) {
                console.error(`Failed to delete ${file}:`, err.message);
            }
        }

        if (deleted > 0) {
            console.log(`🧹 Cleaned up ${deleted} old temp files`);
        }
    } catch (error) {
        console.error('Cleanup error:', error);
    }
};

// --- SCHEDULE CLEANUP ---
setInterval(cleanupOldFiles, CONFIG.CLEANUP_INTERVAL);

// --- MAIN: toAudio ---
/**
 * Convert audio buffer to MP3
 * @param {Buffer} buffer - Input audio buffer
 * @param {string} ext - Input file extension
 * @param {Object} options - Conversion options
 * @returns {Promise<Buffer>} - MP3 buffer
 */
async function toAudio(buffer, ext, options = {}) {
    const startTime = Date.now();
    
    try {
        // --- Validate Input ---
        validateAudioBuffer(buffer);
        
        const fileExt = getFileExtension(ext);
        const id = crypto.randomBytes(8).toString('hex');
        const inputPath = path.join(CONFIG.TEMP_DIR, `${id}_in.${fileExt}`);
        const outputPath = path.join(CONFIG.TEMP_DIR, `${id}_out.mp3`);

        // --- Write Input File ---
        await fs.writeFile(inputPath, buffer);
        console.log(`📝 Input file created: ${path.basename(inputPath)} (${formatSize(buffer.length)})`);

        // --- Conversion Options ---
        const audioBitrate = options.bitrate || CONFIG.AUDIO_BITRATE;
        const audioSamplerate = options.samplerate || CONFIG.AUDIO_SAMPLERATE;
        const audioChannels = options.channels || CONFIG.AUDIO_CHANNELS;

        // --- Convert to MP3 ---
        await new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .toFormat('mp3')
                .audioBitrate(audioBitrate)
                .audioFrequency(audioSamplerate)
                .audioChannels(audioChannels)
                .on('start', (commandLine) => {
                    console.log(`🔊 FFmpeg started: ${commandLine}`);
                })
                .on('progress', (progress) => {
                    if (progress.percent % 10 === 0) {
                        console.log(`⏳ Conversion: ${Math.round(progress.percent)}%`);
                    }
                })
                .on('end', () => {
                    console.log(`✅ Conversion complete`);
                    resolve();
                })
                .on('error', (err) => {
                    console.error(`❌ FFmpeg error:`, err.message);
                    reject(err);
                })
                .save(outputPath);
        });

        // --- Read Output File ---
        const outputBuffer = await fs.readFile(outputPath);
        const outputSize = outputBuffer.length;
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(`📤 Output: ${formatSize(outputSize)} (${elapsed}s)`);

        // --- Validate Output ---
        if (outputBuffer.length === 0) {
            throw new Error('Output buffer is empty');
        }

        return outputBuffer;

    } catch (error) {
        console.error(`❌ Conversion error:`, error.message);
        throw new Error(`Failed to convert audio: ${error.message}`);
    } finally {
        // --- Cleanup Temp Files ---
        const id = crypto.randomBytes(8).toString('hex');
        const inputPath = path.join(CONFIG.TEMP_DIR, `${id}_in.*`);
        const outputPath = path.join(CONFIG.TEMP_DIR, `${id}_out.mp3`);
        
        try {
            const files = await fs.readdir(CONFIG.TEMP_DIR);
            for (const file of files) {
                if (file.includes(id)) {
                    const filePath = path.join(CONFIG.TEMP_DIR, file);
                    if (fsSync.existsSync(filePath)) {
                        await fs.unlink(filePath);
                        console.log(`🧹 Cleaned up: ${file}`);
                    }
                }
            }
        } catch (err) {
            console.error('Cleanup error:', err.message);
        }
    }
}

// --- ADDITIONAL CONVERSION FUNCTIONS ---

/**
 * Convert audio to specific format
 * @param {Buffer} buffer - Input buffer
 * @param {string} inputExt - Input extension
 * @param {string} outputExt - Output extension
 * @param {Object} options - Conversion options
 * @returns {Promise<Buffer>}
 */
async function convertAudio(buffer, inputExt, outputExt, options = {}) {
    validateAudioBuffer(buffer);
    
    const fileExt = getFileExtension(inputExt);
    const outExt = getFileExtension(outputExt);
    const id = crypto.randomBytes(8).toString('hex');
    const inputPath = path.join(CONFIG.TEMP_DIR, `${id}_in.${fileExt}`);
    const outputPath = path.join(CONFIG.TEMP_DIR, `${id}_out.${outExt}`);

    try {
        await fs.writeFile(inputPath, buffer);

        await new Promise((resolve, reject) => {
            const command = ffmpeg(inputPath)
                .toFormat(outExt)
                .on('end', resolve)
                .on('error', reject);

            if (options.bitrate) command.audioBitrate(options.bitrate);
            if (options.samplerate) command.audioFrequency(options.samplerate);
            if (options.channels) command.audioChannels(options.channels);
            if (options.volume) command.volume(options.volume);

            command.save(outputPath);
        });

        const outputBuffer = await fs.readFile(outputPath);
        return outputBuffer;
    } finally {
        // Cleanup
        try {
            if (fsSync.existsSync(inputPath)) await fs.unlink(inputPath);
            if (fsSync.existsSync(outputPath)) await fs.unlink(outputPath);
        } catch (err) {
            console.error('Cleanup error:', err.message);
        }
    }
}

/**
 * Get audio duration
 * @param {Buffer} buffer - Audio buffer
 * @param {string} ext - File extension
 * @returns {Promise<number>} Duration in seconds
 */
async function getAudioDuration(buffer, ext) {
    const fileExt = getFileExtension(ext);
    const id = crypto.randomBytes(8).toString('hex');
    const inputPath = path.join(CONFIG.TEMP_DIR, `${id}_in.${fileExt}`);

    try {
        await fs.writeFile(inputPath, buffer);

        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(inputPath, (err, metadata) => {
                if (err) reject(err);
                else resolve(metadata.format.duration || 0);
            });
        });
    } finally {
        try {
            if (fsSync.existsSync(inputPath)) await fs.unlink(inputPath);
        } catch (err) {
            console.error('Cleanup error:', err.message);
        }
    }
}

/**
 * Extract audio from video
 * @param {Buffer} buffer - Video buffer
 * @param {string} ext - Video extension
 * @param {Object} options - Options
 * @returns {Promise<Buffer>} Audio buffer
 */
async function extractAudio(buffer, ext, options = {}) {
    validateAudioBuffer(buffer);
    
    const fileExt = getFileExtension(ext);
    const id = crypto.randomBytes(8).toString('hex');
    const inputPath = path.join(CONFIG.TEMP_DIR, `${id}_in.${fileExt}`);
    const outputExt = options.format || 'mp3';
    const outputPath = path.join(CONFIG.TEMP_DIR, `${id}_out.${outputExt}`);

    try {
        await fs.writeFile(inputPath, buffer);

        await new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .noVideo()
                .toFormat(outputExt)
                .audioBitrate(options.bitrate || '128k')
                .audioFrequency(options.samplerate || 44100)
                .on('end', resolve)
                .on('error', reject)
                .save(outputPath);
        });

        return await fs.readFile(outputPath);
    } finally {
        try {
            if (fsSync.existsSync(inputPath)) await fs.unlink(inputPath);
            if (fsSync.existsSync(outputPath)) await fs.unlink(outputPath);
        } catch (err) {
            console.error('Cleanup error:', err.message);
        }
    }
}

// --- EXPORT ---
module.exports = {
    toAudio,
    convertAudio,
    getAudioDuration,
    extractAudio,
    formatSize,
    CONFIG
};