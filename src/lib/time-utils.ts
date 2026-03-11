/**
 * Converts 24-hour time string (HH:mm) to 12-hour components.
 */
export function format24to12(time24: string) {
    if (!time24) return { hour: '12', minute: '00', period: 'AM' };
    
    const [hStr, mStr] = time24.split(':');
    let hour = parseInt(hStr, 10);
    const minute = mStr || '00';
    const period = hour >= 12 ? 'PM' : 'AM';
    
    hour = hour % 12;
    if (hour === 0) hour = 12;
    
    return {
        hour: hour.toString().padStart(2, '0'),
        minute,
        period
    };
}

/**
 * Converts 12-hour components back to 24-hour time string (HH:mm).
 */
export function format12to24(hour: string | number, minute: string | number, period: string) {
    let h = typeof hour === 'string' ? parseInt(hour, 10) : hour;
    const m = minute.toString().padStart(2, '0');
    
    if (period === 'PM' && h < 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    
    return `${h.toString().padStart(2, '0')}:${m}`;
}
/**
 * Converts 24-hour time string (HH:mm:ss) to formatted 12-hour string (hh:mm AM/PM).
 */
export function format24to12String(time24: string) {
    if (!time24) return "";
    const { hour, minute, period } = format24to12(time24);
    return `${hour}:${minute} ${period}`;
}
