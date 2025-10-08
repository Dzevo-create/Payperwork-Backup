# 📐 Universal Code Standards & Architecture Rules

Professionelle Standards für sauberen, wartbaren Code in jedem Projekt.

---

## 📏 Dateigrößen & Komplexität

### Dateigrößen-Limits

```yaml
Limits:
  # Source Code Files
  Component/Function File:
    Max: 300 lines
    Ideal: 150-200 lines
    Critical: 500 lines (refactor needed!)

  # Configuration
  Config File:
    Max: 200 lines

  # Tests
  Test File:
    Max: 500 lines (many test cases OK)

  # Documentation
  README/Docs:
    No strict limit (but use sections!)
```

### Warum diese Limits?

**< 300 Zeilen pro File:**
- ✅ Passt auf einen Bildschirm (mit Scrollen)
- ✅ Ein Entwickler kann es in 5 Minuten verstehen
- ✅ Einfacher zu testen
- ✅ Einfacher zu reviewen
- ✅ Weniger Merge-Konflikte

**Wenn größer → Refactoring Signals:**
```typescript
// ❌ SCHLECHT: 800 Zeilen Component
function Dashboard() {
  // 100 Zeilen State
  // 200 Zeilen Logic
  // 300 Zeilen JSX
  // 200 Zeilen Helper Functions
}

// ✅ GUT: Aufgeteilt in Module
function Dashboard() {
  return (
    <DashboardLayout>
      <DashboardHeader />
      <DashboardStats />
      <DashboardCharts />
      <DashboardTable />
    </DashboardLayout>
  );
}
```

---

## 🏗️ Architektur-Prinzipien

### 1. **SOLID Principles**

#### S - Single Responsibility
**Eine Funktion/Klasse = Eine Aufgabe**

```typescript
// ❌ SCHLECHT: Macht zu viel
function handleUser(user) {
  validateUser(user);
  saveToDatabase(user);
  sendEmail(user);
  logActivity(user);
  updateCache(user);
}

// ✅ GUT: Getrennte Verantwortlichkeiten
function createUser(user) {
  const validated = validateUser(user);
  const saved = await userRepository.save(validated);
  await notificationService.sendWelcomeEmail(saved);
  await analyticsService.trackSignup(saved);
  return saved;
}
```

#### O - Open/Closed Principle
**Offen für Erweiterung, geschlossen für Änderung**

```typescript
// ❌ SCHLECHT: Muss ändern für neue Types
function getPrice(product) {
  if (product.type === 'book') return product.price * 0.9;
  if (product.type === 'electronics') return product.price * 1.2;
  // Neue Types = Code ändern
}

// ✅ GUT: Erweiterbar ohne Änderung
interface PricingStrategy {
  calculatePrice(basePrice: number): number;
}

class BookPricing implements PricingStrategy {
  calculatePrice(basePrice: number) {
    return basePrice * 0.9;
  }
}

class ElectronicsPricing implements PricingStrategy {
  calculatePrice(basePrice: number) {
    return basePrice * 1.2;
  }
}
```

#### L - Liskov Substitution
**Subtypen müssen austauschbar sein**

```typescript
// ✅ GUT: Alle User-Typen haben gleiche Basis-Funktionen
interface User {
  login(): Promise<void>;
  logout(): Promise<void>;
}

class EmailUser implements User {
  async login() { /* Email login */ }
  async logout() { /* Logout */ }
}

class GoogleUser implements User {
  async login() { /* Google OAuth */ }
  async logout() { /* Logout */ }
}

// Überall austauschbar
function authenticateUser(user: User) {
  await user.login();
}
```

#### I - Interface Segregation
**Kleine, fokussierte Interfaces**

```typescript
// ❌ SCHLECHT: Fat Interface
interface User {
  login();
  logout();
  createPost();
  deletePost();
  sendMessage();
  uploadFile();
  // ... 20 weitere Methoden
}

// ✅ GUT: Kleine Interfaces
interface Authenticatable {
  login(): Promise<void>;
  logout(): Promise<void>;
}

interface ContentCreator {
  createPost(content: Post): Promise<Post>;
  deletePost(id: string): Promise<void>;
}

interface Messenger {
  sendMessage(to: string, message: string): Promise<void>;
}

// Nur implementieren was gebraucht wird
class BasicUser implements Authenticatable {
  async login() { /* ... */ }
  async logout() { /* ... */ }
}
```

