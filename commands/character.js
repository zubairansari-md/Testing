const axios = require('axios');
const { channelInfo } = require('../lib/messageConfig');

// --- CONFIGURATION ---
const CONFIG = {
    DEFAULT_IMAGE: 'https://i.imgur.com/2wzGhpF.jpeg',
    MIN_TRAITS: 5,
    MAX_TRAITS: 8,
    MIN_PERCENTAGE: 50,
    MAX_PERCENTAGE: 100,
    CACHE_DURATION: 3600000 // 1 hour
};

// --- TRAITS DATABASE ---
const TRAITS = {
    positive: [
        "Intelligent", "Creative", "Determined", "Ambitious", "Caring",
        "Charismatic", "Confident", "Empathetic", "Energetic", "Friendly",
        "Generous", "Honest", "Humorous", "Imaginative", "Independent",
        "Intuitive", "Kind", "Logical", "Loyal", "Optimistic",
        "Passionate", "Patient", "Persistent", "Reliable", "Resourceful",
        "Sincere", "Thoughtful", "Understanding", "Versatile", "Wise",
        "Adventurous", "Brave", "Calm", "Dependable", "Enthusiastic",
        "Flexible", "Grateful", "Helpful", "Innovative", "Joyful",
        "Knowledgeable", "Loving", "Mindful", "Noble", "Open-minded",
        "Playful", "Quick-witted", "Respectful", "Spirited", "Tolerant"
    ],
    neutral: [
        "Mysterious", "Quiet", "Reserved", "Cautious", "Pragmatic",
        "Analytical", "Observant", "Reflective", "Skeptical", "Methodical"
    ],
    negative: [
        "Stubborn", "Impulsive", "Perfectionist", "Overthinker", "Competitive",
        "Sarcastic", "Blunt", "Restless", "Demanding", "Intense"
    ]
};

// --- ZODIAC SIGNS ---
const ZODIAC_SIGNS = [
    "♈ Aries", "♉ Taurus", "♊ Gemini", "♋ Cancer",
    "♌ Leo", "♍ Virgo", "♎ Libra", "♏ Scorpio",
    "♐ Sagittarius", "♑ Capricorn", "♒ Aquarius", "♓ Pisces"
];

// --- PERSONALITY TYPES ---
const PERSONALITY_TYPES = [
    "ENFJ - The Protagonist", "ENFP - The Campaigner",
    "ENTJ - The Commander", "ENTP - The Debater",
    "ESFJ - The Consul", "ESFP - The Entertainer",
    "ESTJ - The Executive", "ESTP - The Entrepreneur",
    "INFJ - The Advocate", "INFP - The Mediator",
    "INTJ - The Architect", "INTP - The Logician",
    "ISFJ - The Defender", "ISFP - The Adventurer",
    "ISTJ - The Logistician", "ISTP - The Virtuoso"
];

// --- HELPER: Get Random Element ---
const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

