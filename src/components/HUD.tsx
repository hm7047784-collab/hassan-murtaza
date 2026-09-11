import React from 'react';
import { PlayerState, RadioStation } from '../types';
import { Shield, Heart, Zap, Crosshair, Radio, Gauge, Download } from 'lucide-react';

interface HUDProps {
  playerState: PlayerState;
  onOpenWeaponWheel: () => void;
  onTogglePhone: () => void;
  onToggleCharacterWheel: () => void;
  onToggleRadio: () => void;
  onEnterVehicle: () => void;
  onToggleMute: () => void;
  onOpenDownload?: () => void;
  isMuted: boolean;
  stuntBonus: number | null;
  missionPassedBanner: string | null;
  wastedBanner: boolean;
}

const RADIO_STATIONS: Record<string, RadioStation> = {
  radio_los_santos: { id: 'radio_los_santos', name: 'Radio Los Santos', genre: 'West Coast Hip-Hop', currentTrack: 'Kendrick Lamar - A.D.H.D', color: '#10b981' },
  non_stop_pop: { id: 'non_stop_pop', name: 'Non-Stop-Pop FM', genre: 'Pop & Dance', currentTrack: 'Modjo - Lady (Hear Me Tonight)', color: '#ec4899' },
  west_coast_classics: { id: 'west_coast_classics', name: 'West Coast Classics', genre: '90s G-Funk Classics', currentTrack: 'Dr. Dre ft. Snoop - The Next Episode', color: '#f59e0b' },
  vinewood_boulevard: { id: 'vinewood_boulevard', name: 'Vinewood Blvd Radio', genre: 'Alternative Rock', currentTrack: 'The Black Angels - Black Grease', color: '#ef4444' },
  off: { id: 'off', name: 'Radio Off', genre: 'Quiet', currentTrack: 'Silence', color: '#6b7280' },
};

