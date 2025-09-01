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
import { useScheduler } from "@/hooks/use-scheduler"
import { useTriggeredSchedules } from "@/hooks/use-triggered-schedules"
import { usePomodoroTimer } from "@/hooks/use-pomodoro-timer"
import { usePomodoroHistory } from "@/hooks/use-pomodoro-history"
import { useGroupSession } from "@/hooks/use-group-session"
import { useNotificationSound } from "@/hooks/use-notification-sound"
import { SettingsDialog } from "./timer/settings-dialog"
import { OnboardingDialog } from "./timer/onboarding-dialog"
import { GroupSessionDialog } from "./timer/group-session-dialog"
import { HelpDialog } from "./timer/help-dialog"
import { HistoryDialog } from "@/components/timer/history-dialog"
import type { TimerSettings, TimerState, GroupMember, Schedule } from "@/types"

const INITIAL_SETTINGS: TimerSettings = {
  focusTime: 25,
  breakTime: 0,
  sessionsPerCycle: 1,
}

export default function PomodoroTimer() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [isOnline, setIsOnline] = useState(true)

  const { schedules } = useScheduler()
  const { hasBeenTriggeredToday, addTriggeredId } = useTriggeredSchedules();

  const originalTitle = useRef("White Timer");
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
        updateFavicon('#ef4444'); // 빨간색
      } else {
        updateFavicon('#22c55e'); // 녹색
      }
    } else {
      // 일시정지 또는 중지 시 리셋 (깜빡이는 중이 아닐 때만)
      if (!document.title.includes('!')) {
        document.title = originalTitle.current;
        updateFavicon('#64748b'); // 회색
      }
    }
  }, [isRunning, timeLeft, timerState, formatTime, updateFavicon]);

  // Effect for "Time's Up" notification on state change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // 세션이 끝나면 타이머를 멈춥니다.
    // 그룹 세션도 업데이트되도록 toggleTimer()를 호출합니다.
    if (isRunning) {
      toggleTimer();
    }

    // 이 코드는 세션이 끝나고 새 세션이 시작될 때 실행됩니다.
    const newTitle = timerState === 'focus' ? "🚀 집중할 시간!" : "🧘 휴식 시간!";
    updateFavicon('#f97316'); // 주황색 알림 파비콘

    let blinkCount = 0;
    const intervalId = setInterval(() => {
      document.title = document.title === newTitle ? originalTitle.current : newTitle;
      blinkCount++;
      if (blinkCount > 6) { // 3초 후 깜빡임 중지
        clearInterval(intervalId);
        // 다른 effect가 올바른 제목/파비콘을 설정하도록 합니다.
      }
    }, 500);

    return () => {
      clearInterval(intervalId);
      document.title = originalTitle.current;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerState, updateFavicon]);

  // 서비스 워커로 다음 타이머를 예약하는 effect
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.ready) {
      return;
    }

    const scheduleNext = (sw: ServiceWorker) => {
      // 먼저, 이전에 예약된 타이머를 취소합니다.
      sw.postMessage({ type: 'CANCEL_SCHEDULED_TIMER' });

      // 아직 실행되지 않은 가장 가까운 다음 스케줄을 찾습니다.
      const now = new Date();
      const result = schedules.reduce<{ schedule: Schedule | null, delay: number }>((acc, s) => {
        if (!s.enabled || hasBeenTriggeredToday(s.id)) {
          return acc;
        }

        const [hours, minutes] = s.time.split(':').map(Number);
        const scheduledTimeToday = new Date();
        scheduledTimeToday.setHours(hours, minutes, 0, 0);
        const delayToday = scheduledTimeToday.getTime() - now.getTime();

        if (s.days.includes(now.getDay()) && delayToday > 0 && delayToday < acc.delay) {
          return { schedule: s, delay: delayToday };
        }
        return acc;
      }, { schedule: null, delay: Infinity });

      const { schedule: nextSchedule, delay: minDelay } = result;

      if (nextSchedule) {
        sw.postMessage({
          type: 'SCHEDULE_TIMER',
          delay: minDelay,
          scheduleId: nextSchedule.id,
        });
      }
    };

    navigator.serviceWorker.ready.then(registration => {
      if (registration.active) {
        scheduleNext(registration.active);
      }
    });
  }, [schedules, hasBeenTriggeredToday]);

  // 서비스 워커로부터 메시지를 수신하는 effect
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'START_FROM_SCHEDULE' && !isRunning) {
        const scheduleId = event.data.scheduleId;
        const scheduleToTrigger = schedules.find(s => s.id === scheduleId);

        if (scheduleToTrigger) {
          updateSettings(scheduleToTrigger.settings);
          setSelectedSound(scheduleToTrigger.sound);
          addTriggeredId(scheduleToTrigger.id);
          toast({ title: "스케줄 시작!", description: `예약된 집중 세션을 시작합니다.` });
          toggleTimer();
        }
      }
    };
    navigator.serviceWorker?.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker?.removeEventListener('message', handleMessage);
  }, [schedules, addTriggeredId, updateSettings, setSelectedSound, toggleTimer, isRunning]);

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV !== 'development') {
      window.addEventListener("load", function () {
        navigator.serviceWorker.register("/sw.js").then(
          function (registration) {
            console.log("서비스 워커 등록 성공, 범위: ", registration.scope);
          },
          function (err) {
            console.log("서비스 워커 등록 실패: ", err);
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
      const possibleTimes = [5, 10, 15, 20, 30];
      const currentTime = settings.breakTime;
      const currentIndex = possibleTimes.indexOf(currentTime);
      const nextIndex = (currentIndex + 1) % possibleTimes.length;
      const newTime = possibleTimes[nextIndex];

      updateSettings({ breakTime: newTime });
      toast({
        title: `휴식 시간이 ${newTime}분으로 변경되었습니다.`,
      });
    }
  }, [isGroupMode, currentUser, timerState, settings.focusTime, settings.breakTime, updateSettings]);

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
      setTimerState(session.timerState);
      setTimeLeft(session.timeLeft);
      setIsRunning(session.isRunning);
      setCompletedCycles(session.completedCycles);

      // 다른 클라이언트의 이전 설정 형식을 처리하기 위한 데이터 마이그레이션
      const remoteSettings = session.settings as any;
      const newSettings: TimerSettings = {
        focusTime: remoteSettings.focusTime ?? INITIAL_SETTINGS.focusTime,
        breakTime: remoteSettings.breakTime ?? remoteSettings.shortBreakTime ?? INITIAL_SETTINGS.breakTime,
        sessionsPerCycle: remoteSettings.sessionsPerCycle ?? INITIAL_SETTINGS.sessionsPerCycle,
      };
      setSettings(newSettings);
      lastSyncedUpdate.current = session.lastUpdate;
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
            title = '휴식 시간입니다!';
          } else { // break
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
              tag: 'pomodoro-notification', // 이전 알림을 대체
              renotify: true, // 업데이트 시 소리/진동 발생
            },
          });
        } else {
          // 타이머가 일시정지, 리셋, 또는 종료되었을 때
          serviceWorker.postMessage({
            type: 'STOP_TIMER',
          });
        }
      });
    }
    // 이 effect는 실행 상태가 변경되거나 새 세션이 시작될 때 다시 실행됩니다.
    // 매 틱마다 재전송되는 것을 방지하기 위해 의도적으로 `timeLeft`를 의존성 배열에서 제외했습니다.
    // 올바른 `timeLeft`는 타이머가 시작/재시작되는 순간에 캡처됩니다.
  }, [isRunning, timerState, completedCycles, settings]);

  useEffect(() => {
    // 클라이언트 마운트 시 초기 상태 설정
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
      // 사용자가 input 또는 textarea에 입력 중일 때는 단축키를 실행하지 않습니다.
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return
      }

      if (event.altKey) {
        switch (event.code) {
          case 'KeyR': // 리셋
            event.preventDefault()
            resetTimer()
            break
          case 'KeyG': // 그룹
            event.preventDefault()
            setIsGroupSheetOpen(prev => !prev)
            break
          case 'KeyS': // 설정 (소리)
            event.preventDefault()
            setIsSettingsOpen(prev => !prev)
            break
          case 'KeyN': // 메모장
            event.preventDefault()
            setIsNotepadOpen(prev => !prev)
            break
          case 'KeyM': // 음소거
            event.preventDefault()
            toggleMute()
            break
          case 'KeyT': // 히스토리
            event.preventDefault()
            setIsTimelineOpen(prev => !prev)
            break
        }
      } else {
        switch (event.code) {
          case 'Space': // 타이머 시작/정지
            event.preventDefault()
            toggleTimer()
            break
          case 'Slash': // '?'
            if (event.shiftKey) {
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
  } else if (timerState === 'break') {
    const totalTime = settings.breakTime * 60;
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
              const hostName = groupSession?.members.find((m: GroupMember) => m.isHost)?.name;
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
                  const focusDuration = settings.focusTime
                  const breakDuration = settings.breakTime
                  const totalDuration = focusDuration + breakDuration
                  const focusWidth = totalDuration > 0 ? (focusDuration / totalDuration) * 100 : 0

                  const focusColor = "bg-red-500"
                  const breakColor = "bg-green-500"
                  const baseColor = "bg-black/10"

                  let focusProgress = 0
                  let breakProgress = 0

                  if (timerState === "focus") {
                    focusProgress = progress
                  } else if (timerState === 'break') {
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
              <DialogTitle>설정</DialogTitle>
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
