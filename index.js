require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion, 
    makeCacheableSignalKeyStore, 
    downloadContentFromMessage, 
    jidNormalizedUser, 
    Browsers, 
    delay 
} = require('@whiskeysockets/baileys');
const P = require('pino');
const { OpenAI } = require('openai');

// ================================
// IMPORTS
// ================================

// Commands
const commands = {
    // General
    ping: require('./commands/ping'),
    owner: require('./commands/owner'),
    private: require('./commands/private'),
    public: require('./commands/public'),
    status: require('./commands/status'),
    setname: require('./commands/setname'),
    
    // Group Management
    kick: require('./commands/kick'),
    kickoffline: require('./commands/kickoffline'),
    tagall: require('./commands/tagall'),
    hidetag: require('./commands/hidetag'),
    groupinfo: require('./commands/groupinfo'),
    accept: require('./commands/accept'),
    
    // Anti Features
    antilink: require('./commands/antilink'),
    anticall: require('./commands/anticall'),
    antistatus: require('./commands/antistatus'),
    antidelete: require('./commands/antidelete'),
    autoreads: require('./commands/autoreads'),
    autoreacts: require('./commands/autoreacts'),
    
    // Downloaders
    song: require('./commands/song'),
    video: require('./commands/video'),
    insta: require('./commands/insta'),
    tiktok: require('./commands/tiktok'),
    facebook: require('./commands/facebook'),
    gdrive: require('./commands/gdrive'),
    mf: require('./commands/mf'),
    apk: require('./commands/apk'),
    
    // Media
    dp: require('./commands/dp'),
    vv: require('./commands/vv'),
    emojimix: require('./commands/emojimix'),
    meme: require('./commands/meme'),
    joke: require('./commands/joke'),
    character: require('./commands/character'),
    hack: require('./commands/hack'),
    
    // AI & Translation
    ai: require('./commands/ai'),
    translate: require('./commands/translate').handleTranslateCommand,
    languages: require('./commands/translate').handleLanguagesCommand,
};

// Auto Features
const { handleAutoread } = require('./commands/autoreads');
const { handleStatusUpdate } = require('./commands/autostatus');
const { storeMessage, handleMessageRevocation } = require('./commands/antidelete');

// ================================
// CONFIGURATION
// ================================

const PORT = process.env.PORT || 20664;
const AUTH_DIR = './auth_info';
const DATA_FILE = './data/bot_data.json';
const TEMP_DIR = './temp';
const LOGS_DIR = './logs';

// Ensure directories exist
fs.ensureDirSync(AUTH_DIR);
fs.ensureDirSync('./data');
fs.ensureDirSync(TEMP_DIR);
fs.ensureDirSync(LOGS_DIR);

// ================================
// EXPRESS SETUP
// ================================

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/health', (req, res) => {
    const activeBots = Object.values(sessions).filter(s => s.isConnected).length;
    res.json({
        status: 'online',
        uptime: process.uptime(),
        activeBots: activeBots,
        totalSessions: Object.keys(sessions).length,
        timestamp: new Date().toISOString()
    });
});

app.get('/stats', (req, res) => {
    const stats = {
        totalSessions: Object.keys(sessions).length,
        activeBots: Object.values(sessions).filter(s => s.isConnected).length,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
        botData: {
            antilinkGroups: Object.keys(botData.antilinkGroups || {}).length,
            userNames: Object.keys(botData.userNames || {}).length,
            statusSettings: Object.keys(botData.statusSettings || {}).length
        }
    };
    res.json(stats);
});

// ================================
// SOCKET.IO
// ================================

const io = socketIo(server, {
    cors: { origin: "*" },
    transports: ['polling', 'websocket']
});

// ================================
// TELEGRAM BOT - YOUR TOKEN
// ================================

const tgToken = "8421882616:AAG5Z5YkEtIGtm3Qr6gb_g7p8udHRLf4dio";
const tgBot = new TelegramBot(tgToken, { polling: true });

// ================================
// OPENAI - Bichu-MD
// ================================

let openai = null;
try {
    // Using Groq API with Bichu-MD configuration
    openai = new OpenAI({
        apiKey: "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",
        baseURL: "https://api.groq.com/openai/v1"
    });
    console.log('🤖 Bichu-MD AI configured successfully');
} catch (e) {
    console.log('⚠️ Bichu-MD AI not configured');
}

// ================================
// BOT DATA
// ================================

