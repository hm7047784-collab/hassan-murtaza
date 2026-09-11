import React, { useState } from 'react';
import { Download, Smartphone, Monitor, HardDrive, CheckCircle2, Share2, HelpCircle, X, ArrowDownToLine, Code, FileJson } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PlayerState } from '../types';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerState: PlayerState;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({ isOpen, onClose, playerState }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'app' | 'save' | 'source'>('app');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setDownloadSuccess(msg);
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  // Export game save file
  const handleDownloadSave = () => {
    const saveData = {
      game: 'GTA V: Los Santos City',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      player: {
        character: playerState.activeCharacter,
        cash: playerState.cash,
        health: playerState.health,
        armor: playerState.armor,
        selectedWeapon: playerState.selectedWeapon,
        weapons: playerState.weapons,
        wantedStars: playerState.wantedStars,
        position: playerState.position,
      },
      stats: {
        policeDefeated: 12,
        heistsCompleted: 3,
        stuntJumps: 5,
      },
    };

    const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gtav_los_santos_save_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('गेम प्रोग्रेस सेव फाइल (Save File) डाउनलोड हो गई!');
  };

  // Download Desktop / Mobile Offline Web Launcher
  const handleDownloadLauncher = () => {
    const launcherHTML = `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8">
  <title>GTA V: Los Santos City Launcher</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; background: #090d16; color: #fff; font-family: system-ui, -apple-system, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; text-align: center; padding: 20px; }
    .card { background: #151d2e; border: 1px solid #334155; border-radius: 20px; padding: 32px; max-width: 460px; box-shadow: 0 20px 40px rgba(0,0,0,0.6); }
    h1 { color: #facc15; font-size: 28px; margin-bottom: 8px; }
    p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
    .btn { display: inline-block; background: linear-gradient(135deg, #eab308, #ca8a04); color: #000; font-weight: 800; text-decoration: none; padding: 14px 28px; border-radius: 12px; margin-top: 20px; font-size: 16px; transition: transform 0.2s; box-shadow: 0 4px 15px rgba(234, 179, 8, 0.4); }
    .btn:hover { transform: scale(1.05); }
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size: 54px; margin-bottom: 12px;">🎮</div>
    <h1>GTA V: Los Santos City</h1>
    <p>यह लॉन्चर आपको सीधे लाइव 3D गेम में ले जाता है। फुल स्क्रीन मोड में बिना लैग के खेलें।</p>
    <a href="${window.location.href}" class="btn" target="_blank">🚀 Play Game Now</a>
  </div>
</body>
</html>`;

    const blob = new Blob([launcherHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GTA_V_Los_Santos_Launcher.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('गेम लॉन्चर फाइल (HTML Launcher) डाउनलोड हो गई!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-linear-to-r from-neutral-950 via-neutral-900 to-neutral-950 p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-wide flex items-center gap-2">
                डाउनलोड & इंस्टॉल (Download & Install)
              </h2>
              <p className="text-xs text-neutral-400">
                Install as standalone app or download offline files
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/60 p-1.5 gap-1.5 text-xs font-bold">
          <button
            onClick={() => setActiveTab('app')}
            className={`flex-1 py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'app'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>App Install (PWA)</span>
          </button>
          <button
            onClick={() => setActiveTab('save')}
            className={`flex-1 py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'save'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <FileJson className="w-4 h-4" />
            <span>Save Data / Launcher</span>
          </button>
          <button
            onClick={() => setActiveTab('source')}
            className={`flex-1 py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'source'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Export Code (ZIP)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm">
          {downloadSuccess && (
            <div className="bg-emerald-950/80 border border-emerald-500/50 p-3 rounded-xl flex items-center gap-2 text-emerald-300 text-xs font-semibold animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{downloadSuccess}</span>
            </div>
          )}

          {/* TAB 1: PWA APP INSTALL */}
          {activeTab === 'app' && (
            <div className="space-y-4">
              <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <span className="font-bold text-white text-base">GTA V: Los Santos App</span>
                    {isInstalled ? (
                      <span className="text-[11px] bg-emerald-950 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                        Installed
                      </span>
                    ) : (
                      <span className="text-[11px] bg-amber-950 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-semibold">
                        Ready to Install
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400">
                    अपने फोन या कंप्यूटर की होम स्क्रीन पर सीधे इंस्टॉल करें। फुल-स्क्रीन, सुपर फास्ट लोडिंग, बिना ब्राउजर बार के!
                  </p>
                </div>

                {isInstalled ? (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-600/40 px-3.5 py-2 rounded-xl">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>इंस्टॉल हो चुका है</span>
                  </div>
                ) : isInstallable ? (
                  <button
                    onClick={async () => {
                      const success = await install();
                      if (success) showToast('गेम ऐप सफलतापूर्वक इंस्टॉल हो गई!');
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition transform active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>ऐप इंस्टॉल करें (Install Now)</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      // Trigger prompt or show guide
                      showToast('ऊपर ब्राउज़र मेन्यू (3 डॉट्स ⋮) पर जाकर "Install App" या "Add to Home Screen" चुनें');
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs border border-neutral-700 flex items-center justify-center gap-2 cursor-pointer transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>इंस्टॉल गाइड (Install Guide)</span>
                  </button>
                )}
              </div>

              {/* Step-by-step device guides */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Android / Chrome Guide */}
                <div className="bg-neutral-950/80 p-3.5 rounded-xl border border-neutral-800 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sky-400">
                    <Smartphone className="w-4 h-4" />
                    <span>Android / Chrome में इंस्टॉल:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-neutral-300 text-[11px] leading-relaxed">
                    <li>ब्राउज़र के ऊपर दाईं ओर <strong>3 डॉट्स (⋮)</strong> दबाएं।</li>
                    <li><strong>"Install app"</strong> या <strong>"Add to Home screen"</strong> पर टैप करें।</li>
                    <li>पुष्टि करने पर गेम का आइकन आपके फोन के होम स्क्रीन पर आ जाएगा।</li>
                  </ol>
                </div>

                {/* iPhone / iOS Guide */}
                <div className="bg-neutral-950/80 p-3.5 rounded-xl border border-neutral-800 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-400">
                    <Share2 className="w-4 h-4" />
                    <span>iPhone / Safari में इंस्टॉल:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-neutral-300 text-[11px] leading-relaxed">
                    <li>नीचे Safari मेन्यू में <strong>Share</strong> बटन (बॉक्स और तीर ↑) दबाएं।</li>
                    <li>नीचे स्क्रॉल करके <strong>"Add to Home Screen"</strong> (होम स्क्रीन में जोड़ें) चुनें।</li>
                    <li>ऊपर <strong>"Add"</strong> पर टैप करें।</li>
                  </ol>
                </div>

                {/* PC / Laptop Guide */}
                <div className="bg-neutral-950/80 p-3.5 rounded-xl border border-neutral-800 space-y-2 sm:col-span-2">
                  <div className="flex items-center gap-2 font-bold text-amber-400">
                    <Monitor className="w-4 h-4" />
                    <span>Windows PC / Mac (Chrome या Edge):</span>
                  </div>
                  <p className="text-neutral-300 text-[11px] leading-relaxed">
                    ब्राउज़र के एड्रेस बार (URL बार) में दाईं ओर <strong>कंप्यूटर/इंस्टॉल आइकन (⊕)</strong> पर क्लिक करें और <strong>"Install GTA V"</strong> चुनें। यह आपके डेस्कटॉप पर एक सेपरेट ऐप विंडो में खुल जाएगा।
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SAVE DATA & LAUNCHER */}
          {activeTab === 'save' && (
            <div className="space-y-4">
              <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                      <FileJson className="w-4 h-4 text-amber-400" />
                      <span>Save Game Progress (.JSON)</span>
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1">
                      अपने कैश (${playerState.cash.toLocaleString()}), हथियार, स्टार्स और प्रोग्रेस को अपने डिवाइस पर सेव करके बैकअप रखें।
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadSave}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer shrink-0 transition"
                  >
                    <ArrowDownToLine className="w-4 h-4" />
                    <span>सेव डाउनलोड करें</span>
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs bg-neutral-900/90 p-2.5 rounded-lg border border-neutral-800">
                  <div>
                    <span className="text-neutral-500 block text-[10px]">CURRENT CASH</span>
                    <span className="font-mono font-bold text-emerald-400">${playerState.cash.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px]">WANTED LEVEL</span>
                    <span className="font-mono font-bold text-amber-400">{playerState.wantedStars} ★</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px]">WEAPONS</span>
                    <span className="font-mono font-bold text-sky-400">{Object.keys(playerState.weapons).length} Types</span>
                  </div>
                </div>
              </div>

              {/* Offline Launcher Shortcut */}
              <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                    <HardDrive className="w-4 h-4 text-sky-400" />
                    <span>Desktop / Mobile Web Launcher (.HTML)</span>
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    एक हल्का HTML शॉर्टकट डाउनलोड करें जिसे आप अपने फोन या PC पर सेव करके कभी भी 1-क्लिक में गेम लॉन्च कर सकते हैं।
                  </p>
                </div>
                <button
                  onClick={handleDownloadLauncher}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer shrink-0 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>लॉन्चर फाइल लें</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: SOURCE CODE ZIP EXPORT */}
          {activeTab === 'source' && (
            <div className="space-y-4">
              <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-neutral-800 text-emerald-400">
                    <Code className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">पूरा प्रोजेक्ट कोड (ZIP / GitHub) डाउनलोड करें</h3>
                    <p className="text-xs text-neutral-400">Run completely offline on your own machine</p>
                  </div>
                </div>

                <p className="text-xs text-neutral-300 leading-relaxed">
                  आप इस पूरे 3D GTA V गेम के सोर्स कोड को एक सिंगल ZIP फाइल के रूप में डाउनलोड कर सकते हैं या GitHub पर पुश कर सकते हैं:
                </p>

                <div className="bg-neutral-900 p-3.5 rounded-xl border border-neutral-800 space-y-2 text-xs">
                  <div className="font-bold text-amber-400">ZIP डाउनलोड करने के स्टेप्स:</div>
                  <ol className="list-decimal list-inside space-y-1.5 text-neutral-300 text-[11px] leading-relaxed">
                    <li>AI Studio की ऊपर दाईं ओर <strong>Settings (⚙️)</strong> या मेन्यू पर क्लिक करें।</li>
                    <li><strong>"Export to ZIP"</strong> या <strong>"Export to GitHub"</strong> बटन पर क्लिक करें।</li>
                    <li>डाउनलोड की गई ZIP फाइल को अनजिप करें और टर्मिनल में चलाएं:
                      <div className="mt-1 bg-black/80 px-3 py-1.5 rounded font-mono text-[11px] text-emerald-400 border border-neutral-800">
                        npm install &amp;&amp; npm run dev
                      </div>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-neutral-950 p-3.5 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>PWA &amp; Offline Ready &middot; Instant Install</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-bold cursor-pointer transition"
          >
            बंद करें (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
