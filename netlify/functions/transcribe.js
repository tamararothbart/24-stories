const https = require('https');
const { URL } = require('url');

function whisperUpload(audioBuffer, filename, mimeType, apiKey) {
    return new Promise(function(resolve, reject) {
        var boundary = '----FormBoundary' + Math.random().toString(36).slice(2);

        var prelude = Buffer.from(
            '--' + boundary + '\r\n' +
            'Content-Disposition: form-data; name="model"\r\n\r\n' +
            'whisper-1\r\n' +
            '--' + boundary + '\r\n' +
            'Content-Disposition: form-data; name="language"\r\n\r\n' +
            'en\r\n' +
            '--' + boundary + '\r\n' +
            'Content-Disposition: form-data; name="file"; filename="' + filename + '"\r\n' +
            'Content-Type: ' + mimeType + '\r\n\r\n',
            'utf8'
        );
        var epilogue = Buffer.from('\r\n--' + boundary + '--\r\n', 'utf8');
        var body = Buffer.concat([prelude, audioBuffer, epilogue]);

        var options = {
            hostname: 'api.openai.com',
            path: '/v1/audio/transcriptions',
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + apiKey,
                'Content-Type': 'multipart/form-data; boundary=' + boundary,
                'Content-Length': body.length
            }
        };

        var chunks = [];
        var req = https.request(options, function(res) {
            res.on('data', function(c) { chunks.push(c); });
            res.on('end', function() {
                try {
                    var parsed = JSON.parse(Buffer.concat(chunks).toString());
                    resolve({ status: res.statusCode, data: parsed });
                } catch(e) {
                    reject(new Error('Failed to parse Whisper response'));
                }
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

exports.handler = async function(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method not allowed' };
    }

    var body;
    try {
        body = JSON.parse(event.body);
    } catch(e) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
    }

    var audioUrl = body.audioUrl;
    if (!audioUrl) {
        return { statusCode: 400, body: JSON.stringify({ error: 'No audio URL provided' }) };
    }

    console.log('Step 1: audioUrl:', audioUrl);

    // Fetch audio from Cloudinary using fetch (handles redirects)
    var audioBuffer;
    try {
        var audioRes = await fetch(audioUrl);
        if (!audioRes.ok) throw new Error('HTTP ' + audioRes.status);
        var arrayBuf = await audioRes.arrayBuffer();
        audioBuffer = Buffer.from(arrayBuf);
        console.log('Step 2: fetched audio bytes:', audioBuffer.length);
    } catch(e) {
        console.error('Step 2 FAILED:', e.message);
        return { statusCode: 500, body: JSON.stringify({ error: 'Could not fetch audio: ' + e.message }) };
    }

    var ext      = audioUrl.includes('.mp4') ? 'mp4' : 'webm';
    var mimeType = ext === 'mp4' ? 'audio/mp4' : 'audio/webm';

    // Send to Whisper
    var whisperResult;
    try {
        whisperResult = await whisperUpload(audioBuffer, 'story.' + ext, mimeType, process.env.OPENAI_API_KEY);
        console.log('Step 3: Whisper status:', whisperResult.status, 'response:', JSON.stringify(whisperResult.data));
    } catch(e) {
        console.error('Step 3 FAILED:', e.message);
        return { statusCode: 500, body: JSON.stringify({ error: 'Whisper request failed: ' + e.message }) };
    }

    if (whisperResult.status !== 200 || !whisperResult.data.text) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Whisper error: ' + JSON.stringify(whisperResult.data) }) };
    }

    var transcript = whisperResult.data.text;
    console.log('Step 4: transcript:', transcript.substring(0, 100));

    // Clean with Claude
    try {
        var claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 2048,
                messages: [{
                    role: 'user',
                    content: 'You are a precise copy editor. Clean up the following spoken story transcript by fixing mechanical errors only — do not change the speaker\'s words, voice, sentence structure, or meaning in any way. Fix the following: correct obvious speech-to-text errors and spelling mistakes; fix apostrophes (its/it\'s, they\'re/their/there, we\'re/were, you\'re/your, who\'s/whose, etc.); fix possessives; add quotation marks around direct speech where clearly intended; correct capitalisation at sentence starts and for proper nouns; fix punctuation (commas, full stops, question marks); remove filler words (um, uh, like, you know, sort of); break into paragraphs where there is a natural pause or topic shift. Do not rewrite sentences. Do not add words. Do not embellish. Do not use markdown formatting — no hashtags, asterisks, or bullet points. Always return the cleaned text no matter how short. Return only the cleaned text, nothing else.\n\n' + transcript
                }]
            })
        });
        var claudeData = await claudeRes.json();
        var cleaned = claudeData.content && claudeData.content[0] && claudeData.content[0].text;
        console.log('Step 5: cleaned text length:', cleaned ? cleaned.length : 0);
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cleaned: cleaned || transcript })
        };
    } catch(e) {
        console.error('Step 5 FAILED:', e.message);
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cleaned: transcript })
        };
    }
};
