"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppState = void 0;
const electron_1 = require("electron");
const ipcHandlers_1 = require("./ipcHandlers");
const WindowHelper_1 = require("./WindowHelper");
const ScreenshotHelper_1 = require("./ScreenshotHelper");
const shortcuts_1 = require("./shortcuts");
const ProcessingHelper_1 = require("./ProcessingHelper");
const StorageHelper_1 = require("./StorageHelper");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables before anything else
const envPath = path_1.default.join(__dirname, '..', '.env');
const envResult = dotenv_1.default.config({ path: envPath });
if (envResult.error) {
    console.error(`Failed to load .env file from ${envPath}:`, envResult.error);
    process.exit(1);
}
// Validate critical environment variables
const validateEnvironment = () => {
    const errors = [];
    const required = {
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
        GEMINI_API_KEY: process.env.GEMINI_API_KEY
    };
    for (const [key, value] of Object.entries(required)) {
        if (!value) {
            errors.push(`Missing required environment variable: ${key}`);
        }
    }
    if (errors.length > 0) {
        errors.forEach(error => console.error(`❌ ${error}`));
    }
    return { valid: errors.length === 0, errors };
};
// Initialize core services before creating AppState
let servicesInitialized = false;
const initializeCoreServices = () => {
    try {
        // Validate environment first
        const envValidation = validateEnvironment();
        if (!envValidation.valid) {
            throw new Error("Environment validation failed");
        }
        // Initialize Supabase
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY;
        StorageHelper_1.StorageHelper.initialize(supabaseUrl, supabaseKey);
        console.log("✅ Supabase initialized successfully");
        servicesInitialized = true;
        return true;
    }
    catch (error) {
        console.error("❌ Failed to initialize core services:", error);
        servicesInitialized = false;
        return false;
    }
};
// Initialize services immediately
initializeCoreServices();
class AppState {
    static instance = null;
    windowHelper;
    screenshotHelper;
    shortcutsHelper;
    processingHelper = null;
    // View management
    view = "queue";
    problemInfo = null;
    hasDebugged = false;
    // Health monitoring
    healthStatus = {
        supabase: servicesInitialized,
        processingHelper: false,
        automaticScreenshots: false
    };
    // Processing events
    PROCESSING_EVENTS = {
        UNAUTHORIZED: "procesing-unauthorized",
        NO_SCREENSHOTS: "processing-no-screenshots",
        INITIAL_START: "initial-start",
        PROBLEM_EXTRACTED: "problem-extracted",
        SOLUTION_SUCCESS: "solution-success",
        INITIAL_SOLUTION_ERROR: "solution-error",
        DEBUG_START: "debug-start",
        DEBUG_SUCCESS: "debug-success",
        DEBUG_ERROR: "debug-error"
    };
    constructor() {
        console.log("🏗️ Initializing AppState...");
        // Initialize WindowHelper
        this.windowHelper = new WindowHelper_1.WindowHelper(this);
        // Initialize ScreenshotHelper
        this.screenshotHelper = new ScreenshotHelper_1.ScreenshotHelper(this.view);
        // Initialize ProcessingHelper with error handling
        try {
            if (!process.env.GEMINI_API_KEY) {
                throw new Error("GEMINI_API_KEY not found");
            }
            this.processingHelper = new ProcessingHelper_1.ProcessingHelper(this);
            this.healthStatus.processingHelper = true;
            // Connect ProcessingHelper to ScreenshotHelper
            this.screenshotHelper.setProcessingHelper(this.processingHelper);
            console.log("✅ ProcessingHelper initialized and connected");
        }
        catch (error) {
            console.error("❌ Failed to initialize ProcessingHelper:", error);
            this.processingHelper = null;
            this.healthStatus.processingHelper = false;
        }
        // Initialize ShortcutsHelper
        this.shortcutsHelper = new shortcuts_1.ShortcutsHelper(this);
        // Log health status
        console.log("📊 System Health:", this.healthStatus);
    }
    static getInstance() {
        if (!AppState.instance) {
            AppState.instance = new AppState();
        }
        return AppState.instance;
    }
    // Health check method
    isHealthy() {
        return Object.values(this.healthStatus).every(status => status === true);
    }
    getHealthStatus() {
        return { ...this.healthStatus };
    }
    // Getters and Setters
    getMainWindow() {
        return this.windowHelper.getMainWindow();
    }
    getView() {
        return this.view;
    }
    setView(view) {
        this.view = view;
        this.screenshotHelper.setView(view);
    }
    isVisible() {
        return this.windowHelper.isVisible();
    }
    getScreenshotHelper() {
        return this.screenshotHelper;
    }
    getProblemInfo() {
        return this.problemInfo;
    }
    setProblemInfo(problemInfo) {
        this.problemInfo = problemInfo;
    }
    getScreenshotQueue() {
        return this.screenshotHelper.getScreenshotQueue();
    }
    getExtraScreenshotQueue() {
        return this.screenshotHelper.getExtraScreenshotQueue();
    }
    // Window management methods
    createWindow() {
        this.windowHelper.createWindow();
    }
    hideMainWindow() {
        this.windowHelper.hideMainWindow();
    }
    showMainWindow() {
        this.windowHelper.showMainWindow();
    }
    toggleMainWindow() {
        console.log("Screenshots: ", this.screenshotHelper.getScreenshotQueue().length, "Extra screenshots: ", this.screenshotHelper.getExtraScreenshotQueue().length);
        this.windowHelper.toggleMainWindow();
    }
    setWindowDimensions(width, height) {
        this.windowHelper.setWindowDimensions(width, height);
    }
    clearQueues() {
        this.screenshotHelper.clearQueues();
        this.problemInfo = null;
        this.setView("queue");
    }
    // Screenshot management methods
    async takeScreenshot() {
        if (!this.getMainWindow())
            throw new Error("No main window available");
        const screenshotPath = await this.screenshotHelper.takeScreenshot(() => this.hideMainWindow(), () => this.showMainWindow());
        return screenshotPath;
    }
    startAutomaticScreenshots() {
        // Validate system health before starting
        if (!this.healthStatus.supabase) {
            console.error("❌ Cannot start automatic screenshots: Supabase not initialized");
            return;
        }
        if (!this.healthStatus.processingHelper) {
            console.error("❌ Cannot start automatic screenshots: ProcessingHelper not initialized");
            return;
        }
        try {
            console.log("📸 Starting automatic screenshots for productivity tracking...");
            this.screenshotHelper.startAutomaticScreenshots(45000, () => this.hideMainWindow(), () => this.showMainWindow());
            this.healthStatus.automaticScreenshots = true;
            console.log("✅ Automatic screenshots started successfully");
        }
        catch (error) {
            console.error("❌ Failed to start automatic screenshots:", error);
            this.healthStatus.automaticScreenshots = false;
        }
    }
    async getImagePreview(filepath) {
        return this.screenshotHelper.getImagePreview(filepath);
    }
    async deleteScreenshot(path) {
        return this.screenshotHelper.deleteScreenshot(path);
    }
    // Window movement methods
    moveWindowLeft() {
        this.windowHelper.moveWindowLeft();
    }
    moveWindowRight() {
        this.windowHelper.moveWindowRight();
    }
    moveWindowDown() {
        this.windowHelper.moveWindowDown();
    }
    moveWindowUp() {
        this.windowHelper.moveWindowUp();
    }
    setHasDebugged(value) {
        this.hasDebugged = value;
    }
    getHasDebugged() {
        return this.hasDebugged;
    }
}
exports.AppState = AppState;
// Application initialization with proper error handling
async function initializeApp() {
    try {
        console.log("🚀 Starting application initialization...");
        // Create AppState instance
        const appState = AppState.getInstance();
        // Initialize IPC handlers
        (0, ipcHandlers_1.initializeIpcHandlers)(appState);
        // Set up error handlers
        process.on('uncaughtException', (error) => {
            console.error('❌ Uncaught Exception:', error);
            // In production, you'd want to log this to a service like Sentry
        });
        process.on('unhandledRejection', (reason, promise) => {
            console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
            // In production, you'd want to log this to a service like Sentry
        });
        electron_1.app.whenReady().then(async () => {
            console.log("✅ Electron app is ready");
            // Create window
            appState.createWindow();
            // Register global shortcuts
            appState.shortcutsHelper.registerGlobalShortcuts();
            // Wait a moment for window to be fully ready
            await new Promise(resolve => setTimeout(resolve, 1000));
            // Start automatic screenshots if core dependencies are ready
            const health = appState.getHealthStatus();
            if (health.supabase && health.processingHelper) {
                appState.startAutomaticScreenshots();
            }
            else {
                console.error("❌ Core dependencies not ready, skipping automatic screenshots");
                console.error("📊 Health status:", health);
            }
        });
        electron_1.app.on("activate", () => {
            console.log("App activated");
            if (appState.getMainWindow() === null) {
                appState.createWindow();
            }
        });
        electron_1.app.on("window-all-closed", () => {
            if (process.platform !== "darwin") {
                electron_1.app.quit();
            }
        });
        electron_1.app.on('before-quit', () => {
            console.log("🛑 App shutting down gracefully...");
            // Here you could add cleanup logic
        });
        electron_1.app.dock?.hide();
        electron_1.app.commandLine.appendSwitch("disable-background-timer-throttling");
    }
    catch (error) {
        console.error("❌ Fatal error during initialization:", error);
        process.exit(1);
    }
}
// Start the application
initializeApp().catch(error => {
    console.error("❌ Failed to initialize application:", error);
    process.exit(1);
});
//# sourceMappingURL=main.js.map