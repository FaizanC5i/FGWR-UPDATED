import { Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface AIRefreshLoadingOverlayProps {
  visible: boolean;
}

export function AIRefreshLoadingOverlay({ visible }: AIRefreshLoadingOverlayProps) {
  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="flex flex-col items-center">
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{
            rotate: {
              duration: 1.2,
              ease: 'easeInOut',
              repeat: Infinity,
            },
            scale: {
              duration: 1.2,
              ease: 'easeInOut',
              repeat: Infinity,
            },
          }}
          className="mb-4"
        >
          <Sparkles className="w-12 h-12 text-[#1565C0]" />
        </motion.div>

        <h3 className="text-sm font-semibold text-slate-900 mb-1">
          Generating AI Insights...
        </h3>

        <p className="text-xs text-slate-600">
          Fetching latest data from Power BI semantic model
        </p>
      </div>
    </motion.div>
  );
}
