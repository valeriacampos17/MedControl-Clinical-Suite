import jwt from 'jsonwebtoken';
import type { UserRole } from '../types.js';

export const JWT_SECRET = process.env.JWT_SECRET ?? 'medcontrol-dev-secret';
export const JWT_EXPIRES_IN = '8h';

export interface TokenPayload {
  sub: string;
  name: string;
  email: string;
  role: UserRole;
  doctorId?: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}