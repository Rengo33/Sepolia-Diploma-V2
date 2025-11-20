import React, { useState, useCallback } from 'react';
import { Contract, keccak256, toUtf8Bytes } from 'ethers';
import { UploadCloud, FileText, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface VerifyProps {
  contract: Contract | null;
  account?: string;
}

export function VerifySection({ contract, account }: VerifyProps) {
  const [fileHash, setFileHash] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // --- DRAG AND DROP HANDLERS ---

  // 1. CRITICAL: preventDefault allows the drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  // 2. Handle the Drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, []);

  // 3. Handle standard file input click
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  // --- FILE PROCESSING LOGIC ---
  const processFile = async (file: File) => {
    setFileName(file.name);
    setVerificationStatus('idle');
    setErrorMessage('');

    try {
      const buffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);
      
      // Note: This is a simple hash. For PDF contents, usually you hash the raw bytes.
      // Ensure this matches EXACTLY how you minted it.
      const hash = keccak256(uint8Array);
      setFileHash(hash);
    } catch (error) {
      console.error("Error hashing file:", error);
      setErrorMessage("Failed to process file.");
    }
  };

  const verifyDocument = async () => {
    if (!contract || !fileHash) return;
    setVerificationStatus('loading');

    try {
      // Assuming your contract has a isValid(bytes32) function
      const isValid = await contract.isValid(fileHash); // Adjust function name to your contract
      setVerificationStatus(isValid ? 'valid' : 'invalid');
    } catch (error) {
      console.error("Verification failed", error);
      setVerificationStatus('invalid'); // Or handle error state specifically
      setErrorMessage("Error connecting to contract.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-slate-900">Verify Diploma</h2>
        <p className="text-slate-500 mt-2">Drag and drop a document to verify its authenticity on the blockchain.</p>
      </div>

      {/* --- DRAG AND DROP ZONE --- */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 ease-in-out cursor-pointer
          ${isDragging 
            ? 'border-blue-500 bg-blue-50 scale-[1.02]' 
            : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
          }
        `}
      >
        <input 
          type="file" 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
          onChange={handleFileInput}
          accept=".pdf,.png,.jpg,.json" // Adjust based on your needs
        />
        
        <div className="flex flex-col items-center justify-center pointer-events-none">
          {fileName ? (
            <>
              <FileText className="w-12 h-12 text-blue-600 mb-3" />
              <p className="text-sm font-medium text-slate-900">{fileName}</p>
              <p className="text-xs text-slate-500 mt-1 break-all">{fileHash ? `${fileHash.slice(0, 20)}...` : 'Calculating hash...'}</p>
            </>
          ) : (
            <>
              <UploadCloud className={`w-12 h-12 mb-3 ${isDragging ? 'text-blue-600' : 'text-slate-400'}`} />
              <p className="text-lg font-medium text-slate-700">
                {isDragging ? 'Drop file now' : 'Click or Drag file here'}
              </p>
              <p className="text-sm text-slate-500 mt-1">Supports PDF, JPG, PNG</p>
            </>
          )}
        </div>
      </div>

      {/* --- ACTIONS --- */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={verifyDocument}
          disabled={!fileHash || verificationStatus === 'loading' || !contract}
          className={`
            flex items-center gap-2 px-8 py-3 rounded-lg font-semibold text-white transition-all
            ${!fileHash || !contract ? 'bg-slate-300 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 shadow-lg active:scale-95'}
          `}
        >
          {verificationStatus === 'loading' ? <Loader2 className="animate-spin" /> : null}
          Verify Document
        </button>
      </div>

      {/* --- RESULTS --- */}
      {verificationStatus !== 'idle' && verificationStatus !== 'loading' && (
        <div className={`mt-8 p-4 rounded-lg border flex items-start gap-3 ${
          verificationStatus === 'valid' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          {verificationStatus === 'valid' ? (
            <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
          ) : (
            <XCircle className="w-6 h-6 text-red-600 shrink-0" />
          )}
          <div>
            <h3 className={`font-bold ${
              verificationStatus === 'valid' ? 'text-green-800' : 'text-red-800'
            }`}>
              {verificationStatus === 'valid' ? 'Document Verified' : 'Invalid Document'}
            </h3>
            <p className={`text-sm mt-1 ${
              verificationStatus === 'valid' ? 'text-green-700' : 'text-red-700'
            }`}>
              {verificationStatus === 'valid' 
                ? 'This document hash exists in the smart contract registry.' 
                : 'This document hash was not found in the registry.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}