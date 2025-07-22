import { globalShortcut, BrowserWindow, ipcMain } from "electron"
import { AppState } from "./main"

export class ShortcutsHelper {
  private appState: AppState

  constructor(appState: AppState) {
    this.appState = appState
    this.setupIpcHandlers()
  }

  public registerGlobalShortcuts(): void {
    // Toggle window visibility
    globalShortcut.register("CommandOrControl+Shift+H", () => {
      this.appState.toggleMainWindow()
    })

    // Take screenshot
    globalShortcut.register("CommandOrControl+H", async () => {
      const mainWindow = this.appState.getMainWindow()
      if (!mainWindow || !this.appState.isVisible()) {
        console.log("Main window is not visible. Skipping screenshot.")
        return
      }

      try {
        const screenshotPath = await this.appState.takeScreenshot()
        const preview = await this.appState.getImagePreview(screenshotPath)
        mainWindow.webContents.send("screenshot-taken", {
          path: screenshotPath,
          preview
        })
        console.log("Taking screenshot...")
        console.log({ view: this.appState.getView() })
        console.log(screenshotPath)
      } catch (error) {
        console.error("Error taking screenshot:", error)
      }
    })

    // Process screenshots
    globalShortcut.register("CommandOrControl+Return", async () => {
      console.log("Processing screenshots...")
      await this.appState.processingHelper.processScreenshots()
    })

    // Reset view
    globalShortcut.register("CommandOrControl+R", () => {
      console.log("Resetting view...")
      this.appState.clearQueues()
      
      const mainWindow = this.appState.getMainWindow()
      if (mainWindow) {
        mainWindow.webContents.send("reset-view")
      }
    })

    // Move window shortcuts
    globalShortcut.register("Control+Shift+Right", () => {
      this.appState.moveWindowRight()
    })

    globalShortcut.register("Control+Shift+Left", () => {
      this.appState.moveWindowLeft()
    })

    globalShortcut.register("Control+Shift+Down", () => {
      this.appState.moveWindowDown()
    })

    globalShortcut.register("Control+Shift+Up", () => {
      this.appState.moveWindowUp()
    })

    console.log("Global shortcuts registered")
  }

  private setupIpcHandlers(): void {
    ipcMain.handle("move-window-left", () => {
      this.appState.moveWindowLeft()
    })

    ipcMain.handle("move-window-right", () => {
      this.appState.moveWindowRight()
    })
  }

  public unregisterAllShortcuts(): void {
    globalShortcut.unregisterAll()
  }
}