# UXTest 🎯

A self-hosted usability testing platform. Upload design screens, define click targets, share a link with testers, and analyze click heatmaps + timing data.

![CI](https://github.com/YOUR_USERNAME/uxtest/actions/workflows/ci.yml/badge.svg)

---

## Features

- **Multi-screen flows** — chain multiple screens into one test
- **Zone editor** — draw target zones directly on uploaded images
- **Tester view** — clean full-screen interface with task bar and live click tracking
- **Heatmap analytics** — per-screen click heatmaps, success rates, timing data
- **Session table** — per-tester breakdown with misclick rates
- **CSV export** — download all session data
- **Zero external services** — single Node.js process, JSON file database

---

## Quick Start

### Option A — Docker (one command)

```bash
git clone https://github.com/YOUR_USERNAME/uxtest.git
cd uxtest
docker compose up --build
```

Open **http://localhost:3001**

### Option B — Manual

```bash
git clone https://github.com/YOUR_USERNAME/uxtest.git
cd uxtest
```

Terminal 1 — Backend:
```bash
cd backend && npm install && npm start
# → http://localhost:3001
```

Terminal 2 — Frontend:
```bash
cd frontend && npm install && npm run dev
# → http://localhost:5173
```

---

## Publish to GitHub

```bash
cd uxtest
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/uxtest.git
git push -u origin main
```

---

## Deploy

### Railway (easiest)
1. [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select your repo — Railway auto-detects the Dockerfile
3. Set env var `PORT=3001`
4. Done ✓

### Render
1. [render.com](https://render.com) → New Web Service → connect GitHub repo
2. Runtime: Docker, Port: 3001

### Any Linux VPS
```bash
git clone https://github.com/YOUR_USERNAME/uxtest.git
cd uxtest
docker compose up -d --build
```

---

## Project Structure

```
uxtest/
├── .github/workflows/ci.yml   GitHub Actions CI
├── backend/
│   ├── server.js               Express API
│   ├── db.js                   JSON database (lowdb)
│   └── uploads/                Uploaded images (git-ignored)
├── frontend/src/
│   ├── pages/                  Dashboard, CreateTest, TestRunner, Results, EditTest
│   └── components/             ZoneEditor, Heatmap, Toast, Navbar
├── Dockerfile                  Multi-stage build
├── docker-compose.yml
└── README.md
```

---

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tests` | List tests |
| POST | `/api/tests` | Create test |
| GET | `/api/tests/:id` | Get test |
| PUT | `/api/tests/:id` | Update zones/tasks |
| DELETE | `/api/tests/:id` | Delete test |
| POST | `/api/tests/:id/sessions` | Submit session |
| GET | `/api/tests/:id/analytics` | Analytics + heatmap data |
| GET | `/api/tests/:id/export` | CSV export |

---

## License

MIT
