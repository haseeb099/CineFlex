'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { 
  Plus, 
  Trash2, 
  Edit3, 
  GripVertical, 
  Wand2, 
  Loader2, 
  ImageOff, 
  Camera,
  Move,
  Copy,
  ChevronUp,
  ChevronDown,
  Sparkles,
  X,
  Check,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import type { StoryboardFrame } from '@/lib/types'
import { cn } from '@/lib/utils'
import { v4 as uuid } from 'uuid'

interface StoryboardEditorProps {
  frames: StoryboardFrame[]
  isGenerating?: boolean
  onFramesChange: (frames: StoryboardFrame[]) => void
  onGenerateImages: () => void
  onRegenerateFrame: (frameId: string) => void
}

const SHOT_TYPES = [
  { value: 'ECU', label: 'Extreme Close-Up' },
  { value: 'CU', label: 'Close-Up' },
  { value: 'MCU', label: 'Medium Close-Up' },
  { value: 'MS', label: 'Medium Shot' },
  { value: 'MWS', label: 'Medium Wide Shot' },
  { value: 'WS', label: 'Wide Shot' },
  { value: 'EWS', label: 'Extreme Wide Shot' },
  { value: 'POV', label: 'Point of View' },
  { value: 'OTS', label: 'Over the Shoulder' },
  { value: 'INSERT', label: 'Insert Shot' },
]

const CAMERA_MOVES = [
  { value: 'STATIC', label: 'Static' },
  { value: 'PAN', label: 'Pan' },
  { value: 'TILT', label: 'Tilt' },
  { value: 'DOLLY', label: 'Dolly' },
  { value: 'TRACK', label: 'Track' },
  { value: 'CRANE', label: 'Crane' },
  { value: 'HANDHELD', label: 'Handheld' },
  { value: 'STEADICAM', label: 'Steadicam' },
  { value: 'DRONE', label: 'Drone' },
  { value: 'ZOOM', label: 'Zoom' },
]

