'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, MapPin, Car, Package, Palette, Film, Sparkles, 
  ChevronDown, ChevronUp, Edit3, RefreshCw, Check, X,
  Plus, Trash2, Wand2, Eye, Save, Loader2, ImageIcon,
  Zap, Camera
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Character {
  id: string
  name: string
  description: string
  age?: string
  gender?: string
  ethnicity?: string
  hairStyle?: string
  hairColor?: string
  eyeColor?: string
  build?: string
  clothing?: string
  accessories?: string
  personality?: string
  role: 'protagonist' | 'antagonist' | 'supporting' | 'background'
  previewImage?: string
}

interface Vehicle {
  id: string
  type: string
  make?: string
  model?: string
  color?: string
  era?: string
  condition?: string
  description: string
  previewImage?: string
}

interface Location {
  id: string
  name: string
  type: string
  timeOfDay?: string
  weather?: string
  era?: string
  mood?: string
  description: string
  details?: string[]
  previewImage?: string
}

interface Prop {
  id: string
  name: string
  description: string
  significance?: string
  previewImage?: string
}

interface SceneElements {
  characters: Character[]
  vehicles: Vehicle[]
  locations: Location[]
  props: Prop[]
  timeframe: string
  genre: string
  mood: string
  visualStyle: string
  colorPalette: string[]
  cinematicReferences: string[]
}

interface ConceptEditorProps {
  elements: SceneElements | null
  onElementsChange: (elements: SceneElements) => void
  onGeneratePreview: (type: string, item: Character | Vehicle | Location | Prop) => Promise<string | null>
  isLoading?: boolean
  enhancedPrompt?: string
  onAutoExtract?: () => void
}

// Default color palette when none provided
const DEFAULT_PALETTE = ['#1a1a2e', '#16213e', '#0f3460', '#e94560', '#533483']

// Color name to hex mapping for common color names
const COLOR_NAME_TO_HEX: Record<string, string> = {
  // Neutrals
  'black': '#000000', 'white': '#ffffff', 'gray': '#808080', 'grey': '#808080',
  'silver': '#c0c0c0', 'charcoal': '#36454f', 'slate': '#708090',
  // Reds
  'red': '#ff0000', 'crimson': '#dc143c', 'maroon': '#800000', 'burgundy': '#800020',
  'scarlet': '#ff2400', 'ruby': '#e0115f', 'cherry': '#de3163',
  // Blues
  'blue': '#0000ff', 'navy': '#000080', 'azure': '#007fff', 'cyan': '#00ffff',
  'teal': '#008080', 'turquoise': '#40e0d0', 'cobalt': '#0047ab', 'sapphire': '#0f52ba',
  'midnight': '#191970', 'steel': '#4682b4', 'sky': '#87ceeb', 'indigo': '#4b0082',
  // Greens
  'green': '#00ff00', 'emerald': '#50c878', 'olive': '#808000', 'forest': '#228b22',
  'lime': '#32cd32', 'mint': '#98fb98', 'sage': '#9dc183', 'jade': '#00a86b',
  // Yellows/Golds
  'yellow': '#ffff00', 'gold': '#ffd700', 'amber': '#ffbf00', 'mustard': '#ffdb58',
  'honey': '#eb9605', 'lemon': '#fff44f', 'cream': '#fffdd0', 'beige': '#f5f5dc',
  // Oranges
  'orange': '#ffa500', 'coral': '#ff7f50', 'peach': '#ffcba4', 'tangerine': '#ff9966',
  'rust': '#b7410e', 'copper': '#b87333', 'bronze': '#cd7f32',
  // Purples
  'purple': '#800080', 'violet': '#ee82ee', 'lavender': '#e6e6fa', 'plum': '#dda0dd',
  'magenta': '#ff00ff', 'mauve': '#e0b0ff', 'orchid': '#da70d6', 'amethyst': '#9966cc',
  // Pinks
  'pink': '#ffc0cb', 'rose': '#ff007f', 'blush': '#de5d83', 'salmon': '#fa8072',
  'fuchsia': '#ff00ff', 'hot pink': '#ff69b4',
  // Browns
  'brown': '#8b4513', 'chocolate': '#7b3f00', 'coffee': '#6f4e37', 'tan': '#d2b48c',
  'sienna': '#a0522d', 'sepia': '#704214', 'mahogany': '#c04000', 'chestnut': '#954535',
  // Cinematic
  'neon': '#39ff14', 'electric': '#7df9ff', 'warm': '#fd7e14', 'cool': '#17a2b8',
  'muted': '#6c757d', 'rich': '#722f37', 'deep': '#003366', 'bright': '#ffff00',
  'dark': '#1a1a1a', 'light': '#f8f9fa', 'vibrant': '#ff4500', 'soft': '#b0c4de',
  'earthy': '#8b7355', 'moody': '#3d3d3d', 'desaturated': '#696969', 'saturated': '#ff0080',
}

