'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, MapPin, Car, Package, Palette, Film, Sparkles, 
  ChevronDown, ChevronUp, Edit3, RefreshCw, Check, X,
  Plus, Trash2, Wand2, Eye, Save
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
}

export function ConceptEditor({ 
  elements, 
  onElementsChange, 
  onGeneratePreview,
  isLoading 
}: ConceptEditorProps) {
  const [activeTab, setActiveTab] = useState('characters')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [generatingPreview, setGeneratingPreview] = useState<string | null>(null)

  if (!elements) {
    return (
      <Card className="bg-[#111118] border-white/10">
        <CardContent className="p-8 text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-[#52526b]" />
          <p className="text-[#a1a1bc]">
            No scene elements extracted yet. Enhance your prompt first to extract characters, locations, and props.
          </p>
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
        // Update the item with the preview image
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
      }
    } catch {
      toast.error('Failed to generate preview')
    } finally {
      setGeneratingPreview(null)
    }
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

  return (
    <Card className="bg-[#111118] border-white/10">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Film className="w-5 h-5 text-[#c084fc]" />
            Visual Concept Editor
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-[#c084fc]/30 text-[#c084fc]">
              {elements.genre}
            </Badge>
            <Badge variant="outline" className="border-[#f59e0b]/30 text-[#f59e0b]">
              {elements.mood}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-[#52526b] mt-1">
          Customize characters, locations, vehicles, and props. Generate AI previews to visualize your concepts.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Color Palette Preview */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-black/30 border border-white/5">
          <Palette className="w-4 h-4 text-[#a1a1bc]" />
          <span className="text-sm text-[#a1a1bc]">Color Palette:</span>
          <div className="flex gap-1">
            {elements.colorPalette?.slice(0, 6).map((color, idx) => (
              <div
                key={idx}
                className="w-6 h-6 rounded-full border border-white/20"
                style={{ backgroundColor: color.toLowerCase().includes('#') ? color : `var(--${color})` }}
                title={color}
              />
            ))}
          </div>
          <span className="text-xs text-[#52526b] ml-auto">
            {elements.visualStyle}
          </span>
        </div>

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
            <div className="flex justify-end">
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
                          className="w-10 h-10 rounded-full object-cover border border-white/20"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#c084fc]/20 flex items-center justify-center">
                          <User className="w-5 h-5 text-[#c084fc]" />
                        </div>
                      )}
                      <div>
                        <h4 className="text-white font-medium">{char.name}</h4>
                        <p className="text-xs text-[#52526b]">{char.age} {char.gender} - {char.clothing?.slice(0, 40)}...</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={roleColors[char.role]}>
                        {char.role}
                      </Badge>
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
                              disabled={generatingPreview === char.id || isLoading}
                              className="gap-2 bg-[#c084fc] hover:bg-[#a855f7] text-black"
                            >
                              {generatingPreview === char.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                              Generate Preview
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteItem('character', char.id)}
                              className="gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </TabsContent>

          {/* LOCATIONS TAB */}
          <TabsContent value="locations" className="mt-4 space-y-3">
            <div className="flex justify-end">
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
                          className="w-12 h-8 rounded object-cover border border-white/20"
                        />
                      ) : (
                        <div className="w-12 h-8 rounded bg-[#38bdf8]/20 flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-[#38bdf8]" />
                        </div>
                      )}
                      <div>
                        <h4 className="text-white font-medium">{loc.name}</h4>
                        <p className="text-xs text-[#52526b]">{loc.type} - {loc.timeOfDay} - {loc.weather}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-[#38bdf8]/30 text-[#38bdf8]">
                        {loc.mood}
                      </Badge>
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
                              <Input
                                value={loc.timeOfDay || ''}
                                onChange={(e) => updateLocation(loc.id, { timeOfDay: e.target.value })}
                                className="bg-black/30 border-white/10 text-white mt-1"
                                placeholder="e.g., Golden hour"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-[#52526b]">Weather</Label>
                              <Input
                                value={loc.weather || ''}
                                onChange={(e) => updateLocation(loc.id, { weather: e.target.value })}
                                className="bg-black/30 border-white/10 text-white mt-1"
                                placeholder="e.g., Overcast"
                              />
                            </div>
                          </div>

                          <div>
                            <Label className="text-xs text-[#52526b]">Description</Label>
                            <Textarea
                              value={loc.description}
                              onChange={(e) => updateLocation(loc.id, { description: e.target.value })}
                              className="bg-black/30 border-white/10 text-white mt-1 h-24"
                              placeholder="Detailed visual description..."
                            />
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              onClick={() => handleGeneratePreview('location', loc)}
                              disabled={generatingPreview === loc.id || isLoading}
                              className="gap-2 bg-[#38bdf8] hover:bg-[#0ea5e9] text-black"
                            >
                              {generatingPreview === loc.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                              Generate Preview
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteItem('location', loc.id)}
                              className="gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </TabsContent>

          {/* VEHICLES TAB */}
          <TabsContent value="vehicles" className="mt-4 space-y-3">
            <div className="flex justify-end">
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
                          className="w-12 h-8 rounded object-cover border border-white/20"
                        />
                      ) : (
                        <div className="w-12 h-8 rounded bg-[#f59e0b]/20 flex items-center justify-center">
                          <Car className="w-4 h-4 text-[#f59e0b]" />
                        </div>
                      )}
                      <div>
                        <h4 className="text-white font-medium">{veh.make} {veh.model || veh.type}</h4>
                        <p className="text-xs text-[#52526b]">{veh.color} - {veh.era} - {veh.condition}</p>
                      </div>
                    </div>
                    {expandedItems.has(veh.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
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
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                          </div>

                          <div>
                            <Label className="text-xs text-[#52526b]">Description</Label>
                            <Textarea
                              value={veh.description}
                              onChange={(e) => updateVehicle(veh.id, { description: e.target.value })}
                              className="bg-black/30 border-white/10 text-white mt-1 h-24"
                            />
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              onClick={() => handleGeneratePreview('vehicle', veh)}
                              disabled={generatingPreview === veh.id || isLoading}
                              className="gap-2 bg-[#f59e0b] hover:bg-[#d97706] text-black"
                            >
                              {generatingPreview === veh.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                              Generate Preview
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteItem('vehicle', veh.id)}
                              className="gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>

            {elements.vehicles?.length === 0 && (
              <div className="text-center py-8 text-[#52526b]">
                No vehicles in this scene. Add one if needed.
              </div>
            )}
          </TabsContent>

          {/* PROPS TAB */}
          <TabsContent value="props" className="mt-4 space-y-3">
            {elements.props?.map((prop) => (
              <div
                key={prop.id}
                className="flex items-center justify-between p-3 border border-white/10 rounded-lg bg-black/20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-[#4ade80]/20 flex items-center justify-center">
                    <Package className="w-5 h-5 text-[#4ade80]" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{prop.name}</h4>
                    <p className="text-xs text-[#52526b]">{prop.description?.slice(0, 60)}...</p>
                  </div>
                </div>
                <Badge variant="outline" className="border-[#4ade80]/30 text-[#4ade80]">
                  {prop.significance || 'prop'}
                </Badge>
              </div>
            ))}

            {elements.props?.length === 0 && (
              <div className="text-center py-8 text-[#52526b]">
                No significant props identified in this scene.
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Cinematic References */}
        {elements.cinematicReferences && elements.cinematicReferences.length > 0 && (
          <div className="pt-4 border-t border-white/10">
            <p className="text-xs text-[#52526b] mb-2">Cinematic References:</p>
            <div className="flex flex-wrap gap-2">
              {elements.cinematicReferences.map((ref, idx) => (
                <Badge key={idx} variant="outline" className="border-[#c084fc]/30 text-[#c084fc]">
                  <Film className="w-3 h-3 mr-1" />
                  {ref}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
