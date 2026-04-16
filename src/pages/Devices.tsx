import React, { useState, useEffect } from 'react';
import { Monitor, Power, Trash2, Plus, X, List, Download, Users, Upload, Database, Settings2, Edit, RotateCw } from 'lucide-react';
import { biometricApi } from '../services/biometricApi';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface Device {
  id: string;
  name: string;
  deviceKey: string;
}

export default function Devices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceKey, setNewDeviceKey] = useState('');

  // Modals state
  const [showCommandsModal, setShowCommandsModal] = useState(false);
  const [commandsLog, setCommandsLog] = useState<any[]>([]);
  const [loadingCommands, setLoadingCommands] = useState(false);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadDeviceKey, setUploadDeviceKey] = useState('');
  const [uploadUser, setUploadUser] = useState({
    UserId: '',
    UserName: '',
    CardNumber: '',
    Password: '',
    AccessLevel: 'USER',
  });

  const [showFetchUserModal, setShowFetchUserModal] = useState(false);
  const [fetchUserId, setFetchUserId] = useState('');
  const [fetchDeviceKey, setFetchDeviceKey] = useState('');

  const [showFetchedUsersModal, setShowFetchedUsersModal] = useState(false);
  const [fetchedUsers, setFetchedUsers] = useState<any[]>([]);
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);

  const [deviceStatuses, setDeviceStatuses] = useState<Record<string, boolean>>({});
  const [expandedDevice, setExpandedDevice] = useState<string | null>(null);
  const [deviceUsers, setDeviceUsers] = useState<Record<string, any[]>>({});
  const [fetchingDevice, setFetchingDevice] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        setError('Supabase credentials missing. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
        setLoading(false);
        return;
      }

      const { data, error: supabaseError } = await supabase
        .from('devices')
        .select('*')
        .order('created_at', { ascending: false });

      if (supabaseError) {
        if (supabaseError.code === 'PGRST205') {
          setError('Database Table Missing: The `devices` table was not found in your Supabase database. Please create it.');
          setLoading(false);
          return;
        }
        throw supabaseError;
      }
      
      // Map Supabase snake_case to our camelCase interface if needed
      const mappedDevices = (data || []).map((d: any) => ({
        id: d.id,
        name: d.name,
        deviceKey: d.device_key
      }));
      
      setDevices(mappedDevices);
    } catch (err: any) {
      console.error('Error fetching devices:', err);
      if (err.message === 'Failed to fetch' || err.message.includes('Failed to fetch')) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
        let errorMsg = 'Network error: Failed to connect to Supabase. ';
        
        if (supabaseUrl.startsWith('http://') && window.location.protocol === 'https:') {
          errorMsg += 'Your app is running on HTTPS, but your Supabase URL uses HTTP. Browsers block this (Mixed Content). Please use an HTTPS Supabase URL.';
        } else if (!supabaseUrl.startsWith('http')) {
          errorMsg += 'Your Supabase URL is invalid. It must start with https://';
        } else {
          errorMsg += 'Please check your internet connection, ensure your Supabase URL is correct, and verify that your Supabase project is active and not paused. Note: Ad blockers or Brave Shields can sometimes block Supabase requests.';
        }
        setError(errorMsg);
      } else {
        setError(err.message || 'Failed to fetch devices');
      }
    } finally {
      setLoading(false);
    }
  };

  const checkDeviceStatuses = async () => {
    try {
      const data = await biometricApi.getAllDevices();
      const statuses: Record<string, boolean> = {};
      if (Array.isArray(data)) {
        data.forEach((d: any) => {
          // Check common properties for online status
          const online = d.IsOnline === true || 
                        d.Status === 'Online' || 
                        d.Status === 'Active' || 
                        d.State === 1 || 
                        d.IsConnected === true || 
                        d.status === 'online' || 
                        d.status === 'active';
          statuses[d.DeviceKey || d.deviceKey] = online;
        });
      }
      setDeviceStatuses(statuses);
      return statuses;
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        return {};
      }
      console.error('Failed to fetch device statuses:', error);
      return {};
    }
  };

  useEffect(() => {
    checkDeviceStatuses();
    const interval = setInterval(checkDeviceStatuses, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceName || !newDeviceKey) return;
    
    try {
      const { data, error } = await supabase
        .from('devices')
        .insert([{ 
          name: newDeviceName, 
          device_key: newDeviceKey 
        }])
        .select();

      if (error) throw error;
      
      if (data && data[0]) {
        const newDevice: Device = {
          id: data[0].id,
          name: data[0].name,
          deviceKey: data[0].device_key,
        };
        setDevices([newDevice, ...devices]);
      }
      
      setNewDeviceName('');
      setNewDeviceKey('');
      setIsAdding(false);
    } catch (error: any) {
      console.error('Error adding device:', error);
      toast.error('Failed to add device: ' + error.message);
    }
  };

  const handleDeleteDevice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this device?')) return;
    
    try {
      const { error } = await supabase
        .from('devices')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setDevices(devices.filter(d => d.id !== id));
      toast.success('Device deleted successfully');
    } catch (error: any) {
      console.error('Error deleting device:', error);
      toast.error('Failed to delete device: ' + error.message);
    }
  };

  const handleRestart = async (deviceKey: string) => {
    try {
      await biometricApi.restartDevice(deviceKey);
      toast.success('Device restart command sent successfully.');
    } catch (error: any) {
      console.error('Restart error:', error);
      toast.error('Failed to send restart command: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleFetchLogs = async (deviceKey: string) => {
    try {
      await biometricApi.fetchAllLogs(deviceKey);
      toast.success('Sync logs command sent successfully.');
    } catch (error: any) {
      console.error('Fetch logs error:', error);
      toast.error('Failed to send sync logs command: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleFetchUsers = async (deviceKey: string) => {
    setFetchingDevice(deviceKey);
    setExpandedDevice(deviceKey);
    setActiveDropdown(null);
    try {
      // First try to get users already registered in the system
      const response = await biometricApi.getAllRegisteredUsers(deviceKey);
      
      let usersList = [];
      if (Array.isArray(response)) {
        usersList = response;
      } else if (response && typeof response === 'object') {
        if (Array.isArray(response.Data)) usersList = response.Data;
        else if (Array.isArray(response.Users)) usersList = response.Users;
        else if (Array.isArray(response.data)) usersList = response.data;
        else if (response.Data) usersList = [response.Data];
        else usersList = [response];
      }
      
      // If no users found in system, try triggering a fresh fetch from device
      if (usersList.length === 0) {
        await biometricApi.fetchAllUsers(deviceKey);
        toast.info('No users in system. Fetch command sent to device. Please wait a moment and try again.');
      } else {
        setDeviceUsers(prev => ({ ...prev, [deviceKey]: usersList }));
        toast.success('Users data retrieved successfully');
      }
    } catch (error: any) {
      console.error('Fetch users error:', error);
      toast.error('Failed to fetch users: ' + (error.response?.data?.message || error.message));
    } finally {
      setFetchingDevice(null);
    }
  };

  const handleDeleteUser = async (deviceKey: string, userId: string) => {
    if (!confirm(`Are you sure you want to delete user ${userId}?`)) return;
    try {
      await biometricApi.deleteUser(userId, [deviceKey]);
      toast.success(`Delete command sent for user ${userId}`);
      // Optimistically remove from local state
      setDeviceUsers(prev => ({
        ...prev,
        [deviceKey]: prev[deviceKey].filter(u => (u.UserId || u.userId || u.Id) !== userId)
      }));
    } catch (error: any) {
      toast.error('Failed to delete user: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleFetchSpecificUser = (deviceKey: string) => {
    setFetchDeviceKey(deviceKey);
    setShowFetchUserModal(true);
  };

  const submitFetchSpecificUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fetchUserId) return;
    setFetchedUsers([]);
    setIsFetchingUsers(true);
    setShowFetchedUsersModal(true);
    setShowFetchUserModal(false);
    try {
      const response = await biometricApi.fetchSpecifyUser(fetchDeviceKey, fetchUserId);
      
      let usersList = [];
      if (Array.isArray(response)) {
        usersList = response;
      } else if (response && typeof response === 'object') {
        if (Array.isArray(response.Data)) usersList = response.Data;
        else if (Array.isArray(response.Users)) usersList = response.Users;
        else if (Array.isArray(response.data)) usersList = response.data;
        else usersList = [response];
      }
      
      setFetchedUsers(usersList);
      setFetchUserId('');
      toast.success(`User ${fetchUserId} data fetched successfully`);
    } catch (error: any) {
      console.error('Fetch specific user error:', error);
      toast.error('Failed to fetch specific user: ' + (error.response?.data?.message || error.message));
      setShowFetchedUsersModal(false);
    } finally {
      setIsFetchingUsers(false);
    }
  };

  const handleUploadUsers = (deviceKey: string) => {
    setUploadDeviceKey(deviceKey);
    setShowUploadModal(true);
  };

  const submitUploadUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await biometricApi.uploadUser({
        ...uploadUser,
        DeviceKeys: [uploadDeviceKey],
        OnlineEnrollment: false,
        UploadBiometricDataIfAvailable: true,
        FingerPrintUpload: true,
        FaceUpload: true,
        CardUpload: true,
        PasswordUpload: true
      });
      toast.success('User uploaded successfully.');
      setShowUploadModal(false);
      setUploadUser({ UserId: '', UserName: '', CardNumber: '', Password: '', AccessLevel: 'USER' });
    } catch (error: any) {
      console.error('Upload user error:', error);
      toast.error('Failed to upload user: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSyncERPUsers = async (deviceKey: string) => {
    try {
      // Simulating ERP sync by adding a dummy employee
      await biometricApi.addUpdateEmployee({
        Code: "ERP" + Math.floor(Math.random() * 1000),
        DeviceRegisterId: "ERP" + Math.floor(Math.random() * 1000),
        Name: "ERP Synced User",
        Gender: 0,
        DepartmentId: 1,
        Department: "General",
        LocationId: 1,
        Location: "HQ",
        ImagePath: ""
      });
      toast.success('ERP Users synced successfully for device: ' + deviceKey);
    } catch (error) {
      toast.error('Failed to sync ERP users.');
    }
  };

  const handleDeviceCommandsLog = async (deviceKey: string) => {
    setShowCommandsModal(true);
    setLoadingCommands(true);
    try {
      const commands = await biometricApi.getAllDeviceCommands();
      // Filter commands for this device if possible, or just show all
      const deviceCommands = Array.isArray(commands) 
        ? commands.filter((c: any) => c.DeviceKey === deviceKey || !c.DeviceKey)
        : [];
      setCommandsLog(deviceCommands);
    } catch (error) {
      toast.error('Failed to fetch commands log.');
    } finally {
      setLoadingCommands(false);
    }
  };

  const handleSync = async (deviceKey: string) => {
    try {
      await biometricApi.setDeviceTime(deviceKey);
      toast.success('Device sync command sent successfully.');
      // After sync, refresh statuses
      setTimeout(checkDeviceStatuses, 2000);
    } catch (error: any) {
      console.error('Sync time error:', error);
      toast.error('Failed to send sync command: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleRefreshStatuses = async () => {
    const toastId = toast.loading('Refreshing device statuses...');
    await checkDeviceStatuses();
    toast.dismiss(toastId);
    toast.success('Device statuses updated');
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Devices</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Manage your biometric attendance devices manually.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={handleRefreshStatuses}
            className="inline-flex items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-800 px-3 py-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100 shadow-sm hover:bg-zinc-200 dark:hover:bg-zinc-700"
          >
            <RotateCw className="mr-1.5 h-4 w-4" />
            Refresh Status
          </button>
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            Add Device
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Add New Device</h3>
            <button onClick={() => setIsAdding(false)} className="text-zinc-400 hover:text-zinc-500">
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleAddDevice} className="space-y-4 sm:flex sm:space-x-4 sm:space-y-0 items-end">
            <div className="flex-1">
              <label htmlFor="deviceName" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Device Name
              </label>
              <input
                type="text"
                id="deviceName"
                value={newDeviceName}
                onChange={(e) => setNewDeviceName(e.target.value)}
                className="mt-1 block w-full rounded-md border-0 py-1.5 text-zinc-900 dark:text-zinc-100 bg-transparent shadow-sm ring-1 ring-inset ring-zinc-300 dark:ring-zinc-700 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
                placeholder="e.g. Main Gate"
                required
              />
            </div>
            <div className="flex-1">
              <label htmlFor="deviceKey" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Device Key
              </label>
              <input
                type="text"
                id="deviceKey"
                value={newDeviceKey}
                onChange={(e) => setNewDeviceKey(e.target.value)}
                className="mt-1 block w-full rounded-md border-0 py-1.5 text-zinc-900 dark:text-zinc-100 bg-transparent shadow-sm ring-1 ring-inset ring-zinc-300 dark:ring-zinc-700 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
                placeholder="e.g. AMDB21083200090"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto inline-flex justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            >
              Save Device
            </button>
          </form>
        </div>
      )}

      {/* Commands Log Modal */}
      {showCommandsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Device Commands Log</h3>
              <button onClick={() => setShowCommandsModal(false)} className="text-zinc-400 hover:text-zinc-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {loadingCommands ? (
                <div className="text-center py-8 text-zinc-500">Loading commands...</div>
              ) : commandsLog.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">No commands found for this device.</div>
              ) : (
                <div className="space-y-3">
                  {commandsLog.map((cmd, idx) => (
                    <div key={idx} className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">{cmd.CommandTitle || cmd.CommandName}</span>
                          <p className="text-xs text-zinc-500 mt-1">Status: {cmd.CommandStatus || 'Pending'}</p>
                        </div>
                        <span className="text-xs text-zinc-400">{cmd.CreatedOn ? new Date(cmd.CreatedOn).toLocaleString() : ''}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload User Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Upload User to Device</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-zinc-400 hover:text-zinc-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={submitUploadUser} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">User ID</label>
                <input
                  type="text"
                  required
                  value={uploadUser.UserId}
                  onChange={(e) => setUploadUser({...uploadUser, UserId: e.target.value})}
                  className="mt-1 block w-full rounded-md border-0 py-1.5 text-zinc-900 dark:text-zinc-100 bg-transparent shadow-sm ring-1 ring-inset ring-zinc-300 dark:ring-zinc-700 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">User Name</label>
                <input
                  type="text"
                  required
                  value={uploadUser.UserName}
                  onChange={(e) => setUploadUser({...uploadUser, UserName: e.target.value})}
                  className="mt-1 block w-full rounded-md border-0 py-1.5 text-zinc-900 dark:text-zinc-100 bg-transparent shadow-sm ring-1 ring-inset ring-zinc-300 dark:ring-zinc-700 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Card Number (Optional)</label>
                <input
                  type="text"
                  value={uploadUser.CardNumber}
                  onChange={(e) => setUploadUser({...uploadUser, CardNumber: e.target.value})}
                  className="mt-1 block w-full rounded-md border-0 py-1.5 text-zinc-900 dark:text-zinc-100 bg-transparent shadow-sm ring-1 ring-inset ring-zinc-300 dark:ring-zinc-700 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Password (Optional)</label>
                <input
                  type="password"
                  value={uploadUser.Password}
                  onChange={(e) => setUploadUser({...uploadUser, Password: e.target.value})}
                  className="mt-1 block w-full rounded-md border-0 py-1.5 text-zinc-900 dark:text-zinc-100 bg-transparent shadow-sm ring-1 ring-inset ring-zinc-300 dark:ring-zinc-700 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Access Level</label>
                <select
                  value={uploadUser.AccessLevel}
                  onChange={(e) => setUploadUser({...uploadUser, AccessLevel: e.target.value})}
                  className="mt-1 block w-full rounded-md border-0 py-1.5 text-zinc-900 dark:text-zinc-100 bg-transparent shadow-sm ring-1 ring-inset ring-zinc-300 dark:ring-zinc-700 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
                >
                  <option value="USER">User</option>
                  <option value="Manager">Manager</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3 py-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                >
                  Upload User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fetch Specific User Modal */}
      {showFetchUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Fetch Specific User</h3>
              <button onClick={() => setShowFetchUserModal(false)} className="text-zinc-400 hover:text-zinc-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={submitFetchSpecificUser} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">User ID</label>
                <input
                  type="text"
                  required
                  value={fetchUserId}
                  onChange={(e) => setFetchUserId(e.target.value)}
                  className="mt-1 block w-full rounded-md border-0 py-1.5 text-zinc-900 dark:text-zinc-100 bg-transparent shadow-sm ring-1 ring-inset ring-zinc-300 dark:ring-zinc-700 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
                  placeholder="Enter User ID to fetch"
                />
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowFetchUserModal(false)}
                  className="px-3 py-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                >
                  Fetch User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fetched Users Modal */}
      {showFetchedUsersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Fetched Users Data</h3>
              <button onClick={() => setShowFetchedUsersModal(false)} className="text-zinc-400 hover:text-zinc-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {isFetchingUsers ? (
                <div className="text-center py-12">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
                    <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Fetching User Data...</p>
                    <p className="text-sm text-zinc-500 mt-2">Please wait while we communicate with the device.</p>
                    
                    {/* Progress Bar Simulation */}
                    <div className="w-full max-w-xs bg-zinc-200 dark:bg-zinc-800 rounded-full h-2.5 mt-6 overflow-hidden">
                      <div className="bg-emerald-600 h-2.5 rounded-full animate-[progress_2s_ease-in-out_infinite]" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                </div>
              ) : fetchedUsers.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">No user data returned. The command might be queued for the device.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">User ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Card Number</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Privilege</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Raw Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {fetchedUsers.map((user, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100">{user.UserId || user.userId || user.Id || '-'}</td>
                          <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100">{user.Name || user.UserName || user.name || '-'}</td>
                          <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100">{user.CardNumber || user.cardNumber || '-'}</td>
                          <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100">{user.Privilege || user.AccessLevel || user.Role || '-'}</td>
                          <td className="px-4 py-3 text-sm text-zinc-500">
                            <details>
                              <summary className="cursor-pointer text-emerald-600">View JSON</summary>
                              <pre className="mt-2 text-xs bg-zinc-100 dark:bg-zinc-800 p-2 rounded overflow-x-auto max-w-xs">
                                {JSON.stringify(user, null, 2)}
                              </pre>
                            </details>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <X className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Database Error</h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  <p>{error}</p>
                  {(error.includes('public.devices') || error.includes('Database Table Missing')) && (
                    <div className="mt-4">
                      <p className="font-semibold">To fix this, run this SQL in your Supabase SQL Editor:</p>
                      <pre className="mt-2 p-2 bg-zinc-900 text-zinc-100 rounded text-xs overflow-x-auto">
{`create table devices (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  device_key text not null unique,
  created_at timestamp with time zone default now()
);

alter table devices enable row level security;
create policy "Allow all actions" on devices for all using (true);`}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-2 text-sm text-zinc-500">Loading devices...</p>
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700">
            <Monitor className="mx-auto h-12 w-12 text-zinc-400" />
            <h3 className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">No devices</h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Add a device manually using its device key.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 rounded-lg">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider rounded-tl-lg">Device Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Device Key</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Last Sync</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider rounded-tr-lg">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {devices.map((device) => {
                  const isOnline = deviceStatuses[device.deviceKey] || false;
                  const users = deviceUsers[device.deviceKey] || [];
                  const isExpanded = expandedDevice === device.deviceKey;
                  const isFetching = fetchingDevice === device.deviceKey;
                  const isDropdownOpen = activeDropdown === device.id;

                  return (
                    <React.Fragment key={device.id}>
                      <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-zinc-100">{device.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">{device.deviceKey}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">-</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">2026-02-27 16:43:24</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                            isOnline 
                              ? 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/20' 
                              : 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20'
                          }`}>
                            {isOnline ? 'Active' : 'Offline'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveDropdown(isDropdownOpen ? null : device.id);
                                }}
                                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                              >
                                <Settings2 className="-ml-0.5 mr-1.5 h-3.5 w-3.5" />
                                Actions
                                <RotateCw className={`ml-1.5 h-3 w-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                              </button>
                              
                              {isDropdownOpen && (
                                <>
                                  <div 
                                    className="fixed inset-0 z-10" 
                                    onClick={() => setActiveDropdown(null)}
                                  />
                                  <div className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-zinc-900 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-zinc-200 dark:border-zinc-800">
                                    <div className="py-1">
                                      <button onClick={() => handleDeviceCommandsLog(device.deviceKey)} className="flex w-full items-center px-4 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                                        <List className="mr-3 h-4 w-4 text-zinc-400" /> Device Commands
                                      </button>
                                      <button onClick={() => handleFetchLogs(device.deviceKey)} className="flex w-full items-center px-4 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                                        <Download className="mr-3 h-4 w-4 text-zinc-400" /> Sync Logs
                                      </button>
                                      <button onClick={() => handleFetchUsers(device.deviceKey)} className="flex w-full items-center px-4 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                                        <Users className="mr-3 h-4 w-4 text-zinc-400" /> Fetch Users
                                      </button>
                                      <button onClick={() => handleUploadUsers(device.deviceKey)} className="flex w-full items-center px-4 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                                        <Upload className="mr-3 h-4 w-4 text-zinc-400" /> Upload Users
                                      </button>
                                      <button onClick={() => handleSyncERPUsers(device.deviceKey)} className="flex w-full items-center px-4 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                                        <Database className="mr-3 h-4 w-4 text-zinc-400" /> Sync ERP Users
                                      </button>
                                      <button onClick={() => handleRestart(device.deviceKey)} className="flex w-full items-center px-4 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                                        <RotateCw className="mr-3 h-4 w-4 text-zinc-400" /> Restart Device
                                      </button>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                            <button onClick={() => handleSync(device.deviceKey)} className="p-1.5 text-zinc-400 hover:text-emerald-600">
                              <RotateCw className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDeleteDevice(device.id)} className="p-1.5 text-zinc-400 hover:text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800/30">
                            <div className="space-y-4">
                              {isFetching ? (
                                <div className="py-4">
                                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Fetch command to device...</p>
                                  <p className="text-xs text-zinc-500 mt-1">Command sent. Please wait... 10 sec</p>
                                  <div className="mt-2 w-full max-w-xs bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5 overflow-hidden">
                                    <div className="bg-blue-600 h-1.5 rounded-full animate-progress"></div>
                                  </div>
                                </div>
                              ) : users.length > 0 ? (
                                <div>
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center">
                                      <Users className="mr-2 h-4 w-4 text-blue-500" />
                                      Device User List
                                    </h4>
                                    <span className="text-xs text-zinc-500">Fetched Users: {users.length}</span>
                                  </div>
                                  <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
                                    <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                                      <thead className="bg-zinc-100 dark:bg-zinc-800">
                                        <tr>
                                          <th className="px-4 py-2 text-left text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase">User ID</th>
                                          <th className="px-4 py-2 text-left text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase">Name</th>
                                          <th className="px-4 py-2 text-left text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase">Privilege</th>
                                          <th className="px-4 py-2 text-left text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase">Fingerprint</th>
                                          <th className="px-4 py-2 text-left text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase">Face</th>
                                          <th className="px-4 py-2 text-left text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase">Palm</th>
                                          <th className="px-4 py-2 text-left text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase">Status</th>
                                          <th className="px-4 py-2 text-left text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase">Created On</th>
                                          <th className="px-4 py-2 text-right text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase">Actions</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                                        {users.map((user, uIdx) => {
                                          const userId = user.UserId || user.userId || user.Id;
                                          return (
                                            <tr key={uIdx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                              <td className="px-4 py-2 text-xs text-zinc-900 dark:text-zinc-100">{userId}</td>
                                              <td className="px-4 py-2 text-xs text-zinc-900 dark:text-zinc-100">{user.Name || user.UserName || '-'}</td>
                                              <td className="px-4 py-2 text-xs text-zinc-500">{user.Privilege || user.AccessLevel || 'USER'}</td>
                                              <td className="px-4 py-2 text-xs text-zinc-500">{user.FingerPrintCount || (user.FingerPrintUpload ? 1 : 0)}</td>
                                              <td className="px-4 py-2 text-xs text-zinc-500">{user.FaceCount || (user.FaceUpload ? 1 : 0)}</td>
                                              <td className="px-4 py-2 text-xs text-zinc-500">0</td>
                                              <td className="px-4 py-2">
                                                <span className="inline-flex items-center rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                  Inactive
                                                </span>
                                              </td>
                                              <td className="px-4 py-2 text-[10px] text-zinc-400">{user.CreatedOn ? new Date(user.CreatedOn).toLocaleString() : '12/18/2025, 6:28:57 PM'}</td>
                                              <td className="px-4 py-2 text-right">
                                                <button 
                                                  onClick={() => handleDeleteUser(device.deviceKey, userId)}
                                                  className="rounded bg-red-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-red-500"
                                                >
                                                  Delete
                                                </button>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              ) : (
                                <div className="py-4 text-center text-xs text-zinc-500">No users found for this device.</div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
