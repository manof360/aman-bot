import crypto from 'node:crypto';
import {sql,ensureDatabase} from '../db/database.js';
export async function createTicket({userId,reason,summary=''}){await ensureDatabase();const id=`AM-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;await sql`INSERT INTO tickets(id,user_id,reason,summary,status) VALUES(${id},${userId},${reason},${summary},'OPEN')`;return {id,userId,reason,summary,status:'OPEN',createdAt:new Date().toISOString()};}
export async function getTicket(id){await ensureDatabase();const rows=await sql`SELECT * FROM tickets WHERE id=${id}`;return rows[0]||null;}
