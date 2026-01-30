import apiClient from './apiClient';

const authService = {
  // Register new user
  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data.data;
  },

  // Login user
  login: async (credentials) => {
    console.log('🟢 authService.login called with credentials:', credentials);
    const response = await apiClient.post('/auth/login', credentials);
    console.log('🟢 API response:', response);
    console.log('🟢 response.data:', response.data);
    const data = response.data.data;
    if (data.token) {
      console.log('✅ Token found:', data.token.substring(0, 20) + '...');
      console.log('✅ User found:', data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      console.log('✅ Saved to localStorage');
      console.log('✅ Token in storage:', localStorage.getItem('token') ? 'YES' : 'NO');
      console.log('✅ User in storage:', localStorage.getItem('user') ? 'YES' : 'NO');
    }
    else {
      console.log('❌ No token in response.data!');
      console.log('❌ Response structure:', Object.keys(response.data));
    }
    return response.data.data;
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Get current user
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
};

export default authService;
