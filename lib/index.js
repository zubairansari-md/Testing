const fs = require('fs-extra');
const path = require('path');

// --- CONFIGURATION ---
const CONFIG = {
    DATA_DIR: path.join(__dirname, '../data'),
    WELCOME_FILE: path.join(__dirname, '../data/welcome_settings.json'),
    GOODBYE_FILE: path.join(__dirname, '../data/goodbye_settings.json'),
    ANTILINK_FILE: path.join(__dirname, '../data/antilink_settings.json'),
    WARNING_FILE: path.join(__dirname, '../data/warning_settings.json'),
    SUDO_FILE: path.join(__dirname, '../data/sudo_settings.json'),
    LOG_FILE: path.join(__dirname, '../data/settings_log.json')
};

// --- ENSURE DATA DIRECTORY ---
const ensureDataDir = () => {
    fs.ensureDirSync(CONFIG.DATA_DIR);
};

// --- HELPER: Read JSON File ---
const readJSON = async (filePath, defaultValue = {}) => {
    try {
        if (fs.existsSync(filePath)) {
            return await fs.readJson(filePath);
        }
        return defaultValue;
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error.message);
        return defaultValue;
    }
};

// --- HELPER: Write JSON File ---
const writeJSON = async (filePath, data) => {
    try {
        await fs.writeJson(filePath, data, { spaces: 2 });
        return true;
    } catch (error) {
        console.error(`Error writing ${filePath}:`, error.message);
        return false;
    }
};

// --- HELPER: Log Settings Change ---
const logSettingsChange = async (type, chatId, action, details = {}) => {
    try {
        ensureDataDir();
        let logs = await readJSON(CONFIG.LOG_FILE, []);
        logs.push({
            type,
            chatId,
            action,
            details,
            timestamp: new Date().toISOString()
        });
        // Keep only last 100 logs
        if (logs.length > 100) {
            logs = logs.slice(-100);
        }
        await writeJSON(CONFIG.LOG_FILE, logs);
    } catch (error) {
        console.error('Log error:', error.message);
    }
};

// ================================
// WELCOME SETTINGS
// ================================

/**
 * Add or update welcome settings for a group
 * @param {string} chatId - Group ID
 * @param {boolean} status - Enable/disable
 * @param {string} message - Welcome message
 * @param {Object} options - Additional options
 */
async function addWelcome(chatId, status, message, options = {}) {
    ensureDataDir();
    let data = await readJSON(CONFIG.WELCOME_FILE);
    
    data[chatId] = {
        status: status || false,
        message: message || 'Welcome to the group! 🎉',
        media: options.media || null,
        mediaType: options.mediaType || null,
        createdAt: data[chatId]?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        mentions: options.mentions || false,
        deleteAfter: options.deleteAfter || false
    };
    
    await writeJSON(CONFIG.WELCOME_FILE, data);
    await logSettingsChange('welcome', chatId, status ? 'enable' : 'disable', { message });
    return true;
}

/**
 * Delete welcome settings for a group
 * @param {string} chatId - Group ID
 */
async function delWelcome(chatId) {
    if (!fs.existsSync(CONFIG.WELCOME_FILE)) return;
    let data = await readJSON(CONFIG.WELCOME_FILE);
    if (data[chatId]) {
        delete data[chatId];
        await writeJSON(CONFIG.WELCOME_FILE, data);
        await logSettingsChange('welcome', chatId, 'delete', {});
        return true;
    }
    return false;
}

/**
 * Check if welcome is enabled for a group
 * @param {string} chatId - Group ID
 * @returns {boolean}
 */
async function isWelcomeOn(chatId) {
    let data = await readJSON(CONFIG.WELCOME_FILE);
    return data[chatId] ? data[chatId].status : false;
}

/**
 * Get welcome message for a group
 * @param {string} chatId - Group ID
 * @returns {string|null}
 */
