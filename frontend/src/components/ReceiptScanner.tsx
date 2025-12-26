import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  CameraIcon,
  CloudArrowUpIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { uploadAPI } from '@/services/api';
import { useDataStore } from '@/store/dataStore';
import { formatCurrency } from '@/utils/format';

interface Props {
  onClose: () => void;
}

export default function ReceiptScanner({ onClose }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { accounts, categories, fetchExpenses, fetchStats } = useDataStore();

  const handleFileSelect = async (file: File) => {
    // Mostra anteprima
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Analizza con OCR
    setIsAnalyzing(true);
    try {
      const { data } = await uploadAPI.analyzeReceipt(file);
      setResult(data);
    } catch (error) {
      console.error('Errore analisi:', error);
      alert('Errore durante l\'analisi della ricevuta');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateExpense = async () => {
    if (!result) return;

    setIsCreating(true);
    try {
      await uploadAPI.createFromReceipt({
        amount: result.suggestion.amount,
        description: result.suggestion.description,
        date: result.suggestion.date,
        accountId: result.suggestion.accountId,
        categoryId: result.suggestion.categoryId,
        aiConfidence: result.suggestion.aiConfidence,
        aiRawData: result.ocr,
        filePath: result.uploadedFile.path,
      });

      fetchExpenses();
      fetchStats();
      onClose();
    } catch (error) {
      console.error('Errore creazione spesa:', error);
      alert('Errore durante la creazione della spesa');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center rounded-t-3xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <SparklesIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Scansiona Ricevuta
                </h3>
                <p className="text-sm text-slate-600">
                  AI-powered OCR
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-slate-600" />
            </button>
          </div>

          <div className="p-6">
            {!preview ? (
              /* Upload Area */
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                  className="hidden"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-slate-300 rounded-2xl p-12 hover:border-purple-400 hover:bg-purple-50 transition-all group"
                >
                  <CloudArrowUpIcon className="w-16 h-16 mx-auto text-slate-400 group-hover:text-purple-500 mb-4" />
                  <p className="text-lg font-medium text-slate-700 mb-2">
                    Carica una ricevuta
                  </p>
                  <p className="text-sm text-slate-500">
                    Clicca per selezionare un'immagine
                  </p>
                </button>

                <div className="text-center">
                  <p className="text-slate-500 text-sm">oppure</p>
                </div>

                <button
                  onClick={() => {
                    // TODO: Implementa fotocamera
                    alert('Funzione fotocamera in arrivo!');
                  }}
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl py-4 flex items-center justify-center gap-3 hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg"
                >
                  <CameraIcon className="w-6 h-6" />
                  <span className="font-medium">Scatta una foto</span>
                </button>
              </div>
            ) : (
              /* Result Display */
              <div className="space-y-6">
                {/* Preview immagine */}
                <div className="relative">
                  <img
                    src={preview}
                    alt="Receipt preview"
                    className="w-full rounded-xl shadow-lg"
                  />
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <div className="bg-white rounded-2xl p-6 text-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: 'linear',
                          }}
                          className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-3"
                        />
                        <p className="font-medium text-slate-900">
                          Analisi in corso...
                        </p>
                        <p className="text-sm text-slate-600 mt-1">
                          L'AI sta leggendo la ricevuta
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Risultati OCR */}
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-purple-50 to-primary-50 rounded-2xl p-6 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900">
                        Dati estratti
                      </h4>
                      <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full">
                        <SparklesIcon className="w-4 h-4 text-purple-500" />
                        <span className="text-sm font-medium text-slate-700">
                          {result.ocr.confidence}% di accuratezza
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-xl p-4">
                        <p className="text-sm text-slate-600 mb-1">Importo</p>
                        <p className="text-2xl font-bold text-slate-900">
                          {result.ocr.amount
                            ? formatCurrency(result.ocr.amount)
                            : 'N/A'}
                        </p>
                      </div>

                      <div className="bg-white rounded-xl p-4">
                        <p className="text-sm text-slate-600 mb-1">Data</p>
                        <p className="font-medium text-slate-900">
                          {result.ocr.date || 'N/A'}
                        </p>
                      </div>

                      <div className="bg-white rounded-xl p-4">
                        <p className="text-sm text-slate-600 mb-1">Negozio</p>
                        <p className="font-medium text-slate-900">
                          {result.ocr.merchant || 'N/A'}
                        </p>
                      </div>

                      <div className="bg-white rounded-xl p-4">
                        <p className="text-sm text-slate-600 mb-1">
                          Categoria
                        </p>
                        <p className="font-medium text-slate-900">
                          {result.ocr.category || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-4">
                      <p className="text-sm text-slate-600 mb-1">
                        Descrizione
                      </p>
                      <p className="font-medium text-slate-900">
                        {result.suggestion.description}
                      </p>
                    </div>

                    {/* Azioni */}
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => {
                          setPreview(null);
                          setResult(null);
                        }}
                        className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors font-medium"
                      >
                        Scansiona altra
                      </button>

                      <button
                        onClick={handleCreateExpense}
                        disabled={isCreating || !result.suggestion.accountId}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                      >
                        {isCreating ? 'Creazione...' : 'Crea Spesa'}
                      </button>
                    </div>

                    {!result.suggestion.accountId && (
                      <p className="text-sm text-orange-600 text-center">
                        ⚠️ Crea almeno un account per salvare la spesa
                      </p>
                    )}
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
