import React, { useState, useEffect } from 'react'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Loader } from '../components/ui/loader'

interface InsightsProps {
  setView: (view: "queue" | "solutions" | "debug" | "insights") => void
}

interface DailyInsights {
  executiveSummary: string
  productivityNarrative: string
  behavioralPatterns: string
  recommendations: string
}

interface DailyStats {
  totalRecords: number
  hoursTracked: number
  focusPercentage: number
  topApp: string
  dayStart: string
  dayEnd: string
}

const Insights: React.FC<InsightsProps> = ({ setView }) => {
  const [loading, setLoading] = useState(false)
  const [insights, setInsights] = useState<DailyInsights | null>(null)
  const [stats, setStats] = useState<DailyStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [activeTab, setActiveTab] = useState<'summary' | 'narrative' | 'patterns' | 'recommendations'>('summary')

  // Load stats on mount or date change
  useEffect(() => {
    loadStats()
  }, [selectedDate])

  const loadStats = async () => {
    try {
      const result = await window.electronAPI.getDailyStats(selectedDate)
      if (result.success && result.data) {
        setStats(result.data)
      }
    } catch (err) {
      console.error('Error loading stats:', err)
    }
  }

  const generateInsights = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await window.electronAPI.generateDailyInsights(selectedDate)
      
      if (result.success && result.data) {
        setInsights(result.data.insights)
        setStats(result.data.stats)
      } else {
        setError(result.error || 'Failed to generate insights')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatContent = (content: string) => {
    return content.split('\n\n').map((paragraph, idx) => (
      <p key={idx} className="mb-4 text-gray-300 leading-relaxed">
        {paragraph}
      </p>
    ))
  }

  return (
    <div className="p-6 bg-black text-white min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Productivity Insights</h1>
        <Button
          variant="ghost"
          onClick={() => setView('queue')}
          className="text-sm text-gray-400 hover:text-white px-2 py-1"
        >
          ← Back to Queue
        </Button>
      </div>

      {/* Date Selector and Generate Button */}
      <div className="flex gap-4 mb-6">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className="px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
        />
        <Button
          onClick={generateInsights}
          disabled={loading || !stats || stats.totalRecords < 5}
          variant="default"
          className="flex items-center gap-2"
        >
          {loading ? <Loader className="h-4 w-4" /> : null}
          {loading ? 'Generating...' : 'Generate Insights'}
        </Button>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="bg-gray-900 border-gray-800 p-4">
            <div className="text-xs text-gray-400 uppercase">Hours Tracked</div>
            <div className="text-2xl font-bold">{stats.hoursTracked}h</div>
            <div className="text-xs text-gray-500">{stats.dayStart} - {stats.dayEnd}</div>
          </Card>
          <Card className="bg-gray-900 border-gray-800 p-4">
            <div className="text-xs text-gray-400 uppercase">Focus Score</div>
            <div className="text-2xl font-bold text-green-400">{stats.focusPercentage}%</div>
          </Card>
          <Card className="bg-gray-900 border-gray-800 p-4">
            <div className="text-xs text-gray-400 uppercase">Top App</div>
            <div className="text-xl font-bold">{stats.topApp}</div>
          </Card>
          <Card className="bg-gray-900 border-gray-800 p-4">
            <div className="text-xs text-gray-400 uppercase">Data Points</div>
            <div className="text-2xl font-bold">{stats.totalRecords}</div>
          </Card>
        </div>
      )}

      {/* Error or Minimum Data Warning */}
      {error && (
        <Card className="bg-red-900/20 border-red-800 p-4 mb-6">
          <p className="text-red-400">{error}</p>
        </Card>
      )}

      {stats && stats.totalRecords < 5 && (
        <Card className="bg-yellow-900/20 border-yellow-800 p-4 mb-6">
          <p className="text-yellow-400">
            Need at least 5 activities to generate insights. Current: {stats.totalRecords}
          </p>
        </Card>
      )}

      {/* Insights Content */}
      {insights && (
        <>
          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={activeTab === 'summary' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('summary')}
              className="px-4 py-2"
            >
              Summary
            </Button>
            <Button
              variant={activeTab === 'narrative' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('narrative')}
              className="px-4 py-2"
            >
              Your Day's Story
            </Button>
            <Button
              variant={activeTab === 'patterns' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('patterns')}
              className="px-4 py-2"
            >
              Patterns
            </Button>
            <Button
              variant={activeTab === 'recommendations' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('recommendations')}
              className="px-4 py-2"
            >
              Recommendations
            </Button>
          </div>

          {/* Content Display */}
          <Card className="bg-gray-900 border-gray-800 p-8">
            <div className="prose prose-invert max-w-none">
              {activeTab === 'summary' && formatContent(insights.executiveSummary)}
              {activeTab === 'narrative' && formatContent(insights.productivityNarrative)}
              {activeTab === 'patterns' && formatContent(insights.behavioralPatterns)}
              {activeTab === 'recommendations' && formatContent(insights.recommendations)}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

export default Insights