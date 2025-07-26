// ScreenshotHelper.ts

import path from "node:path"
import fs from "node:fs"
import { app } from "electron"
import { v4 as uuidv4 } from "uuid"
import screenshot from "screenshot-desktop"

export class ScreenshotHelper {
  private screenshotQueue: string[] = []
  private extraScreenshotQueue: string[] = []
  private readonly MAX_SCREENSHOTS = 5

  private readonly screenshotDir: string
  private readonly extraScreenshotDir: string

  private view: "queue" | "solutions" = "queue"

  // Automatic screenshot functionality
  private automaticInterval: NodeJS.Timeout | null = null
  private isAutomaticEnabled: boolean = false
  private processingHelper: any = null

  constructor(view: "queue" | "solutions" = "queue") {
    this.view = view

    // Initialize directories
    this.screenshotDir = path.join(app.getPath("userData"), "screenshots")
    this.extraScreenshotDir = path.join(
      app.getPath("userData"),
      "extra_screenshots"
    )

    // Create directories if they don't exist
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir)
    }
    if (!fs.existsSync(this.extraScreenshotDir)) {
      fs.mkdirSync(this.extraScreenshotDir)
    }
  }

  public setProcessingHelper(processingHelper: any): void {
    this.processingHelper = processingHelper
  }

  public getView(): "queue" | "solutions" {
    return this.view
  }

  public setView(view: "queue" | "solutions"): void {
    this.view = view
  }

  public getScreenshotQueue(): string[] {
    return this.screenshotQueue
  }

  public getExtraScreenshotQueue(): string[] {
    return this.extraScreenshotQueue
  }

  public clearQueues(): void {
    // Clear screenshotQueue
    this.screenshotQueue.forEach((screenshotPath) => {
      fs.unlink(screenshotPath, (err) => {
        if (err)
          console.error(`Error deleting screenshot at ${screenshotPath}:`, err)
      })
    })
    this.screenshotQueue = []

    // Clear extraScreenshotQueue
    this.extraScreenshotQueue.forEach((screenshotPath) => {
      fs.unlink(screenshotPath, (err) => {
        if (err)
          console.error(
            `Error deleting extra screenshot at ${screenshotPath}:`,
            err
          )
      })
    })
    this.extraScreenshotQueue = []
  }

  public async takeScreenshot(
    hideMainWindow: () => void,
    showMainWindow: () => void
  ): Promise<string> {
    hideMainWindow()
    let screenshotPath = ""

    if (this.view === "queue") {
      screenshotPath = path.join(this.screenshotDir, `${uuidv4()}.png`)
      await screenshot({ filename: screenshotPath })

      this.screenshotQueue.push(screenshotPath)
      if (this.screenshotQueue.length > this.MAX_SCREENSHOTS) {
        const removedPath = this.screenshotQueue.shift()
        if (removedPath) {
          try {
            await fs.promises.unlink(removedPath)
          } catch (error) {
            console.error("Error removing old screenshot:", error)
          }
        }
      }
    } else {
      screenshotPath = path.join(this.extraScreenshotDir, `${uuidv4()}.png`)
      await screenshot({ filename: screenshotPath })

      this.extraScreenshotQueue.push(screenshotPath)
      if (this.extraScreenshotQueue.length > this.MAX_SCREENSHOTS) {
        const removedPath = this.extraScreenshotQueue.shift()
        if (removedPath) {
          try {
            await fs.promises.unlink(removedPath)
          } catch (error) {
            console.error("Error removing old screenshot:", error)
          }
        }
      }
    }

    showMainWindow()
    return screenshotPath
  }

  public async getImagePreview(filepath: string): Promise<string> {
    try {
      const data = await fs.promises.readFile(filepath)
      return `data:image/png;base64,${data.toString("base64")}`
    } catch (error) {
      console.error("Error reading image:", error)
      throw error
    }
  }

  public async deleteScreenshot(
    path: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await fs.promises.unlink(path)
      if (this.view === "queue") {
        this.screenshotQueue = this.screenshotQueue.filter(
          (filePath) => filePath !== path
        )
      } else {
        this.extraScreenshotQueue = this.extraScreenshotQueue.filter(
          (filePath) => filePath !== path
        )
      }
      return { success: true }
    } catch (error) {
      console.error("Error deleting file:", error)
      return { success: false, error: error.message }
    }
  }

  public startAutomaticScreenshots(
    intervalMs: number,
    hideMainWindow: () => void,
    showMainWindow: () => void
  ): void {
    if (this.automaticInterval) {
      this.stopAutomaticScreenshots()
    }

    this.isAutomaticEnabled = true
    this.automaticInterval = setInterval(async () => {
      if (this.isAutomaticEnabled) {
        try {
          console.log("Taking automatic screenshot...")
          
          // Take screenshot for productivity tracking (separate from queue)
          const productivityScreenshotPath = path.join(this.screenshotDir, `productivity_${uuidv4()}.png`)
          
          hideMainWindow()
          await screenshot({ filename: productivityScreenshotPath })
          showMainWindow()
          
          // Process for productivity analysis
          if (this.processingHelper) {
            await this.processingHelper.processAutomaticScreenshot(productivityScreenshotPath)
          } else {
            console.error("ProcessingHelper not set - cannot process automatic screenshot")
          }
          
        } catch (error) {
          console.error("Automatic screenshot failed:", error)
        }
      }
    }, intervalMs)

    console.log("Automatic screenshots started")
  }

  public stopAutomaticScreenshots(): void {
    if (this.automaticInterval) {
      clearInterval(this.automaticInterval)
      this.automaticInterval = null
    }
    this.isAutomaticEnabled = false
    console.log("Automatic screenshots stopped")
  }

  public isAutomaticActive(): boolean {
    return this.isAutomaticEnabled && this.automaticInterval !== null
  }
}