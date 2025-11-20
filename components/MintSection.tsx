import React, { useState, useCallback } from 'react';
import { Contract } from 'ethers';
import { Upload, FileText, Plus, Loader2, Link as LinkIcon, User } from 'lucide-react';
import { Roles } from '../types';

interface MintSectionProps {
  contract: Contract | null;
  roles: Roles;
  onHashGenerated?: (hash: string) => void;
}

// Updated Nova Metadata Link (Preloaded)
const DEFAULT_NOVA_METADATA = "https://violet-patient-tiger-874.mypinata.cloud/ipfs/bafkreieetfhppak5kdnuljt45hy462yvoghlawzovobtm32m7ifhiqcmtq";

export const MintSection: React.FC<MintSectionProps> = ({ contract, roles, onHashGenerated }) => {
  const [file, setFile] = useState<File | null>(null);
  const [pdfHash, setPdfHash] = useState('');
  const [recipient, setRecipient] = useState('');
  
  // Metadata state initialized with your specific link
  const [tokenURI, setTokenURI] = useState(DEFAULT_NOVA_METADATA);
  
  const [isMinting, setIsMinting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // --- File Processing ---
  const processFile = async (uploadedFile: File) => {
    if (!uploadedFile) return;
    setFile(uploadedFile);
    
    try {
      const arrayBuffer = await uploadedFile.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
      const hex = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      
      const hash = "0x" + hex;
      setPdfHash(hash);
      if (onHashGenerated) onHashGenerated(hash);
    } catch (error) {
      console.error("Error hashing file:", error);
    }
  };

  // --- Event Handlers ---
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
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
        processFile(files[0]);
      } else {
        alert("Please drop a PDF file.");
      }
    }
  }, []);

  // --- Minting Action ---
  const handleMint = async () => {
    if (!contract || !recipient || !pdfHash || !tokenURI) return;
    
    try {
      setIsMinting(true);
      
      // Call Smart Contract: mintDiploma(student, metadataURI, pdfHash)
      // FIXED: Changed from safeMint to mintDiploma to match your Solidity contract
      const tx = await contract.mintDiploma(
        recipient, 
        tokenURI, 
        pdfHash
      );
      
      await tx.wait();
      alert("Diploma Minted Successfully!");
      
      // Reset form (Keep the default metadata link)
      setFile(null);
      setPdfHash('');
      setRecipient('');
      setTokenURI(DEFAULT_NOVA_METADATA); 
    } catch (error) {
      console.error("Mint failed", error);
      alert("Minting failed. Check console for details. Ensure you have updated your ABI JSON.");
    } finally {
      setIsMinting(false);
    }
  };

  if (!roles.isMinter && !roles.isAdmin) {
    return (
      <div className="text-center py-12 bg-red-50 rounded-xl border border-red-100">
         <p className="text-red-600 font-medium">You do not have permission to mint diplomas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      
      {/* 1. Drag & Drop Zone */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs">1</span>
          Upload Diploma PDF
        </h3>
        
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer
            ${isDragging 
              ? 'border-blue-500 bg-blue-50 scale-[1.01]' 
              : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-white'
            }
            ${file ? 'border-green-400 bg-green-50/30' : ''}
          `}
        >
          <input
             type="file"
             accept="application/pdf"
             onChange={handleFileInputChange}
             className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          
          <div className="flex flex-col items-center justify-center pointer-events-none">
             {file ? (
               <>
                 <FileText className="w-12 h-12 text-green-600 mb-2" />
                 <p className="text-sm font-bold text-slate-900">{file.name}</p>
                 <p className="text-xs text-slate-500 mt-1 font-mono">{pdfHash.slice(0, 20)}...</p>
               </>
             ) : (
               <>
                 <Upload className={`w-10 h-10 mb-3 ${isDragging ? 'text-blue-600' : 'text-slate-400'}`} />
                 <p className="text-sm font-medium text-slate-700">
                   {isDragging ? 'Drop PDF here' : 'Drag & Drop PDF or Click to Browse'}
                 </p>
               </>
             )}
          </div>
        </div>
      </div>

      {/* 2. Diploma Details (Recipient + Metadata) */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs">2</span>
          Diploma Details
        </h3>
        
        <div className="space-y-5">
          {/* Recipient Field */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
              <User size={12} /> Recipient Wallet
            </label>
            <input 
              type="text" 
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono text-sm"
            />
          </div>

          {/* Metadata URI Field */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
              <LinkIcon size={12} /> Metadata URI
            </label>
            <div className="relative">
              <input 
                type="text" 
                value={tokenURI}
                onChange={(e) => setTokenURI(e.target.value)}
                placeholder="ipfs://..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono text-sm text-slate-600"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">
              The link to the JSON metadata file.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Action Button */}
      <button
        onClick={handleMint}
        disabled={!file || !recipient || !tokenURI || isMinting}
        className={`
          w-full py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all
          ${!file || !recipient || !tokenURI || isMinting 
            ? 'bg-slate-300 cursor-not-allowed shadow-none' 
            : 'bg-slate-900 hover:bg-slate-800 active:scale-[0.98] hover:shadow-slate-200'
          }
        `}
      >
        {isMinting ? (
          <>
            <Loader2 className="animate-spin w-5 h-5" />
            Minting on Blockchain...
          </>
        ) : (
          <>
            <Plus className="w-5 h-5" />
            Mint Diploma
          </>
        )}
      </button>
    </div>
  );
};