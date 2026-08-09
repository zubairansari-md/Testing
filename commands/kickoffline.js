const { jidNormalizedUser } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
const CONFIG = {
    OFFLINE_DAYS: 15,
    CHECK_INTERVAL: 3600000, // 1 hour
    MIN_MEMBERS: 3,
    EXEMPT_ADMINS: true,
    EXEMPT_BOT: true,
    LOG_FILE: path.join(process.cwd(), 'data', 'kickoffline_logs.json')
};

// --- HELPERS ---
const toBold = (text) => {
    const boldChars = {
        'a': '𝗮', 'b': '𝗯', 'c': '𝗰', 'd': '𝗱', 'e': '𝗲', 'f': '𝗳', 'g': '𝗴', 'h': '𝗵', 'i': '𝗶', 'j': '𝗷', 'k': '𝗸', 'l': '𝗹', 'm': '𝗺', 'n': '𝗻', 'o': '𝗼', 'p': '𝗽', 'q': '𝗾', 'r': '𝗿', 's': '𝘀', 't': '𝘁', 'u': '𝘂', 'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇',
        'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚', 'H': '𝗛', 'I': '𝗜', 'J': '𝗝', 'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡', 'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝘀', 't': '𝘁', 'u': '𝘂', 'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇',
        '0': '𝟬', '1': '𝟭', '2': '𝟮', '3': '𝟯', '4': '𝟰', '5': '𝟱', '6': '𝟲', '7': '𝟳', '8': '𝟴', '9': '𝟵'
    };
    return text.split('').map(c => boldChars[c] || c).join('');
};

