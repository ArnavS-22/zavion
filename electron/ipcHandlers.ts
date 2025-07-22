// ipcHandlers.ts

import { ipcMain, app } from "electron"
import { AppState } from "./main"
import { StorageHelper } from "./StorageHelper"

export function initializeIpcHandlers(appState: AppState): void {
  ipcMain.handle(
    "update-content-dimensions",
    async (event, { width, height }: { width: number; height: number }) => {
      if (width && height) {
        appState.setWindowDimensions(width, height)
      }
    }
  )

  ipcMain.handle("delete-screenshot", async (event, path: string) => {
    return appState.deleteScreenshot(path)
  })

  ipcMain.handle("take-screenshot", async () => {
    try {
      const screenshotPath = await appState.takeScreenshot()
      const preview = await appState.getImagePreview(screenshotPath)
      return { path: screenshotPath, preview }
    } catch (error) {
      console.error("Error taking screenshot:", error)
      throw error
    }
  })

  ipcMain.handle("get-screenshots", async () => {
    console.log({ view: appState.getView() })
    try {
      let previews = []
      if (appState.getView() === "queue") {
        previews = await Promise.all(
          appState.getScreenshotQueue().map(async (path) => ({
            path,
            preview: await appState.getImagePreview(path)
          }))
        )
      } else {
        previews = await Promise.all(
          appState.getExtraScreenshotQueue().map(async (path) => ({
            path,
            preview: await appState.getImagePreview(path)
          }))
        )
      }
      previews.forEach((preview: any) => console.log(preview.path))
      return previews
    } catch (error) {
      console.error("Error getting screenshots:", error)
      throw error
    }
  })

  ipcMain.handle("toggle-window", async () => {
    appState.toggleMainWindow()
  })

  ipcMain.handle("reset-queues", async () => {
    try {
      appState.clearQueues()
      console.log("Screenshot queues have been cleared.")
      return { success: true }
    } catch (error: any) {
      console.error("Error resetting queues:", error)
      return { success: false, error: error.message }
    }
  })

  // IPC handler for analyzing audio from base64 data
  ipcMain.handle("analyze-audio-base64", async (event, data: string, mimeType: string) => {
    try {
      const result = await appState.processingHelper.processAudioBase64(data, mimeType)
      return result
    } catch (error: any) {
      console.error("Error in analyze-audio-base64 handler:", error)
      throw error
    }
  })

  // IPC handler for analyzing audio from file path
  ipcMain.handle("analyze-audio-file", async (event, path: string) => {
    try {
      const result = await appState.processingHelper.processAudioFile(path)
      return result
    } catch (error: any) {
      console.error("Error in analyze-audio-file handler:", error)
      throw error
    }
  })

  // IPC handler for analyzing image from file path
  ipcMain.handle("analyze-image-file", async (event, path: string) => {
    try {
      const result = await appState.processingHelper.getLLMHelper().analyzeImageFile(path)
      return result
    } catch (error: any) {
      console.error("Error in analyze-image-file handler:", error)
      throw error
    }
  })

  ipcMain.handle("quit-app", () => {
    app.quit()
  })

  // ===== PRODUCTIVITY INSIGHTS HANDLERS =====
  
  // Handler for generating daily insights
  ipcMain.handle("generate-daily-insights", async (event, date?: string) => {
    try {
      console.log("[IPC] Generating daily insights for:", date || "today")
      
      const targetDate = date ? new Date(date) : new Date()
      
      // Get daily stats first (quick info)
      const stats = await StorageHelper.getDailyStats(targetDate)
      console.log("[IPC] Daily stats:", stats)
      
      // Get all activities for the day
      const activities = await StorageHelper.getDailyActivities(targetDate)
      console.log(`[IPC] Found ${activities.length} activities`)
      
      // Check if we have enough data
      if (activities.length < 5) {
        return {
          success: false,
          error: "Need at least 5 activities to generate meaningful insights",
          data: {
            stats,
            activities: activities.length,
            minRequired: 5
          }
        }
      }
      
      // Generate insights using LLM
      const insights = await appState.processingHelper?.getLLMHelper()
        .generateDailyInsights(activities)
      
      if (!insights) {
        throw new Error("Failed to generate insights from LLM")
      }
      
      console.log("[IPC] Insights generated successfully")
      
      return {
        success: true,
        data: {
          insights,
          stats,
          date: targetDate.toISOString(),
          activityCount: activities.length
        }
      }
    } catch (error: any) {
      console.error("[IPC] Error generating daily insights:", error)
      return {
        success: false,
        error: error.message || "Unknown error occurred"
      }
    }
  })
  
  // Handler for getting daily stats only (quick check)
  ipcMain.handle("get-daily-stats", async (event, date?: string) => {
    try {
      const targetDate = date ? new Date(date) : new Date()
      const stats = await StorageHelper.getDailyStats(targetDate)
      
      return {
        success: true,
        data: stats
      }
    } catch (error: any) {
      console.error("[IPC] Error getting daily stats:", error)
      return {
        success: false,
        error: error.message
      }
    }
  })
  
  // Handler for getting hourly breakdown (for charts)
  ipcMain.handle("get-hourly-breakdown", async (event, date?: string) => {
    try {
      const targetDate = date ? new Date(date) : new Date()
      const hourlyData = await StorageHelper.getHourlyBreakdown(targetDate)
      
      // Convert Map to array for IPC transfer
      const breakdown = Array.from(hourlyData.entries()).map(([hour, activities]) => ({
        hour,
        count: activities.length,
        focusCount: activities.filter(a => a.cognitive_state === 'deep_focus').length,
        goalRelatedCount: activities.filter(a => a.goal_relevance === 'goal_related').length
      }))
      
      return {
        success: true,
        data: breakdown
      }
    } catch (error: any) {
      console.error("[IPC] Error getting hourly breakdown:", error)
      return {
        success: false,
        error: error.message
      }
    }
  })
}