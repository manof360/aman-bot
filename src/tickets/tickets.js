import crypto from 'node:crypto';
import { db } from '../db/database.js';

const insert = db.prepare(`
  INSERT INTO tickets(id,user_id,reason,summary,status,created_at,updated_at)
  VALUES(?,?,?,?,?,?,?)
`);
const find = db.prepare('SELECT * FROM tickets WHERE id = ?');

export function createTicket({userId, reason, summary=''}) {
  const id = `AM-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  const now = new Date().toISOString();
  insert.run(id,userId,reason,summary,'OPEN',now,now);
  return { id,userId,reason,summary,status:'OPEN',createdAt:now };
}
export function getTicket(id) { return find.get(id) || null; }
