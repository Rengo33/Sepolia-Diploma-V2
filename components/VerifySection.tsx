import React, { useState } from 'react';
import { Contract } from 'ethers';
import { Upload, Search, CheckCircle, XCircle, Loader2, ShieldAlert } from 'lucide-react';

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

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    // Reset states
    setStatus('idle');
    setFoundTokenId(null);
    
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hex = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    
    const hash = "0x" + hex;
    setUploadedPdfHash(hash);
    
    if (contract && account) {
      verifyDiploma(hash);
    }
  };

  const verifyDiploma = async (hash: string) => {
    if (!contract || !account) return;
    
    setStatus('scanning');
    setProgress(0);
    
    try {
      const nextId = await contract.nextId();
      const total = Number(nextId);
      
      let matchFound = false;

      // Optimization: In production, this loop should be handled by an Indexer (The Graph)
      // For this demo, we scan with a progress update
      for (let tokenId = 1; tokenId < total; tokenId++) {
        if (matchFound) break;
        
        // Update progress for UI feedback
        setProgress(Math.floor((tokenId / total) * 100));

        try {
          const owner = await contract.ownerOf(tokenId);
          if (owner.toLowerCase() === account.toLowerCase()) {
             // Check specific diploma data
             // verifyDiploma returns: [issuer, holder, metadataURI, pdfHash, valid]
             // If verifyDiploma is not available on ABI, this will fail, but we added it.
             const data = await contract.verifyDiploma(tokenId);
             const chainHash = data.pdfHash;
             const isValid = data.valid;

             if (chainHash.toLowerCase() === hash.toLowerCase()) {
                setFoundTokenId(tokenId);
                if (isValid) {
                  setStatus('found');
                } else {
                  setStatus('revoked');
                }
                matchFound = true;
                return; // Exit early
             }
          }
        } catch (e) {
          // Token might be burned or invalid, skip
        }
        
        // Small delay to let UI breathe if list is huge
        if (tokenId % 5 === 0) await new Promise(r => setTimeout(r, 0));
      }

      if (!matchFound) {
        setStatus('not_found');
      }
    } catch (err) {
      console.error(err);
      setStatus('idle'); // Reset on error
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wider">Upload Document</h3>
        
        <div className="flex items-center gap-4">
           <div className="flex-1 relative">
              <input
                type="file"
                accept="application/pdf"
                onChange={handlePdfUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="bg-white border border-slate-200 text-slate-500 rounded-lg px-4 py-3 text-sm flex items-center justify-between hover:border-slate-300 transition-colors">
                <span>{fileName || "Select a PDF file..."}</span>
                <Upload size={16} />
              </div>
           </div>
           
           {uploadedPdfHash && status !== 'scanning' && (
             <button 
               onClick={() => verifyDiploma(uploadedPdfHash)}
               className="bg-slate-900 text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
             >
               Re-Scan
             </button>
           )}
        </div>
      </div>

      {/* Status Display */}
      {status === 'scanning' && (
        <div className="p-8 border border-slate-100 rounded-xl bg-white flex flex-col items-center justify-center text-center animate-in fade-in">
           <Loader2 className="w-10 h-10 text-brand-600 animate-spin mb-4" />
           <h4 className="text-lg font-medium text-slate-800">Verifying Authenticity...</h4>
           <p className="text-slate-500 text-sm mt-1">Checking blockchain records ({progress}%)</p>
           <div className="w-64 h-1.5 bg-slate-100 rounded-full mt-4 overflow-hidden">
              <div className="h-full bg-brand-500 transition-all duration-300" style={{ width: `${progress}%`}}></div>
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