
import React, { useState, useEffect, useMemo } from 'react';
import { User, Vehicle, InspectionRecord, UserRole } from '../types';
import { storage } from '../services/storage';
import { Link } from 'react-router-dom';
import InspectionDetailModal from '../components/InspectionDetailModal';

const ITEMS_PER_PAGE = 20;

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'monitor' | 'drivers' | 'vehicles'>('monitor');
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drafts, setDrafts] = useState<InspectionRecord[]>([]);

  // Filters & Pagination
  const [dateFilter, setDateFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<User | null>(null);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [viewingInspection, setViewingInspection] = useState<InspectionRecord | null>(null);

  // Form states
  const [driverForm, setDriverForm] = useState({ name: '', email: '', assignedVehicleId: '', active: true });
  const [vehicleForm, setVehicleForm] = useState({ plateNumber: '', model: '', status: 'active' as Vehicle['status'] });

  const loadData = () => {
    const allInspections = storage.getInspections().sort((a, b) => b.timestamp - a.timestamp);
    setInspections(allInspections);
    setDrivers(storage.getDrivers().filter(u => u.role === UserRole.DRIVER));
    setVehicles(storage.getVehicles());
    const singleDraft = storage.getDraft();
    setDrafts(singleDraft ? [singleDraft] : []);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Filtered Inspections logic
  const filteredInspections = useMemo(() => {
    if (!dateFilter) return inspections;
    return inspections.filter(ins => {
      const insDate = new Date(ins.timestamp).toISOString().split('T')[0];
      return insDate === dateFilter;
    });
  }, [inspections, dateFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredInspections.length / ITEMS_PER_PAGE);
  const paginatedInspections = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredInspections.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredInspections, currentPage]);

  const hasFailures = (ins: InspectionRecord) => {
    const data = ins.data;
    return (
      data.exteriorBodyCheck === 'Fail' ||
      data.brakes === 'Fail' ||
      data.horn === 'Fail' ||
      data.lights === 'Fail' ||
      data.windshield === 'Fail' ||
      data.wipers === 'Fail' ||
      data.mirrors === 'Fail' ||
      data.tirePressure === 'Fail'
    );
  };

  const getStatColorClass = (color: string) => {
    switch (color) {
      case 'blue': return 'text-blue-600';
      case 'yellow': return 'text-amber-600';
      case 'green': return 'text-emerald-600';
      case 'red': return 'text-rose-600';
      default: return 'text-gray-600';
    }
  };

  const handleSaveDriver = (e: React.FormEvent) => {
    e.preventDefault();
    const allDrivers = storage.getDrivers();
    let updatedDrivers;
    if (editingDriver) {
      updatedDrivers = allDrivers.map(d => d.id === editingDriver.id ? { ...d, ...driverForm } : d);
    } else {
      updatedDrivers = [...allDrivers, { ...driverForm, id: 'u' + Date.now(), role: UserRole.DRIVER }];
    }
    storage.saveDrivers(updatedDrivers);
    setShowDriverModal(false);
    setEditingDriver(null);
    setDriverForm({ name: '', email: '', assignedVehicleId: '', active: true });
    loadData();
  };

  const openEditDriver = (driver: User) => {
    setEditingDriver(driver);
    setDriverForm({ name: driver.name, email: driver.email, assignedVehicleId: driver.assignedVehicleId || '', active: driver.active });
    setShowDriverModal(true);
  };

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    const allVehicles = storage.getVehicles();
    let updatedVehicles;
    if (editingVehicle) {
      updatedVehicles = allVehicles.map(v => v.id === editingVehicle.id ? { ...v, ...vehicleForm } : v);
    } else {
      updatedVehicles = [...allVehicles, { ...vehicleForm, id: 'v' + Date.now() }];
    }
    storage.saveVehicles(updatedVehicles);
    setShowVehicleModal(false);
    setEditingVehicle(null);
    setVehicleForm({ plateNumber: '', model: '', status: 'active' });
    loadData();
  };

  const openEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setVehicleForm({ plateNumber: vehicle.plateNumber, model: vehicle.model, status: vehicle.status });
    setShowVehicleModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight uppercase">Fleet Hub</h1>
          <p className="text-gray-600 text-sm font-medium">Monitoring {vehicles.length} vehicles and {drivers.length} drivers</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200">
          {(['monitor', 'drivers', 'vehicles'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'monitor' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Completed', value: inspections.length, color: 'blue' },
              { label: 'In Progress', value: drafts.length, color: 'yellow' },
              { label: 'Active Fleet', value: vehicles.filter(v => v.status === 'active').length, color: 'green' },
              { label: 'Alerts', value: inspections.filter(hasFailures).length, color: 'red' }
            ].map(stat => (
              <div key={stat.label} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-transform active:scale-95">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className={`text-3xl font-black ${getStatColorClass(stat.color)}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <h2 className="text-xl font-black text-gray-900 flex items-center uppercase tracking-tight">
                  <span className="relative flex h-3 w-3 mr-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
                  </span>
                  Inspection Activity
                </h2>
                <div className="flex items-center space-x-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase">Filter Date:</label>
                  <input 
                    type="date" 
                    value={dateFilter}
                    onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
                    className="text-xs font-bold border-gray-200 rounded-lg focus:ring-blue-500 p-2 bg-white shadow-sm"
                  />
                  {dateFilter && (
                    <button onClick={() => setDateFilter('')} className="text-[10px] font-black text-rose-600 uppercase hover:underline">Clear</button>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Driver</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Vehicle</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Inspection Date</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Time</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {currentPage === 1 && drafts.map(d => (
                        <tr key={d.id} className="bg-amber-50/20">
                          <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">{d.driverName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs font-mono font-bold text-blue-700 uppercase">{d.plateNumber}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-[10px] font-bold text-gray-400 italic">Continuous</td>
                          <td className="px-6 py-4 whitespace-nowrap text-[10px] font-bold text-amber-600">IN PROGRESS</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 bg-amber-100 text-amber-800 text-[10px] font-black rounded uppercase tracking-tighter">Drafting</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                             <span className="text-[10px] font-bold text-gray-400 uppercase">Awaiting Submission</span>
                          </td>
                        </tr>
                      ))}
                      {paginatedInspections.map(i => (
                        <tr key={i.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">{i.driverName}</td>
                          <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-gray-600 text-xs">{i.plateNumber}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-gray-700">
                            {new Date(i.timestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-gray-500">
                            {new Date(i.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {hasFailures(i) ? (
                              <span className="inline-flex items-center px-2 py-1 bg-rose-100 text-rose-800 text-[10px] font-black rounded uppercase">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Issue
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded uppercase">Pass</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button 
                              onClick={() => setViewingInspection(i)}
                              className="px-3 py-1.5 bg-gray-900 text-white text-[10px] font-black rounded-lg hover:bg-blue-600 transition-all uppercase tracking-widest shadow-sm"
                            >
                              View Full
                            </button>
                          </td>
                        </tr>
                      ))}
                      {paginatedInspections.length === 0 && drafts.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                            No Inspection Data Found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                      Page {currentPage} of {totalPages} ({filteredInspections.length} total)
                    </p>
                    <div className="flex space-x-2">
                      <button 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                      >
                        Prev
                      </button>
                      <button 
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Recent Alerts</h2>
              <div className="space-y-3">
                {inspections.filter(hasFailures).slice(0, 5).map(i => (
                  <div key={i.id} className="bg-rose-50 border-l-4 border-rose-600 p-4 rounded-r-xl shadow-sm cursor-pointer hover:bg-rose-100 transition-colors" onClick={() => setViewingInspection(i)}>
                    <div className="flex justify-between items-start">
                      <p className="text-[10px] font-black text-rose-900 uppercase tracking-widest">Failure Alert</p>
                      <span className="text-[10px] text-rose-600 font-bold">{new Date(i.timestamp).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-rose-800 mt-1 font-bold">{i.plateNumber}</p>
                    <p className="text-[10px] text-rose-700 mt-0.5">Critical maintenance issues detected. Tap to inspect report.</p>
                  </div>
                ))}
                {inspections.filter(hasFailures).length === 0 && (
                  <div className="bg-emerald-50 border-l-4 border-emerald-600 p-4 rounded-r-xl">
                    <p className="text-xs font-black text-emerald-900 uppercase">Operational Status</p>
                    <p className="text-[10px] text-emerald-800 mt-1 font-medium italic">No safety violations detected in recent reports.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'drivers' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Drivers</h2>
            <button 
              onClick={() => { setEditingDriver(null); setDriverForm({ name: '', email: '', assignedVehicleId: '', active: true }); setShowDriverModal(true); }}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
            >
              + Add New
            </button>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Driver</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Vehicle</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {drivers.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-gray-900">{d.name}</div>
                      <div className="text-[10px] text-gray-500">{d.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-mono font-bold text-blue-700 uppercase">
                      {vehicles.find(v => v.id === d.assignedVehicleId)?.plateNumber || 'Float'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-[9px] font-black rounded-full ${d.active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {d.active ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button onClick={() => openEditDriver(d)} className="text-blue-600 font-black text-[10px] uppercase hover:underline">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'vehicles' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Vehicle Assets</h2>
            <button 
              onClick={() => { setEditingVehicle(null); setVehicleForm({ plateNumber: '', model: '', status: 'active' }); setShowVehicleModal(true); }}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
            >
              + Register
            </button>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Asset ID</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Model</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vehicles.map(v => (
                  <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-mono font-black text-blue-800 uppercase tracking-tight">{v.plateNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-gray-900">{v.model}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-[9px] font-black rounded-full uppercase ${
                        v.status === 'active' ? 'bg-blue-100 text-blue-800' : 
                        v.status === 'maintenance' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button onClick={() => openEditVehicle(v)} className="text-blue-600 font-black text-[10px] uppercase hover:underline tracking-widest">Manage</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Driver Modal */}
      {showDriverModal && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">
                {editingDriver ? 'Modify Driver' : 'New Driver Entry'}
              </h3>
              <button onClick={() => setShowDriverModal(false)} className="text-gray-400 hover:text-gray-600 p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSaveDriver} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Full Identity</label>
                <input required value={driverForm.name} onChange={e => setDriverForm({...driverForm, name: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm" placeholder="Driver Name" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Email Access</label>
                <input required type="email" value={driverForm.email} onChange={e => setDriverForm({...driverForm, email: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm" placeholder="driver@essquare.com" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Dedicated Vehicle</label>
                <select value={driverForm.assignedVehicleId} onChange={e => setDriverForm({...driverForm, assignedVehicleId: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm">
                  <option value="">No Vehicle (Float)</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.plateNumber} — {v.model}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-3 pt-2">
                <input type="checkbox" id="driverActive" checked={driverForm.active} onChange={e => setDriverForm({...driverForm, active: e.target.checked})} className="w-6 h-6 rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500" />
                <label htmlFor="driverActive" className="text-xs font-black text-gray-700 uppercase tracking-widest">Active Status</label>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all mt-4">
                {editingDriver ? 'Save Changes' : 'Confirm Driver'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Vehicle Modal */}
      {showVehicleModal && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">
                {editingVehicle ? 'Asset Details' : 'Register Vehicle'}
              </h3>
              <button onClick={() => setShowVehicleModal(false)} className="text-gray-400 hover:text-gray-600 p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSaveVehicle} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Plate Number</label>
                <input required value={vehicleForm.plateNumber} onChange={e => setVehicleForm({...vehicleForm, plateNumber: e.target.value.toUpperCase()})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-black uppercase font-mono text-lg" placeholder="ABC-1234" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Manufacturer & Model</label>
                <input required value={vehicleForm.model} onChange={e => setVehicleForm({...vehicleForm, model: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm" placeholder="e.g. Tesla Model 3" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Operational State</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['active', 'maintenance', 'inactive'] as const).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setVehicleForm({...vehicleForm, status: s})}
                      className={`py-3 text-[9px] font-black uppercase rounded-xl border transition-all ${
                        vehicleForm.status === s ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100' : 'bg-white text-gray-500 border-gray-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all mt-4">
                {editingVehicle ? 'Update Asset' : 'Complete Registration'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Inspection Detail Modal */}
      {viewingInspection && (
        <InspectionDetailModal 
          inspection={viewingInspection} 
          onClose={() => setViewingInspection(null)} 
        />
      )}
    </div>
  );
};

export default AdminDashboard;
