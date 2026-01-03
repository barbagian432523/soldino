import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { AccountController } from '../controllers/accountController';
import { CategoryController } from '../controllers/categoryController';
import { ExpenseController } from '../controllers/expenseController';
import { UploadController } from '../controllers/uploadController';
import { ContactController } from '../controllers/contactController';
import { LoanController } from '../controllers/loanController';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// ========== AUTH ROUTES ==========
router.post('/auth/register', AuthController.register);
router.post('/auth/login', AuthController.login);
router.get('/auth/me', authenticate, AuthController.me);

// ========== ACCOUNT ROUTES ==========
router.get('/accounts', authenticate, AccountController.getAll);
router.get('/accounts/stats', authenticate, AccountController.getStats);
router.post('/accounts', authenticate, AccountController.create);
router.put('/accounts/:id', authenticate, AccountController.update);
router.delete('/accounts/:id', authenticate, AccountController.delete);

// ========== CATEGORY ROUTES ==========
router.get('/categories', authenticate, CategoryController.getAll);
router.post('/categories', authenticate, CategoryController.create);
router.put('/categories/:id', authenticate, CategoryController.update);
router.delete('/categories/:id', authenticate, CategoryController.delete);

// ========== EXPENSE ROUTES ==========
router.get('/expenses', authenticate, ExpenseController.getAll);
router.get('/expenses/stats', authenticate, ExpenseController.getStats);
router.get('/expenses/:id', authenticate, ExpenseController.getOne);
router.post('/expenses', authenticate, ExpenseController.create);
router.put('/expenses/:id', authenticate, ExpenseController.update);
router.delete('/expenses/:id', authenticate, ExpenseController.delete);

// ========== UPLOAD & OCR ROUTES ==========
router.post(
  '/expenses/:expenseId/attachments',
  authenticate,
  upload.single('file'),
  UploadController.uploadAttachment
);
router.post(
  '/upload/analyze-receipt',
  authenticate,
  upload.single('file'),
  UploadController.analyzeReceipt
);
router.post('/upload/create-from-receipt', authenticate, UploadController.createFromReceipt);
router.delete('/attachments/:id', authenticate, UploadController.deleteAttachment);

// ========== CONTACT ROUTES ==========
router.get('/contacts', authenticate, ContactController.getAll);
router.get('/contacts/:id', authenticate, ContactController.getOne);
router.post('/contacts', authenticate, ContactController.create);
router.put('/contacts/:id', authenticate, ContactController.update);
router.delete('/contacts/:id', authenticate, ContactController.delete);

// ========== LOAN ROUTES ==========
router.get('/loans/summary', authenticate, LoanController.getSummary);
router.get('/loans', authenticate, LoanController.getAll);
router.get('/loans/:id', authenticate, LoanController.getOne);
router.post('/loans', authenticate, LoanController.create);
router.put('/loans/:id', authenticate, LoanController.update);
router.put('/loans/:id/mark-paid', authenticate, LoanController.markAsPaid);
router.post('/loans/:id/payment', authenticate, LoanController.recordPayment);
router.delete('/loans/:id', authenticate, LoanController.delete);

export default router;
