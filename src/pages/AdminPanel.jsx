import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import useLiveSync from '../hooks/useLiveSync';
import * as XLSX from 'xlsx';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const AdminPanel = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState("DASHBOARD");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFacultyExpanded, setIsFacultyExpanded] = useState(false);
  const [isStudentExpanded, setIsStudentExpanded] = useState(false);
  
  const [selectedFacultyResources, setSelectedFacultyResources] = useState(null);
  const [facultyList, setFacultyList] = useState([]);
  const [studentList, setStudentList] = useState([]);
  
  const [facultyData, setFacultyData] = useState({ facultyName: '' });
  const [generatedID, setGeneratedID] = useState(null); 

  const [studentData, setStudentData] = useState({
    name: '', email: '', course: 'B.TECH', year: '', section: 'A', semester: '1', rollNo: ''
  });

  const [editingId, setEditingId] = useState(null);
  const [studentEditingId, setStudentEditingId] = useState(null);

  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [filterCourse, setFilterCourse] = useState("ALL");
  const [filterSemester, setFilterSemester] = useState("ALL");
  const [filterSection, setFilterSection] = useState("ALL");
  const [filterYear, setFilterYear] = useState("ALL"); 
  
  const [stagedData, setStagedData] = useState(null);
  
  const [stagingEditIdx, setStagingEditIdx] = useState(null); 
  const [stagingEditForm, setStagingEditForm] = useState({});
  
  const [stagingSearch, setStagingSearch] = useState("");
  const [showAnomaliesOnly, setShowAnomaliesOnly] = useState(false);

  const [linkData, setLinkData] = useState({
      facultyId: '', course: 'B.TECH', semester: '1', section: 'A', subject: ''
  });

  const [inspectedStudent, setInspectedStudent] = useState(null);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const courseStats = useMemo(() => {
      const counts = {};
      studentList.forEach(s => {
          const c = s.course ? s.course.toUpperCase() : 'UNKNOWN';
          counts[c] = (counts[c] || 0) + 1;
      });
      return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [studentList]);

  const semStats = useMemo(() => {
      const counts = {};
      studentList.forEach(s => {
          const sem = s.semester ? `SEM ${s.semester}` : 'UNKNOWN';
          counts[sem] = (counts[sem] || 0) + 1;
      });
      return Object.keys(counts).sort().map(key => ({ name: key, students: counts[key] }));
  }, [studentList]);

  const RADAR_COLORS = ['#00ff41', '#22d3ee', '#f59e0b', '#a855f7', '#ef4444', '#ec4899', '#14b8a6', '#f97316'];

  const handleExcelPreview = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
          const data = new Uint8Array(evt.target.result);
          const wb = XLSX.read(data, { type: 'array' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          
          const rawJsonForHeaders = XLSX.utils.sheet_to_json(ws, { header: 1 }); 
          if (rawJsonForHeaders.length === 0) return alert("❌ ERROR: Empty Excel File");

          const originalHeaders = rawJsonForHeaders[0].map(h => String(h).replace(/^\uFEFF/, '').trim());

          const requiredHeaders = ["RegNo", "Name", "Year", "Course", "Semester", "Section", "Email", "Phone"];
          
          const missingHeaders = requiredHeaders.filter(h => !originalHeaders.includes(h));
          const unrecognizedHeaders = originalHeaders.filter(h => !requiredHeaders.includes(h));

          if (missingHeaders.length > 0) {
              const wantAutoCorrect = window.confirm(
                  `⚠️ STRICT TEMPLATE ALERT!\n\n` +
                  `Aapki file mein kuch Headings galat hain ya missing hain:\n` +
                  `❌ Missing Exact Headings: ${missingHeaders.join(', ')}\n` +
                  `❓ Unrecognized Found: ${unrecognizedHeaders.length > 0 ? unrecognizedHeaders.join(', ') : 'None'}\n\n` +
                  `✅ Mujhe exact ye format chahiye: RegNo, Name, Year, Course, Semester, Section, Email, Phone\n\n` +
                  `⚙️ Kya System isko AUTO-CORRECT karke khud theek kar le? (OK dabayein)`
              );

              if (!wantAutoCorrect) {
                  e.target.value = null;
                  return; 
              }
          }

          const rawJson = XLSX.utils.sheet_to_json(ws, { defval: "" });

          const parsedNodes = rawJson.map((row) => {
              const normalizedRow = {};
              Object.keys(row).forEach(k => {
                  const cleanKey = String(k).toLowerCase().replace(/[^a-z0-9]/g, '');
                  normalizedRow[cleanKey] = row[k];
              });

              const findVal = (exacts, partials) => {
                  for (let ex of exacts) {
                      if (normalizedRow[ex] !== undefined && normalizedRow[ex] !== "") return normalizedRow[ex];
                  }
                  for (let pt of partials) {
                      const match = Object.keys(normalizedRow).find(k => k.includes(pt));
                      if (match && normalizedRow[match] !== "") return normalizedRow[match];
                  }
                  return null;
              };

              const rawReg = findVal(['regno', 'rollno', 'registrationnumber', 'id', 'reg'], ['reg', 'roll', 'id']);
              const rawName = findVal(['name', 'nam', 'studentname', 'fullname'], ['nam', 'name', 'student']);
              const rawCourse = findVal(['course', 'class', 'program', 'cours'], ['cours', 'class']);
              const rawSem = findVal(['semester', 'semeter', 'semeer', 'sem'], ['sem']);
              const rawSec = findVal(['section', 'sect', 'sec', 'batch'], ['sec', 'sect']);
              const rawEmail = findVal(['email', 'emailaddress', 'mailid', 'ema'], ['mail', 'ema']);
              const rawPhone = findVal(['phone', 'contact', 'mobile', 'ph'], ['phon', 'mob', 'cont', 'ph']);
              
              // 🔥 YAHAN SE DEFAULT '1' HATA DIYA! EXACT EXCEL VALUE AAYEGI.
              const rawYear = findVal(['year', 'yr', 'yea', 'y'], ['year', 'yr', 'yea']);

              const idString = rawReg ? String(rawReg).trim() : null; 

              return {
                  _tempId: Math.random().toString(36).substr(2, 9),
                  regNo: idString, 
                  name: rawName ? String(rawName).trim().toUpperCase() : null,
                  year: rawYear ? String(rawYear).trim() : "", // 🔥 DIRECT FETCH NO DEFAULT
                  course: rawCourse ? String(rawCourse).trim().toUpperCase() : 'B.TECH', 
                  semester: rawSem ? String(rawSem).trim() : '1',
                  section: rawSec ? String(rawSec).trim().toUpperCase() : 'A',
                  email: rawEmail ? String(rawEmail).trim().toLowerCase() : (idString ? `${idString}@college.edu` : `temp_${Date.now()}@college.edu`),
                  phone: rawPhone ? String(rawPhone).trim() : '0000000000',
                  password: "DEFAULT_LOCKED",
                  isProfileCompleted: false 
              };
          }); 

          setStagedData(parsedNodes);
          setStagingSearch(""); 
          setShowAnomaliesOnly(false);

          if (missingHeaders.length > 0) alert("✨ AUTO-CORRECT APPLIED SUCCESSFULLY! Extracting Data...");

      } catch (error) {
          console.error("Excel Parse Error:", error);
          alert("❌ ERROR: File is corrupted or unreadable.");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = null; 
  };

  const handleEditStagingRow = (tempId, row) => {
      setStagingEditIdx(tempId);
      setStagingEditForm({ ...row });
  };

  const handleSaveStagingRow = () => {
      const updatedData = stagedData.map(r => r._tempId === stagingEditIdx ? stagingEditForm : r);
      setStagedData(updatedData);
      setStagingEditIdx(null);
  };

  const handleDeleteStagingRow = (tempId) => {
      const updatedData = stagedData.filter(r => r._tempId !== tempId);
      if (updatedData.length === 0) setStagedData(null);
      else setStagedData(updatedData);
      setStagingEditIdx(null);
  };

  const handlePurgeDuplicates = () => {
      if (!stagedData) return;
      
      const seenRegNos = new Set();
      const cleanData = [];
      let removedCount = 0;

      stagedData.forEach(row => {
          if (row.regNo) {
              if (seenRegNos.has(row.regNo)) {
                  removedCount++; 
              } else {
                  seenRegNos.add(row.regNo);
                  cleanData.push(row); 
              }
          } else {
              cleanData.push(row); 
          }
      });

      setStagedData(cleanData);
      
      if (removedCount > 0) {
          alert(`🧹 PURGE COMPLETE: Removed ${removedCount} duplicate entries automatically!`);
      } else {
          alert(`✨ SYSTEM CLEAN: No duplicate Registration Numbers found.`);
      }
  };

  const handleExcelSync = async () => {
    const hasAnomalies = stagedData.some(r => !r.regNo || !r.name);
    if (hasAnomalies) {
        return alert("❌ UPLINK BLOCKED: Please FIX or DROP the Red Flagged (Invalid) entries first!");
    }

    if (!stagedData || stagedData.length === 0) return alert("❌ ERROR: NO_DATA_STAGED");

    setIsSyncing(true);
    try {
      const cleanData = stagedData.map(({ _tempId, ...rest }) => rest);

      const response = await fetch(`${BACKEND_URL}/api/admin/bulk-upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: cleanData }), 
      });

      const result = await response.json();
      if (result.success) {
        const successMessage = result.msg || result.message || "Data Synced Successfully";
        alert(`✨ [SYSTEM]: ARCHIVE_SYNC_COMPLETE. ${successMessage}`);
        setStagedData(null); 
        fetchData(); 
      } else {
        alert("❌ [SYSTEM]: SYNC_FAILED -> " + (result.msg || "UNKNOWN_ERROR"));
      }
    } catch (error) {
      console.error("Uplink Error:", error);
      alert("❌ [SYSTEM]: UPLINK_CRITICAL_FAILURE");
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchData = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/student/faculties`);
      const data = await response.json();
      setFacultyList(data);
      
      const sResponse = await fetch(`${BACKEND_URL}/api/admin/students`); 
      const sData = await sResponse.json();
      setStudentList(sData);
    } catch (error) {
      console.error("Fetch Error:", error);
    }
  };

  const { isSyncing: autoSyncing, syncNow } = useLiveSync(fetchData, 10000);

  const generateFacultyCode = async (e) => {
    e.preventDefault();
    if (!facultyData.facultyName) return alert("Name is required!");

    try {
      const response = await fetch(`${BACKEND_URL}/api/faculty/admin-create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facultyName: facultyData.facultyName })
      });

      const result = await response.json();
      if (result.success) {
        setGeneratedID(result.facultyID); 
        setFacultyData({ facultyName: '' }); 
        fetchData(); 
      } else {
        alert("Generation Failed!");
      }
    } catch (error) {
      console.error("Generation Error:", error);
      alert("Server Error");
    }
  };

  // 🔥 ADDED: Approve function for new requests
  const approveFaculty = async (id) => {
      try {
          const response = await fetch(`${BACKEND_URL}/api/admin/approve-faculty`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id })
          });
          const result = await response.json();
          if (result.success) {
              alert(`✅ ACCESS GRANTED: Faculty ID generated -> ${result.facultyID}`);
              fetchData();
          }
      } catch (error) {
          alert("❌ ERROR: Approval failed!");
      }
  };

  const triggerEdit = (f) => {
    setEditingId(f.id);
    setFacultyData({ facultyName: f.name || f.facultyName });
    setGeneratedID(null);
    setActiveTab("FACULTY");
    setIsSidebarOpen(false);
  };

  const terminateNode = async (id) => {
    if(window.confirm("CRITICAL_ACTION: Permanently purge this faculty node from database?")) {
      try {
        const response = await fetch(`${BACKEND_URL}/api/faculty/terminate/${id}`, {
          method: 'DELETE',
        });
        const result = await response.json();
        if (result.success) {
          setFacultyList(facultyList.filter(f => (f._id || f.id) !== id));
          alert("✨ [SYSTEM]: NODE_PURGED_FROM_DATABASE");
          fetchData();
        } else {
          alert("❌ ERROR: TERMINATION_REJECTED");
        }
      } catch (error) {
        alert("❌ [SYSTEM]: UPLINK_FAILURE_DURING_PURGE");
      }
    }
  };

  const handleStudentRegister = (e) => {
    e.preventDefault();
    if (studentEditingId) {
      setStudentList(studentList.map(s => (s.id || s._id) === studentEditingId ? {
        ...s,
        name: studentData.name.toUpperCase(),
        email: studentData.email.toLowerCase(),
        course: studentData.course,
        year: studentData.year,
        section: studentData.section,
        semester: studentData.semester,
        rollNo: studentData.rollNo.toUpperCase(),
        regNo: studentData.rollNo.toUpperCase()
      } : s));
      setStudentEditingId(null);
    } else {
      const newStudent = { ...studentData, id: Date.now(), name: studentData.name.toUpperCase(), regNo: studentData.rollNo.toUpperCase() };
      setStudentList([newStudent, ...studentList]);
    }
    setStudentData({ name: '', email: '', course: 'B.TECH', year: '', section: 'A', semester: '1', rollNo: '' });
    setActiveTab("DASHBOARD");
    setIsStudentExpanded(true);
  };

  const triggerStudentEdit = (s) => {
    setStudentEditingId(s.id || s._id);
    
    const fetchedYear = s.year || s.Year || s.YEAR || '';
    
    setStudentData({
      name: s.name || '', 
      email: s.email || '', 
      course: s.course ? String(s.course).trim().toUpperCase() : 'B.TECH',
      year: String(fetchedYear).trim(), 
      section: s.section ? String(s.section).trim().toUpperCase() : 'A', 
      semester: s.semester ? String(s.semester).trim() : '1', 
      rollNo: s.regNo || s.rollNo || ''
    });
    
    setActiveTab("STUDENTS");
    setIsSidebarOpen(false);
  };

  const terminateStudent = (id) => {
    if(window.confirm("CRITICAL_ACTION: Permanently terminate this student record?")) {
      setStudentList(studentList.filter(s => (s.id || s._id) !== id));
    }
  };

  const handleEstablishLink = async (e) => {
      e.preventDefault();
      if (!linkData.facultyId || !linkData.subject) return alert("❌ ERROR: SELECT_FACULTY_AND_SUBJECT");

      setIsSyncing(true);
      try {
          const response = await fetch(`${BACKEND_URL}/api/admin/assign-faculty`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(linkData)
          });
          
          const result = await response.json();
          if (result.success || response.ok) {
              alert(`✨ [SYSTEM]: NEURAL_LINK_ESTABLISHED for ${linkData.subject}`);
              setLinkData({ ...linkData, subject: '' }); 
              fetchData();
          } else {
              alert("❌ [SYSTEM]: LINK_FAILED -> " + (result.message || "UNKNOWN_ERROR"));
          }
      } catch (error) {
          console.error("Link Error:", error);
          alert("⚠️ [SYSTEM WARNING]: Endpoint /api/admin/assign-faculty not responding. Check backend!");
      } finally {
          setIsSyncing(false);
      }
  };

  const processedStudents = (studentList || []).filter(s => {
    const searchMatch = !searchTerm || 
          (s.name?.toLowerCase().includes(searchTerm.toLowerCase())) || 
          (s.regNo?.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (s.rollNo?.toLowerCase().includes(searchTerm.toLowerCase()));
          
    const courseMatch = filterCourse === "ALL" || (s.course && s.course.toUpperCase() === filterCourse);
    const semMatch = filterSemester === "ALL" || String(s.semester) === filterSemester;
    const secMatch = filterSection === "ALL" || (s.section && s.section.toUpperCase() === filterSection);
    
    const yearMatch = filterYear === "ALL" || 
          String(s.year) === filterYear || 
          (filterYear === "1" && ["1", "2"].includes(String(s.semester))) ||
          (filterYear === "2" && ["3", "4"].includes(String(s.semester))) ||
          (filterYear === "3" && ["5", "6"].includes(String(s.semester))) ||
          (filterYear === "4" && ["7", "8"].includes(String(s.semester)));
    
    return searchMatch && courseMatch && semMatch && secMatch && yearMatch;
  });

  const filteredStudents = processedStudents.slice(0, 100); 

  const handleExportExcel = () => {
    if (processedStudents.length === 0) return alert("❌ ERROR: NO_DATA_TO_EXPORT");
    
    const exportData = processedStudents.map(s => ({
        "RegNo": s.regNo || s.collegeId || s.rollNo || "N/A",
        "Name": s.name || "N/A",
        "Year": s.year || "", 
        "Course": s.course || "N/A",
        "Semester": s.semester || "N/A",
        "Section": s.section || "N/A",
        "Email": s.email || "N/A",
        "Phone": s.phone || "0000000000"
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Filtered_Students");
    
    const fileName = `CyberNexus_Export_Yr${filterYear}_${filterCourse}_Sem${filterSemester}_Sec${filterSection}_${Date.now()}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const invalidNodesCount = stagedData ? stagedData.filter(r => !r.regNo || !r.name).length : 0;
  
  const displayStagedData = stagedData ? stagedData.filter(row => {
      const matchesSearch = !stagingSearch || 
          (row.regNo && row.regNo.toLowerCase().includes(stagingSearch.toLowerCase())) || 
          (row.name && row.name.toLowerCase().includes(stagingSearch.toLowerCase()));
      
      const isAnomaly = !row.regNo || !row.name;
      
      if (showAnomaliesOnly) return matchesSearch && isAnomaly;
      return matchesSearch;
  }) : [];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#020617]/90 border border-[#00ff41]/50 p-3 rounded-lg backdrop-blur-md shadow-[0_0_15px_rgba(0,255,65,0.2)] text-left">
          <p className="text-[10px] font-black text-white uppercase tracking-widest">{payload[0].name}</p>
          <p className="text-xs font-black text-[#00ff41] italic mt-1">NODES: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col md:flex-row bg-[#010409] text-white font-mono overflow-hidden selection:bg-[#00ff41]/30">
      
      <AnimatePresence>
        {inspectedStudent && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10002] bg-[#010409]/95 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-10"
            onClick={() => setInspectedStudent(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 50, opacity: 0 }}
              className="bg-[#020617] border-2 border-[#22d3ee]/30 w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(34,211,238,0.2)] relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#22d3ee] to-transparent" />
              
              <div className="p-8 md:p-12">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <span className="text-[10px] font-black bg-[#22d3ee] text-black px-4 py-1 rounded-full uppercase tracking-[0.2em]">Student_Vault_Core</span>
                    <h2 className="text-4xl md:text-5xl font-black italic text-white uppercase mt-4 tracking-tighter leading-none">{inspectedStudent.name}</h2>
                    <p className="text-[#22d3ee] font-black text-sm mt-2 tracking-[0.2em]">{inspectedStudent.regNo || inspectedStudent.rollNo || "AUTH_ID_NULL"}</p>
                  </div>
                  <button onClick={() => setInspectedStudent(null)} className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-xl">✕</button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                  <div className="bg-white/5 p-5 rounded-3xl border border-white/5">
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Course_Node</p>
                    <p className="text-lg font-black text-white italic">{inspectedStudent.course || "N/A"}</p>
                  </div>
                  <div className="bg-white/5 p-5 rounded-3xl border border-white/5">
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Year_Level</p>
                    <p className="text-lg font-black text-white italic">YR_{inspectedStudent.year || "N/A"}</p>
                  </div>
                  <div className="bg-white/5 p-5 rounded-3xl border border-white/5">
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Current_Phase</p>
                    <p className="text-lg font-black text-white italic">SEM_{inspectedStudent.semester || "1"}</p>
                  </div>
                  <div className="bg-white/5 p-5 rounded-3xl border border-white/5">
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Sector_Tag</p>
                    <p className="text-lg font-black text-white italic">SEC_{inspectedStudent.section || "A"}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center p-5 bg-[#22d3ee]/5 border border-[#22d3ee]/20 rounded-2xl">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Comm_Link_Active</span>
                    <span className="text-xs font-black text-[#22d3ee] lowercase">{inspectedStudent.email}</span>
                  </div>
                  <div className="flex justify-between items-center p-5 bg-white/5 border border-white/5 rounded-2xl">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Temporal_Entry</span>
                    <span className="text-xs font-black text-white uppercase italic">SYSTEM_VERIFIED</span>
                  </div>
                </div>

                <div className="mt-12 flex gap-4">
                  <button 
                    onClick={() => { triggerStudentEdit(inspectedStudent); setInspectedStudent(null); }}
                    className="flex-1 py-5 bg-white text-black font-black uppercase text-[10px] tracking-[0.3em] rounded-2xl hover:scale-[1.02] transition-all"
                  >
                    Revise_Entity
                  </button>
                  <button 
                    onClick={() => { terminateStudent(inspectedStudent._id || inspectedStudent.id); setInspectedStudent(null); }}
                    className="flex-1 py-5 border border-red-500/30 text-red-500 font-black uppercase text-[10px] tracking-[0.3em] rounded-2xl hover:bg-red-500/10 transition-all"
                  >
                    Terminate_Node
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSyncing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10001] bg-[#010409]/90 backdrop-blur-xl flex flex-col items-center justify-center"
          >
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-20 h-20 border-4 border-[#00ff41] border-t-transparent rounded-full shadow-[0_0_50px_rgba(0,255,65,0.3)]"
            />
            <motion.h2 
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-[#00ff41] mt-8 font-black tracking-[0.5em] text-xs uppercase italic"
            >
              Synchronizing_Nodes...
            </motion.h2>
            <p className="text-white/20 text-[9px] mt-2 uppercase tracking-widest font-mono">Processing_Archive_Uplink</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="md:hidden flex items-center justify-between p-4 border-b border-white/10 bg-black/50 backdrop-blur-xl z-[100]">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#00ff41] rounded-lg flex items-center justify-center text-black font-black text-sm">A</div>
            <span className="font-black italic text-xs tracking-tighter uppercase">Admin_Node</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-[#00ff41] text-2xl">
            {isSidebarOpen ? '✕' : '☰'}
        </button>
      </div>

      <AnimatePresence>
        {(isSidebarOpen || window.innerWidth > 768) && (
          <motion.aside 
            initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} 
            className="fixed md:relative h-full w-72 border-r border-white/10 bg-[#010409] md:bg-white/[0.02] backdrop-blur-3xl p-8 flex flex-col gap-10 z-[90]"
          >
            <div className="hidden md:flex items-center gap-4">
              <div className="w-12 h-12 bg-[#00ff41] rounded-xl flex items-center justify-center text-black font-black text-xl shadow-[0_0_20px_#00ff41]">A</div>
              <h1 className="text-2xl font-black italic tracking-tighter uppercase">ADMIN</h1>
            </div>
            <nav className="flex flex-col gap-4 mt-10 text-left">
              <NavBtn label="DASHBOARD" active={activeTab === "DASHBOARD"} onClick={() => { setActiveTab("DASHBOARD"); setIsFacultyExpanded(false); setIsStudentExpanded(false); setSelectedFacultyResources(null); setStagedData(null); setIsSidebarOpen(false); }} />
              <NavBtn label={studentEditingId ? "STUDENT_REVISION" : "STUDENT_REG"} active={activeTab === "STUDENTS"} onClick={() => { setActiveTab("STUDENTS"); setIsSidebarOpen(false); }} />
              <NavBtn label={editingId ? "FACULTY_REVISION" : "FACULTY_REG"} active={activeTab === "FACULTY"} onClick={() => { setActiveTab("FACULTY"); setIsSidebarOpen(false); setGeneratedID(null); }} />
              <NavBtn label="NEURAL_LINK" color="#a855f7" active={activeTab === "NEURAL_LINK"} onClick={() => { setActiveTab("NEURAL_LINK"); setIsSidebarOpen(false); setGeneratedID(null); }} />
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-12 no-scrollbar text-left pt-20 md:pt-12">
        
        {activeTab === "DASHBOARD" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 md:space-y-12 pb-10">
            <header className="border-b border-white/10 pb-6 flex justify-between items-end">
                <div>
                  <h2 className="text-4xl sm:text-5xl md:text-7xl font-black italic text-white uppercase tracking-tighter">Command_<span className="text-[#00ff41]">Center</span></h2>
                  <motion.button 
                    whileHover={{ x: 5 }}
                    onClick={onBack}
                    className="mt-4 flex items-center gap-2 text-[10px] font-black text-white/30 tracking-[0.3em] uppercase italic transition-all group"
                  >
                    <span className="text-[#00ff41] group-hover:translate-x-[-3px] transition-transform">{"<"}</span> 
                    TERMINATE_SESSION_&_EXIT
                  </motion.button>
                </div>
                <div className="flex items-center gap-4 mb-2">
                    <div className="flex items-center gap-2">
                       <div className={`w-1.5 h-1.5 rounded-full ${autoSyncing ? 'bg-orange-500' : 'bg-[#00ff41] animate-ping'}`} />
                       <span className="text-[8px] font-black text-[#00ff41]/40 uppercase tracking-[0.2em]">{autoSyncing ? 'Syncing...' : 'Live_Sync_Active'}</span>
                    </div>
                    <button onClick={syncNow} disabled={autoSyncing} className={`text-[8px] font-black px-3 py-1 rounded-full border transition-all ${autoSyncing ? 'text-orange-500 border-orange-500/20' : 'text-[#00ff41] border-[#00ff41]/20 hover:bg-[#00ff41] hover:text-black'}`}>SYNC_NODES</button>
                </div>
            </header>

            <AnimatePresence mode="wait">
              {!isFacultyExpanded && !isStudentExpanded && !selectedFacultyResources && !stagedData ? (
                <motion.div key="summary" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} className="space-y-8 md:space-y-12">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    <div className="bg-white/[0.03] border-2 border-dashed border-[#00ff41]/20 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] group hover:border-[#00ff41]/60 transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-2xl">📊</span>
                          <h3 className="text-lg md:text-xl font-black italic text-[#00ff41] uppercase tracking-tighter">Import_Archive</h3>
                        </div>
                        <p className="text-[10px] text-white/40 mb-6 uppercase tracking-widest leading-relaxed">Sync database via Excel. Data will be previewed before commit.</p>
                      </div>
                      <div className="flex flex-col gap-3">
                        <input type="file" id="excelUpload" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleExcelPreview} />
                        <label htmlFor="excelUpload" className="cursor-pointer py-4 border border-[#00ff41]/30 bg-[#00ff41]/5 rounded-xl text-center text-[10px] font-black text-[#00ff41] hover:bg-[#00ff41] hover:text-black transition-all uppercase tracking-widest">
                          Scan_Excel_Archive
                        </label>
                      </div>
                    </div>

                    <div className="bg-white/[0.03] border-2 border-white/10 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-2xl">⚡</span>
                          <h3 className="text-lg md:text-xl font-black italic text-white uppercase tracking-tighter">System_Actions</h3>
                        </div>
                        <p className="text-[10px] text-white/40 mb-6 uppercase tracking-widest leading-relaxed">Mass node manipulation & temporal phase shifting.</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => alert("PROMOTE_PROTOCOL_INITIATED")} className="py-4 border border-cyan-400/30 text-cyan-400 font-black text-[9px] rounded-xl hover:bg-cyan-400/10 tracking-tighter uppercase">Promote_Batch</button>
                        <button onClick={() => alert("ARCHIVE_PROTOCOL_INITIATED")} className="py-4 border border-red-500/30 text-red-500 font-black text-[9px] rounded-xl hover:bg-red-500/10 tracking-tighter uppercase">Archive_Alumni</button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                    <div onClick={() => setIsStudentExpanded(true)} className="cursor-pointer">
                      <RecordPill title="STUDENTS" count={studentList.length} color="#22d3ee" icon="👥" isInteractive={true} />
                    </div>
                    <div onClick={() => setIsFacultyExpanded(true)} className="cursor-pointer">
                      <RecordPill title="FACULTY_REGISTRY" count={facultyList.filter(f => f.isAdminApproved !== false).length} color="#00ff41" icon="👨‍🏫" isInteractive={true} />
                    </div>
                  </div>

                  {studentList.length > 0 && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mt-4 border-t border-white/10 pt-10">
                          
                          <div className="bg-white/[0.02] border-2 border-white/5 p-6 rounded-[2.5rem] flex flex-col items-center">
                              <h3 className="text-xs font-black italic text-white/50 uppercase tracking-[0.3em] mb-6 w-full text-left">Node_Distribution_By_Course</h3>
                              <div className="w-full h-64">
                                  <ResponsiveContainer width="100%" height="100%">
                                      <PieChart>
                                          <Pie data={courseStats} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                                              {courseStats.map((entry, index) => (
                                                  <Cell key={`cell-${index}`} fill={RADAR_COLORS[index % RADAR_COLORS.length]} />
                                              ))}
                                          </Pie>
                                          <RechartsTooltip content={<CustomTooltip />} />
                                      </PieChart>
                                  </ResponsiveContainer>
                              </div>
                              <div className="flex flex-wrap justify-center gap-4 mt-4">
                                  {courseStats.map((entry, index) => (
                                      <div key={index} className="flex items-center gap-2">
                                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: RADAR_COLORS[index % RADAR_COLORS.length] }}></div>
                                          <span className="text-[10px] font-black uppercase text-white/60">{entry.name} ({entry.value})</span>
                                      </div>
                                  ))}
                              </div>
                          </div>

                          <div className="bg-white/[0.02] border-2 border-white/5 p-6 rounded-[2.5rem] flex flex-col items-center">
                              <h3 className="text-xs font-black italic text-white/50 uppercase tracking-[0.3em] w-full text-left mb-6">Phase_Density_By_Semester</h3>
                              <div className="w-full h-64">
                                  <ResponsiveContainer width="100%" height="100%">
                                      <BarChart data={semStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                          <XAxis dataKey="name" stroke="#ffffff33" tick={{ fill: '#ffffff66', fontSize: 10, fontFamily: 'monospace' }} />
                                          <YAxis stroke="#ffffff33" tick={{ fill: '#ffffff66', fontSize: 10, fontFamily: 'monospace' }} />
                                          <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff0a' }} />
                                          <Bar dataKey="students" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                                      </BarChart>
                                  </ResponsiveContainer>
                              </div>
                          </div>

                      </div>
                  )}

                </motion.div>
              
              ) : stagedData ? (
                <motion.div key="staging-preview" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-20">
                   
                   <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-[#00ff41]/5 border-2 border-[#00ff41]/30 p-6 rounded-[2rem] gap-6">
                       <div>
                           <h3 className="text-[#00ff41] font-black text-2xl md:text-3xl italic tracking-tighter uppercase">Vault_Staging_Area</h3>
                           <div className="flex items-center gap-4 mt-2">
                               <p className="text-[10px] md:text-xs font-bold text-white/50 uppercase tracking-widest">
                                   Total Nodes: <span className="text-white">{stagedData.length}</span>
                               </p>
                               {invalidNodesCount > 0 && (
                                   <div className="bg-red-500/20 border border-red-500/50 text-red-500 px-3 py-1 rounded text-[9px] font-black tracking-widest uppercase animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                                       ⚠️ {invalidNodesCount} Anomalies
                                   </div>
                               )}
                           </div>
                       </div>
                       <div className="flex flex-col sm:flex-row flex-wrap gap-4 w-full lg:w-auto">
                           <input 
                                type="text" 
                                placeholder="TARGET_REG_NO..." 
                                value={stagingSearch}
                                onChange={(e) => setStagingSearch(e.target.value)}
                                className="bg-black/50 border border-white/20 px-4 py-3 rounded-xl outline-none focus:border-[#00ff41] text-[#00ff41] text-[10px] uppercase font-black w-full sm:w-40 placeholder:text-white/20 transition-all"
                           />
                           
                           <button onClick={handlePurgeDuplicates} className="px-4 py-3 border border-orange-500/50 text-orange-500 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-orange-50 hover:text-black transition-all">
                               Clean_Dupes
                           </button>

                           <button onClick={() => setShowAnomaliesOnly(!showAnomaliesOnly)} className={`px-4 py-3 border text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${showAnomaliesOnly ? 'bg-red-500 text-black border-red-500' : 'border-white/20 text-white/50 hover:text-white'}`}>
                               {showAnomaliesOnly ? "Show_All" : "Filter_Flags"}
                           </button>
                           <button onClick={() => setStagedData(null)} className="px-6 py-3 border border-red-500/50 text-red-500 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-red-50 hover:text-black transition-all">Abort</button>
                           <button onClick={handleExcelSync} className={`px-6 py-3 text-black font-black text-[10px] uppercase tracking-widest rounded-xl transition-all ${invalidNodesCount > 0 ? 'bg-white/20 cursor-not-allowed' : 'bg-[#00ff41] shadow-[0_0_20px_rgba(0,255,65,0.4)] hover:scale-105'}`}>
                               {invalidNodesCount > 0 ? "FIX_FLAGS_FIRST" : "Confirm_&_Sync"}
                           </button>
                       </div>
                   </div>
                   
                   <div className="bg-white/5 border-2 border-white/10 rounded-[2rem] overflow-hidden max-h-[60vh] overflow-y-auto no-scrollbar relative">
                       <table className="w-full text-left border-collapse min-w-[1000px]">
                           <thead className="bg-[#020617] sticky top-0 z-10 text-[10px] font-black text-[#00ff41] uppercase tracking-widest shadow-xl">
                               <tr>
                                   <th className="p-4 border-b border-white/10">RegNo</th>
                                   <th className="p-4 border-b border-white/10">Name</th>
                                   <th className="p-4 border-b border-white/10">Year</th>
                                   <th className="p-4 border-b border-white/10">Course</th>
                                   <th className="p-4 border-b border-white/10">Sem / Sec</th>
                                   <th className="p-4 border-b border-white/10">Contact</th>
                                   <th className="p-4 border-b border-white/10 text-right">Override</th>
                               </tr>
                           </thead>
                           <tbody className="text-[10px] md:text-xs text-white/70 uppercase tracking-widest font-bold">
                               {displayStagedData.slice(0, 100).map((row) => {
                                   const isInvalid = !row.regNo || !row.name;
                                   const isEditing = stagingEditIdx === row._tempId;
                                   
                                   const rowClass = isInvalid 
                                        ? 'bg-red-500/10 border-b border-red-500/30 text-red-100 shadow-[inset_4px_0_0_#ef4444]' 
                                        : 'border-b border-white/5 hover:bg-white/10';

                                   return (
                                   <tr key={row._tempId} className={`transition-colors ${isEditing ? 'bg-[#00ff41]/10 border-b border-[#00ff41]/30 shadow-[inset_4px_0_0_#00ff41]' : rowClass}`}>
                                       {isEditing ? (
                                           <>
                                               <td className="p-2"><input type="text" placeholder="ID" value={stagingEditForm.regNo || ''} onChange={(e) => setStagingEditForm({...stagingEditForm, regNo: e.target.value})} className="w-full bg-black/50 border border-[#00ff41]/50 p-2 text-white outline-none focus:border-[#00ff41] rounded" /></td>
                                               <td className="p-2"><input type="text" placeholder="NAME" value={stagingEditForm.name || ''} onChange={(e) => setStagingEditForm({...stagingEditForm, name: e.target.value})} className="w-full bg-black/50 border border-[#00ff41]/50 p-2 text-white outline-none focus:border-[#00ff41] rounded" /></td>
                                               <td className="p-2"><input type="text" placeholder="YR" value={stagingEditForm.year || ''} onChange={(e) => setStagingEditForm({...stagingEditForm, year: e.target.value})} className="w-full bg-black/50 border border-[#00ff41]/50 p-2 text-white outline-none focus:border-[#00ff41] rounded" /></td>
                                               <td className="p-2"><input type="text" value={stagingEditForm.course || ''} onChange={(e) => setStagingEditForm({...stagingEditForm, course: e.target.value})} className="w-full bg-black/50 border border-[#00ff41]/50 p-2 text-cyan-400 outline-none focus:border-[#00ff41] rounded" /></td>
                                               <td className="p-2 flex gap-1 items-center mt-2">
                                                   <input type="text" placeholder="SEM" value={stagingEditForm.semester || ''} onChange={(e) => setStagingEditForm({...stagingEditForm, semester: e.target.value})} className="w-12 bg-black/50 border border-[#00ff41]/50 p-2 text-white outline-none focus:border-[#00ff41] rounded text-center" />
                                                   <span className="text-white/30">/</span>
                                                   <input type="text" placeholder="SEC" value={stagingEditForm.section || ''} onChange={(e) => setStagingEditForm({...stagingEditForm, section: e.target.value})} className="w-12 bg-black/50 border border-[#00ff41]/50 p-2 text-white outline-none focus:border-[#00ff41] rounded text-center" />
                                               </td>
                                               <td className="p-2"><input type="text" value={stagingEditForm.email || ''} onChange={(e) => setStagingEditForm({...stagingEditForm, email: e.target.value})} className="w-full bg-black/50 border border-[#00ff41]/50 p-2 text-white/60 lowercase outline-none focus:border-[#00ff41] rounded" /></td>
                                               <td className="p-2 text-right">
                                                   <div className="flex justify-end gap-2">
                                                       <button onClick={handleSaveStagingRow} className="bg-[#00ff41] text-black px-2 py-1 rounded hover:scale-105 transition-transform">SAVE</button>
                                                       <button onClick={() => setStagingEditIdx(null)} className="bg-white/10 text-white px-2 py-1 rounded hover:bg-white/20 transition-colors">X</button>
                                                   </div>
                                               </td>
                                           </>
                                       ) : (
                                           <>
                                               <td className="p-4">{row.regNo || <span className="text-red-500 font-black animate-pulse">NULL_ID</span>}</td>
                                               <td className="p-4 text-white">{row.name || <span className="text-red-500 font-black animate-pulse">NULL_NAME</span>}</td>
                                               <td className="p-4 text-[#a855f7] font-black text-[14px]">{row.year ? `YR_${row.year}` : 'N/A'}</td>
                                               <td className="p-4 text-cyan-400">{row.course || "N/A"}</td>
                                               <td className="p-4 text-[9px] text-white/50">SEM_{row.semester || '1'} // SEC_{row.section || 'A'}</td>
                                               <td className="p-4">
                                                    <p className="text-white/60 lowercase truncate text-[10px]">{row.email}</p>
                                                    <p className="text-white/40 text-[8px] mt-1">Ph: {row.phone}</p>
                                               </td>
                                               <td className="p-4 text-right">
                                                   <div className="flex justify-end gap-3 opacity-30 hover:opacity-100 transition-opacity">
                                                       <button onClick={() => handleEditStagingRow(row._tempId, row)} className="text-[#00ff41] hover:underline tracking-widest text-[9px]">EDIT</button>
                                                       <button onClick={() => handleDeleteStagingRow(row._tempId)} className="text-red-500 hover:underline tracking-widest text-[9px]">DROP</button>
                                                   </div>
                                               </td>
                                           </>
                                       )}
                                   </tr>
                               )})}
                           </tbody>
                       </table>
                       {displayStagedData.length === 0 && (
                           <div className="py-20 text-center text-white/20 text-[10px] font-black uppercase tracking-widest">
                               NO_DATA_MATCHES_QUERY
                           </div>
                       )}
                       {displayStagedData.length > 100 && (
                           <div className="p-6 text-center text-[10px] text-[#00ff41] font-black uppercase tracking-widest bg-[#020617] border-t border-white/10">
                               + {displayStagedData.length - 100} More Nodes Hidden For Performance
                           </div>
                       )}
                   </div>
                </motion.div>

              ) : isStudentExpanded ? (
                <motion.div key="student-details" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="space-y-8 md:space-y-10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-[#22d3ee] pl-4 md:pl-6">
                    <div>
                        <h3 className="text-xl md:text-2xl font-black italic text-[#22d3ee] uppercase tracking-widest">Student_Directory</h3>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">Found {processedStudents.length} Active Nodes</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleExportExcel} className="w-fit text-[10px] font-black bg-[#22d3ee]/10 text-[#22d3ee] border border-[#22d3ee]/50 px-6 py-2 rounded-full hover:bg-[#22d3ee] hover:text-black transition-all uppercase tracking-widest flex items-center gap-2">
                            📥 Download_Archive
                        </button>
                        <button onClick={() => setIsStudentExpanded(false)} className="w-fit text-[10px] font-black border border-white/20 px-6 py-2 rounded-full hover:bg-white hover:text-black transition-all uppercase tracking-widest bg-white/5">Back_To_Core</button>
                    </div>
                  </div>
                  
                  <div className="bg-white/[0.02] border border-white/10 p-4 md:p-6 rounded-[1.5rem] flex flex-col lg:flex-row gap-4">
                      <div className="flex-1 relative">
                        <input 
                          type="text" 
                          placeholder="SEARCH_BY_NAME_OR_REG_NO..." 
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full bg-black/50 border border-white/10 p-4 rounded-xl outline-none focus:border-[#22d3ee] transition-all text-[#22d3ee] font-black text-xs uppercase placeholder:text-white/20"
                        />
                      </div>
                      <div className="flex flex-wrap sm:flex-nowrap gap-4">
                          <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="flex-1 sm:w-32 bg-black/50 border border-white/10 p-4 rounded-xl outline-none focus:border-[#22d3ee] text-[#22d3ee] text-xs font-black uppercase cursor-pointer appearance-none">
                              <option value="ALL">Year: ALL</option>
                              <option value="1">1st Year</option>
                              <option value="2">2nd Year</option>
                              <option value="3">3rd Year</option>
                              <option value="4">4th Year</option>
                          </select>
                          <select value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)} className="flex-1 sm:w-32 bg-black/50 border border-white/10 p-4 rounded-xl outline-none focus:border-[#22d3ee] text-[#22d3ee] text-xs font-black uppercase cursor-pointer appearance-none">
                              <option value="ALL">Course: ALL</option>
                              <option value="B.TECH">B.TECH</option>
                              <option value="BCA">BCA</option>
                              <option value="MCA">MCA</option>
                              <option value="B.PHARMA">B.PHARMA</option>
                              <option value="D.PHARMA">D.PHARMA</option>
                              <option value="MBA">MBA</option>
                              <option value="BBA">BBA</option>
                          </select>
                          <select value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)} className="flex-1 sm:w-32 bg-black/50 border border-white/10 p-4 rounded-xl outline-none focus:border-[#22d3ee] text-[#22d3ee] text-xs font-black uppercase cursor-pointer appearance-none">
                              <option value="ALL">Sem: ALL</option>
                              {[1,2,3,4,5,6,7,8].map(num => <option key={num} value={String(num)}>Sem {num}</option>)}
                          </select>
                          <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)} className="flex-1 sm:w-32 bg-black/50 border border-white/10 p-4 rounded-xl outline-none focus:border-[#22d3ee] text-[#22d3ee] text-xs font-black uppercase cursor-pointer appearance-none">
                              <option value="ALL">Sec: ALL</option>
                              <option value="A">Sec A</option>
                              <option value="B">Sec B</option>
                              <option value="C">Sec C</option>
                          </select>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {filteredStudents && filteredStudents.length > 0 ? (
                      filteredStudents.map((s) => (
                        <div key={s._id || s.id || Math.random()} 
                             onClick={() => setInspectedStudent(s)} 
                             className="bg-white/[0.03] border-2 border-white/10 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] relative group hover:border-[#22d3ee]/50 transition-all cursor-pointer overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-[8px] font-black text-[#22d3ee] tracking-widest animate-pulse">INSPECT_VAULT</span>
                          </div>
                          <span className="text-[10px] font-black bg-[#22d3ee] text-black px-3 py-1 rounded uppercase">
                            {s.regNo || s.collegeId || s.rollNo || "N/A"}
                          </span>
                          <h4 className="text-xl md:text-2xl font-black text-white italic uppercase mt-6 tracking-tighter leading-none">{s.name}</h4>
                          <p className="text-[11px] text-[#22d3ee]/60 font-bold mt-2 lowercase truncate">{s.email}</p>
                          <div className="pt-6 mt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center text-[10px] md:text-xs font-black text-white/40 uppercase italic gap-2">
                             <span>{s.course || "BCA"} // YR_{s.year || "N/A"}</span>
                             <span>SEM_{s.semester || "1"} // SEC_{s.section || "A"}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-20 border-2 border-dashed border-white/5 rounded-[3rem]">
                        <p className="text-white/20 font-black tracking-[0.3em] uppercase italic text-xs">No_Matching_Entities_Found_In_Vault</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : selectedFacultyResources ? (
                <motion.div key="resource-vault" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8 md:space-y-10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-[#00ff41] pl-4 md:pl-6">
                        <div>
                            <h3 className="text-xl md:text-2xl font-black italic text-[#00ff41] uppercase tracking-widest truncate">{selectedFacultyResources.name || selectedFacultyResources.facultyName}_VAULT</h3>
                            <p className="text-[9px] md:text-[10px] text-white/40 mt-1 uppercase">Viewing: Faculty_Lecture_Packets</p>
                        </div>
                        <button onClick={() => setSelectedFacultyResources(null)} className="w-fit text-[10px] font-black border border-white/20 px-6 py-2 rounded-full hover:bg-white hover:text-black transition-all uppercase tracking-widest bg-white/5">Back_To_Nodes</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(selectedFacultyResources.lectures || []).map((lec) => (
                           <div key={lec.id} className="bg-white/5 border border-white/10 p-5 md:p-6 rounded-2xl flex justify-between items-center group">
                                <div>
                                    <h4 className="text-xs md:text-sm font-black text-white uppercase italic">{lec.topic}</h4>
                                    <p className="text-[8px] md:text-[9px] text-white/30 uppercase mt-1 tracking-widest">Date: {lec.date} // Unit: {lec.unit}</p>
                                </div>
                                <div className="text-[#00ff41] text-[8px] md:text-[9px] font-black ml-2">SYNC</div>
                           </div>
                        ))}
                    </div>
                </motion.div>
              ) : (
                <motion.div key="faculty-details" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="space-y-8 md:space-y-10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-[#00ff41] pl-4 md:pl-6">
                    <h3 className="text-xl md:text-2xl font-black italic text-[#00ff41] uppercase tracking-widest">Authorized_Nodes</h3>
                    <button onClick={() => setIsFacultyExpanded(false)} className="w-fit text-[10px] font-black border border-white/20 px-6 py-2 rounded-full hover:bg-white hover:text-black transition-all uppercase tracking-widest bg-white/5">Back_To_Core</button>
                  </div>

                  {/* 🔥 NEW: PENDING APPROVALS SECTION - CRASH PROOF NOW */}
                  {facultyList.filter(f => !f.isAdminApproved).length > 0 && (
                      <div className="mb-8">
                          <h4 className="text-[10px] font-black text-orange-500 tracking-[0.3em] uppercase mb-4 pl-2 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span> Pending Access Requests
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {facultyList.filter(f => !f.isAdminApproved).map(f => (
                                  <div key={f._id || f.id} className="bg-orange-500/5 border border-orange-500/30 p-5 rounded-2xl flex flex-col justify-between">
                                      <div>
                                          <h4 className="text-lg font-black text-white italic uppercase tracking-tighter">{f.facultyName || f.name}</h4>
                                          <p className="text-[9px] text-white/50 tracking-widest mt-1">{f.emailID || f.email}</p>
                                          <p className="text-[9px] text-orange-500/80 font-bold uppercase mt-2">
                                              Requested Courses: {f.courses && Array.isArray(f.courses) && f.courses.length > 0 ? f.courses.join(', ') : "NONE"}
                                          </p>
                                      </div>
                                      <div className="mt-4 flex gap-2">
                                          <button onClick={() => approveFaculty(f._id || f.id)} className="flex-1 bg-orange-500 hover:bg-orange-400 text-black py-2 rounded-xl text-[9px] font-black tracking-widest uppercase transition-colors">
                                              Approve_&_Generate_ID
                                          </button>
                                          <button onClick={() => terminateNode(f._id || f.id)} className="px-4 border border-red-500/30 text-red-500 hover:bg-red-500/10 rounded-xl text-[9px] font-black transition-colors">
                                              Deny
                                          </button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}

                  {/* ACTIVE REGISTRY SECTION */}
                  <h4 className="text-[10px] font-black text-[#00ff41]/50 tracking-[0.3em] uppercase mb-4 pl-2 border-t border-white/5 pt-8">Active Registry</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {facultyList.filter(f => f.isAdminApproved).map((f) => (
                      <div key={f._id || f.id} onClick={() => setSelectedFacultyResources(f)} className="bg-white/[0.03] border-2 border-white/10 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] relative group hover:border-[#00ff41]/50 transition-all cursor-pointer">
                        <div className="absolute top-6 right-6 flex gap-3 opacity-40 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => {e.stopPropagation(); triggerEdit(f);}} className="text-[10px] font-black text-cyan-400 hover:underline">EDIT</button>
                            <button onClick={(e) => {e.stopPropagation(); terminateNode(f._id || f.id);}} className="text-[10px] font-black text-red-500 hover:underline">TERMINATE</button>
                        </div>
                        <span className="text-[10px] font-black bg-[#00ff41] text-black px-3 py-1 rounded uppercase">{f.facultyID || "VERIFIED"}</span>
                        <h4 className="text-xl md:text-2xl font-black text-white italic uppercase mt-6 tracking-tighter leading-none">{f.facultyName || f.name}</h4>
                        <p className="text-[11px] text-[#00ff41]/60 font-bold mt-2 lowercase truncate">{f.emailID || f.email}</p>
                        <div className="pt-6 mt-6 border-t border-white/5 flex justify-between items-center text-[10px] md:text-xs font-black text-white/40 uppercase italic">
                           <span>{f.courses && Array.isArray(f.courses) && f.courses.length > 0 ? f.courses.join(", ") : "PENDING_SETUP"}</span>
                           <span className="text-[9px] font-black text-[#00ff41] animate-pulse">VAULT</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {activeTab === "NEURAL_LINK" && (
          <div className="max-w-4xl mx-auto space-y-8 md:space-y-12 text-left pb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black italic text-white uppercase tracking-tighter">
                Neural_Link <span className="text-[#a855f7]">Assignment</span>
            </h2>
            <div className="relative p-[2px] sm:p-[3px] rounded-[2rem] md:rounded-[3.5rem] overflow-hidden shadow-[0_0_80px_rgba(168,85,247,0.15)]">
                <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-[-150%] bg-[conic-gradient(from_0deg,transparent,transparent,#a855f7,#a855f7,transparent,transparent)] opacity-100" />
                <div className="relative bg-[#020617]/95 backdrop-blur-3xl rounded-[1.9rem] md:rounded-[3.3rem] p-6 sm:p-10 md:p-16 border-2 border-white/10">
                    
                    <div className="mb-10 p-6 bg-[#a855f7]/10 border border-[#a855f7]/30 rounded-[1.5rem]">
                        <p className="text-[10px] md:text-xs text-white/60 uppercase tracking-widest font-bold leading-relaxed">
                            <span className="text-[#a855f7]">PROTOCOL_BRIEF:</span> Link a Faculty Node to a specific Student Batch. This grants the faculty access to manage attendance and records for that class.
                        </p>
                    </div>

                    <form onSubmit={handleEstablishLink} className="space-y-6 md:space-y-10">
                        <div className="flex flex-col gap-3 md:gap-4">
                            <label className="text-[10px] md:text-xs font-black text-white/30 ml-2 md:ml-4 tracking-[0.2em] md:tracking-[0.3em] uppercase italic">Target_Faculty_Node</label>
                            <select 
                                value={linkData.facultyId} 
                                onChange={(e) => setLinkData({...linkData, facultyId: e.target.value})} 
                                className="bg-[#0f172a] border-2 border-white/10 p-4 md:p-6 rounded-2xl md:rounded-3xl outline-none focus:border-[#a855f7] text-white text-sm md:text-base font-black cursor-pointer appearance-none uppercase"
                            >
                                <option value="">-- SELECT_FACULTY --</option>
                                {facultyList.filter(f => f.isAdminApproved).map(f => (
                                    <option key={f._id || f.id} value={f._id || f.id}>{f.facultyName || f.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8">
                            <BigSelect label="Course" options={["B.TECH", "BCA", "MCA", "B.PHARMA", "D.PHARMA", "MBA", "BBA"]} value={linkData.course} onChange={(e) => setLinkData({...linkData, course: e.target.value})} color="focus:border-[#a855f7]" />
                            <BigSelect label="Semester" options={["1", "2", "3", "4", "5", "6", "7", "8"]} value={linkData.semester} onChange={(e) => setLinkData({...linkData, semester: e.target.value})} color="focus:border-[#a855f7]" />
                            <BigSelect label="Section" options={["A", "B", "C"]} value={linkData.section} onChange={(e) => setLinkData({...linkData, section: e.target.value})} color="focus:border-[#a855f7]" />
                        </div>
                        
                        <BigInput label="Subject_Code_Or_Name" placeholder="EX: CS-101 (DATA STRUCTURES)" value={linkData.subject} onChange={(e) => setLinkData({...linkData, subject: e.target.value})} color="focus:border-[#a855f7]" />
                        
                        <button type="submit" className="w-full py-6 md:py-8 bg-[#a855f7] text-black font-black uppercase tracking-[0.3em] md:tracking-[0.6em] text-xs md:text-sm rounded-full shadow-[0_20px_50px_rgba(168,85,247,0.4)] mt-4 hover:scale-[1.02] transition-transform">
                            ESTABLISH_NEURAL_LINK
                        </button>
                    </form>
                </div>
            </div>
          </div>
        )}

        {activeTab === "STUDENTS" && (
          <div className="max-w-4xl mx-auto space-y-8 md:space-y-12 text-left pb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black italic text-white uppercase tracking-tighter">
                {studentEditingId ? "Student_Revision" : "Student_Onboarding"}
            </h2>
            <div className="relative p-[2px] sm:p-[3px] rounded-[2rem] md:rounded-[3.5rem] overflow-hidden shadow-[0_0_80px_rgba(34,211,238,0.15)]">
                <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-[-150%] bg-[conic-gradient(from_0deg,transparent,transparent,#22d3ee,#22d3ee,transparent,transparent)] opacity-100" />
                <div className="relative bg-[#020617]/95 backdrop-blur-3xl rounded-[1.9rem] md:rounded-[3.3rem] p-6 sm:p-10 md:p-16 border-2 border-white/10">
                    <form onSubmit={handleStudentRegister} className="space-y-6 md:space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                            <BigInput label="Legal_Name" placeholder="EX: TONY_PARKER" value={studentData.name} onChange={(e) => setStudentData({...studentData, name: e.target.value})} color="focus:border-[#22d3ee]" />
                            <BigInput label="Registration_Number" placeholder="AC-01_FORMAT" value={studentData.rollNo} onChange={(e) => setStudentData({...studentData, rollNo: e.target.value})} color="focus:border-[#22d3ee]" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                            <BigInput label="Year" placeholder="EX: 1, 2026, etc." value={studentData.year} onChange={(e) => setStudentData({...studentData, year: e.target.value})} color="focus:border-[#22d3ee]" />
                            <BigSelect label="Course" options={["B.TECH", "BCA", "MCA", "B.PHARMA", "D.PHARMA", "MBA", "BBA"]} value={studentData.course} onChange={(e) => setStudentData({...studentData, course: e.target.value})} color="focus:border-[#22d3ee]" />
                            <BigSelect label="Section" options={["A", "B", "C"]} value={studentData.section} onChange={(e) => setStudentData({...studentData, section: e.target.value})} color="focus:border-[#22d3ee]" />
                            <BigSelect label="Semester" options={["1", "2", "3", "4", "5", "6", "7", "8"]} value={studentData.semester} onChange={(e) => setStudentData({...studentData, semester: e.target.value})} color="focus:border-[#22d3ee]" />
                        </div>
                        <BigInput label="Email_Address" placeholder="TONY@STUDENT.ORG" value={studentData.email} onChange={(e) => setStudentData({...studentData, email: e.target.value})} color="focus:border-[#22d3ee]" />
                        <button type="submit" className="w-full py-6 md:py-8 bg-[#22d3ee] text-black font-black uppercase tracking-[0.3em] md:tracking-[0.6em] text-xs md:text-sm rounded-full shadow-[0_20px_50px_rgba(34,211,238,0.4)] mt-4">
                            {studentEditingId ? "COMMIT_CHANGES" : "AUTHORIZE_ENTITY"}
                        </button>
                    </form>
                </div>
            </div>
          </div>
        )}

        {activeTab === "FACULTY" && (
          <div className="max-w-2xl mx-auto space-y-8 md:space-y-12 text-left pb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black italic text-white uppercase tracking-tighter">
                {editingId ? "Node_Revision" : "Node_Provisioning"}
            </h2>
            <div className="relative p-[2px] sm:p-[3px] rounded-[2rem] md:rounded-[3.5rem] overflow-hidden shadow-[0_0_80px_rgba(0,255,65,0.15)]">
                <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-[-150%] bg-[conic-gradient(from_0deg,transparent,transparent,#00ff41,#00ff41,transparent,transparent)] opacity-100" />
                <div className="relative bg-[#020617]/95 backdrop-blur-3xl rounded-[1.9rem] md:rounded-[3.3rem] p-6 sm:p-10 md:p-16 border-2 border-white/10 text-center">
                    
                    <AnimatePresence>
                        {generatedID ? (
                            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-10">
                                <p className="text-[10px] text-[#00ff41] font-black uppercase tracking-widest mb-4">Provide this ID to the Faculty:</p>
                                <div className="bg-[#00ff41]/10 border-2 border-[#00ff41]/50 p-8 rounded-3xl inline-block shadow-[0_0_40px_rgba(0,255,65,0.2)]">
                                    <h1 className="text-5xl md:text-6xl font-black text-white italic tracking-tighter">{generatedID}</h1>
                                </div>
                                <button onClick={() => setGeneratedID(null)} className="block mx-auto mt-6 text-[10px] font-black text-white/50 hover:text-white uppercase tracking-widest transition-all">Generate_Another</button>
                            </motion.div>
                        ) : (
                            <form onSubmit={generateFacultyCode} className="space-y-6 md:space-y-10 text-left">
                                <p className="text-[10px] text-white/50 uppercase tracking-widest leading-relaxed text-center mb-8">
                                    Enter the Legal Name. The system will auto-generate a Secure Auth ID. The faculty will use this ID to complete their Vault Setup.
                                </p>
                                <BigInput label="Legal_Name" placeholder="EX: DR. VICTOR_STARK" value={facultyData.facultyName} onChange={(e) => setFacultyData({...facultyData, facultyName: e.target.value})} />
                                <button type="submit" className="w-full py-6 md:py-8 bg-[#00ff41] text-black font-black uppercase tracking-[0.3em] md:tracking-[0.6em] text-xs md:text-sm rounded-full shadow-[0_20px_50px_rgba(0,255,65,0.4)] mt-4 hover:scale-[1.02] transition-transform">
                                    GENERATE_SECURE_ID
                                </button>
                            </form>
                        )}
                    </AnimatePresence>

                </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const BigInput = ({ label, placeholder, value, onChange, color = "focus:border-[#00ff41]" }) => (
    <div className="flex flex-col gap-3 md:gap-4 group">
      <label className="text-[10px] md:text-xs font-black text-white/30 ml-2 md:ml-4 tracking-[0.2em] md:tracking-[0.3em] uppercase italic transition-colors">{label}</label>
      <input type="text" placeholder={placeholder} value={value !== undefined && value !== null ? value : ''} onChange={onChange}
             className={`w-full bg-white/[0.03] border-2 border-white/10 p-4 md:p-6 rounded-2xl md:rounded-3xl outline-none ${color} transition-all text-white text-sm md:text-base font-black uppercase tracking-widest`} />
    </div>
);

const BigSelect = ({ label, options, value, onChange, color = "focus:border-[#00ff41]" }) => (
    <div className="flex flex-col gap-3 md:gap-4">
        <label className="text-[10px] md:text-xs font-black text-white/30 ml-2 md:ml-4 tracking-[0.2em] md:tracking-[0.3em] uppercase italic">{label}</label>
        <select value={value} onChange={onChange} className={`bg-[#0f172a] border-2 border-white/10 p-4 md:p-6 rounded-2xl md:rounded-3xl outline-none ${color} text-white text-sm md:text-base font-black cursor-pointer appearance-none uppercase`}>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
    </div>
);

const RecordPill = ({ title, count, color, icon, isInteractive }) => (
    <div className={`bg-black border-2 border-white/5 p-8 md:p-10 rounded-[2rem] md:rounded-[3rem] flex flex-col items-center shadow-2xl relative overflow-hidden transition-all ${isInteractive ? 'hover:scale-[1.02] active:scale-95' : ''}`}>
        <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: color }} />
        <span className="text-4xl md:text-5xl mb-4">{icon}</span>
        <h3 className="text-base md:text-xl font-black text-white/40 tracking-[0.2em] md:tracking-[0.4em] mb-4 uppercase">{title}</h3>
        <span className="text-6xl md:text-8xl font-black tracking-tighter italic" style={{ color }}>{count}</span>
        {isInteractive && <span className="text-[8px] md:text-[10px] mt-4 font-black text-white/20 tracking-widest animate-pulse">TOUCH_TO_MANAGE</span>}
    </div>
);

const NavBtn = ({ label, active, onClick, color }) => (
    <button onClick={onClick} className={`relative p-4 md:p-5 rounded-xl md:rounded-2xl flex items-center transition-all w-full md:w-auto ${active ? `text-[${color || '#00ff41'}]` : 'text-white/30'}`}>
        {active && <motion.div layoutId="activeNav" className="absolute inset-0 bg-white/5 border-2 rounded-xl md:rounded-2xl" style={{ borderColor: color ? `${color}40` : '#00ff4140' }} />}
        <span className="font-black text-[10px] md:text-xs tracking-widest relative z-10 uppercase" style={{ color: active ? (color || '#00ff41') : '' }}>{label}</span>
    </button>
);

export default AdminPanel;