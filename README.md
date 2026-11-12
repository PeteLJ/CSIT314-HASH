# CSIT314-HASH
# Interior Design Matching Web Application
Mini-FYP group project for CSIT314

Website (GitHub Pages): https://petelj.github.io/CSIT314-HASH/

## Tech Stack

- **Backend:** Python 3.10 + Django 4.2 + Django REST Framework
- **Frontend:** React 18 + Vite + Material UI (MUI) + Chart.js
- **Database:** SQLite (development) / PostgreSQL (production)
- **CI/CD:** GitHub Actions
- **Agile tool:** Taiga

## Getting Started

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python seed_data.py
python manage.py runserver
```

The backend runs locally at http://127.0.0.1:8000. Django admin at http://127.0.0.1:8000/admin/

The backend is also deployed on PythonAnywhere's server at https://petelj.pythonanywhere.com/admin/
Username: admin
Password: admin123

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at http://localhost:5173.

## Project Structure

```
main/
├── backend/
│   ├── config/
│   ├── accounts/
│   ├── projects/
│   ├── analytics/
│   ├── categories/
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   └── package.json
├── .github/workflows/
├── .gitignore
└── README.md
```

## User Roles
4 actors
| Role | Description |
|---|---|
| Customer | Browses and saves design projects |
| Interior Designer | Manages company info and portfolio |
| User Admin | Manages user accounts |
| Platform Manager | Manages categories and moderation |

## Platform Manager Features

### Manage project categories
- Create, rename, delete categories
- Validate empty/duplicate names
- Show project count per category

API endpoints:
- `GET/POST /api/categories/`
- `PATCH/DELETE /api/categories/<id>/`

### Review flagged projects
- Flag reports with reason and details
- Moderate (remove or dismiss)

API endpoints:
- `GET/POST /api/project-flags/`
- `PATCH /api/project-flags/<id>/moderate/`

## Running Tests

```bash
cd backend
python manage.py test
```

## CI/CD

GitHub Actions runs backend tests on every push to `main`. See `.github/workflows/ci.yml`.

---

## Common Issues

- **PythonAnywhere backend:** Live at https://petelj.pythonanywhere.com/admin/
- **CORS errors:** Set `CORS_ALLOWED_ORIGINS` env var to include `http://localhost:5173`
- **No projects showing:** Run `python seed_data.py` to populate database
- **Company settings empty:** Run `python manage.py provision_companies` after migrate
