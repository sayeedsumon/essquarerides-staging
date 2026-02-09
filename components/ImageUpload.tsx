
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
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Effect to handle camera stream assignment when the video element mounts
  useEffect(() => {
    let currentStream: MediaStream | null = null;

    const startCamera = async () => {
      if (!isCameraOpen) return;
      
      setError(null);
      try {
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
          // Ensure video plays
          try {
            await videoRef.current.play();
          } catch (playErr) {
            console.error("Video play error:", playErr);
          }
        }
      } catch (err: any) {
        console.error("Camera access error:", err);
        setError(`Camera error: ${err.message || 'Access denied'}. Please check site permissions.`);
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
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
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
            <img src={value} alt={label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/10 flex items-end justify-end p-2">
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="bg-white/95 backdrop-blur px-4 py-2 text-xs font-black rounded-full shadow-lg hover:bg-white text-blue-700 uppercase tracking-wider"
              >
                Retake Photo
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

      {isCameraOpen && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
          <div className="p-4 flex justify-between items-center bg-black/50 backdrop-blur text-white">
            <h3 className="text-sm font-black uppercase tracking-widest">{label}</h3>
            <button onClick={stopCamera} className="p-2 hover:bg-white/10 rounded-full">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {error && (
               <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                 <p className="bg-white/90 p-4 rounded-xl text-rose-700 font-bold shadow-2xl">{error}</p>
               </div>
            )}
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

      {error && !isCameraOpen && (
        <p className="text-xs text-rose-600 font-bold mt-1 px-2">{error}</p>
      )}
    </div>
  );
};

export default ImageUpload;
