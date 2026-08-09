async function kickCommand(sock, from, msg, isAdmin, args) {
    // --- Validation ---
    if (!from.endsWith('@g.us')) {
        return await sock.sendMessage(from, { 
            text: "❌ This command can only be used in groups." 
        }, { quoted: msg });
    }
    
    if (!isAdmin) {
        return await sock.sendMessage(from, { 
            text: "❌ Only group admins can use this command." 
        }, { quoted: msg });
    }

    try {
        // --- Get Target Users ---
        let targets = [];
        let targetNames = [];
        
        // 1. Check for mentioned users
        const mentionedJids = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (mentionedJids.length > 0) {
            targets = mentionedJids;
        }
        
        // 2. Check for replied user
        const repliedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;
        if (repliedParticipant && !targets.includes(repliedParticipant)) {
            targets.push(repliedParticipant);
        }
        
        // 3. Check for numbers in args
        if (args && args.length > 0) {
            for (const arg of args) {
                if (arg.includes('@s.whatsapp.net') || arg.includes('@g.us')) {
                    if (!targets.includes(arg)) {
                        targets.push(arg);
                    }
                } else if (arg.match(/^[0-9]+$/)) {
                    const jid = arg + '@s.whatsapp.net';
                    if (!targets.includes(jid)) {
                        targets.push(jid);
                    }
                }
            }
        }

        // --- No target found ---
        if (targets.length === 0) {
            return await sock.sendMessage(from, { 
                text: `❌ *No User Selected!*\n\n` +
                      `Please specify users to kick:\n` +
                      `• Reply to a message\n` +
                      `• Tag users\n` +
                      `• Provide numbers\n\n` +
                      `📌 ${toBold("Examples:")}\n` +
                      `.kick @user1 @user2\n` +
                      `.kick (reply to message)\n` +
                      `.kick 9234567890`
            }, { quoted: msg });
        }

        // --- Get Group Metadata ---
        const groupMetadata = await sock.groupMetadata(from);
        const participants = groupMetadata.participants || [];
        const admins = participants.filter(p => p.admin).map(p => p.id);
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';

        // --- Filter Targets ---
        const validTargets = [];
        const invalidTargets = [];
        const adminTargets = [];

        for (const target of targets) {
            // Check if user is in group
            const isInGroup = participants.some(p => p.id === target);
            if (!isInGroup) {
                invalidTargets.push(target);
                continue;
            }
            
            // Check if target is admin
            if (admins.includes(target)) {
                adminTargets.push(target);
                continue;
            }
            
            // Check if target is bot itself
            if (target === botId) {
                invalidTargets.push(target);
                continue;
            }
            
            validTargets.push(target);
        }

        // --- No valid targets ---
        if (validTargets.length === 0) {
            let errorMsg = `❌ *No Valid Users to Kick!*\n\n`;
            if (adminTargets.length > 0) {
                errorMsg += `⚠️ Cannot kick admins: ${adminTargets.length}\n`;
            }
            if (invalidTargets.length > 0) {
                errorMsg += `❌ Invalid users: ${invalidTargets.length}\n`;
            }
            errorMsg += `\n💡 Make sure users are in the group and not admins.`;
            return await sock.sendMessage(from, { text: errorMsg }, { quoted: msg });
        }

        // --- Send confirmation message ---
        const targetDisplay = validTargets.map(t => `@${t.split('@')[0]}`).join(' ');
        const confirmMsg = `⚠️ *Kicking Users...*\n\n` +
                          `👥 ${toBold("Targets:")} ${validTargets.length}\n` +
                          `${targetDisplay}\n\n` +
                          `⏳ Processing...`;

        await sock.sendMessage(from, { 
            text: confirmMsg,
            mentions: validTargets
        }, { quoted: msg });

        // --- Kick Users ---
        let kickedCount = 0;
        let failedCount = 0;
        let failedUsers = [];

        for (const target of validTargets) {
            try {
                await sock.groupParticipantsUpdate(from, [target], "remove");
                kickedCount++;
                
                // Send individual notification (optional)
                try {
                    await sock.sendMessage(target, {
                        text: `⚠️ *You have been kicked from a group!*\n\n` +
                              `📌 Group: ${groupMetadata.subject || 'Unknown'}\n` +
                              `🕐 Time: ${new Date().toLocaleString()}\n` +
                              `👤 Kicked by: @${msg.key?.participant?.split('@')[0] || 'Admin'}`,
                        mentions: [msg.key?.participant || from]
                    });
                } catch (notifyError) {
                    // Silent fail for notification
                }

            } catch (error) {
                console.error(`Failed to kick ${target}:`, error.message);
                failedCount++;
                failedUsers.push(target);
            }
        }

        // --- Get kicked user names ---
        let kickedNames = [];
        for (const target of validTargets) {
            try {
                const contact = await sock.getContact(target);
                if (contact) {
                    kickedNames.push(contact.name || contact.verifiedName || target.split('@')[0]);
                } else {
                    kickedNames.push(target.split('@')[0]);
                }
            } catch {
                kickedNames.push(target.split('@')[0]);
            }
        }

        // --- Build Result Message ---
        let resultMsg = `╭━━━〔 ${toBold("👢 KICK COMMAND RESULT")} 〕━━━┈⊷\n` +
                       `┃\n` +
                       `┃ 📊 ${toBold("Total:")} ${validTargets.length}\n` +
                       `┃ ✅ ${toBold("Kicked:")} ${kickedCount}\n` +
                       `┃ ❌ ${toBold("Failed:")} ${failedCount}\n` +
                       `┃\n`;

        if (kickedCount > 0) {
            resultMsg += `┃ 👥 ${toBold("Kicked Users:")}\n`;
            const displayNames = kickedNames.slice(0, 10);
            for (const name of displayNames) {
                resultMsg += `┃   • ${name}\n`;
            }
            if (kickedNames.length > 10) {
                resultMsg += `┃   • +${kickedNames.length - 10} more\n`;
            }
            resultMsg += `┃\n`;
        }

        if (failedCount > 0) {
            resultMsg += `┃ ⚠️ ${toBold("Failed Users:")}\n`;
            const failedDisplay = failedUsers.slice(0, 5);
            for (const user of failedDisplay) {
                resultMsg += `┃   • ${user.split('@')[0]}\n`;
            }
            if (failedUsers.length > 5) {
                resultMsg += `┃   • +${failedUsers.length - 5} more\n`;
            }
            resultMsg += `┃\n`;
        }

        if (adminTargets.length > 0) {
            resultMsg += `┃ ⚠️ ${toBold("Skipped Admins:")} ${adminTargets.length}\n`;
            resultMsg += `┃\n`;
        }

        resultMsg += `┃ 🕐 ${toBold("Time:")} ${new Date().toLocaleString()}\n` +
                     `┃\n` +
                     `┃ 💡 ${toBold("Note:")} Users have been removed!\n` +
                     `╰━━━━━━━━━━━━━━━━━━┈⊷`;

        // --- Send Result ---
        const allMentions = [...validTargets, ...failedUsers, ...adminTargets];
        await sock.sendMessage(from, { 
            text: resultMsg,
            mentions: allMentions
        }, { quoted: msg });

        // --- Send Reaction ---
        await sock.sendMessage(from, { 
            react: { text: kickedCount > 0 ? '✅' : '❌', key: msg.key } 
        });

    } catch (error) {
        console.error('Kick Command Error:', error);
        await sock.sendMessage(from, { 
            text: `❌ *Error Occurred!*\n\n` +
                  `Error: ${error.message}\n` +
                  `💡 Make sure I am an admin with proper permissions.`
        }, { quoted: msg });
        await sock.sendMessage(from, { 
            react: { text: '❌', key: msg.key } 
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

module.exports = kickCommand;