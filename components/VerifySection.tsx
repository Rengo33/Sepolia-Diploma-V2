import React, { useState, useCallback } from 'react';
import { Contract } from 'ethers';
import { Upload, Search, CheckCircle, XCircle, Loader2, ShieldAlert, FileText } from 'lucide-react';

interface VerifySectionProps {
  contract: Contract | null;
  account: string | undefined;
}

export const VerifySection: React.FC<VerifySectionProps> = ({ contract, account }) => {
  const [uploadedPdfHash, setUploadedPdfHash] = useState('');
  const [fileName, setFileName] = useState('');
  const [status, setStatus] = useState<'idle' | 'scanning' | 'found' | 'revoked' | 'not_found'>('idle');
  const [foundTokenId, setFoundTokenId] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  
  // Visual state for drag events
  const [isDragging, setIsDragging] = useState(false);

  // --- 1. File Processing & Auto-Verification Logic ---
  const processFile = async (file: File) => {
    if (!file) return;

    setFileName(file.name);
    setStatus('idle');
    setFoundTokenId(null);
    setUploadedPdfHash(''); // Clear previous hash temporarily
    
    try {
      // 1. Calculate Hash
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
      const hex = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      
      const hash = "0x" + hex;
      
      // 2. Update State
      setUploadedPdfHash(hash);
      
      // 3. AUTO-START VERIFICATION
      // We use the local 'hash' variable to ensure we don't wait for React state update
      if (contract && account) {
        await verifyDiploma(hash);
      } else {
        console.warn("Contract or Account not ready, manual scan required");
      }

    } catch (error) {
      console.error("Error processing file:", error);
      setStatus('idle');
    }
  };

  // --- 2. Verification Logic ---
  const verifyDiploma = async (hashToVerify: string) => {
    if (!contract || !account) return;
    
    setStatus('scanning');
    setProgress(0);
    
    try {
      // Get total supply (or nextId) to know how many to loop
      const nextId = await contract.nextId();
      const total = Number(nextId);
      
      let matchFound = false;

      // Loop through all tokens to find a match
      // Note: In a production app with thousands of NFTs, you would use The Graph (Indexer) instead of a loop
      for (let tokenId = 1; tokenId < total; tokenId++) {
        if (matchFound) break;
        
        // Visual progress bar update
        setProgress(Math.floor((tokenId / total) * 100));

        try {
          const owner = await contract.ownerOf(tokenId);
          
          // Optimization: Only check tokens owned by the connected user
          if (owner.toLowerCase() === account.toLowerCase()) {
             const data = await contract.verifyDiploma(tokenId);
             const chainHash = data.pdfHash;
             const isValid = data.valid;

             // Compare the calculated hash with the blockchain hash
             if (chainHash.toLowerCase() === hashToVerify.toLowerCase()) {
                setFoundTokenId(tokenId);
                if (isValid) {
                  setStatus('found');
                } else {
                  setStatus('revoked');
                }
                matchFound = true;
                return; // Exit loop immediately on match
             }
          }
        } catch (e) {
          // Token might not exist or other error, continue
        }
        
        // Small non-blocking delay to allow UI to render updates
        if (tokenId % 5 === 0) await new Promise(r => setTimeout(r, 0));
      }

      if (!matchFound) {
        setStatus('not_found');
      }
    } catch (err) {
      console.error("Verification error:", err);
      setStatus('idle'); 
    }
  };

  // --- 3. Drag & Drop Handlers ---

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      if (files[0].type === "application/pdf") {
        // This triggers the process -> hash -> auto-verify chain
        processFile(files[0]);
      } else {
        alert("Please drop a PDF file.");
      }
    }
  }, []); // Dependency array is empty as processFile is stable or accessible

  // --- 4. Render ---
  return (
    <div className="space-y-6">
      <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wider">Upload Document</h3>
        
        {/* Drag Zone */}
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
            ${isDragging 
              ? 'border-blue-500 bg-blue-50 scale-[1.01]' 
              : 'border-slate-300 hover:border-slate-400 bg-white'
            }
          `}
        >
           <input
             type="file"
             accept="application/pdf"
             onChange={handleFileInputChange}
             className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
           />
           
           <div className="flex flex-col items-center justify-center pointer-events-none">
             {fileName ? (
               <>
                 <FileText className="w-10 h-10 text-blue-600 mb-2" />
                 <p className="text-sm font-medium text-slate-900">{fileName}</p>
                 <p className="text-xs text-slate-500 mt-1">
                    {status === 'scanning' ? 'Scanning...' : 'Click or drag to replace'}
                 </p>
               </>
             ) : (
               <>
                 <Upload className={`w-10 h-10 mb-3 ${isDragging ? 'text-blue-600' : 'text-slate-400'}`} />
                 <p className="text-sm font-medium text-slate-700">
                   {isDragging ? 'Drop PDF here' : 'Click to upload or drag and drop'}
                 </p>
                 <p className="text-xs text-slate-500 mt-1">PDF files only</p>
               </>
             )}
           </div>
        </div>

        {/* Manual Re-scan button (Optional, but good UX) */}
        {uploadedPdfHash && status !== 'scanning' && (
           <div className="mt-4 flex justify-end">
             <button 
               onClick={() => verifyDiploma(uploadedPdfHash)}
               className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-md active:scale-95"
             >
               Re-Scan Document
             </button>
           </div>
        )}
      </div>

      {/* --- Status UI --- */}
      {status === 'scanning' && (
        <div className="p-8 border border-slate-100 rounded-xl bg-white flex flex-col items-center justify-center text-center animate-in fade-in">
           <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
           <h4 className="text-lg font-medium text-slate-800">Verifying Authenticity...</h4>
           <p className="text-slate-500 text-sm mt-1">Checking blockchain records ({progress}%)</p>
           <div className="w-64 h-1.5 bg-slate-100 rounded-full mt-4 overflow-hidden">
              <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%`}}></div>
           </div>
        </div>
      )}

      {status === 'found' && (
        <div className="p-8 border border-green-200 bg-green-50/50 rounded-xl flex flex-col items-center justify-center text-center animate-in zoom-in-95">
           <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
             <CheckCircle className="w-8 h-8 text-green-600" />
           </div>
           <h4 className="text-xl font-bold text-green-900">Verified Authentic</h4>
           <p className="text-green-800 text-sm mt-2 max-w-md">
             The uploaded document matches a valid digital diploma held by your account.
           </p>
           <div className="mt-4 px-4 py-2 bg-white rounded-full border border-green-200 text-xs font-mono text-green-700 shadow-sm">
             Token ID: #{foundTokenId}
           </div>
        </div>
      )}

      {status === 'revoked' && (
        <div className="p-8 border border-red-200 bg-red-50/50 rounded-xl flex flex-col items-center justify-center text-center animate-in zoom-in-95">
           <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
             <ShieldAlert className="w-8 h-8 text-red-600" />
           </div>
           <h4 className="text-xl font-bold text-red-900">Diploma Revoked</h4>
           <p className="text-red-800 text-sm mt-2 max-w-md">
             This document matches a record on the blockchain (Token #{foundTokenId}), but it has been officially revoked by the issuer.
           </p>
        </div>
      )}

      {status === 'not_found' && (
        <div className="p-8 border border-slate-200 bg-slate-50 rounded-xl flex flex-col items-center justify-center text-center animate-in zoom-in-95">
           <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4">
             <XCircle className="w-8 h-8 text-slate-500" />
           </div>
           <h4 className="text-xl font-bold text-slate-700">Verification Failed</h4>
           <p className="text-slate-600 text-sm mt-2 max-w-md">
             No matching digital diploma was found in the connected wallet for this specific file.
           </p>
        </div>
      )}
      
      {status === 'idle' && !uploadedPdfHash && (
        <div className="text-center py-12 text-slate-400">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>Upload a PDF to begin verification</p>
        </div>
      )}
    </div>
  );
};