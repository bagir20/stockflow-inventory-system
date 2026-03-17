import { motion as Motion } from "framer-motion";

export default function PageTransition({ children }) {
  return (
    <Motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.99 }}
      transition={{
        duration: 0.35,
        ease: [0.22, 1, 0.36, 1],
      }}
      style={{
        flex: 1,
        minWidth: 0,
        willChange: "transform, opacity",
      }}
    >
      {children}
    </Motion.div>
  );
}