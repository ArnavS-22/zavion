// Debug.tsx
import React, { useState, useEffect, useRef } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism"
import { ComplexitySection, ContentSection } from "./Solutions"
import ScreenshotQueue from "../components/Queue/ScreenshotQueue"
import {
  Toast,
  ToastDescription,
  ToastMessage,
  ToastTitle,
  ToastVariant
} from "../components/ui/toast"
import ExtraScreenshotsQueueHelper from "../components/Solutions/SolutionCommands"
import { diffLines } from "diff"

type Screenshot = { path: string; preview: string }

type DiffLine = {
  value: string
  added?: boolean
  removed?: boolean
}

const syntaxHighlighterStyles = {
  ".syntax-line": {
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    overflowWrap: "break-word"
  }
} as const

const CodeComparisonSection = ({
  oldCode,
  newCode,
  isLoading
}: {
  oldCode: string | null
  newCode: string | null
  isLoading: boolean
}) => {
  const computeDiff = () => {
    if (!oldCode || !newCode) return { leftLines: [], rightLines: [] }

    // Normalize line endings and clean up the code
    const normalizeCode = (code: string) => {
      return code
        .replace(/\r\n/g, "\n") // Convert Windows line endings to Unix
        .replace(/\r/g, "\n") // Convert remaining carriage returns
        .trim() // Remove leading/trailing whitespace
    }

    const normalizedOldCode = normalizeCode(oldCode)
    const normalizedNewCode = normalizeCode(newCode)

    // Generate the diff
    const diff = diffLines(normalizedOldCode, normalizedNewCode, {
      newlineIsToken: true,
      ignoreWhitespace: true // Changed to true to better handle whitespace differences
    })

    // Process the diff to create parallel arrays
    const leftLines: DiffLine[] = []
    const rightLines: DiffLine[] = []

    diff.forEach((part) => {
      if (part.added) {
        // Add empty lines to left side
        leftLines.push(...Array(part.count || 0).fill({ value: "" }))
        // Add new lines to right side, filter out empty lines at the end
        rightLines.push(
          ...part.value
            .split("\n")
            .filter((line) => line.length > 0)
            .map((line) => ({
              value: line,
              added: true
            }))
        )
      } else if (part.removed) {
        // Add removed lines to left side, filter out empty lines at the end
        leftLines.push(
          ...part.value
            .split("\n")
            .filter((line) => line.length > 0)
            .map((line) => ({
              value: line,
              removed: true
            }))
        )
        // Add empty lines to right side
        rightLines.push(...Array(part.count || 0).fill({ value: "" }))
      } else {
        // Add unchanged lines to both sides
        const lines = part.value.split("\n").filter((line) => line.length > 0)
        leftLines.push(...lines.map((line) => ({ value: line })))
        rightLines.push(...lines.map((line) => ({ value: line })))
      }
    })

    return { leftLines, rightLines }
  }

  const { leftLines, rightLines } = computeDiff()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full" />
        <h2 className="text-xl font-semibold text-slate-800">
          Code Changes
        </h2>
      </div>
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8">
          <div className="flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-600 font-medium">
              Analyzing code differences...
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="flex">
            {/* Previous Code */}
            <div className="w-1/2 border-r border-slate-200">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full" />
                  Previous Version
                </h3>
              </div>
              <div className="p-4">
                <SyntaxHighlighter
                  language="python"
                  style={dracula}
                  customStyle={{
                    maxWidth: "100%",
                    margin: 0,
                    padding: "1.25rem",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                    lineHeight: "1.5"
                  }}
                  wrapLines={true}
                  showLineNumbers={true}
                  lineProps={(lineNumber) => {
                    const line = leftLines[lineNumber - 1]
                    return {
                      style: {
                        display: "block",
                        backgroundColor: line?.removed
                          ? "rgba(239, 68, 68, 0.08)"
                          : "transparent"
                      }
                    }
                  }}
                >
                  {leftLines.map((line) => line.value).join("\n")}
                </SyntaxHighlighter>
              </div>
            </div>

            {/* New Code */}
            <div className="w-1/2">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  Updated Version
                </h3>
              </div>
              <div className="p-4">
                <SyntaxHighlighter
                  language="python"
                  style={dracula}
                  customStyle={{
                    maxWidth: "100%",
                    margin: 0,
                    padding: "1.25rem",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                    lineHeight: "1.5"
                  }}
                  wrapLines={true}
                  showLineNumbers={true}
                  lineProps={(lineNumber) => {
                    const line = rightLines[lineNumber - 1]
                    return {
                      style: {
                        display: "block",
                        backgroundColor: line?.added
                          ? "rgba(34, 197, 94, 0.08)"
                          : "transparent"
                      }
                    }
                  }}
                >
                  {rightLines.map((line) => line.value).join("\n")}
                </SyntaxHighlighter>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface DebugProps {
  isProcessing: boolean
  setIsProcessing: (isProcessing: boolean) => void
}

const Debug: React.FC<DebugProps> = ({ isProcessing, setIsProcessing }) => {
  const queryClient = useQueryClient()
  const contentRef = useRef<HTMLDivElement>(null)

  const [oldCode, setOldCode] = useState<string | null>(null)
  const [newCode, setNewCode] = useState<string | null>(null)
  const [thoughtsData, setThoughtsData] = useState<string[] | null>(null)
  const [timeComplexityData, setTimeComplexityData] = useState<string | null>(
    null
  )
  const [spaceComplexityData, setSpaceComplexityData] = useState<string | null>(
    null
  )

  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<ToastMessage>({
    title: "",
    description: "",
    variant: "neutral"
  })

  const [isTooltipVisible, setIsTooltipVisible] = useState(false)
  const [tooltipHeight, setTooltipHeight] = useState(0)

  const { data: extraScreenshots = [], refetch } = useQuery(
    ["extras"],
    async (): Promise<Screenshot[]> => {
      try {
        const existing = await window.electronAPI.getScreenshots()
        return existing
      } catch (error) {
        console.error("Error loading extra screenshots:", error)
        return []
      }
    },
    {
      staleTime: Infinity,
      cacheTime: Infinity
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

  const handleDeleteExtraScreenshot = async (index: number) => {
    const screenshotToDelete = extraScreenshots[index]

    try {
      const response = await window.electronAPI.deleteScreenshot(
        screenshotToDelete.path
      )

      if (response.success) {
        refetch()
      } else {
        console.error("Failed to delete extra screenshot:", response.error)
      }
    } catch (error) {
      console.error("Error deleting extra screenshot:", error)
    }
  }

  useEffect(() => {
    // Try to get the new solution data from cache first
    const newSolution = queryClient.getQueryData(["new_solution"]) as {
      old_code: string
      new_code: string
      thoughts: string[]
      time_complexity: string
      space_complexity: string
    } | null

    // If we have cached data, set all state variables to the cached data
    if (newSolution) {
      setOldCode(newSolution.old_code || null)
      setNewCode(newSolution.new_code || null)
      setThoughtsData(newSolution.thoughts || null)
      setTimeComplexityData(newSolution.time_complexity || null)
      setSpaceComplexityData(newSolution.space_complexity || null)
      setIsProcessing(false)
    }

    // Set up event listeners
    const cleanupFunctions = [
      window.electronAPI.onScreenshotTaken(() => refetch()),
      window.electronAPI.onResetView(() => refetch()),
      window.electronAPI.onDebugSuccess(() => {
        setIsProcessing(false) //all the other stuff ahapepns in the parent component, so we just need to do this.
      }),
      window.electronAPI.onDebugStart(() => {
        setIsProcessing(true)
      }),
      window.electronAPI.onDebugError((error: string) => {
        showToast(
          "Processing Failed",
          "There was an error debugging your code.",
          "error"
        )
        setIsProcessing(false)
        console.error("Processing error:", error)
      })
    ]

    // Set up resize observer
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

    return () => {
      resizeObserver.disconnect()
      cleanupFunctions.forEach((cleanup) => cleanup())
    }
  }, [queryClient])

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

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full" />
            <h1 className="text-3xl font-bold text-slate-900">
              Code Debug & Analysis
            </h1>
          </div>
          <p className="text-lg text-slate-600 leading-relaxed ml-5">
            Review and compare code changes with intelligent analysis
          </p>
        </div>

        <div className="space-y-8">
          {/* Screenshots Section */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-1 h-5 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full" />
                <h2 className="text-lg font-semibold text-slate-800">Context Screenshots</h2>
                <div className="ml-auto">
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    {extraScreenshots.length} captured
                  </span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <ScreenshotQueue
                screenshots={extraScreenshots}
                onDeleteScreenshot={handleDeleteExtraScreenshot}
                isLoading={isProcessing}
              />
            </div>
          </div>

          {/* Commands Section */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-1 h-5 bg-gradient-to-b from-violet-500 to-purple-600 rounded-full" />
                <h2 className="text-lg font-semibold text-slate-800">Debug Controls</h2>
              </div>
            </div>
            <div className="p-6">
              <ExtraScreenshotsQueueHelper
                extraScreenshots={extraScreenshots}
                onTooltipVisibilityChange={handleTooltipVisibilityChange}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            {/* Thoughts Section */}
            <ContentSection
              title="What I Changed"
              content={
                thoughtsData && (
                  <div className="space-y-4">
                    {thoughtsData.map((thought, index) => (
                      <div key={index} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-2.5 shrink-0" />
                        <div className="text-slate-700 leading-relaxed">{thought}</div>
                      </div>
                    ))}
                  </div>
                )
              }
              isLoading={!thoughtsData}
            />

            {/* Code Comparison Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <CodeComparisonSection
                oldCode={oldCode}
                newCode={newCode}
                isLoading={!oldCode || !newCode}
              />
            </div>

            {/* Complexity Section */}
            <ComplexitySection
              timeComplexity={timeComplexityData}
              spaceComplexity={spaceComplexityData}
              isLoading={!timeComplexityData || !spaceComplexityData}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Debug