const fetch = require('node-fetch');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');
const { promisify } = require('util');
const execPromise = promisify(exec);

// --- CONFIGURATION ---
const CONFIG = {
    TEMP_DIR: path.join(process.cwd(), 'tmp', 'emojimix'),
    STICKER_SIZE: 512,
    CACHE_DURATION: 3600000, // 1 hour
    API_KEY: 'AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ'
};

// --- EMOJI CATEGORIES ---
const EMOJI_CATEGORIES = {
    smileys: ['😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊', '😋', '😎', '😍', '🥰', '😘'],
    hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹'],
    animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵'],
    food: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥝'],
    nature: ['🌸', '🌺', '🌻', '🌹', '🥀', '🌷', '🌿', '☘️', '🍀', '🌱', '🌲', '🌳', '🌴', '🌵', '🌾'],
    objects: ['📱', '💻', '⌚', '📷', '📸', '🔮', '💡', '🔦', '🕯️', '💎', '🔑', '🗝️', '🧿', '📿', '🧸']
};

// --- HELPER: Get Random Emoji ---
const getRandomEmoji = (category = null) => {
    if (category && EMOJI_CATEGORIES[category]) {
        const emojis = EMOJI_CATEGORIES[category];
        return emojis[Math.floor(Math.random() * emojis.length)];
    }
    const allEmojis = Object.values(EMOJI_CATEGORIES).flat();
    return allEmojis[Math.floor(Math.random() * allEmojis.length)];
};

// --- HELPER: Get Categories List ---
const getCategoriesList = () => {
    return Object.keys(EMOJI_CATEGORIES).map(cat => 
        `• ${cat}: ${EMOJI_CATEGORIES[cat][0]} ${EMOJI_CATEGORIES[cat][1]} ${EMOJI_CATEGORIES[cat][2]}`
    ).join('\n');
};

// --- HELPER: Validate Emoji ---
const isValidEmoji = (emoji) => {
    const emojiRegex = /[\u{1F000}-\u{1FFFF}]|[\u2600}-\u{27BF}]|[\u{2700}-\u{27BF}]|[\u{FE00}-\u{FEFF}]|[\u{1F300}-\u{1F5FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{1FB00}-\u{1FBFF}]/u;
    return emojiRegex.test(emoji);
};

