const axios = require('axios');
const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
const CONFIG = {
    TEMP_DIR: path.join(process.cwd(), 'tmp', 'instagram'),
    TIMEOUT: 60000,
    MAX_RETRIES: 3,
    USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

// --- APIS ---
const APIS = [
    {
        name: 'Vreden',
        url: 'https://api.vreden.my.id/api/igdownload',
        parser: (data) => {
            if (data?.status && data?.result?.length > 0) {
                return data.result.map(item => ({
                    url: item.url,
                    type: item.type || (item.url?.includes('.mp4') ? 'video' : 'image'),
                    thumbnail: item.thumbnail || null,
                    size: item.size || null
                }));
            }
            return null;
        }
    },
    {
        name: 'NexOracle',
        url: 'https://api.nexoracle.com/downloader/ig',
        parser: (data) => {
            if (data?.result) {
                const items = [];
                if (data.result.video) {
                    items.push({ url: data.result.video, type: 'video' });
                }
                if (data.result.images) {
                    data.result.images.forEach(img => {
                        items.push({ url: img, type: 'image' });
                    });
                }
                return items.length > 0 ? items : null;
            }
            return null;
        }
    },
    {
        name: 'ZenApi',
        url: 'https://zenapi.vercel.app/api/igdl',
        parser: (data) => {
            if (data?.data) {
                const items = [];
                if (data.data.video) {
                    items.push({ url: data.data.video, type: 'video' });
                }
                if (data.data.images) {
                    data.data.images.forEach(img => {
                        items.push({ url: img, type: 'image' });
                    });
                }
                return items.length > 0 ? items : null;
            }
            return null;
        }
    }
];

// --- HELPERS ---
const toBold = (text) => {
    const boldChars = {
        'a': '𝗮', 'b': '𝗯', 'c': '𝗰', 'd': '𝗱', 'e': '𝗲', 'f': '𝗳', 'g': '𝗴', 'h': '𝗵', 'i': '𝗶', 'j': '𝗷', 'k': '𝗸', 'l': '𝗹', 'm': '𝗺', 'n': '𝗻', 'o': '𝗼', 'p': '𝗽', 'q': '𝗾', 'r': '𝗿', 's': '𝘀', 't': '𝘁', 'u': '𝘂', 'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇',
        'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚', 'H': '𝗛', 'I': '𝗜', 'J': '𝗝', 'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡', 'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝘀', 't': '𝘁', 'u': '𝘂', 'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇',
        '0': '𝟬', '1': '𝟭', '2': '𝟮', '3': '𝟯', '4': '𝟰', '5': '𝟱', '6': '𝟲', '7': '𝟳', '8': '𝟴', '9': '𝟵'
    };
    return text.split('').map(c => boldChars[c] || c).join('');
};

const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return 'Unknown';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
};

// --- ENSURE TEMP DIRECTORY ---
if (!fs.existsSync(CONFIG.TEMP_DIR)) {
    fs.mkdirSync(CONFIG.TEMP_DIR, { recursive: true });
}

