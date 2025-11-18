import React, { useEffect, useState } from 'react';
import { BrowserProvider, Contract, JsonRpcSigner } from 'ethers';
import { Wallet, Copy, LogOut, ExternalLink, ChevronDown, LayoutDashboard } from 'lucide-react';

import { AppProps, Roles, CONTRACT_ABI } from '../types';
import { WalletModal } from './WalletModal';
import { MintSection } from './MintSection';
import { VerifySection } from './VerifySection';

export default function SepoliaDiplomaDapp({ 
  provider: initialProvider, 
  signer: initialSigner, 
  account: initialAccount, 
  roles: initialRoles, 
  contractAddress 
}: AppProps) {

  // --- State Management ---
  const [provider, setProvider] = useState<BrowserProvider | undefined>(initialProvider);
  const [signer, setSigner] = useState<JsonRpcSigner | undefined>(initialSigner);
  const [account, setAccount] = useState<string | undefined>(initialAccount);
  const [roles, setRoles] = useState<Roles>(initialRoles || { isAdmin: false, isMinter: false, isRevoker: false });
  
  const [contract, setContract] = useState<Contract | null>(null);
  
  const [isWalletModalOpen, setWalletModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'mint' | 'verify'>('verify');
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [wallets, setWallets] = useState<any>({});

  // Sync state with props if they change (e.g. from AdminProtected wrapper)
  useEffect(() => {
    setProvider(initialProvider);
    setSigner(initialSigner);
    setAccount(initialAccount);
    if (initialRoles) setRoles(initialRoles);
  }, [initialProvider, initialSigner, initialAccount, initialRoles]);

  // --- Wallet Detection ---
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

  // --- Contract Initialization ---
  useEffect(() => {
    if (!signer || !contractAddress) return;
    try {
        const c = new Contract(contractAddress, CONTRACT_ABI, signer);
        setContract(c);
    } catch (e) {
        console.error("Contract init failed", e);
    }
  }, [signer, contractAddress]);

  // --- Actions ---
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
      
      // If standalone usage (not via AdminProtected), we can't easily fetch roles here 
      // without duplicating logic, so we assume defaults or you could add check logic here.
      // For now, we rely on the Admin wrapper to provide correct roles.

    } catch (err) {
      console.error("Connection failed", err);
    }
  };

  const copyAddress = async () => {
    if (account) {
      await navigator.clipboard.writeText(account);
      setMenuOpen(false);
    }
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-slate-800 to-black rounded-lg flex items-center justify-center text-white font-bold text-lg">
              N
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-800 hidden sm:block">NOVA Portal</span>
            <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-bold text-slate-500 uppercase tracking-wide ml-2">Admin View</span>
          </div>

          <div className="relative">
            {!account ? (
              <button 
                onClick={() => setWalletModalOpen(true)}
                className="bg-slate-900 text-white px-5 py-2 rounded-full font-medium text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95"
              >
                Connect Wallet
              </button>
            ) : (
              <div className="relative">
                <button 
                  onClick={() => setMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-full hover:bg-slate-50 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-sm font-mono text-slate-600">{account.slice(0, 6)}...{account.slice(-4)}</span>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 border-b border-slate-50">
                      <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider mb-2">Current Roles</p>
                      <div className="flex flex-wrap gap-2">
                        {roles.isAdmin && <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded border border-slate-200">ADMIN</span>}
                        {roles.isMinter && <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold rounded border border-green-200">MINTER</span>}
                        {roles.isRevoker && <span className="px-2 py-0.5 bg-red-50 text-red-700 text-[10px] font-bold rounded border border-red-200">REVOKER</span>}
                      </div>
                    </div>
                    <div className="py-1">
                      <button onClick={copyAddress} className="w-full px-4 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                        <Copy size={14} /> Copy Address
                      </button>
                      <a 
                        href={`https://sepolia.etherscan.io/address/${account}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="w-full px-4 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <ExternalLink size={14} /> View on Etherscan
                      </a>
                      <button onClick={() => window.location.reload()} className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                        <LogOut size={14} /> Disconnect
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-10 sm:px-6">
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
             <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard</h1>
             <p className="text-slate-500 mt-2">Manage diploma issuance and verification.</p>
          </div>
          
          {/* Quick Stats or similar could go here */}
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-100">
            <button
              onClick={() => setActiveTab('verify')}
              className={`flex-1 py-4 text-sm font-semibold transition-colors relative ${
                activeTab === 'verify' ? 'text-slate-900 bg-white' : 'text-slate-400 bg-slate-50 hover:text-slate-600'
              }`}
            >
              Verify Document
              {activeTab === 'verify' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900"></div>}
            </button>
            {(roles.isAdmin || roles.isMinter) && (
              <button
                onClick={() => setActiveTab('mint')}
                className={`flex-1 py-4 text-sm font-semibold transition-colors relative ${
                  activeTab === 'mint' ? 'text-slate-900 bg-white' : 'text-slate-400 bg-slate-50 hover:text-slate-600'
                }`}
              >
                Mint Diploma
                {activeTab === 'mint' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900"></div>}
              </button>
            )}
          </div>

          {/* Content Area */}
          <div className="p-6 sm:p-8">
            {!account ? (
              <div className="text-center py-12">
                <Wallet className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900">Wallet Not Connected</h3>
                <p className="text-slate-500 text-sm mb-6">Please connect your wallet to access the portal.</p>
                <button 
                  onClick={() => setWalletModalOpen(true)}
                  className="bg-slate-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                >
                  Connect Now
                </button>
              </div>
            ) : (
              <>
                {activeTab === 'verify' && <VerifySection contract={contract} account={account} />}
                {activeTab === 'mint' && <MintSection contract={contract} roles={roles} onHashGenerated={() => {}} />}
              </>
            )}
          </div>
        </div>
      </main>

      <footer className="py-8 text-center border-t border-slate-200 bg-white text-slate-400 text-sm">
        <p>&copy; 2025 Nova School of Business and Economics. All rights reserved.</p>
      </footer>

      <WalletModal 
        isOpen={isWalletModalOpen} 
        onClose={() => setWalletModalOpen(false)} 
        onConnect={connectWallet}
        wallets={wallets}
      />
      
      {/* Overlay for mobile menu */}
      {isMenuOpen && <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setMenuOpen(false)}></div>}
    </div>
  );
}