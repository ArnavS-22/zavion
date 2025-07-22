"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShortcutsHelper = void 0;
const electron_1 = require("electron");
class ShortcutsHelper {
    appState;
    constructor(appState) {
        this.appState = appState;
        this.setupIpcHandlers();
    }
    registerGlobalShortcuts() {
        // Toggle window visibility
        electron_1.globalShortcut.register("CommandOrControl+Shift+H", () => {
            this.appState.toggleMainWindow();
        });
        // Take screenshot
        electron_1.globalShortcut.register("CommandOrControl+H", async () => {
            const mainWindow = this.appState.getMainWindow();
            if (!mainWindow || !this.appState.isVisible()) {
                console.log("Main window is not visible. Skipping screenshot.");
                return;
            }
            try {
                const screenshotPath = await this.appState.takeScreenshot();
                const preview = await this.appState.getImagePreview(screenshotPath);
                mainWindow.webContents.send("screenshot-taken", {
                    path: screenshotPath,
                    preview
                });
                console.log("Taking screenshot...");
                console.log({ view: this.appState.getView() });
                console.log(screenshotPath);
            }
            catch (error) {
                console.error("Error taking screenshot:", error);
            }
        });
        // Process screenshots
        electron_1.globalShortcut.register("CommandOrControl+Return", async () => {
            console.log("Processing screenshots...");
            await this.appState.processingHelper.processScreenshots();
        });
        // Reset view
        electron_1.globalShortcut.register("CommandOrControl+R", () => {
            console.log("Resetting view...");
            this.appState.clearQueues();
            const mainWindow = this.appState.getMainWindow();
            if (mainWindow) {
                mainWindow.webContents.send("reset-view");
            }
        });
        // Move window shortcuts
        electron_1.globalShortcut.register("Control+Shift+Right", () => {
            this.appState.moveWindowRight();
        });
        electron_1.globalShortcut.register("Control+Shift+Left", () => {
            this.appState.moveWindowLeft();
        });
        electron_1.globalShortcut.register("Control+Shift+Down", () => {
            this.appState.moveWindowDown();
        });
        electron_1.globalShortcut.register("Control+Shift+Up", () => {
            this.appState.moveWindowUp();
        });
        console.log("Global shortcuts registered");
    }
    setupIpcHandlers() {
        electron_1.ipcMain.handle("move-window-left", () => {
            this.appState.moveWindowLeft();
        });
        electron_1.ipcMain.handle("move-window-right", () => {
            this.appState.moveWindowRight();
        });
    }
    unregisterAllShortcuts() {
        electron_1.globalShortcut.unregisterAll();
    }
}
exports.ShortcutsHelper = ShortcutsHelper;
//# sourceMappingURL=shortcuts.js.map