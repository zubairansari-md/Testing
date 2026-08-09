const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { writeFile } = require('fs/promises');

const messageStore = new Map();
const CONFIG_PATH = path.join(__dirname, '../data/antidelete.json');
const TEMP_MEDIA_DIR = path.join(__dirname, '../tmp');

// --- HELPER FUNCTIONS ---
const toBold = (text) => {
    const boldChars = {
        'a': '𝗮', 'b': '𝗯', 'c': '𝗰', 'd': '𝗱', 'e': '𝗲', 'f': '𝗳', 'g': '𝗴', 'h': '𝗵', 'i': '𝗶', 'j': '𝗷', 'k': '𝗸', 'l': '𝗹', 'm': '𝗺', 'n': '𝗻', 'o': '𝗼', 'p': '𝗽', 'q': '𝗾', 'r': '𝗿', 's': '𝘀', 't': '𝘁', 'u': '𝘂', 'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇',
        'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚', 'H': '𝗛', 'I': '𝗜', 'J': '𝗝', 'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡', 'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝘀', 't': '𝘁', 'u': '𝘂', 'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇',
        '0': '𝟬', '1': '𝟭', '2': '𝟮', '3': '𝟯', '4': '𝟰', '5': '𝟱', '6': '𝟲', '7': '𝟳', '8': '𝟴', '9': '𝟵'
    };
    return text.split('').map(c => boldChars[c] || c).join('');
};

// Ensure tmp dir exists
if (!fs.existsSync(TEMP_MEDIA_DIR)) {
    fs.mkdirSync(TEMP_MEDIA_DIR, { recursive: true });
}

// --- FOLDER MANAGEMENT ---
const getFolderSizeInMB = (folderPath) => {
    try {
        const files = fs.readdirSync(folderPath);
        let totalSize = 0;
        for (const file of files) {
            const filePath = path.join(folderPath, file);
            if (fs.statSync(filePath).isFile()) {
                totalSize += fs.statSync(filePath).size;
            }
        }
        return totalSize / (1024 * 1024);
    } catch (err) {
        return 0;
    }
};

const cleanTempFolderIfLarge = () => {
    try {
        if (getFolderSizeInMB(TEMP_MEDIA_DIR) > 100) {
            const files = fs.readdirSync(TEMP_MEDIA_DIR);
            for (const file of files) {
                fs.unlinkSync(path.join(TEMP_MEDIA_DIR, file));
            }
        }
    } catch (err) {}
};

setInterval(cleanTempFolderIfLarge, 60 * 1000);

// --- CONFIG MANAGEMENT ---
function loadAntideleteConfig() {
    try {
        if (!fs.existsSync(CONFIG_PATH)) {
            return { 
                enabled: false, 
                logChannel: null,
                notifyDeleters: false,
                saveMedia: true,
                autoDeleteAfter: 3600,
                allowedGroups: [],
                ignoredUsers: [],
                actionOnDelete: 'log' // log, warn, kick, block
            };
        }
        return JSON.parse(fs.readFileSync(CONFIG_PATH));
    } catch {
        return { 
            enabled: false, 
            logChannel: null,
            notifyDeleters: false,
            saveMedia: true,
            autoDeleteAfter: 3600,
            allowedGroups: [],
            ignoredUsers: [],
            actionOnDelete: 'log'
        };
    }
}

function saveAntideleteConfig(config) {
    try {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    } catch (err) {}
}

