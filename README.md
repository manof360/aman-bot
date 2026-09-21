aman.bot - بوت واتساب دعم فني
خطوات الرفع على Render.com
انشئ حساب على render.com
اضغط New + -> Web Service
اربطه بـ GitHub أو ارفع الملفات يدوياً
في Environment Variables ضع:
VERIFY_TOKEN = aman_2026_secure_token
WHATSAPP_TOKEN = التوكن من Meta
PHONE_NUMBER_ID = الـ ID من Meta
بعد النشر، انسخ رابط موقعك وضف له /webhook
مثال: https://aman-bot.onrender.com/webhook
الصق الرابط في لوحة Meta في خانة Callback URL
للتجربة المحلية
npm install
npm start
