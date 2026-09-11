import React, { useState } from 'react';
import { Mission } from '../types';
import { Phone as PhoneIcon, Users, Briefcase, Zap, Camera, ShieldCheck, Car, HelpCircle, X, ChevronLeft, Download } from 'lucide-react';

interface PhoneProps {
  isOpen: boolean;
  money: number;
  wantedStars: number;
  onClose: () => void;
  onClearWanted: () => void;
  onSpawnSupercar: () => void;
  onSpawnHelicopter?: () => void;
  onSpawnTank?: () => void;
  onMaxWanted: () => void;
  onGiveWeapons: () => void;
  onStartMission: (mission: Mission) => void;
  onOpenCustoms: () => void;
  onOpenDownload?: () => void;
}

const AVAILABLE_MISSIONS: Mission[] = [
  {
    id: 'lsia_flight',
    title: 'LSIA Aerial Surveillance',
    client: 'Trevor Philips',
    description: 'Pilot the Buzzard attack helicopter over the Los Santos International Airport runway and buzz the control tower!',
    reward: 55000,
    targetPos: { x: -80, z: -260 },
    targetType: 'reach',
    targetRadius: 15.0,
    completed: false,
    wantedStarsBonus: 1,
  },
  {
    id: 'military_infiltration',
    title: 'Fort Zancudo Tank Extraction',
    client: 'Ron Jakowski',
    description: 'Infiltrate the restricted Fort Zancudo military perimeter, commandeer the Rhino tank, and breach the SAM perimeter!',
    reward: 85000,
    targetPos: { x: 230, z: -110 },
    targetType: 'reach',
    targetRadius: 12.0,
    completed: false,
    wantedStarsBonus: 4,
  },
  {
    id: 'jewel_heist',
    title: 'The Vangelico Jewel Heist',
    client: 'Lester Crest',
    description: 'Intercept the high-value diamond shipment at the downtown boulevard and escape before police lockdown!',
    reward: 45000,
    targetPos: { x: 25, z: 25 },
    targetType: 'collect',
    targetRadius: 4.5,
    completed: false,
    wantedStarsBonus: 2,
  },
  {
    id: 'repo_king',
    title: 'Repo King: Zentorno Supercar',
    client: 'Simeon Yetarian',
    description: 'Retrieve the customized orange Pegassi supercar from the Union Depository plaza and return it unscratched.',
    reward: 22000,
    targetPos: { x: -45, z: 55 },
    targetType: 'collect',
    targetRadius: 4.0,
    completed: false,
  },
  {
    id: 'bank_ambush',
    title: 'Bank Armored Convoy Ambush',
    client: 'Trevor Philips Enterprises',
    description: 'Ambush the armored cash transit van outside Maze Bank. Heavy security expected.',
    reward: 65000,
    targetPos: { x: 75, z: -25 },
    targetType: 'collect',
    targetRadius: 5.0,
    completed: false,
    wantedStarsBonus: 3,
  },
  {
    id: 'vinewood_stunt',
    title: 'Vinewood Stunt Challenge',
    client: 'Dom Beasley',
    description: 'Hit the mega stunt ramp in Los Santos at over 80 mph and clear the alleyway rooftop!',
    reward: 15000,
    targetPos: { x: 25, z: 50 },
    targetType: 'stunt',
    targetRadius: 6.0,
    completed: false,
  },
];

