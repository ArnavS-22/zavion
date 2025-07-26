import React, { useState, useEffect, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { ViewType } from "../types/navigation"
import ScreenshotQueue from "../components/Queue/ScreenshotQueue"
import {
  Toast,
  ToastTitle,
  ToastDescription,
  ToastVariant,
  ToastMessage
} from "../components/ui/toast"
import QueueCommands from "../components/Queue/QueueCommands"
import { Button } from "../components/ui/button"
import { BarChart3 } from "lucide-react"

type Screenshot = { path: string; preview: string }

interface QueueProps {
  setView: React.Dispatch<React.SetStateAction<ViewType>>
}

const Queue: React.FC<QueueProps> = ({ setView }) => {
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<ToastMessage>({
    title: "",
    description: "",
    variant: "neutral"
  })

  const [isTooltipVisible, setIsTooltipVisible] = useState(false)
  const [tooltipHeight, setTooltipHeight] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)

  const { data: screenshots = [], refetch } = useQuery(
    ["screenshots"],
    async (): Promise<Screenshot[]> => {
      try {
        const existing = await window.electronAPI.getScreenshots()
        return existing
      } catch (error) {
        console.error("Error loading screenshots:", error)
        showToast("Error", "Failed to load existing screenshots", "error")
        return []
      }
    },
    {
      staleTime: Infinity,
      cacheTime: Infinity,
      refetchOnWindowFocus: true,
      refetchOnMount: true
    }
  )

  const showToast = (
    title: string,
    description: string,
    variant: ToastVariant
  ) => {
    setToastMessage({ title, description, variant })
    setToastOpen(true)
  }

  const handleDeleteScreenshot = async (index: number) => {
    const screenshotToDelete = screenshots[index]

    try {
      const response = await window.electronAPI.deleteScreenshot(
        screenshotToDelete.path
      )

      if (response.success) {
        refetch()
      } else {
        console.error("Failed to delete screenshot:", response.error)
        showToast("Error", "Failed to delete the screenshot file", "error")
      }
    } catch (error) {
      console.error("Error deleting screenshot:", error)
    }
  }

  useEffect(() => {
    const updateDimensions = () => {
      if (contentRef.current) {
        let contentHeight = contentRef.current.scrollHeight
        const contentWidth = contentRef.current.scrollWidth
        if (isTooltipVisible) {
          contentHeight += tooltipHeight
        }
        window.electronAPI.updateContentDimensions({
          width: contentWidth,
          height: contentHeight
        })
      }
    }

    const resizeObserver = new ResizeObserver(updateDimensions)
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current)
    }
    updateDimensions()

    const cleanupFunctions = [
      window.electronAPI.onScreenshotTaken(() => refetch()),
      window.electronAPI.onResetView(() => refetch()),
      window.electronAPI.onSolutionError((error: string) => {
        showToast(
          "Processing Failed",
          "There was an error processing your screenshots.",
          "error"
        )
        setView("queue")
        console.error("Processing error:", error)
      }),
      window.electronAPI.onProcessingNoScreenshots(() => {
        showToast(
          "No Screenshots",
          "There are no screenshots to process.",
          "neutral"
        )
      })
    ]

    return () => {
      resizeObserver.disconnect()
      cleanupFunctions.forEach((cleanup) => cleanup())
    }
  }, [isTooltipVisible, tooltipHeight])

  const handleTooltipVisibilityChange = (visible: boolean, height: number) => {
    setIsTooltipVisible(visible)
    setTooltipHeight(height)
  }

  return (
    <div ref={contentRef} className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <Toast
          open={toastOpen}
          onOpenChange={setToastOpen}
          variant={toastMessage.variant}
          duration={3000}
        >
          <ToastTitle>{toastMessage.title}</ToastTitle>
          <ToastDescription>{toastMessage.description}</ToastDescription>
        </Toast>

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full" />
            <h1 className="text-3xl font-bold text-slate-900">Screenshot Queue</h1>
          </div>
          <p className="text-lg text-slate-600 leading-relaxed ml-5">
            Capture and manage screenshots for AI-powered problem solving
          </p>
        </div>

        <div className="space-y-6">
          {/* Screenshots Section */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-5 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full" />
                  <h2 className="text-lg font-semibold text-slate-800">Recent Screenshots</h2>
                </div>
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  {screenshots.length} captured
                </span>
              </div>
            </div>
            <div className="p-6">
              <ScreenshotQueue
                isLoading={false}
                screenshots={screenshots}
                onDeleteScreenshot={handleDeleteScreenshot}
              />
            </div>
          </div>

          {/* Controls Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-5 bg-gradient-to-b from-violet-500 to-purple-600 rounded-full" />
                  <h2 className="text-lg font-semibold text-slate-800">Quick Actions</h2>
                </div>
              </div>
              <div className="p-6">
                <QueueCommands
                  screenshots={screenshots}
                  onTooltipVisibilityChange={handleTooltipVisibilityChange}
                />
              </div>
            </div>

            {/* Insights Button */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-5 bg-gradient-to-b from-orange-500 to-red-600 rounded-full" />
                  <h2 className="text-lg font-semibold text-slate-800">Analytics</h2>
                </div>
              </div>
              <div className="p-6">
                <Button
                  onClick={() => setView('insights')}
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-all duration-200 rounded-lg font-medium"
                >
                  <BarChart3 className="w-4 h-4" />
                  View Productivity Insights
                </Button>
                <p className="text-xs text-slate-500 mt-3 text-center">
                  Analyze your work patterns and get personalized recommendations
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Queue