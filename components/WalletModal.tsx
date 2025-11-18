import React from 'react';
import { X } from 'lucide-react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (provider: any) => void;
  wallets: {
    metaMask: any;
    coinbase: any;
    fallback: any;
  };
}

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose, onConnect, wallets }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 transition-all">
      <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-100 relative animate-fade-in-up">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={20} />
        </button>
        
        <h2 className="text-xl font-bold text-center mb-1 text-slate-800">Connect Wallet</h2>
        <p className="text-slate-500 text-center text-sm mb-6">Select your preferred wallet provider</p>

        <div className="space-y-3">
          {wallets.metaMask && (
            <button
              onClick={() => onConnect(wallets.metaMask)}
              className="w-full px-4 py-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="w-5 h-5" />
              MetaMask
            </button>
          )}

          {wallets.coinbase && (
            <button
              onClick={() => onConnect(wallets.coinbase)}
              className="w-full px-4 py-3 border border-blue-100 bg-blue-50/50 hover:bg-blue-50 text-blue-700 font-medium rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              Coinbase Wallet
            </button>
          )}

          {!wallets.metaMask && !wallets.coinbase && wallets.fallback && (
            <button
              onClick={() => onConnect(wallets.fallback)}
              className="w-full px-4 py-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-xl transition-all"
            >
              Browser Default
            </button>
          )}
        </div>
        
        <div className="mt-6 text-center">
          <a href="#" onClick={(e) => { e.preventDefault(); onClose(); }} className="text-xs text-slate-400 hover:text-slate-600">
            Dismiss
          </a>
        </div>
      </div>
    </div>
  );
};