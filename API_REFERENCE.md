# 📡 LIC Margadarshi - Complete API Reference

## Base URL
```
http://localhost:3000/api
https://api.licmargadarshi.com (production)
```

## Authentication
All endpoints require JWT token in header:
```
Authorization: Bearer {JWT_TOKEN}
```

---

## 🧮 CALCULATIONS API

### 1. Calculate Premium

**Endpoint:** `POST /calculations/premium`

**Purpose:** Calculate annual and frequency-adjusted premium for a plan

**Request:**
```json
{
  "planId": "string",           // Plan UUID
  "age": "number",              // Age of proposer (18-65)
  "gender": "male|female",      // Gender
  "sumAssured": "number",       // Sum Assured in ₹
  "policyTerm": "number",       // Policy term in years
  "premiumFrequency": "annual|semi-annual|quarterly|monthly" // Default: annual
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "planId": "lic_001",
    "planName": "LIC Jeevan Term Plan",
    "annualPremium": 11250.00,
    "frequencyPremium": 11250.00,
    "premiumFrequency": "annual",
    "basePremiumPer1000": 4.50,
    "calculatedAt": "2025-04-24T10:30:00Z",
    "precision": "exact"
  }
}
```

**Errors:**
- `401`: Unauthorized (invalid/missing token)
- `400`: Missing required fields
- `400`: Age outside plan range
- `400`: Policy term outside plan range
- `400`: Sum Assured outside plan range
- `500`: Calculation engine error

**Example cURL:**
```bash
curl -X POST http://localhost:3000/api/calculations/premium \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "term_001",
    "age": 35,
    "gender": "male",
    "sumAssured": 2500000,
    "policyTerm": 10,
    "premiumFrequency": "annual"
  }'
```

---

### 2. Calculate Maturity Value

**Endpoint:** `POST /calculations/maturity`

**Purpose:** Calculate maturity benefits and returns

**Request:**
```json
{
  "policyId": "string",         // Policy UUID
  "premiumAmount": "number",    // Annual premium in ₹
  "policyTerm": "number",       // Policy term in years
  "sumAssured": "number",       // Sum Assured in ₹
  "planType": "string"          // Endowment|MoneyBack|Pension|Term
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "policyId": "pol_001",
    "sumAssured": 2500000,
    "totalBonus": 450000,
    "maturityValue": 2950000,
    "totalPremiumPaid": 112500000,
    "roi": 2.62,
    "calculatedAt": "2025-04-24T10:30:00Z",
    "precision": "exact"
  }
}
```

**Errors:**
- `401`: Unauthorized
- `400`: Missing required fields
- `500`: Calculation error

---

### 3. Compare Plans

**Endpoint:** `POST /calculations/compare`

**Purpose:** Compare multiple plans for a user profile

**Request:**
```json
{
  "planIds": ["string"],        // Array of plan UUIDs
  "userProfile": {
    "age": "number",
    "gender": "male|female",
    "sumAssured": "number",
    "policyTerm": "number"
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": [
    {
      "planId": "term_001",
      "planName": "LIC Jeevan Term Plan",
      "annualPremium": 11250,
      "maturityValue": 2500000,
      "totalPremium": 112500,
      "roi": 2100
    },
    {
      "planId": "endowment_001",
      "planName": "LIC Jeevan Anand",
      "annualPremium": 45000,
      "maturityValue": 2950000,
      "totalPremium": 450000,
      "roi": 5.56
    }
  ]
}
```

**Sorted by:** ROI (highest first)

---

## 🤖 VAANI AI API

### 4. Initialize Vaani

**Endpoint:** `GET /vaani/init`

**Purpose:** Initialize Vaani conversation and fetch user context

**Request:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "userId": "user_001",
    "conversationId": "conv_001",
    "userProfile": {
      "name": "John Doe",
      "age": 35,
      "gender": "male",
      "policies": 2
    },
    "goals": [
      {
        "id": "goal_001",
        "goalName": "Child Education",
        "goalType": "children_education",
        "targetAmount": 5000000
      }
    ],
    "recentPolicies": [...]
  },
  "message": "LIC's Vaani initialized successfully! 🌟"
}
```

---

### 5. Send Message to Vaani

**Endpoint:** `POST /vaani/chat`

**Purpose:** Send query to Vaani AI assistant

**Request:**
```json
{
  "message": "string",          // User query/message
  "conversationId": "string"    // Conversation UUID
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "type": "text|chart|action|plan|error",
    "message": "I can help you calculate the premium for LIC Jeevan Term Plan. Let me fetch the details for you.",
    "data": {
      "shouldFetchRecommendations": false
    },
    "action": {
      "type": "calculate_premium",
      "params": {
        "conversationId": "conv_001",
        "requiresUserInput": true
      }
    },
    "confidence": 0.85
  },
  "timestamp": "2025-04-24T10:30:00Z"
}
```

**Response Types:**
- `text`: Plain text response
- `action`: Triggers backend action (calculate, compare, fetch)
- `plan`: Plan recommendation
- `chart`: Data visualization needed
- `error`: Error occurred

---

## 📋 POLICIES API

### 6. Get User Policies

**Endpoint:** `GET /policies`

**Query Parameters:**
- `status`: (optional) active|lapsed|matured|surrendered
- `limit`: (optional) Default: 10
- `offset`: (optional) Default: 0

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "pol_001",
      "policyNumber": "LIC123456",
      "planId": "term_001",
      "sumAssured": 2500000,
      "policyTerm": 10,
      "annualPremium": 11250,
      "startDate": "2023-01-15T00:00:00Z",
      "maturityDate": "2033-01-15T00:00:00Z",
      "status": "active",
      "maturityAmount": 2950000
    }
  ],
  "total": 2,
  "limit": 10,
  "offset": 0
}
```

