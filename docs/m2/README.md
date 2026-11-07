# M2 company settings

Implemented US-M2-02 (US-12 / #74): supported property types, and US-M2-05 (US-15 / #77): accepted renovation budget range.

## Local setup

Backend terminal, from repository root:

```bash
cd backend
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py seed_m2_demo
```

Use the designer ID printed by the command:

```bash
DEBUG=True M2_DEMO_DESIGNER_ID=<printed-id> python manage.py runserver 127.0.0.1:8000
```

Frontend terminal:

```bash
cd frontend
npm ci
VITE_API_BASE_URL=http://127.0.0.1:8000/api npm run dev
```

Choose Interior Designer in the existing role selector, then Company Settings (`/#/company-settings`). The role selector only changes presentation. The demo identity is server-configured, requires DEBUG and a loopback client, and applies only to M2 endpoints. Run the backend directly on loopback without a reverse proxy. For normal use, existing token/session authentication applies; the new client reads `sessionStorage.apiToken`. No login/registration story was added. The API base override applies only to this page.

## Behavior

View/add/remove supported types using the shared catalog. Reject duplicates and unknown types; require removal confirmation. Removal does not delete catalog entries.

View/save minimum and maximum budget, both required, nonnegative, up to two decimal places, minimum <= maximum. Maximum representable amount: 9,999,999,999.99. Cancel restores loaded values. Type edits preserve unsaved budget input. Failed validation retains input; failed transactions roll back. Wrong HTTP methods return 405. Successful mutations update the local company state before refresh, and failed refresh offers Retry refresh. A refresh failure after save is reported separately from a failed save.

## Integration assumptions

The repository originally had only the text field User.company. It is preserved. The new Company has a one-to-one designer relation and a many-to-many PropertyType relation. Multiple designers sharing one company would require a membership model before integration. Migration 0003 provisions existing designers without overwriting company data. For designers added later, run `python manage.py provision_m2_companies`. The seed command creates a separate demo account and catalog. Missing company settings return 404. The legacy company name is copied only on seed creation.

SGD and the four sample catalog entries are demo assumptions. Empty selections and initially unset budgets are allowed. Implementation uses the story titles and prior design discussion; Taiga acceptance criteria have not been independently verified.

## API

All routes below use `/api/` and require a designer identity. Company scope comes from the authenticated user; client company IDs are rejected.

| Method | Route | Input | Success |
|---|---|---|---|
| GET | company/settings/ | none | 200: id, name, budget, property_types |
| GET | property-types/ | none | 200: catalog |
| PATCH | company/budget-range/ | minimum, maximum decimal strings | 200: budget |
| POST | company/property-types/ | type_id integer | 201 |
| DELETE | company/property-types/{type_id}/ | none | 204 |

Errors: 400 validation, 401 unauthenticated, 403 wrong role, 404 missing company, 503 database failure.

## UML alignment required before submission

The previous draw.io file remains a draft; it has not been rewritten in this code change.

| Draft element | Actual code |
|---|---|
| BudgetRangeUI / PropertyTypeUI | Sections in CompanySettingsPage |
| open / displayResult | initialLoad, load, React state rendering |
| BudgetRangeController | loadRange(user), updateRange(user, data) |
| PropertyTypeController | listSupportedTypes, addSupportedType, removeSupportedType |
| Validators | DRF serializer is_valid and validate |
| CompanyRepository.find(companyId) | forDesigner(user, lock=False) |
| Separate BudgetRange entity | Two decimal fields on Company |
| OperationResult | HTTP response/status or DRF exception |
| Explicit restoration of working values | Atomic database rollback; request-local object discarded |
| Repository save for type selections | Django many-to-many add/remove persistence |

Include API views as adapters between the React boundary and controllers. Company and PropertyType have a many-to-many association, not composition: catalog records survive removal. Do not add diamonds without a real whole-part relationship.

Budget sequence: page.saveBudget -> companyRequest -> BudgetRangeView.patch -> BudgetRangeController.updateRange -> validator.is_valid -> repository.forDesigner -> company.setBudgetRange -> repository.save -> company.getBudgetRange -> HTTP response -> page.load.

Add-type sequence: page.mutate -> companyRequest -> SupportedPropertyTypeView.post -> PropertyTypeController.addSupportedType -> repository.forDesigner -> company.getSupportedTypeIds -> validator.is_valid (catalog.exists) -> company.addSupportedType -> HTTP response -> page.load(false).

Descriptions should cover cancel, confirmation, duplicate/unknown type, invalid budget, missing company, database rollback, and refresh failure after a successful commit.

## Verification

Backend: python -m pytest -q; python manage.py check; python manage.py makemigrations --check --dry-run.
Frontend: npm run build; npm run lint.

Backend tests cover persistence, isolation, permissions, validation, rollback, demo restrictions and idempotent seed data. React DOM integration checks connect to an isolated real Django server/database. Run `python frontend/tests/run_m2_smoke.py` from the repository root after npm ci and pip install. This tests load, save, refresh failure recovery, cancel, retry, add/remove and persisted values. It is not browser layout testing.

## Integration verification and scope

Based on main e75e245. Existing creation/publication changes and designer selector are preserved. The company page uses the authenticated identity or fixed local demo identity, not the navigation selector. Production deployment still requires the team token integration; do not enable DEBUG to bypass this.

Baseline maintenance: main added UNPUBLISHED but omitted its migration, and its publication test omitted newly required fields. This branch adds the missing migration, updates the valid fixture, and checks rejection of incomplete projects. No existing publication behavior was weakened.

Current code includes fixes after the earlier UML snapshot: SupportedPropertyTypeView.initial checks method/path combinations; mutate updates local state before refresh; retryRefresh handles refresh recovery. Update the UML to include these operations before submitting diagrams as final documentation.

Verified locally: 43 backend tests passed; 16 of these directly cover M2 company settings. React DOM interactions against an isolated Django server passed; production frontend build passed. Real-browser layout testing was unavailable in this environment.
