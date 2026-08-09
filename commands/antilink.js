async function antilinkCommand(sock, from, msg, isAdmin, botData, saveBotData, args) {
    if (!from.endsWith('@g.us')) {
        return await sock.sendMessage(from, { 
            text: "❌ This command can only be used in groups." 
        }, { quoted: msg });
    }

    if (!isAdmin) {
        return await sock.sendMessage(from, { 
            text: "❌ Only group admins can use this command." 
        }, { quoted: msg });
    }
    
    const action = args[0]?.toLowerCase();
    const subAction = args[1]?.toLowerCase();

    // --- INITIALIZE ANTI-LINK DATA ---
    if (!botData.antilinkGroups) botData.antilinkGroups = {};
    if (!botData.antilinkWhitelist) botData.antilinkWhitelist = {};
    if (!botData.antilinkLogs) botData.antilinkLogs = {};
    if (!botData.antilinkStats) botData.antilinkStats = {};

    // --- HELP MENU ---
    if (!action || action === 'help') {
        const status = botData.antilinkGroups[from] || 'off';
        const statusEmoji = status === 'off' ? '❌' : '✅';
        const statusText = status === 'off' ? 'Disabled' : 
                          status === 'del' ? 'Delete Only' : 'Kick + Delete';
        const whitelist = botData.antilinkWhitelist[from] || [];
        const stats = botData.antilinkStats[from] || { blocked: 0, kicked: 0, warned: 0 };

        return await sock.sendMessage(from, { 
            text: `╭━━━〔 ${toBold("ANTI-LINK COMMANDS")} 〕━━━┈⊷\n` +
                  `┃\n` +
                  `┃ ⋄ ${toBold(".antilink on")} - Delete links only\n` +
                  `┃ ⋄ ${toBold(".antilink kick")} - Delete + Kick\n` +
                  `┃ ⋄ ${toBold(".antilink warn")} - Delete + Warn\n` +
                  `┃ ⋄ ${toBold(".antilink off")} - Disable protection\n` +
                  `┃ ⋄ ${toBold(".antilink status")} - Check status\n` +
                  `┃ ⋄ ${toBold(".antilink whitelist add [domain]")} - Whitelist domain\n` +
                  `┃ ⋄ ${toBold(".antilink whitelist remove [domain]")} - Remove domain\n` +
                  `┃ ⋄ ${toBold(".antilink whitelist list")} - Show whitelist\n` +
                  `┃ ⋄ ${toBold(".antilink stats")} - Show statistics\n` +
                  `┃ ⋄ ${toBold(".antilink logs")} - Show recent logs\n` +
                  `┃ ⋄ ${toBold(".antilink clear")} - Clear stats\n` +
                  `┃\n` +
                  `┃ 📊 ${toBold("Status:")} ${statusEmoji} ${statusText}\n` +
                  `┃ 📋 ${toBold("Whitelist:")} ${whitelist.length} domains\n` +
                  `┃ 🛡️ ${toBold("Blocked:")} ${stats.blocked || 0}\n` +
                  `┃ 👢 ${toBold("Kicked:")} ${stats.kicked || 0}\n` +
                  `┃ ⚠️ ${toBold("Warned:")} ${stats.warned || 0}\n` +
                  `╰━━━━━━━━━━━━━━━━━━┈⊷`
        }, { quoted: msg });
    }

    // --- ENABLE (DELETE ONLY) ---
    if (action === 'on' || action === 'del') {
        botData.antilinkGroups[from] = 'del';
        botData.antilinkStats[from] = botData.antilinkStats[from] || { 
            blocked: 0, kicked: 0, warned: 0, 
            startTime: new Date().toISOString() 
        };
        saveBotData();
        
        return await sock.sendMessage(from, { 
            text: `✅ *Anti-Link Enabled!*\n\n` +
                  `🔹 Mode: Delete Only\n` +
                  `🔹 Action: Links will be deleted\n` +
                  `🔹 Whitelist: ${(botData.antilinkWhitelist[from] || []).length} domains\n` +
                  `🛡️ Protection activated!` 
        }, { quoted: msg });
    }

    // --- ENABLE (KICK + DELETE) ---
    if (action === 'kick') {
        botData.antilinkGroups[from] = 'kick';
        botData.antilinkStats[from] = botData.antilinkStats[from] || { 
            blocked: 0, kicked: 0, warned: 0, 
            startTime: new Date().toISOString() 
        };
        saveBotData();
        
        return await sock.sendMessage(from, { 
            text: `✅ *Anti-Link Enabled!*\n\n` +
                  `🔹 Mode: Kick + Delete\n` +
                  `🔹 Action: Links deleted + User kicked\n` +
                  `🔹 Whitelist: ${(botData.antilinkWhitelist[from] || []).length} domains\n` +
                  `🛡️ Protection activated!` 
        }, { quoted: msg });
    }

    // --- ENABLE (WARN + DELETE) ---
    if (action === 'warn') {
        botData.antilinkGroups[from] = 'warn';
        botData.antilinkStats[from] = botData.antilinkStats[from] || { 
            blocked: 0, kicked: 0, warned: 0, 
            startTime: new Date().toISOString() 
        };
        saveBotData();
        
        return await sock.sendMessage(from, { 
            text: `✅ *Anti-Link Enabled!*\n\n` +
                  `🔹 Mode: Warn + Delete\n` +
                  `🔹 Action: Links deleted + User warned\n` +
                  `🔹 Whitelist: ${(botData.antilinkWhitelist[from] || []).length} domains\n` +
                  `🛡️ Protection activated!` 
        }, { quoted: msg });
    }

    // --- DISABLE ---
    if (action === 'off') {
        delete botData.antilinkGroups[from];
        saveBotData();
        
        return await sock.sendMessage(from, { 
            text: `❌ *Anti-Link Disabled!*\n\n` +
                  `🔓 Protection deactivated\n` +
                  `📊 Total Blocked: ${(botData.antilinkStats[from]?.blocked || 0)} links\n` +
                  `💤 No longer monitoring messages` 
        }, { quoted: msg });
    }

    // --- STATUS ---
    if (action === 'status') {
        const status = botData.antilinkGroups[from] || 'off';
        const statusEmoji = status === 'off' ? '❌' : '✅';
        const statusText = status === 'off' ? 'Disabled' : 
                          status === 'del' ? 'Delete Only' : 
                          status === 'kick' ? 'Kick + Delete' : 'Warn + Delete';
        const whitelist = botData.antilinkWhitelist[from] || [];
        const stats = botData.antilinkStats[from] || { 
            blocked: 0, kicked: 0, warned: 0, startTime: new Date().toISOString() 
        };
        const total = stats.blocked + stats.kicked + stats.warned;

        return await sock.sendMessage(from, { 
            text: `📊 *Anti-Link Status*\n\n` +
                  `🔹 Status: ${statusEmoji} ${statusText}\n` +
                  `🔹 Whitelist: ${whitelist.length} domains\n` +
                  `🔹 Total Actions: ${total}\n` +
                  `   ├ 🛡️ Blocked: ${stats.blocked || 0}\n` +
                  `   ├ 👢 Kicked: ${stats.kicked || 0}\n` +
                  `   └ ⚠️ Warned: ${stats.warned || 0}\n` +
                  `🔹 Started: ${new Date(stats.startTime).toLocaleString()}\n` +
                  `🔹 Group: ${from.split('@')[0]}` 
        }, { quoted: msg });
    }

    // --- WHITELIST MANAGEMENT ---
    if (action === 'whitelist') {
        if (!botData.antilinkWhitelist[from]) {
            botData.antilinkWhitelist[from] = [];
        }

        if (subAction === 'add') {
            const domain = args[2]?.toLowerCase();
            if (!domain) {
                return await sock.sendMessage(from, { 
                    text: "❌ Please provide a domain to whitelist.\n" +
                          "📌 Example: .antilink whitelist add youtube.com" 
                }, { quoted: msg });
            }

            if (!botData.antilinkWhitelist[from].includes(domain)) {
                botData.antilinkWhitelist[from].push(domain);
                saveBotData();
            }

            return await sock.sendMessage(from, { 
                text: `✅ *Domain Whitelisted*\n\n` +
                      `🌐 Domain: ${domain}\n` +
                      `📋 Total: ${botData.antilinkWhitelist[from].length} domains` 
            }, { quoted: msg });
        }

        if (subAction === 'remove') {
            const domain = args[2]?.toLowerCase();
            if (!domain) {
                return await sock.sendMessage(from, { 
                    text: "❌ Please provide a domain to remove.\n" +
                          "📌 Example: .antilink whitelist remove youtube.com" 
                }, { quoted: msg });
            }

            botData.antilinkWhitelist[from] = botData.antilinkWhitelist[from]
                .filter(d => d !== domain);
            saveBotData();

            return await sock.sendMessage(from, { 
                text: `❌ *Domain Removed*\n\n` +
                      `🌐 Domain: ${domain}\n` +
                      `📋 Total: ${botData.antilinkWhitelist[from].length} domains` 
            }, { quoted: msg });
        }

        if (subAction === 'list' || subAction === 'show') {
            const whitelist = botData.antilinkWhitelist[from] || [];
            if (whitelist.length === 0) {
                return await sock.sendMessage(from, { 
                    text: "📋 No domains are whitelisted." 
                }, { quoted: msg });
            }

            let listText = `📋 *Whitelisted Domains*\n\n`;
            whitelist.forEach((domain, index) => {
                listText += `${index + 1}. ${domain}\n`;
            });
            listText += `\n📊 Total: ${whitelist.length} domains`;

            return await sock.sendMessage(from, { text: listText }, { quoted: msg });
        }

        return await sock.sendMessage(from, { 
            text: "❌ Usage: .antilink whitelist [add/remove/list] [domain]" 
        }, { quoted: msg });
    }

    // --- STATISTICS ---
    if (action === 'stats') {
        const stats = botData.antilinkStats[from] || { 
            blocked: 0, kicked: 0, warned: 0, 
            startTime: new Date().toISOString() 
        };
        const total = stats.blocked + stats.kicked + stats.warned;
        const status = botData.antilinkGroups[from] || 'off';
        const whitelist = botData.antilinkWhitelist[from] || [];

        return await sock.sendMessage(from, { 
            text: `📊 *Anti-Link Statistics*\n\n` +
                  `📈 Total Actions: ${total}\n` +
                  `🛡️ Blocked Links: ${stats.blocked || 0}\n` +
                  `👢 Kicked Users: ${stats.kicked || 0}\n` +
                  `⚠️ Warned Users: ${stats.warned || 0}\n` +
                  `📋 Whitelisted: ${whitelist.length} domains\n` +
                  `🔹 Status: ${status === 'off' ? 'Disabled' : 'Active'}\n` +
                  `📅 Started: ${new Date(stats.startTime).toLocaleString()}` 
        }, { quoted: msg });
    }

    // --- LOGS ---
    if (action === 'logs' || action === 'log') {
        const logs = botData.antilinkLogs[from] || [];
        if (logs.length === 0) {
            return await sock.sendMessage(from, { 
                text: "📝 No logs available." 
            }, { quoted: msg });
        }

        let logText = `📝 *Recent Anti-Link Logs*\n\n`;
        logs.slice(-10).reverse().forEach((log, index) => {
            logText += `${index + 1}. ${log.user}\n`;
            logText += `   ${log.action} | ${log.link}\n`;
            logText += `   ${new Date(log.time).toLocaleString()}\n\n`;
        });

        return await sock.sendMessage(from, { text: logText }, { quoted: msg });
    }

    // --- CLEAR STATS ---
    if (action === 'clear' || action === 'reset') {
        botData.antilinkStats[from] = { 
            blocked: 0, kicked: 0, warned: 0, 
            startTime: new Date().toISOString() 
        };
        botData.antilinkLogs[from] = [];
        saveBotData();

        return await sock.sendMessage(from, { 
            text: `🧹 *Statistics Cleared!*\n\n` +
                  `🔄 All logs and stats have been reset.` 
        }, { quoted: msg });
    }

    // --- DEFAULT ---
    return await sock.sendMessage(from, { 
        text: "❌ Invalid command!\n" +
              "📌 Use .antilink help for all commands" 
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

module.exports = antilinkCommand;