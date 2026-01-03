import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import { calculateFileHash } from '../utils/fileHash';
import { PrismaClient, AttachmentType } from '@prisma/client';

const prisma = new PrismaClient();
const mkdir = promisify(fs.mkdir);

// Directory per gli allegati
const UPLOAD_DIR = path.join(__dirname, '../../uploads/attachments');

// Crea directory se non esiste
export async function ensureUploadDirExists() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error: any) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

// Configurazione Multer
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureUploadDirExists();
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// Filtro per i tipi di file
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Tipi permessi: immagini, PDF, documenti comuni
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo di file non supportato'));
  }
};

// Configurazione upload
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

/**
 * Determina il tipo di attachment dal mimetype
 */
function getAttachmentType(mimeType: string): AttachmentType {
  if (mimeType.startsWith('image/')) {
    return 'IMAGE';
  }
  if (mimeType === 'application/pdf') {
    return 'PDF';
  }
  if (
    mimeType.includes('document') ||
    mimeType.includes('word') ||
    mimeType.includes('excel') ||
    mimeType.includes('sheet') ||
    mimeType.includes('text')
  ) {
    return 'DOCUMENT';
  }
  return 'OTHER';
}

/**
 * Crea un record di attachment nel database con hash
 */
export async function createAttachment(
  file: Express.Multer.File,
  expenseId: string
) {
  const filePath = file.path;
  const hash = await calculateFileHash(filePath);

  const attachment = await prisma.attachment.create({
    data: {
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      type: getAttachmentType(file.mimetype),
      path: filePath,
      hash,
      expenseId,
    },
  });

  return attachment;
}

/**
 * Elimina un attachment dal filesystem e dal database
 */
export async function deleteAttachment(attachmentId: string) {
  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
  });

  if (!attachment) {
    throw new Error('Attachment non trovato');
  }

  // Elimina file dal filesystem
  try {
    await promisify(fs.unlink)(attachment.path);
  } catch (error) {
    console.error('Errore eliminazione file:', error);
  }

  // Elimina record dal database
  await prisma.attachment.delete({
    where: { id: attachmentId },
  });
}

/**
 * Verifica duplicati tramite hash
 */
export async function findDuplicateByHash(hash: string) {
  return await prisma.attachment.findFirst({
    where: { hash },
    include: {
      expense: {
        select: {
          id: true,
          description: true,
          date: true,
        },
      },
    },
  });
}
