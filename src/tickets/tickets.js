const tickets = new Map();

export function createTicket({userId, reason, summary=''}) {
  const id = `AM-${Date.now().toString(36).toUpperCase()}`;
  const ticket = { id, userId, reason, summary, status:'OPEN', createdAt:new Date().toISOString() };
  tickets.set(id,ticket);
  return ticket;
}
export function getTicket(id) { return tickets.get(id); }
