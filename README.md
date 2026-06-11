# Eden — Backend

Node + Express + SQLite + Nodemailer (Gmail). Полная серверная авторизация с подтверждением по email.

## Быстрый старт

```bash
cd backend
npm install
cp .env.example .env
# отредактируй .env (см. ниже про Gmail)
npm start
```

Открыть [http://localhost:3000](http://localhost:3000)

## Настройка Gmail (чтобы реально приходили письма)

1. Включи **двухфакторную аутентификацию** в Google: <https://myaccount.google.com/security>
2. Сгенерируй **App Password**: <https://myaccount.google.com/apppasswords>
   - Выбери "Mail" в качестве app
   - Получишь 16-значный пароль вида `abcd efgh ijkl mnop`
3. Открой `backend/.env` и заполни:

```env
GMAIL_USER=tvojakount@gmail.com
GMAIL_APP_PASSWORD=abcdefghijklmnop
```

Пробелы внутри App Password не важны — сервер их сам уберёт.

4. Перезапусти `npm start`. В логе должно появиться: `Mail mode → GMAIL (configured)`.

Если оставить `GMAIL_USER` пустым — сервер работает в **DEMO-режиме**: коды печатаются в консоль сервера вместо отправки на почту. Удобно для разработки.

## Админ

В `.env` укажи свои почты через запятую:
```
ADMIN_EMAILS=you@gmail.com,partner@gmail.com
```
После регистрации этих юзеров они получат доступ к `/api/admin/*` (список пользователей, статистика и т.д.).

## Архитектура

```
backend/
├── server.js                 ← express entrypoint, serves /api/* + static frontend
├── db.js                     ← better-sqlite3 (файл eden.db создаётся автоматически)
├── lib/mailer.js             ← nodemailer + Gmail SMTP
├── middleware/auth.js        ← JWT verify + admin gate
├── routes/auth.js            ← signup / verify / signin / resend / me
├── routes/admin.js           ← users list, stats, mailer status
├── .env.example
└── package.json
```

## API endpoints

| Метод | Путь                       | Описание                                  |
|-------|----------------------------|-------------------------------------------|
| POST  | `/api/auth/signup`         | `{email, nick, password}` → код на email  |
| POST  | `/api/auth/verify`         | `{email, code}` → JWT + user              |
| POST  | `/api/auth/resend`         | `{email}` → новый код                     |
| POST  | `/api/auth/signin`         | `{email, password}` → JWT                 |
| GET   | `/api/auth/me`             | Bearer token → текущий пользователь       |
| GET   | `/api/auth/mailer-status`  | публичный — DEMO или GMAIL                |
| GET   | `/api/admin/users`         | (admin) список юзеров                     |
| DELETE| `/api/admin/users/:email`  | (admin) удалить                           |
| GET   | `/api/admin/stats`         | (admin) total / verified / pending        |
| GET   | `/api/admin/mailer`        | (admin) детальный статус SMTP             |
| GET   | `/api/health`              | health check                              |

## Безопасность

- Пароли хэшируются **bcrypt** (10 rounds).
- JWT подписывается секретом из `.env`. По умолчанию TTL 30 дней — настраивается через `JWT_TTL_DAYS`.
- 5 неверных вводов кода → код инвалидируется.
- Rate-limit на signup (10/час), signin (20/15min), verify (30/15min).
- Codes TTL 10 минут.
- Resend cooldown 30 секунд.

## Production checklist

- [ ] Сменить `JWT_SECRET` на случайную 96-символьную hex-строку: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
- [ ] Поставить за reverse proxy (nginx/caddy) с HTTPS
- [ ] `NODE_ENV=production`
- [ ] Бэкапить файл `eden.db`
- [ ] Для масштабирования заменить SQLite на Postgres (минимальные изменения в `db.js`)
