import { BrowserWindow, screen, app } from "electron"
import { AppState } from "main"
import path from "node:path"

// Robust development detection
const isDev = !app.isPackaged

// Platform detection for cleaner code
const platform = process.platform
const isMac = platform === "darwin"
const isLinux = platform === "linux"
const isWindows = platform === "win32"

export class WindowHelper {
  private mainWindow: BrowserWindow | null = null
  private isWindowVisible: boolean = false
  private windowPosition: { x: number; y: number } | null = null
  private windowSize: { width: number; height: number } | null = null
  private appState: AppState

  // Initialize with explicit number type and 0 value
  private screenWidth: number = 0
  private screenHeight: number = 0
  private step: number = 0
  private currentX: number = 0
  private currentY: number = 0

  // Retry configuration
  private readonly MAX_LOAD_RETRIES = 3
  private readonly RETRY_DELAY_MS = 1000
  private loadRetryCount = 0

  constructor(appState: AppState) {
    this.appState = appState
  }

  public setWindowDimensions(width: number, height: number): void {
    if (!this.isWindowHealthy()) {
      console.warn("Cannot set dimensions: window not healthy")
      return
    }

    try {
      // Get current window position
      const [currentX, currentY] = this.mainWindow!.getPosition()

      // Get screen dimensions
      const primaryDisplay = screen.getPrimaryDisplay()
      const workArea = primaryDisplay.workAreaSize

      // Use 75% width if debugging has occurred, otherwise use 60%
      const maxAllowedWidth = Math.floor(
        workArea.width * (this.appState.getHasDebugged() ? 0.75 : 0.5)
      )

      // Ensure width doesn't exceed max allowed width and height is reasonable
      const newWidth = Math.min(width + 32, maxAllowedWidth)
      const newHeight = Math.ceil(height)

      // Center the window horizontally if it would go off screen
      const maxX = workArea.width - newWidth
      const newX = Math.min(Math.max(currentX, 0), maxX)

      // Update window bounds
      this.mainWindow!.setBounds({
        x: newX,
        y: currentY,
        width: newWidth,
        height: newHeight
      })

      // Update internal state
      this.windowPosition = { x: newX, y: currentY }
      this.windowSize = { width: newWidth, height: newHeight }
      this.currentX = newX
    } catch (error) {
      console.error("Failed to set window dimensions:", error)
    }
  }

  public createWindow(): void {
    if (this.mainWindow !== null) {
      console.log("Window already exists")
      return
    }

    try {
      this.initializeScreenDimensions()
      this.createMainWindow()
      this.applyPlatformSpecificSettings()
      this.loadApplication()
      this.setupWindowListeners()
      this.updateInternalState()
      
      console.log("✅ Window created successfully")
    } catch (error) {
      console.error("❌ Failed to create window:", error)
      this.cleanup()
      throw error
    }
  }

  private initializeScreenDimensions(): void {
    const primaryDisplay = screen.getPrimaryDisplay()
    const workArea = primaryDisplay.workAreaSize
    this.screenWidth = workArea.width
    this.screenHeight = workArea.height
    this.step = Math.floor(this.screenWidth / 10)
    this.currentX = 0
    this.currentY = 0
  }

  private createMainWindow(): void {
    const windowConfig = this.getWindowConfig()
    this.mainWindow = new BrowserWindow(windowConfig)
    
    if (isDev) {
      // this.mainWindow.webContents.openDevTools()
    }
    
    this.mainWindow.setContentProtection(true)
  }

