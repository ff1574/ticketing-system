"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, BadgeCheck, BadgeAlert, BadgeX, BadgeInfo } from "lucide-react";
import { useAlert } from "@/context/AlertContext";
import { cn } from "@/lib/utils";

const alertVariants = {
  initial: { opacity: 0, y: -100, scale: 0.9 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20,
    },
  },
  exit: {
    opacity: 0,
    y: -100,
    scale: 0.9,
    transition: {
      duration: 0.2,
    },
  },
};

const icons = {
  success: <BadgeCheck className="h-5 w-5" />,
  error: <BadgeX className="h-5 w-5" />,
  info: <BadgeInfo className="h-5 w-5" />,
  warning: <BadgeAlert className="h-5 w-5" />,
};

const styles = {
  success:
    "bg-green-50 text-green-600 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-900",
  error:
    "bg-red-50 text-red-600 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900",
  info: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-900",
  warning:
    "bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-900",
};

export function Alert() {
  const { message, type, isVisible, hideAlert } = useAlert();

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
      <AnimatePresence>
        {isVisible && type && message && (
          <motion.div
            variants={alertVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(
              "rounded-lg border p-4 shadow-lg backdrop-blur-sm",
              styles[type]
            )}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">{icons[type]}</div>
              <div className="flex-1">
                <p className="text-sm font-medium">{message}</p>
              </div>
              <button
                onClick={hideAlert}
                className="flex-shrink-0 rounded-lg p-1 hover:bg-black/5 active:bg-black/10 transition-colors"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close alert</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
