import { GoogleGenerativeAI, GenerativeModel, GenerateContentResult } from "@google/generative-ai"
import fs from "fs/promises"
import { ActivityRecord } from "./StorageHelper"

// Proper type definitions
interface WorkSession {
  id: string
  startTime: Date
  endTime: Date
  durationMinutes: number
  activities: ActivityRecord[]
  dominantCognitiveState: string
  appsUsed: Set<string>
  isComplete: boolean
}

interface TimeGap {
  startTime: Date
  endTime: Date
  durationMinutes: number
  reason: 'away_from_computer' | 'app_closed' | 'system_idle'
}

interface SessionAnalysis {
  sessions: WorkSession[]
  gaps: TimeGap[]
  totalActiveMinutes: number
  totalGapMinutes: number
  dataQuality: 'high' | 'medium' | 'low'
  warnings: string[]
}

interface DailyInsights {
  executiveSummary: string
  productivityNarrative: string
  behavioralPatterns: string
  recommendations: string
  metadata: {
    generatedAt: string
    dataPoints: number
    sessionsAnalyzed: number
    promptTokensUsed?: number
  }
}

// Configuration
const CONFIG = {
  MIN_GAP_MINUTES: 5,
  MAX_SESSION_HOURS: 4,
  MAX_ACTIVITIES_PER_PROMPT: 200,
  MAX_PROMPT_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
  TOKEN_LIMIT_BUFFER: 0.8, // Use only 80% of token limit
} as const

export class LLMHelper {
  private model: GenerativeModel
  private readonly logger = this.createLogger()

