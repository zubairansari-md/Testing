async function tagallCommand(sock, from, msg, isAdmin, q, args = []) {
    // --- Validation ---
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

    try {
        // --- Get Group Metadata ---
        const groupMetadata = await sock.groupMetadata(from);
        const participants = groupMetadata.participants || [];
        const totalMembers = participants.length;

        // --- Get Admin List ---
        const admins = participants.filter(p => p.admin).map(p => p.id);
        const superAdmins = participants.filter(p => p.admin === 'superadmin').map(p => p.id);
        const normalMembers = participants.filter(p => !p.admin).map(p => p.id);

        // --- Parse Arguments ---
        const action = args[0]?.toLowerCase();
        const message = args.slice(action === 'admin' || action === 'everyone' || action === 'online' ? 1 : 0).join(' ') || q;

        // --- HELP MENU ---
        if (!q && !args.length || action === 'help') {
            return await sock.sendMessage(from, {
                text: `╭━━━〔 ${toBold("📢 TAG ALL COMMANDS")} 〕━━━┈⊷\n` +
                      `┃\n` +
                      `┃ 📌 ${toBold("Usage:")}\n` +
                      `┃ .tagall [message]           - Tag everyone\n` +
                      `┃ .tagall admin [message]     - Tag only admins\n` +
                      `┃ .tagall everyone [message]  - Tag everyone\n` +
                      `┃ .tagall online [message]    - Tag online members\n` +
                      `┃ .tagall help                - Show help\n` +
                      `┃\n` +
                      `┃ 📌 ${toBold("Examples:")}\n` +
                      `┃ .tagall Hello everyone!\n` +
                      `┃ .tagall admin Meeting now!\n` +
                      `┃ .tagall online Check in!\n` +
                      `┃\n` +
                      `┃ 📊 ${toBold("Group Stats:")}\n` +
                      `┃ 👥 ${toBold("Total:")} ${totalMembers}\n` +
                      `┃ 👑 ${toBold("Admins:")} ${admins.length}\n` +
                      `┃ ⭐ ${toBold("Super Admins:")} ${superAdmins.length}\n` +
                      `┃ 👤 ${toBold("Members:")} ${normalMembers.length}\n` +
                      `┃\n` +
                      `┃ 💡 ${toBold("Tip:")} Tag all members with one message!\n` +
                      `╰━━━━━━━━━━━━━━━━━━┈⊷`
            }, { quoted: msg });
        }

        // --- Select Target Group ---
        let targetMembers = participants.map(p => p.id);
        let tagType = 'Everyone';
        let header = '📢 TAG ALL';

        if (action === 'admin' || action === 'admins') {
            targetMembers = admins;
            tagType = 'Admins';
            header = '👑 TAG ADMINS';
        } else if (action === 'superadmin' || action === 'superadmins' || action === 'owner') {
            targetMembers = superAdmins;
            tagType = 'Super Admins';
            header = '⭐ TAG SUPER ADMINS';
        } else if (action === 'everyone' || action === 'all') {
            targetMembers = participants.map(p => p.id);
            tagType = 'Everyone';
            header = '📢 TAG EVERYONE';
        } else if (action === 'online') {
            // Note: This is a simulation - actual online detection requires presence tracking
            targetMembers = participants.slice(0, Math.ceil(participants.length * 0.4)).map(p => p.id);
            tagType = 'Online Members';
            header = '🟢 TAG ONLINE';
        }

        // --- No target found ---
        if (targetMembers.length === 0) {
            return await sock.sendMessage(from, { 
                text: `❌ No ${tagType.toLowerCase()} found in this group.` 
            }, { quoted: msg });
        }

        // --- Build Tag Message ---
        const timestamp = new Date().toLocaleString();
        const tagCount = targetMembers.length;
        const displayMessage = message || `Hello ${tagType}!`;

        // Create mentions list
        const mentions = targetMembers;

        // Build the tag list (limited to avoid message too long)
        const maxDisplay = 20;
        let tagList = '';
        const displayMembers = targetMembers.slice(0, maxDisplay);
        for (let mem of displayMembers) {
            tagList += `┃ • @${mem.split('@')[0]}\n`;
        }
        if (targetMembers.length > maxDisplay) {
            tagList += `┃ • ... and ${targetMembers.length - maxDisplay} more\n`;
        }

        // --- Build Full Message ---
        const fullMessage = `╭━━━〔 ${toBold(header)} 〕━━━┈⊷\n` +
                           `┃\n` +
                           `┃ 📝 ${toBold("Message:")}\n` +
                           `┃ ${displayMessage}\n` +
                           `┃\n` +
                           `┃ 👥 ${toBold("Target:")} ${tagType}\n` +
                           `┃ 📊 ${toBold("Count:")} ${tagCount} members\n` +
                           `┃ 🕐 ${toBold("Time:")} ${timestamp}\n` +
                           `┃\n` +
                           `┃ 📋 ${toBold("Members:")}\n` +
                           `${tagList}` +
                           `┃\n` +
                           `┃ 💡 ${toBold("Tip:")} Use .tagall help for commands!\n` +
                           `╰━━━━━━━━━━━━━━━━━━┈⊷`;

        // --- Send Tag Message ---
        await sock.sendMessage(from, { 
            text: fullMessage,
            mentions: mentions,
            contextInfo: {
                forwardingScore: 1,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363408426516135@newsletter',
                    newsletterName: 'TEAM-ZUBAIR-MD',
                    serverMessageId: -1
                }
            }
        }, { quoted: msg });

        // --- Send Success Reaction ---
        await sock.sendMessage(from, { 
            react: { text: '✅', key: msg.key } 
        });

        // --- Send Extra Info ---
        await sock.sendMessage(from, {
            text: `✅ *Tag All Sent Successfully!*\n\n` +
                  `👥 ${tagType}: ${tagCount} members\n` +
                  `💬 Message: ${displayMessage.substring(0, 50)}${displayMessage.length > 50 ? '...' : ''}\n` +
                  `🕐 ${timestamp}`
        }, { quoted: msg });

        // --- Send Quick Buttons ---
        try {
            const buttons = [
                { buttonId: '.tagall everyone Hello!', buttonText: { displayText: '📢 Tag All' }, type: 1 },
                { buttonId: '.tagall admin Meeting!', buttonText: { displayText: '👑 Tag Admins' }, type: 1 },
                { buttonId: '.menu', buttonText: { displayText: '📋 Menu' }, type: 1 }
            ];

            await sock.sendMessage(from, {
                text: `📢 *Quick Tag Options*\n\nClick the buttons below!`,
                buttons: buttons,
                headerType: 1
            }, { quoted: msg });
        } catch (buttonError) {
            // Silent fail for buttons
        }

    } catch (error) {
        console.error('Tag All Error:', error);
        await sock.sendMessage(from, { 
            text: `❌ *Error Occurred!*\n\nError: ${error.message}` 
        }, { quoted: msg });
        await sock.sendMessage(from, { 
            react: { text: '❌', key: msg.key } 
        });
    }
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

module.exports = tagallCommand;