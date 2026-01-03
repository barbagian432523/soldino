import { Router } from 'express';
import { LoanController } from '../controllers/loanController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/loans/summary - Get loan summary
router.get('/summary', LoanController.getSummary);

// GET /api/loans - Get all loans
router.get('/', LoanController.getAll);

// GET /api/loans/:id - Get single loan
router.get('/:id', LoanController.getOne);

// POST /api/loans - Create new loan
router.post('/', LoanController.create);

// PUT /api/loans/:id - Update loan
router.put('/:id', LoanController.update);

// PUT /api/loans/:id/mark-paid - Mark loan as paid
router.put('/:id/mark-paid', LoanController.markAsPaid);

// POST /api/loans/:id/payment - Record a payment
router.post('/:id/payment', LoanController.recordPayment);

// DELETE /api/loans/:id - Delete loan
router.delete('/:id', LoanController.delete);

export default router;