let botData = { 
    antilinkGroups: {}, 
    totalBots: 0, 
    registeredBots: [], 
    statusSettings: {}, 
    antiDelete: {}, 
    userNames: {}, 
    antiCall: {},
    kickOffline: {},
    autoReact: {},
    userActivity: {}
};

if (fs.existsSync(DATA_FILE)) {
    try { 
        botData = fs.readJsonSync(DATA_FILE); 
        console.log('📁 Bot data loaded successfully');
    } catch (e) {
        console.error('⚠️ Error loading bot data:', e.message);
    }
}

function saveBotData() {
    try {
        fs.writeJsonSync(DATA_FILE, botData, { spaces: 2 });
    } catch (e) {
        console.error('⚠️ Error saving bot data:', e.message);
    }
}

// ================================
// SESSIONS STORE
// ================================

const sessions = {};
const userSockets = {};
const messageLogs = {};

// ================================
// BOT SESSION CLASS
// ================================

class BotSession {
    constructor(userId) {
        this.userId = userId;
        this.sock = null;
        this.isConnected = false;
        this.aiEnabled = false;
        this.autoReact = botData.autoReact?.[userId] || false;
        this.isPublic = botData.statusSettings?.[userId]?.isPublic || false;
        this.authPath = path.join(AUTH_DIR, userId);
        this.processedMessages = new Set();
        this.activeInterval = null;
        this.isInitializing = false;
        this.tgChatId = null;
        this.startTime = Date.now();
        this.messageCount = 0;
        this.lastActivity = null;
    }

    // --- Logging ---
    sendLog(message, type = 'info') {
        const logEntry = { 
            timestamp: new Date().toLocaleTimeString(), 
            message, 
            type 
        };
        const socketId = userSockets[this.userId];
        if (socketId) io.to(socketId).emit('console', logEntry);
        console.log(`[${this.userId}] ${message}`);
    }

    // --- Connection Status ---
    sendConnectionStatus() {
        const socketId = userSockets[this.userId];
        if (socketId) {
            io.to(socketId).emit('connection-status', {
                connected: this.isConnected,
                user: this.userId,
                startTime: this.startTime,
                messageCount: this.messageCount
            });
        }
        io.emit('total-active', Object.values(sessions).filter(s => s.isConnected).length);
    }

