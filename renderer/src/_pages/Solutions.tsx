// Solutions.tsx - Enhanced version with polished UI
import React, { useState, useEffect, useRef } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism"
import { ViewType } from "../types/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Loader } from "../components/ui/loader"
import { Code, Brain, Zap, Clock, FileText, Mic, Sparkles, Activity, Target, Cpu } from "lucide-react"

import ScreenshotQueue from "../components/Queue/ScreenshotQueue"
import {
  Toast,
  ToastDescription,
  ToastMessage,
  ToastTitle,
  ToastVariant
} from "../components/ui/toast"
import { ProblemStatementData } from "../types/solutions"
import { AudioResult } from "../types/audio"
import SolutionCommands from "../components/Solutions/SolutionCommands"
import Debug from "./Debug"

type Screenshot = { path: string; preview: string }

export const ContentSection = ({
  title,
  content,
  isLoading,
  icon
}: {
  title: string
  content: React.ReactNode
  isLoading: boolean
  icon?: React.ReactNode
}) => (
  <div className="relative group">
    {/* Background with gradient and glow */}
    <div className="absolute inset-0 bg-gradient-to-br from-slate-900/60 via-slate-800/40 to-slate-900/60 rounded-3xl" />
    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-3xl" />
    <div className="absolute inset-0 border border-slate-700/50 rounded-3xl group-hover:border-slate-600/60 transition-colors duration-300" />
    
    {/* Subtle glow effect */}
    <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
    
    <Card className="relative bg-transparent border-0 shadow-none">
      <CardHeader className="pb-6">
        <CardTitle className="flex items-center gap-4 text-2xl font-bold text-white">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-700/50 to-slate-800/50 border border-slate-600/40 flex items-center justify-center">
            {icon}
          </div>
          <div>
            <h3 className="text-white">{title}</h3>
            <div className="text-slate-400 text-sm font-normal mt-1">
              {isLoading ? "Processing..." : "Ready"}
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Loader className="h-8 w-8 text-blue-500 animate-spin" />
                <div className="absolute inset-0 w-8 h-8 border-2 border-transparent border-r-purple-500 rounded-full animate-spin animate-reverse" style={{ animationDelay: '0.5s' }} />
              </div>
              <div className="text-slate-300 text-sm animate-pulse">
                Extracting problem statement...
              </div>
            </div>
          </div>
        ) : (
          <div className="text-white leading-relaxed bg-slate-800/30 rounded-2xl p-6 border border-slate-700/40">
            {content}
          </div>
        )}
      </CardContent>
    </Card>
  </div>
)

const SolutionSection = ({
  title,
  content,
  isLoading
}: {
  title: string
  content: React.ReactNode
  isLoading: boolean
}) => (
  <div className="relative group">
    {/* Enhanced background with glass effect */}
    <div className="absolute inset-0 bg-gradient-to-br from-slate-900/60 via-slate-800/40 to-slate-900/60 rounded-3xl" />
    <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-blue-500/5 to-purple-500/5 rounded-3xl" />
    <div className="absolute inset-0 border border-slate-700/50 rounded-3xl group-hover:border-slate-600/60 transition-colors duration-300" />
    
    <Card className="relative bg-transparent border-0 shadow-none">
      <CardHeader className="pb-6">
        <CardTitle className="flex items-center gap-4 text-2xl font-bold text-white">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500/20 to-blue-500/20 border border-green-400/30 flex items-center justify-center">
            <Code className="w-6 h-6 text-green-300" />
          </div>
          <div>
            <h3 className="text-white">{title}</h3>
            <div className="text-slate-400 text-sm font-normal mt-1 flex items-center gap-2">
              {isLoading ? (
                <>
                  <Activity className="w-4 h-4 animate-pulse" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-green-400" />
                  <span>Complete</span>
                </>
              )}
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Loader className="h-8 w-8 text-green-500 animate-spin" />
                <div className="absolute inset-0 w-8 h-8 border-2 border-transparent border-r-blue-500 rounded-full animate-spin animate-reverse" style={{ animationDelay: '0.3s' }} />
              </div>
              <div className="text-slate-300 text-sm animate-pulse">
                Loading solutions...
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full rounded-2xl overflow-hidden border border-slate-700/40 bg-slate-900/60">
            <SyntaxHighlighter
              showLineNumbers
              language="python"
              style={dracula}
              customStyle={{
                maxWidth: "100%",
                margin: 0,
                padding: "2rem",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                borderRadius: "1rem",
                fontSize: "0.9rem",
                lineHeight: "1.6",
                background: "transparent"
              }}
              wrapLongLines={true}
            >
              {content as string}
            </SyntaxHighlighter>
          </div>
        )}
      </CardContent>
    </Card>
  </div>
)

