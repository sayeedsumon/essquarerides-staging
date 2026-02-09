
import React, { useState } from 'react';
import { InspectionRecord } from '../types';

interface InspectionDetailModalProps {
  inspection: InspectionRecord;
  onClose: () => void;
}

const InspectionDetailModal: React.FC<InspectionDetailModalProps> = ({ inspection, onClose }) => {
  const [zoomedImage, setZoomedImage] = useState<{ label: string; src: string } | null>(null);
  const data = inspection.data;

  const DetailSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="space-y-4 mb-8">
      <h3 className="text-xs font-black text-blue-600 uppercase tracking-[0.2em] border-b border-blue-50 pb-2">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {children}
      </div>
    </div>
  );

  const PhotoCard = ({ label, src }: { label: string; src?: string }) => (
    <div 
      className={`bg-white p-2 rounded-xl border border-gray-100 shadow-sm flex flex-col group transition-all ${src ? 'cursor-zoom-in hover:border-blue-200 hover:shadow-md' : ''}`}
      onClick={() => src && setZoomedImage({ label, src })}
    >
      <div className="flex justify-between items-center mb-2 px-1">
        <span className="text-[9px] font-black text-gray-400 uppercase">{label}</span>
        {src && (
          <svg className="w-3 h-3 text-gray-300 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/></svg>
        )}
      </div>
      {src ? (
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-gray-50 relative">
          <img src={src} alt={label} className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity"></div>
        </div>
      ) : (
        <div className="aspect-video w-full bg-gray-50 rounded-lg flex items-center justify-center italic text-gray-400 text-[10px]">
          Photo Missing
        </div>
      )}
    </div>
  );

  const StatusCard = ({ label, val }: { label: string; val?: string }) => (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
      <span className="text-[10px] font-black text-gray-600 uppercase">{label}</span>
      <span className={`px-2 py-0.5 text-[10px] font-black rounded uppercase ${
        val === 'Pass' || val === 'Excellent' || val === 'Good' || val === 'Full'
        ? 'bg-emerald-100 text-emerald-700' 
        : val === 'Poor' || val === 'Fail' || val === 'Low'
        ? 'bg-rose-100 text-rose-700' 
        : 'bg-amber-100 text-amber-700'
      }`}>
        {val || 'N/A'}
      </span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[70] bg-white flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 sticky top-0 z-[80] flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest">{inspection.plateNumber} Inspection</h2>
            <p className="text-[10px] text-gray-400 font-bold">Submitted by {inspection.driverName} • {new Date(inspection.timestamp).toLocaleString()}</p>
          </div>
        </div>
        {data.location && (
          <a 
            href={`https://www.google.com/maps?q=${data.location.lat},${data.location.lng}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center space-x-2 bg-blue-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase hover:bg-blue-700 transition-colors"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
            <span>Live Location</span>
          </a>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto bg-gray-50/50 p-4 pb-20 no-scrollbar">
        <div className="max-w-4xl mx-auto">
          
          <DetailSection title="Verification & Shift">
            <PhotoCard label="Driver Selfie" src={data.selfie} />
            <StatusCard label="Shift Mode" val={data.shiftType?.toUpperCase()} />
            {data.location && (
              <StatusCard 
                label="GPS Coordinates" 
                val={`${data.location.lat.toFixed(5)}, ${data.location.lng.toFixed(5)}`} 
              />
            )}
            <PhotoCard label="Start-of-Shift Location" src={data.vehicleLocationImg} />
          </DetailSection>

          <DetailSection title="Vehicle Exterior">
            <PhotoCard label="Front View" src={data.frontImg} />
            <PhotoCard label="Back View" src={data.backImg} />
            <PhotoCard label="Left Side" src={data.leftImg} />
            <PhotoCard label="Right Side" src={data.rightImg} />
            <StatusCard label="Exterior Cleanliness" val={data.exteriorCleanliness} />
            <StatusCard label="Body Integrity" val={data.exteriorBodyCheck} />
          </DetailSection>

          <DetailSection title="Interior & Equipment">
            <PhotoCard label="Front Cockpit" src={data.frontSeatImg} />
            <PhotoCard label="Passenger Area" src={data.backSeatImg} />
            <PhotoCard label="Trunk/Cargo" src={data.trunkImg} />
            <StatusCard label="Interior Cleanliness" val={data.interiorCleanliness} />
            <PhotoCard label="Phone Holder" src={data.phoneHolderImg} />
            <PhotoCard label="Transponder Check" src={data.transponderImg} />
          </DetailSection>

          <DetailSection title="Tires & Wheels">
            <PhotoCard label="Left Front" src={data.leftFrontTireImg} />
            <PhotoCard label="Left Rear" src={data.leftRearTireImg} />
            <PhotoCard label="Right Front" src={data.rightFrontTireImg} />
            <PhotoCard label="Right Rear" src={data.rightRearTireImg} />
          </DetailSection>

          <DetailSection title="Readings & Battery">
             <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center">
               <span className="text-[9px] font-black text-gray-400 uppercase mb-1">Odometer Mileage</span>
               <span className="text-2xl font-black font-mono text-gray-900 tracking-tighter">{data.odometer}</span>
             </div>
             <PhotoCard label="Battery Display" src={data.batteryImg} />
             <StatusCard label="Energy Level" val={data.batteryLevel} />
          </DetailSection>

          <DetailSection title="Safety Checklist">
            <StatusCard label="Brake System" val={data.brakes} />
            <StatusCard label="Horn" val={data.horn} />
            <StatusCard label="Lights & Signals" val={data.lights} />
            <StatusCard label="Windshield" val={data.windshield} />
            <StatusCard label="Wipers/Washers" val={data.wipers} />
            <StatusCard label="Mirrors" val={data.mirrors} />
            <StatusCard label="Tire Pressure" val={data.tirePressure} />
          </DetailSection>

          <DetailSection title="Final Sign-Off">
            <PhotoCard label="Windows Up Verification" src={data.windowsUpImg} />
            <StatusCard label="Overall State" val={data.overallCondition} />
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center">
              <span className="text-[9px] font-black text-gray-400 uppercase mb-3">Driver Digital Signature</span>
              {data.signature ? (
                <img src={data.signature} className="h-16 object-contain" alt="Signature" />
              ) : (
                <span className="text-rose-600 font-bold text-xs uppercase italic">Missing Signature</span>
              )}
            </div>
          </DetailSection>
          
        </div>
      </div>

      {/* Footer Summary */}
      <div className="p-4 bg-white border-t border-gray-200 sticky bottom-0 flex items-center justify-between">
        <div className="flex items-center space-x-2">
           <div className={`w-3 h-3 rounded-full ${inspection.status === 'complete' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
           <span className="text-xs font-black text-gray-900 uppercase">Status: {inspection.status}</span>
        </div>
        <button onClick={onClose} className="px-6 py-2 bg-gray-100 text-gray-900 text-xs font-black rounded-xl uppercase tracking-widest hover:bg-gray-200 transition-all">Close Report</button>
      </div>

      {/* Image Lightbox */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-200"
          onClick={() => setZoomedImage(null)}
        >
          <div className="p-4 flex justify-between items-center text-white bg-black/50 backdrop-blur sticky top-0">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Original Resolution</span>
              <h4 className="text-sm font-bold uppercase tracking-tight">{zoomedImage.label}</h4>
            </div>
            <button className="p-2 hover:bg-white/10 rounded-full">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div className="flex-1 overflow-auto flex items-center justify-center p-2">
            <img 
              src={zoomedImage.src} 
              alt={zoomedImage.label} 
              className="max-w-full max-h-full object-contain shadow-2xl" 
            />
          </div>
          <div className="p-4 text-center bg-black/30 backdrop-blur">
             <span className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Click anywhere to exit view</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default InspectionDetailModal;
