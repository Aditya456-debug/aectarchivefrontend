import { motion } from 'framer-motion';

const UniversalLoader = ({ mode = 'student' }) => {
  const isStudent = mode === 'student';
  const themeColor = isStudent ? '#22d3ee' : '#00ff41';
  const glowColor = isStudent ? 'rgba(34,211,238,0.5)' : 'rgba(0,255,65,0.5)';
  const label = isStudent ? 'SYNCING_NEURAL_VAULT' : 'RECONSTRUCTING_INTERFACE';
  const icon = isStudent ? 'Ω' : 'Ψ'; // Student ke liye Omega, Faculty ke liye Psi

  return (
    <motion.div 
      key="universal-loader"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ 
        opacity: 0, 
        scale: 5, // Screen ki taraf phat ke bahar aayega
        filter: "blur(20px)",
        transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } 
      }}
      className="fixed inset-0 z-[1000] bg-[#01080a] flex flex-col items-center justify-center font-mono"
    >
      <div className="relative flex items-center justify-center">
        {/* Outer Pulsing Glow */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-40 h-40 rounded-full"
          style={{ backgroundColor: themeColor, filter: 'blur(40px)', transform: 'translateZ(0)' }}
        />

        {/* The Omega/Psi Sign */}
        <motion.span
          animate={{ 
            scale: [0.9, 1.1, 0.9],
            filter: [`drop-shadow(0 0 10px ${themeColor})`, `drop-shadow(0 0 30px ${themeColor})`, `drop-shadow(0 0 10px ${themeColor})`]
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="text-8xl font-black italic relative z-10"
          style={{ color: themeColor, willChange: 'transform, filter', transform: 'translateZ(0)' }}
        >
          {icon}
        </motion.span>
      </div>

      <motion.span 
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="mt-16 text-[10px] tracking-[1.5em] font-black uppercase text-center"
        style={{ color: themeColor, textShadow: `0 0 10px ${glowColor}` }}
      >
        {label}
      </motion.span>
    </motion.div>
  );
};

export default UniversalLoader;