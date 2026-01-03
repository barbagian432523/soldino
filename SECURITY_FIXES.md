# 🔒 Security Fixes - DA IMPLEMENTARE PRIMA DI PRODUZIONE

## ⚠️ VULNERABILITÀ CRITICHE

### 1. JWT Secret Obbligatorio e Forte

**File**: `backend/src/config/env.ts`

**Problema**: Il fallback a 'your-secret-key' è PERICOLOSO

**Fix**:
```typescript
// backend/src/config/env.ts
export const config = {
  // ...
  jwt: {
    secret: process.env.JWT_SECRET, // RIMUOVI il fallback || 'your-secret-key'
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
};

// Aggiungi validazione
if (!config.jwt.secret) {
  throw new Error('JWT_SECRET è obbligatorio! Configura il file .env');
}
```

**Genera secret forte**:
```bash
# Genera un secret cryptograficamente sicuro
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Aggiungi al `.env`:
```
JWT_SECRET=<output_del_comando_sopra>
```

---

### 2. Rate Limiting per Prevenire Brute Force

**Installa**:
```bash
npm install express-rate-limit
```

**Implementa** in `backend/src/index.ts`:
```typescript
import rateLimit from 'express-rate-limit';

// Rate limiter generale
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 100, // 100 richieste per IP
  message: 'Troppe richieste da questo IP, riprova tra 15 minuti',
});

// Rate limiter severo per login
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Solo 5 tentativi di login
  skipSuccessfulRequests: true,
});

app.use('/api', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
```

---

### 3. Helmet per Security Headers

**Installa**:
```bash
npm install helmet
```

**Implementa** in `backend/src/index.ts`:
```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

---

### 4. CORS Sicuro per Produzione

**File**: `backend/src/config/env.ts`

Aggiungi:
```typescript
export const config = {
  // ...
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:5173',
  },
};
```

**File**: `backend/src/index.ts`
```typescript
app.use(cors({
  origin: config.nodeEnv === 'production'
    ? config.frontend.url  // Solo URL produzione
    : ['http://localhost:5173', 'http://localhost:5174', 'http://192.168.177.25:5173', 'http://192.168.177.25:5174'],
  credentials: true,
  optionsSuccessStatus: 200
}));
```

---

### 5. HTTPS con Reverse Proxy (Nginx)

**Setup Nginx** (su server produzione):
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Ottieni certificato SSL gratis**:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

### 6. Validazione Input Aggiuntiva

**Installa**:
```bash
npm install express-validator
```

**Esempio** per login:
```typescript
import { body, validationResult } from 'express-validator';

router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // ... login logic
  }
);
```

---

### 7. Logging e Monitoring

**Installa Winston**:
```bash
npm install winston
```

**Setup** `backend/src/utils/logger.ts`:
```typescript
import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}
```

---

### 8. Environment Variables Produzione

**File**: `backend/.env.production` (NON committare!)
```env
NODE_ENV=production
PORT=3001
JWT_SECRET=<secret_forte_64_caratteri>
JWT_EXPIRES_IN=7d
DATABASE_URL=postgresql://user:password@localhost:5432/lighthouse_money_prod
FRONTEND_URL=https://yourdomain.com
UPLOAD_DIR=/var/www/lighthouse/uploads
MAX_FILE_SIZE=10485760
```

---

## ✅ CHECKLIST PRE-PRODUZIONE

- [ ] JWT_SECRET forte e obbligatorio
- [ ] Rate limiting implementato
- [ ] Helmet security headers
- [ ] CORS configurato per produzione
- [ ] HTTPS con certificati SSL validi
- [ ] Validazione input su tutte le route
- [ ] Logging e monitoring attivo
- [ ] Database backup automatici
- [ ] File .env.production NON committato
- [ ] Test di penetrazione eseguiti
- [ ] Dependency audit (`npm audit fix`)
- [ ] Docker con utente non-root
- [ ] Firewall configurato

---

## 🚀 DEPLOY SICURO

### Build Produzione

**Backend**:
```bash
npm run build
NODE_ENV=production node dist/index.js
```

**Frontend**:
```bash
npm run build
# Servi con nginx o servizio statico
```

### PM2 per Backend (Process Manager)
```bash
npm install -g pm2
pm2 start dist/index.js --name lighthouse-backend
pm2 startup
pm2 save
```

---

## ⚠️ NON ESPORRE A INTERNET FINO A:

1. Tutte le vulnerabilità critiche risolte
2. HTTPS configurato
3. Rate limiting attivo
4. Backup database configurati
5. Monitoring e alerting attivi
