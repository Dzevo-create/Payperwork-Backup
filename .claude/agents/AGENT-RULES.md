# 🎯 Universal Agent Rules

**Diese Rules gelten für ALLE 26 Agenten! Jeder Agent MUSS diese befolgen.**

---

## 📏 Code-Größen Limits

### Dateigrößen
```yaml
Source Files:
  Maximum: 300 Zeilen
  Ideal: 150-200 Zeilen
  Critical: 500+ Zeilen → SOFORT REFACTOREN!

Funktionen:
  Maximum: 50 Zeilen
  Ideal: 10-20 Zeilen
  Critical: 100+ Zeilen → SOFORT REFACTOREN!

Parameter:
  Maximum: 3 Parameter
  Mehr als 3: Object Parameter verwenden!

Nesting:
  Maximum: 3 Levels
  Mehr: Early Returns/Guard Clauses verwenden!
```

### Warum diese Limits?

**✅ < 300 Zeilen:**
- Passt auf einen Bildschirm
- Verständlich in 5 Minuten
- Einfach zu testen
- Einfach zu reviewen

**✅ < 50 Zeilen Funktion:**
- Single Responsibility
- Leicht testbar
- Weniger Bugs

---

## 🏗️ Architektur-Prinzipien

### 1. SOLID
- **S**ingle Responsibility - Eine Funktion = Eine Aufgabe
- **O**pen/Closed - Offen für Erweiterung, geschlossen für Änderung
- **L**iskov Substitution - Subtypen austauschbar
- **I**nterface Segregation - Kleine, fokussierte Interfaces
- **D**ependency Inversion - Abhängig von Abstraktionen

### 2. DRY - Don't Repeat Yourself
- **Rule of Three:** Nach 3x Copy-Paste → Refactor!
- Keine Duplikate tolerieren

### 3. KISS - Keep It Simple
- Einfachheit > Cleverness
- Verständlicher Code > Kurzer Code

### 4. YAGNI - You Ain't Gonna Need It
- Nur bauen was JETZT gebraucht wird
- Keine "Future Features"

---

## 📁 Projektstruktur

### Frontend (React/Next.js)
```
src/
├── app/ oder pages/
├── components/
│   ├── ui/              # < 100 Zeilen pro Component
│   ├── forms/
│   └── layout/
├── features/            # Feature-basiert
│   └── auth/
│       ├── components/
│       ├── hooks/
│       ├── api/
│       └── types.ts
├── lib/                 # Utils
├── hooks/               # Shared Hooks
├── stores/              # State (Zustand/Redux)
└── types/               # Shared Types
```

### Backend (Node.js)
```
src/
├── api/
│   ├── routes/
│   ├── controllers/     # < 100 Zeilen
│   └── middleware/
├── services/            # Business Logic < 300 Zeilen
├── repositories/        # Data Access
├── models/
├── lib/
└── types/
```

**Layer-Regel:**
```
Request → Route → Controller → Service → Repository → DB
          ↓         ↓
       Validation  Business Logic
```

---

## 🔢 Code-Regeln

### Funktionen

```typescript
// ❌ SCHLECHT: 150 Zeilen, 7 Parameter, 5 Levels Nesting
function processOrder(id, userId, items, discount, shipping, payment, notes) {
  if (id) {
    if (userId) {
      if (items) {
        if (items.length > 0) {
          if (payment) {
            // 100 Zeilen Code...
          }
        }
      }
    }
  }
}

// ✅ GUT: Kleine Funktionen, Object Parameter, Early Returns
interface ProcessOrderData {
  id: string;
  userId: string;
  items: Item[];
  discount?: number;
  shipping: ShippingMethod;
  payment: PaymentMethod;
  notes?: string;
}

function processOrder(data: ProcessOrderData) {
  // Early Returns (Guard Clauses)
  if (!data.id) throw new Error('ID required');
  if (!data.userId) throw new Error('User ID required');
  if (!data.items?.length) throw new Error('Items required');
  if (!data.payment) throw new Error('Payment required');

  // Delegieren zu kleinen Funktionen
  validateOrder(data);
  const calculated = calculateTotal(data);
  const saved = saveOrder(calculated);
  sendConfirmation(saved);

  return saved;
}
```

### Nesting vermeiden

```typescript
// ❌ SCHLECHT: 5 Levels Deep
if (user) {
  if (user.isActive) {
    if (user.hasPermission) {
      if (user.age > 18) {
        if (user.verified) {
          // Code hier
        }
      }
    }
  }
}

// ✅ GUT: Early Returns
if (!user) return;
if (!user.isActive) return;
if (!user.hasPermission) return;
if (user.age <= 18) return;
if (!user.verified) return;

// Code hier (nur 0-1 Level)
```

---

## 📝 Naming Conventions

