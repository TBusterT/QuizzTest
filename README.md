# Quiz Builder

[🇺🇦 Читати українською](README.uk.md)

A complete full-stack web application for creating and viewing quizzes (**Quiz Builder**) supporting multiple question types: Boolean (True / False), Input (short answer), and Checkbox (multiple choice).

---

## Design Decisions

- **Answer Storage by Question Type**: According to the project requirements and technical specification, this application implements a **Quiz Builder** (defining the questionnaire structure and schema), not a participant test-taking or grading engine:
  - `BOOLEAN` (True / False) and `INPUT` (free-form text) questions define the interactive prompt and answer format on the client, but do not store a "correct answer" field in the database. Both the creation and detail pages show disabled previews of these answer formats.
  - `CHECKBOX` (multiple choice) questions store structured option items in the `QuestionOption` table, where each option includes both an `isCorrect: boolean` flag (designating valid answer choices) and an `order: number`.
- **Question & Option Ordering (`order`)**: The display sequence of questions and checkbox options is assigned by the server based on their index in the payload array upon creation. Retrieval queries order items deterministically via `order: 'asc'` (with `id: 'asc'` as a tie-breaker for Postgres).
- **Race Condition Prevention on Deletion**: Quiz deletion performs `prisma.quiz.delete` directly wrapped in a `try/catch` block for Prisma error `P2025`, converting it to `404 Not Found` without an unnecessary preliminary `findUnique` query.
- **Consistent Client & Backend Limits**: Field lengths and item counts (title ≤ 200, question text ≤ 500, option label ≤ 300, 2–20 options, 1–50 questions) are centralized in `QUIZ_LIMITS` on the client, matching the backend `class-validator` rules.
- **Request Validation**: Each question and option must be an object; nested arrays and primitive values return `400` before reaching Prisma. The JSON body limit is 4 MiB, accommodating maximum-length quizzes, including escaped Unicode; larger requests return `413`.

---

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Vanilla CSS (custom design system featuring glassmorphism, Google Fonts Plus Jakarta Sans via `next/font/google`, `prefers-reduced-motion` accessibility support, and micro-animations).
- **Backend**: NestJS 11, Express, TypeScript, `class-validator`, `class-transformer`.
- **Database & ORM**: PostgreSQL 17 (Docker Compose on port 5432), Prisma ORM v7 with custom client output directory.
- **Monorepo**: npm workspaces (`@quiz-builder/frontend`, `@quiz-builder/backend`), `concurrently` for running dev servers in parallel.

---

## Local URLs

| URL                                  | Purpose                                            |
| ------------------------------------ | -------------------------------------------------- |
| `http://localhost:3000/quizzes`      | Quizzes dashboard (list of all quizzes)            |
| `http://localhost:3000/create`       | Quiz creation builder page                         |
| `http://localhost:3000/quizzes/<id>` | Quiz detail view page (read-only criteria)         |
| `http://localhost:3001/quizzes`      | REST API endpoint to list and create quizzes       |
| `http://localhost:3001/quizzes/<id>` | REST API endpoint to view and delete a quiz        |
| `http://localhost:3001/health`       | Backend healthcheck service (`{ "status": "ok" }`) |
| `127.0.0.1:5432`                     | Local PostgreSQL instance in Docker                |

---

## Quick Start

### 1. Prerequisites

- Node.js 22.x (at least 22.13.0) or 24.x, and npm `>= 10`. Verified with Node.js `24.14.1`, also recorded in `.nvmrc`.
- Docker Desktop installed and running

### 2. Environment Configuration

Create local configuration files from the provided templates:

**PowerShell (Windows):**

```powershell
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env.local
```

**Bash (Linux / macOS):**

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Docker Compose reads the root `.env`; NestJS and the Prisma CLI read `backend/.env`; Next.js reads `frontend/.env.local`. Keep the PostgreSQL credentials and port consistent with `DATABASE_URL`, and set `NEXT_PUBLIC_API_URL` to the backend URL. Local environment files are ignored by Git and excluded from the source archive.

### 3. Install Dependencies

```powershell
npm ci
```

### 4. Start Database Container

```powershell
npm run db:up
```

This launches a PostgreSQL 17 container on port `5432`.

### 5. Run Database Migrations

```powershell
npm run db:migrate
```

This applies all Prisma migrations (`init` and `add_option_order`) to the database.

### 6. Generate Prisma Client

```powershell
npm run db:generate
```

Generates the typed Prisma Client in `backend/src/generated/prisma`.

### 7. Start Development Servers

```powershell
npm run dev
```

