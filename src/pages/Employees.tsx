import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, RefreshCw, Users, Database } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { biometricApi } from '../services/biometricApi';
import { toast } from 'sonner';

interface Employee {
  id: string;
  user_id: string;
  name: string;
  card_number: string;
  privilege: string;
  department: string;
  status: string;
}

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        setError('Supabase credentials missing. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
        setLoading(false);
        return;
      }

      const { data, error: supabaseError } = await supabase
        .from('device_employees')
        .select('*')
        .order('name', { ascending: true });

      if (supabaseError) {
        if (supabaseError.code === 'PGRST205') {
          setError('Device Employees table not found');
        } else {
          throw supabaseError;
        }
      } else {
        setEmployees(data || []);
      }
    } catch (err: any) {
      console.error('Error fetching employees:', err);
      if (err.message === 'Failed to fetch' || err.message.includes('Failed to fetch')) {
        setError('Network error: Failed to connect to Supabase. Please check your internet connection and ensure your Supabase URL is correct (it must start with https://).');
      } else {
        toast.error('Failed to fetch employees');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSyncFromDevices = async () => {
    setIsSyncing(true);
    try {
      // 1. Get all devices
      const { data: devices, error: deviceError } = await supabase
        .from('devices')
        .select('device_key');

      if (deviceError) throw deviceError;
      if (!devices || devices.length === 0) {
        toast.error('No devices found to sync from');
        return;
      }

      toast.info(`Starting sync from ${devices.length} devices...`);

      let totalSynced = 0;
      for (const device of devices) {
        try {
          // Try getting users already in system first
          let response = await biometricApi.getAllRegisteredUsers(device.device_key);
          let usersList = [];
          
          if (Array.isArray(response)) {
            usersList = response;
          } else if (response && typeof response === 'object') {
            if (Array.isArray(response.Data)) usersList = response.Data;
            else if (Array.isArray(response.Users)) usersList = response.Users;
            else if (Array.isArray(response.data)) usersList = response.data;
          }

          // If no users, try triggering a fetch command
          if (usersList.length === 0) {
            await biometricApi.fetchAllUsers(device.device_key);
          }

          if (usersList.length > 0) {
            const employeesToUpsert = usersList.map((u: any) => ({
              user_id: (u.UserId || u.userId || u.Id || '').toString(),
              name: u.Name || u.UserName || u.name || 'Unknown',
              card_number: (u.CardNumber || u.cardNumber || '').toString(),
              privilege: (u.Privilege || u.AccessLevel || u.Role || 'USER').toString(),
              department: 'Synced',
              status: 'Active'
            })).filter(emp => emp.user_id);

            if (employeesToUpsert.length > 0) {
              const { error: upsertError } = await supabase
                .from('device_employees')
                .upsert(employeesToUpsert, { onConflict: 'user_id' });
              
              if (upsertError) console.error('Upsert error:', upsertError);
              else totalSynced += employeesToUpsert.length;
            }
          }
        } catch (deviceErr) {
          console.error(`Failed to sync from device ${device.device_key}:`, deviceErr);
        }
      }

      toast.success(`Sync complete! ${totalSynced} users processed.`);
      fetchEmployees();
    } catch (err: any) {
      console.error('Sync error:', err);
      toast.error('Sync failed: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.user_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Employees</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Manage your workforce and their biometric access.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={handleSyncFromDevices}
            disabled={isSyncing}
            className="inline-flex items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-800 px-3 py-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100 shadow-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50"
          >
            <RefreshCw className={`-ml-0.5 mr-1.5 h-5 w-5 ${isSyncing ? 'animate-spin' : ''}`} aria-hidden="true" />
            Sync from Devices
          </button>
          <button className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
            <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            Add Employee
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <Database className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                {error.includes('Network error') || error.includes('credentials missing') ? 'Connection Error' : 'Database Table Missing'}
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>{error}</p>
                {!error.includes('Network error') && !error.includes('credentials missing') && (
                  <div className="mt-4">
                    <p className="font-semibold">Run this SQL in your Supabase SQL Editor:</p>
                    <pre className="mt-2 p-2 bg-zinc-900 text-zinc-100 rounded text-xs overflow-x-auto">
{`create table device_employees (
  id uuid default gen_random_uuid() primary key,
  user_id text not null unique,
  name text not null,
  card_number text,
  privilege text default 'USER',
  department text,
  status text default 'Active',
  created_at timestamp with time zone default now()
);

alter table device_employees enable row level security;
create policy "Allow all actions" on device_employees for all using (true);`}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center px-4 py-3 bg-white dark:bg-zinc-900 rounded-lg shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800">
        <Search className="h-5 w-5 text-zinc-400" />
        <input
          type="text"
          placeholder="Search employees by name or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="ml-3 block w-full border-0 bg-transparent p-0 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:ring-0 sm:text-sm"
        />
      </div>

      <div className="overflow-hidden rounded-lg bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-2 text-sm text-zinc-500">Loading employees...</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-zinc-400" />
            <h3 className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">No employees found</h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {searchTerm ? 'Try a different search term.' : 'Sync from devices or add manually.'}
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
            <thead>
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100 sm:pl-6">
                  User ID
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Name
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Card Number
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Privilege
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Status
                </th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredEmployees.map((employee) => (
                <tr key={employee.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-zinc-900 dark:text-zinc-100 sm:pl-6">
                    {employee.user_id}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                    {employee.name}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                    {employee.card_number || '-'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                    {employee.privilege}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20">
                      {employee.status}
                    </span>
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <button className="text-emerald-600 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300 mr-4">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
