import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';
import { motion, AnimatePresence } from 'framer-motion';
import SelectionMenu from './SelectionMenu';
import FacultyLogin from "../pages/FacultyLogin";
import FacultyRegistration from "../pages/FacultyRegistration"; 
import StudentLogin from "../pages/StudentLogin"; 
import StudentRegistration from "../pages/StudentRegistration"; 
import AdminPanel from "../pages/AdminPanel";
import FacultyDashboard from "../pages/FacultyDashboard";
import StudentDashboard from "../pages/StudentDashboard";
import NeuralScanner from './NeuralScanner'; // ✨ STICKLY ADDED: Scanner Engine

const PortalCore = ({ onReady }) => {
  const portalRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".portal-layer", 
        { scale: 0.4, opacity: 0, filter: "brightness(5) blur(30px)" }, 
        { scale: 1, opacity: 1, filter: "brightness(1) blur(0px)", duration: 1.2, stagger: 0.02, ease: "expo.out" }
      );

      const layers = [
        { el: ".ring-12", d: 60, rev: true }, { el: ".ring-11", d: 50 },
        { el: ".ring-10", d: 40, rev: true }, { el: ".ring-9", d: 30 },
        { el: ".ring-8", d: 25, rev: true }, { el: ".ring-7", d: 18 },
        { el: ".ring-6", d: 12, rev: true }, { el: ".ring-5", d: 8 },
        { el: ".ring-4", d: 4, rev: true }, { el: ".ring-3", d: 2 },
        { el: ".ring-2", d: 1.2 }, { el: ".ring-1", d: 0.8, rev: true }
      ];

      layers.forEach(layer => {
        gsap.to(layer.el, { rotation: layer.rev ? -360 : 360, duration: layer.d, repeat: -1, ease: "none" });
      });

      gsap.to(".portal-container", { scale: 1.04, duration: 2.5, repeat: -1, yoyo: true, ease: "sine.inOut" });
      gsap.fromTo(".scanner-laser", { y: -450, opacity: 0 }, { y: 450, opacity: 0.8, duration: 1.8, repeat: -1, yoyo: true, ease: "power2.inOut" });

      gsap.delayedCall(5, onReady);
    }, portalRef);

    return () => ctx.revert();
  }, [onReady]);

  return (
    <div ref={portalRef} className="portal-container relative flex items-center justify-center pointer-events-none scale-[0.3] sm:scale-[0.5] md:scale-[0.8] lg:scale-100 transition-all duration-700">
      <div className="scanner-laser absolute w-[1000px] h-[3px] bg-gradient-to-r from-transparent via-[#00ff41] to-transparent z-[100] shadow-[0_0_40px_#00ff41]" />
      <div className="ring-12 portal-layer absolute w-[940px] h-[940px] border border-[#00ff41]/5 rounded-full" />
      <div className="ring-11 portal-layer absolute w-[880px] h-[880px] border border-[#00ff41]/10 border-dotted rounded-full" />
      <div className="ring-10 portal-layer absolute w-[820px] h-[820px] border border-[#00ff41]/5 rounded-full" />
      <div className="ring-9 portal-layer absolute w-[760px] h-[760px] border border-[#00ff41]/20 border-dashed rounded-full" />
      <div className="ring-8 portal-layer absolute w-[700px] h-[700px] border-[6px] border-[#00ff41] rounded-full shadow-[0_0_80px_rgba(0,255,65,0.3)]" />
      <div className="ring-7 portal-layer absolute w-[620px] h-[620px] border-2 border-[#00ff41]/30 opacity-40" style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)' }} />
      <div className="ring-6 portal-layer absolute w-[560px] h-[560px] border-2 border-[#00ff41]/20" style={{ clipPath: 'polygon(25% 5%, 75% 5%, 95% 25%, 95% 75%, 75% 95%, 25% 95%, 5% 75%, 5% 25%)' }} />
      <div className="ring-5 portal-layer absolute w-[500px] h-[500px] flex items-center justify-center opacity-40">
        <svg viewBox="0 0 100 100" className="w-full h-full"><circle cx="50" cy="50" r="49" fill="none" stroke="#00ff41" strokeWidth="1" strokeDasharray="4 8" /></svg>
      </div>
      <div className="ring-4 portal-layer absolute w-[420px] h-[420px] flex items-center justify-center opacity-70 drop-shadow-[0_0_15px_#00ff41]">
        <svg viewBox="0 0 100 100" className="w-full h-full"><circle cx="50" cy="50" r="46" fill="none" stroke="#00ff41" strokeWidth="4" strokeDasharray="120" strokeLinecap="round" /></svg>
      </div>
      <div className="ring-3 portal-layer absolute w-[340px] h-[340px] flex items-center justify-center drop-shadow-[0_0_25px_#00ff41]">
        <svg viewBox="0 0 100 100" className="w-full h-full"><circle cx="50" cy="50" r="44" fill="none" stroke="#00ff41" strokeWidth="8" strokeDasharray="100 150" strokeLinecap="round" /></svg>
      </div>
      <div className="ring-2 portal-layer absolute w-64 h-64 border-2 border-dotted border-[#00ff41]/50 rounded-full" />
      <div className="ring-1 portal-layer absolute w-52 h-52 border-[4px] border-[#00ff41] rounded-full border-t-transparent border-b-transparent shadow-[0_0_30px_#00ff41]" />

      <div className="portal-layer relative z-[110] text-center px-10 py-6 md:px-16 md:py-10 bg-black/40 backdrop-blur-3xl border border-[#00ff41]/20 rounded-md shadow-[0_0_120px_rgba(0,0,0,1)]">
        <h1 className="text-3xl md:text-6xl font-black tracking-[0.4em] md:tracking-[0.6em] uppercase italic text-[#00ff41] drop-shadow-[0_0_25px_#00ff41]">ACET_ARCHIVE</h1>
        <div className="mt-4 flex flex-col items-center gap-2">
          <span className="text-[8px] md:text-[10px] tracking-[1.5em] md:tracking-[2em] text-[#00ff41] font-bold">ACTIVATE_PORTAL</span>
          <div className="text-[6px] md:text-[8px] text-[#00ff41]/40 animate-pulse mt-1 tracking-[0.5em]">QUANTUM_LINK_v4.0_ESTABLISHED</div>
        </div>
      </div>
    </div>
  );
};