async function getWelcomeMessage(chatId) {
    let data = await readJSON(CONFIG.WELCOME_FILE);
    return data[chatId] ? data[chatId].message : null;
}

/**
 * Get full welcome settings for a group
 * @param {string} chatId - Group ID
 * @returns {Object|null}
 */
async function getWelcomeSettings(chatId) {
    let data = await readJSON(CONFIG.WELCOME_FILE);
    return data[chatId] || null;
}

/**
 * Get all welcome settings
 * @returns {Object}
 */
async function getAllWelcomeSettings() {
    return await readJSON(CONFIG.WELCOME_FILE);
}

// ================================
// GOODBYE SETTINGS
// ================================

/**
 * Add or update goodbye settings for a group
 * @param {string} chatId - Group ID
 * @param {boolean} status - Enable/disable
 * @param {string} message - Goodbye message
 * @param {Object} options - Additional options
 */
async function addGoodbye(chatId, status, message, options = {}) {
    ensureDataDir();
    let data = await readJSON(CONFIG.GOODBYE_FILE);
    
    data[chatId] = {
        status: status || false,
        message: message || 'Goodbye! We will miss you! 👋',
        media: options.media || null,
        mediaType: options.mediaType || null,
        createdAt: data[chatId]?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        mentions: options.mentions || false
    };
    
    await writeJSON(CONFIG.GOODBYE_FILE, data);
    await logSettingsChange('goodbye', chatId, status ? 'enable' : 'disable', { message });
    return true;
}

/**
 * Delete goodbye settings for a group
 * @param {string} chatId - Group ID
 */
async function delGoodBye(chatId) {
    if (!fs.existsSync(CONFIG.GOODBYE_FILE)) return;
    let data = await readJSON(CONFIG.GOODBYE_FILE);
    if (data[chatId]) {
        delete data[chatId];
        await writeJSON(CONFIG.GOODBYE_FILE, data);
        await logSettingsChange('goodbye', chatId, 'delete', {});
        return true;
    }
    return false;
}

/**
 * Check if goodbye is enabled for a group
 * @param {string} chatId - Group ID
 * @returns {boolean}
 */
async function isGoodByeOn(chatId) {
    let data = await readJSON(CONFIG.GOODBYE_FILE);
    return data[chatId] ? data[chatId].status : false;
}

/**
 * Get goodbye message for a group
 * @param {string} chatId - Group ID
 * @returns {string|null}
 */
async function getGoodbyeMessage(chatId) {
    let data = await readJSON(CONFIG.GOODBYE_FILE);
    return data[chatId] ? data[chatId].message : null;
}

/**
 * Get full goodbye settings for a group
 * @param {string} chatId - Group ID
 * @returns {Object|null}
 */
async function getGoodbyeSettings(chatId) {
    let data = await readJSON(CONFIG.GOODBYE_FILE);
    return data[chatId] || null;
}

/**
 * Get all goodbye settings
 * @returns {Object}
 */
async function getAllGoodbyeSettings() {
    return await readJSON(CONFIG.GOODBYE_FILE);
}

// ================================
// ANTILINK SETTINGS
// ================================

/**
 * Get antilink settings for a group
 * @param {string} chatId - Group ID
 * @returns {Object|null}
 */
async function getAntilink(chatId) {
    let data = await readJSON(CONFIG.ANTILINK_FILE);
    return data[chatId] || null;
}

/**
 * Set antilink settings for a group
 * @param {string} chatId - Group ID
 * @param {string} action - Action to take ('delete', 'kick', 'warn')
 * @param {Array} whitelist - Whitelisted domains
 * @param {boolean} status - Enable/disable
 */