    // --- AI Response with Bichu-MD ---
    async getAIResponse(userJid, userMessage) {
        if (!openai) return "❌ Bichu-MD AI is not configured.";
        try {
            const completion = await openai.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "You are Bichu-MD, a helpful WhatsApp assistant. Be concise, friendly, and helpful. Your creator is Team Zubair." },
                    { role: "user", content: userMessage }
                ],
                max_tokens: 2048,
                temperature: 0.7
            });
            return completion.choices[0].message.content.trim();
        } catch (error) {
            console.error('Bichu-MD AI Error:', error);
            return "❌ Bichu-MD AI Error: " + error.message;
        }
    }

    // --- Keep Alive ---
    startActiveCheck() {
        if (this.activeInterval) clearInterval(this.activeInterval);
        this.activeInterval = setInterval(async () => {
            if (this.isConnected && this.sock?.user) {
                try {
                    const botNumber = jidNormalizedUser(this.sock.user.id);
                    await this.sock.sendMessage(botNumber, { 
                        text: `⚔️ *TEAM-ZUBAIR-MD*\n\n` +
                              `🟢 Bot is ONLINE\n` +
                              `⏱️ Uptime: ${this.getUptime()}\n` +
                              `📊 Messages: ${this.messageCount}\n` +
                              `\n_24/7 Active System Running..._` 
                    });
                    this.sendLog("✅ Keep-alive message sent", "success");
                } catch (e) {
                    this.sendLog("⚠️ Keep-alive failed: " + e.message, "error");
                }
            }
        }, 60 * 60 * 1000); // Every hour
    }

    getUptime() {
        const diff = Date.now() - this.startTime;
        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        if (days > 0) return `${days}d ${hours}h ${minutes}m`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    }

    // --- Initialize Bot ---
    async initialize(pairingNumber = null) {
        if (this.isInitializing) {
            this.sendLog("⏳ Initialization already in progress...", "info");
            return;
        }
        this.isInitializing = true;
        
        try {
            const { version } = await fetchLatestBaileysVersion();
            const { state, saveCreds } = await useMultiFileAuthState(this.authPath);
            
            this.sock = makeWASocket({
                version,
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, P({ level: 'fatal' })),
                },
                printQRInTerminal: false,
                logger: P({ level: 'fatal' }),
                browser: Browsers.ubuntu('Chrome'),
                syncFullHistory: false,
                shouldSyncHistoryMessage: () => false,
                markOnlineOnConnect: true,
                keepAliveIntervalMs: 30000,
                connectTimeoutMs: 60000,
                defaultQueryTimeoutMs: 60000,
                emitOwnEvents: true,
                retryRequestDelayMs: 5000,
                maxMsgRetryCount: 5,
                linkPreviewImageThumbnailWidth: 192,
                transactionOpts: { maxCommitRetries: 10, delayBetweenTriesMs: 3000 },
                getMessage: async (key) => {
                    if (messageLogs[key.id]) {
                        return { conversation: messageLogs[key.id].text };
                    }
                    return { conversation: 'Bot is active' };
                }
            });

            // --- Pairing ---
            if (pairingNumber && !state.creds.registered) {
                if (!this.sock.authState.creds.registered) {
                    await delay(3000);
                    try {
                        let code = await this.sock.requestPairingCode(pairingNumber);
                        code = code?.match(/.{1,4}/g)?.join("-") || code;
                        this.sendLog(`🔑 Pairing Code: ${code}`, 'success');
                        
                        if (this.tgChatId) {
                            await tgBot.sendMessage(this.tgChatId, 
                                `🔑 *PAIRING CODE*\n\n` +
                                `Code: \`${code}\`\n\n` +
                                `_Enter this code in your WhatsApp to connect._`
                            );
                        }

                        const socketId = userSockets[this.userId];
                        if (socketId) io.to(socketId).emit('pairing-code', code);
                    } catch (err) {
                        this.sendLog(`❌ Pairing error: ${err.message}`, 'error');
                        if (this.tgChatId) {
                            await tgBot.sendMessage(this.tgChatId, "❌ Pairing Error: " + err.message);
                        }
                    }
                }
            }

            // --- Events ---
            this.sock.ev.on('creds.update', saveCreds);

            // --- Calls ---
            this.sock.ev.on('call', async (calls) => {
                if (botData.antiCall?.[this.userId]) {
                    for (const call of calls) {
                        if (call.status === 'offer') {
                            try {
                                await this.sock.rejectCall(call.id, call.from);
                                await this.sock.sendMessage(call.from, { 
                                    text: "⚠️ *ANTI-CALL:* I don't accept calls. Please send a message instead." 
                                });
                            } catch (e) {}
                        }
                    }
                }
            });

            // --- Connection Update ---
            this.sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect } = update;
                if (connection === 'close') {
                    const statusCode = lastDisconnect?.error?.output?.statusCode;
                    this.isConnected = false;
                    this.sendConnectionStatus();
                    
                    if (statusCode === DisconnectReason.loggedOut) {
                        this.sendLog('🔴 Logged out. Please re-pair.', 'error');
                        if (this.tgChatId) {
                            await tgBot.sendMessage(this.tgChatId, "❌ *Bot Logged Out*\n\nPlease re-pair the bot.");
                        }
                    } else if (statusCode === DisconnectReason.badSession) {
                        this.sendLog('⚠️ Bad session. Restarting...', 'warning');
                        await fs.remove(this.authPath);
                        await this.initialize(pairingNumber);
                    } else {
                        this.sendLog(`⚠️ Disconnected (${statusCode}). Reconnecting...`, 'warning');
                        await delay(5000);
                        await this.initialize(pairingNumber);
                    }
                } else if (connection === 'open') {
                    this.isConnected = true;
                    this.sendLog('✅ Connected successfully!', 'success');
                    this.sendConnectionStatus();
                    this.startActiveCheck();
                    
                    if (this.tgChatId) {
                        await tgBot.sendMessage(this.tgChatId, 
                            `✅ *Bot Connected Successfully!*\n\n` +
                            `🤖 Bot is now active and ready to use.\n` +
                            `📱 Connected to WhatsApp.`
                        );
                    }
                }
            });

            // --- Messages ---
            this.sock.ev.on('messages.upsert', async (m) => {
                if (m.type !== 'notify') return;
                
                for (const msg of m.messages) {
                    try {
                        const from = msg.key.remoteJid;
                        const isMe = msg.key.fromMe;
                        const isGroup = from?.endsWith('@g.us');
                        const isStatus = from === 'status@broadcast';
                        
                        const messageContent = msg.message?.ephemeralMessage?.message || 
                                             msg.message?.viewOnceMessage?.message || 
                                             msg.message?.viewOnceMessageV2?.message || 
                                             msg.message;
                        if (!messageContent) continue;
                        
                        let type = Object.keys(messageContent)[0];
                        const text = (messageContent.conversation || 
                                    messageContent.extendedTextMessage?.text || 
                                    messageContent.imageMessage?.caption || 
                                    messageContent.videoMessage?.caption || '').trim();

                        // --- Auto Read ---
                        if (!isMe && !isStatus) {
                            await handleAutoread(this.sock, msg);
                            await storeMessage(msg);
                            this.messageCount++;
                            this.lastActivity = Date.now();
                            
                            // Track user activity
                            const sender = msg.key.participant || from;
                            if (!botData.userActivity) botData.userActivity = {};
                            if (!botData.userActivity[sender]) botData.userActivity[sender] = {};
                            botData.userActivity[sender].lastSeen = Date.now();
                            botData.userActivity[sender].messageCount = (botData.userActivity[sender].messageCount || 0) + 1;
                        }

                        // --- Anti-Delete ---
                        if (msg.message?.protocolMessage?.type === 0) {
                            await handleMessageRevocation(this.sock, msg);
                            continue;
                        }

                        // --- Deduplicate ---
                        const msgId = msg.key.id;
                        if (this.processedMessages.has(msgId)) continue;
                        this.processedMessages.add(msgId);
                        if (this.processedMessages.size > 1000) {
                            this.processedMessages.delete(this.processedMessages.values().next().value);
                        }

                        // --- Status Update ---
                        if (isStatus && !isMe) {
                            await handleStatusUpdate(this.sock, m, botData, this.userId);
                            continue;
                        }

                        // --- Auth Check ---
                        const botNumber = jidNormalizedUser(this.sock.user.id);
                        const sender = msg.key.participant || from;
                        const isOwner = isMe || sender.includes(botNumber.split('@')[0]);
                        let isAdmin = isOwner;
                        
                        if (!isAdmin && isGroup) {
                            try {
                                const groupMetadata = await this.sock.groupMetadata(from);
                                const participant = groupMetadata.participants.find(p => p.id === sender);
                                isAdmin = participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
                            } catch (e) {
                                isAdmin = false;
                            }
                        }

                        // ================================
                        // COMMAND HANDLER
                        // ================================
                        
                        if (text.startsWith('.')) {
                            const fullCmd = text.slice(1).toLowerCase();
                            const cmd = fullCmd.split(' ')[0];
                            const args = fullCmd.split(' ').slice(1);
                            const q = args.join(' ');

                            // Check if command exists
                            if (commands[cmd]) {
                                try {
                                    this.sendLog(`📝 Command: .${cmd} from ${sender}`, 'info');
                                    await commands[cmd](this.sock, from, msg, isAdmin, botData, saveBotData, this.userId, args, q, this);
                                } catch (err) {
                                    this.sendLog(`❌ Command error (${cmd}): ${err.message}`, 'error');
                                    await this.sock.sendMessage(from, { 
                                        text: `❌ Error executing command: ${err.message}`,
                                        quoted: msg 
                                    });
                                }
                            } else if (cmd === 'help') {
                                // Help command
                                const helpText = `╭━━━〔 ${toBold("📋 COMMANDS LIST")} 〕━━━┈⊷\n` +
                                               `┃\n` +
                                               `┃ 📌 ${toBold("General:")}\n` +
                                               `┃ .ping .owner .status .setname\n` +
                                               `┃\n` +
                                               `┃ 📌 ${toBold("Group:")}\n` +
                                               `┃ .kick .tagall .hidetag .groupinfo\n` +
                                               `┃ .accept .kickoffline\n` +
                                               `┃\n` +
                                               `┃ 📌 ${toBold("Anti:")}\n` +
                                               `┃ .antilink .anticall .antistatus\n` +
                                               `┃ .antidelete .autoreads .autoreacts\n` +
                                               `┃\n` +
                                               `┃ 📌 ${toBold("Downloaders:")}\n` +
                                               `┃ .song .video .insta .tiktok\n` +
                                               `┃ .facebook .gdrive .mf .apk\n` +
                                               `┃\n` +
                                               `┃ 📌 ${toBold("Media:")}\n` +
                                               `┃ .dp .vv .emojimix .meme .joke\n` +
                                               `┃ .character .hack\n` +
                                               `┃\n` +
                                               `┃ 📌 ${toBold("AI:")}\n` +
                                               `┃ .ai .translate .languages\n` +
                                               `┃\n` +
                                               `┃ 💡 ${toBold("Total:")} ${Object.keys(commands).length} commands\n` +
                                               `╰━━━━━━━━━━━━━━━━━━┈⊷`;
                                await this.sock.sendMessage(from, { 
                                    text: helpText,
                                    quoted: msg 
                                });
                            } else {
                                await this.sock.sendMessage(from, { 
                                    text: `❌ Unknown command: .${cmd}\nType .help for available commands.`,
                                    quoted: msg 
                                });
                            }
                        } 
                        // --- AI Auto-Reply with Bichu-MD ---
                        else if (this.aiEnabled && !isMe && !isStatus && !isGroup && text) {
                            try {
                                const aiResponse = await this.getAIResponse(from, text);
                                await this.sock.sendMessage(from, { 
                                    text: aiResponse, 
                                    quoted: msg 
                                });
                            } catch (e) {
                                console.error("Bichu-MD AI Auto-Reply Error:", e);
                            }
                        }

                        // --- Auto React ---
                        if (this.autoReact && !isMe && !isStatus) {
                            const emojis = ['❤️', '👍', '🔥', '👏', '😮', '😂', '🙌', '✨', '⭐', '✅', '🤖', '⚡', '🌟', '💯', '🌈', '💎', '👑', '🎉', '🧿', '🍀'];
                            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                            try { 
                                await this.sock.sendMessage(from, { 
                                    react: { text: randomEmoji, key: msg.key } 
                                });
                            } catch (e) {}
                        }

                    } catch (err) {
                        console.error('Message processing error:', err);
                    }
                }
            });

        } catch (err) {
            this.sendLog(`❌ Initialization error: ${err.message}`, 'error');
            this.isInitializing = false;
            throw err;
        }
        this.isInitializing = false;
    }

    // --- Logout ---
    async logout() {
        try {
            if (this.sock) {
                await this.sock.end();
            }
            if (this.activeInterval) {
                clearInterval(this.activeInterval);
            }
            this.isConnected = false;
            this.sendConnectionStatus();
            this.sendLog('🔴 Bot logged out', 'info');
            
            // Remove auth directory
            await fs.remove(this.authPath);
            
            if (this.tgChatId) {
                await tgBot.sendMessage(this.tgChatId, "🔴 *Bot Logged Out*\n\nSession has been terminated.");
            }
        } catch (err) {
            console.error('Logout error:', err);
        }
    }
}