// --- HELPER: Get Random Number ---
const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// --- HELPER: Format Date ---
const formatDate = (date) => {
    return date.toLocaleString('en-PK', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
};

// --- HELPER: Get Zodiac Sign ---
const getZodiacSign = (month, day) => {
    const signs = [
        { start: [1, 20], end: [2, 18], sign: "♒ Aquarius" },
        { start: [2, 19], end: [3, 20], sign: "♓ Pisces" },
        { start: [3, 21], end: [4, 19], sign: "♈ Aries" },
        { start: [4, 20], end: [5, 20], sign: "♉ Taurus" },
        { start: [5, 21], end: [6, 20], sign: "♊ Gemini" },
        { start: [6, 21], end: [7, 22], sign: "♋ Cancer" },
        { start: [7, 23], end: [8, 22], sign: "♌ Leo" },
        { start: [8, 23], end: [9, 22], sign: "♍ Virgo" },
        { start: [9, 23], end: [10, 22], sign: "♎ Libra" },
        { start: [10, 23], end: [11, 21], sign: "♏ Scorpio" },
        { start: [11, 22], end: [12, 21], sign: "♐ Sagittarius" },
        { start: [12, 22], end: [1, 19], sign: "♑ Capricorn" }
    ];
    
    for (const sign of signs) {
        if ((month === sign.start[0] && day >= sign.start[1]) || 
            (month === sign.end[0] && day <= sign.end[1])) {
            return sign.sign;
        }
    }
    return "♒ Aquarius";
};

// --- MAIN COMMAND ---
async function characterCommand(sock, chatId, message) {
    try {
        let userToAnalyze;
        let isReplying = false;
        
        // Check for mentioned users
        if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            userToAnalyze = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
        }
        // Check for replied message
        else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            userToAnalyze = message.message.extendedTextMessage.contextInfo.participant;
            isReplying = true;
        }
        // Check for quoted message
        else if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            const quotedMsg = message.message.extendedTextMessage.contextInfo.quotedMessage;
            if (quotedMsg) {
                userToAnalyze = message.message.extendedTextMessage.contextInfo.participant || 
                               message.message.extendedTextMessage.contextInfo.remoteJid;
            }
        }
        
        if (!userToAnalyze) {
            await sock.sendMessage(chatId, { 
                text: `╭━━━〔 ${toBold("CHARACTER ANALYSIS")} 〕━━━┈⊷\n` +
                      `┃\n` +
                      `┃ 📌 ${toBold("Usage:")}\n` +
                      `┃ .char @user - Analyze mentioned user\n` +
                      `┃ .char - Reply to a message\n` +
                      `┃\n` +
                      `┃ 📌 ${toBold("Examples:")}\n` +
                      `┃ .char @Zubair\n` +
                      `┃ (Reply to a message) .char\n` +
                      `┃\n` +
                      `┃ 💡 ${toBold("Features:")}\n` +
                      `┃ • Personality traits analysis\n` +
                      `┃ • Zodiac sign detection\n` +
                      `┃ • MBTI personality type\n` +
                      `┃ • Overall rating\n` +
                      `┃ • Fun facts & advice\n` +
                      `╰━━━━━━━━━━━━━━━━━━┈⊷`,
                ...channelInfo
            });
            return;
        }

        // Send typing indicator
        await sock.sendPresenceUpdate('composing', chatId);

        // --- Get User Info ---
        let profilePic;
        let pushName = 'Unknown';
        let userNumber = userToAnalyze.split('@')[0];

        try {
            // Get profile picture
            profilePic = await sock.profilePictureUrl(userToAnalyze, 'image');
        } catch {
            profilePic = CONFIG.DEFAULT_IMAGE;
        }

        try {
            // Get contact name if available
            const contact = await sock.getContact(userToAnalyze);
            if (contact) {
                pushName = contact.name || contact.verifiedName || contact.notify || userNumber;
            }
        } catch {}

        // --- Generate Random Data ---
        const now = new Date();
        const birthMonth = getRandomNumber(1, 12);
        const birthDay = getRandomNumber(1, 28);
        const zodiac = getZodiacSign(birthMonth, birthDay);
        const personalityType = getRandomElement(PERSONALITY_TYPES);
        
        // --- Select Traits ---
        const numTraits = getRandomNumber(CONFIG.MIN_TRAITS, CONFIG.MAX_TRAITS);
        const selectedTraits = [];
        const allTraits = [...TRAITS.positive, ...TRAITS.neutral, ...TRAITS.negative];
        
        for (let i = 0; i < numTraits; i++) {
            let trait = getRandomElement(allTraits);
            while (selectedTraits.some(t => t.name === trait)) {
                trait = getRandomElement(allTraits);
            }
            const percentage = getRandomNumber(CONFIG.MIN_PERCENTAGE, CONFIG.MAX_PERCENTAGE);
            selectedTraits.push({ name: trait, percentage });
        }
        
        // Sort traits by percentage (highest first)
        selectedTraits.sort((a, b) => b.percentage - a.percentage);

        // --- Calculate Overall Rating ---
        const avgPercentage = selectedTraits.reduce((sum, t) => sum + t.percentage, 0) / selectedTraits.length;
        const overallRating = Math.round(avgPercentage);

        // --- Generate Fun Facts ---
        const funFacts = [
            "🌙 Lunar influence enhances creativity",
            "⭐ Natural leadership qualities",
            "🌟 Strong emotional intelligence",
            "🎯 Excellent problem solver",
            "💫 Great sense of humor",
            "🌈 Optimistic outlook on life",
            "🔮 Intuitive decision maker",
            "💪 Resilient in tough times"
        ];

        // --- Generate Advice ---
        const advice = [
            "Trust your instincts more",
            "Take time for self-care",
            "Express your feelings openly",
            "Embrace new challenges",
            "Stay true to yourself",
            "Practice gratitude daily"
        ];

        // --- Build Analysis Message ---
        const traitLines = selectedTraits.map(t => 
            `   ${t.percentage >= 80 ? '🌟' : t.percentage >= 70 ? '💪' : '✨'} ${t.name}: ${t.percentage}%`
        );

        const analysis = `╭━━━〔 ${toBold("🔮 CHARACTER ANALYSIS")} 〕━━━┈⊷\n` +
                        `┃\n` +
                        `┃ 👤 ${toBold("User:")} ${pushName}\n` +
                        `┃ 📱 ${toBold("Number:")} ${userNumber}\n` +
                        `┃ 🕐 ${toBold("Analyzed:")} ${formatDate(now)}\n` +
                        `┃\n` +
                        `┃ ✨ ${toBold("Key Traits:")}\n` +
                        traitLines.join('\n') +
                        `\n┃\n` +
                        `┃ 🎯 ${toBold("Overall Rating:")} ${overallRating}%\n` +
                        `┃ ⭐ ${toBold("Personality:")} ${personalityType}\n` +
                        `┃ ♈ ${toBold("Zodiac:")} ${zodiac}\n` +
                        `┃\n` +
                        `┃ 🎭 ${toBold("Fun Facts:")}\n` +
                        `   ${getRandomElement(funFacts)}\n` +
                        `┃\n` +
                        `┃ 💡 ${toBold("Advice:")}\n` +
                        `   ${getRandomElement(advice)}\n` +
                        `┃\n` +
                        `┃ 📝 ${toBold("Note:")} This is a fun analysis!\n` +
                        `┃ ${toBold("Don't take it too seriously 😄")}\n` +
                        `╰━━━━━━━━━━━━━━━━━━┈⊷`;

        // --- Send Analysis ---
        await sock.sendMessage(chatId, {
            image: { url: profilePic },
            caption: analysis,
            mentions: [userToAnalyze],
            contextInfo: {
                forwardingScore: 1,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363408426516135@newsletter',
                    newsletterName: 'TEAM-ZUBAIR-MD',
                    serverMessageId: -1
                }
            },
            ...channelInfo
        });

        // --- Send Additional Stats (Optional) ---
        if (overallRating >= 85) {
            await sock.sendMessage(chatId, {
                text: `🌟 *Amazing!* ${pushName} has exceptional character traits! 👏`,
                ...channelInfo
            });
        } else if (overallRating >= 70) {
            await sock.sendMessage(chatId, {
                text: `💪 *Good job!* ${pushName} shows strong character! 🌟`,
                ...channelInfo
            });
        }

        // --- Log Analysis ---
        console.log(`✅ Character analysis done for ${userNumber}`);

    } catch (error) {
        console.error('Error in character command:', error);
        await sock.sendMessage(chatId, { 
            text: `❌ *Error Occurred!*\n\n` +
                  `Error: ${error.message}\n` +
                  `💡 Please try again later.`,
            ...channelInfo 
        });
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

module.exports = characterCommand;