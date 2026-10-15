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

app.get('/connect/whatsapp', (req, res) => {
  const english = req.query.lang === 'en';
  const appId = process.env.META_APP_ID;
  const configId = process.env.META_CONFIG_ID;
  const graphVersion = process.env.META_GRAPH_VERSION || 'v26.0';

  if (!appId || !configId) {
    return res.status(503).type('html').send('<h1>WhatsApp onboarding is not configured yet</h1><p>Set META_APP_ID and META_CONFIG_ID in Vercel.</p>');
  }

  res.type('html').send(`<!doctype html>
<html lang="${english ? "en" : "ar"}" dir="${english ? "ltr" : "rtl"}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${english ? "Connect WhatsApp - Aman Bot" : "ربط واتساب - Aman Bot"}</title>
<style>
body{font-family:system-ui,sans-serif;max-width:760px;margin:42px auto;padding:24px;line-height:1.7;color:#17212e;background:#fafbfc}h1{line-height:1.3}h2{font-size:1.1rem;margin-bottom:8px}.info{background:white;border:1px solid #dfe5ec;border-radius:12px;padding:16px 20px;margin:20px 0}.info ol{padding-inline-start:22px;margin:8px 0}.note{font-size:.92rem;color:#475467}a{color:#0759b8}button{border:0;border-radius:8px;background:#0866c2;color:white}
button{font:inherit;padding:12px 20px;cursor:pointer}
pre{direction:ltr;text-align:left;white-space:pre-wrap;background:#f5f5f5;padding:14px;border-radius:8px}
</style>
</head>
<body>
<h1>${english ? "Connect WhatsApp to Aman Bot" : "ربط واتساب بـ Aman Bot"}</h1>
<p>${english ? "Connect your WhatsApp Business app using Meta Embedded Signup. Server setup is required after authorization." : "استخدم تسجيل Meta المضمّن لربط حساب واتساب للأعمال ورقم الهاتف بالتطبيق."}</p>
<section class="info" aria-label="${english ? "Connection steps" : "خطوات الربط"}">
<h2>${english ? "How the connection works" : "كيف يتم الربط"}</h2>
<ol>
<li>${english ? "Sign in using Meta's official authorization window." : "سجّل الدخول عبر نافذة التفويض الرسمية من Meta."}</li>
<li>${english ? "Select your business and authorize the requested WhatsApp business assets." : "اختر نشاطك التجاري واسمح بالوصول إلى أصول واتساب المطلوبة."}</li>
<li>${english ? "Follow the WhatsApp Business App coexistence pairing steps if applicable." : "اتبع خطوات اقتران تطبيق واتساب للأعمال عند انطباقها."}</li>
</ol>
</section>
<section class="info">
<h2>${english ? "Why business permissions are requested" : "لماذا نطلب صلاحيات النشاط التجاري؟"}</h2>
<p>${english ? "Aman Bot uses Meta Embedded Signup to request access to the business and WhatsApp assets selected by an authorized administrator. The business_management permission supports this onboarding flow; it is not requested for advertising or unrelated assets." : "يستخدم Aman Bot تسجيل Meta المضمّن لطلب الوصول إلى النشاط التجاري وأصول واتساب التي يحددها المسؤول المخوّل. تُستخدم صلاحية business_management لدعم هذا الربط، وليس للإعلانات أو الأصول غير المرتبطة."}</p>
</section>
<button id="connect">${english ? "Connect WhatsApp" : "ربط واتساب"}</button>
<p class="note">${english ? "Meta authorization is handled by Meta. Completing signup does not automatically activate the bot; server-side setup is still required." : "تتولى Meta عملية التفويض. إكمال التسجيل لا يعني تشغيل البوت تلقائيًا؛ إذ يلزم إعداد الخادم."}</p>
<p class="note"><a href="/privacy" target="_blank" rel="noopener noreferrer">${english ? "Privacy policy (Arabic)" : "سياسة الخصوصية"}</a> · <a href="https://www.aman-soft.com/" target="_blank" rel="noopener noreferrer">${english ? "Aman Modern website" : "موقع أمان الحديثة"}</a></p>
<pre id="result">${english ? "Ready." : "جاهز."}</pre>
<script>
window.fbAsyncInit = function () {
  FB.init({appId: ${JSON.stringify(appId)}, cookie: true, xfbml: false, version: ${JSON.stringify(graphVersion)}});
};
(function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0];if(d.getElementById(id))return;js=d.createElement(s);js.id=id;js.src='https://connect.facebook.net/en_US/sdk.js';fjs.parentNode.insertBefore(js,fjs);}(document,'script','facebook-jssdk'));

const out = document.getElementById('result');
const connectButton = document.getElementById('connect');
const english = ${JSON.stringify(english)};
let sdkReady = false;
let signupEvent = null;
function showStatus(message, details) {
  out.textContent = message + (details ? '\\n' + JSON.stringify(details, null, 2) : '');
}
window.addEventListener('error', (event) => {
  if (event.target?.id === 'facebook-jssdk') {
    showStatus(english ? 'Facebook SDK could not load. Check browser content blockers and try again.' : 'تعذر تحميل Facebook SDK. تحقق من إضافات حظر المحتوى وإعدادات المتصفح.');
  }
}, true);
const previousFbAsyncInit = window.fbAsyncInit;
window.fbAsyncInit = function () {
  if (typeof previousFbAsyncInit === 'function') previousFbAsyncInit();
  sdkReady = typeof window.FB?.login === 'function';
};
window.addEventListener('message', (event) => {
  if (!['https://www.facebook.com','https://web.facebook.com'].includes(event.origin)) return;
  try {
    const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
    if (data?.type !== 'WA_EMBEDDED_SIGNUP') return;
    const safe = {
      event: data.event || 'UNKNOWN',
      current_step: data.data?.current_step || null,
      waba_id: data.data?.waba_id || null,
      phone_number_id: data.data?.phone_number_id || null
    };
    signupEvent = safe;
    if (safe.event === 'CANCEL') {
      showStatus(english ? 'Meta signup was cancelled at the step shown below.' : 'تم إلغاء التسجيل لدى Meta في المرحلة الموضحة أدناه.', safe);
    } else if (safe.event === 'ERROR') {
      showStatus(english ? 'Meta reported a signup error.' : 'أبلغت Meta عن خطأ أثناء التسجيل.', safe);
    } else if (safe.event === 'FINISH' || safe.event === 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING') {
      showStatus(english ? 'Meta signup finished; server setup is still required before the bot can operate.' : 'اكتملت نافذة التسجيل؛ لا يزال إعداد الخادم مطلوبًا قبل تشغيل البوت.', safe);
    } else {
      showStatus(english ? 'Meta signup event:' : 'حدث تسجيل من Meta:', safe);
    }
  } catch {
    // Ignore unrelated or malformed messages; never display raw payloads or tokens.
  }
});

connectButton.onclick = () => {
  if (!sdkReady || typeof window.FB?.login !== 'function') {
    showStatus(english ? 'Facebook SDK is not ready. Reload the page and check browser content blockers.' : 'Facebook SDK غير جاهز. أعد تحميل الصفحة بعد التأكد من عدم حظره.');
    return;
  }
  signupEvent = null;
  showStatus(english ? 'Opening Meta signup...' : 'جارٍ فتح نافذة Meta...');
  FB.login((response) => {
    if (response.authResponse?.code) {
      showStatus(english ? 'Meta issued a temporary authorization code. It has not been sent to the backend; operational setup is incomplete.' : 'أصدرت Meta رمز تفويض مؤقتًا. لم يُرسل الرمز إلى الخادم بعد، ولا يزال الربط التشغيلي غير مكتمل.', signupEvent);
    } else if (!signupEvent || signupEvent.event !== 'CANCEL') {
      showStatus(english ? 'Meta authorization did not complete.' : 'لم يكتمل تفويض Meta.', signupEvent);
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


app.get('/privacy', (_req, res) => {
  res.type('html').send(`<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>سياسة الخصوصية - Aman Bot</title>
<style>body{font-family:system-ui,sans-serif;background:#f7f9fc;color:#152238;margin:0}.wrap{max-width:900px;margin:auto;padding:40px 22px}h1{color:#0b4f8a}h2{margin-top:30px;color:#124f82}.card{background:#fff;border:1px solid #e3e9f0;border-radius:14px;padding:26px;box-shadow:0 4px 20px #0000000a}a{color:#0866c6}small{color:#667085}</style></head>
<body><main class="wrap"><div class="card">
<h1>سياسة الخصوصية – Aman Bot</h1>
<p><small>آخر تحديث: 1 أكتوبر 2026</small></p>
<p>Aman Bot خدمة تابعة لشركة أمان الحديثة لتقنية المعلومات، وتساعد عملاء ومهتمي منتجات المحاسب الشامل عبر WhatsApp في الاستفسارات والمبيعات والدعم الفني والتدريب.</p>
<h2>1. البيانات التي نعالجها</h2>
<p>قد نعالج رقم هاتف WhatsApp، اسم الملف الشخصي المتاح، محتوى الرسائل التي يرسلها المستخدم إلى الخدمة، ومعرّفات الرسائل والحساب اللازمة لتشغيل WhatsApp Business Platform. وقد نعالج معلومات يقدمها المستخدم طوعًا مثل اسم المنشأة ونوع الاستفسار وبيانات طلب الدعم.</p>
<h2>2. أغراض الاستخدام</h2>
<p>نستخدم البيانات لتقديم الردود وخدمات الدعم والمبيعات، إدارة المحادثة، تحويل الطلب إلى موظف عند الحاجة، تحسين جودة الخدمة، حماية النظام، والامتثال للمتطلبات النظامية والفنية.</p>
<h2>3. Meta وWhatsApp</h2>
<p>تستخدم الخدمة WhatsApp Business Platform وواجهات Meta البرمجية. تخضع معالجة Meta للبيانات أيضًا لشروط وسياسات Meta وWhatsApp ذات الصلة.</p>
<h2>4. مشاركة البيانات</h2>
<p>لا نبيع البيانات الشخصية. قد تُعالج البيانات بواسطة مزودي البنية التحتية والخدمات التقنية الضرورية لتشغيل Aman Bot، وبالقدر اللازم لتقديم الخدمة وحمايتها، أو عندما يتطلب النظام ذلك.</p>
<h2>5. الذكاء الاصطناعي</h2>
<p>قد تستخدم الخدمة مزودي نماذج ذكاء اصطناعي لمعالجة نصوص الاستفسارات وتوليد ردود مساعدة. نهدف إلى إرسال الحد الأدنى اللازم من البيانات لأداء الوظيفة، مع تطبيق ضوابط تقنية مناسبة.</p>
<h2>6. الاحتفاظ والأمان</h2>
<p>نحتفظ بالبيانات فقط للمدة اللازمة للأغراض التشغيلية والدعم والالتزامات النظامية، ثم نحذفها أو نجعلها غير قابلة للارتباط بالمستخدم عندما لا تعود هناك حاجة مشروعة إليها. نستخدم تدابير تقنية وتنظيمية مناسبة للحد من الوصول غير المصرح به أو الاستخدام أو الإفصاح غير المشروع.</p>
<h2>7. حقوق المستخدم والحذف</h2>
<p>يمكن للمستخدم طلب الوصول إلى بياناته أو تصحيحها أو حذفها أو الاعتراض على معالجتها حيثما ينطبق ذلك نظامًا، وذلك بالتواصل معنا. كما يمكنه التوقف عن مراسلة الخدمة في أي وقت.</p>
<h2>8. الأطفال</h2>
<p>Aman Bot مخصص لخدمات الأعمال وليس موجهًا للأطفال.</p>
<h2>9. التغييرات</h2>
<p>قد نحدّث هذه السياسة عند تغير الخدمة أو المتطلبات النظامية، وسيظهر تاريخ آخر تحديث في أعلى الصفحة.</p>
<h2>10. التواصل</h2>
<p>شركة أمان الحديثة لتقنية المعلومات (Aman Modern)<br>الموقع: <a href="https://www.aman-soft.com/">www.aman-soft.com</a><br>واتساب/هاتف: <a href="tel:+966505166252">+966 50 516 6252</a></p>
</div></main></body></html>`);
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
