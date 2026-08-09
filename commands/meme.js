const fetch = require('node-fetch');
const axios = require('axios');

// --- CONFIGURATION ---
const CONFIG = {
    TIMEOUT: 15000,
    MAX_RETRIES: 3,
    USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

// --- MEME APIS ---
const MEME_APIS = [
    {
        name: 'Cheems',
        url: 'https://shizoapi.onrender.com/api/memes/cheems?apikey=shizo',
        type: 'image'
    },
    {
        name: 'Doge',
        url: 'https://shizoapi.onrender.com/api/memes/doge?apikey=shizo',
        type: 'image'
    },
    {
        name: 'Random',
        url: 'https://shizoapi.onrender.com/api/memes/random?apikey=shizo',
        type: 'image'
    },
    {
        name: 'MemeAPI',
        url: 'https://meme-api.com/gimme',
        parser: (data) => data.url,
        type: 'image'
    },
    {
        name: 'Reddit Memes',
        url: 'https://www.reddit.com/r/memes/random.json?limit=1',
        parser: (data) => data[0]?.data?.children?.[0]?.data?.url,
        type: 'image'
    },
    {
        name: 'Programming Memes',
        url: 'https://www.reddit.com/r/ProgrammerHumor/random.json?limit=1',
        parser: (data) => data[0]?.data?.children?.[0]?.data?.url,
        type: 'image'
    }
];

// --- MEME CATEGORIES ---
const MEME_CATEGORIES = {
    'cheems': 'https://shizoapi.onrender.com/api/memes/cheems?apikey=shizo',
    'doge': 'https://shizoapi.onrender.com/api/memes/doge?apikey=shizo',
    'random': 'https://shizoapi.onrender.com/api/memes/random?apikey=shizo',
    'reddit': 'https://meme-api.com/gimme',
    'programming': 'https://www.reddit.com/r/ProgrammerHumor/random.json?limit=1',
    'wholesome': 'https://www.reddit.com/r/wholesomememes/random.json?limit=1',
    'dank': 'https://www.reddit.com/r/dankmemes/random.json?limit=1'
};

// --- HELPERS ---
const toBold = (text) => {
    const boldChars = {
        'a': '𝗮', 'b': '𝗯', 'c': '𝗰', 'd': '𝗱', 'e': '𝗲', 'f': '𝗳', 'g': '𝗴', 'h': '𝗵', 'i': '𝗶', 'j': '𝗷', 'k': '𝗸', 'l': '𝗹', 'm': '𝗺', 'n': '𝗻', 'o': '𝗼', 'p': '𝗽', 'q': '𝗾', 'r': '𝗿', 's': '𝘀', 't': '𝘁', 'u': '𝘂', 'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇',
        'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚', 'H': '𝗛', 'I': '𝗜', 'J': '𝗝', 'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡', 'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝘀', 't': '𝘁', 'u': '𝘂', 'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇',
        '0': '𝟬', '1': '𝟭', '2': '𝟮', '3': '𝟯', '4': '𝟰', '5': '𝟱', '6': '𝟲', '7': '𝟳', '8': '𝟴', '9': '𝟵'
    };
    return text.split('').map(c => boldChars[c] || c).join('');
};

const getRandomEnding = () => {
    const endings = [
        '😂 Keep laughing!', '🤣 That\'s a good one!', '💀 I\'m dead!',
        '😄 Hope you enjoyed!', '🔥🔥🔥', '🎉🎉🎉',
        '💯 Perfect meme!', '😭 Too funny!', '🤪 Crazy!'
    ];
    return endings[Math.floor(Math.random() * endings.length)];
};

const getRandomWatermark = () => {
    const watermarks = [
        'TEAM-ZUBAIR-MD',
        'Powered by TEAM-ZUBAIR-MD',
        '❤️ TEAM-ZUBAIR-MD',
        '✨ TEAM-ZUBAIR-MD',
        '🔥 TEAM-ZUBAIR-MD'
    ];
    return watermarks[Math.floor(Math.random() * watermarks.length)];
};

// --- MAIN COMMAND ---
async function memeCommand(sock, chatId, message, args = []) {
    try {
        const action = args[0]?.toLowerCase();
        const category = args[1]?.toLowerCase();

        // --- HELP MENU ---
        if (!action || action === 'help') {
            return await sock.sendMessage(chatId, {
                text: `╭━━━〔 ${toBold("🎭 MEME COMMANDS")} 〕━━━┈⊷\n` +
                      `┃\n` +
                      `┃ 📌 ${toBold("Usage:")}\n` +
                      `┃ .meme              - Random meme\n` +
                      `┃ .meme [category]   - Category meme\n` +
                      `┃ .meme help         - Show help\n` +
                      `┃\n` +
                      `┃ 📌 ${toBold("Categories:")}\n` +
                      `┃ • cheems      - Cheems memes\n` +
                      `┃ • doge        - Doge memes\n` +
                      `┃ • random      - Random memes\n` +
                      `┃ • reddit      - Reddit memes\n` +
                      `┃ • programming - Programming memes\n` +
                      `┃ • wholesome   - Wholesome memes\n` +
                      `┃ • dank        - Dank memes\n` +
                      `┃\n` +
                      `┃ 📌 ${toBold("Examples:")}\n` +
                      `┃ .meme\n` +
                      `┃ .meme programming\n` +
                      `┃ .meme cheems\n` +
                      `┃\n` +
                      `┃ 💡 ${toBold("Tip:")} Get ready to laugh! 😄\n` +
                      `╰━━━━━━━━━━━━━━━━━━┈⊷`
            }, { quoted: message });
        }

        // --- Send loading reaction ---
        await sock.sendMessage(chatId, { 
            react: { text: '🔄', key: message.key } 
        });

        // --- Send processing message ---
        await sock.sendMessage(chatId, {
            text: `🔍 *Fetching meme...*\n\n⏳ Please wait...`
        }, { quoted: message });

        // --- Select category ---
        let selectedCategory = action;
        let apiUrl = null;
        let apiType = 'image';

        if (action && MEME_CATEGORIES[action]) {
            apiUrl = MEME_CATEGORIES[action];
        } else {
            // Random category
            const categories = Object.keys(MEME_CATEGORIES);
            selectedCategory = categories[Math.floor(Math.random() * categories.length)];
            apiUrl = MEME_CATEGORIES[selectedCategory];
        }

        // --- Fetch meme with retry ---
        let memeBuffer = null;
        let memeUrl = null;
        let memeTitle = 'Meme';
        let usedApi = 'Unknown';

        for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
            try {
                // For Reddit APIs
                if (apiUrl.includes('reddit.com')) {
                    const response = await axios.get(apiUrl, {
                        headers: { 'User-Agent': CONFIG.USER_AGENT },
                        timeout: CONFIG.TIMEOUT
                    });
                    
                    const data = response.data;
                    let imageUrl = null;
                    
                    if (Array.isArray(data) && data[0]?.data?.children) {
                        const children = data[0].data.children;
                        if (children.length > 0) {
                            imageUrl = children[0].data.url;
                            memeTitle = children[0].data.title || 'Meme';
                        }
                    }
                    
                    if (imageUrl && (imageUrl.endsWith('.jpg') || imageUrl.endsWith('.png') || imageUrl.endsWith('.jpeg'))) {
                        const imageResponse = await axios.get(imageUrl, {
                            responseType: 'arraybuffer',
                            timeout: CONFIG.TIMEOUT
                        });
                        memeBuffer = Buffer.from(imageResponse.data);
                        usedApi = 'Reddit';
                    }
                } 
                // For MemeAPI
                else if (apiUrl.includes('meme-api.com')) {
                    const response = await axios.get(apiUrl, {
                        timeout: CONFIG.TIMEOUT
                    });
                    
                    const data = response.data;
                    if (data && data.url) {
                        const imageResponse = await axios.get(data.url, {
                            responseType: 'arraybuffer',
                            timeout: CONFIG.TIMEOUT
                        });
                        memeBuffer = Buffer.from(imageResponse.data);
                        memeTitle = data.title || 'Meme';
                        usedApi = 'MemeAPI';
                    }
                }
                // For ShizoAPI
                else {
                    const response = await fetch(apiUrl);
                    const contentType = response.headers.get('content-type');
                    
                    if (contentType && contentType.includes('image')) {
                        memeBuffer = await response.buffer();
                        usedApi = 'ShizoAPI';
                    } else {
                        const data = await response.json();
                        if (data && data.url) {
                            const imageResponse = await axios.get(data.url, {
                                responseType: 'arraybuffer',
                                timeout: CONFIG.TIMEOUT
                            });
                            memeBuffer = Buffer.from(imageResponse.data);
                            usedApi = 'ShizoAPI';
                        }
                    }
                }

                if (memeBuffer) break;

            } catch (error) {
                console.error(`Attempt ${attempt} failed:`, error.message);
                if (attempt === CONFIG.MAX_RETRIES) {
                    throw error;
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        // --- No meme found ---
        if (!memeBuffer) {
            await sock.sendMessage(chatId, {
                text: `❌ *No Meme Found!*\n\n` +
                      `Could not fetch a meme at the moment.\n` +
                      `💡 Please try again later.`
            }, { quoted: message });
            await sock.sendMessage(chatId, { 
                react: { text: '❌', key: message.key } 
            });
            return;
        }

        // --- Build Response ---
        const ending = getRandomEnding();
        const watermark = getRandomWatermark();
        const timestamp = new Date().toLocaleString();

        const caption = `╭━━━〔 ${toBold(`🎭 ${selectedCategory.toUpperCase()} MEME`)} 〕━━━┈⊷\n` +
                       `┃\n` +
                       `┃ 📝 ${toBold("Title:")} ${memeTitle || 'Meme'}\n` +
                       `┃ 📊 ${toBold("Category:")} ${selectedCategory}\n` +
                       `┃ 🔗 ${toBold("Source:")} ${usedApi}\n` +
                       `┃ 🕐 ${toBold("Time:")} ${timestamp}\n` +
                       `┃\n` +
                       `┃ ${ending}\n` +
                       `┃\n` +
                       `┃ 💡 ${toBold("Tip:")} Use .meme help for more!\n` +
                       `┃\n` +
                       `┃ ⚡ ${toBold("Downloaded By:")} ${watermark}\n` +
                       `╰━━━━━━━━━━━━━━━━━━┈⊷`;

        // --- Send Meme ---
        await sock.sendMessage(chatId, {
            image: memeBuffer,
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
        }, { quoted: message });

        // --- Send success reaction ---
        await sock.sendMessage(chatId, { 
            react: { text: '😂', key: message.key } 
        });

        // --- Send quick buttons (optional) ---
        try {
            const buttons = [
                { buttonId: '.meme', buttonText: { displayText: '🎭 Another Meme' }, type: 1 },
                { buttonId: '.meme ' + selectedCategory, buttonText: { displayText: '🔄 Same Category' }, type: 1 },
                { buttonId: '.joke', buttonText: { displayText: '😄 Joke' }, type: 1 }
            ];

            await sock.sendMessage(chatId, {
                text: `🎭 *Want more memes?*\n\nClick the buttons below!`,
                buttons: buttons,
                headerType: 1
            }, { quoted: message });
        } catch (buttonError) {
            // Silent fail for buttons
        }

    } catch (error) {
        console.error('Error in meme command:', error);
        await sock.sendMessage(chatId, {
            text: `❌ *Error Occurred!*\n\n` +
                  `Error: ${error.message}\n` +
                  `💡 Please try again later.`
        }, { quoted: message });
        await sock.sendMessage(chatId, { 
            react: { text: '❌', key: message.key } 
        });
    }
}

module.exports = memeCommand;