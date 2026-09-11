export type CharacterId = 'franklin' | 'michael' | 'trevor';

export interface CharacterProfile {
  id: CharacterId;
  name: string;
  specialAbilityName: string;
  specialAbilityDescription: string;
  color: string;
  avatarIcon: string;
  shirtColor: number;
  locationName: string;
  defaultVehicleName: string;
  defaultVehicleColor: string;
  quote: string;
  stats: {
    stamina: number;
    shooting: number;
    strength: number;
    stealth: number;
    flying: number;
    driving: number;
    special: number;
  };
}

export type GraphicsQuality = 'super_ultra' | 'ultra' | 'balanced' | 'performance';
export type TimeOfDay = 'sunset' | 'noon' | 'night' | 'rain';

export interface GraphicsSettings {
  quality: GraphicsQuality;
  timeOfDay: TimeOfDay;
  shadows: boolean;
  reflections: boolean;
  volumetricLights: boolean;
  motionBlur: boolean;
  highResTextures: boolean;
}

export type WeaponType = 'fist' | 'pistol' | 'smg' | 'rifle' | 'rpg' | 'grenade';

export interface WeaponData {
  id: WeaponType;
  name: string;
  ammo: number;
  maxAmmo: number;
  damage: number;
  fireRate: number; // shots per second
  range: number;
  icon: string;
  unlocked: boolean;
}

export type VehicleType = 'supercar' | 'muscle' | 'police' | 'suv' | 'sportbike' | 'sedan' | 'helicopter' | 'tank';

export interface VehicleStats {
  id: string;
  type: VehicleType;
  name: string;
  maxSpeed: number;
  acceleration: number;
  handling: number;
  health: number;
  maxHealth: number;
  color: string;
  isPolice?: boolean;
  isHelicopter?: boolean;
  isTank?: boolean;
}

export interface Mission {
  id: string;
  title: string;
  client: string;
  description: string;
  reward: number;
  targetPos: { x: number; z: number };
  targetType: 'collect' | 'assassinate' | 'stunt' | 'escape' | 'reach';
  targetRadius: number;
  completed: boolean;
  wantedStarsBonus?: number;
}

export type RadioStationId = 'radio_los_santos' | 'non_stop_pop' | 'west_coast_classics' | 'vinewood_boulevard' | 'off';

export interface RadioStation {
  id: RadioStationId;
  name: string;
  genre: string;
  currentTrack: string;
  color: string;
}

export interface PlayerState {
  health: number;
  maxHealth: number;
  armor: number;
  maxArmor: number;
  specialMeter: number;
  maxSpecialMeter: number;
  isSpecialActive: boolean;
  character: CharacterId;
  money: number;
  wantedStars: number;
  wantedCooling: boolean;
  wantedCoolingProgress: number; // 0 to 1
  inVehicle: boolean;
  inHelicopter?: boolean;
  altitude?: number;
  vehicleSpeedMph: number;
  vehicleHealth: number;
  vehicleMaxHealth: number;
  nitroRemaining: number; // 0 to 100
  selectedWeapon: WeaponType;
  weapons: Record<WeaponType, WeaponData>;
  currentRadio: RadioStationId;
  radioVolume: number;
  currentMission: Mission | null;
  position: { x: number; y: number; z: number };
  headingAngle: number;
  graphicsSettings: GraphicsSettings;
  isSwitchingCharacter: boolean;
  characterSwitchBanner: { name: string; subtitle: string; color: string } | null;
}
