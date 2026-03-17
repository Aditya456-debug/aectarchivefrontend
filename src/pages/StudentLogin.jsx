import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import UniversalLoader from '../components/UniversalLoader';
import axios from 'axios'; 

// FIXED: onLoginSuccess prop added to trigger dashboard transition
const StudentLogin = ({ onBack, onRegister, onLoginSuccess }) => {
  const [isSyncing, setIsSyncing] = useState(true);
  const [renderInterface, setRenderInterface] = useState(false); 

  // 🔥 LOGIN LOGIC STATES
  const [formData, setFormData] = useState({ collegeId: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔥 STICKLY UPDATED: Using your Network IP for mobile/desktop synchronization
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSyncing(false);
      setTimeout(() => setRenderInterface(true), 300);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // 🔥 LOGIN HANDLER (Backend Sync)
  const handleLogin = async (e) => {
    if (e) e.preventDefault(); // Handle both button click and form submit
    setLoading(true);
    setError("");

    try {
      const res = await axios.post(`${BACKEND_URL}/api/student/login`, formData);
      if (res.data.success) {
        localStorage.setItem('studentToken', res.data.token);
        localStorage.setItem('studentInfo', JSON.stringify(res.data.student));
        
        // 🔥 STRICT FIX: Backend uses 'collegeId'. Fallback to 'regNo' if needed.
        const idToStore = res.data.student.collegeId || res.data.student.regNo || "UNKNOWN_ID";
        // 🔥 STRICT FIX: Fallback to "A" if section is missing from DB record
        const sectionToStore = res.data.student.section || "A";

        localStorage.setItem('studentRegNo', idToStore);
        localStorage.setItem('studentSection', sectionToStore);

        onLoginSuccess(); 
      }
    } catch (err) {
      setError(err.response?.data?.msg || "AUTH_FAILED: Connection Denied");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[600] w-full h-full bg-[#01080a] flex items-start justify-center font-mono overflow-y-auto overflow-x-hidden no-scrollbar scroll-smooth">
      
      {/* 1. THE SQUARE GRID BACKGROUND */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ 
            backgroundPosition: ['0px 0px', '40px 40px'],
            scale: [1, 1.05, 1] 
          }}
          transition={{ 
            duration: 10, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute inset-[-10%] opacity-[0.15]" 
          style={{ 
            backgroundImage: `linear-gradient(to right, #22d3ee 1px, transparent 1px), linear-gradient(to bottom, #22d3ee 1px, transparent 1px)`,
            backgroundSize: '40px 40px' 
          }} 
        />
        
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#01080a_80%)]" />

        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: "100vh", opacity: 0 }}
            animate={{ 
              y: "-10vh", 
              opacity: [0, 0.4, 0],
            }}
            transition={{ 
              duration: Math.random() * 7 + 8, 
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 5 
            }}
            className="absolute w-[1.5px] h-[1.5px] bg-cyan-400 rounded-full blur-[0.5px] shadow-[0_0_8px_#22d3ee]"
            style={{ left: `${Math.random() * 100}%` }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {isSyncing ? (
          <UniversalLoader mode="student" />
        ) : (
          renderInterface && (
            <motion.div 
              key="interface"
              initial={{ opacity: 0, scale: 0.7, filter: "blur(15px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ 
                duration: 0.9, 
                ease: [0.22, 1, 0.36, 1] 
              }}
              className="relative z-10 w-full max-w-6xl flex flex-col items-center px-6 py-12 md:py-24"
              style={{ willChange: 'transform, opacity' }}
            >
              <div className="text-center mb-12 md:mb-24 relative w-full">
                <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-white italic tracking-tighter uppercase leading-none break-words">
                  STUDENT <span className="text-cyan-400 drop-shadow-[0_0_20px_#22d3ee]">VAULT</span>
                </h1>
                <div className="mt-4 flex items-center justify-center gap-2 md:gap-4 opacity-40">
                  <div className="h-[1px] w-6 md:w-12 bg-cyan-400" />
                  <span className="text-cyan-400 text-[8px] md:text-[10px] tracking-[0.4em] md:tracking-[1em] font-bold uppercase whitespace-nowrap">Archive_Link_Established</span>
                  <div className="h-[1px] w-6 md:w-12 bg-cyan-400" />
                </div>
              </div>

              <form onSubmit={handleLogin} className="w-full flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-0 relative">
                <motion.div 
                  initial={{ x: -50, opacity: 0 }} 
                  animate={{ x: 0, opacity: 1 }} 
                  transition={{ delay: 0.1 }}
                  className="w-full max-w-[400px] lg:w-[360px] group relative"
                >
                  <div className="flex justify-between items-center mb-3 text-cyan-400 px-2 opacity-60 group-focus-within:opacity-100 transition-opacity">
                    <span className="text-[10px] font-bold tracking-[0.4em] uppercase">&gt; ID_Node</span>
                    <span className="text-[7px] font-mono italic">SECURE_LINK</span>
                  </div>
                  <div className="relative overflow-hidden">
                    <input 
                      type="text" 
                      required
                      placeholder="STU_2026_XXXX"
                      value={formData.collegeId}
                      onChange={(e) => setFormData({...formData, collegeId: e.target.value.toUpperCase()})}
                      className="w-full bg-cyan-950/20 border border-cyan-400/30 p-5 md:p-6 text-xl md:text-2xl font-black text-white outline-none focus:border-cyan-400 focus:bg-cyan-400/5 transition-all placeholder:text-cyan-400/10 uppercase italic tracking-tighter shadow-2xl"
                    />
                    <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-cyan-400 group-focus-within:w-full transition-all duration-700 shadow-[0_0_15px_#22d3ee]" />
                  </div>
                </motion.div>

                <div className="relative mx-0 my-6 lg:mx-16 lg:my-0 flex items-center justify-center">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute w-32 h-32 md:w-40 md:h-40 border border-cyan-400/10 rounded-full border-dashed" 
                  />
                  <motion.div 
                    animate={{ rotate: -360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    className="absolute w-24 h-24 md:w-32 md:h-32 border border-cyan-400/20 rounded-full" 
                  />
                  <motion.span 
                    animate={{ scale: [1, 1.1, 1], filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="text-5xl md:text-7xl font-black text-cyan-400 italic z-10 drop-shadow-[0_0_20px_#00ffff]"
                  >
                    Ω
                  </motion.span>
                  <div className="absolute -left-16 w-16 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent hidden lg:block" />
                  <div className="absolute -right-16 w-16 h-[1px] bg-gradient-to-l from-transparent via-cyan-400/50 to-transparent hidden lg:block" />
                </div>

                <motion.div 
                  initial={{ x: 50, opacity: 0 }} 
                  animate={{ x: 0, opacity: 1 }} 
                  transition={{ delay: 0.1 }}
                  className="w-full max-w-[400px] lg:w-[360px] group relative lg:text-right"
                >
                  <div className="flex justify-between items-center mb-3 text-cyan-400 px-2 opacity-60 group-focus-within:opacity-100 transition-opacity">
                    <span className="text-[7px] font-mono italic hidden lg:block">ENC_MODE: SHA256</span>
                    <span className="text-[10px] font-bold tracking-[0.4em] uppercase w-full lg:w-auto">// Neural_Pin</span>
                  </div>
                  <div className="relative overflow-hidden">
                    <input 
                      type="password" 
                      required
                      placeholder="••••"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full bg-cyan-950/20 border border-cyan-400/30 p-5 md:p-6 text-xl md:text-2xl font-black text-white outline-none focus:border-cyan-400 focus:bg-cyan-400/5 transition-all placeholder:text-cyan-400/10 lg:text-right tracking-tighter shadow-2xl"
                    />
                    <div className="absolute bottom-0 right-0 w-0 h-[2px] bg-cyan-400 group-focus-within:w-full transition-all duration-700 shadow-[0_0_15px_#22d3ee]" />
                  </div>
                </motion.div>
                
                <button type="submit" className="hidden" />
              </form>

              <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-16 md:mt-24 w-full flex flex-col items-center gap-6"
              >
                <AnimatePresence>
                  {error && (
                    <motion.span 
                      initial={{ opacity: 0, y: -10 }} 
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-[9px] font-black uppercase tracking-widest"
                    >
                      ⚠ {error}
                    </motion.span>
                  )}
                </AnimatePresence>

                <motion.button 
                  type="button"
                  onClick={handleLogin} 
                  disabled={loading}
                  whileHover={{ scale: 1.05, letterSpacing: "1.2em", backgroundColor: "#22d3ee", color: "#000" }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full max-w-sm py-5 border-2 border-cyan-400 text-cyan-400 font-black uppercase text-[11px] tracking-[0.6em] md:tracking-[0.8em] relative transition-all duration-500 shadow-[0_0_40px_rgba(34,211,238,0.1)] group/btn overflow-hidden"
                >
                  <span className="relative z-10">{loading ? "Authenticating..." : "Enter_Sanctum"}</span>
                  <div className="absolute inset-0 bg-white opacity-0 group-hover/btn:opacity-20 transition-opacity" />
                </motion.button>

                <button 
                  onClick={onRegister}
                  className="text-cyan-400/60 hover:text-cyan-400 text-[10px] tracking-[0.3em] md:tracking-[0.4em] uppercase font-bold transition-all flex items-center gap-2 group"
                >
                  <span className="opacity-30 group-hover:opacity-100 transition-opacity">[</span> 
                  New_Entity? Create_Profile 
                  <span className="opacity-30 group-hover:opacity-100 transition-opacity">]</span>
                </button>
                
                <button 
                  onClick={onBack} 
                  className="group flex items-center gap-4 text-cyan-400/20 hover:text-cyan-400 text-[10px] tracking-[0.8em] md:tracking-[1em] font-bold uppercase transition-all mt-4"
                >
                  <div className="w-8 h-[1px] bg-current transition-all group-hover:w-12 md:group-hover:w-16" />
                  Terminate_Uplink
                </button>
              </motion.div>

            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentLogin;