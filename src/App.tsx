import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/GameEngine';
import { HUD } from './components/HUD';
import { WeaponWheel } from './components/WeaponWheel';
import { Phone } from './components/Phone';
import { CharacterWheel } from './components/CharacterWheel';
import { GraphicsModal } from './components/GraphicsModal';
import { LosSantosCustomsModal } from './components/LosSantosCustomsModal';
import { TouchControls } from './components/TouchControls';
import { CharacterId, Mission, PlayerState, WeaponType, GraphicsSettings } from './types';
import { sound } from './audio/SoundEffects';
import confetti from 'canvas-confetti';
import { HelpCircle, Smartphone, Sliders, Sparkles, Users } from 'lucide-react';

const INITIAL_STATE: PlayerState = {
  health: 100,
  maxHealth: 100,
  armor: 100,
  maxArmor: 100,
  specialMeter: 100,
  maxSpecialMeter: 100,
  isSpecialActive: false,
  character: 'franklin',
  money: 25000,
  wantedStars: 0,
  wantedCooling: false,
  wantedCoolingProgress: 0,
  inVehicle: false,
  vehicleSpeedMph: 0,
  vehicleHealth: 1000,
  vehicleMaxHealth: 1000,
  nitroRemaining: 100,
  selectedWeapon: 'pistol',
  weapons: {
    fist: { id: 'fist', name: 'Fists', ammo: 999, maxAmmo: 999, damage: 25, fireRate: 2, range: 2, icon: '👊', unlocked: true },
    pistol: { id: 'pistol', name: 'Combat Pistol', ammo: 120, maxAmmo: 300, damage: 45, fireRate: 3.5, range: 45, icon: '🔫', unlocked: true },
    smg: { id: 'smg', name: 'Micro SMG', ammo: 240, maxAmmo: 600, damage: 32, fireRate: 9, range: 40, icon: '⚡', unlocked: true },
    rifle: { id: 'rifle', name: 'Carbine Rifle', ammo: 180, maxAmmo: 450, damage: 65, fireRate: 6, range: 75, icon: '🎯', unlocked: true },
    rpg: { id: 'rpg', name: 'RPG-7', ammo: 15, maxAmmo: 25, damage: 500, fireRate: 0.8, range: 90, icon: '🚀', unlocked: true },
    grenade: { id: 'grenade', name: 'Sticky Bomb', ammo: 10, maxAmmo: 25, damage: 350, fireRate: 1, range: 30, icon: '💣', unlocked: true },
  },
  currentRadio: 'radio_los_santos',
  radioVolume: 0.5,
  currentMission: null,
  position: { x: 0, y: 1, z: 0 },
  headingAngle: 0,
  graphicsSettings: {
    quality: 'super_ultra',
    timeOfDay: 'sunset',
    shadows: true,
    reflections: true,
    volumetricLights: true,
    motionBlur: true,
    highResTextures: true,
  },
  isSwitchingCharacter: false,
  characterSwitchBanner: null,
};

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [playerState, setPlayerState] = useState<PlayerState>(INITIAL_STATE);
  const [isWeaponWheelOpen, setIsWeaponWheelOpen] = useState(false);
  const [isPhoneOpen, setIsPhoneOpen] = useState(false);
  const [isCharacterWheelOpen, setIsCharacterWheelOpen] = useState(false);
  const [isGraphicsOpen, setIsGraphicsOpen] = useState(false);
  const [isCustomsOpen, setIsCustomsOpen] = useState(false);
  const [showTouchControls, setShowTouchControls] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Celebratory UI banners
  const [stuntBonus, setStuntBonus] = useState<number | null>(null);
  const [missionPassedBanner, setMissionPassedBanner] = useState<string | null>(null);
  const [wastedBanner, setWastedBanner] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Detect mobile / touch screens
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      setShowTouchControls(true);
    }

    const engine = new GameEngine(containerRef.current, {
      onStateUpdate: (updates) => {
        setPlayerState((prev) => ({ ...prev, ...updates }));
      },
      onMissionCompleted: (mission) => {
        setMissionPassedBanner(`${mission.title} (+$${mission.reward.toLocaleString()})`);
        try {
          confetti({
            particleCount: 80,
            spread: 90,
            origin: { y: 0.3 },
          });
        } catch {}
        setTimeout(() => setMissionPassedBanner(null), 4000);
      },
      onPlayerWasted: () => {
        setWastedBanner(true);
      },
      onStuntJump: (score) => {
        setStuntBonus(score);
        setTimeout(() => setStuntBonus(null), 2500);
      },
      onOpenCustoms: () => {
        setIsCustomsOpen(true);
      },
      onToggleCharacterWheel: () => {
        setIsCharacterWheelOpen((prev) => !prev);
      },
      onToggleGraphicsModal: () => {
        setIsGraphicsOpen((prev) => !prev);
      },
    });

    engineRef.current = engine;

    // Keyboard shortcuts for modals
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Tab') {
        e.preventDefault();
        setIsWeaponWheelOpen((prev) => !prev);
      } else if (e.code === 'KeyP' || e.code === 'ArrowUp') {
        setIsPhoneOpen((prev) => !prev);
      } else if (e.code === 'KeyC' || e.code === 'KeyV') {
        setIsCharacterWheelOpen((prev) => !prev);
      } else if (e.code === 'KeyG') {
        setIsGraphicsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      engine.dispose();
    };
  }, []);

  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const handleSelectWeapon = (weapon: WeaponType) => {
    engineRef.current?.selectWeapon(weapon);
  };

  const handleSelectCharacter = (char: CharacterId) => {
    engineRef.current?.switchCharacter(char);
  };

  const handleClearWanted = () => {
    engineRef.current?.clearWantedLevel();
  };

  const handleSpawnSupercar = () => {
    engineRef.current?.spawnSupercarService();
  };

  const handleMaxWanted = () => {
    engineRef.current?.addWantedStars(5);
  };

  const handleGiveWeapons = () => {
    setPlayerState((prev) => {
      const updatedWeapons = { ...prev.weapons };
      Object.keys(updatedWeapons).forEach((k) => {
        const key = k as WeaponType;
        updatedWeapons[key].ammo = 999;
      });
      return { ...prev, weapons: updatedWeapons, money: prev.money + 50000 };
    });
  };

  const handleStartMission = (mission: Mission) => {
    engineRef.current?.setActiveMission(mission);
  };

  const handleApplyColor = (color: string) => {
    engineRef.current?.applyCustomsUpgrade(color, 0);
  };

  const handleUpgradeEngine = (level: number, cost: number) => {
    if (playerState.money >= cost) {
      setPlayerState((prev) => ({ ...prev, money: prev.money - cost }));
      engineRef.current?.applyCustomsUpgrade('#f59e0b', level);
    }
  };

  const handleRepairVehicle = () => {
    if (playerState.money >= 500) {
      setPlayerState((prev) => ({
        ...prev,
        money: prev.money - 500,
        vehicleHealth: prev.vehicleMaxHealth,
      }));
      engineRef.current?.applyCustomsUpgrade('#f59e0b', 0);
    }
  };

  // Virtual key simulated events for touch controls
  const handleVirtualKeyDown = (code: string) => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code }));
  };

  const handleVirtualKeyUp = (code: string) => {
    window.dispatchEvent(new KeyboardEvent('keyup', { code }));
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-neutral-950 font-sans">
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 z-0 cursor-crosshair" />

      {/* GTA V HUD Overlay */}
      <HUD
        playerState={playerState}
        onOpenWeaponWheel={() => setIsWeaponWheelOpen(true)}
        onTogglePhone={() => setIsPhoneOpen((prev) => !prev)}
        onToggleCharacterWheel={() => setIsCharacterWheelOpen(true)}
        onToggleRadio={() => engineRef.current?.cycleRadio()}
        onEnterVehicle={() => engineRef.current?.toggleEnterVehicle()}
        onToggleMute={handleToggleMute}
        isMuted={isMuted}
        stuntBonus={stuntBonus}
        missionPassedBanner={missionPassedBanner}
        wastedBanner={wastedBanner}
      />

      {/* Quick Access Top Floating Toggles */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-30 pointer-events-auto flex-wrap justify-center max-w-full px-2">
        <button
          onClick={() => setIsGraphicsOpen(true)}
          className="px-3.5 py-1.5 bg-gradient-to-r from-amber-600/90 to-yellow-600/90 hover:from-amber-500 hover:to-yellow-500 text-black font-black text-xs rounded-md transition shadow-[0_0_15px_rgba(245,158,11,0.35)] border border-yellow-300 flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
        >
          <Sparkles className="w-3.5 h-3.5 fill-black" />
          <span>Graphics: {playerState.graphicsSettings?.quality === 'super_ultra' ? 'Super Ultra' : playerState.graphicsSettings?.quality || 'Super Ultra'}</span>
        </button>

        <button
          onClick={() => setIsCharacterWheelOpen(true)}
          className="px-3 py-1.5 bg-black/85 hover:bg-neutral-800 border border-neutral-700 text-xs font-bold text-white rounded-md transition shadow flex items-center gap-1.5 cursor-pointer"
        >
          <Users className="w-4 h-4 text-cyan-400" /> Switch Character (C)
        </button>

        <button
          onClick={() => setShowHelpModal(true)}
          className="px-3 py-1.5 bg-black/80 hover:bg-neutral-800 border border-neutral-700 text-xs font-bold text-neutral-300 rounded-md transition shadow flex items-center gap-1 cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 text-amber-400" /> Controls & Guide
        </button>

        <button
          onClick={() => setShowTouchControls((prev) => !prev)}
          className={`px-3 py-1.5 border text-xs font-bold rounded-md transition shadow flex items-center gap-1 cursor-pointer ${
            showTouchControls
              ? 'bg-amber-500/20 border-amber-400 text-amber-300'
              : 'bg-black/80 border-neutral-700 text-neutral-300 hover:bg-neutral-800'
          }`}
        >
          <Smartphone className="w-4 h-4" /> Touch Controls
        </button>

        <button
          onClick={() => setIsCustomsOpen(true)}
          className="px-3 py-1.5 bg-black/80 hover:bg-neutral-800 border border-neutral-700 text-xs font-bold text-emerald-400 rounded-md transition shadow flex items-center gap-1 cursor-pointer"
        >
          <Sliders className="w-4 h-4" /> LS Customs
        </button>

        <button
          onClick={() => engineRef.current?.spawnHelicopterService()}
          className="px-3 py-1.5 bg-sky-950/80 hover:bg-sky-900 border border-sky-500 text-xs font-bold text-sky-300 rounded-md transition shadow flex items-center gap-1 cursor-pointer"
          title="Spawn Attack Helicopter"
        >
          <span>🚁</span> Spawn Heli
        </button>

        <button
          onClick={() => engineRef.current?.spawnTankService()}
          className="px-3 py-1.5 bg-yellow-950/80 hover:bg-yellow-900 border border-yellow-500 text-xs font-bold text-yellow-300 rounded-md transition shadow flex items-center gap-1 cursor-pointer"
          title="Spawn Military Tank"
        >
          <span>🎖️</span> Spawn Tank
        </button>
      </div>

      {/* Weapon Wheel Modal (Tab) */}
      <WeaponWheel
        isOpen={isWeaponWheelOpen}
        selectedWeapon={playerState.selectedWeapon}
        weapons={playerState.weapons}
        onSelectWeapon={handleSelectWeapon}
        onClose={() => setIsWeaponWheelOpen(false)}
      />

      {/* iFruit Smartphone (P) */}
      <Phone
        isOpen={isPhoneOpen}
        money={playerState.money}
        wantedStars={playerState.wantedStars}
        onClose={() => setIsPhoneOpen(false)}
        onClearWanted={handleClearWanted}
        onSpawnSupercar={handleSpawnSupercar}
        onSpawnHelicopter={() => engineRef.current?.spawnHelicopterService()}
        onSpawnTank={() => engineRef.current?.spawnTankService()}
        onMaxWanted={handleMaxWanted}
        onGiveWeapons={handleGiveWeapons}
        onStartMission={handleStartMission}
        onOpenCustoms={() => setIsCustomsOpen(true)}
      />

      {/* Trio Character Selector Modal (C / Alt) */}
      <CharacterWheel
        isOpen={isCharacterWheelOpen}
        activeCharacter={playerState.character}
        onSelectCharacter={handleSelectCharacter}
        onClose={() => setIsCharacterWheelOpen(false)}
      />

      {/* Super Ultra Graphics & Atmosphere Settings Modal (G) */}
      <GraphicsModal
        isOpen={isGraphicsOpen}
        currentSettings={playerState.graphicsSettings || {
          quality: 'super_ultra',
          timeOfDay: 'sunset',
          shadows: true,
          reflections: true,
          volumetricLights: true,
          motionBlur: true,
          highResTextures: true,
        }}
        onApplySettings={(settings) => engineRef.current?.applyGraphicsSettings(settings)}
        onClose={() => setIsGraphicsOpen(false)}
      />

      {/* Los Santos Customs Tuning Garage */}
      <LosSantosCustomsModal
        isOpen={isCustomsOpen}
        money={playerState.money}
        inVehicle={playerState.inVehicle}
        onClose={() => setIsCustomsOpen(false)}
        onApplyColor={handleApplyColor}
        onUpgradeEngine={handleUpgradeEngine}
        onRepairVehicle={handleRepairVehicle}
      />

      {/* Virtual On-screen Touch Controls */}
      {showTouchControls && (
        <TouchControls
          inVehicle={playerState.inVehicle}
          inHelicopter={playerState.inHelicopter}
          onKeyDown={handleVirtualKeyDown}
          onKeyUp={handleVirtualKeyUp}
          onAttack={() => engineRef.current?.performAttack()}
          onEnterVehicle={() => engineRef.current?.toggleEnterVehicle()}
          onHorn={() => sound.playHorn()}
          onSpecial={() => engineRef.current?.toggleSpecialAbility()}
          onWeaponWheel={() => setIsWeaponWheelOpen(true)}
          onPhone={() => setIsPhoneOpen(true)}
        />
      )}

      {/* Help & Keybinds Dialog */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
          <div className="bg-neutral-900 border-2 border-amber-500 rounded-3xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
              <span className="text-2xl font-black text-amber-400 font-['Pricedown',Impact,sans-serif] tracking-wider">
                LOS SANTOS PLAYBOOK & CONTROLS
              </span>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-neutral-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm text-neutral-300 max-h-[70vh] overflow-y-auto pr-2">
              <div className="bg-sky-950/60 p-3 rounded-lg border border-sky-600/50">
                <span className="font-bold text-sky-400 block text-xs uppercase tracking-wider mb-1">
                  🚁 Helicopter Flight Controls
                </span>
                <p className="text-xs text-sky-200 leading-relaxed">
                  <strong>W / S:</strong> Pitch forward / backward &middot; <strong>A / D:</strong> Rudder yaw turn &middot; <strong>SPACEBAR / SHIFT:</strong> Ascend &middot; <strong>CTRL / C:</strong> Descend &middot; <strong>Left Click:</strong> Fire aerial rocket pods!
                </p>
              </div>

              <div className="bg-red-950/60 p-3 rounded-lg border border-red-600/50">
                <span className="font-bold text-red-400 block text-xs uppercase tracking-wider mb-1">
                  🎖️ Fort Zancudo & LSIA Airport
                </span>
                <p className="text-xs text-red-200 leading-relaxed">
                  Visit the <strong>LSIA Airport</strong> runway to fly planes and helicopters. Warning: <strong>Fort Zancudo Military Base</strong> is a restricted red zone with air raid sirens and SAM defenses—entering immediately triggers a 4-Star wanted level and guards!
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-neutral-800/80 p-2.5 rounded-lg">
                  <span className="font-bold text-white block">Movement / Driving</span>
                  <span className="text-xs text-neutral-400"><kbd className="bg-neutral-700 px-1 rounded">WASD</kbd> or Arrow Keys</span>
                </div>
                <div className="bg-neutral-800/80 p-2.5 rounded-lg">
                  <span className="font-bold text-white block">Enter / Exit Vehicle</span>
                  <span className="text-xs text-neutral-400"><kbd className="bg-neutral-700 px-1 rounded">E</kbd> or <kbd className="bg-neutral-700 px-1 rounded">F</kbd> near any car</span>
                </div>
                <div className="bg-neutral-800/80 p-2.5 rounded-lg">
                  <span className="font-bold text-white block">Nitro / Sprint</span>
                  <span className="text-xs text-neutral-400">Hold <kbd className="bg-neutral-700 px-1 rounded">SHIFT</kbd></span>
                </div>
                <div className="bg-neutral-800/80 p-2.5 rounded-lg">
                  <span className="font-bold text-white block">Handbrake / Jump</span>
                  <span className="text-xs text-neutral-400"><kbd className="bg-neutral-700 px-1 rounded">SPACEBAR</kbd></span>
                </div>
                <div className="bg-neutral-800/80 p-2.5 rounded-lg">
                  <span className="font-bold text-white block">Attack / Shoot</span>
                  <span className="text-xs text-neutral-400">Left Click or Touch Trigger</span>
                </div>
                <div className="bg-neutral-800/80 p-2.5 rounded-lg">
                  <span className="font-bold text-white block">Weapon Wheel</span>
                  <span className="text-xs text-neutral-400"><kbd className="bg-neutral-700 px-1 rounded">TAB</kbd> or Keys <kbd className="bg-neutral-700 px-1 rounded">1-6</kbd></span>
                </div>
                <div className="bg-neutral-800/80 p-2.5 rounded-lg">
                  <span className="font-bold text-white block">iFruit Smartphone</span>
                  <span className="text-xs text-neutral-400"><kbd className="bg-neutral-700 px-1 rounded">P</kbd> or Up Arrow</span>
                </div>
                <div className="bg-neutral-800/80 p-2.5 rounded-lg border border-cyan-500/40">
                  <span className="font-bold text-cyan-400 block">Switch Character</span>
                  <span className="text-xs text-neutral-300"><kbd className="bg-neutral-700 px-1 rounded">C</kbd> or <kbd className="bg-neutral-700 px-1 rounded">7, 8, 9</kbd> (Franklin/Michael/Trevor)</span>
                </div>
                <div className="bg-neutral-800/80 p-2.5 rounded-lg border border-yellow-500/40">
                  <span className="font-bold text-yellow-400 block">Super Ultra Graphics</span>
                  <span className="text-xs text-neutral-300"><kbd className="bg-neutral-700 px-1 rounded">G</kbd> (Shaders, 4K Shadows, Sunsets)</span>
                </div>
                <div className="bg-neutral-800/80 p-2.5 rounded-lg">
                  <span className="font-bold text-white block">Special Ability</span>
                  <span className="text-xs text-neutral-400"><kbd className="bg-neutral-700 px-1 rounded">X</kbd> or CapsLock</span>
                </div>
                <div className="bg-neutral-800/80 p-2.5 rounded-lg">
                  <span className="font-bold text-white block">Car Horn</span>
                  <span className="text-xs text-neutral-400"><kbd className="bg-neutral-700 px-1 rounded">H</kbd></span>
                </div>
                <div className="bg-neutral-800/80 p-2.5 rounded-lg">
                  <span className="font-bold text-white block">Radio Stations</span>
                  <span className="text-xs text-neutral-400"><kbd className="bg-neutral-700 px-1 rounded">R</kbd> (Hip Hop, Pop, Rock)</span>
                </div>
              </div>

              <div className="bg-neutral-800/60 p-3 rounded-lg border border-neutral-700/80">
                <span className="font-bold text-amber-400 block text-xs uppercase tracking-wider mb-1">
                  ⭐ Wanted Level & Police AI
                </span>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Stealing vehicles, hitting pedestrians, or shooting triggers police wanted stars (1 to 5 stars).
                  Police cruisers will dispatch sirens and pursue you. To lose the cops, break their line of sight and remain outside their search radius for 10 seconds!
                </p>
              </div>

              <div className="bg-neutral-800/60 p-3 rounded-lg border border-neutral-700/80">
                <span className="font-bold text-emerald-400 block text-xs uppercase tracking-wider mb-1">
                  💰 Heists & Stunts
                </span>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Open your <strong>iFruit phone (P)</strong> to start contracts like the Jewel Store Heist or Repo runs for massive cash rewards. Hit yellow stunt ramps at top speed to score stunt bonuses!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="mt-5 w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl transition cursor-pointer"
            >
              LET'S RIDE
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