```typescript
// ✅ Variables & Functions: camelCase
const userName = 'John';
const isLoggedIn = true;

function getUserById(id: string): User {}
function calculateTotal(items: Item[]): number {}

// ✅ Classes & Types: PascalCase
class UserService {}
interface User {}
type OrderStatus = 'pending' | 'completed';

// ✅ Constants: SCREAMING_SNAKE_CASE
const MAX_RETRIES = 3;
const API_BASE_URL = 'https://api.example.com';

// ✅ Booleans: is/has/should Prefix
const isValid = true;
const hasPermission = false;
const shouldUpdate = true;

// ❌ SCHLECHT: Kryptisch
const e = 'email';
const flag = true;
function get(x) {}
```

---

## 🧪 Testing

### Coverage Minimum
```yaml
Minimum Coverage: 80%
Critical Paths: 100% (Auth, Payment)
Business Logic: 90%+
Utils: 95%+
```

### Test Struktur (AAA Pattern)
```typescript
it('should create user with hashed password', async () => {
  // Arrange
  const userData = { email: 'test@example.com', password: 'pass123' };

  // Act
  const user = await createUser(userData);

  // Assert
  expect(user.password).not.toBe('pass123'); // Hashed
});
```

---

## 📦 Imports

### Reihenfolge
```typescript
// 1. External
import React from 'react';
import { z } from 'zod';

// 2. Internal (Aliases)
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

// 3. Relative
import { validateUser } from './validation';

// 4. Styles
import './styles.css';
```

---

## 🔒 Security

```yaml
NIEMALS:
  - Secrets im Code (immer env vars)
  - Plain-text Passwords
  - SQL String Concatenation
  - Unvalidated User Input

IMMER:
  - Input Validation (Zod/Yup)
  - Parameterized Queries
  - Password Hashing (bcrypt/argon2)
  - Rate Limiting
  - HTTPS in Production
  - CSRF Tokens
```

---

## 📋 Pre-Commit Checklist

```yaml
Code Quality:
  - [ ] Lint: 0 Errors
  - [ ] Type Check: 0 Errors
  - [ ] Tests: All Passing
  - [ ] Coverage: > 80%

File Sizes:
  - [ ] Alle Files < 300 Zeilen
  - [ ] Alle Functions < 50 Zeilen
  - [ ] Max 3 Parameter
  - [ ] Max 3 Levels Nesting

Standards:
  - [ ] SOLID Principles
  - [ ] DRY (keine Duplikate)
  - [ ] KISS (einfach)
  - [ ] Gute Naming

Security:
  - [ ] Keine Secrets
  - [ ] Input Validation
  - [ ] No SQL Injection
  - [ ] Password Hashing
```

---

## ❌ Code Smells (Sofort Refactoren!)

1. **Long Function** (> 50 Zeilen)
2. **Long File** (> 300 Zeilen)
3. **Duplicate Code** (> 2x)
4. **Deep Nesting** (> 3 levels)
5. **Too Many Parameters** (> 3)
6. **God Object** (macht alles)
7. **Magic Numbers** (use constants)
8. **Dead Code** (unused)
9. **Comments explaining code** (bad naming)
10. **Tight Coupling** (hard dependencies)

---

## 🎯 Agent-Spezifische Rules

### @agent-backend-engineer
```yaml
Controller:
  - Nur Request/Response Handling
  - Max 100 Zeilen
  - Keine Business Logic!

Service:
  - Business Logic hier
  - Max 300 Zeilen
  - Eine Service-Klasse pro Domain

Repository:
  - Nur Database Queries
  - Keine Business Logic!
```

### @agent-frontend-engineer
```yaml
Components:
  - Max 200 Zeilen
  - Single Responsibility
  - Props via Interface/Type

Hooks:
  - Prefix: use...
  - Max 50 Zeilen
  - Eine Aufgabe
```

### @agent-test-engineer
```yaml
Tests:
  - AAA Pattern (Arrange, Act, Assert)
  - Beschreibende Namen
  - Eine Assertion pro Test (ideal)
  - Coverage: 80%+ minimum
```

---

## 💡 Quick Reference

### Größen-Limits
- **File:** < 300 Zeilen
- **Function:** < 50 Zeilen
- **Parameters:** ≤ 3
- **Nesting:** ≤ 3 Levels

### Prinzipien
- **SOLID** - Saubere Architektur
- **DRY** - Keine Duplikate
- **KISS** - Einfachheit
- **YAGNI** - Nur was gebraucht wird

### Quality Gates
- **Lint:** 0 Errors
- **Types:** 0 Errors
- **Tests:** All Pass
- **Coverage:** > 80%

---

**🎯 Diese Rules sind NICHT optional! Jeder Agent MUSS sie befolgen!**

Siehe [CODE-STANDARDS.md](./CODE-STANDARDS.md) für ausführliche Beispiele und Details.
