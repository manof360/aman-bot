# Aman Bot V3

النسخة الجديدة لبوت شركة أمان الحديثة لدعم ومبيعات المحاسب الشامل.

## المنجز حتى V3.1
- WhatsApp Cloud API الرسمي.
- إجابات AI مقيدة بالمعلومات المسترجعة.
- Intent classification.
- SQLite دائم للجلسات والرسائل والتذاكر ومعرّفات الرسائل المعالجة.
- منع الرد المكرر على webhook المعاد إرساله.
- تحقق HMAC-SHA256 من توقيع Meta عبر X-Hub-Signature-256.
- أسرار Meta مطلوبة عبر Environment Variables ولا توجد قيم افتراضية لها.
- فصل WhatsApp وAI والمعرفة والجلسات والتذاكر.

## التشغيل
1. انسخ .env.example إلى .env.
2. أدخل VERIFY_TOKEN وWHATSAPP_TOKEN وPHONE_NUMBER_ID وMETA_APP_SECRET.
3. npm install
4. npm start
5. اضبط Meta Webhook على /webhook.

## التخزين
الافتراضي: ./data/aman.db ويمكن تغييره عبر DATABASE_PATH.
SQLite يعمل بوضع WAL. لا ترفع ملف قاعدة البيانات إلى Git.

## الأمان
طلبات POST إلى /webhook تُرفض بـ401 إذا لم يطابق توقيع Meta قيمة META_APP_SECRET.

## المتبقي قبل الإنتاج
- قاعدة معرفة منظمة وحقيقية للمحاسب الشامل.
- اختبارات آلية.
- إشعار فعلي للموظف عند إنشاء Ticket.
- دعم الصور والصوت.
- سياسة retention وmasking للسجلات.
