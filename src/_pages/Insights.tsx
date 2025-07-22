import React, { useState, useEffect } from 'react'
import { ViewType, ProductivityInsights, ProductivityStats } from '../types/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Loader } from '../components/ui/loader'

interface InsightsProps {
  setView: React.Dispatch<React.SetStateAction<ViewType>>
}

const Insights: React.FC<InsightsProps> = ({ setView }) => {
  const [loading, setLoading] = useState(false)
  const [insights, setInsights] = useState<ProductivityInsights | null>(null)
  const [stats, setStats] = useState<ProductivityStats | null>(null)
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
        setError(null)
      } else {
        setError(result.error || 'Failed to load daily statistics')
      }
    } catch (err) {
      console.error('Error loading stats:', err)
      setError('Failed to connect to productivity tracking service')
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
      setError(err.message || 'An error occurred while generating insights')
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

  const getTabLabel = (tab: typeof activeTab): string => {
    const labels = {
      'summary': 'Summary',
      'narrative': "Your Day's Story",
      'patterns': 'Patterns',
      'recommendations': 'Recommendations'
    }
    return labels[tab]
  }

  const getTabContent = (): string => {
    if (!insights) return ''
    const contentMap = {
      'summary': insights.executiveSummary,
      'narrative': insights.productivityNarrative,
      'patterns': insights.behavioralPatterns,
      'recommendations': insights.recommendations
    }
    return contentMap[activeTab]
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
          className="px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-gray-500"
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
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="text-xs text-gray-400 uppercase tracking-wide">Hours Tracked</div>
              <div className="text-2xl font-bold mt-1">{stats.hoursTracked}h</div>
              <div className="text-xs text-gray-500 mt-1">{stats.dayStart} - {stats.dayEnd}</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="text-xs text-gray-400 uppercase tracking-wide">Focus Score</div>
              <div className={`text-2xl font-bold mt-1 ${
                stats.focusPercentage >= 70 ? 'text-green-400' : 
                stats.focusPercentage >= 50 ? 'text-yellow-400' : 
                'text-red-400'
              }`}>
                {stats.focusPercentage}%
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="text-xs text-gray-400 uppercase tracking-wide">Top App</div>
              <div className="text-xl font-bold mt-1 truncate">{stats.topApp}</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="text-xs text-gray-400 uppercase tracking-wide">Data Points</div>
              <div className="text-2xl font-bold mt-1">{stats.totalRecords}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error or Minimum Data Warning */}
      {error && (
        <Card className="bg-red-900/20 border-red-800 mb-6">
          <CardContent className="p-4">
            <p className="text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {stats && stats.totalRecords < 5 && !error && (
        <Card className="bg-yellow-900/20 border-yellow-800 mb-6">
          <CardContent className="p-4">
            <p className="text-yellow-400">
              Need at least 5 activities to generate insights. Current: {stats.totalRecords}
            </p>
            <p className="text-yellow-400/70 text-sm mt-2">
              The tracker takes a screenshot every 45 seconds while you work.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Insights Content */}
      {insights && (
        <>
          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6 border-b border-gray-800">
            {(['summary', 'narrative', 'patterns', 'recommendations'] as const).map((tab) => (
              <Button
                key={tab}
                variant={activeTab === tab ? 'default' : 'ghost'}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-b-none ${
                  activeTab === tab 
                    ? 'bg-gray-800 text-white border-b-2 border-blue-500' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {getTabLabel(tab)}
              </Button>
            ))}
          </div>

          {/* Content Display */}
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-8">
              <div className="prose prose-invert max-w-none">
                {formatContent(getTabContent())}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty State */}
      {!stats && !error && (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-12 text-center">
            <Loader className="h-8 w-8 mx-auto mb-4" />
            <p className="text-gray-400">Loading productivity data...</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default Insights