  private getWindowConfig(): Electron.BrowserWindowConstructorOptions {
    return {
      height: 600,
      minWidth: undefined,
      maxWidth: undefined,
      x: this.currentX,
      y: this.currentY,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: true,
        preload: path.join(__dirname, "preload.js"),
        // Security enhancements
        webSecurity: !isDev,
        allowRunningInsecureContent: false
      },
      show: true,
      alwaysOnTop: false,
      frame: true,
      transparent: false,
      fullscreenable: false,
      hasShadow: false,
      backgroundColor: "#ffffff",
      focusable: true,
      // Prevent window from being hidden on startup
      skipTaskbar: false
    }
  }

  private applyPlatformSpecificSettings(): void {
    if (!this.mainWindow) return

    try {
      if (isMac) {
        this.applyMacSettings()
      } else if (isLinux) {
        this.applyLinuxSettings()
      } else if (isWindows) {
        this.applyWindowsSettings()
      }

      // Common settings for all platforms
      this.mainWindow.setSkipTaskbar(true)
      this.mainWindow.setAlwaysOnTop(true)
    } catch (error) {
      console.error(`Failed to apply ${platform} settings:`, error)
    }
  }

  private applyMacSettings(): void {
    if (!this.mainWindow) return
    
    this.mainWindow.setVisibleOnAllWorkspaces(true, {
      visibleOnFullScreen: true
    })
    this.mainWindow.setHiddenInMissionControl(true)
    // Use specific level for macOS instead of generic alwaysOnTop
    this.mainWindow.setAlwaysOnTop(true, "floating", 1)
  }

  private applyLinuxSettings(): void {
    if (!this.mainWindow) return
    
    // Linux-specific optimizations
    if (this.mainWindow.setHasShadow) {
      this.mainWindow.setHasShadow(false)
    }
    // Note: setFocusable(false) removed as it prevents user interaction
  }

  private applyWindowsSettings(): void {
    // Windows-specific settings if needed
    // Currently using defaults which work well
  }

  private loadApplication(): void {
    if (!this.mainWindow) return

    const startUrl = this.getStartUrl()
    console.log(`Loading URL: ${startUrl}`)

    this.mainWindow.loadURL(startUrl).catch((err) => {
      console.error("Failed to load URL:", err)
      this.handleLoadError(err, startUrl)
    })
  }

  private getStartUrl(): string {
    return isDev
      ? "http://localhost:3000"
      : `file://${path.join(__dirname, "../dist/index.html")}`
  }

  private handleLoadError(error: Error, url: string): void {
    this.loadRetryCount++
    
    if (this.loadRetryCount <= this.MAX_LOAD_RETRIES) {
      console.log(`Retrying to load URL (attempt ${this.loadRetryCount}/${this.MAX_LOAD_RETRIES})...`)
      
      setTimeout(() => {
        if (this.isWindowHealthy()) {
          this.mainWindow!.loadURL(url).catch((err) => {
            this.handleLoadError(err, url)
          })
        }
      }, this.RETRY_DELAY_MS * this.loadRetryCount) // Exponential backoff
    } else {
      console.error(`Failed to load URL after ${this.MAX_LOAD_RETRIES} attempts`)
      
      // Show error page
      if (this.isWindowHealthy()) {
        const errorHtml = this.getErrorHtml(error, url)
        this.mainWindow!.loadURL(`data:text/html,${encodeURIComponent(errorHtml)}`)
      }
    }
  }

  private getErrorHtml(error: Error, url: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Loading Error</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              display: flex; 
              justify-content: center; 
              align-items: center; 
              height: 100vh; 
              margin: 0;
              background: #f0f0f0;
            }
            .error-container {
              text-align: center;
              padding: 40px;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              max-width: 500px;
            }
            h1 { color: #e74c3c; margin-bottom: 20px; }
            p { color: #555; line-height: 1.6; }
            .details { 
              margin-top: 20px; 
              padding: 10px; 
              background: #f8f8f8; 
              border-radius: 4px;
              font-size: 12px;
              color: #666;
              text-align: left;
              font-family: monospace;
            }
            .retry-btn {
              margin-top: 20px;
              padding: 10px 20px;
              background: #3498db;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 16px;
            }
            .retry-btn:hover { background: #2980b9; }
          </style>
        </head>
        <body>
          <div class="error-container">
            <h1>Failed to Load Application</h1>
            <p>The application couldn't start properly. This might be due to a network issue or missing files.</p>
            <div class="details">
              Error: ${error.message}<br>
              URL: ${url}
            </div>
            <button class="retry-btn" onclick="window.location.reload()">Retry</button>
          </div>
        </body>
      </html>
    `
  }

  private updateInternalState(): void {
    if (!this.isWindowHealthy()) return

    const bounds = this.mainWindow!.getBounds()
    this.windowPosition = { x: bounds.x, y: bounds.y }
    this.windowSize = { width: bounds.width, height: bounds.height }
    this.currentX = bounds.x
    this.currentY = bounds.y
    this.isWindowVisible = true
    this.loadRetryCount = 0 // Reset retry count on success
  }

  private setupWindowListeners(): void {
    if (!this.mainWindow) return

    this.mainWindow.on("move", () => {
      if (this.isWindowHealthy()) {
        const bounds = this.mainWindow!.getBounds()
        this.windowPosition = { x: bounds.x, y: bounds.y }
        this.currentX = bounds.x
        this.currentY = bounds.y
      }
    })

    this.mainWindow.on("resize", () => {
      if (this.isWindowHealthy()) {
        const bounds = this.mainWindow!.getBounds()
        this.windowSize = { width: bounds.width, height: bounds.height }
      }
    })

    this.mainWindow.on("closed", () => {
      this.cleanup()
    })

    // Handle crashes
    this.mainWindow.webContents.on("crashed", (event, killed) => {
      console.error("Window crashed:", { killed })
      if (!killed) {
        console.log("Attempting to reload window...")
        this.mainWindow?.reload()
      }
    })

    // Handle unresponsive
    this.mainWindow.on("unresponsive", () => {
      console.error("Window became unresponsive")
      const response = require('electron').dialog.showMessageBoxSync({
        type: 'warning',
        buttons: ['Wait', 'Reload'],
        defaultId: 1,
        message: 'The application is not responding',
        detail: 'Would you like to wait or reload the application?'
      })
      
      if (response === 1 && this.mainWindow) {
        this.mainWindow.reload()
      }
    })
  }

  private cleanup(): void {
    this.mainWindow = null
    this.isWindowVisible = false
    this.windowPosition = null
    this.windowSize = null
  }

  private isWindowHealthy(): boolean {
    return !!(
      this.mainWindow && 
      !this.mainWindow.isDestroyed() &&
      this.mainWindow.webContents &&
      !this.mainWindow.webContents.isCrashed()
    )
  }

  public getMainWindow(): BrowserWindow | null {
    return this.mainWindow
  }

  public isVisible(): boolean {
    return this.isWindowVisible && this.isWindowHealthy()
  }

  public hideMainWindow(): void {
    if (!this.isWindowHealthy()) {
      console.warn("Cannot hide: window not healthy")
      return
    }

    try {
      const bounds = this.mainWindow!.getBounds()
      this.windowPosition = { x: bounds.x, y: bounds.y }
      this.windowSize = { width: bounds.width, height: bounds.height }
      this.mainWindow!.hide()
      this.isWindowVisible = false
    } catch (error) {
      console.error("Failed to hide window:", error)
    }
  }

  public showMainWindow(): void {
    if (!this.isWindowHealthy()) {
      console.warn("Cannot show: window not healthy")
      return
    }

    try {
      if (this.windowPosition && this.windowSize) {
        this.mainWindow!.setBounds({
          x: this.windowPosition.x,
          y: this.windowPosition.y,
          width: this.windowSize.width,
          height: this.windowSize.height
        })
      }

      this.mainWindow!.showInactive()
      this.isWindowVisible = true
    } catch (error) {
      console.error("Failed to show window:", error)
    }
  }

  public toggleMainWindow(): void {
    if (this.isVisible()) {
      this.hideMainWindow()
    } else {
      this.showMainWindow()
    }
  }

  // Movement methods with validation
  private validateAndMove(newX: number, newY: number): void {
    if (!this.isWindowHealthy()) return

    try {
      this.mainWindow!.setPosition(
        Math.round(newX),
        Math.round(newY)
      )
      this.currentX = newX
      this.currentY = newY
    } catch (error) {
      console.error("Failed to move window:", error)
    }
  }

  public moveWindowRight(): void {
    if (!this.isWindowHealthy()) return

    const windowWidth = this.windowSize?.width || 0
    const halfWidth = windowWidth / 2

    this.currentX = Number(this.currentX) || 0
    this.currentY = Number(this.currentY) || 0

    const newX = Math.min(
      this.screenWidth - halfWidth,
      this.currentX + this.step
    )
    
    this.validateAndMove(newX, this.currentY)
  }

  public moveWindowLeft(): void {
    if (!this.isWindowHealthy()) return

    const windowWidth = this.windowSize?.width || 0
    const halfWidth = windowWidth / 2

    this.currentX = Number(this.currentX) || 0
    this.currentY = Number(this.currentY) || 0

    const newX = Math.max(-halfWidth, this.currentX - this.step)
    
    this.validateAndMove(newX, this.currentY)
  }

  public moveWindowDown(): void {
    if (!this.isWindowHealthy()) return

    const windowHeight = this.windowSize?.height || 0
    const halfHeight = windowHeight / 2

    this.currentX = Number(this.currentX) || 0
    this.currentY = Number(this.currentY) || 0

    const newY = Math.min(
      this.screenHeight - halfHeight,
      this.currentY + this.step
    )
    
    this.validateAndMove(this.currentX, newY)
  }

  public moveWindowUp(): void {
    if (!this.isWindowHealthy()) return

    const windowHeight = this.windowSize?.height || 0
    const halfHeight = windowHeight / 2

    this.currentX = Number(this.currentX) || 0
    this.currentY = Number(this.currentY) || 0

    const newY = Math.max(-halfHeight, this.currentY - this.step)
    
    this.validateAndMove(this.currentX, newY)
  }
}/ /   U p d a t e d  
 