import { useState, useEffect } from 'react';
import { Clock, Search, Download, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { attendanceService, AttendanceLog } from '../services/attendanceService';
import { format } from 'date-fns';

export default function Logs() {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await attendanceService.getLogs({
        searchTerm,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
      });
      setLogs(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching logs:', err);
      setError('Failed to load logs. Please check your database connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [searchTerm, startDate, endDate]);

  const handleSync = async () => {
    try {
      setSyncing(true);
      setError(null);
      setSuccess(null);
      const count = await attendanceService.syncLogs();
      setSuccess(`Successfully synced ${count} logs from devices.`);
      fetchLogs();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      console.error('Sync failed:', err);
      setError('Sync failed. Make sure the biometric devices are reachable.');
    } finally {
      setSyncing(false);
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['Employee Name', 'Employee ID', 'Time', 'Type', 'Device'],
      ...logs.map(log => [
        log.employee_name,
        log.employee_id,
        format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss'),
        log.log_type,
        log.device_name
      ])
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance_logs_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Attendance Logs</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            View and export daily attendance records from the database.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button 
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`-ml-0.5 mr-1.5 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} aria-hidden="true" />
            {syncing ? 'Syncing...' : 'Sync with Devices'}
          </button>
          <button 
            onClick={handleExport}
            className="inline-flex items-center justify-center rounded-md bg-white dark:bg-zinc-800 px-3 py-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100 shadow-sm ring-1 ring-inset ring-zinc-300 dark:ring-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700"
          >
            <Download className="-ml-0.5 mr-1.5 h-4 w-4" aria-hidden="true" />
            Export
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">{error}</h3>
              {error.includes('database connection') && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-red-700 dark:text-red-300">Run this SQL in your Supabase SQL Editor to create the logs table:</p>
                  <pre className="mt-2 p-2 bg-zinc-900 text-zinc-100 rounded text-xs overflow-x-auto">
{`create table attendance_logs (
  id uuid default gen_random_uuid() primary key,
  employee_id text not null,
  employee_name text not null,
  timestamp timestamp with time zone not null,
  log_type text not null,
  device_name text,
  device_key text,
  external_id text unique,
  created_at timestamp with time zone default now()
);

alter table attendance_logs enable row level security;
create policy "Allow all actions" on attendance_logs for all using (true);`}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="rounded-md bg-emerald-50 dark:bg-emerald-900/20 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-emerald-800 dark:text-emerald-200">{success}</h3>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex items-center px-4 py-2 bg-white dark:bg-zinc-900 rounded-lg shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800">
          <Search className="h-5 w-5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="ml-3 block w-full border-0 bg-transparent p-0 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:ring-0 sm:text-sm"
          />
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="block w-full rounded-md border-0 py-2 px-3 text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 dark:ring-zinc-700 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
          />
          <span className="text-zinc-500">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="block w-full rounded-md border-0 py-2 px-3 text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 dark:ring-zinc-700 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
          <thead>
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100 sm:pl-6">
                Employee
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Time
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Type
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Device
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {loading ? (
              <tr>
                <td colSpan={4} className="py-10 text-center text-zinc-500">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 opacity-20" />
                  Loading logs...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-10 text-center text-zinc-500">
                  No logs found.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                    <div className="flex items-center">
                      <div className="h-8 w-8 flex-shrink-0 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-zinc-500" />
                      </div>
                      <div className="ml-4">
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">{log.employee_name}</div>
                        <div className="text-zinc-500 dark:text-zinc-400">{log.employee_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                    {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                      log.log_type.toLowerCase().includes('in') 
                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20'
                        : 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20'
                    }`}>
                      {log.log_type}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                    {log.device_name}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

