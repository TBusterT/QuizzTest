# Quiz Builder

Повноцінний веб-застосунок для створення та перегляду опитувань (**Quiz Builder**) з підтримкою різних типів запитань: логічні (True / False), текстові (коротка відповідь) та вибір кількох варіантів (множинний вибір).

> [!NOTE]
> За вимогами специфікації, питання типу `BOOLEAN` та `INPUT` є ознайомчими/відкритими та не зберігають правильної відповіді в базі даних. Питання типу `CHECKBOX` (множинний вибір) зберігають прапорець `isCorrect` та порядковий номер `order` для кожного доданого варіанта відповіді.

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

- Node.js `>= 24.14.0 < 25` та npm `>= 11`
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

### 3. Встановлення залежностей

```powershell
npm install
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

Ця команда застосовує всі існуючі Prisma-міграції до запущеної бази даних (`init` та `add_option_order`).

### 6. Генерація клієнта Prisma Client

```powershell
npm run db:generate
```

Генерує типізований клієнт Prisma у `backend/src/generated/prisma`.

### 7. (Опціонально) Заповнення бази тестовими даними

```powershell
npm run db:seed
```

### 8. Запуск у режимі розробки

```powershell
npm run dev
```

Ця команда запускає одночасно:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`

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
QUIZ_ID=$(echo "$QUIZ_JSON" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

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
  scripts/
    seed.mjs                  # Скрипт заповнення бази зразковими даними через API
  backend/
    .env.example              # Шаблон конфігурації для NestJS (порт 3001)
    prisma/
      schema.prisma           # Схема Prisma: моделі Quiz, Question, QuestionOption (з полем order)
      migrations/             # SQL-міграції: init та add_option_order
    prisma.config.ts          # Конфігурація Prisma CLI v7 з прив'язкою до backend/.env
    src/
      config/                 # Валідація змінних оточення (PORT, DATABASE_URL, FRONTEND_URL)
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

# 4. Продакшн-білд фронтенду та бекенду
npm run build
```

### Ручний сценарій перевірки:

1. **Створення квізу:** відкрити `http://localhost:3000/create`, заповнити назву та додати 3 типи питань (`BOOLEAN`, `INPUT`, `CHECKBOX` із варіантами відповідей і позначеними правильними). Натиснути кнопку «Save and publish quiz».
2. **Перегляд дашборду:** додаток автоматично перенаправить на `http://localhost:3000/quizzes`, де новий квіз відображається у списку з правильною кількістю запитань.
3. **Детальний перегляд:** клікнути на квіз і відкрити `http://localhost:3000/quizzes/<id>` — переконатися, що всі питання відображаються у read-only режимі, а правильні варіанти множинного вибору позначені зеленим тегом «Correct answer».
4. **Видалення:** повернутися до списку квізів та натиснути кнопку з іконкою кошика 🗑. Після підтвердження квіз миттєво зникає зі списку, а повторний запит за цим ID повертає статус 404 «Quiz not found».
