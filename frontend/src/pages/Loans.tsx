import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  PlusIcon,
  UserIcon,
  BanknotesIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import Layout from '@/components/Layout';
import { contactsAPI, loansAPI } from '@/services/api';
import { formatCurrency, formatDateShort } from '@/utils/format';
import type { Contact, Loan, LoanSummary } from '@/types';

type TabType = 'loans' | 'contacts';

export default function Loans() {
  const [activeTab, setActiveTab] = useState<TabType>('loans');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [summary, setSummary] = useState<LoanSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [showContactModal, setShowContactModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | undefined>();
  const [selectedLoan, setSelectedLoan] = useState<Loan | undefined>();

  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });

  const [loanForm, setLoanForm] = useState({
    type: 'LENT' as 'LENT' | 'BORROWED',
    amount: '',
    description: '',
    notes: '',
    loanDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    contactId: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [contactsRes, loansRes, summaryRes] = await Promise.all([
        contactsAPI.getAll(),
        loansAPI.getAll(),
        loansAPI.getSummary(),
      ]);
      setContacts(contactsRes.data.contacts);
      setLoans(loansRes.data.loans);
      setSummary(summaryRes.data.summary);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveContact = async () => {
    try {
      if (selectedContact) {
        await contactsAPI.update(selectedContact.id, contactForm);
      } else {
        await contactsAPI.create(contactForm);
      }
      await fetchData();
      setShowContactModal(false);
      setSelectedContact(undefined);
      setContactForm({ name: '', email: '', phone: '', notes: '' });
    } catch (error: any) {
      alert(error.response?.data?.error || 'Errore durante il salvataggio');
    }
  };

  const handleDeleteContact = async (contact: Contact) => {
    if (!confirm(`Eliminare il contatto "${contact.name}"?`)) return;
    try {
      await contactsAPI.delete(contact.id);
      await fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Errore durante l\'eliminazione');
    }
  };

  const handleSaveLoan = async () => {
    try {
      const data = {
        ...loanForm,
        amount: parseFloat(loanForm.amount),
        dueDate: loanForm.dueDate || undefined,
      };

      if (selectedLoan) {
        await loansAPI.update(selectedLoan.id, data);
      } else {
        await loansAPI.create(data);
      }
      await fetchData();
      setShowLoanModal(false);
      setSelectedLoan(undefined);
      setLoanForm({
        type: 'LENT',
        amount: '',
        description: '',
        notes: '',
        loanDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        contactId: '',
      });
    } catch (error: any) {
      alert(error.response?.data?.error || 'Errore durante il salvataggio');
    }
  };

  const handleDeleteLoan = async (loan: Loan) => {
    if (!confirm(`Eliminare il prestito "${loan.description}"?`)) return;
    try {
      await loansAPI.delete(loan.id);
      await fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Errore durante l\'eliminazione');
    }
  };

  const handleMarkAsPaid = async (loan: Loan) => {
    if (!confirm('Segnare questo prestito come completamente pagato?')) return;
    try {
      await loansAPI.markAsPaid(loan.id);
      await fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Errore');
    }
  };

  const handleRecordPayment = async (loan: Loan) => {
    const amountStr = prompt(`Importo pagamento (max ${loan.remainingAmount}):`);
    if (!amountStr) return;

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert('Importo non valido');
      return;
    }

    try {
      await loansAPI.recordPayment(loan.id, amount);
      await fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Errore');
    }
  };

  const activeLoans = loans.filter(l => l.status === 'ACTIVE');
  const paidLoans = loans.filter(l => l.status === 'PAID');

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              Prestiti e Rimborsi
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Gestisci i tuoi prestiti e la rubrica contatti
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setSelectedContact(undefined);
                setContactForm({ name: '', email: '', phone: '', notes: '' });
                setShowContactModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              <UserIcon className="w-5 h-5" />
              <span>Nuovo Contatto</span>
            </button>

            <button
              onClick={() => {
                setSelectedLoan(undefined);
                setLoanForm({
                  type: 'LENT',
                  amount: '',
                  description: '',
                  notes: '',
                  loanDate: new Date().toISOString().split('T')[0],
                  dueDate: '',
                  contactId: contacts[0]?.id || '',
                });
                setShowLoanModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Nuovo Prestito</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Crediti Attivi</p>
                  <p className="text-3xl font-bold mt-1">{formatCurrency(summary.totalLent)}</p>
                  <p className="text-green-100 text-sm mt-2">
                    {summary.activeLentCount} prestit{summary.activeLentCount === 1 ? 'o' : 'i'}
                  </p>
                </div>
                <ArrowUpIcon className="w-12 h-12 text-green-200 opacity-50" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Debiti Attivi</p>
                  <p className="text-3xl font-bold mt-1">{formatCurrency(summary.totalBorrowed)}</p>
                  <p className="text-red-100 text-sm mt-2">
                    {summary.activeBorrowedCount} debit{summary.activeBorrowedCount === 1 ? 'o' : 'i'}
                  </p>
                </div>
                <ArrowDownIcon className="w-12 h-12 text-red-200 opacity-50" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`bg-gradient-to-br ${
                summary.netBalance >= 0
                  ? 'from-blue-500 to-blue-600'
                  : 'from-orange-500 to-orange-600'
              } rounded-2xl p-6 text-white shadow-lg`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">Bilancio Netto</p>
                  <p className="text-3xl font-bold mt-1">{formatCurrency(summary.netBalance)}</p>
                  <p className="text-white/80 text-sm mt-2">
                    {summary.netBalance >= 0 ? 'In credito' : 'In debito'}
                  </p>
                </div>
                <BanknotesIcon className="w-12 h-12 text-white/30" />
              </div>
            </motion.div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('loans')}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === 'loans'
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Prestiti ({loans.length})
          </button>
          <button
            onClick={() => setActiveTab('contacts')}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === 'contacts'
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Contatti ({contacts.length})
          </button>
        </div>

        {/* Loans Tab */}
        {activeTab === 'loans' && (
          <div className="space-y-6">
            {/* Active Loans */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                Prestiti Attivi ({activeLoans.length})
              </h3>

              {activeLoans.length === 0 ? (
                <p className="text-center py-8 text-slate-600 dark:text-slate-400">
                  Nessun prestito attivo
                </p>
              ) : (
                <div className="space-y-3">
                  {activeLoans.map(loan => (
                    <motion.div
                      key={loan.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            loan.type === 'LENT'
                              ? 'bg-green-100 dark:bg-green-900/30'
                              : 'bg-red-100 dark:bg-red-900/30'
                          }`}
                        >
                          {loan.type === 'LENT' ? (
                            <ArrowUpIcon
                              className={`w-6 h-6 ${
                                loan.type === 'LENT'
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-red-600 dark:text-red-400'
                              }`}
                            />
                          ) : (
                            <ArrowDownIcon
                              className={`w-6 h-6 ${
                                loan.type === 'BORROWED'
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-green-600 dark:text-green-400'
                              }`}
                            />
                          )}
                        </div>

                        <div className="flex-1">
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {loan.description}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {loan.contact.name} • {formatDateShort(loan.loanDate)}
                            {loan.dueDate && ` • Scadenza: ${formatDateShort(loan.dueDate)}`}
                          </p>
                          {loan.notes && (
                            <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                              {loan.notes}
                            </p>
                          )}
                          <div className="mt-2">
                            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                              <span>Rimanente: {formatCurrency(loan.remainingAmount)}</span>
                              <span>•</span>
                              <span>Originale: {formatCurrency(loan.amount)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p
                            className={`text-xl font-bold ${
                              loan.type === 'LENT'
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {loan.type === 'LENT' ? '+' : '-'}
                            {formatCurrency(loan.remainingAmount)}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRecordPayment(loan)}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Registra Pagamento"
                          >
                            <BanknotesIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleMarkAsPaid(loan)}
                            className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                            title="Segna come Pagato"
                          >
                            <CheckIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteLoan(loan)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Elimina"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Paid Loans */}
            {paidLoans.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                  Prestiti Completati ({paidLoans.length})
                </h3>
                <div className="space-y-2">
                  {paidLoans.map(loan => (
                    <div
                      key={loan.id}
                      className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-xl opacity-60"
                    >
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {loan.description}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {loan.contact.name} • {formatDateShort(loan.loanDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                          ✓ Pagato
                        </span>
                        <span className="text-slate-600 dark:text-slate-400">
                          {formatCurrency(loan.amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Contacts Tab */}
        {activeTab === 'contacts' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              Rubrica Contatti ({contacts.length})
            </h3>

            {contacts.length === 0 ? (
              <p className="text-center py-8 text-slate-600 dark:text-slate-400">
                Nessun contatto salvato
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contacts.map(contact => (
                  <motion.div
                    key={contact.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-white truncate">
                            {contact.name}
                          </p>
                          {contact.email && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                              {contact.email}
                            </p>
                          )}
                          {contact.phone && (
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {contact.phone}
                            </p>
                          )}
                          {contact._count && contact._count.loans > 0 && (
                            <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">
                              {contact._count.loans} prestit{contact._count.loans === 1 ? 'o' : 'i'}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setSelectedContact(contact);
                            setContactForm({
                              name: contact.name,
                              email: contact.email || '',
                              phone: contact.phone || '',
                              notes: contact.notes || '',
                            });
                            setShowContactModal(true);
                          }}
                          className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteContact(contact)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {contact.notes && (
                      <p className="text-sm text-slate-500 dark:text-slate-500 mt-2 line-clamp-2">
                        {contact.notes}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowContactModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={e => e.stopPropagation()}
            className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {selectedContact ? 'Modifica Contatto' : 'Nuovo Contatto'}
              </h3>
              <button
                onClick={() => setShowContactModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Nome *
                </label>
                <input
                  type="text"
                  required
                  value={contactForm.name}
                  onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={contactForm.email}
                  onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Telefono
                </label>
                <input
                  type="tel"
                  value={contactForm.phone}
                  onChange={e => setContactForm({ ...contactForm, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Note
                </label>
                <textarea
                  value={contactForm.notes}
                  onChange={e => setContactForm({ ...contactForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowContactModal(false)}
                  className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={handleSaveContact}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg"
                >
                  {selectedContact ? 'Aggiorna' : 'Crea'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Loan Modal */}
      {showLoanModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowLoanModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={e => e.stopPropagation()}
            className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {selectedLoan ? 'Modifica Prestito' : 'Nuovo Prestito'}
              </h3>
              <button
                onClick={() => setShowLoanModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Tipo
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setLoanForm({ ...loanForm, type: 'LENT' })}
                    className={`px-4 py-3 rounded-xl font-medium transition-all ${
                      loanForm.type === 'LENT'
                        ? 'bg-green-500 text-white shadow-lg'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    ⬆️ Ho prestato
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoanForm({ ...loanForm, type: 'BORROWED' })}
                    className={`px-4 py-3 rounded-xl font-medium transition-all ${
                      loanForm.type === 'BORROWED'
                        ? 'bg-red-500 text-white shadow-lg'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    ⬇️ Ho ricevuto
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Contatto *
                </label>
                <select
                  required
                  value={loanForm.contactId}
                  onChange={e => setLoanForm({ ...loanForm, contactId: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Seleziona contatto</option>
                  {contacts.map(contact => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Importo *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={loanForm.amount}
                  onChange={e => setLoanForm({ ...loanForm, amount: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Descrizione *
                </label>
                <input
                  type="text"
                  required
                  value={loanForm.description}
                  onChange={e => setLoanForm({ ...loanForm, description: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500"
                  placeholder="Es: Prestito per emergenza"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Data Prestito
                </label>
                <input
                  type="date"
                  value={loanForm.loanDate}
                  onChange={e => setLoanForm({ ...loanForm, loanDate: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Data Scadenza (opzionale)
                </label>
                <input
                  type="date"
                  value={loanForm.dueDate}
                  onChange={e => setLoanForm({ ...loanForm, dueDate: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Note
                </label>
                <textarea
                  value={loanForm.notes}
                  onChange={e => setLoanForm({ ...loanForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowLoanModal(false)}
                  className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={handleSaveLoan}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg"
                >
                  {selectedLoan ? 'Aggiorna' : 'Crea'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </Layout>
  );
}
