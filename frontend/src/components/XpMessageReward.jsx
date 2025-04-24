import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { motion, AnimatePresence } from "framer-motion";
import { Star } from "lucide-react";

export function XpMessageReward({ xp, show, currentExp }) {
  const [visible, setVisible] = useState(false);
  const [totalExp, setTotalExp] = useState(currentExp || 0);

  useEffect(() => {
    if (show) {
      setVisible(true);
      setTotalExp((prev) => prev + xp);
      const timer = setTimeout(() => {
        setVisible(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, xp]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-100 px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
        >
          <Star className="h-5 w-5 text-amber-500" />
          <span className="font-medium">+{xp} XP for helping!</span>
          <span className="text-xs text-amber-700 dark:text-amber-300">
            (Total: {totalExp})
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

XpMessageReward.propTypes = {
  xp: PropTypes.number.isRequired,
  show: PropTypes.bool.isRequired,
  currentExp: PropTypes.number,
};

export default XpMessageReward;
