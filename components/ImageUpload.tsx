
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
        // Optimization: Use 720p resolution. 4K base64 strings are too large for localStorage.
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
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
    // Maintain a maximum dimension for storage efficiency
    const MAX_DIM = 1280;
    let width = video.videoWidth;
    let height = video.videoHeight;

    if (width > height) {
      if (width > MAX_DIM) {
        height *= MAX_DIM / width;
        width = MAX_DIM;
      }
    } else {
      if (height > MAX_DIM) {
        width *= MAX_DIM / height;
        height = MAX_DIM;
      }
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, width, height);
      // Optimization: Using 0.5 quality significantly reduces base64 size for localStorage compatibility
      const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
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

      {isPreviewOpen && value && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col p-4" onClick={() => setIsPreviewOpen(false)}>
          <div className="flex justify-between items-center text-white mb-4">
            <h4 className="text-xs font-black uppercase tracking-widest">{label} (Optimized View)</h4>
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
        <div className="fixed inset-0 z-[100] bg-black flex flex-col h-[100dvh]">
          {/* Immersive Camera UI */}
          <div className="p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent text-white absolute top-0 left-0 right-0 z-[110]">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest">{label}</h3>
              <p className="text-[9px] font-bold text-blue-400 uppercase tracking-tighter">Mobile-Optimized Capture</p>
            </div>
            <button onClick={stopCamera} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            
            {/* Viewfinder overlay */}
            <div className="absolute inset-0 border-[40px] border-black/20 pointer-events-none flex items-center justify-center">
               <div className="w-64 h-48 border-2 border-white/30 rounded-lg relative">
                 <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-white"></div>
                 <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-white"></div>
                 <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-white"></div>
                 <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-white"></div>
               </div>
            </div>

            {/* Quality Hint Overlay */}
            <div className="absolute bottom-32 left-0 right-0 px-6 pointer-events-none text-center">
               <div className="bg-black/60 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20 inline-block max-w-xs shadow-2xl">
                 <p className="text-[10px] font-black text-white uppercase tracking-tight leading-relaxed">
                   <span className="text-blue-400">HINT:</span> Hold steady. Avoid blurry photos and ensure good lighting for fast approval.
                 </p>
               </div>
            </div>

            {error && (
               <div className="absolute inset-0 flex items-center justify-center p-6 text-center z-[120]">
                 <p className="bg-white/90 p-4 rounded-xl text-rose-700 font-bold shadow-2xl">{error}</p>
               </div>
            )}
          </div>

          {/* Shutter Bar */}
          <div className="h-32 flex justify-center items-center bg-black z-[110] border-t border-white/5">
            <button
              type="button"
              onClick={capturePhoto}
              disabled={!!error}
              className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-90 transition-transform shadow-lg ${!!error ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="w-16 h-16 rounded-full bg-white shadow-inner flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border border-gray-200"></div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
