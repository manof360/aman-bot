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

  // Acknowledge Meta immediately. Reply sending is added only after inbound delivery is proven.
  return res.sendStatus(200);
});

app.get('/health', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({
    status: 'ok',
    version: '4.0.0-webhook',
    stage: 'inbound-webhook'
  });
});

app.get('/', (_req, res) => {
  res.json({
    name: 'Aman Bot',
    version: '4.0.0-webhook',
    status: 'running'
  });
});

if (!process.env.VERCEL) {
  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => console.log(`Aman Bot V4 listening on ${port}`));
}

export default app;
