import type { LucideIcon } from 'lucide-react';
import { Dumbbell, History, Home, LayoutList, Settings } from 'lucide-react';

export interface NavItem {
  href: string;
  labelKey:
    | 'navDashboard'
    | 'navPrograms'
    | 'navWorkout'
    | 'navHistory'
    | 'navExercises'
    | 'navSettings';
  icon: LucideIcon;
  match: (route: string) => boolean;
}

/**
 * Desktop sidebar navigation (includes dedicated Exercises entry).
 */
export function buildNavItems(locale: string): NavItem[] {
  return [
    {
      href: `/${locale}/dashboard`,
      labelKey: 'navDashboard',
      icon: Home,
      match: (route) => route === 'dashboard',
    },
    {
      href: `/${locale}/programs`,
      labelKey: 'navPrograms',
      icon: LayoutList,
      match: (route) => route === 'programs' || route.startsWith('programs/'),
    },
    {
      href: `/${locale}/workouts/start`,
      labelKey: 'navWorkout',
      icon: Dumbbell,
      match: (route) => route === 'workouts/start',
    },
    {
      href: `/${locale}/history`,
      labelKey: 'navHistory',
      icon: History,
      match: (route) => route === 'history' || route.startsWith('history/'),
    },
    {
      href: `/${locale}/exercises`,
      labelKey: 'navExercises',
      icon: Dumbbell,
      match: (route) => route === 'exercises',
    },
    {
      href: `/${locale}/settings`,
      labelKey: 'navSettings',
      icon: Settings,
      match: (route) => route === 'settings',
    },
  ];
}

type MobileLabelKey = 'navDashboard' | 'navPrograms' | 'navWorkout' | 'navHistory' | 'navSettings';

interface MobileNavItem {
  href: string;
  labelKey: MobileLabelKey;
  match: (route: string) => boolean;
}

export interface GymPrimaryNavItem {
  href: string;
  labelKey: 'navDashboard' | 'navPrograms' | 'navWorkout' | 'navHistory';
  icon: LucideIcon;
  match: (route: string) => boolean;
  prominent?: boolean;
}

export interface GymMoreNavItem {
  href: string;
  labelKey: 'navExercises' | 'navSettings';
  icon: LucideIcon;
  match: (route: string) => boolean;
}

/**
 * Gym mobile primary thumb-zone tabs (workout is the prominent center action).
 */
export function buildGymPrimaryNavItems(locale: string): GymPrimaryNavItem[] {
  return [
    {
      href: `/${locale}/dashboard`,
      labelKey: 'navDashboard',
      icon: Home,
      match: (route) => route === 'dashboard',
    },
    {
      href: `/${locale}/programs`,
      labelKey: 'navPrograms',
      icon: LayoutList,
      match: (route) => route === 'programs' || route.startsWith('programs/'),
    },
    {
      href: `/${locale}/workouts/start`,
      labelKey: 'navWorkout',
      icon: Dumbbell,
      match: (route) => route === 'workouts/start',
      prominent: true,
    },
    {
      href: `/${locale}/history`,
      labelKey: 'navHistory',
      icon: History,
      match: (route) => route === 'history' || route.startsWith('history/'),
    },
  ];
}

/**
 * Secondary destinations opened from the gym “More” menu.
 */
export function buildGymMoreNavItems(locale: string): GymMoreNavItem[] {
  return [
    {
      href: `/${locale}/exercises`,
      labelKey: 'navExercises',
      icon: Dumbbell,
      match: (route) => route === 'exercises',
    },
    {
      href: `/${locale}/settings`,
      labelKey: 'navSettings',
      icon: Settings,
      match: (route) => route === 'settings',
    },
  ];
}

export function isGymMoreRouteActive(route: string): boolean {
  return route === 'exercises' || route === 'settings';
}

/**
 * Legacy mobile bottom nav — superseded by GymShell.
 */
export function buildMobileNavItems(locale: string): MobileNavItem[] {
  return [
    {
      href: `/${locale}/dashboard`,
      labelKey: 'navDashboard',
      match: (route) => route === 'dashboard',
    },
    {
      href: `/${locale}/programs`,
      labelKey: 'navPrograms',
      match: (route) => route === 'programs' || route.startsWith('programs/'),
    },
    {
      href: `/${locale}/workouts/start`,
      labelKey: 'navWorkout',
      match: (route) => route === 'workouts/start',
    },
    {
      href: `/${locale}/history`,
      labelKey: 'navHistory',
      match: (route) => route === 'history' || route.startsWith('history/'),
    },
    {
      href: `/${locale}/settings`,
      labelKey: 'navSettings',
      match: (route) => route === 'settings' || route === 'exercises',
    },
  ];
}
