# Wireframes (UI Design Mockups)

Wireframes for selected user stories. Created before development to guide UI implementation.

---

## US-03: Search and Filter Projects (Browse Page)

```
+----------------------------------------------------------+
|  HASH Designs   [Home] [Browse] [Dashboard] [Trend]     |
|  [Role: Customer v]                                      |
+----------------------------------------------------------+
|  Browse Design Projects                                  |
|                                                          |
|  [Search: Enter keyword...     ] [All Styles v]         |
|  [All Room Types v] [All Budgets v] [All Categories v]  |
|  [All Property Types v] [My Budget $  ] [Sort By v]     |
|                                                          |
|  +-------+  +-------+  +-------+                        |
|  | img   |  | img   |  | img   |                        |
|  |Title  |  |Title  |  |Title  |                        |
|  |Modern |  |Classic|  |Modern |                        |
|  |Living |  |Bedroom|  |Kitchen|                        |
|  |by John|  |by Mary|  |by Wei |                        |
|  |Handles|  |       |  |Handles|                        |
|  | HDB   |  |       |  | HDB   |                        |
|  |Budget |  |Budget |  |Budget |                        |
|  | 10k-  |  | 20k-  |  | 15k-  |                        |
|  | $25k  |  | $40k  |  | $35k  |                        |
|  +-------+  +-------+  +-------+                        |
|                                                          |
|  [Previous]    Page 1 of 5 (50 projects)    [Next]      |
+----------------------------------------------------------+
```