---

## 🔐 USER & ACCOUNT API

### 7. Get User Profile

**Endpoint:** `GET /user/profile`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_001",
    "uid": "firebase_uid",
    "email": "user@example.com",
    "name": "John Doe",
    "dateOfBirth": "1990-05-15T00:00:00Z",
    "gender": "male",
    "phoneNumber": "9876543210",
    "address": "...",
    "city": "Mumbai",
    "state": "Maharashtra",
    "panNumber": "ABCDE1234F",
    "status": "active",
    "createdAt": "2023-01-01T00:00:00Z"
  }
}
```

### 8. Update User Profile

**Endpoint:** `PUT /user/profile`

**Request:**
```json
{
  "name": "string",
  "phoneNumber": "string",
  "address": "string",
  "city": "string",
  "state": "string",
  "gender": "male|female|other",
  "dateOfBirth": "2025-04-24"
}
```

---

## 📊 TRANSACTION API

### 9. Get Transactions

**Endpoint:** `GET /transactions?type=&status=&limit=10`

**Query Parameters:**
- `type`: premium_payment|claim|maturity|refund|surrender
- `status`: pending|completed|failed
- `limit`: Max 100

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "txn_001",
      "type": "premium_payment",
      "amount": 11250,
      "paymentMethod": "online",
      "status": "completed",
      "referenceNumber": "TXN123456",
      "transactionDate": "2025-04-24T10:30:00Z",
      "completedDate": "2025-04-24T10:31:00Z",
      "policyId": "pol_001"
    }
  ],
  "total": 24
}
```

---

## 🎯 GOALS API

### 10. Create Financial Goal

**Endpoint:** `POST /goals`

**Request:**
```json
{
  "goalName": "string",
  "goalType": "retirement|children_education|child_marriage|wealth_creation",
  "targetAmount": "number",
  "targetDate": "2035-12-31"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "goal_001",
    "userId": "user_001",
    "goalName": "Child Education",
    "goalType": "children_education",
    "targetAmount": 5000000,
    "targetDate": "2035-12-31T00:00:00Z",
    "currentSavings": 0,
    "suggestedPlans": [],
    "status": "active"
  }
}
```

### 11. Get Suggested Plans for Goal

**Endpoint:** `GET /goals/:goalId/recommendations`

**Response:**
```json
{
  "success": true,
  "data": {
    "goalId": "goal_001",
    "suggestedPlans": [
      {
        "planId": "endowment_001",
        "planName": "LIC Jeevan Anand",
        "matchPercentage": 92,
        "reason": "Long-term growth with guaranteed returns"
      }
    ]
  }
}
```

---

## 🔧 ADMIN APIs

### 12. Get All LIC Plans

**Endpoint:** `GET /admin/plans`

**Query Parameters:**
- `type`: Term|Endowment|Pension|MoneyBack
- `status`: active|inactive

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "plan_001",
      "planName": "LIC Jeevan Term Plan",
      "planCode": "LJT001",
      "planType": "Term",
      "minAge": 18,
      "maxAge": 65,
      "features": {...},
      "status": "active"
    }
  ]
}
```

---

## 📈 AUDIT & LOGGING

### 13. Get Calculation Audit Trail

**Endpoint:** `GET /audit/calculations?type=&status=&limit=50`

**Purpose:** Internal auditing of all calculations

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "calc_001",
      "userId": "user_001",
      "planId": "plan_001",
      "calculationType": "premium",
      "inputData": {...},
      "outputData": {...},
      "formula": "...",
      "status": "success",
      "precision": "exact",
      "createdAt": "2025-04-24T10:30:00Z"
    }
  ]
}
```

---

## Error Response Format

**All errors follow this format:**
```json
{
  "success": false,
  "error": "Error code/message",
  "message": "Human-readable error description",
  "timestamp": "2025-04-24T10:30:00Z"
}
```

**Common Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Server Error

---

## Rate Limiting

Default limits applied:
- 100 requests per minute (per user)
- 1000 requests per hour (per user)
- 10000 requests per day (per user)

Headers returned:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1682410800
```

---

## Webhook Events (Future)

```json
{
  "event": "policy.activated|policy.lapsed|claim.approved|premium.overdue",
  "timestamp": "2025-04-24T10:30:00Z",
  "data": {...}
}
```

---

## Testing with Postman

[Download Postman Collection](postman_collection.json)

Or import from URL:
```
https://api.licmargadarshi.com/postman_collection.json
```

---

**Last Updated:** April 2025
**API Version:** 1.0
**Status:** Production Ready ✅
