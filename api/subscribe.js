export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { email, phone, city, source } = req.body || {};

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email' });
  }

  const isUpdate = source === 'thank-you-phone' || source === 'confirmed-phone';

  if (isUpdate && !phone) {
    return res.status(400).json({ success: false, message: 'Phone required for update' });
  }

  const listIds = [parseInt(process.env.BREVO_LIST_ID, 10)];
  const attributes = {
    SMS:    phone  || '',
    CITY:   city   || '',
    SOURCE: source || '',
  };

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
            'api-key':      process.env.BREVO_API_KEY,
            'content-type': 'application/json',
            'accept':       'application/json',
          },
          body: JSON.stringify({ attributes, listIds }),
          signal: controller.signal,
        }
      );

      // Contact doesn't exist yet — fall back to POST create
      if (brevoRes.status === 404) {
        brevoRes = await fetch('https://api.brevo.com/v3/contacts', {
          method: 'POST',
          headers: {
            'api-key':      process.env.BREVO_API_KEY,
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
          'api-key':      process.env.BREVO_API_KEY,
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

  let body;
  try { body = await brevoRes.json(); } catch { body = {}; }

  if (body.code === 'duplicate_parameter') {
    return res.status(200).json({ success: true });
  }

  console.error('[subscribe] Brevo error:', brevoRes.status, body);
  return res.status(500).json({ success: false, message: 'Something went wrong, please try again.' });
}
