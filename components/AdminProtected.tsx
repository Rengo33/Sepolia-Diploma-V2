import React, { useState, useEffect } from 'react';
import { BrowserProvider, Contract, ZeroHash } from 'ethers';
import { Wallet, ShieldAlert, Loader2, ArrowLeft } from 'lucide-react';
import SepoliaDiplomaDapp from './SepoliaDiplomaDapp';
import { WalletModal } from './WalletModal';
import { CONTRACT_ADDRESS, CONTRACT_ABI, Roles } from '../types';

interface AdminProtectedProps {
  onBack: () => void;
}

export default function AdminProtected({ onBack }: AdminProtectedProps) {
  const [provider, setProvider] = useState<BrowserProvider | undefined>(undefined);
  const [signer, setSigner] = useState<any>(undefined);
  const [account, setAccount] = useState<string | undefined>(undefined);
  const [roles, setRoles] = useState<Roles>({ isAdmin: false, isMinter: false, isRevoker: false });
  
  const [status, setStatus] = useState<'idle' | 'connecting' | 'checking' | 'authorized' | 'denied' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [isWalletModalOpen, setWalletModalOpen] = useState(false);
  const [wallets, setWallets] = useState<any>({});

  // Detect wallets
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

  const connectWallet = async (providerObject: any) => {
    try {
      setWalletModalOpen(false);
      setStatus('connecting');

      const browserProvider = new BrowserProvider(providerObject);
      await providerObject.request({ method: "eth_requestAccounts" });
      const s = await browserProvider.getSigner();
      const addr = await s.getAddress();
      const network = await browserProvider.getNetwork();

      // Sepolia check (Chain ID 11155111)
      if (Number(network.chainId) !== 11155111) {
        setStatus('error');
        setErrorMsg('Incorrect network. Please switch to Sepolia Testnet.');
        return;
      }

      setProvider(browserProvider);
      setSigner(s);
      setAccount(addr);

      checkRoles(s, addr);
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.message || 'Failed to connect wallet.');
    }
  };

  const checkRoles = async (signerObj: any, addr: string) => {
    setStatus('checking');
    try {
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerObj);
      
      // Check if contract exists
      const code = await signerObj.provider.getCode(CONTRACT_ADDRESS);
      if (code === '0x') {
        setStatus('error');
        setErrorMsg('Contract not found on this network.');
        return;
      }

      // Parallel role checks
      // Note: In a real scenario, handle rejections gracefully. 
      // Here we assume the contract calls will succeed if connected to Sepolia.
      const [isMinter, isRevoker, isAdmin] = await Promise.all([
        contract.hasMinterRole(addr).catch(() => false),
        contract.hasRevokerRole(addr).catch(() => false),
        contract.hasRole(ZeroHash, addr).catch(() => false),
      ]);

      const newRoles = { isMinter, isRevoker, isAdmin };
      setRoles(newRoles);

      if (isMinter || isRevoker || isAdmin) {
        setStatus('authorized');
      } else {
        setStatus('denied');
      }

    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMsg('Failed to verify permissions on-chain.');
    }
  };

  // --- Render States ---

  if (status === 'connecting' || status === 'checking') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-brand-600 animate-spin mb-4" />
        <h2 className="text-lg font-medium text-slate-800">
          {status === 'connecting' ? 'Connecting Wallet...' : 'Verifying Permissions...'}
        </h2>
      </div>
    );
  }

  if (status === 'authorized') {
    return (
      <SepoliaDiplomaDapp
        provider={provider}
        signer={signer}
        account={account}
        roles={roles}
        contractAddress={CONTRACT_ADDRESS}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center relative">
        <button 
          onClick={onBack}
          className="absolute top-6 left-6 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
          {status === 'denied' || status === 'error' ? (
            <ShieldAlert className="w-8 h-8 text-red-500" />
          ) : (
            <Wallet className="w-8 h-8 text-slate-700" />
          )}
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">Admin Portal</h1>
        
        {status === 'idle' && (
          <p className="text-slate-500 mb-8">
            Restricted access for university administrators. Please connect an authorized wallet.
          </p>
        )}

        {status === 'denied' && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-8">
            <p className="text-red-800 font-medium text-sm">Permission Denied</p>
            <p className="text-red-600 text-xs mt-1">
              The wallet {account?.slice(0,6)}...{account?.slice(-4)} does not have Admin, Minter, or Revoker roles.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-8">
            <p className="text-red-800 font-medium text-sm">Connection Error</p>
            <p className="text-red-600 text-xs mt-1">{errorMsg}</p>
          </div>
        )}

        <button
          onClick={() => setWalletModalOpen(true)}
          className="w-full bg-slate-900 text-white py-3 px-4 rounded-xl font-medium hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95 flex items-center justify-center gap-2"
        >
          {status === 'idle' ? 'Connect Wallet' : 'Try Different Wallet'}
        </button>
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