This starts both services concurrently:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`

### 8. (Optional) Seed Sample Data

> [!IMPORTANT]
> The database seed script (`scripts/seed.mjs`) calls the REST API via HTTP (`POST /quizzes`). Run this command in a **second terminal window** while the backend development server is running (`npm run dev`).

```powershell
npm run db:seed
```

---

## REST API Endpoints

| Method   | Path           | Description                             | Request / Response                                         |
| :------- | :------------- | :-------------------------------------- | :--------------------------------------------------------- |
| `GET`    | `/health`      | Healthcheck endpoint                    | `{ "status": "ok" }`                                       |
| `POST`   | `/quizzes`     | Create a new quiz                       | `CreateQuizDto` -> returns created quiz (201)              |
| `GET`    | `/quizzes`     | List all quizzes                        | Array of `{ id, title, createdAt, _count: { questions } }` |
| `GET`    | `/quizzes/:id` | Fetch quiz by ID                        | Quiz with ordered questions and options                    |
| `DELETE` | `/quizzes/:id` | Delete quiz and its questions cascading | `204 No Content` (or `404 Not Found`)                      |

### Supported Question Types (`QuestionType`):

- `BOOLEAN`: Question with standard True / False choices.
- `INPUT`: Question with a free-form single-line input field.
- `CHECKBOX`: Multiple choice question (2–20 options, at least one marked correct).

The display sequence (`order`) for both questions and options is preserved automatically according to array index.

---

## API Usage Examples

### Option 1: PowerShell

```powershell
$api = 'http://localhost:3001'

# 1. Create a quiz with 3 question types
$body = @{
  title = 'Geography & Science Quiz'
  questions = @(
    @{
      type = 'BOOLEAN'
      text = 'The Earth revolves around the Sun.'
    },
    @{
      type = 'INPUT'
      text = 'What is the chemical symbol for water?'
    },
    @{
      type = 'CHECKBOX'
      text = 'Which of the following are planets in our Solar System?'
      options = @(
        @{ label = 'Mars';    isCorrect = $true  },
        @{ label = 'Jupiter'; isCorrect = $true  },
        @{ label = 'Pluto';   isCorrect = $false },
        @{ label = 'Venus';   isCorrect = $true  }
      )
    }
  )
} | ConvertTo-Json -Depth 5

$quiz = Invoke-RestMethod -Method Post "$api/quizzes" -ContentType 'application/json' -Body $body
Write-Host "Created Quiz ID: $($quiz.id)"

# 2. List all quizzes
Invoke-RestMethod "$api/quizzes"

# 3. Retrieve quiz details
Invoke-RestMethod "$api/quizzes/$($quiz.id)"

# 4. Delete quiz
Invoke-RestMethod -Method Delete "$api/quizzes/$($quiz.id)"
```

### Option 2: cURL (Bash)

```bash
API="http://localhost:3001"

# 1. Create a quiz with 3 question types
QUIZ_JSON=$(curl -s -X POST "$API/quizzes" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Geography & Science Quiz",
    "questions": [
      {
        "type": "BOOLEAN",
        "text": "The Earth revolves around the Sun."
      },
      {
        "type": "INPUT",
        "text": "What is the chemical symbol for water?"
      },
      {
        "type": "CHECKBOX",
        "text": "Which of the following are planets in our Solar System?",
        "options": [
          { "label": "Mars", "isCorrect": true },
          { "label": "Jupiter", "isCorrect": true },
          { "label": "Pluto", "isCorrect": false },
          { "label": "Venus", "isCorrect": true }
        ]
      }
    ]
  }')

echo "$QUIZ_JSON"
QUIZ_ID=$(printf '%s' "$QUIZ_JSON" | node -p 'JSON.parse(require("node:fs").readFileSync(0, "utf8")).id')

# 2. List all quizzes
curl -s -X GET "$API/quizzes"

# 3. Fetch quiz details by ID
curl -s -X GET "$API/quizzes/$QUIZ_ID"

