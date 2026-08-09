const settings = require('../settings');

// --- CONFIGURATION ---
const CONFIG = {
    CACHE_DURATION: 60000, // 1 minute cache
    MULTIPLE_OWNERS: true, // Support multiple owners
};

// --- CACHE ---
const cache = new Map();

// --- HELPER: Get Owner Numbers ---
const getOwnerNumbers = () => {
    const owners = [];
    
    // Check if ownerNumber is array or string
    if (Array.isArray(settings.ownerNumber)) {
        owners.push(...settings.ownerNumber);
    } else if (settings.ownerNumber) {
        // If it's a string, split by comma or space
        const ownerStr = String(settings.ownerNumber);
        if (ownerStr.includes(',')) {
            owners.push(...ownerStr.split(',').map(o => o.trim()));
        } else if (ownerStr.includes(' ')) {
            owners.push(...ownerStr.split(' ').map(o => o.trim()));
        } else {
            owners.push(ownerStr);
        }
    }
    
    // Also check ownerNumbers (plural)
    if (settings.ownerNumbers && Array.isArray(settings.ownerNumbers)) {
        owners.push(...settings.ownerNumbers);
    }
    
    // Clean and format
    return owners
        .filter(o => o && o.length > 0)
        .map(o => o.replace(/[^0-9]/g, '')); // Keep only digits
};

// --- HELPER: Get Owner JIDs ---
const getOwnerJIDs = () => {
    const numbers = getOwnerNumbers();
    return numbers.map(num => `${num}@s.whatsapp.net`);
};

// --- HELPER: Normalize JID ---
const normalizeJID = (jid) => {
    if (!jid) return '';
    // Remove any extra characters and keep only the JID
    return jid.split('@')[0];
};

// --- HELPER: Clear Cache ---
const clearOwnerCache = () => {
    cache.clear();
};

// --- MAIN: isOwner ---
/**
 * Check if a user is the bot owner
 * @param {string} senderId - User ID (JID)
 * @param {Object} options - Options
 * @returns {boolean}
 */
function isOwner(senderId, options = {}) {
    try {
        // --- Validate Input ---
        if (!senderId) {
            console.warn('⚠️ isOwner: senderId is empty');
            return false;
        }

        // --- Check Cache ---
        const useCache = options.useCache !== false;
        let cachedResult = null;
        if (useCache) {
            cachedResult = cache.get(senderId);
            if (cachedResult !== undefined) {
                return cachedResult;
            }
        }

        // --- Get Owner Numbers ---
        const ownerNumbers = getOwnerNumbers();
        const ownerJIDs = getOwnerJIDs();

        // --- Check if sender is owner ---
        const senderNumber = normalizeJID(senderId);
        const result = ownerNumbers.some(owner => 
            owner === senderId || 
            owner === senderNumber ||
            senderId.includes(owner) ||
            owner.includes(senderId) ||
            ownerJIDs.includes(senderId) ||
            `${owner}@s.whatsapp.net` === senderId
        );

        // --- Cache Result ---
        if (useCache) {
            cache.set(senderId, result);
            // Auto clear cache after duration
            setTimeout(() => {
                cache.delete(senderId);
            }, CONFIG.CACHE_DURATION);
        }

        // --- Verbose Logging ---
        if (options.verbose) {
            console.log(`🔍 Owner check for ${senderId}: ${result ? '✅ Owner' : '❌ Not Owner'}`);
            if (options.verboseDetailed) {
                console.log(`   Owner numbers: ${ownerNumbers.join(', ')}`);
                console.log(`   Owner JIDs: ${ownerJIDs.join(', ')}`);
            }
        }

        return result;

    } catch (error) {
        console.error('❌ isOwner error:', error.message);
        return false;
    }
}

// --- EXTRA FUNCTIONS ---

/**
 * Get all owner JIDs
 * @returns {Array} Array of owner JIDs
 */
function getOwners() {
    return getOwnerJIDs();
}

/**
 * Get all owner numbers
 * @returns {Array} Array of owner numbers
 */
function getOwnerNumbersList() {
    return getOwnerNumbers();
}

/**
 * Check if sender is owner or admin (flexible)
 * @param {string} senderId - User ID
 * @param {Array} adminList - List of admin IDs
 * @param {Object} options - Options
 * @returns {boolean}
 */
function isOwnerOrAdmin(senderId, adminList = [], options = {}) {
    if (!senderId) return false;
    
    // Check if owner
    if (isOwner(senderId, options)) return true;
    
    // Check if admin
    if (adminList && adminList.length > 0) {
        const senderNumber = normalizeJID(senderId);
        return adminList.some(admin => 
            admin === senderId || 
            admin === senderNumber ||
            senderId.includes(admin) ||
            admin.includes(senderId)
        );
    }
    
    return false;
}

