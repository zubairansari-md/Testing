async function groupInfoCommand(sock, chatId, msg) {
    if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, { 
            text: '❌ This command can only be used in groups.' 
        });
        return;
    }

    try {
        // --- Send loading reaction ---
        await sock.sendMessage(chatId, { 
            react: { text: '🔄', key: msg.key } 
        });

        // --- Get Group Metadata ---
        const groupMetadata = await sock.groupMetadata(chatId);
        const participants = groupMetadata.participants || [];
        
        // --- Get Group Profile Picture ---
        let pp;
        try {
            pp = await sock.profilePictureUrl(chatId, 'image');
        } catch {
            pp = 'https://i.imgur.com/2wzGhpF.jpeg';
        }

        // --- Get Group Description ---
        const description = groupMetadata.desc?.toString() || 'No description set';
        const descId = groupMetadata.descId || 'N/A';
        const descOwner = groupMetadata.descOwner || 'N/A';

        // --- Get Group Settings ---
        const settings = groupMetadata.settings || {};
        const restrict = settings.restrict || 'N/A';
        const announce = settings.announce || 'N/A';
        const noFwd = settings.noFwd || 'N/A';
        const joinMode = settings.joinMode || 'N/A';

        // --- Get Group Creation Time ---
        const createdAt = groupMetadata.creation ? new Date(groupMetadata.creation * 1000) : new Date();
        const createdDate = createdAt.toLocaleDateString('en-PK', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // --- Get Group Last Activity ---
        const lastActivity = groupMetadata.lastActivity ? new Date(groupMetadata.lastActivity * 1000) : createdAt;
        const lastActive = lastActivity.toLocaleDateString('en-PK', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // --- Analyze Participants ---
        const totalMembers = participants.length;
        const admins = participants.filter(p => p.admin);
        const superAdmins = participants.filter(p => p.admin === 'superadmin');
        const normalAdmins = participants.filter(p => p.admin === 'admin');
        const normalMembers = participants.filter(p => !p.admin);
        
        const adminList = admins.map((v, i) => `${i + 1}. @${v.id.split('@')[0]}`).join('\n');
        const superAdminList = superAdmins.map(v => `👑 @${v.id.split('@')[0]}`).join('\n');
        
        // --- Get Group Owner ---
        let owner = groupMetadata.owner || 
                   groupMetadata.subjectOwner || 
                   (superAdmins.length > 0 ? superAdmins[0].id : null) ||
                   (admins.length > 0 ? admins[0].id : null) ||
                   'Not found';

        // --- Calculate Stats ---
        const bots = participants.filter(p => p.id.includes('bot') || p.id.includes('whatsapp')).length;
        const verified = participants.filter(p => p.id.includes('@')).length;
        const unknown = totalMembers - bots;

        // --- Get Group Invite Link ---
        let inviteLink = 'Not available';
        try {
            const inviteCode = await sock.groupInviteCode(chatId);
            if (inviteCode) {
                inviteLink = `https://chat.whatsapp.com/${inviteCode}`;
            }
        } catch {
            // Silent fail
        }

        // --- Build Message ---
        const ownerDisplay = owner !== 'Not found' ? `@${owner.split('@')[0]}` : 'Not found';
        
        const text = `╭━━━〔 ${toBold("📊 GROUP INFORMATION")} 〕━━━┈⊷\n` +
                     `┃\n` +
                     `┃ 🔖 ${toBold("Name:")} ${groupMetadata.subject}\n` +
                     `┃ 🆔 ${toBold("ID:")} ${groupMetadata.id}\n` +
                     `┃\n` +
                     `┃ 👥 ${toBold("Members:")} ${totalMembers}\n` +
                     `┃   ├ ${toBold("Admins:")} ${admins.length}\n` +
                     `┃   │  ${superAdminList || 'No Super Admin'}\n` +
                     `┃   ├ ${toBold("Members:")} ${normalMembers.length}\n` +
                     `┃   ├ ${toBold("Bots:")} ${bots}\n` +
                     `┃   └ ${toBold("Verified:")} ${verified}\n` +
                     `┃\n` +
                     `┃ 👑 ${toBold("Owner:")} ${ownerDisplay}\n` +
                     `┃ 🕐 ${toBold("Created:")} ${createdDate}\n` +
                     `┃ 📅 ${toBold("Last Active:")} ${lastActive}\n` +
                     `┃\n` +
                     `┃ 📌 ${toBold("Description:")}\n` +
                     `┃ ${description.substring(0, 150)}${description.length > 150 ? '...' : ''}\n` +
                     `┃\n` +
                     `┃ ⚙️ ${toBold("Settings:")}\n` +
                     `┃   🔒 ${toBold("Restrict:")} ${restrict}\n` +
                     `┃   📢 ${toBold("Announce:")} ${announce}\n` +
                     `┃   🚫 ${toBold("No Forward:")} ${noFwd}\n` +
                     `┃   🔗 ${toBold("Join Mode:")} ${joinMode}\n` +
                     `┃\n` +
                     `┃ 🔗 ${toBold("Invite Link:")}\n` +
                     `┃ ${inviteLink}\n` +
                     `┃\n` +
                     `┃ 📊 ${toBold("Stats:")}\n` +
                     `┃   ├ ${toBold("Total:")} ${totalMembers}\n` +
                     `┃   ├ ${toBold("Admins:")} ${admins.length}\n` +
                     `┃   ├ ${toBold("Members:")} ${normalMembers.length}\n` +
                     `┃   └ ${toBold("Bots:")} ${bots}\n` +
                     `┃\n` +
                     `┃ 📋 ${toBold("Admin List:")}\n` +
                     `${adminList || '   No admins'}\n` +
                     `┃\n` +
                     `┃ 💡 ${toBold("Note:")} Group info fetched successfully!\n` +
                     `╰━━━━━━━━━━━━━━━━━━┈⊷`;

        // --- Collect mentions ---
        const mentions = [...admins.map(v => v.id)];
        if (owner !== 'Not found') mentions.push(owner);

        // --- Send Group Info ---
        await sock.sendMessage(chatId, {
            image: { url: pp },
            caption: text,
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
        });

        // --- Send success reaction ---
        await sock.sendMessage(chatId, { 
            react: { text: '✅', key: msg.key } 
        });

    } catch (error) {
        console.error('Error in groupinfo command:', error);
        await sock.sendMessage(chatId, { 
            text: `❌ *Error Occurred!*\n\n` +
                  `Error: ${error.message}\n` +
                  `💡 Make sure I am an admin with proper permissions.`
        });
        await sock.sendMessage(chatId, { 
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

module.exports = groupInfoCommand;