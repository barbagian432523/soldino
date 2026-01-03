import { Router } from 'express';
import { ContactController } from '../controllers/contactController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/contacts - Get all contacts
router.get('/', ContactController.getAll);

// GET /api/contacts/:id - Get single contact
router.get('/:id', ContactController.getOne);

// POST /api/contacts - Create new contact
router.post('/', ContactController.create);

// PUT /api/contacts/:id - Update contact
router.put('/:id', ContactController.update);

// DELETE /api/contacts/:id - Delete contact
router.delete('/:id', ContactController.delete);

export default router;
