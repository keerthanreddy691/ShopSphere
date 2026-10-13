import { ApiError } from '../utils/ApiError.js';

const format = (issues) => issues.map((i) => ({ field: i.path.join('.'), message: i.message }));

// Validates req.body (default) against a zod schema and replaces it with the parsed value.
export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source] ?? {});
  if (!result.success) {
    throw ApiError.badRequest('Validation failed', format(result.error.issues));
  }
  if (source === 'body') req.body = result.data;
  else req.validated = { ...(req.validated || {}), [source]: result.data };
  next();
};