export const ComplexitySection = ({
  timeComplexity,
  spaceComplexity,
  isLoading
}: {
  timeComplexity: string | null
  spaceComplexity: string | null
  isLoading: boolean
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
    {/* Time Complexity Card */}
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/60 via-slate-800/40 to-slate-900/60 rounded-3xl" />
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-red-500/5 rounded-3xl" />
      <div className="absolute inset-0 border border-slate-700/50 rounded-3xl group-hover:border-slate-600/60 transition-colors duration-300" />
      
      <Card className="relative bg-transparent border-0 shadow-none">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-4 text-xl font-bold text-white">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-400/30 flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-300" />
            </div>
            <div>
              <h3 className="text-white">Time Complexity</h3>
              <div className="text-slate-400 text-sm font-normal mt-1">
                Algorithm efficiency
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-3">
                <Loader className="h-6 w-6 text-orange-500 animate-spin" />
                <div className="text-slate-400 text-sm animate-pulse">
                  Calculating...
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/40">
              <div className="text-3xl font-bold text-white mb-2 font-mono">
                {timeComplexity}
              </div>
              <div className="text-slate-400 text-sm">
                Runtime performance
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    
    {/* Space Complexity Card */}
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/60 via-slate-800/40 to-slate-900/60 rounded-3xl" />
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-3xl" />
      <div className="absolute inset-0 border border-slate-700/50 rounded-3xl group-hover:border-slate-600/60 transition-colors duration-300" />
      
      <Card className="relative bg-transparent border-0 shadow-none">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-4 text-xl font-bold text-white">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-400/30 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h3 className="text-white">Space Complexity</h3>
              <div className="text-slate-400 text-sm font-normal mt-1">
                Memory usage
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-3">
                <Loader className="h-6 w-6 text-blue-500 animate-spin" />
                <div className="text-slate-400 text-sm animate-pulse">
                  Calculating...
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/40">
              <div className="text-3xl font-bold text-white mb-2 font-mono">
                {spaceComplexity}
              </div>
              <div className="text-slate-400 text-sm">
                Memory efficiency
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  </div>
)

interface SolutionsProps {
  setView: React.Dispatch<React.SetStateAction<ViewType>>
}

const Solutions: React.FC<SolutionsProps> = ({ setView }) => {
  const queryClient = useQueryClient()
  const contentRef = useRef<HTMLDivElement>(null)

  // Audio recording state
  const [audioRecording, setAudioRecording] = useState(false)
  const [audioResult, setAudioResult] = useState<AudioResult | null>(null)

  const [debugProcessing, setDebugProcessing] = useState(false)
  const [problemStatementData, setProblemStatementData] =
    useState<ProblemStatementData | null>(null)
  const [solutionData, setSolutionData] = useState<string | null>(null)
  const [thoughtsData, setThoughtsData] = useState<string[] | null>(null)
  const [timeComplexityData, setTimeComplexityData] = useState<string | null>(
    null
  )
  const [spaceComplexityData, setSpaceComplexityData] = useState<string | null>(
    null
  )
  const [customContent, setCustomContent] = useState<string | null>(null)

  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<ToastMessage>({
    title: "",
    description: "",
    variant: "neutral"
  })

  const [isTooltipVisible, setIsTooltipVisible] = useState(false)
  const [tooltipHeight, setTooltipHeight] = useState(0)

  const [isResetting, setIsResetting] = useState(false)

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
    // Height update logic
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

    // Initialize resize observer
    const resizeObserver = new ResizeObserver(updateDimensions)
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current)
    }
    updateDimensions()

    // Set up event listeners
    const cleanupFunctions = [
      window.electronAPI.onScreenshotTaken(() => refetch()),
      window.electronAPI.onResetView(() => {
        // Set resetting state first
        setIsResetting(true)

        // Clear the queries
        queryClient.removeQueries(["solution"])
        queryClient.removeQueries(["new_solution"])

        // Reset other states
        refetch()

        // After a small delay, clear the resetting state
        setTimeout(() => {
          setIsResetting(false)
        }, 0)
      }),
      window.electronAPI.onSolutionStart(async () => {
        // Reset UI state for a new solution
        setSolutionData(null)
        setThoughtsData(null)
        setTimeComplexityData(null)
        setSpaceComplexityData(null)
        setCustomContent(null)
        setAudioResult(null)

        // Start audio recording from user's microphone
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          const mediaRecorder = new MediaRecorder(stream)
          const chunks: Blob[] = []
          mediaRecorder.ondataavailable = (e) => chunks.push(e.data)
          mediaRecorder.start()
          setAudioRecording(true)
          // Record for 5 seconds (or adjust as needed)
          setTimeout(() => mediaRecorder.stop(), 5000)
          mediaRecorder.onstop = async () => {
            setAudioRecording(false)
            const blob = new Blob(chunks, { type: chunks[0]?.type || 'audio/webm' })
            const reader = new FileReader()
            reader.onloadend = async () => {
              const base64Data = (reader.result as string).split(',')[1]
              // Send audio to Gemini for analysis
              try {
                const result = await window.electronAPI.analyzeAudioFromBase64(
                  base64Data,
                  blob.type
                )
                // Store result in react-query cache
                queryClient.setQueryData(["audio_result"], result)
                setAudioResult(result)
              } catch (err) {
                console.error('Audio analysis failed:', err)
              }
            }
            reader.readAsDataURL(blob)
          }
        } catch (err) {
          console.error('Audio recording error:', err)
        }

        // Simulate receiving custom content shortly after start
        setTimeout(() => {
          setCustomContent(
            "This is the dynamically generated content appearing after loading starts."
          )
        }, 1500) // Example delay
      }),
      //if there was an error processing the initial solution
      window.electronAPI.onSolutionError((error: string) => {
        showToast(
          "Processing Failed",
          "There was an error processing your extra screenshots.",
          "error"
        )
        // Reset solutions in the cache (even though this shouldn't ever happen) and complexities to previous states
        const solution = queryClient.getQueryData(["solution"]) as {
          code: string
          thoughts: string[]
          time_complexity: string
          space_complexity: string
        } | null
        if (!solution) {
          setView("queue") //make sure that this is correct. or like make sure there's a toast or something
        }
        setSolutionData(solution?.code || null)
        setThoughtsData(solution?.thoughts || null)
        setTimeComplexityData(solution?.time_complexity || null)
        setSpaceComplexityData(solution?.space_complexity || null)
        console.error("Processing error:", error)
      }),
      //when the initial solution is generated, we'll set the solution data to that
      window.electronAPI.onSolutionSuccess((data) => {
        if (!data?.solution) {
          console.warn("Received empty or invalid solution data")
          return
        }

        console.log({ solution: data.solution })

        const solutionData = {
          code: data.solution.code,
          thoughts: data.solution.thoughts,
          time_complexity: data.solution.time_complexity,
          space_complexity: data.solution.space_complexity
        }

        queryClient.setQueryData(["solution"], solutionData)
        setSolutionData(solutionData.code || null)
        setThoughtsData(solutionData.thoughts || null)
        setTimeComplexityData(solutionData.time_complexity || null)
        setSpaceComplexityData(solutionData.space_complexity || null)
      }),

      //########################################################
      //DEBUG EVENTS
      //########################################################
      window.electronAPI.onDebugStart(() => {
        //we'll set the debug processing state to true and use that to render a little loader
        setDebugProcessing(true)
      }),
      //the first time debugging works, we'll set the view to debug and populate the cache with the data
      window.electronAPI.onDebugSuccess((data) => {
        console.log({ debug_data: data })

        queryClient.setQueryData(["new_solution"], data.solution)
        setDebugProcessing(false)
      }),
      //when there was an error in the initial debugging, we'll show a toast and stop the little generating pulsing thing.
      window.electronAPI.onDebugError(() => {
        showToast(
          "Processing Failed",
          "There was an error debugging your code.",
          "error"
        )
        setDebugProcessing(false)
      }),
      window.electronAPI.onProcessingNoScreenshots(() => {
        showToast(
          "No Screenshots",
          "There are no extra screenshots to process.",
          "neutral"
        )
      })
    ]

    return () => {
      resizeObserver.disconnect()
      cleanupFunctions.forEach((cleanup) => cleanup())
    }
  }, [isTooltipVisible, tooltipHeight, setView])

  useEffect(() => {
    setProblemStatementData(
      queryClient.getQueryData(["problem_statement"]) || null
    )
    setSolutionData(queryClient.getQueryData(["solution"]) || null)

    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event?.query.queryKey[0] === "problem_statement") {
        setProblemStatementData(
          queryClient.getQueryData(["problem_statement"]) || null
        )
        // If this is from audio processing, show it in the custom content section
        const audioResult = queryClient.getQueryData(["audio_result"]) as AudioResult | undefined;
        if (audioResult) {
          // Update all relevant sections when audio result is received
          setProblemStatementData({
            problem_statement: audioResult.text,
            input_format: {
              description: "Generated from audio input",
              parameters: []
            },
            output_format: {
              description: "Generated from audio input",
              type: "string",
              subtype: "text"
            },
            complexity: {
              time: "N/A",
              space: "N/A"
            },
            test_cases: [],
            validation_type: "manual",
            difficulty: "custom"
          });
          setSolutionData(null); // Reset solution to trigger loading state
          setThoughtsData(null);
          setTimeComplexityData(null);
          setSpaceComplexityData(null);
        }
      }
      if (event?.query.queryKey[0] === "solution") {
        const solution = queryClient.getQueryData(["solution"]) as {
          code: string
          thoughts: string[]
          time_complexity: string
          space_complexity: string
        } | null

        setSolutionData(solution?.code ?? null)
        setThoughtsData(solution?.thoughts ?? null)
        setTimeComplexityData(solution?.time_complexity ?? null)
        setSpaceComplexityData(solution?.space_complexity ?? null)
      }
    })
    return () => unsubscribe()
  }, [queryClient])

  const handleTooltipVisibilityChange = (visible: boolean, height: number) => {
    setIsTooltipVisible(visible)
    setTooltipHeight(height)
  }

  return (
    <>
      {!isResetting && queryClient.getQueryData(["new_solution"]) ? (
        <>
          <Debug
            isProcessing={debugProcessing}
            setIsProcessing={setDebugProcessing}
          />
        </>
      ) : (
        <div ref={contentRef} className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          {/* Enhanced background with subtle patterns */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900 to-slate-950" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.02%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />
          
          <div className="relative max-w-7xl mx-auto px-12 py-16">
            <Toast
              open={toastOpen}
              onOpenChange={setToastOpen}
              variant={toastMessage.variant}
              duration={3000}
            >
              <ToastTitle>{toastMessage.title}</ToastTitle>
              <ToastDescription>{toastMessage.description}</ToastDescription>
            </Toast>

            {/* Enhanced Header */}
            <div className="mb-16 text-center">
              <div className="inline-flex items-center gap-3 mb-6">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 border border-blue-400/30 flex items-center justify-center">
                  <Zap className="w-8 h-8 text-blue-300" />
                </div>
                <div className="text-left">
                  <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                    AI Solution Generator
                  </h1>
                  <div className="flex items-center gap-2 mt-2">
                    <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
                    <p className="text-xl text-slate-400">
                      Generate intelligent solutions from screenshots and voice input
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Screenshots Section */}
            {solutionData && (
              <div className="mb-12">
                <div className="relative">
                  {/* Background effects */}
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900/60 via-slate-800/40 to-slate-900/60 rounded-3xl" />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-3xl" />
                  <div className="absolute inset-0 border border-slate-700/50 rounded-3xl" />
                  
                  <div className="relative p-10">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/30 flex items-center justify-center">
                        <Target className="w-6 h-6 text-purple-300" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-white">Context Screenshots</h2>
                        <p className="text-slate-400 mt-1">Visual context for solution generation</p>
                      </div>
                    </div>
                    <ScreenshotQueue
                      isLoading={debugProcessing}
                      screenshots={extraScreenshots}
                      onDeleteScreenshot={handleDeleteExtraScreenshot}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Commands Section */}
            <div className="mb-12">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/60 via-slate-800/40 to-slate-900/60 rounded-3xl" />
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-teal-500/5 to-blue-500/5 rounded-3xl" />
                <div className="absolute inset-0 border border-slate-700/50 rounded-3xl" />
                
                <div className="relative p-10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500/20 to-teal-500/20 border border-green-400/30 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-green-300" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-white">Solution Controls</h2>
                      <p className="text-slate-400 mt-1">Powerful tools to enhance your workflow</p>
                    </div>
                  </div>
                  <SolutionCommands
                    extraScreenshots={extraScreenshots}
                    onTooltipVisibilityChange={handleTooltipVisibilityChange}
                  />
                </div>
              </div>
            </div>

            {/* Enhanced Main Content */}
            <div className="space-y-12">
              {/* Show Screenshot or Audio Result as main output if validation_type is manual */}
              {problemStatementData?.validation_type === "manual" ? (
                <ContentSection
                  title={problemStatementData?.output_format?.subtype === "voice" ? "Audio Result" : "Screenshot Result"}
                  content={problemStatementData.problem_statement}
                  isLoading={false}
                  icon={problemStatementData?.output_format?.subtype === "voice" ? <Mic className="w-6 h-6 text-green-400" /> : <FileText className="w-6 h-6 text-blue-400" />}
                />
              ) : (
                <>
                  {/* Problem Statement Section - Only for non-manual */}
                  <ContentSection
                    title={problemStatementData?.output_format?.subtype === "voice" ? "Voice Input" : "Problem Statement"}
                    content={problemStatementData?.problem_statement}
                    isLoading={!problemStatementData}
                    icon={problemStatementData?.output_format?.subtype === "voice" ? <Mic className="w-6 h-6 text-green-400" /> : <FileText className="w-6 h-6 text-blue-400" />}
                  />
                  
                  {/* Show loading state when waiting for solution */}
                  {problemStatementData && !solutionData && (
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/60 via-slate-800/40 to-slate-900/60 rounded-3xl" />
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 rounded-3xl" />
                      <div className="absolute inset-0 border border-slate-700/50 rounded-3xl" />
                      
                      <Card className="relative bg-transparent border-0 shadow-none">
                        <CardContent className="p-16 text-center">
                          <div className="flex flex-col items-center gap-6">
                            <div className="relative">
                              <Loader className="h-12 w-12 text-yellow-500 animate-spin" />
                              <div className="absolute inset-0 w-12 h-12 border-3 border-transparent border-r-orange-500 rounded-full animate-spin animate-reverse" style={{ animationDelay: '0.4s' }} />
                            </div>
                            <div className="space-y-2">
                              <h3 className="text-2xl font-bold text-white">
                                {problemStatementData?.output_format?.subtype === "voice" 
                                  ? "Processing voice input..." 
                                  : "Generating solutions..."}
                              </h3>
                              <p className="text-slate-400">
                                AI is analyzing your input and crafting the perfect solution
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                  
                  {/* Solution Sections (legacy, only for non-manual) */}
                  {solutionData && (
                    <>
                      <ContentSection
                        title="Analysis"
                        content={
                          thoughtsData && (
                            <div className="space-y-6">
                              {thoughtsData.map((thought, index) => (
                                <div
                                  key={index}
                                  className="group flex items-start gap-4 p-6 bg-slate-800/40 rounded-2xl border border-slate-700/40 hover:bg-slate-800/60 hover:border-slate-600/60 transition-all duration-300"
                                >
                                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/30 flex items-center justify-center shrink-0 mt-1 group-hover:scale-110 transition-transform duration-300">
                                    <div className="w-3 h-3 rounded-full bg-purple-400" />
                                  </div>
                                  <div className="text-slate-200 leading-relaxed group-hover:text-white transition-colors duration-300">
                                    {thought}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )
                        }
                        isLoading={!thoughtsData}
                        icon={<Brain className="w-6 h-6 text-purple-400" />}
                      />
                      
                      <SolutionSection
                        title={problemStatementData?.output_format?.subtype === "voice" ? "Response" : "Solution"}
                        content={solutionData}
                        isLoading={!solutionData}
                      />
                      
                      {problemStatementData?.output_format?.subtype !== "voice" && (
                        <ComplexitySection
                          timeComplexity={timeComplexityData}
                          spaceComplexity={spaceComplexityData}
                          isLoading={!timeComplexityData || !spaceComplexityData}
                        />
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Solutions