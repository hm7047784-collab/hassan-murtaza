import React, { useState } from 'react';
import { X, Wrench, Palette, Gauge, Shield, Sparkles } from 'lucide-react';

interface LosSantosCustomsModalProps {
  isOpen: boolean;
  money: number;
  inVehicle: boolean;
  onClose: () => void;
  onApplyColor: (color: string) => void;
  onUpgradeEngine: (level: number, cost: number) => void;
  onRepairVehicle: () => void;
}

const PAINT_COLORS = [
  { name: 'Sunset Orange', hex: '#f59e0b' },
  { name: 'Midnight Purple', hex: '#7c3aed' },
  { name: 'Matte Carbon Black', hex: '#18181b' },
  { name: 'Torino Red', hex: '#dc2626' },
  { name: 'Ultra Blue', hex: '#2563eb' },
  { name: 'Dewbauchee Lime', hex: '#84cc16' },
  { name: 'Frost White', hex: '#f8fafc' },
  { name: 'Gold Chrome', hex: '#eab308' },
];

export const LosSantosCustomsModal: React.FC<LosSantosCustomsModalProps> = ({
  isOpen,
  money,
  inVehicle,
  onClose,
  onApplyColor,
  onUpgradeEngine,
  onRepairVehicle,
}) => {
  const [selectedTab, setSelectedTab] = useState<'paint' | 'performance' | 'repair'>('paint');
  const [activeColor, setActiveColor] = useState('#f59e0b');
  const [tuningLevel, setTuningLevel] = useState(1);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="relative bg-neutral-900 border-2 border-emerald-500 rounded-3xl p-6 max-w-xl w-full shadow-[0_0_50px_rgba(16,185,129,0.25)] flex flex-col">
        {/* Header */}
        <div className="w-full flex items-center justify-between border-b border-neutral-800 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Wrench className="w-7 h-7 text-emerald-400" />
            <div>
              <span className="text-2xl font-black text-emerald-400 font-['Pricedown',Impact,sans-serif] tracking-wider block">
                LOS SANTOS CUSTOMS
              </span>
              <span className="text-xs text-neutral-400">Modifications, Performance Tuning & Repairs</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-white rounded-md cursor-pointer">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-neutral-800 pb-3 mb-4">
          <button
            onClick={() => setSelectedTab('paint')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              selectedTab === 'paint' ? 'bg-emerald-500 text-black shadow' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            <Palette className="w-4 h-4" /> Respray Paint
          </button>

          <button
            onClick={() => setSelectedTab('performance')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              selectedTab === 'performance' ? 'bg-emerald-500 text-black shadow' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            <Gauge className="w-4 h-4" /> Performance Tuning
          </button>

          <button
            onClick={() => setSelectedTab('repair')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              selectedTab === 'repair' ? 'bg-emerald-500 text-black shadow' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            <Shield className="w-4 h-4" /> Repair & Armor
          </button>
        </div>

        {/* TAB 1: Respray Colors */}
        {selectedTab === 'paint' && (
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold text-neutral-400">SELECT METALLIC / PEARLESCENT COAT:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {PAINT_COLORS.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => {
                    setActiveColor(c.hex);
                    onApplyColor(c.hex);
                  }}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition cursor-pointer ${
                    activeColor === c.hex ? 'border-emerald-400 bg-neutral-800 shadow-md scale-105' : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-600'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full border-2 border-white/20 shadow" style={{ backgroundColor: c.hex }} />
                  <span className="text-xs font-bold text-white text-center">{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Performance Tuning */}
        {selectedTab === 'performance' && (
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold text-neutral-400">ENGINE & TURBO CHARGER:</span>
            <div className="flex flex-col gap-2">
              {[
                { lvl: 1, name: 'Street Tune ECU', desc: '+15% Top Speed & Acceleration', cost: 2500 },
                { lvl: 2, name: 'Race Turbocharger', desc: '+30% Acceleration & Nitro Flow', cost: 5000 },
                { lvl: 3, name: 'EMS Extreme Stage 4', desc: '+50% Top Speed & Super Drift Grip', cost: 10000 },
              ].map((tune) => (
                <div key={tune.lvl} className="p-3 bg-neutral-800 rounded-xl border border-neutral-700 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-white block">{tune.name}</span>
                    <span className="text-xs text-neutral-400">{tune.desc}</span>
                  </div>
                  <button
                    onClick={() => {
                      setTuningLevel(tune.lvl);
                      onUpgradeEngine(tune.lvl, tune.cost);
                    }}
                    className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black rounded-md cursor-pointer transition shadow"
                  >
                    ${tune.cost.toLocaleString()}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Repair & Armor */}
        {selectedTab === 'repair' && (
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold text-neutral-400">BODYWORK & ARMOR:</span>
            <div className="p-4 bg-neutral-800 rounded-xl border border-neutral-700 flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-white block">Full Repair & Wash</span>
                <span className="text-xs text-neutral-400">Fix all dented panels, cracked glass, and restore 100% car health</span>
              </div>
              <button
                onClick={onRepairVehicle}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black rounded-md cursor-pointer transition shadow"
              >
                $500 FIX
              </button>
            </div>
          </div>
        )}

        {/* Footer Balance */}
        <div className="mt-6 pt-3 border-t border-neutral-800 flex items-center justify-between">
          <span className="text-xs text-neutral-400">AVAILABLE CASH:</span>
          <span className="text-lg font-black text-emerald-400 font-mono">
            ${money.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};
