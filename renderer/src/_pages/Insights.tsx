import React, { useState, useEffect } from 'react'
import { ViewType, ProductivityInsights, ProductivityStats } from '../types/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Loader } from '../components/ui/loader'
import { ArrowLeft, Calendar, TrendingUp, Clock, Target, Activity } from 'lucide-react'

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
      <p key={idx} className="mb-6 text-slate-700 leading-relaxed">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full" />
              <h1 className="text-3xl font-bold text-slate-900">
                Productivity Insights
              </h1>
            </div>
            <p className="text-lg text-slate-600 leading-relaxed ml-5">
              Analyze your work patterns and optimize your productivity
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setView('queue')}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-all duration-200 rounded-lg text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Queue
          </Button>
        </div>

        <div className="space-y-6">
          {/* Date Selector and Generate Button */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-slate-500" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                />
              </div>
              <Button
                onClick={generateInsights}
                disabled={loading || !stats || stats.totalRecords < 5}
                variant="default"
                className="flex items-center gap-2 px-6 py-2 font-medium disabled:opacity-50"
              >
                {loading ? <Loader className="h-4 w-4" /> : <TrendingUp className="w-4 h-4" />}
                {loading ? 'Generating...' : 'Generate Insights'}
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div className="text-xs text-slate-500 uppercase tracking-wide font-medium">Hours Tracked</div>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mb-1">{stats.hoursTracked}h</div>
                  <div className="text-xs text-slate-500">{stats.dayStart} - {stats.dayEnd}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <Target className="w-5 h-5 text-green-600" />
                    <div className="text-xs text-slate-500 uppercase tracking-wide font-medium">Focus Score</div>
                  </div>
                  <div className={`text-2xl font-bold mb-1 ${
                    stats.focusPercentage >= 70 ? 'text-green-600' : 
                    stats.focusPercentage >= 50 ? 'text-yellow-600' : 
                    'text-red-600'
                  }`}>
                    {stats.focusPercentage}%
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <Activity className="w-5 h-5 text-purple-600" />
                    <div className="text-xs text-slate-500 uppercase tracking-wide font-medium">Top App</div>
                  </div>
                  <div className="text-lg font-bold text-slate-900 truncate">{stats.topApp}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <TrendingUp className="w-5 h-5 text-orange-600" />
                    <div className="text-xs text-slate-500 uppercase tracking-wide font-medium">Data Points</div>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{stats.totalRecords}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Error or Minimum Data Warning */}
          {error && (
            <Card className="bg-red-50 border border-red-200">
              <CardContent className="p-5">
                <p className="text-red-700 font-medium">{error}</p>
              </CardContent>
            </Card>
          )}

          {stats && stats.totalRecords < 5 && !error && (
            <Card className="bg-amber-50 border border-amber-200">
              <CardContent className="p-5">
                <p className="text-amber-700 font-medium">
                  Need at least 5 activities to generate insights. Current: {stats.totalRecords}
                </p>
                <p className="text-amber-600 text-sm mt-2">
                  The tracker takes a screenshot every 45 seconds while you work.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Insights Content */}
          {insights && (
            <div className="space-y-6">
              {/* Tab Navigation */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-2">
                <div className="flex gap-1">
                  {(['summary', 'narrative', 'patterns', 'recommendations'] as const).map((tab) => (
                    <Button
                      key={tab}
                      variant={activeTab === tab ? 'default' : 'ghost'}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                        activeTab === tab 
                          ? 'bg-blue-600 text-white shadow-sm' 
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {getTabLabel(tab)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Content Display */}
              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="prose max-w-none">
                    {formatContent(getTabContent())}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Empty State */}
          {!stats && !error && (
            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardContent className="p-12 text-center">
                <Loader className="h-8 w-8 mx-auto mb-4 text-blue-600" />
                <p className="text-slate-600">Loading productivity data...</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default Insights