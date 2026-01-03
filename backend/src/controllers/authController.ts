import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { generateToken } from '../utils/jwt';
import { RegisterDTO, LoginDTO, AuthRequest } from '../types';
import { createAuditLog } from '../services/auditLog';

export class AuthController {
  /**
   * Registrazione nuovo utente
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, firstName, lastName }: RegisterDTO = req.body;

      // Validazione
      if (!email || !password || !firstName || !lastName) {
        res.status(400).json({ error: 'Tutti i campi sono obbligatori' });
        return;
      }

      // Verifica se l'utente esiste già
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        res.status(409).json({ error: 'Email già registrata' });
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crea utente
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          createdAt: true,
        },
      });

      // Genera token
      const token = generateToken({ userId: user.id, email: user.email });

      res.status(201).json({
        message: 'Registrazione completata con successo',
        user,
        token,
      });
    } catch (error) {
      console.error('Errore registrazione:', error);
      res.status(500).json({ error: 'Errore durante la registrazione' });
    }
  }

  /**
   * Login utente
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password }: LoginDTO = req.body;

      // Validazione
      if (!email || !password) {
        res.status(400).json({ error: 'Email e password sono obbligatori' });
        return;
      }

      // Cerca utente
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        res.status(401).json({ error: 'Credenziali non valide' });
        return;
      }

      // Verifica password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({ error: 'Credenziali non valide' });
        return;
      }

      // Genera token
      const token = generateToken({ userId: user.id, email: user.email });

      // Audit log
      await createAuditLog({
        userId: user.id,
        action: 'LOGIN',
        entity: 'User',
        entityId: user.id,
        description: `Login effettuato: ${user.email}`,
        req,
      });

      // Rimuovi password dalla risposta
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        message: 'Login effettuato con successo',
        user: userWithoutPassword,
        token,
      });
    } catch (error) {
      console.error('Errore login:', error);
      res.status(500).json({ error: 'Errore durante il login' });
    }
  }

  /**
   * Ottieni profilo utente corrente
   */
  static async me(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        res.status(404).json({ error: 'Utente non trovato' });
        return;
      }

      res.json({ user });
    } catch (error) {
      console.error('Errore recupero profilo:', error);
      res.status(500).json({ error: 'Errore durante il recupero del profilo' });
    }
  }
}
