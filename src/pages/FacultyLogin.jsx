import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import UniversalLoader from '../components/UniversalLoader';
import axios from 'axios'; // 🔥 Added for backend uplink

const FacultyLogin = ({ onBack, onLoginSuccess, onRegister }) => {
  const [isScanning, setIsScanning] = useState(true);
  const [renderInterface, setRenderInterface] = useState(false);

  // 🔥 NEW: AUTHENTICATION STATES
  const [formData, setFormData] = useState({ facultyID: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const BACKEND_URL = `http://${window.location.hostname}:5000`; // Ensure this matches your network

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsScanning(false);
      setTimeout(() => setRenderInterface(true), 300);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // 🔥 NEW: LOGIN LOGIC
  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await axios.post(`${BACKEND_URL}/api/faculty/login`, formData);
      if (res.data.success) {
        // Lock credentials in local storage
        localStorage.setItem('facultyToken', res.data.token);
        localStorage.setItem('facultyInfo', JSON.stringify(res.data.faculty));
        
        onLoginSuccess(); // Trigger Dashboard Transition
      }
    } catch (err) {
      setError(err.response?.data?.msg || "UPLINK_FAILED: Terminal Reject");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[600] w-full h-full bg-[#010101] flex items-start justify-center font-mono overflow-y-auto overflow-x-hidden no-scrollbar scroll-smooth">
      
      {/* 1. ATMOSPHERIC DEPTH: ENERGY STREAMS */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,65,0.12)_0%,transparent_70%)]" />
        <motion.div 
          animate={{ backgroundPosition: ['0px 0px', '60px 60px'] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#00ff41_1px,transparent_1px),linear-gradient(to_bottom,#00ff41_1px,transparent_1px)] bg-[size:60px_60px] [transform:perspective(500px)_rotateX(60deg)]" 
        />
      </div>

      <AnimatePresence mode="wait">
        {isScanning ? (
          <UniversalLoader mode="faculty" />
        ) : (
          renderInterface && (
            <motion.div 
              key="interface"
              initial={{ opacity: 0, scale: 0.7, filter: "blur(15px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 w-full max-w-6xl flex flex-col items-center px-6 py-12 md:py-24"
              style={{ willChange: 'transform, opacity' }}
            >
              {/* BACKGROUND DECOR: LARGE FLOATING Ψ */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.03]">
                <span className="text-[250px] sm:text-[400px] md:text-[600px] font-black text-[#00ff41] italic">Ψ</span>
              </div>

              {/* HEADER: GLITCH TITLES */}
              <div className="text-center mb-12 md:mb-24 relative w-full">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-2 md:gap-4 mb-2">
                  <div className="h-[1px] w-6 md:w-20 bg-gradient-to-r from-transparent to-[#00ff41]" />
                  <span className="text-[#00ff41] text-[8px] md:text-[10px] tracking-[0.5em] md:tracking-[1em] font-bold uppercase whitespace-nowrap">Archive_Access</span>
                  <div className="h-[1px] w-6 md:w-20 bg-gradient-to-l from-transparent to-[#00ff41]" />
                </motion.div>
                <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-white italic tracking-tighter uppercase leading-none drop-shadow-[0_0_30px_rgba(0,255,65,0.3)] break-words">
                  FACULTY <span className="text-[#00ff41]">LOGIN</span>
                </h1>
              </div>

              {/* THE CORE LAYOUT - WRAPPED IN FORM */}
              <form onSubmit={handleLogin} className="w-full flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-0 relative z-20">
                
                {/* LEFT: IDENTITY MODULE */}
                <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="w-full max-w-[400px] lg:w-[360px] group relative">
                  <div className="flex justify-between items-center mb-3 text-[#00ff41] px-2 opacity-60">
                    <span className="text-[10px] font-bold tracking-[0.5em] uppercase">Auth_Id</span>
                    <span className="text-[7px] opacity-30 font-mono italic hidden sm:block">SECURE_CHANNEL_A</span>
                  </div>
                  <div className="relative overflow-hidden">
                    <input 
                      type="text" 
                      required
                      value={formData.facultyID}
                      onChange={(e) => setFormData({...formData, facultyID: e.target.value.toUpperCase()})}
                      placeholder="ENTER_ID"
                      className="w-full bg-white/5 border-l-2 border-[#00ff41] p-5 md:p-6 text-xl md:text-3xl font-black text-white outline-none focus:bg-[#00ff41]/5 transition-all placeholder:text-white/5 uppercase italic tracking-tighter shadow-2xl relative z-10"
                    />
                    <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-[#00ff41] to-transparent opacity-20" />
                  </div>
                </motion.div>

                {/* CENTRAL CORE: THE CONNECTING SIGN */}
                <div className="relative mx-0 my-6 lg:mx-16 lg:my-0 flex items-center justify-center">
                  <div className="w-20 h-20 md:w-28 md:h-28 rounded-full border border-[#00ff41]/30 flex items-center justify-center relative bg-black">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-[-10px] md:inset-[-15px] border border-dashed border-[#00ff41]/20 rounded-full"
                    />
                    <motion.span 
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-4xl md:text-7xl font-black text-[#00ff41] italic drop-shadow-[0_0_15px_#00ff41]"
                    >
                      Ψ
                    </motion.span>
                  </div>
                  <div className="absolute -left-16 w-16 h-[1px] bg-[#00ff41]/20 hidden lg:block" />
                  <div className="absolute -right-16 w-16 h-[1px] bg-[#00ff41]/20 hidden lg:block" />
                </div>

                {/* RIGHT: SECURITY MODULE */}
                <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="w-full max-w-[400px] lg:w-[360px] group relative lg:text-right">
                  <div className="flex justify-between items-center mb-3 text-[#00ff41] px-2 opacity-60">
                    <span className="text-[10px] font-bold tracking-[0.5em] uppercase w-full lg:w-auto">Pass_Cipher</span>
                    <span className="text-[7px] opacity-30 font-mono italic hidden lg:block">ENCRYPTION: RSA_4K</span>
                  </div>
                  <div className="relative overflow-hidden">
                    <input 
                      type="password" 
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="••••••••"
                      className="w-full bg-white/5 border-r-2 border-[#00ff41] p-5 md:p-6 text-xl md:text-3xl font-black text-white outline-none focus:bg-[#00ff41]/5 transition-all placeholder:text-white/5 lg:text-right italic tracking-tighter shadow-2xl relative z-10"
                    />
                    <div className="absolute bottom-0 right-0 w-full h-[1px] bg-gradient-to-l from-[#00ff41] to-transparent opacity-20" />
                  </div>
                </motion.div>

                {/* Invisible Submit Button */}
                <button type="submit" className="hidden" />
              </form>

              {/* FOOTER: THE BREACH TRIGGER */}
              <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="mt-16 md:mt-32 w-full flex flex-col items-center gap-6">
                
                {/* 🔥 ERROR FEEDBACK */}
                <AnimatePresence>
                  {error && (
                    <motion.span 
                      initial={{ opacity: 0, y: -10 }} 
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-[10px] font-black uppercase tracking-[0.3em] drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                    >
                      ⚠ {error}
                    </motion.span>
                  )}
                </AnimatePresence>

                <motion.button 
                  type="button"
                  onClick={handleLogin}
                  disabled={loading}
                  whileHover={{ scale: 1.05, letterSpacing: "1.2em", backgroundColor: "#00ff41", color: "#000" }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full max-w-sm py-5 border border-[#00ff41] text-[#00ff41] font-black uppercase text-[10px] md:text-[11px] tracking-[0.6em] md:tracking-[0.8em] relative transition-all duration-500 shadow-[0_0_30px_rgba(0,255,65,0.1)] group/btn overflow-hidden z-20"
                >
                  <span className="relative z-10">{loading ? "DECRYPTING..." : "BREACH_INTERFACE"}</span>
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
                </motion.button>

                {/* 🔥 SETUP LINK */}
                <button 
                  onClick={onRegister}
                  className="text-[#00ff41]/60 hover:text-[#00ff41] text-[10px] tracking-[0.3em] md:tracking-[0.4em] uppercase font-bold transition-all flex items-center gap-2 group mt-4 z-20 relative"
                >
                  <span className="opacity-30 group-hover:opacity-100 transition-opacity">[</span> 
                  First_Time? Init_Vault 
                  <span className="opacity-30 group-hover:opacity-100 transition-opacity">]</span>
                </button>
                
                <button onClick={onBack} className="text-[#00ff41]/20 hover:text-[#00ff41] text-[9px] tracking-[0.8em] md:tracking-[1em] font-bold uppercase transition-all mt-4 z-20 relative">
                  // Terminate_Link
                </button>
              </motion.div>

              {/* FLOATING HUD DATA */}
              <div className="fixed bottom-6 left-6 md:bottom-10 md:left-10 text-[#00ff41] opacity-20 text-[7px] font-mono space-y-2 hidden sm:block uppercase pointer-events-none">
                  <div>&gt; Signal: Pure</div>
                  <div>&gt; Sync: 99.9%</div>
                  <div className="w-16 h-[1px] bg-current" />
              </div>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
};

export default FacultyLogin;