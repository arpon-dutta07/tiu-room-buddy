import { motion } from 'framer-motion';

interface PremiumLoaderProps {
  message?: string;
}

/**
 * A creative "building floors" loader that visually represents the room booking concept.
 * Floors light up sequentially to form a building silhouette, with a shimmer progress bar.
 */
const PremiumLoader = ({ message = 'Loading' }: PremiumLoaderProps) => {
  // 7 floors representing the building
  const floors = [
    { width: '60%' },
    { width: '70%' },
    { width: '75%' },
    { width: '80%' },
    { width: '85%' },
    { width: '90%' },
    { width: '100%' },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]"
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="flex flex-col items-center gap-8 z-10">
        {/* Building Animation */}
        <div className="relative flex flex-col items-center gap-[3px] w-32">
          {/* Antenna / Top spike */}
          <motion.div
            className="w-[3px] h-5 bg-primary/60 rounded-full mb-1"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.8, duration: 0.4, ease: "easeOut" }}
            style={{ transformOrigin: 'bottom' }}
          />
          
          {/* Floor bars - build from top to bottom */}
          {floors.map((floor, i) => (
            <motion.div
              key={i}
              className="relative h-3 rounded-sm overflow-hidden"
              style={{ width: floor.width }}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{
                delay: 0.1 * i,
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {/* Floor background */}
              <div className="absolute inset-0 bg-primary/15 dark:bg-primary/20 border border-primary/20 rounded-sm" />
              
              {/* Room windows lighting up */}
              <div className="absolute inset-0 flex items-center justify-evenly px-1">
                {Array.from({ length: 3 + i }).map((_, j) => (
                  <motion.div
                    key={j}
                    className="w-1.5 h-1.5 rounded-[1px] bg-primary/40"
                    animate={{
                      opacity: [0.2, 1, 0.2],
                      backgroundColor: [
                        'hsl(var(--primary) / 0.2)',
                        'hsl(var(--primary) / 0.8)',
                        'hsl(var(--primary) / 0.2)',
                      ],
                    }}
                    transition={{
                      duration: 1.8,
                      repeat: Infinity,
                      delay: (i * 0.15) + (j * 0.12),
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
            </motion.div>
          ))}

          {/* Ground / Base */}
          <motion.div
            className="w-full h-[2px] bg-primary/30 rounded-full mt-1"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.7, duration: 0.6, ease: "easeOut" }}
          />
        </div>

        {/* Brand text */}
        <div className="flex flex-col items-center gap-3">
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <span className="text-sm font-extrabold tracking-tight text-foreground font-display">
              Smart<span className="text-primary">Room</span>
            </span>
          </motion.div>

          {/* Progress bar with shimmer */}
          <div className="w-36 h-[3px] bg-muted/40 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary/0 via-primary to-primary/0 rounded-full"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              style={{ width: '50%' }}
            />
          </div>

          {/* Status text with animated dots */}
          <motion.div
            className="text-[10px] font-bold tracking-[0.25em] text-muted-foreground uppercase font-sans flex items-center gap-0.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            {message}
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, times: [0, 0.5, 1] }}
            >.</motion.span>
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.2, times: [0, 0.5, 1] }}
            >.</motion.span>
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.4, times: [0, 0.5, 1] }}
            >.</motion.span>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PremiumLoader;
