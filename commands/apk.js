const axios = require('axios');
const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
const CONFIG = {
    API_KEY: 'free_key@maher_apis',
    API_URL: 'https://api.nexoracle.com/downloader/apk',
    TEMP_DIR: path.join(__dirname, '../tmp/apk'),
    MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
    CACHE_DURATION: 3600000 // 1 hour
};

// --- ENSURE TEMP DIRECTORY ---
if (!fs.existsSync(CONFIG.TEMP_DIR)) {
    fs.mkdirSync(CONFIG.TEMP_DIR, { recursive: true });
}

// --- HELPER: Format Size ---
const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
};

// --- HELPER: Clean Temp Files ---
const cleanTempFiles = () => {
    try {
        const files = fs.readdirSync(CONFIG.TEMP_DIR);
        const now = Date.now();
        files.forEach(file => {
            const filePath = path.join(CONFIG.TEMP_DIR, file);
            const stats = fs.statSync(filePath);
            if (now - stats.mtimeMs > CONFIG.CACHE_DURATION) {
                fs.unlinkSync(filePath);
            }
        });
    } catch (err) {}
};

// Run cleanup every hour
setInterval(cleanTempFiles, 3600000);

// --- MAIN COMMAND ---
async function apkCommand(sock, chatId, message, args) {
    try {
        // --- Extract App Name ---
        const userMessage = args?.length > 0 ? args.join(' ') : 
                           message.message.conversation || 
                           message.message.extendedTextMessage?.text || '';
        const appName = userMessage.split(' ').slice(1).join(' ');

        if (!appName) {
            await sock.sendMessage(chatId, {
                text: `╭━━━〔 ${toBold("APK DOWNLOADER")} 〕━━━┈⊷\n` +
                      `┃\n` +
                      `┃ 📌 ${toBold("Usage:")}\n` +
                      `┃ .apk [app name]\n` +
                      `┃\n` +
                      `┃ 📌 ${toBold("Examples:")}\n` +
                      `┃ .apk whatsapp\n` +
                      `┃ .apk instagram\n` +
                      `┃ .apk youtube\n` +
                      `┃\n` +
                      `┃ 📌 ${toBold("Available Apps:")}\n` +
                      `┃ • WhatsApp, Instagram, YouTube\n` +
                      `┃ • Facebook, Telegram, Spotify\n` +
                      `┃ • Any Android app!\n` +
                      `╰━━━━━━━━━━━━━━━━━━┈⊷`
            }, { quoted: message });
            return;
        }

        // --- Initial Reaction ---
        await sock.sendMessage(chatId, { 
            react: { text: '🔍', key: message.key } 
        });

        // --- Send Searching Message ---
        await sock.sendMessage(chatId, {
            text: `🔍 *Searching for ${appName}...*\n\n` +
                  `⏳ Please wait, fetching details...`
        }, { quoted: message });

        // --- API Call ---
        const params = {
            apikey: CONFIG.API_KEY,
            q: appName,
        };

        const response = await axios.get(CONFIG.API_URL, { params });
        await sock.sendMessage(chatId, { 
            react: { text: '📦', key: message.key } 
        });

        if (!response.data || response.data.status !== 200 || !response.data.result) {
            await sock.sendMessage(chatId, {
                text: `❌ *APK Not Found*\n\n` +
                      `🔍 App: ${appName}\n` +
                      `💡 Please check the spelling or try another app.`
            }, { quoted: message });
            return;
        }

        const { name, lastup, package, size, icon, dllink, version, developer } = response.data.result;

        // --- Show App Info ---
        const infoMessage = `╭━━━〔 ${toBold("APK FOUND")} 〕━━━┈⊷\n` +
                           `┃\n` +
                           `┃ 📱 ${toBold("Name:")} ${name}\n` +
                           `┃ 🏷️ ${toBold("Package:")} ${package}\n` +
                           `┃ 📅 ${toBold("Updated:")} ${lastup}\n` +
                           `┃ 📏 ${toBold("Size:")} ${size}\n` +
                           `┃ 🔢 ${toBold("Version:")} ${version || 'N/A'}\n` +
                           `┃ 👨‍💻 ${toBold("Developer:")} ${developer || 'N/A'}\n` +
                           `┃\n` +
                           `┃ ⏳ ${toBold("Status:")} Downloading...\n` +
                           `╰━━━━━━━━━━━━━━━━━━┈⊷`;

        await sock.sendMessage(chatId, {
            image: { url: icon },
            caption: infoMessage
        }, { quoted: message });

        await sock.sendMessage(chatId, { 
            react: { text: '⬇️', key: message.key } 
        });

        // --- Download APK ---
        const apkResponse = await axios.get(dllink, { 
            responseType: 'arraybuffer',
            timeout: 60000 // 60 second timeout
        });

        if (!apkResponse.data) {
            await sock.sendMessage(chatId, {
                text: '❌ *Download Failed*\n\n' +
                      'Unable to download APK. Please try again later.'
            }, { quoted: message });
            return;
        }

        const apkBuffer = Buffer.from(apkResponse.data, 'binary');
        const fileSize = apkBuffer.length;

        // --- Check File Size ---
        if (fileSize > CONFIG.MAX_FILE_SIZE) {
            await sock.sendMessage(chatId, {
                text: `⚠️ *File Too Large*\n\n` +
                      `📏 Size: ${formatSize(fileSize)}\n` +
                      `📌 Max: ${formatSize(CONFIG.MAX_FILE_SIZE)}\n` +
                      `💡 Please download from the link directly.`
            }, { quoted: message });
            return;
        }

        // --- Send Downloading Progress ---
        await sock.sendMessage(chatId, {
            text: `📥 *Downloading ${name}...*\n\n` +
                  `📏 Size: ${size}\n` +
                  `⏳ Please wait...`
        }, { quoted: message });

        await sock.sendMessage(chatId, { 
            react: { text: '📤', key: message.key } 
        });

        // --- Format Details ---
        const details = `╭━━━〔 ${toBold("APK DETAILS")} 〕━━━┈⊷\n` +
                        `┃\n` +
                        `┃ 📱 ${toBold("Name:")} ${name}\n` +
                        `┃ 🏷️ ${toBold("Package:")} ${package}\n` +
                        `┃ 📅 ${toBold("Updated:")} ${lastup}\n` +
                        `┃ 📏 ${toBold("Size:")} ${size}\n` +
                        `┃ 🔢 ${toBold("Version:")} ${version || 'N/A'}\n` +
                        `┃ 👨‍💻 ${toBold("Developer:")} ${developer || 'N/A'}\n` +
                        `┃\n` +
                        `┃ 📥 ${toBold("File Size:")} ${formatSize(fileSize)}\n` +
                        `┃\n` +
                        `┃ 💡 ${toBold("Tip:")} Install directly or share!\n` +
                        `╰━━━━━━━━━━━━━━━━━━┈⊷`;

        // --- Send APK as Document ---
        await sock.sendMessage(chatId, {
            document: apkBuffer,
            mimetype: 'application/vnd.android.package-archive',
            fileName: `${name.replace(/[^a-zA-Z0-9]/g, '_')}.apk`,
            caption: details,
            contextInfo: {
                forwardingScore: 0,
                isForwarded: false,
                externalAdReply: {
                    title: `📱 ${name}`,
                    body: `Version: ${version || 'Latest'}`,
                    thumbnail: await getThumbnail(icon),
                    sourceUrl: dllink,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: message });

        // --- Success Reaction ---
        await sock.sendMessage(chatId, { 
            react: { text: '✅', key: message.key } 
        });

        // --- Send Success Message ---
        await sock.sendMessage(chatId, {
            text: `✅ *APK Downloaded Successfully!*\n\n` +
                  `📱 ${name}\n` +
                  `📏 ${size}\n` +
                  `💡 Use .apk again to download more apps!`
        }, { quoted: message });

    } catch (error) {
        console.error('❌ APK Command Error:', error);
        
        let errorMessage = '❌ *Error Occurred*\n\n';
        if (error.code === 'ECONNABORTED') {
            errorMessage += '⏱️ Request timed out. Please try again.';
        } else if (error.response?.status === 404) {
            errorMessage += '🔍 App not found. Please check the spelling.';
        } else if (error.response?.status === 429) {
            errorMessage += '🚫 Rate limited. Please wait and try again.';
        } else {
            errorMessage += `Error: ${error.message}\n💡 Please try again later.`;
        }

        await sock.sendMessage(chatId, {
            text: errorMessage
        }, { quoted: message });

        await sock.sendMessage(chatId, { 
            react: { text: '❌', key: message.key } 
        });
    }
}

// --- HELPER: Get Thumbnail ---
async function getThumbnail(iconUrl) {
    try {
        const response = await axios.get(iconUrl, { 
            responseType: 'arraybuffer',
            timeout: 5000
        });
        return Buffer.from(response.data, 'binary');
    } catch (err) {
        return null;
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

module.exports = apkCommand;