export const Phone: React.FC<PhoneProps> = ({
  isOpen,
  money,
  wantedStars,
  onClose,
  onClearWanted,
  onSpawnSupercar,
  onSpawnHelicopter,
  onSpawnTank,
  onMaxWanted,
  onGiveWeapons,
  onStartMission,
  onOpenCustoms,
  onOpenDownload,
}) => {
  const [activeApp, setActiveApp] = useState<'home' | 'contacts' | 'missions' | 'cheats' | 'camera'>('home');
  const [cheatMessage, setCheatMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showCheatFeedback = (msg: string) => {
    setCheatMessage(msg);
    setTimeout(() => setCheatMessage(null), 2500);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 select-none animate-slide-up">
      {/* iFruit Smartphone Body */}
      <div className="w-[300px] h-[550px] bg-neutral-950 border-[6px] border-neutral-700 rounded-[38px] p-3 shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col justify-between overflow-hidden relative font-sans">
        {/* Phone Notch & Speaker */}
        <div className="absolute top-2 inset-x-0 flex justify-center z-20 pointer-events-none">
          <div className="w-20 h-4 bg-neutral-900 rounded-b-xl flex items-center justify-center">
            <div className="w-8 h-1 bg-neutral-700 rounded-full" />
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between text-[11px] font-bold text-neutral-300 pt-2 px-3 z-10">
          <span>iFruit 5</span>
          <span>4G LTE</span>
          <span>100% 🔋</span>
        </div>

        {/* Notification / Toast Banner */}
        {cheatMessage && (
          <div className="absolute top-10 inset-x-4 bg-amber-500 text-black font-black text-xs py-2 px-3 rounded-lg shadow-lg text-center z-30 animate-bounce">
            {cheatMessage}
          </div>
        )}

        {/* Screen Content */}
        <div className="flex-1 bg-neutral-900/90 rounded-2xl p-3 my-2 overflow-y-auto flex flex-col">
          {activeApp === 'home' && (
            <div className="flex flex-col h-full justify-between">
              {/* Wallpaper Header */}
              <div className="flex flex-col items-center mt-4">
                <span className="text-4xl">🌴</span>
                <span className="text-lg font-black text-amber-400 font-['Pricedown',Impact,sans-serif] tracking-wider mt-1">
                  iFruit OS
                </span>
                <span className="text-xs text-neutral-400">Los Santos, SA</span>
              </div>

              {/* App Icon Grid */}
              <div className="grid grid-cols-3 gap-3 my-auto">
                <button
                  onClick={() => setActiveApp('missions')}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 transition cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-xl bg-amber-500 flex items-center justify-center text-black shadow-md">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold text-white">Heists</span>
                </button>

                <button
                  onClick={() => setActiveApp('contacts')}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 transition cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-md">
                    <Users className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold text-white">Contacts</span>
                </button>

                <button
                  onClick={() => setActiveApp('cheats')}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 transition cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center text-black shadow-md">
                    <Zap className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold text-white">Cheats</span>
                </button>

                <button
                  onClick={() => {
                    onOpenCustoms();
                    onClose();
                  }}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 transition cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-xl bg-purple-500 flex items-center justify-center text-white shadow-md">
                    <Car className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold text-white">LS Customs</span>
                </button>

                <button
                  onClick={() => {
                    onSpawnSupercar();
                    showCheatFeedback('Mechanic delivered Pegassi Supercar nearby!');
                  }}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 transition cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-xl bg-red-500 flex items-center justify-center text-white shadow-md">
                    <Car className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold text-white">Mechanic</span>
                </button>

                <button
                  onClick={() => {
                    onClearWanted();
                    showCheatFeedback('Wanted level cleared by Lester!');
                  }}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 transition cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-xl bg-yellow-500 flex items-center justify-center text-black shadow-md">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold text-white">Bribe Cops</span>
                </button>

                <button
                  onClick={() => {
                    onOpenDownload?.();
                    onClose();
                  }}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 transition cursor-pointer col-span-3 bg-gradient-to-r from-emerald-950/80 to-amber-950/80 border border-amber-500/40"
                >
                  <div className="flex items-center gap-2 py-0.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center text-black shadow">
                      <Download className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-black text-amber-300">डाउनलोड / Install Game</span>
                  </div>
                </button>
              </div>

              {/* Bottom Quick Info */}
              <div className="text-center text-[10px] text-neutral-500">
                Press [P] or click back to close phone
              </div>
            </div>
          )}

          {/* CONTACTS APP */}
          {activeApp === 'contacts' && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
                <button onClick={() => setActiveApp('home')} className="p-1 hover:text-amber-400 cursor-pointer">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-bold text-white">Contacts</span>
              </div>

              <div className="flex flex-col gap-2 mt-1">
                <button
                  onClick={() => {
                    onClearWanted();
                    showCheatFeedback('Lester: Cops called off!');
                  }}
                  className="p-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 flex items-center justify-between text-left cursor-pointer"
                >
                  <div>
                    <p className="text-xs font-bold text-white">Lester Crest</p>
                    <p className="text-[10px] text-emerald-400">Remove Wanted Level</p>
                  </div>
                  <PhoneIcon className="w-4 h-4 text-emerald-400" />
                </button>

                <button
                  onClick={() => {
                    onSpawnSupercar();
                    showCheatFeedback('Mechanic: Pegassi dropped at your curb!');
                  }}
                  className="p-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 flex items-center justify-between text-left cursor-pointer"
                >
                  <div>
                    <p className="text-xs font-bold text-white">Mechanic</p>
                    <p className="text-[10px] text-blue-400">Deliver Custom Supercar</p>
                  </div>
                  <PhoneIcon className="w-4 h-4 text-blue-400" />
                </button>

                <button
                  onClick={() => {
                    onGiveWeapons();
                    showCheatFeedback('Ammu-Nation: Full loadout supplied!');
                  }}
                  className="p-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 flex items-center justify-between text-left cursor-pointer"
                >
                  <div>
                    <p className="text-xs font-bold text-white">Ammu-Nation Rep</p>
                    <p className="text-[10px] text-amber-400">Drop Guns & Max Ammo</p>
                  </div>
                  <PhoneIcon className="w-4 h-4 text-amber-400" />
                </button>

                <button
                  onClick={() => {
                    onMaxWanted();
                    showCheatFeedback('Emergency 911: All units dispatched to your location!');
                  }}
                  className="p-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 flex items-center justify-between text-left cursor-pointer"
                >
                  <div>
                    <p className="text-xs font-bold text-white">911 Emergency</p>
                    <p className="text-[10px] text-red-400">Dispatch Police (5 Stars)</p>
                  </div>
                  <PhoneIcon className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          )}

          {/* MISSIONS / HEISTS APP */}
          {activeApp === 'missions' && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
                <button onClick={() => setActiveApp('home')} className="p-1 hover:text-amber-400 cursor-pointer">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-bold text-white">Heists & Contracts</span>
              </div>

              <div className="flex flex-col gap-2 mt-1">
                {AVAILABLE_MISSIONS.map((m) => (
                  <div key={m.id} className="p-2.5 rounded-lg bg-neutral-800 border border-neutral-700 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400">{m.title}</span>
                      <span className="text-[11px] font-mono text-emerald-400 font-bold">
                        +${m.reward.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-300 leading-tight">{m.description}</p>
                    <div className="flex items-center justify-between mt-1 pt-1 border-t border-neutral-700">
                      <span className="text-[10px] text-neutral-400">Client: {m.client}</span>
                      <button
                        onClick={() => {
                          onStartMission(m);
                          showCheatFeedback(`Waypoint set for: ${m.title}`);
                          onClose();
                        }}
                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold text-[10px] rounded cursor-pointer transition"
                      >
                        START HEIST
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CHEATS APP */}
          {activeApp === 'cheats' && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
                <button onClick={() => setActiveApp('home')} className="p-1 hover:text-amber-400 cursor-pointer">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-bold text-white">San Andreas Cheats</span>
              </div>

              <div className="flex flex-col gap-1.5 mt-1">
                <button
                  onClick={() => {
                    onSpawnSupercar();
                    showCheatFeedback('CHEAT: Supercar Spawned!');
                  }}
                  className="p-2 rounded bg-neutral-800 hover:bg-neutral-700 text-left text-xs font-bold text-amber-400 cursor-pointer"
                >
                  🏎️ Spawn Supercar (Pegassi)
                </button>

                {onSpawnHelicopter && (
                  <button
                    onClick={() => {
                      onSpawnHelicopter();
                      showCheatFeedback('CHEAT: Buzzard Helicopter Spawned!');
                    }}
                    className="p-2 rounded bg-neutral-800 hover:bg-neutral-700 text-left text-xs font-bold text-sky-400 cursor-pointer"
                  >
                    🚁 Spawn Attack Helicopter (Buzzard)
                  </button>
                )}

                {onSpawnTank && (
                  <button
                    onClick={() => {
                      onSpawnTank();
                      showCheatFeedback('CHEAT: Rhino Military Tank Spawned!');
                    }}
                    className="p-2 rounded bg-neutral-800 hover:bg-neutral-700 text-left text-xs font-bold text-yellow-500 cursor-pointer"
                  >
                    🎖️ Spawn Military Tank (Rhino)
                  </button>
                )}

                <button
                  onClick={() => {
                    onGiveWeapons();
                    showCheatFeedback('CHEAT: Weapons & Ammo Given!');
                  }}
                  className="p-2 rounded bg-neutral-800 hover:bg-neutral-700 text-left text-xs font-bold text-emerald-400 cursor-pointer"
                >
                  🔫 All Weapons & Unlimited Ammo
                </button>

                <button
                  onClick={() => {
                    onClearWanted();
                    showCheatFeedback('CHEAT: Wanted Level Cleared!');
                  }}
                  className="p-2 rounded bg-neutral-800 hover:bg-neutral-700 text-left text-xs font-bold text-blue-400 cursor-pointer"
                >
                  ⭐ Clear Wanted Level (0 Stars)
                </button>

                <button
                  onClick={() => {
                    onMaxWanted();
                    showCheatFeedback('CHEAT: 5-STAR WANTED LEVEL!');
                  }}
                  className="p-2 rounded bg-neutral-800 hover:bg-neutral-700 text-left text-xs font-bold text-red-500 cursor-pointer"
                >
                  🚨 Max Wanted Level (5 Stars)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Home Button (Circle) */}
        <div className="flex justify-center pb-1">
          <button
            onClick={() => {
              if (activeApp !== 'home') setActiveApp('home');
              else onClose();
            }}
            className="w-10 h-10 rounded-full border-2 border-neutral-600 hover:border-amber-400 transition-colors flex items-center justify-center cursor-pointer active:scale-95"
          >
            <div className="w-4 h-4 rounded-sm border border-neutral-500" />
          </button>
        </div>
      </div>
    </div>
  );
};
