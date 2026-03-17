import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios'; 
import * as XLSX from 'xlsx'; 
import useLiveSync from '../hooks/useLiveSync'; // 🔥 NEW: Live Sync Hook Imported

const FacultyDashboard = () => {
  const [activeTab, setActiveTab] = useState("hub");
  const [showQR, setShowQR] = useState(false);
  const [searchID, setSearchID] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [qrToken, setQrToken] = useState("ACET_INIT_NODE");
  const [timeLeft, setTimeLeft] = useState(10);
  const totalStudents = 60;

  // 🔥 STICKLY UPDATED: Backend URL defined with your IP for Mobile Access
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  // NEW LOGIC: Lecture Storage & Sync
  const [lectures, setLectures] = useState([]);
  // UPDATED: Added 'file' and 'title' key for upload system
  const [lectureForm, setLectureForm] = useState({ unit: '', date: '', topic: '', desc: '', time: '', file: null, title: '' });
  const [viewVault, setViewVault] = useState(false);

  // 🔥 NEW: Attendance Session State
  const [sessionActive, setSessionActive] = useState(false);

  // 🔥 NEW FIELDS (Strictly Updated for Create Register)
  const [selectedPeriod, setSelectedPeriod] = useState(1); // Internal default
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); 
  const [subjectName, setSubjectName] = useState(""); 
  const [courseName, setCourseName] = useState("B.TECH");
  const [selectedYear, setSelectedYear] = useState("1");
  const [selectedSem, setSelectedSem] = useState("1");
  
  // 🔥 NEW: Register Specific Fields
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
  const [classType, setClassType] = useState("Theory"); // Theory, Practical, Lab
  const [academicSession, setAcademicSession] = useState("2024-2025");
  const [selectedSection, setSelectedSection] = useState("A");

  // 🔥 NEW: FACULTY_NAME State for Professional Uplink
  const [facultyName, setFacultyName] = useState("DR. VICTOR STARK");

  // 🔥 NEW: Monthly Registers State
  const [monthlyRegisters, setMonthlyRegisters] = useState([]);
  const [showVaultDetails, setShowVaultDetails] = useState(false);
  const [editingRegister, setEditingRegister] = useState(null);

  // 🔥 NEW: NEURAL LINK STATE (Mission: Resonance)
  const [assignedNodes, setAssignedNodes] = useState([]);

  // 🔥 [DATA_LINK]: MongoDB Student Fetch for Table (UPDATED WITH SECTION FILTER)
  const fetchAllStudentsFromDB = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/attendance/all-students?section=${selectedSection}`);
      if (response.data.success) {
        const dbStudents = response.data.students.map((s, i) => ({
          rollNo: i + 1,
          collegeId: s.regNo,
          name: s.name,
          isPresent: false
        }));
        setAttendance(dbStudents);
      }
    } catch (error) { console.error("DB_FETCH_FAILED"); }
  };

  // 🔥 [VAULT_LINK]: Fetch Unique Monthly Registers
  const fetchMyRegisters = async () => {
    try {
        const response = await axios.get(`${BACKEND_URL}/api/attendance/my-registers?facultyEmail=stark@acet.org`);
        if (response.data.success) {
            setMonthlyRegisters(response.data.registers);
        }
    } catch (error) { console.error("REGISTERS_FETCH_FAIL"); }
  };

  // 🔥 [NEURAL_LINK]: Fetch Assigned Classes from Admin
  const fetchNeuralProfile = async () => {
    try {
        const response = await axios.get(`${BACKEND_URL}/api/faculty/profile/stark@acet.org`);
        if (response.data.success) {
            setAssignedNodes(response.data.data.assignedClasses || []);
            setFacultyName(response.data.data.name || facultyName);
        }
    } catch (error) { console.error("NEURAL_PROFILE_FETCH_FAIL"); }
  };

  // 🔥 NEW: LIVE SYNC HOOK IMPLEMENTATION (15s Heartbeat)
  const { isSyncing, syncNow } = useLiveSync(() => {
    fetchMyRegisters();
    fetchNeuralProfile();
  }, 15000);

  // 🔥 [CRUD_OPS]: Delete Register Logic
  const handleDeleteRegister = async (reg) => {
    if(!window.confirm("Bhai, confirm kar le! Register permanently udd jayega.")) return;
    try {
      const response = await axios.post(`${BACKEND_URL}/api/attendance/delete-register`, {
        subjectName: reg._id.subjectName,
        month: reg._id.month,
        facultyEmail: "stark@acet.org"
      });
      if(response.data.success) {
        alert("🔥 [DELETED]: Vault successfully updated!");
        syncNow(); // Use live sync to refresh
      }
    } catch (err) { alert("Delete failed!"); }
  };

  // 🔥 [CRUD_OPS]: Update Register Logic
  const handleUpdateRegister = async () => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/attendance/update-register`, {
        oldSubject: editingRegister._id.subjectName,
        oldMonth: editingRegister._id.month,
        facultyEmail: "stark@acet.org",
        newSubject: subjectName,
        newMonth: selectedMonth
      });
      if(response.data.success) {
        alert("💎 [UPDATED]: Changes Synced!");
        setShowModal(false);
        setEditingRegister(null);
        syncNow(); // Use live sync to refresh
      }
    } catch (err) { alert("Update failed!"); }
  };

  // 🔥 [FIXED_UPLINK]: Fast Track Attendance Logic with QR Trigger
  const handleDirectAttendance = async (reg) => {
    setSubjectName(reg._id.subjectName || reg.subject);
    setCourseName(reg._id.course || reg.course);
    setClassType(reg._id.classType || "Theory");
    setSelectedSem(reg._id.semester || reg.semester);
    setSelectedSection(reg._id.section || reg.section);
    setAcademicSession(reg._id.sessionYear || academicSession);

    try {
        const formattedDate = selectedDate.split('-').reverse().join('/');
        const response = await axios.post(`${BACKEND_URL}/api/attendance/start-session`, {
            facultyEmail: "stark@acet.org",
            facultyName: facultyName, 
            subjectName: (reg._id.subjectName || reg.subject).toUpperCase(),
            course: (reg._id.course || reg.course).toUpperCase(),
            semester: reg._id.semester || reg.semester,
            year: reg._id.year || reg.year || "1",
            section: reg._id.section || reg.section,
            period: selectedPeriod,
            selectedDate: formattedDate,
            month: reg._id.month || selectedMonth,
            classType: reg._id.classType || "Theory",
            sessionYear: reg._id.sessionYear || academicSession
        });

        if (response.data.success) {
            setSessionActive(true);
            setShowVaultDetails(false); 
            setActiveTab('attendance'); 
            setShowQR(true); 
        }
    } catch (error) {
        alert("Register Activation Fail!");
    }
  };

  const fetchLectures = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/student/faculties`);
      const data = await response.json();
      const currentFaculty = data.find(f => f.email === "stark@acet.org" || f.emailID === "stark@acet.org");
      if (currentFaculty && currentFaculty.lectures) {
        setLectures(currentFaculty.lectures);
      }
    } catch (error) { console.error("Fetch Error:", error); }
  };

  useEffect(() => {
    fetchLectures();
    fetchNeuralProfile();
    fetchAllStudentsFromDB(); 
  }, [selectedSection]); 

  const handleStartAttendance = async () => {
    if (!subjectName) return alert("Bhai, pehle Subject ka naam toh likh lo!");
    try {
      const formattedDate = selectedDate.split('-').reverse().join('/');
      const response = await axios.post(`${BACKEND_URL}/api/attendance/start-session`, {
        facultyEmail: "stark@acet.org",
        facultyName: facultyName, 
        subjectName: subjectName.toUpperCase(),
        course: courseName.toUpperCase(),
        semester: selectedSem,
        year: selectedYear,    
        section: selectedSection,
        period: selectedPeriod,
        selectedDate: formattedDate,
        month: selectedMonth,
        classType: classType,
        sessionYear: academicSession
      });

      if (response.data.success) {
        setSessionActive(true);
        setActiveTab('attendance');
        setShowQR(true);
        alert(`📅 [REGISTER_CREATED]: ${subjectName}`);
        syncNow(); // Sync new register
      }
    } catch (error) { alert("System Error: Register Uplink Fail!"); }
  };

  const handleFinalizeBatch = () => {
    alert("🚀 SYNCING_BATCH_TO_PERMANENT_VAULT...");
    setActiveTab('hub');
    setSessionActive(false);
    setShowQR(false);
  };

  const handleNoteUpload = async () => {
    if (!lectureForm.file) return alert("Bhai, pehle file toh select kar le!");
    const formData = new FormData();
    formData.append('file', lectureForm.file);
    formData.append('title', lectureForm.title || "Untitled_Packet");
    formData.append('facultyEmail', "stark@acet.org");
    formData.append('category', modalType);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/upload-note`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        alert("🚀 SYNC_SUCCESS!");
        setShowModal(false);
        setLectureForm({ ...lectureForm, file: null, title: '' });
      }
    } catch (error) { alert("System Error: Backend Uplink Fail!"); }
  };

  const getDaysInMonth = (monthName) => {
    const year = new Date().getFullYear(); 
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthIndex = months.indexOf(monthName);
    return new Date(year, monthIndex + 1, 0).getDate(); 
  };

  const exportToExcel = () => {
    const days = getDaysInMonth(selectedMonth);
    const dataToExport = attendance.map(s => {
      let rowData = { "S.No": s.rollNo, "Reg_No": s.collegeId, "Name": s.name };
      for(let d=1; d<=days; d++) {
          const currentDay = parseInt(selectedDate.split('-')[2]);
          rowData[d] = (d === currentDay) ? (s.isPresent ? "P" : "A") : "-";
      }
      return rowData;
    });
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ledger");
    XLSX.writeFile(workbook, `${subjectName}_${selectedMonth}.xlsx`);
  };

  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    let interval;
    if (showQR) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            const newToken = "SYNC_" + Math.random().toString(36).substring(7).toUpperCase();
            setQrToken(newToken);
            return 10;
          } return prev - 1;
        });
      }, 1000);
    } else { setTimeLeft(10); }
    return () => clearInterval(interval);
  }, [showQR]);

  const toggleAttendance = async (index, status) => {
    const newAttendance = [...attendance];
    const student = newAttendance[index];
    student.isPresent = status;
    setAttendance(newAttendance);

    if (status === true) {
        try {
            await axios.post(`${BACKEND_URL}/api/attendance/mark-me`, {
                regNo: student.collegeId,
                facultyEmail: "stark@acet.org",
                subjectName: subjectName,
                period: selectedPeriod,
                manual: true 
            });
        } catch (err) { console.error("UPLINK_SAVE_ERROR"); }
    }
  };

  const openUploadModal = (type) => { setModalType(type); setShowModal(true); };

  const handleCreateLecture = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/faculty/create-lecture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...lectureForm, facultyEmail: "stark@acet.org" }),
      });
      const result = await response.json();
      if (result.success) {
        alert("LECTURE_SYNCED_TO_VAULT");
        setShowModal(false);
        fetchLectures();
        setLectureForm({ unit: '', date: '', topic: '', desc: '', time: '' });
      }
    } catch (error) { console.error("Sync Error:", error); }
  };

  const presentCount = attendance.filter(s => s.isPresent).length;
  const filteredAttendance = attendance.filter(s => s.collegeId.toLowerCase().includes(searchID.toLowerCase()));

 return (
    <div className="min-h-screen bg-[#020617] text-white font-mono p-4 md:p-10 pb-32 overflow-x-hidden text-left">
     
     {/* --- HEADER WITH SYNC PROTOCOL --- */}
     <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[#00ff41]/20 pb-8">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h1 className="text-2xl md:text-4xl font-black italic tracking-tighter uppercase text-[#00ff41]">FACULTY_NODE</h1>
          <div className="flex items-center gap-4 mt-2">
            
            {/* Live Sync Status Indicator */}
            <div className="flex items-center gap-2">
               <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-orange-500 animate-spin' : 'bg-[#00ff41] animate-pulse'}`} />
               <p className="text-[8px] tracking-[0.4em] opacity-50 uppercase italic">
                 {isSyncing ? 'Syncing_Vault...' : 'Live_Uplink_Active'}
               </p>
            </div>

            {/* Manual Sync Button */}
            {activeTab === 'hub' && (
               <button 
                 onClick={syncNow}
                 disabled={isSyncing}
                 className={`text-[8px] font-black px-3 py-1 rounded-full border transition-all ${
                   isSyncing ? 'text-orange-500 border-orange-500/20' : 'text-[#00ff41] border-[#00ff41]/20 hover:bg-[#00ff41] hover:text-black'
                 }`}
               >
                 SYNC_VAULT
               </button>
            )}

          </div>
        </motion.div>

        {(activeTab === 'attendance' || viewVault || showVaultDetails) && (
          <motion.button
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            onClick={() => {setActiveTab('hub'); setViewVault(false); setShowVaultDetails(false);}}
            className="text-[10px] font-black border border-white/20 px-6 py-2 rounded-full hover:bg-white hover:text-black transition-all"
          >
            &lt; RETURN_TO_HUB
          </motion.button>
        )}
      </header>

      <AnimatePresence mode="wait">
        {activeTab === 'hub' && !viewVault && !showVaultDetails ? (
          <motion.div 
            key="hub-view" 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-6xl mx-auto"
          >
            
            {/* 🔥 MISSION: NEURAL LINK RESONANCE (ASSIGNED CLASSES) */}
            {assignedNodes.length > 0 && (
                <div className="md:col-span-2 space-y-6 mb-4">
                    <h3 className="text-xs font-black italic text-white/40 uppercase tracking-[0.4em]">Neural_Link_Assignments</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {assignedNodes.map((node, idx) => (
                            <motion.div 
                                key={idx}
                                whileHover={{ scale: 1.02 }}
                                onClick={() => handleDirectAttendance(node)}
                                className="bg-[#a855f7]/5 border-2 border-[#a855f7]/20 p-6 rounded-[2rem] cursor-pointer group hover:border-[#a855f7]/60 transition-all"
                            >
                                <span className="text-[9px] font-black bg-[#a855f7] text-white px-3 py-1 rounded-full uppercase mb-4 inline-block">{node.subject}</span>
                                <h4 className="text-xl font-black text-white italic uppercase tracking-tighter">{node.course}</h4>
                                <p className="text-[10px] font-bold text-white/40 uppercase mt-1">Sem {node.semester} // Sec {node.section}</p>
                                <div className="mt-6 flex justify-between items-center opacity-40 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[8px] font-black tracking-widest uppercase">Quick_Mark</span>
                                    <span className="text-lg">⚡</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- CREATE REGISTER CARD --- */}
            <div className="md:col-span-2 relative p-[4px] rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden group shadow-[0_0_60px_rgba(0,255,65,0.15)] bg-white/5 border border-white/10">
              <div className="relative bg-[#020617] rounded-[2.3rem] md:rounded-[3.3rem] p-10 md:p-14 overflow-hidden h-full flex flex-col lg:flex-row gap-10">
                <div className="relative z-10 flex flex-col items-start text-left flex-1 space-y-6">
                  <h2 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter text-[#00ff41]">Create_Register</h2>
                  
                  <div className="flex flex-col gap-2 w-full">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Faculty_Name</label>
                      <input type="text" placeholder="ENTER_YOUR_NAME..." value={facultyName} onChange={(e) => setFacultyName(e.target.value)} className="bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:border-[#00ff41] text-[#00ff41] font-black uppercase" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-white/40 uppercase">Month</label>
                        <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:border-[#00ff41] text-[#00ff41] font-black uppercase">
                           {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                             <option key={m} value={m} className="bg-black text-white">{m}</option>
                           ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-white/40 uppercase">Subject_Name</label>
                        <input type="text" placeholder="EX: OS / CN" value={subjectName} onChange={(e) => setSubjectName(e.target.value)} className="bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:border-[#00ff41] text-[#00ff41] font-black uppercase" />
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-white/40 uppercase">Course</label>
                        <select value={courseName} onChange={(e) => setCourseName(e.target.value)} className="bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:border-[#00ff41] text-[#00ff41] font-black uppercase">
                           <option value="B.TECH" className="bg-black">B.TECH</option>
                           <option value="BBA" className="bg-black">BBA</option>
                           <option value="MBA" className="bg-black">MBA</option>
                           <option value="BCA" className="bg-black">BCA</option>
                           <option value="MCA" className="bg-black">MCA</option>
                           <option value="B.PHARMA" className="bg-black">B.PHARMA</option>
                           <option value="D.PHARMA" className="bg-black">D.PHARMA</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-white/40 uppercase">Semester</label>
                        <select value={selectedSem} onChange={(e) => setSelectedSem(e.target.value)} className="bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:border-[#00ff41] text-[#00ff41] font-black uppercase">
                           {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s} className="bg-black">Sem {s}</option>)}
                        </select>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-white/40 uppercase">Section</label>
                        <input type="text" placeholder="A / B" value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} className="bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:border-[#00ff41] text-[#00ff41] font-black uppercase" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-white/40 uppercase">Subject_Kind</label>
                        <select value={classType} onChange={(e) => setClassType(e.target.value)} className="bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:border-[#00ff41] text-[#00ff41] font-black uppercase">
                            <option value="Theory" className="bg-black text-white">Theory</option>
                            <option value="Practical" className="bg-black text-white">Practical</option>
                            <option value="Lab" className="bg-black text-white">Lab</option>
                        </select>
                      </div>
                  </div>
                </div>

                <div className="flex items-center justify-center lg:border-l lg:border-white/5 lg:pl-10">
                  <button onClick={handleStartAttendance} className="group relative p-12 rounded-full border-2 border-[#00ff41] hover:bg-[#00ff41] transition-all duration-500 shadow-[0_0_40px_rgba(0,255,65,0.2)]">
                    <span className="text-4xl group-hover:scale-110 transition-transform block">🔓</span>
                    <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-[0.4em] whitespace-nowrap text-[#00ff41]">Establish_Vault</span>
                  </button>
                </div>
              </div>
            </div>

            <UploadCardHub title="Create_A_Lecture" type="👨‍🏫" accentColor="#f87171" glow="shadow-red-500/15" onClick={() => openUploadModal("Lecture")} />
            <UploadCardHub title="Lecture_Vault" type="🔐" accentColor="#00ff41" glow="shadow-[#00ff41]/15" onClick={() => setViewVault(true)} />
            <UploadCardHub title="Subject_Attendance" type="📊" accentColor="#3b82f6" glow="shadow-blue-500/15" onClick={() => setShowVaultDetails(true)} />
            <UploadCardHub title="Upload_Notes" type="📑" accentColor="#22d3ee" glow="shadow-cyan-500/15" onClick={() => openUploadModal("Archive_Notes")} />
            <UploadCardHub title="Upload_PYQ" type="📂" accentColor="#a78bfa" glow="shadow-purple-500/15" onClick={() => openUploadModal("PYQ_Archives")} />
            <UploadCardHub title="Assignments" type="📝" accentColor="#eab308" glow="shadow-yellow-500/15" onClick={() => openUploadModal("Assignments")} />
            <UploadCardHub title="Subject_Vault" type="📖" accentColor="#f472b6" glow="shadow-pink-500/15" onClick={() => openUploadModal("Subject_Archives")} />
            <UploadCardHub title="Broadcast_Alert" type="📡" accentColor="#facc15" glow="shadow-yellow-400/15" onClick={() => openUploadModal("Broadcast")} />
          </motion.div>
        ) : showVaultDetails ? (
           <motion.div 
            key="vault-cards-view" 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto pb-40"
           >
                {monthlyRegisters.map((reg, i) => (
                    <motion.div key={i} whileHover={{ scale: 1.05 }} className="relative bg-white/5 border border-[#00ff41]/30 p-8 rounded-[2.5rem] group hover:bg-[#00ff41]/5 transition-all">
                        <div className="absolute top-6 right-6 hidden md:flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <button onClick={() => { setEditingRegister(reg); setSubjectName(reg._id.subjectName); setSelectedMonth(reg._id.month); setModalType("Edit_Register"); setShowModal(true); }} className="w-8 h-8 rounded-full bg-cyan-400 text-black text-xs font-black flex items-center justify-center hover:scale-110 transition-all">✎</button>
                            <button onClick={() => handleDeleteRegister(reg)} className="w-8 h-8 rounded-full bg-red-500 text-white text-xs font-black flex items-center justify-center hover:scale-110 transition-all">✕</button>
                        </div>
                        <div onClick={() => handleDirectAttendance(reg)} className="cursor-pointer">
                            <div className="flex justify-between items-start mb-6">
                                <span className="text-[10px] font-black bg-[#00ff41] text-black px-4 py-1 rounded-full uppercase">{reg._id.month}</span>
                                <span className="text-[8px] opacity-30 font-black tracking-widest">{reg._id.sessionYear}</span>
                            </div>
                            <h4 className="text-3xl font-black text-white italic tracking-tighter uppercase group-hover:text-[#00ff41] mb-2">{reg._id.subjectName}</h4>
                            <div className="flex flex-col gap-1 text-left">
                                <span className="text-[10px] text-white/60 font-black uppercase tracking-tighter">{reg._id.course} | SEM {reg._id.semester} | SEC {reg._id.section}</span>
                                <span className="text-[9px] text-[#00ff41] font-black uppercase tracking-widest italic">{reg._id.classType}</span>
                            </div>
                        </div>
                        <div className="flex md:hidden justify-end gap-2 mt-6 pt-4 border-t border-white/5">
                            <button onClick={(e) => { e.stopPropagation(); setEditingRegister(reg); setSubjectName(reg._id.subjectName); setSelectedMonth(reg._id.month); setModalType("Edit_Register"); setShowModal(true); }} className="px-4 py-2 rounded-xl bg-cyan-400/10 text-cyan-400 text-[10px] font-black uppercase border border-cyan-400/20">Edit_Logic</button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteRegister(reg); }} className="px-4 py-2 rounded-xl bg-red-500/10 text-red-500 text-[10px] font-black uppercase border border-red-500/20">Delete_Vault</button>
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        ) : activeTab === 'attendance' ? (
          <motion.div 
            key="attendance-view" 
            initial={{ opacity: 0, scale: 0.98 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4 }}
            className="w-full pb-40"
          >
            <div className="flex flex-col lg:flex-row gap-8 mt-4">
              <div className="lg:w-1/3 flex flex-col gap-6">
                <div className="relative p-[4px] rounded-[2.5rem] overflow-hidden group shadow-[0_0_50px_rgba(0,255,65,0.15)]">
                   <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} className="absolute inset-[-150%] bg-[conic-gradient(from_0deg,transparent,transparent,#00ff41,#00ff41,transparent,transparent)] opacity-40" />
                   <div className="relative bg-[#020617] rounded-[2.3rem] p-10 flex flex-col items-center">
                      <p className="text-[10px] text-[#00ff41] font-black uppercase tracking-widest italic mb-6">{subjectName}</p>
                      <div className="p-4 bg-white rounded-3xl mb-6 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                         <QRCodeSVG value={qrToken} size={180} level="H" />
                      </div>
                      <div className="mb-4 text-center">
                         <p className="text-[10px] font-black text-[#00ff41] uppercase tracking-widest">Date: {selectedDate}</p>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                         <p className="text-5xl font-black text-white">{presentCount}</p>
                         <p className="text-[8px] opacity-40 uppercase font-black tracking-widest">Present_Units</p>
                      </div>
                      <div className="mt-8 w-full bg-white/5 p-4 rounded-2xl border border-white/10 text-center">
                         <p className="text-xl font-black text-[#00ff41]">{timeLeft}s</p>
                      </div>
                   </div>
                </div>
              </div>

              <div className="lg:w-2/3">
                <div className="rounded-[2.5rem] border border-white/10 bg-white/[0.02] overflow-hidden backdrop-blur-md h-full">
                   <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-center">
                      <span className="text-[10px] font-black text-[#00ff41] tracking-widest uppercase italic font-mono">Manual_Terminal</span>
                      <input type="text" placeholder="FILTER_ID..." onChange={(e) => setSearchID(e.target.value)} className="bg-black/40 border border-white/10 rounded-full px-6 py-2 text-[10px] font-black outline-none focus:border-[#00ff41] w-32 md:w-48 text-white" />
                   </div>
                   <div className="max-h-[600px] overflow-y-auto no-scrollbar">
                      <table className="w-full text-left">
                         <tbody className="divide-y divide-white/5">
                            {filteredAttendance.map((student, idx) => (
                               <tr key={student.rollNo} className={`transition-all duration-500 ${student.isPresent ? 'bg-[#00ff41]/5' : 'hover:bg-white/[0.02]'}`}>
                                  <td className="p-6 text-[10px] font-black opacity-30">{student.rollNo}</td>
                                  <td className="p-6 text-[10px] font-black text-[#00ff41]">{student.collegeId}</td>
                                  <td className="p-4 md:p-6"><div className="flex flex-col"><span className="text-sm font-black uppercase italic tracking-tighter">{student.name}</span></div></td>
                                  <td className="p-4 md:p-6 flex justify-center gap-2">
                                     <button onClick={() => toggleAttendance(attendance.indexOf(student), true)} className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${student.isPresent ? 'bg-[#00ff41] text-black shadow-[0_0_15px_#00ff41]' : 'border border-white/10 text-white/20 hover:border-[#00ff41]'}`}>P</button>
                                     <button onClick={() => toggleAttendance(attendance.indexOf(student), false)} className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${!student.isPresent ? 'bg-red-500 text-white shadow-[0_0_15px_#ef4444]' : 'border border-white/10 text-white/20 hover:border-red-500'}`}>A</button>
                                  </td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>
              </div>
            </div>

            <div className="mt-12 w-full border-2 border-[#00ff41] rounded-[2.5rem] overflow-hidden bg-black/60 shadow-[0_0_40px_rgba(0,255,65,0.15)]">
                <div className="p-8 bg-[#00ff41]/10 border-b border-[#00ff41]/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h3 className="text-2xl font-black text-[#00ff41] uppercase italic tracking-tighter">Live_Attendance_Ledger_v4</h3>
                        <p className="text-[8px] opacity-40 uppercase font-black tracking-[0.4em] mt-1">{subjectName} // {selectedMonth} 2025</p>
                    </div>
                    <button onClick={exportToExcel} className="px-10 py-4 bg-[#00ff41] text-black font-black text-[10px] rounded-full hover:scale-105 transition-transform shadow-[0_0_25px_rgba(0,255,65,0.4)] uppercase tracking-widest">📥 Generate_Excel_Vault</button>
                </div>
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left font-mono border-collapse">
                        <thead>
                            <tr className="bg-[#00ff41]/5 text-[#00ff41] text-[9px] uppercase font-black tracking-widest border-b border-[#00ff41]/20">
                                <th className="p-6 border-r border-[#00ff41]/10 min-w-[150px]">Student_Identity</th>
                                {[...Array(getDaysInMonth(selectedMonth))].map((_, i) => (
                                    <th key={i} className={`p-4 text-center border-r border-[#00ff41]/10 min-w-[50px] ${parseInt(selectedDate.split('-')[2]) === (i+1) ? 'bg-[#00ff41] text-black' : ''}`}>
                                        {i + 1}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#00ff41]/10">
                            {attendance.map((s, i) => (
                                <tr key={i} className="hover:bg-[#00ff41]/5 transition-colors group">
                                    <td className="p-6 border-r border-[#00ff41]/10">
                                        <div className="flex flex-col">
                                            <span className="text-white text-xs font-black uppercase italic tracking-tighter">{s.name}</span>
                                            <span className="text-[#00ff41] text-[9px] font-black opacity-50">{s.collegeId}</span>
                                        </div>
                                    </td>
                                    {[...Array(getDaysInMonth(selectedMonth))].map((_, dayIdx) => {
                                         const currentDay = parseInt(selectedDate.split('-')[2]);
                                         const isToday = (dayIdx + 1) === currentDay;
                                         return (
                                             <td key={dayIdx} className={`p-4 text-center border-r border-[#00ff41]/10 font-black text-sm ${isToday ? 'bg-[#00ff41]/5' : ''}`}>
                                                 {isToday ? (
                                                     <span className={s.isPresent ? 'text-[#00ff41] drop-shadow-[0_0_8px_#00ff41]' : 'text-red-500'}>
                                                         {s.isPresent ? 'P' : 'A'}
                                                     </span>
                                                 ) : <span className="opacity-10">-</span>}
                                             </td>
                                         );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <footer className="fixed bottom-0 left-0 w-full p-6 bg-black/80 backdrop-blur-xl border-t border-white/5 flex justify-center z-[100]">
              <button onClick={handleFinalizeBatch} className="w-full max-w-xl py-5 bg-[#00ff41] text-black font-black uppercase tracking-[0.5em] text-[11px] rounded-full shadow-[0_0_40px_rgba(0,255,65,0.3)] hover:scale-[1.02] transition-transform">FINALIZE_BATCH_LOG</button>
            </footer>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 50 }} className="relative w-full max-w-xl bg-[#020617] border-2 border-white/10 rounded-[2.5rem] p-6 md:p-12 overflow-y-auto max-h-[90vh] shadow-[0_0_100px_rgba(0,0,0,1)] no-scrollbar">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
              <div className="flex flex-row justify-between items-center mb-10 w-full">
                <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter text-white pr-4 text-left">Uplink_<span className="text-cyan-400">{modalType}</span></h3>
                <button onClick={() => { setShowModal(false); setEditingRegister(null); }} className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/10 flex flex-shrink-0 items-center justify-center hover:bg-white/10 active:scale-90 transition-all text-xl bg-black/50">✕</button>
              </div>
              <div className="space-y-6 text-left">
                {modalType === "Edit_Register" ? (
                  <div className="space-y-6">
                    <div className="flex flex-col gap-2"><label className="text-[10px] font-black text-white/40 uppercase">New_Subject_Name</label><input type="text" value={subjectName} onChange={(e) => setSubjectName(e.target.value)} className="bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:border-[#00ff41] text-[#00ff41] font-black uppercase" /></div>
                    <div className="flex flex-col gap-2"><label className="text-[10px] font-black text-white/40 uppercase">New_Month</label><select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:border-[#00ff41] text-[#00ff41] font-black uppercase">{["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (<option key={m} value={m} className="bg-black">{m}</option>))}</select></div>
                    <button onClick={handleUpdateRegister} className="w-full py-4 bg-cyan-400 text-black font-black uppercase tracking-[0.5em] text-[10px] rounded-full shadow-[0_0_30px_rgba(34,211,238,0.3)]">Update_Vault_Logic</button>
                  </div>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const UploadCardHub = ({ title, type, accentColor, glow, onClick }) => (
    <motion.div whileHover={{ scale: 1.02 }} onClick={onClick} className={`relative p-[4px] rounded-[2rem] md:rounded-[2.5rem] overflow-hidden group cursor-pointer ${glow} transition-all duration-500`} >
        <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="absolute inset-[-150%] opacity-30 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `conic-gradient(from 0deg, transparent, transparent, ${accentColor}, ${accentColor}, transparent, transparent)` }} />
        <div className="relative bg-[#020617] rounded-[1.8rem] md:rounded-[2.3rem] p-8 md:p-12 overflow-hidden h-full flex flex-col items-start text-left border border-white/5">
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: `linear-gradient(${accentColor} 1px, transparent 1px), linear-gradient(90deg, ${accentColor} 1px, transparent 1px)`, backgroundSize: '30px 30px' }} />
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(255,255,255,0.25)_50%)] bg-[length:100%_4px] animate-pulse" />
            <span className="text-4xl md:text-6xl mb-6 block drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">{type}</span>
            <h3 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter text-white/90 mb-4 leading-tight">{title}</h3>
            <div className="flex items-center gap-3"><div className="w-8 h-[2px]" style={{ backgroundColor: accentColor }} /><p className="text-[8px] md:text-[10px] opacity-30 uppercase tracking-[0.3em] font-black italic">Archive_Module_v4</p></div>
            <motion.div whileHover={{ rotate: 90 }} className="absolute bottom-6 right-8 w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-2xl opacity-20 group-hover:opacity-100 group-hover:border-white/40 transition-all">⊕</motion.div>
        </div>
    </motion.div>
);

export default FacultyDashboard;