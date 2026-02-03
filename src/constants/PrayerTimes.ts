export interface PrayerTime {
    id: string;
    name: string;
    startTime: string; // HH:mm (24h)
    endTime: string;   // HH:mm (24h)
}

// Fixed times for demonstration. 
// In a real app, these would come from an API or calculation library (Adhan.js)
export const PRAYER_TIMES: PrayerTime[] = [
    { id: '1', name: 'Fajr', startTime: '05:00', endTime: '06:30' },
    { id: '2', name: 'Dhuhr', startTime: '12:30', endTime: '15:45' },
    { id: '3', name: 'Asr', startTime: '15:45', endTime: '18:15' },
    { id: '4', name: 'Maghrib', startTime: '18:15', endTime: '19:40' },
    { id: '5', name: 'Isha', startTime: '19:40', endTime: '23:59' },
];

export const getPrayerTimes = () => {
    return PRAYER_TIMES;
};

// Helper to check if a specific time has passed today
// Helper to check if a specific time has passed today (Uses PKT Timezone)
export const hasTimePassed = (targetTime: string): boolean => {
    try {
        // Get current time in Pakistan (PKT)
        // Format: HH:mm (24-hour)
        const nowPKT = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Asia/Karachi',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).format(new Date());

        // Simple string comparison works for HH:mm 24h format
        // e.g., "13:00" > "05:00" is true
        return nowPKT > targetTime;
    } catch (e) {
        console.warn("Error checking PKT time, falling back to local", e);
        // Fallback to local time if Intl fails
        const now = new Date();
        const currentLocal = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
        return currentLocal > targetTime;
    }
};

// Helper to get Date object for today from HH:mm
export const getDateFromTime = (timeString: string): Date => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    return d;
};
