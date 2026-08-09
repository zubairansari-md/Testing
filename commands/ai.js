async function aiCommand(sock, from, msg, isAdmin, session, args) {
    if (!isAdmin) return await sock.sendMessage(from, { 
        text: "❌ Only admins can use this command." 
    }, { quoted: msg });
    
    const action = args[0]?.toLowerCase();
    
    // --- HELP MENU ---
    if (action === 'help' || action === '-h' || !args.length) {
        return await sock.sendMessage(from, { 
            text: `🤖 *AI Command Help*\n\n` +
                  `*Commands:*\n` +
                  `.ai on              - Enable AI Auto-Reply\n` +
                  `.ai off             - Disable AI Auto-Reply\n` +
                  `.ai status          - Check AI status\n` +
                  `.ai [question]      - Ask AI directly\n` +
                  `.ai clear           - Clear chat history\n` +
                  `.ai stats           - Show AI usage stats\n` +
                  `.ai model [name]    - Switch AI model\n` +
                  `.ai temp [0-2]      - Set creativity level\n\n` +
                  `*Examples:*\n` +
                  `.ai What is JavaScript?\n` +
                  `.ai on\n` +
                  `.ai model gpt-4\n` +
                  `.ai temp 0.7`
        }, { quoted: msg });
    }

    // --- TOGGLE AI ON/OFF ---
    if (action === 'on') {
        session.aiEnabled = true;
        session.aiHistory = session.aiHistory || {};
        return await sock.sendMessage(from, { 
            text: "✅ *AI Auto-Reply Enabled!*\n\n" +
                  "🤖 I'll now reply to all messages automatically." 
        }, { quoted: msg });
    }
    
    if (action === 'off') {
        session.aiEnabled = false;
        return await sock.sendMessage(from, { 
            text: "❌ *AI Auto-Reply Disabled!*\n\n" +
                  "💤 I'll stop auto-replying to messages." 
        }, { quoted: msg });
    }

    // --- STATUS CHECK ---
    if (action === 'status') {
        const status = session.aiEnabled ? '✅ Enabled' : '❌ Disabled';
        const model = session.aiModel || 'Default';
        const temp = session.aiTemperature || 0.7;
        const historyCount = Object.keys(session.aiHistory || {}).length;
        
        return await sock.sendMessage(from, { 
            text: `📊 *AI Status*\n\n` +
                  `🔹 Status: ${status}\n` +
                  `🔹 Model: ${model}\n` +
                  `🔹 Temperature: ${temp}\n` +
                  `🔹 Chat History: ${historyCount} conversations\n` +
                  `🔹 Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
        }, { quoted: msg });
    }

    // --- CLEAR HISTORY ---
    if (action === 'clear') {
        if (session.aiHistory) {
            delete session.aiHistory[from];
        }
        return await sock.sendMessage(from, { 
            text: "🧹 *Chat History Cleared!*\n\n" +
                  "🗑️ All previous conversations deleted." 
        }, { quoted: msg });
    }

    // --- STATS ---
    if (action === 'stats') {
        const history = session.aiHistory?.[from] || [];
        const totalQueries = history.length;
        const avgResponseTime = session.aiAvgTime || 0;
        
        return await sock.sendMessage(from, { 
            text: `📈 *AI Usage Stats*\n\n` +
                  `📝 Total Queries: ${totalQueries}\n` +
                  `⚡ Avg Response: ${avgResponseTime.toFixed(2)}s\n` +
                  `📊 Success Rate: ${session.aiSuccessRate || 100}%\n` +
                  `🔄 Session: ${session.aiEnabled ? 'Active' : 'Inactive'}`
        }, { quoted: msg });
    }

    // --- SWITCH MODEL ---
    if (action === 'model') {
        const modelName = args[1];
        if (!modelName) {
            return await sock.sendMessage(from, { 
                text: "❌ Please specify a model name.\n" +
                      "📌 Available: gpt-4, gpt-3.5-turbo, claude, bard" 
            }, { quoted: msg });
        }
        session.aiModel = modelName;
        return await sock.sendMessage(from, { 
            text: `🔄 *AI Model Changed*\n\n` +
                  `🤖 New Model: ${modelName}` 
        }, { quoted: msg });
    }

    // --- SET TEMPERATURE ---
    if (action === 'temp') {
        const temp = parseFloat(args[1]);
        if (isNaN(temp) || temp < 0 || temp > 2) {
            return await sock.sendMessage(from, { 
                text: "❌ Invalid temperature! Use 0-2.\n" +
                      "💡 0 = Focused, 1 = Balanced, 2 = Creative" 
            }, { quoted: msg });
        }
        session.aiTemperature = temp;
        return await sock.sendMessage(from, { 
            text: `🌡️ *Temperature Set*\n\n` +
                  `🎯 Level: ${temp}\n` +
                  `💡 ${temp < 0.5 ? 'Focused mode' : temp < 1.5 ? 'Balanced mode' : 'Creative mode'}` 
        }, { quoted: msg });
    }

    // --- DIRECT QUERY (with speed optimization) ---
    if (args.length > 0) {
        const query = args.join(' ');
        const startTime = Date.now();
        
        try {
            // Send typing indicator (fast)
            await sock.sendPresenceUpdate('composing', from);
            
            // React quickly
            await sock.sendMessage(from, { react: { text: '🤖', key: msg.key } });
            
            // Get AI response with caching
            const cacheKey = query.toLowerCase().trim();
            const cachedResponse = session.aiCache?.[cacheKey];
            
            let response;
            if (cachedResponse && (Date.now() - cachedResponse.timestamp < 3600000)) {
                // Use cached response (1 hour cache)
                response = cachedResponse.text;
                await sock.sendMessage(from, { react: { text: '⚡', key: msg.key } });
            } else {
                // Get fresh response
                response = await session.getAIResponse(from, query);
                
                // Cache the response
                if (!session.aiCache) session.aiCache = {};
                session.aiCache[cacheKey] = {
                    text: response,
                    timestamp: Date.now()
                };
            }
            
            const responseTime = ((Date.now() - startTime) / 1000).toFixed(1);
            
            // Update stats
            session.aiAvgTime = session.aiAvgTime || 0;
            session.aiAvgTime = (session.aiAvgTime + parseFloat(responseTime)) / 2;
            
            // Smart response formatting
            const isLongResponse = response.length > 1000;
            const formattedResponse = isLongResponse ? 
                response : 
                `🤖 *AI Response*\n\n${response}\n\n⏱️ ${responseTime}s`;
            
            await sock.sendMessage(from, { 
                text: formattedResponse,
                contextInfo: {
                    forwardingScore: 0,
                    isForwarded: false
                }
            }, { quoted: msg });
            
            // Remove typing indicator
            await sock.sendPresenceUpdate('paused', from);
            
        } catch (e) {
            console.error('AI Error:', e);
            await sock.sendMessage(from, { 
                text: `❌ *AI Error*\n\n` +
                      `Error: ${e.message}\n` +
                      `💡 Try again or use .ai help` 
            }, { quoted: msg });
        }
    }
}

// --- HELPER FUNCTIONS ---
async function getAIResponse(session, from, query) {
    // Fast response with timeout
    const timeout = 30000; // 30 seconds
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), timeout);
    });
    
    const responsePromise = session.getAIResponse(from, query);
    return await Promise.race([responsePromise, timeoutPromise]);
}

module.exports = aiCommand;