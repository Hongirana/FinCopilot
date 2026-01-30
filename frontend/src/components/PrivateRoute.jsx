// import { Navigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';

// const PrivateRoute = ({ children }) => {
//   const { isAuthenticated, loading } = useAuth();
//   console.log('PrivateRoute rendering. isAuthenticated:', isAuthenticated, 'loading:', loading);
//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="text-xl font-semibold text-gray-700">Loading...</div>
//       </div>
//     );
//   }

//   return isAuthenticated ? children : <Navigate to="/login" replace />;
// };

// export default PrivateRoute;

import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  console.log('🔵 PrivateRoute check (using localStorage directly)');
  
  // Check localStorage directly (bypass AuthContext)
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  const isAuthenticated = !!(token && user);
  
  console.log('🔍 Token exists:', !!token);
  console.log('🔍 User exists:', !!user);
  console.log('🔍 isAuthenticated:', isAuthenticated);
  
  if (!isAuthenticated) {
    console.log('❌ Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  console.log('✅ Authenticated, rendering children');
  return children;
};

export default PrivateRoute;
