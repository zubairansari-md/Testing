/**
 * ⚔️ TEAM-ZUBAIR-MD Settings Configuration
 * 🩸 Professional WhatsApp Bot Settings
 * 
 * @version 2.0.0
 * @author TEAM-ZUBAIR-MD
 */

require('dotenv').config();

// ==========================================
// 🩸 CONFIGURATION
// ==========================================

module.exports = {
    // ==========================================
    // 🤖 BOT INFORMATION
    // ==========================================
    
    botName: process.env.BOT_NAME || 'TEAM-ZUBAIR-MD',
    botVersion: process.env.BOT_VERSION || '2.0.0',
    botPrefix: process.env.BOT_PREFIX || '.',
    botDescription: process.env.BOT_DESCRIPTION || '⚔️ Professional WhatsApp Bot by TEAM-ZUBAIR-MD',
    
    // ==========================================
    // 👤 OWNER INFORMATION
    // ==========================================
    
    ownerName: process.env.BOT_OWNER || 'TEAM-ZUBAIR-MD',
    ownerNumber: process.env.BOT_OWNER_NUMBER || '9234567890',
    ownerNumbers: process.env.OWNER_NUMBERS ? process.env.OWNER_NUMBERS.split(',') : ['9234567890'],
    ownerEmail: process.env.OWNER_EMAIL || 'bichuxboy@gmail.com',
    
    // ==========================================
    // 🔗 API KEYS
    // ==========================================
    
    // GIPHY API (for GIFs)
    giphyApiKey: process.env.GIPHY_API_KEY || 'dc6zaTOxFJmzC',
    
    // OpenAI / Groq API (for AI features)
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    aiBaseUrl: process.env.AI_BASE_URL || 'https://api.groq.com/openai/v1',
    aiModel: process.env.AI_MODEL || 'llama-3.3-70b-versatile',
    aiTemperature: parseFloat(process.env.AI_TEMPERATURE) || 0.7,
    aiMaxTokens: parseInt(process.env.AI_MAX_TOKENS) || 2048,
    
    // Telegram Bot
    telegramToken: process.env.TELEGRAM_TOKEN || '',
    
    // ImgBB (Image Upload)
    imgbbApiKey: process.env.IMGBB_API_KEY || '',
    
    // FreeImage
    freeimageApiKey: process.env.FREEIMAGE_API_KEY || '',
    
    // ==========================================
    // 🌐 SOCIAL LINKS
    // ==========================================
    
    social: {
        whatsappChannel: 'https://whatsapp.com/channel/0029VbDLF614NVidqsqjqV2z',
        github: 'https://github.com/Team-Zubair-MD',
        instagram: 'https://instagram.com/bichuxboy',
        tiktok: 'https://tiktok.com/@bichuxboy',
        youtube: 'https://youtube.com/@bichuxboy',
        website: 'https://deploying'
    },
    
    // ==========================================
    // 🎨 THEME CONFIGURATION
    // ==========================================
    
    theme: {
        primary: '#8B0000',     // Blood Red
        secondary: '#DC143C',   // Crimson
        accent: '#CC0000',      // Bright Red
        background: '#0A0A0A',  // Black
        cardBg: '#1A0A0A',      // Dark Blood
        text: '#FFFFFF',        // White
        muted: '#990000',       // Muted Red
        border: '#330000',      // Dark Border
        glow: '#FF0000'         // Glowing Red
    },
    
    // ==========================================
    // ⚙️ SERVER CONFIGURATION
    // ==========================================
    
    port: parseInt(process.env.PORT) || 20664,
    host: process.env.HOST || '0.0.0.0',
    nodeEnv: process.env.NODE_ENV || 'production',
    
    // ==========================================
    // 📁 PATHS
    // ==========================================
    
    paths: {
        authDir: './auth_info',
        dataDir: './data',
        tempDir: './temp',
        logsDir: './logs',
        storageDir: './storage'
    },
    
    // ==========================================
    // 🔒 SECURITY
    // ==========================================
    
    security: {
        corsEnabled: process.env.CORS_ENABLED !== 'false',
        rateLimitEnabled: process.env.RATE_LIMIT_ENABLED !== 'false',
        rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 60000,
        rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100,
        rateLimitDelay: parseInt(process.env.RATE_LIMIT_DELAY) || 1000
    },
    
    // ==========================================
    // 🛡️ FEATURE FLAGS
    // ==========================================
    
    features: {
        antiDelete: process.env.ANTI_DELETE !== 'false',
        antiLink: process.env.ANTI_LINK !== 'false',
        antiViewOnce: process.env.ANTI_VIEW_ONCE !== 'false',
        autoSticker: process.env.AUTO_STICKER !== 'false',
        autoStatus: process.env.AUTO_STATUS !== 'false',
        autoReact: process.env.AUTO_REACT !== 'false',
        autoRead: process.env.AUTO_READ !== 'false'
    },
    
    // ==========================================
    // 📊 DEFAULT SETTINGS
    // ==========================================
    
    defaults: {
        language: process.env.DEFAULT_LANGUAGE || 'en',
        timezone: process.env.DEFAULT_TIMEZONE || 'Asia/Karachi',
        locale: process.env.DEFAULT_LOCALE || 'en-PK',
        autoReply: process.env.DEFAULT_AUTO_REPLY === 'true',
        autoReact: process.env.DEFAULT_AUTO_REACT === 'true',
        autoRead: process.env.DEFAULT_AUTO_READ === 'true',
        autoStatus: process.env.DEFAULT_AUTO_STATUS === 'true'
    },
    
    // ==========================================
    // 📦 FILE LIMITS
    // ==========================================
    
    limits: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024, // 100MB
        maxImageSize: parseInt(process.env.MAX_IMAGE_SIZE) || 10 * 1024 * 1024, // 10MB
        maxVideoSize: parseInt(process.env.MAX_VIDEO_SIZE) || 50 * 1024 * 1024, // 50MB
        maxAudioSize: parseInt(process.env.MAX_AUDIO_SIZE) || 25 * 1024 * 1024 // 25MB
    },
    
    // ==========================================
    // 🎵 MEDIA CONFIGURATION
    // ==========================================
    
    media: {
        stickerSize: parseInt(process.env.STICKER_SIZE) || 512,
        stickerQuality: parseInt(process.env.STICKER_QUALITY) || 80,
        audioBitrate: process.env.AUDIO_BITRATE || '128k',
        audioSamplerate: parseInt(process.env.AUDIO_SAMPLERATE) || 44100,
        audioChannels: parseInt(process.env.AUDIO_CHANNELS) || 2
    },
    
    // ==========================================
    // 🔄 SESSION CONFIGURATION
    // ==========================================
    
    session: {
        name: process.env.SESSION_NAME || 'teamsession',
        autoRead: process.env.AUTO_READ !== 'false',
        autoReconnect: process.env.AUTO_RECONNECT !== 'false',
        reconnectDelay: parseInt(process.env.RECONNECT_DELAY) || 3000,
        maxRetries: parseInt(process.env.MAX_RETRIES) || 5
    },
    
    // ==========================================
    // 📧 CONTACT INFORMATION
    // ==========================================
    
    contact: {
        email: 'bichuxboy@gmail.com',
        support: 'https://github.com/bichuxboy-crypto/',
        channel: 'https://whatsapp.com/channel/0029VbDLF614NVidqsqjqV2z'
    },
    
    // ==========================================
    // 🩸 BRANDING
    // ==========================================
    
    branding: {
        name: 'TEAM-ZUBAIR-MD',
        tagline: 'Where Blood Meets Code',
        slogan: '⚔️ Professional WhatsApp Bot',
        footer: '© 2024 TEAM-ZUBAIR-MD. All rights reserved.'
    }
};

