import { useEffect, useState, useCallback } from 'react';

/**
 * 🛰️ THE CYBER-HUB LIVE SYNC HOOK
 * Automatically handles polling and manual refreshes for any dashboard.
 */
const useLiveSync = (fetchFunction, intervalTime = 10000) => {
    const [isSyncing, setIsSyncing] = useState(false);

    // Manual Refresh Trigger
    const syncNow = useCallback(async () => {
        setIsSyncing(true);
        try {
            await fetchFunction();
        } catch (error) {
            console.error("Manual Sync Failed:", error);
        }
        // Aesthetic delay taaki user ko feel ho ki sync ho raha hai
        setTimeout(() => setIsSyncing(false), 800);
    }, [fetchFunction]);

    useEffect(() => {
        // First initial pull
        fetchFunction();

        // Heartbeat interval for live updates
        const heartBeat = setInterval(() => {
            fetchFunction();
            console.log("📡 [SYSTEM]: CORE_SYNC_COMPLETE");
        }, intervalTime);

        // Terminate heartbeat on unmount
        return () => clearInterval(heartBeat);
        
    // 🔥 STICKLY FIX: Removed 'fetchFunction' from array to destroy the INFINITE LOOP!
    }, [intervalTime]); 

    return { isSyncing, syncNow };
};

export default useLiveSync;