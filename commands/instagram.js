const { igdl } = require("ruhend-scraper");
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
const CONFIG = {
    TEMP_DIR: path.join(process.cwd(), 'tmp', 'instagram'),
    MAX_MEDIA: 10,
    TIMEOUT: 60000,
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

// --- EXTRACT UNIQUE MEDIA ---
function extractUniqueMedia(mediaData) {
    const uniqueMedia = [];
    const seenUrls = new Set();
    
    for (const media of mediaData) {
        if (!media.url) continue;
        if (!seenUrls.has(media.url)) {
            seenUrls.add(media.url);
            uniqueMedia.push(media);
        }
    }
    return uniqueMedia;
}

// --- GET MEDIA INFO ---
function getMediaInfo(mediaData) {
    let videoCount = 0;
    let imageCount = 0;
    let totalSize = 0;
    
    for (const media of mediaData) {
        if (media.type === 'video' || /\.(mp4|mov|avi|mkv|webm)/i.test(media.url)) {
            videoCount++;
        } else {
            imageCount++;
        }
    }
    
    return { videoCount, imageCount, total: mediaData.length };
}

// --- MAIN COMMAND ---
async function instagramCommand(sock, chatId, message) {
    try {
        // --- Extract Message ---
        const messageContent = message.message?.ephemeralMessage?.message || 
                             message.message?.viewOnceMessage?.message || 
                             message.message?.viewOnceMessageV2?.message || 
                             message.message;
        
        const text = (messageContent.conversation || 
                     messageContent.extendedTextMessage?.text || 
                     messageContent.imageMessage?.caption || 
                     messageContent.videoMessage?.caption || '').trim();
        
        const query = text.replace(/^\.(insta|ig|instagram)\s+/i, '').trim();
        
        // --- HELP MENU ---
        if (!query || query === 'help' || query === '') {
            return await sock.sendMessage(chatId, { 
                text: `╭━━━〔 ${toBold("📸 INSTAGRAM DOWNLOADER")} 〕━━━┈⊷\n` +
                      `┃\n` +
                      `┃ 📌 ${toBold("Usage:")}\n` +
                      `┃ .insta [Instagram URL]\n` +
                      `┃ .ig [Instagram URL]\n` +
                      `┃ .instagram [Instagram URL]\n` +
                      `┃\n` +
                      `┃ 📌 ${toBold("Examples:")}\n` +
                      `┃ .insta https://www.instagram.com/p/...\n` +
                      `┃ .ig https://www.instagram.com/reel/...\n` +
                      `┃ .instagram https://www.instagram.com/tv/...\n` +
                      `┃\n` +
                      `┃ 📌 ${toBold("Features:")}\n` +
                      `┃ • Posts, Reels, TV, Stories\n` +
                      `┃ • HD Quality Download\n` +
                      `┃ • Multiple Images Support\n` +
                      `┃ • Auto Detect Media Type\n` +
                      `┃ • Smart Deduplication\n` +
                      `┃\n` +
                      `┃ 💡 ${toBold("Tip:")} Works with public links!\n` +
                      `╰━━━━━━━━━━━━━━━━━━┈⊷`
            }, { quoted: message });
        }

        // --- Validate URL ---
        const instagramPatterns = [
            /https?:\/\/(?:www\.)?instagram\.com\//,
            /https?:\/\/(?:www\.)?instagr\.am\//
        ];

        const isValidUrl = instagramPatterns.some(pattern => pattern.test(query));
        
        if (!isValidUrl) {
            return await sock.sendMessage(chatId, { 
                text: `❌ *Invalid Instagram Link!*\n\n` +
                      `Please provide a valid Instagram URL.\n` +
                      `💡 Example: .insta https://www.instagram.com/p/...`
            }, { quoted: message });
        }

        // --- Send Loading Reactions ---
        const loadEmojis = ['🔄', '📥', '⏳'];
        for (const emoji of loadEmojis) {
            await sock.sendMessage(chatId, { react: { text: emoji, key: message.key } });
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        // --- Send Processing Message ---
        await sock.sendMessage(chatId, { 
            text: `🔍 *Fetching Instagram content...*\n\n⏳ Please wait...`
        }, { quoted: message });

        // --- Download Data ---
        const downloadData = await igdl(query);
        
        if (!downloadData || !downloadData.data || downloadData.data.length === 0) {
            await sock.sendMessage(chatId, { 
                text: `❌ *No Media Found!*\n\n` +
                      `Possible reasons:\n` +
                      `• Post is private\n` +
                      `• Link is invalid\n` +
                      `• Account is private\n` +
                      `• Content was deleted\n\n` +
                      `💡 Make sure the link is public.`
            }, { quoted: message });
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            return;
        }

        // --- Extract Unique Media ---
        const uniqueMedia = extractUniqueMedia(downloadData.data);
        const mediaInfo = getMediaInfo(uniqueMedia);
        
        // --- Limit Media ---
        const mediaToDownload = uniqueMedia.slice(0, CONFIG.MAX_MEDIA);
        const totalMedia = uniqueMedia.length;
        const limited = totalMedia > CONFIG.MAX_MEDIA;

        // --- Send Info Message ---
        const infoMessage = `📸 *Instagram Media Found*\n\n` +
                           `📊 ${toBold("Total:")} ${totalMedia} media\n` +
                           `🎬 ${toBold("Videos:")} ${mediaInfo.videoCount}\n` +
                           `🖼️ ${toBold("Images:")} ${mediaInfo.imageCount}\n` +
                           `${limited ? `⚠️ ${toBold("Note:")} Showing first ${CONFIG.MAX_MEDIA} media\n` : ''}` +
                           `\n📥 Downloading...`;

        await sock.sendMessage(chatId, { 
            text: infoMessage
        }, { quoted: message });

        // --- Process Each Media ---
        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < mediaToDownload.length; i++) {
            try {
                const media = mediaToDownload[i];
                const mediaUrl = media.url;
                const isVideo = media.type === 'video' || /\.(mp4|mov|avi|mkv|webm)/i.test(mediaUrl);
                const mediaType = isVideo ? 'Video' : 'Image';

                // --- Build Caption ---
                const caption = `╭━━━〔 ${toBold(`📸 INSTAGRAM ${mediaType.toUpperCase()}`)} 〕━━━┈⊷\n` +
                               `┃\n` +
                               `┃ 📊 ${toBold("Media:")} ${i + 1}/${mediaToDownload.length}\n` +
                               `┃ 🎬 ${toBold("Type:")} ${mediaType}\n` +
                               `┃ 🕐 ${toBold("Downloaded:")} ${new Date().toLocaleString()}\n` +
                               `┃\n` +
                               `┃ 📥 ${toBold("Downloaded By:")} TEAM-ZUBAIR-MD\n` +
                               `┃ 💡 ${toBold("Tip:")} Use .insta for more!\n` +
                               `╰━━━━━━━━━━━━━━━━━━┈⊷`;

                // --- Send Media ---
                if (isVideo) {
                    await sock.sendMessage(chatId, {
                        video: { url: mediaUrl },
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
                } else {
                    await sock.sendMessage(chatId, {
                        image: { url: mediaUrl },
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
                }

                successCount++;

                // --- Small delay between multiple media ---
                if (mediaToDownload.length > 1 && i < mediaToDownload.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 800));
                }

            } catch (mediaError) {
                console.error(`Media error ${i + 1}:`, mediaError.message);
                failCount++;
                
                // --- Try Fallback for individual media ---
                try {
                    const fallbackResponse = await axios.get(mediaToDownload[i].url, {
                        responseType: 'arraybuffer',
                        timeout: 30000
                    });
                    
                    const buffer = Buffer.from(fallbackResponse.data);
                    const isVideo = mediaToDownload[i].type === 'video' || 
                                  /\.(mp4|mov|avi|mkv|webm)/i.test(mediaToDownload[i].url);
                    
                    if (isVideo) {
                        await sock.sendMessage(chatId, { 
                            video: buffer,
                            caption: `📸 *Instagram Video (Fallback)*\n\n📊 ${i + 1}/${mediaToDownload.length}`
                        }, { quoted: message });
                    } else {
                        await sock.sendMessage(chatId, { 
                            image: buffer,
                            caption: `📸 *Instagram Image (Fallback)*\n\n📊 ${i + 1}/${mediaToDownload.length}`
                        }, { quoted: message });
                    }
                    
                    successCount++;
                } catch (fallbackError) {
                    console.error(`Fallback failed:`, fallbackError.message);
                }
            }
        }

        // --- Send Success Summary ---
        if (successCount > 0) {
            await sock.sendMessage(chatId, { 
                text: `✅ *Download Complete!*\n\n` +
                      `📥 ${toBold("Successful:")} ${successCount}/${mediaToDownload.length}\n` +
                      `❌ ${toBold("Failed:")} ${failCount}/${mediaToDownload.length}\n` +
                      `📸 ${toBold("Source:")} Instagram\n` +
                      `${limited ? `⚠️ ${toBold("Note:")} Only ${CONFIG.MAX_MEDIA} of ${totalMedia} media shown\n` : ''}` +
                      `\n💡 Use .insta help for more info!`
            }, { quoted: message });

            await sock.sendMessage(chatId, { 
                react: { text: '✅', key: message.key } 
            });
        } else {
            await sock.sendMessage(chatId, { 
                text: `❌ *Download Failed!*\n\nFailed to download any media. Please try again.`
            }, { quoted: message });
            await sock.sendMessage(chatId, { 
                react: { text: '❌', key: message.key } 
            });
        }

    } catch (error) {
        console.error('Instagram error:', error);
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

module.exports = instagramCommand;