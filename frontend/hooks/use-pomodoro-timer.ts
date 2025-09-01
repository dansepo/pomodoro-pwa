import { useState, useEffect, useRef, useCallback } from "react"
import { toast } from "@/hooks/use-toast"
import type { TimerState, TimerSettings, GroupSession, GroupMember } from "@/components/pomodoro-timer"

export interface UsePomodoroTimerProps {
  initialSettings: TimerSettings
  isGroupMode: boolean
  currentUser: GroupMember | null
  groupSession: GroupSession | null
  onGroupUpdate: (updates: Partial<GroupSession>) => void
  onNewCycle: () => void
  playSound: () => void
}

export function usePomodoroTimer({
  initialSettings,
  isGroupMode,
  currentUser,
  groupSession,
  onGroupUpdate,
  onNewCycle,
  playSound,
}: UsePomodoroTimerProps) {
  const [settings, setSettings] = useState<TimerSettings>(initialSettings)
  const [timeLeft, setTimeLeft] = useState(initialSettings.focusTime * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [timerState, setTimerState] = useState<TimerState>("focus")
  const [completedCycles, setCompletedCycles] = useState(0)
  const [targetTime, setTargetTime] = useState<number | null>(null)


  const intervalRef = useRef<NodeJS.Timeout | null>(null)


  const handleTimerComplete = useCallback(() => {
 
    playSound()

    if ("Notification" in window && Notification.permission === "granted") {
      const message =
        timerState === "focus"
          ? "집중 시간이 끝났습니다! 휴식을 취하세요."
          : "휴식 시간이 끝났습니다! 다시 집중해보세요."
      new Notification("Flow Timer", { body: message })
    }

    let nextState: TimerState
    let nextTimeLeft: number
    let newCompletedCycles = completedCycles

    if (timerState === "focus") {
      newCompletedCycles = completedCycles + 1
      setCompletedCycles(newCompletedCycles)

      const isLongBreakNext = newCompletedCycles > 0 && newCompletedCycles % settings.sessionsPerCycle === 0

      if (isLongBreakNext) {
        nextState = "longBreak"
        nextTimeLeft = settings.longBreakTime * 60
      } else {
        nextState = "shortBreak"
        nextTimeLeft = settings.shortBreakTime * 60
      }
    } else {
      if (timerState === "longBreak") {
        onNewCycle()
      }
      nextState = "focus"
      nextTimeLeft = settings.focusTime * 60
    }

    setTimerState(nextState)
    setTimeLeft(nextTimeLeft)
    setTargetTime(Date.now() + nextTimeLeft * 1000)
    setIsRunning(true)

    if (isGroupMode && groupSession && currentUser?.isHost) {
      onGroupUpdate({
        timerState: nextState,
        timeLeft: nextTimeLeft,
        completedCycles: newCompletedCycles,
        isRunning: true,
      })
    }
  }, [
    timerState,
    completedCycles,
    settings,
    isGroupMode,
    groupSession,
    currentUser,
    onGroupUpdate,
    onNewCycle,
    playSound,
  ])

  useEffect(() => {
    if (isRunning && targetTime) {
      intervalRef.current = setInterval(() => {
        const newTimeLeft = Math.round((targetTime - Date.now()) / 1000)
        if (newTimeLeft <= 0) {
          setTimeLeft(0)
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
          }
          handleTimerComplete()
        } else {
          setTimeLeft(newTimeLeft)
        }
      }, 200)
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, targetTime, handleTimerComplete])

  const resetTimer = useCallback(() => {
    if (isGroupMode && currentUser && !currentUser.isHost) {
      toast({ title: "방장만 타이머를 리셋할 수 있습니다", variant: "destructive" })
      return
    }

    setIsRunning(false)
    setTimerState("focus")
    setTimeLeft(settings.focusTime * 60)
    setCompletedCycles(0)
    setTargetTime(null)
    onNewCycle()

    if (isGroupMode && groupSession && currentUser?.isHost) {
      onGroupUpdate({
        isRunning: false,
        timerState: "focus",
        timeLeft: settings.focusTime * 60,
        completedCycles: 0,
      })
    }
  }, [isGroupMode, currentUser, isRunning, timeLeft, groupSession, onGroupUpdate, playSound])


  const toggleTimer = useCallback(() => {
    if (isGroupMode && currentUser && !currentUser.isHost) {
      toast({ title: "방장만 타이머를 조작할 수 있습니다", variant: "destructive" })
      return
    }

    if (!isRunning && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }

    const newIsRunning = !isRunning
    setIsRunning(newIsRunning)

    if (newIsRunning) {
      playSound()
      setTargetTime(Date.now() + timeLeft * 1000)
    } else {
      setTargetTime(null)
    }

    if (isGroupMode && groupSession && currentUser?.isHost) {
      onGroupUpdate({ isRunning: newIsRunning })
    }
  }, [isGroupMode, currentUser, isRunning, timeLeft, groupSession, onGroupUpdate])

  const updateSettings = (newSettings: Partial<TimerSettings>) => {
    const updated = { ...settings, ...newSettings }
    setSettings(updated)

    if (!isRunning) {
      if (timerState === "focus") {
        setTimeLeft(updated.focusTime * 60)
      } else if (timerState === "shortBreak") {
        setTimeLeft(updated.shortBreakTime * 60)
      } else {
        setTimeLeft(updated.longBreakTime * 60)
      }
    }

    if (isGroupMode && groupSession && currentUser?.isHost) {
      onGroupUpdate({ settings: updated })
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getDynamicStyles = () => {
    switch (timerState) {
      case "shortBreak":
      case "longBreak":
        return {
          background: "bg-white",
          textColor: "text-green-600",
          fillColor: "bg-green-500",
        }
      case "focus":
      default:
        return {
          background: "bg-white",
          textColor: "text-red-600",
          fillColor: "bg-red-500",
        }
    }
  }

  return {
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
  }
}
