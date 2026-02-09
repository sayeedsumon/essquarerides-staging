
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Vehicle, InspectionRecord } from '../types';
import { storage } from '../services/storage';

interface DriverDashboardProps {
  user: User;
}

const DriverDashboard: React.FC<DriverDashboardProps> = ({ user }) => {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [lastInspection, setLastInspection] = useState<InspectionRecord | null>(null);
  const [draft, setDraft] = useState<InspectionRecord | null>(null);

  useEffect(() => {
    // Determine the "active" or "last used" vehicle
    const inspections = storage.getInspections()
      .filter(i => i.driverId === user.id)
      .sort((a, b) => b.timestamp - a.timestamp);
    
    setLastInspection(inspections[0] || null);

    const currentDraft = storage.getDraft();
    if (currentDraft && currentDraft.driverId === user.id) {
      setDraft(currentDraft);
      const vehicles = storage.getVehicles();
      const draftVehicle = vehicles.find(v => v.id === currentDraft.vehicleId);
      setVehicle(draftVehicle || null);
    } else if (inspections[0]) {
      const vehicles = storage.getVehicles();
      const lastVehicle = vehicles.find(v => v.id === inspections[0].vehicleId);
      setVehicle(lastVehicle || null);
    }
  }, [user]);

  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-8 space-y-6">
      <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold mb-1">Welcome, {user.name}</h1>
        <p className="text-blue-100 text-sm">Select a vehicle to begin your inspection.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Vehicle Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            {draft ? 'Current Vehicle' : 'Last Vehicle Used'}
          </h2>
          {vehicle ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-gray-500 text-sm">Model</span>
                <span className="font-semibold">{vehicle.model}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-gray-500 text-sm">Plate Number</span>
                <span className="font-bold text-lg text-blue-700">{vehicle.plateNumber}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-500 text-sm">Status</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full uppercase">
                  {vehicle.status}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm italic">Start your first inspection to see vehicle history.</p>
          )}
        </div>

        {/* Action Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex-1 space-y-3">
            <Link
              to="/inspect"
              className="w-full flex items-center justify-center p-4 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition-all transform active:scale-95"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              {draft ? 'Resume Inspection' : 'Start New Inspection'}
            </Link>
            <Link
              to="/history"
              className="w-full flex items-center justify-center p-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              View Past Reports
            </Link>
          </div>
        </div>
      </div>

      {/* Last Inspection */}
      {lastInspection && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Last Inspection Summary</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-full ${lastInspection.data.overallCondition === 'Poor' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(lastInspection.timestamp).toLocaleDateString()} at {new Date(lastInspection.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-xs text-gray-500 uppercase tracking-tight font-mono">{lastInspection.plateNumber}</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${
                lastInspection.data.overallCondition === 'Excellent' || lastInspection.data.overallCondition === 'Good'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700'
              }`}>
                {lastInspection.data.overallCondition}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverDashboard;
