exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders() };
  }

  const subscriberId = (event.queryStringParameters || {}).id || '';
  if (!subscriberId) {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'Missing subscriber ID' }) };
  }

  const BASE = 'apprTOobuxs4Od7XB';
  const PAT  = process.env.AIRTABLE_PAT;
  const hdrs = { 'Authorization': `Bearer ${PAT}` };

  const storiesFormula = encodeURIComponent(`FIND("${subscriberId}",{SubscriberRecordID})`);
  const promptsSort    = 'sort%5B0%5D%5Bfield%5D=Week&sort%5B0%5D%5Bdirection%5D=asc';

  const [subRes, storiesRes, promptsRes] = await Promise.all([
    fetch(`https://api.airtable.com/v0/${BASE}/Subscribers/${subscriberId}`, { headers: hdrs }),
    fetch(`https://api.airtable.com/v0/${BASE}/Stories?filterByFormula=${storiesFormula}&maxRecords=26`, { headers: hdrs }),
    fetch(`https://api.airtable.com/v0/${BASE}/Prompts?${promptsSort}&maxRecords=26`, { headers: hdrs })
  ]);

  if (!subRes.ok) {
    return { statusCode: 404, headers: corsHeaders(), body: JSON.stringify({ error: 'Subscriber not found' }) };
  }

  const [sub, stories, prompts] = await Promise.all([
    subRes.json(), storiesRes.json(), promptsRes.json()
  ]);

  if (sub.error) {
    return { statusCode: 404, headers: corsHeaders(), body: JSON.stringify({ error: 'Subscriber not found' }) };
  }

  return {
    statusCode: 200,
    headers: corsHeaders(),
    body: JSON.stringify({ subscriber: sub, stories, prompts })
  };
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
}
