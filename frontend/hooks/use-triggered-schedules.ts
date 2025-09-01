"use client"

import { useState, useEffect, useCallback } from 'react';

const TRIGGERED_SCHEDULES_KEY = 'pomodoro-triggered-schedules-v1';

interface TriggeredData {
  date: string; // "YYYY-MM-DD"
  ids: string[];
}

export function useTriggeredSchedules() {
  const [triggeredIds, setTriggeredIds] = useState<string[]>([]);

  const getTodayString = () => new Date().toISOString().slice(0, 10);

  useEffect(() => {
    try {
      const storedData = localStorage.getItem(TRIGGERED_SCHEDULES_KEY);
      if (storedData) {
        const parsedData: TriggeredData = JSON.parse(storedData);
        // 저장된 데이터가 오늘 날짜이면 불러오고, 그렇지 않으면 오래된 데이터로 간주합니다.
        if (parsedData.date === getTodayString()) {
          setTriggeredIds(parsedData.ids);
        } else {
          // 새 날짜에 맞춰 오래된 데이터를 삭제합니다.
          localStorage.removeItem(TRIGGERED_SCHEDULES_KEY);
        }
      }
    } catch (error) {
      console.error("트리거된 스케줄을 불러오는 데 실패했습니다.", error);
    }
  }, []);

  const addTriggeredId = useCallback((scheduleId: string) => {
    const today = getTodayString();
    setTriggeredIds(prevIds => {
      const newIds = [...new Set([...prevIds, scheduleId])];
      const dataToStore: TriggeredData = { date: today, ids: newIds };
      localStorage.setItem(TRIGGERED_SCHEDULES_KEY, JSON.stringify(dataToStore));
      return newIds;
    });
  }, []);

  const hasBeenTriggeredToday = useCallback((scheduleId: string) => {
    return triggeredIds.includes(scheduleId);
  }, [triggeredIds]);

  return { hasBeenTriggeredToday, addTriggeredId };
}