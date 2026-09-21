import { db } from '../db/database.js';

const MAX_MESSAGES = 8;
const getSessionStmt = db.prepare('SELECT user_id, status FROM sessions WHERE user_id = ?');
const upsertSession = db.prepare(`
  INSERT INTO sessions(user_id,status,updated_at) VALUES(?,?,?)
  ON CONFLICT(user_id) DO UPDATE SET status=excluded.status, updated_at=excluded.updated_at
`);
const insertMessage = db.prepare('INSERT INTO messages(user_id,role,content,created_at) VALUES(?,?,?,?)');
const recentMessages = db.prepare(`
  SELECT role, content, created_at AS at FROM messages
  WHERE user_id = ? ORDER BY id DESC LIMIT ?
`);

export function addMessage(userId, role, content) {
  const current = getSessionStmt.get(userId);
  upsertSession.run(userId, current?.status || 'BOT', new Date().toISOString());
  insertMessage.run(userId, role, content, new Date().toISOString());
  return getSession(userId);
}

export function getSession(userId) {
  const row = getSessionStmt.get(userId);
  const messages = recentMessages.all(userId, MAX_MESSAGES).reverse();
  return { status: row?.status || 'BOT', messages };
}

export function setStatus(userId,status) {
  upsertSession.run(userId,status,new Date().toISOString());
  return getSession(userId);
}
