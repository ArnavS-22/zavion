// src/components/ScreenshotItem.tsx
import React from "react"
import { X, ImageIcon } from "lucide-react"

interface Screenshot {
  path: string
  preview: string
}

interface ScreenshotItemProps {
  screenshot: Screenshot
  onDelete: (index: number) => void
  index: number
  isLoading: boolean
}

const ScreenshotItem: React.FC<ScreenshotItemProps> = ({
  screenshot,
  onDelete,
  index,
  isLoading
}) => {
  const handleDelete = async () => {
    await onDelete(index)
  }

  return (
    <div className="relative group">
      <div
        className={`
          aspect-video rounded-xl overflow-hidden
          bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900
          border-2 border-slate-700/40
          shadow-xl shadow-slate-900/40
          transition-all duration-500 ease-out
          ${isLoading 
            ? "animate-pulse" 
            : "group-hover:shadow-2xl group-hover:shadow-slate-900/60 group-hover:border-slate-600/60 group-hover:scale-[1.02] group-hover:-translate-y-1"
          }
          backdrop-blur-sm
          relative overflow-hidden
        `}
      >
        {/* Ambient glow effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Border glow */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm -z-10" />
        
        <div className="w-full h-full relative z-10">
          {isLoading && (
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md z-20 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="w-8 h-8 border-3 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
                  <div className="absolute inset-0 w-8 h-8 border-3 border-transparent border-r-purple-500 rounded-full animate-spin animate-reverse" style={{ animationDelay: '0.5s' }} />
                </div>
                <div className="text-slate-300 text-xs font-medium">Processing...</div>
              </div>
            </div>
          )}
          
          {/* Image container with subtle animations */}
          <div className="w-full h-full relative overflow-hidden rounded-xl">
            <img
              src={screenshot.preview}
              alt={`Screenshot ${index + 1}`}
              className={`
                w-full h-full object-cover
                transition-all duration-700 ease-out
                ${isLoading
                  ? "opacity-30 scale-105"
                  : "group-hover:brightness-110 group-hover:contrast-110 group-hover:scale-105"
                }
              `}
            />
            
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        </div>

        {/* Enhanced delete button */}
        {!isLoading && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDelete()
            }}
            className="
              absolute top-3 right-3 z-30
              p-2 rounded-full
              bg-slate-900/90 backdrop-blur-md
              text-slate-300 hover:text-white
              border border-slate-600/50 hover:border-red-400/50
              opacity-0 group-hover:opacity-100
              hover:bg-red-500/90 hover:scale-110
              transition-all duration-300 ease-out
              shadow-lg shadow-slate-900/50
              transform translate-y-1 group-hover:translate-y-0
            "
            aria-label={`Delete screenshot ${index + 1}`}
          >
            <X size={16} className="transition-transform duration-200 hover:rotate-90" />
          </button>
        )}

        {/* Screenshot number indicator */}
        <div className="absolute bottom-3 left-3 z-20">
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900/80 backdrop-blur-md border border-slate-600/40">
            <ImageIcon size={12} className="text-slate-400" />
            <span className="text-slate-300 text-xs font-medium">
              {index + 1}
            </span>
          </div>
        </div>

        {/* Subtle shine effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-out" />
        </div>
      </div>
    </div>
  )
}

export default ScreenshotItem