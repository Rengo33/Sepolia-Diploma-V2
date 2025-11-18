
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
              <svg className="w-6 h-6" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M31.297 15.4685L27.6228 10.1601L26.5714 2.17145L20.0714 7.21144L16 0L11.9286 7.21144L5.42858 2.17145L4.37715 10.1601L0.702881 15.4685L5.46289 24.5314L16 32L26.5372 24.5314L31.297 15.4685ZM9.57145 18.2857C8.54289 18.2857 7.71432 17.4571 7.71432 16.4286C7.71432 15.4 8.54289 14.5714 9.57145 14.5714C10.6 14.5714 11.4286 15.4 11.4286 16.4286C11.4286 17.4571 10.6 18.2857 9.57145 18.2857ZM22.4286 18.2857C21.4 18.2857 20.5715 17.4571 20.5715 16.4286C20.5715 15.4 21.4 14.5714 22.4286 14.5714C23.4572 14.5714 24.2858 15.4 24.2858 16.4286C24.2858 17.4571 23.4572 18.2857 22.4286 18.2857Z" fill="#F6851B"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M26.5372 24.5314L28.3429 15.8286L31.2972 15.4686L26.5372 24.5314Z" fill="#E2761B"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M5.46289 24.5314L3.65718 15.8286L0.702881 15.4686L5.46289 24.5314Z" fill="#E2761B"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M9.61145 24.8629L11.5372 22.2457L10.7143 19.5886L5.46289 24.5314L9.61145 24.8629Z" fill="#D7C1B3"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M22.3886 24.8629L26.5372 24.5314L21.2857 19.5886L20.4629 22.2457L22.3886 24.8629Z" fill="#D7C1B3"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M12.3314 26.6514L16 29.0171L19.6686 26.6514L20.1943 24.2057H11.8057L12.3314 26.6514Z" fill="#233447"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M11.8057 24.2057H20.1943L22.3886 24.8629L16 32L9.61145 24.8629L11.8057 24.2057Z" fill="#CD6116"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M10.7143 19.5886L11.5372 22.2457L9.61145 24.8629L9.08573 18.2057L10.7143 19.5886Z" fill="#E4751F"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M21.2857 19.5886L22.9143 18.2057L22.3886 24.8629L20.4629 22.2457L21.2857 19.5886Z" fill="#E4751F"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M11.5372 22.2457L11.8057 24.2057L9.61145 24.8629L11.5372 22.2457Z" fill="#E4751F"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M20.4629 22.2457L20.1943 24.2057L22.3886 24.8629L20.4629 22.2457Z" fill="#E4751F"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M26.5372 24.5314L22.3886 24.8629L22.9143 18.2058L28.3429 15.8286L26.5372 24.5314Z" fill="#F6851B"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M5.46289 24.5314L3.65718 15.8286L9.08575 18.2058L9.61146 24.8629L5.46289 24.5314Z" fill="#F6851B"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M21.2857 19.5886L22.0914 16.9829L22.9143 18.2057L21.2857 19.5886Z" fill="#C0AD9E"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M10.7143 19.5886L9.08574 18.2057L9.90859 16.9829L10.7143 19.5886Z" fill="#C0AD9E"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M22.0914 16.9829L20.4629 13.8171L22.88 12.0571L24.2629 16.08L22.0914 16.9829Z" fill="#161616"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M9.90859 16.9829L7.73717 16.08L9.12002 12.0571L11.5372 13.8171L9.90859 16.9829Z" fill="#161616"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M24.2629 16.08L28.3429 15.8286L22.9143 18.2057L22.0914 16.9829L24.2629 16.08Z" fill="#763D16"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M7.73715 16.08L9.90858 16.9829L9.08572 18.2057L3.65715 15.8286L7.73715 16.08Z" fill="#763D16"/>
              </svg>
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
