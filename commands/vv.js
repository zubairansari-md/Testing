const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
const CONFIG = {
    TEMP_DIR: path.join(process.cwd(), 'tmp', 'vv'),
    MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
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

const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return 'Unknown';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
};

const getMediaType = (type) => {
    const types = {
        'imageMessage': 'Image',
        'videoMessage': 'Video',
        'audioMessage': 'Audio',
        'documentMessage': 'Document',
        'stickerMessage': 'Sticker'
    };
    return types[type] || 'Media';
};

const getFileExtension = (type) => {
    const extensions = {
        'imageMessage': '.jpg',
        'videoMessage': '.mp4',
        'audioMessage': '.mp3',
        'documentMessage': '.bin',
        'stickerMessage': '.webp'
    };
    return extensions[type] || '.bin';
};

// --- ENSURE TEMP DIRECTORY ---
if (!fs.existsSync(CONFIG.TEMP_DIR)) {
    fs.mkdirSync(CONFIG.TEMP_DIR, { recursive: true });
}

// --- MAIN COMMAND ---
async function vvCommand(sock, from, msg) {
    try {
        // --- Check if replied ---
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted) {
            return await sock.sendMessage(from, { 
                text: `❌ *No Message Replied!*\n\nPlease reply to a View-Once message.\n📌 Example: Reply to a view-once media with .vv` 
            }, { quoted: msg });
        }

        // --- Loading Reactions ---
        const loadEmojis = ['⏳', '🔓', '👁️', '📥'];
        for (const emoji of loadEmojis) {
            await sock.sendMessage(from, { react: { text: emoji, key: msg.key } });
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        // --- Extract View-Once Message ---
        const viewOnce = quoted.viewOnceMessageV2 || quoted.viewOnceMessage || quoted;
        const message = viewOnce?.message || viewOnce;

        // --- Get Media Type ---
        let vType = Object.keys(message).find(key => 
            ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'].includes(key)
        );

        if (!vType) {
            return await sock.sendMessage(from, { 
                text: `❌ *Not a View-Once Media!*\n\nThis is not a view-once message.\n💡 Reply to a view-once image, video, or audio.` 
            }, { quoted: msg });
        }

        // --- Get Media Metadata ---
        const media = message[vType];
        const mediaType = getMediaType(vType);
        const fileSize = media.fileLength || media.size || 0;
        const mimeType = media.mimetype || 'application/octet-stream';
        const caption = media.caption || 'No caption';

        // --- Get Sender Info ---
        const sender = msg.key?.participant || msg.key?.remoteJid || 'Unknown';
        const senderName = sender.split('@')[0];

        // --- Send Processing Message ---
        await sock.sendMessage(from, {
            text: `🔓 *View-Once Detected!*\n\n` +
                  `📂 ${toBold("Type:")} ${mediaType}\n` +
                  `📏 ${toBold("Size:")} ${formatSize(fileSize)}\n` +
                  `📝 ${toBold("Caption:")} ${caption || 'No caption'}\n` +
                  `👤 ${toBold("From:")} @${senderName}\n` +
                  `\n⏳ Downloading...`,
            mentions: [sender]
        }, { quoted: msg });

        // --- Download Media ---
        try {
            const stream = await downloadContentFromMessage(media, vType.replace('Message', ''));
            let buffer = Buffer.from([]);
            let downloadedSize = 0;

            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
                downloadedSize += chunk.length;
                
                // Check file size limit
                if (buffer.length > CONFIG.MAX_FILE_SIZE) {
                    throw new Error('File size exceeds limit');
                }
            }

            // --- Save to temp (optional) ---
            const timestamp = Date.now();
            const extension = getFileExtension(vType);
            const tempFile = path.join(CONFIG.TEMP_DIR, `vv_${timestamp}${extension}`);
            fs.writeFileSync(tempFile, buffer);

            // --- Build Caption ---
            const finalCaption = `╭━━━〔 ${toBold("✅ VIEW-ONCE DOWNLOADED")} 〕━━━┈⊷\n` +
                                `┃\n` +
                                `┃ 📂 ${toBold("Type:")} ${mediaType}\n` +
                                `┃ 📏 ${toBold("Size:")} ${formatSize(buffer.length)}\n` +
                                `┃ 📝 ${toBold("Caption:")} ${caption || 'No caption'}\n` +
                                `┃ 👤 ${toBold("From:")} @${senderName}\n` +
                                `┃ 🕐 ${toBold("Downloaded:")} ${new Date().toLocaleString()}\n` +
                                `┃\n` +
                                `┃ 💡 ${toBold("Downloaded By:")} TEAM-ZUBAIR-MD\n` +
                                `╰━━━━━━━━━━━━━━━━━━┈⊷`;

            // --- Send Media ---
            if (vType === 'imageMessage') {
                await sock.sendMessage(from, { 
                    image: buffer, 
                    caption: finalCaption,
                    mentions: [sender],
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
            else if (vType === 'videoMessage') {
                await sock.sendMessage(from, { 
                    video: buffer, 
                    caption: finalCaption,
                    mentions: [sender],
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
            else if (vType === 'audioMessage') {
                await sock.sendMessage(from, { 
                    audio: buffer, 
                    mimetype: mimeType || 'audio/mp4',
                    caption: finalCaption,
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
            else if (vType === 'stickerMessage') {
                await sock.sendMessage(from, { 
                    sticker: buffer,
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
            else if (vType === 'documentMessage') {
                const fileName = media.fileName || 'document' + getFileExtension(vType);
                await sock.sendMessage(from, { 
                    document: buffer, 
                    mimetype: mimeType,
                    fileName: fileName,
                    caption: finalCaption,
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

            // --- Cleanup temp file ---
            setTimeout(() => {
                try {
                    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
                } catch (err) {}
            }, 5000);

            // --- Success Reaction ---
            await sock.sendMessage(from, { 
                react: { text: '✅', key: msg.key } 
            });

            // --- Send Success Message ---
            await sock.sendMessage(from, {
                text: `✅ *View-Once Downloaded Successfully!*\n\n` +
                      `📂 Type: ${mediaType}\n` +
                      `📏 Size: ${formatSize(buffer.length)}\n` +
                      `👤 From: @${senderName}\n\n` +
                      `💡 Use .vv to download more view-once media!`,
                mentions: [sender]
            }, { quoted: msg });

        } catch (downloadError) {
            console.error('Download error:', downloadError);
            await sock.sendMessage(from, { 
                text: `❌ *Download Failed!*\n\n` +
                      `Error: ${downloadError.message}\n` +
                      `💡 The media might be corrupted or too large.` 
            }, { quoted: msg });
            await sock.sendMessage(from, { 
                react: { text: '❌', key: msg.key } 
            });
        }

    } catch (error) {
        console.error('VV Command Error:', error);
        await sock.sendMessage(from, { 
            text: `❌ *Error Occurred!*\n\nError: ${error.message}\n💡 Please try again later.` 
        }, { quoted: msg });
        await sock.sendMessage(from, { 
            react: { text: '❌', key: msg.key } 
        });
    }
}

module.exports = vvCommand;