// ================================
// LOAD EXISTING SESSIONS
// ================================

async function loadExistingSessions() {
    try {
        const authDirs = await fs.readdir(AUTH_DIR);
        let loaded = 0;
        for (const userId of authDirs) {
            const authPath = path.join(AUTH_DIR, userId);
            const stats = await fs.stat(authPath);
            if (stats.isDirectory()) {
                const credsFile = path.join(authPath, 'creds.json');
                if (fs.existsSync(credsFile)) {
                    console.log(`📂 Found existing session: ${userId}`);
                    if (!sessions[userId]) {
                        sessions[userId] = new BotSession(userId);
                        await sessions[userId].initialize().catch(err => {
                            console.error(`⚠️ Failed to load session ${userId}:`, err.message);
                        });
                        loaded++;
                    }
                }
            }
        }
        console.log(`✅ Loaded ${loaded} existing sessions`);
    } catch (err) {
        console.error('⚠️ Error loading sessions:', err.message);
    }
}

// ================================
// TELEGRAM BOT HANDLER
// ================================

tgBot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === '/start') {
        await tgBot.sendMessage(chatId, 
            `⚔️ *TEAM-ZUBAIR-MD*\n\n` +
            `🤖 WhatsApp Bot Controller\n\n` +
            `📌 Enter your WhatsApp number to pair:\n` +
            `(Example: 923000000000)`
        );
        return;
    }

    if (/^\d+$/.test(text)) {
        const userId = chatId.toString();
        if (!sessions[userId]) {
            sessions[userId] = new BotSession(userId);
        }
        
        if (!botData.statusSettings[userId]) {
            botData.statusSettings[userId] = { 
                autoStatus: false,
                autoSeen: false,
                autoLike: false,
                autoDownload: false,
                isPublic: false
            };
            saveBotData();
        }

        await tgBot.sendMessage(chatId, 
            `⏳ Requesting Pairing Code for ${text}...\n\n` +
            `_Please wait a few seconds..._`
        );
        
        sessions[userId].tgChatId = chatId;
        await sessions[userId].initialize(text);
    }
});

