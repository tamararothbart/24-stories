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

    var text = (body.text || '').trim();
    if (!text) {
        return { statusCode: 400, body: JSON.stringify({ error: 'No text provided' }) };
    }

    var response = await fetch('https://api.anthropic.com/v1/messages', {
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
                content: 'You are a precise copy editor. Clean up the following text by fixing mechanical errors only — do not change the writer\'s words, voice, sentence structure, or meaning in any way. Fix the following: correct spelling mistakes; fix apostrophes (its/it\'s, they\'re/their/there, we\'re/were, you\'re/your, who\'s/whose, etc.); fix possessives; add quotation marks around direct speech where clearly intended; correct capitalisation at sentence starts and for proper nouns; fix punctuation (commas, full stops, question marks); remove filler words (um, uh, like, you know, sort of); break into paragraphs where there is a natural pause or topic shift. Do not rewrite sentences. Do not add words. Do not embellish. Do not use markdown formatting — no hashtags, asterisks, or bullet points. Always return the cleaned text no matter how short. Return only the cleaned text, nothing else.\n\n' + text
            }]
        })
    });

    if (!response.ok) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Claude API error' }) };
    }

    var data = await response.json();
    var cleaned = data.content && data.content[0] && data.content[0].text;

    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cleaned: cleaned || text })
    };
};
