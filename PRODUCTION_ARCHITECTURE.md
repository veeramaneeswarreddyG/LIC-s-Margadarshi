# 🚀 LIC Margadarshi - Production-Grade Financial AI Application

## 📋 Architecture Overview

This is a **financial-grade intelligent assistant** for Life Insurance Corporation (LIC) policy management, built with:

- **Backend**: Next.js + Node.js
- **Database**: PostgreSQL (primary), Firestore (real-time), Redis (caching)
- **AI**: GPT-4 integration via LIC's Vaani assistant
- **Frontend**: React with Liquid Glass UI design
- **Authentication**: Firebase Auth + JWT

---

## 🗄️ Database Architecture

### PostgreSQL (PRIMARY - Financial Data)

All structured financial data is stored here:

```
users                    # User accounts and profiles
├── id, uid, email, phoneNumber, name, dateOfBirth, etc.

lic_plans               # LIC Plan Master Data (CRITICAL)
├── id, planName, planCode, planType, minAge, maxAge
├── minTerm, maxTerm, minSA, maxSA
├── premiumTable (JSON), benefitStructure (JSON)
├── riderOptions (JSON), features (JSON)

policies               # User policies
├── id, userId, planId, policyNumber
├── sumAssured, policyTerm, premiumFrequency
├── annualPremium, monthlyPremium, startDate, maturityDate

transactions           # All financial transactions
├── type (premium_payment, claim, maturity, refund, surrender)
├── amount, status, paymentMethod, referenceNumber

goals                 # Financial goals tracking
├── userId, goalName, goalType
├── targetAmount, targetDate, currentSavings

calculation_logs      # AUDIT TRAIL - Every calculation
├── userId, planId, policyId
├── calculationType (premium, maturity, comparison)
├── inputData, outputData, formula, precision

ai_conversations      # Vaani chat history
├── userId, conversationTopic, messages (JSON)
├── status (active, archived, resolved)

ai_context_state      # Memory for Vaani
├── userId, currentContext (JSON), agentState, memoryBuffer

ai_action_logs        # Log of all AI-triggered actions
├── conversationId, actionType, actionStatus
├── inputParameters, outputResult, executionTime

ai_recommendations    # AI suggestions
├── userId, planId, recommendationType
├── recommendedPlans (JSON), reasoningLogic, confidenceScore
```

### Redis (CACHING & SESSIONS)

```
vaani:context:{userId}           # Vaani's user context (1h TTL)
premium:{planId}:{params}        # Premium calculations (24h TTL)
maturity:{policyId}              # Maturity values (30d TTL)
user:session:{sessionId}         # Session management (7d TTL)
chat:messages:{conversationId}   # Recent messages (real-time)
```

### Firestore (REAL-TIME UPDATES ONLY)

```
user_sessions         # Active user sessions
notifications         # Real-time notifications
live_chat            # Live chat streaming for support
```

---

## 🧮 Calculation Engine

### Key Principle: NO AI CALCULATIONS

✅ **All calculations come from the backend deterministic engine**

#### Premium Calculation Formula:
```
Annual Premium = (Sum Assured / 1000) × Base Premium Per 1000 × Plan Factor
Adjusted Premium = Annual Premium × Frequency Factor
```

**Example:**
- Plan: LIC Jeevan Shanti
- Age: 35, Gender: Male, Sum Assured: ₹25 Lakhs, Term: 10 years
- Base Premium Per 1000: ₹450 (from DB premium table)
- Annual Premium = (2500000 / 1000) × 450 = ₹11,25,000

**Frequency Adjustment:**
- Annual: 1.0
- Semi-annual: 0.51
- Quarterly: 0.26
- Monthly: 0.087

#### Maturity Calculation:
```
For Endowment Plans:
Maturity Value = Sum Assured + (Total Premiums × Bonus Rate × Years)

For Money-Back Plans:
Maturity Value = Sum Assured + (Periodic Returns × Number of Intervals)

For Pension Plans:
Corpus = Total Premiums × (1 + Accumulation Rate)^Years
Lump Sum = Corpus × 50%
```

