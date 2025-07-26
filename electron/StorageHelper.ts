import { createClient, SupabaseClient } from '@supabase/supabase-js'

export interface ActivityRecord {
  app_classification: string
  goal_relevance: string
  cognitive_state: string
  context_switching: string
  attention_residue: string
  procrastination_signal: string
  energy_level: string
  created_at?: string // Supabase default timestamp
}

// Configuration constants
const SCREENSHOT_INTERVAL_SECONDS = 45
const MINUTES_PER_HOUR = 60

export class StorageHelper {
  private static supabase: SupabaseClient | null = null
  private static tableName = 'activity_records'

  /**
   * Initialize the Supabase client. Call this once at app startup.
   * @param url Supabase project URL
   * @param key Supabase anon/public key
   */
  public static initialize(url: string, key: string): void {
    if (!url || !key) {
      throw new Error('Supabase URL and Key are required for initialization.')
    }
    StorageHelper.supabase = createClient(url, key)
  }

  /**
   * Store a new activity record in Supabase.
   * @param record ActivityRecord object
   */
  public static async storeActivityRecord(record: ActivityRecord): Promise<{ success: boolean; error?: string }> {
    if (!StorageHelper.supabase) {
      throw new Error('Supabase client not initialized. Call StorageHelper.initialize first.')
    }
    try {
      const { error } = await StorageHelper.supabase
        .from(StorageHelper.tableName)
        .insert([record])
      if (error) {
        console.error('[StorageHelper] Error inserting activity record:', error)
        return { success: false, error: error.message }
      }
      return { success: true }
    } catch (err: any) {
      console.error('[StorageHelper] Unexpected error inserting activity record:', err)
      return { success: false, error: err.message }
    }
  }

  /**
   * Get local day boundaries for a given date
   * @param date Date to get boundaries for
   * @returns Object with start and end timestamps in ISO format
   */
  private static getLocalDayBoundaries(date: Date = new Date()): { start: string; end: string } {
    // Create date at start of day in local time
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    // Create date at end of day in local time
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)
    
