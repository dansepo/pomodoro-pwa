import { useState, useEffect, useRef, useCallback } from "react"
import { toast } from "@/hooks/use-toast"
import type { GroupSession, GroupMember, TimerState, TimerSettings } from "@/components/pomodoro-timer"

const storage = {
  getSession: (id: string): GroupSession | null => {
    try {
      const data = localStorage.getItem(`group_session_${id}`)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error("Failed to parse group session from localStorage", error)
      return null
    }
  },
  saveSession: (session: GroupSession) => {
    localStorage.setItem(`group_session_${session.id}`, JSON.stringify(session))
  },
  removeSession: (id: string) => {
    localStorage.removeItem(`group_session_${id}`)
  },
}

export interface CreateSessionPayload {
  timerState: TimerState
  timeLeft: number
  isRunning: boolean
  completedCycles: number
  settings: TimerSettings
}

export function useGroupSession() {
  const [isGroupMode, setIsGroupMode] = useState(false)
  const [groupSession, setGroupSession] = useState<GroupSession | null>(null)
  const [currentUser, setCurrentUser] = useState<GroupMember | null>(null)
  const [joinCode, setJoinCode] = useState("")
  const [userName, setUserName] = useState("")
  const [isGroupSheetOpen, setIsGroupSheetOpen] = useState(false)
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const generateRoomCode = () => Math.random().toString(36).substring(2, 8).toUpperCase()

  const createGroupSession = useCallback(
    (payload: CreateSessionPayload) => {
      if (!userName.trim()) {
        toast({ title: "이름을 입력해주세요", variant: "destructive" })
        return
      }

      const roomCode = generateRoomCode()
      const userId = Math.random().toString(36).substring(2, 15)
      const user: GroupMember = { id: userId, name: userName, isHost: true, lastSeen: Date.now() }

      const session: GroupSession = {
        id: roomCode,
        hostId: userId,
        ...payload,
        members: [user],
        lastUpdate: Date.now(),
      }

      storage.saveSession(session)
      setGroupSession(session)
      setCurrentUser(user)
      setIsGroupMode(true)
      setIsGroupSheetOpen(false)

      toast({ title: `그룹 세션이 생성되었습니다! 코드: ${roomCode}` })
    },
    [userName],
  )

  const joinGroupSession = useCallback(() => {
    if (!userName.trim() || !joinCode.trim()) {
      toast({ title: "이름과 참여 코드를 입력해주세요", variant: "destructive" })
      return null
    }

    const session = storage.getSession(joinCode.toUpperCase())
    if (!session) {
      toast({ title: "존재하지 않는 세션입니다", variant: "destructive" })
      return null
    }

    const userId = Math.random().toString(36).substring(2, 15)
    const user: GroupMember = { id: userId, name: userName, isHost: false, lastSeen: Date.now() }

    session.members.push(user)
    session.lastUpdate = Date.now()
    storage.saveSession(session)

    setGroupSession(session)
    setCurrentUser(user)
    setIsGroupMode(true)
    setIsGroupSheetOpen(false)

    toast({ title: `${session.id} 세션에 참여했습니다!` })
    return session
  }, [userName, joinCode])

  const leaveGroup = useCallback(() => {
    if (groupSession && currentUser) {
      const session = storage.getSession(groupSession.id)
      if (session) {
        session.members = session.members.filter((member) => member.id !== currentUser.id)
        if (session.members.length === 0 || currentUser.isHost) {
          storage.removeSession(groupSession.id)
        } else {
          storage.saveSession(session)
        }
      }
    }

    setIsGroupMode(false)
    setGroupSession(null)
    setCurrentUser(null)
    setJoinCode("")
    toast({ title: "그룹 세션을 나갔습니다" })
  }, [groupSession, currentUser])

  const syncWithGroup = useCallback(() => {
    if (!groupSession || !currentUser) return

    const session = storage.getSession(groupSession.id)
    if (!session) {
      toast({ title: "세션이 종료되었습니다.", variant: "destructive" })
      leaveGroup()
      return
    }

    if (!session.members.find((m) => m.id === currentUser.id)) {
      toast({ title: "세션에서 제외되었습니다.", variant: "destructive" })
      leaveGroup()
      return
    }

    setGroupSession(session)
  }, [groupSession, currentUser, leaveGroup])

  useEffect(() => {
    if (isGroupMode && groupSession) {
      syncIntervalRef.current = setInterval(syncWithGroup, 2000)
    } else {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current)
    }
    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current)
    }
  }, [isGroupMode, groupSession, syncWithGroup])

  const updateGroupSession = useCallback(
    (updates: Partial<GroupSession>) => {
      if (!groupSession || !currentUser?.isHost) return
      const currentSession = storage.getSession(groupSession.id)
      if (!currentSession) return

      const updatedSession = { ...currentSession, ...updates, lastUpdate: Date.now() }
      storage.saveSession(updatedSession)
      setGroupSession(updatedSession)
    },
    [currentUser, groupSession],
  )

  const copyRoomCode = useCallback(() => {
    if (groupSession) {
      navigator.clipboard.writeText(groupSession.id)
      toast({ title: "방 코드가 복사되었습니다!" })
    }
  }, [groupSession])

  return {
    isGroupMode,
    groupSession,
    currentUser,
    userName,
    setUserName,
    joinCode,
    setJoinCode,
    isGroupSheetOpen,
    setIsGroupSheetOpen,
    createGroupSession,
    joinGroupSession,
    leaveGroup,
    copyRoomCode,
    updateGroupSession,
  }
}

