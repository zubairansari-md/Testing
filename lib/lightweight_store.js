/**
 * Messages Module - Centralized message management
 * Handles all bot responses and messages
 */

// --- CONFIGURATION ---
const CONFIG = {
    MAX_MESSAGE_LENGTH: 4096,
    CACHE_DURATION: 3600000, // 1 hour
    SUPPORTED_LANGUAGES: ['en', 'ur', 'hi', 'ar', 'es', 'fr', 'de', 'zh', 'ja', 'ru']
};

// --- CACHE ---
const cache = new Map();

// --- HELPER: Format Message ---
const formatMessage = (text, variables = {}) => {
    let formatted = text;
    for (const [key, value] of Object.entries(variables)) {
        formatted = formatted.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return formatted;
};

// --- HELPER: Truncate Message ---
const truncateMessage = (text, maxLength = CONFIG.MAX_MESSAGE_LENGTH) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
};

// --- MESSAGE TEMPLATES ---
const templates = {
    // Welcome Messages
    welcome: {
        default: '👋 Welcome to the group, {{user}}!',
        withTag: '👋 Welcome @{{user}} to the group!',
        withMedia: '👋 Welcome {{user}}! 🎉',
        custom: '{{message}}'
    },

    // Goodbye Messages
    goodbye: {
        default: '👋 Goodbye {{user}}! We\'ll miss you!',
        withTag: '👋 Goodbye @{{user}}! We\'ll miss you!',
        custom: '{{message}}'
    },

    // Admin Messages
    admin: {
        only: '❌ Only admins can use this command.',
        groupOnly: '❌ This command can only be used in groups.',
        privateOnly: '❌ This command can only be used in private chats.',
        notAdmin: '❌ You are not an admin in this group.',
        botNotAdmin: '❌ Bot is not an admin in this group.'
    },

    // Error Messages
    error: {
        general: '❌ An error occurred. Please try again later.',
        invalid: '❌ Invalid input. Please check your command.',
        notFound: '❌ Not found. Please try again.',
        timeout: '⏱️ Request timed out. Please try again.',
        rateLimit: '🚫 Rate limited. Please wait before trying again.',
        permission: '❌ You don\'t have permission to do this.',
        network: '🌐 Network error. Please check your connection.'
    },

    // Success Messages
    success: {
        enabled: '✅ {{feature}} has been enabled!',
        disabled: '❌ {{feature}} has been disabled!',
        updated: '✅ {{feature}} has been updated!',
        deleted: '✅ {{feature}} has been deleted!',
        created: '✅ {{feature}} has been created!',
        saved: '✅ {{feature}} has been saved!'
    },

    // Loading Messages
    loading: {
        processing: '⏳ Processing...',
        downloading: '📥 Downloading...',
        uploading: '📤 Uploading...',
        searching: '🔍 Searching...',
        fetching: '📡 Fetching data...',
        generating: '🔄 Generating...'
    },

    // Status Messages
    status: {
        online: '🟢 Online',
        offline: '🔴 Offline',
        idle: '🟡 Idle',
        busy: '🔴 Busy',
        connecting: '🔄 Connecting...',
        disconnected: '❌ Disconnected'
    },

    // Media Messages
    media: {
        image: '🖼️ Image',
        video: '🎥 Video',
        audio: '🎵 Audio',
        sticker: '🎨 Sticker',
        document: '📄 Document',
        gif: '🎞️ GIF'
    },

    // Bot Info Messages
    bot: {
        name: '🤖 {{name}}',
        version: '📦 Version: {{version}}',
        uptime: '⏱️ Uptime: {{uptime}}',
        memory: '💾 Memory: {{memory}}MB',
        ping: '🏓 Pong! {{ping}}ms'
    },

    // Custom Messages
    custom: {}
};

