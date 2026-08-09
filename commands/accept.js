async function acceptCommand(sock, from, msg, isAdmin) {
    if (!from.endsWith('@g.us')) {
        return sock.sendMessage(from, { text: '❌ This command can only be used in groups.' }, { quoted: msg });
    }

    if (!isAdmin) {
        return sock.sendMessage(from, { text: '❌ Only group admins can use this command.' }, { quoted: msg });
    }

    try {
        // Fetch pending join requests
        const response = await sock.groupRequestParticipantsList(from);
        
        if (!response || response.length === 0) {
            return sock.sendMessage(from, { text: '✅ No pending join requests found in this group.' }, { quoted: msg });
        }

        await sock.sendMessage(from, { 
            text: `⚡ Found *${response.length}* requests. Accepting fast...` 
        }, { quoted: msg });

        let acceptedCount = 0;
        let failedCount = 0;
        const startTime = Date.now();

        // Process in parallel batches for maximum speed
        const batchSize = 5; // Process 5 at a time
        const batches = [];
        
        for (let i = 0; i < response.length; i += batchSize) {
            batches.push(response.slice(i, i + batchSize));
        }

        for (const batch of batches) {
            const promises = batch.map(async (participant) => {
                try {
                    await sock.groupRequestParticipantsUpdate(from, [participant.jid], 'approve');
                    return { success: true, jid: participant.jid };
                } catch (err) {
                    console.error(`Failed to accept ${participant.jid}:`, err.message);
                    return { success: false, jid: participant.jid };
                }
            });

            const results = await Promise.all(promises);
            
            for (const result of results) {
                if (result.success) {
                    acceptedCount++;
                } else {
                    failedCount++;
                }
            }

            // Show progress every batch
            const processed = Math.min((batches.indexOf(batch) + 1) * batchSize, response.length);
            if (processed % 10 === 0 || processed === response.length) {
                await sock.sendMessage(from, { 
                    text: `📈 ${processed}/${response.length} done` 
                }, { quoted: msg });
            }
        }

        const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
        
        let finalMessage = `✅ *Accept Complete*\n\n` +
                          `✅ Accepted: ${acceptedCount}\n` +
                          `❌ Failed: ${failedCount}\n` +
                          `⚡ Time: ${totalTime}s\n` +
                          `🚀 Speed: ${Math.round(acceptedCount / totalTime)}/s`;

        await sock.sendMessage(from, { text: finalMessage }, { quoted: msg });

    } catch (e) {
        console.error('Accept command error:', e);
        await sock.sendMessage(from, { text: '❌ Error: ' + e.message }, { quoted: msg });
    }
}

module.exports = acceptCommand;