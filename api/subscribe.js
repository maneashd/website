export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  let parsedBody = {};
  try {
    parsedBody = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  } catch {
    return res.status(400).json({ success: false, message: 'Invalid request format' });
  }
  const { email, phone, city, source } = parsedBody;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email' });
  }

  const isUpdate = source === 'thank-you-phone' || source === 'confirmed-phone';

  if (isUpdate && !phone) {
    return res.status(400).json({ success: false, message: 'Phone required for update' });
  }

  const apiKey = (process.env.BREVO_API_KEY || '').trim();
  if (!apiKey) {
    console.error('[subscribe] BREVO_API_KEY is not set in this environment');
    return res.status(500).json({ success: false, message: 'Something went wrong, please try again.', code: 'missing_api_key' });
  }

  // Defaults to the "CLVCH VIP List" (id 4) if BREVO_LIST_ID is missing or not a number
  const listId = parseInt((process.env.BREVO_LIST_ID || '').trim(), 10);
  const listIds = [Number.isFinite(listId) && listId > 0 ? listId : 4];
  const attributes = {};
  if (phone)  attributes.SMS    = phone;
  if (city)   attributes.CITY   = city;
  if (source) attributes.SOURCE = source;

  let brevoRes;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    if (isUpdate) {
      brevoRes = await fetch(
        `https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`,
        {
          method: 'PUT',
          headers: {
            'api-key':      apiKey,
            'content-type': 'application/json',
            'accept':       'application/json',
          },
          body: JSON.stringify({ attributes, listIds }),
          signal: controller.signal,
        }
      );

      if (brevoRes.status === 404) {
        brevoRes = await fetch('https://api.brevo.com/v3/contacts', {
          method: 'POST',
          headers: {
            'api-key':      apiKey,
            'content-type': 'application/json',
            'accept':       'application/json',
          },
          body: JSON.stringify({ email, attributes, listIds, updateEnabled: true }),
          signal: controller.signal,
        });
      }
    } else {
      brevoRes = await fetch('https://api.brevo.com/v3/contacts', {
        method: 'POST',
        headers: {
          'api-key':      apiKey,
          'content-type': 'application/json',
          'accept':       'application/json',
        },
        body: JSON.stringify({ email, attributes, listIds, updateEnabled: true }),
        signal: controller.signal,
      });
    }

    clearTimeout(timeoutId);
  } catch (err) {
    console.error('[subscribe] network error calling Brevo:', err.message);
    return res.status(500).json({ success: false, message: 'Something went wrong, please try again.' });
  }

  if (brevoRes.ok || brevoRes.status === 201) {
    return res.status(200).json({ success: true });
  }

  let brevoErrorBody;
  try { brevoErrorBody = await brevoRes.json(); } catch { brevoErrorBody = {}; }

  if (brevoErrorBody.code === 'duplicate_parameter') {
    const msg = (brevoErrorBody.message || '').toLowerCase();
    if (msg.includes('sms') || msg.includes('phone')) {
      return res.status(400).json({ success: false, message: 'This phone is already on the list under another email.' });
    }
    return res.status(200).json({ success: true });
  }

  // Brevo rejected the phone number: still get the email onto the list
  const errMsg = (brevoErrorBody.message || '').toLowerCase();
  if (!isUpdate && attributes.SMS && (errMsg.includes('sms') || errMsg.includes('phone'))) {
    console.error('[subscribe] Brevo rejected phone, retrying without it:', brevoErrorBody);
    delete attributes.SMS;
    try {
      const retry = await fetch('https://api.brevo.com/v3/contacts', {
        method: 'POST',
        headers: { 'api-key': apiKey, 'content-type': 'application/json', 'accept': 'application/json' },
        body: JSON.stringify({ email, attributes, listIds, updateEnabled: true }),
        signal: AbortSignal.timeout(10000),
      });
      if (retry.ok) return res.status(200).json({ success: true });
      let retryBody;
      try { retryBody = await retry.json(); } catch { retryBody = {}; }
      console.error('[subscribe] Brevo retry error:', retry.status, retryBody);
    } catch (err) {
      console.error('[subscribe] network error on retry:', err.message);
    }
  }

  console.error('[subscribe] Brevo error:', brevoRes.status, brevoErrorBody);
  // `code` is Brevo's error code (e.g. "unauthorized") — visible in the browser's network tab for debugging
  return res.status(500).json({ success: false, message: 'Something went wrong, please try again.', code: brevoErrorBody.code || `brevo_${brevoRes.status}` });
}