function parseColorToHex(color: string): string {
  if (!color) return '#808080'
  
  // If already a hex color
  if (color.startsWith('#')) {
    return color.length === 4 
      ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
      : color
  }
  
  // If rgb/rgba format
  if (color.startsWith('rgb')) {
    const matches = color.match(/\d+/g)
    if (matches && matches.length >= 3) {
      const [r, g, b] = matches.map(Number)
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
    }
  }
  
  // Try to find in color name mapping
  const normalizedColor = color.toLowerCase().trim()
  
  // Direct match
  if (COLOR_NAME_TO_HEX[normalizedColor]) {
    return COLOR_NAME_TO_HEX[normalizedColor]
  }
  
  // Check for partial matches (e.g., "deep blue" -> "blue")
  for (const [name, hex] of Object.entries(COLOR_NAME_TO_HEX)) {
    if (normalizedColor.includes(name) || name.includes(normalizedColor)) {
      return hex
    }
  }
  
  // Generate a hash-based color for unknown names
  let hash = 0
  for (let i = 0; i < color.length; i++) {
    hash = color.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 60%, 50%)`
}

export function ConceptEditor({ 
  elements, 
  onElementsChange, 
  onGeneratePreview,
  isLoading,
  enhancedPrompt,
  onAutoExtract
}: ConceptEditorProps) {
  const [activeTab, setActiveTab] = useState('characters')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [generatingPreview, setGeneratingPreview] = useState<string | null>(null)
  const [isGeneratingAll, setIsGeneratingAll] = useState(false)

  // Auto-extract elements on mount if not already loaded
  useEffect(() => {
    if (!elements && !isLoading && enhancedPrompt && onAutoExtract) {
      onAutoExtract()
    }
  }, [elements, isLoading, enhancedPrompt, onAutoExtract])

  // Loading state
  if (isLoading) {
    return (
      <Card className="bg-[#111118] border-white/10">
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <Loader2 className="w-12 h-12 text-[#a855f7] animate-spin" />
              <Sparkles className="w-6 h-6 text-[#f59e0b] absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div className="text-center">
              <p className="text-white font-medium">Extracting Scene Elements...</p>
              <p className="text-sm text-[#52526b] mt-1">AI is analyzing characters, locations, and props</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Empty state with auto-extract button
  if (!elements) {
    return (
      <Card className="bg-[#111118] border-white/10">
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#a855f7]/20 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-[#a855f7]" />
            </div>
            <div>
              <p className="text-white font-medium">Ready to Extract Scene Elements</p>
              <p className="text-sm text-[#52526b] mt-1">
                AI will analyze your prompt to identify characters, locations, vehicles, and props
              </p>
            </div>
            <Button
              onClick={onAutoExtract}
              className="gap-2 bg-[#a855f7] hover:bg-[#9333ea] text-white"
            >
              <Wand2 className="w-4 h-4" />
              Extract Elements with AI
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  const handleGeneratePreview = async (type: string, item: Character | Vehicle | Location | Prop) => {
    setGeneratingPreview(item.id)
    try {
      const imageUrl = await onGeneratePreview(type, item)
      if (imageUrl) {
        const updatedElements = { ...elements }
        if (type === 'character') {
          const idx = updatedElements.characters.findIndex(c => c.id === item.id)
          if (idx >= 0) updatedElements.characters[idx].previewImage = imageUrl
        } else if (type === 'vehicle') {
          const idx = updatedElements.vehicles.findIndex(v => v.id === item.id)
          if (idx >= 0) updatedElements.vehicles[idx].previewImage = imageUrl
        } else if (type === 'location') {
          const idx = updatedElements.locations.findIndex(l => l.id === item.id)
          if (idx >= 0) updatedElements.locations[idx].previewImage = imageUrl
        } else if (type === 'prop') {
          const idx = updatedElements.props.findIndex(p => p.id === item.id)
          if (idx >= 0) updatedElements.props[idx].previewImage = imageUrl
        }
        onElementsChange(updatedElements)
        toast.success('Preview generated!')
      } else {
        toast.error('Failed to generate preview')
      }
    } catch {
      toast.error('Failed to generate preview')
    } finally {
      setGeneratingPreview(null)
    }
  }

  // Generate all previews for current tab
  const handleGenerateAllPreviews = async () => {
    setIsGeneratingAll(true)
    let items: Array<{ type: string; item: Character | Vehicle | Location | Prop }> = []
    
    if (activeTab === 'characters') {
      items = elements.characters.filter(c => !c.previewImage).map(c => ({ type: 'character', item: c }))
    } else if (activeTab === 'locations') {
      items = elements.locations.filter(l => !l.previewImage).map(l => ({ type: 'location', item: l }))
    } else if (activeTab === 'vehicles') {
      items = elements.vehicles.filter(v => !v.previewImage).map(v => ({ type: 'vehicle', item: v }))
    } else if (activeTab === 'props') {
      items = elements.props.filter(p => !p.previewImage).map(p => ({ type: 'prop', item: p }))
    }

    if (items.length === 0) {
      toast.info('All items already have previews')
      setIsGeneratingAll(false)
      return
    }

    toast.info(`Generating ${items.length} previews...`)

    for (const { type, item } of items) {
      await handleGeneratePreview(type, item)
    }

    setIsGeneratingAll(false)
    toast.success('All previews generated!')
  }

  const updateCharacter = (id: string, updates: Partial<Character>) => {
    const updatedElements = { ...elements }
    const idx = updatedElements.characters.findIndex(c => c.id === id)
    if (idx >= 0) {
      updatedElements.characters[idx] = { ...updatedElements.characters[idx], ...updates }
      onElementsChange(updatedElements)
    }
  }

  const updateVehicle = (id: string, updates: Partial<Vehicle>) => {
    const updatedElements = { ...elements }
    const idx = updatedElements.vehicles.findIndex(v => v.id === id)
    if (idx >= 0) {
      updatedElements.vehicles[idx] = { ...updatedElements.vehicles[idx], ...updates }
      onElementsChange(updatedElements)
    }
  }

  const updateLocation = (id: string, updates: Partial<Location>) => {
    const updatedElements = { ...elements }
    const idx = updatedElements.locations.findIndex(l => l.id === id)
    if (idx >= 0) {
      updatedElements.locations[idx] = { ...updatedElements.locations[idx], ...updates }
      onElementsChange(updatedElements)
    }
  }

  const updateProp = (id: string, updates: Partial<Prop>) => {
    const updatedElements = { ...elements }
    const idx = updatedElements.props.findIndex(p => p.id === id)
    if (idx >= 0) {
      updatedElements.props[idx] = { ...updatedElements.props[idx], ...updates }
      onElementsChange(updatedElements)
    }
  }

  const addCharacter = () => {
    const newChar: Character = {
      id: `char_${Date.now()}`,
      name: 'New Character',
      description: '',
      role: 'supporting'
    }
    onElementsChange({
      ...elements,
      characters: [...elements.characters, newChar]
    })
    setExpandedItems(new Set([...expandedItems, newChar.id]))
    setEditingItem(newChar.id)
  }

  const addLocation = () => {
    const newLoc: Location = {
      id: `loc_${Date.now()}`,
      name: 'New Location',
      type: 'exterior',
      description: ''
    }
    onElementsChange({
      ...elements,
      locations: [...elements.locations, newLoc]
    })
    setExpandedItems(new Set([...expandedItems, newLoc.id]))
    setEditingItem(newLoc.id)
  }

  const addVehicle = () => {
    const newVeh: Vehicle = {
      id: `veh_${Date.now()}`,
      type: 'car',
      description: ''
    }
    onElementsChange({
      ...elements,
      vehicles: [...elements.vehicles, newVeh]
    })
    setExpandedItems(new Set([...expandedItems, newVeh.id]))
    setEditingItem(newVeh.id)
  }

  const addProp = () => {
    const newProp: Prop = {
      id: `prop_${Date.now()}`,
      name: 'New Prop',
      description: ''
    }
    onElementsChange({
      ...elements,
      props: [...elements.props, newProp]
    })
    setExpandedItems(new Set([...expandedItems, newProp.id]))
    setEditingItem(newProp.id)
  }

  const deleteItem = (type: string, id: string) => {
    const updatedElements = { ...elements }
    if (type === 'character') {
      updatedElements.characters = updatedElements.characters.filter(c => c.id !== id)
    } else if (type === 'vehicle') {
      updatedElements.vehicles = updatedElements.vehicles.filter(v => v.id !== id)
    } else if (type === 'location') {
      updatedElements.locations = updatedElements.locations.filter(l => l.id !== id)
    } else if (type === 'prop') {
      updatedElements.props = updatedElements.props.filter(p => p.id !== id)
    }
    onElementsChange(updatedElements)
    toast.success('Item removed')
  }

  const roleColors = {
    protagonist: 'bg-[#4ade80]/20 text-[#4ade80] border-[#4ade80]/30',
    antagonist: 'bg-red-500/20 text-red-400 border-red-500/30',
    supporting: 'bg-[#38bdf8]/20 text-[#38bdf8] border-[#38bdf8]/30',
    background: 'bg-[#52526b]/20 text-[#a1a1bc] border-[#52526b]/30'
  }

  // Get display colors from palette
  const displayColors = (elements.colorPalette && elements.colorPalette.length > 0)
    ? elements.colorPalette.map(c => parseColorToHex(c))
    : DEFAULT_PALETTE

  return (
    <Card className="bg-[#111118] border-white/10">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Film className="w-5 h-5 text-[#c084fc]" />
            Visual Concept Editor
          </CardTitle>
          <div className="flex items-center gap-2">
            {elements.genre && (
              <Badge variant="outline" className="border-[#c084fc]/30 text-[#c084fc]">
                {elements.genre}
              </Badge>
            )}
            {elements.mood && (
              <Badge variant="outline" className="border-[#f59e0b]/30 text-[#f59e0b]">
                {elements.mood}
              </Badge>
            )}
          </div>
        </div>
        <p className="text-sm text-[#52526b] mt-1">
          Customize characters, locations, vehicles, and props. Generate AI previews to visualize your concepts.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Color Palette Editor - Interactive color swatches */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-black/30 border border-white/5">
          <Palette className="w-4 h-4 text-[#a1a1bc]" />
          <span className="text-sm text-[#a1a1bc]">Color Palette:</span>
          <div className="flex gap-2">
            {displayColors.slice(0, 6).map((color, idx) => (
              <div key={idx} className="relative group">
                <input
                  type="color"
                  value={color.startsWith('#') ? color : '#808080'}
                  onChange={(e) => {
                    const newPalette = [...(elements.colorPalette || [])]
                    newPalette[idx] = e.target.value
                    onElementsChange({ ...elements, colorPalette: newPalette })
                  }}
                  className="w-8 h-8 rounded-lg border-2 border-white/20 shadow-lg cursor-pointer hover:scale-110 transition-transform appearance-none bg-transparent [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch-wrapper]:p-0 [&::-moz-color-swatch]:rounded-md [&::-moz-color-swatch]:border-none"
                  style={{ backgroundColor: color }}
                  title={`Click to change: ${elements.colorPalette?.[idx] || color}`}
                />
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-1.5 py-0.5 rounded text-[9px] text-white whitespace-nowrap z-10">
                  {elements.colorPalette?.[idx] || color}
                </div>
              </div>
            ))}
            {/* Add color button */}
            {displayColors.length < 6 && (
              <button
                onClick={() => {
                  const newPalette = [...(elements.colorPalette || []), '#6b21a8']
                  onElementsChange({ ...elements, colorPalette: newPalette })
                }}
                className="w-8 h-8 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center text-white/40 hover:border-white/40 hover:text-white/60 transition-all"
                title="Add color"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
          <span className="text-xs text-[#52526b] ml-auto">
            {elements.visualStyle}
          </span>
        </div>

        {/* Cinematic References */}
        {elements.cinematicReferences && elements.cinematicReferences.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-[#52526b]">Style References:</span>
            {elements.cinematicReferences.map((ref, idx) => (
              <Badge key={idx} variant="outline" className="border-white/10 text-[#a1a1bc] text-xs">
                {ref}
              </Badge>
            ))}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-black/30 border border-white/10 p-1">
            <TabsTrigger value="characters" className="gap-2 data-[state=active]:bg-[#c084fc]/20">
              <User className="w-4 h-4" />
              Characters ({elements.characters?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="locations" className="gap-2 data-[state=active]:bg-[#38bdf8]/20">
              <MapPin className="w-4 h-4" />
              Locations ({elements.locations?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="vehicles" className="gap-2 data-[state=active]:bg-[#f59e0b]/20">
              <Car className="w-4 h-4" />
              Vehicles ({elements.vehicles?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="props" className="gap-2 data-[state=active]:bg-[#4ade80]/20">
              <Package className="w-4 h-4" />
              Props ({elements.props?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* CHARACTERS TAB */}
          <TabsContent value="characters" className="mt-4 space-y-3">
            <div className="flex justify-between items-center">
              <Button 
                size="sm" 
                onClick={handleGenerateAllPreviews}
                disabled={isGeneratingAll}
                className="gap-2 bg-[#c084fc] hover:bg-[#a855f7] text-black font-medium"
              >
                {isGeneratingAll ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                Generate All Previews
              </Button>
              <Button size="sm" onClick={addCharacter} className="gap-2 bg-[#c084fc] hover:bg-[#a855f7] text-black">
                <Plus className="w-4 h-4" />
                Add Character
              </Button>
            </div>

            <AnimatePresence>
              {elements.characters?.map((char) => (
                <motion.div
                  key={char.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border border-white/10 rounded-lg overflow-hidden bg-black/20"
                >
                  {/* Header */}
                  <div 
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5"
                    onClick={() => toggleExpand(char.id)}
                  >
                    <div className="flex items-center gap-3">
                      {char.previewImage ? (
                        <img 
                          src={char.previewImage} 
                          alt={char.name}
                          className="w-12 h-12 rounded-lg object-cover border border-white/20"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-[#c084fc]/20 flex items-center justify-center">
                          <User className="w-6 h-6 text-[#c084fc]" />
                        </div>
                      )}
                      <div>
                        <h4 className="text-white font-medium">{char.name}</h4>
                        <p className="text-xs text-[#52526b] line-clamp-1">
                          {char.age && `${char.age}, `}{char.gender} - {char.clothing?.slice(0, 40) || char.description?.slice(0, 40)}...
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={roleColors[char.role]}>
                        {char.role}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); handleGeneratePreview('character', char) }}
                        disabled={generatingPreview === char.id}
                        className="h-8 w-8 p-0 text-[#c084fc] hover:bg-[#c084fc]/10"
                      >
                        {generatingPreview === char.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Camera className="w-4 h-4" />
                        )}
                      </Button>
                      {expandedItems.has(char.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {expandedItems.has(char.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/10"
                      >
                        <div className="p-4 space-y-4">
                          {/* Preview Image */}
                          {char.previewImage && (
                            <div className="aspect-video rounded-lg overflow-hidden border border-white/10 bg-[#0a0a0f]">
                              <img
                                src={char.previewImage}
                                alt={char.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                              <Label className="text-xs text-[#52526b]">Name</Label>
                              <Input
                                value={char.name}
                                onChange={(e) => updateCharacter(char.id, { name: e.target.value })}
                                className="bg-black/30 border-white/10 text-white mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-[#52526b]">Age</Label>
                              <Input
                                value={char.age || ''}
                                onChange={(e) => updateCharacter(char.id, { age: e.target.value })}
                                className="bg-black/30 border-white/10 text-white mt-1"
                                placeholder="e.g., 30s"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-[#52526b]">Gender</Label>
                              <Input
                                value={char.gender || ''}
                                onChange={(e) => updateCharacter(char.id, { gender: e.target.value })}
                                className="bg-black/30 border-white/10 text-white mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-[#52526b]">Role</Label>
                              <Select 
                                value={char.role} 
                                onValueChange={(v) => updateCharacter(char.id, { role: v as Character['role'] })}
                              >
                                <SelectTrigger className="bg-black/30 border-white/10 text-white mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="protagonist">Protagonist</SelectItem>
                                  <SelectItem value="antagonist">Antagonist</SelectItem>
                                  <SelectItem value="supporting">Supporting</SelectItem>
                                  <SelectItem value="background">Background</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                              <Label className="text-xs text-[#52526b]">Hair Style</Label>
                              <Input
                                value={char.hairStyle || ''}
                                onChange={(e) => updateCharacter(char.id, { hairStyle: e.target.value })}
                                className="bg-black/30 border-white/10 text-white mt-1"
                                placeholder="e.g., Long, wavy"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-[#52526b]">Hair Color</Label>
                              <Input
                                value={char.hairColor || ''}
                                onChange={(e) => updateCharacter(char.id, { hairColor: e.target.value })}
                                className="bg-black/30 border-white/10 text-white mt-1"
                                placeholder="e.g., Dark brown"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-[#52526b]">Eye Color</Label>
                              <Input
                                value={char.eyeColor || ''}
                                onChange={(e) => updateCharacter(char.id, { eyeColor: e.target.value })}
                                className="bg-black/30 border-white/10 text-white mt-1"
                                placeholder="e.g., Blue"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-[#52526b]">Build</Label>
                              <Input
                                value={char.build || ''}
                                onChange={(e) => updateCharacter(char.id, { build: e.target.value })}
                                className="bg-black/30 border-white/10 text-white mt-1"
                                placeholder="e.g., Athletic"
                              />
                            </div>
                          </div>

                          <div>
                            <Label className="text-xs text-[#52526b]">Clothing</Label>
                            <Textarea
                              value={char.clothing || ''}
                              onChange={(e) => updateCharacter(char.id, { clothing: e.target.value })}
                              className="bg-black/30 border-white/10 text-white mt-1 h-20"
                              placeholder="Describe clothing in detail..."
                            />
                          </div>

                          <div>
                            <Label className="text-xs text-[#52526b]">Full Visual Description</Label>
                            <Textarea
                              value={char.description}
                              onChange={(e) => updateCharacter(char.id, { description: e.target.value })}
                              className="bg-black/30 border-white/10 text-white mt-1 h-24"
                              placeholder="Complete description for AI generation..."
                            />
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              onClick={() => handleGeneratePreview('character', char)}
                              disabled={generatingPreview === char.id || isGeneratingAll}
                              className="gap-2 bg-[#c084fc] hover:bg-[#a855f7] text-black"
                            >
                              {generatingPreview === char.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                              Generate Preview
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteItem('character', char.id)}
                              className="text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>

            {(!elements.characters || elements.characters.length === 0) && (
              <div className="text-center py-8 text-[#52526b]">
                <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No characters extracted</p>
                <Button size="sm" onClick={addCharacter} variant="ghost" className="mt-2">
                  <Plus className="w-4 h-4 mr-1" /> Add Character
                </Button>
              </div>
            )}
          </TabsContent>

          {/* LOCATIONS TAB */}
          <TabsContent value="locations" className="mt-4 space-y-3">
            <div className="flex justify-between items-center">
              <Button 
                size="sm" 
                onClick={handleGenerateAllPreviews}
                disabled={isGeneratingAll}
                variant="outline"
                className="gap-2 border-[#38bdf8]/30 text-[#38bdf8] hover:bg-[#38bdf8]/10"
              >
                {isGeneratingAll ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                Generate All Previews
              </Button>
              <Button size="sm" onClick={addLocation} className="gap-2 bg-[#38bdf8] hover:bg-[#0ea5e9] text-black">
                <Plus className="w-4 h-4" />
                Add Location
              </Button>
            </div>

            <AnimatePresence>
              {elements.locations?.map((loc) => (
                <motion.div
                  key={loc.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border border-white/10 rounded-lg overflow-hidden bg-black/20"
                >
                  <div 
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5"
                    onClick={() => toggleExpand(loc.id)}
                  >
                    <div className="flex items-center gap-3">
                      {loc.previewImage ? (
                        <img 
                          src={loc.previewImage} 
                          alt={loc.name}
                          className="w-12 h-12 rounded-lg object-cover border border-white/20"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-[#38bdf8]/20 flex items-center justify-center">
                          <MapPin className="w-6 h-6 text-[#38bdf8]" />
                        </div>
                      )}
                      <div>
                        <h4 className="text-white font-medium">{loc.name}</h4>
                        <p className="text-xs text-[#52526b]">
                          {loc.type} - {loc.timeOfDay || 'Day'} - {loc.weather || 'Clear'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); handleGeneratePreview('location', loc) }}
                        disabled={generatingPreview === loc.id}
                        className="h-8 w-8 p-0 text-[#38bdf8] hover:bg-[#38bdf8]/10"
                      >
                        {generatingPreview === loc.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Camera className="w-4 h-4" />
                        )}
                      </Button>
                      {expandedItems.has(loc.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedItems.has(loc.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/10"
                      >
                        <div className="p-4 space-y-4">
                          {loc.previewImage && (
                            <div className="aspect-video rounded-lg overflow-hidden border border-white/10 bg-[#0a0a0f]">
                              <img src={loc.previewImage} alt={loc.name} className="w-full h-full object-cover" />
                            </div>
                          )}

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                              <Label className="text-xs text-[#52526b]">Name</Label>
                              <Input
                                value={loc.name}
                                onChange={(e) => updateLocation(loc.id, { name: e.target.value })}
                                className="bg-black/30 border-white/10 text-white mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-[#52526b]">Type</Label>
                              <Select 
                                value={loc.type} 
                                onValueChange={(v) => updateLocation(loc.id, { type: v })}
                              >
                                <SelectTrigger className="bg-black/30 border-white/10 text-white mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="interior">Interior</SelectItem>
                                  <SelectItem value="exterior">Exterior</SelectItem>
                                  <SelectItem value="mixed">Mixed</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs text-[#52526b]">Time of Day</Label>
                              <Select 
                                value={loc.timeOfDay || 'day'} 
                                onValueChange={(v) => updateLocation(loc.id, { timeOfDay: v })}
                              >
                                <SelectTrigger className="bg-black/30 border-white/10 text-white mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="dawn">Dawn</SelectItem>
                                  <SelectItem value="morning">Morning</SelectItem>
                                  <SelectItem value="day">Day</SelectItem>
                                  <SelectItem value="afternoon">Afternoon</SelectItem>
                                  <SelectItem value="evening">Evening</SelectItem>
                                  <SelectItem value="night">Night</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs text-[#52526b]">Weather</Label>
                              <Select 
                                value={loc.weather || 'clear'} 
                                onValueChange={(v) => updateLocation(loc.id, { weather: v })}
                              >
                                <SelectTrigger className="bg-black/30 border-white/10 text-white mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="clear">Clear</SelectItem>
                                  <SelectItem value="cloudy">Cloudy</SelectItem>
                                  <SelectItem value="rainy">Rainy</SelectItem>
                                  <SelectItem value="stormy">Stormy</SelectItem>
                                  <SelectItem value="foggy">Foggy</SelectItem>
                                  <SelectItem value="snowy">Snowy</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div>
                            <Label className="text-xs text-[#52526b]">Description</Label>
                            <Textarea
                              value={loc.description}
                              onChange={(e) => updateLocation(loc.id, { description: e.target.value })}
                              className="bg-black/30 border-white/10 text-white mt-1 h-24"
                              placeholder="Detailed location description..."
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleGeneratePreview('location', loc)}
                              disabled={generatingPreview === loc.id}
                              className="gap-2 bg-[#38bdf8] hover:bg-[#0ea5e9] text-black"
                            >
                              {generatingPreview === loc.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                              Generate Preview
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteItem('location', loc.id)}
                              className="text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>

            {(!elements.locations || elements.locations.length === 0) && (
              <div className="text-center py-8 text-[#52526b]">
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No locations extracted</p>
                <Button size="sm" onClick={addLocation} variant="ghost" className="mt-2">
                  <Plus className="w-4 h-4 mr-1" /> Add Location
                </Button>
              </div>
            )}
          </TabsContent>

          {/* VEHICLES TAB */}
          <TabsContent value="vehicles" className="mt-4 space-y-3">
            <div className="flex justify-between items-center">
              <Button 
                size="sm" 
                onClick={handleGenerateAllPreviews}
                disabled={isGeneratingAll}
                variant="outline"
                className="gap-2 border-[#f59e0b]/30 text-[#f59e0b] hover:bg-[#f59e0b]/10"
              >
                {isGeneratingAll ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                Generate All Previews
              </Button>
              <Button size="sm" onClick={addVehicle} className="gap-2 bg-[#f59e0b] hover:bg-[#d97706] text-black">
                <Plus className="w-4 h-4" />
                Add Vehicle
              </Button>
            </div>

            <AnimatePresence>
              {elements.vehicles?.map((veh) => (
                <motion.div
                  key={veh.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border border-white/10 rounded-lg overflow-hidden bg-black/20"
                >
                  <div 
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5"
                    onClick={() => toggleExpand(veh.id)}
                  >
                    <div className="flex items-center gap-3">
                      {veh.previewImage ? (
                        <img 
                          src={veh.previewImage} 
                          alt={veh.type}
                          className="w-12 h-12 rounded-lg object-cover border border-white/20"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-[#f59e0b]/20 flex items-center justify-center">
                          <Car className="w-6 h-6 text-[#f59e0b]" />
                        </div>
                      )}
                      <div>
                        <h4 className="text-white font-medium">{veh.make} {veh.model || veh.type}</h4>
                        <p className="text-xs text-[#52526b]">
                          {veh.color} {veh.type} - {veh.era || 'Modern'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); handleGeneratePreview('vehicle', veh) }}
                        disabled={generatingPreview === veh.id}
                        className="h-8 w-8 p-0 text-[#f59e0b] hover:bg-[#f59e0b]/10"
                      >
                        {generatingPreview === veh.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Camera className="w-4 h-4" />
                        )}
                      </Button>
                      {expandedItems.has(veh.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedItems.has(veh.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/10"
                      >
                        <div className="p-4 space-y-4">
                          {veh.previewImage && (
                            <div className="aspect-video rounded-lg overflow-hidden border border-white/10 bg-[#0a0a0f]">
                              <img src={veh.previewImage} alt={veh.type} className="w-full h-full object-cover" />
                            </div>
                          )}

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <div>
                              <Label className="text-xs text-[#52526b]">Type</Label>
                              <Input
                                value={veh.type}
                                onChange={(e) => updateVehicle(veh.id, { type: e.target.value })}
                                className="bg-black/30 border-white/10 text-white mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-[#52526b]">Make</Label>
                              <Input
                                value={veh.make || ''}
                                onChange={(e) => updateVehicle(veh.id, { make: e.target.value })}
                                className="bg-black/30 border-white/10 text-white mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-[#52526b]">Model</Label>
                              <Input
                                value={veh.model || ''}
                                onChange={(e) => updateVehicle(veh.id, { model: e.target.value })}
                                className="bg-black/30 border-white/10 text-white mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-[#52526b]">Color</Label>
                              <Input
                                value={veh.color || ''}
                                onChange={(e) => updateVehicle(veh.id, { color: e.target.value })}
                                className="bg-black/30 border-white/10 text-white mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-[#52526b]">Era</Label>
                              <Input
                                value={veh.era || ''}
                                onChange={(e) => updateVehicle(veh.id, { era: e.target.value })}
                                className="bg-black/30 border-white/10 text-white mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-[#52526b]">Condition</Label>
                              <Input
                                value={veh.condition || ''}
                                onChange={(e) => updateVehicle(veh.id, { condition: e.target.value })}
                                className="bg-black/30 border-white/10 text-white mt-1"
                              />
                            </div>
                          </div>

                          <div>
                            <Label className="text-xs text-[#52526b]">Description</Label>
                            <Textarea
                              value={veh.description}
                              onChange={(e) => updateVehicle(veh.id, { description: e.target.value })}
                              className="bg-black/30 border-white/10 text-white mt-1 h-20"
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleGeneratePreview('vehicle', veh)}
                              disabled={generatingPreview === veh.id}
                              className="gap-2 bg-[#f59e0b] hover:bg-[#d97706] text-black"
                            >
                              {generatingPreview === veh.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                              Generate Preview
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteItem('vehicle', veh.id)}
                              className="text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>

            {(!elements.vehicles || elements.vehicles.length === 0) && (
              <div className="text-center py-8 text-[#52526b]">
                <Car className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No vehicles extracted</p>
                <Button size="sm" onClick={addVehicle} variant="ghost" className="mt-2">
                  <Plus className="w-4 h-4 mr-1" /> Add Vehicle
                </Button>
              </div>
            )}
          </TabsContent>

          {/* PROPS TAB */}
          <TabsContent value="props" className="mt-4 space-y-3">
            <div className="flex justify-between items-center">
              <Button 
                size="sm" 
                onClick={handleGenerateAllPreviews}
                disabled={isGeneratingAll}
                variant="outline"
                className="gap-2 border-[#4ade80]/30 text-[#4ade80] hover:bg-[#4ade80]/10"
              >
                {isGeneratingAll ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                Generate All Previews
              </Button>
              <Button size="sm" onClick={addProp} className="gap-2 bg-[#4ade80] hover:bg-[#22c55e] text-black">
                <Plus className="w-4 h-4" />
                Add Prop
              </Button>
            </div>

            <AnimatePresence>
              {elements.props?.map((prop) => (
                <motion.div
                  key={prop.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border border-white/10 rounded-lg overflow-hidden bg-black/20"
                >
                  <div 
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5"
                    onClick={() => toggleExpand(prop.id)}
                  >
                    <div className="flex items-center gap-3">
                      {prop.previewImage ? (
                        <img 
                          src={prop.previewImage} 
                          alt={prop.name}
                          className="w-12 h-12 rounded-lg object-cover border border-white/20"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-[#4ade80]/20 flex items-center justify-center">
                          <Package className="w-6 h-6 text-[#4ade80]" />
                        </div>
                      )}
                      <div>
                        <h4 className="text-white font-medium">{prop.name}</h4>
                        <p className="text-xs text-[#52526b] line-clamp-1">{prop.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); handleGeneratePreview('prop', prop) }}
                        disabled={generatingPreview === prop.id}
                        className="h-8 w-8 p-0 text-[#4ade80] hover:bg-[#4ade80]/10"
                      >
                        {generatingPreview === prop.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Camera className="w-4 h-4" />
                        )}
                      </Button>
                      {expandedItems.has(prop.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedItems.has(prop.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/10"
                      >
                        <div className="p-4 space-y-4">
                          {prop.previewImage && (
                            <div className="aspect-video rounded-lg overflow-hidden border border-white/10 bg-[#0a0a0f]">
                              <img src={prop.previewImage} alt={prop.name} className="w-full h-full object-cover" />
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs text-[#52526b]">Name</Label>
                              <Input
                                value={prop.name}
                                onChange={(e) => updateProp(prop.id, { name: e.target.value })}
                                className="bg-black/30 border-white/10 text-white mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-[#52526b]">Significance</Label>
                              <Input
                                value={prop.significance || ''}
                                onChange={(e) => updateProp(prop.id, { significance: e.target.value })}
                                className="bg-black/30 border-white/10 text-white mt-1"
                                placeholder="Story importance..."
                              />
                            </div>
                          </div>

                          <div>
                            <Label className="text-xs text-[#52526b]">Description</Label>
                            <Textarea
                              value={prop.description}
                              onChange={(e) => updateProp(prop.id, { description: e.target.value })}
                              className="bg-black/30 border-white/10 text-white mt-1 h-20"
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleGeneratePreview('prop', prop)}
                              disabled={generatingPreview === prop.id}
                              className="gap-2 bg-[#4ade80] hover:bg-[#22c55e] text-black"
                            >
                              {generatingPreview === prop.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                              Generate Preview
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteItem('prop', prop.id)}
                              className="text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>

            {(!elements.props || elements.props.length === 0) && (
              <div className="text-center py-8 text-[#52526b]">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No props extracted</p>
                <Button size="sm" onClick={addProp} variant="ghost" className="mt-2">
                  <Plus className="w-4 h-4 mr-1" /> Add Prop
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
