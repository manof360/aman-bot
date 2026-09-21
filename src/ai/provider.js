import Groq from 'groq-sdk';
import { config } from '../config/env.js';
import { SYSTEM_PROMPT } from './prompts.js';

const groq = config.groqApiKey ? new Groq({apiKey:config.groqApiKey}) : null;

export async function groundedAnswer({question, context, history=[]}) {
  if (!groq) return null;
  const completion=await groq.chat.completions.create({
    model:config.aiModel,
    temperature:0.2,
    max_tokens:500,
    messages:[
      {role:'system',content:SYSTEM_PROMPT},
      ...history.slice(-6).map(x=>({role:x.role,content:x.content})),
      {role:'user',content:`CONTEXT:\n${context}\n\nسؤال العميل:\n${question}`}
    ]
  });
  return completion.choices?.[0]?.message?.content?.trim() || null;
}
