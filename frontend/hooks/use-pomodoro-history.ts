import { useState, useEffect, useCallback } from "react"
import { toast } from "@/hooks/use-toast"
import type { Note, Cycle, TimelineCycle } from "@/components/pomodoro-timer"

export function usePomodoroHistory() {
  const [isNotepadOpen, setIsNotepadOpen] = useState(false)
  const [noteContent, setNoteContent] = useState("")
  const [sessionNotes, setSessionNotes] = useState<Note[]>([])
  const [currentCycleId, setCurrentCycleId] = useState<number>(0)
  const [isTimelineOpen, setIsTimelineOpen] = useState(false)
  const [timelineData, setTimelineData] = useState<TimelineCycle[]>([])
  const [timelineFilter, setTimelineFilter] = useState<string>("all")
  const [uniqueCycleNames, setUniqueCycleNames] = useState<string[]>([])

  const startNewCycle = useCallback(() => {
    const newCycleId = Date.now()
    const newCycleName = "Untitled Focus"
    const allCycles: Cycle[] = JSON.parse(localStorage.getItem("pomodoro_cycles") || "[]")
    allCycles.push({ id: newCycleId, name: newCycleName })
    localStorage.setItem("pomodoro_cycles", JSON.stringify(allCycles))
    setCurrentCycleId(newCycleId)
  }, [])

  // Load notes for the current session
  useEffect(() => {
    if (!currentCycleId) return
    const allNotes: Note[] = JSON.parse(localStorage.getItem("pomodoro_notes") || "[]")
    const notesForThisCycle = allNotes.filter((note) => note.cycleId === currentCycleId)
    setSessionNotes(notesForThisCycle)
  }, [currentCycleId])

  // Save note on notepad close
  useEffect(() => {
    if (!isNotepadOpen && noteContent.trim() !== "") {
      const allNotes = JSON.parse(localStorage.getItem("pomodoro_notes") || "[]")
      const newNote: Note = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        cycleId: currentCycleId,
        content: noteContent.trim(),
      }
      const newSavedNotes = [...allNotes, newNote]
      localStorage.setItem("pomodoro_notes", JSON.stringify(newSavedNotes))

      setSessionNotes((prev) => [...prev, newNote])
      toast({ title: "메모가 저장되었습니다." })
      setNoteContent("")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNotepadOpen])

  useEffect(() => {
    if (isTimelineOpen) {
      const allCycles: Cycle[] = JSON.parse(localStorage.getItem("pomodoro_cycles") || "[]")
      const allNotes: Note[] = JSON.parse(localStorage.getItem("pomodoro_notes") || "[]")

      const uniqueNames = ["all", ...Array.from(new Set(allCycles.map((c) => c.name)))]
      setUniqueCycleNames(uniqueNames)

      const filteredCycles =
        timelineFilter === "all" ? allCycles : allCycles.filter((c) => c.name === timelineFilter)

      const data: TimelineCycle[] = filteredCycles
        .map((cycle) => ({
          ...cycle,
          notes: allNotes.filter((note) => note.cycleId === cycle.id),
        }))
        .sort((a, b) => b.id - a.id)

      setTimelineData(data)
    }
  }, [isTimelineOpen, timelineFilter])

  return {
    isNotepadOpen,
    setIsNotepadOpen,
    noteContent,
    setNoteContent,
    sessionNotes,
    startNewCycle,
    isTimelineOpen,
    setIsTimelineOpen,
    timelineData,
    timelineFilter,
    setTimelineFilter,
    uniqueCycleNames,
  }
}

