
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { User, UserRole } from './types';
import { storage } from './services/storage';
import Login from './views/Login';
import AdminDashboard from './views/AdminDashboard';
import DriverDashboard from './views/DriverDashboard';
import InspectionWorkflow from './views/InspectionWorkflow';
import InspectionHistory from './views/InspectionHistory';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    storage.initialize();
    const currentUser = storage.getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  const handleLogout = () => {
    storage.setCurrentUser(null);
    setUser(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        {user && (
          <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
              <Link to="/" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-100">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-black text-gray-900 leading-none tracking-tight">ESSQUARE RIDES</span>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Fleet Operations</span>
                </div>
              </Link>

              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="hidden xs:block text-right">
                  <p className="text-xs font-black text-gray-900 leading-tight">{user.name}</p>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{user.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-rose-600 transition-colors bg-gray-50 rounded-lg"
                  title="Logout"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </header>
        )}

        <main className="flex-1 flex flex-col">
          <Routes>
            <Route
              path="/login"
              element={user ? <Navigate to="/" /> : <Login onLogin={setUser} />}
            />
            <Route
              path="/"
              element={
                !user ? (
                  <Navigate to="/login" />
                ) : user.role === UserRole.ADMIN ? (
                  <AdminDashboard />
                ) : (
                  <DriverDashboard user={user} />
                )
              }
            />
            <Route
              path="/inspect"
              element={user?.role === UserRole.DRIVER ? <InspectionWorkflow user={user} /> : <Navigate to="/" />}
            />
            <Route
              path="/history"
              element={user ? <InspectionHistory user={user} /> : <Navigate to="/login" />}
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
