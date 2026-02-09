
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { storage } from '../services/storage';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const drivers = storage.getDrivers();
    const foundUser = drivers.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (foundUser && password === 'password') {
      storage.setCurrentUser(foundUser);
      onLogin(foundUser);
    } else {
      setError('Invalid email or password. Use "password" for any valid email.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">Essquare Rides</h2>
          <p className="mt-2 text-sm text-gray-600 font-medium">Sign in to manage your vehicle inspections</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-rose-50 text-rose-800 p-3 rounded-lg text-sm border border-rose-100 font-medium">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-gray-700">Email Address</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 font-medium text-gray-900"
                placeholder="admin@fleet.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-gray-700">Password</label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 font-medium text-gray-900"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-black rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-md"
            >
              LOG IN
            </button>
          </div>
        </form>

        <div className="mt-6 text-center space-y-3">
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Quick Demo Accounts:</p>
          <div className="flex justify-center space-x-2">
            <span onClick={() => {setEmail('admin@fleet.com'); setPassword('password')}} className="cursor-pointer px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-bold text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors">Admin</span>
            <span onClick={() => {setEmail('john@fleet.com'); setPassword('password')}} className="cursor-pointer px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-bold text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors">Driver</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
