const axios = require('axios');

// --- CONFIGURATION ---
const CONFIG = {
    TIMEOUT: 10000,
    MAX_RETRIES: 3,
    USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

// --- JOKE APIS ---
const JOKE_APIS = [
    {
        name: 'icanhazdadjoke',
        url: 'https://icanhazdadjoke.com/',
        parser: (data) => data.joke || null,
        headers: { Accept: 'application/json' }
    },
    {
        name: 'official-joke-api',
        url: 'https://official-joke-api.appspot.com/random_joke',
        parser: (data) => `${data.setup}\n\n${data.punchline}`,
        headers: {}
    },
    {
        name: 'v2.jokeapi',
        url: 'https://v2.jokeapi.dev/joke/Any?type=twopart&safe-mode',
        parser: (data) => {
            if (data.type === 'twopart') {
                return `${data.setup}\n\n${data.delivery}`;
            }
            return data.joke || null;
        },
        headers: {}
    },
    {
        name: 'geek-jokes',
        url: 'https://geek-jokes.sameerkumar.website/api?format=json',
        parser: (data) => data.joke || null,
        headers: {}
    }
];

// --- JOKE CATEGORIES ---
const JOKE_CATEGORIES = {
    'dad': 'https://icanhazdadjoke.com/',
    'programming': 'https://v2.jokeapi.dev/joke/Programming?type=twopart&safe-mode',
    'general': 'https://v2.jokeapi.dev/joke/Any?type=twopart&safe-mode',
    'dark': 'https://v2.jokeapi.dev/joke/Dark?type=twopart&safe-mode',
    'pun': 'https://v2.jokeapi.dev/joke/Pun?type=twopart&safe-mode',
    'spooky': 'https://v2.jokeapi.dev/joke/Spooky?type=twopart&safe-mode',
    'christmas': 'https://v2.jokeapi.dev/joke/Christmas?type=twopart&safe-mode'
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

const getRandomEmoji = () => {
    const emojis = ['😄', '😂', '🤣', '😆', '😅', '😊', '😍', '🤩', '😎', '🥳', '🎉', '💀', '🔥', '✨', '💯'];
    return emojis[Math.floor(Math.random() * emojis.length)];
};

const getRandomEnding = () => {
    const endings = [
        '😂😂😂', '🤣🤣🤣', '😄😄😄', '💀💀💀', '🔥🔥🔥',
        'That\'s a good one! 😂', 'I\'m dead! 💀', 'LOL! 🤣',
        '😂 Keep laughing!', '😄 Hope you enjoyed!'
    ];
    return endings[Math.floor(Math.random() * endings.length)];
};

// --- MAIN COMMAND ---
async function jokeCommand(sock, chatId, message, args = []) {
    try {
        const action = args[0]?.toLowerCase();
        const category = args[1]?.toLowerCase();

        // --- HELP MENU ---
        if (action === 'help' || action === '') {
            return await sock.sendMessage(chatId, {
                text: `╭━━━〔 ${toBold("🎭 JOKE COMMANDS")} 〕━━━┈⊷\n` +
                      `┃\n` +
                      `┃ 📌 ${toBold("Usage:")}\n` +
                      `┃ .joke              - Random joke\n` +
                      `┃ .joke [category]   - Category joke\n` +
                      `┃ .joke categories   - Show categories\n` +
                      `┃ .joke help         - Show help\n` +
                      `┃\n` +
                      `┃ 📌 ${toBold("Categories:")}\n` +
                      `┃ • dad        - Dad jokes\n` +
                      `┃ • programming - Programming jokes\n` +
                      `┃ • general    - General jokes\n` +
                      `┃ • dark       - Dark humor\n` +
                      `┃ • pun        - Pun jokes\n` +
                      `┃ • spooky     - Spooky jokes\n` +
                      `┃ • christmas  - Christmas jokes\n` +
                      `┃\n` +
                      `┃ 📌 ${toBold("Examples:")}\n` +
                      `┃ .joke\n` +
                      `┃ .joke programming\n` +
                      `┃ .joke dad\n` +
                      `┃\n` +
                      `┃ 💡 ${toBold("Tip:")} Get ready to laugh! 😄\n` +
                      `╰━━━━━━━━━━━━━━━━━━┈⊷`
            }, { quoted: message });
        }

        // --- SHOW CATEGORIES ---
        if (action === 'categories') {
            const categoriesList = Object.keys(JOKE_CATEGORIES).map(cat => 
                `• ${cat}`
            ).join('\n');
            
            return await sock.sendMessage(chatId, {
                text: `📋 *Available Joke Categories*\n\n${categoriesList}\n\n💡 Use .joke [category] to get a joke!`
            }, { quoted: message });
        }

        // --- Select API based on category ---
        let apiConfig = null;
        let selectedCategory = 'random';
        
        if (action && JOKE_CATEGORIES[action]) {
            // Category specified
            const categoryUrl = JOKE_CATEGORIES[action];
            selectedCategory = action;
            
            // Find matching API
            for (const api of JOKE_APIS) {
                if (api.url === categoryUrl || categoryUrl.includes(api.url)) {
                    apiConfig = api;
                    break;
                }
            }
            
            if (!apiConfig) {
                // Create custom config for category
                apiConfig = {
                    name: action,
                    url: categoryUrl,
                    parser: (data) => {
                        if (data.joke) return data.joke;
                        if (data.setup && data.delivery) return `${data.setup}\n\n${data.delivery}`;
                        return data.joke || null;
                    },
                    headers: { Accept: 'application/json' }
                };
            }
        }

        // --- Random joke from any API ---
        if (!apiConfig) {
            // Try all APIs randomly
            const shuffledApis = [...JOKE_APIS].sort(() => Math.random() - 0.5);
            
            for (const api of shuffledApis) {
                try {
                    const response = await axios.get(api.url, {
                        headers: { ...api.headers, 'User-Agent': CONFIG.USER_AGENT },
                        timeout: CONFIG.TIMEOUT,
                        validateStatus: s => s >= 200 && s < 500
                    });
                    
                    if (response.data) {
                        const joke = api.parser(response.data);
                        if (joke && joke.length > 0) {
                            apiConfig = api;
                            break;
                        }
                    }
                } catch (error) {
                    console.error(`${api.name} API failed:`, error.message);
                }
            }
        }

        // --- Try the selected API ---
        let joke = null;
        let apiName = 'Unknown';
        
        if (apiConfig) {
            try {
                const response = await axios.get(apiConfig.url, {
                    headers: { ...apiConfig.headers, 'User-Agent': CONFIG.USER_AGENT },
                    timeout: CONFIG.TIMEOUT,
                    validateStatus: s => s >= 200 && s < 500
                });
                
                if (response.data) {
                    joke = apiConfig.parser(response.data);
                    apiName = apiConfig.name;
                }
            } catch (error) {
                console.error(`${apiConfig.name} API failed:`, error.message);
            }
        }

        // --- Fallback: Try all APIs ---
        if (!joke) {
            for (const api of JOKE_APIS) {
                try {
                    const response = await axios.get(api.url, {
                        headers: { ...api.headers, 'User-Agent': CONFIG.USER_AGENT },
                        timeout: CONFIG.TIMEOUT,
                        validateStatus: s => s >= 200 && s < 500
                    });
                    
                    if (response.data) {
                        const parsed = api.parser(response.data);
                        if (parsed && parsed.length > 0) {
                            joke = parsed;
                            apiName = api.name;
                            break;
                        }
                    }
                } catch (error) {
                    console.error(`${api.name} fallback failed:`, error.message);
                }
            }
        }

        // --- No joke found ---
        if (!joke) {
            return await sock.sendMessage(chatId, {
                text: `❌ *No Joke Found!*\n\n` +
                      `Could not fetch a joke at the moment.\n` +
                      `💡 Please try again later.`
            }, { quoted: message });
        }

        // --- Build Response ---
        const emoji = getRandomEmoji();
        const ending = getRandomEnding();
        const timestamp = new Date().toLocaleString();
        
        const responseText = `╭━━━〔 ${toBold(`🎭 ${selectedCategory.toUpperCase()} JOKE`)} 〕━━━┈⊷\n` +
                            `┃\n` +
                            `┃ ${emoji} ${toBold("Here's your joke:")}\n` +
                            `┃\n` +
                            `┃ ${joke}\n` +
                            `┃\n` +
                            `┃ ${ending}\n` +
                            `┃\n` +
                            `┃ 📊 ${toBold("Category:")} ${selectedCategory}\n` +
                            `┃ 🔗 ${toBold("Source:")} ${apiName}\n` +
                            `┃ 🕐 ${toBold("Time:")} ${timestamp}\n` +
                            `┃\n` +
                            `┃ 💡 ${toBold("Tip:")} Use .joke help for more!\n` +
                            `╰━━━━━━━━━━━━━━━━━━┈⊷`;

        // --- Send Joke ---
        await sock.sendMessage(chatId, {
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
        }, { quoted: message });

        // --- Send Reaction ---
        await sock.sendMessage(chatId, { 
            react: { text: '😂', key: message?.key || {} } 
        });

    } catch (error) {
        console.error('Error fetching joke:', error);
        await sock.sendMessage(chatId, {
            text: `❌ *Error Occurred!*\n\n` +
                  `Error: ${error.message}\n` +
                  `💡 Please try again later.`
        }, { quoted: message });
    }
}

module.exports = jokeCommand;