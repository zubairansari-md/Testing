/**
 * Admin Checker Utility
 * Checks if a user is an admin in a group
 */

// --- CONFIGURATION ---
const CONFIG = {
    CACHE_DURATION: 60000, // 1 minute cache
    ADMIN_TYPES: ['admin', 'superadmin']
};

// --- CACHE ---
const cache = new Map();

// --- HELPER: Clear Cache ---
const clearCache = (chatId) => {
    if (chatId) {
        cache.delete(chatId);
    } else {
        cache.clear();
    }
};

// --- HELPER: Get Cached Data ---
const getCachedData = (chatId) => {
    if (cache.has(chatId)) {
        const cached = cache.get(chatId);
        if (Date.now() - cached.timestamp < CONFIG.CACHE_DURATION) {
            return cached.data;
        }
        cache.delete(chatId);
    }
    return null;
};

// --- HELPER: Set Cache Data ---
const setCachedData = (chatId, data) => {
    cache.set(chatId, {
        data: data,
        timestamp: Date.now()
    });
};

// --- MAIN: isAdmin ---
/**
 * Check if a user is an admin in a group
 * @param {Object} sock - WhatsApp socket
 * @param {string} chatId - Group ID (ends with @g.us)
 * @param {string} senderId - User ID (ends with @s.whatsapp.net)
 * @param {Object} options - Optional settings
 * @returns {Promise<boolean>}
 */
async function isAdmin(sock, chatId, senderId, options = {}) {
    try {
        // --- Validate Input ---
        if (!chatId || !senderId) {
            console.warn('⚠️ Invalid input: chatId or senderId missing');
            return false;
        }

        // --- If not a group, return true ---
        if (!chatId.endsWith('@g.us')) {
            return true;
        }

        // --- Check Cache ---
        const useCache = options.useCache !== false;
        let cachedData = null;
        if (useCache) {
            cachedData = getCachedData(chatId);
            if (cachedData) {
                const result = cachedData.admins?.includes(senderId) || 
                              cachedData.superAdmins?.includes(senderId) ||
                              (options.includeMembers && cachedData.members?.includes(senderId));
                if (result !== undefined) {
                    return result;
                }
            }
        }

        // --- Fetch Group Metadata ---
        let groupMetadata;
        try {
            groupMetadata = await sock.groupMetadata(chatId);
        } catch (error) {
            console.error(`❌ Failed to fetch group metadata for ${chatId}:`, error.message);
            return false;
        }

        const participants = groupMetadata.participants || [];
        
        // --- Parse Participants ---
        const adminIds = [];
        const superAdminIds = [];
        const memberIds = [];
        const allIds = [];

        for (const participant of participants) {
            allIds.push(participant.id);
            if (participant.admin === 'superadmin') {
                superAdminIds.push(participant.id);
            } else if (participant.admin === 'admin') {
                adminIds.push(participant.id);
            } else {
                memberIds.push(participant.id);
            }
        }

        // --- Cache Data ---
        if (useCache) {
            setCachedData(chatId, {
                admins: adminIds,
                superAdmins: superAdminIds,
                members: memberIds,
                all: allIds,
                timestamp: Date.now()
            });
        }

        // --- Check if user is admin ---
        const isSuperAdmin = superAdminIds.includes(senderId);
        const isRegularAdmin = adminIds.includes(senderId);
        const isMember = memberIds.includes(senderId);

        // --- Check with options ---
        if (options.includeMembers && isMember) {
            return true;
        }

        if (options.includeSuperAdmin && isSuperAdmin) {
            return true;
        }

        if (options.includeRegularAdmin && isRegularAdmin) {
            return true;
        }

        if (options.includeAllAdmins) {
            return isSuperAdmin || isRegularAdmin;
        }

        // --- Default: Check if superadmin or admin ---
        const isAdminResult = isSuperAdmin || isRegularAdmin;

        // --- Log result (optional) ---
        if (options.verbose) {
            console.log(`🔍 Admin check for ${senderId}: ${isAdminResult ? '✅ Admin' : '❌ Not Admin'}`);
            console.log(`   SuperAdmin: ${isSuperAdmin}, Admin: ${isRegularAdmin}`);
        }

        return isAdminResult;

    } catch (error) {
        console.error('❌ isAdmin error:', error.message);
        return false;
    }
}

// --- EXTRA FUNCTIONS ---

/**
 * Get all admins in a group
 * @param {Object} sock - WhatsApp socket
 * @param {string} chatId - Group ID
 * @param {Object} options - Options
 * @returns {Promise<Array>}
 */