// --- MAIN COMMAND ---
async function instaCommand(sock, from, msg, q) {
    try {
        // --- HELP MENU ---
        if (!q || q === 'help') {
            return await sock.sendMessage(from, { 
                text: `╭━━━〔 ${toBold("📸 INSTAGRAM DOWNLOADER")} 〕━━━┈⊷\n` +
                      `┃\n` +
                      `┃ 📌 ${toBold("Usage:")}\n` +
                      `┃ .insta [Instagram URL]\n` +
                      `┃\n` +
                      `┃ 📌 ${toBold("Examples:")}\n` +
                      `┃ .insta https://www.instagram.com/p/...\n` +
                      `┃ .insta https://www.instagram.com/reel/...\n` +
                      `┃ .insta https://www.instagram.com/tv/...\n` +
                      `┃\n` +
                      `┃ 📌 ${toBold("Features:")}\n` +
                      `┃ • Supports Posts, Reels, TV\n` +
                      `┃ • Multiple API Sources\n` +
                      `┃ • Auto Detect Media Type\n` +
                      `┃ • HD Quality Download\n` +
                      `┃ • Multiple Images Support\n` +
                      `┃\n` +
                      `┃ 💡 ${toBold("Tip:")} Works with public Instagram links!\n` +
                      `╰━━━━━━━━━━━━━━━━━━┈⊷`
            }, { quoted: msg });
        }

        // --- Validate URL ---
        if (!q.includes('instagram.com')) {
            return await sock.sendMessage(from, { 
                text: `❌ *Invalid URL!*\n\nPlease provide a valid Instagram link.\n💡 Example: .insta https://www.instagram.com/p/...`
            }, { quoted: msg });
        }

        // --- Send Loading Reactions ---
        const loadEmojis = ['🔄', '📥', '⏳'];
        for (const emoji of loadEmojis) {
            await sock.sendMessage(from, { react: { text: emoji, key: msg.key } });
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // --- Send Processing Message ---
        await sock.sendMessage(from, { 
            text: `🔍 *Fetching Instagram content...*\n\n⏳ Please wait...`
        }, { quoted: msg });

        // --- Try Multiple APIs ---
        let mediaItems = null;
        let usedApi = null;

        for (const api of APIS) {
            try {
                const response = await axios.get(api.url, {
                    params: { url: q },
                    timeout: CONFIG.TIMEOUT,
                    headers: {
                        'accept': '*/*',
                        'User-Agent': CONFIG.USER_AGENT
                    },
                    maxRedirects: 5,
                    validateStatus: s => s >= 200 && s < 500
                });

                if (response.data) {
                    const parsed = api.parser(response.data);
                    if (parsed && parsed.length > 0) {
                        mediaItems = parsed;
                        usedApi = api.name;
                        break;
                    }
                }
            } catch (error) {
                console.error(`${api.name} API failed:`, error.message);
            }
        }

        // --- No Media Found ---
        if (!mediaItems || mediaItems.length === 0) {
            await sock.sendMessage(from, { 
                text: `❌ *No Media Found!*\n\n` +
                      `Possible reasons:\n` +
                      `• Link is private\n` +
                      `• Link is invalid\n` +
                      `• Account is private\n` +
                      `• All APIs are down\n\n` +
                      `💡 Make sure the link is public.`
            }, { quoted: msg });
            await sock.sendMessage(from, { react: { text: '❌', key: msg.key } });
            return;
        }

        // --- Get Media Info ---
        const mediaCount = mediaItems.length;
        const hasVideo = mediaItems.some(item => item.type === 'video');
        const hasImage = mediaItems.some(item => item.type === 'image');

        // --- Send Info Message ---
        await sock.sendMessage(from, { 
            text: `📸 *Instagram Media Found*\n\n` +
                  `📊 ${toBold("Total:")} ${mediaCount} media\n` +
                  `🎬 ${toBold("Videos:")} ${mediaItems.filter(i => i.type === 'video').length}\n` +
                  `🖼️ ${toBold("Images:")} ${mediaItems.filter(i => i.type === 'image').length}\n` +
                  `🔗 ${toBold("Source:")} ${usedApi || 'Unknown'}\n` +
                  `\n📥 Downloading...`
        }, { quoted: msg });

        // --- Process Each Media ---
        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < mediaItems.length; i++) {
            const item = mediaItems[i];
            const isVideo = item.type === 'video';
            
            try {
                // --- Build Caption ---
                const caption = `╭━━━〔 ${toBold(`📸 INSTAGRAM ${isVideo ? 'VIDEO' : 'IMAGE'}`)} 〕━━━┈⊷\n` +
                               `┃\n` +
                               `┃ 📊 ${toBold("Media:")} ${i + 1}/${mediaCount}\n` +
                               `┃ 🎬 ${toBold("Type:")} ${isVideo ? 'Video' : 'Image'}\n` +
                               `┃ 🔗 ${toBold("Source:")} ${usedApi || 'Unknown'}\n` +
                               `┃ 🕐 ${toBold("Downloaded:")} ${new Date().toLocaleString()}\n` +
                               `┃\n` +
                               `┃ 💡 ${toBold("Tip:")} Use .insta for more!\n` +
                               `╰━━━━━━━━━━━━━━━━━━┈⊷`;

                // --- Send Media ---
                if (isVideo) {
                    await sock.sendMessage(from, { 
                        video: { url: item.url },
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
                    }, { quoted: msg });
                } else {
                    await sock.sendMessage(from, { 
                        image: { url: item.url },
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
                    }, { quoted: msg });
                }

                successCount++;
                
                // --- Small delay between multiple media ---
                if (mediaItems.length > 1 && i < mediaItems.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

            } catch (error) {
                console.error(`Failed to send media ${i + 1}:`, error.message);
                failCount++;
                
                // --- Try fallback for individual media ---
                try {
                    const response = await axios.get(item.url, {
                        responseType: 'arraybuffer',
                        timeout: 30000
                    });
                    
                    const buffer = Buffer.from(response.data);
                    
                    if (isVideo) {
                        await sock.sendMessage(from, { 
                            video: buffer,
                            caption: `📸 *Instagram Video (Fallback)*\n\n📊 ${i + 1}/${mediaCount}`
                        }, { quoted: msg });
                    } else {
                        await sock.sendMessage(from, { 
                            image: buffer,
                            caption: `📸 *Instagram Image (Fallback)*\n\n📊 ${i + 1}/${mediaCount}`
                        }, { quoted: msg });
                    }
                    
                    successCount++;
                } catch (fallbackError) {
                    console.error(`Fallback failed for media ${i + 1}:`, fallbackError.message);
                }
            }
        }

        // --- Send Success Summary ---
        if (successCount > 0) {
            await sock.sendMessage(from, { 
                text: `✅ *Download Complete!*\n\n` +
                      `📥 ${toBold("Successful:")} ${successCount}/${mediaCount}\n` +
                      `❌ ${toBold("Failed:")} ${failCount}/${mediaCount}\n` +
                      `📸 ${toBold("Source:")} Instagram\n` +
                      `🔗 ${toBold("API:")} ${usedApi || 'Multiple'}\n\n` +
                      `💡 Use .insta help for more info!`
            }, { quoted: msg });

            await sock.sendMessage(from, { 
                react: { text: '✅', key: msg.key } 
            });
        } else {
            await sock.sendMessage(from, { 
                text: `❌ *Download Failed!*\n\nFailed to download any media. Please try again.`
            }, { quoted: msg });
            await sock.sendMessage(from, { 
                react: { text: '❌', key: msg.key } 
            });
        }

    } catch (error) {
        console.error('Instagram Command Error:', error);
        await sock.sendMessage(from, { 
            text: `❌ *Error Occurred!*\n\n` +
                  `Error: ${error.message}\n` +
                  `💡 Please try again later.`
        }, { quoted: msg });
        await sock.sendMessage(from, { 
            react: { text: '❌', key: msg.key } 
        });
    }
}

module.exports = instaCommand;