async function setAntilink(chatId, action, whitelist = [], status = true) {
    ensureDataDir();
    let data = await readJSON(CONFIG.ANTILINK_FILE);
    
    data[chatId] = {
        status: status,
        action: action || 'delete',
        whitelist: whitelist || [],
        createdAt: data[chatId]?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stats: data[chatId]?.stats || { blocked: 0, kicked: 0, warned: 0 }
    };
    
    await writeJSON(CONFIG.ANTILINK_FILE, data);
    await logSettingsChange('antilink', chatId, status ? 'enable' : 'disable', { action });
    return true;
}

/**
 * Update antilink statistics
 * @param {string} chatId - Group ID
 * @param {string} action - Action performed
 */
async function updateAntilinkStats(chatId, action) {
    let data = await readJSON(CONFIG.ANTILINK_FILE);
    if (data[chatId]) {
        if (!data[chatId].stats) {
            data[chatId].stats = { blocked: 0, kicked: 0, warned: 0 };
        }
        if (action === 'blocked') data[chatId].stats.blocked++;
        else if (action === 'kicked') data[chatId].stats.kicked++;
        else if (action === 'warned') data[chatId].stats.warned++;
        data[chatId].stats.lastAction = new Date().toISOString();
        await writeJSON(CONFIG.ANTILINK_FILE, data);
        return true;
    }
    return false;
}

// ================================
// WARNING SYSTEM
// ================================

/**
 * Increment warning count for a user
 * @param {string} chatId - Group ID
 * @param {string} userId - User ID
 * @param {number} maxWarnings - Max warnings before action
 * @returns {Promise<number>}
 */
async function incrementWarningCount(chatId, userId, maxWarnings = 3) {
    ensureDataDir();
    let data = await readJSON(CONFIG.WARNING_FILE);
    
    if (!data[chatId]) data[chatId] = {};
    if (!data[chatId][userId]) {
        data[chatId][userId] = { count: 0, warnings: [] };
    }
    
    data[chatId][userId].count += 1;
    data[chatId][userId].warnings.push({
        timestamp: new Date().toISOString(),
        reason: 'Auto-moderation'
    });
    data[chatId][userId].updatedAt = new Date().toISOString();
    
    await writeJSON(CONFIG.WARNING_FILE, data);
    await logSettingsChange('warning', chatId, 'increment', { userId, count: data[chatId][userId].count });
    
    return data[chatId][userId].count;
}

/**
 * Reset warning count for a user
 * @param {string} chatId - Group ID
 * @param {string} userId - User ID
 */
async function resetWarningCount(chatId, userId) {
    let data = await readJSON(CONFIG.WARNING_FILE);
    if (data[chatId] && data[chatId][userId]) {
        data[chatId][userId] = { count: 0, warnings: [], resetAt: new Date().toISOString() };
        await writeJSON(CONFIG.WARNING_FILE, data);
        await logSettingsChange('warning', chatId, 'reset', { userId });
        return true;
    }
    return false;
}

/**
 * Get warning count for a user
 * @param {string} chatId - Group ID
 * @param {string} userId - User ID
 * @returns {Promise<number>}
 */
async function getWarningCount(chatId, userId) {
    let data = await readJSON(CONFIG.WARNING_FILE);
    return data[chatId]?.[userId]?.count || 0;
}

/**
 * Get warning history for a user
 * @param {string} chatId - Group ID
 * @param {string} userId - User ID
 * @returns {Promise<Array>}
 */
async function getWarningHistory(chatId, userId) {
    let data = await readJSON(CONFIG.WARNING_FILE);
    return data[chatId]?.[userId]?.warnings || [];
}

// ================================
// SUDO / ADMIN SETTINGS
// ================================

/**
 * Check if a user is sudo (super admin)
 * @param {string} sender - User ID
 * @param {Array} sudoList - List of sudo users
 * @returns {boolean}
 */
async function isSudo(sender, sudoList = []) {
    if (!sender) return false;
    
    // Check if sender is in sudo list
    if (sudoList && sudoList.length > 0) {
        return sudoList.some(sudo => sender.includes(sudo) || sudo.includes(sender));
    }
    
    // Check from file
    let data = await readJSON(CONFIG.SUDO_FILE);
    return data.sudoList?.some(sudo => sender.includes(sudo) || sudo.includes(sender)) || false;
}

