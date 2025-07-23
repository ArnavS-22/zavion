// src/types/navigation.ts

/**
 * All possible views in the application
 */
export type ViewType = "queue" | "solutions" | "debug" | "insights"

/**
 * Props for components that can navigate between views
 */
export interface NavigableComponentProps {
  setView: React.Dispatch<React.SetStateAction<ViewType>>
}

/**
 * Productivity data types for Insights view
 */
export interface ProductivityInsights {
  executiveSummary: string
  productivityNarrative: string
  behavioralPatterns: string
  recommendations: string
}

export interface ProductivityStats {
  totalRecords: number
  hoursTracked: number
  focusPercentage: number
  topApp: string
  dayStart: string
  dayEnd: string
}

export interface HourlyBreakdownItem {
  hour: number
  count: number
  focusCount: number
  goalRelatedCount: number
}
