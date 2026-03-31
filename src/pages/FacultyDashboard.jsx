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

  // 🔥 NEURAL_LINK_FIX: Hardcoded 'stark' hata kar dynamic storage email use kiya (vedanshisaraws@gmail.com)
  const currentFacultyEmail = localStorage.getItem('facultyEmail') || "vedanshisaraws@gmail.com";

  // NEW LOGIC: Lecture Storage & Sync
  const [lectures, setLectures] = useState([]);
  const [lectureForm, setLectureForm] = useState({ unit: '', date: '', topic: '', desc: '', time: '', file: null, title: '' });
  const [viewVault, setViewVault] = useState(false);

  // 🔥 NEW: Attendance Session State
  const [sessionActive, setSessionActive] = useState(false);

  // 🔥 NEW: Broadcast Message State
  const [broadcastMsg, setBroadcastMsg] = useState("");

  // 🔥 NEW: Subject Vault Explorer States (The Drill-down Logic)
  const [viewSubjectVault, setViewSubjectVault] = useState(false);
  const [selectedVaultSubject, setSelectedVaultSubject] = useState(null);
  const [selectedVaultCategory, setSelectedVaultCategory] = useState(null);
  const [vaultFiles, setVaultFiles] = useState([]);

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

  // 🔥 NEW: Fetch Files for Subject Vault Explorer
  const fetchVaultFiles = async () => {
      try {
          const response = await axios.get(`${BACKEND_URL}/api/notes/fetch-notes`);
          if (response.data) {
              setVaultFiles(response.data);
          }
      } catch (err) {
          console.error("Vault fetch failed", err);
      }
  };

  // 🔥 NEURAL REFRESH: Live Ledger Polling (Works in background)
  const refreshLedgerData = async () => {
    if (!sessionActive || !subjectName) return;
    try {
      const formattedDate = selectedDate.split('-').reverse().join('/');
      const response = await axios.get(`${BACKEND_URL}/api/attendance/session-status`, {
        params: {
          facultyEmail: currentFacultyEmail,
          subjectName: subjectName.toUpperCase(),
          date: formattedDate
        }
      });
      if (response.data.success) {
        const presentRegNos = response.data.presentStudents.map(s => s.regNo);
        setAttendance(prev => prev.map(student => ({
          ...student,
          isPresent: presentRegNos.includes(student.collegeId)
        })));
      }
    } catch (err) { console.log("SYNC_IDLE"); }
  };

  // 🔥 [VAULT_LINK]: Fetch Unique Monthly Registers
  const fetchMyRegisters = async () => {
    try {
        const response = await axios.get(`${BACKEND_URL}/api/attendance/my-registers?facultyEmail=${currentFacultyEmail}`);
        if (response.data.success) {
            setMonthlyRegisters(response.data.registers);
        }
    } catch (error) { console.error("REGISTERS_FETCH_FAIL"); }
  };

  // 🔥 [NEURAL_LINK]: Fetch Assigned Classes from Admin
  const fetchNeuralProfile = async () => {
    try {
        const response = await axios.get(`${BACKEND_URL}/api/faculty/profile/${currentFacultyEmail}`);
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
    fetchVaultFiles(); // 🔥 Sync files too
  }, 15000);

  // 🔥 [CRUD_OPS]: Delete Register Logic
  const handleDeleteRegister = async (reg) => {
    if(!window.confirm("Bhai, confirm kar le! Register permanently udd jayega.")) return;
    try {
      const response = await axios.post(`${BACKEND_URL}/api/attendance/delete-register`, {
        subjectName: reg._id.subjectName,
        month: reg._id.month,
        facultyEmail: currentFacultyEmail
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
        facultyEmail: currentFacultyEmail,
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
    setSubjectName(reg._id?.subjectName || reg.subject);
    setCourseName(reg._id?.course || reg.course);
    setClassType(reg._id?.classType || "Theory");
    setSelectedSem(reg._id?.semester || reg.semester);
    setSelectedSection(reg._id?.section || reg.section);
    setAcademicSession(reg._id?.sessionYear || academicSession);

    try {
        const formattedDate = selectedDate.split('-').reverse().join('/');
        const response = await axios.post(`${BACKEND_URL}/api/attendance/start-session`, {
            facultyEmail: currentFacultyEmail,
            facultyName: facultyName, 
            subjectName: (reg._id?.subjectName || reg.subject).toUpperCase(),
            course: (reg._id?.course || reg.course).toUpperCase(),
            semester: reg._id?.semester || reg.semester,
            year: reg._id?.year || reg.year || "1",
            section: reg._id?.section || reg.section,
            period: selectedPeriod,
            selectedDate: formattedDate,
            month: reg._id?.month || selectedMonth,
            classType: reg._id?.classType || "Theory",
            sessionYear: reg._id?.sessionYear || academicSession
        });

        if (response.data.success) {
            setSessionActive(true);
            setShowVaultDetails(false); 
            setActiveTab('attendance'); 
            setShowQR(true); 
            setQrToken(JSON.stringify({
              email: currentFacultyEmail,
              subject: (reg._id?.subjectName || reg.subject).toUpperCase()
            }));
        }
    } catch (error) {
        alert("Register Activation Fail!");
    }
  };

  const fetchLectures = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/student/faculties`);
      const data = await response.json();
      const currentFaculty = data.find(f => f.emailID === currentFacultyEmail || f.email === currentFacultyEmail);
      if (currentFaculty && currentFaculty.lectures) {
        setLectures(currentFaculty.lectures);
      }
    } catch (error) { console.error("Fetch Error:", error); }
  };

  useEffect(() => {
    fetchLectures();
    fetchNeuralProfile();
    fetchAllStudentsFromDB();
    fetchVaultFiles();
  }, [selectedSection]); 

  useEffect(() => {
    let poll;
    if (activeTab === 'attendance' && sessionActive) {
      poll = setInterval(refreshLedgerData, 5000);
    }
    return () => clearInterval(poll);
  }, [activeTab, sessionActive, subjectName]);

  const handleStartAttendance = async () => {
    if (!subjectName) return alert("Bhai, pehle Subject select toh kar lo!");
    
    // 🔥 SYNC SELECTION WITH NEURAL LINK DATA
    const activeNode = assignedNodes.find(n => n.subject === subjectName);
    const finalCourse = activeNode ? activeNode.course : courseName;
    const finalSem = activeNode ? activeNode.semester : selectedSem;
    const finalSec = activeNode ? activeNode.section : selectedSection;

    try {
      const formattedDate = selectedDate.split('-').reverse().join('/');
      const response = await axios.post(`${BACKEND_URL}/api/attendance/start-session`, {
        facultyEmail: currentFacultyEmail,
        facultyName: facultyName, 
        subjectName: subjectName.toUpperCase(),
        course: finalCourse.toUpperCase(),
        semester: finalSem,
        year: selectedYear,    
        section: finalSec,
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
        setQrToken(JSON.stringify({
          email: currentFacultyEmail,
          subject: subjectName.toUpperCase()
        }));
        alert(`📅 [REGISTER_CREATED]: ${subjectName}`);
        setShowModal(false);
        syncNow(); 
      }
    } catch (error) { alert("System Error: Register Uplink Fail!"); }
  };

  const handleFinalizeBatch = () => {
    alert("🚀 SYNCING_BATCH_TO_PERMANENT_VAULT...");
    setActiveTab('hub');
    setSessionActive(false);
    setShowQR(false);
  };

  const handleBroadcastUpload = async () => {
    if (!broadcastMsg) return alert("Bhai, message toh type kar!");
    try {
      const response = await axios.post(`${BACKEND_URL}/api/upload-note`, {
        title: "Broadcast",
        subject: "General",
        facultyEmail: currentFacultyEmail,
        category: "Broadcast",
        message: broadcastMsg
      });
      if (response.data.success) {
        alert(`🚀 SYNC_SUCCESS: Broadcast Alert Sent!`);
        setShowModal(false);
        setBroadcastMsg("");
      }
    } catch (error) { alert("System Error: Backend Uplink Fail!"); }
  }

  const handleNoteUpload = async () => {
    if (!lectureForm.file) return alert("Bhai, pehle file toh select kar le!");
    const formData = new FormData();
    formData.append('file', lectureForm.file);
    formData.append('title', lectureForm.title || "Untitled_Packet");
    formData.append('subject', lectureForm.topic || subjectName || "General"); 
    formData.append('facultyEmail', currentFacultyEmail);
    formData.append('category', modalType); 
    try {
      const response = await axios.post(`${BACKEND_URL}/api/upload-note`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        alert(`🚀 SYNC_SUCCESS: ${modalType} Uploaded!`);
        setShowModal(false);
        setLectureForm({ unit: '', date: '', topic: '', desc: '', time: '', file: null, title: '' });
        fetchVaultFiles(); // Sync after upload
      }
    } catch (error) { alert("System Error: Backend Uplink Fail!"); }
  };

  // 🔥 NEW: Smart Back Button Logic for the Drill-down UI
  const handleVaultBack = () => {
    if (selectedVaultCategory) {
        setSelectedVaultCategory(null);
    } else if (selectedVaultSubject) {
        setSelectedVaultSubject(null);
    } else {
        setViewSubjectVault(false);
    }
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
            const newToken = JSON.stringify({
              email: currentFacultyEmail,
              subject: subjectName.toUpperCase(),
              salt: Math.random().toString(36).substring(7).toUpperCase()
            });
            setQrToken(newToken);
            return 10;
          } return prev - 1;
        });
      }, 1000);
    } else { setTimeLeft(10); }
    return () => clearInterval(interval);
  }, [showQR, subjectName, currentFacultyEmail]);

  const toggleAttendance = async (index, status) => {
    const newAttendance = [...attendance];
    const student = newAttendance[index];
    student.isPresent = status;
    setAttendance(newAttendance);

    if (status === true) {
        try {
            await axios.post(`${BACKEND_URL}/api/attendance/mark-me`, {
                regNo: student.collegeId,
                facultyEmail: currentFacultyEmail,
                subjectName: subjectName,
                period: selectedPeriod,
                manual: true 
            });
        } catch (err) { console.error("UPLINK_SAVE_ERROR"); }
    }
  };

  const openUploadModal = (type) => { 
    if (type === "Subject_Archives") {
        setViewSubjectVault(true); // Open Explorer Instead of Form
    } else {
        setModalType(type); 
        setShowModal(true); 
    }
  };

  const handleCreateLecture = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/faculty/create-lecture`, {
        method: 'POST',
  0       headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...lectureForm, facultyEmail: currentFacultyEmail }),
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
    <div className="min-h-screen bg-[#020617] text-white font-mono p-4 md:p-10 pb-32 overflow-x-hidden text-left selection:bg-[#00ff41]/30">
      
      {/* --- HEADER WITH SYNC PROTOCOL --- */}
      <header className="fixed top-0 left-0 w-full p-6 md:p-8 border-b-4 border-[#00ff41]/20 bg-black/60 backdrop-blur-xl flex justify-between items-center z-[100]">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex flex-col">
          <h1 className="text-xl md:text-3xl font-black italic tracking-tighter uppercase text-[#00ff41]">FACULTY_NODE</h1>
          <div className="flex items-center gap-3 mt-1">
            <div className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-orange-500 animate-spin' : 'bg-[#00ff41] animate-pulse'}`} />
            <p className="text-[7px] tracking-[0.4em] opacity-50 uppercase italic font-black text-[#00ff41]">
              {isSyncing ? 'Syncing_Vault...' : 'Live_Uplink_Active'}
            </p>
          </div>
        </motion.div>

        <div className="flex items-center gap-4">
          {activeTab === 'hub' && !viewSubjectVault && (
             <button onClick={syncNow} disabled={isSyncing} className={`text-[7px] md:text-[8px] font-black px-4 py-1.5 rounded-full border-2 transition-all ${isSyncing ? 'text-orange-500 border-orange-500/20' : 'text-[#00ff41] border-[#00ff41]/20 hover:bg-[#00ff41] hover:text-black hover:shadow-[0_0_15px_#00ff41]'}`}>SYNC_VAULT</button>
          )}
          {(activeTab === 'attendance' || viewVault || showVaultDetails || viewSubjectVault) && (
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => {
                if (viewSubjectVault) { handleVaultBack(); }
                else { setActiveTab('hub'); setViewVault(false); setShowVaultDetails(false); }
            }} className="text-[9px] font-black border-2 border-white/20 px-6 py-2 rounded-full hover:bg-white hover:text-black transition-all uppercase"> &lt; HUB_RETURN </motion.button>
          )}
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl border-4 border-[#00ff41]/40 flex items-center justify-center bg-[#00ff41]/5 shadow-[0_0_15px_#00ff41]"> <span className="text-lg md:text-xl font-black italic text-[#00ff41]">Ω</span> </div>
        </div>
      </header>

      <div className="mt-24 md:mt-32 max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {activeTab === 'hub' && !viewVault && !showVaultDetails && !viewSubjectVault ? (
            <motion.div key="hub-view" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              
              {/* --- ASSIGNED CLASSES (NEURAL LINK) --- */}
              {assignedNodes.length > 0 && (
                  <div className="md:col-span-2 lg:col-span-4 space-y-6 mb-4">
                      <h3 className="text-[10px] font-black italic text-white/40 uppercase tracking-[0.4em] border-l-4 border-[#a855f7] pl-4">Neural_Link_Assignments</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {assignedNodes.map((node, idx) => (
                              <motion.div key={idx} whileHover={{ scale: 1.02 }} onClick={() => handleDirectAttendance(node)} className="bg-[#a855f7]/5 border-2 border-[#a855f7]/20 p-6 rounded-[2.5rem] cursor-pointer group hover:border-[#a855f7]/60 transition-all relative overflow-hidden">
                                  <div className="absolute top-0 left-0 w-full h-1 bg-[#a855f7] opacity-20" />
                                  <span className="text-[9px] font-black bg-[#a855f7] text-white px-3 py-1 rounded-full uppercase mb-4 inline-block">{node.subject}</span>
                                  <h4 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none mb-2">{node.course}</h4>
                                  <p className="text-[10px] font-bold text-white/40 uppercase mt-1">Sem {node.semester} // Sec {node.section}</p>
                                  <div className="mt-6 flex justify-between items-center opacity-40 group-hover:opacity-100 transition-opacity"> <span className="text-[8px] font-black tracking-widest uppercase">Quick_Mark</span> <span className="text-xl">⚡</span> </div>
                              </motion.div>
                          ))}
                      </div>
                  </div>
              )}

              {/* --- HUB ACTION CARDS --- */}
              <UploadCardHub title="Create_Register" type="🔓" accentColor="#00ff41" glow="shadow-[#00ff41]/15" onClick={() => openUploadModal("Create_Register")} />
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
             <motion.div key="vault-cards-view" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-40">
                  {monthlyRegisters.map((reg, i) => (
                      <motion.div key={i} whileHover={{ scale: 1.05 }} className="relative bg-[#020617] border-2 border-[#00ff41]/30 p-8 rounded-[3rem] group hover:bg-[#00ff41]/5 transition-all overflow-hidden">
                          <div className="absolute top-8 right-8 hidden md:flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                              <button onClick={() => { setEditingRegister(reg); setSubjectName(reg._id.subjectName); setSelectedMonth(reg._id.month); setModalType("Edit_Register"); setShowModal(true); }} className="w-10 h-10 rounded-xl bg-cyan-400 text-black text-sm font-black flex items-center justify-center hover:rotate-12 transition-all shadow-lg">✎</button>
                              <button onClick={() => handleDeleteRegister(reg)} className="w-10 h-10 rounded-xl bg-red-500 text-white text-sm font-black flex items-center justify-center hover:rotate-12 transition-all shadow-lg">✕</button>
                          </div>
                          <div onClick={() => handleDirectAttendance(reg)} className="cursor-pointer">
                              <div className="flex justify-between items-start mb-8">
                                  <span className="text-[10px] font-black bg-[#00ff41] text-black px-5 py-1.5 rounded-full uppercase italic">{reg._id.month}</span>
                                  <span className="text-[9px] opacity-30 font-black tracking-widest">{reg._id.sessionYear}</span>
                              </div>
                              <h4 className="text-4xl font-black text-white italic tracking-tighter uppercase group-hover:text-[#00ff41] mb-3 leading-none">{reg._id.subjectName}</h4>
                              <div className="flex flex-col gap-1.5 text-left border-l-2 border-white/10 pl-4 mt-6">
                                  <span className="text-[10px] text-white/60 font-black uppercase tracking-tighter">{reg._id.course} // SEM {reg._id.semester} // SEC {reg._id.section}</span>
                                  <span className="text-[9px] text-[#00ff41] font-black uppercase tracking-widest italic">{reg._id.classType}</span>
                              </div>
                          </div>
                      </motion.div>
                  ))}
              </motion.div>
          ) : viewSubjectVault ? (
            // 🔥 THE NEW SUBJECT VAULT EXPLORER (Drill-down UI)
            <motion.div key="explorer-view" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="w-full pb-40">
                <div className="mb-8 border-l-4 border-[#f472b6] pl-6 text-left">
                    <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-white">Vault_<span className="text-[#f472b6]">Explorer</span></h2>
                    <p className="text-[9px] opacity-40 uppercase tracking-[0.3em] mt-1 font-black">
                        {selectedVaultSubject ? `Path: /Root/${selectedVaultSubject}${selectedVaultCategory ? `/${selectedVaultCategory}` : ''}` : 'Path: /Root/'}
                    </p>
                </div>

                {!selectedVaultSubject ? (
                    // STEP 1: Show Subjects
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {assignedNodes.length > 0 ? assignedNodes.map((node, idx) => (
                            <motion.div key={idx} whileHover={{ scale: 1.05 }} onClick={() => setSelectedVaultSubject(node.subject)} className="bg-white/5 border-2 border-[#f472b6]/30 p-8 rounded-[2.5rem] cursor-pointer group hover:bg-[#f472b6]/10 transition-all flex flex-col items-center justify-center text-center shadow-[0_0_20px_rgba(244,114,182,0.1)]">
                                <span className="text-5xl mb-4 group-hover:scale-110 transition-transform">📁</span>
                                <h3 className="text-xl font-black uppercase tracking-tighter text-white group-hover:text-[#f472b6]">{node.subject}</h3>
                                <p className="text-[8px] opacity-40 uppercase tracking-widest mt-2">Open_Directory</p>
                            </motion.div>
                        )) : (
                            <div className="col-span-full text-center p-20 border-2 border-dashed border-white/10 rounded-[2.5rem] opacity-50">
                                <span className="text-4xl mb-4 block">📭</span>
                                <p className="text-[10px] font-black uppercase tracking-widest">No_Subjects_Assigned_Yet</p>
                            </div>
                        )}
                    </div>
                ) : !selectedVaultCategory ? (
                    // STEP 2: Show Categories (Notes, Assign, PYQ) inside selected subject
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { name: "Archive_Notes", icon: "📑", color: "cyan-400" },
                            { name: "Assignments", icon: "📝", color: "yellow-400" },
                            { name: "PYQ_Archives", icon: "📂", color: "purple-400" }
                        ].map((cat, idx) => (
                            <motion.div key={idx} whileHover={{ scale: 1.05 }} onClick={() => setSelectedVaultCategory(cat.name)} className="bg-white/5 border-2 border-white/10 p-8 rounded-[2.5rem] cursor-pointer group hover:border-white/30 transition-all flex flex-col items-center justify-center text-center">
                                <span className="text-6xl mb-6 group-hover:scale-110 transition-transform">{cat.icon}</span>
                                <h3 className="text-2xl font-black uppercase tracking-tighter text-white">{cat.name.replace('_', ' ')}</h3>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    // STEP 3: Show actual files for Subject + Category
                    <div className="space-y-4">
                        {vaultFiles.filter(file => 
                            file.faculty === currentFacultyEmail && 
                            file.subject?.toUpperCase() === selectedVaultSubject?.toUpperCase() &&
                            file.category === selectedVaultCategory
                        ).length > 0 ? (
                            vaultFiles.filter(file => file.faculty === currentFacultyEmail && file.subject?.toUpperCase() === selectedVaultSubject?.toUpperCase() && file.category === selectedVaultCategory).map((file, idx) => (
                                <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors group">
                                    <div className="flex items-center gap-4 text-left">
                                        <span className="text-2xl opacity-60">📄</span>
                                        <div>
                                            <h4 className="text-sm font-black uppercase tracking-wider text-white">{file.title}</h4>
                                            <p className="text-[9px] opacity-40 uppercase tracking-widest">{new Date(file.uploadedAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" className="px-6 py-2 bg-white/10 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-[#f472b6] hover:text-black transition-colors">
                                        Download
                                    </a>
                                </motion.div>
                            ))
                        ) : (
                            <div className="text-center p-20 border-2 border-dashed border-white/10 rounded-[2.5rem] opacity-50">
                                <span className="text-4xl mb-4 block">📭</span>
                                <p className="text-[10px] font-black uppercase tracking-widest">Directory_Empty</p>
                            </div>
                        )}
                    </div>
                )}
            </motion.div>
          ) : activeTab === 'attendance' ? (
            <motion.div key="attendance-view" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.4 }} className="w-full pb-48">
              <div className="flex flex-col lg:flex-row gap-10 mt-6">
                
                {/* --- QR & STATS COLUMN --- */}
                <div className="lg:w-1/3 flex flex-col gap-8">
                  <div className="relative p-[4px] rounded-[3rem] overflow-hidden group shadow-[0_0_70px_rgba(0,255,65,0.2)]">
                     <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} className="absolute inset-[-150%] bg-[conic-gradient(from_0deg,transparent,transparent,#00ff41,#00ff41,transparent,transparent)] opacity-50" />
                     <div className="relative bg-[#020617] rounded-[2.8rem] p-12 flex flex-col items-center">
                        <span className="text-[10px] font-black text-black bg-[#00ff41] px-4 py-1 rounded mb-8 uppercase italic tracking-widest">{subjectName}</span>
                        <div className="p-6 bg-white rounded-[2.5rem] mb-10 shadow-[0_0_40px_rgba(255,255,255,0.15)] transform group-hover:scale-105 transition-transform">
                           <QRCodeSVG value={qrToken} size={220} />
                        </div>
                        <div className="flex flex-col items-center gap-1 border-t border-white/5 pt-10">
                           <p className="text-5xl font-black text-[#00ff41] tracking-tighter">{timeLeft}s</p>
                           <p className="text-[8px] opacity-40 uppercase font-black tracking-widest italic">Rotation_Sync_Pulse</p>
                        </div>
                     </div>
                  </div>
                </div>

                {/* --- MANUAL TABLE COLUMN --- */}
                <div className="lg:w-2/3">
                  <div className="rounded-[3rem] border-2 border-white/10 bg-white/[0.02] overflow-hidden backdrop-blur-xl h-full shadow-2xl">
                     <div className="p-8 border-b border-white/10 bg-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
                        <div className="flex flex-col text-left"><h5 className="text-xl font-black text-white italic uppercase tracking-tighter">Manual_Terminal_v4.2</h5><p className="text-[7px] opacity-40 uppercase font-black tracking-widest text-[#00ff41]">Packet_Injection_Protocol_Enabled</p></div>
                        <div className="relative w-full sm:w-64">
                          <input type="text" placeholder="IDENTITY_PROBE..." onChange={(e) => setSearchID(e.target.value)} className="w-full bg-black/40 border-2 border-white/10 rounded-2xl px-6 py-3 text-[10px] font-black outline-none focus:border-[#00ff41] text-white placeholder:opacity-20" />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 text-xs">🔍</span>
                        </div>
                     </div>
                     <div className="max-h-[900px] md:max-h-[850px] overflow-y-auto no-scrollbar">
                        <table className="w-full text-left font-mono">
                           <tbody className="divide-y divide-white/5">
                              {filteredAttendance.map((student, idx) => (
                                 <tr key={student.rollNo} className={`transition-all duration-500 group ${student.isPresent ? 'bg-[#00ff41]/5' : 'hover:bg-white/[0.03]'}`}>
                                    <td className="p-6 text-[10px] font-black opacity-30 text-center">{student.rollNo}</td>
                                    <td className="p-6 text-xs font-black text-[#00ff41]">{student.collegeId}</td>
                                    <td className="p-6"><div className="flex flex-col text-left"><span className="text-sm font-black uppercase italic tracking-tighter group-hover:translate-x-1 transition-transform">{student.name}</span></div></td>
                                    <td className="p-6">
                                      <div className="flex justify-center gap-3">
                                       <button onClick={() => toggleAttendance(attendance.indexOf(student), true)} className={`w-12 h-12 rounded-2xl font-black text-sm transition-all flex items-center justify-center ${student.isPresent ? 'bg-[#00ff41] text-black shadow-[0_0_20px_#00ff41]' : 'border-2 border-white/10 text-white/20 hover:border-[#00ff41]'}`}>P</button>
                                       <button onClick={() => toggleAttendance(attendance.indexOf(student), false)} className={`w-12 h-12 rounded-2xl font-black text-sm transition-all flex items-center justify-center ${!student.isPresent ? 'bg-red-500 text-white shadow-[0_0_20px_#ef4444]' : 'border-2 border-white/10 text-white/20 hover:border-red-500'}`}>A</button>
                                      </div>
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* --- ANIMATED MODALS --- */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.9, y: 50, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 50, opacity: 0 }} className="relative w-full max-w-2xl bg-[#020617] border-4 border-white/10 rounded-[3.5rem] p-8 md:p-14 overflow-y-auto max-h-[90vh] shadow-[0_0_150px_rgba(0,0,0,1)] no-scrollbar">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
              
              <div className="flex flex-row justify-between items-center mb-12 w-full">
                <div className="border-l-4 border-cyan-400 pl-6 text-left"><h3 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white">Uplink_<span className="text-cyan-400">{modalType.replace('_', ' ')}</span></h3><p className="text-[8px] opacity-30 uppercase font-black tracking-[0.3em] mt-1">Authorized_Access_Only</p></div>
                <button onClick={() => { setShowModal(false); setEditingRegister(null); }} className="w-12 h-12 md:w-16 md:h-16 rounded-2xl border-2 border-white/10 flex flex-shrink-0 items-center justify-center hover:bg-red-500/20 hover:border-red-500/50 transition-all text-2xl bg-black/50 text-white">✕</button>
              </div>

              <div className="space-y-8 text-left">
                {modalType === "Create_Register" && (
                   <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                          <div className="flex flex-col gap-2">
                              <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">Faculty_Name</label>
                              <input type="text" value={facultyName} readOnly className="bg-white/5 border-2 border-white/10 p-5 rounded-2xl outline-none text-white/40 font-black uppercase text-xs cursor-not-allowed" />
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">Select_Assigned_Subject</label>
                            <select value={subjectName} onChange={(e) => setSubjectName(e.target.value)} className="bg-white/5 border-2 border-white/10 p-5 rounded-2xl outline-none focus:border-[#00ff41] text-[#00ff41] font-black uppercase text-xs">
                                <option value="" className="bg-black">-- SELECT_SUBJECT --</option>
                                {assignedNodes.map((node, idx) => (
                                    <option key={idx} value={node.subject} className="bg-black">{node.subject} ({node.course})</option>
                                ))}
                            </select>
                          </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 w-full">
                          <div className="flex flex-col gap-2">
                            <label className="text-[9px] font-black text-white/40 uppercase">Month</label>
                            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-white/5 border-2 border-white/10 p-5 rounded-2xl outline-none focus:border-[#00ff41] text-[#00ff41] font-black uppercase text-xs">
                               {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (<option key={m} value={m} className="bg-black text-white">{m}</option>))}
                            </select>
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="text-[9px] font-black text-white/40 uppercase">Course</label>
                            <select value={courseName} onChange={(e) => setCourseName(e.target.value)} className="bg-white/5 border-2 border-white/10 p-5 rounded-2xl outline-none focus:border-[#00ff41] text-[#00ff41] font-black uppercase text-xs">
                               <option value="B.TECH" className="bg-black">B.TECH</option> <option value="BBA" className="bg-black">BBA</option> <option value="MBA" className="bg-black">MBA</option> <option value="BCA" className="bg-black">BCA</option> <option value="MCA" className="bg-black">MCA</option> <option value="B.PHARMA" className="bg-black">B.PHARMA</option> <option value="D.PHARMA" className="bg-black">D.PHARMA</option>
                            </select>
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="text-[9px] font-black text-white/40 uppercase">Semester</label>
                            <select value={selectedSem} onChange={(e) => setSelectedSem(e.target.value)} className="bg-white/5 border-2 border-white/10 p-5 rounded-2xl outline-none focus:border-[#00ff41] text-[#00ff41] font-black uppercase text-xs">
                               {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s} className="bg-black">Sem {s}</option>)}
                            </select>
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="text-[9px] font-black text-white/40 uppercase">Section</label>
                            <input type="text" placeholder="A / B" value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} className="bg-white/5 border-2 border-white/10 p-5 rounded-2xl outline-none focus:border-[#00ff41] text-[#00ff41] font-black uppercase text-xs" />
                          </div>
                      </div>
                      <button onClick={handleStartAttendance} className="w-full py-6 rounded-full border-4 border-[#00ff41] hover:bg-[#00ff41] text-[#00ff41] hover:text-black font-black uppercase tracking-widest transition-all">ESTABLISH_VAULT_SESSION</button>
                   </div>
                )}

                {modalType === "Edit_Register" ? (
                  <div className="space-y-8">
                    <div className="flex flex-col gap-3"><label className="text-[10px] font-black text-white/40 uppercase tracking-widest">New_Subject_Identity</label><input type="text" value={subjectName} onChange={(e) => setSubjectName(e.target.value)} className="bg-white/5 border-2 border-white/10 p-6 rounded-2xl outline-none focus:border-[#00ff41] text-[#00ff41] font-black uppercase text-sm" /></div>
                    <div className="flex flex-col gap-3"><label className="text-[10px] font-black text-white/40 uppercase tracking-widest">New_Month_Cycle</label><select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-white/5 border-2 border-white/10 p-6 rounded-2xl outline-none focus:border-[#00ff41] text-[#00ff41] font-black uppercase text-sm">{["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (<option key={m} value={m} className="bg-black">{m}</option>))}</select></div>
                    <button onClick={handleUpdateRegister} className="w-full py-5 bg-cyan-400 text-black font-black uppercase tracking-[0.5em] text-[11px] rounded-full shadow-[0_0_40px_rgba(34,211,238,0.4)] hover:scale-[1.02] transition-transform mt-6">Update_Vault_Logic</button>
                  </div>
                ) : modalType === "Lecture" ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2 text-left"><label className="text-[9px] font-black opacity-30 uppercase">Unit</label><input type="text" placeholder="UNIT_01" value={lectureForm.unit} onChange={e => setLectureForm({...lectureForm, unit: e.target.value})} className="bg-white/5 border-2 border-white/10 p-5 rounded-xl outline-none focus:border-[#f87171] text-white" /></div>
                      <div className="flex flex-col gap-2 text-left"><label className="text-[9px] font-black opacity-30 uppercase">Time</label><input type="text" placeholder="10:00 AM" value={lectureForm.time} onChange={e => setLectureForm({...lectureForm, time: e.target.value})} className="bg-white/5 border-2 border-white/10 p-5 rounded-xl outline-none focus:border-[#f87171] text-white" /></div>
                    </div>
                    <div className="flex flex-col gap-2 text-left"><label className="text-[9px] font-black opacity-30 uppercase">Topic</label><input type="text" placeholder="LECTURE_TITLE" value={lectureForm.topic} onChange={e => setLectureForm({...lectureForm, topic: e.target.value})} className="bg-white/5 border-2 border-white/10 p-5 rounded-xl outline-none focus:border-[#f87171] text-white" /></div>
                    <div className="flex flex-col gap-2 text-left"><label className="text-[9px] font-black opacity-30 uppercase">Description</label><textarea rows="3" placeholder="CONTENT_SUMMARY..." value={lectureForm.desc} onChange={e => setLectureForm({...lectureForm, desc: e.target.value})} className="bg-white/5 border-2 border-white/10 p-5 rounded-xl outline-none focus:border-[#f87171] text-white resize-none" /></div>
                    <button onClick={handleCreateLecture} className="w-full py-5 bg-[#f87171] text-black font-black uppercase tracking-[0.5em] text-[11px] rounded-full shadow-[0_0_30px_rgba(248,113,113,0.3)] mt-4">Sync_Lecture_to_Vault</button>
                  </div>
                ) : modalType === "Broadcast" ? (
                  <div className="space-y-6">
                    <div className="flex flex-col gap-2 text-left">
                        <label className="text-[9px] font-black opacity-30 uppercase">Broadcast_Message</label>
                        <textarea 
                            rows="5" 
                            placeholder="TYPE_YOUR_ALERT_HERE..." 
                            value={broadcastMsg} 
                            onChange={e => setBroadcastMsg(e.target.value)} 
                            className="bg-white/5 border-2 border-white/10 p-5 rounded-xl outline-none focus:border-yellow-400 text-white resize-none" 
                        />
                    </div>
                    <button onClick={handleBroadcastUpload} className="w-full py-5 bg-yellow-400 text-black font-black uppercase tracking-[0.5em] text-[11px] rounded-full shadow-[0_0_30px_rgba(250,204,21,0.3)] mt-6 hover:scale-[1.02] transition-transform">
                        Transmit_Broadcast
                    </button>
                  </div>
                ) : modalType !== "Create_Register" ? (
                  <div className="space-y-6">
                    <div className="flex flex-col gap-2 text-left">
                        <label className="text-[9px] font-black opacity-30 uppercase">Packet_Title</label>
                        <input type="text" placeholder="EX: MODULE_1_NOTES" value={lectureForm.title} onChange={e => setLectureForm({...lectureForm, title: e.target.value})} className="bg-white/5 border-2 border-white/10 p-5 rounded-xl outline-none focus:border-cyan-400 text-white" />
                    </div>
                    
                    <div className="flex flex-col gap-2 text-left">
                        <label className="text-[9px] font-black opacity-30 uppercase">Target_Subject</label>
                        <input 
                            type="text" 
                            placeholder="EX: OS / CN / JAVA" 
                            value={lectureForm.topic} 
                            onChange={e => setLectureForm({...lectureForm, topic: e.target.value})} 
                            className="bg-white/5 border-2 border-white/10 p-5 rounded-xl outline-none focus:border-cyan-400 text-cyan-400 uppercase font-black text-[10px]" 
                        />
                    </div>

                    <div className="flex flex-col gap-2 text-left mt-4">
                        <label className="text-[9px] font-black opacity-30 uppercase">Select_Data_Packet (PDF/DOC)</label>
                        <div className="relative border-2 border-dashed border-white/20 p-8 rounded-2xl hover:border-cyan-400/50 transition-colors flex flex-col items-center justify-center bg-black/20">
                            <input 
                                type="file" 
                                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt" 
                                onChange={e => setLectureForm({...lectureForm, file: e.target.files[0]})} 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                            />
                            <span className="text-3xl mb-2">📥</span>
                            <span className="text-[10px] font-black uppercase text-cyan-400">
                                {lectureForm.file ? lectureForm.file.name : "CLICK_OR_DRAG_TO_MOUNT_FILE"}
                            </span>
                        </div>
                    </div>

                    <button onClick={handleNoteUpload} className="w-full py-5 bg-cyan-400 text-black font-black uppercase tracking-[0.5em] text-[11px] rounded-full shadow-[0_0_30px_rgba(34,211,238,0.3)] mt-6 hover:scale-[1.02] transition-transform">
                        Sync_Packet_to_Vault
                    </button>
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

// --- COMPONENT: HUB ACTION CARDS ---
const UploadCardHub = ({ title, type, accentColor, glow, onClick }) => (
    <motion.div whileHover={{ scale: 1.02, y: -5 }} onClick={onClick} className={`relative p-[4px] rounded-[2.5rem] md:rounded-[3rem] overflow-hidden group cursor-pointer ${glow} transition-all duration-500`} >
        <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }} className="absolute inset-[-180%] opacity-20 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `conic-gradient(from_0deg, transparent, transparent, ${accentColor}, ${accentColor}, transparent, transparent)` }} />
        <div className="relative bg-[#020617] rounded-[2.3rem] md:rounded-[2.8rem] p-10 md:p-12 overflow-hidden h-full flex flex-col items-start text-left border-2 border-white/5">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `linear-gradient(${accentColor} 2px, transparent 2px), linear-gradient(90deg, ${accentColor} 2px, transparent 2px)`, backgroundSize: '40px 40px' }} />
            <span className="text-5xl md:text-7xl mb-8 block drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">{type}</span>
            <h3 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white mb-4 leading-tight group-hover:text-white transition-colors">{title}</h3>
            <div className="flex items-center gap-4"><div className="w-10 h-[3px]" style={{ backgroundColor: accentColor }} /><p className="text-[9px] opacity-30 uppercase tracking-[0.4em] font-black italic">Module_v4.2</p></div>
            <motion.div whileHover={{ rotate: 90 }} className="absolute bottom-8 right-10 w-14 h-14 rounded-2xl border-2 border-white/10 flex items-center justify-center text-3xl opacity-20 group-hover:opacity-100 group-hover:border-white/40 transition-all bg-black/40">⊕</motion.div>
        </div>
    </motion.div>
);

export default FacultyDashboard;