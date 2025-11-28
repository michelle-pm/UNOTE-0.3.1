import React, { createContext, useContext, useState, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { useAuth } from './AuthContext';

export interface Step {
  target: string; // data-tour attribute value
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_STEPS: Step[] = [
  {
    target: 'header-title',
    title: 'Добро пожаловать в UNOTE!',
    content: 'Это ваше персональное пространство. Здесь вы можете управлять проектами, задачами и многим другим.',
    position: 'bottom',
  },
  {
    target: 'sidebar-toggle',
    title: 'Меню и Проекты',
    content: 'Здесь находится список ваших проектов. Также внизу меню есть настройки вашего аккаунта и кнопка выхода.',
    position: 'bottom',
  },
  {
    target: 'add-widget-btn',
    title: 'Создание виджетов',
    content: 'Нажмите кнопку "Виджет", чтобы добавить графики, таблицы, заметки, картинки и другие элементы на экран.',
    position: 'bottom',
  },
  {
    target: 'first-widget',
    title: 'Управление виджетом',
    content: 'Нажмите на три точки в углу любого виджета, чтобы изменить его, переименовать, скопировать или удалить. Потяните за правый нижний угол, чтобы изменить размер.',
    position: 'top',
  },
  {
    target: 'palette-button',
    title: 'Оформление',
    content: 'Задайте настроение проекту, выбрав цветовую гамму градиентов.',
    position: 'bottom',
  },
  {
    target: 'friends-button',
    title: 'Команда и Друзья',
    content: 'Добавляйте друзей для общения и совместной работы. Красный индикатор подскажет о новых сообщениях.',
    position: 'bottom',
  },
  {
    target: 'sidebar-profile',
    title: 'Ваш профиль',
    content: 'Нажмите на настройки в боковом меню, чтобы сменить аватарку, имя или пароль.',
    position: 'right',
  }
];

interface OnboardingContextType {
  isActive: boolean;
  currentStepIndex: number;
  currentStep: Step | null;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  startTour: () => void;
  totalSteps: number;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  // Pass user.uid to storage key so completion is tracked PER USER
  const [completed, setCompleted] = useLocalStorage('unote_tour_completed', false, user?.uid);
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Auto-start only if user exists and not completed
  useEffect(() => {
    if (user && !completed) {
        // Small delay to ensure UI is fully mounted
        const timer = setTimeout(() => {
             setIsActive(true);
        }, 1000);
        return () => clearTimeout(timer);
    }
  }, [user, completed]);

  const nextStep = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      finishTour();
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const skipTour = () => {
    finishTour();
  };

  const finishTour = () => {
    setIsActive(false);
    setCompleted(true);
    setTimeout(() => setCurrentStepIndex(0), 500);
  };

  const startTour = () => {
    setCompleted(false); // Reset completion status
    setCurrentStepIndex(0);
    setIsActive(true);
  };

  const value = {
    isActive,
    currentStepIndex,
    currentStep: TOUR_STEPS[currentStepIndex],
    nextStep,
    prevStep,
    skipTour,
    startTour,
    totalSteps: TOUR_STEPS.length
  };

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};