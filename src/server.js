import express from 'express';
import { config } from './config/env.js';
import { sendText } from './whatsapp/sender.js';
import { verifyMetaSignature } from './whatsapp/security.js';
import { claimMessage, cleanupProcessedMessages } from './whatsapp/dedup.js';
import { classifyIntent } from './ai/classifier.js';
import { searchKnowledge, knowledgeStats } from './knowledge/search.js';
import { groundedAnswer } from './ai/provider.js';
import { addMessage, getSession, setStatus } from './conversations/sessions.js';
import { createTicket } from './tickets/tickets.js';

const app=express();
app.use(express.json({limit:'1mb',verify:(req,res,buf)=>{ req.rawBody=Buffer.from(buf); }}));

app.get('/webhook',(req,res)=>{
  const ok=req.query['hub.mode']==='subscribe' && req.query['hub.verify_token']===config.verifyToken;
  return ok ? res.status(200).send(req.query['hub.challenge']) : res.sendStatus(403);
});

app.post('/webhook',async(req,res)=>{
  if (!verifyMetaSignature(req)) return res.sendStatus(401);
  res.sendStatus(200);
  try {
    const messages=(req.body.entry||[]).flatMap(e=>(e.changes||[]).flatMap(c=>c.value?.messages||[]));
    for (const message of messages) {
      if (!message?.id || !claimMessage(message.id)) continue;
      if (message.type!=='text') {
        await sendText(message.from,'حالياً أتعامل مع الرسائل النصية. اكتب المشكلة نصياً أو اطلب موظفاً.');
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

  const hits=searchKnowledge(text,4);
  if (!hits.length || hits[0].score < 3) {
    await sendText(userId,'المعلومات المتوفرة لدي لا تكفي لإعطائك إجابة موثوقة. اكتب "موظف" لتحويل الطلب للدعم البشري.');
    return;
  }

  const context=hits.map((x,i)=>`SOURCE ${i+1}: ${x.title} [${x.source}]\n${x.content}`).join('\n\n');
  const freshSession=getSession(userId);
  const answer=await groundedAnswer({question:text,context,history:freshSession.messages.slice(0,-1)});
  const reply=answer || hits[0].content;
  addMessage(userId,'assistant',reply);
  await sendText(userId,reply);
}

app.get('/health',(req,res)=>res.json({status:'ok',version:'3.2.0',aiProvider:config.aiProvider,database:'sqlite',knowledge:knowledgeStats()}));
app.get('/',(req,res)=>res.json({name:'Aman Bot',version:'3.2.0',status:'running'}));

cleanupProcessedMessages();
setInterval(cleanupProcessedMessages,6*60*60*1000).unref();
app.listen(config.port,()=>console.log(`Aman Bot V3.2 listening on ${config.port}`));
