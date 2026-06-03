import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CountdownOverlay = ({ tick }) => {
  if (tick === undefined || tick === null || tick < 0 || tick > 3) return null;

  // Decide colors and animation styles based on the current tick value
  let bgClass = '';
  let borderClass = '';
  let textLabel = '';
  let styleClass = '';

  if (tick === 3) {
    bgClass = 'bg-emerald-950/80 backdrop-blur-md';
    borderClass = 'border-emerald-500/50';
    textLabel = '3';
    styleClass = 'animate-vibrate text-emerald-400 drop-shadow-[0_0_35px_rgba(16,185,129,0.8)]';
  } else if (tick === 2) {
    bgClass = 'bg-amber-950/80 backdrop-blur-md';
    borderClass = 'border-amber-500/50';
    textLabel = '2';
    styleClass = 'animate-pulse text-amber-400 drop-shadow-[0_0_35px_rgba(245,158,11,0.8)]';
  } else if (tick === 1) {
    bgClass = 'bg-red-950/85 backdrop-blur-md';
    borderClass = 'border-red-500/50';
    textLabel = '1';
    styleClass = 'animate-flare text-red-500 drop-shadow-[0_0_50px_rgba(239,68,68,0.9)]';
  } else if (tick === 0) {
    bgClass = 'bg-brand-dark/90 backdrop-blur-lg';
    borderClass = 'border-indigo-500/50';
    textLabel = 'SOLD!';
    styleClass = 'text-indigo-400 font-extrabold scale-110 duration-200';
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center ${bgClass} transition-colors duration-300`}
      >
        <motion.div
          key={tick}
          initial={{ scale: 0.3, opacity: 0, rotate: -15 }}
          animate={{ 
            scale: [0.3, 1.2, 1], 
            opacity: 1, 
            rotate: 0,
            transition: { duration: 0.5, ease: 'easeOut' }
          }}
          exit={{ scale: 1.5, opacity: 0, transition: { duration: 0.3 } }}
          className={`flex flex-col items-center justify-center p-12 rounded-full border-4 ${borderClass} w-72 h-72 glass-card`}
        >
          <span className="text-sm font-semibold tracking-wider text-gray-400 uppercase mb-2">
            Closing Bid
          </span>
          <span className={`text-8xl font-black font-outfit select-none ${styleClass}`}>
            {textLabel}
          </span>
        </motion.div>
        
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1, transition: { delay: 0.2 } }}
          className="text-gray-300 mt-8 text-lg font-medium tracking-wide uppercase px-6 py-2 rounded-full bg-black/40 border border-white/5"
        >
          {tick === 0 ? "Bidding Closed" : "Final countdown in progress..."}
        </motion.p>
      </motion.div>
    </AnimatePresence>
  );
};

export default CountdownOverlay;
