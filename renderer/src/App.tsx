import React from 'react';
import { ToastProvider } from "./components/ui/toast"
import Queue from "./_pages/Queue"
import { ToastViewport } from "@radix-ui/react-toast"
import { useEffect, useRef, useState } from "react"
import Solutions from "./_pages/Solutions"
import Insights from "./_pages/Insights"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ViewType, ProductivityInsights, ProductivityStats, HourlyBreakdownItem } from "./types/navigation"

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

      // PRODUCTIVITY TRACKING APIS
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
      gcTime: Infinity, // Changed from cacheTime to gcTime
      retry: 2,
      refetchOnWindowFocus: false
    }
  }
})

const App: React.FC = () => {
  const [view, setView] = useState<ViewType>("queue")
  const containerRef = useRef<HTMLDivElement>(null)

  // Effect for height monitoring
  useEffect(() => {
    const cleanup = window.electronAPI.onResetView(() => {
      console.log("Received 'reset-view' message from main process.")
      queryClient.invalidateQueries({ queryKey: ["screenshots"] })
      queryClient.invalidateQueries({ queryKey: ["problem_statement"] })
      queryClient.invalidateQueries({ queryKey: ["solution"] })
      queryClient.invalidateQueries({ queryKey: ["new_solution"] })
      queryClient.invalidateQueries({ queryKey: ["daily-insights"] })
      queryClient.invalidateQueries({ queryKey: ["daily-stats"] })
      queryClient.invalidateQueries({ queryKey: ["hourly-breakdown"] })
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
        queryClient.removeQueries({ queryKey: ["screenshots"] })
        queryClient.removeQueries({ queryKey: ["solution"] })
        queryClient.removeQueries({ queryKey: ["problem_statement"] })
        setView("queue")
        console.log("Unauthorized")
      }),
      window.electronAPI.onResetView(() => {
        console.log("Received 'reset-view' message from main process")

        queryClient.removeQueries({ queryKey: ["screenshots"] })
        queryClient.removeQueries({ queryKey: ["solution"] })
        queryClient.removeQueries({ queryKey: ["problem_statement"] })
        queryClient.removeQueries({ queryKey: ["daily-insights"] })
        queryClient.removeQueries({ queryKey: ["daily-stats"] })
        queryClient.removeQueries({ queryKey: ["hourly-breakdown"] })
        setView("queue")
        console.log("View reset to 'queue' via Command+R shortcut")
      }),
      window.electronAPI.onProblemExtracted((data: any) => {
        if (view === "queue") {
          console.log("Problem extracted successfully")
          queryClient.invalidateQueries({ queryKey: ["problem_statement"] })
          queryClient.setQueryData(["problem_statement"], data)
        }
      })
    ]
    return () => cleanupFunctions.forEach((cleanup) => cleanup())
  }, [view])

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
            <Solutions setView={setView} />
          ) : null}
          <ToastViewport />
        </ToastProvider>
      </QueryClientProvider>
    </div>
  )
}

export default App