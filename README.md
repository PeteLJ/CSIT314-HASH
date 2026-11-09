# CSIT314-HASH
# Interior Design Matching Web Application
Mini-FYP group project for CSIT314

Website (GitHub Pages): https://petelj.github.io/CSIT314-HASH/

## Tech Stack

- **Backend:** Python 3.9 + Django 4.2 + Django REST Framework
- **Frontend:** React 18 + Vite + Material UI (MUI) + Chart.js
- **Database:** SQLite
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

The backend & Database runs in Google Cloud VM?, at `TBC`. The admin panel is at `TBC`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs in Github Pages, at `TBC`.

## Project Structure

```
main/
├── backend/          # Django project      (current state: pending creation)
│   ├── config/       # Settings, URLs, WSGI
│   ├── accounts/     # User model, roles, permissions
│   ├── projects/     # IDP, IDPViewEvent, Favourite
│   ├── analytics/    # Analytics (placeholder)
│   ├── categories/   # Category model
│   ├── requirements.txt
│   └── .env.example
├── frontend/         # React + Vite project      (current state: blank template web app)
│   ├── src/
│   └── package.json
├── .github/workflows/ci.yml
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
| Platform Manager | Manages categories and reports |

## Platform Manager Features

### Manage project categories

- Create categories with a name and description.
- Rename existing categories inline from the management page.
- Reject empty or duplicate category names (case-insensitive).
- Show how many projects use each category.
- Prevent deletion while a category is assigned to projects.

API endpoints:

- `GET/POST /api/categories/`
- `GET/PATCH/DELETE /api/categories/<id>/`

### Review flagged projects

- Customers can report a published project from its detail page.
- Reports include a reason and optional supporting details.
- Platform Managers see all open reports with project, designer and reporter context.
- A report can be dismissed, or the project can be removed from public browsing.
- Every moderation decision stores its status, note, reviewer and resolution time.

API endpoints:

- `GET/POST /api/project-flags/`
- `PATCH /api/project-flags/<id>/moderate/`

After pulling changes that include new models, run:

```bash
cd backend
python manage.py migrate
```

## Running Tests

```bash
cd backend
python -m pytest
```

## CI/CD

GitHub Actions runs the backend tests on every push and pull request to `main`. See `.github/workflows/ci.yml`.
