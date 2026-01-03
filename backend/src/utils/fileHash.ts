import crypto from 'crypto';
import fs from 'fs';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);

/**
 * Calcola l'hash SHA-256 di un file
 * @param filePath - Path del file
 * @returns Hash SHA-256 in formato hex
 */
export async function calculateFileHash(filePath: string): Promise<string> {
  const fileBuffer = await readFile(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

/**
 * Calcola l'hash SHA-256 di un buffer
 * @param buffer - Buffer del file
 * @returns Hash SHA-256 in formato hex
 */
export function calculateBufferHash(buffer: Buffer): string {
  const hashSum = crypto.createHash('sha256');
  hashSum.update(buffer);
  return hashSum.digest('hex');
}

/**
 * Verifica l'integrità di un file confrontando l'hash
 * @param filePath - Path del file
 * @param expectedHash - Hash atteso
 * @returns true se l'hash corrisponde
 */
export async function verifyFileIntegrity(
  filePath: string,
  expectedHash: string
): Promise<boolean> {
  const actualHash = await calculateFileHash(filePath);
  return actualHash === expectedHash;
}
