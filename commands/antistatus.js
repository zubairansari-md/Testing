async function antistatusCommand(sock, from, msg, isAdmin, botData, saveBotData, args) {
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

    // --- INITIALIZE DATA ---
    if (!botData.antiStatusGroups) botData.antiStatusGroups = {};
    if (!botData.antiStatusWhitelist) botData.antiStatusWhitelist = {};
    if (!botData.antiStatusStats) botData.antiStatusStats = {};
    if (!botData.antiStatusLogs) botData.antiStatusLogs = {};
    if (!botData.antiStatusSettings) botData.antiStatusSettings = {};

    // --- DEFAULT SETTINGS ---
    if (!botData.antiStatusSettings[from]) {
        botData.antiStatusSettings[from] = {
            action: 'delete', // delete, warn, kick, block
            notify: true,
            logChannel: null,
            autoDelete: true
        };
    }

    // --- HELP MENU ---
    if (!action || action === 'help') {
        const status = botData.antiStatusGroups[from] || false;
        const settings = botData.antiStatusSettings[from] || {};
        const whitelist = botData.antiStatusWhitelist[from] || [];
        const stats = botData.antiStatusStats[from] || { total: 0, deleted: 0, warned: 0, kicked: 0 };

        return await sock.sendMessage(from, { 
            text: `╭━━━〔 ${toBold("ANTI-STATUS COMMANDS")} 〕━━━┈⊷\n` +
                  `┃\n` +
                  `┃ ⋄ ${toBold(".antistatus on")} - Enable protection\n` +
                  `┃ ⋄ ${toBold(".antistatus off")} - Disable protection\n` +
                  `┃ ⋄ ${toBold(".antistatus status")} - Check status\n` +
                  `┃ ⋄ ${toBold(".antistatus action [delete/warn/kick/block]")} - Set action\n` +
                  `┃ ⋄ ${toBold(".antistatus whitelist add [jid]")} - Whitelist user\n` +
                  `┃ ⋄ ${toBold(".antistatus whitelist remove [jid]")} - Remove user\n` +
                  `┃ ⋄ ${toBold(".antistatus whitelist list")} - Show whitelist\n` +
                  `┃ ⋄ ${toBold(".antistatus notify on/off")} - Toggle notifications\n` +
                  `┃ ⋄ ${toBold(".antistatus channel [jid]")} - Set log channel\n` +
                  `┃ ⋄ ${toBold(".antistatus stats")} - Show statistics\n` +
                  `┃ ⋄ ${toBold(".antistatus logs")} - Show recent logs\n` +
                  `┃ ⋄ ${toBold(".antistatus clear")} - Clear stats\n` +
                  `┃\n` +
                  `┃ 📊 ${toBold("Status:")} ${status ? '✅ Active' : '❌ Inactive'}\n` +
                  `┃ ⚡ ${toBold("Action:")} ${settings.action || 'delete'}\n` +
                  `┃ 📋 ${toBold("Whitelist:")} ${whitelist.length} users\n` +
                  `┃ 🛡️ ${toBold("Total Actions:")} ${stats.total || 0}\n` +
                  `╰━━━━━━━━━━━━━━━━━━┈⊷`
        }, { quoted: msg });
    }

    // --- ENABLE ---
    if (action === 'on') {
        botData.antiStatusGroups[from] = true;
        botData.antiStatusStats[from] = botData.antiStatusStats[from] || { 
            total: 0, deleted: 0, warned: 0, kicked: 0, 
            startTime: new Date().toISOString() 
        };
        saveBotData();
        
        return await sock.sendMessage(from, { 
            text: `✅ *Anti-Status Enabled!*\n\n` +
                  `🔹 Action: ${botData.antiStatusSettings[from]?.action || 'delete'}\n` +
                  `🔹 Whitelist: ${(botData.antiStatusWhitelist[from] || []).length} users\n` +
                  `🛡️ Any status shared will be ${botData.antiStatusSettings[from]?.action || 'deleted'}` 
        }, { quoted: msg });
    }

    // --- DISABLE ---
    if (action === 'off') {
        botData.antiStatusGroups[from] = false;
        saveBotData();
        
        return await sock.sendMessage(from, { 
            text: `❌ *Anti-Status Disabled!*\n\n` +
                  `🔓 Protection deactivated\n` +
                  `📊 Total Status Removed: ${(botData.antiStatusStats[from]?.total || 0)}\n` +
                  `💤 No longer monitoring statuses` 
        }, { quoted: msg });
    }

    // --- STATUS ---
    if (action === 'status') {
        const status = botData.antiStatusGroups[from] || false;
        const settings = botData.antiStatusSettings[from] || {};
        const whitelist = botData.antiStatusWhitelist[from] || [];
        const stats = botData.antiStatusStats[from] || { 
            total: 0, deleted: 0, warned: 0, kicked: 0, 
            startTime: new Date().toISOString() 
        };

        return await sock.sendMessage(from, { 
            text: `📊 *Anti-Status Status*\n\n` +
                  `🔹 Status: ${status ? '✅ Active' : '❌ Inactive'}\n` +
                  `🔹 Action: ${settings.action || 'delete'}\n` +
                  `🔹 Notify: ${settings.notify !== false ? '✅ Yes' : '❌ No'}\n` +
                  `🔹 Auto-Delete: ${settings.autoDelete !== false ? '✅ Yes' : '❌ No'}\n` +
                  `🔹 Whitelist: ${whitelist.length} users\n` +
                  `🔹 Total Removed: ${stats.total || 0}\n` +
                  `   ├ 🗑️ Deleted: ${stats.deleted || 0}\n` +
                  `   ├ ⚠️ Warned: ${stats.warned || 0}\n` +
                  `   └ 👢 Kicked: ${stats.kicked || 0}\n` +
                  `🔹 Started: ${new Date(stats.startTime).toLocaleString()}\n` +
                  `🔹 Log Channel: ${settings.logChannel || 'Not set'}` 
        }, { quoted: msg });
    }

    // --- SET ACTION ---
    if (action === 'action') {
        const actionType = args[1]?.toLowerCase();
        if (!['delete', 'warn', 'kick', 'block'].includes(actionType)) {
            return await sock.sendMessage(from, { 
                text: "❌ Invalid action!\n" +
                      "📌 Available: delete, warn, kick, block\n" +
                      "💡 delete = Remove status only\n" +
                      "💡 warn = Remove + Warn\n" +
                      "💡 kick = Remove + Kick\n" +
                      "💡 block = Remove + Block" 
            }, { quoted: msg });
        }

        botData.antiStatusSettings[from].action = actionType;
        saveBotData();

        return await sock.sendMessage(from, { 
            text: `✅ *Action Updated*\n\n` +
                  `⚡ New Action: ${actionType}\n` +
                  `🛡️ Statuses will be ${actionType === 'delete' ? 'deleted only' : 'deleted and user ' + actionType}` 
        }, { quoted: msg });
    }

    // --- WHITELIST MANAGEMENT ---
    if (action === 'whitelist') {
        if (!botData.antiStatusWhitelist[from]) {
            botData.antiStatusWhitelist[from] = [];
        }

        if (subAction === 'add') {
            const userJid = args[2];
            if (!userJid) {
                return await sock.sendMessage(from, { 
                    text: "❌ Please provide a user JID to whitelist.\n" +
                          "📌 Example: .antistatus whitelist add 9234567890@s.whatsapp.net" 
                }, { quoted: msg });
            }

            if (!botData.antiStatusWhitelist[from].includes(userJid)) {
                botData.antiStatusWhitelist[from].push(userJid);
                saveBotData();
            }

            return await sock.sendMessage(from, { 
                text: `✅ *User Whitelisted*\n\n` +
                      `👤 User: ${userJid.split('@')[0]}\n` +
                      `📋 Total: ${botData.antiStatusWhitelist[from].length} users` 
            }, { quoted: msg });
        }

        if (subAction === 'remove') {
            const userJid = args[2];
            if (!userJid) {
                return await sock.sendMessage(from, { 
                    text: "❌ Please provide a user JID to remove.\n" +
                          "📌 Example: .antistatus whitelist remove 9234567890@s.whatsapp.net" 
                }, { quoted: msg });
            }

            botData.antiStatusWhitelist[from] = botData.antiStatusWhitelist[from]
                .filter(jid => jid !== userJid);
            saveBotData();

            return await sock.sendMessage(from, { 
                text: `❌ *User Removed From Whitelist*\n\n` +
                      `👤 User: ${userJid.split('@')[0]}\n` +
                      `📋 Total: ${botData.antiStatusWhitelist[from].length} users` 
            }, { quoted: msg });
        }

        if (subAction === 'list' || subAction === 'show') {
            const whitelist = botData.antiStatusWhitelist[from] || [];
            if (whitelist.length === 0) {
                return await sock.sendMessage(from, { 
                    text: "📋 No users are whitelisted." 
                }, { quoted: msg });
            }

            let listText = `📋 *Whitelisted Users*\n\n`;
            whitelist.forEach((jid, index) => {
                listText += `${index + 1}. ${jid.split('@')[0]}\n`;
            });
            listText += `\n📊 Total: ${whitelist.length} users`;

            return await sock.sendMessage(from, { text: listText }, { quoted: msg });
        }

        return await sock.sendMessage(from, { 
            text: "❌ Usage: .antistatus whitelist [add/remove/list] [jid]" 
        }, { quoted: msg });
    }

    // --- NOTIFICATIONS ---
    if (action === 'notify') {
        const mode = args[1]?.toLowerCase();
        if (!['on', 'off'].includes(mode)) {
            return await sock.sendMessage(from, { 
                text: "❌ Usage: .antistatus notify [on/off]" 
            }, { quoted: msg });
        }

        botData.antiStatusSettings[from].notify = mode === 'on';
        saveBotData();

        return await sock.sendMessage(from, { 
            text: `${mode === 'on' ? '✅' : '❌'} *Notification ${mode === 'on' ? 'Enabled' : 'Disabled'}*\n\n` +
                  `${mode === 'on' ? '🔔 Admins will be notified' : '🔕 No notifications sent'}` 
        }, { quoted: msg });
    }

    // --- SET LOG CHANNEL ---
    if (action === 'channel') {
        const channelJid = args[1];
        if (!channelJid) {
            return await sock.sendMessage(from, { 
                text: "❌ Please provide a channel JID.\n" +
                      "📌 Example: .antistatus channel 1234567890@g.us" 
            }, { quoted: msg });
        }

        botData.antiStatusSettings[from].logChannel = channelJid;
        saveBotData();

        return await sock.sendMessage(from, { 
            text: `✅ *Log Channel Set*\n\n` +
                  `📁 Channel: ${channelJid}\n` +
                  `📊 All logs will be sent here` 
        }, { quoted: msg });
    }

    // --- STATISTICS ---
    if (action === 'stats') {
        const stats = botData.antiStatusStats[from] || { 
            total: 0, deleted: 0, warned: 0, kicked: 0, 
            startTime: new Date().toISOString() 
        };
        const whitelist = botData.antiStatusWhitelist[from] || [];
        const settings = botData.antiStatusSettings[from] || {};

        return await sock.sendMessage(from, { 
            text: `📊 *Anti-Status Statistics*\n\n` +
                  `📈 Total Statuses Removed: ${stats.total || 0}\n` +
                  `🗑️ Deleted: ${stats.deleted || 0}\n` +
                  `⚠️ Warnings: ${stats.warned || 0}\n` +
                  `👢 Kicked: ${stats.kicked || 0}\n` +
                  `📋 Whitelisted: ${whitelist.length} users\n` +
                  `⚡ Action: ${settings.action || 'delete'}\n` +
                  `🔔 Notifications: ${settings.notify !== false ? 'On' : 'Off'}\n` +
                  `📅 Started: ${new Date(stats.startTime).toLocaleString()}` 
        }, { quoted: msg });
    }

    // --- LOGS ---
    if (action === 'logs' || action === 'log') {
        const logs = botData.antiStatusLogs[from] || [];
        if (logs.length === 0) {
            return await sock.sendMessage(from, { 
                text: "📝 No logs available." 
            }, { quoted: msg });
        }

        let logText = `📝 *Recent Anti-Status Logs*\n\n`;
        logs.slice(-10).reverse().forEach((log, index) => {
            logText += `${index + 1}. @${log.user.split('@')[0]}\n`;
            logText += `   ${log.action} | ${new Date(log.time).toLocaleString()}\n`;
            if (log.statusType) {
                logText += `   📂 ${log.statusType}\n`;
            }
            logText += '\n';
        });

        return await sock.sendMessage(from, { text: logText }, { quoted: msg });
    }

    // --- CLEAR STATS ---
    if (action === 'clear' || action === 'reset') {
        botData.antiStatusStats[from] = { 
            total: 0, deleted: 0, warned: 0, kicked: 0, 
            startTime: new Date().toISOString() 
        };
        botData.antiStatusLogs[from] = [];
        saveBotData();

        return await sock.sendMessage(from, { 
            text: `🧹 *Statistics Cleared!*\n\n` +
                  `🔄 All logs and stats have been reset.` 
        }, { quoted: msg });
    }

    // --- DEFAULT ---
    return await sock.sendMessage(from, { 
        text: "❌ Invalid command!\n" +
              "📌 Use .antistatus help for all commands" 
    }, { quoted: msg });
}

// --- HELPER: toBold ---
const toBold = (text) => {
    const boldChars = {
        'a': '𝗮', 'b': '𝗯', 'c': '𝗰', 'd': '𝗱', 'e': '𝗲', 'f': '𝗳', 'g': '𝗴', 'h': '𝗵', 'i': '𝗶', 'j': '𝗷', 'k': '𝗸', 'l': '𝗹', 'm': '𝗺', 'n': '𝗻', 'o': '𝗼', 'p': '𝗽', 'q': '𝗾', 'r': '𝗿', 's': '𝘀', 't': '𝘁', 'u': '𝘂', 'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇',
        'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚', 'H': '𝗛', 'I': '𝗜', 'J': '𝗝', 'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡', 'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝘀', 't': '𝘁', 'u': '𝘂', 'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇',
        '0': '𝟬', '1': '𝟭', '2': '𝟮', '3': '𝟯', '4': '𝟰', '5': '𝟱', '6': '𝟲', '7': '𝟳', '8': '𝟴', '9': '𝟵'
    };
    return text.split('').map(c => boldChars[c] || c).join('');
};

module.exports = antistatusCommand;