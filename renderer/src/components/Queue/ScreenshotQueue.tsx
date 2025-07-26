// src/components/Queue/ScreenshotQueue.tsx
import React from "react"
import ScreenshotItem from "./ScreenshotItem"
import { Camera, Sparkles, ImageIcon } from "lucide-react"

interface Screenshot {
  path: string
  preview: string
}

interface ScreenshotQueueProps {
  isLoading: boolean
  screenshots: Screenshot[]
  onDeleteScreenshot: (index: number) => void
}

const ScreenshotQueue: React.FC<ScreenshotQueueProps> = ({
  isLoading,
  screenshots,
  onDeleteScreenshot
}) => {
  if (screenshots.length === 0) {
    return (
      <div className="relative">
        {/* Background with animated gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/60 via-slate-800/40 to-slate-900/60 rounded-2xl" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-2xl animate-pulse" />
        
        {/* Main container */}
        <div className="relative bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-12 text-center">
          {/* Floating icon with animation */}
          <div className="relative mb-6">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-600/50 flex items-center justify-center group hover:scale-105 transition-transform duration-300">
              <Camera className="w-8 h-8 text-slate-400 group-hover:text-slate-300 transition-colors duration-300" />
              {/* Sparkle effects */}
              <Sparkles className="absolute -top-2 -right-2 w-5 h-5 text-blue-400 opacity-60 animate-pulse" />
              <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-purple-400/60 rounded-full animate-ping" />
            </div>
          </div>
          
          {/* Title */}
          <h3 className="text-xl font-semibold text-slate-200 mb-3">
            No Screenshots Yet
          </h3>
          
          {/* Description */}
          <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto leading-relaxed">
            Capture your first screenshot to begin analyzing your code and generating solutions
          </p>
          
          {/* Call to action */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/60 border border-slate-600/40 text-slate-300 text-sm">
            <span className="text-slate-400">Press</span>
            <kbd className="px-2 py-1 bg-slate-700/80 rounded-md text-xs font-mono border border-slate-600/50">⌘H</kbd>
            <span className="text-slate-400">to get started</span>
          </div>
        </div>
      </div>
    )
  }

  const displayScreenshots = screenshots.slice(0, 5)

  return (
    <div className="relative">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/60 via-slate-800/40 to-slate-900/60 rounded-2xl" />
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/3 via-purple-500/3 to-pink-500/3 rounded-2xl" />
      
      {/* Main container */}
      <div className="relative bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-600/50 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-slate-300" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-200">
                Screenshots
              </h3>
              <p className="text-slate-400 text-sm">
                {displayScreenshots.length} of 5 captured
              </p>
            </div>
          </div>
          
          {/* Progress indicator */}
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(displayScreenshots.length / 5) * 100}%` }}
              />
            </div>
            <span className="text-slate-400 text-xs font-medium">
              {displayScreenshots.length}/5
            </span>
          </div>
        </div>
        
        {/* Screenshots grid */}
        <div className="grid grid-cols-5 gap-4">
          {displayScreenshots.map((screenshot, index) => (
            <ScreenshotItem
              key={screenshot.path}
              isLoading={isLoading}
              screenshot={screenshot}
              index={index}
              onDelete={onDeleteScreenshot}
            />
          ))}
          
          {/* Empty slots */}
          {Array.from({ length: 5 - displayScreenshots.length }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="aspect-video rounded-xl border-2 border-dashed border-slate-600/40 bg-slate-800/20 flex items-center justify-center group hover:border-slate-500/60 hover:bg-slate-700/20 transition-all duration-300"
            >
              <Camera className="w-6 h-6 text-slate-500 group-hover:text-slate-400 transition-colors duration-300" />
            </div>
          ))}
        </div>
        
        {/* Footer info */}
        {displayScreenshots.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-700/40">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span>Ready for analysis</span>
              </div>
              <div className="flex items-center gap-4">
                <span>Press ⌘H to add more</span>
                <span>•</span>
                <span>Press ⌘↵ to debug</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ScreenshotQueue