
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Vehicle, InspectionData, InspectionRecord } from '../types';
import { storage } from '../services/storage';
import ImageUpload from '../components/ImageUpload';
import SignaturePad from '../components/SignaturePad';

interface InspectionWorkflowProps {
  user: User;
}

const STEPS = [
  'Vehicle Select',
  'Verification',
  'Shift Info',
  'Exterior Photos',
  'Exterior Condition',
  'Interior Photos',
  'Equipment',
  'Tires',
  'Readings',
  'Functional',
  'Final Sign-Off'
];

const InspectionWorkflow: React.FC<InspectionWorkflowProps> = ({ user }) => {
  const navigate = useNavigate();
  const isCancelling = useRef(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState<Partial<InspectionData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const allVehicles = storage.getVehicles().filter(v => v.status === 'active');
    setVehicles(allVehicles);

    const draft = storage.getDraft();
    if (draft && draft.driverId === user.id) {
      setFormData(draft.data);
      const draftVehicle = allVehicles.find(v => v.id === draft.vehicleId);
      if (draftVehicle) {
        setSelectedVehicle(draftVehicle);
        if (currentStep === 0) setCurrentStep(1);
      }
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setFormData(prev => ({
          ...prev,
          location: { lat: pos.coords.latitude, lng: pos.coords.longitude }
        }));
      });
    }
  }, [user]);

  useEffect(() => {
    if (isCancelling.current) return;
    
    if (selectedVehicle && formData && Object.keys(formData).length > 0) {
      const draft: InspectionRecord = {
        id: 'draft_' + user.id,
        driverId: user.id,
        driverName: user.name,
        vehicleId: selectedVehicle.id,
        plateNumber: selectedVehicle.plateNumber,
        timestamp: Date.now(),
        status: 'incomplete',
        data: formData
      };
      try {
        storage.saveDraft(draft);
      } catch (e) {
        // Silent fail for background draft saves
      }
    }
  }, [formData, selectedVehicle, user]);

  const updateField = (field: keyof InspectionData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0: return !!selectedVehicle;
      case 1: return !!formData.selfie;
      case 2: return !!formData.shiftType;
      case 3: return !!(formData.vehicleLocationImg && formData.frontImg && formData.backImg && formData.leftImg && formData.rightImg);
      case 4: return !!(formData.exteriorCleanliness && formData.exteriorBodyCheck);
      case 5: return !!(formData.frontSeatImg && formData.backSeatImg && formData.trunkImg && formData.interiorCleanliness);
      case 6: return !!(formData.phoneHolderImg && formData.transponderImg);
      case 7: return !!(formData.leftFrontTireImg && formData.leftRearTireImg && formData.rightFrontTireImg && formData.rightRearTireImg);
      case 8: return !!(formData.odometer && formData.batteryImg && formData.batteryLevel);
      case 9: return !!(formData.brakes && formData.horn && formData.lights && formData.windshield && formData.wipers && formData.mirrors && formData.tirePressure);
      case 10: return !!(formData.windowsUpImg && formData.overallCondition && formData.signature);
      default: return false;
    }
  };

  const next = () => {
    if (isStepValid() && currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const prev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const cancelInspection = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (window.confirm("Are you sure you want to cancel? All progress will be lost.")) {
      isCancelling.current = true;
      storage.saveDraft(null);
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 0);
    }
  };

  const handleSubmit = async () => {
    if (!isStepValid()) {
      alert('Please complete all fields before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      const finalLocation = await new Promise<{lat: number, lng: number} | null>((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 6000 }
        );
      });

      const finalRecord: InspectionRecord = {
        id: 'ins_' + Date.now(),
        driverId: user.id,
        driverName: user.name,
        vehicleId: selectedVehicle?.id || 'unknown',
        plateNumber: selectedVehicle?.plateNumber || 'unknown',
        timestamp: Date.now(),
        status: 'complete',
        data: {
          ...formData,
          location: finalLocation || formData.location 
        }
      };

      const currentInspections = storage.getInspections();
      
      try {
        storage.saveInspections([...currentInspections, finalRecord]);
      } catch (storageError) {
        // Pruning logic to ensure the new submission always saves
        const pruned = [...currentInspections.slice(-1), finalRecord];
        try {
          storage.saveInspections(pruned);
        } catch (innerError) {
          alert("System Error: Local database is full. Please contact support to clear logs.");
          setIsSubmitting(false);
          return;
        }
      }
      
      isCancelling.current = true;
      storage.saveDraft(null);

      setTimeout(() => {
        navigate('/', { replace: true });
      }, 500);

    } catch (err) {
      console.error("Submission error:", err);
      alert("System Error: Unable to complete submission at this time.");
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Select Vehicle <span className="text-red-500">*</span></h2>
            <div className="grid grid-cols-1 gap-3">
              {vehicles.map(v => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVehicle(v)}
                  className={`w-full p-4 text-left border rounded-xl flex items-center justify-between transition-all ${
                    selectedVehicle?.id === v.id ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600' : 'border-gray-200 bg-white hover:border-blue-300'
                  }`}
                >
                  <div>
                    <div className="font-black text-gray-900">{v.plateNumber}</div>
                    <div className="text-xs text-gray-500">{v.model}</div>
                  </div>
                  {selectedVehicle?.id === v.id && (
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
                    </div>
                  )}
                </button>
              ))}
              {vehicles.length === 0 && <p className="text-gray-500 italic">No active vehicles available.</p>}
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Driver Verification</h2>
            <ImageUpload
              label="Driver Selfie"
              facingMode="user"
              value={formData.selfie}
              onChange={(val) => updateField('selfie', val)}
              required
            />
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Shift Information</h2>
            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-700">Shift Selection <span className="text-red-500">*</span></label>
              {['start', 'end'].map(type => (
                <button
                  key={type}
                  onClick={() => updateField('shiftType', type)}
                  className={`w-full p-4 text-left border rounded-xl flex items-center justify-between transition-colors ${
                    formData.shiftType === type ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600' : 'border-gray-200 bg-white'
                  }`}
                >
                  <span className="capitalize font-bold text-gray-900">{type} Shift</span>
                  {formData.shiftType === type && <div className="w-5 h-5 rounded-full bg-blue-600 shadow-sm border-2 border-white"></div>}
                </button>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Vehicle Exterior Photos</h2>
            <ImageUpload label="Location with Plate" value={formData.vehicleLocationImg} onChange={v => updateField('vehicleLocationImg', v)} required />
            <ImageUpload label="Front View" value={formData.frontImg} onChange={v => updateField('frontImg', v)} required />
            <ImageUpload label="Back View" value={formData.backImg} onChange={v => updateField('backImg', v)} required />
            <ImageUpload label="Left Side" value={formData.leftImg} onChange={v => updateField('leftImg', v)} required />
            <ImageUpload label="Right Side" value={formData.rightImg} onChange={v => updateField('rightImg', v)} required />
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Exterior Condition</h2>
            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-700">Cleanliness <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 gap-2">
                {['Excellent', 'Good', 'Average', 'Poor'].map(r => (
                  <button
                    key={r}
                    onClick={() => updateField('exteriorCleanliness', r)}
                    className={`p-3 text-sm font-bold rounded-lg border text-center transition-all ${formData.exteriorCleanliness === r ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'border-gray-300 bg-white text-gray-700'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-700">Body Check (Significant Damages?) <span className="text-red-500">*</span></label>
              <div className="flex space-x-2">
                {['Pass', 'Fail'].map(v => (
                  <button
                    key={v}
                    onClick={() => updateField('exteriorBodyCheck', v)}
                    className={`flex-1 p-3 text-sm rounded-lg border font-black uppercase tracking-wide transition-all ${formData.exteriorBodyCheck === v ? (v === 'Pass' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-rose-600 text-white border-rose-600 shadow-md') : 'border-gray-300 bg-white text-gray-700'}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Interior Photos</h2>
            <ImageUpload label="Front Seat" value={formData.frontSeatImg} onChange={v => updateField('frontSeatImg', v)} required />
            <ImageUpload label="Back Seat" value={formData.backSeatImg} onChange={v => updateField('backSeatImg', v)} required />
            <ImageUpload label="Trunk" value={formData.trunkImg} onChange={v => updateField('trunkImg', v)} required />
            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-700">Cleanliness <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 gap-2">
                {['Excellent', 'Good', 'Average', 'Poor'].map(r => (
                  <button
                    key={r}
                    onClick={() => updateField('interiorCleanliness', r)}
                    className={`p-3 text-sm font-bold rounded-lg border text-center transition-all ${formData.interiorCleanliness === r ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'border-gray-300 bg-white text-gray-700'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Equipment Check</h2>
            <ImageUpload label="Phone Holder" value={formData.phoneHolderImg} onChange={v => updateField('phoneHolderImg', v)} required />
            <ImageUpload label="Transponder" value={formData.transponderImg} onChange={v => updateField('transponderImg', v)} required />
          </div>
        );
      case 7:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Tires & Rims</h2>
            <ImageUpload label="Left Front" value={formData.leftFrontTireImg} onChange={v => updateField('leftFrontTireImg', v)} required />
            <ImageUpload label="Left Rear" value={formData.leftRearTireImg} onChange={v => updateField('leftRearTireImg', v)} required />
            <ImageUpload label="Right Front" value={formData.rightFrontTireImg} onChange={v => updateField('rightFrontTireImg', v)} required />
            <ImageUpload label="Right Rear" value={formData.rightRearTireImg} onChange={v => updateField('rightRearTireImg', v)} required />
          </div>
        );
      case 8:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Vehicle Readings</h2>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">Odometer Reading <span className="text-red-500">*</span></label>
              <input
                type="number"
                value={formData.odometer || ''}
                onChange={e => updateField('odometer', e.target.value)}
                placeholder="Enter current mileage"
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 text-xl font-mono text-gray-900 font-bold"
              />
            </div>
            <ImageUpload label="Battery Level Display" value={formData.batteryImg} onChange={v => updateField('batteryImg', v)} required />
            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-700">Select Level <span className="text-red-500">*</span></label>
              <div className="flex space-x-2">
                {['Full', 'Half', 'Low'].map(l => (
                  <button
                    key={l}
                    onClick={() => updateField('batteryLevel', l)}
                    className={`flex-1 p-3 text-sm rounded-lg border font-black uppercase transition-all ${formData.batteryLevel === l ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'border-gray-300 bg-white text-gray-700'}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case 9:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Functional Checks (All Required)</h2>
            {[
              { id: 'brakes', label: 'Brakes OK?' },
              { id: 'horn', label: 'Horn Working?' },
              { id: 'lights', label: 'Lights/Blinkers OK?' },
              { id: 'windshield', label: 'Windshield (No Cracks)?' },
              { id: 'wipers', label: 'Wipers/Washers OK?' },
              { id: 'mirrors', label: 'Mirrors OK?' },
              { id: 'tirePressure', label: 'Tire Pressure OK?' }
            ].map(item => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                <span className="text-sm font-bold text-gray-800">{item.label}</span>
                <div className="flex space-x-2">
                  {['Pass', 'Fail'].map(v => (
                    <button
                      key={v}
                      onClick={() => updateField(item.id as any, v)}
                      className={`px-4 py-2 text-xs font-black rounded-lg border transition-all ${
                        formData[item.id as keyof InspectionData] === v
                        ? (v === 'Pass' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-rose-600 text-white border-rose-600 shadow-sm')
                        : 'border-gray-200 bg-gray-50 text-gray-600'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      case 10:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Final Sign-Off</h2>
            <ImageUpload label="Windows Up Verification" value={formData.windowsUpImg} onChange={v => updateField('windowsUpImg', v)} required />
            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-700">Overall Vehicle Condition <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 gap-2">
                {['Excellent', 'Good', 'Fair', 'Poor'].map(r => (
                  <button
                    key={r}
                    onClick={() => updateField('overallCondition', r)}
                    className={`p-3 text-sm font-bold rounded-lg border text-center transition-all ${formData.overallCondition === r ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'border-gray-300 bg-white text-gray-700'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-700">Driver Signature <span className="text-red-500">*</span></label>
              <SignaturePad
                onSave={(val) => updateField('signature', val)}
                onClear={() => updateField('signature', undefined)}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 max-w-2xl mx-auto w-full">
      <div className="bg-white border-b sticky top-16 z-40 px-4 py-2 flex items-center justify-between">
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1 mr-4">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Step {currentStep + 1} of {STEPS.length}</span>
            <span className="text-xs font-black text-blue-700 uppercase">{STEPS[currentStep]}</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mr-4">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>
        <button 
          type="button"
          onClick={cancelInspection}
          className="ml-4 p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          title="Cancel Inspection"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <div className="p-4 flex-1 pb-32">
        {renderStep()}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-between items-center max-w-2xl mx-auto z-50">
        <button
          onClick={prev}
          disabled={currentStep === 0}
          className={`px-6 py-3 rounded-xl font-black text-sm uppercase transition-all ${currentStep === 0 ? 'text-gray-400 cursor-not-allowed opacity-50' : 'text-gray-700 hover:bg-gray-100'}`}
        >
          Previous
        </button>

        {currentStep === STEPS.length - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !isStepValid()}
            className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-black text-sm uppercase shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                SUBMITTING...
              </>
            ) : (
              'SUBMIT'
            )}
          </button>
        ) : (
          <button
            onClick={next}
            disabled={!isStepValid()}
            className="px-8 py-3 bg-blue-600 text-white rounded-xl font-black text-sm uppercase shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            NEXT STEP
          </button>
        )}
      </div>
    </div>
  );
};

export default InspectionWorkflow;