#### D - Dependency Inversion
**Abhängig von Abstraktionen, nicht Konkretionen**

```typescript
// ❌ SCHLECHT: Direkte Abhängigkeit
class UserService {
  private db = new PostgresDatabase(); // Hart gekoppelt!

  async getUser(id: string) {
    return this.db.query('SELECT * FROM users WHERE id = ?', [id]);
  }
}

// ✅ GUT: Abhängigkeit injiziert
interface Database {
  query(sql: string, params: any[]): Promise<any>;
}

class UserService {
  constructor(private db: Database) {} // Injiziert!

  async getUser(id: string) {
    return this.db.query('SELECT * FROM users WHERE id = ?', [id]);
  }
}

// Jetzt austauschbar
const service = new UserService(new PostgresDatabase());
// Oder für Tests:
const testService = new UserService(new MockDatabase());
```

---

### 2. **DRY - Don't Repeat Yourself**

**Maximal 2x Copy-Paste, dann Refactor!**

```typescript
// ❌ SCHLECHT: 5x gleicher Code
function formatUserName(user) {
  return user.firstName + ' ' + user.lastName;
}

function formatAdminName(admin) {
  return admin.firstName + ' ' + admin.lastName; // Duplicate!
}

function formatCustomerName(customer) {
  return customer.firstName + ' ' + customer.lastName; // Duplicate!
}

// ✅ GUT: Eine zentrale Funktion
function formatFullName(person: { firstName: string; lastName: string }) {
  return `${person.firstName} ${person.lastName}`;
}

// Überall verwendbar
formatFullName(user);
formatFullName(admin);
formatFullName(customer);
```

**Rule of Three:**
1. Erste Verwendung: Schreib es
2. Zweite Verwendung: Copy-Paste OK
3. Dritte Verwendung: **Refactor zu Funktion/Util!**

---

### 3. **KISS - Keep It Simple, Stupid**

**Einfachheit > Cleverness**

```typescript
// ❌ SCHLECHT: Zu clever
const isEven = n => !(n & 1);

// ✅ GUT: Klar und verständlich
const isEven = (n: number) => n % 2 === 0;
```

```typescript
// ❌ SCHLECHT: Over-engineered
class AbstractFactoryProviderSingletonBuilder {
  // 500 Zeilen...
}

// ✅ GUT: Einfach
function createUser(data: UserData): User {
  return { ...data, createdAt: new Date() };
}
```

---

### 4. **YAGNI - You Ain't Gonna Need It**

**Bau nur was du JETZT brauchst!**

```typescript
// ❌ SCHLECHT: Features für die Zukunft
class User {
  email: string;
  password: string;
  // Für später...
  socialSecurityNumber?: string;
  passportNumber?: string;
  driverLicenseNumber?: string;
  creditScore?: number;
  // ... 20 weitere "maybe" Felder
}

// ✅ GUT: Nur was jetzt gebraucht wird
class User {
  email: string;
  password: string;
  createdAt: Date;
}

// Später erweitern wenn TATSÄCHLICH gebraucht:
class ExtendedUser extends User {
  socialSecurityNumber: string; // Jetzt gebraucht!
}
```

---

## 📁 Projektstruktur-Regeln

### Frontend (React/Next.js)

```
src/
├── app/                    # Next.js App Router (oder pages/)
├── components/
│   ├── ui/                 # Basis UI Components (< 100 Zeilen)
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Card.tsx
│   ├── forms/              # Form Components
│   └── layout/             # Layout Components
├── features/               # Feature-basierte Organisation
│   ├── auth/
│   │   ├── components/     # Auth-spezifische Components
│   │   ├── hooks/          # useAuth, useLogin
│   │   ├── api/            # Auth API calls
│   │   └── types.ts        # Auth Types
│   ├── dashboard/
│   └── profile/
├── lib/                    # Utilities & Helpers
│   ├── api.ts              # API Client
│   ├── validation.ts       # Zod Schemas
│   └── utils.ts            # Helper Functions
├── hooks/                  # Shared Custom Hooks
├── stores/                 # State Management (Zustand/Redux)
├── types/                  # Shared TypeScript Types
└── styles/                 # Global Styles
```