async function getAdmins(sock, chatId, options = {}) {
    try {
        if (!chatId.endsWith('@g.us')) {
            return [];
        }

        const useCache = options.useCache !== false;
        let cachedData = null;
        if (useCache) {
            cachedData = getCachedData(chatId);
            if (cachedData) {
                const admins = [];
                if (options.includeSuperAdmin !== false) {
                    admins.push(...cachedData.superAdmins);
                }
                if (options.includeRegularAdmin !== false) {
                    admins.push(...cachedData.admins);
                }
                return admins;
            }
        }

        const groupMetadata = await sock.groupMetadata(chatId);
        const participants = groupMetadata.participants || [];
        
        const admins = [];
        for (const participant of participants) {
            if (participant.admin === 'superadmin' || participant.admin === 'admin') {
                admins.push(participant.id);
            }
        }

        if (useCache) {
            const adminData = {
                admins: participants.filter(p => p.admin === 'admin').map(p => p.id),
                superAdmins: participants.filter(p => p.admin === 'superadmin').map(p => p.id),
                members: participants.filter(p => !p.admin).map(p => p.id),
                all: participants.map(p => p.id)
            };
            setCachedData(chatId, adminData);
        }

        return admins;

    } catch (error) {
        console.error('❌ getAdmins error:', error.message);
        return [];
    }
}

/**
 * Get super admins in a group
 * @param {Object} sock - WhatsApp socket
 * @param {string} chatId - Group ID
 * @returns {Promise<Array>}
 */
async function getSuperAdmins(sock, chatId) {
    try {
        if (!chatId.endsWith('@g.us')) {
            return [];
        }

        const groupMetadata = await sock.groupMetadata(chatId);
        const participants = groupMetadata.participants || [];
        
        return participants
            .filter(p => p.admin === 'superadmin')
            .map(p => p.id);

    } catch (error) {
        console.error('❌ getSuperAdmins error:', error.message);
        return [];
    }
}

/**
 * Get regular admins in a group
 * @param {Object} sock - WhatsApp socket
 * @param {string} chatId - Group ID
 * @returns {Promise<Array>}
 */
async function getRegularAdmins(sock, chatId) {
    try {
        if (!chatId.endsWith('@g.us')) {
            return [];
        }

        const groupMetadata = await sock.groupMetadata(chatId);
        const participants = groupMetadata.participants || [];
        
        return participants
            .filter(p => p.admin === 'admin')
            .map(p => p.id);

    } catch (error) {
        console.error('❌ getRegularAdmins error:', error.message);
        return [];
    }
}

/**
 * Check if user is bot owner
 * @param {string} senderId - User ID
 * @param {string} ownerId - Owner ID
 * @returns {boolean}
 */
function isOwner(senderId, ownerId) {
    if (!senderId || !ownerId) return false;
    return senderId === ownerId || 
           senderId.split('@')[0] === ownerId.split('@')[0];
}

/**
 * Check if user is sudo (super admin)
 * @param {string} senderId - User ID
 * @param {Array} sudoList - List of sudo users
 * @returns {boolean}
 */
function isSudo(senderId, sudoList = []) {
    if (!senderId) return false;
    return sudoList.some(sudo => 
        senderId === sudo || 
        senderId.split('@')[0] === sudo.split('@')[0] ||
        senderId.includes(sudo) || 
        sudo.includes(senderId)
    );
}

/**
 * Check if user is bot itself
 * @param {string} senderId - User ID
 * @param {string} botId - Bot ID
 * @returns {boolean}
 */
function isBot(senderId, botId) {
    if (!senderId || !botId) return false;
    return senderId === botId || 
           senderId.split('@')[0] === botId.split('@')[0];
}

/**
 * Clear admin cache
 * @param {string} chatId - Optional group ID
 */
function clearAdminCache(chatId = null) {
    clearCache(chatId);
    console.log(`🧹 Admin cache ${chatId ? `for ${chatId}` : 'cleared'}`);
}

// --- EXPORT ---
module.exports = {
    // Main function
    isAdmin,
    
    // Get functions
    getAdmins,
    getSuperAdmins,
    getRegularAdmins,
    
    // Check functions
    isOwner,
    isSudo,
    isBot,
    
    // Cache management
    clearAdminCache,
    clearCache,
    
    // Constants
    CONFIG,
    ADMIN_TYPES: CONFIG.ADMIN_TYPES
};