/**
 * Check if sender is bot (self)
 * @param {string} senderId - User ID
 * @param {string} botId - Bot ID
 * @returns {boolean}
 */
function isBot(senderId, botId) {
    if (!senderId || !botId) return false;
    const senderNumber = normalizeJID(senderId);
    const botNumber = normalizeJID(botId);
    return senderId === botId || 
           senderNumber === botNumber ||
           senderId.includes(botId) ||
           botId.includes(senderId);
}

/**
 * Check if sender is owner or bot (for self-checks)
 * @param {string} senderId - User ID
 * @param {string} botId - Bot ID
 * @param {Object} options - Options
 * @returns {boolean}
 */
function isOwnerOrBot(senderId, botId, options = {}) {
    return isOwner(senderId, options) || isBot(senderId, botId);
}

/**
 * Get owner name from settings
 * @returns {string}
 */
function getOwnerName() {
    return settings.ownerName || 'Owner';
}

/**
 * Get owner display info
 * @returns {Object}
 */
function getOwnerInfo() {
    const numbers = getOwnerNumbers();
    const names = settings.ownerNames || [settings.ownerName || 'Owner'];
    
    return {
        numbers: numbers,
        names: Array.isArray(names) ? names : [names],
        jids: getOwnerJIDs(),
        count: numbers.length,
        display: numbers.map((num, index) => {
            const name = Array.isArray(names) ? names[index] || names[0] : names;
            return `${name}: ${num}`;
        }).join(', ')
    };
}

/**
 * Check if multiple users are owners
 * @param {Array} senderIds - Array of user IDs
 * @param {Object} options - Options
 * @returns {Object} Results for each user
 */
function areOwners(senderIds, options = {}) {
    const results = {};
    for (const id of senderIds) {
        results[id] = isOwner(id, options);
    }
    return results;
}

/**
 * Add owner number to settings (if supported)
 * @param {string} number - Owner number
 * @returns {boolean}
 */
function addOwner(number) {
    try {
        if (!number) return false;
        const cleanNumber = number.replace(/[^0-9]/g, '');
        if (!cleanNumber) return false;
        
        // Check if already exists
        const current = getOwnerNumbers();
        if (current.includes(cleanNumber)) return false;
        
        // Update settings (if writable)
        if (settings.ownerNumber) {
            if (Array.isArray(settings.ownerNumber)) {
                settings.ownerNumber.push(cleanNumber);
            } else {
                settings.ownerNumber = [settings.ownerNumber, cleanNumber];
            }
        } else {
            settings.ownerNumber = [cleanNumber];
        }
        
        clearOwnerCache();
        return true;
    } catch (error) {
        console.error('❌ addOwner error:', error.message);
        return false;
    }
}

/**
 * Remove owner number from settings (if supported)
 * @param {string} number - Owner number
 * @returns {boolean}
 */
function removeOwner(number) {
    try {
        if (!number) return false;
        const cleanNumber = number.replace(/[^0-9]/g, '');
        if (!cleanNumber) return false;
        
        const current = getOwnerNumbers();
        if (!current.includes(cleanNumber)) return false;
        
        // Update settings (if writable)
        if (Array.isArray(settings.ownerNumber)) {
            settings.ownerNumber = settings.ownerNumber.filter(o => o !== cleanNumber);
        } else if (settings.ownerNumber) {
            if (settings.ownerNumber === cleanNumber) {
                settings.ownerNumber = '';
            }
        }
        
        clearOwnerCache();
        return true;
    } catch (error) {
        console.error('❌ removeOwner error:', error.message);
        return false;
    }
}

// --- EXPORT ---
module.exports = isOwner;

// --- Export extra functions ---
module.exports.getOwners = getOwners;
module.exports.getOwnerNumbers = getOwnerNumbersList;
module.exports.isOwnerOrAdmin = isOwnerOrAdmin;
module.exports.isBot = isBot;
module.exports.isOwnerOrBot = isOwnerOrBot;
module.exports.getOwnerName = getOwnerName;
module.exports.getOwnerInfo = getOwnerInfo;
module.exports.areOwners = areOwners;
module.exports.addOwner = addOwner;
module.exports.removeOwner = removeOwner;
module.exports.clearOwnerCache = clearOwnerCache;
module.exports.normalizeJID = normalizeJID;
module.exports.CONFIG = CONFIG;