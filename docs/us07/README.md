# US-07: View Project Interest extensions

Implements the three extensions in the supplied use-case diagram:

| Extension | Behavior |
| --- | --- |
| Change Reporting Period | Designer Dashboard offers All time (default), Last 7 days, Last 30 days, and Last 90 days. Changing the selection reloads totals and rankings for the same designer. |
| Show Zero Interest Counts | Owned projects remain in the table with numeric `0` views and shortlists when they have no events in the selected period. A no-interest message explains the zero totals. |
| Show No Projects Message | A designer with no owned projects sees zero summary counts, a separate “No projects available” message, and a link to create a project. No empty ranking table is shown. |

Taiga's linked project required authentication during implementation. Period options above are implementation choices based on the screenshot; no additional Taiga acceptance criteria could be verified.

## API

`GET /api/analytics/portfolio/?designer_id=<id>&period=<period>`

- `period`: `all` (default), `7d`, `30d`, or `90d`. Invalid values return HTTP 400.
- Finite periods are rolling intervals from `now - N days` through `now`, including both boundaries. Events are filtered by `occurred_at`; project creation date does not hide owned projects. Future events are excluded, including for `all`.
- The response retains `total_views`, `total_shortlists`, `project_count`, and `projects`, and adds `designer_id`, `period`, `period_start` (null for all time), and `period_end` as ISO timestamps.
- Projects rank by shortlists, then views, descending; equal counts use project ID ascending.
- Existing authenticated/default designer fallback behavior remains available to API callers. The dashboard waits for a selected designer instead of requesting the default portfolio.
- Empty portfolios return HTTP 200 with an empty project list and zero totals. Request failures remain errors, rather than being displayed as zero activity or no projects.
- Five-second refreshes retain the selected period. Responses from previous selections are ignored.

No database migration is required. Deploy the backend and frontend together for period filtering to take effect.

## Verification

Verified with Python 3.12: all 71 backend tests pass after syncing with upstream main, Django system checks pass, and the dashboard interaction tests and production build pass. Frontend lint completes with existing warnings in other components; the dashboard and its new test have no lint warnings. The build also retains the existing large-bundle warning.

Use Python 3.12 for the commands below. This machine's default Python 3.14 triggers an existing Django 4.2 traceback-rendering incompatibility in an unrelated company-settings test. A compatible local environment is available at `.venv/test312` in this checkout.

```powershell
# From the backend folder, using a Python environment with requirements.txt installed:
python -m pytest

# From the frontend folder:
npm ci
npm run test:interest
npm run build
npm run lint
```

To run locally from the repository root in two PowerShell terminals:

```powershell
# Terminal 1: backend (using the prepared local Python 3.12 environment)
.\.venv\test312\Scripts\python.exe backend\manage.py migrate
.\.venv\test312\Scripts\python.exe backend\manage.py runserver

# Terminal 2: frontend
cd frontend
npm run dev
```

Open `http://localhost:5173/CSIT314-HASH/#/dashboard`. A fresh database needs designer/project records (use the existing project seed scripts or Django admin) to exercise the populated states.

Manual acceptance checks:

1. Select Interior Designer in the navigation bar and open Designer Dashboard. Switch reporting periods and check that totals and project rankings refresh.
2. For a designer with projects but no events in the chosen period, check the no-interest message, zero totals, and retained project rows with zero counts.
3. Select a designer with no projects. Check the no-projects message and Create a project link.
4. Switch periods or designers quickly. Only the most recent selection should appear. Stop the backend and check the error and Retry action, then restart it and retry.
