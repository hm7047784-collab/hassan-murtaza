import React from 'react';
import { WeaponType, WeaponData } from '../types';
import { Crosshair, Zap, ShieldAlert, Disc3, Flame, X } from 'lucide-react';

interface WeaponWheelProps {
  isOpen: boolean;
  selectedWeapon: WeaponType;
  weapons: Record<WeaponType, WeaponData>;
  onSelectWeapon: (weapon: WeaponType) => void;
  onClose: () => void;
}

const WEAPONS_LIST: { id: WeaponType; name: string; icon: string; category: string; description: string }[] = [
  { id: 'fist', name: 'Fists & Knuckles', icon: '👊', category: 'Melee', description: 'Close combat punch & takedowns' },
  { id: 'pistol', name: 'Combat Pistol', icon: '🔫', category: 'Handgun', description: '9mm Semi-automatic sidearm with high accuracy' },
  { id: 'smg', name: 'Micro SMG', icon: '⚡', category: 'Submachine Gun', description: 'Rapid fire drive-by favorite with compact frame' },
  { id: 'rifle', name: 'Carbine Rifle', icon: '🎯', category: 'Assault Rifle', description: 'Military assault carbine with superior stopping power' },
  { id: 'rpg', name: 'RPG Launcher', icon: '🚀', category: 'Heavy Explosive', description: 'Shoulder-fired rocket with devastating AOE blast' },
  { id: 'grenade', name: 'Sticky Explosive', icon: '💣', category: 'Thrown', description: 'High-yield explosive detonator' },
];

export const WeaponWheel: React.FC<WeaponWheelProps> = ({
  isOpen,
  selectedWeapon,
  weapons,
  onSelectWeapon,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="relative bg-neutral-900/95 border-2 border-amber-500/80 rounded-2xl p-6 max-w-xl w-full shadow-[0_0_50px_rgba(245,158,11,0.25)] flex flex-col items-center">
        {/* Header */}
        <div className="w-full flex items-center justify-between border-b border-neutral-800 pb-3 mb-5">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <span className="text-2xl font-black text-amber-400 font-['Pricedown',Impact,sans-serif] tracking-wider">
              WEAPON WHEEL
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-md transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Weapons Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full">
          {WEAPONS_LIST.map((w) => {
            const isSelected = selectedWeapon === w.id;
            const data = weapons[w.id];

            return (
              <button
                key={w.id}
                onClick={() => {
                  onSelectWeapon(w.id);
                  onClose();
                }}
                className={`flex flex-col items-start p-4 rounded-xl border transition-all text-left cursor-pointer group ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)] scale-[1.02]'
                    : 'bg-neutral-800/80 border-neutral-700 hover:border-neutral-500 hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-3xl">{w.icon}</span>
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest bg-black/40 px-2 py-0.5 rounded">
                    {w.category}
                  </span>
                </div>

                <span className={`text-base font-bold mt-2 ${isSelected ? 'text-amber-400' : 'text-white'}`}>
                  {w.name}
                </span>

                <span className="text-xs text-neutral-400 mt-1 line-clamp-2">
                  {w.description}
                </span>

                <div className="mt-3 pt-2 border-t border-neutral-700/50 flex items-center justify-between w-full text-xs">
                  <span className="text-neutral-400">AMMO</span>
                  <span className="font-mono font-bold text-amber-300">
                    {w.id === 'fist' ? '∞' : `${data?.ammo || 60} / ∞`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer tip */}
        <p className="text-xs text-neutral-400 mt-4 text-center">
          Press numbers <kbd className="bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-200">1</kbd> to <kbd className="bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-200">6</kbd> to switch weapons directly anytime in combat.
        </p>
      </div>
    </div>
  );
};
