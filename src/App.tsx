import { ToastProvider } from "./components/ui/toast"
import Queue from "./_pages/Queue"
import { ToastViewport } from "@radix-ui/react-toast"
import { useEffect, useRef, useState } from "react"
import Solutions from "./_pages/Solutions"
import Insights from "./_pages/Insights"
import { QueryClient, QueryClientProvider } from "react-query"

// Production-ready type definitions for productivity tracking
interface ProductivityInsights {
  executiveSummary: string
  productivityNarrative: string
  behavioralPatterns: string
  recommendations: string
}

interface ProductivityStats {
  totalRecords: number
  hoursTracked: number
  focusPercentage: number
  topApp: string
  dayStart: string
  dayEnd: string
}

interface HourlyBreakdownItem {
  hour: number
  count: number
  focusCount: number
  goalRelatedCount: number
}

declare global {
  interface Window {
    electronAPI: {
      //RANDOM GETTER/SETTERS
      updateContentDimensions: (dimensions: {
        width: number
        height: number
      }) => Promise<void>
      getScreenshots: () => Promise<Array<{ path: string; preview: string }>>

      //GLOBAL EVENTS
      onUnauthorized: (callback: () => void) => () => void
      onScreenshotTaken: (
        callback: (data: { path: string; preview: string }) => void
      ) => () => void
      onProcessingNoScreenshots: (callback: () => void) => () => void
      onResetView: (callback: () => void) => () => void
      takeScreenshot: () => Promise<void>

      //INITIAL SOLUTION EVENTS
      deleteScreenshot: (
        path: string
      ) => Promise<{ success: boolean; error?: string }>
      onSolutionStart: (callback: () => void) => () => void
      onSolutionError: (callback: (error: string) => void) => () => void
      onSolutionSuccess: (callback: (data: any) => void) => () => void
      onProblemExtracted: (callback: (data: any) => void) => () => void

      onDebugSuccess: (callback: (data: any) => void) => () => void
      onDebugStart: (callback: () => void) => () => void
      onDebugError: (callback: (error: string) => void) => () => void

      // Audio Processing
      analyzeAudioFromBase64: (data: string, mimeType: string) => Promise<{ text: string; timestamp: number }>
      analyzeAudioFile: (path: string) => Promise<{ text: string; timestamp: number }>

      // PRODUCTIVITY TRACKING APIS - Now with proper types
      generateDailyInsights: (date?: string) => Promise<{
        success: boolean
        error?: string
        data?: {
          insights: ProductivityInsights
          stats: ProductivityStats
          date: string
          activityCount: number
        }
      }>
      getDailyStats: (date?: string) => Promise<{
        success: boolean
        error?: string
        data?: ProductivityStats
      }>
      getHourlyBreakdown: (date?: string) => Promise<{
        success: boolean
        error?: string
        data?: HourlyBreakdownItem[]
      }>

      moveWindowLeft: () => Promise<void>
      moveWindowRight: () => Promise<void>
      quitApp: () => Promise<void>
    }
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      cacheTime: Infinity,
      retry: 2, // Add retry logic for production
      refetchOnWindowFocus: false // Disable refetch on focus for productivity app
    }
  }
})

// Export view type for use in other components
export type ViewType = "queue" | "solutions" | "debug" | "insights"

const App: React.FC = () => {
  const [view, setView] = useState<ViewType>("queue")
  const containerRef = useRef<HTMLDivElement>(null)

  // Effect for height monitoring
  useEffect(() => {
    const cleanup = window.electronAPI.onResetView(() => {
      console.log("Received 'reset-view' message from main process.")
      queryClient.invalidateQueries(["screenshots"])
      queryClient.invalidateQueries(["problem_statement"])
      queryClient.invalidateQueries(["solution"])
      queryClient.invalidateQueries(["new_solution"])
      // Also invalidate productivity queries
      queryClient.invalidateQueries(["daily-insights"])
      queryClient.invalidateQueries(["daily-stats"])
      queryClient.invalidateQueries(["hourly-breakdown"])
      setView("queue")
    })

    return () => {
      cleanup()
    }
  }, [])

  useEffect(() => {
    if (!containerRef.current) return

    const updateHeight = () => {
      if (!containerRef.current) return
      const height = containerRef.current.scrollHeight
      const width = containerRef.current.scrollWidth
      window.electronAPI?.updateContentDimensions({ width, height })
    }

    const resizeObserver = new ResizeObserver(() => {
      updateHeight()
    })

    // Initial height update
    updateHeight()

    // Observe for changes
    resizeObserver.observe(containerRef.current)

    // Also update height when view changes
    const mutationObserver = new MutationObserver(() => {
      updateHeight()
    })

    mutationObserver.observe(containerRef.current, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true
    })

    return () => {
      resizeObserver.disconnect()
      mutationObserver.disconnect()
    }
  }, [view]) // Re-run when view changes

  useEffect(() => {
    const cleanupFunctions = [
      window.electronAPI.onSolutionStart(() => {
        setView("solutions")
        console.log("starting processing")
      }),

      window.electronAPI.onUnauthorized(() => {
        queryClient.removeQueries(["screenshots"])
        queryClient.removeQueries(["solution"])
        queryClient.removeQueries(["problem_statement"])
        setView("queue")
        console.log("Unauthorized")
      }),
      // Update this reset handler
      window.electronAPI.onResetView(() => {
        console.log("Received 'reset-view' message from main process")

        queryClient.removeQueries(["screenshots"])
        queryClient.removeQueries(["solution"])
        queryClient.removeQueries(["problem_statement"])
        // Clear productivity cache on reset
        queryClient.removeQueries(["daily-insights"])
        queryClient.removeQueries(["daily-stats"])
        queryClient.removeQueries(["hourly-breakdown"])
        setView("queue")
        console.log("View reset to 'queue' via Command+R shortcut")
      }),
      window.electronAPI.onProblemExtracted((data: any) => {
        if (view === "queue") {
          console.log("Problem extracted successfully")
          queryClient.invalidateQueries(["problem_statement"])
          queryClient.setQueryData(["problem_statement"], data)
        }
      })
    ]
    return () => cleanupFunctions.forEach((cleanup) => cleanup())
  }, [view]) // Add view dependency to prevent stale closures

  return (
    <div ref={containerRef} className="min-h-0">
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          {view === "queue" ? (
            <Queue setView={setView} />
          ) : view === "solutions" ? (
            <Solutions setView={setView} />
          ) : view === "insights" ? (
            <Insights setView={setView} />
          ) : view === "debug" ? (
            // Handle debug view - you might want to add a Debug component
            <Solutions setView={setView} />
          ) : null}
          <ToastViewport />
        </ToastProvider>
      </QueryClientProvider>
    </div>
  )
}

export default App

// Export types for use in other components
export type { ProductivityInsights, ProductivityStats, HourlyBreakdownItem }