// ==========================================
// 🔥 HELPER FUNCTIONS
// ==========================================

/**
 * Get owner numbers as array
 * @returns {Array} Array of owner numbers
 */
module.exports.getOwners = function() {
    return this.ownerNumbers || [this.ownerNumber];
};

/**
 * Check if a user is owner
 * @param {string} userId - User ID to check
 * @returns {boolean} True if owner
 */
module.exports.isOwner = function(userId) {
    if (!userId) return false;
    const owners = this.getOwners();
    return owners.some(owner => 
        userId === owner || 
        userId === owner + '@s.whatsapp.net' ||
        userId.includes(owner) ||
        owner.includes(userId)
    );
};

/**
 * Get bot info as object
 * @returns {Object} Bot information
 */
module.exports.getBotInfo = function() {
    return {
        name: this.botName,
        version: this.botVersion,
        description: this.botDescription,
        prefix: this.botPrefix,
        owner: this.ownerName,
        social: this.social
    };
};

/**
 * Get theme colors
 * @returns {Object} Theme colors
 */
module.exports.getTheme = function() {
    return this.theme;
};

/**
 * Get social links
 * @returns {Object} Social links
 */
module.exports.getSocialLinks = function() {
    return this.social;
};

/**
 * Get feature status
 * @param {string} feature - Feature name
 * @returns {boolean} Feature status
 */
module.exports.isFeatureEnabled = function(feature) {
    return this.features[feature] !== false;
};

// ==========================================
// 🩸 EXPORT CONFIG
// ==========================================

console.log(`╭━━━〔 ⚔️ TEAM-ZUBAIR-MD 〕━━━┈⊷`);
console.log(`┃`);
console.log(`┃ 🤖 Bot: ${module.exports.botName}`);
console.log(`┃ 📦 Version: ${module.exports.botVersion}`);
console.log(`┃ 👤 Owner: ${module.exports.ownerName}`);
console.log(`┃ 📱 Number: ${module.exports.ownerNumber}`);
console.log(`┃ 🎨 Theme: Bloody Black`);
console.log(`┃`);
console.log(`╰━━━━━━━━━━━━━━━━━━┈⊷`);