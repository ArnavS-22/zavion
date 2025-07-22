"use strict";
// ipcHandlers.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeIpcHandlers = initializeIpcHandlers;
const electron_1 = require("electron");
const StorageHelper_1 = require("./StorageHelper");
function initializeIpcHandlers(appState) {
    electron_1.ipcMain.handle("update-content-dimensions", async (event, { width, height }) => {
        if (width && height) {
            appState.setWindowDimensions(width, height);
        }
    });
    electron_1.ipcMain.handle("delete-screenshot", async (event, path) => {
        return appState.deleteScreenshot(path);
    });
    electron_1.ipcMain.handle("take-screenshot", async () => {
        try {
            const screenshotPath = await appState.takeScreenshot();
            const preview = await appState.getImagePreview(screenshotPath);
            return { path: screenshotPath, preview };
        }
        catch (error) {
            console.error("Error taking screenshot:", error);
            throw error;
        }
    });
    electron_1.ipcMain.handle("get-screenshots", async () => {
        console.log({ view: appState.getView() });
        try {
            let previews = [];
            if (appState.getView() === "queue") {
                previews = await Promise.all(appState.getScreenshotQueue().map(async (path) => ({
                    path,
                    preview: await appState.getImagePreview(path)
                })));
            }
            else {
                previews = await Promise.all(appState.getExtraScreenshotQueue().map(async (path) => ({
                    path,
                    preview: await appState.getImagePreview(path)
                })));
            }
            previews.forEach((preview) => console.log(preview.path));
            return previews;
        }
        catch (error) {
            console.error("Error getting screenshots:", error);
            throw error;
        }
    });
    electron_1.ipcMain.handle("toggle-window", async () => {
        appState.toggleMainWindow();
    });
    electron_1.ipcMain.handle("reset-queues", async () => {
        try {
            appState.clearQueues();
            console.log("Screenshot queues have been cleared.");
            return { success: true };
        }
        catch (error) {
            console.error("Error resetting queues:", error);
            return { success: false, error: error.message };
        }
    });
    // IPC handler for analyzing audio from base64 data
    electron_1.ipcMain.handle("analyze-audio-base64", async (event, data, mimeType) => {
        try {
            const result = await appState.processingHelper.processAudioBase64(data, mimeType);
            return result;
        }
        catch (error) {
            console.error("Error in analyze-audio-base64 handler:", error);
            throw error;
        }
    });
    // IPC handler for analyzing audio from file path
    electron_1.ipcMain.handle("analyze-audio-file", async (event, path) => {
        try {
            const result = await appState.processingHelper.processAudioFile(path);
            return result;
        }
        catch (error) {
            console.error("Error in analyze-audio-file handler:", error);
            throw error;
        }
    });
    // IPC handler for analyzing image from file path
    electron_1.ipcMain.handle("analyze-image-file", async (event, path) => {
        try {
            const result = await appState.processingHelper.getLLMHelper().analyzeImageFile(path);
            return result;
        }
        catch (error) {
            console.error("Error in analyze-image-file handler:", error);
            throw error;
        }
    });
    electron_1.ipcMain.handle("quit-app", () => {
        electron_1.app.quit();
    });
    // ===== PRODUCTIVITY INSIGHTS HANDLERS =====
    // Handler for generating daily insights
    electron_1.ipcMain.handle("generate-daily-insights", async (event, date) => {
        try {
            console.log("[IPC] Generating daily insights for:", date || "today");
            const targetDate = date ? new Date(date) : new Date();
            // Get daily stats first (quick info)
            const stats = await StorageHelper_1.StorageHelper.getDailyStats(targetDate);
            console.log("[IPC] Daily stats:", stats);
            // Get all activities for the day
            const activities = await StorageHelper_1.StorageHelper.getDailyActivities(targetDate);
            console.log(`[IPC] Found ${activities.length} activities`);
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
                };
            }
            // Generate insights using LLM
            const insights = await appState.processingHelper?.getLLMHelper()
                .generateDailyInsights(activities);
            if (!insights) {
                throw new Error("Failed to generate insights from LLM");
            }
            console.log("[IPC] Insights generated successfully");
            return {
                success: true,
                data: {
                    insights,
                    stats,
                    date: targetDate.toISOString(),
                    activityCount: activities.length
                }
            };
        }
        catch (error) {
            console.error("[IPC] Error generating daily insights:", error);
            return {
                success: false,
                error: error.message || "Unknown error occurred"
            };
        }
    });
    // Handler for getting daily stats only (quick check)
    electron_1.ipcMain.handle("get-daily-stats", async (event, date) => {
        try {
            const targetDate = date ? new Date(date) : new Date();
            const stats = await StorageHelper_1.StorageHelper.getDailyStats(targetDate);
            return {
                success: true,
                data: stats
            };
        }
        catch (error) {
            console.error("[IPC] Error getting daily stats:", error);
            return {
                success: false,
                error: error.message
            };
        }
    });
    // Handler for getting hourly breakdown (for charts)
    electron_1.ipcMain.handle("get-hourly-breakdown", async (event, date) => {
        try {
            const targetDate = date ? new Date(date) : new Date();
            const hourlyData = await StorageHelper_1.StorageHelper.getHourlyBreakdown(targetDate);
            // Convert Map to array for IPC transfer
            const breakdown = Array.from(hourlyData.entries()).map(([hour, activities]) => ({
                hour,
                count: activities.length,
                focusCount: activities.filter(a => a.cognitive_state === 'deep_focus').length,
                goalRelatedCount: activities.filter(a => a.goal_relevance === 'goal_related').length
            }));
            return {
                success: true,
                data: breakdown
            };
        }
        catch (error) {
            console.error("[IPC] Error getting hourly breakdown:", error);
            return {
                success: false,
                error: error.message
            };
        }
    });
}
//# sourceMappingURL=ipcHandlers.js.map