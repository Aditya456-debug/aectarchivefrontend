import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useState, useEffect } from 'react';

const LoginCard = ({ title, subtitle, icon, onClick, isSpecial, delay }) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // --- SMOOTH DAMPING CONFIG ---
  // useSpring use karne se mouse movement aur bhi "Liquid" ho jati hai
  const springConfig = { stiffness: 150, damping: 30, mass: 1.5 };
  const rotateX = useSpring(useTransform(y, [-100, 100], isMobile ? [10, -10] : [22, -22]), springConfig);
  const rotateY = useSpring(useTransform(x, [-100, 100], isMobile ? [-10, 10] : [-22, 22]), springConfig);

  const handleMouseMove = (event) => {
    if (isMobile) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(event.clientX - centerX);
    y.set(event.clientY - centerY);
  };

  return (
    <motion.div 
      className="w-full max-w-[320px] xs:max-w-[350px] md:max-w-[380px] lg:max-w-[400px] px-2 sm:px-4 relative group"
      // --- CINEMATIC ENTRY ANIMATION ---
      initial={{ opacity: 0, y: 40, scale: 0.8, filter: "blur(10px)" }}
      whileInView={{ 
        opacity: 1, 
        y: 0, 
        scale: 1, 
        filter: "blur(0px)",
      }}
      viewport={{ once: true }}
      transition={{ 
        duration: 1.2, 
        delay: delay, 
        ease: [0.16, 1, 0.3, 1] // Custom quintic ease-out for that "premium" feel
      }}
      style={{ perspective: 1200 }}
    >
      {/* --- CONTINUOUS IDLE FLOAT --- */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ 
          duration: 5, 
          repeat: Infinity, 
          ease: "easeInOut",
          delay: delay 
        }}
      >
        <motion.div
          onMouseMove={handleMouseMove}
          onMouseLeave={() => { x.set(0); y.set(0); setIsPressed(false); }}
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          className="w-full h-full relative"
        >
          {/* Dynamic Aura */}
          <div className={`absolute inset-0 bg-[#00ff41]/5 blur-[60px] rounded-full transition-opacity duration-1000 pointer-events-none ${isPressed ? 'opacity-100' : 'opacity-40'}`} />

          <button 
            onClick={onClick}
            onPointerDown={() => setIsPressed(true)}
            onPointerUp={() => setIsPressed(false)}
            onPointerCancel={() => setIsPressed(false)}
            className={`relative z-10 w-full rounded-[2.5rem] p-10 md:p-14 flex flex-col items-center justify-center transition-all duration-700 border-2 overflow-hidden
              ${isPressed 
                ? 'bg-[#00ff41]/20 border-[#00ff41] shadow-[0_0_80px_rgba(0,255,65,0.4)] scale-[0.96]' 
                : 'bg-[#050505]/95 backdrop-blur-3xl border-white/10 hover:border-[#00ff41]/60'}`}
          >
            
            {/* LAYER 1: HEAVY REVOLVING BEAM */}
            <div className="absolute inset-0 rounded-[2.5rem] p-[6px] md:p-[8px] overflow-hidden z-0">
              <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }} 
                className={`absolute inset-[-500%] bg-[conic-gradient(from_0deg,transparent,transparent,#00ff41,transparent,#00ff41,transparent)] transition-opacity duration-500
                  ${isPressed ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`} 
              />
            </div>

            {/* LAYER 2: GRID SYSTEM */}
            <div 
              className="absolute inset-0 z-0 opacity-[0.5] md:opacity-[0.6] pointer-events-none overflow-hidden" 
              style={{ 
                backgroundImage: `linear-gradient(to right, #00ff41 1.5px, transparent 1.5px), linear-gradient(to bottom, #00ff41 1.5px, transparent 1.5px)`,
                backgroundSize: '30px 30px',
                maskImage: 'radial-gradient(circle at center, black 50%, transparent 95%)'
              }} 
            >
               <motion.div 
                animate={{ y: ["-20%", "120%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute top-0 left-0 w-full h-[60px] bg-gradient-to-b from-transparent via-[#00ff41]/50 to-transparent z-10"
              />
            </div>
            
            <div className="absolute inset-[4px] md:inset-[6px] rounded-[2.3rem] bg-[#080808]/85 z-0" />

            {/* LAYER 3: FLOATING ICON */}
            <motion.div 
              style={{ translateZ: isMobile ? 60 : 150 }}
              animate={{ 
                y: [0, -8, 0],
                filter: ["drop-shadow(0 0 10px #00ff41)", "drop-shadow(0 0 30px #00ff41)", "drop-shadow(0 0 10px #00ff41)"]
              }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="text-7xl md:text-9xl mb-6 relative z-30 text-[#00ff41]/80"
            >
              {icon}
            </motion.div>

            <motion.div style={{ translateZ: isMobile ? 40 : 80 }} className="relative z-30 flex flex-col items-center">
              <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic text-white mb-2 drop-shadow-[0_0_15px_rgba(0,0,0,1)]">
                {title}
              </h2>
              <p className="text-[8px] md:text-[10px] text-white/70 font-mono tracking-[0.4em] text-center uppercase leading-relaxed mb-8 md:md-12 px-4 bg-black/60 backdrop-blur-md py-1 border border-[#00ff41]/20 rounded">
                {subtitle}
              </p>
            </motion.div>

            <div 
              style={{ translateZ: isMobile ? 30 : 50 }}
              className={`relative z-30 w-full py-4 md:py-6 border-2 rounded-xl md:rounded-2xl flex items-center justify-center text-[10px] md:text-[12px] font-black tracking-[0.8em] transition-all duration-300 overflow-hidden
              ${isPressed 
                ? 'bg-[#00ff41] text-black shadow-[0_0_50px_#00ff41]' 
                : 'border-[#00ff41]/20 text-[#00ff41] group-hover:bg-[#00ff41] group-hover:text-black'}`}
            >
              <span className="relative z-10 italic uppercase font-black">ACCESS</span>
            </div>
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

const SelectionMenu = ({ onSelect }) => {
  return (
    <div className="z-[500] relative flex flex-col items-center justify-start w-full min-h-screen overflow-hidden bg-[#010101] py-12 md:py-24">
      
      {/* Universal Grid Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.08] z-0" 
           style={{ backgroundImage: `radial-gradient(#00ff41 1.2px, transparent 1.2px)`, backgroundSize: '40px 40px' }} 
      />

      {/* Header with Smooth Fade-in */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="text-center relative z-10 w-full mb-12 px-4"
      >
        <h3 className="text-[#00ff41] font-black uppercase italic text-[12px] sm:text-[16px] md:text-[20px] tracking-[0.5em] sm:tracking-[1.5em] md:tracking-[2.5em] opacity-50">
          Login_Portal_v6.X
        </h3>
        <div className="h-[2px] w-full max-w-[150px] sm:max-w-[300px] md:max-w-[500px] mx-auto mt-4 bg-gradient-to-r from-transparent via-[#00ff41] to-transparent shadow-[0_0_20px_#00ff41]" />
      </motion.div>

      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-12 md:gap-16 w-full max-w-[1400px] mx-auto items-center justify-items-center relative z-10 pb-32">
        <LoginCard title="Student" icon="Ω" subtitle="Neural nodes & archives" onClick={() => onSelect('student')} delay={0.2} />
        <LoginCard title="Faculty" icon="Ψ" subtitle="Admin command center" onClick={() => onSelect('faculty')} delay={0.4} />
        <LoginCard title="Admin" icon="Ξ" subtitle="Core override protocols" onClick={() => onSelect('admin-panel')} delay={0.6} />
      </div>

      {/* Fixed Footer with subtle pulse */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="fixed bottom-10 left-1/2 -translate-x-1/2 text-[#00ff41] text-[8px] md:text-[11px] tracking-[1em] md:tracking-[2em] uppercase z-10 text-center w-full italic pointer-events-none"
      >
        HANDSHAKE_ESTABLISHED // LINK_ACTIVE
      </motion.div>
    </div>
  );
};

export default SelectionMenu;