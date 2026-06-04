"use client";

import { useState, useRef, useEffect } from "react";
import { CameraIcon, ArrowUpTrayIcon } from "@heroicons/react/24/outline";

interface ImageUploadInputProps {
  label?: string;
  required?: boolean;
  onChange: (file: File | null) => void;
  currentImage?: string; // URL from DB
  file?: File | null; // Currently selected file object
  className?: string;
  loading?: boolean;
}

export default function ImageUploadInput({ label, required, onChange, currentImage, file, className, loading }: ImageUploadInputProps) {
  const [showPopup, setShowPopup] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreviewUrl(null);
    }
  }, [file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    onChange(selectedFile);
    setShowPopup(false);
  };

  return (
    <div className={className}>
      {label && <span className="block text-sm font-semibold text-gray-700  mb-2">{label}</span>}
      
      {/* Hidden inputs */}
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        ref={cameraInputRef} 
        className="hidden" 
        onChange={handleFileChange}
      />
      <input 
        type="file" 
        accept="image/*" 
        ref={galleryInputRef} 
        className="hidden" 
        onChange={handleFileChange}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <button 
          type="button" 
          onClick={() => setShowPopup(true)} 
          className="py-2 px-4 rounded-full border-0 text-sm font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100   transition-colors"
        >
          Choose File
        </button>
        
        <div className="flex items-center gap-3">
          {previewUrl && (
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="w-10 h-10 object-cover rounded-md shadow-sm border border-gray-200 " 
            />
          )}
          <span className="text-sm text-gray-500  break-all">
            {loading ? (
               <span className="text-blue-600 font-medium animate-pulse flex items-center gap-1">
                 <ArrowUpTrayIcon className="w-4 h-4 animate-bounce" />
                 Compressing...
               </span>
            ) : (file ? file.name : "No file chosen")}
          </span>
        </div>
      </div>

      {/* Hidden required input to maintain HTML5 validation */}
      {required && !file && !currentImage && (
        <input type="text" className="opacity-0 w-0 h-0 absolute pointer-events-none" required tabIndex={-1} />
      )}

      {currentImage && !previewUrl && (
        <a href={currentImage} target="_blank" rel="noreferrer" className="text-xs text-blue-600  mt-2 block underline">
          View Current Image
        </a>
      )}

      {/* Popup Modal */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white  p-6 rounded-xl shadow-lg max-w-xs w-full animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-semibold text-gray-900  mb-4 text-center">Select Image Source</h3>
            <div className="flex flex-col gap-3">
              <button 
                type="button" 
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                <CameraIcon className="w-5 h-5" />
                Take Photo
              </button>
              <button 
                type="button" 
                onClick={() => galleryInputRef.current?.click()}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-200 hover:bg-gray-300   text-gray-800  rounded-lg transition-colors font-medium"
              >
                <ArrowUpTrayIcon className="w-5 h-5" />
                Upload Photo
              </button>
              <button 
                type="button" 
                onClick={() => setShowPopup(false)}
                className="mt-2 py-2 text-sm text-gray-500  hover:text-gray-700  underline"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}