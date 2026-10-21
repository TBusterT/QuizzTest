# Quiz Builder

[🇬🇧 Read in English](README.md)

Повноцінний веб-застосунок для створення та перегляду опитувань (**Quiz Builder**) з підтримкою різних типів запитань: логічні (True / False), текстові (коротка відповідь) та вибір кількох варіантів (множинний вибір).

---

## Прийняті інженерні рішення (Design Decisions)

- **Збереження відповідей за типами запитань**: За вимогами технічного завдання цей проєкт реалізує саме конструктор опитувань (**Quiz Builder** — структуру та конфігурацію запитань), а не модуль проходження тесту чи оцінювання:
  - Питання типу `BOOLEAN` (True / False) та `INPUT` (довільний текст) задають структуру та форму для відповідей учасників, але не містять поля правильної відповіді в базі даних. Сторінки створення й деталей показують неактивний попередній перегляд цих форматів відповіді.
  - Питання типу `CHECKBOX` (множинний вибір) містять структуровані варіанти відповідей у таблиці `QuestionOption`, для кожного з яких зберігається прапорець `isCorrect: boolean` (позначення правильних опцій) та порядковий номер `order: number`.
- **Порядок варіантів та питань (`order`)**: Порядок питань і варіантів відповідей автоматично призначається сервером відповідно до індексу елементів у вхідному масиві запиту. При читанні дані впорядковуються за `order: 'asc'` (і `id: 'asc'` як fallback для консистентності в PostgreSQL).
- **Стійкість до гонки при видаленні**: Метод видалення квізу виконує прямий `prisma.quiz.delete` і обробляє помилку `P2025` через `try/catch`, повертаючи `404 Not Found` без зайвого попереднього читання.
- **Узгоджені ліміти**: Довжина заголовків, текстів запитань і підписів варіантів, а також їх кількості зафіксовані в єдиних константах `QUIZ_LIMITS` на клієнті, які синхронізовані з правилами валідації `class-validator` на бекенді.
- **Валідація запитів**: Кожне запитання й варіант відповіді мають бути об'єктами; вкладені масиви та примітивні значення повертають `400` до звернення до Prisma. Ліміт JSON становить 4 MiB і вміщує квіз із максимальними дозволеними довжинами, зокрема з екранованим Unicode. Більші запити повертають `413`.

---

## Технологічний стек

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Vanilla CSS (кастомна дизайн-система з glassmorphism, Google Fonts Plus Jakarta Sans через `next/font/google`, підтримка `prefers-reduced-motion` та мікро-анімації).
- **Backend**: NestJS 11, Express, TypeScript, `class-validator`, `class-transformer`.
- **Database & ORM**: PostgreSQL 17 (Docker Compose на порту 5432), Prisma ORM v7 з кастомним генератором клієнта.
- **Монорепозиторій**: npm workspaces (`@quiz-builder/frontend`, `@quiz-builder/backend`), `concurrently` для одночасного запуску.

---

## Локальні адреси

| Адреса                               | Призначення                                        |
| ------------------------------------ | -------------------------------------------------- |
| `http://localhost:3000/quizzes`      | Список усіх створених квізів (дашборд)             |
| `http://localhost:3000/create`       | Сторінка створення нового квізу                    |
| `http://localhost:3000/quizzes/<id>` | Сторінка перегляду квізу (read-only з критеріями)  |
| `http://localhost:3001/quizzes`      | REST API для отримання та створення квізів         |
| `http://localhost:3001/quizzes/<id>` | REST API для перегляду та видалення окремого квізу |
| `http://localhost:3001/health`       | Перевірка стану бекенду (`{ "status": "ok" }`)     |
| `127.0.0.1:5432`                     | Локальний інстанс PostgreSQL у Docker              |

---

## Швидкий запуск

### 1. Передумови

- Node.js 22.x (від 22.13.0) або 24.x та npm `>= 10`. Перевірено з Node.js `24.14.1`; ця версія також записана в `.nvmrc`.
- Встановлений та запущений Docker Desktop

### 2. Клонування та налаштування змінних оточення

Створіть локальні конфігураційні файли на основі прикладів:

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

Docker Compose читає кореневий `.env`; NestJS і Prisma CLI — `backend/.env`; Next.js — `frontend/.env.local`. Параметри PostgreSQL і порт повинні відповідати `DATABASE_URL`, а `NEXT_PUBLIC_API_URL` — адресі бекенду. Локальні env-файли ігноруються Git і не потрапляють в архів вихідного коду.

### 3. Встановлення залежностей

```powershell
npm ci
```

### 4. Запуск бази даних

```powershell
npm run db:up
```

