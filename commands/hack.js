// commands/hack.js
const settings = require('../settings');

function onlyDigits(s = '') {
  return String(s).replace(/\D/g, '');
}

function getOwnersNormalized() {
  const raw = settings.ownerNumber;
  const owners = Array.isArray(raw) ? raw : String(raw).split ? String(raw).split(',') : [raw];
  return owners.map(o => onlyDigits(o));
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function hackCommand(sock, chatId, message, q) {
  try {
    // Determine sender
    const rawSender = message.key?.participant || message.key?.remoteJid || '';
    const senderDigits = onlyDigits(rawSender);
    const senderName = message.pushName || 'Unknown';
    const senderNumber = rawSender.split('@')[0];

    // Owner(s)
    const owners = getOwnersNormalized();

    // Allow owner or fromMe messages
    if (!owners.includes(senderDigits) && !message.key?.fromMe) {
      return await sock.sendMessage(chatId, { 
        text: '❌ *Access Denied!*\n\nOnly the bot owner can use this command.' 
      }, { quoted: message });
    }

    // --- Target Selection ---
    let target = q || senderNumber;
    let targetName = 'Unknown';
    
    // Check if mentioned
    if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
      target = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
      targetName = target.split('@')[0];
    } 
    // Check if replied
    else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
      target = message.message.extendedTextMessage.contextInfo.participant;
      targetName = target.split('@')[0];
    }
    // Default to sender
    else {
      target = senderNumber;
      targetName = senderName;
    }

    // Clean target
    const targetDigits = onlyDigits(target);
    const isSelf = targetDigits === senderDigits;

    // --- Send Initial Reaction ---
    await sock.sendMessage(chatId, { 
      react: { text: '💀', key: message.key } 
    });

    // --- Build Target Info ---
    const targetInfo = isSelf ? 'yourself' : `@${targetDigits}`;
    const targetDisplay = isSelf ? 'YOU' : targetName || targetDigits;

    // --- Hacking Steps (Super Realistic) ---
    const steps = [
      {
        text: `╭━━━〔 ${toBold("💀 HACK INITIATED")} 〕━━━┈⊷\n` +
              `┃\n` +
              `┃ 🎯 ${toBold("Target:")} ${targetDisplay}\n` +
              `┃ 📱 ${toBold("Number:")} ${targetDigits}\n` +
              `┃ 🌐 ${toBold("IP:")} ${generateIP()}\n` +
              `┃ 📍 ${toBold("Location:")} ${generateLocation()}\n` +
              `┃\n` +
              `┃ ⚠️ ${toBold("WARNING!")} Hacking in progress...\n` +
              `╰━━━━━━━━━━━━━━━━━━┈⊷`,
        delay: 2000
      },
      {
        text: `🔍 *Scanning target device...*`,
        delay: 1500
      },
      {
        text: `📡 *Device Information Detected:*\n` +
              `┃ 📱 ${generateDevice()}\n` +
              `┃ 📶 ${generateNetwork()}\n` +
              `┃ 🔋 ${generateBattery()}\n` +
              `┃ 💾 ${generateStorage()}`,
        delay: 2000
      },
      {
        text: `🔓 *Bypassing security protocols...*`,
        delay: 1800
      },
      {
        text: ````[${generateProgress(20)}] 20% Connected to target...````,
        delay: 1500
      },
      {
        text: ````[${generateProgress(40)}] 40% Accessing device...````,
        delay: 1500
      },
      {
        text: `⚠️ *Firewall detected!* 🔥\nBypassing...`,
        delay: 2000
      },
      {
        text: ````[${generateProgress(60)}] 60% Bypassing firewall...````,
        delay: 1500
      },
      {
        text: `🔐 *Encryption cracked!* 🔓\nAccessing files...`,
        delay: 2000
      },
      {
        text: ````[${generateProgress(80)}] 80% Accessing data...````,
        delay: 1500
      },
      {
        text: `📂 *Files found:*\n` +
              `   📸 ${generateFiles()} photos\n` +
              `   📹 ${generateFiles()} videos\n` +
              `   📝 ${generateFiles()} documents\n` +
              `   💬 ${generateFiles()} chat logs`,
        delay: 2000
      },
      {
        text: ````[${generateProgress(95)}] 95% Extracting data...````,
        delay: 1500
      },
      {
        text: ````[${generateProgress(100)}] 100% Data extracted! ✅````,
        delay: 1500
      },
      {
        text: `🕵️ *Collecting personal information...*`,
        delay: 1800
      },
      {
        text: `📊 *Data collected:*\n` +
              `   🔑 ${generateData()} passwords\n` +
              `   💳 ${generateData()} card details\n` +
              `   📧 ${generateData()} emails\n` +
              `   📱 ${generateData()} contacts`,
        delay: 2000
      },
      {
        text: `📡 *Transmitting data to server...*`,
        delay: 1500
      },
      {
        text: `🛡️ *Covering tracks...*`,
        delay: 1500
      },
      {
        text: `🧹 *Deleting logs...*`,
        delay: 1500
      },
      {
        text: `✅ *Hack Complete!*`,
        delay: 1000
      },
      {
        text: `╭━━━〔 ${toBold("💀 HACK COMPLETE")} 〕━━━┈⊷\n` +
              `┃\n` +
              `┃ 🎯 ${toBold("Target:")} ${targetDisplay}\n` +
              `┃ 📱 ${toBold("Number:")} ${targetDigits}\n` +
              `┃ ⏱️ ${toBold("Time:")} ${new Date().toLocaleString()}\n` +
              `┃ 📊 ${toBold("Data Stolen:")} ${generateData()} GB\n` +
              `┃\n` +
              `┃ ⚠️ ${toBold("WARNING!")}\n` +
              `┃ ${isSelf ? 'You have been hacked! 🔥' : 'Target has been compromised! 🔥'}\n` +
              `┃\n` +
              `┃ 🤖 ${toBold("Note:")} This is a joke command!\n` +
              `┃ ${toBold("Don't take it seriously 😄")}\n` +
              `┃\n` +
              `┃ 💀 ${toBold("HACKED BY TEAM-ZUBAIR-MD")}\n` +
              `╰━━━━━━━━━━━━━━━━━━┈⊷`,
        delay: 2000
      }
    ];

    // --- Send each step with delays ---
    for (const step of steps) {
      await sock.sendMessage(chatId, { 
        text: step.text,
        mentions: [message.key?.participant || message.key?.remoteJid]
      }, { quoted: message });
      
      // Add random delay for realism
      const delay = step.delay || Math.floor(Math.random() * 1500) + 500;
      await sleep(delay);
    }

    // --- Final Scary Message ---
    await sleep(1000);
    await sock.sendMessage(chatId, { 
      text: `⚠️ *${isSelf ? 'YOU' : targetDisplay.toUpperCase()} HAVE BEEN HACKED!*\n\n` +
            `🔥 *${isSelf ? 'Your' : 'Their'} device is compromised!*\n` +
            `📱 *All data has been accessed!*\n` +
            `🕵️ *${isSelf ? 'You' : 'They'} are being monitored!*\n\n` +
            `> 💀 *TEAM-ZUBAIR-MD WATCHING YOU!*`,
      mentions: [message.key?.participant || message.key?.remoteJid]
    }, { quoted: message });

    // --- Send scary reaction ---
    await sock.sendMessage(chatId, { 
      react: { text: '☠️', key: message.key } 
    });

  } catch (err) {
    console.error('hackCommand error:', err);
    await sock.sendMessage(chatId, { 
      text: `❌ *Error Occurred!*\n\nError: ${err.message || String(err)}` 
    }, { quoted: message });
  }
}

