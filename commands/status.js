const toBold = (text) => {
    const boldChars = {
        'a': '𝗮', 'b': '𝗯', 'c': '𝗰', 'd': '𝗱', 'e': '𝗲', 'f': '𝗳', 'g': '𝗴', 'h': '𝗵', 'i': '𝗶', 'j': '𝗷', 'k': '𝗸', 'l': '𝗹', 'm': '𝗺', 'n': '𝗻', 'o': '𝗼', 'p': '𝗽', 'q': '𝗾', 'r': '𝗿', 's': '𝘀', 't': '𝘁', 'u': '𝘂', 'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇',
        'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚', 'H': '𝗛', 'I': '𝗜', 'J': '𝗝', 'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡', 'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝘀', 't': '𝘁', 'u': '𝘂', 'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇',
        '0': '𝟬', '1': '𝟭', '2': '𝟮', '3': '𝟯', '4': '𝟰', '5': '𝟱', '6': '𝟲', '7': '𝟳', '8': '𝟴', '9': '𝟵'
    };
    return text.split('').map(c => boldChars[c] || c).join('');
};

async function statusCommand(sock, from, msg, isAdmin, botData, saveBotData, userId, args) {
    // --- Validation ---
    if (!isAdmin) {
        return await sock.sendMessage(from, { 
            text: "❌ Only admins can use this command." 
        }, { quoted: msg });
    }

    // --- Initialize Settings ---
    if (!botData.statusSettings) botData.statusSettings = {};
    if (!botData.statusSettings[userId]) {
        botData.statusSettings[userId] = {
            autoStatus: false,
            autoSeen: false,
            autoLike: false,
            autoDownload: false,
            autoReply: false,
            autoForward: false,
            autoLog: false,
            skipOwn: true,
            system: 1,
            isPublic: false,
            replyMessage: 'Nice status! 🔥',
            forwardTo: null,
            stats: {
                totalSeen: 0,
                totalLiked: 0,
                totalDownloaded: 0,
                totalReplied: 0,
                lastActivity: null
            }
        };
    }

    const action = args[0]?.toLowerCase();
    const subAction = args[1]?.toLowerCase();

    // --- HELP MENU ---
    if (!action || action === 'help') {
        const settings = botData.statusSettings[userId];
        const stats = settings.stats || { totalSeen: 0, totalLiked: 0, totalDownloaded: 0, totalReplied: 0 };
        
        return await sock.sendMessage(from, {
            text: `╭━━━〔 ${toBold("📱 STATUS SETTINGS")} 〕━━━┈⊷\n` +
                  `┃\n` +
                  `┃ 📌 ${toBold("Commands:")}\n` +
                  `┃ .status on/off           - Toggle All\n` +
                  `┃ .status seen on/off      - Auto Seen\n` +
                  `┃ .status like on/off      - Auto Like\n` +
                  `┃ .status download on/off  - Auto Download\n` +
                  `┃ .status reply on/off     - Auto Reply\n` +
                  `┃ .status replymsg [text]  - Set Reply Message\n` +
                  `┃ .status forward on/off   - Auto Forward\n` +
                  `┃ .status forwardto [jid]  - Forward Target\n` +
                  `┃ .status log on/off       - Auto Log\n` +
                  `┃ .status skipown on/off   - Skip Own Status\n` +
                  `┃ .status system 1/2/3     - Change System\n` +
                  `┃ .status stats            - Show Statistics\n` +
                  `┃ .status reset            - Reset Stats\n` +
                  `┃ .status help             - Show Help\n` +
                  `┃\n` +
                  `┃ 📊 ${toBold("Current Status:")}\n` +
                  `┃ 🟢 ${toBold("Auto Status:")} ${settings.autoStatus ? '✅ On' : '❌ Off'}\n` +
                  `┃ 👁️ ${toBold("Auto Seen:")} ${settings.autoSeen ? '✅ On' : '❌ Off'}\n` +
                  `┃ ❤️ ${toBold("Auto Like:")} ${settings.autoLike ? '✅ On' : '❌ Off'}\n` +
                  `┃ 📥 ${toBold("Auto Download:")} ${settings.autoDownload ? '✅ On' : '❌ Off'}\n` +
                  `┃ 💬 ${toBold("Auto Reply:")} ${settings.autoReply ? '✅ On' : '❌ Off'}\n` +
                  `┃ 📤 ${toBold("Auto Forward:")} ${settings.autoForward ? '✅ On' : '❌ Off'}\n` +
                  `┃ 📝 ${toBold("Auto Log:")} ${settings.autoLog ? '✅ On' : '❌ Off'}\n` +
                  `┃ 🚫 ${toBold("Skip Own:")} ${settings.skipOwn ? '✅ On' : '❌ Off'}\n` +
                  `┃ 🔢 ${toBold("System:")} ${settings.system || 1}\n` +
                  `┃\n` +
                  `┃ 📊 ${toBold("Statistics:")}\n` +
                  `┃ 👁️ Seen: ${stats.totalSeen || 0}\n` +
                  `┃ ❤️ Liked: ${stats.totalLiked || 0}\n` +
                  `┃ 📥 Downloaded: ${stats.totalDownloaded || 0}\n` +
                  `┃ 💬 Replied: ${stats.totalReplied || 0}\n` +
                  `┃\n` +
                  `┃ 💡 ${toBold("Tip:")} Manage status auto-actions!\n` +
                  `╰━━━━━━━━━━━━━━━━━━┈⊷`
        }, { quoted: msg });
    }

    // --- TOGGLE ALL ---
    if (action === 'on') {
        botData.statusSettings[userId].autoStatus = true;
        botData.statusSettings[userId].autoSeen = true;
        botData.statusSettings[userId].autoLike = true;
        botData.statusSettings[userId].autoDownload = true;
        botData.statusSettings[userId].autoReply = true;
        botData.statusSettings[userId].autoForward = true;
        botData.statusSettings[userId].autoLog = true;
        saveBotData();
        
        await sock.sendMessage(from, { 
            text: `✅ *ALL STATUS FEATURES: ON*\n\n` +
                  `🟢 Auto Status: ✅ On\n` +
                  `👁️ Auto Seen: ✅ On\n` +
                  `❤️ Auto Like: ✅ On\n` +
                  `📥 Auto Download: ✅ On\n` +
                  `💬 Auto Reply: ✅ On\n` +
                  `📤 Auto Forward: ✅ On\n` +
                  `📝 Auto Log: ✅ On`
        }, { quoted: msg });
        return;
    }

    if (action === 'off') {
        botData.statusSettings[userId].autoStatus = false;
        botData.statusSettings[userId].autoSeen = false;
        botData.statusSettings[userId].autoLike = false;
        botData.statusSettings[userId].autoDownload = false;
        botData.statusSettings[userId].autoReply = false;
        botData.statusSettings[userId].autoForward = false;
        botData.statusSettings[userId].autoLog = false;
        saveBotData();
        
        await sock.sendMessage(from, { 
            text: `❌ *ALL STATUS FEATURES: OFF*\n\n` +
                  `🟢 Auto Status: ❌ Off\n` +
                  `👁️ Auto Seen: ❌ Off\n` +
                  `❤️ Auto Like: ❌ Off\n` +
                  `📥 Auto Download: ❌ Off\n` +
                  `💬 Auto Reply: ❌ Off\n` +
                  `📤 Auto Forward: ❌ Off\n` +
                  `📝 Auto Log: ❌ Off`
        }, { quoted: msg });
        return;
    }

    // --- AUTO SEEN ---
    if (action === 'seen') {
        if (subAction === 'on') {
            botData.statusSettings[userId].autoSeen = true;
            botData.statusSettings[userId].autoStatus = true;
            saveBotData();
            await sock.sendMessage(from, { 
                text: `✅ *Auto Seen: ON*\n\n👁️ All statuses will be marked as seen.` 
            }, { quoted: msg });
        } else if (subAction === 'off') {
            botData.statusSettings[userId].autoSeen = false;
            saveBotData();
            await sock.sendMessage(from, { 
                text: `❌ *Auto Seen: OFF*\n\n👁️ Statuses will not be marked as seen.` 
            }, { quoted: msg });
        } else {
            await sock.sendMessage(from, { 
                text: `❌ Usage: .status seen [on/off]` 
            }, { quoted: msg });
        }
        return;
    }

    // --- AUTO LIKE ---
    if (action === 'like') {
        if (subAction === 'on') {
            botData.statusSettings[userId].autoLike = true;
            botData.statusSettings[userId].autoStatus = true;
            saveBotData();
            await sock.sendMessage(from, { 
                text: `✅ *Auto Like: ON*\n\n❤️ All statuses will be liked automatically.` 
            }, { quoted: msg });
        } else if (subAction === 'off') {
            botData.statusSettings[userId].autoLike = false;
            saveBotData();
            await sock.sendMessage(from, { 
                text: `❌ *Auto Like: OFF*\n\n❤️ Statuses will not be liked.` 
            }, { quoted: msg });
        } else {
            await sock.sendMessage(from, { 
                text: `❌ Usage: .status like [on/off]` 
            }, { quoted: msg });
        }
        return;
    }

    // --- AUTO DOWNLOAD ---
    if (action === 'download' || action === 'dl') {
        if (subAction === 'on') {
            botData.statusSettings[userId].autoDownload = true;
            botData.statusSettings[userId].autoStatus = true;
            saveBotData();
            await sock.sendMessage(from, { 
                text: `✅ *Auto Download: ON*\n\n📥 All status media will be downloaded.` 
            }, { quoted: msg });
        } else if (subAction === 'off') {
            botData.statusSettings[userId].autoDownload = false;
            saveBotData();
            await sock.sendMessage(from, { 
                text: `❌ *Auto Download: OFF*\n\n📥 Status media will not be downloaded.` 
            }, { quoted: msg });
        } else {
            await sock.sendMessage(from, { 
                text: `❌ Usage: .status download [on/off]` 
            }, { quoted: msg });
        }
        return;
    }

    // --- AUTO REPLY ---
    if (action === 'reply') {
        if (subAction === 'on') {
            botData.statusSettings[userId].autoReply = true;
            botData.statusSettings[userId].autoStatus = true;
            saveBotData();
            await sock.sendMessage(from, { 
                text: `✅ *Auto Reply: ON*\n\n💬 Statuses will be replied automatically.` 
            }, { quoted: msg });
        } else if (subAction === 'off') {
            botData.statusSettings[userId].autoReply = false;
            saveBotData();
            await sock.sendMessage(from, { 
                text: `❌ *Auto Reply: OFF*\n\n💬 Statuses will not be replied.` 
            }, { quoted: msg });
        } else {
            await sock.sendMessage(from, { 
                text: `❌ Usage: .status reply [on/off]` 
            }, { quoted: msg });
        }
        return;
    }

    // --- SET REPLY MESSAGE ---
    if (action === 'replymsg' || action === 'replymessage') {
        const msgText = args.slice(1).join(' ');
        if (!msgText) {
            return await sock.sendMessage(from, { 
                text: `❌ Please provide a reply message.\n📌 Example: .status replymsg Nice status! 🔥` 
            }, { quoted: msg });
        }

        botData.statusSettings[userId].replyMessage = msgText;
        saveBotData();
        await sock.sendMessage(from, { 
            text: `✅ *Reply Message Set!*\n\n💬 ${msgText}` 
        }, { quoted: msg });
        return;
    }

    // --- AUTO FORWARD ---
    if (action === 'forward') {
        if (subAction === 'on') {
            botData.statusSettings[userId].autoForward = true;
            botData.statusSettings[userId].autoStatus = true;
            saveBotData();
            await sock.sendMessage(from, { 
                text: `✅ *Auto Forward: ON*\n\n📤 Statuses will be forwarded automatically.` 
            }, { quoted: msg });
        } else if (subAction === 'off') {
            botData.statusSettings[userId].autoForward = false;
            saveBotData();
            await sock.sendMessage(from, { 
                text: `❌ *Auto Forward: OFF*\n\n📤 Statuses will not be forwarded.` 
            }, { quoted: msg });
        } else {
            await sock.sendMessage(from, { 
                text: `❌ Usage: .status forward [on/off]` 
            }, { quoted: msg });
        }
        return;
    }

    // --- SET FORWARD TARGET ---
    if (action === 'forwardto') {
        const target = args[1];
        if (!target) {
            return await sock.sendMessage(from, { 
                text: `❌ Please provide a target JID.\n📌 Example: .status forwardto 9234567890@g.us` 
            }, { quoted: msg });
        }

        botData.statusSettings[userId].forwardTo = target;
        saveBotData();
        await sock.sendMessage(from, { 
            text: `✅ *Forward Target Set!*\n\n📤 Target: ${target}` 
        }, { quoted: msg });
        return;
    }

    // --- AUTO LOG ---
    if (action === 'log') {
        if (subAction === 'on') {
            botData.statusSettings[userId].autoLog = true;
            botData.statusSettings[userId].autoStatus = true;
            saveBotData();
            await sock.sendMessage(from, { 
                text: `✅ *Auto Log: ON*\n\n📝 Status activities will be logged.` 
            }, { quoted: msg });
        } else if (subAction === 'off') {
            botData.statusSettings[userId].autoLog = false;
            saveBotData();
            await sock.sendMessage(from, { 
                text: `❌ *Auto Log: OFF*\n\n📝 Status activities will not be logged.` 
            }, { quoted: msg });
        } else {
            await sock.sendMessage(from, { 
                text: `❌ Usage: .status log [on/off]` 
            }, { quoted: msg });
        }
        return;
    }

    // --- SKIP OWN STATUS ---
    if (action === 'skipown') {
        if (subAction === 'on') {
            botData.statusSettings[userId].skipOwn = true;
            saveBotData();
            await sock.sendMessage(from, { 
                text: `✅ *Skip Own Status: ON*\n\n🚫 Your own statuses will be ignored.` 
            }, { quoted: msg });
        } else if (subAction === 'off') {
            botData.statusSettings[userId].skipOwn = false;
            saveBotData();
            await sock.sendMessage(from, { 
                text: `❌ *Skip Own Status: OFF*\n\n🚫 Your own statuses will be processed.` 
            }, { quoted: msg });
        } else {
            await sock.sendMessage(from, { 
                text: `❌ Usage: .status skipown [on/off]` 
            }, { quoted: msg });
        }
        return;
    }

    // --- SET SYSTEM ---
    if (action === 'system') {
        const sys = parseInt(args[1]);
        if ([1, 2, 3].includes(sys)) {
            botData.statusSettings[userId].system = sys;
            saveBotData();
            const sysNames = {
                1: 'Basic',
                2: 'Advanced',
                3: 'Pro'
            };
            await sock.sendMessage(from, { 
                text: `✅ *System Set to: ${sys} (${sysNames[sys]})*\n\n` +
                      `🔹 ${sys === 1 ? 'Basic: Auto Seen + Like' : sys === 2 ? 'Advanced: Download + Reply' : 'Pro: All Features'}` 
            }, { quoted: msg });
        } else {
            await sock.sendMessage(from, { 
                text: `❌ Invalid system!\n\nAvailable: 1 (Basic), 2 (Advanced), 3 (Pro)` 
            }, { quoted: msg });
        }
        return;
    }

    // --- STATISTICS ---
    if (action === 'stats' || action === 'statistics') {
        const stats = botData.statusSettings[userId].stats || { 
            totalSeen: 0, totalLiked: 0, totalDownloaded: 0, totalReplied: 0, lastActivity: null 
        };
        const settings = botData.statusSettings[userId];

        await sock.sendMessage(from, {
            text: `📊 *Status Statistics*\n\n` +
                  `👁️ ${toBold("Total Seen:")} ${stats.totalSeen || 0}\n` +
                  `❤️ ${toBold("Total Liked:")} ${stats.totalLiked || 0}\n` +
                  `📥 ${toBold("Total Downloaded:")} ${stats.totalDownloaded || 0}\n` +
                  `💬 ${toBold("Total Replied:")} ${stats.totalReplied || 0}\n` +
                  `📊 ${toBold("Total Actions:")} ${(stats.totalSeen || 0) + (stats.totalLiked || 0) + (stats.totalDownloaded || 0) + (stats.totalReplied || 0)}\n` +
                  `🕐 ${toBold("Last Activity:")} ${stats.lastActivity ? new Date(stats.lastActivity).toLocaleString() : 'Never'}\n` +
                  `\n📱 ${toBold("Status:")} ${settings.autoStatus ? '✅ Active' : '❌ Inactive'}`
        }, { quoted: msg });
        return;
    }

    // --- RESET STATS ---
    if (action === 'reset' || action === 'clear') {
        botData.statusSettings[userId].stats = {
            totalSeen: 0,
            totalLiked: 0,
            totalDownloaded: 0,
            totalReplied: 0,
            lastActivity: null
        };
        saveBotData();
        await sock.sendMessage(from, { 
            text: `🧹 *Statistics Reset!*\n\n🔄 All stats have been cleared.` 
        }, { quoted: msg });
        return;
    }

    // --- DEFAULT ---
    return await sock.sendMessage(from, {
        text: `❌ Invalid command!\n📌 Use .status help for all commands`
    }, { quoted: msg });
}

module.exports = statusCommand;