// --- MAIN EXPORT ---
module.exports = {
    messages: {
        // --- Get Message ---
        get: (path, variables = {}, options = {}) => {
            try {
                const keys = path.split('.');
                let message = templates;
                
                for (const key of keys) {
                    if (message && message[key] !== undefined) {
                        message = message[key];
                    } else {
                        throw new Error(`Message path not found: ${path}`);
                    }
                }
                
                // If message is an object, return the default
                if (typeof message === 'object') {
                    message = message.default || JSON.stringify(message);
                }
                
                // Format message with variables
                let formatted = formatMessage(message, variables);
                
                // Truncate if needed
                if (options.truncate !== false) {
                    formatted = truncateMessage(formatted, options.maxLength || CONFIG.MAX_MESSAGE_LENGTH);
                }
                
                return formatted;
            } catch (error) {
                console.error(`❌ Message get error:`, error.message);
                return `❌ Error loading message: ${path}`;
            }
        },

        // --- Get Welcome Message ---
        getWelcome: (user, options = {}) => {
            const type = options.type || 'default';
            const message = templates.welcome[type] || templates.welcome.default;
            return formatMessage(message, { user, ...options });
        },

        // --- Get Goodbye Message ---
        getGoodbye: (user, options = {}) => {
            const type = options.type || 'default';
            const message = templates.goodbye[type] || templates.goodbye.default;
            return formatMessage(message, { user, ...options });
        },

        // --- Get Admin Message ---
        getAdmin: (type, options = {}) => {
            const message = templates.admin[type] || templates.admin.only;
            return formatMessage(message, options);
        },

        // --- Get Error Message ---
        getError: (type, options = {}) => {
            const message = templates.error[type] || templates.error.general;
            return formatMessage(message, options);
        },

        // --- Get Success Message ---
        getSuccess: (feature, action = 'enabled', options = {}) => {
            const message = templates.success[action] || templates.success.updated;
            return formatMessage(message, { feature, ...options });
        },

        // --- Get Loading Message ---
        getLoading: (type = 'processing', options = {}) => {
            const message = templates.loading[type] || templates.loading.processing;
            return formatMessage(message, options);
        },

        // --- Get Status Message ---
        getStatus: (type = 'online', options = {}) => {
            const message = templates.status[type] || templates.status.online;
            return formatMessage(message, options);
        },

        // --- Get Bot Info ---
        getBotInfo: (options = {}) => {
            const messages = [];
            if (options.name) messages.push(formatMessage(templates.bot.name, { name: options.name }));
            if (options.version) messages.push(formatMessage(templates.bot.version, { version: options.version }));
            if (options.uptime) messages.push(formatMessage(templates.bot.uptime, { uptime: options.uptime }));
            if (options.memory) messages.push(formatMessage(templates.bot.memory, { memory: options.memory }));
            if (options.ping) messages.push(formatMessage(templates.bot.ping, { ping: options.ping }));
            return messages.join('\n');
        },

        // --- Add Custom Message ---
        addCustom: (path, message) => {
            const keys = path.split('.');
            let current = templates.custom;
            
            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) {
                    current[keys[i]] = {};
                }
                current = current[keys[i]];
            }
            
            current[keys[keys.length - 1]] = message;
            return true;
        },

        // --- Get Custom Message ---
        getCustom: (path, variables = {}) => {
            try {
                const keys = path.split('.');
                let message = templates.custom;
                
                for (const key of keys) {
                    if (message && message[key] !== undefined) {
                        message = message[key];
                    } else {
                        return null;
                    }
                }
                
                if (typeof message === 'object') {
                    message = message.default || JSON.stringify(message);
                }
                
                return formatMessage(message, variables);
            } catch (error) {
                console.error(`❌ Custom message error:`, error.message);
                return null;
            }
        },

        // --- Get Random Message ---
        getRandom: (messages) => {
            if (!messages || !Array.isArray(messages) || messages.length === 0) {
                return 'No messages available';
            }
            return messages[Math.floor(Math.random() * messages.length)];
        },

        // --- Format Message ---
        format: (message, variables = {}) => {
            return formatMessage(message, variables);
        },

        // --- Truncate Message ---
        truncate: (message, maxLength = CONFIG.MAX_MESSAGE_LENGTH) => {
            return truncateMessage(message, maxLength);
        }
    },

    // --- Export Templates ---
    templates: templates,

    // --- Export Config ---
    CONFIG: CONFIG,

    // --- Export Utilities ---
    utils: {
        formatMessage,
        truncateMessage,
        getLanguage: () => 'en',
        setLanguage: (lang) => {
            if (CONFIG.SUPPORTED_LANGUAGES.includes(lang)) {
                // Language support can be expanded here
                return true;
            }
            return false;
        },
        getSupportedLanguages: () => CONFIG.SUPPORTED_LANGUAGES
    }
};

// --- If run directly, show available messages ---
if (require.main === module) {
    console.log('📋 Available Message Templates:');
    console.log(JSON.stringify(templates, null, 2));
}