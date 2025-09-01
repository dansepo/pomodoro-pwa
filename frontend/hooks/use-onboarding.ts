"use client"

import { useState, useEffect, useCallback } from 'react';

const ONBOARDING_KEY = 'pomodoro-onboarding-completed-v1';

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY) === 'true';
    if (!completed) {
      setShowOnboarding(true);
    }
  }, []);

  const completeOnboarding = useCallback(() => {
    try {
      localStorage.setItem(ONBOARDING_KEY, 'true');
      setShowOnboarding(false);
    } catch (error) {
      console.error("localStorage에서 온보딩 상태 업데이트 실패", error);
    }
  }, []);
  
  const startOnboarding = useCallback(() => {
    setShowOnboarding(true);
  }, []);

  return { 
    showOnboarding, 
    setShowOnboarding,
    completeOnboarding,
    startOnboarding,
  };
}