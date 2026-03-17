import { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const NeuralScanner = ({ onScanSuccess, onClose }) => {
  useEffect(() => {
    // 🛡️ Neural Scanner Config
    const scanner = new Html5QrcodeScanner("reader", { 
      fps: 15, 
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
      supportedScanTypes: [0] // Camera Only
    });

    const handleSuccess = (decodedText) => {
      scanner.clear(); // Camera off
      onScanSuccess(decodedText); 
    };

    scanner.render(handleSuccess, (err) => { /* Scanning... */ });

    // 🧹 Cleanup
    return () => {
      scanner.clear().catch(error => console.error("Scanner Exit Failure", error));
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[10000] bg-black/95 flex flex-col items-center justify-center p-6">
      <div className="relative w-full max-w-sm border-2 border-[#00ff41] rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,255,65,0.3)]">
        <div id="reader" className="w-full"></div>
      </div>
      <button 
        onClick={onClose}
        className="mt-12 text-[#ff4141] font-black uppercase tracking-[0.4em] text-[10px] border border-[#ff4141]/30 px-8 py-3 rounded-full hover:bg-[#ff4141] hover:text-white transition-all"
      >
        TERMINATE_UPLINK
      </button>
    </div>
  );
};

export default NeuralScanner;