**Regeln:**
- ✅ **Features isoliert** - Alles zu einem Feature in einem Ordner
- ✅ **Max 7 Files pro Ordner** - Sonst Unterordner
- ✅ **Alphabetisch** - Einfacher zu finden
- ✅ **Index Files** - Für saubere Imports

```typescript
// ✅ Saubere Imports mit index.ts
// features/auth/index.ts
export { LoginForm } from './components/LoginForm';
export { useAuth } from './hooks/useAuth';
export { authApi } from './api/authApi';

// Verwendung
import { LoginForm, useAuth, authApi } from '@/features/auth';
```

---

### Backend (Node.js/Express)

```
src/
├── api/                    # API Layer
│   ├── routes/             # Route Definitions
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   └── index.ts
│   ├── controllers/        # Request Handlers (< 200 Zeilen)
│   │   ├── auth.controller.ts
│   │   └── user.controller.ts
│   └── middleware/         # Express Middleware
│       ├── auth.middleware.ts
│       └── validation.middleware.ts
├── services/               # Business Logic (< 300 Zeilen)
│   ├── auth.service.ts
│   └── user.service.ts
├── repositories/           # Data Access Layer
│   ├── user.repository.ts
│   └── base.repository.ts
├── models/                 # Database Models
│   └── user.model.ts
├── lib/                    # Utilities
│   ├── database.ts
│   ├── logger.ts
│   └── errors.ts
├── types/                  # TypeScript Types
└── config/                 # Configuration
    ├── database.config.ts
    └── app.config.ts
```

**Layered Architecture:**
```
Request → Route → Controller → Service → Repository → Database
                     ↓             ↓
                  Validation   Business Logic
```

**Regeln:**
- ✅ **Controller**: Nur Request/Response Handling (< 100 Zeilen)
- ✅ **Service**: Business Logic (< 300 Zeilen)
- ✅ **Repository**: Nur Database Queries
- ✅ **No Business Logic in Controllers!**

```typescript
// ❌ SCHLECHT: Business Logic im Controller
export async function createUser(req: Request, res: Response) {
  // Validation
  if (!req.body.email) return res.status(400).json({ error: 'Email required' });

  // Business Logic im Controller! ❌
  const existingUser = await db.user.findOne({ email: req.body.email });
  if (existingUser) return res.status(409).json({ error: 'User exists' });

  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  const user = await db.user.create({ ...req.body, password: hashedPassword });

  // Email senden im Controller! ❌
  await sendEmail(user.email, 'Welcome!');

  res.json(user);
}

// ✅ GUT: Layers getrennt
// Controller (nur Request/Response)
export async function createUser(req: Request, res: Response) {
  const userData = createUserSchema.parse(req.body); // Validation
  const user = await userService.createUser(userData); // Service call
  res.status(201).json(user);
}

// Service (Business Logic)
export class UserService {
  async createUser(data: CreateUserDto): Promise<User> {
    // Business Logic hier
    const existing = await userRepository.findByEmail(data.email);
    if (existing) throw new ConflictError('User exists');

    const hashedPassword = await hashPassword(data.password);
    const user = await userRepository.create({ ...data, password: hashedPassword });

    await emailService.sendWelcomeEmail(user);

    return user;
  }
}

// Repository (nur Data Access)
export class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    return db.user.findOne({ where: { email } });
  }

  async create(data: CreateUserData): Promise<User> {
    return db.user.create(data);
  }
}
```

---

## 🔢 Funktions-Regeln

### Funktionsgröße

```yaml
Function Lines:
  Max: 50 lines
  Ideal: 10-20 lines
  Critical: 100 lines (refactor!)
```

