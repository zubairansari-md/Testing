const fetch = require('node-fetch');

// --- LANGUAGE CODES ---
const LANGUAGES = {
    'af': 'Afrikaans',
    'sq': 'Albanian',
    'am': 'Amharic',
    'ar': 'Arabic',
    'hy': 'Armenian',
    'az': 'Azerbaijani',
    'eu': 'Basque',
    'be': 'Belarusian',
    'bn': 'Bengali',
    'bs': 'Bosnian',
    'bg': 'Bulgarian',
    'ca': 'Catalan',
    'ceb': 'Cebuano',
    'zh': 'Chinese',
    'zh-cn': 'Chinese (Simplified)',
    'zh-tw': 'Chinese (Traditional)',
    'co': 'Corsican',
    'hr': 'Croatian',
    'cs': 'Czech',
    'da': 'Danish',
    'nl': 'Dutch',
    'en': 'English',
    'eo': 'Esperanto',
    'et': 'Estonian',
    'fi': 'Finnish',
    'fr': 'French',
    'fy': 'Frisian',
    'gl': 'Galician',
    'ka': 'Georgian',
    'de': 'German',
    'el': 'Greek',
    'gu': 'Gujarati',
    'ht': 'Haitian Creole',
    'ha': 'Hausa',
    'haw': 'Hawaiian',
    'he': 'Hebrew',
    'hi': 'Hindi',
    'hmn': 'Hmong',
    'hu': 'Hungarian',
    'is': 'Icelandic',
    'ig': 'Igbo',
    'id': 'Indonesian',
    'ga': 'Irish',
    'it': 'Italian',
    'ja': 'Japanese',
    'jv': 'Javanese',
    'kn': 'Kannada',
    'kk': 'Kazakh',
    'km': 'Khmer',
    'rw': 'Kinyarwanda',
    'ko': 'Korean',
    'ku': 'Kurdish',
    'ky': 'Kyrgyz',
    'lo': 'Lao',
    'la': 'Latin',
    'lv': 'Latvian',
    'lt': 'Lithuanian',
    'lb': 'Luxembourgish',
    'mk': 'Macedonian',
    'mg': 'Malagasy',
    'ms': 'Malay',
    'ml': 'Malayalam',
    'mt': 'Maltese',
    'mi': 'Maori',
    'mr': 'Marathi',
    'mn': 'Mongolian',
    'my': 'Myanmar',
    'ne': 'Nepali',
    'no': 'Norwegian',
    'ny': 'Nyanja',
    'or': 'Odia',
    'ps': 'Pashto',
    'fa': 'Persian',
    'pl': 'Polish',
    'pt': 'Portuguese',
    'pa': 'Punjabi',
    'ro': 'Romanian',
    'ru': 'Russian',
    'sm': 'Samoan',
    'gd': 'Scottish Gaelic',
    'sr': 'Serbian',
    'st': 'Sesotho',
    'sn': 'Shona',
    'sd': 'Sindhi',
    'si': 'Sinhala',
    'sk': 'Slovak',
    'sl': 'Slovenian',
    'so': 'Somali',
    'es': 'Spanish',
    'su': 'Sundanese',
    'sw': 'Swahili',
    'sv': 'Swedish',
    'tl': 'Tagalog',
    'tg': 'Tajik',
    'ta': 'Tamil',
    'tt': 'Tatar',
    'te': 'Telugu',
    'th': 'Thai',
    'tr': 'Turkish',
    'tk': 'Turkmen',
    'uk': 'Ukrainian',
    'ur': 'Urdu',
    'ug': 'Uyghur',
    'uz': 'Uzbek',
    'vi': 'Vietnamese',
    'cy': 'Welsh',
    'xh': 'Xhosa',
    'yi': 'Yiddish',
    'yo': 'Yoruba',
    'zu': 'Zulu'
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

const getLanguageName = (code) => {
    return LANGUAGES[code] || code.toUpperCase();
};

const detectLanguage = (text) => {
    // Simple language detection based on common patterns
    const patterns = {
        'ar': /[\u0600-\u06FF]/,
        'zh': /[\u4e00-\u9fff]|[\u3400-\u4dbf]|[\u{20000}-\u{2a6df}]|[\u{2a700}-\u{2b73f}]|[\u{2b740}-\u{2b81f}]|[\u{2b820}-\u{2ceaf}]|[\uf900-\ufaff]|[\u{2f800}-\u{2fa1f}]/u,
        'ja': /[\u3040-\u309f]|[\u30a0-\u30ff]|[\u4e00-\u9fff]/,
        'ko': /[\uac00-\ud7af]|[\u1100-\u11ff]|[\u3130-\u318f]/,
        'ru': /[\u0400-\u04FF]/,
        'hi': /[\u0900-\u097F]/,
        'ur': /[\u0600-\u06FF]/,
        'ar': /[\u0600-\u06FF]/,
        'he': /[\u0590-\u05FF]/,
        'el': /[\u0370-\u03FF]/,
        'th': /[\u0E00-\u0E7F]/
    };
    
    for (const [lang, pattern] of Object.entries(patterns)) {
        if (pattern.test(text)) {
            return lang;
        }
    }
    return 'auto';
};

// --- TRANSLATION APIS ---
const APIS = [
    {
        name: 'Google Translate',
        url: 'https://translate.googleapis.com/translate_a/single',
        params: (text, lang) => ({
            client: 'gtx',
            sl: 'auto',
            tl: lang,
            dt: 't',
            q: text
        }),
        parser: (data) => {
            if (data && data[0] && data[0][0] && data[0][0][0]) {
                return data[0][0][0];
            }
            return null;
        }
    },
    {
        name: 'MyMemory',
        url: 'https://api.mymemory.translated.net/get',
        params: (text, lang) => ({
            q: text,
            langpair: `auto|${lang}`
        }),
        parser: (data) => {
            if (data && data.responseData && data.responseData.translatedText) {
                return data.responseData.translatedText;
            }
            return null;
        }
    },
    {
        name: 'Dreaded',
        url: 'https://api.dreaded.site/api/translate',
        params: (text, lang) => ({
            text: text,
            lang: lang
        }),
        parser: (data) => {
            if (data && data.translated) {
                return data.translated;
            }
            return null;
        }
    },
    {
        name: 'Translate API',
        url: 'https://translate-api.com/translate',
        params: (text, lang) => ({
            text: text,
            target: lang
        }),
        parser: (data) => {
            if (data && data.translation) {
                return data.translation;
            }
            return null;
        }
    }
];

// --- MAIN COMMAND ---
async function handleTranslateCommand(sock, chatId, message, match) {
    try {
        // --- Show typing indicator ---
        await sock.presenceSubscribe(chatId);
        await sock.sendPresenceUpdate('composing', chatId);

        let textToTranslate = '';
        let lang = '';
        let isReply = false;
        let originalText = '';

        // --- Check if it's a reply ---
        const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (quotedMessage) {
            // Get text from quoted message
            originalText = quotedMessage.conversation || 
                          quotedMessage.extendedTextMessage?.text || 
                          quotedMessage.imageMessage?.caption || 
                          quotedMessage.videoMessage?.caption || 
                          '';

            textToTranslate = originalText;
            lang = match.trim();
            isReply = true;
        } else {
            // Parse command arguments for direct message
            const args = match.trim().split(' ');
            if (args.length < 2) {
                // Show help with language list
                const langList = Object.keys(LANGUAGES).slice(0, 30).map(code => 
                    `• ${code} - ${LANGUAGES[code]}`
                ).join('\n');

                return sock.sendMessage(chatId, {
                    text: `╭━━━〔 ${toBold("🌐 TRANSLATOR HELP")} 〕━━━┈⊷\n` +
                          `┃\n` +
                          `┃ 📌 ${toBold("Usage:")}\n` +
                          `┃ 1. Reply to a message:\n` +
                          `┃    .translate [lang] or .trt [lang]\n` +
                          `┃ 2. Direct message:\n` +
                          `┃    .translate [text] [lang]\n` +
                          `┃    .trt [text] [lang]\n` +
                          `┃\n` +
                          `┃ 📌 ${toBold("Examples:")}\n` +
                          `┃ .translate Hello fr\n` +
                          `┃ .trt Hello es\n` +
                          `┃ (Reply) .translate ur\n` +
                          `┃\n` +
                          `┃ 📌 ${toBold("Popular Languages:")}\n` +
                          `${langList}\n` +
                          `┃\n` +
                          `┃ 💡 ${toBold("Tip:")} Use .langs for all languages!\n` +
                          `╰━━━━━━━━━━━━━━━━━━┈⊷`,
                    quoted: message
                });
            }

            lang = args.pop(); // Get language code
            textToTranslate = args.join(' '); // Get text to translate
            originalText = textToTranslate;
        }

        // --- Validate text ---
        if (!textToTranslate || textToTranslate.trim().length === 0) {
            return sock.sendMessage(chatId, {
                text: `❌ *No Text Found!*\n\nPlease provide text to translate or reply to a message.`,
                quoted: message
            });
        }

        // --- Validate language ---
        if (!LANGUAGES[lang]) {
            return sock.sendMessage(chatId, {
                text: `❌ *Invalid Language Code!*\n\n"${lang}" is not supported.\n📌 Use .langs to see all available languages.`,
                quoted: message
            });
        }

        // --- Detect original language ---
        const detectedLang = detectLanguage(textToTranslate);
        const detectedLangName = LANGUAGES[detectedLang] || 'Unknown';

        // --- Translate using multiple APIs ---
        let translatedText = null;
        let usedApi = null;

        for (const api of APIS) {
            try {
                const params = api.params(textToTranslate, lang);
                const queryString = Object.keys(params)
                    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
                    .join('&');

                const response = await fetch(`${api.url}?${queryString}`, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    const result = api.parser(data);
                    if (result) {
                        translatedText = result;
                        usedApi = api.name;
                        break;
                    }
                }
            } catch (error) {
                console.error(`${api.name} API failed:`, error.message);
            }
        }

        // --- Check if translation succeeded ---
        if (!translatedText) {
            throw new Error('All translation APIs failed');
        }

        // --- Build Response ---
        const timestamp = new Date().toLocaleString();
        const fromLang = isReply ? detectedLangName : 'Auto';
        const toLang = LANGUAGES[lang];

        const responseText = `╭━━━〔 ${toBold("🌐 TRANSLATION RESULT")} 〕━━━┈⊷\n` +
                            `┃\n` +
                            `┃ 📝 ${toBold("Original:")}\n` +
                            `┃ ${originalText.substring(0, 300)}${originalText.length > 300 ? '...' : ''}\n` +
                            `┃\n` +
                            `┃ 🔄 ${toBold("Translated:")}\n` +
                            `┃ ${translatedText}\n` +
                            `┃\n` +
                            `┃ 📊 ${toBold("From:")} ${fromLang}\n` +
                            `┃ 📊 ${toBold("To:")} ${toLang}\n` +
                            `┃ 🔗 ${toBold("API:")} ${usedApi}\n` +
                            `┃ 🕐 ${toBold("Time:")} ${timestamp}\n` +
                            `┃\n` +
                            `┃ 💡 ${toBold("Tip:")} Use .translate help for commands!\n` +
                            `╰━━━━━━━━━━━━━━━━━━┈⊷`;

        // --- Send Translation ---
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
            react: { text: '✅', key: message.key } 
        });

    } catch (error) {
        console.error('❌ Error in translate command:', error);
        await sock.sendMessage(chatId, {
            text: `❌ *Translation Failed!*\n\nError: ${error.message}\n💡 Please try again later.`,
            quoted: message
        });
        await sock.sendMessage(chatId, { 
            react: { text: '❌', key: message.key } 
        });
    }
}

// --- LANGUAGE LIST COMMAND ---
async function handleLanguagesCommand(sock, chatId, message) {
    const langList = Object.entries(LANGUAGES).map(([code, name]) => 
        `• ${code} - ${name}`
    ).join('\n');

    await sock.sendMessage(chatId, {
        text: `╭━━━〔 ${toBold("🌐 SUPPORTED LANGUAGES")} 〕━━━┈⊷\n` +
              `┃\n` +
              `${langList}\n` +
              `┃\n` +
              `┃ 📊 ${toBold("Total:")} ${Object.keys(LANGUAGES).length} languages\n` +
              `┃\n` +
              `┃ 💡 ${toBold("Tip:")} Use .translate [text] [code]\n` +
              `╰━━━━━━━━━━━━━━━━━━┈⊷`
    }, { quoted: message });
}

module.exports = {
    handleTranslateCommand,
    handleLanguagesCommand,
    LANGUAGES
};