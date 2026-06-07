# Efo ❤️ Daavi — Setup Guide

## Deploy on Render

### 1. Push to GitHub
Push this repo to your GitHub account.

### 2. Create a new Web Service on Render
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Node Version:** 18+

### 3. Set Environment Variables on Render
```
MONGODB_URI=mongodb+srv://lawrencesarpong2003_db_user:<password>@daavi.0zawtoh.mongodb.net/?appName=daavi
NEXTAUTH_SECRET=pick-any-long-random-string-here-min-32-chars
NEXTAUTH_URL=https://your-app-name.onrender.com
ADMIN_PASSWORD=Admin@2024
```

### 4. First-time Setup — Seed the Database
After deployment, visit:
```
https://your-app.onrender.com/api/seed
```
This creates the admin account and loads all 50 Pick-A-Number questions.

### 5. Accounts
| User | Username | Password | How to Access |
|------|----------|----------|---------------|
| Admin | `admin` | value of `ADMIN_PASSWORD` env var | Login page |
| Efo | `efo` | set during registration | Register page |
| Daavi | `daavi` | set during registration | Register page |

### 6. Admin Panel
Login as `admin` → tap **Admin** badge in top bar → `/admin`

## Local Development
```bash
cp .env.example .env.local
# Fill in your values
npm install
npm run dev
```
Then visit `http://localhost:3000/api/seed` once to set up the database.
