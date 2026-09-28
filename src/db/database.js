import { neon } from '@neondatabase/serverless';
import { config } from '../config/env.js';
export const sql=neon(config.databaseUrl);
let initialized;
export function ensureDatabase(){
  if(!initialized) initialized=(async()=>{
    await sql`CREATE TABLE IF NOT EXISTS sessions (user_id TEXT PRIMARY KEY,status TEXT NOT NULL DEFAULT 'BOT',updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS messages (id BIGSERIAL PRIMARY KEY,user_id TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('user','assistant')),content TEXT NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id,id DESC)`;
    await sql`CREATE TABLE IF NOT EXISTS tickets (id TEXT PRIMARY KEY,user_id TEXT NOT NULL,reason TEXT NOT NULL,summary TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'OPEN',created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS processed_messages (message_id TEXT PRIMARY KEY,processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  })();
  return initialized;
}