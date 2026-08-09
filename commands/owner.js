const settings = require('../settings');

// --- CONFIGURATION ---
const CONFIG = {
    OFFICIAL_CHANNEL: 'https://whatsapp.com/channel/0029VbDLF614NVidqsqjqV2z',
    WEBSITE: 'https://underconstructed',
    GITHUB: 'https://github.com/bichuxboy-crypto',
    INSTAGRAM: 'https://instagram.com/bichuxboy',
    YOUTUBE: 'https://youtube.com/@bichuxbou',
    TIKTOK: 'https://tiktok.com/@xofficialboy'
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

// --- MAIN COMMAND ---
async function ownerCommand(sock, from, msg, args = []) {
    try {
        const action = args[0]?.toLowerCase();

        // --- HELP MENU ---
        if (action === 'help') {
            return await sock.sendMessage(from, {
                text: `╭━━━〔 ${toBold("👤 OWNER COMMANDS")} 〕━━━┈⊷\n` +
                      `┃\n` +
                      `┃ 📌 ${toBold("Usage:")}\n` +
                      `┃ .owner              - Show owner info\n` +
                      `┃ .owner social       - Show social links\n` +
                      `┃ .owner channel      - Show channel link\n` +
                      `┃ .owner help         - Show help\n` +
                      `┃\n` +
                      `┃ 📌 ${toBold("Examples:")}\n` +
                      `┃ .owner\n` +
                      `┃ .owner social\n` +
                      `┃ .owner channel\n` +
                      `┃\n` +
                      `┃ 💡 ${toBold("Tip:")} Contact owner for support!\n` +
                      `╰━━━━━━━━━━━━━━━━━━┈⊷`
            }, { quoted: msg });
        }

        // --- SOCIAL LINKS ---
        if (action === 'social' || action === 'links') {
            const socialText = `╭━━━〔 ${toBold("🌐 SOCIAL LINKS")} 〕━━━┈⊷\n` +
                              `┃\n` +
                              `┃ 📌 ${toBold("Official Channel:")}\n` +
                              `┃ ${CONFIG.OFFICIAL_CHANNEL}\n` +
                              `┃\n` +
                              `┃ 📌 ${toBold("Website:")}\n` +
                              `┃ ${CONFIG.WEBSITE}\n` +
                              `┃\n` +
                              `┃ 📌 ${toBold("GitHub:")}\n` +
                              `┃ ${CONFIG.GITHUB}\n` +
                              `┃\n` +
                              `┃ 📌 ${toBold("Instagram:")}\n` +
                              `┃ ${CONFIG.INSTAGRAM}\n` +
                              `┃\n` +
                              `┃ 📌 ${toBold("YouTube:")}\n` +
                              `┃ ${CONFIG.YOUTUBE}\n` +
                              `┃\n` +
                              `┃ 📌 ${toBold("TikTok:")}\n` +
                              `┃ ${CONFIG.TIKTOK}\n` +
                              `┃\n` +
                              `┃ 💡 ${toBold("Follow for updates!")}\n` +
                              `╰━━━━━━━━━━━━━━━━━━┈⊷`;

            return await sock.sendMessage(from, { 
                text: socialText,
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
        }

        // --- CHANNEL LINK ONLY ---
        if (action === 'channel' || action === 'link') {
            const channelText = `╭━━━〔 ${toBold("📢 OFFICIAL CHANNEL")} 〕━━━┈⊷\n` +
                               `┃\n` +
                               `┃ 🔗 ${toBold("WhatsApp Channel:")}\n` +
                               `┃ ${CONFIG.OFFICIAL_CHANNEL}\n` +
                               `┃\n` +
                               `┃ 💡 ${toBold("Join for updates!")}\n` +
                               `╰━━━━━━━━━━━━━━━━━━┈⊷`;

            return await sock.sendMessage(from, { 
                text: channelText,
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
        }

        // --- MAIN OWNER INFO ---
        const ownerNumber = settings.ownerNumber || '9234567890';
        const ownerName = settings.ownerName || 'Team Zubair';
        const timestamp = new Date().toLocaleString();

        // Get bot info
        const botName = settings.botName || 'TEAM-ZUBAIR-MD';
        const botVersion = settings.version || '2.0.0';
        const uptime = process.uptime();
        const uptimeFormatted = formatUptime(uptime);

        // Get memory usage
        const memoryUsage = process.memoryUsage();
        const memoryUsed = (memoryUsage.heapUsed / 1024 / 1024).toFixed(2);
        const memoryTotal = (memoryUsage.heapTotal / 1024 / 1024).toFixed(2);

        const ownerText = `╭━━━〔 ${toBold("👤 BOT OWNER INFO")} 〕━━━┈⊷\n` +
                         `┃\n` +
                         `┃ 👑 ${toBold("Owner:")} ${ownerName}\n` +
                         `┃ 📱 ${toBold("Number:")} +${ownerNumber}\n` +
                         `┃\n` +
                         `┃ 🤖 ${toBold("Bot:")} ${botName}\n` +
                         `┃ 📦 ${toBold("Version:")} ${botVersion}\n` +
                         `┃ ⏱️ ${toBold("Uptime:")} ${uptimeFormatted}\n` +
                         `┃ 💾 ${toBold("Memory:")} ${memoryUsed}MB / ${memoryTotal}MB\n` +
                         `┃\n` +
                         `┃ 📢 ${toBold("Official Channel:")}\n` +
                         `┃ ${CONFIG.OFFICIAL_CHANNEL}\n` +
                         `┃\n` +
                         `┃ 🌐 ${toBold("Social Links:")}\n` +
                         `┃ 📸 Instagram: ${CONFIG.INSTAGRAM}\n` +
                         `┃ 🎵 TikTok: ${CONFIG.TIKTOK}\n` +
                         `┃ 🎥 YouTube: ${CONFIG.YOUTUBE}\n` +
                         `┃ 🐙 GitHub: ${CONFIG.GITHUB}\n` +
                         `┃\n` +
                         `┃ 📌 ${toBold("Commands:")}\n` +
                         `┃ .owner social   - All social links\n` +
                         `┃ .owner channel  - Channel link\n` +
                         `┃ .owner help     - Help menu\n` +
                         `┃\n` +
                         `┃ 💡 ${toBold("Tip:")} Contact for support!\n` +
                         `┃ 🕐 ${toBold("Fetched:")} ${timestamp}\n` +
                         `╰━━━━━━━━━━━━━━━━━━┈⊷`;

        // Send owner info with buttons
        await sock.sendMessage(from, { 
            text: ownerText,
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

        // Send quick buttons
        try {
            const buttons = [
                { buttonId: '.owner social', buttonText: { displayText: '🌐 Social Links' }, type: 1 },
                { buttonId: '.owner channel', buttonText: { displayText: '📢 Channel' }, type: 1 },
                { buttonId: '.menu', buttonText: { displayText: '📋 Menu' }, type: 1 }
            ];

            await sock.sendMessage(from, {
                text: `👤 *Need help?*\n\nClick the buttons below!`,
                buttons: buttons,
                headerType: 1
            }, { quoted: msg });
        } catch (buttonError) {
            // Silent fail for buttons
        }

        // Send reaction
        await sock.sendMessage(from, { 
            react: { text: '👑', key: msg.key } 
        });

    } catch (error) {
        console.error('Owner Command Error:', error);
        
        // Fallback: Simple owner info
        const ownerNumber = settings.ownerNumber || '923*96*3*70*';
        const ownerName = settings.ownerName || 'BICHUXZUBIII';
        
        const fallbackText = `👤 *BOT OWNER:* ${ownerName}\n` +
                           `📱 *NUMBER:* +${ownerNumber}\n` +
                           `📢 *CHANNEL:* ${CONFIG.OFFICIAL_CHANNEL}\n` +
                           `🎵 *TIKTOK:* ${CONFIG.TIKTOK}\n\n` +
                           `> © TEAM-ZUBAIR-MD`;

        await sock.sendMessage(from, { 
            text: fallbackText 
        }, { quoted: msg });
    }
}

// --- HELPER: Format Uptime ---
function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}

module.exports = ownerCommand;