// ================================
// SOCKET.IO CONNECTIONS
// ================================

io.on('connection', (socket) => {
    console.log('🔌 New client connected:', socket.id);
    
    // Register user
    socket.on('set-user', async (userId) => {
        userSockets[userId] = socket.id;
        socket.userId = userId;
        console.log(`👤 User ${userId} registered with socket ${socket.id}`);
        
        // Create session if not exists
        if (!sessions[userId]) {
            sessions[userId] = new BotSession(userId);
        }
        
        // Send current status
        socket.emit('connection-status', {
            connected: sessions[userId].isConnected,
            user: userId
        });
        
        // Send initial console logs
        socket.emit('console', { 
            timestamp: new Date().toLocaleTimeString(), 
            message: `⚔️ Bot session initialized for ${userId}`,
            type: 'info' 
        });
    });

    // Pairing request
    socket.on('pair-request', async (data) => {
        const { userId, number } = data;
        console.log(`📱 Pairing request for ${userId} with number ${number}`);
        
        if (!sessions[userId]) {
            sessions[userId] = new BotSession(userId);
        }
        
        sessions[userId].tgChatId = null;
        await sessions[userId].initialize(number);
    });

    // Logout
    socket.on('logout', async (userId) => {
        console.log(`🔴 Logout request for ${userId}`);
        if (sessions[userId]) {
            await sessions[userId].logout();
            delete sessions[userId];
            delete userSockets[userId];
        }
        socket.emit('connection-status', {
            connected: false,
            user: userId
        });
    });

    // Disconnect
    socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id);
        for (const [userId, socketId] of Object.entries(userSockets)) {
            if (socketId === socket.id) {
                delete userSockets[userId];
                break;
            }
        }
    });
});

