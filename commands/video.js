const axios = require('axios');
const yts = require('yt-search');

// --- CONFIGURATION ---
const CONFIG = {
    TIMEOUT: 120000,
    MAX_RETRIES: 3,
    MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
    USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
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

const formatTime = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return 'Unknown';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
};

const formatNumber = (num) => {
    if (!num) return 'N/A';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
};

// --- API SOURCES ---
const APIS = [
    {
        name: 'EliteProTech',
        url: 'https://eliteprotech-apis.zone.id/ytdown',
        parser: (data) => {
            if (data?.success && data?.downloadURL) {
                return { download: data.downloadURL, title: data.title };
            }
            return null;
        },
        params: (url) => ({ url: url, format: 'mp4' })
    },
    {
        name: 'Yupra',
        url: 'https://api.yupra.my.id/api/downloader/ytmp4',
        parser: (data) => {
            if (data?.success && data?.data?.download_url) {
                return { download: data.data.download_url, title: data.data.title };
            }
            return null;
        },
        params: (url) => ({ url: url })
    },
    {
        name: 'Okatsu',
        url: 'https://okatsu-rolezapiiz.vercel.app/downloader/ytmp4',
        parser: (data) => {
            if (data?.result?.mp4) {
                return { download: data.result.mp4, title: data.result.title };
            }
            return null;
        },
        params: (url) => ({ url: url })
    },
    {
        name: 'Alya',
        url: 'https://api.alyachan.pro/api/ytmp4',
        parser: (data) => {
            if (data?.status && data?.data?.url) {
                return { download: data.data.url, title: data.data.title };
            }
            return null;
        },
        params: (url) => ({ url: url, apikey: 'G7I6X7' })
    },
    {
        name: 'Vreden',
        url: 'https://api.vreden.my.id/api/ytmp4',
        parser: (data) => {
            if (data?.status && data?.result?.download?.url) {
                return { download: data.result.download.url, title: data.result.metadata.title };
            }
            return null;
        },
        params: (url) => ({ url: url })
    }
];

