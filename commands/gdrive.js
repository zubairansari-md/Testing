const axios = require('axios');
const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
const CONFIG = {
    TEMP_DIR: path.join(process.cwd(), 'tmp', 'gdrive'),
    TIMEOUT: 120000,
    MAX_RETRIES: 3,
    CHUNK_SIZE: 1024 * 1024, // 1MB
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

// --- FORMAT FILE SIZE ---
const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return 'Unknown';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    if (bytes < 1024 * 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    return (bytes / (1024 * 1024 * 1024 * 1024)).toFixed(2) + ' TB';
};

// --- FORMAT TIME ---
const formatTime = (seconds) => {
    if (seconds < 60) return seconds + 's';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ' + (seconds % 60) + 's';
    return Math.floor(seconds / 3600) + 'h ' + Math.floor((seconds % 3600) / 60) + 'm';
};

// --- EXTRACT FILE ID ---
const extractFileId = (url) => {
    const patterns = [
        /\/file\/d\/([a-zA-Z0-9_-]{25,})/,
        /id=([a-zA-Z0-9_-]{25,})/,
        /\/d\/([a-zA-Z0-9_-]{25,})/,
        /([a-zA-Z0-9_-]{33,})/
    ];

    for (let pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
};

// --- GET FILE METADATA ---
const getFileMetadata = async (fileId) => {
    try {
        const url = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=name,size,mimeType,webContentLink`;
        const response = await axios.get(url, {
            headers: {
                'Authorization': 'Bearer AIzaSyC1FgHwGR6FRfz3sldf6s8n4f7s9f8s7f6s5f4s3f2s1f0s'
            }
        });
        
        if (response.data) {
            return {
                name: response.data.name || 'Unknown',
                size: response.data.size || 0,
                mimeType: response.data.mimeType || 'application/octet-stream',
                webContentLink: response.data.webContentLink || null
            };
        }
        return null;
    } catch (error) {
        console.error('Metadata fetch error:', error.message);
        return null;
    }
};

// --- CHECK FILE SIZE ---
const isLargeFile = (size) => {
    return size > 50 * 1024 * 1024; // 50MB
};

// --- ENSURE TEMP DIRECTORY ---
if (!fs.existsSync(CONFIG.TEMP_DIR)) {
    fs.mkdirSync(CONFIG.TEMP_DIR, { recursive: true });
}

// --- MAIN COMMAND ---
async function gdriveCommand(sock, from, msg, q) {
    try {
        // --- HELP MENU ---
        if (!q || q === 'help') {
            return await sock.sendMessage(from, { 
                text: `╭━━━〔 ${toBold("📥 GDRIVE DOWNLOADER")} 〕━━━┈⊷\n` +
                      `┃\n` +
                      `┃ 📌 ${toBold("Usage:")}\n` +
                      `┃ .gdrive [Google Drive URL]\n` +
                      `┃\n` +
                      `┃ 📌 ${toBold("Examples:")}\n` +
                      `┃ .gdrive https://drive.google.com/file/d/...\n` +
                      `┃ .gdrive https://drive.google.com/uc?id=...\n` +
                      `┃\n` +
                      `┃ 📌 ${toBold("Features:")}\n` +
                      `┃ • Auto Detect File Name\n` +
                      `┃ • Show File Size\n` +
                      `┃ • Progress Tracking\n` +
                      `┃ • Multiple Link Formats\n` +
                      `┃ • Download & Upload\n` +
                      `┃\n` +
                      `┃ 💡 ${toBold("Tip:")} Works with all GDrive links!\n` +
                      `╰━━━━━━━━━━━━━━━━━━┈⊷`
            }, { quoted: msg });
        }

        // --- Send loading reaction ---
        await sock.sendMessage(from, { 
            react: { text: '🔄', key: msg.key } 
        });

        // --- Extract File ID ---
        let fileId = extractFileId(q);
        
        if (!fileId) {
            await sock.sendMessage(from, { 
                text: `❌ *Invalid Link!*\n\n` +
                      `Could not extract File ID from the link.\n` +
                      `💡 Please provide a valid Google Drive link.`
            }, { quoted: msg });
            await sock.sendMessage(from, { react: { text: '❌', key: msg.key } });
            return;
        }

        // --- Get File Metadata ---
        await sock.sendMessage(from, { 
            text: `🔍 *Analyzing Google Drive file...*`
        }, { quoted: msg });

        const metadata = await getFileMetadata(fileId);
        let fileName = metadata?.name || `gdrive_file_${fileId}`;
        let fileSize = metadata?.size || 0;
        let mimeType = metadata?.mimeType || 'application/octet-stream';

        // --- Build download URL ---
        const downloadUrl = `https://docs.google.com/uc?export=download&id=${fileId}`;
        
        // --- Try to get headers ---
        try {
            const headResponse = await axios.head(downloadUrl, {
                headers: { 'User-Agent': CONFIG.USER_AGENT },
                timeout: 10000,
                maxRedirects: 5
            });
            
            const contentDisp = headResponse.headers['content-disposition'];
            if (contentDisp) {
                const fnameMatch = contentDisp.match(/filename="(.+)"/) || contentDisp.match(/filename=(.+)/);
                if (fnameMatch) fileName = fnameMatch[1];
            }
            
            const contentLen = headResponse.headers['content-length'];
            if (contentLen) fileSize = parseInt(contentLen);
        } catch (headErr) {
            console.log('Head request failed:', headErr.message);
        }

        // --- Build info message ---
        const fileSizeFormatted = formatSize(fileSize);
        const isLarge = isLargeFile(fileSize);
        
        const infoMessage = `╭━━━〔 ${toBold("📁 GDRIVE FILE INFO")} 〕━━━┈⊷\n` +
                           `┃\n` +
                           `┃ 📝 ${toBold("File:")} ${fileName}\n` +
                           `┃ 📏 ${toBold("Size:")} ${fileSizeFormatted}\n` +
                           `┃ 📂 ${toBold("Type:")} ${mimeType.split('/')[1] || 'Unknown'}\n` +
                           `┃ 🆔 ${toBold("ID:")} ${fileId.substring(0, 10)}...\n` +
                           `┃ ⚠️ ${toBold("Large File:")} ${isLarge ? '⚠️ Yes (>50MB)' : '✅ No'}\n` +
                           `┃\n` +
                           `┃ 📥 ${toBold("Downloading...")}\n` +
                           `╰━━━━━━━━━━━━━━━━━━┈⊷`;

        await sock.sendMessage(from, { 
            text: infoMessage
        }, { quoted: msg });

        // --- Handle large files differently ---
        if (isLarge) {
            await sock.sendMessage(from, { 
                text: `⚠️ *Large File Detected!*\n\n` +
                      `File size: ${fileSizeFormatted}\n` +
                      `Downloading large files may take time.\n` +
                      `⏳ Please wait...`
            }, { quoted: msg });
        }

        // --- Start download with progress ---
        const startTime = Date.now();
        
        try {
            // --- Method 1: Direct URL method ---
            await sock.sendMessage(from, { 
                document: { url: downloadUrl }, 
                mimetype: mimeType,
                fileName: fileName,
                caption: `📥 *Downloaded from Google Drive*\n\n` +
                         `📝 ${fileName}\n` +
                         `📏 ${fileSizeFormatted}\n` +
                         `⏱️ ${formatTime((Date.now() - startTime) / 1000)}\n` +
                         `> © TEAM-ZUBAIR-MD`,
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
            
            // --- Method 2: Download and upload ---
            try {
                await sock.sendMessage(from, { 
                    text: `📥 *Downloading via buffer method...*`
                }, { quoted: msg });

                const tempFile = path.join(CONFIG.TEMP_DIR, `${fileId}_${Date.now()}`);

                // Download file
                const response = await axios({
                    method: 'GET',
                    url: downloadUrl,
                    responseType: 'stream',
                    timeout: CONFIG.TIMEOUT,
                    headers: {
                        'User-Agent': CONFIG.USER_AGENT,
                        'Accept': '*/*'
                    }
                });

                const writer = fs.createWriteStream(tempFile);
                let downloadedBytes = 0;
                let lastProgress = Date.now();

                response.data.on('data', (chunk) => {
                    downloadedBytes += chunk.length;
                    const now = Date.now();
                    if (now - lastProgress > 5000) {
                        const progress = (downloadedBytes / fileSize * 100).toFixed(1);
                        const elapsed = (now - startTime) / 1000;
                        const speed = downloadedBytes / elapsed;
                        const speedFormatted = formatSize(speed) + '/s';
                        console.log(`Download progress: ${progress}% | Speed: ${speedFormatted}`);
                        lastProgress = now;
                    }
                });

                response.data.pipe(writer);

                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });

                // Check if file exists
                if (!fs.existsSync(tempFile) || fs.statSync(tempFile).size === 0) {
                    throw new Error('Downloaded file is empty');
                }

                // Send file
                await sock.sendMessage(from, {
                    document: fs.readFileSync(tempFile),
                    mimetype: mimeType,
                    fileName: fileName,
                    caption: `📥 *Downloaded from Google Drive*\n\n` +
                             `📝 ${fileName}\n` +
                             `📏 ${fileSizeFormatted}\n` +
                             `⏱️ ${formatTime((Date.now() - startTime) / 1000)}\n` +
                             `> © TEAM-ZUBAIR-MD`,
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

                // Cleanup
                setTimeout(() => {
                    try {
                        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
                    } catch (err) {}
                }, 5000);

                await sock.sendMessage(from, { 
                    react: { text: '✅', key: msg.key } 
                });

            } catch (bufferError) {
                console.error('Buffer method failed:', bufferError.message);
                throw new Error('Both methods failed');
            }
        }

    } catch (error) {
        console.error('GDrive Error:', error);
        await sock.sendMessage(from, { 
            text: `❌ *Error Occurred!*\n\n` +
                  `Error: ${error.message}\n` +
                  `💡 Please try again later.`
        }, { quoted: msg });
        await sock.sendMessage(from, { react: { text: '❌', key: msg.key } });
    }
}

module.exports = gdriveCommand;