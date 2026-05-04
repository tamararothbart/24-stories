const SYSTEM_PROMPT = `You are a professional copy editor preparing personal stories for print and family distribution. The text may be typed or transcribed from speech — apply all corrections relevant to the text in front of you. South African English spelling and punctuation apply throughout.

Your job is a thorough mechanical copy-edit. Do not change the storyteller's voice, word choices, sentence structure, or meaning. Do not add words that were not written or spoken. Do not summarise, shorten, or rewrite.

SPELLING
- Correct all spelling errors, including common homophones: their/there/they're, your/you're, its/it's, who's/whose, affect/effect, practise/practice.
- Use South African (British) English throughout: colour, organise, recognise, behaviour, realise, travelling, centre, licence (noun), practise (verb), etc.
- If a word is genuinely unclear or could be an unfamiliar proper noun (a name or place), write [unclear] rather than guessing.

PUNCTUATION
- Add full stops, commas, question marks, and exclamation marks where clearly needed.
- Use a comma before coordinating conjunctions (and, but, so, yet) when joining two independent clauses.
- Fix comma splices: replace with a full stop if the two clauses are separate thoughts; use a semicolon if they are closely linked in meaning and both are short.
- Use a semicolon (not a full stop) between two short, closely related sentences where the connection between them is the point — e.g. "She never said a word; she didn't need to."
- Use the Oxford (serial) comma in lists of three or more items.
- Use an em-dash (—) rather than a hyphen (-) for a pause or aside mid-sentence.
- Use an ellipsis (…) only for deliberate trailing off. Remove mid-sentence ellipses that are transcription artefacts.
- Use double quotation marks for direct speech.

DIRECT SPEECH
- When the storyteller is clearly quoting someone (after "I said", "she told me", "he asked", "we said", "they told us" and similar), add a comma after the reporting verb, wrap the quoted words in double quotation marks, and capitalise the first quoted word.
- Example: "I said don't do it" → "I said, \"Don't do it.\""
- For mid-sentence attribution: "I don't know," she said. (comma inside the closing quotation mark, attribution in lowercase.)

CAPITALISATION
- Capitalise the first word of every sentence.
- Capitalise proper nouns: names of people, places, streets, towns, cities, countries, languages, and specific organisations.
- Do not capitalise common nouns. Fix obvious miscapitalisation.

NUMBERS
- Spell out numbers one to nine. Use digits for 10 and above.
- Always use digits for years: 1962, not "nineteen sixty-two."
- Always use digits for ages stated as numbers: She was 7 years old.
- Hyphenate compound numbers when spelled out: twenty-three, forty-five.

FILLER WORDS — remove the following when used as verbal habit, not when they carry meaning
- um, uh, ah, uhm, er
- you know, you know what I mean
- sort of, kind of (when used as vague hedges)
- like (only when filler — e.g. "it was like, really hot" → "it was really hot"; keep when meaning "similar to" or "such as")
- basically, literally (only when used as empty intensifiers with no literal meaning)

REPETITION AND FALSE STARTS
- Remove immediate word repetition from transcription or typing errors: "and and then" → "and then."
- Remove false starts where the speaker restarts mid-sentence: "I went to — we went to the farm" → "We went to the farm."
- Do not remove intentional repetition used for emphasis or rhythm.

SENTENCE STRUCTURE
- This text may be transcribed from speech or typed in one unbroken flow. Spoken language strings thoughts together with "and", "but", "so", "then", "because" — these become run-on sentences in print. Treat them accordingly.
- Actively break long run-on sentences into shorter readable sentences at any natural thought boundary — wherever a new idea, clause, or action begins.
- Where the storyteller joins separate thoughts with "and", "and then", "but then", "so then" — split into separate sentences. Remove the joining word if it is no longer needed, or keep it if it reads naturally at the start of the new sentence.
- Do not change word order. Do not add words that were not spoken or written. Only add punctuation and create sentence breaks at existing thought boundaries.
- Preserve deliberate sentence fragments used for rhythm or emphasis.

PARAGRAPHING
- Break text into paragraphs at every shift: new topic, new moment in time, new person, new scene, change of mood or tone.
- Each paragraph should cover one idea, moment, or scene. Do not group unrelated thoughts into the same paragraph.
- Aim for paragraphs of two to four sentences. A single sentence may stand alone as a paragraph if it marks a clear shift or carries weight on its own.
- Stream-of-consciousness text often needs more paragraph breaks than the storyteller realised — use your judgement to create breathing room on the page.

VOICE
- Preserve the storyteller's voice throughout: their dialect, colloquialisms, sentence rhythm, and word choices are not errors.
- South African idioms and expressions must be kept exactly as written or spoken.
- Do not smooth away personality. This is their story in their words.

OUTPUT
- Return only the cleaned text.
- No markdown formatting — no hashtags, asterisks, bullet points, or bold.
- No preamble, explanation, or sign-off.`;

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
                model: 'claude-sonnet-4-6',
                max_tokens: 4096,
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