**Elements:**
- Search input (keyword search)
- Style filter dropdown (from categories)
- Room Type filter dropdown (from API)
- Budget range filter (4 ranges)
- Category filter dropdown
- Property Type filter dropdown (from company settings)
- My Budget input (filters by designer's company budget range)
- Sort dropdown (Latest, Budget Low→High, Budget High→Low)
- 3-column card grid (responsive: 3→2→1)
- Pagination controls
- Empty state: "No projects found"

---

## US-15: Set Accepted Renovation Budget Range (Company Settings)

```
+----------------------------------------------------------+
|  HASH Designs   [Home] [Company Settings]                |
|  [Role: Interior Designer v] [Designer: Wei Ming v]      |
+----------------------------------------------------------+
|  Company Settings                                        |
|                                                          |
|  Select Designer                                         |
|  [Wei Ming v]                                            |
|                                                          |
|  Company: Wei Ming Design Studio                         |
|                                                          |
|  +----------------------------------------------------+ |
|  | Accepted Renovation Budget Range                   | |
|  |                                                    | |
|  |  Min. Budget          Max. Budget                  | |
|  |  [ $12,000         ]  [ $50,000         ]          | |
|  |                                                    | |
|  |  [Save budget]  [Cancel changes]                   | |
|  +----------------------------------------------------+ |
|                                                          |
|  Amounts in SGD.                                         |
+----------------------------------------------------------+
```

**Elements:**
- Designer dropdown selector
- Company name display
- Min. Budget input (number, min 0)
- Max. Budget input (number, min 0)
- Save budget button (orange)
- Cancel changes button (gray)
- Dark theme styling

---

## US-21: Create Interior Design Project (Create Page)

```
+----------------------------------------------------------+
|  HASH Designs   [Home] [Create Project]                  |
|  [Role: Interior Designer v]                             |
+----------------------------------------------------------+
|       Create New Design Project                          |
|        Enter your project details below.                 |
|        New projects will be saved as Draft.              |
|                                                          |
|  Title:                                                  |
|  [My Beautiful Living Room                        ]    |
|                                                          |
|  Description: (optional)                                 |
|  [A beautiful modern design with lots of natural light |
|  and open space plan.                                ]    |
|                                                          |
|  Style:                                                  |
|  [Modern v]       (25% width)                            |
|                                                          |
|  Room Type:                                              |
|  [Living Room v]  (25% width)                            |
|                                                          |
|  Cost:                                                   |
|  [ $35,000         ]  (25% width)                        |
|                                                          |
|  Project Category: (auto-assigned from Style)            |
|                                                          |
|  [Create Project]                                        |
+----------------------------------------------------------+
```

**Elements:**
- Title input (required, 50% width)
- Description textarea (optional, full width)
- Style dropdown (from categories, 25% width)
- Room Type dropdown (from API, 25% width)
- Cost input (single field, 25% width, sets budget_min and budget_max)
- Create Project button (orange)
- Success/error messages
- Category auto-assigned from Style name

---

## US-31: Browse Design Projects (Browse Page - Card Grid)

```
+----------------------------------------------------------+
|  HASH Designs   [Home] [Browse] [Dashboard] [Trend]     |
+----------------------------------------------------------+
|  Browse Design Projects                                  |
|                                                          |
|  [Search: Enter keyword...     ] [All Styles v]         |
|  [All Room Types v] [All Budgets v] [All Categories v]  |
|  [All Property Types v] [My Budget $  ] [Sort By v]     |
|                                                          |
|  +---------------+  +---------------+  +---------------+ |
|  |               |  |               |  |               | |
|  | Image         |  | Image         |  | Image         | |
|  | Placeholder   |  | Placeholder   |  | Placeholder   | |
|  |               |  |               |  |               | |
|  +---------------+  +---------------+  +---------------+ |
|  | Cozy Living   |  | Modern Kitchen|  | Scandinavian  | |
|  | Modern        |  | Modern        |  | Scandinavian  | |
|  | Living Room   |  | Kitchen       |  | Whole Unit    | |
|  | by Wei Ming   |  | by Sarah Chen |  | by Jun Hao    | |
|  | Handles: HDB, |  |               |  | Handles:      | |
|  |  Condominium  |  |               |  |  Landed       | |
|  | Budget:       |  | Budget:       |  | Budget:       | |
|  |  $15k - $50k  |  |  $20k - $80k  |  |  $30k - $100k | |
|  | $25,000       |  | $45,000       |  | $65,000       | |
|  +---------------+  +---------------+  +---------------+ |
|                                                          |
|  [Previous]    Page 1 of 5 (50 projects)    [Next]      |
+----------------------------------------------------------+
```

**Card Elements:**
- Image placeholder (16:9 aspect ratio)
- Project title (link to detail page)
- Style
- Room Type (title case)
- Designer name
- Handles: property types (from company settings)
- Budget: company budget range (from company settings)
- Cost: project cost ($XX,XXX)

---

## US-35: View Project Details (Detail Page)

```
+----------------------------------------------------------+
|  HASH Designs   [Home] [Browse]                          |
+----------------------------------------------------------+
|  Back to Browse                                          |
|                                                          |
|  +------------------------+  +----------------------+  |
|  |                        |  | Cozy Living Room     |  |
|  |                        |  |                      |  |
|  |    Image               |  | Style: Modern        |  |
|  |    Placeholder         |  |                      |  |
|  |                        |  | Cost: $47,533         |  |
|  |                        |  |                      |  |
|  +------------------------+  | Designer: Sarah Chen |  |
|                              |  [View Designer ↑]   |  |
|                              |                      |  |
|                              | Room Type:           |  |
|                              | Living Room          |  |
|                              |                      |  |
|                              | A beautiful modern   |  |
|                              | design project with  |  |
|                              | lots of natural light|  |
|                              |                      |  |
|                              | Views: 22  Shortlists|  |
|                              |  1                   |  |
|                              +----------------------+  |
|                                                          |
|  [View Designer Profile expanded]:                       |
|  +--------------------------------------------------+  |
|  | Username: Sarah Chen                             |  |
|  | Company: Sarah Chen Design Studio                |  |
|  | Supported Property Types: HDB, Condominium       |  |
|  | Budget Range: $15,000 - $50,000                  |  |
|  +--------------------------------------------------+  |
+----------------------------------------------------------+
```

**Elements:**
- Back to Browse link
- Two-column layout (image placeholder + details)
- Cost display ($XX,XXX)
- Designer name + "View Designer Profile" button
- Room Type (title case)
- Description
- Views/Shortlists counts
- Designer profile expanded: username, company, supported property types, budget range

---

## US-48: View Portfolio Interest Overview (Dashboard)

```
+----------------------------------------------------------+
|  HASH Designs   [Home] [Dashboard]                       |
|  [Role: Interior Designer v] [Designer: Wei Ming v]      |
+----------------------------------------------------------+
|  Designer Portfolio                                      |
|                                                          |
|  +------------------+  +------------------+  +----------+|
|  | Total Views      |  | Total Shortlists |  | Projects |
|  |     15           |  |       7          |  |    3     |
|  +------------------+  +------------------+  +----------+|
|                                                          |
|  Ranked Projects                                         |
|  +-----+------------+-------------------+-------+-------+|
|  | ID  | Title      | Style             | Views | Shorts||
|  +-----+------------+-------------------+-------+-------+|
|  | 1   | Popular    | Modern            |  10   |   5   ||
|  | 2   | Medium     | Classic           |   5   |   2   ||
|  | 3   | New        | Scandinavian      |   0   |   0   ||
|  +-----+------------+-------------------+-------+-------+|
|                                                          |
|  (Auto-refreshes every 5 seconds)                        |
+----------------------------------------------------------+
```

**Elements:**
- Stat cards: Total Views, Total Shortlists, Projects count
- Ranked Projects table (sorted by shortlists desc, then views desc)
- Designer dropdown (20 designers)
- Auto-poll every 5 seconds

---

## US-49: Track View and Shortlist Trends Over Time (Trend Chart)

```
+----------------------------------------------------------+
|  HASH Designs   [Home] [Trend]                           |
|  [Role: Interior Designer v]                             |
+----------------------------------------------------------+
|  Trend Chart                                             |
|                                                          |
|  Project: Popular Project                                |
|  Designer: Wei Ming                                      |
|  Period: [Daily v]    (selects Daily/Weekly/Monthly)     |
|                                                          |
|  Views (blue line) -----\                               |
|  Shortlists (green line) =====                          |
|  30-day range with zero-filled gaps                      |
|                                                          |
|  [Chart.js line chart]                                   |
|  Y-axis: 0, 5, 10, 15 (integer ticks)                    |
|  X-axis: dates (last 30 days)                            |
|  Legend: right side, vertical (line icons)               |
|                                                          |
|  (Auto-updates every 10 seconds)                         |
+----------------------------------------------------------+
```

**Elements:**
- Project title and designer name
- Period selector (Daily, Weekly, Monthly)
- Line chart with 2 lines (views, shortlists)
- 30-day range with zero-filled gaps
- Y-axis: integer ticks, beginAtZero
- Legend: right side, vertical, line icons
- Auto-update every 10 seconds via generate-event endpoint

---

## US-56: Moderate Flagged Project Content (Moderation Dashboard)

```
+----------------------------------------------------------+
|  HASH Designs   [Home] [Moderation]                      |
|  [Role: Platform Manager v]                              |
+----------------------------------------------------------+
|  Moderation                                              |
|  [Flash type=success]Listing refreshed after moderation |
|  [Flash type=error]Failed to load flags                 |
|                                                          |
|  +-----+------------+------------+----------+----------+|
|  | ID  | Title      | Style    | Status   | Designer ||
|  +-----+------------+------------+----------+----------+|
|  | 1   | Cozy Living| Modern   | PUBLISHED| Wei Ming ||
|  | 2   | Kitchen    | Classic  | UNPUBLISHED| Sarah C||
|  | 3   | Bathroom   | Modern   | DRAFT    | Jun Hao  ||
|  +-----+------------+------------+----------+----------+|
|                                                          |
|  Selected Project: Cozy Living Room (ID: 1)              |
|                                                          |
|  Review customer reports:                                |
|  +-----+----------+------------+----------+------------+|
|  | ID  | Reason   | Details    | Status   | Actions    ||
|  +-----+----------+------------+----------+------------+|
|  | 1   | INAPPROP.| Contains   | OPEN     | [Remove]   ||
|  |     |          | words      |          | [Dismiss]  ||
|  +-----+----------+------------+----------+------------+|
|                                                          |
|  Moderation Note:                                        |
|  [Enter note or rejection reason...              ]       |
|                                                          |
|  [Resolve: Remove Project]    [Resolve: Dismiss Report]  |
+----------------------------------------------------------+
```

**Elements:**
- Project list table (ID, Title, Style, Status, Designer)
- Status badges (color-coded)
- Project Details button (select for review)
- Flag Reason (Inappropriate Content, Misleading Information, Copyright Infringement, Other)
- Flag Details (textarea)
- Moderation Note (textarea)
- Remove Project button (red) — sets project status to REMOVED, resolves report as RESOLVED
- Dismiss Report button (gray) — sets report status to DISMISSED
- Success/error messages at top
- Dark theme

---

## Notes

1. **Dark Theme:** All pages use dark gray gradient (linear-gradient 135deg, #2c2c2c, #4a4a4a, #1a1a1a) with cream navbar (#EAE6DF).

2. **No Hardcoding:** All dropdowns fetch from API:
   - Styles → `/api/categories/`
   - Room Types → `/api/room-types/`
   - Property Types → `/api/property-types/`

3. **Company Integration:** Company Settings (US-12/US-15) feeds into:
   - Browse page: property type filter, my budget filter, company info on cards
   - Project detail page: company info in designer profile
   - Designer dashboard: company stats

4. **Feature Flags:** Control visibility per sprint (Sprint 3, 4, 5)

5. **Role-Based Navigation:**
   - Customer: Home, Browse Projects
   - Interior Designer: Home, Browse Projects, Create Project, Manage Publication, Company Settings, Designer Dashboard
   - Platform Manager: Home, Browse Projects, Categories, Moderation

6. **Responsive Design:** Card grids adapt from 3 columns → 2 columns → 1 column. Navigation collapses to hamburger menu on mobile.

