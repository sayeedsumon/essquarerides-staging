
import React, { useState, useRef, useEffect } from 'react';

interface ImageUploadProps {
  label: string;
  value?: string;
  onChange: (base64: string) => void;
  required?: boolean;
  facingMode?: 'user' | 'environment';
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  label, 
  value, 
  onChange, 
  required,
  facingMode = 'environment' 
}) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    let currentStream: MediaStream | null = null;

    const startCamera = async () => {
      if (!isCameraOpen) return;
      
      setError(null);
      try {
        // Request original/highest resolution possible
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: facingMode,
            width: { ideal: 4096 }, // Target 4K if available
            height: { ideal: 2160 }
          },
          audio: false
        };
        
        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        currentStream = newStream;
        setStream(newStream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
          try {
            await videoRef.current.play();
          } catch (playErr) {
            console.error("Video play error:", playErr);
          }
        }
      } catch (err: any) {
        console.error("Camera access error:", err);
        setError(`Camera error: ${err.message || 'Access denied'}.`);
        setIsCameraOpen(false);
      }
    };

    if (isCameraOpen) {
      startCamera();
    }

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCameraOpen, facingMode]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const canvas = document.createElement('canvas');
    // Set canvas to native camera resolution
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      // Capture at 100% quality as requested
      const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
      onChange(dataUrl);
      stopCamera();
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-bold text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="flex flex-col items-center">
        {value ? (
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-200 shadow-sm">
            <img 
              src={value} 
              alt={label} 
              className="w-full h-full object-cover cursor-zoom-in" 
              onClick={() => setIsPreviewOpen(true)}
            />
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
            <div className="absolute bottom-2 right-2 flex space-x-2">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="bg-white/90 backdrop-blur p-2 rounded-full shadow-lg hover:bg-white text-gray-700"
                title="View Full Resolution"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/></svg>
              </button>
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 text-[10px] font-black rounded-full shadow-lg hover:bg-blue-700 uppercase tracking-wider"
              >
                Retake
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsCameraOpen(true)}
            className="w-full aspect-video flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-blue-50 hover:border-blue-300 transition-all group"
          >
            <div className="bg-white p-4 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-sm font-black text-gray-600 uppercase tracking-widest">Open Camera</span>
          </button>
        )}
      </div>

      {/* Full-Res Lightbox Modal */}
      {isPreviewOpen && value && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col p-4" onClick={() => setIsPreviewOpen(false)}>
          <div className="flex justify-between items-center text-white mb-4">
            <h4 className="text-xs font-black uppercase tracking-widest">{label} (Original Res)</h4>
            <button className="p-2 bg-white/10 rounded-full">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center overflow-auto">
            <img src={value} alt="Preview" className="max-w-full max-h-full object-contain shadow-2xl rounded-sm" />
          </div>
          <div className="p-4 text-center">
             <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em]">Tap anywhere to close</p>
          </div>
        </div>
      )}

      {isCameraOpen && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
          <div className="p-4 flex justify-between items-center bg-black/50 backdrop-blur text-white">
            <h3 className="text-sm font-black uppercase tracking-widest">{label}</h3>
            <button onClick={stopCamera} className="p-2 hover:bg-white/10 rounded-full">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            {error && (
               <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                 <p className="bg-white/90 p-4 rounded-xl text-rose-700 font-bold shadow-2xl">{error}</p>
               </div>
            )}
            <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
               <span className="text-[9px] font-black text-white uppercase tracking-widest">High Res Mode Active</span>
            </div>
          </div>

          <div className="p-8 flex justify-center items-center bg-black/50 backdrop-blur">
            <button
              type="button"
              onClick={capturePhoto}
              disabled={!!error}
              className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-90 transition-transform ${!!error ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="w-16 h-16 rounded-full bg-white shadow-inner"></div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
