# User Story Test Scripts

Each script tests one user story and can be run independently.

## How to Run

### Run all tests:
```bash
cd Assignment/backend
python ../tests/run_all.py
```

### Run a single test:
```bash
cd Assignment/backend
python ../tests/test_us03_search_filter.py
```

## Test Scripts

| Script | User Story | What It Tests |
|---|---|---|
| `test_us03_search_filter.py` | US-03: Search and Filter | Keyword search, style filter, budget filter, room type filter, combined filters |
| `test_us12_property_types.py` | US-12: Manage Supported Property Types | List property types, get company settings, add/remove property type |
| `test_us21_create_project.py` | US-21: Create Interior Design Project | Create project with valid data, validation (empty title), database verification |
| `test_us35_view_details.py` | US-35: View Project Details | Get project details, record view event, get view/shortlist counts, non-existent project 404 |
| `test_us48_portfolio_overview.py` | US-48: View Portfolio Interest Overview | Portfolio overview for designer, projects ranked by interest, empty portfolio, non-existent designer |
| `test_us49_trend_chart.py` | US-49: Track View and Shortlist Trends | Daily/weekly/monthly trend data, designer name in response, series structure, non-existent project 404 |
| `test_us51_categories.py` | US-51: Manage Project Categories | List categories, create category, validate empty name, rename category, delete category |

## Notes

- Test data is created at the start and cleaned up at the end of each script
- Tests use Django test framework RequestFactory for API testing
- No hardcoded values — all data is generated dynamically
- Scripts output PASS/FAIL for each test case