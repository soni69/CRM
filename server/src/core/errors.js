export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const httpError = (status, message) => new ApiError(status, message);

// Обёртка для async-роутов — ошибки летят в errorHandler
export const asyncH = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function errorHandler(err, _req, res, _next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Слишком большой запрос' });
  }
  console.error(err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
}

// zod → 400 с первым сообщением
export function parseBody(schema, data) {
  const r = schema.safeParse(data);
  if (!r.success) {
    throw httpError(400, r.error.issues[0]?.message || 'Некорректные данные');
  }
  return r.data;
}
