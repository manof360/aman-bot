import express from 'express';
import { config } from './config/env.js';
import { sendText } from './whatsapp/sender.js';
import { classifyIntent } from './ai/classifier.js';
import { searchKnowledge } from './knowledge/search.js';
import { groundedAnswer } from './ai/provider.js';
import { addMessage, getSession, setStatus } from './conversations/sessions.js';
import { createTicket } from './tickets/tickets.js';

const app=express();
app.use(express.json({limit:'1mb'}));
const processed=new Map();

app.get('/webhook',(req,res)=>{
  const ok=req.query['hub.mode']==='subscribe' && req.query['hub.verify_token']===config.verifyToken;
  return ok ? res.status(200).send(req.query['hub.challenge']) : res.sendStatus(403);
});

app.post('/webhook',async(req,res)=>{
  res.sendStatus(200);
  try {
    const messages=(req.body.entry||[]).flatMap(e=>(e.changes||[]).flatMap(c=>c.value?.messages||[]));
    for (const message of messages) {
      if (!message?.id || processed.has(message.id)) continue;
      processed.set(message.id,Date.now());
      if (message.type!=='text') {
        await sendText(message.from,'حالياً أتعامل مع الرسائل النصية. دعم الصور والصوت سيضاف قريباً. اكتب المشكلة نصياً أو اطلب موظفاً.');
        continue;
      }
      await handleText(message.from,message.text?.body||'');
    }
  } catch(e) { console.error('Webhook processing error:',e.message); }
});

async function handleText(userId,text) {
  const session=getSession(userId);
  if (session.status==='HUMAN') return;

  addMessage(userId,'user',text);
  const intent=classifyIntent(text);

  if (intent==='HUMAN_REQUEST') {
    const ticket=createTicket({userId,reason:intent,summary:text});
    setStatus(userId,'HUMAN');
    await sendText(userId,`تم تسجيل طلبك للدعم البشري. رقم التذكرة: ${ticket.id}`);
    return;
  }

  const hits=searchKnowledge(text,3);
  if (!hits.length || hits[0].score < 2) {
    await sendText(userId,'لا أملك معلومات موثوقة كافية للإجابة على هذا السؤال حالياً. اكتب "موظف" لتحويل الطلب للدعم البشري.');
    return;
  }

  const context=hits.map((x,i)=>`[${i+1}] ${x.title}\n${x.answer}`).join('\n\n');
  const answer=await groundedAnswer({question:text,context,history:session.messages});
  const reply=answer || hits[0].answer;
  addMessage(userId,'assistant',reply);
  await sendText(userId,reply);
}

app.get('/health',(req,res)=>res.json({status:'ok',version:'3.0.0',aiProvider:config.aiProvider}));
app.get('/',(req,res)=>res.json({name:'Aman Bot',version:'3.0.0',status:'running'}));

setInterval(()=>{
  const cutoff=Date.now()-24*60*60*1000;
  for(const [id,at] of processed) if(at<cutoff) processed.delete(id);
},60*60*1000).unref();

app.listen(config.port,()=>console.log(`Aman Bot V3 listening on ${config.port}`));
