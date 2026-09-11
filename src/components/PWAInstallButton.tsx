import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  onOpenDownloadModal?: () => void;
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ onOpenDownloadModal, className }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={async () => {
          const success = await install();
          if (!success && onOpenDownloadModal) {
            onOpenDownloadModal();
          }
        }}
        className={className || "flex items-center gap-1.5 rounded-md bg-amber-500 hover:bg-amber-400 px-3 py-1.5 text-xs font-bold text-black shadow-sm transition cursor-pointer"}
        title="Download / Install GTA V App"
      >
        <Download className="w-3.5 h-3.5" />
        <span>डाउनलोड / Install</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={className || "flex items-center gap-1.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-3 py-1.5 text-xs font-bold text-amber-300 shadow-sm transition cursor-pointer"}
          title="Install on iOS Home Screen"
        >
          <Download className="w-3.5 h-3.5" />
          <span>डाउनलोड (iOS)</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 select-none">
            <div className="w-full max-w-sm rounded-xl bg-neutral-900 border border-neutral-700 p-6 shadow-2xl text-white">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>📱</span> iPhone / iPad पर डाउनलोड करें
              </h3>
              <div className="mt-3 text-xs text-neutral-300 space-y-2 leading-relaxed">
                <p>1. Safari के नीचे <strong>Share</strong> बटन (बॉक्स और ऊपर तीर ↑) दबाएं।</p>
                <p>2. नीचे स्क्रॉल करके <strong>"Add to Home Screen"</strong> (होम स्क्रीन में जोड़ें) चुनें।</p>
                <p>3. ऊपर <strong>"Add"</strong> पर क्लिक करें। गेम ऐप आपके फोन पर आ जाएगी।</p>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-lg bg-neutral-800 hover:bg-neutral-700 py-2 text-xs font-bold text-white cursor-pointer transition"
              >
                ठीक है (Close)
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback: Open Download modal
  return (
    <button
      onClick={onOpenDownloadModal}
      className={className || "flex items-center gap-1.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-3 py-1.5 text-xs font-bold text-amber-300 shadow-sm transition cursor-pointer"}
      title="Download Game & Options"
    >
      <Download className="w-3.5 h-3.5" />
      <span>डाउनलोड</span>
    </button>
  );
};
