import * as svc from '../services/uploadService.js';
import { ok } from '../utils/response.js';

export async function signature(req, res) {
  return ok(res, svc.signUpload(req.user, req.body?.folder));
}
