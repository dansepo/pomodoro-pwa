export type TimerState = "focus" | "break";

export interface TimerSettings {
  focusTime: number;
  breakTime: number;
  sessionsPerCycle: number;
}

export interface Schedule {
  id: string;
  days: number[];
  time: string; // "HH:MM"
  enabled: boolean;
  settings: TimerSettings;
  sound: string;
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
  id:string;
  name: string;
  isHost: boolean;
  lastSeen: number;
}

export interface GroupSession {
  id: string;
  hostId: string;
  timerState: TimerState;
  timeLeft: number;
  isRunning: boolean;
  completedCycles: number;
  settings: TimerSettings;
  members: GroupMember[];
  lastUpdate: number;
}