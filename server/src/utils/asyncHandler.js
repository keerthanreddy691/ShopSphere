// Express 5 forwards rejected promises automatically; kept as an explicit wrapper for clarity.
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
