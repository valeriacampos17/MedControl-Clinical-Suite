import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/connection.js';
import { signToken } from '../middleware/jwt.js';
import { requireAuth } from '../middleware/auth.js';
import type { AppUser } from '../types.js';

export const authRouter = Router();

interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'doctor';
  doctor_id: string | null;
  avatar_url: string | null;
}

function toDto(u: UserRow): AppUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    doctorId: u.doctor_id ?? undefined,
    active: true,
  };
}

authRouter.post('/login', (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: 'Email y contraseña son requeridos' });
    return;
  }
  const user = db.prepare('SELECT * FROM users WHERE email = ? AND active = 1').get(String(email).toLowerCase().trim()) as UserRow | undefined;
  if (!user || !bcrypt.compareSync(String(password), user.password_hash)) {
    res.status(401).json({ error: 'Credenciales inválidas' });
    return;
  }
  const token = signToken({
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    doctorId: user.doctor_id ?? undefined,
  });
  res.json({ token, user: toDto(user) });
});

authRouter.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.auth!.sub) as UserRow | undefined;
  if (!user) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }
  res.json({ user: toDto(user) });
});