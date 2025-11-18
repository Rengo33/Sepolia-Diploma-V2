import React, { useState, useEffect } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { Upload, CheckCircle, XCircle, Wallet, Loader2, Send, Lock } from 'lucide-react';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../types';
import { WalletModal } from './WalletModal';

interface VerificationPortalProps {
  onAdminEnter: () => void;
}

export default function VerificationPortal({ onAdminEnter }: VerificationPortalProps) {
  // Form Data
  const [formData, setFormData] = useState({ name: '', email: '', address: '' });
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Wallet & Contract
  const [provider, setProvider] = useState<BrowserProvider | undefined>(undefined);
  const [signer, setSigner] = useState<any>(undefined);
  const [account, setAccount] = useState<string | undefined>(undefined);
  const [contract, setContract] = useState<Contract | null>(null);

  // Verification State
  const [uploadedPdfHash, setUploadedPdfHash] = useState('');
  const [fileName, setFileName] = useState('');
  const [verifyMatchId, setVerifyMatchId] = useState<number | null>(null);
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'verifying' | 'success' | 'fail'>('idle');

  // UI Helpers
  const [isWalletModalOpen, setWalletModalOpen] = useState(false);
  const [wallets, setWallets] = useState<any>({});

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const injected = window.ethereum.providers || [window.ethereum];
      setWallets({
        metaMask: injected.find((p: any) => p.isMetaMask),
        coinbase: injected.find((p: any) => p.isCoinbaseWallet),
        fallback: window.ethereum
      });
    }
  }, []);

  // Auto-verify when dependencies are ready
  useEffect(() => {
    if (account && uploadedPdfHash && contract) {
      runVerification(uploadedPdfHash);
    }
  }, [account, uploadedPdfHash, contract]);

  const connectWallet = async (providerObject: any) => {
    try {
      setWalletModalOpen(false);
      const browserProvider = new BrowserProvider(providerObject);
      await providerObject.request({ method: "eth_requestAccounts" });
      const s = await browserProvider.getSigner();
      const addr = await s.getAddress();

      setProvider(browserProvider);
      setSigner(s);
      setAccount(addr);

      const c = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, s);
      setContract(c);

    } catch (err) {
      console.error("Failed to connect", err);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setVerifyStatus('idle');
    setVerifyMatchId(null);

    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hex = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    
    const hash = "0x" + hex;
    setUploadedPdfHash(hash);
  };

  const runVerification = async (hash: string) => {
    if (!contract || !account) return;
    
    setVerifyStatus('verifying');
    try {
      // Note: Using nextId() to scan. In production, use an indexer or event logs for efficiency.
      const nextId = await contract.nextId();
      const total = Number(nextId);
      
      let matchFound = false;

      for (let tokenId = 1; tokenId < total; tokenId++) {
        if (matchFound) break;

        try {
          const owner = await contract.ownerOf(tokenId);
          if (owner.toLowerCase() === account.toLowerCase()) {
            const chainHash = await contract.getPdfHash(tokenId);
            if (chainHash.toLowerCase() === hash.toLowerCase()) {
              setVerifyMatchId(tokenId);
              setVerifyStatus('success');
              matchFound = true;
              return;
            }
          }
        } catch (e) {
          // ignore burned/invalid
        }
        
        if (tokenId % 5 === 0) await new Promise(r => setTimeout(r, 0));
      }

      if (!matchFound) setVerifyStatus('fail');

    } catch (err) {
      console.error(err);
      setVerifyStatus('fail');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  const isFormValid = formData.name && formData.email && formData.address && verifyStatus === 'success';

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 animate-in fade-in">
        <div className="bg-white p-10 rounded-2xl shadow-xl max-w-md w-full text-center border border-green-100">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Application Received</h2>
          <p className="text-slate-600 mb-8">
            Thank you, {formData.name}. Your details and verified diploma have been securely recorded.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            Verify Another Document
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 relative flex flex-col">
      
      {/* Navigation Bar */}
      <nav className="flex justify-between items-center px-6 py-4 bg-white/50 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-100">
         <div className="flex items-center gap-2">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/3/3a/Nova_SBE_Logo.svg" 
              alt="Nova SBE" 
              className="h-10 w-auto"
            />
         </div>
         <button
           onClick={onAdminEnter}
           className="text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5"
         >
           <Lock size={12} /> Admin Portal
         </button>
      </nav>

      <div className="flex-1 py-12 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
          
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
            <div className="bg-slate-900 px-8 py-8 text-white relative overflow-hidden">
              <div className="relative z-10">
                <h1 className="text-2xl font-bold">Diploma Verification</h1>
                <p className="text-slate-300 text-sm mt-1 max-w-lg">Securely verify the authenticity of academic credentials on the Sepolia blockchain.</p>
              </div>
              {/* Decorative circle */}
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
            </div>
            
            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* Personal Details */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Applicant Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
                      <input 
                        type="text" 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                        placeholder="e.g. Jane Doe"
                      />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                      <input 
                        type="email" 
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                        placeholder="jane@example.com"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Residential Address</label>
                      <input 
                        type="text" 
                        value={formData.address}
                        onChange={e => setFormData({...formData, address: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                        placeholder="e.g. 123 Campus Drive, Lisbon"
                      />
                    </div>
                  </div>
                </div>

                {/* Diploma Verification */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Proof of Qualification</h3>
                  
                  <div className="bg-slate-50 rounded-xl p-6 border-2 border-slate-100 border-dashed hover:border-slate-200 transition-colors group">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Upload className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">Upload Diploma PDF</p>
                      <p className="text-xs text-slate-500 mb-4 max-w-xs mx-auto mt-1">Upload your digital diploma file to generate a cryptographic hash for verification.</p>
                      
                      <label className="cursor-pointer relative">
                        <span className="bg-white border border-slate-300 text-slate-700 px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                          {fileName || "Select Document"}
                        </span>
                        <input type="file" className="hidden" accept="application/pdf" onChange={handlePdfUpload} />
                      </label>
                    </div>
                  </div>

                  {uploadedPdfHash && (
                     <div className="text-center animate-in fade-in">
                       <p className="text-[10px] font-mono text-slate-400 bg-slate-50 inline-block px-2 py-1 rounded">Hash: {uploadedPdfHash.slice(0, 12)}...{uploadedPdfHash.slice(-12)}</p>
                     </div>
                  )}

                  {/* Verification Status Area */}
                  <div className="min-h-[60px] flex items-center justify-center py-2">
                    {!account ? (
                      <button
                        type="button"
                        onClick={() => setWalletModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-full font-semibold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 hover:shadow-xl active:scale-95"
                      >
                        <Wallet size={16} /> Connect Wallet to Verify
                      </button>
                    ) : (
                      <>
                        {verifyStatus === 'idle' && <p className="text-sm text-slate-400 italic">Waiting for document upload...</p>}
                        
                        {verifyStatus === 'verifying' && (
                          <div className="flex items-center gap-3 text-brand-600 bg-brand-50 px-4 py-2 rounded-full">
                            <Loader2 size={16} className="animate-spin" />
                            <span className="text-sm font-semibold">Verifying on Blockchain...</span>
                          </div>
                        )}

                        {verifyStatus === 'success' && (
                          <div className="flex items-center gap-3 px-5 py-3 bg-green-50 border border-green-100 rounded-xl text-green-800 animate-in slide-in-from-bottom-2 w-full shadow-sm">
                            <div className="bg-green-100 p-1.5 rounded-full">
                                <CheckCircle size={18} className="text-green-600" />
                            </div>
                            <div className="text-left flex-1">
                              <p className="text-sm font-bold text-green-900">Authenticity Verified</p>
                              <p className="text-xs text-green-700 mt-0.5">Digital signature matches Token #{verifyMatchId}</p>
                            </div>
                          </div>
                        )}

                        {verifyStatus === 'fail' && (
                           <div className="flex items-center gap-3 px-5 py-3 bg-red-50 border border-red-100 rounded-xl text-red-800 animate-in slide-in-from-bottom-2 w-full shadow-sm">
                            <div className="bg-red-100 p-1.5 rounded-full">
                                <XCircle size={18} className="text-red-600" />
                            </div>
                            <div className="text-left flex-1">
                              <p className="text-sm font-bold text-red-900">Verification Failed</p>
                              <p className="text-xs text-red-700 mt-0.5">No matching record found for this document in the connected wallet.</p>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-6 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={!isFormValid}
                    className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm tracking-wide transition-all duration-300
                      ${!isFormValid 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                        : 'bg-brand-600 text-white hover:bg-brand-700 shadow-xl shadow-brand-100 hover:shadow-brand-200 active:translate-y-0.5'
                      }`}
                  >
                    <Send size={18} />
                    SUBMIT APPLICATION
                  </button>
                  {!isFormValid && (
                    <p className="text-center text-[11px] text-slate-400 mt-3 font-medium">
                      Complete all fields and verify document to proceed
                    </p>
                  )}
                </div>

              </form>
            </div>
          </div>
          
          <div className="text-center mt-8 text-slate-400 text-xs">
             © 2025 Nova School of Business and Economics
          </div>
          
        </div>
      </div>

      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        onConnect={connectWallet}
        wallets={wallets}
      />
    </div>
  );
}