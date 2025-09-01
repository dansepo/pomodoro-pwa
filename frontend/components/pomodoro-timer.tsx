"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, Users, RotateCcw, BarChart3, NotebookPen, Volume2, VolumeX, HelpCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { Notepad } from "./timer/notepad"
import { Kbd } from "@/components/ui/kbd"
import { useOnboarding } from "@/hooks/use-onboarding"
import { usePomodoroTimer } from "@/hooks/use-pomodoro-timer"
import { usePomodoroHistory } from "@/hooks/use-pomodoro-history"
import { useGroupSession } from "@/hooks/use-group-session"
import { useNotificationSound } from "@/hooks/use-notification-sound"
import { SettingsDialog } from "./timer/settings-dialog"
import { OnboardingDialog } from "./timer/onboarding-dialog"
import { GroupSessionDialog } from "./timer/group-session-dialog"
import { HelpDialog } from "./timer/help-dialog"
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
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [isOnline, setIsOnline] = useState(true)

  const originalTitle = useRef("Focus Timer");
  const isInitialMount = useRef(true);

  const {
    showOnboarding,
    setShowOnboarding,
    completeOnboarding,
    startOnboarding,
  } = useOnboarding()

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

  const updateFavicon = useCallback((color: string) => {
    const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    if (!link) return;

    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const context = canvas.getContext('2d');
    if (!context) return;

    context.beginPath();
    context.arc(16, 16, 14, 0, 2 * Math.PI);
    context.fillStyle = color;
    context.fill();

    link.href = canvas.toDataURL('image/png');
  }, []);

  // Effect for continuous title/favicon updates while running
  useEffect(() => {
    if (isRunning) {
      document.title = `${originalTitle.current} - ${formatTime(timeLeft)}`;
      if (timerState === 'focus') {
        updateFavicon('#ef4444'); // Red
      } else {
        updateFavicon('#22c55e'); // Green
      }
    } else {
      // Reset when paused or stopped, but only if not blinking
      if (!document.title.includes('!')) {
        document.title = originalTitle.current;
        updateFavicon('#64748b'); // Gray
      }
    }
  }, [isRunning, timeLeft, timerState, formatTime, updateFavicon]);

  // Effect for "Time's Up" notification on state change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // When a session ends, stop the timer.
    // We call toggleTimer() to ensure group sessions are also updated.
    if (isRunning) {
      toggleTimer();
    }

    // This runs when a session ends and a new one begins.
    const newTitle = timerState === 'focus' ? "🚀 집중할 시간!" : "🧘 휴식 시간!";
    updateFavicon('#f97316'); // Orange alert favicon

    let blinkCount = 0;
    const intervalId = setInterval(() => {
      document.title = document.title === newTitle ? originalTitle.current : newTitle;
      blinkCount++;
      if (blinkCount > 6) { // Stop blinking after 3 seconds
        clearInterval(intervalId);
        // The other effect will take over and set the correct title/favicon
      }
    }, 500);

    return () => {
      clearInterval(intervalId);
      document.title = originalTitle.current;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerState, updateFavicon]);

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV !== 'development') {
      window.addEventListener("load", function () {
        navigator.serviceWorker.register("/sw.js").then(
          function (registration) {
            console.log("Service Worker registration successful with scope: ", registration.scope);
          },
          function (err) {
            console.log("Service Worker registration failed: ", err);
          }
        );
      });
    }
  }, []);

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

  const handleStartTour = () => {
    setIsHelpOpen(false);
    startOnboarding();
  }

  const createGroupSession = () => {
    createGroup({ timerState, timeLeft, isRunning, completedCycles, settings })
  }

  const joinGroupSession = useCallback(() => {
    const session = joinGroup()
    if (session) {
      setTimerState(session.timerState)
      setTimeLeft(session.timeLeft)
      setIsRunning(session.isRunning)
      setCompletedCycles(session.completedCycles)
      setSettings(session.settings)
      lastSyncedUpdate.current = session.lastUpdate
    }
  }, [joinGroup, setTimerState, setTimeLeft, setIsRunning, setCompletedCycles, setSettings])

  useEffect(() => {
    if (groupSession && !currentUser?.isHost && groupSession.lastUpdate > lastSyncedUpdate.current) {
      joinGroupSession() // Re-sync by re-joining logic
      lastSyncedUpdate.current = groupSession.lastUpdate
    }
  }, [groupSession, currentUser?.isHost, joinGroupSession])

  // Effect for background timer notifications via Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then(registration => {
        // The `ServiceWorkerRegistration` object doesn't have a `controller` property.
        // We should use the `active` property to get the active service worker instance.
        const serviceWorker = registration.active;
        if (!serviceWorker) return;

        if (isRunning) {
          // Determine the title for the notification when the current timer ends
          let title = '';
          if (timerState === 'focus') {
            const nextCycleIndex = (completedCycles + 1) % settings.sessionsPerCycle;
            const isLongBreakNext = nextCycleIndex === 0 && settings.sessionsPerCycle > 0;
            title = isLongBreakNext ? '긴 휴식 시간입니다!' : '짧은 휴식 시간입니다!';
          } else {
            title = '휴식이 끝났습니다. 집중할 시간이에요!';
          }

          serviceWorker.postMessage({
            type: 'START_TIMER',
            delay: timeLeft * 1000,
            notification: {
              title: title,
              body: '다음 세션을 시작하세요.',
              icon: '/icon-192.png',
              vibrate: [200, 100, 200],
              tag: 'pomodoro-notification', // To replace previous notifications
              renotify: true, // To make sound/vibration on update
            },
          });
        } else {
          // When timer is paused, reset, or finished
          serviceWorker.postMessage({
            type: 'STOP_TIMER',
          });
        }
      });
    }
    // This effect re-runs when the running state changes or a new session starts.
    // `timeLeft` is intentionally omitted from deps to prevent re-posting on every tick.
    // The correct `timeLeft` is captured at the moment the timer starts/restarts.
  }, [isRunning, timerState, completedCycles, settings]);

  useEffect(() => {
    // Set initial state on client mount
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      // Don't trigger shortcuts if user is typing in an input or textarea
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return
      }

      if (event.altKey) {
        switch (event.code) {
          case 'KeyR': // Reset
            event.preventDefault()
            resetTimer()
            break
          case 'KeyG': // Group
            event.preventDefault()
            setIsGroupSheetOpen(prev => !prev)
            break
          case 'KeyS': // Settings (Sound)
            event.preventDefault()
            setIsSettingsOpen(prev => !prev)
            break
          case 'KeyN': // Notepad
            event.preventDefault()
            setIsNotepadOpen(prev => !prev)
            break
          case 'KeyM': // Mute
            event.preventDefault()
            toggleMute()
            break
          case 'KeyT': // Timeline/History
            event.preventDefault()
            setIsTimelineOpen(prev => !prev)
            break
        }
      } else {
        switch (event.code) {
          case 'Space': // Toggle Timer
            event.preventDefault()
            toggleTimer()
            break
          case 'Slash':
            if (event.shiftKey) { // '?'
              event.preventDefault()
              setIsHelpOpen(prev => !prev)
            }
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [toggleTimer, resetTimer, setIsGroupSheetOpen, setIsSettingsOpen, setIsNotepadOpen, toggleMute, setIsTimelineOpen, setIsHelpOpen])

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
    <TooltipProvider>
      <div className={`min-h-screen min-w-[320px] ${styles.background} text-slate-800 flex flex-col items-center transition-colors duration-1000`}>
        <header className="flex items-center justify-between p-4 md:p-6 w-full max-w-4xl mx-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={resetTimer} className="hover:bg-transparent hover:text-pink-500 rounded-full">
                <RotateCcw className="h-[clamp(1.25rem,3vw,1.5rem)] w-[clamp(1.25rem,3vw,1.5rem)]" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="flex items-center gap-1">리셋 <Kbd>Alt</Kbd>+<Kbd>R</Kbd></p>
            </TooltipContent>
          </Tooltip>

          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={`inline-block w-2.5 h-2.5 rounded-full transition-colors ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
              </TooltipTrigger>
              <TooltipContent>
                <p>{isOnline ? '온라인' : '오프라인'}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => setIsNotepadOpen(prev => !prev)} className="hover:bg-transparent hover:text-pink-500 rounded-full">
                  <NotebookPen className="h-[clamp(1.25rem,3vw,1.5rem)] w-[clamp(1.25rem,3vw,1.5rem)]" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="flex items-center gap-1">메모장 <Kbd>Alt</Kbd>+<Kbd>N</Kbd></p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
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
              </TooltipTrigger>
              <TooltipContent>
                <p className="flex items-center gap-1">음소거 <Kbd>Alt</Kbd>+<Kbd>M</Kbd></p>
                <p className="text-xs text-muted-foreground mt-1">더블클릭: 설정 (<Kbd>Alt</Kbd>+<Kbd>S</Kbd>)</p>
              </TooltipContent>
            </Tooltip>

            <Dialog open={isTimelineOpen} onOpenChange={setIsTimelineOpen}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="hover:bg-transparent hover:text-pink-500 rounded-full">
                      <BarChart3 className="h-[clamp(1.25rem,3vw,1.5rem)] w-[clamp(1.25rem,3vw,1.5rem)]" />
                    </Button>
                  </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="flex items-center gap-1">히스토리 <Kbd>Alt</Kbd>+<Kbd>T</Kbd></p>
                </TooltipContent>
              </Tooltip>
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

            <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="hover:bg-transparent hover:text-pink-500 rounded-full">
                      <HelpCircle className="h-[clamp(1.25rem,3vw,1.5rem)] w-[clamp(1.25rem,3vw,1.5rem)]" />
                    </Button>
                  </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="flex items-center gap-1">도움말 <Kbd>?</Kbd></p>
                </TooltipContent>
              </Tooltip>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="sr-only">도움말 및 단축키</DialogTitle>
                </DialogHeader>
                <HelpDialog onStartTour={handleStartTour} />
              </DialogContent>
            </Dialog>

            <Dialog open={isGroupSheetOpen} onOpenChange={setIsGroupSheetOpen}>
              <Tooltip>
                <TooltipTrigger asChild>
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
                </TooltipTrigger>
                <TooltipContent>
                  <p className="flex items-center gap-1">그룹 세션 <Kbd>Alt</Kbd>+<Kbd>G</Kbd></p>
                </TooltipContent>
              </Tooltip>
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
              className={`text-[clamp(5rem,20vw,9rem)] font-mono text-slate-800 cursor-pointer select-none`}
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
              className={`w-[clamp(2.5rem,3vw,3.5rem)] h-[clamp(2.5rem,3vw,3.5rem)] rounded-full bg-transparent text-slate-900 hover:bg-transparent hover:text-pink-500`}
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
    </TooltipProvider>
  )
}
