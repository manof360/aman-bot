import dotenv from 'dotenv';
dotenv.config();

const required = ['VERIFY_TOKEN','WHATSAPP_TOKEN','PHONE_NUMBER_ID','META_APP_SECRET'];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);
}

export const config = {
  port: Number(process.env.PORT || 3000),
  verifyToken: process.env.VERIFY_TOKEN,
  whatsappToken: process.env.WHATSAPP_TOKEN,
  phoneNumberId: process.env.PHONE_NUMBER_ID,
  metaAppSecret: process.env.META_APP_SECRET,
  graphVersion: process.env.META_GRAPH_VERSION || 'v23.0',
  aiProvider: process.env.AI_PROVIDER || 'groq',
  aiModel: process.env.AI_MODEL || 'llama-3.3-70b-versatile',
  groqApiKey: process.env.GROQ_API_KEY || '',
  humanNotifyNumber: process.env.HUMAN_NOTIFY_NUMBER || '',
  databasePath: process.env.DATABASE_PATH || './data/aman.db'
};