  constructor(apiKey: string) {
    if (!apiKey || apiKey.length < 10) {
      throw new Error("Invalid Gemini API key provided")
    }
    
    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      this.model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      })
    } catch (error) {
      this.logger.error("Failed to initialize Gemini model", error)
      throw new Error(`LLMHelper initialization failed: ${error.message}`)
    }
  }

  private createLogger() {
    return {
      info: (message: string, data?: any) => {
        console.log(`[LLMHelper] ${message}`, data || '')
      },
      error: (message: string, error?: any) => {
        console.error(`[LLMHelper ERROR] ${message}`, error || '')
      },
      warn: (message: string, data?: any) => {
        console.warn(`[LLMHelper WARN] ${message}`, data || '')
      }
    }
  }

  private cleanJsonResponse(text: string): string {
    if (!text || typeof text !== 'string') {
      throw new Error("Invalid response text from LLM")
    }

    // Remove markdown code blocks
    text = text.replace(/^```(?:json)?\n?/gm, '')
    text = text.replace(/\n?```$/gm, '')
    text = text.trim()

    // Validate it's likely JSON
    if (!text.startsWith('{') || !text.endsWith('}')) {
      throw new Error("Response does not appear to be valid JSON")
    }

    return text
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = CONFIG.MAX_PROMPT_RETRIES
  ): Promise<T> {
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        this.logger.warn(`Attempt ${attempt} failed`, error)
        
        if (attempt < maxRetries) {
          const delay = CONFIG.RETRY_DELAY_MS * Math.pow(2, attempt - 1)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    throw new Error(`Operation failed after ${maxRetries} attempts: ${lastError?.message}`)
  }

  private validateActivityRecord(record: any): record is ActivityRecord {
    const required = [
      'app_classification',
      'goal_relevance',
      'cognitive_state',
      'context_switching',
      'attention_residue',
      'procrastination_signal',
      'energy_level'
    ]
    
    return required.every(field => 
      record.hasOwnProperty(field) && record[field] !== null && record[field] !== undefined
    )
  }

  private async readImageFile(imagePath: string): Promise<string> {
    try {
      const imageData = await fs.readFile(imagePath)
      return imageData.toString("base64")
    } catch (error) {
      this.logger.error(`Failed to read image file: ${imagePath}`, error)
      throw new Error(`Cannot read screenshot file: ${error.message}`)
    }
  }

  public async classifyProductivityActivity(imagePath: string): Promise<ActivityRecord> {
    if (!imagePath || typeof imagePath !== 'string') {
      throw new Error("Invalid image path provided")
    }

    this.logger.info(`Classifying activity from screenshot: ${imagePath}`)

    try {
      const imageData = await this.readImageFile(imagePath)
      
      const imagePart = {
        inlineData: {
          data: imageData,
          mimeType: "image/png"
        }
      }
      
      const prompt = `You are a productivity behavior analyst. Analyze this screenshot objectively for work patterns. Return JSON format:

{
  "app_classification": "AppName - DocumentName",
  "goal_relevance": "goal_related" | "work_unrelated" | "personal" | "break" | "distraction",
  "cognitive_state": "deep_focus" | "light_work" | "browsing" | "communication" | "break",
  "context_switching": "continuing_task" | "new_task" | "rapid_switching",
  "attention_residue": "clean_focus" | "previous_task_visible" | "multiple_contexts",
  "procrastination_signal": "none" | "social_media_after_work" | "research_rabbit_hole" | "entertainment",
  "energy_level": "high_focus_work" | "medium_complexity" | "low_energy_tasks" | "break_time"
}

VISUAL ANALYSIS CRITERIA:
- app_classification: Main app with focus + specific file/page/tab title
- goal_relevance: Work apps (VS Code, Figma, Excel) = goal_related; Social media/entertainment = distraction
- cognitive_state: Full screen work app = deep_focus; Multiple tabs/windows = light_work; Social/video = browsing
- context_switching: Same app as likely previous = continuing_task; Different app type = new_task
- attention_residue: Clean desktop/single app = clean_focus; Multiple apps/tabs visible = multiple_contexts
- procrastination_signal: Social media, YouTube, news sites = check type based on context
- energy_level: Complex work (coding, design, writing) = high_focus_work; Email, admin = low_energy_tasks

Analyze only what you can see. Return ONLY the JSON object.`

      const result = await this.retryWithBackoff(async () => {
        return await this.model.generateContent([prompt, imagePart])
      })
      
      const response = await result.response
      const text = this.cleanJsonResponse(response.text())
      const parsed = JSON.parse(text)
      
      // Validate the response structure
      if (!this.validateActivityRecord(parsed)) {
        throw new Error("Invalid activity classification format from LLM")
      }
      
      // Return the activity record
      const activityRecord: ActivityRecord = {
        ...parsed
      }
      
      this.logger.info("Successfully classified activity", {
        app: activityRecord.app_classification,
        state: activityRecord.cognitive_state
      })
      
      return activityRecord
      
    } catch (error) {
      this.logger.error("Failed to classify productivity activity", error)
      
      // Return a safe default if classification fails
      return {
        app_classification: "Unknown - Error in classification",
        goal_relevance: "work_unrelated",
        cognitive_state: "break",
        context_switching: "new_task",
        attention_residue: "multiple_contexts",
        procrastination_signal: "none",
        energy_level: "low_energy_tasks"
      }
    }
  }

  private analyzeWorkSessions(activities: ActivityRecord[]): SessionAnalysis {
    const sessions: WorkSession[] = []
    const gaps: TimeGap[] = []
    const warnings: string[] = []
    
    if (!activities || activities.length === 0) {
      return {
        sessions: [],
        gaps: [],
        totalActiveMinutes: 0,
        totalGapMinutes: 0,
        dataQuality: 'low',
        warnings: ['No activity data provided']
      }
    }

    // Sort activities by timestamp to ensure chronological order
    const sortedActivities = [...activities].sort((a, b) => {
      const timeA = new Date(a.created_at || 0).getTime()
      const timeB = new Date(b.created_at || 0).getTime()
      return timeA - timeB
    })

    let currentSession: WorkSession | null = null
    let sessionCounter = 0

    for (let i = 0; i < sortedActivities.length; i++) {
      const activity = sortedActivities[i]
      
      // Get activity timestamp safely
      const activityTime = (() => {
        try {
          const time = new Date(activity.created_at || 0)
          if (isNaN(time.getTime())) {
            warnings.push(`Invalid timestamp at index ${i}`)
            return null
          }
          return time
        } catch {
          warnings.push(`Failed to parse timestamp at index ${i}`)
          return null
        }
      })()

      if (!activityTime) continue

      // Check for time gaps
      if (i > 0 && currentSession) {
        const prevActivity = sortedActivities[i - 1]
        const prevTime = new Date(prevActivity.created_at || 0)
        const gapMinutes = Math.round((activityTime.getTime() - prevTime.getTime()) / 1000 / 60)
        
        if (gapMinutes > CONFIG.MIN_GAP_MINUTES) {
          // Close current session
          sessions.push({
            ...currentSession,
            isComplete: true
          })
          
          // Record gap
          gaps.push({
            startTime: prevTime,
            endTime: activityTime,
            durationMinutes: gapMinutes,
            reason: gapMinutes > 60 ? 'app_closed' : 'away_from_computer'
          })
          
          currentSession = null
        }
      }

      // Start new session or add to current
      if (!currentSession) {
        sessionCounter++
        currentSession = {
          id: `session_${sessionCounter}`,
          startTime: activityTime,
          endTime: activityTime,
          durationMinutes: 0,
          activities: [activity],
          dominantCognitiveState: activity.cognitive_state,
          appsUsed: new Set([activity.app_classification.split(' - ')[0]]),
          isComplete: false
        }
      } else {
        currentSession.endTime = activityTime
        currentSession.activities.push(activity)
        currentSession.durationMinutes = Math.round(
          (currentSession.endTime.getTime() - currentSession.startTime.getTime()) / 1000 / 60
        )
        currentSession.appsUsed.add(activity.app_classification.split(' - ')[0])
        
        // Check for excessively long sessions
        if (currentSession.durationMinutes > CONFIG.MAX_SESSION_HOURS * 60) {
          warnings.push(`Session ${currentSession.id} exceeds ${CONFIG.MAX_SESSION_HOURS} hours`)
        }
      }
    }

    // Don't forget the last session
    if (currentSession) {
      sessions.push({
        ...currentSession,
        isComplete: false // Last session might be ongoing
      })
    }

    // Calculate totals
    const totalActiveMinutes = sessions.reduce((sum, session) => sum + session.durationMinutes, 0)
    const totalGapMinutes = gaps.reduce((sum, gap) => sum + gap.durationMinutes, 0)

    // Determine data quality
    const dataQuality = (() => {
      if (warnings.length > 5) return 'low'
      if (warnings.length > 0) return 'medium'
      if (activities.length < 10) return 'medium'
      return 'high'
    })()

    return {
      sessions,
      gaps,
      totalActiveMinutes,
      totalGapMinutes,
      dataQuality,
      warnings
    }
  }

  private truncateActivitiesForPrompt(activities: ActivityRecord[]): {
    truncated: ActivityRecord[]
    isTruncated: boolean
  } {
    if (activities.length <= CONFIG.MAX_ACTIVITIES_PER_PROMPT) {
      return { truncated: activities, isTruncated: false }
    }

    // Take evenly distributed sample
    const step = Math.floor(activities.length / CONFIG.MAX_ACTIVITIES_PER_PROMPT)
    const truncated = activities.filter((_, index) => index % step === 0)
      .slice(0, CONFIG.MAX_ACTIVITIES_PER_PROMPT)

    return { truncated, isTruncated: true }
  }

  public async generateDailyInsights(activities: ActivityRecord[]): Promise<DailyInsights> {
    this.logger.info(`Generating daily insights for ${activities.length} activities`)

    // Validate input
    if (!activities || !Array.isArray(activities)) {
      throw new Error("Invalid activities data provided")
    }

    if (activities.length === 0) {
      return {
        executiveSummary: "No activity data recorded for this day.",
        productivityNarrative: "No work sessions were recorded.",
        behavioralPatterns: "Insufficient data to identify patterns.",
        recommendations: "Ensure the productivity tracker is running during work hours.",
        metadata: {
          generatedAt: new Date().toISOString(),
          dataPoints: 0,
          sessionsAnalyzed: 0
        }
      }
    }

    try {
      // Analyze work sessions
      const sessionAnalysis = this.analyzeWorkSessions(activities)
      
      if (sessionAnalysis.dataQuality === 'low') {
        this.logger.warn("Low quality data detected", sessionAnalysis.warnings)
      }

      // Prepare data for prompt (with truncation if needed)
      const { truncated, isTruncated } = this.truncateActivitiesForPrompt(activities)
      
      if (isTruncated) {
        this.logger.warn(`Truncated activities from ${activities.length} to ${truncated.length} for prompt`)
      }

      const prompt = this.buildDailyInsightsPrompt(sessionAnalysis, truncated, isTruncated)

      const result = await this.retryWithBackoff(async () => {
        return await this.model.generateContent(prompt)
      })

      const response = await result.response
      const text = this.cleanJsonResponse(response.text())
      const insights = JSON.parse(text)

      // Validate response structure
      const requiredFields = ['executiveSummary', 'productivityNarrative', 'behavioralPatterns', 'recommendations']
      for (const field of requiredFields) {
        if (!insights[field] || typeof insights[field] !== 'string') {
          throw new Error(`Missing or invalid field in insights: ${field}`)
        }
      }

      return {
        ...insights,
        metadata: {
          generatedAt: new Date().toISOString(),
          dataPoints: activities.length,
          sessionsAnalyzed: sessionAnalysis.sessions.length
        }
      }

    } catch (error) {
      this.logger.error("Failed to generate daily insights", error)
      throw new Error(`Daily insights generation failed: ${error.message}`)
    }
  }

  private buildDailyInsightsPrompt(
    analysis: SessionAnalysis, 
    activities: ActivityRecord[], 
    isTruncated: boolean
  ): string {
    const { sessions, gaps, totalActiveMinutes, totalGapMinutes, warnings } = analysis

    return `You are an expert productivity analyst. Analyze this complete day of work activity data and provide detailed insights that help the user understand their productivity patterns.

ANALYSIS CONTEXT:
- Total activity records: ${activities.length}${isTruncated ? ' (sampled for analysis)' : ''}
- Work sessions identified: ${sessions.length}
- Time gaps (away from computer): ${gaps.length}
- Total active time: ${Math.round(totalActiveMinutes / 60 * 10) / 10} hours
- Total gap time: ${Math.round(totalGapMinutes / 60 * 10) / 10} hours
- Data quality: ${analysis.dataQuality}
${warnings.length > 0 ? `- Warnings: ${warnings.slice(0, 3).join('; ')}` : ''}

WORK SESSIONS BREAKDOWN:
${sessions.slice(0, 10).map((session, i) => `
Session ${i + 1} (${session.id}):
- Time: ${session.startTime.toLocaleTimeString()} - ${session.endTime.toLocaleTimeString()} (${session.durationMinutes} min)
- Activities recorded: ${session.activities.length}
- Apps used: ${Array.from(session.appsUsed).join(', ')}
- Dominant state: ${session.dominantCognitiveState}
- Session complete: ${session.isComplete ? 'Yes' : 'No (may be ongoing)'}
`).join('\n')}
${sessions.length > 10 ? `\n... and ${sessions.length - 10} more sessions` : ''}

TIME GAPS (> ${CONFIG.MIN_GAP_MINUTES} minutes):
${gaps.slice(0, 5).map(gap => 
  `- ${gap.durationMinutes} min gap (${gap.reason}) at ${gap.startTime.toLocaleTimeString()}`
).join('\n')}
${gaps.length > 5 ? `\n... and ${gaps.length - 5} more gaps` : ''}

SAMPLE ACTIVITY DATA:
${JSON.stringify(activities.slice(0, 20), null, 2)}
${activities.length > 20 ? `\n... and ${activities.length - 20} more activities` : ''}

Provide a comprehensive analysis in JSON format:
{
  "executiveSummary": "Write 2-3 detailed paragraphs providing a complete overview. Include: 
    - Total active computer time vs away time (use exact hours/minutes)
    - Number and nature of work sessions (continuous vs fragmented)
    - Overall productivity percentage (goal-related time / total active time)
    - Key productivity periods and what characterized them
    - Most significant patterns or anomalies in the day
    Be specific with numbers and times.",

  "productivityNarrative": "Write 3-4 paragraphs telling the chronological story of the workday:
    - Opening: When did work begin? What was the first focus area?
    - For each major session: Duration, primary activities, how it ended
    - Transitions: What happened between sessions? Planned breaks or interruptions?
    - Peak periods: When did the best work happen? What enabled it?
    - Closing: How did the day end? Trailing off or decisive finish?
    Use specific times and session details throughout.",

  "behavioralPatterns": "Write 3-4 paragraphs identifying key behavioral patterns:
    - Session dynamics: Average length, consistency, degradation over time
    - Focus patterns: Duration of deep work states, what breaks concentration
    - App usage patterns: Which apps cluster together? Productive vs distracting
    - Energy management: How did energy/focus evolve throughout the day?
    - Context switching: Frequency and impact of app/task switching
    Include specific metrics and examples.",

  "recommendations": "Write 2-3 paragraphs of specific, actionable recommendations:
    - Optimal session timing: Based on the data, when to schedule deep work
    - Break management: Ideal frequency and duration based on their patterns
    - Focus protection: Specific times/conditions to protect based on their best sessions
    - Environmental changes: Which apps/sites to block during focus time
    - Tomorrow's plan: Concrete schedule based on today's patterns
    Every recommendation must reference specific data from their day."
}

IMPORTANT INSTRUCTIONS:
- Use exact times and durations from the data 
- Reference specific sessions by their times
- Build a coherent narrative, not just statistics
- Make connections between different behavioral patterns
- Keep recommendations specific and measurable
- Acknowledge data quality issues if present`
  }

  // Preserve existing Cluely methods for backward compatibility
  public async extractProblemFromImages(imagePaths: string[]) {
    try {
      const imageParts = await Promise.all(
        imagePaths.map(async (path) => ({
          inlineData: {
            data: await this.readImageFile(path),
            mimeType: "image/png"
          }
        }))
      )
      
      const prompt = `You are a helpful assistant. Please analyze these images and extract the following information in JSON format:
{
  "problem_statement": "A clear statement of the problem or situation depicted in the images.",
  "context": "Relevant background or context from the images.",
  "suggested_responses": ["First possible answer or action", "Second possible answer or action", "..."],
  "reasoning": "Explanation of why these suggestions are appropriate."
}
Important: Return ONLY the JSON object, without any markdown formatting or code blocks.`

      const result = await this.model.generateContent([prompt, ...imageParts])
      const response = await result.response
      const text = this.cleanJsonResponse(response.text())
      return JSON.parse(text)
    } catch (error) {
      this.logger.error("Error extracting problem from images", error)
      throw error
    }
  }

  public async generateSolution(problemInfo: any) {
    const prompt = `Given this problem or situation:
${JSON.stringify(problemInfo, null, 2)}

Please provide your response in the following JSON format:
{
  "solution": {
    "code": "The code or main answer here.",
    "problem_statement": "Restate the problem or situation.",
    "context": "Relevant background/context.",
    "suggested_responses": ["First possible answer or action", "Second possible answer or action", "..."],
    "reasoning": "Explanation of why these suggestions are appropriate."
  }
}
Important: Return ONLY the JSON object, without any markdown formatting or code blocks.`

    try {
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = this.cleanJsonResponse(response.text())
      return JSON.parse(text)
    } catch (error) {
      this.logger.error("Error in generateSolution", error)
      throw error
    }
  }

  public async debugSolutionWithImages(problemInfo: any, currentCode: string, debugImagePaths: string[]) {
    try {
      const imageParts = await Promise.all(
        debugImagePaths.map(async (path) => ({
          inlineData: {
            data: await this.readImageFile(path),
            mimeType: "image/png"
          }
        }))
      )
      
      const prompt = `Given:
1. The original problem or situation: ${JSON.stringify(problemInfo, null, 2)}
2. The current response or approach: ${currentCode}
3. The debug information in the provided images

Please analyze the debug information and provide feedback in this JSON format:
{
  "solution": {
    "code": "The code or main answer here.",
    "problem_statement": "Restate the problem or situation.",
    "context": "Relevant background/context.",
    "suggested_responses": ["First possible answer or action", "Second possible answer or action", "..."],
    "reasoning": "Explanation of why these suggestions are appropriate."
  }
}
Important: Return ONLY the JSON object, without any markdown formatting or code blocks.`

      const result = await this.model.generateContent([prompt, ...imageParts])
      const response = await result.response
      const text = this.cleanJsonResponse(response.text())
      return JSON.parse(text)
    } catch (error) {
      this.logger.error("Error debugging solution with images", error)
      throw error
    }
  }

  public async analyzeAudioFile(audioPath: string) {
    try {
      const audioData = await fs.readFile(audioPath)
      const audioPart = {
        inlineData: {
          data: audioData.toString("base64"),
          mimeType: "audio/mp3"
        }
      }
      const prompt = `Describe this audio clip in a short, concise answer. In addition to your main answer, suggest several possible actions or responses the user could take next based on the audio. Do not return a structured JSON object, just answer naturally as you would to a user.`
      
      const result = await this.model.generateContent([prompt, audioPart])
      const response = await result.response
      const text = response.text()
      return { text, timestamp: Date.now() }
    } catch (error) {
      this.logger.error("Error analyzing audio file", error)
      throw error
    }
  }

  public async analyzeAudioFromBase64(data: string, mimeType: string) {
    try {
      const audioPart = {
        inlineData: {
          data,
          mimeType
        }
      }
      const prompt = `Describe this audio clip in a short, concise answer. In addition to your main answer, suggest several possible actions or responses the user could take next based on the audio. Do not return a structured JSON object, just answer naturally as you would to a user and be concise.`
      
      const result = await this.model.generateContent([prompt, audioPart])
      const response = await result.response
      const text = response.text()
      return { text, timestamp: Date.now() }
    } catch (error) {
      this.logger.error("Error analyzing audio from base64", error)
      throw error
    }
  }

  public async analyzeImageFile(imagePath: string) {
    try {
      const imageData = await this.readImageFile(imagePath)
      const imagePart = {
        inlineData: {
          data: imageData,
          mimeType: "image/png"
        }
      }
      const prompt = `Describe the content of this image in a short, concise answer. In addition to your main answer, suggest several possible actions or responses the user could take next based on the image. Do not return a structured JSON object, just answer naturally as you would to a user. Be concise and brief.`
      
      const result = await this.model.generateContent([prompt, imagePart])
      const response = await result.response
      const text = response.text()
      return { text, timestamp: Date.now() }
    } catch (error) {
      this.logger.error("Error analyzing image file", error)
      throw error
    }
  }
}