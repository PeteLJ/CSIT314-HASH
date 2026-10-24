# CSIT314-HASH-Interior Designer Project
Group project for CSIT314


## Tech Stack

- **Backend:** Python 3.9 + Django 4.2 + Django REST Framework
- **Frontend:** React 18 + Vite + Material UI (MUI) + Chart.js
- **Database:** SQLite (zero setup)
- **CI/CD:** GitHub Actions
- **Agile tool:** Taiga

## Getting Started

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

The backend runs at `http://127.0.0.1:8000`. The admin panel is at `http://127.0.0.1:8000/admin/`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173`.

## Project Structure

```
main/
├── backend/          # Django project
│   ├── config/       # Settings, URLs, WSGI
│   ├── accounts/     # User model, roles, permissions
│   ├── projects/     # IDP, IDPViewEvent, Favourite
│   ├── analytics/    # Analytics (placeholder)
│   ├── categories/   # Category model
│   ├── requirements.txt
│   └── .env.example
├── frontend/         # React + Vite project (pending development)
│   ├── src/
│   └── package.json
├── .github/workflows/ci.yml
├── .gitignore
└── README.md
```

## User Roles

| Role | Description |
|---|---|
| Customer | Browses and saves design projects |
| Interior Designer | Manages company info and portfolio |
| User Admin | Manages user accounts |
| Platform Management | Manages categories and reports |

## Running Tests

```bash
cd backend
python -m pytest
```

## CI/CD

GitHub Actions runs the backend tests on every push and pull request to `main`. See `.github/workflows/ci.yml`.