---

## 🤖 LIC's Vaani - AI Assistant

### Architecture

```
User Query
    ↓
[Vaani Interface]
    ↓
[LLM (GPT-4)]
    ↓
[Intent Detection]
    ↓
[Action Router]
    ├─→ Calculate Premium API
    ├─→ Calculate Maturity API
    ├─→ Compare Plans API
    ├─→ Fetch Policy Data API
    └─→ Suggest Plans API
    ↓
[Database Calls]
    ↓
[Structured Response]
    ↓
[Store in ai_conversations]
    ↓
[Log in ai_action_logs]
    ↓
[Return to User]
```

### Vaani Capabilities (NON-NEGOTIABLE)

1. **❌ NEVER calculates directly**
   - Always delegates to `/api/calculations/*` endpoints
   
2. **✅ CAN do:**
   - Explain LIC policies in simple terms
   - Help users understand plan features
   - Suggest suitable plans based on goals
   - Guide through claim process
   - Answer FAQs
   - Translate responses to user's language

3. **Context Awareness:**
   - Fetches user's profile
   - Reviews existing policies
   - Checks active goals
   - Maintains conversation history

### Response Format

Every Vaani response is structured:

```json
{
  "type": "text | chart | action | plan | error",
  "message": "Human-readable response",
  "data": { /* structured data */ },
  "action": {
    "type": "calculate_premium | calculate_maturity | compare_plans | etc",
    "params": { /* API parameters */ }
  },
  "confidence": 0.85  // Confidence score 0-1
}
```

---

## 📡 Backend API Routes

### Calculation APIs

```
POST /api/calculations/premium
├─ Input: planId, age, gender, sumAssured, policyTerm, premiumFrequency
└─ Output: annualPremium, frequencyPremium, precision: "exact"

POST /api/calculations/maturity
├─ Input: policyId, premiumAmount, policyTerm, sumAssured, planType
└─ Output: maturityValue, totalBonus, ROI

POST /api/calculations/compare
├─ Input: planIds[], userProfile
└─ Output: ComparisonResult[] sorted by ROI
```

### Vaani APIs

```
GET /api/vaani/init
├─ Initialize Vaani with user context
└─ Returns: conversationId, userProfile, recentPolicies

POST /api/vaani/chat
├─ Input: message, conversationId
└─ Output: VaaniResponse with type, message, action
```

### Policy APIs

```
GET /api/policies
├─ Fetch user's policies
└─ Returns: Policy[]

POST /api/policies/:id/actions
├─ Actions: claim, surrender, revoke, update
└─ Returns: transaction status
```

---

## 🧊 UI/UX - Liquid Glass Design

### Design Principles

1. **Liquid Glass Effect**
   ```css
   background: rgba(255,255,255,0.1);
   backdrop-filter: blur(30px);
   border: 1px solid rgba(255,255,255,0.2);
   box-shadow: 0 8px 32px rgba(0,0,0,0.1);
   ```