/**
 * Add sudo user
 * @param {string} userId - User ID
 */
async function addSudo(userId) {
    ensureDataDir();
    let data = await readJSON(CONFIG.SUDO_FILE);
    if (!data.sudoList) data.sudoList = [];
    if (!data.sudoList.includes(userId)) {
        data.sudoList.push(userId);
        await writeJSON(CONFIG.SUDO_FILE, data);
        await logSettingsChange('sudo', userId, 'add', {});
        return true;
    }
    return false;
}

/**
 * Remove sudo user
 * @param {string} userId - User ID
 */
async function removeSudo(userId) {
    let data = await readJSON(CONFIG.SUDO_FILE);
    if (data.sudoList) {
        data.sudoList = data.sudoList.filter(id => id !== userId);
        await writeJSON(CONFIG.SUDO_FILE, data);
        await logSettingsChange('sudo', userId, 'remove', {});
        return true;
    }
    return false;
}

/**
 * Get sudo list
 * @returns {Promise<Array>}
 */
async function getSudoList() {
    let data = await readJSON(CONFIG.SUDO_FILE);
    return data.sudoList || [];
}

// ================================
// GENERAL SETTINGS
// ================================

/**
 * Get all settings for a group
 * @param {string} chatId - Group ID
 * @returns {Promise<Object>}
 */
async function getAllSettings(chatId) {
    const [welcome, goodbye, antilink, warnings] = await Promise.all([
        getWelcomeSettings(chatId),
        getGoodbyeSettings(chatId),
        getAntilink(chatId),
        readJSON(CONFIG.WARNING_FILE)
    ]);

    return {
        chatId,
        welcome: welcome || { status: false, message: null },
        goodbye: goodbye || { status: false, message: null },
        antilink: antilink || { status: false, action: 'delete', whitelist: [] },
        warnings: warnings[chatId] || {}
    };
}

/**
 * Reset all settings for a group
 * @param {string} chatId - Group ID
 */
async function resetAllSettings(chatId) {
    const results = {
        welcome: await delWelcome(chatId),
        goodbye: await delGoodBye(chatId),
        antilink: false
    };

    // Reset antilink
    let antilinkData = await readJSON(CONFIG.ANTILINK_FILE);
    if (antilinkData[chatId]) {
        delete antilinkData[chatId];
        await writeJSON(CONFIG.ANTILINK_FILE, antilinkData);
        results.antilink = true;
    }

    // Reset warnings
    let warningData = await readJSON(CONFIG.WARNING_FILE);
    if (warningData[chatId]) {
        delete warningData[chatId];
        await writeJSON(CONFIG.WARNING_FILE, warningData);
    }

    await logSettingsChange('reset', chatId, 'reset_all', {});
    return results;
}

// ================================
// EXPORT
// ================================

module.exports = {
    // Welcome
    addWelcome,
    delWelcome,
    isWelcomeOn,
    getWelcomeMessage,
    getWelcomeSettings,
    getAllWelcomeSettings,
    
    // Goodbye
    addGoodbye,
    delGoodBye,
    isGoodByeOn,
    getGoodbyeMessage,
    getGoodbyeSettings,
    getAllGoodbyeSettings,
    
    // Antilink
    getAntilink,
    setAntilink,
    updateAntilinkStats,
    
    // Warning System
    incrementWarningCount,
    resetWarningCount,
    getWarningCount,
    getWarningHistory,
    
    // Sudo
    isSudo,
    addSudo,
    removeSudo,
    getSudoList,
    
    // General
    getAllSettings,
    resetAllSettings,
    logSettingsChange,
    
    // Utilities
    ensureDataDir,
    readJSON,
    writeJSON,
    CONFIG
};