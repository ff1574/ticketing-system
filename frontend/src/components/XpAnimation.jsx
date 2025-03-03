import { motion } from "framer-motion";
import { Award, Star } from "lucide-react";
import PropTypes from "prop-types";

export default function XpAnimation({ xp }) {
  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.5 }}
      transition={{
        duration: 0.5,
        type: "spring",
        stiffness: 200,
        damping: 20,
      }}
    >
      <div className="relative">
        <motion.div
          className="absolute inset-0 bg-primary/20 rounded-full blur-xl"
          animate={{ scale: [1, 1.5, 1], opacity: [0.7, 0.3, 0] }}
          transition={{ duration: 1.5, repeat: 1, repeatType: "loop" }}
        />
        <motion.div
          className="flex flex-col items-center justify-center bg-background rounded-xl p-6 shadow-lg border border-primary/20"
          animate={{ y: [0, -20, 0], rotateZ: [0, -5, 5, 0] }}
          transition={{ duration: 2, ease: "easeInOut" }}
        >
          <motion.div
            className="flex items-center gap-2 text-2xl font-bold text-primary mb-2"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: 1 }}
          >
            <Award className="h-8 w-8" />
            <span>+{xp} XP</span>
          </motion.div>
          <motion.div
            className="text-sm text-muted-foreground"
            animate={{ opacity: [0, 1] }}
            transition={{ delay: 0.5 }}
          >
            Ticket resolved successfully!
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}

XpAnimation.propTypes = {
  xp: PropTypes.number.isRequired,
};
