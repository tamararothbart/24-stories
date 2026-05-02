exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders() };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders(), body: 'Method not allowed' };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { subscriberId, weekNumber, storyText, audioURL, imageURL, caption, weekTheme, submittedAt } = payload;

  if (!subscriberId || !weekNumber || !storyText) {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'subscriberId, weekNumber and storyText required' }) };
  }

  const BASE = 'apprTOobuxs4Od7XB';
  const PAT  = process.env.AIRTABLE_PAT;

  // Check if a story record already exists for this subscriber + week
  const formula = encodeURIComponent(
    `AND(FIND("${subscriberId}",ARRAYJOIN({SubscriberID})),{PromptNumber}=${weekNumber})`
  );
  const searchRes = await fetch(
    `https://api.airtable.com/v0/${BASE}/Stories?filterByFormula=${formula}&maxRecords=1`,
    { headers: { 'Authorization': `Bearer ${PAT}` } }
  );

  if (!searchRes.ok) {
    console.error('Airtable search error:', await searchRes.text());
    return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: 'Lookup failed' }) };
  }

  const existing = await searchRes.json();
  const fields = {
    SubscriberID:      [subscriberId],   // linked record array
    PromptNumber:      parseInt(weekNumber, 10),
    StoryText:         storyText,
    AudioURL:          audioURL   || '',
    StoryImageURL:     imageURL   || '',
    StoryImageCaption: caption    || '',
    WeekTheme:         weekTheme  || '',
    SubmissionDate:    submittedAt ? submittedAt.slice(0, 10) : new Date().toISOString().slice(0, 10)
  };

  // Remove empty string fields to keep Airtable clean
  Object.keys(fields).forEach(k => { if (fields[k] === '') delete fields[k]; });

  let airtableRes;
  if (existing.records && existing.records.length > 0) {
    // Update existing record
    const recId = existing.records[0].id;
    airtableRes = await fetch(
      `https://api.airtable.com/v0/${BASE}/Stories/${recId}`,
      {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
      }
    );
  } else {
    // Create new record
    airtableRes = await fetch(
      `https://api.airtable.com/v0/${BASE}/Stories`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
      }
    );
  }

  if (!airtableRes.ok) {
    const err = await airtableRes.text();
    console.error('Airtable write error:', err);
    return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: 'Story save failed' }) };
  }

  return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify({ success: true }) };
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };
}
