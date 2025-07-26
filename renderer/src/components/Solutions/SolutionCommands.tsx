// src/components/Solutions/SolutionCommands.tsx
import React, { useState, useEffect, useRef } from "react"
import { IoExitOutline } from "react-icons/io5"
import { HelpCircle, Camera, RotateCcw, Zap, Eye, EyeOff, Code2, Sparkles } from "lucide-react"

// Type assertion to fix react-icons TypeScript issue
const ExitIcon = IoExitOutline as React.ComponentType<{ className?: string }>

interface SolutionCommandsProps {
  extraScreenshots: any[]
  onTooltipVisibilityChange?: (visible: boolean, height: number) => void
}

const SolutionCommands: React.FC<SolutionCommandsProps> = ({
  extraScreenshots,
  onTooltipVisibilityChange
}) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (onTooltipVisibilityChange) {
      let tooltipHeight = 0
      if (tooltipRef.current && isTooltipVisible) {
        tooltipHeight = tooltipRef.current.offsetHeight + 10
      }
      onTooltipVisibilityChange(isTooltipVisible, tooltipHeight)
    }
  }, [isTooltipVisible, onTooltipVisibilityChange])

  const handleMouseEnter = () => {
    setIsTooltipVisible(true)
  }

  const handleMouseLeave = () => {
    setIsTooltipVisible(false)
  }

  const shortcuts = [
    {
      label: "Show/Hide",
      keys: ["⌘", "B"],
      icon: <Eye className="w-4 h-4" />,
      description: "Toggle window visibility",
      color: "from-blue-500/20 to-cyan-500/20 border-blue-400/30 text-blue-300"
    },
    {
      label: extraScreenshots.length === 0 ? "Screenshot your code" : "Screenshot",
      keys: ["⌘", "H"],
      icon: <Camera className="w-4 h-4" />,
      description: "Capture additional context",
      color: "from-purple-500/20 to-pink-500/20 border-purple-400/30 text-purple-300"
    },
    ...(extraScreenshots.length > 0 ? [{
      label: "Debug",
      keys: ["⌘", "↵"],
      icon: <Code2 className="w-4 h-4" />,
      description: "Generate new solutions",
      color: "from-green-500/20 to-emerald-500/20 border-green-400/30 text-green-300"
    }] : []),
    {
      label: "Start over",
      keys: ["⌘", "R"],
      icon: <RotateCcw className="w-4 h-4" />,
      description: "Reset and begin fresh",
      color: "from-orange-500/20 to-red-500/20 border-orange-400/30 text-orange-300"
    }
  ]

  return (
    <div className="pt-2 w-full">
      {/* Enhanced Command Bar */}
      <div className="relative">
        {/* Background with advanced glass effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-2xl rounded-3xl" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-3xl" />
        <div className="absolute inset-0 border border-slate-600/30 rounded-3xl shadow-2xl shadow-slate-900/50" />
        
        {/* Subtle glow effect */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-50 blur-xl" />
        
        {/* Main content */}
        <div className="relative px-8 py-6">
          <div className="flex items-center justify-between gap-6">
            {/* Shortcuts Section */}
            <div className="flex items-center gap-6 flex-1">
              {shortcuts.map((shortcut, index) => (
                <div key={index} className="flex items-center gap-3 group">
                  {/* Icon with background */}
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${shortcut.color} flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg`}>
                    {shortcut.icon}
                  </div>
                  
                  {/* Label and keys */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-200 whitespace-nowrap group-hover:text-white transition-colors duration-200">
                      {shortcut.label}
                    </span>
                    <div className="flex gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <kbd 
                          key={keyIndex} 
                          className="px-2.5 py-1.5 bg-slate-700/60 hover:bg-slate-600/70 border border-slate-600/50 hover:border-slate-500/60 rounded-lg text-xs font-mono text-slate-200 hover:text-white transition-all duration-200 shadow-sm group-hover:shadow-md"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                  
                  {/* Separator */}
                  {index < shortcuts.length - 1 && (
                    <div className="w-px h-8 bg-gradient-to-b from-transparent via-slate-500/40 to-transparent ml-3" />
                  )}
                </div>
              ))}
            </div>

            {/* Right section with help and exit */}
            <div className="flex items-center gap-4">
              {/* Help Button with enhanced tooltip */}
              <div className="relative">
                <button
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-700/50 to-slate-800/50 border-2 border-slate-600/40 flex items-center justify-center text-slate-300 hover:from-slate-600/60 hover:to-slate-700/60 hover:border-slate-500/60 hover:text-white hover:scale-105 transition-all duration-300 group shadow-lg hover:shadow-xl"
                >
                  <HelpCircle className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
                </button>

                {/* Enhanced Tooltip */}
                {isTooltipVisible && (
                  <div
                    ref={tooltipRef}
                    className="absolute bottom-full right-0 mb-4 w-96 z-50"
                  >
                    <div className="relative">
                      {/* Background with advanced glass effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/98 to-slate-800/98 backdrop-blur-3xl rounded-2xl" />
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/8 via-purple-500/8 to-pink-500/8 rounded-2xl" />
                      <div className="absolute inset-0 border border-slate-600/40 rounded-2xl shadow-2xl shadow-slate-900/60" />
                      
                      {/* Content */}
                      <div className="relative p-6 text-white">
                        <div className="space-y-6">
                          {/* Header */}
                          <div className="flex items-center gap-3 pb-3 border-b border-slate-600/30">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-400/30 flex items-center justify-center">
                              <HelpCircle className="w-5 h-5 text-blue-300" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-white text-lg">Keyboard Shortcuts</h3>
                              <p className="text-slate-400 text-sm">Boost your productivity</p>
                            </div>
                          </div>
                          
                          {/* Shortcuts list */}
                          <div className="space-y-4">
                            {shortcuts.map((shortcut, index) => (
                              <div key={index} className="group/item hover:bg-slate-800/30 rounded-xl p-3 transition-all duration-200">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${shortcut.color} flex items-center justify-center transition-transform duration-200 group-hover/item:scale-110`}>
                                      {shortcut.icon}
                                    </div>
                                    <span className="font-medium text-white/90 group-hover/item:text-white transition-colors duration-200">
                                      {shortcut.label}
                                    </span>
                                  </div>
                                  <div className="flex gap-1">
                                    {shortcut.keys.map((key, keyIndex) => (
                                      <kbd 
                                        key={keyIndex} 
                                        className="px-2.5 py-1.5 bg-slate-700/60 border border-slate-600/40 rounded-lg text-xs font-mono text-slate-200 shadow-sm group-hover/item:bg-slate-600/70 group-hover/item:border-slate-500/50 group-hover/item:text-white transition-all duration-200"
                                      >
                                        {key}
                                      </kbd>
                                    ))}
                                  </div>
                                </div>
                                <p className="text-slate-400 text-sm leading-relaxed pl-11 group-hover/item:text-slate-300 transition-colors duration-200">
                                  {shortcut.description}
                                </p>
                              </div>
                            ))}
                          </div>
                          
                          {/* Footer info */}
                          {extraScreenshots.length > 0 && (
                            <div className="pt-4 border-t border-slate-600/30">
                              <div className="flex items-center gap-3 text-sm">
                                <div className="flex items-center gap-2">
                                  <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />
                                  <span className="text-green-300 font-medium">
                                    {extraScreenshots.length} screenshot{extraScreenshots.length !== 1 ? 's' : ''} ready
                                  </span>
                                </div>
                                <div className="w-px h-4 bg-slate-600/40" />
                                <div className="flex items-center gap-1 text-slate-400">
                                  <Sparkles className="w-3.3 h-3.5 animate-pulse" />
                                  <span>Ready for debugging</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Enhanced tooltip arrow */}
                      <div className="absolute top-full right-6 w-4 h-4 bg-gradient-to-br from-slate-900/98 to-slate-800/98 border-r border-b border-slate-600/40 rotate-45 transform -translate-y-2" />
                    </div>
                  </div>
                )}
              </div>

              {/* Enhanced Exit Button */}
              <button
                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/20 border-2 border-red-400/30 flex items-center justify-center text-red-300 hover:from-red-500/30 hover:to-red-600/30 hover:border-red-400/50 hover:scale-105 transition-all duration-300 group shadow-lg hover:shadow-xl hover:shadow-red-500/25"
                title="Exit Application"
                onClick={() => window.electronAPI.quitApp()}
              >
                <ExitIcon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SolutionCommands