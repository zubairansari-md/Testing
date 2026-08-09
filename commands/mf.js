const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
const CONFIG = {
    TEMP_DIR: path.join(process.cwd(), 'tmp', 'mediafire'),
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

const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return 'Unknown';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
};

const formatTime = (seconds) => {
    if (seconds < 60) return seconds + 's';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ' + (seconds % 60) + 's';
    return Math.floor(seconds / 3600) + 'h ' + Math.floor((seconds % 3600) / 60) + 'm';
};

// --- ENSURE TEMP DIRECTORY ---
if (!fs.existsSync(CONFIG.TEMP_DIR)) {
    fs.mkdirSync(CONFIG.TEMP_DIR, { recursive: true });
}

// --- MAIN COMMAND ---
async function mfCommand(sock, from, msg, q, args = []) {
    try {
        // --- HELP MENU ---
        if (!q || q === 'help') {
            return await sock.sendMessage(from, { 
                text: `╭━━━〔 ${toBold("📥 MEDIAFIRE DOWNLOADER")} 〕━━━┈⊷\n` +
                      `┃\n` +
                      `┃ 📌 ${toBold("Usage:")}\n` +
                      `┃ .mf [MediaFire URL]\n` +
                      `┃\n` +
                      `┃ 📌 ${toBold("Examples:")}\n` +
                      `┃ .mf https://www.mediafire.com/file/...\n` +
                      `┃ .mf https://www.mediafire.com/download/...\n` +
                      `┃\n` +
                      `┃ 📌 ${toBold("Features:")}\n` +
                      `┃ • Auto Detect File Name\n` +
                      `┃ • Show File Size\n` +
                      `┃ • Multiple Download Methods\n` +
                      `┃ • Progress Tracking\n` +
                      `┃ • Fast Download\n` +
                      `┃\n` +
                      `┃ 💡 ${toBold("Tip:")} Works with all MediaFire links!\n` +
                      `╰━━━━━━━━━━━━━━━━━━┈⊷`
            }, { quoted: msg });
        }

        // --- Validate URL ---
        if (!q.includes('mediafire.com')) {
            return await sock.sendMessage(from, { 
                text: `❌ *Invalid URL!*\n\nPlease provide a valid MediaFire link.\n💡 Example: .mf https://www.mediafire.com/file/...`
            }, { quoted: msg });
        }

        // --- Send loading reaction ---
        await sock.sendMessage(from, { 
            react: { text: '🔄', key: msg.key } 
        });

        // --- Send processing message ---
        await sock.sendMessage(from, { 
            text: `🔍 *Analyzing MediaFire link...*\n\n⏳ Please wait...`
        }, { quoted: msg });

        // --- Fetch page with retry ---
        let html = '';
        let finalUrl = q;

        for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
            try {
                const response = await axios.get(finalUrl, {
                    headers: {
                        'User-Agent': CONFIG.USER_AGENT,
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.5',
                        'Accept-Encoding': 'gzip, deflate, br',
                        'DNT': '1',
                        'Connection': 'keep-alive',
                        'Upgrade-Insecure-Requests': '1'
                    },
                    timeout: CONFIG.TIMEOUT,
                    maxRedirects: 5,
                    validateStatus: s => s >= 200 && s < 500
                });

                if (response.status === 200) {
                    html = response.data;
                    break;
                }
            } catch (error) {
                console.error(`Attempt ${attempt} failed:`, error.message);
                if (attempt === CONFIG.MAX_RETRIES) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        if (!html) {
            throw new Error('Failed to fetch page');
        }

        // --- Parse HTML ---
        const $ = cheerio.load(html);
        
        // --- Extract Download URL ---
        let downloadUrl = null;
        let fileName = 'file';
        let fileSize = 'Unknown';
        let fileType = 'Unknown';

        // Method 1: Download button
        const downloadBtn = $('#downloadButton');
        if (downloadBtn.length > 0) {
            downloadUrl = downloadBtn.attr('href');
        }

        // Method 2: Alternative download link
        if (!downloadUrl) {
            const altBtn = $('.download-link, .input, .dl-btn, .download_file, a[href*="download"]');
            for (let i = 0; i < altBtn.length; i++) {
                const href = $(altBtn[i]).attr('href');
                if (href && href.includes('mediafire.com')) {
                    downloadUrl = href;
                    break;
                }
            }
        }

        // Method 3: Find in script or hidden elements
        if (!downloadUrl) {
            const scripts = $('script').toArray();
            for (const script of scripts) {
                const content = $(script).html() || '';
                const match = content.match(/https?:\/\/[^\s"']+mediafire\.com[^\s"']+download[^\s"']+/);
                if (match) {
                    downloadUrl = match[0];
                    break;
                }
            }
        }

        // --- Extract File Name ---
        const nameSelectors = [
            '.dl-info .promo_ss_file_name',
            '.dl-btn-label',
            '.filename',
            '.file-name',
            '.file_info .file_name',
            '#file_name',
            '.download_file_name',
            'h1:contains("File")',
            '.file-title'
        ];

        for (const selector of nameSelectors) {
            const el = $(selector);
            if (el.length > 0) {
                const text = el.text().trim() || el.attr('title') || el.attr('data-name');
                if (text && text.length > 0) {
                    fileName = text;
                    break;
                }
            }
        }

        // If still no name, try to get from URL
        if (fileName === 'file') {
            const urlParts = q.split('/');
            const lastPart = urlParts[urlParts.length - 1];
            if (lastPart && lastPart.includes('.')) {
                fileName = lastPart;
            }
        }

        // --- Extract File Size ---
        const sizeSelectors = [
            '.dl-info .promo_ss_file_size',
            '.file-size',
            '.file_info .file_size',
            '.size',
            '.fileSize',
            '#file_size',
            '.download_file_size'
        ];

        for (const selector of sizeSelectors) {
            const el = $(selector);
            if (el.length > 0) {
                const text = el.text().trim();
                if (text && text.length > 0) {
                    fileSize = text;
                    break;
                }
            }
        }

        // --- Extract File Type ---
        const extension = fileName.split('.').pop().toLowerCase();
        const typeMap = {
            'mp4': 'Video',
            'mkv': 'Video',
            'avi': 'Video',
            'mov': 'Video',
            'mp3': 'Audio',
            'wav': 'Audio',
            'flac': 'Audio',
            'jpg': 'Image',
            'jpeg': 'Image',
            'png': 'Image',
            'gif': 'Image',
            'webp': 'Image',
            'pdf': 'Document',
            'doc': 'Document',
            'docx': 'Document',
            'xls': 'Document',
            'xlsx': 'Document',
            'ppt': 'Document',
            'pptx': 'Document',
            'txt': 'Document',
            'zip': 'Archive',
            'rar': 'Archive',
            '7z': 'Archive',
            'apk': 'Application',
            'exe': 'Application',
            'msi': 'Application'
        };
        fileType = typeMap[extension] || 'Unknown';

        // --- Check if download URL found ---
        if (!downloadUrl) {
            await sock.sendMessage(from, { 
                text: `❌ *Failed to Get Download Link!*\n\n` +
                      `Could not extract download URL from the page.\n` +
                      `💡 Try these solutions:\n` +
                      `• Make sure the link is correct\n` +
                      `• File might be private or deleted\n` +
                      `• Try a different MediaFire link`
            }, { quoted: msg });
            await sock.sendMessage(from, { 
                react: { text: '❌', key: msg.key } 
            });
            return;
        }

        // --- Build Info Message ---
        const infoMessage = `╭━━━〔 ${toBold("📁 MEDIAFIRE FILE INFO")} 〕━━━┈⊷\n` +
                           `┃\n` +
                           `┃ 📝 ${toBold("File:")} ${fileName}\n` +
                           `┃ 📏 ${toBold("Size:")} ${fileSize}\n` +
                           `┃ 📂 ${toBold("Type:")} ${fileType}\n` +
                           `┃ 🔗 ${toBold("Status:")} ✅ Ready\n` +
                           `┃\n` +
                           `┃ 📥 ${toBold("Downloading...")}\n` +
                           `╰━━━━━━━━━━━━━━━━━━┈⊷`;

        await sock.sendMessage(from, { 
            text: infoMessage
        }, { quoted: msg });

        // --- Download and Send File ---
        const startTime = Date.now();

        try {
            // Method 1: Direct URL
            await sock.sendMessage(from, {
                document: { url: downloadUrl },
                mimetype: 'application/octet-stream',
                fileName: fileName,
                caption: `╭━━━〔 ${toBold("📥 DOWNLOAD COMPLETE")} 〕━━━┈⊷\n` +
                        `┃\n` +
                        `┃ 📝 ${toBold("File:")} ${fileName}\n` +
                        `┃ 📏 ${toBold("Size:")} ${fileSize}\n` +
                        `┃ 📂 ${toBold("Type:")} ${fileType}\n` +
                        `┃ ⏱️ ${toBold("Time:")} ${formatTime((Date.now() - startTime) / 1000)}\n` +
                        `┃\n` +
                        `┃ 💡 ${toBold("Downloaded By:")} TEAM-ZUBAIR-MD\n` +
                        `╰━━━━━━━━━━━━━━━━━━┈⊷`,
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

            await sock.sendMessage(from, { 
                react: { text: '✅', key: msg.key } 
            });

        } catch (urlError) {
            console.error('Direct URL method failed:', urlError.message);
            
            // Method 2: Buffer download
            try {
                await sock.sendMessage(from, { 
                    text: `📥 *Downloading via buffer method...*\n\n⏳ Please wait...`
                }, { quoted: msg });

                const response = await axios({
                    method: 'GET',
                    url: downloadUrl,
                    responseType: 'arraybuffer',
                    timeout: CONFIG.TIMEOUT,
                    headers: {
                        'User-Agent': CONFIG.USER_AGENT,
                        'Referer': 'https://www.mediafire.com/'
                    }
                });

                const buffer = Buffer.from(response.data);

                await sock.sendMessage(from, {
                    document: buffer,
                    mimetype: 'application/octet-stream',
                    fileName: fileName,
                    caption: `╭━━━〔 ${toBold("📥 DOWNLOAD COMPLETE")} 〕━━━┈⊷\n` +
                            `┃\n` +
                            `┃ 📝 ${toBold("File:")} ${fileName}\n` +
                            `┃ 📏 ${toBold("Size:")} ${formatSize(buffer.length)}\n` +
                            `┃ 📂 ${toBold("Type:")} ${fileType}\n` +
                            `┃ ⏱️ ${toBold("Time:")} ${formatTime((Date.now() - startTime) / 1000)}\n` +
                            `┃\n` +
                            `┃ 💡 ${toBold("Downloaded By:")} TEAM-ZUBAIR-MD\n` +
                            `╰━━━━━━━━━━━━━━━━━━┈⊷`,
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

                await sock.sendMessage(from, { 
                    react: { text: '✅', key: msg.key } 
                });

            } catch (bufferError) {
                console.error('Buffer method failed:', bufferError.message);
                throw new Error('Both methods failed');
            }
        }

        // --- Send Success Summary ---
        await sock.sendMessage(from, {
            text: `✅ *Download Complete!*\n\n` +
                  `📝 ${toBold("File:")} ${fileName}\n` +
                  `📏 ${toBold("Size:")} ${fileSize}\n` +
                  `📂 ${toBold("Type:")} ${fileType}\n` +
                  `⏱️ ${toBold("Time:")} ${formatTime((Date.now() - startTime) / 1000)}\n` +
                  `\n💡 Use .mf help for more info!`
        }, { quoted: msg });

    } catch (error) {
        console.error('MediaFire Error:', error);
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

module.exports = mfCommand;