    // Convert to ISO strings (will include timezone offset)
    return {
      start: startOfDay.toISOString(),
      end: endOfDay.toISOString()
    }
  }

  /**
   * Fetch all activity records for a given day (LOCAL TIME).
   * @param date Date object (defaults to today)
   */
  public static async getDailyActivities(date: Date = new Date()): Promise<ActivityRecord[]> {
    if (!StorageHelper.supabase) {
      throw new Error('Supabase client not initialized. Call StorageHelper.initialize first.')
    }
    
    const { start, end } = this.getLocalDayBoundaries(date)
    
    console.log(`[StorageHelper] Fetching activities for local day: ${date.toLocaleDateString()}`)
    console.log(`[StorageHelper] Time range: ${new Date(start).toLocaleString()} - ${new Date(end).toLocaleString()}`)
    
    try {
      const { data, error } = await StorageHelper.supabase
        .from(StorageHelper.tableName)
        .select('*')
        .gte('created_at', start)
        .lte('created_at', end)
        .order('created_at', { ascending: true })
        
      if (error) {
        console.error('[StorageHelper] Error fetching daily activities:', error)
        return []
      }
      
      const activities = (data as ActivityRecord[]) || []
      console.log(`[StorageHelper] Found ${activities.length} activities for ${date.toLocaleDateString()}`)
      
      return activities
    } catch (err: any) {
      console.error('[StorageHelper] Unexpected error fetching daily activities:', err)
      return []
    }
  }

  /**
   * Get activities grouped by hour for visualization
   * Hours are in local time
   */
  public static async getHourlyBreakdown(date: Date = new Date()): Promise<Map<number, ActivityRecord[]>> {
    const activities = await this.getDailyActivities(date)
    const hourlyMap = new Map<number, ActivityRecord[]>()

    activities.forEach(activity => {
      if (!activity.created_at) {
        console.warn('[StorageHelper] Activity missing created_at timestamp')
        return
      }
      
      try {
        // Parse in local time
        const activityDate = new Date(activity.created_at)
        const localHour = activityDate.getHours() // This gives local hour
        
        if (!hourlyMap.has(localHour)) {
          hourlyMap.set(localHour, [])
        }
        hourlyMap.get(localHour)!.push(activity)
      } catch (error) {
        console.error('[StorageHelper] Error parsing activity timestamp:', error)
      }
    })

    // Log hourly distribution for debugging
    console.log('[StorageHelper] Hourly breakdown:')
    hourlyMap.forEach((activities, hour) => {
      console.log(`  ${hour}:00 - ${activities.length} activities`)
    })

    return hourlyMap
  }

  /**
   * Get simple stats for quick display
   */
  public static async getDailyStats(date: Date = new Date()): Promise<{
    totalRecords: number
    hoursTracked: number
    focusPercentage: number
    topApp: string
    dayStart: string
    dayEnd: string
  }> {
    const activities = await this.getDailyActivities(date)
    
    if (activities.length === 0) {
      return {
        totalRecords: 0,
        hoursTracked: 0,
        focusPercentage: 0,
        topApp: 'None',
        dayStart: 'No data',
        dayEnd: 'No data'
      }
    }

    // Calculate hours tracked (each record represents SCREENSHOT_INTERVAL_SECONDS)
    const minutesTracked = (activities.length * SCREENSHOT_INTERVAL_SECONDS) / MINUTES_PER_HOUR
    const hoursTracked = minutesTracked / MINUTES_PER_HOUR
    
    // Calculate focus percentage
    const focusCount = activities.filter(a => 
      a.cognitive_state === 'deep_focus' || a.cognitive_state === 'light_work'
    ).length
    const focusPercentage = Math.round((focusCount / activities.length) * 100)
    
    // Find most used app
    const appCounts = new Map<string, number>()
    activities.forEach(a => {
      const app = a.app_classification.split(' - ')[0]
      appCounts.set(app, (appCounts.get(app) || 0) + 1)
    })
    
    const topApp = Array.from(appCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'None'
    
    // Get actual work day boundaries
    const firstActivity = activities[0]
    const lastActivity = activities[activities.length - 1]
    const dayStart = firstActivity.created_at 
      ? new Date(firstActivity.created_at).toLocaleTimeString() 
      : 'Unknown'
    const dayEnd = lastActivity.created_at 
      ? new Date(lastActivity.created_at).toLocaleTimeString() 
      : 'Unknown'

    return {
      totalRecords: activities.length,
      hoursTracked: Math.round(hoursTracked * 10) / 10,
      focusPercentage,
      topApp,
      dayStart,
      dayEnd
    }
  }

  /**
   * Get the most recent activity record
   */
  public static async getLatestActivity(): Promise<ActivityRecord | null> {
    if (!StorageHelper.supabase) {
      throw new Error('Supabase client not initialized.')
    }

    try {
      const { data, error } = await StorageHelper.supabase
        .from(StorageHelper.tableName)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        console.error('[StorageHelper] Error fetching latest activity:', error)
        return null
      }

      return data as ActivityRecord
    } catch (err) {
      console.error('[StorageHelper] Unexpected error:', err)
      return null
    }
  }

  /**
   * Get activities for a date range (useful for weekly reports)
   */
  public static async getActivitiesInRange(startDate: Date, endDate: Date): Promise<ActivityRecord[]> {
    if (!StorageHelper.supabase) {
      throw new Error('Supabase client not initialized.')
    }

    const start = this.getLocalDayBoundaries(startDate).start
    const end = this.getLocalDayBoundaries(endDate).end

    try {
      const { data, error } = await StorageHelper.supabase
        .from(StorageHelper.tableName)
        .select('*')
        .gte('created_at', start)
        .lte('created_at', end)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('[StorageHelper] Error fetching activities in range:', error)
        return []
      }

      return (data as ActivityRecord[]) || []
    } catch (err) {
      console.error('[StorageHelper] Unexpected error:', err)
      return []
    }
  }
}