Ця команда запускає контейнер PostgreSQL 17 на порту `5432`.

### 5. Застосування міграцій бази даних

```powershell
npm run db:migrate
```

Ця команда застосовує всі Prisma-міграції до бази даних (`init` та `add_option_order`).

### 6. Генерація клієнта Prisma Client

```powershell
npm run db:generate
```

Генерує типізований клієнт Prisma у `backend/src/generated/prisma`.

### 7. Запуск у режимі розробки

```powershell
npm run dev
```

Ця команда запускає одночасно:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`

### 8. (Опціонально) Заповнення бази тестовими даними

> [!IMPORTANT]
> Скрипт заповнення бази (`scripts/seed.mjs`) звертається до REST API через HTTP (`POST /quizzes`). Тому запускайте цю команду у **другому терміналі**, коли бекенд уже працює (`npm run dev`).

```powershell
npm run db:seed
```

---

## REST API Ендпоінти

| Метод    | Шлях           | Опис                                  | Тіло запиту / Відповідь                                   |
| :------- | :------------- | :------------------------------------ | :-------------------------------------------------------- |
| `GET`    | `/health`      | Healthcheck сервісу                   | `{ "status": "ok" }`                                      |
| `POST`   | `/quizzes`     | Створити новий квіз                   | `CreateQuizDto` -> повертає створений квіз (201)          |
| `GET`    | `/quizzes`     | Отримати список усіх квізів           | Масив `{ id, title, createdAt, _count: { questions } }`   |
| `GET`    | `/quizzes/:id` | Отримати повну інформацію про квіз    | Квіз із впорядкованими питаннями та варіантами відповідей |
| `DELETE` | `/quizzes/:id` | Видалити квіз та каскадно всі питання | `204 No Content` (або `404 Not Found`)                    |

### Підтримувані типи запитань (`QuestionType`):

- `BOOLEAN`: питання з фіксованими варіантами «True / False».
- `INPUT`: питання з полем для введення короткої відповіді.
- `CHECKBOX`: питання множинного вибору (від 2 до 20 варіантів, хоча б один правильний).

Порядок запитань та варіантів відповідей (`order`) автоматично виставляється сервером відповідно до індексу в переданому масиві.

---

## Приклади роботи з API

### Варіант 1: PowerShell

```powershell
$api = 'http://localhost:3001'

# 1. Створити новий квіз із 3 типами запитань
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

# 2. Отримати список усіх квізів
Invoke-RestMethod "$api/quizzes"

# 3. Отримати деталі створеного квізу
Invoke-RestMethod "$api/quizzes/$($quiz.id)"

# 4. Видалити квіз
Invoke-RestMethod -Method Delete "$api/quizzes/$($quiz.id)"
```

### Варіант 2: cURL (Bash)

```bash
API="http://localhost:3001"

# 1. Створити новий квіз із 3 типами запитань
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

# 2. Отримати список усіх квізів
curl -s -X GET "$API/quizzes"

# 3. Отримати деталі квізу за ID
curl -s -X GET "$API/quizzes/$QUIZ_ID"

