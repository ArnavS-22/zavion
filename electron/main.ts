import { app, BrowserWindow } from "electron"
import { initializeIpcHandlers } from "./ipcHandlers"
import { WindowHelper } from "./WindowHelper"
import { ScreenshotHelper } from "./ScreenshotHelper"
import { ShortcutsHelper } from "./shortcuts"
import { ProcessingHelper } from "./ProcessingHelper"
import { StorageHelper } from "./StorageHelper"
import dotenv from "dotenv"
import path from "path"

// Load environment variables before anything else
const envPath = path.join(__dirname, '..', '.env')
const envResult = dotenv.config({ path: envPath })

if (envResult.error) {
  console.error(`Failed to load .env file from ${envPath}:`, envResult.error)
  process.exit(1)
}

// Validate critical environment variables
const validateEnvironment = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = []
  const required = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY
  }

  for (const [key, value] of Object.entries(required)) {
    if (!value) {
      errors.push(`Missing required environment variable: ${key}`)
    }
  }

  if (errors.length > 0) {
    errors.forEach(error => console.error(`❌ ${error}`))
  }

  return { valid: errors.length === 0, errors }
}

// Initialize core services before creating AppState
let servicesInitialized = false

const initializeCoreServices = (): boolean => {
  try {
    // Validate environment first
    const envValidation = validateEnvironment()
    if (!envValidation.valid) {
      throw new Error("Environment validation failed")
    }

    // Initialize Supabase
    const supabaseUrl = process.env.SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_ANON_KEY!
    
    StorageHelper.initialize(supabaseUrl, supabaseKey)
    console.log("✅ Supabase initialized successfully")
    
    servicesInitialized = true
    return true
  } catch (error) {
    console.error("❌ Failed to initialize core services:", error)
    servicesInitialized = false
    return false
  }
}

// Initialize services immediately
initializeCoreServices()

export class AppState {
  private static instance: AppState | null = null

  private windowHelper: WindowHelper
  private screenshotHelper: ScreenshotHelper
  public shortcutsHelper: ShortcutsHelper
  public processingHelper: ProcessingHelper | null = null

  // View management
  private view: "queue" | "solutions" = "queue"

  private problemInfo: {
    problem_statement: string
    input_format: Record<string, any>
    output_format: Record<string, any>
    constraints: Array<Record<string, any>>
    test_cases: Array<Record<string, any>>
  } | null = null

  private hasDebugged: boolean = false

  // Health monitoring
  private healthStatus = {
    supabase: servicesInitialized,
    processingHelper: false,
    automaticScreenshots: false
  }

  // Processing events
  public readonly PROCESSING_EVENTS = {
    UNAUTHORIZED: "procesing-unauthorized",
    NO_SCREENSHOTS: "processing-no-screenshots",
    INITIAL_START: "initial-start",
    PROBLEM_EXTRACTED: "problem-extracted",
    SOLUTION_SUCCESS: "solution-success",
    INITIAL_SOLUTION_ERROR: "solution-error",
    DEBUG_START: "debug-start",
    DEBUG_SUCCESS: "debug-success",
    DEBUG_ERROR: "debug-error"
  } as const

  constructor() {
    console.log("🏗️ Initializing AppState...")
    
    // Initialize WindowHelper
    this.windowHelper = new WindowHelper(this)

    // Initialize ScreenshotHelper
    this.screenshotHelper = new ScreenshotHelper(this.view)

    // Initialize ProcessingHelper with error handling
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY not found")
      }
      
      this.processingHelper = new ProcessingHelper(this)
      this.healthStatus.processingHelper = true
      
