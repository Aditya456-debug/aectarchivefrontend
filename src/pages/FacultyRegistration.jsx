import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import axios from 'axios';

const FacultyRegistration = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // 💾 Form Data States
  const [facultyName, setFacultyName] = useState("");
  const [emailID, setEmailID] = useState("");
  const [password, setPassword] = useState("");
  const [coursesInput, setCoursesInput] = useState(""); // Ex: BCA, MCA

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  // 🔥 THE NEW ZERO-TRUST REGISTRATION LOGIC
  const handleRequestAccess = async (e) => {
    e.preventDefault();
    if (!facultyName || !emailID || !password || !coursesInput) return setError("ALL_FIELDS_REQUIRED");

    setLoading(true);
    setError("");

    const coursesArray = coursesInput.split(',').map(c => c.trim().toUpperCase()).filter(c => c);

    try {
      // Ye endpoint ek naya Mongoose document banayega with isAdminApproved: false
      const res = await axios.post(`${BACKEND_URL}/api/faculty/request-access`, {
        facultyName,
        emailID: emailID.toLowerCase(),
        password,
        courses: coursesArray,
        isAdminApproved: false // Sent to pending state
      });

      if (res.data.success) {
        setSuccess(true);
      }
    } catch (err) {
      setError(err.response?.data?.msg || "SYSTEM_ERROR: Request Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto font-mono flex flex-col items-center z-[600]">
      
      {/* ATMOSPHERIC DEPTH: ENERGY STREAMS */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-[3rem] opacity-40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,65,0.08)_0%,transparent_70%)]" />
        <motion.div 
          animate={{ backgroundPosition: ['0px 0px', '60px 60px'] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,#00ff41_1px,transparent_1px),linear-gradient(to_bottom,#00ff41_1px,transparent_1px)] bg-[size:60px_60px] [transform:perspective(500px)_rotateX(60deg)]" 
        />
      </div>

      <div className="relative z-10 w-full px-2 sm:px-6 py-6">
        <div className="text-center mb-8">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-2 mb-2">
            <div className="h-[1px] w-6 md:w-8 bg-gradient-to-r from-transparent to-[#00ff41]" />
            <span className="text-[#00ff41] text-[8px] md:text-[10px] tracking-[0.8em] font-bold uppercase whitespace-nowrap">Access_Request</span>
            <div className="h-[1px] w-6 md:w-8 bg-gradient-to-l from-transparent to-[#00ff41]" />
          </motion.div>
          <h1 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter uppercase leading-none drop-shadow-[0_0_20px_rgba(0,255,65,0.2)]">
            REQUEST <span className="text-[#00ff41]">UPLINK</span>
          </h1>
        </div>

        <div className="bg-[#020617]/90 backdrop-blur-xl border-2 border-[#00ff41]/20 rounded-[2rem] p-6 sm:p-10 shadow-[0_0_50px_rgba(0,255,65,0.1)] relative overflow-hidden w-full">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="absolute inset-[-100%] bg-[conic-gradient(from_0deg,transparent,transparent,#00ff41,transparent,transparent)] opacity-10 pointer-events-none" />

          <div className="relative z-10">
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center space-y-4 py-8">
                  <span className="text-6xl drop-shadow-[0_0_20px_rgba(0,255,65,0.8)]">🛡️</span>
                  <h3 className="text-2xl font-black text-[#00ff41] italic uppercase tracking-tighter">REQUEST_PENDING</h3>
                  <p className="text-[10px] uppercase font-black tracking-widest text-white/60 leading-relaxed">
                    Your access request has been forwarded to the Admin Command Center. You will be assigned a Faculty ID upon approval.
                  </p>
                </motion.div>
              ) : (
                <motion.form key="form" onSubmit={handleRequestAccess} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-col gap-5">
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] md:text-[10px] font-black tracking-widest text-[#00ff41]/80 uppercase">Legal_Name</label>
                    <input 
                      type="text" required placeholder="Dr. Victor Stark"
                      value={facultyName} onChange={(e) => setFacultyName(e.target.value.toUpperCase())}
                      className="w-full bg-white/5 border border-white/10 p-3 md:p-4 text-sm font-black text-white outline-none focus:border-[#00ff41] focus:bg-[#00ff41]/5 transition-all uppercase tracking-widest rounded-xl"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] md:text-[10px] font-black tracking-widest text-[#00ff41]/80 uppercase">Requested_Courses</label>
                    <input 
                      type="text" required placeholder="Ex: BCA, MCA, B.TECH"
                      value={coursesInput} onChange={(e) => setCoursesInput(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 p-3 md:p-4 text-sm font-black text-white outline-none focus:border-[#00ff41] transition-all rounded-xl placeholder:text-white/20 uppercase"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] md:text-[10px] font-black tracking-widest text-white/40 uppercase">Email_Address</label>
                    <input 
                      type="email" required placeholder="name@acet.org"
                      value={emailID} onChange={(e) => setEmailID(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 p-3 md:p-4 text-sm font-black text-white outline-none focus:border-[#00ff41] transition-all rounded-xl"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] md:text-[10px] font-black tracking-widest text-white/40 uppercase">Vault_Cipher (Password)</label>
                    <input 
                      type="password" required placeholder="••••••••"
                      value={password} onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 p-3 md:p-4 text-sm font-black text-white outline-none focus:border-[#00ff41] transition-all rounded-xl tracking-widest"
                    />
                  </div>

                  {error && <p className="text-red-500 text-[9px] font-black uppercase text-center tracking-widest">⚠ {error}</p>}

                  <button type="submit" disabled={loading} className="w-full py-4 mt-2 bg-[#00ff41] text-black font-black uppercase tracking-[0.4em] text-[10px] rounded-xl transition-all hover:scale-[1.02] shadow-[0_0_30px_rgba(0,255,65,0.3)]">
                    {loading ? "TRANSMITTING..." : "SUBMIT_REQUEST"}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-8 flex justify-center w-full">
          <button onClick={onBack} className="text-white/30 hover:text-white text-[9px] md:text-[10px] tracking-[0.5em] font-bold uppercase transition-all flex items-center gap-2 group">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity">&lt;</span> Return_To_Terminal
          </button>
        </div>
      </div>
    </div>
  );
};

export default FacultyRegistration;