async function dpCommand(sock, from, msg) {
    try {
        let target;
        let targetName = 'Unknown';
        
        // --- 1. Get target from mention ---
        if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } 
        // --- 2. Get target from reply ---
        else if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
            target = msg.message.extendedTextMessage.contextInfo.participant;
        } 
        // --- 3. Get target from quoted message ---
        else if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            const quotedMsg = msg.message.extendedTextMessage.contextInfo.quotedMessage;
            if (quotedMsg) {
                target = msg.message.extendedTextMessage.contextInfo.participant || 
                        msg.message.extendedTextMessage.contextInfo.remoteJid;
            }
        }
        // --- 4. Default: User who sent the command (.dp) ---
        else {
            // In group: target is sender (who typed .dp)
            // In DM: target is the other person
            if (from.endsWith('@g.us')) {
                target = msg.key.participant || msg.participant;
            } else {
                target = from;
            }
        }

        // Final fallback to sender
        if (!target) {
            target = msg.key.participant || msg.participant || from;
        }

        // --- Get target name ---
        try {
            const contact = await sock.getContact(target);
            if (contact) {
                targetName = contact.name || contact.verifiedName || contact.notify || target.split('@')[0];
            }
        } catch {}

        // --- Reaction for feedback ---
        await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } });

        // --- Fetch Profile Picture with multiple attempts ---
        let ppUrl;
        let imageType = 'profile';
        
        try {
            // Try fetching high-res image first
            ppUrl = await sock.profilePictureUrl(target, 'image');
            imageType = 'High Quality';
        } catch (e) {
            try {
                // Try fetching preview if high-res fails
                ppUrl = await sock.profilePictureUrl(target, 'preview');
                imageType = 'Preview';
            } catch (e2) {
                try {
                    // Try fetching with different method
                    ppUrl = await sock.profilePictureUrl(target, 'image');
                    imageType = 'Alternative';
                } catch (e3) {
                    // Fallback to default profile icon
                    ppUrl = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';
                    imageType = 'Default';
                }
            }
        }

        // --- Get additional info ---
        const userNumber = target.split('@')[0];
        const isGroup = from.endsWith('@g.us');
        const timestamp = new Date().toLocaleString();

        // --- Build caption ---
        let caption = `╭━━━〔 ${toBold("📸 PROFILE PICTURE")} 〕━━━┈⊷\n` +
                      `┃\n` +
                      `┃ 👤 ${toBold("User:")} ${targetName}\n` +
                      `┃ 📱 ${toBold("Number:")} ${userNumber}\n` +
                      `┃ 📂 ${toBold("Type:")} ${imageType}\n` +
                      `┃ 🕐 ${toBold("Fetched:")} ${timestamp}\n` +
                      `┃\n` +
                      `┃ 💡 ${toBold("Tip:")} Use .dp @user to see others DP!\n` +
                      `╰━━━━━━━━━━━━━━━━━━┈⊷`;

        // --- Send DP ---
        await sock.sendMessage(from, { 
            image: { url: ppUrl }, 
            caption: caption,
            mentions: [target],
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

        // --- Success reaction ---
        await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });

        // --- Send DP as document (HD) if available ---
        if (imageType === 'High Quality') {
            try {
                const response = await fetch(ppUrl);
                const buffer = await response.arrayBuffer();
                await sock.sendMessage(from, {
                    document: Buffer.from(buffer),
                    mimetype: 'image/jpeg',
                    fileName: `dp_${userNumber}.jpg`,
                    caption: `📸 *HD Profile Picture*\n👤 ${targetName}`,
                    mentions: [target]
                });
            } catch (e) {
                // Silent fail for document send
            }
        }

    } catch (e) {
        console.error("DP Command Error:", e);
        await sock.sendMessage(from, { 
            text: `❌ *Error Occurred!*\n\n` +
                  `Error: ${e.message}\n` +
                  `💡 Please try again later.`,
            react: { text: '❌', key: msg.key }
        }, { quoted: msg });
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

module.exports = dpCommand;