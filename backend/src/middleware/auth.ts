import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { verifyToken } from '../utils/jwt';

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Token di autenticazione mancante' });
      return;
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    req.userId = payload.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token non valido o scaduto' });
  }
};
