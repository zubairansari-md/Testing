/**
 * Channel Info Module - Manages message forwarding and branding
 * Centralized configuration for all forwarded messages
 */

// --- CONFIGURATION ---
const CONFIG = {
    NEWSLETTER_JID: '120363348739987203@newsletter',
    NEWSLETTER_NAME: 'TEAM-ZUBAIR-MD',
    FORWARDING_SCORE: 999,
    SERVER_MESSAGE_ID: -1,
    IS_FORWARDED: true,
    DEFAULT_QUOTED: false
};

// --- HELPER: Generate Channel Info ---
const generateChannelInfo = (options = {}) => {
    const newsletterJid = options.newsletterJid || CONFIG.NEWSLETTER_JID;
    const newsletterName = options.newsletterName || CONFIG.NEWSLETTER_NAME;
    const forwardingScore = options.forwardingScore || CONFIG.FORWARDING_SCORE;
    const serverMessageId = options.serverMessageId || CONFIG.SERVER_MESSAGE_ID;
    const isForwarded = options.isForwarded !== undefined ? options.isForwarded : CONFIG.IS_FORWARDED;

    return {
        contextInfo: {
            forwardingScore: forwardingScore,
            isForwarded: isForwarded,
            forwardedNewsletterMessageInfo: {
                newsletterJid: newsletterJid,
                newsletterName: newsletterName,
                serverMessageId: serverMessageId
            }
        }
    };
};

// --- HELPER: Merge Channel Info ---
const mergeChannelInfo = (existing, options = {}) => {
    const base = {
        contextInfo: {
            forwardingScore: CONFIG.FORWARDING_SCORE,
            isForwarded: CONFIG.IS_FORWARDED,
            forwardedNewsletterMessageInfo: {
                newsletterJid: CONFIG.NEWSLETTER_JID,
                newsletterName: CONFIG.NEWSLETTER_NAME,
                serverMessageId: CONFIG.SERVER_MESSAGE_ID
            }
        }
    };

    if (existing && existing.contextInfo) {
        // Merge existing with base
        return {
            contextInfo: {
                ...base.contextInfo,
                ...existing.contextInfo,
                forwardedNewsletterMessageInfo: {
                    ...base.contextInfo.forwardedNewsletterMessageInfo,
                    ...(existing.contextInfo.forwardedNewsletterMessageInfo || {})
                }
            }
        };
    }

    return base;
};

// --- HELPER: Update Newsletter Info ---
const updateNewsletterInfo = (jid, name) => {
    CONFIG.NEWSLETTER_JID = jid || CONFIG.NEWSLETTER_JID;
    CONFIG.NEWSLETTER_NAME = name || CONFIG.NEWSLETTER_NAME;
    return getChannelInfo();
};

// --- MAIN EXPORT ---
module.exports = {
    // --- Default Channel Info ---
    channelInfo: {
        contextInfo: {
            forwardingScore: CONFIG.FORWARDING_SCORE,
            isForwarded: CONFIG.IS_FORWARDED,
            forwardedNewsletterMessageInfo: {
                newsletterJid: CONFIG.NEWSLETTER_JID,
                newsletterName: CONFIG.NEWSLETTER_NAME,
                serverMessageId: CONFIG.SERVER_MESSAGE_ID
            }
        }
    },

    // --- Get Channel Info with Options ---
    getChannelInfo: (options = {}) => {
        return generateChannelInfo(options);
    },

    // --- Get Forwarded Message Options ---
    getForwardOptions: (options = {}) => {
        return {
            contextInfo: {
                forwardingScore: options.forwardingScore || CONFIG.FORWARDING_SCORE,
                isForwarded: options.isForwarded !== undefined ? options.isForwarded : CONFIG.IS_FORWARDED,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: options.newsletterJid || CONFIG.NEWSLETTER_JID,
                    newsletterName: options.newsletterName || CONFIG.NEWSLETTER_NAME,
                    serverMessageId: options.serverMessageId || CONFIG.SERVER_MESSAGE_ID
                }
            }
        };
    },

    // --- Merge with Existing Info ---
    mergeChannelInfo: (existing, options = {}) => {
        return mergeChannelInfo(existing, options);
    },

    // --- Update Newsletter Settings ---
    updateNewsletterInfo: (jid, name) => {
        return updateNewsletterInfo(jid, name);
    },

    // --- Get Current Settings ---
    getSettings: () => {
        return {
            newsletterJid: CONFIG.NEWSLETTER_JID,
            newsletterName: CONFIG.NEWSLETTER_NAME,
            forwardingScore: CONFIG.FORWARDING_SCORE,
            serverMessageId: CONFIG.SERVER_MESSAGE_ID,
            isForwarded: CONFIG.IS_FORWARDED
        };
    },

    // --- Reset to Default ---
    resetDefaults: () => {
        CONFIG.NEWSLETTER_JID = '120363348739987203@newsletter';
        CONFIG.NEWSLETTER_NAME = 'TEAM-ZUBAIR-MD';
        CONFIG.FORWARDING_SCORE = 999;
        CONFIG.SERVER_MESSAGE_ID = -1;
        CONFIG.IS_FORWARDED = true;
        return getChannelInfo();
    },

    // --- Create Custom Newsletter Info ---
    createNewsletterInfo: (jid, name, options = {}) => {
        return {
            contextInfo: {
                forwardingScore: options.forwardingScore || CONFIG.FORWARDING_SCORE,
                isForwarded: options.isForwarded !== undefined ? options.isForwarded : CONFIG.IS_FORWARDED,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: jid || CONFIG.NEWSLETTER_JID,
                    newsletterName: name || CONFIG.NEWSLETTER_NAME,
                    serverMessageId: options.serverMessageId || CONFIG.SERVER_MESSAGE_ID
                }
            }
        };
    },

    // --- Add to Message Options ---
    addToMessage: (messageOptions, options = {}) => {
        if (!messageOptions) messageOptions = {};
        const channelInfo = generateChannelInfo(options);
        return {
            ...messageOptions,
            ...channelInfo
        };
    },

    // --- Check if Message is Forwarded ---
    isForwarded: (message) => {
        return message?.contextInfo?.isForwarded === true;
    },

    // --- Get Newsletter Info from Message ---
    getNewsletterInfo: (message) => {
        if (message?.contextInfo?.forwardedNewsletterMessageInfo) {
            return {
                jid: message.contextInfo.forwardedNewsletterMessageInfo.newsletterJid,
                name: message.contextInfo.forwardedNewsletterMessageInfo.newsletterName,
                messageId: message.contextInfo.forwardedNewsletterMessageInfo.serverMessageId
            };
        }
        return null;
    },

    // --- CONFIG Export ---
    CONFIG: CONFIG,

    // --- Constants ---
    DEFAULT_NEWSLETTER_JID: '120363348739987203@newsletter',
    DEFAULT_NEWSLETTER_NAME: 'TEAM-ZUBAIR-MD',
    DEFAULT_FORWARDING_SCORE: 999,
    DEFAULT_SERVER_MESSAGE_ID: -1,
    DEFAULT_IS_FORWARDED: true
};