const AcetHub = () => {
  const [stage, setStage] = useState('init');
  const [activeStudent, setActiveStudent] = useState(null);

  // ✨ SCANNER STATE: Strictly Added to manage Global Overlay
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleStudentLoginSuccess = () => {
    const savedData = localStorage.getItem('studentInfo');
    if (savedData) {
      setActiveStudent(JSON.parse(savedData));
    }
    setStage('student-dashboard');
  };

  // 📡 SCAN HANDLER: Logic for resonance verification
  const handleScanSuccess = (data) => {
    setIsScannerOpen(false);
    console.log("NEURAL_SYNC_DATA:", data);
    alert(`✨ RESONANCE_ESTABLISHED: Payload detected! \nData: ${data}`);
    // Future: Call markAttendance API with this data
  };

  const smoothTransition = {
    type: "spring",
    stiffness: 260,
    damping: 20,
    mass: 0.5
  };

  return (
    <div className="relative h-screen w-full bg-[#050505] font-mono selection:bg-[#00ff41] selection:text-black">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,65,0.05)_0%,transparent_70%)] pointer-events-none" />

      {/* --- CORNERS ANIMATION --- */}
      <AnimatePresence>
        {(stage === 'animating' || stage === 'selection') && (
          <motion.div 
            key="corners-wrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] pointer-events-none p-4 md:p-8"
          >
            <div className="relative w-full h-full">
               {[ 
                 "top-0 left-0 border-t-2 md:border-t-4 border-l-2 md:border-l-4", 
                 "top-0 right-0 border-t-2 md:border-t-4 border-r-2 md:border-r-4", 
                 "bottom-0 left-0 border-b-2 md:border-b-4 border-l-2 md:border-l-4", 
                 "bottom-0 right-0 border-b-2 md:border-b-4 border-r-2 md:border-r-4" 
               ].map((pos, i) => (
                <motion.div 
                  key={i}
                  animate={{ opacity: [0.3, 1, 0.3], boxShadow: ["0 0 10px rgba(0,255,65,0.2)", "0 0 40px rgba(0,255,65,0.8)", "0 0 10px rgba(0,255,65,0.2)"] }}
                  transition={{ duration: 0.4, repeat: Infinity, ease: "circIn", delay: i * 0.05 }}
                  className={`absolute w-12 h-12 md:w-28 md:h-28 border-[#00ff41] ${pos}`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 h-full w-full overflow-y-auto overflow-x-hidden no-scrollbar">
        <div className="min-h-full w-full flex flex-col items-center justify-center p-4">
          <AnimatePresence mode="wait">
            {stage === 'init' ? (
              <motion.div key="init" exit={{ opacity: 0, scale: 0.1, filter: "blur(30px)" }} transition={{ duration: 0.7, ease: "circIn" }} className="z-[200]">
                <button
                  onClick={() => setStage('animating')}
                  className="relative px-10 py-4 md:px-16 md:py-6 border-2 border-[#00ff41]/50 text-[#00ff41] font-black tracking-[0.4em] md:tracking-[0.8em] text-sm md:text-xl hover:bg-[#00ff41] hover:text-black transition-all duration-500 shadow-[0_0_20px_rgba(0,255,65,0.1)] group"
                >
                  <span className="relative z-10 italic">INITIATE_BREACH</span>
                  <div className="absolute inset-0 bg-[#00ff41] scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
                </button>
              </motion.div>
            ) : stage === 'animating' ? (
              <motion.div key="portal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="z-50 w-full flex justify-center">
                <PortalCore onReady={() => setStage('selection')} />
              </motion.div>
            ) : stage === 'selection' ? (
              <motion.div 
                key="selection" 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 1.1 }} 
                transition={smoothTransition}
                className="z-[300] w-full flex justify-center pt-20 pb-10"
              >
                <SelectionMenu onSelect={(type) => {
                  if(type === 'faculty') {
                    setStage('faculty-login');
                  } else if(type === 'admin-panel') {
                    setStage('admin-panel'); 
                  } else {
                    setStage('student-login'); 
                  }
                }} />
              </motion.div>
            ) : stage === 'faculty-login' ? (
              <motion.div 
                key="faculty-login" 
                initial={{ opacity: 0, x: -100 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: 100 }}
                transition={smoothTransition}
                className="z-[400] w-full flex justify-center pt-20 pb-10 px-4"
              >
                <FacultyLogin 
                  onBack={() => setStage('selection')} 
                  onLoginSuccess={() => setStage('faculty-dashboard')} 
                  onRegister={() => setStage('faculty-registration')} 
                />
              </motion.div>
            ) : stage === 'faculty-registration' ? (
              <motion.div 
                key="faculty-reg" 
                initial={{ opacity: 0, y: 100, filter: "blur(10px)" }} 
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} 
                exit={{ opacity: 0, y: 100, filter: "blur(10px)" }} 
                transition={{ ...smoothTransition, duration: 0.8 }}
                className="z-[400] w-full flex justify-center pt-20 pb-20 px-4"
              >
                <FacultyRegistration onBack={() => setStage('faculty-login')} />
              </motion.div>
            ) : stage === 'faculty-dashboard' ? (
              <motion.div 
                key="faculty-dashboard" 
                initial={{ opacity: 0, scale: 1.05 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.95 }} 
                transition={smoothTransition}
                className="z-[500] w-full h-full"
              >
                <FacultyDashboard />
              </motion.div>
            ) : stage === 'student-login' ? (
              <motion.div 
                key="student-login" 
                initial={{ opacity: 0, x: 100 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -100 }} 
                transition={smoothTransition}
                className="z-[400] w-full flex justify-center pt-20 pb-10 px-4"
              >
                <StudentLogin 
                  onBack={() => setStage('selection')} 
                  onRegister={() => setStage('student-registration')} 
                  onLoginSuccess={handleStudentLoginSuccess} 
                />
              </motion.div>
            ) : stage === 'student-dashboard' ? (
              <motion.div 
                key="student-dashboard" 
                initial={{ opacity: 0, scale: 1.05 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.95 }} 
                transition={smoothTransition}
                className="z-[600] w-full h-full"
              >
                {/* 🔥 LINKED: Passing onOpenScanner prop to Dashboard */}
                <StudentDashboard 
                  student={activeStudent} 
                  onOpenScanner={() => setIsScannerOpen(true)} 
                />
              </motion.div>
            ) : stage === 'student-registration' ? (
              <motion.div 
                key="student-reg" 
                initial={{ opacity: 0, y: 100, filter: "blur(10px)" }} 
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} 
                exit={{ opacity: 0, y: 100, filter: "blur(10px)" }} 
                transition={{ ...smoothTransition, duration: 0.8 }}
                className="z-[400] w-full flex justify-center pt-20 pb-20 px-4"
              >
                <StudentRegistration onBack={() => setStage('student-login')} />
              </motion.div>
            ) : stage === 'admin-panel' ? (
              <motion.div 
                key="admin-panel" 
                initial={{ opacity: 0, scale: 1.05 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.95 }} 
                transition={smoothTransition}
                className="z-[500] w-full h-full flex justify-center"
              >
                <AdminPanel onBack={() => setStage('selection')} />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      {/* --- 🛡️ GLOBAL OVERLAY: Neural Scanner (Highest Z-Index) --- */}
      <AnimatePresence>
        {isScannerOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[99999]"
          >
            <NeuralScanner 
              onScanSuccess={handleScanSuccess} 
              onClose={() => setIsScannerOpen(false)} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_3px]" />
    </div>
  );
};

export default AcetHub;