2. **Color Palette**
   - Primary: LIC Red (#C8102E)
   - Secondary: Golden (#FFB300)
   - Background: Dark gradient
   - Text: Light with opacity

3. **Micro Interactions**
   - Ripple effect on button press
   - Smooth scale transitions on hover
   - Typing animation for AI responses
   - Skeleton loading states

### Vaani UI Component

Located: `src/components/VaaniChat.tsx`

Features:
- Floating circular button with pulsing glow
- Expands into full chat panel (liquid glass)
- Message history with timestamps
- Typing indicators
- Multi-language support
- Dark/Light theme compatible

---

## 🔐 Security

### Authentication
- Firebase Auth for initial login
- JWT tokens for API calls
- Token expiry: 7 days

### API Protection
```typescript
// All APIs require:
Authorization: Bearer {JWT_TOKEN}
```

### Data Protection
- Encrypted PII fields
- No sensitive data in logs
- Audit trail for all calculations
- Secure password hashing (bcryptjs)

### Validation
- Input validation on all APIs
- Type checking with TypeScript
- Business logic validation on backend
- Age/term/SA range validation

---

## 📊 Performance & Caching

### Response Times (SLA)
- Premium calculation: < 300ms
- Plan comparison: < 500ms
- Vaani response: < 2s
- Policy fetch: < 200ms

### Caching Strategy
```
Premium Calculations:
├─ Cache Key: premium:{planId}:{age}:{gender}:{sumAssured}:{term}
├─ TTL: 24 hours
└─ Invalidation: On plan update

Maturity Calculations:
├─ Cache Key: maturity:{policyId}
├─ TTL: 30 days
└─ Invalidation: On policy update

User Context (Vaani):
├─ Cache Key: vaani:context:{userId}
├─ TTL: 1 hour
└─ Invalidation: On user profile change
```

---

## 🧪 Testing & Validation

### Calculation Validation
All calculations are tested against known LIC values:

```javascript
// Example: Premium calculation test
const result = await calculatePremium({
  planId: "term_plan_001",
  age: 35,
  gender: "male",
  sumAssured: 2500000,  // ₹25 Lakhs
  policyTerm: 10,
  premiumFrequency: "annual"
});

// Expected: Premium should match official LIC table ±0.5%
assert(result.annualPremium > 0);
assert(result.precision === "exact");
```

### Edge Cases Covered
✅ Age limits (min/max)
✅ Term limits (min/max)
✅ Sum Assured limits
✅ Gender variations
✅ Frequency adjustments
✅ Plan type variations

---

## 📈 Audit & Compliance

### Calculation Audit Trail
Every calculation is logged:

```
calculation_logs entry:
├─ userId
├─ planId
├─ calculationType (premium/maturity/comparison)
├─ inputData (full input JSON)
├─ outputData (full result JSON)
├─ formula (calculation formula used)
├─ status (success/error)
├─ precision (exact/approximation)
└─ timestamp
```

### Vaani Audit Trail
Every AI action is logged:

```
ai_action_logs entry:
├─ conversationId
├─ actionType (calculate_premium, compare_plans, etc)
├─ actionStatus (initiated/in_progress/completed/failed)
├─ inputParameters
├─ outputResult
├─ executionTime (ms)
└─ timestamp
```

---

## 🚀 Deployment

### Environment Variables
```bash
# Database
DATABASE_URL="postgresql://user:pass@host/db"
REDIS_URL="redis://host:6379"

# Firebase (existing)
NEXT_PUBLIC_FIREBASE_API_KEY="..."
NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."

# AI
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4-turbo"

# Security
JWT_SECRET="your-secret-key"
API_SECRET="your-api-secret"

# Configuration
ENABLE_STRICT_CALCULATIONS="true"
CALCULATION_TIMEOUT="5000"
```

### Database Setup
```bash
# Initialize Prisma
npx prisma init

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed sample data (optional)
npx prisma db seed
```

---

## 📦 Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript |
| Backend | Node.js, Express (Next.js API Routes) |
| Database | PostgreSQL (primary), Firestore (real-time), Redis (cache) |
| ORM | Prisma |
| AI | OpenAI GPT-4 |
| Authentication | Firebase Auth + JWT |
| UI Framework | Tailwind CSS, Lucide Icons |
| i18n | i18next + react-i18next |

---

## 🎯 Next Steps

1. **Database Setup**
   - Deploy PostgreSQL instance
   - Run Prisma migrations
   - Seed master data (LIC plans)

2. **Backend Deployment**
   - Deploy to production
   - Configure environment variables
   - Set up Redis cluster

3. **Frontend Optimization**
   - Optimize bundle size
   - Implement Progressive Web App
   - Set up CDN

4. **Testing**
   - Add unit tests for calculations
   - Integration tests for APIs
   - Load testing for scale

5. **Monitoring**
   - Set up error logging (Sentry)
   - API performance monitoring
   - User analytics

---

## 📞 Support

For questions or issues:
- Check API documentation
- Review calculation engine logic
- Check audit logs (calculation_logs, ai_action_logs)
- Test with sample data first

---

**Built with ❤️ for precise, trustworthy financial guidance**