// --- MAIN COMMAND HANDLER ---
async function handleAntideleteCommand(sock, chatId, message, isAdmin, botData, saveBotData, userId, args) {
    const config = loadAntideleteConfig();
    const match = args[0]?.toLowerCase();

    // --- HELP MENU ---
    if (!match || match === 'help') {
        return sock.sendMessage(chatId, {
            text: `╭━━━〔 ${toBold("ANTI-DELETE COMMANDS")} 〕━━━┈⊷\n` +
                   `┃\n` +
                   `┃ ⋄ ${toBold(".antidelete on")} - Enable protection\n` +
                   `┃ ⋄ ${toBold(".antidelete off")} - Disable protection\n` +
                   `┃ ⋄ ${toBold(".antidelete status")} - Check status\n` +
                   `┃ ⋄ ${toBold(".antidelete action [log/warn/kick/block]")} - Set action\n` +
                   `┃ ⋄ ${toBold(".antidelete channel [jid]")} - Set log channel\n` +
                   `┃ ⋄ ${toBold(".antidelete notify on/off")} - Notify deleters\n` +
                   `┃ ⋄ ${toBold(".antidelete group add/remove [jid]")} - Manage groups\n` +
                   `┃ ⋄ ${toBold(".antidelete ignore add/remove [jid]")} - Ignore users\n` +
                   `┃ ⋄ ${toBold(".antidelete stats")} - Show statistics\n` +
                   `┃ ⋄ ${toBold(".antidelete clear")} - Clear stored messages\n` +
                   `┃\n` +
                   `┃ 📊 ${toBold("Current Status:")} ${config.enabled ? '✅ Active' : '❌ Inactive'}\n` +
                   `┃ ⚡ ${toBold("Action:")} ${config.actionOnDelete || 'log'}\n` +
                   `┃ 📁 ${toBold("Stored:")} ${messageStore.size} messages\n` +
                   `╰━━━━━━━━━━━━━━━━━━┈⊷`
        }, { quoted: message });
    }

    // --- ENABLE ---
    if (match === 'on') {
        config.enabled = true;
        saveAntideleteConfig(config);
        return sock.sendMessage(chatId, { 
            text: `✅ *Anti-Delete Enabled!*\n\n` +
                  `🛡️ Protection activated\n` +
                  `⚡ Action: ${config.actionOnDelete || 'log'}\n` +
                  `📊 Monitoring all messages...` 
        }, { quoted: message });
    }

    // --- DISABLE ---
    if (match === 'off') {
        config.enabled = false;
        saveAntideleteConfig(config);
        return sock.sendMessage(chatId, { 
            text: `❌ *Anti-Delete Disabled!*\n\n` +
                  `🔓 Protection deactivated\n` +
                  `💤 No longer monitoring messages` 
        }, { quoted: message });
    }

    // --- STATUS ---
    if (match === 'status') {
        const status = config.enabled ? '✅ Active' : '❌ Inactive';
        const action = config.actionOnDelete || 'log';
        const stored = messageStore.size;
        const groups = config.allowedGroups || [];
        const ignored = config.ignoredUsers || [];
        
        return sock.sendMessage(chatId, { 
            text: `📊 *Anti-Delete Status*\n\n` +
                  `🔹 Status: ${status}\n` +
                  `🔹 Action: ${action}\n` +
                  `🔹 Stored Messages: ${stored}\n` +
                  `🔹 Allowed Groups: ${groups.length}\n` +
                  `🔹 Ignored Users: ${ignored.length}\n` +
                  `🔹 Media Storage: ${getFolderSizeInMB(TEMP_MEDIA_DIR).toFixed(2)}MB\n` +
                  `🔹 Log Channel: ${config.logChannel || 'Not set'}`
        }, { quoted: message });
    }

    // --- SET ACTION ---
    if (match === 'action') {
        const actionType = args[1]?.toLowerCase();
        if (!['log', 'warn', 'kick', 'block'].includes(actionType)) {
            return sock.sendMessage(chatId, { 
                text: "❌ Invalid action!\n" +
                      "📌 Available: log, warn, kick, block\n" +
                      "💡 log = Just log deletion\n" +
                      "💡 warn = Warn the deleter\n" +
                      "💡 kick = Remove from group\n" +
                      "💡 block = Block the user" 
            }, { quoted: message });
        }

        config.actionOnDelete = actionType;
        saveAntideleteConfig(config);
        return sock.sendMessage(chatId, { 
            text: `✅ *Action Updated*\n\n` +
                  `⚡ New Action: ${actionType}\n` +
                  `📞 Deleters will be ${actionType === 'log' ? 'logged' : 'treated with ' + actionType}` 
        }, { quoted: message });
    }

    // --- SET LOG CHANNEL ---
    if (match === 'channel') {
        const channelJid = args[1];
        if (!channelJid) {
            return sock.sendMessage(chatId, { 
                text: "❌ Please provide a channel JID.\n" +
                      "📌 Example: .antidelete channel 1234567890@g.us" 
            }, { quoted: message });
        }

        config.logChannel = channelJid;
        saveAntideleteConfig(config);
        return sock.sendMessage(chatId, { 
            text: `✅ *Log Channel Set*\n\n` +
                  `📁 Channel: ${channelJid}\n` +
                  `📊 All logs will be sent here` 
        }, { quoted: message });
    }

    // --- NOTIFY DELETERS ---
    if (match === 'notify') {
        const mode = args[1]?.toLowerCase();
        if (!['on', 'off'].includes(mode)) {
            return sock.sendMessage(chatId, { 
                text: "❌ Usage: .antidelete notify [on/off]" 
            }, { quoted: message });
        }

        config.notifyDeleters = mode === 'on';
        saveAntideleteConfig(config);
        return sock.sendMessage(chatId, { 
            text: `${mode === 'on' ? '✅' : '❌'} *Notification ${mode === 'on' ? 'Enabled' : 'Disabled'}*\n\n` +
                  `${mode === 'on' ? '🔔 Deleters will be notified' : '🔕 Deleters will not be notified'}` 
        }, { quoted: message });
    }

    // --- MANAGE GROUPS ---
    if (match === 'group') {
        const action = args[1]?.toLowerCase();
        const groupJid = args[2];
        
        if (!['add', 'remove'].includes(action) || !groupJid) {
            return sock.sendMessage(chatId, { 
                text: "❌ Usage: .antidelete group [add/remove] [jid]" 
            }, { quoted: message });
        }

        if (!config.allowedGroups) config.allowedGroups = [];
        
        if (action === 'add') {
            if (!config.allowedGroups.includes(groupJid)) {
                config.allowedGroups.push(groupJid);
            }
        } else {
            config.allowedGroups = config.allowedGroups.filter(g => g !== groupJid);
        }
        
        saveAntideleteConfig(config);
        return sock.sendMessage(chatId, { 
            text: `✅ *Group ${action === 'add' ? 'Added' : 'Removed'}*\n\n` +
                  `📌 Group: ${groupJid}\n` +
                  `📊 Total Groups: ${config.allowedGroups.length}` 
        }, { quoted: message });
    }

    // --- IGNORE USERS ---
    if (match === 'ignore') {
        const action = args[1]?.toLowerCase();
        const userJid = args[2];
        
        if (!['add', 'remove'].includes(action) || !userJid) {
            return sock.sendMessage(chatId, { 
                text: "❌ Usage: .antidelete ignore [add/remove] [jid]" 
            }, { quoted: message });
        }

        if (!config.ignoredUsers) config.ignoredUsers = [];
        
        if (action === 'add') {
            if (!config.ignoredUsers.includes(userJid)) {
                config.ignoredUsers.push(userJid);
            }
        } else {
            config.ignoredUsers = config.ignoredUsers.filter(u => u !== userJid);
        }
        
        saveAntideleteConfig(config);
        return sock.sendMessage(chatId, { 
            text: `✅ *User ${action === 'add' ? 'Ignored' : 'Unignored'}*\n\n` +
                  `👤 User: ${userJid}\n` +
                  `📊 Total Ignored: ${config.ignoredUsers.length}` 
        }, { quoted: message });
    }

    // --- STATS ---
    if (match === 'stats') {
        const stats = {
            total: messageStore.size,
            textMessages: 0,
            mediaMessages: 0,
            groups: new Set(),
            users: new Set()
        };

        for (const [_, data] of messageStore) {
            if (data.mediaType) stats.mediaMessages++;
            else stats.textMessages++;
            if (data.group) stats.groups.add(data.group);
            stats.users.add(data.sender);
        }

        return sock.sendMessage(chatId, { 
            text: `📊 *Anti-Delete Statistics*\n\n` +
                  `📝 Total Messages: ${stats.total}\n` +
                  `📄 Text: ${stats.textMessages}\n` +
                  `🖼️ Media: ${stats.mediaMessages}\n` +
                  `👥 Groups: ${stats.groups.size}\n` +
                  `👤 Users: ${stats.users.size}\n` +
                  `💾 Storage: ${getFolderSizeInMB(TEMP_MEDIA_DIR).toFixed(2)}MB\n` +
                  `🔄 Auto-Clean: ${getFolderSizeInMB(TEMP_MEDIA_DIR) > 100 ? 'Running' : 'Idle'}`
        }, { quoted: message });
    }

    // --- CLEAR ---
    if (match === 'clear') {
        const count = messageStore.size;
        messageStore.clear();
        
        // Clear temp folder
        try {
            const files = fs.readdirSync(TEMP_MEDIA_DIR);
            for (const file of files) {
                fs.unlinkSync(path.join(TEMP_MEDIA_DIR, file));
            }
        } catch (err) {}
        
        return sock.sendMessage(chatId, { 
            text: `🧹 *Cleared Stored Messages*\n\n` +
                  `🗑️ Removed: ${count} messages\n` +
                  `💾 Freed: ${getFolderSizeInMB(TEMP_MEDIA_DIR).toFixed(2)}MB` 
        }, { quoted: message });
    }

    return sock.sendMessage(chatId, { 
        text: "❌ Invalid command! Use .antidelete for help." 
    }, { quoted: message });
}

