
import * as authService from '../services/authService.js';
import { ok, created } from '../utils/response.js';

const sendSession = async (res, user, message, status = 200) => {
  const token = authService.signToken(user);

  // Keep the existing cookie authentication.
  res.cookie('token', token, authService.cookieOptions);

  const profile = await authService.getProfile(user);

  // Also return the token so the frontend can use Bearer authentication.
  const payload = {
    user: profile,
    token,
  };

  return status === 201
    ? created(res, payload, message)
    : ok(res, payload, message);
};

export async function register(req, res) {
  const user = await authService.register(req.body);

  const msg =
    user.role === 'SELLER'
      ? 'Seller account created. Your application is pending admin approval.'
      : 'Account created successfully';

  return sendSession(res, user, msg, 201);
}

export async function login(req, res) {
  const user = await authService.login(req.body);

  return sendSession(
    res,
    user,
    `Welcome back, ${user.name.split(' ')[0]}!`
  );
}

export function logout(_req, res) {
  res.clearCookie('token', {
    ...authService.cookieOptions,
    maxAge: undefined,
  });

  return ok(res, {}, 'Logged out');
}

export async function me(req, res) {
  return ok(res, {
    user: await authService.getProfile(req.user),
  });
}

export async function session(req, res) {
  return ok(res, {
    user: req.user
      ? await authService.getProfile(req.user)
      : null,
  });
}
