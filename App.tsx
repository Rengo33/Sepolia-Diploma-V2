import React, { useState } from 'react';
import AdminProtected from './components/AdminProtected';
import VerificationPortal from './components/VerificationPortal';

export default function App() {
  const [view, setView] = useState<'verify' | 'admin'>('verify');

  if (view === 'admin') {
    return <AdminProtected onBack={() => setView('verify')} />;
  }

  // Default View (Front Page)
  return <VerificationPortal onAdminEnter={() => setView('admin')} />;
}