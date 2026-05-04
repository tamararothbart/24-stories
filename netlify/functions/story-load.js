exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders() };
  }

  const storyId = (event.queryStringParameters || {}).id || '';
  if (!storyId) {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'Missing story ID' }) };
  }

  const BASE = 'apprTOobuxs4Od7XB';
  const PAT  = process.env.AIRTABLE_PAT;
  const hdrs = { 'Authorization': `Bearer ${PAT}` };

  const storyRes = await fetch(`https://api.airtable.com/v0/${BASE}/Stories/${storyId}`, { headers: hdrs });
  if (!storyRes.ok) {
    return { statusCode: 404, headers: corsHeaders(), body: JSON.stringify({ error: 'Story not found' }) };
  }

  const story = await storyRes.json();
  if (story.error) {
    return { statusCode: 404, headers: corsHeaders(), body: JSON.stringify({ error: 'Story not found' }) };
  }

  const subscriberIds = story.fields.SubscriberID || [];
  let subscriber = null;
  if (subscriberIds.length > 0) {
    const subRes = await fetch(`https://api.airtable.com/v0/${BASE}/Subscribers/${subscriberIds[0]}`, { headers: hdrs });
    if (subRes.ok) subscriber = await subRes.json();
  }

  const weekNum = story.fields.PromptNumber;
  let prompt = null;
  if (weekNum) {
    const pFormula = encodeURIComponent(`{Week}=${weekNum}`);
    const pRes = await fetch(`https://api.airtable.com/v0/${BASE}/Prompts?filterByFormula=${pFormula}&maxRecords=1`, { headers: hdrs });
    if (pRes.ok) {
      const pData = await pRes.json();
      if (pData.records && pData.records.length > 0) prompt = pData.records[0].fields;
    }
  }

  return {
    statusCode: 200,
    headers: corsHeaders(),
    body: JSON.stringify({ story, subscriber, prompt })
  };
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
}
