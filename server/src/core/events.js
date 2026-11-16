// SSE-хаб: держит открытые подключения клиентов и рассылает события
const clients = new Set();

export function addClient(res) { clients.add(res); }
export function removeClient(res) { clients.delete(res); }

export function broadcast(type, data = {}) {
  const msg = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) {
    try { res.write(msg); } catch { clients.delete(res); }
  }
}
