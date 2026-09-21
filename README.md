
# 🤖 aman.bot V2 - بوت واتساب بعقل ذكي

بوت دعم فني ذكي لشركة **The Ultimate Accountant** يعمل بـ **WhatsApp Cloud API** + **Groq AI (Llama 3.1)**

### ✨ المميزات الجديدة V2

- 🧠 **عقل يفكر**: يفهم السياق ويتذكر المحادثة (6 رسائل سابقة)
- ⚡ **هجين ذكي**: يرد من قاعدة المعرفة أولاً (مجاني وسريع)، وإذا السؤال جديد يسأل الـ AI
- 💬 **يفهم العامية**: يفهم لهجة سعودية وعربي وإنجليزي
- 🔄 **تحويل تلقائي**: عند كلمات "موظف، شكوى، مدير"
- 📝 **قابل للتخصيص**: عدل `knowledgeBase.js` بسهولة

### 🚀 التركيب السريع

#### 1. احصل على مفتاح Groq (مجاني - دقيقة واحدة)
1. ادخل https://console.groq.com/keys
2. سجل بحساب Google
3. اضغط Create API Key وانسخه

#### 2. ارفع على GitHub
ارفع كل الملفات إلى مستودع `aman-bot`

#### 3. اربط مع Render.com
- New + → Web Service → Connect GitHub → اختر aman-bot
- Build: `npm install`
- Start: `npm start`
- أضف في Environment Variables:
  - `VERIFY_TOKEN` = `aman_2026_secure_token`
  - `WHATSAPP_TOKEN` = من Meta
  - `PHONE_NUMBER_ID` = من Meta
  - `GROQ_API_KEY` = من Groq (gsk_...)

#### 4. اربط الـ Webhook في Meta
- Callback URL: `https://YOUR-APP.onrender.com/webhook`
- Verify Token: `aman_2026_secure_token`
- Subscribe to: `messages`

### 💡 كيف يعمل العقل؟

```
العميل يسأل → هل الكلمة في قاعدة المعرفة؟ 
  نعم → رد فوري ⚡
  لا → هل يوجد GROQ_API_KEY؟
    نعم → اسأل Llama 3.1 وافهم السياق 🧠
    لا → رد افتراضي
```

### 📁 هيكل المشروع
```
aman-bot/
├── server.js          # السيرفر + منطق العقل
├── knowledgeBase.js   # عدل أجوبتك هنا
├── package.json
├── .env.example
└── .gitignore
```

### 🔧 تخصيص شخصية البوت
عدل السطر في `server.js` (السطر 65 تقريباً) - الـ system prompt - لتغيير لهجة البوت وخدماتك.

---
صنع بـ ❤️ لـ The Ultimate Accountant - جدة
