import { config } from '../config/env.js';

export async function sendText(to, body) {
  const url=`https://graph.facebook.com/${config.graphVersion}/${config.phoneNumberId}/messages`;
  const response=await fetch(url,{
    method:'POST',
    headers:{Authorization:`Bearer ${config.whatsappToken}`,'Content-Type':'application/json'},
    body:JSON.stringify({messaging_product:'whatsapp',to,type:'text',text:{body,preview_url:false}})
  });
  const data=await response.json();
  if (!response.ok) throw new Error(`WhatsApp API error: ${JSON.stringify(data.error || data)}`);
  return data;
}
