import React, { useState } from 'react';
import { Contract } from 'ethers';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { DEFAULT_METADATA, TxStatus } from '../types';

interface MintSectionProps {
  contract: Contract | null;
  roles: { isAdmin: boolean; isMinter: boolean };
  onHashGenerated: (hash: string) => void;
}

export const MintSection: React.FC<MintSectionProps> = ({ contract, roles, onHashGenerated }) => {
  const [recipient, setRecipient] = useState('');
  const [metadataURI, setMetadataURI] = useState(DEFAULT_METADATA);
  const [mintPdfHash, setMintPdfHash] = useState('');
  const [fileName, setFileName] = useState('');
  
  const [txState, setTxState] = useState<TxStatus>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFileName(file.name);
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hex = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    
    const hash = "0x" + hex;
    setMintPdfHash(hash);
    onHashGenerated(hash);
  };

  const mintDiploma = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract) return;
    if (!recipient || !mintPdfHash) return;

    try {
      setTxState('pending');
      setTxHash(null);

      const tx = await contract.mintDiploma(recipient, metadataURI, mintPdfHash);
      setTxHash(tx.hash);
      await tx.wait();
      
      setTxState('confirmed');
      // Reset form slightly
      setRecipient('');
      setFileName('');
      setMintPdfHash('');
    } catch (err) {
      console.error(err);
      setTxState('failed');
    }
  };

  if (!roles.isAdmin && !roles.isMinter) {
    return (
      <div className="p-8 text-center bg-red-50 border border-red-100 rounded-xl">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-red-900">Access Denied</h3>
        <p className="text-red-600 text-sm mt-1">You do not have permission to mint diplomas on this contract.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-1 rounded-xl">
        <form onSubmit={mintDiploma} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Recipient Address</label>
            <input
              type="text"
              required
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all text-sm font-mono"
              placeholder="0x..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Metadata URI (IPFS)</label>
            <input
              type="text"
              required
              value={metadataURI}
              onChange={(e) => setMetadataURI(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all text-sm text-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Diploma PDF</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-200 border-dashed rounded-xl hover:bg-slate-50 transition-colors relative">
              <div className="space-y-1 text-center">
                {!fileName ? (
                  <>
                    <Upload className="mx-auto h-8 w-8 text-slate-400" />
                    <div className="flex text-sm text-slate-600 justify-center">
                      <label className="relative cursor-pointer rounded-md font-medium text-brand-600 hover:text-brand-500 focus-within:outline-none">
                        <span>Upload a file</span>
                        <input type="file" className="sr-only" accept="application/pdf" onChange={handlePdfUpload} />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-slate-500">PDF up to 10MB</p>
                  </>
                ) : (
                  <div className="flex items-center gap-3 bg-green-50 px-4 py-2 rounded-lg border border-green-100">
                    <FileText className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">{fileName}</span>
                    <button 
                      type="button"
                      onClick={() => { setFileName(''); setMintPdfHash(''); }}
                      className="ml-2 text-xs text-green-600 hover:underline"
                    >Change</button>
                  </div>
                )}
              </div>
            </div>
            {mintPdfHash && (
               <p className="mt-2 text-[10px] font-mono text-slate-400 break-all">SHA256: {mintPdfHash}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={txState === 'pending' || !recipient || !mintPdfHash}
            className={`w-full py-3 px-4 rounded-xl font-semibold shadow-sm transition-all
              ${txState === 'pending' || !recipient || !mintPdfHash 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-md active:translate-y-0.5'
              }`}
          >
            {txState === 'pending' ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin w-4 h-4" /> Processing...
              </span>
            ) : 'Mint Diploma'}
          </button>
        </form>

        {/* Transaction Status Feedback */}
        {txState !== 'idle' && (
          <div className={`mt-6 p-4 rounded-xl border flex items-start gap-3 ${
            txState === 'confirmed' ? 'bg-green-50 border-green-200' : 
            txState === 'failed' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="mt-0.5">
              {txState === 'confirmed' && <CheckCircle className="w-5 h-5 text-green-600" />}
              {txState === 'failed' && <AlertCircle className="w-5 h-5 text-red-600" />}
              {txState === 'pending' && <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />}
            </div>
            <div className="flex-1">
              <h4 className={`text-sm font-semibold ${
                txState === 'confirmed' ? 'text-green-900' : 
                txState === 'failed' ? 'text-red-900' : 'text-blue-900'
              }`}>
                {txState === 'confirmed' ? 'Success' : txState === 'failed' ? 'Error' : 'Processing'}
              </h4>
              <p className={`text-xs mt-1 ${
                txState === 'confirmed' ? 'text-green-700' : 
                txState === 'failed' ? 'text-red-700' : 'text-blue-700'
              }`}>
                {txState === 'confirmed' ? 'The diploma has been successfully minted.' : 
                 txState === 'failed' ? 'Transaction rejected or failed.' : 'Please confirm the transaction in your wallet.'}
              </p>
              {txHash && (
                <a 
                  href={`https://sepolia.etherscan.io/tx/${txHash}`}
                  target="_blank" 
                  rel="noreferrer"
                  className="text-xs underline mt-2 inline-block text-slate-500 hover:text-slate-800"
                >
                  View on Etherscan
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};