#!/bin/bash

echo "🚀 Soldino - Setup Automatico"
echo "================================"
echo ""

# Colori per output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verifica prerequisiti
echo -e "${BLUE}📋 Verifica prerequisiti...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠️  Node.js non trovato. Installa Node.js 18+ da https://nodejs.org${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${YELLOW}⚠️  npm non trovato.${NC}"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker non trovato (opzionale, ma consigliato per PostgreSQL)${NC}"
fi

echo -e "${GREEN}✅ Prerequisiti OK${NC}"
echo ""

# Installa dipendenze
echo -e "${BLUE}📦 Installazione dipendenze...${NC}"
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
echo -e "${GREEN}✅ Dipendenze installate${NC}"
echo ""

# Setup database
echo -e "${BLUE}🗄️  Setup database...${NC}"
if command -v docker &> /dev/null; then
    echo "Avvio PostgreSQL con Docker..."
    docker-compose up -d
    echo "Attendi 10 secondi per l'avvio del database..."
    sleep 10
    echo -e "${GREEN}✅ PostgreSQL avviato${NC}"
else
    echo -e "${YELLOW}⚠️  Docker non disponibile. Assicurati che PostgreSQL sia in esecuzione su localhost:5432${NC}"
fi
echo ""

# Prisma setup
echo -e "${BLUE}🔧 Configurazione Prisma...${NC}"
cd backend

# Controlla se .env esiste, altrimenti copia da .env.example
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${YELLOW}⚠️  File .env creato. IMPORTANTE: Aggiungi la tua OPENAI_API_KEY in backend/.env${NC}"
fi

npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

cd ..
echo -e "${GREEN}✅ Database configurato${NC}"
echo ""

# Messaggio finale
echo -e "${GREEN}🎉 Setup completato!${NC}"
echo ""
echo -e "${BLUE}📝 Prossimi passi:${NC}"
echo "1. Aggiungi la tua OPENAI_API_KEY in backend/.env"
echo "   Ottienila da: https://platform.openai.com/api-keys"
echo ""
echo "2. Avvia l'applicazione:"
echo -e "   ${YELLOW}npm run dev${NC}"
echo ""
echo "3. Apri il browser su:"
echo -e "   ${YELLOW}http://localhost:5173${NC}"
echo ""
echo -e "${GREEN}Buon tracciamento delle spese! 💰${NC}"
