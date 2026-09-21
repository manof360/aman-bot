
# aman.bot - بوت واتساب دعم فني

## خطوات الرفع على Render.com
1. انشئ حساب على render.com
2. اضغط New + -> Web Service
3. اربطه بـ GitHub أو ارفع الملفات يدوياً
4. في Environment Variables ضع:
   - VERIFY_TOKEN = aman_2026_secure_token
   - WHATSAPP_TOKEN = التوكن من Meta
   - PHONE_NUMBER_ID = الـ ID من Meta
5. بعد النشر، انسخ رابط موقعك وضف له /webhook
   مثال: https://aman-bot.onrender.com/webhook
6. الصق الرابط في لوحة Meta في خانة Callback URL

# للتجربة المحلية
npm install
npm start
