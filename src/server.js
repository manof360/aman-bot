import crypto from 'node:crypto';
import express from 'express';

const app = express();

app.use(express.json({
  limit: '1mb',
  verify: (req, _res, buf) => {
    req.rawBody = Buffer.from(buf);
  }
}));

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function verifyMetaSignature(req) {
  const signature = req.get('x-hub-signature-256');
  if (!signature || !req.rawBody) return false;

  const expected = 'sha256=' + crypto
    .createHmac('sha256', required('META_APP_SECRET'))
    .update(req.rawBody)
    .digest('hex');

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === required('VERIFY_TOKEN')) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

app.post('/webhook', (req, res) => {
  if (!verifyMetaSignature(req)) return res.sendStatus(401);

  const messages = (req.body?.entry || [])
    .flatMap(entry => entry.changes || [])
    .flatMap(change => change.value?.messages || []);

  for (const message of messages) {
    console.log(JSON.stringify({
      event: 'whatsapp_message_received',
      id: message.id,
      from: message.from,
      type: message.type
    }));
  }

  return res.sendStatus(200);
});

app.get('/connect/whatsapp', (_req, res) => {
  const appId = process.env.META_APP_ID;
  const configId = process.env.META_CONFIG_ID;
  const graphVersion = process.env.META_GRAPH_VERSION || 'v26.0';

  if (!appId || !configId) {
    return res.status(503).type('html').send('<h1>WhatsApp onboarding is not configured yet</h1><p>Set META_APP_ID and META_CONFIG_ID in Vercel.</p>');
  }

  res.type('html').send(`<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ربط واتساب - Aman Bot</title>
<style>
body{font-family:system-ui,sans-serif;max-width:760px;margin:60px auto;padding:24px;line-height:1.8}
button{font:inherit;padding:12px 20px;cursor:pointer}
pre{direction:ltr;text-align:left;white-space:pre-wrap;background:#f5f5f5;padding:14px;border-radius:8px}
</style>
</head>
<body>
<h1>ربط واتساب بـ Aman Bot</h1>
<p>استخدم تسجيل Meta المضمّن لربط حساب واتساب للأعمال ورقم الهاتف بالتطبيق.</p>
<button id="connect">ربط واتساب</button>
<pre id="result">جاهز.</pre>
<script>
window.fbAsyncInit = function () {
  FB.init({appId: ${JSON.stringify(appId)}, cookie: true, xfbml: false, version: ${JSON.stringify(graphVersion)}});
};
(function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0];if(d.getElementById(id))return;js=d.createElement(s);js.id=id;js.src='https://connect.facebook.net/en_US/sdk.js';fjs.parentNode.insertBefore(js,fjs);}(document,'script','facebook-jssdk'));

const out = document.getElementById('result');
window.addEventListener('message', (event) => {
  if (!['https://www.facebook.com','https://web.facebook.com'].includes(event.origin)) return;
  try {
    const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
    if (data?.type === 'WA_EMBEDDED_SIGNUP') {
      const safe = {
        event: data.event,
        waba_id: data.data?.waba_id || null,
        phone_number_id: data.data?.phone_number_id || null
      };
      out.textContent = JSON.stringify(safe, null, 2);
    }
  } catch {}
});

document.getElementById('connect').onclick = () => {
  FB.login((response) => {
    if (response.authResponse?.code) {
      out.textContent = 'تم التفويض بنجاح. تم استلام رمز مؤقت على الخادم/المتصفح؛ لا تشاركه في المحادثة.';
    } else {
      out.textContent = 'لم تكتمل عملية الربط.';
    }
  }, {
    config_id: ${JSON.stringify(configId)},
    response_type: 'code',
    override_default_response_type: true,
    extras: {setup: {}, featureType: 'whatsapp_business_app_onboarding', sessionInfoVersion: '3'}
  });
};
</script>
</body>
</html>`);
});

app.get('/health', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({
    status: 'ok',
    version: '4.1.0-onboarding',
    stage: 'embedded-signup-ready'
  });
});

app.get('/', (_req, res) => {
  res.json({
    name: 'Aman Bot',
    version: '4.1.0-onboarding',
    status: 'running',
    onboarding: '/connect/whatsapp'
  });
});

if (!process.env.VERCEL) {
  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => console.log(`Aman Bot V4 listening on ${port}`));
}

export default app;