// --- HELPER FUNCTIONS ---

function toBold(text) {
  const boldChars = {
    'a': '𝗮', 'b': '𝗯', 'c': '𝗰', 'd': '𝗱', 'e': '𝗲', 'f': '𝗳', 'g': '𝗴', 'h': '𝗵', 'i': '𝗶', 'j': '𝗷', 'k': '𝗸', 'l': '𝗹', 'm': '𝗺', 'n': '𝗻', 'o': '𝗼', 'p': '𝗽', 'q': '𝗾', 'r': '𝗿', 's': '𝘀', 't': '𝘁', 'u': '𝘂', 'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇',
    'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚', 'H': '𝗛', 'I': '𝗜', 'J': '𝗝', 'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡', 'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝘀', 't': '𝘁', 'u': '𝘂', 'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇',
    '0': '𝟬', '1': '𝟭', '2': '𝟮', '3': '𝟯', '4': '𝟰', '5': '𝟱', '6': '𝟲', '7': '𝟳', '8': '𝟴', '9': '𝟵'
  };
  return text.split('').map(c => boldChars[c] || c).join('');
}

function generateIP() {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

function generateLocation() {
  const locations = [
    'Karachi, Pakistan', 'Lahore, Pakistan', 'Islamabad, Pakistan', 
    'Dubai, UAE', 'London, UK', 'New York, USA', 
    'Toronto, Canada', 'Sydney, Australia', 'Berlin, Germany',
    'Paris, France', 'Tokyo, Japan', 'Singapore'
  ];
  return locations[Math.floor(Math.random() * locations.length)];
}

function generateDevice() {
  const devices = [
    'Samsung Galaxy S24 Ultra', 'iPhone 15 Pro Max', 'Google Pixel 8 Pro',
    'OnePlus 12', 'Xiaomi 14 Pro', 'Realme GT 5 Pro',
    'Nothing Phone 2', 'Asus ROG Phone 8', 'Samsung Galaxy Z Fold 5'
  ];
  return devices[Math.floor(Math.random() * devices.length)];
}

function generateNetwork() {
  const networks = [
    '5G Network', '4G LTE Network', 'Wi-Fi 6E', '5G Ultra Wideband',
    'Starlink Satellite', 'Fiber Optic 1Gbps'
  ];
  return networks[Math.floor(Math.random() * networks.length)];
}

function generateBattery() {
  return `${Math.floor(Math.random() * 51) + 50}%`;
}

function generateStorage() {
  const sizes = ['128GB', '256GB', '512GB', '1TB', '2TB'];
  return `${sizes[Math.floor(Math.random() * sizes.length)]} (${Math.floor(Math.random() * 80) + 20}% used)`;
}

function generateProgress(percentage) {
  const filled = Math.floor(percentage / 10);
  const empty = 10 - filled;
  return '█'.repeat(filled) + '▒'.repeat(empty);
}

function generateFiles() {
  return Math.floor(Math.random() * 100) + 1;
}

function generateData() {
  return (Math.random() * 4 + 1).toFixed(1);
}

module.exports = hackCommand;