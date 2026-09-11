import React from 'react';
import { GraphicsQuality, GraphicsSettings, TimeOfDay } from '../types';
import { X, Sparkles, Sun, Moon, CloudRain, Sunset, Eye, Gauge, Flame, Check } from 'lucide-react';

interface GraphicsModalProps {
  isOpen: boolean;
  settings: GraphicsSettings;
  onUpdateSettings: (newSettings: Partial<GraphicsSettings>) => void;
  onClose: () => void;
}

export const GraphicsModal: React.FC<GraphicsModalProps> = ({
  isOpen,
  settings,
  onUpdateSettings,
  onClose,
}) => {
  if (!isOpen) return null;

  const QUALITY_PRESETS: {
    id: GraphicsQuality;
    label: string;
    badge: string;
    desc: string;
    color: string;
  }[] = [
    {
      id: 'super_ultra',
      label: 'SUPER ULTRA 4K',
      badge: 'MAX GRAPHICS',
      desc: '4096 High-Res Soft Shadows, dynamic sun flare, wet road reflections, volumetric headlight cones, tire burnout smoke & glowing neon.',
      color: 'from-amber-500 to-yellow-300',
    },
    {
      id: 'ultra',
      label: 'ULTRA HD',
      badge: 'RECOMMENDED',
      desc: '2048 PCF Shadows, realistic automotive metallic paint reflections, ambient scattering & streetlamp illumination.',
      color: 'from-cyan-500 to-blue-400',
    },
    {
      id: 'balanced',
      label: 'BALANCED',
      badge: 'HIGH FPS',
      desc: 'Smooth 60 FPS performance with crisp directional lighting, shadows, and optimized city rendering.',
      color: 'from-emerald-500 to-green-400',
    },
  ];

  const TIME_PRESETS: {
    id: TimeOfDay;
    label: string;
    icon: React.ReactNode;
    desc: string;
    ambientColor: string;
  }[] = [
    {
      id: 'sunset',
      label: 'Golden Sunset',
      icon: <Sunset className="w-5 h-5 text-amber-400" />,
      desc: 'Iconic Los Santos golden hour, amber horizon haze & long cinematic shadows.',
      ambientColor: 'border-amber-500/50 bg-amber-950/30',
    },
    {
      id: 'noon',
      label: 'High Noon',
      icon: <Sun className="w-5 h-5 text-yellow-400" />,
      desc: 'Blazing California sunshine, deep blue sky & sparkling ocean water.',
      ambientColor: 'border-blue-500/50 bg-blue-950/30',
    },
    {
      id: 'night',
      label: 'Neon Night',
      icon: <Moon className="w-5 h-5 text-purple-400" />,
      desc: 'Atmospheric dark sky, illuminated skyscraper windows, neon signs & bright headlights.',
      ambientColor: 'border-purple-500/50 bg-purple-950/30',
    },
    {
      id: 'rain',
      label: 'Wet Reflections',
      icon: <CloudRain className="w-5 h-5 text-cyan-400" />,
      desc: 'Glossy wet asphalt reflections, moody overcast sky & glistening automotive bodywork.',
      ambientColor: 'border-cyan-500/50 bg-cyan-950/30',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="relative bg-neutral-900/95 border-2 border-amber-500 rounded-3xl p-6 max-w-2xl w-full shadow-[0_0_50px_rgba(245,158,11,0.25)] flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-amber-400 font-['Pricedown',Impact,sans-serif] tracking-wider">
                  GRAPHICS & VISUAL ENGINE
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500 text-black uppercase tracking-widest">
                  SUPER ULTRA
                </span>
              </div>
              <p className="text-xs text-neutral-400">Custom 3D shaders, real-time lighting, reflection maps & atmosphere</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg cursor-pointer transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* SECTION 1: Quality Preset Cards */}
        <div className="mb-6">
          <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-2.5">
            1. Graphics Fidelity Level
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {QUALITY_PRESETS.map((preset) => {
              const isSelected = settings.quality === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => {
                    const updates: Partial<GraphicsSettings> = { quality: preset.id };
                    if (preset.id === 'super_ultra') {
                      updates.shadows = true;
                      updates.reflections = true;
                      updates.volumetricLights = true;
                      updates.motionBlur = true;
                      updates.highResTextures = true;
                    } else if (preset.id === 'ultra') {
                      updates.shadows = true;
                      updates.reflections = true;
                      updates.volumetricLights = true;
                      updates.motionBlur = false;
                      updates.highResTextures = true;
                    } else {
                      updates.shadows = true;
                      updates.reflections = false;
                      updates.volumetricLights = false;
                      updates.motionBlur = false;
                      updates.highResTextures = false;
                    }
                    onUpdateSettings(updates);
                  }}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'bg-neutral-800 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.25)] scale-[1.02]'
                      : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/60'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-400 text-black flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                      {preset.badge}
                    </span>
                    <h3 className="text-sm font-black text-white mt-0.5">{preset.label}</h3>
                    <p className="text-[11px] text-neutral-400 mt-1.5 leading-relaxed">{preset.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: Time of Day & Atmosphere */}
        <div className="mb-6">
          <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-2.5">
            2. Los Santos Atmosphere & Time of Day
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {TIME_PRESETS.map((t) => {
              const isSelected = settings.timeOfDay === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => onUpdateSettings({ timeOfDay: t.id })}
                  className={`p-3 rounded-xl border flex flex-col items-center text-center transition cursor-pointer ${
                    isSelected
                      ? `border-amber-400 bg-neutral-800 shadow-md scale-105 ${t.ambientColor}`
                      : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
                  }`}
                >
                  <div className="mb-2 p-2 rounded-lg bg-black/40">{t.icon}</div>
                  <span className="text-xs font-black text-white block">{t.label}</span>
                  <span className="text-[10px] text-neutral-400 mt-1 leading-tight">{t.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 3: Detailed Shaders & FX Toggles */}
        <div className="mb-6">
          <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-2.5">
            3. Advanced Shader & Post-Processing Toggles
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              {
                key: 'shadows' as const,
                label: 'Real-time Soft Shadows (4096 PCF)',
                desc: 'Soft building and vehicle contact shadows',
              },
              {
                key: 'reflections' as const,
                label: 'Asphalt & Metallic Clearcoat Reflections',
                desc: 'Road wetness sheen & automotive gloss',
              },
              {
                key: 'volumetricLights' as const,
                label: 'Headlight Cones & Streetlight Illumination',
                desc: 'Real forward beams casting on ground',
              },
              {
                key: 'motionBlur' as const,
                label: 'Speed Blur & High-Velocity Nitro Flare',
                desc: 'Cinematic camera distortion at high speed',
              },
            ].map((feature) => {
              const enabled = settings[feature.key];
              return (
                <div
                  key={feature.key}
                  className="flex items-center justify-between p-3 rounded-xl bg-neutral-800/80 border border-neutral-700"
                >
                  <div className="pr-2">
                    <span className="text-xs font-bold text-white block">{feature.label}</span>
                    <span className="text-[10px] text-neutral-400">{feature.desc}</span>
                  </div>
                  <button
                    onClick={() => onUpdateSettings({ [feature.key]: !enabled })}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                      enabled ? 'bg-amber-500' : 'bg-neutral-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                        enabled ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Apply & Close Footer */}
        <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>WebGL 2.0 Hardware Accelerated</span>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-lg"
          >
            APPLY ULTRA GRAPHICS
          </button>
        </div>
      </div>
    </div>
  );
};