// --- MAIN COMMAND ---
async function emojimixCommand(sock, chatId, msg) {
    try {
        // Get the text after command
        const text = msg.message?.conversation?.trim() || 
                    msg.message?.extendedTextMessage?.text?.trim() || '';
        
        const args = text.split(' ').slice(1);
        
        // --- HELP MENU ---
        if (!args[0] || args[0] === 'help') {
            await sock.sendMessage(chatId, { 
                text: `╭━━━〔 ${toBold("🎨 EMOJIMIX COMMANDS")} 〕━━━┈⊷\n` +
                      `┃\n` +
                      `┃ 📌 ${toBold("Usage:")}\n` +
                      `┃ .emojimix 😎+🥰\n` +
                      `┃ .emojimix random\n` +
                      `┃ .emojimix [category]\n` +
                      `┃\n` +
                      `┃ 📌 ${toBold("Categories:")}\n` +
                      `${getCategoriesList()}\n` +
                      `┃\n` +
                      `┃ 📌 ${toBold("Examples:")}\n` +
                      `┃ .emojimix 😂+😍\n` +
                      `┃ .emojimix random\n` +
                      `┃ .emojimix animals\n` +
                      `┃\n` +
                      `┃ 💡 ${toBold("Tip:")} Mix any two emojis!\n` +
                      `╰━━━━━━━━━━━━━━━━━━┈⊷`
            });
            return;
        }

        // --- RANDOM EMOJI MIX ---
        if (args[0].toLowerCase() === 'random') {
            const emoji1 = getRandomEmoji();
            const emoji2 = getRandomEmoji();
            args[0] = `${emoji1}+${emoji2}`;
            await sock.sendMessage(chatId, { 
                react: { text: '🎲', key: msg.key } 
            });
        }

        // --- CATEGORY MIX ---
        if (EMOJI_CATEGORIES[args[0]?.toLowerCase()]) {
            const category = args[0].toLowerCase();
            const emoji1 = getRandomEmoji(category);
            const emoji2 = getRandomEmoji();
            args[0] = `${emoji1}+${emoji2}`;
            await sock.sendMessage(chatId, { 
                react: { text: '🎯', key: msg.key } 
            });
        }

        // --- Check for + sign ---
        if (!args[0].includes('+')) {
            await sock.sendMessage(chatId, { 
                text: `✳️ Separate the emoji with a *+* sign\n\n` +
                      `📌 ${toBold("Examples:")}\n` +
                      `• .emojimix 😎+🥰\n` +
                      `• .emojimix random\n` +
                      `• .emojimix animals`
            });
            return;
        }

        // --- Extract emojis ---
        let [emoji1, emoji2] = args[0].split('+').map(e => e.trim());

        // --- Validate emojis ---
        if (!isValidEmoji(emoji1) || !isValidEmoji(emoji2)) {
            await sock.sendMessage(chatId, { 
                text: `❌ *Invalid Emoji!*\n\n` +
                      `Please use valid emojis.\n` +
                      `💡 Example: .emojimix 😎+🥰`
            });
            return;
        }

        // --- React with loading ---
        await sock.sendMessage(chatId, { react: { text: '⏳', key: msg.key } });

        // --- Send processing message ---
        await sock.sendMessage(chatId, {
            text: `🎨 *Mixing Emojis...*\n\n` +
                  `${emoji1} + ${emoji2} = ?\n` +
                  `⏳ Please wait...`
        });

        // --- Create temp directory ---
        if (!fs.existsSync(CONFIG.TEMP_DIR)) {
            fs.mkdirSync(CONFIG.TEMP_DIR, { recursive: true });
        }

        // --- API Call ---
        const url = `https://tenor.googleapis.com/v2/featured?key=${CONFIG.API_KEY}&contentfilter=high&media_filter=png_transparent&component=proactive&collection=emoji_kitchen_v5&q=${encodeURIComponent(emoji1)}_${encodeURIComponent(emoji2)}`;

        const response = await fetch(url);
        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            // Try reversed order
            const reverseUrl = `https://tenor.googleapis.com/v2/featured?key=${CONFIG.API_KEY}&contentfilter=high&media_filter=png_transparent&component=proactive&collection=emoji_kitchen_v5&q=${encodeURIComponent(emoji2)}_${encodeURIComponent(emoji1)}`;
            const reverseResponse = await fetch(reverseUrl);
            const reverseData = await reverseResponse.json();

            if (!reverseData.results || reverseData.results.length === 0) {
                await sock.sendMessage(chatId, { 
                    text: `❌ *Cannot Mix These Emojis!*\n\n` +
                          `${emoji1} and ${emoji2} cannot be mixed.\n` +
                          `💡 Try different emojis or use .emojimix random`
                });
                return;
            }
            data.results = reverseData.results;
        }

        // --- Get image URL ---
        const imageUrl = data.results[0].url;

        // --- Download image ---
        const imageResponse = await fetch(imageUrl);
        const buffer = await imageResponse.buffer();

        // --- Save temp file ---
        const timestamp = Date.now();
        const tempFile = path.join(CONFIG.TEMP_DIR, `temp_${timestamp}.png`);
        const outputFile = path.join(CONFIG.TEMP_DIR, `sticker_${timestamp}.webp`);

        fs.writeFileSync(tempFile, buffer);

        // --- Convert to WebP ---
        const ffmpegCommand = `ffmpeg -i "${tempFile}" -vf "scale=${CONFIG.STICKER_SIZE}:${CONFIG.STICKER_SIZE}:force_original_aspect_ratio=decrease,format=rgba,pad=${CONFIG.STICKER_SIZE}:${CONFIG.STICKER_SIZE}:(ow-iw)/2:(oh-ih)/2:color=#00000000" -lossless 1 "${outputFile}"`;
        
        try {
            await execPromise(ffmpegCommand);
        } catch (error) {
            console.error('FFmpeg error:', error);
            // Try without padding
            const fallbackCommand = `ffmpeg -i "${tempFile}" -vf "scale=${CONFIG.STICKER_SIZE}:${CONFIG.STICKER_SIZE}:force_original_aspect_ratio=decrease" -lossless 1 "${outputFile}"`;
            await execPromise(fallbackCommand);
        }

        // --- Check if output exists ---
        if (!fs.existsSync(outputFile)) {
            throw new Error('Failed to create sticker');
        }

        // --- Read sticker ---
        const stickerBuffer = fs.readFileSync(outputFile);

        // --- Prepare caption ---
        const caption = `🎨 *Emoji Mix*\n\n` +
                       `🔹 ${emoji1} + ${emoji2}\n` +
                       `🕐 ${new Date().toLocaleString()}\n` +
                       `💡 Made with ❤️ by TEAM-ZUBAIR-MD`;

        // --- Send sticker ---
        await sock.sendMessage(chatId, { 
            sticker: stickerBuffer,
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

        // --- Send success reaction ---
        await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } });

        // --- Send additional info ---
        await sock.sendMessage(chatId, {
            text: `✅ *Emoji Mixed Successfully!*\n\n` +
                  `🎨 ${emoji1} + ${emoji2}\n` +
                  `💡 Try .emojimix random for surprise mixes!`
        });

        // --- Cleanup temp files ---
        try {
            setTimeout(() => {
                if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
                if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
            }, 5000);
        } catch (err) {
            console.error('Cleanup error:', err);
        }

    } catch (error) {
        console.error('Error in emojimix command:', error);
        await sock.sendMessage(chatId, { 
            text: `❌ *Error Occurred!*\n\n` +
                  `Error: ${error.message}\n` +
                  `💡 Make sure you're using valid emojis.\n` +
                  `📌 Example: .emojimix 😎+🥰`
        });
        await sock.sendMessage(chatId, { react: { text: '❌', key: msg.key } });
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

module.exports = emojimixCommand;