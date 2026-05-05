import { motion } from 'motion/react';
import { CheckCircle } from 'lucide-react';
import { useEffect } from 'react';

interface SuccessMessageProps {
  visible: boolean;
  onComplete: () => void;
}

export function SuccessMessage({ visible, onComplete }: SuccessMessageProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onComplete();
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [visible, onComplete]);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
    >
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center max-w-md relative overflow-hidden"
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          className="mb-4"
        >
          <div className="relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="absolute inset-0 bg-green-100 rounded-full"
            />
            <CheckCircle className="w-16 h-16 text-green-600 relative z-10" strokeWidth={2} />
          </div>
        </motion.div>

        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-xl font-semibold text-slate-900 mb-2"
        >
          Automation Saved!
        </motion.h3>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-sm text-slate-600 text-center"
        >
          Your scheduled summary settings have been updated successfully.
        </motion.p>

        {/* Confetti effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ x: '50%', y: '50%', opacity: 1, scale: 0 }}
              animate={{
                x: `${50 + (Math.random() - 0.5) * 100}%`,
                y: `${50 + (Math.random() - 0.5) * 100}%`,
                opacity: 0,
                scale: 1,
              }}
              transition={{ duration: 1, delay: 0.2 + Math.random() * 0.2, ease: 'easeOut' }}
              className="absolute w-2 h-2 rounded-full"
              style={{
                backgroundColor: ['#1565C0', '#4CAF50', '#FFC107', '#FF5722', '#9C27B0'][i % 5],
              }}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
