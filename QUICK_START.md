# 🚀 LIC Margadarshi - Quick Integration Guide

## Phase 1: Setup (30 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up PostgreSQL

**Option A: Local Development**
```bash
# Install PostgreSQL locally
# macOS:
brew install postgresql@15

# Start PostgreSQL
brew services start postgresql@15

# Create database
createdb lic_margadarshi

# Update .env.local
DATABASE_URL="postgresql://postgres:password@localhost:5432/lic_margadarshi"
```

**Option B: Docker (Recommended)**
```bash
# docker-compose.yml
version: '3.9'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: lic_margadarshi
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:

# Run:
docker-compose up -d
```

### 3. Set Up Prisma
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Seed master data
npx ts-node prisma/seed.ts
```

### 4. Configure Environment Variables
```bash
# .env.local
DATABASE_URL="postgresql://..."
REDIS_URL="redis://localhost:6379"
OPENAI_API_KEY="sk-your-key"
JWT_SECRET="your-secret-key"

# Keep existing Firebase config
NEXT_PUBLIC_FIREBASE_API_KEY="..."
```

### 5. Start Development Server
```bash
npm run dev
```

Visit: http://localhost:3000

---

## Phase 2: Testing the Calculations

### Test Premium Calculation
```bash
curl -X POST http://localhost:3000/api/calculations/premium \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "lic_jeevan_term_001",
    "age": 35,
    "gender": "male",
    "sumAssured": 2500000,
    "policyTerm": 10,
    "premiumFrequency": "annual"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "planId": "lic_jeevan_term_001",
    "planName": "LIC Jeevan Term Plan",
    "annualPremium": 11250,
    "frequencyPremium": 11250,
    "premiumFrequency": "annual",
    "basePremiumPer1000": 4.5,
    "calculatedAt": "2025-04-24T10:30:00Z",
    "precision": "exact"
  }
}
```

### Test Maturity Calculation
```bash
curl -X POST http://localhost:3000/api/calculations/maturity \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "policyId": "pol_12345",
    "premiumAmount": 11250,
    "policyTerm": 10,
    "sumAssured": 2500000,
    "planType": "Endowment"
  }'
```

### Test Plan Comparison
```bash
curl -X POST http://localhost:3000/api/calculations/compare \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planIds": ["term_plan_001", "endowment_plan_001", "pension_plan_001"],
    "userProfile": {
      "age": 35,
      "gender": "male",
      "sumAssured": 2500000,
      "policyTerm": 10
    }
  }'
```

---

## Phase 3: Setting Up Vaani AI

### 1. Get OpenAI API Key
```bash
# Visit: https://platform.openai.com/api-keys
# Create new secret key
# Add to .env.local:
OPENAI_API_KEY="sk-..."
```

### 2. Initialize Vaani
```bash
curl -X GET http://localhost:3000/api/vaani/init \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Send Message to Vaani
```bash
curl -X POST http://localhost:3000/api/vaani/chat \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What premium would I pay for LIC Jeevan Term Plan with ₹25 lakhs coverage for 10 years?",
    "conversationId": "conv_123"
  }'
```

---

## Phase 4: UI Integration

### Add Bottom Navigation
```tsx
// In your layout.tsx
import BottomNavigation from '@/components/BottomNavigation';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <BottomNavigation />
      </body>
    </html>
  );
}
```

### Add Vaani Chat
```tsx
// In your main page/dashboard
import VaaniChat from '@/components/VaaniChat';
import { useState } from 'react';

export default function Page() {
  const [vaaniOpen, setVaaniOpen] = useState(false);

  return (
    <div>
      {/* Your content */}
      <VaaniChat 
        isOpen={vaaniOpen}
        onClose={() => setVaaniOpen(false)}
        conversationId="conv_123"
        authToken="YOUR_JWT_TOKEN"
      />
    </div>
  );
}
```

---

## Phase 5: Database Audit

### Check Calculation Logs
```sql
SELECT * FROM "CalculationLog" 
WHERE calculationType = 'premium' 
ORDER BY "createdAt" DESC 
LIMIT 10;
```

### Check AI Conversations
```sql
SELECT * FROM "AIConversation" 
WHERE "userId" = 'user_id' 
ORDER BY "createdAt" DESC;
```

### Check AI Actions
```sql
SELECT * FROM "AIActionLog" 
WHERE "conversationId" = 'conv_123' 
ORDER BY "createdAt" DESC;
```

---

## Troubleshooting

### ❌ "Module not found: Can't resolve '@/lib/calculationEngine'"
**Solution:** Ensure TypeScript is configured correctly
```bash
npx tsc --noEmit
```

### ❌ "Prisma Client not found"
**Solution:** Generate Prisma client
```bash
npx prisma generate
```

### ❌ "Unable to connect to PostgreSQL"
**Solution:** Check connection string
```bash
psql $DATABASE_URL
```

### ❌ "OpenAI API rate limit exceeded"
**Solution:** Check API usage at https://platform.openai.com/account/usage

### ❌ "Redis connection failed"
**Solution:** Ensure Redis is running
```bash
# Check Redis
redis-cli ping
# Should return: PONG
```

---

## Production Checklist

- [ ] PostgreSQL deployed on managed service (AWS RDS, Azure DB)
- [ ] Redis cluster set up (AWS ElastiCache, Redis Cloud)
- [ ] Environment variables configured
- [ ] SSL/TLS certificates installed
- [ ] JWT_SECRET changed to strong key
- [ ] Database backups configured
- [ ] Error logging (Sentry) set up
- [ ] Performance monitoring enabled
- [ ] Rate limiting configured
- [ ] User authentication tested
- [ ] Calculations validated against LIC tables
- [ ] Audit logs reviewed
- [ ] Security penetration testing completed

---

## Performance Optimization

### Enable Query Caching
```typescript
// src/lib/database.ts
const prisma = new PrismaClient({
  log: ['warn', 'error'],
});
```

### Enable Redis Clustering
```bash
# For high-scale production
redis-cli --cluster create node1:6379 node2:6379 node3:6379
```

### Database Indexing
```sql
-- Add indexes for frequent queries
CREATE INDEX idx_user_id ON policies(userId);
CREATE INDEX idx_plan_id ON policies(planId);
CREATE INDEX idx_calculation_type ON calculation_logs(calculationType);
CREATE INDEX idx_conversation_user ON ai_conversations(userId);
```

---

## Monitoring & Alerts

### Set Up Error Alerts
```bash
# .env.local
SENTRY_DSN="https://..."
```

### Monitor API Response Times
```typescript
// src/middleware.ts
const start = Date.now();
// ... API call ...
const duration = Date.now() - start;
if (duration > 300) {
  console.warn(`Slow API: ${duration}ms`);
}
```

---

## Support Resources

- **Prisma Docs:** https://www.prisma.io/docs
- **OpenAI API:** https://platform.openai.com/docs
- **PostgreSQL Docs:** https://www.postgresql.org/docs
- **Redis Docs:** https://redis.io/docs
- **Next.js Docs:** https://nextjs.org/docs

---

**Happy building! 🎉**