# 4. Видалити квіз
curl -s -X DELETE "$API/quizzes/$QUIZ_ID"
```

---

## Структура проекту

```text
Quiz/
  compose.yaml                # Docker Compose конфігурація для PostgreSQL (порт 5432)
  package.json                # Скрипти монорепозиторію (dev, db:*, lint, typecheck, build)
  .env.example                # Шаблон конфігурації Docker Compose
  .nvmrc                      # Перевірена версія Node.js
  scripts/
    seed.mjs                  # Скрипт заповнення бази зразковими даними через API
    package-source.mjs        # Створення ZIP із явним переліком потрібних файлів
  backend/
    .env.example              # Шаблон конфігурації для NestJS (порт 3001)
    test/
      quizzes-http.test.mjs    # Регресійні HTTP-тести валідації та розміру запиту
    prisma/
      schema.prisma           # Схема Prisma: моделі Quiz, Question, QuestionOption (з полем order)
      migrations/             # SQL-міграції: init та add_option_order
    prisma.config.ts          # Конфігурація Prisma CLI v7 з прив'язкою до backend/.env
    src/
      config/                 # Валідація змінних оточення та спільна HTTP-конфігурація
      health/                 # Модуль GET /health
      prisma/                 # PrismaService та PrismaModule
      quizzes/
        dto/
          create-quiz.dto.ts  # CreateQuizDto з trim, лімітами довжини та валідацією options
        quizzes.controller.ts # REST контролер із явними типами повернення
        quizzes.service.ts    # Сервіс CRUD операцій (order для питань та варіантів, захист від гонки P2025)
        quizzes.module.ts
      main.ts                 # Точка входу NestJS із ValidationPipe та CORS
  frontend/
    .env.example              # Шаблон конфігурації для Next.js
    src/
      app/
        layout.tsx            # Кореневий layout з Plus Jakarta Sans (next/font/google)
        globals.css           # Дизайн-система (glassmorphism, prefers-reduced-motion)
        page.tsx              # Редірект з '/' на '/quizzes'
        create/
          layout.tsx          # Серверний layout з metadata title ('Create quiz')
          page.tsx            # Клієнтська сторінка створення квізу з валідацією лімітів
        quizzes/
          layout.tsx          # Серверний layout з metadata title ('Quizzes')
          page.tsx            # Дашборд квізів з inline-банером помилки та AbortController
          [id]/
            layout.tsx        # Серверний layout з metadata title ('Quiz details')
            page.tsx          # Детальний перегляд квізу (404 через ApiError.status, скидання стану)
      components/
        icons.tsx             # Централізовані SVG-іконки без дублювання
        question-field.tsx    # Модульний компонент редагування одного питання з maxLength
        checkbox-options.tsx  # Модульний компонент варіантів відповідей (ліміт 20 варіантів)
        navigation.tsx        # Навігаційна панель із підсвічуванням активної сторінки
      lib/
        question-types.ts     # Спільна конфігурація типів питань TYPE_CONFIG
        quiz-limits.ts        # Константи лімітів форми, узгоджені з DTO бекенду
      services/
        api-config.ts         # Базовий URL для API (fallback http://localhost:3001)
        quizzes.ts            # Клієнт API, типізований клас ApiError та encodeURIComponent
```

---

## Перевірка перед здачею

Перед здачею роботи виконайте автоматизовані перевірки коду:

```powershell
# 1. Перевірка лінтером ESLint (0 помилок, 0 попереджень)
npm run lint

# 2. Перевірка типів TypeScript
npm run typecheck

# 3. Перевірка форматування коду Prettier
npm run format:check

# 4. Регресійні HTTP-тести (запущена база не потрібна)
npm test

# 5. Продакшн-білд фронтенду та бекенду
npm run build
```

`npm test` збирає бекенд і перевіряє справжній контролер, DTO та HTTP-конфігурацію з підставним сервісом збереження. Тести охоплюють некоректну структуру запитань і варіантів, усі три типи питань, максимальні квізи (зокрема з екранованим Unicode), некоректний JSON та ліміт розміру запиту. Вони не замінюють інтеграційні перевірки бази даних.

### Архів для здачі

```powershell
npm run package:source
```

Команда створює `release/quiz-builder-source.zip` із вихідним кодом, міграціями, тестами, конфігурацією, env-прикладами та lockfile. Локальні `.env`, `.git`, `node_modules`, згенерований клієнт Prisma, результати збірки й перевірок виключені. На чистій машині розпакуйте архів і виконайте кроки швидкого запуску вище. Директорія `release/` ігнорується Git і Prettier.

### Аудит залежностей

```powershell
npm audit --omit=dev
npm audit
```

Станом на 2026-10-21 аудит production-залежностей не виявляє вразливостей. Повний аудит повідомляє про п'ять пов'язаних зауважень високої критичності в інструментах розробки: `eslint-config-next` → `@next/eslint-plugin-next` → `fast-glob` → `micromatch` → `braces`. Для останньої доступної версії `braces` 3.0.3 ще немає виправлення [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). Перед здачею повторіть аудит на випадок появи оновлення; `npm audit fix --force` наразі пропонує несумісне пониження версії конфігурації ESLint для Next.js.

### Ручний сценарій перевірки:

1. **Створення квізу:** відкрити `http://localhost:3000/create`, заповнити назву та додати 3 типи питань (`BOOLEAN`, `INPUT`, `CHECKBOX` із варіантами відповідей і позначеними правильними). Натиснути кнопку «Save and publish quiz».
2. **Перегляд дашборду:** додаток автоматично перенаправить на `http://localhost:3000/quizzes`, де новий квіз відображається у списку з правильною кількістю запитань.
3. **Детальний перегляд:** клікнути на квіз і відкрити `http://localhost:3000/quizzes/<id>` — переконатися, що всі питання відображаються у read-only режимі, а правильні варіанти множинного вибору позначені зеленим тегом «Correct answer».
4. **Видалення:** повернутися до списку квізів та натиснути кнопку з іконкою кошика 🗑. Після підтвердження квіз миттєво зникає зі списку, а повторний запит за цим ID повертає статус 404 «Quiz not found».
