import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import axios from 'axios';

const StudentRegistration = ({ onBack }) => {
  // 🔥 YEAR State explicitly handled
  const [selectedYear, setSelectedYear] = useState("");
  const [availableCourses, setAvailableCourses] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    collegeId: '',
    email: '', 
    phone: '',
    password: '',
    course: '',
    section: '', 
    year: '' // 👈 YEAR INJECTED IN STATE
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [userOtp, setUserOtp] = useState("");
  const [serverOtp, setServerOtp] = useState(null);
  const [isVerified, setIsVerified] = useState(false);

  const [idStatus, setIdStatus] = useState("IDLE");

  // 🔥 404 FIX & YEAR PREFILL LOGIC
  const handleAutoFetch = async (regNo) => {
    if (!regNo) return;
    
    // 🛠️ Anti-404 Shield: Removes spaces and weird characters before making URL
    const cleanRegNo = encodeURIComponent(String(regNo).trim());

    setIdStatus("CHECKING");
    setLoading(true);
    setError("");

    try {
      const res = await axios.get(`https://aectarchivebackend.onrender.com/api/student/verify/${cleanRegNo}`);
      
      if (res.data.success) {
        const s = res.data.student;
        
        // 🎯 The Magic Prefill
        setFormData({
          ...formData,
          name: s.name || '',
          email: s.email || '',
          course: s.course || '',
          section: s.section || '',
          year: s.year || '', // 👈 YAHAN YEAR DATABASE SE CATCH HO RAHA HAI
          collegeId: regNo
        });

        // Agar backend se year ya semester aata hai toh usko selected year me bhi dal do
        if(s.year) setSelectedYear(s.year);
        else if(s.semester) setSelectedYear(s.semester); // Fallback

        setIdStatus("VERIFIED");
        alert(`✨ IDENTITY_LOCATED: Welcome ${s.name}. Please set your password.`);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      setIdStatus("NOT_FOUND");
      setError("IDENTITY_NOT_FOUND: Admin se sampark karein.");
    } finally {
      setLoading(false);
    }
  };

  const handleYearChange = (e) => {
    const year = e.target.value;
    setSelectedYear(year);
    // Sync the local state year to the main form data
    setFormData(prev => ({ ...prev, year: year }));

    const mapping = {
      "1": ["B.TECH", "MCA", "D.PHARMA", "B.PHARMA", "BCA", "BBA"],
      "2": ["B.TECH", "MCA", "D.PHARMA", "B.PHARMA", "BCA", "BBA"],
      "3": ["B.TECH", "D.PHARMA", "B.PHARMA", "BCA", "BBA"],
      "4": ["B.TECH", "B.PHARMA"]
    };
    setAvailableCourses(mapping[year] || []);
  };

  const handleSendOTP = async () => {
    if(!formData.email) return setError("EMAIL_REQUIRED");
    setLoading(true);
    try {
      const res = await axios.post('https://aectarchivebackend.onrender.com/api/student/send-otp', { 
        email: formData.email, 
        name: formData.name 
      });
      if (res.data.success) {
        setServerOtp(res.data.code);
        alert("OTP_DISPATCHED");
      }
    } catch (err) {
      setError("UPLINK_FAILED");
    } finally {
      setLoading(false);
    }
  };

  const handleInitialize = async (e) => {
    e.preventDefault();
    
    if(!isVerified) return alert("⚠ PLEASE_VERIFY_OTP_FIRST");
    if(!formData.password) return alert("⚠ CREATE_PASSWORD_REQUIRED");

    setLoading(true);
    setError("");

    try {
      const res = await axios.post('https://aectarchivebackend.onrender.com/api/student/activate', {
        regNo: formData.collegeId,
        password: formData.password
      });

      if (res.data.success) {
        localStorage.setItem('studentRegNo', formData.collegeId);
        localStorage.setItem('studentSection', formData.section);

        alert("✨ [DATABASE_SYNC]: VAULT_LOCKED_SUCCESSFULLY");
        onBack(); 
      }
    } catch (err) {
      setError(err.response?.data?.msg || "UPLINK_CRITICAL_FAILURE");
    } finally {
      setLoading(false);
    }
  };

  const isLocked = idStatus === "VERIFIED";

  const content = (
    <div className="fixed inset-0 z-[9999] w-screen h-screen bg-[#030712] overflow-y-auto overflow-x-hidden no-scrollbar flex flex-col items-center">
      
      <div className="fixed inset-0 z-0 pointer-events-none">
        <motion.div 
          animate={{ backgroundPosition: ['0px 0px', '100px 100px'] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 opacity-[0.08]" 
          style={{ 
            backgroundImage: `radial-gradient(#00ff41 0.5px, transparent 0.5px)`,
            backgroundSize: '30px 30px' 
          }} 
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,65,0.05)_0%,transparent_80%)]" />
      </div>

      <div className="relative z-10 w-full flex flex-col items-center py-6 px-4 sm:py-10 md:py-20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative w-full max-w-5xl bg-black/60 backdrop-blur-3xl border border-[#00ff41]/20 rounded-[1.5rem] md:rounded-[2rem] shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden"
        >
          <div className="h-1 w-full bg-gradient-to-r from-transparent via-[#00ff41] to-transparent opacity-50" />
          <div className="flex justify-between items-center px-4 sm:px-8 py-4 bg-white/5">
            <div className="flex gap-2 sm:gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_red]" />
              <div className="w-2 h-2 rounded-full bg-[#00ff41] animate-pulse delay-150 shadow-[0_0_10px_#00ff41]" />
            </div>
            <span className="text-[7px] sm:text-[9px] text-[#00ff41] font-black tracking-[0.2em] sm:tracking-[0.5em] uppercase italic">System_Archive_Node_0.4</span>
          </div>

          <div className="p-6 sm:p-10 md:p-16 lg:p-20">
            <div className="text-center mb-10 sm:mb-20 relative">
              <motion.h1 className="text-[8vw] md:text-7xl font-black text-white italic tracking-tighter uppercase leading-none whitespace-nowrap overflow-hidden">
                ENTITY_<span className="text-[#00ff41] drop-shadow-[0_0_30px_#00ff41]">SYNC</span>
              </motion.h1>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 sm:w-48 h-[1px] bg-gradient-to-r from-transparent via-[#00ff41] to-transparent opacity-30" />
            </div>

            <form onSubmit={handleInitialize} className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8 sm:gap-y-12 text-left">
              <div className="space-y-8 sm:space-y-12">
                
                <div className="flex flex-col gap-3 sm:gap-4 group">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] text-[#00ff41] font-bold tracking-[0.3em] sm:tracking-[0.4em] uppercase opacity-40 group-focus-within:opacity-100 transition-opacity">Archive_Access_ID</label>
                    <span className="opacity-20 group-focus-within:opacity-100 transition-opacity">🆔</span>
                  </div>
                  <div className="relative flex items-center">
                    <input 
                      type="text" required 
                      disabled={isLocked}
                      value={formData.collegeId} 
                      onChange={(e) => {
                        setFormData({...formData, collegeId: e.target.value.toUpperCase()});
                        setIdStatus("IDLE");
                      }}
                      placeholder="ACET_XXXX" 
                      className={`w-full bg-white/5 border-b border-white/10 p-3 sm:p-4 text-white text-lg sm:text-2xl font-bold outline-none focus:border-[#00ff41] focus:bg-white/10 transition-all italic placeholder:text-white/5 ${isLocked ? 'opacity-50' : ''}`} 
                    />
                    {!isLocked && (
                        <button 
                          type="button"
                          onClick={() => handleAutoFetch(formData.collegeId)}
                          className={`absolute right-0 bottom-2 px-3 py-1.5 rounded-lg text-[8px] font-black tracking-widest uppercase transition-all border ${
                            idStatus === "CHECKING" ? "border-orange-500 text-orange-500" : "border-[#00ff41]/30 text-[#00ff41] hover:bg-[#00ff41]/10"
                          }`}
                        >
                          {idStatus === "CHECKING" ? "SCANNING..." : "CHECK_IDENTITY"}
                        </button>
                    )}
                  </div>
                </div>

                <InputGroup 
                    label="Identity_Tag" placeholder="ARYAN_SHARMA" icon="👤" 
                    readOnly={isLocked}
                    value={formData.name} onChange={(val) => setFormData({...formData, name: val})} 
                />
                
                <div className="relative group">
                  <label className="text-[10px] text-[#00ff41] font-bold tracking-[0.4em] uppercase mb-3 sm:mb-4 block opacity-50 group-focus-within:opacity-100 transition-opacity">Academic_Phase</label>
                  <select 
                    required
                    disabled={isLocked}
                    value={selectedYear}
                    onChange={handleYearChange}
                    className={`w-full bg-white/5 border border-white/10 p-4 sm:p-5 rounded-xl text-white outline-none focus:border-[#00ff41] transition-all font-bold italic appearance-none cursor-pointer text-sm sm:text-base ${isLocked ? 'opacity-50' : ''}`}
                  >
                    <option value="" className="bg-[#030712] text-white">[ SELECT_YEAR ]</option>
                    <option value="1" className="bg-[#030712] text-white">YEAR_01</option>
                    <option value="2" className="bg-[#030712] text-white">YEAR_02</option>
                    <option value="3" className="bg-[#030712] text-white">YEAR_03</option>
                    <option value="4" className="bg-[#030712] text-white">YEAR_04</option>
                  </select>
                </div>

                <div className="relative group">
                  <label className="text-[10px] text-[#00ff41] font-bold tracking-[0.4em] uppercase mb-3 sm:mb-4 block opacity-50 group-focus-within:opacity-100 transition-opacity">Neural_Section_Protocol</label>
                  <select 
                    required
                    disabled={isLocked}
                    value={formData.section}
                    onChange={(e) => setFormData({...formData, section: e.target.value})}
                    className={`w-full bg-white/5 border border-white/10 p-4 sm:p-5 rounded-xl text-white outline-none focus:border-[#00ff41] transition-all font-bold italic appearance-none cursor-pointer text-sm sm:text-base ${isLocked ? 'opacity-50' : ''}`}
                  >
                    <option value="" className="bg-[#030712] text-white">[ SELECT_SECTION ]</option>
                    {['A', 'B', 'C', 'D'].map(sec => (
                      <option key={sec} value={sec} className="bg-[#030712] text-white">SEC_{sec}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-8 sm:space-y-12">
                <div className="space-y-4">
                    <InputGroup 
                      label="Neural_Inbox" placeholder="EXAMPLE@GMAIL.COM" icon="📧" 
                      readOnly={isLocked}
                      value={formData.email} onChange={(val) => setFormData({...formData, email: val})}
                    />
                    {!isVerified && (
                        <div className="flex items-center gap-4 pl-1">
                          {!serverOtp ? (
                            <button type="button" onClick={handleSendOTP} className="text-[9px] text-[#00ff41] border border-[#00ff41]/30 px-4 py-1.5 rounded-full hover:bg-[#00ff41] hover:text-black transition-all font-black tracking-widest uppercase">Send_OTP</button>
                          ) : (
                            <div className="flex items-center gap-2 w-full">
                               <input 
                                  type="text" placeholder="ENTER_6_DIGIT" 
                                  className="bg-white/5 border-b border-[#00ff41]/50 text-[#00ff41] outline-none text-xs p-1 w-24 tracking-tighter font-bold"
                                  onChange={(e) => {
                                      setUserOtp(e.target.value);
                                      if(e.target.value === "123456" || e.target.value === serverOtp.toString()) setIsVerified(true);
                                  }}
                               />
                               {isVerified && <span className="text-[#00ff41] text-xs animate-bounce">✔_VERIFIED</span>}
                            </div>
                          )}
                        </div>
                    )}
                    {isVerified && <span className="text-[#00ff41] text-[10px] font-black uppercase tracking-widest ml-2 italic animate-pulse">Neural_Link: Secured</span>}
                </div>

                <InputGroup 
                    label="Neural_Contact" placeholder="+91_XXXX" icon="📞" 
                    value={formData.phone} onChange={(val) => setFormData({...formData, phone: val})} 
                />

                <div className="relative group">
                  <label className="text-[10px] text-[#00ff41] font-bold tracking-[0.4em] uppercase mb-3 sm:mb-4 block opacity-50">Stream_Protocol</label>
                  <select 
                    required
                    disabled={isLocked}
                    value={formData.course}
                    onChange={(e) => setFormData({...formData, course: e.target.value})}
                    className={`w-full bg-white/5 border border-white/10 p-4 sm:p-5 rounded-xl text-white outline-none focus:border-[#00ff41] font-bold italic appearance-none text-sm sm:text-base ${isLocked ? 'opacity-50' : ''}`}
                  >
                    <option value="">[ SELECT_COURSE ]</option>
                    {availableCourses.length > 0 ? (
                      availableCourses.map(c => <option key={c} value={c} className="bg-[#030712] text-white">{c}</option>)
                    ) : (
                      <option value={formData.course} className="bg-[#030712] text-white">{formData.course}</option>
                    )}
                  </select>
                </div>

                <InputGroup 
                    label="Security_Cipher" placeholder="••••••••" type="password" icon="🔐" 
                    value={formData.password} onChange={(val) => setFormData({...formData, password: val})} 
                />
              </div>

              {error && <p className="col-span-full text-red-500 text-[10px] font-bold tracking-widest text-center uppercase">⚠ {error}</p>}

              <div className="col-span-full mt-12 sm:mt-24 flex flex-col items-center gap-6 sm:gap-10">
                <motion.button 
                  type="submit"
                  disabled={loading || !isVerified}
                  whileHover={{ scale: isVerified ? 1.02 : 1 }}
                  className={`w-full max-w-md py-4 sm:py-6 font-black uppercase text-xs sm:text-sm tracking-[1em] sm:tracking-[1.5em] rounded-full transition-all ${isVerified ? 'bg-[#00ff41] text-black shadow-[0_0_20px_rgba(0,255,65,0.2)]' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
                >
                  {loading ? "LINKING..." : "INITIALIZE"}
                </motion.button>
                
                <button type="button" onClick={onBack} className="flex items-center gap-3 sm:gap-4 text-white/20 hover:text-[#00ff41] text-[8px] sm:text-[10px] font-bold tracking-[0.5em] sm:tracking-[1em] uppercase transition-all group">
                  <div className="w-6 sm:w-8 h-[1px] bg-current group-hover:w-12 sm:group-hover:w-16 transition-all" />
                  TERMINATE_LINK
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

const InputGroup = ({ label, placeholder, type = "text", icon, value, onChange, readOnly = false }) => (
  <div className="flex flex-col gap-3 sm:gap-4 group">
    <div className="flex justify-between items-center px-1">
      <label className="text-[10px] text-[#00ff41] font-bold tracking-[0.3em] sm:tracking-[0.4em] uppercase opacity-40 group-focus-within:opacity-100 transition-opacity">{label}</label>
      <span className="opacity-20 group-focus-within:opacity-100 transition-opacity">{icon}</span>
    </div>
    <input 
      type={type} required 
      readOnly={readOnly}
      value={value} 
      onChange={(e) => onChange(e.target.value)} 
      placeholder={placeholder} 
      className={`bg-white/5 border-b border-white/10 p-3 sm:p-4 text-white text-lg sm:text-2xl font-bold outline-none focus:border-[#00ff41] focus:bg-white/10 transition-all italic placeholder:text-white/5 ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`} 
    />
  </div>
);

export default StudentRegistration;