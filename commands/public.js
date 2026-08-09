async function publicCommand(sock, from, msg, isAdmin, session, args) {
    // --- Validation ---
    if (!isAdmin) {
        return await sock.sendMessage(from, { 
            text: "❌ Only admins can use this command." 
        }, { quoted: msg });
    }

    const action = args[0]?.toLowerCase();

    // --- Initialize Session ---
    if (!session.mode) {
        session.mode = {
            isPublic: true,
            allowedUsers: [],
            allowedGroups: [],
            whitelist: [],
            blacklist: [],
            restrictedCommands: [],
            stats: {
                totalPrivate: 0,
                totalPublic: 0,
                lastChange: null
            }
        };
    }

    // --- HELP MENU ---
    if (action === 'help') {
        return await sock.sendMessage(from, {
            text: `╭━━━〔 ${toBold("🌍 PUBLIC COMMANDS")} 〕━━━┈⊷\n` +
                  `┃\n` +
                  `┃ 📌 ${toBold("Usage:")}\n` +
                  `┃ .public on           - Enable public mode\n` +
                  `┃ .public off          - Enable private mode\n` +
                  `┃ .public status       - Check current mode\n` +
                  `┃ .public add [user]   - Add user to whitelist\n` +
                  `┃ .public remove [user]- Remove from whitelist\n` +
                  `┃ .public block [user] - Block user\n` +
                  `┃ .public unblock [user]- Unblock user\n` +
                  `┃ .public list         - Show lists\n` +
                  `┃ .public stats        - Show statistics\n` +
                  `┃ .public reset        - Reset settings\n` +
                  `┃ .public help         - Show help\n` +
                  `┃\n` +
                  `┃ 📊 ${toBold("Current Mode:")} ${session.mode.isPublic ? '🌐 Public' : '🔒 Private'}\n` +
                  `┃ 👥 ${toBold("Whitelist:")} ${(session.mode.whitelist || []).length} users\n` +
                  `┃ 🚫 ${toBold("Blacklist:")} ${(session.mode.blacklist || []).length} users\n` +
                  `┃\n` +
                  `┃ 💡 ${toBold("Tip:")} Manage bot access easily!\n` +
                  `╰━━━━━━━━━━━━━━━━━━┈⊷`
        }, { quoted: msg });
    }

    // --- ENABLE PUBLIC MODE ---
    if (action === 'on' || action === 'public' || action === 'enable' || !action) {
        session.mode.isPublic = true;
        session.mode.stats.totalPublic = (session.mode.stats.totalPublic || 0) + 1;
        session.mode.stats.lastChange = new Date().toISOString();
        
        await sock.sendMessage(from, { 
            text: `🌐 *Public Mode Enabled!*\n\n` +
                  `🔓 Bot is now in PUBLIC mode.\n` +
                  `👥 Everyone can use the bot.\n` +
                  `🚫 Blocked Users: ${(session.mode.blacklist || []).length}\n` +
                  `💡 Use .public off to restrict access.`
        }, { quoted: msg });
        return;
    }

    // --- ENABLE PRIVATE MODE ---
    if (action === 'off' || action === 'private' || action === 'disable') {
        session.mode.isPublic = false;
        session.mode.stats.totalPrivate = (session.mode.stats.totalPrivate || 0) + 1;
        session.mode.stats.lastChange = new Date().toISOString();
        
        await sock.sendMessage(from, { 
            text: `🔒 *Private Mode Enabled!*\n\n` +
                  `🔐 Bot is now in PRIVATE mode.\n` +
                  `👥 Only whitelisted users can use the bot.\n` +
                  `📊 Whitelisted Users: ${(session.mode.whitelist || []).length}\n` +
                  `💡 Use .public on to allow everyone.`
        }, { quoted: msg });
        return;
    }

    // --- STATUS ---
    if (action === 'status') {
        const status = session.mode.isPublic ? '🌐 Public' : '🔒 Private';
        const statusEmoji = session.mode.isPublic ? '✅' : '🔒';
        const whitelist = session.mode.whitelist || [];
        const blacklist = session.mode.blacklist || [];
        const stats = session.mode.stats || { totalPrivate: 0, totalPublic: 0, lastChange: null };

        return await sock.sendMessage(from, {
            text: `📊 *Bot Mode Status*\n\n` +
                  `🔹 Mode: ${statusEmoji} ${status}\n` +
                  `🔹 Whitelist: ${whitelist.length} users\n` +
                  `🔹 Blacklist: ${blacklist.length} users\n` +
                  `🔹 Times Public: ${stats.totalPublic || 0}\n` +
                  `🔹 Times Private: ${stats.totalPrivate || 0}\n` +
                  `🔹 Last Change: ${stats.lastChange ? new Date(stats.lastChange).toLocaleString() : 'Never'}\n` +
                  `🔹 Allowed Users: ${(session.mode.allowedUsers || []).length}\n` +
                  `🔹 Allowed Groups: ${(session.mode.allowedGroups || []).length}`
        }, { quoted: msg });
    }

    // --- ADD TO WHITELIST ---
    if (action === 'add' || action === 'whitelist') {
        const target = args[1];
        if (!target) {
            return await sock.sendMessage(from, {
                text: `❌ Please provide a user to whitelist.\n` +
                      `📌 Example: .public add @user\n` +
                      `📌 Example: .public add 9234567890`
            }, { quoted: msg });
        }

        let userJid = target;
        if (target.includes('@')) {
            userJid = target;
        } else if (target.match(/^[0-9]+$/)) {
            userJid = target + '@s.whatsapp.net';
        }

        if (!session.mode.whitelist) session.mode.whitelist = [];
        if (!session.mode.whitelist.includes(userJid)) {
            session.mode.whitelist.push(userJid);
        }

        if (session.mode.blacklist) {
            session.mode.blacklist = session.mode.blacklist.filter(u => u !== userJid);
        }

        await sock.sendMessage(from, {
            text: `✅ *User Whitelisted!*\n\n` +
                  `👤 User: @${userJid.split('@')[0]}\n` +
                  `📊 Total Whitelisted: ${session.mode.whitelist.length}\n` +
                  `🔓 This user can now use the bot.`,
            mentions: [userJid]
        }, { quoted: msg });
        return;
    }

    // --- REMOVE FROM WHITELIST ---
    if (action === 'remove' || action === 'unwhitelist') {
        const target = args[1];
        if (!target) {
            return await sock.sendMessage(from, {
                text: `❌ Please provide a user to remove.\n` +
                      `📌 Example: .public remove @user`
            }, { quoted: msg });
        }

        let userJid = target;
        if (target.includes('@')) {
            userJid = target;
        } else if (target.match(/^[0-9]+$/)) {
            userJid = target + '@s.whatsapp.net';
        }

        if (session.mode.whitelist) {
            session.mode.whitelist = session.mode.whitelist.filter(u => u !== userJid);
        }

        await sock.sendMessage(from, {
            text: `❌ *User Removed from Whitelist!*\n\n` +
                  `👤 User: @${userJid.split('@')[0]}\n` +
                  `📊 Total Whitelisted: ${session.mode.whitelist.length}`,
            mentions: [userJid]
        }, { quoted: msg });
        return;
    }

    // --- BLOCK USER ---
    if (action === 'block' || action === 'blacklist') {
        const target = args[1];
        if (!target) {
            return await sock.sendMessage(from, {
                text: `❌ Please provide a user to block.\n` +
                      `📌 Example: .public block @user`
            }, { quoted: msg });
        }

        let userJid = target;
        if (target.includes('@')) {
            userJid = target;
        } else if (target.match(/^[0-9]+$/)) {
            userJid = target + '@s.whatsapp.net';
        }

        if (!session.mode.blacklist) session.mode.blacklist = [];
        if (!session.mode.blacklist.includes(userJid)) {
            session.mode.blacklist.push(userJid);
        }

        if (session.mode.whitelist) {
            session.mode.whitelist = session.mode.whitelist.filter(u => u !== userJid);
        }

        await sock.sendMessage(from, {
            text: `🚫 *User Blocked!*\n\n` +
                  `👤 User: @${userJid.split('@')[0]}\n` +
                  `📊 Total Blocked: ${session.mode.blacklist.length}\n` +
                  `🔒 This user is now blocked from using the bot.`,
            mentions: [userJid]
        }, { quoted: msg });
        return;
    }

    // --- UNBLOCK USER ---
    if (action === 'unblock' || action === 'unblacklist') {
        const target = args[1];
        if (!target) {
            return await sock.sendMessage(from, {
                text: `❌ Please provide a user to unblock.\n` +
                      `📌 Example: .public unblock @user`
            }, { quoted: msg });
        }

        let userJid = target;
        if (target.includes('@')) {
            userJid = target;
        } else if (target.match(/^[0-9]+$/)) {
            userJid = target + '@s.whatsapp.net';
        }

        if (session.mode.blacklist) {
            session.mode.blacklist = session.mode.blacklist.filter(u => u !== userJid);
        }

        await sock.sendMessage(from, {
            text: `✅ *User Unblocked!*\n\n` +
                  `👤 User: @${userJid.split('@')[0]}\n` +
                  `📊 Total Blocked: ${session.mode.blacklist.length}\n` +
                  `🔓 This user can now use the bot again.`,
            mentions: [userJid]
        }, { quoted: msg });
        return;
    }

    // --- LIST ---
    if (action === 'list') {
        const whitelist = session.mode.whitelist || [];
        const blacklist = session.mode.blacklist || [];
        
        let listText = `📋 *Access Lists*\n\n`;
        
        listText += `✅ *Whitelist (${whitelist.length} users)*\n`;
        if (whitelist.length === 0) {
            listText += `   No users whitelisted\n`;
        } else {
            whitelist.slice(0, 20).forEach((user, index) => {
                listText += `   ${index + 1}. ${user.split('@')[0]}\n`;
            });
            if (whitelist.length > 20) {
                listText += `   ... and ${whitelist.length - 20} more\n`;
            }
        }
        
        listText += `\n🚫 *Blacklist (${blacklist.length} users)*\n`;
        if (blacklist.length === 0) {
            listText += `   No users blacklisted\n`;
        } else {
            blacklist.slice(0, 20).forEach((user, index) => {
                listText += `   ${index + 1}. ${user.split('@')[0]}\n`;
            });
            if (blacklist.length > 20) {
                listText += `   ... and ${blacklist.length - 20} more\n`;
            }
        }

        await sock.sendMessage(from, { text: listText }, { quoted: msg });
        return;
    }

    // --- STATS ---
    if (action === 'stats') {
        const stats = session.mode.stats || { totalPrivate: 0, totalPublic: 0, lastChange: null };
        
        await sock.sendMessage(from, {
            text: `📊 *Public/Private Mode Statistics*\n\n` +
                  `🌐 Times Public: ${stats.totalPublic || 0}\n` +
                  `🔒 Times Private: ${stats.totalPrivate || 0}\n` +
                  `🔄 Total Changes: ${(stats.totalPublic || 0) + (stats.totalPrivate || 0)}\n` +
                  `📅 Last Change: ${stats.lastChange ? new Date(stats.lastChange).toLocaleString() : 'Never'}\n` +
                  `👥 Whitelisted: ${(session.mode.whitelist || []).length}\n` +
                  `🚫 Blacklisted: ${(session.mode.blacklist || []).length}\n` +
                  `📊 Current Mode: ${session.mode.isPublic ? '🌐 Public' : '🔒 Private'}`
        }, { quoted: msg });
        return;
    }

    // --- RESET ---
    if (action === 'reset' || action === 'clear') {
        session.mode.whitelist = [];
        session.mode.blacklist = [];
        session.mode.allowedUsers = [];
        session.mode.allowedGroups = [];
        session.mode.isPublic = true;
        session.mode.stats = {
            totalPrivate: 0,
            totalPublic: 0,
            lastChange: new Date().toISOString()
        };
        
        await sock.sendMessage(from, {
            text: `🧹 *Settings Reset!*\n\n` +
                  `🔄 All settings have been reset.\n` +
                  `🌐 Bot is now in PUBLIC mode.\n` +
                  `👥 All users can use the bot.`
        }, { quoted: msg });
        return;
    }

    // --- TOGGLE ---
    if (action === 'toggle') {
        session.mode.isPublic = !session.mode.isPublic;
        session.mode.stats[session.mode.isPublic ? 'totalPublic' : 'totalPrivate'] = 
            (session.mode.stats[session.mode.isPublic ? 'totalPublic' : 'totalPrivate'] || 0) + 1;
        session.mode.stats.lastChange = new Date().toISOString();
        
        const modeText = session.mode.isPublic ? '🌐 Public' : '🔒 Private';
        const emoji = session.mode.isPublic ? '✅' : '🔒';
        
        await sock.sendMessage(from, {
            text: `${emoji} *Mode Toggled!*\n\n` +
                  `📊 New Mode: ${modeText}\n` +
                  `👥 ${session.mode.isPublic ? 'Everyone can use the bot' : 'Only whitelisted users can use the bot'}\n` +
                  `💡 Use .public status to check current mode.`
        }, { quoted: msg });
        return;
    }

    // --- DEFAULT ---
    return await sock.sendMessage(from, {
        text: `❌ Invalid command!\n` +
              `📌 Use .public help for all commands`
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

module.exports = publicCommand;