export function StoryboardEditor({ 
  frames, 
  isGenerating = false, 
  onFramesChange,
  onGenerateImages,
  onRegenerateFrame
}: StoryboardEditorProps) {
  const [editingFrame, setEditingFrame] = useState<StoryboardFrame | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [regeneratingFrameId, setRegeneratingFrameId] = useState<string | null>(null)

  const handleReorder = useCallback((newOrder: StoryboardFrame[]) => {
    const reorderedFrames = newOrder.map((frame, index) => ({
      ...frame,
      frameNumber: index + 1
    }))
    onFramesChange(reorderedFrames)
  }, [onFramesChange])

  const [pendingNewFrame, setPendingNewFrame] = useState<StoryboardFrame | null>(null)

  const handleAddFrame = useCallback(() => {
    const newFrame: StoryboardFrame = {
      id: uuid(),
      frameNumber: frames.length + 1,
      prompt: '',
      description: '',
      shotType: 'MS',
      cameraMove: 'STATIC',
      cameraMovement: 'STATIC',
      status: 'pending',
      duration: 3
    }
    // Don't add to frames yet - store as pending
    setPendingNewFrame(newFrame)
    setEditingFrame(newFrame)
    setIsEditDialogOpen(true)
  }, [frames.length])

  const handleDeleteFrame = useCallback((frameId: string) => {
    const updatedFrames = frames
      .filter(f => f.id !== frameId)
      .map((f, index) => ({ ...f, frameNumber: index + 1 }))
    onFramesChange(updatedFrames)
    toast.success('Frame deleted')
  }, [frames, onFramesChange])

  const handleDuplicateFrame = useCallback((frame: StoryboardFrame) => {
    const frameIndex = frames.findIndex(f => f.id === frame.id)
    const newFrame: StoryboardFrame = {
      ...frame,
      id: uuid(),
      frameNumber: frameIndex + 2,
      status: 'pending',
      imageUrl: undefined
    }
    const updatedFrames = [
      ...frames.slice(0, frameIndex + 1),
      newFrame,
      ...frames.slice(frameIndex + 1).map(f => ({ ...f, frameNumber: f.frameNumber + 1 }))
    ]
    onFramesChange(updatedFrames)
    toast.success('Frame duplicated')
  }, [frames, onFramesChange])

  const handleEditFrame = useCallback((frame: StoryboardFrame) => {
    setEditingFrame({ ...frame })
    setIsEditDialogOpen(true)
  }, [])

  const handleSaveFrame = useCallback(() => {
    if (!editingFrame) return
    
    // Check if this is a new pending frame
    if (pendingNewFrame && pendingNewFrame.id === editingFrame.id) {
      // Add the new frame to the list
      onFramesChange([...frames, { ...editingFrame, updatedAt: Date.now() }])
      setPendingNewFrame(null)
      toast.success('New frame added')
    } else {
      // Update existing frame
      const updatedFrames = frames.map(f => 
        f.id === editingFrame.id ? { ...editingFrame, updatedAt: Date.now() } : f
      )
      onFramesChange(updatedFrames)
      toast.success('Frame updated')
    }
    
    setIsEditDialogOpen(false)
    setEditingFrame(null)
  }, [editingFrame, frames, onFramesChange, pendingNewFrame])
  
  const handleCancelEdit = useCallback(() => {
    // If we were adding a new frame, discard it
    if (pendingNewFrame) {
      setPendingNewFrame(null)
    }
    setIsEditDialogOpen(false)
    setEditingFrame(null)
  }, [pendingNewFrame])

  const handleMoveFrame = useCallback((frameId: string, direction: 'up' | 'down') => {
    const index = frames.findIndex(f => f.id === frameId)
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === frames.length - 1)) {
      return
    }
    
    const newIndex = direction === 'up' ? index - 1 : index + 1
    const newFrames = [...frames]
    const [movedFrame] = newFrames.splice(index, 1)
    newFrames.splice(newIndex, 0, movedFrame)
    
    const reorderedFrames = newFrames.map((f, i) => ({ ...f, frameNumber: i + 1 }))
    onFramesChange(reorderedFrames)
  }, [frames, onFramesChange])

  const handleRegenerateFrame = useCallback(async (frameId: string) => {
    setRegeneratingFrameId(frameId)
    try {
      await onRegenerateFrame(frameId)
    } finally {
      setRegeneratingFrameId(null)
    }
  }, [onRegenerateFrame])

  const handleEnhancePrompt = useCallback(async () => {
    if (!editingFrame?.prompt) return
    
    try {
      const response = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: editingFrame.prompt,
          context: `Storyboard frame for ${editingFrame.shotType} shot with ${editingFrame.cameraMove} camera movement`
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setEditingFrame(prev => prev ? { 
          ...prev, 
          prompt: data.enhancedPrompt || data.prompt || prev.prompt 
        } : null)
        toast.success('Prompt enhanced')
      }
    } catch {
      toast.error('Failed to enhance prompt')
    }
  }, [editingFrame])

  if (frames.length === 0 && !isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border border-dashed border-white/10 rounded-xl bg-[#111118]/50">
        <Camera className="w-12 h-12 text-[#52526b] mb-4" />
        <p className="text-sm text-[#52526b] mb-4">No storyboard frames yet</p>
        <Button
          onClick={handleAddFrame}
          className="gap-2 bg-[#c084fc] hover:bg-[#a855f7] text-black"
        >
          <Plus className="w-4 h-4" />
          Add First Frame
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-[#111118] border border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#a1a1bc]">
            {frames.length} frame{frames.length !== 1 ? 's' : ''}
          </span>
          <span className="text-xs text-[#52526b]">
            Drag to reorder
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleAddFrame}
            size="sm"
            variant="outline"
            className="gap-2 border-white/10 text-[#a1a1bc] hover:text-white hover:bg-white/5"
          >
            <Plus className="w-4 h-4" />
            Add Frame
          </Button>
          <Button
            onClick={onGenerateImages}
            disabled={isGenerating || frames.length === 0}
            size="sm"
            className="gap-2 bg-[#c084fc] hover:bg-[#a855f7] text-black"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Generate All Images
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Reorderable Frames Grid */}
      <Reorder.Group 
        axis="y" 
        values={frames} 
        onReorder={handleReorder}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <AnimatePresence mode="popLayout">
          {frames.map((frame) => (
            <Reorder.Item
              key={frame.id}
              value={frame}
              className="cursor-grab active:cursor-grabbing"
              whileDrag={{ scale: 1.02, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}
            >
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative group rounded-lg overflow-hidden border border-white/10 bg-[#111118] hover:border-[#c084fc]/30 transition-colors"
              >
                {/* Frame Preview */}
                <div className="relative aspect-video bg-[#0a0a0f]">
                  {/* Drag Handle */}
                  <div className="absolute top-2 left-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="p-1.5 rounded bg-black/60 backdrop-blur-sm border border-white/10">
                      <GripVertical className="w-4 h-4 text-white/70" />
                    </div>
                  </div>
                  
                  {/* Frame Number */}
                  <div className="absolute top-2 left-10 z-10 px-2 py-0.5 bg-black/60 rounded text-[10px] font-mono text-white">
                    FRAME {frame.frameNumber}
                  </div>
                  
                  {/* Shot Type Badge */}
                  <div className="absolute top-2 right-2 z-10 px-2 py-0.5 bg-[#c084fc]/20 rounded text-[10px] font-mono text-[#c084fc] border border-[#c084fc]/30">
                    {frame.shotType}
                  </div>

                  {/* Image or Placeholder */}
                  {frame.status === 'generating' || regeneratingFrameId === frame.id ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#111118]">
                      <Loader2 className="w-8 h-8 text-[#c084fc] animate-spin" />
                    </div>
                  ) : frame.imageUrl ? (
                    <img
                      src={frame.imageUrl}
                      alt={`Frame ${frame.frameNumber}`}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                  ) : frame.status === 'error' ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111118]">
                      <ImageOff className="w-8 h-8 text-red-400 mb-2" />
                      <span className="text-xs text-red-400">Failed</span>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#1a1a25] to-[#111118]">
                      <Camera className="w-8 h-8 text-[#52526b] mb-2" />
                      <span className="text-xs text-[#52526b]">Pending</span>
                    </div>
                  )}

                  {/* Hover Actions Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      onClick={(e) => { e.stopPropagation(); handleEditFrame(frame) }}
                      size="sm"
                      variant="ghost"
                      className="h-9 w-9 p-0 bg-white/10 hover:bg-white/20 text-white"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={(e) => { e.stopPropagation(); handleDuplicateFrame(frame) }}
                      size="sm"
                      variant="ghost"
                      className="h-9 w-9 p-0 bg-white/10 hover:bg-white/20 text-white"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    {frame.imageUrl && (
                      <Button
                        onClick={(e) => { e.stopPropagation(); handleRegenerateFrame(frame.id) }}
                        size="sm"
                        variant="ghost"
                        className="h-9 w-9 p-0 bg-white/10 hover:bg-white/20 text-white"
                        disabled={regeneratingFrameId === frame.id}
                      >
                        <RefreshCw className={cn("w-4 h-4", regeneratingFrameId === frame.id && "animate-spin")} />
                      </Button>
                    )}
                    <Button
                      onClick={(e) => { e.stopPropagation(); handleDeleteFrame(frame.id) }}
                      size="sm"
                      variant="ghost"
                      className="h-9 w-9 p-0 bg-red-500/20 hover:bg-red-500/30 text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Aspect Ratio Lines */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[10%] left-0 right-0 h-px bg-white/5" />
                    <div className="absolute bottom-[10%] left-0 right-0 h-px bg-white/5" />
                  </div>
                </div>

                {/* Frame Info */}
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#52526b] font-mono">{frame.cameraMove}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        onClick={() => handleMoveFrame(frame.id, 'up')}
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-[#52526b] hover:text-white"
                        disabled={frame.frameNumber === 1}
                      >
                        <ChevronUp className="w-3 h-3" />
                      </Button>
                      <Button
                        onClick={() => handleMoveFrame(frame.id, 'down')}
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-[#52526b] hover:text-white"
                        disabled={frame.frameNumber === frames.length}
                      >
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-[#a1a1bc] line-clamp-2">
                    {frame.description || frame.prompt || 'No description'}
                  </p>
                  {frame.duration && (
                    <span className="text-[10px] text-[#52526b]">{frame.duration}s</span>
                  )}
                </div>
              </motion.div>
            </Reorder.Item>
          ))}
        </AnimatePresence>
      </Reorder.Group>

      {/* Add Frame Button at bottom */}
      <motion.button
        onClick={handleAddFrame}
        className="w-full h-24 rounded-lg border-2 border-dashed border-white/10 hover:border-[#c084fc]/30 bg-[#111118]/50 hover:bg-[#111118] transition-all flex items-center justify-center gap-2 text-[#52526b] hover:text-[#c084fc]"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <Plus className="w-5 h-5" />
        <span className="text-sm">Add New Frame</span>
      </motion.button>

      {/* Edit Frame Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-[#111118] border-white/10 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-[#c084fc]" />
              Edit Frame {editingFrame?.frameNumber}
            </DialogTitle>
          </DialogHeader>
          
          {editingFrame && (
            <div className="space-y-4 py-4">
              {/* Preview */}
              {editingFrame.imageUrl && (
                <div className="aspect-video rounded-lg overflow-hidden border border-white/10 bg-[#0a0a0f]">
                  <img
                    src={editingFrame.imageUrl}
                    alt={`Frame ${editingFrame.frameNumber}`}
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                </div>
              )}

              {/* Prompt */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-[#a1a1bc]">Visual Prompt</label>
                  <Button
                    onClick={handleEnhancePrompt}
                    size="sm"
                    variant="ghost"
                    className="h-7 gap-1 text-[#c084fc] hover:text-[#a855f7] hover:bg-[#c084fc]/10"
                  >
                    <Sparkles className="w-3 h-3" />
                    Enhance
                  </Button>
                </div>
                <Textarea
                  value={editingFrame.prompt}
                  onChange={(e) => setEditingFrame({ ...editingFrame, prompt: e.target.value })}
                  placeholder="Describe what should appear in this frame..."
                  className="min-h-[80px] bg-[#0a0a0f] border-white/10 text-white placeholder:text-[#52526b]"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm text-[#a1a1bc]">Description / Notes</label>
                <Textarea
                  value={editingFrame.description}
                  onChange={(e) => setEditingFrame({ ...editingFrame, description: e.target.value })}
                  placeholder="Additional notes about this frame..."
                  className="min-h-[60px] bg-[#0a0a0f] border-white/10 text-white placeholder:text-[#52526b]"
                />
              </div>

              {/* Shot Type & Camera Move */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-[#a1a1bc]">Shot Type</label>
                  <Select
                    value={editingFrame.shotType}
                    onValueChange={(value) => setEditingFrame({ ...editingFrame, shotType: value })}
                  >
                    <SelectTrigger className="bg-[#0a0a0f] border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111118] border-white/10">
                      {SHOT_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value} className="text-white">
                          {type.value} - {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-[#a1a1bc]">Camera Movement</label>
                  <Select
                    value={editingFrame.cameraMove}
                    onValueChange={(value) => setEditingFrame({ 
                      ...editingFrame, 
                      cameraMove: value,
                      cameraMovement: value 
                    })}
                  >
                    <SelectTrigger className="bg-[#0a0a0f] border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111118] border-white/10">
                      {CAMERA_MOVES.map(move => (
                        <SelectItem key={move.value} value={move.value} className="text-white">
                          {move.value} - {move.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <label className="text-sm text-[#a1a1bc]">Duration (seconds)</label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={editingFrame.duration || 3}
                  onChange={(e) => setEditingFrame({ ...editingFrame, duration: parseInt(e.target.value) || 3 })}
                  className="w-24 bg-[#0a0a0f] border-white/10 text-white"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={handleCancelEdit}
              variant="outline"
              className="border-white/10 text-[#a1a1bc]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveFrame}
              className="bg-[#c084fc] hover:bg-[#a855f7] text-black"
            >
              <Check className="w-4 h-4 mr-2" />
              {pendingNewFrame ? 'Add Frame' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
