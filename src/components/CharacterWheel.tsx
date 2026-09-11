import React, { useState } from 'react';
import { CharacterId, CharacterProfile } from '../types';
import { X, Zap, Car, MapPin, Gauge, Target, Shield, Flame, Activity } from 'lucide-react';
import { sound } from '../audio/SoundEffects';

interface CharacterWheelProps {
  isOpen: boolean;
  activeCharacter: CharacterId;
  onSelectCharacter: (char: CharacterId) => void;
  onClose: () => void;
}

export const CHARACTERS_DATA: CharacterProfile[] = [
  {
    id: 'michael',
    name: 'Michael De Santa',
    specialAbilityName: 'Area Marksman (Bullet Time)',
    specialAbilityDescription: 'Dilation bullet-time while aiming, granting laser-focus precision sharpshooting.',
    color: '#64748b', // Slate
    avatarIcon: '🕶️',
    shirtColor: 0x4b5563,
    locationName: 'Portola Drive, Rockford Hills Mansion',
    defaultVehicleName: 'Obey Tailgater (Executive Black)',
    defaultVehicleColor: '#1e293b',
    quote: '"You forget a thousand things every day, pal. Make sure this is one of them."',
    stats: {
      special: 100,
      stamina: 80,
      shooting: 100,
      strength: 75,
      stealth: 80,
      flying: 70,
      driving: 85,
    },
  },
  {
    id: 'franklin',
    name: 'Franklin Clinton',
    specialAbilityName: 'Driving Focus (Slow-Mo)',
    specialAbilityDescription: 'Slows down time behind the wheel for surgical cornering at 140 mph and weaving through gridlock traffic.',
    color: '#2563eb', // Blue
    avatarIcon: '🧢',
    shirtColor: 0x2563eb,
    locationName: 'Forum Drive / Los Santos Customs',
    defaultVehicleName: 'Bravado Buffalo S (Metallic Blue)',
    defaultVehicleColor: '#2563eb',
    quote: '"Look, I don\'t mind dying. I just wanna die after I get rich."',
    stats: {
      special: 100,
      stamina: 90,
      shooting: 80,
      strength: 85,
      stealth: 70,
      flying: 60,
      driving: 100,
    },
  },
  {
    id: 'trevor',
    name: 'Trevor Philips',
    specialAbilityName: 'Red Rampage (Berserk Mode)',
    specialAbilityDescription: 'Enters a red-tinted bloodthirsty rage, absorbing virtually all damage and delivering catastrophic 2x lethality.',
    color: '#ea580c', // Orange
    avatarIcon: '🪓',
    shirtColor: 0xd97706,
    locationName: 'Sandy Shores Trailer / Coastline',
    defaultVehicleName: 'Canis Bodhi 4x4 (Dirty Orange)',
    defaultVehicleColor: '#ea580c',
    quote: '"I need you to look in my eyes and understand: I am completely unhinged."',
    stats: {
      special: 100,
      stamina: 95,
      shooting: 90,
      strength: 100,
      stealth: 50,
      flying: 95,
      driving: 80,
    },
  },
];

