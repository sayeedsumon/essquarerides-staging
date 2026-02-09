
import React, { useState, useEffect } from 'react';
import { InspectionRecord, User, UserRole } from '../types';
import { storage } from '../services/storage';
import InspectionDetailModal from '../components/InspectionDetailModal';

interface InspectionHistoryProps {
  user: User;
}

const InspectionHistory: React.FC<InspectionHistoryProps> = ({ user }) => {
  const [history, setHistory] = useState<InspectionRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<InspectionRecord | null>(null);

  useEffect(() => {
    let records = storage.getInspections();
    if (user.role === UserRole.DRIVER) {
      records = records.filter(r => r.driverId === user.id);
    }
    setHistory(records.sort((a, b) => b.timestamp - a.timestamp));
  }, [user]);

  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-8 space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Inspection Logs</h1>
        <div className="bg-blue-50 px-3 py-1 rounded-lg">
           <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{history.length} Total</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {history.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl text-center border border-gray-100 shadow-sm flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </div>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No Activity Recorded</p>
          </div>
        ) : (
          history.map(record => (
            <div 
              key={record.id} 
              onClick={() => setSelectedRecord(record)}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md active:scale-[0.98] cursor-pointer"
            >
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shadow-sm ${
                    record.data.overallCondition === 'Poor' || record.data.overallCondition === 'Fair'
                    ? 'bg-amber-100 text-amber-700' 
                    : 'bg-blue-600 text-white'
                  }`}>
                    <span className="text-[8px] font-black uppercase opacity-75">Grade</span>
                    <span className="text-xl font-black">{record.data.overallCondition?.charAt(0) || '—'}</span>
                  </div>
                  <div>
                    <p className="font-black text-gray-900 text-lg uppercase tracking-tight">{record.plateNumber}</p>
                    <div className="flex items-center space-x-2">
                       <span className="text-[10px] text-gray-500 font-bold">{new Date(record.timestamp).toLocaleDateString()}</span>
                       <span className="text-[10px] text-gray-400 font-bold">•</span>
                       <span className="text-[10px] text-gray-500 font-bold">{new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                   <div className="text-right hidden xs:block">
                     <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Driver</p>
                     <p className="text-[10px] font-bold text-gray-900">{record.driverName}</p>
                   </div>
                   <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                     <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
                     </svg>
                   </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedRecord && (
        <InspectionDetailModal 
          inspection={selectedRecord} 
          onClose={() => setSelectedRecord(null)} 
        />
      )}
    </div>
  );
};

export default InspectionHistory;
