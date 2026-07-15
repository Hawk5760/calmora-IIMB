import { ReactNode } from "react";
import { motion } from "framer-motion";

interface AnimatedPageProps {
  children: ReactNode;
  className?: string;
}

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

const pageTransition = {
  type: "tween",
  ease: [0.25, 0.46, 0.45, 0.94],
  duration: 0.22,
};

export const AnimatedPage = ({ children, className }: AnimatedPageProps) => {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedPage;
