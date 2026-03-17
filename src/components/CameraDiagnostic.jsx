import React, { useState } from 'react';

const CameraDiagnostic = () => {
    const [status, setStatus] = useState("IDLE");
    const [error, setError] = useState("");

    const checkCamera = async () => {
        setStatus("TESTING...");
        setError("");

        // 1. Check if browser even supports mediaDevices
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setStatus("FAILED");
            setError("BROWSER_INCOMPATIBLE: Tera browser camera support hi nahi kar raha ya HTTP ki wajah se block hai.");
            return;
        }

        try {
            // 2. Try to trigger the camera
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setStatus("SUCCESS ✅");
            alert("Camera Access Granted! Ab scanner chalna chahiye.");
            
            // Camera band kar do test ke baad
            stream.getTracks().forEach(track => track.stop());
        } catch (err) {
            setStatus("DENIED ❌");
            if (err.name === 'NotAllowedError') {
                setError("PERMISSION_DENIED: Tune browser mein 'Block' kar rakha hai. Settings se allow kar.");
            } else if (err.name === 'NotFoundError') {
                setError("NO_CAMERA_FOUND: Mobile mein camera detect nahi ho raha.");
            } else {
                setError(`ERROR: ${err.message}`);
            }
        }
    };

    return (
        <div style={{ padding: '20px', background: '#111', color: '#00ff41', borderRadius: '15px', border: '1px solid #00ff4133' }}>
            <h3 style={{ fontSize: '12px', letterSpacing: '2px' }}>[ SYSTEM_DIAGNOSTIC_V1 ]</h3>
            <p>Status: <strong>{status}</strong></p>
            {error && <p style={{ color: '#ff4141', fontSize: '10px' }}>⚠️ {error}</p>}
            
            <button 
                onClick={checkCamera}
                style={{ background: '#00ff41', color: '#000', padding: '10px 20px', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}
            >
                TEST_CAMERA_UPLINK
            </button>
        </div>
    );
};

export default CameraDiagnostic;