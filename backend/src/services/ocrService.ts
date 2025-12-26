import OpenAI from 'openai';
import { config } from '../config/env';
import { OCRResult } from '../types';
import fs from 'fs';

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

export class OCRService {
  /**
   * Analizza un'immagine di ricevuta usando GPT-4 Vision
   */
  static async analyzeReceipt(imagePath: string): Promise<OCRResult> {
    try {
      // Leggi l'immagine e convertila in base64
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = this.getMimeType(imagePath);

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Sei un assistente esperto nell'analisi di ricevute e scontrini.
            Estrai le seguenti informazioni dal documento:
            - Importo totale (amount)
            - Data della transazione (date in formato YYYY-MM-DD)
            - Nome del negozio/venditore (merchant)
            - Categoria della spesa (category: es. "Alimentari", "Ristoranti", "Trasporti", "Shopping", "Utenze", etc.)
            - Descrizione breve (description)

            Rispondi SOLO con un oggetto JSON valido in questo formato:
            {
              "amount": number,
              "date": "YYYY-MM-DD",
              "merchant": "string",
              "category": "string",
              "description": "string",
              "confidence": number (0-100)
            }

            Se non riesci a trovare un campo, usa null. Indica la confidence complessiva dell'analisi.`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analizza questa ricevuta ed estrai le informazioni richieste.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0.2,
      });

      const content = response.choices[0]?.message?.content || '{}';

      // Pulisci il contenuto da eventuali markdown code blocks
      const jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      const result = JSON.parse(jsonContent);

      return {
        amount: result.amount || undefined,
        date: result.date || undefined,
        merchant: result.merchant || undefined,
        category: result.category || undefined,
        description: result.description || undefined,
        confidence: result.confidence || 0,
        rawText: content,
      };
    } catch (error) {
      console.error('Errore OCR:', error);
      throw new Error('Impossibile analizzare la ricevuta');
    }
  }

  /**
   * Determina il MIME type dal percorso del file
   */
  private static getMimeType(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
    };
    return mimeTypes[ext || ''] || 'image/jpeg';
  }
}
