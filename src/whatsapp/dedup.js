import {sql,ensureDatabase} from '../db/database.js';
export async function claimMessage(messageId){
 await ensureDatabase();
 const rows=await sql`INSERT INTO processed_messages(message_id) VALUES(${messageId}) ON CONFLICT(message_id) DO NOTHING RETURNING message_id`;
 return rows.length===1;
}
export async function cleanupProcessedMessages(){await ensureDatabase();}
