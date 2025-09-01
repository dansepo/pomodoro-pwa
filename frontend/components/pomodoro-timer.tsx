"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, Users, RotateCcw, BarChart3, NotebookPen, Volume2, VolumeX } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { Notepad } from "./timer/notepad"
import { usePomodoroTimer } from "@/hooks/use-pomodoro-timer"
import { usePomodoroHistory } from "@/hooks/use-pomodoro-history"
import { useGroupSession } from "@/hooks/use-group-session"
import { useNotificationSound } from "@/hooks/use-notification-sound"
import { SettingsDialog } from "./timer/settings-dialog"
import { GroupSessionDialog } from "./timer/group-session-dialog"
import { HistoryDialog } from "@/components/timer/history-dialog"


export type TimerState = "focus" | "shortBreak" | "longBreak"

export interface TimerSettings {
  focusTime: number
  shortBreakTime: number
  longBreakTime: number
  sessionsPerCycle: number
}

export interface Cycle {
  id: number;
  name: string;
}

export interface Note {
  id: number;
  timestamp: string;
  cycleId: number;
  content: string;
}

export interface TimelineCycle extends Cycle {
  notes: Note[];
}

export interface GroupMember {
  id: string
  name: string
  isHost: boolean
  lastSeen: number
}

export interface GroupSession {
  id: string
  hostId: string
  timerState: TimerState
  timeLeft: number
  isRunning: boolean
  completedCycles: number
  settings: TimerSettings
  members: GroupMember[]
  lastUpdate: number
}

const INITIAL_SETTINGS: TimerSettings = {
  focusTime: 25,
  shortBreakTime: 5,
  longBreakTime: 15,
  sessionsPerCycle: 1,
}

