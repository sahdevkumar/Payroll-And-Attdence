import { supabase } from '../lib/supabase';
import { biometricApi } from './biometricApi';

export interface AttendanceLog {
  id: string;
  employee_id: string;
  employee_name: string;
  timestamp: string;
  log_type: string;
  device_name: string;
  device_key: string;
  raw_data?: any;
}

export const attendanceService = {
  /**
   * Fetches logs from Supabase with filtering
   */
  getLogs: async (filters: {
    startDate?: string;
    endDate?: string;
    employeeId?: string;
    searchTerm?: string;
  } = {}) => {
    let query = supabase
      .from('attendance_logs')
      .select('*')
      .order('timestamp', { ascending: false });

    if (filters.startDate) {
      query = query.gte('timestamp', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('timestamp', filters.endDate);
    }
    if (filters.employeeId) {
      query = query.eq('employee_id', filters.employeeId);
    }
    if (filters.searchTerm) {
      query = query.or(`employee_name.ilike.%${filters.searchTerm}%,employee_id.ilike.%${filters.searchTerm}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as AttendanceLog[];
  },

  /**
   * Syncs logs from all devices to Supabase
   */
  syncLogs: async () => {
    try {
      // 1. Get all devices
      const devices = await biometricApi.getAllDevices();
      
      let totalSynced = 0;

      for (const device of devices) {
        // 2. Fetch logs from device
        // Note: fetchAllLogs uses DownloadLogsByDate with a wide range
        const deviceLogs = await biometricApi.fetchAllLogs(device.DeviceKey);
        
        if (!deviceLogs || !Array.isArray(deviceLogs)) continue;

        // 3. Transform and prepare for upsert
        const logsToUpsert = deviceLogs.map((log: any) => ({
          employee_id: log.UserId || log.userId || 'Unknown',
          employee_name: log.UserName || log.userName || 'Unknown',
          timestamp: log.LogTime || log.logTime || new Date().toISOString(),
          log_type: log.LogType || log.logType || 'Check In',
          device_name: device.DeviceName || 'Unknown Device',
          device_key: device.DeviceKey,
          // Create a unique constraint based on device, user and time to avoid duplicates
          external_id: `${device.DeviceKey}_${log.UserId}_${log.LogTime}`
        }));

        if (logsToUpsert.length > 0) {
          const { error } = await supabase
            .from('attendance_logs')
            .upsert(logsToUpsert, { onConflict: 'external_id' });
          
          if (error) {
            console.error(`Error syncing logs for device ${device.DeviceName}:`, error);
          } else {
            totalSynced += logsToUpsert.length;
          }
        }
      }

      return totalSynced;
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    }
  },

  /**
   * Manually add a log entry
   */
  addLog: async (log: Omit<AttendanceLog, 'id'>) => {
    const { data, error } = await supabase
      .from('attendance_logs')
      .insert([log])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get dashboard statistics
   */
  getStats: async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString();

    const [
      { count: totalEmployees },
      { count: todayAttendance },
      { data: devices }
    ] = await Promise.all([
      supabase.from('device_employees').select('*', { count: 'exact', head: true }),
      supabase.from('attendance_logs').select('*', { count: 'exact', head: true }).gte('timestamp', todayIso),
      biometricApi.getAllDevices()
    ]);

    return {
      totalEmployees: totalEmployees || 0,
      todayAttendance: todayAttendance || 0,
      activeDevices: devices?.length || 0,
      failedLogs: 0 // This would need a specific table or flag
    };
  }
};

