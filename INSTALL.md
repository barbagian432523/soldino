# 🚀 Guida Installazione Rapida - Soldino

## Installazione in 5 Minuti

### 1. Clone e Installazione
```bash
git clone <repository-url>
cd soldino

# Installa tutte le dipendenze
npm install
```

### 2. Setup Database
```bash
# Avvia PostgreSQL con Docker
docker-compose up -d

# Attendi che il database sia pronto (circa 10 secondi)
```

### 3. Configura Backend
```bash
cd backend

# Crea il file .env (già presente con valori di default)
# IMPORTANTE: Aggiungi la tua OPENAI_API_KEY nel file backend/.env
# Puoi ottenerla da: https://platform.openai.com/api-keys

# Inizializza database
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

cd ..
```

### 4. Avvia Applicazione
```bash
# Dalla root del progetto
npm run dev
```

### 5. Accedi all'app
- Apri il browser su: **http://localhost:5173**
- Crea il tuo account
- Inizia a tracciare le spese!

## ⚙️ Configurazione OpenAI (OCR Ricevute)

Per utilizzare la funzione di scansione ricevute:

1. Vai su https://platform.openai.com/api-keys
2. Crea una nuova API Key
3. Apri `backend/.env`
4. Sostituisci `your-openai-api-key-here` con la tua chiave

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
```

**Nota**: Senza API Key, l'app funziona comunque ma la scansione ricevute sarà disabilitata.

## 🐛 Troubleshooting

### Porta 5432 già in uso
Se PostgreSQL è già installato sul tuo sistema:
```bash
# Modifica la porta in docker-compose.yml
ports:
  - "5433:5432"  # Usa 5433 invece di 5432

# Aggiorna DATABASE_URL in backend/.env
DATABASE_URL="postgresql://soldino:soldino_dev_password@localhost:5433/soldino?schema=public"
```

### Errori di migrazione Prisma
```bash
cd backend
rm -rf node_modules prisma/migrations
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### Il frontend non si connette al backend
Verifica che il backend sia in esecuzione su porta 3001:
```bash
curl http://localhost:3001/health
# Dovresti vedere: {"status":"ok",...}
```

## 📦 Build per Produzione

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
# Servi la cartella dist/ con nginx/caddy
```

## 🎯 Prossimi Passi

1. **Crea il primo Account**: Dashboard → "Nuovo Conto"
2. **Aggiungi una Spesa**: Dashboard → "Nuova Spesa"
3. **Prova l'OCR**: Dashboard → "Scansiona Ricevuta" → Carica foto ricevuta
4. **Esplora Statistiche**: Menu → Statistiche

## 💡 Tips

- Le categorie di default sono già configurate (Alimentari, Ristoranti, etc.)
- Puoi creare categorie personalizzate dalla sezione Impostazioni
- Usa i filtri nella pagina Spese per ricerche avanzate
- Il grafico a torta mostra la distribuzione delle spese per categoria

## 🆘 Supporto

Se riscontri problemi:
1. Controlla i log del backend: guarda il terminale dove hai eseguito `npm run dev`
2. Apri gli strumenti sviluppatore del browser (F12)
3. Verifica che PostgreSQL sia in esecuzione: `docker ps`

Buon tracciamento delle spese! 💰
