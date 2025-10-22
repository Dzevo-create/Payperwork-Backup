# Payperwork

AI-Powered Workflow Automation Platform

## 🚀 Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Frontend:** React 19, TypeScript 5
- **Styling:** Tailwind CSS v3
- **Components:** shadcn/ui (Radix UI)
- **Animations:** Framer Motion, Auto-Animate
- **Icons:** Lucide React
- **Forms:** React Hook Form + Zod
- **State:** Zustand + React Query
- **Charts:** Recharts

## 🏃 Getting Started

### Prerequisites

- Node.js 18.17+
- npm 9+

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 📁 Project Structure

```
payperwork/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   ├── globals.css         # Global styles
│   └── providers.tsx       # React Query provider
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── forms/              # Form components
│   └── layout/             # Layout components
├── lib/
│   └── utils.ts            # Utilities (cn helper)
├── hooks/                  # Custom React hooks
├── public/                 # Static assets
├── tailwind.config.ts      # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
└── next.config.ts          # Next.js configuration
```

## 📦 Available Scripts

### Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server

### Code Quality

- `npm run lint` - Run ESLint
- `npm run type-check` - Check TypeScript types
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

### Testing

- `npm test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## 🔄 CI/CD Workflows

This project includes automated GitHub Actions workflows:

### Continuous Integration

- **Lint & Type Check** - Runs on every push/PR
  - ESLint validation
  - TypeScript type checking
  - Prettier formatting check

- **Unit Tests** - Runs on every push/PR
  - Jest tests with coverage
  - Codecov integration
  - Coverage comments on PRs

- **Security Scan** - Runs on push/PR and weekly
  - npm audit for vulnerabilities
  - Dependency review on PRs
  - Outdated package detection

### Pre-Commit Hooks

- Husky + lint-staged configured
- Auto-formats code before commit
- Runs ESLint on staged files
- Ensures code quality standards

## 🎨 Adding Components

Install shadcn/ui components on-demand:

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
```

## 📝 Development Guidelines

See [.claude/agents/CODE-STANDARDS.md](.claude/agents/CODE-STANDARDS.md) for:

- Code standards
- Architecture principles
- Best practices
- File size limits

## 🤖 AI Agents

This project uses specialized AI agents for development. See [.claude/agents/](.claude/agents/) for:

- 26 specialized development agents
- Agent rules and guidelines
- Development workflows

## 📄 License

MIT

## 🙏 Credits

Built with ❤️ using modern web technologies
