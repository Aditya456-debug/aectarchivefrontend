// frontend/src/utils/geoService.js

// 🛑 THE MASTER KILL-SWITCH
const ENABLE_GEOFENCE = false; // Presentation mein fail ho toh bas ise 'false' kar dena

const COLLEGE_LAT = 27.8455;  // 📍 Google maps se yahan paste kar
const COLLEGE_LON = 78.0523;  // 📍 Google maps se yahan paste kar
const ALLOWED_RADIUS_KM = 0.2; // 200 meters range

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; 
};

export const verifyLocation = () => {
    return new Promise((resolve, reject) => {
        if (!ENABLE_GEOFENCE) {
            console.log("🛡️ Geofence Disabled: Bypassing...");
            return resolve(true); 
        }

        if (!navigator.geolocation) {
            return reject("Browser does not support Geolocation!");
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const distance = calculateDistance(
                    position.coords.latitude,
                    position.coords.longitude,
                    COLLEGE_LAT,
                    COLLEGE_LON
                );

                if (distance <= ALLOWED_RADIUS_KM) {
                    resolve(true);
                } else {
                    const distInMeters = (distance * 1000).toFixed(0);
                    reject(`ACCESS_DENIED: You are ${distInMeters}m away from college!`);
                }
            },
            (err) => reject("Please enable location access in your browser!"),
            { enableHighAccuracy: true, timeout: 10000 }
        );
    });
};