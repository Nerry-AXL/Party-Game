import { motion } from "framer-motion";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function AnimatedCard({ children, className = "", delay = 0 }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={`bg-card text-card-foreground rounded-3xl border shadow-lg overflow-hidden ${className}`}
    >
      {children}
    </motion.div>
  );
}
