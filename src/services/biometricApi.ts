import axios from 'axios';

const api = axios.create({
  baseURL: '/api/biometric',
});

// Add a request interceptor to include the token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('biometric_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('biometric_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const biometricApi = {
  login: async (username: string, password: string) => {
    const response = await api.post('/api/Auth/Login', { Username: username, Password: password });
    const token = response.data.Token || response.data.token || (typeof response.data === 'string' ? response.data : null);
    if (token) {
      localStorage.setItem('biometric_token', token);
    } else {
      console.warn('Login successful but no token found in response:', response.data);
    }
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('biometric_token');
  },

  getLicenseInfo: async () => {
    const response = await api.get('/api/Auth/GetLicenseInfo');
    return response.data;
  },

  getAllDevices: async () => {
    const response = await api.get('/api/Device');
    return response.data;
  },

  deleteDevice: async (id: number) => {
    const response = await api.delete(`/api/Device/${id}`);
    return response.data;
  },

  getAllDeviceCommands: async () => {
    const response = await api.get('/api/DeviceCommand');
    return response.data;
  },

  setDeviceTime: async (deviceKey: string) => {
    const response = await api.post('/api/DeviceCommand?commandType=SetDeviceTime', [deviceKey]);
    return response.data;
  },

  fetchAllLogs: async (deviceKey: string) => {
    // Using a wide date range to effectively fetch all logs, as generic DownloadLogs often fails
    const fromDate = '2000-01-01';
    const toDate = '2099-12-31';
    const response = await api.post(`/api/DeviceCommand/DownloadLogsByDate?FromDate=${fromDate}&ToDate=${toDate}`, [deviceKey]);
    return response.data;
  },

  fetchAllUsers: async (deviceKey: string) => {
    const response = await api.post('/api/DeviceCommand?commandType=FetchAllUsers', [deviceKey]);
    return response.data;
  },

  getAllRegisteredUsers: async (deviceKey: string) => {
    const response = await api.get(`/api/Device/GetAllRegisteredUsers?deviceKey=${deviceKey}`);
    return response.data;
  },

  removeAllAdmins: async (deviceKey: string) => {
    const response = await api.post('/api/DeviceCommand?commandType=RemoveAllAdmins', [deviceKey]);
    return response.data;
  },

  restartDevice: async (deviceKey: string) => {
    const response = await api.post('/api/DeviceCommand?commandType=RestartDevice', [deviceKey]);
    return response.data;
  },

  uploadUser: async (userData: any) => {
    const response = await api.post('/api/DeviceCommand/UploadUser', [userData]);
    return response.data;
  },

  deleteUser: async (userId: string, deviceKeys: string[]) => {
    const response = await api.post('/api/DeviceCommand/DeleteUser', [{ UserId: userId, DeviceKeys: deviceKeys }]);
    return response.data;
  },

  setUserExpiration: async (expirationData: any) => {
    const response = await api.post('/api/DeviceCommand/SetUserExpiration', [expirationData]);
    return response.data;
  },

  registerUserByPhoto: async (userData: any) => {
    const response = await api.post('/api/DeviceCommand/RegisterUserByPhoto', userData);
    return response.data;
  },

  setDoorStatus: async (status: boolean, deviceKeys: string[]) => {
    const response = await api.post('/api/DeviceCommand/SetDoorStatus', { Status: status, DeviceKeys: deviceKeys });
    return response.data;
  },

  fetchLogsByDate: async (deviceKey: string, fromDate: string, toDate: string) => {
    const response = await api.post(`/api/DeviceCommand/DownloadLogsByDate?FromDate=${fromDate}&ToDate=${toDate}`, [deviceKey]);
    return response.data;
  },

  fetchSpecifyUser: async (deviceKey: string, userId: string) => {
    const response = await api.post(`/api/DeviceCommand/DownloadUser?deviceKey=${deviceKey}&userId=${userId}`);
    return response.data;
  },

  getAllLogsByDate: async (fromDate: string, toDate: string) => {
    const response = await api.get(`/api/DeviceLog/GetAllLogsByDate?FromDate=${fromDate}&ToDate=${toDate}`);
    return response.data;
  },

  getAllFailedLogsByDate: async (fromDate: string, toDate: string) => {
    const response = await api.get(`/api/DeviceLog/GetAllFailedLogsByDate?FromDate=${fromDate}&ToDate=${toDate}`);
    return response.data;
  },

  addUpdateEmployee: async (employeeData: any) => {
    const response = await api.post('/api/Employees', employeeData);
    return response.data;
  }
};
