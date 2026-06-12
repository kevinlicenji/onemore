'use client';

import { motion } from 'motion/react';
import type { ReactElement, ReactNode } from 'react';

import { useIsDesktop } from '@/hooks/use-is-desktop';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

interface PageEnterProps {
  children: ReactNode;
}

/**
 * Subtle entrance animation for page content (desktop and mobile variants).
 */
export function PageEnter({ children }: PageEnterProps): ReactElement {
  const isDesktop = useIsDesktop();
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <>{children}</>;
  }

  if (isDesktop) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}
