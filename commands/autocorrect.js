async function autoreactsCommand(sock, from, msg, isAdmin, session, args) {
    if (!isAdmin) {
        return await sock.sendMessage(from, { 
            text: "❌ Only admins can use this command." 
        }, { quoted: msg });
    }

    const action = args[0]?.toLowerCase();
    const subAction = args[1]?.toLowerCase();

    // --- INITIALIZE DATA ---
    if (!session.autoReact) {
        session.autoReact = {
            enabled: false,
            emojis: ['❤️', '👍', '🔥', '😂', '😍', '🎉', '💯', '👏', '🙌', '🤩'],
            mode: 'random', // random, sequential, custom
            specific: [],
            ignoreBots: true,
            ignoreAdmins: false,
            minWords: 0,
            maxWords: 100,
            cooldown: 2000, // milliseconds
            stats: {
                total: 0,
                lastReact: null
            }
        };
    }

    // --- HELP MENU ---
    if (!action || action === 'help') {
        const status = session.autoReact.enabled ? '✅ Active' : '❌ Inactive';
        const mode = session.autoReact.mode || 'random';
        const emojis = session.autoReact.emojis || [];
        
        return await sock.sendMessage(from, { 
            text: `╭━━━〔 ${toBold("AUTO-REACT COMMANDS")} 〕━━━┈⊷\n` +
                  `┃\n` +
                  `┃ ⋄ ${toBold(".autoreacts on")} - Enable auto-react\n` +
                  `┃ ⋄ ${toBold(".autoreacts off")} - Disable auto-react\n` +
                  `┃ ⋄ ${toBold(".autoreacts status")} - Check status\n` +
                  `┃ ⋄ ${toBold(".autoreacts emojis [❤️👍🔥]")} - Set emojis\n` +
                  `┃ ⋄ ${toBold(".autoreacts mode [random/sequential/custom]")} - Set mode\n` +
                  `┃ ⋄ ${toBold(".autoreacts add [emoji]")} - Add emoji\n` +
                  `┃ ⋄ ${toBold(".autoreacts remove [emoji]")} - Remove emoji\n` +
                  `┃ ⋄ ${toBold(".autoreacts ignorebots [on/off]")} - Ignore bots\n` +
                  `┃ ⋄ ${toBold(".autoreacts ignoreadmins [on/off]")} - Ignore admins\n` +
                  `┃ ⋄ ${toBold(".autoreacts cooldown [ms]")} - Set cooldown\n` +
                  `┃ ⋄ ${toBold(".autoreacts stats")} - Show statistics\n` +
                  `┃ ⋄ ${toBold(".autoreacts reset")} - Reset stats\n` +
                  `┃\n` +
                  `┃ 📊 ${toBold("Status:")} ${status}\n` +
                  `┃ 🔄 ${toBold("Mode:")} ${mode}\n` +
                  `┃ 💖 ${toBold("Emojis:")} ${emojis.join(' ')}\n` +
                  `┃ ⏱️ ${toBold("Cooldown:")} ${session.autoReact.cooldown}ms\n` +
                  `┃ 📈 ${toBold("Total Reacts:")} ${session.autoReact.stats.total || 0}\n` +
                  `╰━━━━━━━━━━━━━━━━━━┈⊷`
        }, { quoted: msg });
    }

    // --- ENABLE ---
    if (action === 'on') {
        session.autoReact.enabled = true;
        session.autoReact.stats = session.autoReact.stats || { total: 0, lastReact: null };
        await sock.sendMessage(from, { 
            text: `✅ *Auto-React Enabled!*\n\n` +
                  `🔄 Mode: ${session.autoReact.mode || 'random'}\n` +
                  `💖 Emojis: ${(session.autoReact.emojis || ['❤️']).join(' ')}\n` +
                  `⏱️ Cooldown: ${session.autoReact.cooldown}ms\n` +
                  `🤖 Ignore Bots: ${session.autoReact.ignoreBots ? 'Yes' : 'No'}\n` +
                  `👑 Ignore Admins: ${session.autoReact.ignoreAdmins ? 'Yes' : 'No'}` 
        }, { quoted: msg });
        return;
    }

    // --- DISABLE ---
    if (action === 'off') {
        session.autoReact.enabled = false;
        await sock.sendMessage(from, { 
            text: `❌ *Auto-React Disabled!*\n\n` +
                  `📊 Total Reacts: ${session.autoReact.stats.total || 0}\n` +
                  `💤 No longer reacting to messages` 
        }, { quoted: msg });
        return;
    }

    // --- STATUS ---
    if (action === 'status') {
        const status = session.autoReact.enabled ? '✅ Active' : '❌ Inactive';
        const emojis = session.autoReact.emojis || ['❤️'];
        const mode = session.autoReact.mode || 'random';
        const stats = session.autoReact.stats || { total: 0, lastReact: null };
        
        return await sock.sendMessage(from, { 
            text: `📊 *Auto-React Status*\n\n` +
                  `🔹 Status: ${status}\n` +
                  `🔹 Mode: ${mode}\n` +
                  `🔹 Emojis: ${emojis.join(' ')}\n` +
                  `🔹 Cooldown: ${session.autoReact.cooldown}ms\n` +
                  `🔹 Ignore Bots: ${session.autoReact.ignoreBots ? '✅' : '❌'}\n` +
                  `🔹 Ignore Admins: ${session.autoReact.ignoreAdmins ? '✅' : '❌'}\n` +
                  `🔹 Total Reacts: ${stats.total || 0}\n` +
                  `🔹 Last React: ${stats.lastReact ? new Date(stats.lastReact).toLocaleString() : 'Never'}` 
        }, { quoted: msg });
    }

    // --- SET EMOJIS ---
    if (action === 'emojis') {
        const emojiList = args.slice(1);
        if (emojiList.length === 0) {
            return await sock.sendMessage(from, { 
                text: "❌ Please provide emojis.\n" +
                      "📌 Example: .autoreacts emojis ❤️👍🔥" 
            }, { quoted: msg });
        }

        session.autoReact.emojis = emojiList;
        await sock.sendMessage(from, { 
            text: `✅ *Emojis Updated!*\n\n` +
                  `💖 New Emojis: ${emojiList.join(' ')}\n` +
                  `📊 Total: ${emojiList.length} emojis` 
        }, { quoted: msg });
        return;
    }

    // --- SET MODE ---
    if (action === 'mode') {
        const mode = args[1]?.toLowerCase();
        if (!['random', 'sequential', 'custom'].includes(mode)) {
            return await sock.sendMessage(from, { 
                text: "❌ Invalid mode!\n" +
                      "📌 Available: random, sequential, custom\n" +
                      "💡 random = Random emoji\n" +
                      "💡 sequential = Use in order\n" +
                      "💡 custom = Only specific emojis" 
            }, { quoted: msg });
        }

        session.autoReact.mode = mode;
        await sock.sendMessage(from, { 
            text: `✅ *Mode Updated!*\n\n` +
                  `🔄 New Mode: ${mode}\n` +
                  `💡 ${mode === 'random' ? 'Random emojis will be used' : 
                      mode === 'sequential' ? 'Emojis will be used in order' : 
                      'Only custom emojis will be used'}` 
        }, { quoted: msg });
        return;
    }

    // --- ADD EMOJI ---
    if (action === 'add') {
        const emoji = args[1];
        if (!emoji) {
            return await sock.sendMessage(from, { 
                text: "❌ Please provide an emoji to add.\n" +
                      "📌 Example: .autoreacts add 🎉" 
            }, { quoted: msg });
        }

        if (!session.autoReact.emojis) {
            session.autoReact.emojis = [];
        }

        if (!session.autoReact.emojis.includes(emoji)) {
            session.autoReact.emojis.push(emoji);
        }

        await sock.sendMessage(from, { 
            text: `✅ *Emoji Added!*\n\n` +
                  `💖 Added: ${emoji}\n` +
                  `📊 Total Emojis: ${session.autoReact.emojis.length}\n` +
                  `💖 Current: ${session.autoReact.emojis.join(' ')}` 
        }, { quoted: msg });
        return;
    }

    // --- REMOVE EMOJI ---
    if (action === 'remove') {
        const emoji = args[1];
        if (!emoji) {
            return await sock.sendMessage(from, { 
                text: "❌ Please provide an emoji to remove.\n" +
                      "📌 Example: .autoreacts remove ❤️" 
            }, { quoted: msg });
        }

        if (session.autoReact.emojis) {
            session.autoReact.emojis = session.autoReact.emojis.filter(e => e !== emoji);
        }

        await sock.sendMessage(from, { 
            text: `❌ *Emoji Removed!*\n\n` +
                  `💖 Removed: ${emoji}\n` +
                  `📊 Total Emojis: ${session.autoReact.emojis.length}\n` +
                  `💖 Current: ${session.autoReact.emojis.join(' ')}` 
        }, { quoted: msg });
        return;
    }

    // --- IGNORE BOTS ---
    if (action === 'ignorebots') {
        const mode = args[1]?.toLowerCase();
        if (!['on', 'off'].includes(mode)) {
            return await sock.sendMessage(from, { 
                text: "❌ Usage: .autoreacts ignorebots [on/off]" 
            }, { quoted: msg });
        }

        session.autoReact.ignoreBots = mode === 'on';
        await sock.sendMessage(from, { 
            text: `${mode === 'on' ? '✅' : '❌'} *Bot Ignoring ${mode === 'on' ? 'Enabled' : 'Disabled'}*\n\n` +
                  `${mode === 'on' ? '🤖 Bot messages will be ignored' : '🤖 Bot messages will be reacted to'}` 
        }, { quoted: msg });
        return;
    }

    // --- IGNORE ADMINS ---
    if (action === 'ignoreadmins') {
        const mode = args[1]?.toLowerCase();
        if (!['on', 'off'].includes(mode)) {
            return await sock.sendMessage(from, { 
                text: "❌ Usage: .autoreacts ignoreadmins [on/off]" 
            }, { quoted: msg });
        }

        session.autoReact.ignoreAdmins = mode === 'on';
        await sock.sendMessage(from, { 
            text: `${mode === 'on' ? '✅' : '❌'} *Admin Ignoring ${mode === 'on' ? 'Enabled' : 'Disabled'}*\n\n` +
                  `${mode === 'on' ? '👑 Admin messages will be ignored' : '👑 Admin messages will be reacted to'}` 
        }, { quoted: msg });
        return;
    }

    // --- SET COOLDOWN ---
    if (action === 'cooldown') {
        const ms = parseInt(args[1]);
        if (isNaN(ms) || ms < 0) {
            return await sock.sendMessage(from, { 
                text: "❌ Invalid cooldown!\n" +
                      "📌 Example: .autoreacts cooldown 2000\n" +
                      "💡 2000ms = 2 seconds" 
            }, { quoted: msg });
        }

        session.autoReact.cooldown = ms;
        await sock.sendMessage(from, { 
            text: `✅ *Cooldown Updated!*\n\n` +
                  `⏱️ New Cooldown: ${ms}ms\n` +
                  `🔄 ${ms === 0 ? 'No cooldown (fast mode)' : ms / 1000 + ' seconds'}` 
        }, { quoted: msg });
        return;
    }

    // --- STATS ---
    if (action === 'stats') {
        const stats = session.autoReact.stats || { total: 0, lastReact: null };
        const emojis = session.autoReact.emojis || ['❤️'];
        
        return await sock.sendMessage(from, { 
            text: `📊 *Auto-React Statistics*\n\n` +
                  `📈 Total Reacts: ${stats.total || 0}\n` +
                  `💖 Emojis: ${emojis.join(' ')}\n` +
                  `🔄 Mode: ${session.autoReact.mode || 'random'}\n` +
                  `⏱️ Cooldown: ${session.autoReact.cooldown}ms\n` +
                  `🤖 Ignore Bots: ${session.autoReact.ignoreBots ? 'Yes' : 'No'}\n` +
                  `👑 Ignore Admins: ${session.autoReact.ignoreAdmins ? 'Yes' : 'No'}\n` +
                  `⏰ Last React: ${stats.lastReact ? new Date(stats.lastReact).toLocaleString() : 'Never'}\n` +
                  `📊 Status: ${session.autoReact.enabled ? 'Active' : 'Inactive'}` 
        }, { quoted: msg });
    }

    // --- RESET STATS ---
    if (action === 'reset' || action === 'clear') {
        session.autoReact.stats = { 
            total: 0, 
            lastReact: null 
        };
        await sock.sendMessage(from, { 
            text: `🧹 *Stats Reset!*\n\n` +
                  `🔄 All statistics have been cleared.\n` +
                  `📊 Starting fresh!` 
        }, { quoted: msg });
        return;
    }

    // --- DEFAULT ---
    return await sock.sendMessage(from, { 
        text: "❌ Invalid command!\n" +
              "📌 Use .autoreacts help for all commands" 
    }, { quoted: msg });
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

module.exports = autoreactsCommand;