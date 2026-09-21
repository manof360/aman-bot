import { db } from '../db/database.js';

const exists = db.prepare('SELECT 1 FROM processed_messages WHERE message_id = ?');
const insert = db.prepare('INSERT OR IGNORE INTO processed_messages(message_id, processed_at) VALUES (?, ?)');
const cleanup = db.prepare("DELETE FROM processed_messages WHERE processed_at < datetime('now', '-7 days')");

export function claimMessage(messageId) {
  if (exists.get(messageId)) return false;
  insert.run(messageId, new Date().toISOString());
  return true;
}
export function cleanupProcessedMessages() { cleanup.run(); }