// ================================
// HELPER: toBold
// ================================

const toBold = (text) => {
    const boldChars = {
        'a': '𝗮', 'b': '𝗯', 'c': '𝗰', 'd': '𝗱', 'e': '𝗲', 'f': '𝗳', 'g': '𝗴', 'h': '𝗵', 'i': '𝗶', 'j': '𝗷', 'k': '𝗸', 'l': '𝗹', 'm': '𝗺', 'n': '𝗻', 'o': '𝗼', 'p': '𝗽', 'q': '𝗾', 'r': '𝗿', 's': '𝘀', 't': '𝘁', 'u': '𝘂', 'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇',
        'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚', 'H': '𝗛', 'I': '𝗜', 'J': '𝗝', 'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡', 'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝘀', 't': '𝘁', 'u': '𝘂', 'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇',
        '0': '𝟬', '1': '𝟭', '2': '𝟮', '3': '𝟯', '4': '𝟰', '5': '𝟱', '6': '𝟲', '7': '𝟳', '8': '𝟴', '9': '𝟵'
    };
    return text.split('').map(c => boldChars[c] || c).join('');
};

// ================================
// START SERVER
// ================================

server.listen(PORT, '0.0.0.0', async () => {
    console.log(`╭━━━〔 ⚔️ TEAM-ZUBAIR-MD 〕━━━┈⊷`);
    console.log(`┃`);
    console.log(`┃ 🚀 Server running on port ${PORT}`);
    console.log(`┃ 🌐 URL: http://localhost:${PORT}`);
    console.log(`┃ 📱 WhatsApp Bot Ready`);
    console.log(`┃ 🤖 Bichu-MD AI: ${openai ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`┃ 📊 Commands: ${Object.keys(commands).length}`);
    console.log(`┃ 📱 Telegram Bot: ${tgToken ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`┃`);
    console.log(`╰━━━━━━━━━━━━━━━━━━┈⊷`);
    
    await loadExistingSessions();
});

// ================================
// GRACEFUL SHUTDOWN
// ================================

process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    for (const session of Object.values(sessions)) {
        if (session.sock) {
            await session.sock.end();
        }
        if (session.activeInterval) {
            clearInterval(session.activeInterval);
        }
    }
    saveBotData();
    process.exit(0);
});

process.on('unhandledRejection', (err) => {
    console.error('⚠️ Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
    console.error('⚠️ Uncaught Exception:', err);
});