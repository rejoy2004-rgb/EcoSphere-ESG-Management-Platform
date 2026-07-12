import React, { useState, useRef } from 'react';
import { Upload, File, CheckCircle, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  uploadUrl: string;
  accept?: string;
  onSuccess: (data: any) => void;
  onError?: (err: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  uploadUrl,
  accept,
  onSuccess,
  onError
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const uploadFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setStatus('uploading');
    setErrorMsg('');

    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    let role = '';
    if (userStr) {
      try {
        role = JSON.parse(userStr).role;
      } catch {}
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          ...(role ? { 'x-user-role': role } : {})
        },
        body: formData
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setStatus('success');
      onSuccess(data);
    } catch (err: any) {
      setStatus('error');
      const msg = err.message || 'File upload failed';
      setErrorMsg(msg);
      if (onError) onError(msg);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 ${
          dragActive
            ? 'border-emerald-500 bg-emerald-500/5'
            : status === 'uploading'
              ? 'border-blue-500 bg-blue-500/5'
              : status === 'success'
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : status === 'error'
                  ? 'border-rose-500/50 bg-rose-500/5'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-900/20'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />

        {status === 'idle' && (
          <>
            <Upload className="w-8 h-8 text-slate-500 mb-2" />
            <p className="text-xs text-slate-300 font-semibold mb-1">
              Drag and drop your file here, or click to browse
            </p>
            <p className="text-[10px] text-slate-500">Supports PDF, XLSX, CSV, JPG, PNG</p>
          </>
        )}

        {status === 'uploading' && (
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-blue-400 animate-spin mb-2" />
            <p className="text-xs text-slate-300 font-medium">Uploading {file?.name}...</p>
          </div>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-8 h-8 text-emerald-400 mb-2" />
            <p className="text-xs text-emerald-300 font-semibold mb-1">Upload Successful!</p>
            <p className="text-[10px] text-slate-400 font-mono truncate max-w-xs">{file?.name}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="w-8 h-8 text-rose-400 mb-2" />
            <p className="text-xs text-rose-300 font-semibold mb-1">{errorMsg}</p>
            <p className="text-[10px] text-slate-500">Click to try again</p>
          </>
        )}
      </div>
    </div>
  );
};