# 4. Delete quiz
curl -s -X DELETE "$API/quizzes/$QUIZ_ID"
```

---

## Project Structure

```text
Quiz/
  compose.yaml                # Docker Compose configuration for PostgreSQL (port 5432)
  package.json                # Monorepo scripts (dev, db:*, lint, typecheck, build)
  .env.example                # Docker Compose environment template
  .nvmrc                      # Verified Node.js version
  scripts/
    seed.mjs                  # Database seed script communicating via REST API
    package-source.mjs        # Source ZIP creation with an explicit inclusion list
  backend/
    .env.example              # NestJS backend environment template (port 3001)
    test/
      quizzes-http.test.mjs    # HTTP validation and request size regression tests
    prisma/
      schema.prisma           # Prisma schema: Quiz, Question, QuestionOption (with order)
      migrations/             # SQL migrations: init and add_option_order
    prisma.config.ts          # Prisma CLI v7 configuration bound to backend/.env
    src/
      config/                 # Environment validation and shared HTTP configuration
      health/                 # GET /health healthcheck module
      prisma/                 # PrismaService and PrismaModule
      quizzes/
        dto/
          create-quiz.dto.ts  # CreateQuizDto with trimming, length limits, and option validation
        quizzes.controller.ts # REST controller with explicit return types
        quizzes.service.ts    # CRUD operations service (order for questions & options, P2025 race handling)
        quizzes.module.ts
      main.ts                 # NestJS bootstrap entry point with ValidationPipe and CORS
  frontend/
    .env.example              # Next.js frontend environment template
    src/
      app/
        layout.tsx            # Root layout with Plus Jakarta Sans (next/font/google)
        globals.css           # Design system (glassmorphism, accessibility, animations)
        page.tsx              # Root redirect from '/' to '/quizzes'
        create/
          layout.tsx          # Server layout with metadata title ('Create quiz')
          page.tsx            # Interactive client quiz builder with limit validations
        quizzes/
          layout.tsx          # Server layout with metadata title ('Quizzes')
          page.tsx            # Quizzes dashboard with inline error banners and AbortController
          [id]/
            layout.tsx        # Server layout with metadata title ('Quiz details')
            page.tsx          # Quiz details preview (404 via ApiError.status, state reset)
      components/
        icons.tsx             # Centralized SVG icons
        question-field.tsx    # Modular single question input component with maxLength
        checkbox-options.tsx  # Modular checkbox options component (20 options limit)
        navigation.tsx        # Header navbar with active route indicator
      lib/
        question-types.ts     # Shared question type config TYPE_CONFIG
        quiz-limits.ts        # Client form limits synchronized with backend DTO
      services/
        api-config.ts         # Base API URL (fallback http://localhost:3001)
        quizzes.ts            # API client service, typed ApiError class, and encodeURIComponent
```

---

## Pre-submission Checklist

Before submitting, run all automated checks from the project root:

```powershell
# 1. ESLint check (0 errors, 0 warnings)
npm run lint

# 2. TypeScript typecheck
npm run typecheck

# 3. Prettier format check
npm run format:check

# 4. HTTP regression tests (no running database required)
npm test

# 5. Production build for frontend and backend
npm run build
```

`npm test` builds the backend, then exercises its real controller, DTO validation and HTTP configuration with a stubbed persistence service. It covers malformed question/option structures, all three question types, maximum-size quizzes (including escaped Unicode), malformed JSON and the body size limit. These tests do not replace database integration checks.

### Source Archive

```powershell
npm run package:source
```

Produces `release/quiz-builder-source.zip` with source code, migrations, tests, configuration, environment templates and the lockfile. It excludes local `.env` files, `.git`, `node_modules`, generated clients, build output and verification artifacts. On a clean machine, extract the archive and follow Quick Start above. The `release/` directory is ignored by Git and Prettier.

### Dependency Audit

```powershell
npm audit --omit=dev
npm audit
```

As of 2026-10-21, the production dependency audit reports no vulnerabilities. The full audit reports five related high-severity findings in the development-only ESLint dependency chain (`eslint-config-next` → `@next/eslint-plugin-next` → `fast-glob` → `micromatch` → `braces`). The latest available `braces` version, 3.0.3, has no published fix for [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). Recheck for an upstream patch before submission; `npm audit fix --force` currently proposes an incompatible Next.js lint configuration downgrade.

### Manual Verification Scenario:

1. **Create Quiz**: Open `http://localhost:3000/create`, provide a title and add 3 question types (`BOOLEAN`, `INPUT`, `CHECKBOX` with choices and correct answer marks). Click «Save and publish quiz».
2. **Dashboard Overview**: The app redirects to `http://localhost:3000/quizzes`, where the newly created quiz appears in the list with the correct question count.
3. **Detail Preview**: Click on the quiz to open `http://localhost:3000/quizzes/<id>` — verify all questions are rendered read-only, and correct checkbox options are badged with a green «Correct answer» tag.
4. **Deletion**: Return to the quiz list and click the trash icon 🗑 button. Confirm the dialog; the quiz is removed immediately from the list, and any subsequent GET request for that ID returns a 404 «Quiz not found».
