const { downloadContentFromMessage, jidNormalizedUser } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
const TEMP_DIR = path.join(__dirname, '../tmp/status');
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// --- HELPER: Format Date ---
const formatDate = (date) => {
    return date.toLocaleString('en-PK', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
};

// --- HELPER: Get Random Emoji ---
const getRandomEmoji = () => {
    const emojis = ['❤️', '🔥', '✨', '✅', '🙌', '🌟', '💯', '👏', '🎉', '😍', '🤩', '💪', '👀', '🤗', '🥰'];
    return emojis[Math.floor(Math.random() * emojis.length)];
};

// --- HELPER: Get File Extension ---
const getFileExtension = (mimeType) => {
    const map = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'video/mp4': '.mp4',
        'video/3gpp': '.3gp',
        'audio/mpeg': '.mp3',
        'audio/mp4': '.m4a',
        'audio/ogg': '.ogg'
    };
    return map[mimeType] || '.bin';
};

// --- MAIN STATUS HANDLER ---
async function handleStatusUpdate(sock, m, botData, userId) {
    try {
        // Ensure settings exist and autoStatus is enabled
        if (!botData.statusSettings) {
            botData.statusSettings = {};
        }
        
        const settings = botData.statusSettings[userId];
        if (!settings || !settings.autoStatus) return;

        const ownerJid = jidNormalizedUser(sock.user.id);
        const timestamp = new Date();

        for (const msg of m.messages) {
            // Ensure message is a status update
            if (msg.key && (msg.key.remoteJid === 'status@broadcast' || msg.broadcast)) {
                const participant = msg.key.participant || msg.participant;
                if (!participant) continue;

                const pushName = msg.pushName || 'Unknown';
                const senderNumber = participant.split('@')[0];
                const isOwnStatus = participant === ownerJid;

                // --- Skip own status if configured ---
                if (isOwnStatus && settings.skipOwn) continue;

                // --- 1. AUTO SEEN ---
                if (settings.autoSeen) {
                    try {
                        await sock.readMessages([msg.key]);
                        console.log(`✅ Status seen from ${senderNumber}`);
                    } catch (e) {
                        console.error('Auto Seen Error:', e.message);
                    }
                }

                // --- 2. AUTO LIKE (REACTION) ---
                if (settings.autoLike) {
                    try {
                        const emoji = getRandomEmoji();
                        await sock.relayMessage('status@broadcast', {
                            reactionMessage: {
                                key: {
                                    remoteJid: 'status@broadcast',
                                    id: msg.key.id,
                                    participant: participant,
                                    fromMe: false
                                },
                                text: emoji
                            }
                        }, { 
                            messageId: msg.key.id, 
                            statusJidList: [participant] 
                        });
                        console.log(`✅ Status liked from ${senderNumber} with ${emoji}`);
                    } catch (e) {
                        console.error('Auto Like Error:', e.message);
                    }
                }

                // --- 3. AUTO REPLY ---
                if (settings.autoReply && settings.replyMessage) {
                    try {
                        await sock.sendMessage(participant, {
                            text: settings.replyMessage
                        }, { quoted: msg });
                        console.log(`✅ Status replied to ${senderNumber}`);
                    } catch (e) {
                        console.error('Auto Reply Error:', e.message);
                    }
                }

                // --- 4. AUTO FORWARD ---
                if (settings.autoForward && settings.forwardTo) {
                    try {
                        const messageContent = getMessageContent(msg);
                        if (messageContent) {
                            await sock.sendMessage(settings.forwardTo, {
                                text: `📤 *Forwarded Status*\n👤 From: ${pushName}\n📱 Number: ${senderNumber}\n🕐 ${formatDate(timestamp)}`
                            });
                            
                            // Forward media if exists
                            if (messageContent.type !== 'text') {
                                await forwardMedia(sock, settings.forwardTo, messageContent, pushName, senderNumber);
                            }
                        }
                    } catch (e) {
                        console.error('Auto Forward Error:', e.message);
                    }
                }

                // --- 5. AUTO DOWNLOAD ---
                if (settings.autoDownload) {
                    try {
                        const messageContent = getMessageContent(msg);
                        if (messageContent && messageContent.type !== 'text') {
                            const mediaBuffer = await downloadMedia(messageContent);
                            const caption = `📥 *Status Downloaded*\n` +
                                          `👤 *From:* ${pushName}\n` +
                                          `📱 *Number:* ${senderNumber}\n` +
                                          `💬 *Caption:* ${messageContent.caption || 'No caption'}\n` +
                                          `🕐 ${formatDate(timestamp)}`;

                            if (messageContent.type === 'image') {
                                await sock.sendMessage(ownerJid, { 
                                    image: mediaBuffer, 
                                    caption: caption,
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
                            } else if (messageContent.type === 'video') {
                                await sock.sendMessage(ownerJid, { 
                                    video: mediaBuffer, 
                                    caption: caption,
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
                            } else if (messageContent.type === 'audio') {
                                await sock.sendMessage(ownerJid, { 
                                    audio: mediaBuffer, 
                                    mimetype: 'audio/mp4',
                                    caption: caption,
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
                            } else if (messageContent.type === 'sticker') {
                                await sock.sendMessage(ownerJid, { 
                                    sticker: mediaBuffer,
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
                            }

                            console.log(`✅ Status downloaded from ${senderNumber}`);
                            
                            // Save to local if configured
                            if (settings.saveLocal) {
                                await saveMediaLocal(mediaBuffer, messageContent, senderNumber, timestamp);
                            }
                        } else if (messageContent && messageContent.type === 'text') {
                            const text = messageContent.text;
                            const caption = `📥 *Status Text Downloaded*\n` +
                                          `👤 *From:* ${pushName}\n` +
                                          `📱 *Number:* ${senderNumber}\n` +
                                          `🕐 ${formatDate(timestamp)}\n\n` +
                                          `*Content:* ${text}`;
                            await sock.sendMessage(ownerJid, { text: caption });
                            console.log(`✅ Status text downloaded from ${senderNumber}`);
                        }
                    } catch (e) {
                        console.error('Auto Download Error:', e.message);
                    }
                }

                // --- 6. AUTO LOG ---
                if (settings.autoLog) {
                    try {
                        if (!botData.statusLogs) botData.statusLogs = [];
                        botData.statusLogs.push({
                            from: senderNumber,
                            name: pushName,
                            timestamp: timestamp.toISOString(),
                            type: getMessageContent(msg)?.type || 'unknown'
                        });
                        
                        // Keep only last 100 logs
                        if (botData.statusLogs.length > 100) {
                            botData.statusLogs = botData.statusLogs.slice(-100);
                        }
                    } catch (e) {
                        console.error('Auto Log Error:', e.message);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error in handleStatusUpdate:', error);
    }
}

// --- HELPER: Get Message Content ---
function getMessageContent(msg) {
    try {
        const messageContent = msg.message?.ephemeralMessage?.message || 
                             msg.message?.viewOnceMessage?.message || 
                             msg.message?.viewOnceMessageV2?.message || 
                             msg.message?.viewOnceMessageV2Extension?.message ||
                             msg.message;
        
        if (!messageContent) return null;

        // Check for image
        if (messageContent.imageMessage) {
            return {
                type: 'image',
                data: messageContent.imageMessage,
                caption: messageContent.imageMessage.caption || ''
            };
        }
        
        // Check for video
        if (messageContent.videoMessage) {
            return {
                type: 'video',
                data: messageContent.videoMessage,
                caption: messageContent.videoMessage.caption || ''
            };
        }
        
        // Check for audio
        if (messageContent.audioMessage) {
            return {
                type: 'audio',
                data: messageContent.audioMessage,
                caption: 'Audio Status'
            };
        }
        
        // Check for sticker
        if (messageContent.stickerMessage) {
            return {
                type: 'sticker',
                data: messageContent.stickerMessage,
                caption: 'Sticker Status'
            };
        }
        
        // Check for text
        if (messageContent.conversation) {
            return {
                type: 'text',
                text: messageContent.conversation
            };
        }
        
        if (messageContent.extendedTextMessage?.text) {
            return {
                type: 'text',
                text: messageContent.extendedTextMessage.text
            };
        }
        
        return null;
    } catch (error) {
        console.error('Error getting message content:', error);
        return null;
    }
}

// --- HELPER: Download Media ---
async function downloadMedia(messageContent) {
    try {
        const type = messageContent.type;
        const data = messageContent.data;
        
        if (!data) return null;
        
        const stream = await downloadContentFromMessage(data, type);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        return buffer;
    } catch (error) {
        console.error('Error downloading media:', error);
        return null;
    }
}

// --- HELPER: Forward Media ---
async function forwardMedia(sock, to, messageContent, pushName, senderNumber) {
    try {
        const mediaBuffer = await downloadMedia(messageContent);
        if (!mediaBuffer) return;
        
        const caption = `📤 *Forwarded Status*\n👤 From: ${pushName}\n📱 Number: ${senderNumber}`;
        
        if (messageContent.type === 'image') {
            await sock.sendMessage(to, { image: mediaBuffer, caption });
        } else if (messageContent.type === 'video') {
            await sock.sendMessage(to, { video: mediaBuffer, caption });
        } else if (messageContent.type === 'audio') {
            await sock.sendMessage(to, { audio: mediaBuffer, mimetype: 'audio/mp4', caption });
        } else if (messageContent.type === 'sticker') {
            await sock.sendMessage(to, { sticker: mediaBuffer });
        }
    } catch (error) {
        console.error('Error forwarding media:', error);
    }
}

// --- HELPER: Save Media Locally ---
async function saveMediaLocal(buffer, messageContent, senderNumber, timestamp) {
    try {
        const ext = getFileExtension(messageContent.data.mimetype);
        const filename = `${senderNumber}_${timestamp.getTime()}${ext}`;
        const filepath = path.join(TEMP_DIR, filename);
        fs.writeFileSync(filepath, buffer);
        console.log(`✅ Status saved locally: ${filename}`);
    } catch (error) {
        console.error('Error saving media locally:', error);
    }
}

module.exports = { handleStatusUpdate };