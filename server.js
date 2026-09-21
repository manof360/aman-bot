
import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'aman_2026_secure_token';
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

// قاعدة المعرفة - عدلها على حسب شغلك
import knowledgeBase from './knowledgeBase.js';

const HUMAN_KEYWORDS = ['موظف', 'شكوى', 'مدير', 'تواصل', 'بشري', 'human', 'agent'];

// 1. التحقق من الـ Webhook (لما Meta يفحص الرابط)
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verified');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// 2. استقبال الرسائل
app.post('/webhook', async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (message) {
      const from = message.from;
      const text = message.text?.body?.toLowerCase() || '';
      console.log(`📩 رسالة من ${from}: ${text}`);

      let reply = await generateReply(text);

      await sendWhatsAppMessage(from, reply);
    }
    res.sendStatus(200);
  } catch (error) {
    console.error('Error:', error);
    res.sendStatus(200);
  }
});

async function generateReply(text) {
  // تحويل لموظف
  if (HUMAN_KEYWORDS.some(k => text.includes(k))) {
    return `تم تحويلك للدعم البشري 👨‍💼\nسيتواصل معك أحد موظفينا قريباً.\n\nرقم التذكرة: #${Date.now().toString().slice(-6)}`;
  }

  // البحث في قاعدة المعرفة
  for (const item of knowledgeBase) {
    if (item.keywords.some(k => text.includes(k))) {
      return item.answer;
    }
  }

  // رد افتراضي ذكي كدعم فني
  return `أهلاً بك في أمان بوت! 👋\n\nأنا مساعدك الذكي للدعم الفني.\n\nأقدر أساعدك في:\n${knowledgeBase.map(k => '• ' + k.title).join('\n')}\n\nاكتب سؤالك بالتفصيل أو اكتب "موظف" للتواصل مع الدعم البشري.`;
}

async function sendWhatsAppMessage(to, text) {
  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
    console.log('⚠️ ضع التوكنات في ملف .env');
    return;
  }
  const url = `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`;
  await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: to,
      text: { body: text }
    })
  });
}

app.get('/', (req, res) => {
  res.send('✅ Aman Bot شغال - /webhook جاهز');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
