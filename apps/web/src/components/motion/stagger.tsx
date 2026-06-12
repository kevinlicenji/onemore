'use client';

import { cn } from '@onemore/ui';
import { motion } from 'motion/react';
import { createContext, useContext, type ReactElement, type ReactNode } from 'react';

import { useReducedMotion } from '@/hooks/use-reduced-motion';

interface StaggerGroupProps {
  children: ReactNode;
  className?: string;
  compact?: boolean;
  enabled?: boolean;
}

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
}

const StaggerCompactContext = createContext(false);

const desktopGroupVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const mobileGroupVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.03,
    },
  },
};

const desktopItemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

const mobileItemVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

/**
 * Staggers child entrance animations on lists and grids (desktop and mobile).
 */
export function StaggerGroup({
  children,
  className,
  compact = false,
  enabled = true,
}: StaggerGroupProps): ReactElement {
  const reducedMotion = useReducedMotion();

  if (!enabled || reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <StaggerCompactContext.Provider value={compact}>
      <motion.div
        className={className}
        initial="hidden"
        animate="visible"
        variants={compact ? mobileGroupVariants : desktopGroupVariants}
      >
        {children}
      </motion.div>
    </StaggerCompactContext.Provider>
  );
}

/**
 * Single child item for use inside StaggerGroup.
 */
export function StaggerItem({ children, className }: StaggerItemProps): ReactElement {
  const reducedMotion = useReducedMotion();
  const compact = useContext(StaggerCompactContext);

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={cn(className)}
      variants={compact ? mobileItemVariants : desktopItemVariants}
    >
      {children}
    </motion.div>
  );
}
