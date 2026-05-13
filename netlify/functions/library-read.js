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
  const promptsSort = 'sort%5B0%5D%5Bfield%5D=Week&sort%5B0%5D%5Bdirection%5D=asc';

  // Fetch subscriber and prompts in parallel
  const [subRes, promptsRes] = await Promise.all([
    fetch(`https://api.airtable.com/v0/${BASE}/Subscribers/${subscriberId}`, { headers: hdrs }),
    fetch(`https://api.airtable.com/v0/${BASE}/Prompts?${promptsSort}&maxRecords=26`, { headers: hdrs })
  ]);

  if (!subRes.ok) {
    return { statusCode: 404, headers: corsHeaders(), body: JSON.stringify({ error: 'Subscriber not found' }) };
  }

  const [sub, prompts] = await Promise.all([subRes.json(), promptsRes.json()]);

  if (sub.error) {
    return { statusCode: 404, headers: corsHeaders(), body: JSON.stringify({ error: 'Subscriber not found' }) };
  }

  // Use the linked story record IDs already present on the subscriber record.
  // ARRAYJOIN({SubscriberID}) in Airtable formulas returns display values, not record IDs,
  // so we query stories by RECORD_ID() instead.
  const linkedStoryIds = sub.fields.Stories || [];
  let stories = { records: [] };

  if (linkedStoryIds.length > 0) {
    const orParts = linkedStoryIds.map(id => `RECORD_ID()="${id}"`).join(',');
    const formula = encodeURIComponent(`OR(${orParts})`);
    const storiesRes = await fetch(
      `https://api.airtable.com/v0/${BASE}/Stories?filterByFormula=${formula}&maxRecords=26`,
      { headers: hdrs }
    );
    if (storiesRes.ok) {
      stories = await storiesRes.json();
    }
  }

  const accessLevel = computeAccessLevel(sub.fields);

  return {
    statusCode: 200,
    headers: corsHeaders(),
    body: JSON.stringify({ subscriber: sub, stories, prompts, access_level: accessLevel })
  };
};

function computeAccessLevel(fields) {
  const status = (fields.Status || '').trim();
  const today  = new Date().toISOString().slice(0, 10);

  if (status === 'Active') {
    const accessEndDate = fields.AccessEndDate || '';
    // No AccessEndDate = monthly subscriber with active recurring billing
    if (!accessEndDate || accessEndDate > today) return 'full';
    // Past AccessEndDate (lump sum expired or edge case)
    return 'read_only';
  }

  if (status === 'Cancelled' || status === 'Complete') {
    return 'read_only';
  }

  // Pending or unknown — no library access yet
  return 'none';
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
}
