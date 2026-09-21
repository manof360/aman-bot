const rules = [
  ['HUMAN_REQUEST', ['موظف','بشري','مدير','شكوى','شكوي']],
  ['ZATCA', ['هيئة الزكاة','زاتكا','zatca','الهيئة','فاتورة مرفوضة']],
  ['PRINTER', ['طابعة','طباعه','طباعة','printer']],
  ['BACKUP', ['نسخ احتياطي','باك اب','backup','استعادة نسخة']],
  ['NETWORK', ['شبكة','الشبكة','جهاز فرعي','ip','اتصال بالسيرفر']],
  ['DATABASE', ['sql','قاعدة البيانات','database','سيرفر sql']],
  ['PRICING', ['سعر','بكم','تكلفة','الاسعار','الأسعار']],
  ['TRIAL', ['تجربة','تجريبي','نسخة تجريبية']],
  ['TRAINING', ['تدريب','شرح','تعليم']],
  ['PRODUCT_INFO', ['ميزة','مميزات','يدعم','الشامل بلس','الشامل ويب','المحاسب الشامل']]
];

export function classifyIntent(text='') {
  const normalized = text.toLowerCase();
  for (const [intent, words] of rules) {
    if (words.some(w => normalized.includes(w))) return intent;
  }
  return 'OTHER';
}