// --- MAIN COMMAND ---
async function videoCommand(sock, chatId, message, args = []) {
    try {
        const action = args[0]?.toLowerCase();

        // --- HELP MENU ---
        if (!args.length || action === 'help') {
            return await sock.sendMessage(chatId, {
                text: `╭━━━〔 ${toBold("🎥 VIDEO DOWNLOADER")} 〕━━━┈⊷\n` +
                      `┃\n` +
                      `┃ 📌 ${toBold("Usage:")}\n` +
                      `┃ .video [video name or URL]\n` +
                      `┃ .video help         - Show help\n` +
                      `┃\n` +
                      `┃ 📌 ${toBold("Examples:")}\n` +
                      `┃ .video Funny Cats\n` +
                      `┃ .video https://youtube.com/watch?v=...\n` +
                      `┃ .video https://youtu.be/...\n` +
                      `┃\n` +
                      `┃ 📌 ${toBold("Features:")}\n` +
                      `┃ • Search by name\n` +
                      `┃ • Direct YouTube link\n` +
                      `┃ • HD Quality Download\n` +
                      `┃ • Multiple Download Sources\n` +
                      `┃ • Video Info Display\n` +
                      `┃\n` +
                      `┃ 💡 ${toBold("Tip:")} Download any YouTube video!\n` +
                      `╰━━━━━━━━━━━━━━━━━━┈⊷`
            }, { quoted: message });
        }

        // --- Loading Reactions ---
        const loadEmojis = ['🔄', '📥', '⏳', '🎥'];
        for (const emoji of loadEmojis) {
            await sock.sendMessage(chatId, { react: { text: emoji, key: message.key } });
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        // --- Get Query ---
        const query = args.join(' ');

        // --- Search or Direct URL ---
        let videoUrl = '';
        let videoTitle = '';
        let videoThumbnail = '';
        let videoDuration = '';
        let videoViews = '';
        let videoUploaded = '';
        let isUrl = false;

        if (query.includes('youtube.com') || query.includes('youtu.be')) {
            // Direct URL
            videoUrl = query;
            videoTitle = 'YouTube Video';
            isUrl = true;
        } else {
            // Search
            await sock.sendMessage(chatId, {
                text: `🔍 *Searching for:* ${query}\n\n⏳ Please wait...`
            }, { quoted: message });

            const search = await yts(query);
            if (!search || !search.videos || search.videos.length === 0) {
                await sock.sendMessage(chatId, { 
                    text: `❌ *No Results Found!*\n\nCould not find "${query}". Please try a different search.` 
                }, { quoted: message });
                return;
            }

            const video = search.videos[0];
            videoUrl = video.url;
            videoTitle = video.title || 'YouTube Video';
            videoThumbnail = video.thumbnail || 'https://i.postimg.cc/y6GV9P3H/file-000000004c307206bc366893b817568c-(1).png';
            videoDuration = video.timestamp || formatTime(video.duration);
            videoViews = video.views ? formatNumber(video.views) : 'N/A';
            videoUploaded = video.ago || 'N/A';
        }

        // --- Send Video Info ---
        const infoCaption = `╭━━━〔 ${toBold("🎥 VIDEO FOUND")} 〕━━━┈⊷\n` +
                           `┃\n` +
                           `┃ 📝 ${toBold("Title:")} ${videoTitle}\n` +
                           `${!isUrl ? `┃ ⏱️ ${toBold("Duration:")} ${videoDuration}\n` : ''}` +
                           `${!isUrl ? `┃ 👁️ ${toBold("Views:")} ${videoViews}\n` : ''}` +
                           `${!isUrl ? `┃ 📅 ${toBold("Uploaded:")} ${videoUploaded}\n` : ''}` +
                           `┃ 🔗 ${toBold("Source:")} ${isUrl ? 'Direct URL' : 'YouTube Search'}\n` +
                           `┃\n` +
                           `┃ 📥 ${toBold("Downloading Video...")}\n` +
                           `╰━━━━━━━━━━━━━━━━━━┈⊷`;

        await sock.sendMessage(chatId, {
            image: { url: videoThumbnail || 'https://i.postimg.cc/y6GV9P3H/file-000000004c307206bc366893b817568c-(1).png' },
            caption: infoCaption
        }, { quoted: message });

        // --- Download Video ---
        let videoData = null;
        let usedApi = null;
        let downloadSuccess = false;

        for (const api of APIS) {
            try {
                const params = api.params(videoUrl);
                const response = await axios.get(api.url, {
                    params: params,
                    timeout: CONFIG.TIMEOUT,
                    headers: {
                        'User-Agent': CONFIG.USER_AGENT,
                        'Accept': 'application/json, text/plain, */*'
                    },
                    validateStatus: s => s >= 200 && s < 500
                });

                if (response.data) {
                    const parsed = api.parser(response.data);
                    if (parsed && parsed.download) {
                        videoData = parsed;
                        usedApi = api.name;
                        downloadSuccess = true;
                        break;
                    }
                }
            } catch (error) {
                console.error(`${api.name} API failed:`, error.message);
            }
        }

        // --- Check if download succeeded ---
        if (!downloadSuccess || !videoData) {
            await sock.sendMessage(chatId, {
                text: `❌ *Download Failed!*\n\n` +
                      `All download sources failed.\n` +
                      `💡 Please try again later.`
            }, { quoted: message });
            return;
        }

        // --- Build Response ---
        const finalTitle = videoData.title || videoTitle || 'YouTube Video';
        const timestamp = new Date().toLocaleString();

        const responseCaption = `╭━━━〔 ${toBold("✅ VIDEO READY")} 〕━━━┈⊷\n` +
                               `┃\n` +
                               `┃ 📝 ${toBold("Title:")} ${finalTitle}\n` +
                               `┃ 🔗 ${toBold("Source:")} ${usedApi}\n` +
                               `┃ 🕐 ${toBold("Downloaded:")} ${timestamp}\n` +
                               `┃\n` +
                               `┃ 💡 ${toBold("Downloaded By:")} TEAM-ZUBAIR-MD\n` +
                               `╰━━━━━━━━━━━━━━━━━━┈⊷`;

        // --- Send Video ---
        await sock.sendMessage(chatId, {
            video: { url: videoData.download },
            mimetype: 'video/mp4',
            fileName: `${finalTitle.replace(/[^\w\s-]/g, '')}.mp4`,
            caption: responseCaption,
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

        // --- Success Reaction ---
        await sock.sendMessage(chatId, { 
            react: { text: '✅', key: message.key } 
        });

        // --- Send Success Message ---
        await sock.sendMessage(chatId, {
            text: `✅ *Video Downloaded Successfully!*\n\n` +
                  `🎥 ${finalTitle}\n` +
                  `🔗 Source: ${usedApi}\n\n` +
                  `💡 Use .video for more videos!`
        }, { quoted: message });

    } catch (error) {
        console.error('Video error:', error);
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

module.exports = videoCommand;