      // Connect ProcessingHelper to ScreenshotHelper
      this.screenshotHelper.setProcessingHelper(this.processingHelper)
      console.log("✅ ProcessingHelper initialized and connected")
    } catch (error) {
      console.error("❌ Failed to initialize ProcessingHelper:", error)
      this.processingHelper = null
      this.healthStatus.processingHelper = false
    }

    // Initialize ShortcutsHelper
    this.shortcutsHelper = new ShortcutsHelper(this)
    
    // Log health status
    console.log("📊 System Health:", this.healthStatus)
  }

  public static getInstance(): AppState {
    if (!AppState.instance) {
      AppState.instance = new AppState()
    }
    return AppState.instance
  }

  // Health check method
  public isHealthy(): boolean {
    return Object.values(this.healthStatus).every(status => status === true)
  }

  public getHealthStatus(): typeof this.healthStatus {
    return { ...this.healthStatus }
  }

  // Getters and Setters
  public getMainWindow(): BrowserWindow | null {
    return this.windowHelper.getMainWindow()
  }

  public getView(): "queue" | "solutions" {
    return this.view
  }

  public setView(view: "queue" | "solutions"): void {
    this.view = view
    this.screenshotHelper.setView(view)
  }

  public isVisible(): boolean {
    return this.windowHelper.isVisible()
  }

  public getScreenshotHelper(): ScreenshotHelper {
    return this.screenshotHelper
  }

  public getProblemInfo(): any {
    return this.problemInfo
  }

  public setProblemInfo(problemInfo: any): void {
    this.problemInfo = problemInfo
  }

  public getScreenshotQueue(): string[] {
    return this.screenshotHelper.getScreenshotQueue()
  }

  public getExtraScreenshotQueue(): string[] {
    return this.screenshotHelper.getExtraScreenshotQueue()
  }

  // Window management methods
  public createWindow(): void {
    this.windowHelper.createWindow()
  }

  public hideMainWindow(): void {
    this.windowHelper.hideMainWindow()
  }

  public showMainWindow(): void {
    this.windowHelper.showMainWindow()
  }

  public toggleMainWindow(): void {
    console.log(
      "Screenshots: ",
      this.screenshotHelper.getScreenshotQueue().length,
      "Extra screenshots: ",
      this.screenshotHelper.getExtraScreenshotQueue().length
    )
    this.windowHelper.toggleMainWindow()
  }

  public setWindowDimensions(width: number, height: number): void {
    this.windowHelper.setWindowDimensions(width, height)
  }

  public clearQueues(): void {
    this.screenshotHelper.clearQueues()
    this.problemInfo = null
    this.setView("queue")
  }

  // Screenshot management methods
  public async takeScreenshot(): Promise<string> {
    if (!this.getMainWindow()) throw new Error("No main window available")

    const screenshotPath = await this.screenshotHelper.takeScreenshot(
      () => this.hideMainWindow(),
      () => this.showMainWindow()
    )

    return screenshotPath
  }

  public startAutomaticScreenshots(): void {
    // Validate system health before starting
    if (!this.healthStatus.supabase) {
      console.error("❌ Cannot start automatic screenshots: Supabase not initialized")
      return
    }
    
    if (!this.healthStatus.processingHelper) {
      console.error("❌ Cannot start automatic screenshots: ProcessingHelper not initialized")
      return
    }
    
    try {
      console.log("📸 Starting automatic screenshots for productivity tracking...")
      this.screenshotHelper.startAutomaticScreenshots(
        45000,
        () => this.hideMainWindow(),
        () => this.showMainWindow()
      )
      this.healthStatus.automaticScreenshots = true
      console.log("✅ Automatic screenshots started successfully")
    } catch (error) {
      console.error("❌ Failed to start automatic screenshots:", error)
      this.healthStatus.automaticScreenshots = false
    }
  }

  public async getImagePreview(filepath: string): Promise<string> {
    return this.screenshotHelper.getImagePreview(filepath)
  }

  public async deleteScreenshot(
    path: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.screenshotHelper.deleteScreenshot(path)
  }

  // Window movement methods
  public moveWindowLeft(): void {
    this.windowHelper.moveWindowLeft()
  }

  public moveWindowRight(): void {
    this.windowHelper.moveWindowRight()
  }

  public moveWindowDown(): void {
    this.windowHelper.moveWindowDown()
  }

  public moveWindowUp(): void {
    this.windowHelper.moveWindowUp()
  }

  public setHasDebugged(value: boolean): void {
    this.hasDebugged = value
  }

  public getHasDebugged(): boolean {
    return this.hasDebugged
  }
}

// Application initialization with proper error handling
async function initializeApp() {
  try {
    console.log("🚀 Starting application initialization...")
    
    // Create AppState instance
    const appState = AppState.getInstance()

    // Initialize IPC handlers
    initializeIpcHandlers(appState)

    // Set up error handlers
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error)
      // In production, you'd want to log this to a service like Sentry
    })

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
      // In production, you'd want to log this to a service like Sentry
    })

    app.whenReady().then(async () => {
      console.log("✅ Electron app is ready")
      
      // Create window
      appState.createWindow()
      
      // Register global shortcuts
      appState.shortcutsHelper.registerGlobalShortcuts()
      
      // Wait a moment for window to be fully ready
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Start automatic screenshots if core dependencies are ready
      const health = appState.getHealthStatus()
      if (health.supabase && health.processingHelper) {
        appState.startAutomaticScreenshots()
      } else {
        console.error("❌ Core dependencies not ready, skipping automatic screenshots")
        console.error("📊 Health status:", health)
      }
    })

    app.on("activate", () => {
      console.log("App activated")
      if (appState.getMainWindow() === null) {
        appState.createWindow()
      }
    })

    app.on("window-all-closed", () => {
      if (process.platform !== "darwin") {
        app.quit()
      }
    })

    app.on('before-quit', () => {
      console.log("🛑 App shutting down gracefully...")
      // Here you could add cleanup logic
    })

    app.dock?.hide()
    app.commandLine.appendSwitch("disable-background-timer-throttling")
    
  } catch (error) {
    console.error("❌ Fatal error during initialization:", error)
    process.exit(1)
  }
}

// Start the application
initializeApp().catch(error => {
  console.error("❌ Failed to initialize application:", error)
  process.exit(1)
})/ /   U p d a t e d  
 