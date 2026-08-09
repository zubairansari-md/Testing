async function pingCommand(sock, from, msg) {
    try {
        // --- Get Message Timestamp ---
        const msgTimestamp = msg.messageTimestamp ? new Date(msg.messageTimestamp * 1000) : new Date();
        const startTime = Date.now();

        // --- Send Initial Message ---
        const sentMsg = await sock.sendMessage(from, { 
            text: `🏓 *Pinging...*\n\n⏳ Measuring response speed...`
        }, { quoted: msg });

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        // --- Get Bot Info ---
        const botName = global.botName || 'TEAM-ZUBAIR-MD';
        const uptime = process.uptime();
        const uptimeFormatted = formatUptime(uptime);

        // --- Get Memory Usage ---
        const memoryUsage = process.memoryUsage();
        const memoryUsed = (memoryUsage.heapUsed / 1024 / 1024).toFixed(2);
        const memoryTotal = (memoryUsage.heapTotal / 1024 / 1024).toFixed(2);

        // --- Get Node.js Version ---
        const nodeVersion = process.version;

        // --- Get Platform ---
        const platform = process.platform;

        // --- Get CPU Info ---
        const cpuCount = require('os').cpus().length;

        // --- Get Connection Status ---
        const connectionStatus = sock.ws?.readyState === 1 ? '🟢 Connected' : '🔴 Disconnected';

        // --- Calculate Response Categories ---
        let speedEmoji = '🚀';
        let speedCategory = 'Lightning Fast!';
        if (responseTime > 500) {
            speedEmoji = '🐢';
            speedCategory = 'Slow';
        } else if (responseTime > 300) {
            speedEmoji = '🏃';
            speedCategory = 'Good';
        } else if (responseTime > 100) {
            speedEmoji = '⚡';
            speedCategory = 'Fast';
        } else {
            speedEmoji = '🚀';
            speedCategory = 'Lightning Fast!';
        }

        // --- Build Response Message ---
        const pingText = `╭━━━〔 ${toBold("🏓 PONG!")} 〕━━━┈⊷\n` +
                         `┃\n` +
                         `┃ ${speedEmoji} ${toBold("Speed:")} ${responseTime}ms\n` +
                         `┃ 📊 ${toBold("Status:")} ${speedCategory}\n` +
                         `┃\n` +
                         `┃ 🤖 ${toBold("Bot:")} ${botName}\n` +
                         `┃ ⏱️ ${toBold("Uptime:")} ${uptimeFormatted}\n` +
                         `┃ 💾 ${toBold("Memory:")} ${memoryUsed}MB / ${memoryTotal}MB\n` +
                         `┃ 📦 ${toBold("Node:")} ${nodeVersion}\n` +
                         `┃ 💻 ${toBold("Platform:")} ${platform}\n` +
                         `┃ 🖥️ ${toBold("CPU:")} ${cpuCount} cores\n` +
                         `┃ 🔗 ${toBold("Connection:")} ${connectionStatus}\n` +
                         `┃\n` +
                         `┃ 🕐 ${toBold("Request:")} ${formatTime(msgTimestamp)}\n` +
                         `┃ 🕐 ${toBold("Response:")} ${formatTime(new Date())}\n` +
                         `┃\n` +
                         `┃ 💡 ${toBold("Tip:")} All systems operational! ✅\n` +
                         `┃\n` +
                         `┃ ⚡ ${toBold("Powered by:")} ${botName}\n` +
                         `╰━━━━━━━━━━━━━━━━━━┈⊷`;

        // --- Edit the message ---
        await sock.sendMessage(from, { 
            text: pingText,
            edit: sentMsg.key,
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

        // --- Send Reaction ---
        if (responseTime < 200) {
            await sock.sendMessage(from, { 
                react: { text: '🚀', key: msg.key } 
            });
        } else if (responseTime < 500) {
            await sock.sendMessage(from, { 
                react: { text: '⚡', key: msg.key } 
            });
        } else {
            await sock.sendMessage(from, { 
                react: { text: '🐢', key: msg.key } 
            });
        }

        // --- Send Additional Info (Optional) ---
        if (responseTime > 1000) {
            await sock.sendMessage(from, {
                text: `⚠️ *High Latency Detected!*\n\n` +
                      `Response time: ${responseTime}ms\n` +
                      `💡 Consider restarting the bot or checking your connection.`
            });
        }

    } catch (error) {
        console.error('Ping Command Error:', error);
        await sock.sendMessage(from, { 
            text: `❌ *Error Occurred!*\n\nError: ${error.message}`
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

// --- HELPER: Format Uptime ---
function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (days > 0) {
        return `${days}d ${hours}h ${minutes}m ${secs}s`;
    } else if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}

// --- HELPER: Format Time ---
function formatTime(date) {
    return date.toLocaleString('en-PK', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
}

module.exports = pingCommand;