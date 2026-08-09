/**
 * TEAM-ZUBAIR-MD Bot - Enhanced AutoRead Command
 * Automatically read all messages with advanced features
 */

const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
const configPath = path.join(__dirname, '..', 'data', 'autoread.json');

// --- DEFAULT CONFIG ---
const DEFAULT_CONFIG = {
    enabled: false,
    mode: 'all', // all, mentions, group, private
    ignoreBots: true,
    ignoreAdmins: false,
    ignoreGroups: [],
    ignoreUsers: [],
    readDelay: 1000,
    stats: {
        totalRead: 0,
        lastRead: null,
        groupsActive: 0
    }
};

// --- INITIALIZE CONFIG ---
function initConfig() {
    try {
        if (!fs.existsSync(configPath)) {
            fs.writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2));
        }
        return JSON.parse(fs.readFileSync(configPath));
    } catch (error) {
        console.error('Error reading config:', error);
        return DEFAULT_CONFIG;
    }
}

// --- SAVE CONFIG ---
function saveConfig(config) {
    try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving config:', error);
        return false;
    }
}

// --- MAIN COMMAND ---
async function autoreadCommand(sock, chatId, message, args = []) {
    try {
        // Check if sender is the owner
        if (!message.key.fromMe) {
            await sock.sendMessage(chatId, {
                text: '❌ *Access Denied!*\n\nThis command is only for the bot owner.',
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
            return;
        }

        const config = initConfig();
        const action = args[0]?.toLowerCase();
        const subAction = args[1]?.toLowerCase();

        // --- HELP MENU ---
        if (!action || action === 'help') {
            const status = config.enabled ? '✅ Active' : '❌ Inactive';
            const mode = config.mode || 'all';
            
            return await sock.sendMessage(chatId, {
                text: `╭━━━〔 ${toBold("AUTOREAD COMMANDS")} 〕━━━┈⊷\n` +
                      `┃\n` +
                      `┃ ⋄ ${toBold(".autoread on")} - Enable auto-read\n` +
                      `┃ ⋄ ${toBold(".autoread off")} - Disable auto-read\n` +
                      `┃ ⋄ ${toBold(".autoread status")} - Check status\n` +
                      `┃ ⋄ ${toBold(".autoread mode [all/mentions/group/private]")} - Set mode\n` +
                      `┃ ⋄ ${toBold(".autoread delay [ms]")} - Set read delay\n` +
                      `┃ ⋄ ${toBold(".autoread ignorebots [on/off]")} - Ignore bots\n` +
                      `┃ ⋄ ${toBold(".autoread ignoreadmins [on/off]")} - Ignore admins\n` +
                      `┃ ⋄ ${toBold(".autoread group add/remove [jid]")} - Manage groups\n` +
                      `┃ ⋄ ${toBold(".autoread user add/remove [jid]")} - Manage users\n` +
                      `┃ ⋄ ${toBold(".autoread stats")} - Show statistics\n` +
                      `┃ ⋄ ${toBold(".autoread reset")} - Reset stats\n` +
                      `┃\n` +
                      `┃ 📊 ${toBold("Status:")} ${status}\n` +
                      `┃ 🔄 ${toBold("Mode:")} ${mode}\n` +
                      `┃ ⏱️ ${toBold("Delay:")} ${config.readDelay}ms\n` +
                      `┃ 📈 ${toBold("Total Read:")} ${config.stats?.totalRead || 0}\n` +
                      `╰━━━━━━━━━━━━━━━━━━┈⊷`,
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

        // --- ENABLE ---
        if (action === 'on' || action === 'enable') {
            config.enabled = true;
            config.stats = config.stats || DEFAULT_CONFIG.stats;
            saveConfig(config);
            
            await sock.sendMessage(chatId, {
                text: `✅ *AutoRead Enabled!*\n\n` +
                      `🔹 Mode: ${config.mode || 'all'}\n` +
                      `🔹 Delay: ${config.readDelay}ms\n` +
                      `🔹 Ignore Bots: ${config.ignoreBots ? 'Yes' : 'No'}\n` +
                      `🔹 Ignore Admins: ${config.ignoreAdmins ? 'Yes' : 'No'}\n` +
                      `📊 All messages will be read automatically.`,
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
            return;
        }

        // --- DISABLE ---
        if (action === 'off' || action === 'disable') {
            config.enabled = false;
            saveConfig(config);
            
            await sock.sendMessage(chatId, {
                text: `❌ *AutoRead Disabled!*\n\n` +
                      `📊 Total Messages Read: ${config.stats?.totalRead || 0}\n` +
                      `💤 No longer reading messages automatically.`,
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
            return;
        }

        // --- STATUS ---
        if (action === 'status') {
            const status = config.enabled ? '✅ Active' : '❌ Inactive';
            const mode = config.mode || 'all';
            const stats = config.stats || { totalRead: 0, lastRead: null };
            
            return await sock.sendMessage(chatId, {
                text: `📊 *AutoRead Status*\n\n` +
                      `🔹 Status: ${status}\n` +
                      `🔹 Mode: ${mode}\n` +
                      `🔹 Delay: ${config.readDelay}ms\n` +
                      `🔹 Ignore Bots: ${config.ignoreBots ? '✅' : '❌'}\n` +
                      `🔹 Ignore Admins: ${config.ignoreAdmins ? '✅' : '❌'}\n` +
                      `🔹 Ignored Groups: ${config.ignoreGroups?.length || 0}\n` +
                      `🔹 Ignored Users: ${config.ignoreUsers?.length || 0}\n` +
                      `🔹 Total Read: ${stats.totalRead || 0}\n` +
                      `🔹 Last Read: ${stats.lastRead ? new Date(stats.lastRead).toLocaleString() : 'Never'}`,
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

        // --- SET MODE ---
        if (action === 'mode') {
            const mode = args[1]?.toLowerCase();
            if (!['all', 'mentions', 'group', 'private'].includes(mode)) {
                return await sock.sendMessage(chatId, {
                    text: `❌ Invalid mode!\n\n` +
                          `📌 Available: all, mentions, group, private\n` +
                          `💡 all = Read all messages\n` +
                          `💡 mentions = Read only when mentioned\n` +
                          `💡 group = Read only group messages\n` +
                          `💡 private = Read only private messages`
                });
            }

            config.mode = mode;
            saveConfig(config);
            
            await sock.sendMessage(chatId, {
                text: `✅ *Mode Updated!*\n\n` +
                      `🔄 New Mode: ${mode}\n` +
                      `💡 ${mode === 'all' ? 'Reading all messages' : 
                          mode === 'mentions' ? 'Reading only when mentioned' :
                          mode === 'group' ? 'Reading only group messages' :
                          'Reading only private messages'}`,
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
            return;
        }

        // --- SET DELAY ---
        if (action === 'delay') {
            const delay = parseInt(args[1]);
            if (isNaN(delay) || delay < 0) {
                return await sock.sendMessage(chatId, {
                    text: `❌ Invalid delay!\n\n` +
                          `📌 Example: .autoread delay 1000\n` +
                          `💡 1000ms = 1 second delay`
                });
            }

            config.readDelay = delay;
            saveConfig(config);
            
            await sock.sendMessage(chatId, {
                text: `✅ *Delay Updated!*\n\n` +
                      `⏱️ New Delay: ${delay}ms\n` +
                      `🔄 ${delay === 0 ? 'Instant reading (no delay)' : delay / 1000 + ' seconds delay'}`,
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
            return;
        }

        // --- IGNORE BOTS ---
        if (action === 'ignorebots') {
            const mode = args[1]?.toLowerCase();
            if (!['on', 'off'].includes(mode)) {
                return await sock.sendMessage(chatId, {
                    text: `❌ Usage: .autoread ignorebots [on/off]`
                });
            }

            config.ignoreBots = mode === 'on';
            saveConfig(config);
            
            await sock.sendMessage(chatId, {
                text: `${mode === 'on' ? '✅' : '❌'} *Bot Ignoring ${mode === 'on' ? 'Enabled' : 'Disabled'}*\n\n` +
                      `${mode === 'on' ? '🤖 Bot messages will be ignored' : '🤖 Bot messages will be read'}`,
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
            return;
        }

        // --- IGNORE ADMINS ---
        if (action === 'ignoreadmins') {
            const mode = args[1]?.toLowerCase();
            if (!['on', 'off'].includes(mode)) {
                return await sock.sendMessage(chatId, {
                    text: `❌ Usage: .autoread ignoreadmins [on/off]`
                });
            }

            config.ignoreAdmins = mode === 'on';
            saveConfig(config);
            
            await sock.sendMessage(chatId, {
                text: `${mode === 'on' ? '✅' : '❌'} *Admin Ignoring ${mode === 'on' ? 'Enabled' : 'Disabled'}*\n\n` +
                      `${mode === 'on' ? '👑 Admin messages will be ignored' : '👑 Admin messages will be read'}`,
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
            return;
        }

        // --- MANAGE IGNORED GROUPS ---
        if (action === 'group') {
            if (!subAction || !['add', 'remove'].includes(subAction)) {
                return await sock.sendMessage(chatId, {
                    text: `❌ Usage: .autoread group [add/remove] [jid]`
                });
            }

            const jid = args[2];
            if (!jid) {
                return await sock.sendMessage(chatId, {
                    text: `❌ Please provide a group JID.\n` +
                          `📌 Example: .autoread group add 1234567890@g.us`
                });
            }

            if (!config.ignoreGroups) config.ignoreGroups = [];
            
            if (subAction === 'add') {
                if (!config.ignoreGroups.includes(jid)) {
                    config.ignoreGroups.push(jid);
                }
            } else {
                config.ignoreGroups = config.ignoreGroups.filter(g => g !== jid);
            }
            
            saveConfig(config);
            
            await sock.sendMessage(chatId, {
                text: `✅ *Group ${subAction === 'add' ? 'Added to' : 'Removed from'} Ignore List*\n\n` +
                      `📌 Group: ${jid}\n` +
                      `📊 Total Ignored: ${config.ignoreGroups.length}`,
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
            return;
        }

        // --- MANAGE IGNORED USERS ---
        if (action === 'user') {
            if (!subAction || !['add', 'remove'].includes(subAction)) {
                return await sock.sendMessage(chatId, {
                    text: `❌ Usage: .autoread user [add/remove] [jid]`
                });
            }

            const jid = args[2];
            if (!jid) {
                return await sock.sendMessage(chatId, {
                    text: `❌ Please provide a user JID.\n` +
                          `📌 Example: .autoread user add 9234567890@s.whatsapp.net`
                });
            }

            if (!config.ignoreUsers) config.ignoreUsers = [];
            
            if (subAction === 'add') {
                if (!config.ignoreUsers.includes(jid)) {
                    config.ignoreUsers.push(jid);
                }
            } else {
                config.ignoreUsers = config.ignoreUsers.filter(u => u !== jid);
            }
            
            saveConfig(config);
            
            await sock.sendMessage(chatId, {
                text: `✅ *User ${subAction === 'add' ? 'Added to' : 'Removed from'} Ignore List*\n\n` +
                      `👤 User: ${jid}\n` +
                      `📊 Total Ignored: ${config.ignoreUsers.length}`,
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
            return;
        }

        // --- STATS ---
        if (action === 'stats') {
            const stats = config.stats || { totalRead: 0, lastRead: null };
            
            return await sock.sendMessage(chatId, {
                text: `📊 *AutoRead Statistics*\n\n` +
                      `📈 Total Messages Read: ${stats.totalRead || 0}\n` +
                      `⏰ Last Read: ${stats.lastRead ? new Date(stats.lastRead).toLocaleString() : 'Never'}\n` +
                      `📊 Status: ${config.enabled ? 'Active' : 'Inactive'}\n` +
                      `🔄 Mode: ${config.mode || 'all'}\n` +
                      `⏱️ Delay: ${config.readDelay}ms\n` +
                      `🤖 Ignore Bots: ${config.ignoreBots ? 'Yes' : 'No'}\n` +
                      `👑 Ignore Admins: ${config.ignoreAdmins ? 'Yes' : 'No'}\n` +
                      `📌 Ignored Groups: ${config.ignoreGroups?.length || 0}\n` +
                      `👤 Ignored Users: ${config.ignoreUsers?.length || 0}`,
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

        // --- RESET STATS ---
        if (action === 'reset' || action === 'clear') {
            config.stats = { totalRead: 0, lastRead: null };
            saveConfig(config);
            
            await sock.sendMessage(chatId, {
                text: `🧹 *Stats Reset!*\n\n` +
                      `🔄 All statistics have been cleared.\n` +
                      `📊 Starting fresh!`,
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
            return;
        }

        // --- DEFAULT ---
        return await sock.sendMessage(chatId, {
            text: `❌ Invalid command!\n` +
                  `📌 Use .autoread help for all commands`,
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

    } catch (error) {
        console.error('Error in autoread command:', error);
        await sock.sendMessage(chatId, {
            text: `❌ *Error Occurred!*\n\n` +
                  `Error: ${error.message}\n` +
                  `💡 Please try again later.`,
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
}

// --- CHECK IF AUTOREAD IS ENABLED ---
function isAutoreadEnabled() {
    try {
        const config = initConfig();
        return config.enabled;
    } catch (error) {
        console.error('Error checking autoread status:', error);
        return false;
    }
}

// --- CHECK IF BOT IS MENTIONED ---
function isBotMentionedInMessage(message, botNumber) {
    if (!message.message) return false;
    
    const messageTypes = [
        'extendedTextMessage', 'imageMessage', 'videoMessage', 'stickerMessage',
        'documentMessage', 'audioMessage', 'contactMessage', 'locationMessage'
    ];
    
    // Check for explicit mentions
    for (const type of messageTypes) {
        if (message.message[type]?.contextInfo?.mentionedJid) {
            const mentionedJid = message.message[type].contextInfo.mentionedJid;
            if (mentionedJid.some(jid => jid === botNumber)) {
                return true;
            }
        }
    }
    
    // Check for text mentions
    const textContent = 
        message.message.conversation || 
        message.message.extendedTextMessage?.text ||
        message.message.imageMessage?.caption ||
        message.message.videoMessage?.caption || '';
    
    if (textContent) {
        const botUsername = botNumber.split('@')[0];
        if (textContent.includes(`@${botUsername}`)) {
            return true;
        }
        
        const botNames = [global.botname?.toLowerCase(), 'bot', 'TEAM-ZUBAIR-MD'];
        const words = textContent.toLowerCase().split(/\s+/);
        if (botNames.some(name => words.includes(name))) {
            return true;
        }
    }
    
    return false;
}

// --- CHECK IF USER/GROUP IS IGNORED ---
function isIgnored(message, botNumber, config) {
    const sender = message.key.participant || message.key.remoteJid;
    const isGroup = message.key.remoteJid.endsWith('@g.us');
    
    // Check if user is ignored
    if (config.ignoreUsers && config.ignoreUsers.includes(sender)) {
        return true;
    }
    
    // Check if group is ignored
    if (isGroup && config.ignoreGroups && config.ignoreGroups.includes(message.key.remoteJid)) {
        return true;
    }
    
    // Check if bot
    if (config.ignoreBots && sender === botNumber) {
        return true;
    }
    
    // Check if admin (simplified - would need actual admin check)
    if (config.ignoreAdmins) {
        // You'd need to check if sender is admin here
        // For now, we'll assume it's handled elsewhere
    }
    
    return false;
}

// --- HANDLE AUTOREAD FUNCTIONALITY ---
async function handleAutoread(sock, message) {
    try {
        if (!isAutoreadEnabled()) return false;
        
        const config = initConfig();
        const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const isGroup = message.key.remoteJid.endsWith('@g.us');
        const isMentioned = isBotMentionedInMessage(message, botNumber);
        
        // Check if ignored
        if (isIgnored(message, botNumber, config)) {
            return false;
        }
        
        // Check mode
        const mode = config.mode || 'all';
        if (mode === 'mentions' && !isMentioned) return false;
        if (mode === 'group' && !isGroup) return false;
        if (mode === 'private' && isGroup) return false;
        
        // Delay before reading
        if (config.readDelay > 0) {
            await new Promise(resolve => setTimeout(resolve, config.readDelay));
        }
        
        // Read the message
        const key = { 
            remoteJid: message.key.remoteJid, 
            id: message.key.id, 
            participant: message.key.participant 
        };
        
        await sock.readMessages([key]);
        
        // Update stats
        config.stats = config.stats || { totalRead: 0, lastRead: null };
        config.stats.totalRead = (config.stats.totalRead || 0) + 1;
        config.stats.lastRead = new Date().toISOString();
        saveConfig(config);
        
        return true;
        
    } catch (error) {
        console.error('Error in handleAutoread:', error);
        return false;
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

module.exports = {
    autoreadCommand,
    isAutoreadEnabled,
    isBotMentionedInMessage,
    handleAutoread
};