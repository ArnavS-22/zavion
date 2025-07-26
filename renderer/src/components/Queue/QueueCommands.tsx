// src/components/QueueCommands.tsx
import React, { useState, useEffect, useRef } from "react"
import { IoExitOutline } from "react-icons/io5"
import { Mic, MicOff, Camera, HelpCircle, Zap, Sparkles } from "lucide-react"

// Type assertion to fix react-icons TypeScript issue
const ExitIcon = IoExitOutline as React.ComponentType<{ className?: string }>

interface QueueCommandsProps {
  onTooltipVisibilityChange: (visible: boolean, height: number) => void
  screenshots: Array<{ path: string; preview: string }>
}

const QueueCommands: React.FC<QueueCommandsProps> = ({
  onTooltipVisibilityChange,
  screenshots
}) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioResult, setAudioResult] = useState<string | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)
  const chunks = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    let tooltipHeight = 0
    if (tooltipRef.current && isTooltipVisible) {
      tooltipHeight = tooltipRef.current.offsetHeight + 10
    }
    onTooltipVisibilityChange(isTooltipVisible, tooltipHeight)
  }, [isTooltipVisible, onTooltipVisibilityChange])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const updateAudioLevel = () => {
    if (analyserRef.current && isRecording) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
      analyserRef.current.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length
      setAudioLevel(average / 255)
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel)
    }
  }

  const handleRecordClick = async () => {
    if (!isRecording) {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        
        audioContextRef.current = new AudioContext()
        analyserRef.current = audioContextRef.current.createAnalyser()
        const source = audioContextRef.current.createMediaStreamSource(stream)
        source.connect(analyserRef.current)
        
        analyserRef.current.fftSize = 256
        
        const recorder = new MediaRecorder(stream)
        recorder.ondataavailable = (e) => chunks.current.push(e.data)
        recorder.onstop = async () => {
          const blob = new Blob(chunks.current, { type: chunks.current[0]?.type || 'audio/webm' })
          chunks.current = []
          const reader = new FileReader()
          reader.onloadend = async () => {
            const base64Data = (reader.result as string).split(',')[1]
            try {
              const result = await window.electronAPI.analyzeAudioFromBase64(base64Data, blob.type)
              setAudioResult(result.text)
            } catch (err) {
              setAudioResult('Audio analysis failed.')
            }
          }
          reader.readAsDataURL(blob)
        }
        
        setMediaRecorder(recorder)
        recorder.start()
        setIsRecording(true)
        setRecordingTime(0)
        updateAudioLevel()
        
        recordingIntervalRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1)
        }, 1000)
        
      } catch (err) {
        setAudioResult('Could not start recording.')
      }
    } else {
      // Stop recording
      mediaRecorder?.stop()
      setIsRecording(false)
      setAudioLevel(0)
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }

  const handleMouseEnter = () => {
    setIsTooltipVisible(true)
  }

  const handleMouseLeave = () => {
    setIsTooltipVisible(false)
  }

  return (
    <div className="pt-2 w-fit">
      {/* Enhanced Command Bar */}
      <div className="relative">
        {/* Background with glass effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-2xl rounded-3xl" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl" />
        <div className="absolute inset-0 border border-slate-600/30 rounded-3xl" />
        
        {/* Main content */}
        <div className="relative px-8 py-5 shadow-2xl shadow-slate-900/50">
          <div className="flex items-center gap-6">
            {/* Voice Recording Button */}
            <div className="relative">
              <button
                onClick={handleRecordClick}
                className={`
                  relative flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 group
                  ${isRecording 
                    ? 'bg-gradient-to-br from-red-500/20 to-red-600/20 border-2 border-red-400/60 text-red-300 shadow-lg shadow-red-500/25' 
                    : 'bg-gradient-to-br from-slate-700/50 to-slate-800/50 border-2 border-slate-600/40 text-slate-300 hover:from-slate-600/60 hover:to-slate-700/60 hover:border-slate-500/60 hover:text-white hover:scale-105 hover:shadow-xl hover:shadow-slate-900/30'
                  }
                `}
              >
                {isRecording ? (
                  <MicOff className="w-6 h-6 transition-transform duration-200 group-hover:scale-110" />
                ) : (
                  <Mic className="w-6 h-6 transition-transform duration-200 group-hover:scale-110" />
                )}
                
                {/* Enhanced recording indicator */}
                {isRecording && (
                  <div className="absolute -top-1 -right-1">
                    <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50" />
                    <div className="absolute inset-0 w-4 h-4 bg-red-400 rounded-full animate-ping" />
                  </div>
                )}
                
                {/* Enhanced audio level visualization */}
                {isRecording && (
                  <>
                    <div
                      className="absolute inset-0 rounded-2xl border-2 border-red-300/60 transition-all duration-100"
                      style={{ 
                        transform: `scale(${1 + (audioLevel * 0.4)})`,
                        opacity: 0.4 + (audioLevel * 0.6)
                      }}
                    />
                    <div
                      className="absolute inset-0 rounded-2xl bg-red-400/20 transition-all duration-100"
                      style={{ 
                        transform: `scale(${1 + (audioLevel * 0.2)})`,
                        opacity: audioLevel * 0.5
                      }}
                    />
                  </>
                )}
              </button>
              
              {/* Enhanced recording timer */}
              {isRecording && (
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs px-3 py-1.5 rounded-xl font-mono shadow-lg shadow-red-500/30 border border-red-400/30">
                  {formatTime(recordingTime)}
                </div>
              )}
            </div>

            {/* Stylish Divider */}
            <div className="w-px h-10 bg-gradient-to-b from-transparent via-slate-500/50 to-transparent" />

            {/* Enhanced Screenshot Button */}
            <button
              onClick={() => window.electronAPI.takeScreenshot()}
              className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-700/50 to-slate-800/50 border-2 border-slate-600/40 text-slate-300 hover:from-slate-600/60 hover:to-slate-700/60 hover:border-slate-500/60 hover:text-white hover:scale-105 hover:shadow-xl hover:shadow-slate-900/30 transition-all duration-300 group"
            >
              <Camera className="w-6 h-6 transition-transform duration-200 group-hover:scale-110" />
            </button>

            {/* Enhanced Solve Button */}
            {screenshots.length > 0 && (
              <button
                onClick={() => window.electronAPI.takeScreenshot()}
                className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-2 border-blue-400/30 text-blue-200 rounded-2xl hover:from-blue-500/30 hover:to-purple-500/30 hover:border-blue-400/50 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300 font-semibold text-sm group"
              >
                <Zap className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
                <span>Solve</span>
                <Sparkles className="w-4 h-4 opacity-60 animate-pulse" />
              </button>
            )}

            {/* Stylish Divider */}
            <div className="w-px h-10 bg-gradient-to-b from-transparent via-slate-500/50 to-transparent" />

            {/* Enhanced Help Button */}
            <div className="relative">
              <button
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-700/50 to-slate-800/50 border-2 border-slate-600/40 text-slate-300 hover:from-slate-600/60 hover:to-slate-700/60 hover:border-slate-500/60 hover:text-white hover:scale-105 hover:shadow-xl hover:shadow-slate-900/30 transition-all duration-300 group"
              >
                <HelpCircle className="w-6 h-6 transition-transform duration-200 group-hover:scale-110" />
              </button>

              {/* Enhanced Tooltip */}
              {isTooltipVisible && (
                <div
                  ref={tooltipRef}
                  className="absolute bottom-full mb-4 left-1/2 transform -translate-x-1/2 w-80 z-50"
                >
                  <div className="relative">
                    {/* Background with glass effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-2xl rounded-2xl" />
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl" />
                    <div className="absolute inset-0 border border-slate-600/40 rounded-2xl" />
                    
                    {/* Content */}
                    <div className="relative p-6 text-white text-sm shadow-2xl shadow-slate-900/50">
                      <div className="space-y-5">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-400/30 flex items-center justify-center">
                            <HelpCircle className="w-4 h-4 text-blue-300" />
                          </div>
                          <h3 className="font-semibold text-white/90 text-base">Keyboard Shortcuts</h3>
                        </div>
                        
                        <div className="space-y-4">
                          {[
                            { label: "Toggle Window", keys: ["⌘", "B"], desc: "Show or hide this window" },
                            { label: "Take Screenshot", keys: ["⌘", "H"], desc: "Capture parts of your screen" },
                            { label: "Solve Problem", keys: ["⌘", "↵"], desc: "Process and analyze screenshots" }
                          ].map((shortcut, index) => (
                            <div key={index} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-white/80 font-medium">{shortcut.label}</span>
                                <div className="flex gap-1">
                                  {shortcut.keys.map((key, keyIndex) => (
                                    <kbd key={keyIndex} className="px-2.5 py-1.5 bg-slate-700/60 border border-slate-600/40 rounded-lg text-xs font-mono text-slate-200 shadow-sm">
                                      {key}
                                    </kbd>
                                  ))}
                                </div>
                              </div>
                              <p className="text-slate-400 text-xs leading-relaxed">{shortcut.desc}</p>
                            </div>
                          ))}
                        </div>
                        
                        {screenshots.length > 0 && (
                          <div className="pt-4 border-t border-slate-600/30">
                            <div className="flex items-center gap-2 text-slate-300 text-xs">
                              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                              <span>{screenshots.length} screenshot{screenshots.length !== 1 ? 's' : ''} captured</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Enhanced tooltip arrow */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-3 h-3 bg-gradient-to-br from-slate-900/95 to-slate-800/95 border-r border-b border-slate-600/40 rotate-45" />
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced Exit Button */}
            <button
              onClick={() => window.electronAPI.quitApp()}
              className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/20 border-2 border-red-400/30 text-red-300 hover:from-red-500/30 hover:to-red-600/30 hover:border-red-400/50 hover:scale-105 hover:shadow-xl hover:shadow-red-500/25 transition-all duration-300 group"
            >
              <ExitIcon className="w-6 h-6 transition-transform duration-200 group-hover:scale-110" />
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Audio Result Display */}
      {audioResult && (
        <div className="mt-4 relative">
          {/* Background with glass effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 to-slate-800/90 backdrop-blur-xl rounded-2xl" />
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-2xl" />
          
          {/* Content */}
          <div className="relative p-4 border border-slate-600/30 rounded-2xl shadow-xl shadow-slate-900/30">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500/20 to-blue-500/20 border border-green-400/30 flex items-center justify-center shrink-0 mt-0.5">
                <Mic className="w-4 h-4 text-green-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-green-300 text-sm">Audio Result:</span>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                </div>
                <p className="text-white/90 text-sm leading-relaxed break-words">
                  {audioResult}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default QueueCommands