const fs = require('fs');
const path = require('path');

async function setnameCommand(sock, from, msg, isAdmin, botData, saveBotData, userId, q, args = []) {
    // --- Validation ---
    if (!isAdmin) {
        return await sock.sendMessage(from, { 
            text: "❌ Only admins can use this command." 
        }, { quoted: msg });
    }

    // --- Initialize Data ---
    if (!botData.userNames) botData.userNames = {};
    if (!botData.userNames[userId]) {
        botData.userNames[userId] = {
            name: '',
            history: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }

    const action = args[0]?.toLowerCase();

    // --- HELP MENU ---
    if (!q || q === 'help') {
        const currentName = botData.userNames[userId]?.name || 'Not set';
        const history = botData.userNames[userId]?.history || [];
        
        return await sock.sendMessage(from, {
            text: `╭━━━〔 ${toBold("📝 SETNAME COMMANDS")} 〕━━━┈⊷\n` +
                  `┃\n` +
                  `┃ 📌 ${toBold("Usage:")}\n` +
                  `┃ .setname [name]      - Set your name\n` +
                  `┃ .setname show        - Show your name\n` +
                  `┃ .setname history     - Show name history\n` +
                  `┃ .setname reset       - Reset your name\n` +
                  `┃ .setname help        - Show help\n` +
                  `┃\n` +
                  `┃ 📌 ${toBold("Examples:")}\n` +
                  `┃ .setname Zubair\n` +
                  `┃ .setname "Team Zubair"\n` +
                  `┃ .setname show\n` +
                  `┃\n` +
                  `┃ 📊 ${toBold("Current Name:")} ${currentName}\n` +
                  `┃ 📋 ${toBold("History:")} ${history.length} changes\n` +
                  `┃\n` +
                  `┃ 💡 ${toBold("Tip:")} Set a custom name for yourself!\n` +
                  `╰━━━━━━━━━━━━━━━━━━┈⊷`
        }, { quoted: msg });
    }

    // --- SHOW NAME ---
    if (q === 'show' || q === 'view' || q === 'get') {
        const currentName = botData.userNames[userId]?.name || 'Not set';
        const createdAt = botData.userNames[userId]?.createdAt || new Date().toISOString();
        const updatedAt = botData.userNames[userId]?.updatedAt || new Date().toISOString();
        const history = botData.userNames[userId]?.history || [];

        return await sock.sendMessage(from, {
            text: `📝 *Your Name Info*\n\n` +
                  `👤 ${toBold("Name:")} ${currentName}\n` +
                  `📅 ${toBold("Created:")} ${new Date(createdAt).toLocaleString()}\n` +
                  `🔄 ${toBold("Updated:")} ${new Date(updatedAt).toLocaleString()}\n` +
                  `📋 ${toBold("Changes:")} ${history.length}\n` +
                  `🆔 ${toBold("ID:")} ${userId}`
        }, { quoted: msg });
    }

    // --- HISTORY ---
    if (q === 'history' || q === 'logs') {
        const history = botData.userNames[userId]?.history || [];
        
        if (history.length === 0) {
            return await sock.sendMessage(from, {
                text: `📝 *No Name History*\n\nYou haven't changed your name yet.`
            }, { quoted: msg });
        }

        let historyText = `📝 *Name History*\n\n`;
        history.slice(-10).reverse().forEach((entry, index) => {
            historyText += `${index + 1}. ${entry.name}\n`;
            historyText += `   ${new Date(entry.timestamp).toLocaleString()}\n\n`;
        });

        return await sock.sendMessage(from, { text: historyText }, { quoted: msg });
    }

    // --- RESET ---
    if (q === 'reset' || q === 'clear' || q === 'remove') {
        const oldName = botData.userNames[userId]?.name || 'Not set';
        botData.userNames[userId] = {
            name: '',
            history: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        saveBotData();

        await sock.sendMessage(from, {
            text: `🧹 *Name Reset!*\n\n` +
                  `❌ Removed: ${oldName}\n` +
                  `📝 Name has been cleared.`
        }, { quoted: msg });
        return;
    }

    // --- SET NAME ---
    const newName = q;
    const oldName = botData.userNames[userId]?.name || 'Not set';

    // --- Validate Name ---
    if (newName.length < 1) {
        return await sock.sendMessage(from, {
            text: `❌ *Invalid Name!*\n\nName cannot be empty.`
        }, { quoted: msg });
    }

    if (newName.length > 50) {
        return await sock.sendMessage(from, {
            text: `❌ *Name Too Long!*\n\nMaximum 50 characters allowed.`
        }, { quoted: msg });
    }

    // --- Check for special characters ---
    const cleanName = newName.replace(/[^a-zA-Z0-9\s\-_.]/g, '');
    if (cleanName !== newName) {
        await sock.sendMessage(from, {
            text: `⚠️ *Special characters removed*\n\nClean name: ${cleanName}`
        }, { quoted: msg });
    }

    // --- Save to History ---
    const historyEntry = {
        name: cleanName,
        timestamp: new Date().toISOString(),
        oldName: oldName
    };

    if (!botData.userNames[userId].history) {
        botData.userNames[userId].history = [];
    }
    botData.userNames[userId].history.push(historyEntry);
    
    // Keep only last 50 history entries
    if (botData.userNames[userId].history.length > 50) {
        botData.userNames[userId].history = botData.userNames[userId].history.slice(-50);
    }

    // --- Update Name ---
    botData.userNames[userId].name = cleanName;
    botData.userNames[userId].updatedAt = new Date().toISOString();
    saveBotData();

    // --- Build Response ---
    const responseText = `╭━━━〔 ${toBold("✅ NAME UPDATED")} 〕━━━┈⊷\n` +
                        `┃\n` +
                        `┃ 👤 ${toBold("New Name:")} ${cleanName}\n` +
                        `┃ 📝 ${toBold("Previous:")} ${oldName}\n` +
                        `┃ 📊 ${toBold("Changes:")} ${botData.userNames[userId].history.length}\n` +
                        `┃ 🕐 ${toBold("Updated:")} ${new Date().toLocaleString()}\n` +
                        `┃\n` +
                        `┃ 💡 ${toBold("Tip:")} Use .setname show to view!\n` +
                        `╰━━━━━━━━━━━━━━━━━━┈⊷`;

    await sock.sendMessage(from, { 
        text: responseText,
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

    // --- Send Reaction ---
    await sock.sendMessage(from, { 
        react: { text: '✅', key: msg.key } 
    });

    // --- Send private message to user (optional) ---
    try {
        await sock.sendMessage(userId, {
            text: `👤 *Name Updated!*\n\nYour name has been set to: ${cleanName}\n\n📊 Changes: ${botData.userNames[userId].history.length}`
        });
    } catch (err) {
        // Silent fail for private message
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

module.exports = setnameCommand;