export const HUD: React.FC<HUDProps> = ({
  playerState,
  onOpenWeaponWheel,
  onTogglePhone,
  onToggleCharacterWheel,
  onToggleRadio,
  onEnterVehicle,
  onToggleMute,
  onOpenDownload,
  isMuted,
  stuntBonus,
  missionPassedBanner,
  wastedBanner,
}) => {
  const currentRadioStation = RADIO_STATIONS[playerState.currentRadio] || RADIO_STATIONS.radio_los_santos;

  // Mini-map radar calculations
  const radarSize = 150;
  const mapScale = 0.55; // meters to radar pixels
  const playerScreenX = radarSize / 2;
  const playerScreenY = radarSize / 2;

  // Calculate mission blip on radar relative to player
  let missionBlip: { x: number; y: number; dist: number } | null = null;
  if (playerState.currentMission) {
    const dx = (playerState.currentMission.targetPos.x - playerState.position.x) * mapScale;
    const dz = (playerState.currentMission.targetPos.z - playerState.position.z) * mapScale;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const maxRadius = radarSize / 2 - 10;
    // Clamp to radar circle if too far
    let bx = playerScreenX + dx;
    let by = playerScreenY + dz;
    if (dist > maxRadius) {
      bx = playerScreenX + (dx / dist) * maxRadius;
      by = playerScreenY + (dz / dist) * maxRadius;
    }
    missionBlip = { x: bx, y: by, dist: Math.round(dist / mapScale) };
  }

  // Major Landmark Radar Markers
  const LANDMARKS = [
    { name: 'LSIA Airport', x: -80, z: -260, color: '#c084fc', icon: '✈️' },
    { name: 'Fort Zancudo Military', x: 230, z: -110, color: '#f87171', icon: '🎖️' },
    { name: 'Central Garden', x: -50, z: 0, color: '#4ade80', icon: '🌿' },
    { name: 'Mount Zonah Hospital', x: 0, z: -50, color: '#38bdf8', icon: '🏥' },
    { name: 'Grove Street', x: 125, z: 25, color: '#fbbf24', icon: '🏠' },
    { name: 'Maze Bank Tower', x: 0, z: 0, color: '#facc15', icon: '🏦' },
  ];

  const landmarkBlips = LANDMARKS.map((lm) => {
    const dx = (lm.x - playerState.position.x) * mapScale;
    const dz = (lm.z - playerState.position.z) * mapScale;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const maxRadius = radarSize / 2 - 8;
    let bx = playerScreenX + dx;
    let by = playerScreenY + dz;
    if (dist > maxRadius) {
      bx = playerScreenX + (dx / dist) * maxRadius;
      by = playerScreenY + (dz / dist) * maxRadius;
    }
    return { ...lm, bx, by, dist: Math.round(dist / mapScale) };
  });

  return (
    <div className="absolute inset-0 pointer-events-none select-none font-sans overflow-hidden">
      {/* WASTED Screen Banner */}
      {wastedBanner && (
        <div className="absolute inset-0 bg-red-950/80 backdrop-blur-xs flex flex-col items-center justify-center pointer-events-auto z-50 animate-fade-in">
          <h1 className="text-8xl md:text-9xl font-black text-red-600 tracking-widest drop-shadow-[0_8px_30px_rgba(239,68,68,0.8)] font-['Pricedown',Impact,sans-serif]">
            WASTED
          </h1>
          <p className="text-neutral-300 text-lg mt-4 tracking-wider uppercase font-semibold">
            Press Respawn to return to Los Santos Medical Center
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-8 py-3 bg-neutral-900 border-2 border-red-600 text-white font-bold text-lg rounded-md hover:bg-red-600 hover:text-white transition-all cursor-pointer shadow-lg"
          >
            RESPAWN
          </button>
        </div>
      )}

      {/* MISSION PASSED Banner */}
      {missionPassedBanner && (
        <div className="absolute top-28 inset-x-0 flex flex-col items-center justify-center z-40 animate-bounce">
          <div className="bg-black/90 border-y-4 border-amber-500 px-12 py-4 flex flex-col items-center shadow-2xl">
            <span className="text-amber-400 text-5xl font-black tracking-widest font-['Pricedown',Impact,sans-serif]">
              MISSION PASSED
            </span>
            <span className="text-neutral-100 text-xl font-bold mt-1 tracking-wider uppercase">
              {missionPassedBanner}
            </span>
          </div>
        </div>
      )}

      {/* STUNT BONUS Banner */}
      {stuntBonus !== null && (
        <div className="absolute top-44 inset-x-0 flex flex-col items-center justify-center z-30 animate-pulse">
          <div className="bg-black/85 border-2 border-emerald-500 rounded-lg px-8 py-3 flex flex-col items-center shadow-xl">
            <span className="text-emerald-400 text-3xl font-black tracking-wider uppercase">
              INSANE STUNT JUMP!
            </span>
            <span className="text-white text-lg font-bold">
              Reward: +${stuntBonus}
            </span>
          </div>
        </div>
      )}

      {/* GTA V SATELLITE CHARACTER SWITCH CINEMATIC OVERLAY */}
      {playerState.isSwitchingCharacter && (
        <div className="absolute inset-0 pointer-events-none z-40 flex flex-col justify-between select-none">
          {/* Top Letterbox Bar */}
          <div className="w-full h-16 bg-black/90 backdrop-blur-xs flex items-center justify-between px-8 border-b border-white/10">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="text-neutral-300 text-xs tracking-widest font-mono font-bold uppercase">
                LOS SANTOS ORBITAL SURVEILLANCE FEED // SYS_REC_LIVE
              </span>
            </div>
            <span className="text-amber-400 text-xs font-mono">
              ALT: 2,800M // STRATOSPHERE
            </span>
          </div>

          {/* Center Targeting Reticle */}
          <div className="flex flex-col items-center justify-center pointer-events-none">
            <div className="w-32 h-32 border border-amber-400/50 rounded-full flex items-center justify-center relative animate-pulse">
              <div className="absolute w-40 h-0.5 bg-amber-400/30" />
              <div className="absolute h-40 w-0.5 bg-amber-400/30" />
              <div className="w-3 h-3 bg-amber-400 rounded-full shadow-[0_0_15px_#f59e0b]" />
            </div>
            <div className="mt-3 px-3 py-1 bg-black/80 border border-amber-400/60 rounded text-amber-300 font-mono text-xs tracking-wider">
              CONNECTING SQUAD OPERATIVE...
            </div>
          </div>

          {/* Bottom Letterbox Bar */}
          <div className="w-full h-16 bg-black/90 backdrop-blur-xs flex items-center justify-between px-8 border-t border-white/10">
            <span className="text-neutral-400 text-xs font-mono">
              TARGET LOCK CONFIRMED • TRAJECTORY 100%
            </span>
            <span className="text-cyan-400 text-xs font-mono font-bold tracking-widest uppercase">
              DESCENT SEQUENCE INITIALIZED
            </span>
          </div>
        </div>
      )}

      {/* GTA V LOWER-THIRD CHARACTER SWITCH BANNER */}
      {playerState.characterSwitchBanner && !playerState.isSwitchingCharacter && (
        <div className="absolute top-20 left-8 pointer-events-none z-40 animate-fade-in">
          <div className="flex items-stretch shadow-2xl overflow-hidden rounded-md border border-neutral-800 backdrop-blur-md">
            <div
              className="w-3.5 shrink-0"
              style={{ backgroundColor: playerState.characterSwitchBanner.color }}
            />
            <div className="bg-black/90 px-6 py-3.5 flex flex-col">
              <span className="text-3xl font-black text-white font-['Pricedown',Impact,sans-serif] tracking-wider drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                {playerState.characterSwitchBanner.name}
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-300 mt-0.5">
                {playerState.characterSwitchBanner.subtitle}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TOP BAR: Wanted Stars & Cash */}
      <div className="absolute top-4 right-5 flex flex-col items-end gap-2 pointer-events-auto">
        {/* Wanted Stars (1 to 5) */}
        <div className="flex items-center gap-1.5 bg-black/80 px-4 py-2 rounded-md border border-neutral-800 shadow-xl">
          {[1, 2, 3, 4, 5].map((star) => {
            const isWanted = star <= playerState.wantedStars;
            const isCooling = playerState.wantedCooling;
            return (
              <span
                key={star}
                className={`text-2xl transition-all duration-200 ${
                  isWanted
                    ? isCooling
                      ? 'text-neutral-400 animate-ping'
                      : 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)] scale-110'
                    : 'text-neutral-700'
                }`}
              >
                ★
              </span>
            );
          })}
        </div>

        {/* Wanted Cooldown Progress if losing cops */}
        {playerState.wantedCooling && playerState.wantedStars > 0 && (
          <div className="bg-black/85 px-3 py-1 rounded border border-blue-500/50 flex items-center gap-2">
            <span className="text-xs font-bold tracking-wider text-blue-400 uppercase">EVADING COPS</span>
            <div className="w-24 h-2 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${Math.round(playerState.wantedCoolingProgress * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Cash Balance in Authentic GTA Green Display */}
        <div className="bg-black/80 px-5 py-2 rounded-md border border-neutral-800 shadow-2xl flex items-center gap-1">
          <span className="text-3xl font-black text-emerald-400 tracking-wider font-['Pricedown',Impact,sans-serif] drop-shadow-[0_2px_10px_rgba(52,211,153,0.4)]">
            ${playerState.money.toLocaleString()}
          </span>
        </div>

        {/* Current Weapon & Ammo Card */}
        <div
          onClick={onOpenWeaponWheel}
          className="bg-black/85 border border-neutral-700 px-4 py-2 rounded-md flex items-center gap-3 cursor-pointer hover:border-amber-400 transition-all shadow-xl group"
          title="Click or press TAB to change weapon"
        >
          <Crosshair className="w-5 h-5 text-amber-400 group-hover:rotate-45 transition-transform" />
          <div className="flex flex-col items-end">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              {playerState.weapons[playerState.selectedWeapon]?.name || 'Weapon'}
            </span>
            <span className="text-base font-bold text-white tracking-widest">
              {playerState.selectedWeapon === 'fist'
                ? '∞'
                : `${playerState.weapons[playerState.selectedWeapon]?.ammo || 60} / ∞`}
            </span>
          </div>
        </div>
      </div>

      {/* TOP-LEFT: Active Mission Directive or Los Santos Logo */}
      <div className="absolute top-4 left-5 flex flex-col gap-2 max-w-sm pointer-events-auto">
        <div className="flex items-center gap-2.5 bg-black/80 px-4 py-2 rounded-md border border-neutral-800 shadow-xl">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-lg font-black tracking-wider text-amber-400 font-['Pricedown',Impact,sans-serif]">
            LOS SANTOS
          </span>
          <span className="text-xs font-bold text-neutral-400 ml-auto bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
            SAN ANDREAS
          </span>
          {onOpenDownload && (
            <button
              onClick={onOpenDownload}
              className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-black px-2 py-1 rounded text-[11px] font-black cursor-pointer transition shadow hover:scale-105"
              title="डाउनलोड करें (Download Game)"
            >
              <Download className="w-3 h-3" />
              <span>डाउनलोड</span>
            </button>
          )}
        </div>

        {/* Active Mission Card */}
        {playerState.currentMission && (
          <div className="bg-black/90 border-l-4 border-amber-500 px-4 py-2.5 rounded-r-md shadow-2xl backdrop-blur-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                ACTIVE HEIST / MISSION
              </span>
              <span className="text-xs font-semibold text-emerald-400">
                +${playerState.currentMission.reward.toLocaleString()}
              </span>
            </div>
            <p className="text-sm font-bold text-white mt-0.5">{playerState.currentMission.title}</p>
            <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
              {playerState.currentMission.description}
            </p>
            {missionBlip && (
              <span className="inline-block mt-1 text-[11px] font-semibold text-amber-300">
                Target Distance: {missionBlip.dist}m (Follow Yellow Waypoint)
              </span>
            )}
          </div>
        )}
      </div>

      {/* BOTTOM-LEFT: Authentic GTA V Mini-Map Radar & Stats Bars */}
      <div className="absolute bottom-5 left-5 flex flex-col gap-2 pointer-events-auto">
        {/* Circular Mini-Map Radar */}
        <div className="relative w-[150px] h-[150px] rounded-full bg-neutral-950/90 border-2 border-neutral-700 overflow-hidden shadow-2xl backdrop-blur-sm">
          {/* Radar Background grid */}
          <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
          
          {/* Street axes lines representing city streets */}
          <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-neutral-700/60 -translate-y-1/2" />
          <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-neutral-700/60 -translate-x-1/2" />

          {/* Wanted Search Radius Circle (if wanted) */}
          {playerState.wantedStars > 0 && (
            <div className="absolute inset-2 rounded-full border-2 border-red-500/60 bg-red-500/10 animate-pulse pointer-events-none" />
          )}

          {/* Mission Target Yellow Blip */}
          {missionBlip && (
            <div
              className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full bg-amber-400 border border-black animate-ping shadow-[0_0_10px_#f59e0b]"
              style={{ left: missionBlip.x, top: missionBlip.y }}
            />
          )}
          {missionBlip && (
            <div
              className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full bg-amber-400 border-2 border-black z-10"
              style={{ left: missionBlip.x, top: missionBlip.y }}
            />
          )}

          {/* Major Landmarks Radar Icons */}
          {landmarkBlips.map((lm, idx) => (
            <div
              key={idx}
              title={`${lm.name} (${lm.dist}m)`}
              className="absolute text-[10px] -ml-2 -mt-2 z-10 select-none pointer-events-none drop-shadow"
              style={{ left: lm.bx, top: lm.by }}
            >
              {lm.icon}
            </div>
          ))}

          {/* Center Player Direction Chevron (White Arrow) */}
          <div
            className="absolute w-4 h-4 left-1/2 top-1/2 -ml-2 -mt-2 z-20 transition-transform duration-75"
            style={{
              transform: `rotate(${-(playerState.headingAngle * 180) / Math.PI + 180}deg)`,
            }}
          >
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[14px] border-b-white drop-shadow-[0_0_4px_black]" />
          </div>

          {/* Radar Compass N Marker */}
          <span className="absolute top-1.5 left-1/2 -translate-x-1/2 text-[10px] font-black text-neutral-400 tracking-tighter">
            N
          </span>
        </div>

        {/* Trio Stat Bars: Health (Green), Armor (Blue), Special Ability (Yellow) */}
        <div className="flex flex-col gap-1 w-[150px]">
          {/* Health Bar */}
          <div className="flex items-center gap-1.5 bg-black/85 px-2 py-1 rounded border border-neutral-800">
            <Heart className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <div className="w-full h-2.5 bg-neutral-900 rounded-sm overflow-hidden border border-neutral-800">
              <div
                className="h-full bg-emerald-500 transition-all duration-150"
                style={{ width: `${Math.max(0, playerState.health)}%` }}
              />
            </div>
          </div>

          {/* Armor Bar */}
          <div className="flex items-center gap-1.5 bg-black/85 px-2 py-1 rounded border border-neutral-800">
            <Shield className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <div className="w-full h-2.5 bg-neutral-900 rounded-sm overflow-hidden border border-neutral-800">
              <div
                className="h-full bg-blue-500 transition-all duration-150"
                style={{ width: `${Math.max(0, playerState.armor)}%` }}
              />
            </div>
          </div>

          {/* Special Ability Meter */}
          <div className="flex items-center gap-1.5 bg-black/85 px-2 py-1 rounded border border-neutral-800">
            <Zap className={`w-3.5 h-3.5 shrink-0 ${playerState.isSpecialActive ? 'text-yellow-400 animate-pulse' : 'text-yellow-500'}`} />
            <div className="w-full h-2.5 bg-neutral-900 rounded-sm overflow-hidden border border-neutral-800">
              <div
                className={`h-full transition-all duration-150 ${playerState.isSpecialActive ? 'bg-yellow-300' : 'bg-yellow-500'}`}
                style={{ width: `${Math.max(0, playerState.specialMeter)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM CENTER: Vehicle Speedometer / Nitro / Controls Prompts */}
      <div className="absolute bottom-5 inset-x-0 flex flex-col items-center gap-2 pointer-events-none">
        {playerState.inVehicle && (
          <div className="bg-black/85 border border-neutral-700 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-6 pointer-events-auto backdrop-blur-xs">
            {/* Speedometer / Airspeed */}
            <div className="flex flex-col items-center">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white font-mono tracking-tight">
                  {playerState.vehicleSpeedMph}
                </span>
                <span className="text-xs font-bold text-neutral-400 uppercase">MPH</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-neutral-400 mt-0.5">
                <Gauge className="w-3 h-3 text-amber-400" />
                <span>{playerState.inHelicopter ? 'AIRSPEED' : `GEAR ${Math.min(5, Math.floor(playerState.vehicleSpeedMph / 18) + 1)}`}</span>
              </div>
            </div>

            <div className="w-px h-10 bg-neutral-800" />

            {/* Altitude (Helicopter) or Nitro (Car) */}
            {playerState.inHelicopter ? (
              <div className="flex flex-col items-start gap-1 w-28">
                <div className="flex justify-between w-full text-[11px] font-bold">
                  <span className="text-sky-400">ALTITUDE</span>
                  <span className="text-white font-mono">{playerState.altitude || 0}m</span>
                </div>
                <div className="w-full h-2.5 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                  <div
                    className="h-full bg-sky-400 shadow-[0_0_8px_#38bdf8] transition-all"
                    style={{ width: `${Math.min(100, ((playerState.altitude || 0) / 120) * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-neutral-400">SPACE: Up | CTRL: Down</span>
              </div>
            ) : (
              <div className="flex flex-col items-start gap-1 w-28">
                <div className="flex justify-between w-full text-[11px] font-bold">
                  <span className="text-cyan-400">NITRO BOOST</span>
                  <span className="text-neutral-400">{Math.round(playerState.nitroRemaining)}%</span>
                </div>
                <div className="w-full h-2.5 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                  <div
                    className="h-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] transition-all"
                    style={{ width: `${playerState.nitroRemaining}%` }}
                  />
                </div>
                <span className="text-[10px] text-neutral-400">Hold SHIFT to Boost</span>
              </div>
            )}

            <div className="w-px h-10 bg-neutral-800" />

            {/* Vehicle Damage status */}
            <div className="flex flex-col items-start gap-1 w-24">
              <div className="flex justify-between w-full text-[11px] font-bold">
                <span className="text-neutral-300">{playerState.inHelicopter ? 'CHOPPER' : 'VEHICLE'}</span>
                <span className="text-emerald-400">{Math.round((playerState.vehicleHealth / playerState.vehicleMaxHealth) * 100)}%</span>
              </div>
              <div className="w-full h-2.5 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${Math.max(0, (playerState.vehicleHealth / playerState.vehicleMaxHealth) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-neutral-400">{playerState.inHelicopter ? 'LMB: Fire Rockets' : 'Press E to Exit'}</span>
            </div>
          </div>
        )}

        {/* Compact Keybind Controls Bar */}
        <div className="bg-black/75 px-4 py-1.5 rounded-full border border-neutral-800 text-[11px] font-semibold text-neutral-300 flex items-center gap-3 shadow-md pointer-events-auto">
          {playerState.inHelicopter ? (
            <>
              <span><kbd className="bg-neutral-800 px-1.5 py-0.5 rounded text-white">W/S</kbd> Pitch Tilt</span>
              <span><kbd className="bg-neutral-800 px-1.5 py-0.5 rounded text-white">A/D</kbd> Rudder Turn</span>
              <span><kbd className="bg-neutral-800 px-1.5 py-0.5 rounded text-white">SPACE</kbd> Climb</span>
              <span><kbd className="bg-neutral-800 px-1.5 py-0.5 rounded text-white">CTRL</kbd> Descend</span>
              <span><kbd className="bg-neutral-800 px-1.5 py-0.5 rounded text-white">LMB</kbd> Rockets</span>
              <span><kbd className="bg-neutral-800 px-1.5 py-0.5 rounded text-white">E</kbd> Exit</span>
            </>
          ) : (
            <>
              <span><kbd className="bg-neutral-800 px-1.5 py-0.5 rounded text-white">WASD</kbd> Move/Drive</span>
              <span><kbd className="bg-neutral-800 px-1.5 py-0.5 rounded text-white">E</kbd> Enter/Exit</span>
              <span><kbd className="bg-neutral-800 px-1.5 py-0.5 rounded text-white">SHIFT</kbd> Sprint/Nitro</span>
              <span><kbd className="bg-neutral-800 px-1.5 py-0.5 rounded text-white">SPACE</kbd> Handbrake</span>
              <span><kbd className="bg-neutral-800 px-1.5 py-0.5 rounded text-white">TAB</kbd> Weapons</span>
              <span><kbd className="bg-neutral-800 px-1.5 py-0.5 rounded text-white">P</kbd> iFruit Phone</span>
              <span><kbd className="bg-neutral-800 px-1.5 py-0.5 rounded text-white">X</kbd> Special</span>
            </>
          )}
        </div>
      </div>

      {/* BOTTOM-RIGHT: Quick Action Buttons & Radio Station */}
      <div className="absolute bottom-5 right-5 flex flex-col items-end gap-2.5 pointer-events-auto">
        {/* Radio Station Widget */}
        <div
          onClick={onToggleRadio}
          className="bg-black/85 border border-neutral-700 px-3.5 py-2 rounded-lg flex items-center gap-2.5 cursor-pointer hover:border-amber-400 transition-all shadow-xl group"
          title="Click or press R to change Radio Station"
        >
          <Radio className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
          <div className="flex flex-col items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: currentRadioStation.color }}>
              {currentRadioStation.name}
            </span>
            <span className="text-xs font-semibold text-neutral-300 max-w-[140px] truncate">
              {currentRadioStation.currentTrack}
            </span>
          </div>
        </div>

        {/* Action Buttons: Phone, Character Switcher, Enter Car, Mute */}
        <div className="flex items-center gap-2">
          {/* Enter/Exit Vehicle Button */}
          <button
            onClick={onEnterVehicle}
            className="px-3 py-2 bg-neutral-900/90 border border-neutral-700 hover:border-amber-400 text-xs font-bold text-white rounded-md transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
          >
            {playerState.inVehicle ? 'Exit Car [E]' : 'Drive Car [E]'}
          </button>

          {/* iFruit Phone Button */}
          <button
            onClick={onTogglePhone}
            className="px-3 py-2 bg-neutral-900/90 border border-neutral-700 hover:border-emerald-400 text-xs font-bold text-white rounded-md transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <span className="text-emerald-400">📱</span> iFruit [P]
          </button>

          {/* Character Switcher Button */}
          <button
            onClick={onToggleCharacterWheel}
            className="px-3 py-2 bg-neutral-900/90 border border-neutral-700 hover:border-blue-400 text-xs font-bold text-white rounded-md transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <span className="uppercase text-amber-400">{playerState.character[0]}</span> Trio Switch
          </button>

          {/* Sound Mute Toggle */}
          <button
            onClick={onToggleMute}
            className="px-2.5 py-2 bg-neutral-900/90 border border-neutral-700 hover:border-neutral-400 text-xs font-bold text-neutral-300 rounded-md transition-all shadow-lg cursor-pointer"
            title="Toggle Audio / Mute"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>
    </div>
  );
};
