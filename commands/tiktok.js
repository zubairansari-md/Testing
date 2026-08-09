const axios = require('axios');

// --- CONFIGURATION ---
const CONFIG = {
    TIMEOUT: 60000,
    MAX_RETRIES: 3,
    USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

// --- APIS ---
const APIS = [
    {
        name: 'TikWM',
        url: 'https://tikwm.com/api/',
        parser: (data) => {
            if (data?.data?.play) {
                return {
                    video: data.data.play,
                    title: data.data.title || 'TikTok Video',
                    duration: data.data.duration || 'N/A',
                    author: data.data.author || 'Unknown',
                    views: data.data.views || 0,
                    likes: data.data.likes || 0,
                    comments: data.data.comments || 0,
                    shares: data.data.shares || 0,
                    thumbnail: data.data.cover || null,
                    audio: data.data.music || null
                };
            }
            return null;
        },
        params: (url) => ({ url: url })
    },
    {
        name: 'TikTokAPI',
        url: 'https://www.tikwm.com/api/',
        parser: (data) => {
            if (data?.data?.play) {
                return {
                    video: data.data.play,
                    title: data.data.title || 'TikTok Video',
                    duration: data.data.duration || 'N/A',
                    author: data.data.author || 'Unknown',
                    views: data.data.views || 0,
                    likes: data.data.likes || 0,
                    comments: data.data.comments || 0,
                    shares: data.data.shares || 0,
                    thumbnail: data.data.cover || null,
                    audio: data.data.music || null
                };
            }
            return null;
        },
        params: (url) => ({ url: url })
    },
    {
        name: 'TikTokDL',
        url: 'https://api.tiktokapi.xyz/api/download',
        parser: (data) => {
            if (data?.data?.play) {
                return {
                    video: data.data.play,
                    title: data.data.title || 'TikTok Video',
                    duration: data.data.duration || 'N/A',
                    author: data.data.author || 'Unknown',
                    views: data.data.views || 0,
                    likes: data.data.likes || 0,
                    comments: data.data.comments || 0,
                    shares: data.data.shares || 0,
                    thumbnail: data.data.cover || null,
                    audio: data.data.music || null
                };
            }
            return null;
        },
        params: (url) => ({ url: url })
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

const formatNumber = (num) => {
    if (!num) return 'N/A';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
};

const formatDuration = (seconds) => {
    if (!seconds || seconds === 'N/A') return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// --- MAIN COMMAND ---
async function tiktokCommand(sock, from, msg, q, args = []) {
    try {
        // --- HELP MENU ---
        if (!q || q === 'help') {
            return await sock.sendMessage(from, {
                text: `╭━━━〔 ${toBold("📱 TIKTOK DOWNLOADER")} 〕━━━┈⊷\n` +
                      `┃\n` +
                      `┃ 📌 ${toBold("Usage:")}\n` +
                      `┃ .tiktok [TikTok URL]\n` +
                      `┃ .tt [TikTok URL]\n` +
                      `┃\n` +
                      `┃ 📌 ${toBold("Examples:")}\n` +
                      `┃ .tiktok https://www.tiktok.com/@user/video/...\n` +
                      `┃ .tiktok https://vm.tiktok.com/...\n` +
                      `┃\n` +
                      `┃ 📌 ${toBold("Features:")}\n` +
                      `┃ • No Watermark Download\n` +
                      `┃ • Video Info Display\n` +
                      `┃ • HD Quality\n` +
                      `┃ • Multiple API Sources\n` +
                      `┃ • Auto Retry on Fail\n` +
                      `┃\n` +
                      `┃ 💡 ${toBold("Tip:")} Download any TikTok video!\n` +
                      `╰━━━━━━━━━━━━━━━━━━┈⊷`
            }, { quoted: msg });
        }

        // --- Validate URL ---
        if (!q.includes('tiktok.com') && !q.includes('vm.tiktok')) {
            return await sock.sendMessage(from, {
                text: `❌ *Invalid URL!*\n\nPlease provide a valid TikTok link.\n💡 Example: .tiktok https://www.tiktok.com/@user/video/...`
            }, { quoted: msg });
        }

        // --- Send Loading Reactions ---
        const loadEmojis = ['🔄', '📥', '⏳', '📱'];
        for (const emoji of loadEmojis) {
            await sock.sendMessage(from, { react: { text: emoji, key: msg.key } });
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        // --- Send Processing Message ---
        await sock.sendMessage(from, {
            text: `🔍 *Fetching TikTok video...*\n\n⏳ Please wait...`
        }, { quoted: msg });

        // --- Try Multiple APIs ---
        let videoData = null;
        let usedApi = null;

        for (const api of APIS) {
            try {
                const response = await axios.get(api.url, {
                    params: api.params(q),
                    timeout: CONFIG.TIMEOUT,
                    headers: {
                        'User-Agent': CONFIG.USER_AGENT,
                        'Accept': 'application/json, text/plain, */*'
                    },
                    maxRedirects: 5,
                    validateStatus: s => s >= 200 && s < 500
                });

                if (response.data) {
                    const parsed = api.parser(response.data);
                    if (parsed && parsed.video) {
                        videoData = parsed;
                        usedApi = api.name;
                        break;
                    }
                }
            } catch (error) {
                console.error(`${api.name} API failed:`, error.message);
                // Continue to next API
            }
        }

        // --- No Video Found ---
        if (!videoData || !videoData.video) {
            await sock.sendMessage(from, {
                text: `❌ *No Video Found!*\n\n` +
                      `Possible reasons:\n` +
                      `• Video is private\n` +
                      `• Link is invalid\n` +
                      `• Video was deleted\n` +
                      `• All APIs are down\n\n` +
                      `💡 Please try a different TikTok link.`
            }, { quoted: msg });
            await sock.sendMessage(from, { react: { text: '❌', key: msg.key } });
            return;
        }

        // --- Build Info Message ---
        const views = formatNumber(videoData.views);
        const likes = formatNumber(videoData.likes);
        const comments = formatNumber(videoData.comments);
        const shares = formatNumber(videoData.shares);
        const duration = formatDuration(videoData.duration);

        const infoMessage = `╭━━━〔 ${toBold("📱 TIKTOK VIDEO")} 〕━━━┈⊷\n` +
                           `┃\n` +
                           `┃ 📝 ${toBold("Title:")} ${videoData.title || 'No Title'}\n` +
                           `┃ 👤 ${toBold("Author:")} ${videoData.author || 'Unknown'}\n` +
                           `┃ ⏱️ ${toBold("Duration:")} ${duration}\n` +
                           `┃ 👁️ ${toBold("Views:")} ${views}\n` +
                           `┃ ❤️ ${toBold("Likes:")} ${likes}\n` +
                           `┃ 💬 ${toBold("Comments:")} ${comments}\n` +
                           `┃ 🔄 ${toBold("Shares:")} ${shares}\n` +
                           `┃ 🔗 ${toBold("Source:")} ${usedApi}\n` +
                           `┃\n` +
                           `┃ 📥 ${toBold("Downloading...")}\n` +
                           `╰━━━━━━━━━━━━━━━━━━┈⊷`;

        // --- Send Video Info ---
        if (videoData.thumbnail) {
            await sock.sendMessage(from, {
                image: { url: videoData.thumbnail },
                caption: infoMessage
            }, { quoted: msg });
        } else {
            await sock.sendMessage(from, { 
                text: infoMessage 
            }, { quoted: msg });
        }

        // --- Download Video ---
        try {
            // --- Send Video ---
            const caption = `╭━━━〔 ${toBold("✅ DOWNLOAD COMPLETE")} 〕━━━┈⊷\n` +
                           `┃\n` +
                           `┃ 📝 ${toBold("Title:")} ${videoData.title || 'TikTok Video'}\n` +
                           `┃ 👤 ${toBold("Author:")} ${videoData.author || 'Unknown'}\n` +
                           `┃ 👁️ ${toBold("Views:")} ${views}\n` +
                           `┃ ❤️ ${toBold("Likes:")} ${likes}\n` +
                           `┃ 🔗 ${toBold("Source:")} ${usedApi}\n` +
                           `┃ 🕐 ${toBold("Downloaded:")} ${new Date().toLocaleString()}\n` +
                           `┃\n` +
                           `┃ 💡 ${toBold("Downloaded By:")} TEAM-ZUBAIR-MD\n` +
                           `╰━━━━━━━━━━━━━━━━━━┈⊷`;

            await sock.sendMessage(from, {
                video: { url: videoData.video },
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

            // --- Success Reaction ---
            await sock.sendMessage(from, { 
                react: { text: '✅', key: msg.key } 
            });

            // --- Send Success Message ---
            await sock.sendMessage(from, {
                text: `✅ *TikTok Downloaded Successfully!*\n\n` +
                      `📱 ${videoData.title || 'Video'}\n` +
                      `👤 ${videoData.author || 'Unknown'}\n` +
                      `👁️ ${views} views\n` +
                      `❤️ ${likes} likes\n\n` +
                      `💡 Use .tiktok for more videos!`
            }, { quoted: msg });

        } catch (videoError) {
            console.error('Video send error:', videoError);
            
            // --- Try fallback download ---
            try {
                const response = await axios.get(videoData.video, {
                    responseType: 'arraybuffer',
                    timeout: CONFIG.TIMEOUT
                });
                const buffer = Buffer.from(response.data);

                await sock.sendMessage(from, {
                    video: buffer,
                    caption: `✅ *TikTok Video (Fallback)*\n\n📝 ${videoData.title || 'TikTok Video'}\n👤 ${videoData.author || 'Unknown'}`
                }, { quoted: msg });

                await sock.sendMessage(from, { 
                    react: { text: '✅', key: msg.key } 
                });
            } catch (fallbackError) {
                console.error('Fallback error:', fallbackError);
                await sock.sendMessage(from, {
                    text: `❌ *Download Failed!*\n\nFailed to send video. Please try again.`
                }, { quoted: msg });
                await sock.sendMessage(from, { 
                    react: { text: '❌', key: msg.key } 
                });
            }
        }

    } catch (error) {
        console.error('TikTok Command Error:', error);
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

module.exports = tiktokCommand;