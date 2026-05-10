'use client'

import { motion } from 'framer-motion'
import type { ShotListItem } from '@/lib/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ShotListProps {
  shots: ShotListItem[]
}

export function ShotList({ shots }: ShotListProps) {
  if (shots.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 border border-dashed border-white/10 rounded-xl">
        <p className="text-sm text-[#52526b]">No shot list generated yet</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="border border-white/10 rounded-xl overflow-hidden"
    >
      <ScrollArea className="h-[400px]">
        <Table>
          <TableHeader className="sticky top-0 bg-[#111118] z-10">
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-[10px] font-mono uppercase text-[#52526b] w-[60px]">Shot</TableHead>
              <TableHead className="text-[10px] font-mono uppercase text-[#52526b] w-[80px]">Type</TableHead>
              <TableHead className="text-[10px] font-mono uppercase text-[#52526b] w-[100px]">Movement</TableHead>
              <TableHead className="text-[10px] font-mono uppercase text-[#52526b]">Description</TableHead>
              <TableHead className="text-[10px] font-mono uppercase text-[#52526b] w-[80px]">Lens</TableHead>
              <TableHead className="text-[10px] font-mono uppercase text-[#52526b] w-[100px]">Lighting</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shots.map((shot, i) => (
              <TableRow
                key={`${shot.shotNumber}-${i}`}
                className="border-white/5 hover:bg-white/3"
              >
                <TableCell className="font-mono text-xs text-[#c084fc]">
                  {shot.shotNumber}
                </TableCell>
                <TableCell>
                  <span className="px-2 py-0.5 text-[10px] font-mono bg-[#38bdf8]/10 text-[#38bdf8] rounded border border-[#38bdf8]/30">
                    {shot.shotType}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-[#a1a1bc]">
                  {shot.cameraMovement}
                </TableCell>
                <TableCell className="text-sm text-white max-w-[300px]">
                  <p className="truncate">{shot.description}</p>
                  {shot.notes && (
                    <p className="text-[10px] text-[#52526b] mt-1 truncate">{shot.notes}</p>
                  )}
                </TableCell>
                <TableCell className="text-xs text-[#a1a1bc]">
                  {shot.lens}
                </TableCell>
                <TableCell className="text-xs text-[#a1a1bc]">
                  {shot.lighting}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </motion.div>
  )
}

export function ShotListCompact({ shots }: ShotListProps) {
  return (
    <div className="space-y-2">
      {shots.slice(0, 5).map((shot, i) => (
        <div
          key={`${shot.shotNumber}-${i}`}
          className="flex items-center gap-2 px-3 py-2 bg-white/3 rounded-lg border border-white/5"
        >
          <span className="font-mono text-xs text-[#c084fc] w-8">{shot.shotNumber}</span>
          <span className="px-1.5 py-0.5 text-[9px] font-mono bg-[#38bdf8]/10 text-[#38bdf8] rounded">
            {shot.shotType}
          </span>
          <span className="text-xs text-[#a1a1bc] truncate flex-1">{shot.description}</span>
        </div>
      ))}
      {shots.length > 5 && (
        <p className="text-[10px] text-[#52526b] text-center">
          +{shots.length - 5} more shots
        </p>
      )}
    </div>
  )
}
