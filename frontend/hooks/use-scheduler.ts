"use client"

import { useState, useEffect, useCallback } from 'react';
import type { Schedule } from '@/types';

const SCHEDULER_STORAGE_KEY = 'pomodoro-schedules-v1';

export function useScheduler() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  useEffect(() => {
    try {
      const storedSchedules = localStorage.getItem(SCHEDULER_STORAGE_KEY);
      if (storedSchedules) {
        setSchedules(JSON.parse(storedSchedules));
      }
    } catch (error) {
      console.error("스케줄을 불러오는 데 실패했습니다.", error);
    }
  }, []);

  const saveSchedules = useCallback((newSchedules: Schedule[]) => {
    try {
      setSchedules(newSchedules);
      localStorage.setItem(SCHEDULER_STORAGE_KEY, JSON.stringify(newSchedules));
    } catch (error) {
      console.error("스케줄을 저장하는 데 실패했습니다.", error);
    }
  }, []);

  const addSchedule = useCallback((newSchedule: Omit<Schedule, 'id'>) => {
    // 일부 모바일 브라우저에서 지원되지 않는 crypto.randomUUID()의 대체 기능
    const newId = Date.now().toString(36) + Math.random().toString(36).substring(2);
    const scheduleWithId = { ...newSchedule, id: newId };
    saveSchedules([...schedules, scheduleWithId]);
  }, [schedules, saveSchedules]);

  const updateSchedule = useCallback((updatedSchedule: Schedule) => {
    const newSchedules = schedules.map(s => s.id === updatedSchedule.id ? updatedSchedule : s);
    saveSchedules(newSchedules);
  }, [schedules, saveSchedules]);

  const deleteSchedule = useCallback((scheduleId: string) => {
    const newSchedules = schedules.filter(s => s.id !== scheduleId);
    saveSchedules(newSchedules);
  }, [schedules, saveSchedules]);

  return {
    schedules,
    addSchedule,
    updateSchedule,
    deleteSchedule,
  };
}