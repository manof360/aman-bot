
import express from 'express';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import knowledgeBase from './knowledgeBase.js';

dotenv.config();

const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'aman_2026_secure_token';
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// إعداد عقل البوت - Groq
const groq = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;

const HUMAN_KEYWORDS = ['موظف', 'شكوى', 'شكوي', 'مدير', 'تواصل', 'بشري', 'human', 'agent', 'support', 'help me'];

const conversations = new Map(); // ذاكرة مؤقتة للسياق

// 1. التحقق من الـ Webhook
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Webhook verification failed');
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

    if (message && message.type === 'text') {
      const from = message.from;
      const text = message.text?.body || '';
      console.log(`📩 من ${from}: ${text}`);

      const reply = await generateSmartReply(text, from);
      await sendWhatsAppMessage(from, reply);
    }
    res.sendStatus(200);
  } catch (error) {
    console.error('❌ Error:', error);
    res.sendStatus(200);
  }
});

async function generateSmartReply(text, userId) {
  const lowerText = text.toLowerCase();

  // تحويل للموظف البشري
  if (HUMAN_KEYWORDS.some(k => lowerText.includes(k))) {
    conversations.delete(userId); // مسح السياق
    return `تم تحويلك للدعم البشري 👨‍💼\n\nسيتواصل معك أحد موظفينا في أقرب وقت.\n\n🎫 رقم التذكرة: #${Date.now().toString().slice(-6)}\n📧 linkfamily27@gmail.com`;
  }

  // البحث السريع في قاعدة المعرفة (بدون استهلاك AI)
  for (const item of knowledgeBase) {
    if (item.keywords.some(k => lowerText.includes(k.toLowerCase()))) {
      console.log(`⚡ رد سريع من قاعدة المعرفة: ${item.title}`);
      return item.answer;
    }
  }

  // إذا فيه عقل اصطناعي - اسأله
  if (groq) {
    try {
      // جلب سياق المحادثة السابق
      const history = conversations.get(userId) || [];
      history.push({ role: "user", content: text });

      // الاحتفاظ بآخر 6 رسائل فقط للسياق
      if (history.length > 6) history.splice(0, history.length - 6);

      const completion = await groq.chat.completions.create({
        model: "llama-3.1-70b-versatile", // أذكى نموذج مجاني
        messages: [
          {
            role: "system",
            content: `أنت "أمان" - موظف دعم فني ذكي لشركة The Ultimate Accountant في جدة، السعودية.

معلوماتك:
- الخدمات: تأسيس الشركات، المحاسبة، الزكاة والضريبة، القوائم المالية، الاستشارات المالية، خدمات منصة أمان
- ساعات العمل: الأحد-الخميس 9ص-6م بتوقيت السعودية
- الموقع: جدة، نخدم كل المملكة عن بعد
- الإيميل: linkfamily27@gmail.com
- اسم التطبيق: aman.bot

قواعد الرد:
1. رد بلهجة سعودية محترمة ومختصرة ومفيدة
2. لا تخترع أسعار أبداً - قل "الأسعار حسب نوع الخدمة، أرسل تفاصيل مشروعك"
3. إذا سؤالك خارج المحاسبة، قل "أقدر أساعدك في خدمات المحاسبة والضرائب فقط"
4. لا تذكر أنك ذكاء اصطناعي - أنت موظف دعم
5. استخدم إيموجي بشكل خفيف
6. إذا العميل غاضب، كن متعاطف وحوله للموظف`
          },
          ...history
        ],
        temperature: 0.6,
        max_tokens: 600,
        top_p: 0.9
      });

      const aiReply = completion.choices[0].message.content;

      // حفظ رد البوت في السياق
      history.push({ role: "assistant", content: aiReply });
      conversations.set(userId, history);

      console.log(`🧠 رد ذكي من Groq`);
      return aiReply;

    } catch (error) {
      console.error('Groq Error:', error.message);
      // في حالة فشل الـ AI، رد احتياطي
    }
  }

  // رد احتياطي إذا ما فيه AI أو فشل
  return `أهلاً بك في أمان بوت! 👋\n\nأنا مساعدك الذكي للدعم الفني في The Ultimate Accountant.\n\nأقدر أساعدك في:\n${knowledgeBase.map(k => '• ' + k.title).join('\n')}\n\nاكتب سؤالك بالتفصيل، أو اكتب "موظف" للتواصل مع الدعم البشري.`;
}

async function sendWhatsAppMessage(to, text) {
  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
    console.log('⚠️ ضع التوكنات في ملف .env - رسالة تجريبية:', text.slice(0, 50));
    return;
  }
  const url = `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        text: { body: text },
        preview_url: false
      })
    });
    const data = await res.json();
    if (data.error) console.error('WhatsApp API Error:', data.error);
    else console.log(`✅ تم الإرسال إلى ${to}`);
  } catch (err) {
    console.error('Send Error:', err);
  }
}

app.get('/', (req, res) => {
  res.json({ 
    status: '✅ Aman Bot V2 شغال بعقل ذكي',
    ai_enabled: !!groq,
    webhook: '/webhook ready',
    version: '2.0.0'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Aman Bot V2 running on port ${PORT}`);
  console.log(`🧠 AI Brain: ${groq ? 'Groq Enabled ✅' : 'قاعدة معرفة فقط (أضف GROQ_API_KEY لتفعيل العقل)'}`);
});
