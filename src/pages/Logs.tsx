import { useState } from 'react';
import { Clock, Search, Download } from 'lucide-react';

export default function Logs() {
  const [logs, setLogs] = useState([
    { id: 1, employeeId: 'EMP001', name: 'John Doe', time: '2024-06-14 09:00:00', type: 'Check In', device: 'Main Gate' },
    { id: 2, employeeId: 'EMP002', name: 'Jane Smith', time: '2024-06-14 09:15:00', type: 'Check In', device: 'Branch 1' },
  ]);

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Attendance Logs</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            View and export daily attendance records.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button className="inline-flex items-center justify-center rounded-md bg-white dark:bg-zinc-800 px-3 py-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100 shadow-sm ring-1 ring-inset ring-zinc-300 dark:ring-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700">
            <Download className="-ml-0.5 mr-1.5 h-4 w-4" aria-hidden="true" />
            Export
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex items-center px-4 py-2 bg-white dark:bg-zinc-900 rounded-lg shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800">
          <Search className="h-5 w-5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search logs..."
            className="ml-3 block w-full border-0 bg-transparent p-0 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:ring-0 sm:text-sm"
          />
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="date"
            className="block w-full rounded-md border-0 py-2 px-3 text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 dark:ring-zinc-700 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
          />
          <span className="text-zinc-500">to</span>
          <input
            type="date"
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
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                  <div className="flex items-center">
                    <div className="h-8 w-8 flex-shrink-0 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-zinc-500" />
                    </div>
                    <div className="ml-4">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">{log.name}</div>
                      <div className="text-zinc-500 dark:text-zinc-400">{log.employeeId}</div>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                  {log.time}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20">
                    {log.type}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                  {log.device}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
