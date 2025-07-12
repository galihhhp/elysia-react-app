# Elysia React App Monorepo

A modern fullstack monorepo: **ElysiaJS + Bun** for the backend, **React + Vite** for the frontend. Containerized, production-ready, and feature-flagged for easy extensibility.

---

## 🏗️ Project Structure

```
elysia-react-app/
├── elysia-backend/      # ElysiaJS + Bun backend (API, DB, logging)
├── react-frontend/      # React + Vite frontend (SPA, API integration)
└── README.md            # ← You are here
```

---

## ✨ Features

- **Fullstack, Modular**: Clean separation of backend and frontend.
- **Containerized**: Dockerfiles for both apps, ready for CI/CD.
- **Feature Flags**: Enable/disable edit & delete task features via env.
- **Structured Logging**: Winston for backend logs.
- **PostgreSQL Ready**: Connection pooling, env-configurable table/column names.
- **Modern Frontend**: React, Vite, TypeScript, mobile-first, accessible.

---

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (for backend dev)
- [Node.js](https://nodejs.org/) (for frontend dev)
- [Docker](https://www.docker.com/) (for container builds)

---

## 🛠️ Backend (elysia-backend)

### Setup

```bash
cd elysia-backend
bun install
cp .env.example .env # Edit as needed
```

### Environment Variables

| Variable            | Description                             | Default     |
| ------------------- | --------------------------------------- | ----------- |
| NODE_ENV            | production/development                  | development |
| DB_HOST             | Database host                           | localhost   |
| DB_PORT             | Database port                           | 5432        |
| DB_USER             | Database username                       | postgres    |
| DB_PASSWORD         | Database password                       | ""          |
| DB_NAME             | Database name                           | postgres    |
| DB_TABLE            | Table name for tasks                    | main_table  |
| DB_COLUMN_ID        | ID column name                          | id          |
| DB_COLUMN_TASK      | Task column name                        | task        |
| FEATURE_EDIT_TASK   | Enable edit task API ("true"/"false")   | false       |
| FEATURE_DELETE_TASK | Enable delete task API ("true"/"false") | false       |

### Scripts

- **Dev:** `bun run dev`
- **Prod:** `bun start`

### Docker

```bash
cd elysia-backend
docker build -t your-dockerhub-username/elysia-backend:latest .
docker run -d \
  --name elysia-app \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DB_HOST=your-db-host \
  -e DB_PORT=5432 \
  -e DB_USER=postgres \
  -e DB_PASSWORD=yourpassword \
  -e DB_NAME=postgres \
  -e DB_TABLE=main_table \
  -e DB_COLUMN_ID=id \
  -e DB_COLUMN_TASK=task \
  -e FEATURE_EDIT_TASK=true \
  -e FEATURE_DELETE_TASK=true \
  your-dockerhub-username/elysia-backend:latest
```

### API Endpoints

- `GET /` — Welcome message
- `GET /tasks` — List all tasks
- `POST /tasks` — Add a task `{ task: string }`
- `PUT /tasks/:id` — Edit a task (if enabled)
- `DELETE /tasks/:id` — Delete a task (if enabled)

---

## 🖥️ Frontend (react-frontend)

### Setup

```bash
cd react-frontend
bun install # or npm install
touch .env # or use .env.example if available
```

### Environment Variables (runtime)

| Variable                 | Description                            | Default |
| ------------------------ | -------------------------------------- | ------- |
| VITE_FEATURE_EDIT_TASK   | Enable edit task UI ("true"/"false")   | false   |
| VITE_FEATURE_DELETE_TASK | Enable delete task UI ("true"/"false") | false   |

### Runtime Config

- API URL dan feature flag di-load dari `/config.json` saat container start. File ini otomatis digenerate dari env oleh entrypoint.
- Contoh `/config.json` yang dihasilkan:

```json
{
  "apiUrl": "http://localhost:3000",
  "featureEditTask": "true",
  "featureDeleteTask": "true"
}
```

### Scripts

- **Dev:** `bun run dev` or `npm run dev`
- **Build:** `bun run build` or `npm run build`
- **Preview:** `bun run preview` or `npm run preview`

### Docker

```bash
cd react-frontend
docker build -t your-dockerhub-username/react-frontend:latest .
docker run -d \
  --name react-frontend \
  -p 80:80 \
  -e VITE_FEATURE_EDIT_TASK=true \
  -e VITE_FEATURE_DELETE_TASK=true \
  -e API_URL=http://localhost:3000 \
  your-dockerhub-username/react-frontend:latest
```

---

## 🧩 Feature Flags (Edit & Delete)

- **Backend:**
  - Set `FEATURE_EDIT_TASK` dan `FEATURE_DELETE_TASK` di env ("true" untuk enable)
- **Frontend:**
  - Set `VITE_FEATURE_EDIT_TASK` dan `VITE_FEATURE_DELETE_TASK` di env runtime ("true" untuk enable)
  - UI hanya akan menampilkan fitur edit/delete jika env aktif saat container dijalankan

---

## ⚙️ CI/CD

- Each app has its own GitHub Actions workflow for Docker build & push (see each `/project/.github/workflows/`)
- Add Docker Hub secrets to each repo for automated publishing

---

## 🤝 Contributing

PRs welcome! Please open issues for bugs/feature requests.

---

## License

MIT