export const CharacterWheel: React.FC<CharacterWheelProps> = ({
  isOpen,
  activeCharacter,
  onSelectCharacter,
  onClose,
}) => {
  const [hoveredChar, setHoveredChar] = useState<CharacterId>(activeCharacter);

  if (!isOpen) return null;

  const currentProfile = CHARACTERS_DATA.find((c) => c.id === hoveredChar) || CHARACTERS_DATA[1];

  const handleCharClick = (id: CharacterId) => {
    sound.playCharacterSwitchSound();
    onSelectCharacter(id);
    onClose();
  };

  const handleCharHover = (id: CharacterId) => {
    if (id !== hoveredChar) {
      sound.playWheelTick();
      setHoveredChar(id);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="relative bg-neutral-950/95 border-2 border-neutral-700 rounded-3xl p-6 max-w-3xl w-full shadow-[0_0_60px_rgba(0,0,0,0.9)] flex flex-col items-center">
        {/* Top Header */}
        <div className="w-full flex items-center justify-between border-b border-neutral-800 pb-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/50">
              <span className="text-amber-400 font-black text-xs uppercase tracking-wider">
                GTA V CHARACTER SWITCH WHEEL
              </span>
            </div>
            <span className="text-xs text-neutral-400">Hold ALT or press C anytime to switch</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg cursor-pointer transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Center: Iconic GTA V Circular Wheel + Live Stat Sheet */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full items-center">
          {/* Left Column: Authentic GTA V 3-Wedge Dial */}
          <div className="md:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-64 h-64 flex items-center justify-center">
              {/* Outer dial ring */}
              <div className="absolute inset-0 rounded-full border-4 border-neutral-800 shadow-[0_0_30px_rgba(0,0,0,0.8)]" />

              {/* Wedge 1: Michael (Left / West) */}
              <button
                onClick={() => handleCharClick('michael')}
                onMouseEnter={() => handleCharHover('michael')}
                className={`absolute left-2 top-1/2 -translate-y-1/2 w-24 h-24 rounded-2xl flex flex-col items-center justify-center p-2 border-2 transition-all cursor-pointer shadow-xl ${
                  hoveredChar === 'michael'
                    ? 'bg-slate-800/90 border-slate-300 scale-110 shadow-[0_0_25px_rgba(148,163,184,0.4)] z-20'
                    : 'bg-neutral-900/80 border-neutral-700 hover:border-slate-400'
                }`}
              >
                <span className="text-3xl">🕶️</span>
                <span className="text-xs font-black text-white mt-1 uppercase tracking-tight">MICHAEL</span>
                <span className="text-[9px] font-bold text-slate-400">MARKS</span>
              </button>

              {/* Wedge 2: Trevor (Right / East) */}
              <button
                onClick={() => handleCharClick('trevor')}
                onMouseEnter={() => handleCharHover('trevor')}
                className={`absolute right-2 top-1/2 -translate-y-1/2 w-24 h-24 rounded-2xl flex flex-col items-center justify-center p-2 border-2 transition-all cursor-pointer shadow-xl ${
                  hoveredChar === 'trevor'
                    ? 'bg-orange-900/90 border-orange-400 scale-110 shadow-[0_0_25px_rgba(234,88,12,0.4)] z-20'
                    : 'bg-neutral-900/80 border-neutral-700 hover:border-orange-500'
                }`}
              >
                <span className="text-3xl">🪓</span>
                <span className="text-xs font-black text-white mt-1 uppercase tracking-tight">TREVOR</span>
                <span className="text-[9px] font-bold text-orange-400">RAMPAGE</span>
              </button>

              {/* Wedge 3: Franklin (Bottom / South) */}
              <button
                onClick={() => handleCharClick('franklin')}
                onMouseEnter={() => handleCharHover('franklin')}
                className={`absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-24 rounded-2xl flex flex-col items-center justify-center p-2 border-2 transition-all cursor-pointer shadow-xl ${
                  hoveredChar === 'franklin'
                    ? 'bg-blue-900/90 border-blue-400 scale-110 shadow-[0_0_25px_rgba(37,99,235,0.4)] z-20'
                    : 'bg-neutral-900/80 border-neutral-700 hover:border-blue-500'
                }`}
              >
                <span className="text-3xl">🧢</span>
                <span className="text-xs font-black text-white mt-1 uppercase tracking-tight">FRANKLIN</span>
                <span className="text-[9px] font-bold text-blue-400">DRIVE</span>
              </button>

              {/* Center Hub: Current Selection Avatar */}
              <div
                className="w-16 h-16 rounded-full border-2 border-neutral-600 bg-neutral-900 flex items-center justify-center text-2xl shadow-inner z-10"
                style={{ borderColor: currentProfile.color }}
              >
                {currentProfile.avatarIcon}
              </div>
            </div>

            <span className="text-xs text-neutral-400 mt-4 text-center">
              Click any character to trigger the <strong>GTA V Sky Satellite Transition</strong>!
            </span>
          </div>

          {/* Right Column: Character Profile, Stats & Lore */}
          <div className="md:col-span-7 bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              {/* Name & Special */}
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-white">{currentProfile.name}</span>
                    {activeCharacter === currentProfile.id && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-black uppercase">
                        ACTIVE NOW
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-xs font-bold" style={{ color: currentProfile.color }}>
                    <Zap className="w-4 h-4" />
                    <span>{currentProfile.specialAbilityName}</span>
                  </div>
                </div>
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow border"
                  style={{ borderColor: currentProfile.color, backgroundColor: `${currentProfile.color}22` }}
                >
                  {currentProfile.avatarIcon}
                </div>
              </div>

              {/* Quote */}
              <p className="text-xs italic text-neutral-300 bg-black/40 p-2.5 rounded-lg border border-neutral-800/80 mb-3">
                {currentProfile.quote}
              </p>

              {/* Location & Car */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 text-xs">
                <div className="flex items-center gap-2 p-2 bg-neutral-800/60 rounded-lg">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-neutral-400 block font-semibold">HOME BASE:</span>
                    <span className="text-neutral-200 font-bold truncate block">{currentProfile.locationName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 bg-neutral-800/60 rounded-lg">
                  <Car className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-neutral-400 block font-semibold">SIGNATURE CAR:</span>
                    <span className="text-neutral-200 font-bold truncate block">{currentProfile.defaultVehicleName}</span>
                  </div>
                </div>
              </div>

              {/* Skills Attribute Bars */}
              <div className="space-y-2 mb-4">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                  CHARACTER ATTRIBUTES:
                </span>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  {[
                    { label: 'Driving', val: currentProfile.stats.driving, icon: <Gauge className="w-3.5 h-3.5 text-blue-400" /> },
                    { label: 'Shooting', val: currentProfile.stats.shooting, icon: <Target className="w-3.5 h-3.5 text-red-400" /> },
                    { label: 'Flying', val: currentProfile.stats.flying, icon: <Activity className="w-3.5 h-3.5 text-amber-400" /> },
                    { label: 'Special Meter', val: currentProfile.stats.special, icon: <Zap className="w-3.5 h-3.5 text-yellow-400" /> },
                  ].map((attr) => (
                    <div key={attr.label} className="flex flex-col gap-1">
                      <div className="flex justify-between text-[11px] font-semibold text-neutral-300">
                        <span className="flex items-center gap-1">
                          {attr.icon}
                          {attr.label}
                        </span>
                        <span className="font-mono text-neutral-400">{attr.val}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${attr.val}%`, backgroundColor: currentProfile.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Switch Confirmation Button */}
            <button
              onClick={() => handleCharClick(currentProfile.id)}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-widest rounded-xl transition cursor-pointer shadow-lg flex items-center justify-center gap-2"
            >
              <span>SWITCH TO {currentProfile.name.split(' ')[0].toUpperCase()}</span>
              <span className="text-base">🚀</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
