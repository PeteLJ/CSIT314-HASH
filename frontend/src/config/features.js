// Feature flags - control which features are visible
// Set to true to enable, false to disable
// Update these for each sprint to show incremental progress

export const FEATURES = {
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

  // Sprint 5: Designer and Company management (4 stories - not yet implemented)
  CREATE_PROJECT: false,      // US-21: Create Interior Design Project
  PUBLICATION_STATUS: false,  // US-24: Manage Project Publication Status
  EARLIEST_START_DATE: false, // US-16: Update Earliest Renovation Start Date
  RENOVATION_PACKAGES: false, // US-17: Manage Renovation Packages
}