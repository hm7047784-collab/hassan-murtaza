import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-neutral-900/90 border border-amber-500/50 px-3.5 py-2 text-xs font-semibold text-amber-300 shadow-xl backdrop-blur-xs select-none">
      <WifiOff className="w-4 h-4 text-amber-400" />
      <span>ऑफलाइन मोड (Offline Mode) — कैश्ड डेटा इस्तेमाल हो रहा है</span>
    </div>
  );
};
