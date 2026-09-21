const sessions = new Map();
const MAX_MESSAGES = 8;

export function addMessage(userId, role, content) {
  const session = sessions.get(userId) || { status:'BOT', messages:[] };
  session.messages.push({ role, content, at:new Date().toISOString() });
  if (session.messages.length > MAX_MESSAGES) session.messages.splice(0, session.messages.length-MAX_MESSAGES);
  sessions.set(userId, session);
  return session;
}
export function getSession(userId) { return sessions.get(userId) || { status:'BOT', messages:[] }; }
export function setStatus(userId,status) {
  const session=getSession(userId); session.status=status; sessions.set(userId,session); return session;
}
