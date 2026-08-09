async function anticallCommand(sock, from, msg, isAdmin, botData, saveBotData, userId, args) {
    if (!isAdmin) return await sock.sendMessage(from, { 
        text: "❌ Only group admins can use this command." 
    }, { quoted: msg });
    
    const action = args[0]?.toLowerCase();
    const subAction = args[1]?.toLowerCase();

    // --- HELP MENU ---
    if (action === 'help' || action === '-h' || !args.length) {
        return await sock.sendMessage(from, { 
            text: `📞 *Anti-Call Command Help*\n\n` +
                  `*Commands:*\n` +
                  `.anticall on              - Enable anti-call\n` +
                  `.anticall off             - Disable anti-call\n` +
                  `.anticall status          - Check anti-call status\n` +
                  `.anticall block [number]  - Block specific number\n` +
                  `.anticall unblock [number]- Unblock number\n` +
                  `.anticall list            - Show blocked numbers\n` +
                  `.anticall action [kick/block/warn] - Set action\n` +
                  `.anticall stats           - Show call stats\n` +
                  `.anticall log             - Show call logs\n\n` +
                  `*Examples:*\n` +
                  `.anticall on\n` +
                  `.anticall block 9234567890\n` +
                  `.anticall action kick`
        }, { quoted: msg });
    }

    // --- INITIALIZE ANTI-CALL DATA ---
    if (!botData.antiCall) {
        botData.antiCall = {
            enabled: {},
            blocked: {},
            action: {},
            stats: {},
            logs: []
        };
    }

    // --- ENABLE ANTI-CALL ---
    if (action === 'on') {
        botData.antiCall.enabled[userId] = true;
        botData.antiCall.action[userId] = botData.antiCall.action[userId] || 'warn';
        saveBotData();
        
        return await sock.sendMessage(from, { 
            text: `✅ *Anti-Call Enabled!*\n\n` +
                  `🔒 Call protection activated\n` +
                  `⚡ Action: ${botData.antiCall.action[userId]}\n` +
                  `📞 All incoming calls will be blocked` 
        }, { quoted: msg });
    }

    // --- DISABLE ANTI-CALL ---
    if (action === 'off') {
        botData.antiCall.enabled[userId] = false;
        saveBotData();
        
        return await sock.sendMessage(from, { 
            text: `❌ *Anti-Call Disabled!*\n\n` +
                  `🔓 Call protection deactivated\n` +
                  `📞 Incoming calls will be allowed` 
        }, { quoted: msg });
    }

    // --- STATUS CHECK ---
    if (action === 'status') {
        const status = botData.antiCall.enabled[userId] ? '✅ Enabled' : '❌ Disabled';
        const actionType = botData.antiCall.action[userId] || 'warn';
        const blockedCount = Object.keys(botData.antiCall.blocked[userId] || {}).length;
        const stats = botData.antiCall.stats[userId] || { total: 0, blocked: 0, warned: 0 };
        
        return await sock.sendMessage(from, { 
            text: `📊 *Anti-Call Status*\n\n` +
                  `🔹 Status: ${status}\n` +
                  `🔹 Action: ${actionType}\n` +
                  `🔹 Blocked Numbers: ${blockedCount}\n` +
                  `🔹 Total Calls Blocked: ${stats.blocked || 0}\n` +
                  `🔹 Total Warnings: ${stats.warned || 0}\n` +
                  `🔹 Last Call: ${stats.lastCall || 'Never'}`
        }, { quoted: msg });
    }

    // --- BLOCK SPECIFIC NUMBER ---
    if (action === 'block') {
        const number = args[1];
        if (!number) {
            return await sock.sendMessage(from, { 
                text: "❌ Please provide a number to block.\n" +
                      `📌 Example: .anticall block 9234567890` 
            }, { quoted: msg });
        }

        if (!botData.antiCall.blocked[userId]) {
            botData.antiCall.blocked[userId] = {};
        }
        
        botData.antiCall.blocked[userId][number] = {
            blockedAt: new Date().toISOString(),
            reason: 'Manually blocked'
        };
        saveBotData();

        return await sock.sendMessage(from, { 
            text: `🚫 *Number Blocked*\n\n` +
                  `📞 Number: ${number}\n` +
                  `⏱️ Blocked At: ${new Date().toLocaleString()}\n` +
                  `🔒 All calls from this number will be blocked` 
        }, { quoted: msg });
    }

    // --- UNBLOCK NUMBER ---
    if (action === 'unblock') {
        const number = args[1];
        if (!number) {
            return await sock.sendMessage(from, { 
                text: "❌ Please provide a number to unblock." 
            }, { quoted: msg });
        }

        if (botData.antiCall.blocked[userId]?.[number]) {
            delete botData.antiCall.blocked[userId][number];
            saveBotData();
            
            return await sock.sendMessage(from, { 
                text: `✅ *Number Unblocked*\n\n` +
                      `📞 Number: ${number}\n` +
                      `🔓 Calls from this number are now allowed` 
            }, { quoted: msg });
        } else {
            return await sock.sendMessage(from, { 
                text: `❌ Number ${number} is not blocked.` 
            }, { quoted: msg });
        }
    }

    // --- LIST BLOCKED NUMBERS ---
    if (action === 'list') {
        const blocked = botData.antiCall.blocked[userId] || {};
        const numbers = Object.keys(blocked);
        
        if (numbers.length === 0) {
            return await sock.sendMessage(from, { 
                text: "✅ No numbers are currently blocked." 
            }, { quoted: msg });
        }

        let listText = `🚫 *Blocked Numbers*\n\n`;
        numbers.slice(0, 20).forEach((num, index) => {
            const info = blocked[num];
            listText += `${index + 1}. ${num}\n`;
            listText += `   ⏱️ ${new Date(info.blockedAt).toLocaleString()}\n`;
        });
        
        if (numbers.length > 20) {
            listText += `\n... and ${numbers.length - 20} more`;
        }

        return await sock.sendMessage(from, { text: listText }, { quoted: msg });
    }

    // --- SET ACTION ---
    if (action === 'action') {
        const actionType = args[1]?.toLowerCase();
        if (!['kick', 'block', 'warn', 'ignore'].includes(actionType)) {
            return await sock.sendMessage(from, { 
                text: "❌ Invalid action!\n" +
                      "📌 Available: kick, block, warn, ignore\n" +
                      "💡 kick = Remove from group\n" +
                      "💡 block = Block user\n" +
                      "💡 warn = Send warning\n" +
                      "💡 ignore = Just log" 
            }, { quoted: msg });
        }

        botData.antiCall.action[userId] = actionType;
        saveBotData();

        return await sock.sendMessage(from, { 
            text: `✅ *Action Updated*\n\n` +
                  `⚡ New Action: ${actionType}\n` +
                  `📞 Calls will be ${actionType === 'ignore' ? 'logged only' : 'treated with ' + actionType}` 
        }, { quoted: msg });
    }

    // --- STATS ---
    if (action === 'stats') {
        const stats = botData.antiCall.stats[userId] || { 
            total: 0, 
            blocked: 0, 
            warned: 0, 
            kicked: 0,
            startTime: new Date().toISOString()
        };
        
        const totalCalls = stats.total || 0;
        const blocked = stats.blocked || 0;
        const warned = stats.warned || 0;
        const kicked = stats.kicked || 0;
        const ignored = totalCalls - (blocked + warned + kicked);

        return await sock.sendMessage(from, { 
            text: `📊 *Anti-Call Statistics*\n\n` +
                  `📞 Total Calls: ${totalCalls}\n` +
                  `🚫 Blocked: ${blocked}\n` +
                  `⚠️ Warnings: ${warned}\n` +
                  `👢 Kicked: ${kicked}\n` +
                  `📝 Ignored: ${ignored}\n` +
                  `📅 Started: ${new Date(stats.startTime).toLocaleString()}\n` +
                  `🛡️ Protection: ${botData.antiCall.enabled[userId] ? 'Active' : 'Inactive'}`
        }, { quoted: msg });
    }

    // --- LOGS ---
    if (action === 'log' || action === 'logs') {
        const logs = botData.antiCall.logs || [];
        const userLogs = logs.filter(log => log.userId === userId);
        
        if (userLogs.length === 0) {
            return await sock.sendMessage(from, { 
                text: "📝 No call logs found." 
            }, { quoted: msg });
        }

        let logText = `📝 *Call Logs* (Last 10)\n\n`;
        userLogs.slice(-10).reverse().forEach((log, index) => {
            logText += `${index + 1}. ${log.number}\n`;
            logText += `   ${log.action} | ${new Date(log.time).toLocaleString()}\n`;
        });

        return await sock.sendMessage(from, { text: logText }, { quoted: msg });
    }

    // --- CLEAR STATS ---
    if (action === 'clear' || action === 'reset') {
        botData.antiCall.stats[userId] = {
            total: 0,
            blocked: 0,
            warned: 0,
            kicked: 0,
            startTime: new Date().toISOString()
        };
        botData.antiCall.logs = (botData.antiCall.logs || []).filter(log => log.userId !== userId);
        saveBotData();

        return await sock.sendMessage(from, { 
            text: "🧹 *Statistics Cleared!*\n\n" +
                  "🔄 All call logs and stats have been reset." 
        }, { quoted: msg });
    }

    // --- AUTO BLOCK ---
    if (action === 'autoblock') {
        const mode = args[1]?.toLowerCase();
        if (!['on', 'off'].includes(mode)) {
            return await sock.sendMessage(from, { 
                text: "❌ Usage: .anticall autoblock [on/off]\n" +
                      "💡 Auto-block: Automatically block unknown numbers" 
            }, { quoted: msg });
        }

        botData.antiCall.autoBlock[userId] = mode === 'on';
        saveBotData();

        return await sock.sendMessage(from, { 
            text: `${mode === 'on' ? '✅' : '❌'} *Auto-Block ${mode === 'on' ? 'Enabled' : 'Disabled'}*\n\n` +
                  `${mode === 'on' ? '🔒 All unknown numbers will be auto-blocked' : '🔓 Auto-block deactivated'}` 
        }, { quoted: msg });
    }

    // --- DEFAULT ---
    return await sock.sendMessage(from, { 
        text: "❌ Invalid command!\n" +
              "📌 Use .anticall help for all commands" 
    }, { quoted: msg });
}

module.exports = anticallCommand;