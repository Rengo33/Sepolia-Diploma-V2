import React, { useState } from 'react';
import { Contract } from 'ethers';
import { ShieldAlert, Loader2, CheckCircle, AlertTriangle, Search } from 'lucide-react';
import { TxStatus } from '../types';

interface RevokeSectionProps {
  contract: Contract | null;
  roles: { isAdmin: boolean; isRevoker: boolean };
}

export const RevokeSection: React.FC<RevokeSectionProps> = ({ contract, roles }) => {
  const [tokenId, setTokenId] = useState('');
  const [checkStatus, setCheckStatus] = useState<'idle' | 'checking' | 'valid' | 'revoked' | 'not_found'>('idle');
  const [foundData, setFoundData] = useState<any>(null);

  const [txState, setTxState] = useState<TxStatus>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);

  const checkDiploma = async () => {
    if (!contract || !tokenId) return;
    setCheckStatus('checking');
    setFoundData(null);
    setTxState('idle');

    try {
      // verifyDiploma returns: [issuer, holder, metadataURI, pdfHash, valid]
      const data = await contract.verifyDiploma(tokenId);
      setFoundData({
        holder: data.holder,
        valid: data.valid
      });
      setCheckStatus(data.valid ? 'valid' : 'revoked');
    } catch (err) {
      console.error(err);
      setCheckStatus('not_found');
    }
  };

  const revokeDiploma = async () => {
    if (!contract || !tokenId) return;

    try {
      setTxState('pending');
      setTxHash(null);

      const tx = await contract.revokeDiploma(tokenId);
      setTxHash(tx.hash);
      await tx.wait();
      
      setTxState('confirmed');
      setCheckStatus('revoked'); // Update UI state to reflect revocation
    } catch (err) {
      console.error(err);
      setTxState('failed');
    }
  };

  if (!roles.isAdmin && !roles.isRevoker) {
    return (
      <div className="p-8 text-center bg-red-50 border border-red-100 rounded-xl">
        <ShieldAlert className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-red-900">Access Denied</h3>
        <p className="text-red-600 text-sm mt-1">You do not have permission to revoke diplomas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-1 rounded-xl">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Diploma Token ID</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={tokenId}
                onChange={(e) => { setTokenId(e.target.value); setCheckStatus('idle'); setTxState('idle'); }}
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all text-sm font-mono"
                placeholder="e.g. 12"
              />
              <button
                type="button"
                onClick={checkDiploma}
                disabled={!tokenId}
                className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-lg font-medium text-sm hover:bg-slate-200 transition-colors flex items-center gap-2"
              >
                <Search size={16} /> Check
              </button>
            </div>
          </div>

          {/* Status Card */}
          {checkStatus === 'valid' && (
             <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                   <p className="text-sm font-bold text-green-800">Active Diploma Found</p>
                   <p className="text-xs text-green-700 mt-1">Holder: <span className="font-mono">{foundData?.holder}</span></p>
                </div>
             </div>
          )}

          {checkStatus === 'revoked' && (
             <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                   <p className="text-sm font-bold text-red-800">Diploma Already Revoked</p>
                   <p className="text-xs text-red-700 mt-1">This token ID has already been invalidated.</p>
                </div>
             </div>
          )}

          {checkStatus === 'not_found' && (
             <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                   <p className="text-sm font-bold text-slate-600">Not Found</p>
                   <p className="text-xs text-slate-500 mt-1">No diploma found with this Token ID.</p>
                </div>
             </div>
          )}

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={revokeDiploma}
              disabled={txState === 'pending' || checkStatus !== 'valid'}
              className={`w-full py-3 px-4 rounded-xl font-semibold shadow-sm transition-all flex items-center justify-center gap-2
                ${txState === 'pending' || checkStatus !== 'valid'
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-red-600 text-white hover:bg-red-700 hover:shadow-md active:translate-y-0.5'
                }`}
            >
              {txState === 'pending' ? (
                <>
                  <Loader2 className="animate-spin w-4 h-4" /> Revoking...
                </>
              ) : (
                <>
                  <ShieldAlert size={18} /> Revoke Diploma
                </>
              )}
            </button>
            <p className="text-center text-xs text-slate-400 mt-3">
              This action is irreversible. The diploma will be permanently marked as invalid.
            </p>
          </div>

          {/* Transaction Status Feedback */}
          {txState !== 'idle' && (
            <div className={`mt-6 p-4 rounded-xl border flex items-start gap-3 ${
              txState === 'confirmed' ? 'bg-green-50 border-green-200' : 
              txState === 'failed' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="mt-0.5">
                {txState === 'confirmed' && <CheckCircle className="w-5 h-5 text-green-600" />}
                {txState === 'failed' && <AlertTriangle className="w-5 h-5 text-red-600" />}
                {txState === 'pending' && <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />}
              </div>
              <div className="flex-1">
                <h4 className={`text-sm font-semibold ${
                  txState === 'confirmed' ? 'text-green-900' : 
                  txState === 'failed' ? 'text-red-900' : 'text-blue-900'
                }`}>
                  {txState === 'confirmed' ? 'Revocation Successful' : txState === 'failed' ? 'Error' : 'Processing'}
                </h4>
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
    </div>
  );
};