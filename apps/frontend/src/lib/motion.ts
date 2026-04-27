import type { Variants, Transition } from 'framer-motion';

export const springSoft: Transition = { type: 'spring', stiffness: 300, damping: 30, mass: 0.8 };
export const springSnappy: Transition = { type: 'spring', stiffness: 420, damping: 32, mass: 0.7 };
export const easeOutSoft: Transition = { duration: 0.4, ease: [0.22, 1, 0.36, 1] };

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: easeOutSoft },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: springSoft },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05, delayChildren: 0.04 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: easeOutSoft },
};

export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

export const springTap = {
  whileTap: { scale: 0.97 },
  transition: springSnappy,
};

export const springHoverLift = {
  whileHover: { y: -2 },
  transition: springSoft,
};