export default function PomodoroTimer() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const {
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
  } = usePomodoroHistory()

  const {
    isGroupMode,
    groupSession,
    currentUser,
    userName,
    setUserName,
    joinCode,
    setJoinCode,
    isGroupSheetOpen,
    setIsGroupSheetOpen,
    createGroupSession: createGroup,
    joinGroupSession: joinGroup,
    leaveGroup,
    copyRoomCode,
    updateGroupSession,
  } = useGroupSession()

  const { selectedSound, setSelectedSound, playSound, isMuted, toggleMute } = useNotificationSound()

  const lastSyncedUpdate = useRef(0)

  const {
    timeLeft,
    setTimeLeft,
    isRunning,
    setIsRunning,
    timerState,
    setTimerState,
    completedCycles,
    setCompletedCycles,
    settings,
    setSettings,
    toggleTimer,
    resetTimer,
    updateSettings,
    formatTime,
    getDynamicStyles,
  } = usePomodoroTimer({
    initialSettings: INITIAL_SETTINGS,
    isGroupMode,
    currentUser,
    groupSession,
    onGroupUpdate: updateGroupSession,
    onNewCycle: startNewCycle,
    playSound,
  })

  useEffect(() => {
    startNewCycle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleTimeChange = useCallback(() => {
    if (isGroupMode && !currentUser?.isHost) {
      toast({
        title: "방장만 시간을 변경할 수 있습니다.",
        variant: "destructive",
      })
      return
    }

    if (timerState === 'focus') {
      const possibleTimes = [15, 25, 30, 45, 50, 60, 90];
      const currentTime = settings.focusTime;
      const currentIndex = possibleTimes.indexOf(currentTime);
      const nextIndex = (currentIndex + 1) % possibleTimes.length;
      const newTime = possibleTimes[nextIndex];
      updateSettings({ focusTime: newTime });
      toast({
        title: `집중 시간이 ${newTime}분으로 변경되었습니다.`,
      });
    } else { // shortBreak or longBreak
      const possibleTimes = [5, 10, 15, 20, 30, 45];
      // Use shortBreakTime as the canonical value for all breaks
      const currentTime = settings.shortBreakTime;
      const currentIndex = possibleTimes.indexOf(currentTime);
      const nextIndex = (currentIndex + 1) % possibleTimes.length;
      const newTime = possibleTimes[nextIndex];

      // Update both short and long break for simplicity
      updateSettings({ shortBreakTime: newTime, longBreakTime: newTime });
      toast({
        title: `휴식 시간이 ${newTime}분으로 변경되었습니다.`,
      });
    }
  }, [isGroupMode, currentUser, timerState, settings, updateSettings]);

  const handleCycleCountChange = useCallback(() => {
    if (isGroupMode && !currentUser?.isHost) {
      toast({
        title: "방장만 반복 횟수를 변경할 수 있습니다.",
        variant: "destructive",
      })
      return
    }

    const possibleCounts = [1, 2, 3, 4, 5, 6]
    const currentCount = settings.sessionsPerCycle
    const currentIndex = possibleCounts.indexOf(currentCount)
    const nextIndex = (currentIndex + 1) % possibleCounts.length
    const newCount = possibleCounts[nextIndex]

    updateSettings({ sessionsPerCycle: newCount })

    toast({
      title: `세션 반복 횟수가 ${newCount}회로 변경되었습니다.`,
    })
  }, [isGroupMode, currentUser, settings.sessionsPerCycle, updateSettings])

  const createGroupSession = () => {
    createGroup({ timerState, timeLeft, isRunning, completedCycles, settings })
  }

  const joinGroupSession = () => {
    const session = joinGroup()
    if (session) {
      setTimerState(session.timerState)
      setTimeLeft(session.timeLeft)
      setIsRunning(session.isRunning)
      setCompletedCycles(session.completedCycles)
      setSettings(session.settings)
      lastSyncedUpdate.current = session.lastUpdate
    }
  }

  useEffect(() => {
    if (groupSession && !currentUser?.isHost && groupSession.lastUpdate > lastSyncedUpdate.current) {
      joinGroupSession() // Re-sync by re-joining logic
      lastSyncedUpdate.current = groupSession.lastUpdate
    }
  }, [groupSession, currentUser?.isHost, joinGroupSession])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey) {
        switch (event.code) {
          case 'KeyR':
            event.preventDefault()
            resetTimer()
            break
          case 'KeyG':
            event.preventDefault()
            setIsGroupSheetOpen(prev => !prev)
            break
          case 'KeyS':
            event.preventDefault()
            setIsSettingsOpen(prev => !prev)
            break
        }
      } else {
        switch (event.code) {
          case 'Space':
            event.preventDefault()
            toggleTimer()
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [toggleTimer, resetTimer])

  const styles = getDynamicStyles()

  let progress = 0;
  if (timerState === 'focus') {
    const totalTime = settings.focusTime * 60;
    progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;
  } else if (timerState === 'shortBreak') {
    const totalTime = settings.shortBreakTime * 60;
    progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;
  } else if (timerState === 'longBreak') {
    const totalTime = settings.longBreakTime * 60;
    progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;
  }

  return (
    <div className={`min-h-screen min-w-[320px] ${styles.background} text-slate-800 flex flex-col items-center transition-colors duration-1000`}>
      <header className="flex items-center justify-between p-4 md:p-6 w-full max-w-4xl mx-auto">
        <Button variant="ghost" size="icon" onClick={resetTimer} className="hover:bg-transparent hover:text-pink-500 rounded-full">
          <RotateCcw className="h-[clamp(1.25rem,3vw,1.5rem)] w-[clamp(1.25rem,3vw,1.5rem)]" />
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setIsNotepadOpen(prev => !prev)} className="hover:bg-transparent hover:text-pink-500 rounded-full">
            <NotebookPen className="h-[clamp(1.25rem,3vw,1.5rem)] w-[clamp(1.25rem,3vw,1.5rem)]" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            onDoubleClick={() => setIsSettingsOpen(true)}
            className="hover:bg-transparent hover:text-pink-500 rounded-full"
          >
            {isMuted ? (
              <VolumeX className="h-[clamp(1.25rem,3vw,1.5rem)] w-[clamp(1.25rem,3vw,1.5rem)]" />
            ) : (
              <Volume2 className="h-[clamp(1.25rem,3vw,1.5rem)] w-[clamp(1.25rem,3vw,1.5rem)]" />
            )}
          </Button>

          <Dialog open={isTimelineOpen} onOpenChange={setIsTimelineOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-transparent hover:text-pink-500 rounded-full">
                <BarChart3 className="h-[clamp(1.25rem,3vw,1.5rem)] w-[clamp(1.25rem,3vw,1.5rem)]" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl md:max-w-3xl lg:max-w-4xl h-[70vh]">
              <DialogHeader>
                <DialogTitle>히스토리</DialogTitle>
              </DialogHeader>
              <HistoryDialog
                timelineData={timelineData}
                timelineFilter={timelineFilter}
                setTimelineFilter={setTimelineFilter}
                uniqueCycleNames={uniqueCycleNames}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={isGroupSheetOpen} onOpenChange={setIsGroupSheetOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="relative hover:bg-transparent hover:text-pink-500 rounded-full">
                <Users className="h-[clamp(1.25rem,3vw,1.5rem)] w-[clamp(1.25rem,3vw,1.5rem)]" />
                {isGroupMode && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs">
                    {groupSession?.members.length || 0}
                  </Badge>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  그룹 세션
                </DialogTitle>
              </DialogHeader>
              <GroupSessionDialog
                isGroupMode={isGroupMode}
                groupSession={groupSession}
                currentUser={currentUser}
                userName={userName}
                setUserName={setUserName}
                joinCode={joinCode}
                setJoinCode={setJoinCode}
                createGroupSession={createGroupSession}
                joinGroupSession={joinGroupSession}
                leaveGroup={leaveGroup}
                copyRoomCode={copyRoomCode}
              />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 pb-24 w-full">

        <div className="flex flex-col items-center mt-4 -translate-y-10 md:-translate-y-12">
          {isGroupMode && (() => {
            const hostName = groupSession?.members.find(m => m.isHost)?.name;
            const displayName = hostName ? `${hostName}그룹` : '그룹 세션';
            return (
              <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
                <Users className="h-4 w-4" />
                <span>
                  <span className="font-semibold text-slate-600">{displayName}</span> ({groupSession?.members.length}명)
                </span>
                {currentUser?.isHost && (
                  <Badge variant="secondary" className="text-xs bg-slate-200 text-slate-600 border-slate-300">방장</Badge>
                )}
              </div>
            );
          })()}

          <div
            className={`text-[clamp(5rem,20vw,9rem)] font-bold font-digital text-slate-800 cursor-pointer select-none`}
            onDoubleClick={handleTimeChange}
          >{formatTime(timeLeft)}</div>

          <div
            className="flex items-center gap-1.5 mb-3 cursor-pointer"
            onDoubleClick={handleCycleCountChange}
          >
            {Array.from({ length: settings.sessionsPerCycle }).map((_, index) => {
              const cyclePosition = completedCycles % settings.sessionsPerCycle
              const isCompleted = index < cyclePosition
              const isCurrent = index === cyclePosition

              if (isCurrent) {
                const upcomingBreakIsLong = (index + 1) % settings.sessionsPerCycle === 0
                const focusDuration = settings.focusTime
                const breakDuration = upcomingBreakIsLong ? settings.longBreakTime : settings.shortBreakTime
                const totalDuration = focusDuration + breakDuration
                const focusWidth = totalDuration > 0 ? (focusDuration / totalDuration) * 100 : 0

                const focusColor = "bg-red-500"
                const breakColor = "bg-green-500"
                const baseColor = "bg-black/10"

                let focusProgress = 0
                let breakProgress = 0

                if (timerState === "focus") {
                  focusProgress = progress
                } else if (timerState === 'shortBreak' || timerState === 'longBreak') {
                  focusProgress = 100 // Focus is complete
                  breakProgress = progress
                }

                return (
                  <div key={index} className="w-14 h-2.5 rounded-full flex overflow-hidden">
                    <div className={`h-full relative ${baseColor}`} style={{ width: `${focusWidth}%` }}>
                      <div className={`h-full ${focusColor} ${timerState !== 'focus' ? 'opacity-50' : ''} transition-all duration-200`} style={{ width: `${focusProgress}%` }} />
                    </div>
                    <div className={`h-full relative ${baseColor}`} style={{ flex: 1 }}>
                      <div className={`h-full ${breakColor} transition-all duration-200`} style={{ width: `${breakProgress}%` }} />
                    </div>
                  </div>
                )
              }

              const dotClass = isCompleted ? "bg-red-500 opacity-50" : "bg-black/10"

              return (
                <div
                  key={index}
                  className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${dotClass}`}
                />
              )
            })}
          </div>

          <Button
            onClick={toggleTimer}
            variant="outline"
            size="icon"
            className={`w-[clamp(2.5rem,3vw,3.5rem)] h-[clamp(2.5rem,3vw,3.5rem)] rounded-full text-slate-900 hover:text-pink-500`}
          >
            {isRunning ? <Pause className="w-[clamp(1.25rem,3vw,1.5rem)] h-[clamp(1.25rem,3vw,1.5rem)]" /> : <Play className="w-[clamp(1.25rem,3vw,1.5rem)] h-[clamp(1.25rem,3vw,1.5rem)] ml-1" />}
          </Button>
        </div>
      </main>

      <Notepad
        isNotepadOpen={isNotepadOpen}
        sessionNotes={sessionNotes}
        noteContent={noteContent}
        setNoteContent={setNoteContent}
      />

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>알림음 설정</DialogTitle>
          </DialogHeader>
          <SettingsDialog
            settings={settings}
            onSettingsChange={updateSettings}
            selectedSound={selectedSound}
            onSoundChange={setSelectedSound}
            isEditable={!isGroupMode || !!currentUser?.isHost}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
