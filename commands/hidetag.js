async function hidetagCommand(sock, from, msg, isAdmin, q, args) {
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
        const allMembers = participants.map(p => p.id);
        const memberCount = allMembers.length;

        // --- Get Admin List ---
        const admins = participants.filter(p => p.admin).map(p => p.id);
        const superAdmins = participants.filter(p => p.admin === 'superadmin').map(p => p.id);

        // --- Parse Arguments ---
        const action = args[0]?.toLowerCase();
        const customMessage = q || args.slice(1).join(' ') || '';

        // --- Help Menu ---
        if (!customMessage || action === 'help') {
            return await sock.sendMessage(from, { 
                text: `╭━━━〔 ${toBold("📢 HIDETAG COMMANDS")} 〕━━━┈⊷\n` +
                      `┃\n` +
                      `┃ 📌 ${toBold("Usage:")}\n` +
                      `┃ .hidetag [message]\n` +
                      `┃ .hidetag admin [message]\n` +
                      `┃ .hidetag all [message]\n` +
                      `┃ .hidetag help\n` +
                      `┃\n` +
                      `┃ 📌 ${toBold("Examples:")}\n` +
                      `┃ .hidetag Hello everyone!\n` +
                      `┃ .hidetag admin Only admins\n` +
                      `┃ .hidetag all @everyone\n` +
                      `┃\n` +
                      `┃ 📊 ${toBold("Stats:")}\n` +
                      `┃ 👥 ${toBold("Members:")} ${memberCount}\n` +
                      `┃ 👑 ${toBold("Admins:")} ${admins.length}\n` +
                      `┃ ⭐ ${toBold("Super Admins:")} ${superAdmins.length}\n` +
                      `┃\n` +
                      `┃ 💡 ${toBold("Tip:")} Sends message with hidden mentions!\n` +
                      `╰━━━━━━━━━━━━━━━━━━┈⊷`
            }, { quoted: msg });
        }

        // --- Select Target Group ---
        let targetMembers = allMembers;
        let tagType = 'Everyone';
        
        if (action === 'admin' || action === 'admins') {
            targetMembers = admins;
            tagType = 'Admins';
        } else if (action === 'superadmin' || action === 'superadmins' || action === 'owner') {
            targetMembers = superAdmins;
            tagType = 'Super Admins';
        } else if (action === 'all' || action === 'everyone') {
            targetMembers = allMembers;
            tagType = 'Everyone';
            // Remove the action word from message
            const messageParts = args.slice(1);
            customMessage = messageParts.length > 0 ? messageParts.join(' ') : 'Hello Everyone!';
        }

        // --- No target found ---
        if (targetMembers.length === 0) {
            return await sock.sendMessage(from, { 
                text: `❌ No ${tagType.toLowerCase()} found in this group.` 
            }, { quoted: msg });
        }

        // --- Build Final Message ---
        const finalMessage = customMessage || `📢 *Message to ${tagType}*`;
        const timestamp = new Date().toLocaleString();

        // --- Add Header ---
        const header = `╭━━━〔 ${toBold(`📢 HIDETAG TO ${tagType.toUpperCase()}`)} 〕━━━┈⊷\n` +
                       `┃\n` +
                       `┃ 👥 ${toBold("Target:")} ${tagType}\n` +
                       `┃ 📊 ${toBold("Count:")} ${targetMembers.length}\n` +
                       `┃ 🕐 ${toBold("Time:")} ${timestamp}\n` +
                       `┃\n` +
                       `┃ 📝 ${toBold("Message:")}\n` +
                       `┃ ${finalMessage}\n` +
                       `┃\n` +
                       `┃ 💡 ${toBold("Note:")} Hidden mentions activated!\n` +
                       `╰━━━━━━━━━━━━━━━━━━┈⊷`;

        // --- Send Message with Hidden Tags ---
        await sock.sendMessage(from, { 
            text: header,
            mentions: targetMembers,
            contextInfo: {
                forwardingScore: 1,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363408426516135@newsletter',
                    newsletterName: 'TEAM-ZUBAIR-MD',
                    serverMessageId: -1
                }
            }
        });

        // --- Send Success Reaction ---
        await sock.sendMessage(from, { 
            react: { text: '✅', key: msg.key } 
        });

        // --- Send Extra Info ---
        await sock.sendMessage(from, {
            text: `✅ *Hidetag Sent Successfully!*\n\n` +
                  `👥 ${tagType}: ${targetMembers.length} members\n` +
                  `💬 Message: ${finalMessage.substring(0, 50)}${finalMessage.length > 50 ? '...' : ''}`
        });

    } catch (error) {
        console.error('Hidetag Error:', error);
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

module.exports = hidetagCommand;