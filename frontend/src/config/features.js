// Feature flags - control which features are visible
// Set to true to enable, false to disable
// Update these for each sprint to show incremental progress

export const FEATURES = {
  COMPANY_SETTINGS: true, // US-12 and US-15
  // Sprint 3: Customer journey (4 stories)
  BROWSE_PROJECTS: true,      // US-31: Browse Design Projects
  PROJECT_DETAIL: true,       // US-35: View Project Details
  SEARCH_FILTER: true,        // US-03: Search and Filter
  VIEWS_SHORTLIST: true,      // US-07: Views and Shortlist

  // Sprint 4: Analytics and Platform (4 stories)
  PORTFOLIO_DASHBOARD: true, // US-48: View Portfolio Interest Overview
  TREND_CHART: true,         // US-49: Track View and Shortlist Trends Over Time
  CATEGORIES: true,          // US-51: Manage Interior Design Project Categories
  MODERATION: true,          // US-56: Moderate Flagged Project Content

  // Sprint 5: Designer and Company management (4 stories)
  CREATE_PROJECT: true,      // US-21: Create Interior Design Project
  PUBLICATION_STATUS: true,  // US-24: Manage Project Publication Status
  PROPERTY_TYPES: true,      // US-12: Manage Supported Property Types
  BUDGET_RANGE: true,       // US-15: Set Accepted Renovation Budget Range

  // Sprint 3 sub-features (US-31)
  BROWSE_PAGINATION: true,   // US-31: Display Paginated List
  BROWSE_SORT: true,         // US-31: Sort Displayed List
  BROWSE_CATEGORY_FILTER: true, // US-31: Use Category Filters

  // Sprint 3 sub-features (US-35)
  DETAIL_DESIGNER_PROFILE: true, // US-35: View Designer Profile

  // Sprint 4 sub-features (US-51)
  CATEGORY_RENAME: true,     // US-51: Rename Project Category
  CATEGORY_VALIDATE: true,   // US-51: Validate Category Name
}