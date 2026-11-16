import { config } from '../../core/config.js';
import { q } from '../../core/db.js';

// Каналы доставки: Telegram-бот и почта (по env). Без настройки — тихо пропускаем.

let tgOffset = 0;

async function tgApi(method, payload) {
  const res = await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

// Пользователь пишет боту — по username привязываем chat_id к учётке
async function pollTelegram() {
  try {
    const data = await tgApi('getUpdates', { offset: tgOffset, timeout: 0 });
    for (const u of data.result ?? []) {
      tgOffset = u.update_id + 1;
      const msg = u.message;
      const username = msg?.from?.username?.toLowerCase();
      if (!msg || !username) continue;
      const user = q.get('SELECT id, name FROM users WHERE lower(telegram) = ?', username);
      if (user) {
        q.run('UPDATE users SET telegram_chat_id = ? WHERE id = ?', String(msg.chat.id), user.id);
        await tgApi('sendMessage', {
          chat_id: msg.chat.id,
          text: `Готово, ${user.name.split(' ')[0]}! Уведомления TeamManager будут приходить сюда.`,
        });
      }
    }
  } catch { /* сеть недоступна — попробуем позже */ }
}

export function startChannels() {
  if (config.telegramBotToken) {
    console.log('[notifications] Telegram-бот активен');
    pollTelegram();
    setInterval(pollTelegram, 10_000).unref();
  }
  if (config.smtpHost) console.log('[notifications] SMTP-почта активна');
}

// Отправка наружу при создании уведомления
export async function deliver(userId, n) {
  const user = q.get('SELECT email, telegram_chat_id FROM users WHERE id = ?', userId);
  if (!user) return;
  const text = `${n.title}\n${n.body}`.trim();

  if (config.telegramBotToken && user.telegram_chat_id) {
    try { await tgApi('sendMessage', { chat_id: user.telegram_chat_id, text }); } catch { /* ignore */ }
  }

  if (config.smtpHost && config.smtpUser) {
    try {
      const nodemailer = (await import('nodemailer')).default;
      const transport = nodemailer.createTransport({
        host: config.smtpHost, port: config.smtpPort, secure: config.smtpPort === 465,
        auth: { user: config.smtpUser, pass: config.smtpPass },
      });
      await transport.sendMail({
        from: config.smtpFrom ?? config.smtpUser, to: user.email,
        subject: `TeamManager: ${n.title}`, text,
      });
    } catch { /* почта недоступна — уведомление остаётся в приложении */ }
  }
}
