# 💰 Soldino - Expense Tracker

Un portale web moderno e completo per il tracciamento delle spese personali con intelligenza artificiale integrata.

## ✨ Caratteristiche Principali

### 🎯 Funzionalità Core
- **Autenticazione Completa**: Registrazione e login con JWT
- **Gestione Multi-Account**: Supporto per conti correnti, portafogli contanti, carte di credito, risparmi
- **Tracciamento Spese**: CRUD completo con categorizzazione automatica
- **Ricerca Avanzata**: Filtri per categoria, account, tipo, data e ricerca testuale
- **Allegati Multi-Formato**: Upload di ricevute in JPG, PNG, PDF, DOCX

### 🤖 Intelligenza Artificiale
- **OCR Ricevute**: Scansione automatica tramite GPT-4 Vision
- **Riconoscimento Automatico**: Estrazione di importo, data, commerciante, categoria
- **Creazione Assistita**: Generazione spese con supervisione utente
- **Confidence Score**: Indicatore di accuratezza dell'AI

### 🎨 Interfaccia Utente
- **Design Moderno**: UI pulita e professionale con Tailwind CSS
- **Responsive**: Ottimizzata per smartphone, tablet e desktop
- **Animazioni Fluide**: Transizioni smooth con Framer Motion
- **Dashboard Interattiva**: Grafici e statistiche in tempo reale
- **Dark Mode Ready**: Preparata per tema scuro (futura implementazione)

### 📊 Analytics
- **Statistiche Dettagliate**: Analisi spese per categoria
- **Grafici Interattivi**: Visualizzazioni con Recharts
- **Report Personalizzati**: Filtraggio per periodo e account
- **Export Dati**: Preparato per esportazione CSV/Excel

## 🏗️ Architettura Tecnica

### Frontend
```
React 18 + TypeScript
├── Vite - Build tool veloce
├── Tailwind CSS - Styling utility-first
├── Framer Motion - Animazioni
├── Zustand - State management
├── React Hook Form + Zod - Form e validazione
├── Recharts - Grafici statistiche
└── Axios - HTTP client
```

### Backend
```
Node.js + Express + TypeScript
├── Prisma - ORM type-safe
├── PostgreSQL - Database relazionale
├── JWT - Autenticazione
├── Bcrypt - Hashing password
├── Multer - Upload file
├── OpenAI GPT-4 Vision - OCR ricevute
└── Zod - Validazione runtime
```

## 🚀 Quick Start

### Prerequisiti
- Node.js 18+
- PostgreSQL 14+
- npm o yarn
- OpenAI API Key (per OCR)

### Installazione

1. **Clone repository**
```bash
git clone <repository-url>
cd soldino
```

2. **Installa dipendenze**
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

3. **Setup Database**
```bash
# Avvia PostgreSQL con Docker
docker-compose up -d

# O usa la tua istanza PostgreSQL
# Assicurati che sia in ascolto su localhost:5432
```

4. **Configura Backend**
```bash
cd backend
cp .env.example .env

# Modifica .env e aggiungi:
# - DATABASE_URL (se usi DB custom)
# - OPENAI_API_KEY (obbligatorio per OCR)
# - JWT_SECRET (cambia in produzione)

# Genera Prisma Client e crea database
npm run prisma:generate
npm run prisma:migrate

# Popola categorie di default
npm run prisma:seed
```

5. **Avvia Applicazione**
```bash
# Dalla root del progetto
npm run dev

# Il frontend sarà su http://localhost:5173
# Il backend sarà su http://localhost:3001
```

## 📖 Utilizzo

### Primo Accesso

1. **Registrazione**: Vai su http://localhost:5173 e crea un account
2. **Crea Account**: Aggiungi il tuo primo conto corrente o portafoglio
3. **Aggiungi Spese**: Inizia a tracciare le tue spese manualmente o...
4. **Scansiona Ricevuta**: Usa il pulsante "Scansiona Ricevuta" per upload automatico!

### Scansione Ricevute con AI

1. Click su **"Scansiona Ricevuta"** dalla dashboard
2. Carica un'immagine della ricevuta (JPG, PNG)
3. L'AI analizzerà automaticamente:
   - Importo totale
   - Data transazione
   - Nome commerciante
   - Categoria suggerita
   - Descrizione
4. Verifica i dati estratti
5. Click su **"Crea Spesa"** per salvare

### Ricerca e Filtri

1. Vai nella sezione **"Spese"**
2. Usa la barra di ricerca per trovare spese
3. Applica filtri per:
   - Categoria (Alimentari, Ristoranti, etc.)
   - Account/Portafoglio
   - Tipo (Spesa/Entrata)
   - Periodo temporale

### Visualizza Statistiche

