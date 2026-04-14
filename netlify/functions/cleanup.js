const SYSTEM_PROMPT = `You are a precise copy editor. Clean up the following text by fixing mechanical errors only — do not change the writer's words, voice, sentence structure, or meaning in any way.

Rules:
1. Paragraph breaks at natural pauses and topic shifts — not after every sentence.
2. Capitalisation — fix sentence starts and proper nouns (names, places). Fix obvious errors only.
3. Punctuation — add full stops, commas, semicolons, colons where clearly needed. Do not over-punctuate.
4. Filler word removal — remove: um, uh, ah, uhm, like (only when used as filler, not when meaning "similar to" or "such as"), you know, sort of, kind of. Do not remove if the word carries meaning.
5. Spelling — correct obvious errors. If a word is unclear or could be a proper noun, flag it with [unclear] rather than guessing.
6. Repetition — remove immediate word repetition caused by transcription errors (e.g. "and and then" → "and then"). Do not remove intentional repetition for emphasis.
7. Do not add words that were not spoken or written.
8. Do not summarise, shorten, or rewrite sentences. Only clean.
9. Preserve the storyteller's voice — colloquialisms, dialect, sentence rhythm. This is their story in their words.
10. Do not use markdown formatting — no hashtags, asterisks, or bullet points.
11. Direct speech — when the storyteller is clearly quoting someone or using direct speech language (e.g. after "I said", "she told me", "he asked", "we said", "they told us"), add a comma after the reporting verb and wrap the quoted words in double quotation marks with the first word capitalised. Example: "I said don't do it" → "I said, \"Don't do it.\""
Return only the cleaned text, nothing else.`;

export default async (req, context) => {
    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    let body;
    try {
        body = await req.json();
    } catch(e) {
        return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const text = (body.text || '').trim();
    if (!text) {
        return new Response(JSON.stringify({ error: 'No text provided' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    let claudeRes;
    try {
        claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 2048,
                stream: true,
                system: SYSTEM_PROMPT,
                messages: [{ role: 'user', content: text }]
            })
        });
    } catch(e) {
        return new Response(JSON.stringify({ error: 'Claude API request failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    if (!claudeRes.ok) {
        return new Response(JSON.stringify({ error: 'Claude API error: ' + claudeRes.status }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
        async start(controller) {
            const reader = claudeRes.body.getReader();
            let buffer = '';

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop(); // keep any incomplete line for next chunk

                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed.startsWith('data: ')) continue;
                        const data = trimmed.slice(6);
                        if (data === '[DONE]') continue;
                        try {
                            const parsed = JSON.parse(data);
                            if (
                                parsed.type === 'content_block_delta' &&
                                parsed.delta &&
                                parsed.delta.type === 'text_delta'
                            ) {
                                const token = parsed.delta.text;
                                controller.enqueue(encoder.encode('data: ' + JSON.stringify({ token }) + '\n\n'));
                            }
                        } catch(e) {
                            // skip malformed SSE events
                        }
                    }
                }
            } catch(e) {
                controller.enqueue(encoder.encode('data: ' + JSON.stringify({ error: e.message }) + '\n\n'));
            } finally {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                controller.close();
            }
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no'
        }
    });
};
