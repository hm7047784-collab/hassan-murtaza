import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Zap, Car, Shield, Crosshair, Volume2 } from 'lucide-react';

interface TouchControlsProps {
  inVehicle: boolean;
  inHelicopter?: boolean;
  onKeyDown: (key: string) => void;
  onKeyUp: (key: string) => void;
  onAttack: () => void;
  onEnterVehicle: () => void;
  onHorn: () => void;
  onSpecial: () => void;
  onWeaponWheel: () => void;
  onPhone: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  inVehicle,
  inHelicopter,
  onKeyDown,
  onKeyUp,
  onAttack,
  onEnterVehicle,
  onHorn,
  onSpecial,
  onWeaponWheel,
  onPhone,
}) => {
  return (
    <div className="absolute inset-x-0 bottom-16 pointer-events-none z-20 flex justify-between px-6 select-none">
      {/* Left D-Pad Controls */}
      <div className="flex flex-col items-center gap-1.5 pointer-events-auto">
        <button
          onPointerDown={() => onKeyDown('KeyW')}
          onPointerUp={() => onKeyUp('KeyW')}
          className="w-14 h-14 rounded-2xl bg-neutral-900/80 border-2 border-neutral-700 active:border-amber-400 active:bg-neutral-800 text-white flex items-center justify-center shadow-lg active:scale-95 transition"
        >
          <ArrowUp className="w-7 h-7" />
        </button>

        <div className="flex gap-2">
          <button
            onPointerDown={() => onKeyDown('KeyA')}
            onPointerUp={() => onKeyUp('KeyA')}
            className="w-14 h-14 rounded-2xl bg-neutral-900/80 border-2 border-neutral-700 active:border-amber-400 active:bg-neutral-800 text-white flex items-center justify-center shadow-lg active:scale-95 transition"
          >
            <ArrowLeft className="w-7 h-7" />
          </button>

          <button
            onPointerDown={() => onKeyDown('KeyS')}
            onPointerUp={() => onKeyUp('KeyS')}
            className="w-14 h-14 rounded-2xl bg-neutral-900/80 border-2 border-neutral-700 active:border-amber-400 active:bg-neutral-800 text-white flex items-center justify-center shadow-lg active:scale-95 transition"
          >
            <ArrowDown className="w-7 h-7" />
          </button>

          <button
            onPointerDown={() => onKeyDown('KeyD')}
            onPointerUp={() => onKeyUp('KeyD')}
            className="w-14 h-14 rounded-2xl bg-neutral-900/80 border-2 border-neutral-700 active:border-amber-400 active:bg-neutral-800 text-white flex items-center justify-center shadow-lg active:scale-95 transition"
          >
            <ArrowRight className="w-7 h-7" />
          </button>
        </div>
      </div>

      {/* Right Action Cluster */}
      <div className="flex flex-col items-end gap-2 pointer-events-auto">
        <div className="flex gap-2">
          {/* Horn / Siren */}
          <button
            onClick={onHorn}
            className="w-12 h-12 rounded-xl bg-neutral-900/80 border border-neutral-700 active:border-amber-400 text-white flex items-center justify-center shadow-md active:scale-95"
            title="Horn"
          >
            📢
          </button>

          {/* Special Ability */}
          <button
            onClick={onSpecial}
            className="w-12 h-12 rounded-xl bg-yellow-500/20 border-2 border-yellow-500 text-yellow-400 flex items-center justify-center shadow-md active:scale-95 font-bold"
            title="Special Ability"
          >
            <Zap className="w-6 h-6" />
          </button>

          {/* Enter/Exit Vehicle */}
          <button
            onClick={onEnterVehicle}
            className="w-12 h-12 rounded-xl bg-neutral-900/80 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center shadow-md active:scale-95"
            title="Enter / Exit Vehicle"
          >
            <Car className="w-6 h-6" />
          </button>
        </div>

        <div className="flex gap-2">
          {/* Handbrake / Jump / Helicopter Ascend */}
          <button
            onPointerDown={() => onKeyDown('Space')}
            onPointerUp={() => onKeyUp('Space')}
            className="w-14 h-14 rounded-2xl bg-neutral-900/80 border-2 border-neutral-600 active:border-amber-400 text-white font-black text-xs flex items-center justify-center shadow-lg active:scale-95"
          >
            {inHelicopter ? 'UP ⬆' : inVehicle ? 'DRIFT' : 'JUMP'}
          </button>

          {/* Nitro / Sprint / Helicopter Descend */}
          {inHelicopter ? (
            <button
              onPointerDown={() => onKeyDown('ControlLeft')}
              onPointerUp={() => onKeyUp('ControlLeft')}
              className="w-14 h-14 rounded-2xl bg-sky-950/80 border-2 border-sky-400 text-sky-300 font-black text-xs flex items-center justify-center shadow-lg active:scale-95"
            >
              DOWN ⬇
            </button>
          ) : (
            <button
              onPointerDown={() => onKeyDown('ShiftLeft')}
              onPointerUp={() => onKeyUp('ShiftLeft')}
              className="w-14 h-14 rounded-2xl bg-cyan-950/80 border-2 border-cyan-400 text-cyan-300 font-black text-xs flex items-center justify-center shadow-lg active:scale-95"
            >
              {inVehicle ? 'NITRO' : 'RUN'}
            </button>
          )}

          {/* Shoot / Punch Button */}
          <button
            onClick={onAttack}
            className="w-16 h-16 rounded-2xl bg-red-600/90 border-2 border-red-400 text-white flex items-center justify-center shadow-xl active:scale-95"
          >
            <Crosshair className="w-8 h-8" />
          </button>
        </div>
      </div>
    </div>
  );
};