**Warum 50 Zeilen?**
- ✅ Passt auf einen Bildschirm
- ✅ Leicht zu verstehen
- ✅ Einfach zu testen
- ✅ Single Responsibility

```typescript
// ❌ SCHLECHT: 150 Zeilen Funktion
function processOrder(order) {
  // 30 Zeilen Validation
  // 40 Zeilen Berechnung
  // 30 Zeilen Database
  // 30 Zeilen Email
  // 20 Zeilen Logging
}

// ✅ GUT: Kleine fokussierte Funktionen
async function processOrder(order: Order): Promise<ProcessedOrder> {
  validateOrder(order);                    // 10-15 Zeilen
  const calculated = calculateTotal(order); // 15-20 Zeilen
  const saved = await saveOrder(calculated); // 10 Zeilen
  await sendConfirmation(saved);            // 10 Zeilen
  logOrderProcessed(saved);                 // 5 Zeilen
  return saved;
}
```

### Parameter-Anzahl

```yaml
Function Parameters:
  Max: 3 parameters
  Ideal: 0-2 parameters
  > 3: Use object parameter!
```

```typescript
// ❌ SCHLECHT: Zu viele Parameter
function createUser(
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  age: number,
  country: string,
  newsletter: boolean
) {
  // ...
}

// ✅ GUT: Object Parameter
interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  age: number;
  country: string;
  newsletter: boolean;
}

function createUser(data: CreateUserData) {
  // ...
}

// Verwendung
createUser({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  password: 'secret',
  age: 30,
  country: 'US',
  newsletter: true,
});
```

### Nesting-Tiefe

```yaml
Nesting:
  Max: 3 levels
  Ideal: 1-2 levels
```

```typescript
// ❌ SCHLECHT: 5 Levels Nesting
function processData(data) {
  if (data) {                           // Level 1
    if (data.user) {                    // Level 2
      if (data.user.isActive) {         // Level 3
        if (data.user.hasPermission) {  // Level 4
          if (data.user.age > 18) {     // Level 5 - ZU TIEF!
            // ...
          }
        }
      }
    }
  }
}

// ✅ GUT: Early Returns (Guard Clauses)
function processData(data) {
  if (!data) return;
  if (!data.user) return;
  if (!data.user.isActive) return;
  if (!data.user.hasPermission) return;
  if (data.user.age <= 18) return;

  // Logic hier (nur 1 Level Nesting)
  // ...
}
```

---

## 📝 Naming Conventions

### Variablen & Funktionen

```typescript
// ✅ GUT: Beschreibende Namen
const userEmail = 'user@example.com';
const isAuthenticated = true;
const totalPrice = calculateTotal(items);

function getUserById(id: string): User { }
function calculateTotalPrice(items: Item[]): number { }
function sendWelcomeEmail(user: User): Promise<void> { }

// ❌ SCHLECHT: Kryptische Namen
const e = 'user@example.com';
const flag = true;
const tp = calc(arr);

function get(id) { }
function calc(x) { }
function send(u) { }
```

### Naming Rules

```yaml
Variables:
  - camelCase
  - Beschreibend (min 3 chars, außer i,j,k in loops)
  - Boolean: is/has/should Prefix

Functions:
  - camelCase
  - Verb + Noun (getUser, createOrder, sendEmail)
  - Boolean return: is/has/should

Classes:
  - PascalCase
  - Noun (User, OrderService, PaymentController)

Constants:
  - SCREAMING_SNAKE_CASE
  - Nur echte Konstanten

Types/Interfaces:
  - PascalCase
  - Interface: I-Prefix optional (IUser vs User)
```

```typescript
// ✅ Beispiele
const userName = 'John';
const isLoggedIn = true;
const hasPermission = checkPermission();

function getUsers(): User[] { }
function createOrder(data: OrderData): Order { }
function isValidEmail(email: string): boolean { }

class UserService { }
class OrderController { }

const MAX_RETRIES = 3;
const API_BASE_URL = 'https://api.example.com';

interface User { }
type OrderStatus = 'pending' | 'completed';
```