const formatDate = (date) => {
    return date.toLocaleString('en-PK', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const getOfflineStatus = (lastSeen) => {
    if (!lastSeen) return 'Unknown';
    const now = Date.now();
    const diff = now - lastSeen;
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    
    if (days === 0 && hours === 0) return 'Online';
    if (days === 0) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    if (days < 15) return `${days}d ago`;
    return `⚠️ ${days}d offline`;
};

// --- ENSURE LOG DIRECTORY ---
if (!fs.existsSync(path.dirname(CONFIG.LOG_FILE))) {
    fs.mkdirSync(path.dirname(CONFIG.LOG_FILE), { recursive: true });
}

// --- LOG FUNCTION ---
function logKick(from, user, reason) {
    try {
        let logs = {};
        if (fs.existsSync(CONFIG.LOG_FILE)) {
            logs = JSON.parse(fs.readFileSync(CONFIG.LOG_FILE));
        }
        if (!logs[from]) logs[from] = [];
        logs[from].push({
            user: user,
            reason: reason,
            time: new Date().toISOString()
        });
        // Keep only last 100 logs per group
        if (logs[from].length > 100) {
            logs[from] = logs[from].slice(-100);
        }
        fs.writeFileSync(CONFIG.LOG_FILE, JSON.stringify(logs, null, 2));
    } catch (error) {
        console.error('Log error:', error);
    }
}

// --- MAIN COMMAND ---
async function kickOfflineCommand(sock, from, msg, isAdmin, botData, saveBotData, args) {
    if (!from.endsWith('@g.us')) {
        return await sock.sendMessage(from, { 
            text: "❌ This command only works in groups." 
        }, { quoted: msg });
    }
    
    if (!isAdmin) {
        return await sock.sendMessage(from, { 
            text: "❌ Only admins can use this command." 
        }, { quoted: msg });
    }

    const action = args[0]?.toLowerCase();
    const subAction = args[1]?.toLowerCase();

    // --- Initialize Data ---
    if (!botData.kickOffline) botData.kickOffline = {};
    if (!botData.userActivity) botData.userActivity = {};
    if (!botData.kickOffline[from]) {
        botData.kickOffline[from] = {
            enabled: false,
            days: CONFIG.OFFLINE_DAYS,
            autoCheck: false,
            lastRun: null,
            stats: {
                totalKicked: 0,
                totalScanned: 0,
                lastKicked: null
            }
        };
    }

    // --- HELP MENU ---
    if (!action || action === 'help') {
        const status = botData.kickOffline[from]?.enabled ? '✅ Active' : '❌ Inactive';
        const days = botData.kickOffline[from]?.days || CONFIG.OFFLINE_DAYS;
        const stats = botData.kickOffline[from]?.stats || { totalKicked: 0, totalScanned: 0 };
        
        return await sock.sendMessage(from, {
            text: `╭━━━〔 ${toBold("👢 KICK OFFLINE COMMANDS")} 〕━━━┈⊷\n` +
                  `┃\n` +
                  `┃ 📌 ${toBold("Usage:")}\n` +
                  `┃ .kickoffline on              - Enable & run check\n` +
                  `┃ .kickoffline off             - Disable\n` +
                  `┃ .kickoffline status          - Check status\n` +
                  `┃ .kickoffline days [number]   - Set offline days\n` +
                  `┃ .kickoffline now             - Run check now\n` +
                  `┃ .kickoffline autocheck [on/off] - Auto check\n` +
                  `┃ .kickoffline stats           - Show statistics\n` +
                  `┃ .kickoffline logs            - View logs\n` +
                  `┃ .kickoffline reset           - Reset stats\n` +
                  `┃\n` +
                  `┃ 📊 ${toBold("Status:")} ${status}\n` +
                  `┃ ⏱️ ${toBold("Days:")} ${days} days\n` +
                  `┃ 👢 ${toBold("Kicked:")} ${stats.totalKicked || 0}\n` +
                  `┃ 🔍 ${toBold("Scanned:")} ${stats.totalScanned || 0}\n` +
                  `┃\n` +
                  `┃ 💡 ${toBold("Note:")} Removes inactive members!\n` +
                  `╰━━━━━━━━━━━━━━━━━━┈⊷`
        }, { quoted: msg });
    }

    // --- ENABLE ---
    if (action === 'on') {
        botData.kickOffline[from].enabled = true;
        botData.kickOffline[from].stats = botData.kickOffline[from].stats || { totalKicked: 0, totalScanned: 0 };
        saveBotData();
        
        await sock.sendMessage(from, { 
            text: `✅ *Kick-Offline Enabled!*\n\n` +
                  `⏱️ Offline Days: ${botData.kickOffline[from].days || CONFIG.OFFLINE_DAYS} days\n` +
                  `🔄 Auto-Check: ${botData.kickOffline[from].autoCheck ? 'On' : 'Off'}\n` +
                  `🔍 Running initial check...` 
        }, { quoted: msg });

        // Run initial check
        await performKickOffline(sock, from, botData, saveBotData);
        return;
    }

    // --- DISABLE ---
    if (action === 'off') {
        botData.kickOffline[from].enabled = false;
        saveBotData();
        
        await sock.sendMessage(from, { 
            text: `❌ *Kick-Offline Disabled!*\n\n` +
                  `📊 Total Kicked: ${botData.kickOffline[from]?.stats?.totalKicked || 0}\n` +
                  `💤 No longer checking for inactive members.` 
        }, { quoted: msg });
        return;
    }

    // --- STATUS ---
    if (action === 'status') {
        const config = botData.kickOffline[from];
        const status = config?.enabled ? '✅ Active' : '❌ Inactive';
        const days = config?.days || CONFIG.OFFLINE_DAYS;
        const stats = config?.stats || { totalKicked: 0, totalScanned: 0 };
        
        return await sock.sendMessage(from, {
            text: `📊 *Kick-Offline Status*\n\n` +
                  `🔹 Status: ${status}\n` +
                  `🔹 Days: ${days}\n` +
                  `🔹 Auto-Check: ${config?.autoCheck ? 'On' : 'Off'}\n` +
                  `🔹 Last Run: ${config?.lastRun ? formatDate(new Date(config.lastRun)) : 'Never'}\n` +
                  `🔹 Total Kicked: ${stats.totalKicked || 0}\n` +
                  `🔹 Total Scanned: ${stats.totalScanned || 0}\n` +
                  `🔹 Last Kicked: ${stats.lastKicked ? formatDate(new Date(stats.lastKicked)) : 'Never'}`
        }, { quoted: msg });
    }

    // --- SET DAYS ---
    if (action === 'days') {
        const days = parseInt(args[1]);
        if (isNaN(days) || days < 1 || days > 365) {
            return await sock.sendMessage(from, {
                text: `❌ Invalid days!\n\n` +
                      `Please provide a number between 1 and 365.\n` +
                      `💡 Example: .kickoffline days 30`
            }, { quoted: msg });
        }

        botData.kickOffline[from].days = days;
        saveBotData();
        
        await sock.sendMessage(from, {
            text: `✅ *Offline Days Updated!*\n\n` +
                  `⏱️ New Threshold: ${days} days\n` +
                  `💡 Members inactive for ${days}+ days will be kicked.`
        }, { quoted: msg });
        return;
    }

    // --- RUN NOW ---
    if (action === 'now' || action === 'run') {
        await sock.sendMessage(from, {
            text: `🔍 *Running Kick-Offline Check...*\n\n⏳ Scanning group members...`
        }, { quoted: msg });
        
        await performKickOffline(sock, from, botData, saveBotData);
        return;
    }

    // --- AUTO CHECK ---
    if (action === 'autocheck') {
        const mode = args[1]?.toLowerCase();
        if (!['on', 'off'].includes(mode)) {
            return await sock.sendMessage(from, {
                text: `❌ Usage: .kickoffline autocheck [on/off]`
            }, { quoted: msg });
        }

        botData.kickOffline[from].autoCheck = mode === 'on';
        saveBotData();
        
        await sock.sendMessage(from, {
            text: `${mode === 'on' ? '✅' : '❌'} *Auto-Check ${mode === 'on' ? 'Enabled' : 'Disabled'}*\n\n` +
                  `${mode === 'on' ? '🔄 Will check every hour' : '💤 Auto-check disabled'}`
        }, { quoted: msg });
        return;
    }

    // --- STATS ---
    if (action === 'stats') {
        const config = botData.kickOffline[from];
        const stats = config?.stats || { totalKicked: 0, totalScanned: 0 };
        
        return await sock.sendMessage(from, {
            text: `📊 *Kick-Offline Statistics*\n\n` +
                  `👢 Total Kicked: ${stats.totalKicked || 0}\n` +
                  `🔍 Total Scanned: ${stats.totalScanned || 0}\n` +
                  `⏱️ Days Threshold: ${config?.days || CONFIG.OFFLINE_DAYS}\n` +
                  `🔄 Status: ${config?.enabled ? 'Active' : 'Inactive'}\n` +
                  `📅 Last Run: ${config?.lastRun ? formatDate(new Date(config.lastRun)) : 'Never'}\n` +
                  `👤 Last Kicked: ${stats.lastKicked ? formatDate(new Date(stats.lastKicked)) : 'Never'}`
        }, { quoted: msg });
    }

    // --- LOGS ---
    if (action === 'logs') {
        try {
            let logs = {};
            if (fs.existsSync(CONFIG.LOG_FILE)) {
                logs = JSON.parse(fs.readFileSync(CONFIG.LOG_FILE));
            }
            
            const groupLogs = logs[from] || [];
            if (groupLogs.length === 0) {
                return await sock.sendMessage(from, {
                    text: `📝 No logs available.`
                }, { quoted: msg });
            }

            let logText = `📝 *Kick-Offline Logs*\n\n`;
            groupLogs.slice(-10).reverse().forEach((log, index) => {
                logText += `${index + 1}. ${log.user.split('@')[0]}\n`;
                logText += `   ${log.reason}\n`;
                logText += `   ${formatDate(new Date(log.time))}\n\n`;
            });

            return await sock.sendMessage(from, {
                text: logText
            }, { quoted: msg });
        } catch (error) {
            console.error('Logs error:', error);
            return await sock.sendMessage(from, {
                text: `❌ Error fetching logs.`
            }, { quoted: msg });
        }
    }

    // --- RESET ---
    if (action === 'reset' || action === 'clear') {
        botData.kickOffline[from].stats = {
            totalKicked: 0,
            totalScanned: 0,
            lastKicked: null
        };
        botData.kickOffline[from].lastRun = null;
        saveBotData();
        
        await sock.sendMessage(from, {
            text: `🧹 *Statistics Reset!*\n\n` +
                  `🔄 All stats have been cleared.`
        }, { quoted: msg });
        return;
    }

    // --- DEFAULT ---
    return await sock.sendMessage(from, {
        text: `❌ Invalid command!\n` +
              `📌 Use .kickoffline help for all commands`
    }, { quoted: msg });
}

// --- PERFORM KICK OFFLINE ---
async function performKickOffline(sock, from, botData, saveBotData) {
    try {
        // --- Get Group Metadata ---
        const metadata = await sock.groupMetadata(from);
        const participants = metadata.participants || [];
        const botId = jidNormalizedUser(sock.user.id);
        
        // --- Check Bot Admin Status ---
        const botParticipant = participants.find(p => p.id === botId);
        const botIsAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin';

        if (!botIsAdmin) {
            await sock.sendMessage(from, { 
                text: "❌ *Bot Not Admin!*\n\nI need to be an admin to kick members." 
            });
            return;
        }

        // --- Get Config ---
        const config = botData.kickOffline[from];
        if (!config || !config.enabled) {
            return;
        }

        const offlineDays = config.days || CONFIG.OFFLINE_DAYS;
        const offlineMs = offlineDays * 24 * 60 * 60 * 1000;
        const now = Date.now();

        // --- Analyze Participants ---
        const admins = participants.filter(p => p.admin).map(p => p.id);
        const toKick = [];
        const unknownUsers = [];

        for (const participant of participants) {
            // Skip admins
            if (participant.admin) continue;
            // Skip bot
            if (participant.id === botId) continue;

            // Check user activity
            const userActivity = botData.userActivity?.[participant.id];
            let lastSeen = userActivity?.lastSeen || null;
            let messageCount = userActivity?.messageCount || 0;

            // If we have tracking data
            if (lastSeen) {
                const offlineDuration = now - lastSeen;
                if (offlineDuration >= offlineMs) {
                    toKick.push({
                        id: participant.id,
                        lastSeen: lastSeen,
                        offlineDays: Math.floor(offlineDuration / (24 * 60 * 60 * 1000)),
                        messageCount: messageCount
                    });
                }
            } else {
                // No tracking data - mark as unknown
                unknownUsers.push(participant.id);
            }
        }

        // --- Update Stats ---
        config.stats = config.stats || { totalKicked: 0, totalScanned: 0 };
        config.stats.totalScanned = (config.stats.totalScanned || 0) + participants.length;
        config.lastRun = now;

        // --- Kick Users ---
        if (toKick.length > 0) {
            let kickedCount = 0;
            let failedCount = 0;
            const kickedUsers = [];

            for (const user of toKick) {
                try {
                    await sock.groupParticipantsUpdate(from, [user.id], "remove");
                    kickedCount++;
                    kickedUsers.push(user.id);
                    
                    // Log kick
                    logKick(from, user.id, `Offline for ${user.offlineDays} days (${offlineDays} days threshold)`);
                    
                    // Update stats
                    config.stats.totalKicked = (config.stats.totalKicked || 0) + 1;
                    config.stats.lastKicked = now;
                    
                    // Small delay
                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (error) {
                    console.error(`Failed to kick ${user.id}:`, error.message);
                    failedCount++;
                }
            }

            // --- Send Result Message ---
            let resultMsg = `╭━━━〔 ${toBold("👢 KICK OFFLINE RESULT")} 〕━━━┈⊷\n` +
                           `┃\n` +
                           `┃ 📊 ${toBold("Scanned:")} ${participants.length}\n` +
                           `┃ ✅ ${toBold("Kicked:")} ${kickedCount}\n` +
                           `┃ ❌ ${toBold("Failed:")} ${failedCount}\n` +
                           `┃ ⏱️ ${toBold("Threshold:")} ${offlineDays} days\n` +
                           `┃\n`;

            if (kickedCount > 0) {
                resultMsg += `┃ 👥 ${toBold("Kicked Users:")}\n`;
                const displayUsers = kickedUsers.slice(0, 10);
                for (const user of displayUsers) {
                    const userInfo = toKick.find(u => u.id === user);
                    resultMsg += `┃   • @${user.split('@')[0]} (${userInfo?.offlineDays || '?'}d)\n`;
                }
                if (kickedUsers.length > 10) {
                    resultMsg += `┃   • +${kickedUsers.length - 10} more\n`;
                }
                resultMsg += `┃\n`;
            }

            if (unknownUsers.length > 0) {
                resultMsg += `┃ ⚠️ ${toBold("Unknown Activity:")} ${unknownUsers.length}\n`;
                resultMsg += `┃   (No tracking data available)\n`;
                resultMsg += `┃\n`;
            }

            resultMsg += `┃ 🕐 ${toBold("Time:")} ${formatDate(new Date())}\n` +
                         `┃\n` +
                         `┃ 💡 ${toBold("Note:")} Inactive members removed!\n` +
                         `╰━━━━━━━━━━━━━━━━━━┈⊷`;

            const allMentions = [...kickedUsers];
            await sock.sendMessage(from, { 
                text: resultMsg,
                mentions: allMentions
            });

            // --- Send Summary ---
            if (kickedCount > 0) {
                await sock.sendMessage(from, {
                    text: `✅ *Removed ${kickedCount} inactive members!*\n` +
                          `📊 Total Kicked: ${config.stats.totalKicked}\n` +
                          `💡 Use .kickoffline stats for details.`
                });
            }

            saveBotData();

        } else {
            // --- No users to kick ---
            let statusMsg = `✅ *No Inactive Members Found!*\n\n` +
                           `🔍 Scanned: ${participants.length} members\n` +
                           `⏱️ Threshold: ${offlineDays} days\n` +
                           `📊 Active Members: ${participants.length - admins.length - toKick.length}\n`;

            if (unknownUsers.length > 0) {
                statusMsg += `⚠️ Unknown Activity: ${unknownUsers.length} members\n`;
                statusMsg += `   (No tracking data available)\n`;
            }

            statusMsg += `\n💡 All members are active or unknown.`;

            await sock.sendMessage(from, { text: statusMsg });
            saveBotData();
        }

    } catch (error) {
        console.error('KickOffline Error:', error);
        await sock.sendMessage(from, { 
            text: `❌ *Error Occurred!*\n\nError: ${error.message}` 
        });
    }
}

module.exports = kickOfflineCommand;