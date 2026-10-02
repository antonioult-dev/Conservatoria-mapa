import React, { useEffect, useState } from 'react';
import { WifiOff, ShieldAlert } from 'lucide-react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-14 left-4 right-4 z-50 max-w-md mx-auto p-2.5 rounded-2xl bg-amber-600/95 backdrop-blur-md text-white text-xs font-semibold shadow-lg flex items-center justify-between animate-in slide-in-from-top-2">
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 text-amber-200 animate-pulse flex-shrink-0" />
        <span>Sem conexão: catálogo e ações online indisponíveis. A Central SOS pode ser aberta.</span>
      </div>
      <a
        href="tel:190"
        className="px-2 py-1 bg-red-700 hover:bg-red-800 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 flex-shrink-0"
      >
        <ShieldAlert className="w-3 h-3" />
        <span>SOS 190</span>
      </a>
    </div>
  );
};