1. Apri la sezione **"Statistiche"**
2. Visualizza:
   - Totale spese/entrate
   - Grafico a torta per categoria
   - Top 5 categorie
   - Tabella dettagliata transazioni

## 🗂️ Struttura Progetto

```
soldino/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Business logic
│   │   ├── routes/         # API endpoints
│   │   ├── middleware/     # Auth, upload, etc.
│   │   ├── services/       # OCR service
│   │   ├── config/         # DB, env config
│   │   └── types/          # TypeScript types
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── seed.ts         # Default data
│   └── uploads/            # File uploads
│
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Route pages
│   │   ├── store/          # Zustand stores
│   │   ├── services/       # API client
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Helper functions
│   └── public/
│
├── docker-compose.yml      # PostgreSQL setup
└── README.md
```

## 🔑 API Endpoints

### Auth
- `POST /api/auth/register` - Registrazione utente
- `POST /api/auth/login` - Login utente
- `GET /api/auth/me` - Profilo utente (auth)

### Accounts
- `GET /api/accounts` - Lista account (auth)
- `POST /api/accounts` - Crea account (auth)
- `PUT /api/accounts/:id` - Aggiorna account (auth)
- `DELETE /api/accounts/:id` - Elimina account (auth)
- `GET /api/accounts/stats` - Statistiche account (auth)

### Categories
- `GET /api/categories` - Lista categorie (auth)
- `POST /api/categories` - Crea categoria custom (auth)
- `PUT /api/categories/:id` - Aggiorna categoria (auth)
- `DELETE /api/categories/:id` - Elimina categoria (auth)

### Expenses
- `GET /api/expenses` - Lista spese con filtri (auth)
- `GET /api/expenses/:id` - Dettaglio spesa (auth)
- `POST /api/expenses` - Crea spesa (auth)
- `PUT /api/expenses/:id` - Aggiorna spesa (auth)
- `DELETE /api/expenses/:id` - Elimina spesa (auth)
- `GET /api/expenses/stats` - Statistiche spese (auth)

### Upload & OCR
- `POST /api/upload/analyze-receipt` - Analizza ricevuta con AI (auth)
- `POST /api/upload/create-from-receipt` - Crea spesa da ricevuta (auth)
- `POST /api/expenses/:id/attachments` - Upload allegato (auth)
- `DELETE /api/attachments/:id` - Elimina allegato (auth)

## 🎨 Personalizzazione

### Colori Tema
Modifica `frontend/tailwind.config.js`:
```javascript
colors: {
  primary: {
    500: '#0ea5e9', // Colore principale
    600: '#0284c7',
    // ...
  }
}
```

### Categorie Default
Modifica `backend/prisma/seed.ts` per aggiungere/modificare categorie predefinite.

## 🔒 Sicurezza

- ✅ Password hashate con bcrypt
- ✅ JWT per autenticazione stateless
- ✅ Validazione input con Zod
- ✅ CORS configurato
- ✅ File upload con whitelist MIME types
- ✅ SQL injection protection (Prisma)
- ⚠️ HTTPS obbligatorio in produzione
- ⚠️ Rate limiting da implementare per produzione

## 🚢 Deploy Production

### Backend
1. Setup PostgreSQL production
2. Configura variabili ambiente:
   - `DATABASE_URL`
   - `JWT_SECRET` (random string sicura)
   - `OPENAI_API_KEY`
   - `NODE_ENV=production`
3. Build: `npm run build`
4. Start: `npm start`

### Frontend
1. Configura `VITE_API_URL` per backend
2. Build: `npm run build`
3. Servi `dist/` con nginx/caddy

### Suggested Platforms
- **Backend**: Railway, Render, Fly.io
- **Frontend**: Vercel, Netlify, Cloudflare Pages
- **Database**: Supabase, Neon, Railway PostgreSQL

## 🤝 Contribuire

1. Fork il progetto
2. Crea feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push branch (`git push origin feature/AmazingFeature`)
5. Apri Pull Request

## 📝 TODO Future Features

- [ ] Export dati CSV/Excel
- [ ] Grafici trend temporali
- [ ] Budget mensili con alert
- [ ] Categorie personalizzabili con sottocategorie
- [ ] Multi-currency con conversione automatica
- [ ] Recurring expenses/income
- [ ] Mobile app (React Native)
- [ ] Dark mode
- [ ] Email notifications
- [ ] Two-factor authentication
- [ ] API pubblica con rate limiting
- [ ] Backup automatici

## 📄 License

MIT License - vedi LICENSE file per dettagli

## 👨‍💻 Autore

Creato con ❤️ per semplificare la gestione delle finanze personali

---

**⚡ Powered by:**
- React + TypeScript
- Node.js + Express
- PostgreSQL + Prisma
- OpenAI GPT-4 Vision
- Tailwind CSS + Framer Motion

**🌟 Se ti piace il progetto, lascia una stella!**
