const axios = require('axios');
const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
const CONFIG = {
    TEMP_DIR: path.join(process.cwd(), 'tmp', 'facebook'),
    TIMEOUT: 60000,
    MAX_RETRIES: 3,
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

// --- MULTIPLE API SOURCES ---
const APIS = [
    {
        name: 'Siputzx',
        url: 'https://api.siputzx.my.id/api/d/facebook',
        parser: (data) => {
            if (data?.status && data?.data && Array.isArray(data.data.data)) {
                const hdVideo = data.data.data.find(item => item.resolution === 'HD' && item.format === 'mp4');
                const sdVideo = data.data.data.find(item => item.resolution === 'SD' && item.format === 'mp4');
                return {
                    url: hdVideo?.url || sdVideo?.url,
                    title: data.data.title || 'Facebook Video',
                    duration: data.data.duration || 'N/A',
                    quality: hdVideo ? 'HD' : 'SD'
                };
            }
            return null;
        }
    },
    {
        name: 'NexOracle',
        url: 'https://api.nexoracle.com/downloader/fb',
        parser: (data) => {
            if (data?.result) {
                return {
                    url: data.result.hd || data.result.sd,
                    title: data.result.title || 'Facebook Video',
                    duration: data.result.duration || 'N/A',
                    quality: data.result.hd ? 'HD' : 'SD'
                };
            }
            return null;
        }
    },
    {
        name: 'ZenApi',
        url: 'https://zenapi.vercel.app/api/fbdl',
        parser: (data) => {
            if (data?.url) {
                return {
                    url: data.url,
                    title: data.title || 'Facebook Video',
                    duration: data.duration || 'N/A',
                    quality: data.quality || 'SD'
                };
            }
            return null;
        }
    }
];

// --- ENSURE TEMP DIRECTORY ---
if (!fs.existsSync(CONFIG.TEMP_DIR)) {
    fs.mkdirSync(CONFIG.TEMP_DIR, { recursive: true });
}

// --- MAIN COMMAND ---
async function facebookCommand(sock, chatId, message) {
    try {
        // --- Extract URL ---
        const text = message.message?.conversation || 
                    message.message?.extendedTextMessage?.text || '';
        const url = text.split(' ').slice(1).join(' ').trim();
        
        // --- HELP MENU ---
        if (!url || url === 'help') {
            return await sock.sendMessage(chatId, { 
                text: `╭━━━〔 ${toBold("📥 FACEBOOK DOWNLOADER")} 〕━━━┈⊷\n` +
                      `┃\n` +
                      `┃ 📌 ${toBold("Usage:")}\n` +
                      `┃ .fb [Facebook URL]\n` +
                      `┃\n` +
                      `┃ 📌 ${toBold("Examples:")}\n` +
                      `┃ .fb https://www.facebook.com/...\n` +
                      `┃ .fb https://fb.watch/...\n` +
                      `┃ .fb https://m.facebook.com/...\n` +
                      `┃\n` +
                      `┃ 📌 ${toBold("Features:")}\n` +
                      `┃ • HD Quality Download\n` +
                      `┃ • Multiple API Sources\n` +
                      `┃ • Auto Retry on Fail\n` +
                      `┃ • Video Info Display\n` +
                      `┃\n` +
                      `┃ 💡 ${toBold("Tip:")} Supports all Facebook links!\n` +
                      `╰━━━━━━━━━━━━━━━━━━┈⊷`
            }, { quoted: message });
        }

        // --- Validate URL ---
        if (!url.includes('facebook.com') && !url.includes('fb.watch')) {
            return await sock.sendMessage(chatId, { 
                text: `❌ *Invalid URL!*\n\n` +
                      `Please provide a valid Facebook link.\n` +
                      `💡 Example: .fb https://www.facebook.com/...`
            }, { quoted: message });
        }

        // --- Send loading reaction ---
        await sock.sendMessage(chatId, {
            react: { text: '🔄', key: message.key }
        });

        // --- Send processing message ---
        await sock.sendMessage(chatId, {
            text: `🔍 *Fetching Facebook Video...*\n\n` +
                  `⏳ Please wait...`
        }, { quoted: message });

        // --- Resolve URL ---
        let resolvedUrl = url;
        try {
            const res = await axios.get(url, { 
                timeout: 20000, 
                maxRedirects: 10, 
                headers: { 'User-Agent': CONFIG.USER_AGENT } 
            });
            const possible = res?.request?.res?.responseUrl;
            if (possible && typeof possible === 'string') {
                resolvedUrl = possible;
            }
        } catch {}

        // --- Try multiple APIs ---
        let videoData = null;
        let usedApi = null;

        for (const api of APIS) {
            try {
                const response = await axios.get(api.url, {
                    params: { url: resolvedUrl },
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
                    if (parsed && parsed.url) {
                        videoData = parsed;
                        usedApi = api.name;
                        break;
                    }
                }
            } catch (error) {
                console.error(`${api.name} API failed: ${error.message}`);
                // Try next API
            }
        }

        // --- Try with original URL if resolved failed ---
        if (!videoData) {
            for (const api of APIS) {
                try {
                    const response = await axios.get(api.url, {
                        params: { url: url },
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
                        if (parsed && parsed.url) {
                            videoData = parsed;
                            usedApi = api.name;
                            break;
                        }
                    }
                } catch (error) {
                    console.error(`${api.name} API (fallback) failed: ${error.message}`);
                }
            }
        }

        if (!videoData || !videoData.url) {
            await sock.sendMessage(chatId, { 
                text: `❌ *Failed to Download Video*\n\n` +
                      `Possible reasons:\n` +
                      `• Video is private or deleted\n` +
                      `• Link is invalid\n` +
                      `• Video not available for download\n` +
                      `• All APIs are down\n\n` +
                      `💡 Please try a different Facebook video link.`
            }, { quoted: message });
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            return;
        }

        // --- Build caption ---
        const caption = `╭━━━〔 ${toBold("📥 FACEBOOK VIDEO")} 〕━━━┈⊷\n` +
                       `┃\n` +
                       `┃ 📝 ${toBold("Title:")} ${videoData.title || 'N/A'}\n` +
                       `┃ ⏱️ ${toBold("Duration:")} ${videoData.duration || 'N/A'}\n` +
                       `┃ 📊 ${toBold("Quality:")} ${videoData.quality || 'SD'}\n` +
                       `┃ 🔗 ${toBold("Source:")} ${usedApi || 'Unknown'}\n` +
                       `┃ 🕐 ${toBold("Downloaded:")} ${new Date().toLocaleString()}\n` +
                       `┃\n` +
                       `┃ 📥 ${toBold("Downloading...")}\n` +
                       `╰━━━━━━━━━━━━━━━━━━┈⊷`;

        // --- Try URL method first ---
        try {
            await sock.sendMessage(chatId, {
                video: { url: videoData.url },
                mimetype: "video/mp4",
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
            
            await sock.sendMessage(chatId, { 
                react: { text: '✅', key: message.key } 
            });
            return;
        } catch (urlError) {
            console.error(`URL method failed: ${urlError.message}`);
            
            // --- Fallback to buffer method ---
            try {
                const tempFile = path.join(CONFIG.TEMP_DIR, `fb_${Date.now()}.mp4`);

                // Download video with retry
                let videoResponse = null;
                for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
                    try {
                        videoResponse = await axios({
                            method: 'GET',
                            url: videoData.url,
                            responseType: 'stream',
                            timeout: CONFIG.TIMEOUT,
                            headers: {
                                'User-Agent': CONFIG.USER_AGENT,
                                'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8',
                                'Accept-Language': 'en-US,en;q=0.5',
                                'Referer': 'https://www.facebook.com/'
                            }
                        });
                        break;
                    } catch (err) {
                        console.error(`Download attempt ${attempt} failed: ${err.message}`);
                        if (attempt === CONFIG.MAX_RETRIES) throw err;
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                }

                if (!videoResponse) throw new Error('Failed to download video');

                const writer = fs.createWriteStream(tempFile);
                videoResponse.data.pipe(writer);

                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });

                if (!fs.existsSync(tempFile) || fs.statSync(tempFile).size === 0) {
                    throw new Error('Downloaded file is empty');
                }

                // Send video
                await sock.sendMessage(chatId, {
                    video: { url: tempFile },
                    mimetype: "video/mp4",
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

                // Cleanup
                setTimeout(() => {
                    try {
                        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
                    } catch (err) {}
                }, 5000);

                await sock.sendMessage(chatId, { 
                    react: { text: '✅', key: message.key } 
                });
                return;
            } catch (bufferError) {
                console.error(`Buffer method failed: ${bufferError.message}`);
                throw new Error('Both URL and buffer methods failed');
            }
        }

    } catch (error) {
        console.error('Error in Facebook command:', error);
        await sock.sendMessage(chatId, { 
            text: `❌ *Error Occurred!*\n\n` +
                  `Error: ${error.message}\n` +
                  `💡 Please try again later.`
        }, { quoted: message });
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    }
}

module.exports = facebookCommand;