---

## �� Testing-Regeln

### Test Coverage

```yaml
Coverage:
  Minimum: 80%
  Ideal: 90%+

Coverage by Type:
  Critical Paths: 100% (Auth, Payment, etc.)
  Business Logic: 90%+
  UI Components: 80%+
  Utils: 95%+
```

### Test File Organization

```
src/
├── services/
│   ├── user.service.ts
│   └── user.service.test.ts      # Co-located
└── utils/
    ├── validation.ts
    └── validation.test.ts

# Oder separate tests/ Folder
tests/
├── unit/
├── integration/
└── e2e/
```

### Test Struktur

```typescript
// ✅ AAA Pattern: Arrange, Act, Assert
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with hashed password', async () => {
      // Arrange
      const userData = { email: 'test@example.com', password: 'password123' };
      const mockRepository = createMockRepository();
      const service = new UserService(mockRepository);

      // Act
      const user = await service.createUser(userData);

      // Assert
      expect(user.email).toBe(userData.email);
      expect(user.password).not.toBe(userData.password); // Hashed
      expect(mockRepository.create).toHaveBeenCalledOnce();
    });

    it('should throw error if email exists', async () => {
      // Arrange
      const userData = { email: 'existing@example.com', password: 'password' };
      const mockRepository = createMockRepository({ emailExists: true });
      const service = new UserService(mockRepository);

      // Act & Assert
      await expect(service.createUser(userData)).rejects.toThrow('User exists');
    });
  });
});
```

---

## 📦 Import-Regeln

### Import Order

```typescript
// 1. External Dependencies
import React from 'react';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';

// 2. Internal Absolute Imports (Aliases)
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import type { User } from '@/types/user';

// 3. Relative Imports (same feature)
import { validateUser } from './validation';
import { UserCard } from './UserCard';

// 4. CSS/Styles
import './styles.css';
```

### Path Aliases

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/types/*": ["./src/types/*"]
    }
  }
}

// ✅ Verwendung
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

// ❌ Vermeiden
import { Button } from '../../../components/ui/Button';
```

---

## 🔒 Security Rules

```yaml
Security:
  - Nie Secrets im Code (use env vars)
  - Alle Inputs validieren (Zod/Yup)
  - SQL Injection: Parameterized Queries
  - XSS: Sanitize user input
  - CSRF: Tokens für state-changing ops
  - Passwords: Bcrypt/Argon2 (never plain text)
  - JWT: Short expiry (< 15 min access token)
  - Rate Limiting: Alle public endpoints
  - HTTPS: Only in production
```

---

## 📋 Code Review Checklist

```yaml
Before Commit:
  - [ ] Lint: 0 errors
  - [ ] Type Check: 0 errors
  - [ ] Tests: All passing
  - [ ] Coverage: > 80%
  - [ ] No console.log (use logger)
  - [ ] No commented code
  - [ ] No TODO/FIXME (create ticket)

File Size:
  - [ ] All files < 300 lines
  - [ ] All functions < 50 lines
  - [ ] Max 3 levels nesting

Quality:
  - [ ] DRY: No duplicate code
  - [ ] SOLID: Follows principles
  - [ ] Naming: Clear and consistent
  - [ ] Comments: Only where needed (why, not what)

Security:
  - [ ] No hardcoded secrets
  - [ ] Input validation
  - [ ] No SQL injection
```

---

## 🎯 Quick Reference

### ❌ Code Smells (refactor wenn gesehen)

```typescript
// 1. Long Function (> 50 lines)
// 2. Long File (> 300 lines)
// 3. Duplicate Code (> 2x)
// 4. Deep Nesting (> 3 levels)
// 5. Too Many Parameters (> 3)
// 6. God Object (macht alles)
// 7. Magic Numbers (use constants)
// 8. Dead Code (unused code)
// 9. Comments explaining code (bad naming)
// 10. Tight Coupling (hard dependencies)
```

---

**Diese Standards gelten für ALLE Agenten! Jeder Agent sollte diese Rules befolgen.** 🎯
