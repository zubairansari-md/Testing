const axios = require('axios');
const yts = require('yt-search');
const fs = require('fs').promises;
const path = require('path');
const { toAudio } = require('../lib/converter');

// --- CONFIGURATION ---
const CONFIG = {
    TIMEOUT: 120000,
    MAX_RETRIES: 3,
    TEMP_DIR: path.join(process.cwd(), 'tmp', 'songs'),
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
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
        params: (url) => ({ url: url, format: 'mp3' })
    },
    {
        name: 'Yupra',
        url: 'https://api.yupra.my.id/api/downloader/ytmp3',
        parser: (data) => {
            if (data?.success && data?.data?.download_url) {
                return { download: data.data.download_url, title: data.data.title, thumbnail: data.data.thumbnail };
            }
            return null;
        },
        params: (url) => ({ url: url })
    },
    {
        name: 'Okatsu',
        url: 'https://okatsu-rolezapiiz.vercel.app/downloader/ytmp3',
        parser: (data) => {
            if (data?.dl) {
                return { download: data.dl, title: data.title, thumbnail: data.thumb };
            }
            return null;
        },
        params: (url) => ({ url: url })
    },
    {
        name: 'Alya',
        url: 'https://api.alyachan.pro/api/ytmp3',
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
        url: 'https://api.vreden.my.id/api/ytmp3',
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
async function songCommand(sock, chatId, message, args = []) {
    try {
        const action = args[0]?.toLowerCase();

        // --- HELP MENU ---
        if (!args.length || action === 'help') {
            return await sock.sendMessage(chatId, {
                text: `╭━━━〔 ${toBold("🎵 SONG DOWNLOADER")} 〕━━━┈⊷\n` +
                      `┃\n` +
                      `┃ 📌 ${toBold("Usage:")}\n` +
                      `┃ .song [song name or URL]\n` +
                      `┃ .song help         - Show help\n` +
                      `┃\n` +
                      `┃ 📌 ${toBold("Examples:")}\n` +
                      `┃ .song Shape of You\n` +
                      `┃ .song https://youtube.com/watch?v=...\n` +
                      `┃ .song https://youtu.be/...\n` +
                      `┃\n` +
                      `┃ 📌 ${toBold("Features:")}\n` +
                      `┃ • Search by name\n` +
                      `┃ • Direct YouTube link\n` +
                      `┃ • High Quality Audio\n` +
                      `┃ • Multiple Download Sources\n` +
                      `┃ • Auto Format Conversion\n` +
                      `┃\n` +
                      `┃ 💡 ${toBold("Tip:")} Get any song as MP3!\n` +
                      `╰━━━━━━━━━━━━━━━━━━┈⊷`
            }, { quoted: message });
        }

        // --- Loading Reactions ---
        const loadEmojis = ['🔄', '📥', '⏳', '🎵'];
        for (const emoji of loadEmojis) {
            await sock.sendMessage(chatId, { react: { text: emoji, key: message.key } });
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        // --- Get Query ---
        const query = args.join(' ');

        // --- Search or Direct URL ---
        let video;
        let isUrl = false;

        if (query.includes('youtube.com') || query.includes('youtu.be')) {
            // Direct URL
            video = { 
                url: query, 
                title: 'YouTube Audio', 
                thumbnail: 'https://i.postimg.cc/y6GV9P3H/file-000000004c307206bc366893b817568c-(1).png',
                timestamp: 'N/A',
                views: 'N/A'
            };
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
            video = search.videos[0];
        }

        // --- Send Video Info ---
        const infoCaption = `╭━━━〔 ${toBold("🎵 SONG FOUND")} 〕━━━┈⊷\n` +
                           `┃\n` +
                           `┃ 📝 ${toBold("Title:")} ${video.title || 'Unknown'}\n` +
                           `┃ ⏱️ ${toBold("Duration:")} ${video.timestamp || formatTime(video.duration) || 'N/A'}\n` +
                           `┃ 👁️ ${toBold("Views:")} ${video.views ? video.views.toLocaleString() : 'N/A'}\n` +
                           `┃ 📅 ${toBold("Uploaded:")} ${video.ago || 'N/A'}\n` +
                           `┃ 🔗 ${toBold("Source:")} ${isUrl ? 'Direct URL' : 'YouTube Search'}\n` +
                           `┃\n` +
                           `┃ 📥 ${toBold("Downloading Audio...")}\n` +
                           `╰━━━━━━━━━━━━━━━━━━┈⊷`;

        await sock.sendMessage(chatId, {
            image: { url: video.thumbnail || 'https://i.postimg.cc/y6GV9P3H/file-000000004c307206bc366893b817568c-(1).png' },
            caption: infoCaption
        }, { quoted: message });

        // --- Download Audio ---
        let audioBuffer = null;
        let finalTitle = video.title || 'Unknown';
        let usedApi = 'Unknown';
        let downloadSuccess = false;

        for (const api of APIS) {
            try {
                const params = api.params(video.url);
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
                        // Download audio file
                        const audioResponse = await axios.get(parsed.download, {
                            responseType: 'arraybuffer',
                            timeout: CONFIG.TIMEOUT,
                            headers: {
                                'User-Agent': CONFIG.USER_AGENT,
                                'Accept': '*/*'
                            }
                        });

                        audioBuffer = Buffer.from(audioResponse.data);
                        if (audioBuffer && audioBuffer.length > 0) {
                            finalTitle = parsed.title || video.title || 'Unknown';
                            usedApi = api.name;
                            downloadSuccess = true;
                            
                            // Check file size
                            if (audioBuffer.length > CONFIG.MAX_FILE_SIZE) {
                                await sock.sendMessage(chatId, {
                                    text: `⚠️ *File Too Large!*\n\nFile size: ${formatSize(audioBuffer.length)}\nMax: ${formatSize(CONFIG.MAX_FILE_SIZE)}`
                                });
                                return;
                            }
                            
                            break;
                        }
                    }
                }
            } catch (error) {
                console.error(`${api.name} API failed:`, error.message);
                // Continue to next API
            }
        }

        // --- Check if download succeeded ---
        if (!downloadSuccess || !audioBuffer) {
            await sock.sendMessage(chatId, {
                text: `❌ *Download Failed!*\n\n` +
                      `All download sources failed.\n` +
                      `💡 Please try again later.`
            }, { quoted: message });
            return;
        }

        // --- Convert to MP3 if needed ---
        let finalBuffer = audioBuffer;
        const firstBytes = audioBuffer.slice(0, 4).toString('hex');
        let fileExtension = 'mp3';
        
        if (firstBytes.startsWith('000000') || audioBuffer.slice(4, 8).toString('ascii') === 'ftyp') {
            fileExtension = 'm4a';
        } else if (audioBuffer.toString('ascii', 0, 4) === 'OggS') {
            fileExtension = 'ogg';
        } else if (audioBuffer.toString('ascii', 0, 4) === 'RIFF') {
            fileExtension = 'wav';
        }

        if (fileExtension !== 'mp3') {
            try {
                finalBuffer = await toAudio(audioBuffer, fileExtension);
            } catch (convertError) {
                console.error('Conversion error:', convertError);
                // Use original buffer if conversion fails
                finalBuffer = audioBuffer;
            }
        }

        // --- Build Response ---
        const responseCaption = `╭━━━〔 ${toBold("✅ AUDIO READY")} 〕━━━┈⊷\n` +
                               `┃\n` +
                               `┃ 📝 ${toBold("Title:")} ${finalTitle}\n` +
                               `┃ 📏 ${toBold("Size:")} ${formatSize(finalBuffer.length)}\n` +
                               `┃ 🔗 ${toBold("Source:")} ${usedApi}\n` +
                               `┃ 🕐 ${toBold("Downloaded:")} ${new Date().toLocaleString()}\n` +
                               `┃\n` +
                               `┃ 💡 ${toBold("Tip:")} Use .song for more!\n` +
                               `╰━━━━━━━━━━━━━━━━━━┈⊷`;

        // --- Send Audio ---
        await sock.sendMessage(chatId, {
            audio: finalBuffer,
            mimetype: 'audio/mpeg',
            fileName: `${finalTitle.replace(/[^\w\s-]/g, '')}.mp3`,
            ptt: false,
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
            text: `✅ *Song Downloaded Successfully!*\n\n` +
                  `🎵 ${finalTitle}\n` +
                  `📏 ${formatSize(finalBuffer.length)}\n` +
                  `🔗 Source: ${usedApi}\n\n` +
                  `💡 Use .song for more music!`
        }, { quoted: message });

    } catch (error) {
        console.error('Song command error:', error);
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

module.exports = songCommand;