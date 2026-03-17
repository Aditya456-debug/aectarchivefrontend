import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios'; 
import useLiveSync from '../hooks/useLiveSync';

const StudentDashboard = () => {
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [viewSubjectNotes, setViewSubjectNotes] = useState(false);
  const [viewSubjectPYQ, setViewSubjectPYQ] = useState(false);
  
  const [viewFacultyList, setViewFacultyList] = useState(false);
  const [facultySearch, setFacultySearch] = useState("");
  const [selectedFacultyDetails, setSelectedFacultyDetails] = useState(null);
  const [feedback, setFeedback] = useState("");

  const [activeUnit, setActiveUnit] = useState("All");

  const [selectedPeriod, setSelectedPeriod] = useState(1);
  const [markingStatus, setMarkingStatus] = useState(null);

  const [uploadedNotes, setUploadedNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(true);

  const [viewAttendanceVault, setViewAttendanceVault] = useState(false);
  const [personalLedger, setPersonalLedger] = useState(null);
  const [ledgerSubject, setLedgerSubject] = useState("");
  const [ledgerMonth, setLedgerMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));

  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [isEnrolling, setIsEnrolling] = useState(false);

  // 🔥 QR Scanner Reference (Saves camera state)
  const scannerRef = useRef(null);

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const rawRegNo = localStorage.getItem('studentRegNo');
  const rawSection = localStorage.getItem('studentSection');

  const currentRegNo = (rawRegNo && rawRegNo !== "undefined") ? rawRegNo : "UNKNOWN_ID";
  const currentSection = (rawSection && rawSection !== "undefined") ? rawSection : "A";

  const fetchAvailableSubjects = async () => {
    try {
        const response = await axios.get(`${BACKEND_URL}/api/attendance/available-subjects`, {
            params: { section: currentSection }
        });
        if (response.data.success) {
            setAvailableSubjects(response.data.subjects);
        }
    } catch (err) {
        console.error("❌ [FETCH_SUBJECTS_ERROR]: Failed to load subjects.");
    }
  };

  const handleEnrollment = async (subject) => {
    if (isEnrolling) return;
    setIsEnrolling(true);
    try {
        const response = await axios.post(`${BACKEND_URL}/api/attendance/enroll-student`, {
            regNo: currentRegNo,
            subjectName: subject.subjectName,
            facultyEmail: subject.facultyEmail
        });

        if (response.data.success) {
            alert(`✅ ${response.data.msg}`);
            fetchPersonalLedger();
        }
    } catch (err) {
        alert("❌ [ENROLLMENT_FAILED]: Unable to connect to Vault.");
    } finally {
        setIsEnrolling(false);
    }
  };

  useEffect(() => {
      if (viewFacultyList) {
          fetchAvailableSubjects();
      }
  }, [viewFacultyList]);


  const filteredSubjects = availableSubjects.filter(sub => 
    sub.subjectName.toLowerCase().includes(facultySearch.toLowerCase())
  );

  const fetchNotesFromVault = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/notes/fetch-notes`);
      setUploadedNotes(response.data);
    } catch (err) {
      console.error("❌ [UPLINK_ERROR]: Failed to fetch notes");
    } finally {
      setLoadingNotes(false);
    }
  };

  const { isSyncing, syncNow } = useLiveSync(fetchNotesFromVault, 12000);

  const fetchPersonalLedger = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/attendance/personal-ledger`, {
        params: {
          regNo: currentRegNo,
          month: ledgerMonth
        }
      });
      if (response.data.success) {
        setPersonalLedger(response.data.subjects); 
        setViewAttendanceVault(true);
      }
    } catch (err) {
      alert("❌ [VAULT_ACCESS_DENIED]: Data Packets Not Found");
    }
  };

  const pyqData = [
    { id: "p1", unit: "2023", subject: "Physics", topic: "EndSem_Paper", faculty: "Exam_Cell", date: "03-Mar", fileUrl: "https://res.cloudinary.com/..." },
  ];

  const [selectedSubject, setSelectedSubject] = useState(null);
  const [currentPYQView, setCurrentPYQView] = useState('subjects');

  const uniqueSubjects = [...new Set(uploadedNotes.map(note => note.subject))];
  const uniquePYQSubjects = [...new Set(pyqData.map(note => note.subject))];

  const handleMarkAttendance = async (decodedData) => {
    try {
      setMarkingStatus("PROCESSING...");
      
      let qrPayload;
      try {
          qrPayload = JSON.parse(decodedData);
      } catch (e) {
          qrPayload = { subject: decodedData, email: "stark@acet.org" };
      }

      const response = await axios.post(`${BACKEND_URL}/api/attendance/mark-me`, {
        regNo: currentRegNo, 
        facultyEmail: qrPayload.email || "stark@acet.org", 
        subjectName: qrPayload.subject || "GENERAL_LECTURE",
        period: selectedPeriod
      });

      if (response.data.success) {
        setMarkingStatus("SUCCESS: ATTENDANCE_LOCKED");
        alert(`✅ [SYNC_COMPLETE]: Attendance marked for ${qrPayload.subject || 'Lecture'}!`);
      }
    } catch (err) {
      setMarkingStatus("DENIED: " + (err.response?.data?.msg || "ERROR"));
    }
  };

  // 🔥 [NEW SCANNER LOGIC]: Triggers automatically when `isScanning` turns true and DOM is ready
  useEffect(() => {
    if (isScanning && !markingStatus) {
      // Small delay ensures the div with id="reader" is fully rendered by React
      const timer = setTimeout(() => {
        try {
          const html5QrCode = new Html5Qrcode("reader");
          scannerRef.current = html5QrCode;

          html5QrCode.start(
            { facingMode: "environment" },
            { fps: 15, qrbox: { width: 250, height: 250 } },
            (decodedText) => {
              // ON SUCCESSFUL SCAN
              setScanResult(decodedText);
              
              if (navigator.vibrate) navigator.vibrate(100);

              // Stop camera immediately after successful read
              html5QrCode.stop().then(() => {
                scannerRef.current = null;
                setIsScanning(false);
                handleMarkAttendance(decodedText);
              }).catch(err => console.log("Stop failed", err));
            },
            (errorMessage) => {
              // Ignore typical frame reading errors, they happen continuously
            }
          ).catch((err) => {
            console.error("Camera start failed:", err);
            setMarkingStatus("DENIED: CAMERA_ACCESS_FAILED");
          });
        } catch (err) {
           console.error("Scanner setup error:", err);
        }
      }, 500);

      return () => clearTimeout(timer);
    }

    // Cleanup: Force stop camera if component unmounts or state changes
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(e => console.log("Force stop failed", e));
        scannerRef.current = null;
      }
    };
  }, [isScanning, markingStatus]); // Runs when scanning starts or status changes

  // Action handler for the button
  const initiateScanSequence = () => {
    setMarkingStatus(null);
    setScanResult(null);
    setIsScanning(true); // This triggers the useEffect above
  };

  // Safe manual terminate button
  const handleTerminateScan = () => {
      if (scannerRef.current) {
          scannerRef.current.stop().then(() => {
              scannerRef.current = null;
              setIsScanning(false);
              setMarkingStatus(null);
          }).catch(() => {
             setIsScanning(false);
             setMarkingStatus(null);
          });
      } else {
          setIsScanning(false);
          setMarkingStatus(null);
      }
  };


  return (
    <div className="min-h-screen bg-[#020617] text-cyan-400 font-mono p-3 md:p-10 pb-32 overflow-x-hidden text-left selection:bg-cyan-500/30">
      
      {/* --- HEADER WITH SYNC PROTOCOL --- */}
      <header className="fixed top-0 left-0 w-full p-4 md:p-6 border-b-4 border-[#00ff41]/20 bg-black/60 backdrop-blur-xl flex justify-between items-center z-[100]">
        <div className="flex flex-col text-left">
          <span className="text-[10px] md:text-[12px] font-black tracking-[0.3em] uppercase text-white italic">Ω_STUDENT_NODE</span>
          <div className="flex items-center gap-3 mt-1">
            
            {/* Live Sync Status Indicator */}
            <div className="flex items-center gap-1.5">
               <div className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-orange-500 animate-spin' : 'bg-[#00ff41] animate-pulse'}`} />
               <span className="text-[6px] md:text-[7px] opacity-60 tracking-widest uppercase italic text-[#00ff41]">
                 {isSyncing ? 'Syncing_Core...' : 'Unit_Sync: Active'}
               </span>
            </div>

            {/* Manual Sync Button */}
            {!viewAttendanceVault && !viewFacultyList && !viewSubjectNotes && !viewSubjectPYQ && (
               <button 
                 onClick={syncNow}
                 disabled={isSyncing}
                 className={`text-[6px] font-black px-2 py-0.5 rounded-full border transition-all ${
                   isSyncing ? 'text-orange-500 border-orange-500/20' : 'text-[#00ff41] border-[#00ff41]/20 hover:bg-[#00ff41] hover:text-black'
                 }`}
               >
                 SYNC_VAULT
               </button>
            )}
            
          </div>
        </div>
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl border-4 border-[#00ff41]/40 flex items-center justify-center bg-[#00ff41]/5 shadow-[0_0_15px_#00ff41]">
          <span className="text-lg md:text-xl font-black italic text-[#00ff41]">Ω</span>
        </div>
      </header>

      <div className="mt-20 md:mt-28 max-w-7xl mx-auto w-full flex flex-col gap-6 md:gap-8">
        
        <AnimatePresence mode="wait">
          {viewAttendanceVault ? (
            <motion.div key="attendance-vault" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-8">
                <div className="flex justify-between items-center border-l-4 border-[#00ff41] pl-6">
                    <div>
                        <h3 className="text-2xl md:text-4xl font-black italic uppercase text-white tracking-tighter">Attendance_<span className="text-[#00ff41]">Vault</span></h3>
                        <p className="text-[10px] opacity-40 uppercase tracking-widest">LIVE_DATA_FEED // {ledgerMonth} 2025</p>
                    </div>
                    <button onClick={() => setViewAttendanceVault(false)} className="text-[10px] font-black border-2 border-white/20 px-6 py-2 rounded-full hover:bg-white hover:text-black transition-all">TERMINATE_VIEW</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#00ff41]/5 border border-[#00ff41]/20 p-6 rounded-3xl text-center">
                        <p className="text-[10px] font-black uppercase text-white/40 mb-2">Enrolled_Modules</p>
                        <p className="text-4xl font-black text-white">{personalLedger?.length || 0}</p>
                    </div>
                    <div className="bg-[#00ff41]/5 border border-[#00ff41]/20 p-6 rounded-3xl text-center">
                        <p className="text-[10px] font-black uppercase text-white/40 mb-2">Vault_Status</p>
                        <p className="text-4xl font-black text-[#00ff41]">SYNCED</p>
                    </div>
                    <div className="bg-[#00ff41]/10 border-2 border-[#00ff41] p-6 rounded-3xl text-center shadow-[0_0_20px_rgba(0,255,65,0.2)]">
                        <p className="text-[10px] font-black uppercase text-black bg-[#00ff41] px-2 py-0.5 rounded inline-block mb-2">Neural_Link</p>
                        <p className="text-4xl font-black text-white">ACTIVE</p>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden">
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left font-mono border-collapse">
                            <thead>
                                <tr className="bg-[#00ff41]/10 text-[#00ff41] text-[9px] uppercase font-black tracking-widest border-b border-[#00ff41]/20">
                                    <th className="p-6 border-r border-[#00ff41]/10 min-w-[200px]">Subject_&_Faculty</th>
                                    <th className="p-4 text-center border-r border-[#00ff41]/10 min-w-[80px]">Stats</th>
                                    {[...Array(31)].map((_, i) => (
                                        <th key={i} className="p-4 text-center border-r border-[#00ff41]/10 min-w-[50px]">{i + 1}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {personalLedger && personalLedger.length > 0 ? personalLedger.map((sub, sIdx) => (
                                    <tr key={sIdx} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-6 border-r border-white/10">
                                            <div className="flex flex-col">
                                                <span className="text-white text-xs font-black uppercase italic tracking-tighter">{sub.subjectName}</span>
                                                <span className="text-[#00ff41] text-[9px] font-black opacity-50">{sub.facultyName}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 border-r border-white/10 text-center">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-white text-[10px] font-black">{sub.percentage}</span>
                                                <span className="text-[7px] text-white/30 uppercase">{sub.presentClasses}/{sub.totalClasses}</span>
                                            </div>
                                        </td>
                                        {[...Array(31)].map((_, i) => {
                                            const dayRecord = sub.ledger?.find(l => parseInt(l.date.split('/')[0]) === (i + 1));
                                            return (
                                                <td key={i} className="p-4 text-center border-r border-white/10 font-black text-sm">
                                                    {dayRecord ? (
                                                        <span className={dayRecord.status === 'P' ? 'text-[#00ff41] drop-shadow-[0_0_8px_#00ff41]' : 'text-red-500'}>
                                                            {dayRecord.status}
                                                        </span>
                                                    ) : <span className="opacity-10">-</span>}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="33" className="p-20 text-center opacity-20 uppercase font-black tracking-widest text-xs">No_Enrollment_Packets_Detected</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </motion.div>
          ) : selectedFacultyDetails ? (
            <motion.div key="teacher-view" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-10">
                <div className="flex justify-between items-center border-l-4 border-[#f87171] pl-6">
                    <div>
                        <h3 className="text-2xl md:text-4xl font-black italic uppercase text-white tracking-tighter">{selectedFacultyDetails.name}</h3>
                        <p className="text-[10px] opacity-40 uppercase tracking-widest">Active_Course: {selectedFacultyDetails.subject}</p>
                    </div>
                    <button onClick={() => setSelectedFacultyDetails(null)} className="text-[10px] font-black border-2 border-white/20 px-6 py-2 rounded-full hover:bg-white hover:text-black transition-all">BACK</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4 text-left">
                        <h4 className="text-[10px] font-black uppercase text-[#00ff41] tracking-[0.3em]">Lecture_Archives</h4>
                        {(selectedFacultyDetails.lectures || []).map(lec => (
                            <div key={lec.id} className="bg-white/5 border border-white/10 p-4 rounded-xl">
                                <h5 className="text-xs font-black text-white uppercase italic">{lec.topic}</h5>
                                <p className="text-[8px] text-white/20 mt-1 uppercase">Date: {lec.date} // Unit: {lec.unit}</p>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-4 text-left">
                        <h4 className="text-[10px] font-black uppercase text-cyan-400 tracking-[0.3em]">Submit_Feedback</h4>
                        <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows="4" placeholder="TYPE_REVIEW..." className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-cyan-400 text-[10px] font-black uppercase resize-none text-white" />
                        <button className="w-full py-3 bg-cyan-400 text-black font-black rounded-xl text-[9px] shadow-[0_0_15px_rgba(34,211,238,0.2)] uppercase tracking-widest">TRANSMIT_REVIEW</button>
                    </div>
                </div>
            </motion.div>
          ) : viewFacultyList ? (
            <motion.div key="faculty-vault" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-2 border-cyan-400/20 pb-4">
                    <h3 className="text-2xl md:text-4xl font-black italic uppercase text-white tracking-tighter">Your_<span className="text-[#f87171]">Faculty</span></h3>
                    <div className="flex gap-4 w-full md:w-auto">
                        <input type="text" placeholder="SEARCH_BY_SUBJECT..." value={facultySearch} onChange={(e) => setFacultySearch(e.target.value)} className="bg-white/5 border-2 border-[#f87171]/30 rounded-full px-6 py-2 text-[10px] font-black outline-none focus:border-[#f87171] transition-all w-full md:w-64 placeholder:opacity-20 text-white" />
                        <button onClick={() => {setViewFacultyList(false); setFacultySearch("");}} className="text-cyan-400 text-[8px] md:text-[10px] font-black border-2 border-cyan-400/50 px-4 py-2 md:py-1.5 rounded-full hover:bg-cyan-400/10 active:scale-95 transition-all text-center tracking-widest">CLOSE</button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSubjects.length > 0 ? filteredSubjects.map((sub, idx) => (
                        <div key={idx} className="bg-white/[0.03] border-2 border-white/10 p-8 rounded-[2rem] relative group hover:border-[#f87171]/50 transition-all text-left flex flex-col justify-between">
                            <div>
                                <span className="text-[10px] font-black bg-[#f87171] text-black px-3 py-1 rounded uppercase tracking-widest">{sub.course}</span>
                                <h4 className="text-2xl font-black text-white italic uppercase mt-6 tracking-tighter leading-none">{sub.subjectName}</h4>
                                <p className="text-[11px] text-[#f87171] font-bold mt-2 lowercase">{sub.facultyEmail}</p>
                            </div>
                            <div className="pt-6 mt-6 border-t border-white/5 flex justify-center items-center">
                               <button 
                                  onClick={() => handleEnrollment(sub)}
                                  disabled={isEnrolling}
                                  className={`w-full py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(248,113,113,0.3)] ${isEnrolling ? 'bg-white/10 text-white/40 cursor-wait shadow-none' : 'bg-[#f87171] text-black hover:scale-105'}`}
                               >
                                   {isEnrolling ? "SYNCING..." : "ENROLL_NOW"}
                               </button>
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-full text-center p-10 border border-white/10 rounded-[2.5rem] bg-white/5">
                             <p className="text-white/40 text-[10px] font-black tracking-widest uppercase">No_Subjects_Found_For_Your_Section</p>
                        </div>
                    )}
                </div>
            </motion.div>
          ) : viewSubjectNotes ? (
            <motion.div key="notes-vault" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-2 border-cyan-400/20 pb-4">
                    <h3 className="text-2xl md:text-4xl font-black italic uppercase text-white tracking-tighter">Subject_Archives</h3>
                    <button onClick={() => setViewSubjectNotes(false)} className="w-full md:w-auto text-cyan-400 text-[8px] md:text-[10px] font-black border-2 border-cyan-400/50 px-4 py-2 md:py-1.5 rounded-full hover:bg-cyan-400/10 active:scale-95 transition-all text-center tracking-widest">CLOSE</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {uniqueSubjects.map(sub => (
                        <div key={sub} onClick={() => { setSelectedSubject(sub); setViewSubjectNotes(false); setViewSubjectPYQ(true); setCurrentPYQView('units'); }}>
                            <UploadCardHub title={sub} type="📖" accentColor="#22d3ee" />
                        </div>
                    ))}
                </div>
            </motion.div>
          ) : viewSubjectPYQ ? (
            <motion.div key="pyq-vault" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-2 border-cyan-400/20 pb-4">
                    <h3 className="text-2xl md:text-4xl font-black italic uppercase text-white tracking-tighter">{currentPYQView === 'subjects' ? 'PYQ_Archives' : `${selectedSubject}_PYQ`}</h3>
                    <button onClick={() => { setViewSubjectPYQ(false); setCurrentPYQView('subjects'); }} className="w-full md:w-auto text-cyan-400 text-[8px] md:text-[10px] font-black border-2 border-cyan-400/50 px-4 py-2 md:py-1.5 rounded-full hover:bg-cyan-400/10 active:scale-95 transition-all text-center tracking-widest">BACK</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {currentPYQView === 'subjects' ? (
                        uniquePYQSubjects.map(sub => (
                            <div key={sub} onClick={() => { setSelectedSubject(sub); setCurrentPYQView('units'); }}>
                                <UploadCardHub title={sub} type="📂" accentColor="#a78bfa" />
                            </div>
                        ))
                    ) : (
                        uploadedNotes.filter(n => n.subject === selectedSubject).map((note) => (
                            <NoteCard key={note.id || note._id} {...note} BACKEND_URL={BACKEND_URL} />
                        ))
                    )}
                </div>
            </motion.div>
          ) : (
            <>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative p-[5px] md:p-[8px] rounded-[2rem] md:rounded-[3rem] overflow-hidden group cursor-pointer">
                    <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="absolute inset-[-200%] bg-[conic-gradient(from_0deg,transparent,transparent,#00ff41,#00ff41,transparent,transparent)] opacity-100" />
                    <div className="relative bg-[#020617] rounded-[1.8rem] md:rounded-[2.7rem] p-8 md:p-14 overflow-hidden flex flex-col items-center justify-center border-2 border-white/5">
                        <div className="relative z-10 mb-8 w-full max-w-xs">
                          <label className="text-[10px] font-black text-[#00ff41] uppercase tracking-[0.3em] mb-4 block text-center">Assign_Scan_Period</label>
                          <div className="grid grid-cols-4 gap-2">
                             {[1,2,3,4,5,6,7,8].map((p) => (
                               <button 
                                key={p} 
                                onClick={(e) => { e.stopPropagation(); setSelectedPeriod(p); }}
                                className={`py-2 rounded-lg border-2 font-black text-[10px] transition-all ${selectedPeriod === p ? 'bg-[#00ff41] text-black border-[#00ff41]' : 'bg-white/5 border-white/10 text-white/40'}`}
                               >P{p}</button>
                             ))}
                          </div>
                        </div>

                        {/* 🔥 ACTION BUTTON MOUNT SCANNER */}
                        <div className="relative z-10 text-center flex flex-col items-center" onClick={initiateScanSequence}>
                            <h2 className="text-3xl md:text-6xl font-black uppercase italic tracking-tighter leading-none mb-4">Init_<span className="text-[#00ff41]">Uplink</span></h2>
                            <div className="bg-[#00ff41] text-black text-[9px] md:text-xs font-black px-8 py-3 rounded-full uppercase tracking-[0.3em] shadow-[0_0_20px_#00ff41]">Launch_Scanner</div>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                    <div className="md:col-span-2">
                        <UploadCardHub 
                          title="LIVE_ATTENDANCE_VAULT" 
                          type="🔐" 
                          accentColor="#00ff41" 
                          glow="shadow-[#00ff41]/20" 
                          isBig={true} 
                          onClick={() => fetchPersonalLedger()} 
                        />
                    </div>
                    <UploadCardHub title="Your_Faculty" type="👨‍🏫" accentColor="#f87171" glow="shadow-red-500/20" onClick={() => setViewFacultyList(true)} />
                    <UploadCardHub title="Download_Notes" type="📑" accentColor="#00ff41" glow="shadow-[#00ff41]/20" onClick={() => setViewSubjectNotes(true)} />
                    <UploadCardHub title="Download_PYQ" type="📂" accentColor="#a78bfa" glow="shadow-purple-500/10" onClick={() => { setViewSubjectPYQ(true); setCurrentPYQView('subjects'); }} />
                    <UploadCardHub title="System_Alerts" type="📡" accentColor="#facc15" glow="shadow-yellow-500/10" />
                </div>
            </>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {(isScanning || markingStatus) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md">
            <div className="w-full max-w-sm">
                <div className={`bg-[#020617] border-8 ${markingStatus?.includes("SUCCESS") ? 'border-[#00ff41]' : markingStatus?.includes("DENIED") ? 'border-red-500' : 'border-[#00ff41]'} p-8 rounded-[2.5rem] text-center transition-colors duration-500`}>
                    <h3 className="text-xl font-black text-white italic tracking-tighter uppercase mb-4">
                      {markingStatus || (isScanning ? 'SCANNING_PERIOD_' + selectedPeriod : 'UPLINK_INITIALIZED')}
                    </h3>
                    
                    {/* 🔥 THE SCANNER MOUNT POINT */}
                    <div id="reader" className={`${isScanning ? 'block' : 'hidden'} w-full h-[300px] mb-4 bg-black rounded-lg overflow-hidden border border-[#00ff41]/30`} />
                    
                    {!isScanning && markingStatus && (
                      <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
                        <p className="text-[10px] text-white/60 font-black uppercase tracking-widest">{markingStatus}</p>
                      </div>
                    )}

                    <button onClick={handleTerminateScan} className="w-full py-3 bg-[#00ff41] text-black font-black rounded-full text-[10px] tracking-widest uppercase italic">TERMINATE</button>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const NoteCard = ({ subject, topic, faculty, date, id, _id, unit, fileUrl, title, BACKEND_URL }) => {
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (isDownloaded || loading) return;
    setLoading(true);

    try {
      const response = await axios.post(`${BACKEND_URL}/api/verify-download`, {
        noteId: id || _id,
        fileUrl: fileUrl 
      });

      if (response.data.success) {
        window.open(fileUrl, '_blank'); 
        setIsDownloaded(true);
        alert("SYNC_SUCCESS: Packet Accessed.");
      }
    } catch (err) {
      alert(err.response?.data?.message || "UPLINK_DENIED");
      if (err.response?.status === 403) setIsDownloaded(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div whileHover={{ y: -5 }} className="relative p-[5px] rounded-[2.2rem] overflow-hidden bg-white/5 border-4 border-white/5 group transition-all duration-500">
      <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} className="absolute inset-[-150%] opacity-100" style={{ background: `conic-gradient(from_0deg, transparent, transparent, #00ff41, #00ff41, transparent, transparent)` }} />
      <div className="relative bg-[#020617] rounded-[2rem] p-6 flex flex-col gap-4 border-2 border-white/5">
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-black bg-[#00ff41]/10 text-[#00ff41] px-3 py-1 rounded border border-[#00ff41]/20 uppercase">{unit || 'Vault'}</span>
          <span className="text-[8px] text-white/30 uppercase font-black">{date || 'RECENT'}</span>
        </div>
        <div>
          <h4 className="text-lg font-black text-white italic uppercase tracking-tighter leading-tight">{topic || title}</h4>
          <p className="text-[9px] text-white/40 mt-1 uppercase italic tracking-widest font-black">{subject} // {faculty || 'Admin'}</p>
        </div>
        <button 
          onClick={handleDownload}
          disabled={isDownloaded || loading}
          className={`w-full py-3 font-black text-[10px] rounded-xl uppercase tracking-widest transition-all ${
            isDownloaded ? 'bg-white/10 text-white/20 cursor-not-allowed shadow-none' : 'bg-[#00ff41] text-black shadow-[0_5px_15px_rgba(0,255,65,0.2)] active:scale-95'
          }`}
        >
          {loading ? 'VERIFYING...' : isDownloaded ? 'Packet_Depleted' : 'Download_Packet'}
        </button>
      </div>
    </motion.div>
  );
};

const UploadCardHub = ({ title, type, accentColor, glow, isBig = false, onClick }) => (
    <motion.div whileHover={{ scale: 1.01 }} onClick={onClick} className={`relative p-[6px] rounded-[2rem] overflow-hidden group cursor-pointer ${glow} transition-all duration-500 h-full`}>
        <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }} className="absolute inset-[-150%] opacity-100" style={{ background: `conic-gradient(from 0deg, transparent, transparent, ${accentColor}, ${accentColor}, transparent, transparent)` }} />
        <div className={`relative bg-[#020617] rounded-[1.8rem] overflow-hidden h-full flex flex-col items-start text-left border-4 border-white/5 ${isBig ? 'p-10 md:p-14' : 'p-8'}`}>
            <span className={`${isBig ? 'text-6xl' : 'text-4xl'} mb-6 block`}>{type}</span>
            <h3 className={`${isBig ? 'text-3xl md:text-5xl' : 'text-xl md:text-2xl'} font-black uppercase italic tracking-tighter text-white/90 mb-3`}>{title}</h3>
            <div className="w-10 h-[3px]" style={{ backgroundColor: accentColor }} />
        </div>
    </motion.div>
);

export default StudentDashboard;