// --- STORE MESSAGE ---
async function storeMessage(message) {
    try {
        const config = loadAntideleteConfig();
        if (!config.enabled || !message.key?.id) return;

        const messageId = message.key.id;
        let content = '';
        let mediaType = '';
        let mediaPath = '';
        const sender = message.key.participant || message.key.remoteJid;
        const group = message.key.remoteJid.endsWith('@g.us') ? message.key.remoteJid : null;

        // Check if group is allowed
        if (group && config.allowedGroups && config.allowedGroups.length > 0) {
            if (!config.allowedGroups.includes(group)) return;
        }

        // Check if user is ignored
        if (config.ignoredUsers && config.ignoredUsers.includes(sender)) return;

        const msg = message.message?.ephemeralMessage?.message || 
                    message.message?.viewOnceMessage?.message || 
                    message.message?.viewOnceMessageV2?.message || 
                    message.message;

        if (!msg) return;

        // Extract message content
        if (msg.conversation) {
            content = msg.conversation;
        } else if (msg.extendedTextMessage?.text) {
            content = msg.extendedTextMessage.text;
        } else if (msg.imageMessage) {
            mediaType = 'image';
            content = msg.imageMessage.caption || '';
            if (config.saveMedia !== false) {
                const buffer = await downloadContentFromMessage(msg.imageMessage, 'image');
                mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.jpg`);
                await writeFile(mediaPath, buffer);
            }
        } else if (msg.stickerMessage) {
            mediaType = 'sticker';
            if (config.saveMedia !== false) {
                const buffer = await downloadContentFromMessage(msg.stickerMessage, 'sticker');
                mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.webp`);
                await writeFile(mediaPath, buffer);
            }
        } else if (msg.videoMessage) {
            mediaType = 'video';
            content = msg.videoMessage.caption || '';
            if (config.saveMedia !== false) {
                const buffer = await downloadContentFromMessage(msg.videoMessage, 'video');
                mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.mp4`);
                await writeFile(mediaPath, buffer);
            }
        } else if (msg.audioMessage) {
            mediaType = 'audio';
            if (config.saveMedia !== false) {
                const buffer = await downloadContentFromMessage(msg.audioMessage, 'audio');
                mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.mp3`);
                await writeFile(mediaPath, buffer);
            }
        } else if (msg.documentMessage) {
            mediaType = 'document';
            content = msg.documentMessage.fileName || 'Document';
            if (config.saveMedia !== false) {
                const buffer = await downloadContentFromMessage(msg.documentMessage, 'document');
                const ext = path.extname(msg.documentMessage.fileName || 'file');
                mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}${ext}`);
                await writeFile(mediaPath, buffer);
            }
        }

        messageStore.set(messageId, {
            content,
            mediaType,
            mediaPath,
            sender,
            group,
            timestamp: new Date().toISOString(),
            message: msg
        });

        // Auto-delete old messages
        if (config.autoDeleteAfter && config.autoDeleteAfter > 0) {
            setTimeout(() => {
                if (messageStore.has(messageId)) {
                    const data = messageStore.get(messageId);
                    if (data.mediaPath && fs.existsSync(data.mediaPath)) {
                        try { fs.unlinkSync(data.mediaPath); } catch (err) {}
                    }
                    messageStore.delete(messageId);
                }
            }, config.autoDeleteAfter * 1000);
        }

    } catch (err) {
        console.error('Store message error:', err);
    }
}

// --- HANDLE MESSAGE REVOCATION ---
async function handleMessageRevocation(sock, revocationMessage) {
    try {
        const config = loadAntideleteConfig();
        if (!config.enabled) return;

        const messageId = revocationMessage.message.protocolMessage.key.id;
        const deletedBy = revocationMessage.participant || revocationMessage.key.participant || revocationMessage.key.remoteJid;
        const ownerNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const isOwner = deletedBy === ownerNumber;

        if (isOwner) return;

        const original = messageStore.get(messageId);
        if (!original) return;

        const sender = original.sender;
        const senderName = sender.split('@')[0];
        const deleterName = deletedBy.split('@')[0];
        const group = original.group;

        // --- BUILD REPORT ---
        let report = `╭━━━〔 ${toBold("ANTI-DELETE REPORT")} 〕━━━┈⊷\n` +
                     `┃ 👤 ${toBold("Sender:")} @${senderName}\n` +
                     `┃ 🗑️ ${toBold("Deleted By:")} @${deleterName}\n` +
                     `┃ 🕒 ${toBold("Time:")} ${new Date().toLocaleString()}\n` +
                     `┃ 📂 ${toBold("Type:")} ${original.mediaType || 'Text'}\n`;

        if (group) {
            report += `┃ 📌 ${toBold("Group:")} ${group.split('@')[0]}\n`;
        }

        report += `╰━━━━━━━━━━━━━━━━━━┈⊷\n\n`;

        if (original.content) {
            const maxLength = 500;
            const content = original.content.length > maxLength ? 
                original.content.substring(0, maxLength) + '...' : 
                original.content;
            report += `📝 ${toBold("Message:")}\n${content}`;
        }

        // --- SEND TO LOG CHANNEL ---
        const logJid = config.logChannel || ownerNumber;
        const mentions = [deletedBy, sender];
        
        await sock.sendMessage(logJid, { 
            text: report, 
            mentions: mentions 
        });

        // --- NOTIFY DELETER ---
        if (config.notifyDeleters) {
            await sock.sendMessage(deletedBy, { 
                text: `⚠️ *Warning!*\n\n` +
                      `You deleted a message from @${senderName} in ${group || 'a group'}.\n` +
                      `Action: ${config.actionOnDelete || 'logged'}`,
                mentions: [sender]
            }).catch(() => {});
        }

        // --- TAKE ACTION ---
        const action = config.actionOnDelete || 'log';
        if (action === 'warn') {
            await sock.sendMessage(group || deletedBy, { 
                text: `⚠️ *Warning to @${deleterName}*\n\n` +
                      `Please do not delete messages in this group.`,
                mentions: [deletedBy]
            }).catch(() => {});
        } else if (action === 'kick' && group) {
            await sock.groupParticipantsUpdate(group, [deletedBy], 'remove')
                .catch(() => {});
        } else if (action === 'block') {
            await sock.updateBlockStatus(deletedBy, 'block')
                .catch(() => {});
        }

        // --- SEND MEDIA ---
        if (original.mediaType && original.mediaPath && fs.existsSync(original.mediaPath)) {
            const mediaOptions = { 
                caption: `*Deleted ${original.mediaType}* from @${senderName}`,
                mentions: [sender]
            };

            try {
                if (original.mediaType === 'image') {
                    await sock.sendMessage(logJid, { image: { url: original.mediaPath }, ...mediaOptions });
                } else if (original.mediaType === 'sticker') {
                    await sock.sendMessage(logJid, { sticker: { url: original.mediaPath }, ...mediaOptions });
                } else if (original.mediaType === 'video') {
                    await sock.sendMessage(logJid, { video: { url: original.mediaPath }, ...mediaOptions });
                } else if (original.mediaType === 'audio') {
                    await sock.sendMessage(logJid, { audio: { url: original.mediaPath }, mimetype: 'audio/mp4', ...mediaOptions });
                } else if (original.mediaType === 'document') {
                    await sock.sendMessage(logJid, { document: { url: original.mediaPath }, ...mediaOptions });
                }
            } catch (err) {}
            
            // Delete file after sending
            setTimeout(() => {
                try { if (fs.existsSync(original.mediaPath)) fs.unlinkSync(original.mediaPath); } catch (err) {}
            }, 5000);
        }

        messageStore.delete(messageId);

    } catch (err) {
        console.error('Handle revocation error:', err);
    }
}

module.exports = handleAntideleteCommand;
module.exports.storeMessage = storeMessage;
module.exports.handleMessageRevocation = handleMessageRevocation;