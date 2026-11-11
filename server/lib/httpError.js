// An error whose status and message are safe to send to the client.
class HttpError extends Error {
  constructor(status, message, extra) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

const badRequest = (message, extra) => new HttpError(400, message, extra);

// Wraps an async route so services can throw and the central handler answers.
const handle = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const ok = (res, data, message) => res.json({ success: true, ...(message ? { message } : {}), data });

module.exports = { HttpError, badRequest, handle, ok };
