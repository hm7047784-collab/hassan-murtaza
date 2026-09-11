import * as THREE from 'three';
import { CharacterId, Mission, PlayerState, RadioStationId, VehicleStats, WeaponType, GraphicsSettings, GraphicsQuality, TimeOfDay } from '../types';
import { sound } from '../audio/SoundEffects';
import { CHARACTERS_DATA } from '../components/CharacterWheel';

export interface GameEngineCallbacks {
  onStateUpdate: (state: Partial<PlayerState>) => void;
  onMissionCompleted: (mission: Mission) => void;
  onPlayerWasted: () => void;
  onStuntJump: (score: number) => void;
  onOpenCustoms: () => void;
  onToggleCharacterWheel?: () => void;
  onToggleGraphicsModal?: () => void;
}

export interface VehicleEntity {
  mesh: THREE.Group;
  stats: VehicleStats;
  velocity: THREE.Vector3;
  speed: number;
  steering: number;
  heading: number;
  isPlayer: boolean;
  isPolice: boolean;
  isTraffic: boolean;
  strobeTimer?: number;
  strobeState?: boolean;
  policeLightR?: THREE.PointLight;
  policeLightB?: THREE.PointLight;
  exhaustL?: THREE.Mesh;
  exhaustR?: THREE.Mesh;
  targetWayPoint?: THREE.Vector3;
  isHelicopter?: boolean;
  rotorMesh?: THREE.Group | THREE.Mesh;
  tailRotorMesh?: THREE.Mesh;
  altitude?: number;
  targetAltitude?: number;
  rotorRPM?: number;
  isTank?: boolean;
  turretMesh?: THREE.Mesh;
  barrelMesh?: THREE.Mesh;
}

export interface PedestrianEntity {
  mesh: THREE.Group;
  pos: THREE.Vector3;
  dir: THREE.Vector3;
  speed: number;
  health: number;
  fleeing: boolean;
  ragdoll: boolean;
  rotSpeed: number;
}

export interface ProjectileEntity {
  mesh: THREE.Mesh;
  pos: THREE.Vector3;
  velocity: THREE.Vector3;
  lifetime: number;
  damage: number;
  isRPG: boolean;
}

export interface ParticleEntity {
  mesh: THREE.Mesh | THREE.Points;
  velocity: THREE.Vector3;
  lifetime: number;
  maxLifetime: number;
}

export class GameEngine {
  private container: HTMLElement;
  private callbacks: GameEngineCallbacks;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private clock = new THREE.Clock();

  // Animation frame request ID
  private animId: number | null = null;

  // World objects
  private playerGroup!: THREE.Group;
  private playerBodyMesh!: THREE.Mesh;
  private playerHeadMesh!: THREE.Mesh;
  private playerWeaponMesh!: THREE.Mesh;
  private vehicles: VehicleEntity[] = [];
  private currentVehicle: VehicleEntity | null = null;
  private pedestrians: PedestrianEntity[] = [];
  private projectiles: ProjectileEntity[] = [];
  private particles: ParticleEntity[] = [];
  private obstacles: THREE.Box3[] = [];
  private rampBoxes: { box: THREE.Box3; dir: THREE.Vector3 }[] = [];

  // Super Ultra Graphics & Atmosphere Elements
  private hemiLight!: THREE.HemisphereLight;
  private dirLight!: THREE.DirectionalLight;
  private ambientLight!: THREE.AmbientLight;
  private sunMesh!: THREE.Mesh;
  private sunCorona!: THREE.Mesh;
  private oceanMesh!: THREE.Mesh;
  private roadMats: THREE.MeshStandardMaterial[] = [];
  private windowMats: THREE.MeshBasicMaterial[] = [];
  private beaconMeshes: THREE.Mesh[] = [];
  private beaconTimer = 0;
  private clouds: THREE.Group[] = [];
  private envMapTexture: THREE.Texture | null = null;
  private headlightConesList: THREE.Mesh[] = [];
  private graphicsSettings: GraphicsSettings = {
    quality: 'super_ultra',
    timeOfDay: 'sunset',
    shadows: true,
    reflections: true,
    volumetricLights: true,
    motionBlur: true,
    highResTextures: true,
  };

  // Character Switching & 3D Accessories
  private franklinCap: THREE.Group | null = null;
  private michaelGlasses: THREE.Mesh | null = null;
  private playerLegLeft!: THREE.Mesh;
  private playerLegRight!: THREE.Mesh;
  private isSwitchingCharacter = false;
  private switchTimer = 0;
  private switchDuration = 2.4;
  private switchStartPos = new THREE.Vector3();
  private switchTargetPos = new THREE.Vector3();
  private characterSwapped = false;
  private pendingCharacter: CharacterId | null = null;

  // Mission markers
  private missionMarkerMesh: THREE.Group | null = null;
  private activeMission: Mission | null = null;

  // Airport, Military Base & Garden Features
  private airportRadarDish: THREE.Mesh | null = null;
  private gardenFountainParticles: THREE.Points | null = null;
  private militaryAlarmTriggered = false;
  private militaryWarningTimer = 0;

  // Player state
  private playerPos = new THREE.Vector3(0, 1, 0);
  private playerVelocity = new THREE.Vector3();
  private playerHeading = 0;
  private isGrounded = true;
  private isSprinting = false;
  private health = 100;
  private armor = 100;
  private specialMeter = 100;
  private isSpecialActive = false;
  private activeCharacter: CharacterId = 'franklin';
  private money = 25000;
  private wantedStars = 0;
  private wantedCooling = false;
  private wantedCoolingTimer = 0;
  private selectedWeapon: WeaponType = 'pistol';
  private nitroRemaining = 100;
  private currentRadio: RadioStationId = 'radio_los_santos';

  // Input states
  private keys: Record<string, boolean> = {};
  private mousePos = { x: 0, y: 0 };
  private isPointerDown = false;
  private lastShotTime = 0;
  private lastMeleeTime = 0;

  // Stunt camera
  private isStuntCam = false;
  private stuntTimer = 0;

  // Camera settings
  private cameraPitch = 0.35;
  private cameraYaw = 0;
  private targetCameraPos = new THREE.Vector3();
  private targetLookAt = new THREE.Vector3();

  // Raycaster for shooting & clicks
  private raycaster = new THREE.Raycaster();

  constructor(container: HTMLElement, callbacks: GameEngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.initThree();
    this.buildCity();
    this.createPlayer();
    this.spawnInitialVehicles();
    this.spawnPedestrians();
    this.setupEventListeners();
    this.startLoop();
  }

  private initThree() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    // Start with iconic Los Santos Golden Sunset Sky
    this.scene.background = new THREE.Color(0xd97736);
    this.scene.fog = new THREE.FogExp2(0xd97736, 0.003);

    this.camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 1200);
    this.camera.position.set(0, 6, 12);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.container.appendChild(this.renderer.domElement);

    // Dynamic Hemisphere Light (Atmospheric sky + ground bounce)
    this.hemiLight = new THREE.HemisphereLight(0xffaa77, 0x443355, 1.0);
    this.scene.add(this.hemiLight);

    // Super Ultra Directional Sun Light (4K Soft Shadows)
    this.dirLight = new THREE.DirectionalLight(0xffaa44, 1.8);
    this.dirLight.position.set(160, 110, -130);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 4096;
    this.dirLight.shadow.mapSize.height = 4096;
    this.dirLight.shadow.bias = -0.00015;
    this.dirLight.shadow.radius = 2.5;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 500;
    const d = 150;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.scene.add(this.dirLight);

    // Ambient bounce light
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    this.scene.add(this.ambientLight);

    // Dynamic Sun Disk and Corona in Skybox
    const sunGeo = new THREE.SphereGeometry(18, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffedd5 });
    this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
    this.sunMesh.position.set(380, 240, -320);
    this.scene.add(this.sunMesh);

    const coronaGeo = new THREE.RingGeometry(18, 48, 24);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
    });
    this.sunCorona = new THREE.Mesh(coronaGeo, coronaMat);
    this.sunCorona.position.copy(this.sunMesh.position);
    this.sunCorona.lookAt(0, 0, 0);
    this.scene.add(this.sunCorona);

    // Initialize Realistic PBR Reflection Environment Map
    this.updateEnvironmentMap('sunset');
  }

  // Dynamic Equirectangular Environment Map for Ultra Realistic Reflections
  private updateEnvironmentMap(time: TimeOfDay) {
    let skyHex = 0xd97736;
    let horizonHex = 0xf59e0b;
    let groundHex = 0x24282c;

    if (time === 'noon') {
      skyHex = 0x38bdf8;
      horizonHex = 0xe0f2fe;
      groundHex = 0x334155;
    } else if (time === 'night') {
      skyHex = 0x090d16;
      horizonHex = 0x1e1b4b;
      groundHex = 0x020617;
    } else if (time === 'rain') {
      skyHex = 0x334155;
      horizonHex = 0x64748b;
      groundHex = 0x0f172a;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 0, 128);
      const hexToStr = (hex: number) => '#' + hex.toString(16).padStart(6, '0');
      grad.addColorStop(0, hexToStr(skyHex));
      grad.addColorStop(0.5, hexToStr(horizonHex));
      grad.addColorStop(0.52, '#18181b');
      grad.addColorStop(1, hexToStr(groundHex));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 128);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    if (this.envMapTexture) {
      this.envMapTexture.dispose();
    }
    this.envMapTexture = texture;
    this.scene.environment = this.envMapTexture;
  }

  // Build vibrant Los Santos City grid
  private buildCity() {
    // Ground plane - Asphalt & terrain
    const groundGeo = new THREE.PlaneGeometry(600, 600);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x24282c });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Ocean on West Side with dynamic animated specular water
    const oceanGeo = new THREE.PlaneGeometry(220, 600, 32, 32);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.08,
      metalness: 0.85,
    });
    this.oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
    this.oceanMesh.rotation.x = -Math.PI / 2;
    this.oceanMesh.position.set(-280, -0.4, 0);
    this.scene.add(this.oceanMesh);

    // Beach Sand
    const sandGeo = new THREE.PlaneGeometry(40, 600);
    const sandMat = new THREE.MeshLambertMaterial({ color: 0xf6d7b0 });
    const sand = new THREE.Mesh(sandGeo, sandMat);
    sand.rotation.x = -Math.PI / 2;
    sand.position.set(-160, -0.1, 0);
    this.scene.add(sand);

    // City grid configuration
    const blockSize = 50;
    const roadWidth = 14;
    const gridCount = 6;

    // Road markings & crosswalks
    for (let x = -gridCount * blockSize; x <= gridCount * blockSize; x += blockSize) {
      this.createRoadStrip(x, 0, roadWidth, 600, true);
    }
    for (let z = -gridCount * blockSize; z <= gridCount * blockSize; z += blockSize) {
      this.createRoadStrip(0, z, 600, roadWidth, false);
    }

    // City Blocks: Downtown Skyscrapers, Vinewood Mansions, Bank, LS Customs
    for (let i = -2; i <= 3; i++) {
      for (let j = -3; j <= 3; j++) {
        const cx = i * blockSize + blockSize / 2;
        const cz = j * blockSize + blockSize / 2;

        // Skip roads and water
        if (cx < -140) continue;

        // Special buildings:
        if (i === 0 && j === 0) {
          // Maze Bank Tower (Central Downtown Mega Skyscraper)
          this.createMazeBankTower(cx, cz);
        } else if (i === 1 && j === 0) {
          // Los Santos Customs Garage
          this.createLSCustomsShop(cx, cz);
        } else if (i === -1 && j === 1) {
          // Union Depository Bank
          this.createBankBuilding(cx, cz);
        } else if (i === 2 && j === 2) {
          // Police Department HQ
          this.createPoliceStation(cx, cz);
        } else if (i === -1 && j === 0) {
          // Central Botanical Garden & Legion Square Park
          this.createCentralGarden(cx, cz);
        } else if (i === 0 && j === -1) {
          // Mount Zonah Medical Center & Rooftop Helipad
          this.createMountZonahHospital(cx, cz);
        } else if (i === -1 && j === -1) {
          // Arcadius Business Tower Luxury High-Rise
          this.createArcadiusSkyscraper(cx, cz);
        } else if (i >= 2 && j >= 0 && j <= 1) {
          // Grove Street Residential Suburban Houses
          this.createResidentialNeighborhood(cx, cz);
        } else if (i >= 2) {
          // Residential / Vinewood luxury villas
          this.createVillas(cx, cz);
        } else {
          // Modern commercial skyscrapers & high-rises
          this.createSkyscraperBlock(cx, cz);
        }
      }
    }

    // Los Santos International Airport (LSIA)
    this.createAirport();

    // Fort Zancudo Military Base
    this.createMilitaryBase();

    // Stunt ramps scattered for iconic GTA stunts
    this.createStuntRamp(new THREE.Vector3(25, 0, 50), 0);
    this.createStuntRamp(new THREE.Vector3(-25, 0, -50), Math.PI);
    this.createStuntRamp(new THREE.Vector3(75, 0, -25), Math.PI / 2);
    this.createStuntRamp(new THREE.Vector3(-75, 0, 80), -Math.PI / 4);

    // Palm trees lining streets & beach promenade
    for (let z = -200; z <= 200; z += 25) {
      this.createPalmTree(-135, z);
      this.createPalmTree(-135 + 8, z);
      this.createPalmTree(0, z + 12);
      this.createPalmTree(50, z);
    }

    // Street lamps
    for (let x = -100; x <= 150; x += 50) {
      for (let z = -150; z <= 150; z += 50) {
        this.createStreetLamp(x + 8, z + 8);
      }
    }

    // Vinewood Hills & Mountain Backdrop
    this.createMountains();
    this.createVinewoodSign();

    // Sidewalks, zebra pedestrian crosswalks & street details
    this.createSidewalksAndDetails();

    // Iconic Los Santos rooftop billboards
    this.createBillboardsAndSigns();

    // Procedural volumetric cloud clusters
    this.createClouds();
  }

  private createRoadStrip(x: number, z: number, w: number, l: number, isVertical: boolean) {
    // Super Ultra Asphalt with specular wetness reflection
    const roadGeo = new THREE.PlaneGeometry(w, l);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x1a1d20,
      roughness: 0.14,
      metalness: 0.26,
    });
    this.roadMats.push(roadMat);
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(x, 0.05, z);
    road.receiveShadow = true;
    this.scene.add(road);

    // Yellow center dashed line
    const dashLength = 4;
    const dashGap = 4;
    const dashCount = Math.floor(l / (dashLength + dashGap));
    const dashMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

    for (let d = -dashCount / 2; d < dashCount / 2; d++) {
      const dashGeo = new THREE.PlaneGeometry(isVertical ? 0.35 : dashLength, isVertical ? dashLength : 0.35);
      const dash = new THREE.Mesh(dashGeo, dashMat);
      dash.rotation.x = -Math.PI / 2;
      if (isVertical) {
        dash.position.set(x, 0.07, z + d * (dashLength + dashGap));
      } else {
        dash.position.set(x + d * (dashLength + dashGap), 0.07, z);
      }
      this.scene.add(dash);
    }
  }

  private createSkyscraperBlock(cx: number, cz: number) {
    const height = 40 + Math.random() * 60;
    const width = 28 + Math.random() * 8;
    const depth = 28 + Math.random() * 8;

    const colors = [0x2c3e50, 0x34495e, 0x1abc9c, 0x7f8c8d, 0x2980b9, 0x111827];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const buildingGeo = new THREE.BoxGeometry(width, height, depth);
    const buildingMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.25,
      metalness: 0.65,
    });

    const building = new THREE.Mesh(buildingGeo, buildingMat);
    building.position.set(cx, height / 2, cz);
    building.castShadow = true;
    building.receiveShadow = true;
    this.scene.add(building);

    // Rooftop AC / Antenna + Red Aviation Warning Beacon
    const roofBoxGeo = new THREE.BoxGeometry(width * 0.4, 4, depth * 0.4);
    const roofMat = new THREE.MeshLambertMaterial({ color: 0x475569 });
    const roofBox = new THREE.Mesh(roofBoxGeo, roofMat);
    roofBox.position.set(cx, height + 2, cz);
    this.scene.add(roofBox);

    // Blinking red aviation warning beacon on roof
    const beaconGeo = new THREE.SphereGeometry(0.8, 8, 8);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
    beaconMesh.position.set(cx, height + 5, cz);
    this.scene.add(beaconMesh);
    this.beaconMeshes.push(beaconMesh);

    // Register obstacle box for collision
    const bBox = new THREE.Box3().setFromObject(building);
    this.obstacles.push(bBox);

    // Glowing window grid rows
    const windowMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    this.windowMats.push(windowMat);
    const winGeo = new THREE.PlaneGeometry(width * 0.8, 0.8);
    for (let floorY = 4; floorY < height - 4; floorY += 4) {
      if (Math.random() > 0.3) {
        const winFront = new THREE.Mesh(winGeo, windowMat);
        winFront.position.set(cx, floorY, cz + depth / 2 + 0.05);
        this.scene.add(winFront);
      }
    }
  }

  private createMazeBankTower(cx: number, cz: number) {
    const height = 140;
    const radius = 18;
    const towerGeo = new THREE.CylinderGeometry(radius * 0.7, radius, height, 16);
    const towerMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.15,
    });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(cx, height / 2, cz);
    tower.castShadow = true;
    tower.receiveShadow = true;
    this.scene.add(tower);

    // Helipad on top
    const helipadGeo = new THREE.CylinderGeometry(radius * 0.75, radius * 0.75, 1.5, 16);
    const helipadMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b });
    const helipad = new THREE.Mesh(helipadGeo, helipadMat);
    helipad.position.set(cx, height + 0.8, cz);
    this.scene.add(helipad);

    // Big Glowing Logo "MAZE BANK"
    const logoMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const logoGeo = new THREE.BoxGeometry(16, 3, 0.8);
    const logo = new THREE.Mesh(logoGeo, logoMat);
    logo.position.set(cx, height - 6, cz + radius * 0.7 + 0.5);
    this.scene.add(logo);

    // High Altitude Warning Beacon on top of Maze Bank
    const topBeacon = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
    topBeacon.position.set(cx, height + 4, cz);
    this.scene.add(topBeacon);
    this.beaconMeshes.push(topBeacon);

    this.obstacles.push(new THREE.Box3().setFromObject(tower));
  }

  private createLSCustomsShop(cx: number, cz: number) {
    const shopGeo = new THREE.BoxGeometry(32, 12, 30);
    const shopMat = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.7 });
    const shop = new THREE.Mesh(shopGeo, shopMat);
    shop.position.set(cx, 6, cz);
    shop.castShadow = true;
    shop.receiveShadow = true;
    this.scene.add(shop);

    // Neon signage
    const signGeo = new THREE.BoxGeometry(20, 2.5, 0.6);
    const signMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(cx, 11, cz + 15.4);
    this.scene.add(sign);

    // Garage door
    const doorGeo = new THREE.PlaneGeometry(10, 8);
    const doorMat = new THREE.MeshLambertMaterial({ color: 0x111827 });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(cx, 4, cz + 15.1);
    this.scene.add(door);

    this.obstacles.push(new THREE.Box3().setFromObject(shop));
  }

  private createBankBuilding(cx: number, cz: number) {
    const bankGeo = new THREE.BoxGeometry(34, 22, 32);
    const bankMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.3 });
    const bank = new THREE.Mesh(bankGeo, bankMat);
    bank.position.set(cx, 11, cz);
    bank.castShadow = true;
    bank.receiveShadow = true;
    this.scene.add(bank);

    // Bank Columns
    for (let c = -12; c <= 12; c += 6) {
      const colGeo = new THREE.CylinderGeometry(1.2, 1.2, 16, 8);
      const colMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
      const col = new THREE.Mesh(colGeo, colMat);
      col.position.set(cx + c, 8, cz + 16.5);
      this.scene.add(col);
    }

    this.obstacles.push(new THREE.Box3().setFromObject(bank));
  }

  private createPoliceStation(cx: number, cz: number) {
    const policeGeo = new THREE.BoxGeometry(32, 18, 30);
    const policeMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.4 });
    const police = new THREE.Mesh(policeGeo, policeMat);
    police.position.set(cx, 9, cz);
    police.castShadow = true;
    police.receiveShadow = true;
    this.scene.add(police);

    // LSPD Sign
    const signMat = new THREE.MeshBasicMaterial({ color: 0x60a5fa });
    const sign = new THREE.Mesh(new THREE.BoxGeometry(14, 2, 0.4), signMat);
    sign.position.set(cx, 15, cz + 15.3);
    this.scene.add(sign);

    this.obstacles.push(new THREE.Box3().setFromObject(police));
  }

  private createVillas(cx: number, cz: number) {
    const houseGeo = new THREE.BoxGeometry(24, 8, 22);
    const houseMat = new THREE.MeshStandardMaterial({ color: 0xfaf5ff, roughness: 0.5 });
    const house = new THREE.Mesh(houseGeo, houseMat);
    house.position.set(cx, 4, cz);
    house.castShadow = true;
    house.receiveShadow = true;
    this.scene.add(house);

    // Roof
    const roofGeo = new THREE.ConeGeometry(18, 5, 4);
    const roofMat = new THREE.MeshLambertMaterial({ color: 0x9a3412 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.set(cx, 10.5, cz);
    this.scene.add(roof);

    this.obstacles.push(new THREE.Box3().setFromObject(house));
  }

  // Suburban Grove Street Residential Neighborhood
  private createResidentialNeighborhood(cx: number, cz: number) {
    const houseConfigs = [
      { dx: -12, dz: -11, color: 0xfef3c7, roofColor: 0x9a3412, carColor: '#2563eb' },
      { dx: 12, dz: -11, color: 0xe0f2fe, roofColor: 0x475569, carColor: '#dc2626' },
      { dx: -12, dz: 12, color: 0xfef08a, roofColor: 0x854d0e, carColor: '#10b981' },
      { dx: 12, dz: 12, color: 0xf3e8ff, roofColor: 0x7c2d12, carColor: '#f59e0b' },
    ];

    for (const h of houseConfigs) {
      const hx = cx + h.dx;
      const hz = cz + h.dz;

      // Front yard grass lawn
      const lawnGeo = new THREE.PlaneGeometry(21, 20);
      const lawnMat = new THREE.MeshStandardMaterial({ color: 0x3f6212, roughness: 0.8 });
      const lawn = new THREE.Mesh(lawnGeo, lawnMat);
      lawn.rotation.x = -Math.PI / 2;
      lawn.position.set(hx, 0.02, hz);
      lawn.receiveShadow = true;
      this.scene.add(lawn);

      // House main body
      const bodyGeo = new THREE.BoxGeometry(13, 6, 11);
      const bodyMat = new THREE.MeshStandardMaterial({ color: h.color, roughness: 0.6 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.set(hx, 3, hz);
      body.castShadow = true;
      body.receiveShadow = true;
      this.scene.add(body);

      // Pitched Gable Roof
      const roofGeo = new THREE.ConeGeometry(10.5, 4.5, 4);
      const roofMat = new THREE.MeshLambertMaterial({ color: h.roofColor });
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.rotation.y = Math.PI / 4;
      roof.position.set(hx, 8.2, hz);
      roof.castShadow = true;
      this.scene.add(roof);

      // Brick Chimney
      const chimGeo = new THREE.BoxGeometry(1.2, 3.2, 1.2);
      const chimMat = new THREE.MeshLambertMaterial({ color: 0x991b1b });
      const chim = new THREE.Mesh(chimGeo, chimMat);
      chim.position.set(hx + 3.2, 8.5, hz - 2);
      this.scene.add(chim);

      // Front Covered Porch
      const porchGeo = new THREE.BoxGeometry(6, 0.5, 3);
      const porchMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8 });
      const porch = new THREE.Mesh(porchGeo, porchMat);
      porch.position.set(hx, 0.25, hz + 6.5);
      this.scene.add(porch);

      // Porch pillars
      const pillarMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
      for (const px of [-2.6, 2.6]) {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 3.5, 6), pillarMat);
        pillar.position.set(hx + px, 1.8, hz + 7.6);
        this.scene.add(pillar);
      }

      // Porch roof
      const pRoof = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.4, 3.2), roofMat);
      pRoof.position.set(hx, 3.6, hz + 6.5);
      this.scene.add(pRoof);

      // Front Door & Windows
      const doorMat = new THREE.MeshLambertMaterial({ color: 0x451a03 });
      const door = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.8), doorMat);
      door.position.set(hx, 1.6, hz + 5.55);
      this.scene.add(door);

      // Attached Single-Car Garage
      const garageGeo = new THREE.BoxGeometry(6.5, 4.5, 8);
      const garage = new THREE.Mesh(garageGeo, bodyMat);
      garage.position.set(hx - 8, 2.25, hz);
      garage.castShadow = true;
      this.scene.add(garage);

      // Ribbed Garage Door
      const gDoor = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 3.4), new THREE.MeshLambertMaterial({ color: 0xe2e8f0 }));
      gDoor.position.set(hx - 8, 1.8, hz + 4.05);
      this.scene.add(gDoor);

      // Concrete Driveway
      const driveGeo = new THREE.PlaneGeometry(5.5, 9);
      const driveMat = new THREE.MeshStandardMaterial({ color: 0x71717a, roughness: 0.8 });
      const drive = new THREE.Mesh(driveGeo, driveMat);
      drive.rotation.x = -Math.PI / 2;
      drive.position.set(hx - 8, 0.03, hz + 8.5);
      this.scene.add(drive);

      // Parked Civilian Car in Driveway
      const parkedCarStats: VehicleStats = {
        id: `res_car_${hx}_${hz}`,
        type: 'sedan',
        name: 'Karin Asterope',
        maxSpeed: 28,
        acceleration: 22,
        handling: 2.2,
        health: 800,
        maxHealth: 800,
        color: h.carColor,
      };
      const parkedCar = this.createVehicleMesh(parkedCarStats);
      parkedCar.group.position.set(hx - 8, 0, hz + 7.5);
      this.scene.add(parkedCar.group);
      this.vehicles.push({
        mesh: parkedCar.group,
        stats: parkedCarStats,
        velocity: new THREE.Vector3(),
        speed: 0,
        steering: 0,
        heading: 0,
        isPlayer: false,
        isPolice: false,
        isTraffic: false,
      });

      // Front Lawn White Picket Fence
      const fenceMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
      for (let fx = -9; fx <= 9; fx += 2.5) {
        if (fx > -11 && fx < -5) continue; // Leave open for driveway
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.2, 0.15), fenceMat);
        post.position.set(hx + fx, 0.6, hz + 9.5);
        this.scene.add(post);
      }
      const rail = new THREE.Mesh(new THREE.BoxGeometry(11, 0.1, 0.08), fenceMat);
      rail.position.set(hx + 4, 0.8, hz + 9.5);
      this.scene.add(rail);

      // Mailbox on post
      const mbPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.1, 6), fenceMat);
      mbPost.position.set(hx - 4.5, 0.55, hz + 9.6);
      const mbBox = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.7), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
      mbBox.position.set(hx - 4.5, 1.2, hz + 9.6);
      this.scene.add(mbPost, mbBox);

      // Register collision box for the house and garage
      this.obstacles.push(new THREE.Box3().setFromObject(body));
      this.obstacles.push(new THREE.Box3().setFromObject(garage));
    }
  }

  // Central Lush Botanical Garden / Legion Square Park
  private createCentralGarden(cx: number, cz: number) {
    // Lush Emerald Park Lawn
    const parkGeo = new THREE.PlaneGeometry(46, 46);
    const parkMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.7 });
    const parkLawn = new THREE.Mesh(parkGeo, parkMat);
    parkLawn.rotation.x = -Math.PI / 2;
    parkLawn.position.set(cx, 0.05, cz);
    parkLawn.receiveShadow = true;
    this.scene.add(parkLawn);

    // Stone Retaining Curb Border
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.5 });
    for (const side of [-23, 23]) {
      const curbX = new THREE.Mesh(new THREE.BoxGeometry(46, 0.5, 0.8), curbMat);
      curbX.position.set(cx, 0.25, cz + side);
      const curbZ = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 46), curbMat);
      curbZ.position.set(cx + side, 0.25, cz);
      this.scene.add(curbX, curbZ);
    }

    // Cobblestone Walking Pathways (Cross + Plaza)
    const pathMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.75 });
    const pathEW = new THREE.Mesh(new THREE.PlaneGeometry(45, 5), pathMat);
    pathEW.rotation.x = -Math.PI / 2;
    pathEW.position.set(cx, 0.08, cz);
    const pathNS = new THREE.Mesh(new THREE.PlaneGeometry(5, 45), pathMat);
    pathNS.rotation.x = -Math.PI / 2;
    pathNS.position.set(cx, 0.08, cz);
    this.scene.add(pathEW, pathNS);

    // Central Grand Water Fountain
    const fountainStone = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.35 });
    const baseBasin = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 6.0, 1.2, 16), fountainStone);
    baseBasin.position.set(cx, 0.6, cz);
    baseBasin.castShadow = true;
    baseBasin.receiveShadow = true;
    this.scene.add(baseBasin);
    this.obstacles.push(new THREE.Box3().setFromObject(baseBasin));

    // Turquoise Fountain Water Surface
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85,
    });
    const waterDisc = new THREE.Mesh(new THREE.CylinderGeometry(5.0, 5.0, 0.1, 16), waterMat);
    waterDisc.position.set(cx, 1.15, cz);
    this.scene.add(waterDisc);

    // Middle Tier Fountain Basin
    const midBasin = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.2, 0.8, 16), fountainStone);
    midBasin.position.set(cx, 1.8, cz);
    this.scene.add(midBasin);

    // Top Fountain Spire
    const topSpire = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.6, 1.6, 12), fountainStone);
    topSpire.position.set(cx, 2.8, cz);
    this.scene.add(topSpire);

    // Animated Sparkling Water Spray Particles
    const particleCount = 60;
    const pGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(particleCount * 3);
    for (let p = 0; p < particleCount; p++) {
      pPositions[p * 3] = cx + (Math.random() - 0.5) * 1.5;
      pPositions[p * 3 + 1] = 2.8 + Math.random() * 2.2;
      pPositions[p * 3 + 2] = cz + (Math.random() - 0.5) * 1.5;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    const pMat = new THREE.PointsMaterial({ color: 0xbae6fd, size: 0.35, transparent: true, opacity: 0.8 });
    this.gardenFountainParticles = new THREE.Points(pGeo, pMat);
    this.scene.add(this.gardenFountainParticles);

    // Flowerbeds in 4 Quadrants
    const flowerColors = [0xef4444, 0xf59e0b, 0x8b5cf6, 0xec4899];
    const quadOffsets = [
      { qx: -12, qz: -12, c: 0xef4444 }, // Crimson roses
      { qx: 12, qz: -12, c: 0xf59e0b },  // Sunflowers
      { qx: -12, qz: 12, c: 0x8b5cf6 },  // Lavender
      { qx: 12, qz: 12, c: 0xec4899 },   // Cherry orchids
    ];

    for (const q of quadOffsets) {
      // Circular flower bed retaining wall
      const bedWall = new THREE.Mesh(
        new THREE.CylinderGeometry(4.2, 4.4, 0.45, 12),
        new THREE.MeshStandardMaterial({ color: 0x78716c })
      );
      bedWall.position.set(cx + q.qx, 0.25, cz + q.qz);
      this.scene.add(bedWall);

      // Soil
      const soil = new THREE.Mesh(
        new THREE.CylinderGeometry(4.0, 4.0, 0.2, 12),
        new THREE.MeshLambertMaterial({ color: 0x3f2e21 })
      );
      soil.position.set(cx + q.qx, 0.4, cz + q.qz);
      this.scene.add(soil);

      // Flower clusters
      const fMat = new THREE.MeshLambertMaterial({ color: q.c });
      for (let f = 0; f < 14; f++) {
        const angle = (f / 14) * Math.PI * 2;
        const dist = 1.0 + Math.random() * 2.6;
        const fx = cx + q.qx + Math.cos(angle) * dist;
        const fz = cz + q.qz + Math.sin(angle) * dist;

        const flower = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 6), fMat);
        flower.position.set(fx, 0.65, fz);
        this.scene.add(flower);
      }
    }

    // Japanese Cherry Blossom & Leafy Trees
    const treePositions = [
      { tx: -18, tz: -18, pink: true },
      { tx: 18, tz: -18, pink: false },
      { tx: -18, tz: 18, pink: false },
      { tx: 18, tz: 18, pink: true },
    ];
    for (const t of treePositions) {
      const treeGroup = new THREE.Group();
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.6, 6.5, 6),
        new THREE.MeshLambertMaterial({ color: 0x543729 })
      );
      trunk.position.y = 3.25;
      treeGroup.add(trunk);

      const leafColor = t.pink ? 0xf472b6 : 0x15803d;
      const canopy = new THREE.Mesh(
        new THREE.SphereGeometry(3.5, 8, 8),
        new THREE.MeshLambertMaterial({ color: leafColor })
      );
      canopy.position.y = 7.2;
      treeGroup.add(canopy);

      treeGroup.position.set(cx + t.tx, 0, cz + t.tz);
      this.scene.add(treeGroup);
      this.obstacles.push(new THREE.Box3().setFromCenterAndSize(treeGroup.position.clone().add(new THREE.Vector3(0, 3, 0)), new THREE.Vector3(1.2, 6, 1.2)));
    }

    // Wooden Gazebo / Pavilion
    const gazebo = new THREE.Group();
    const gBase = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.4, 0.5, 6), new THREE.MeshLambertMaterial({ color: 0x78350f }));
    gBase.position.y = 0.25;
    gazebo.add(gBase);

    for (let p = 0; p < 6; p++) {
      const a = (p / 6) * Math.PI * 2;
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.8, 6), new THREE.MeshLambertMaterial({ color: 0xffffff }));
      pillar.position.set(Math.cos(a) * 3.6, 2.1, Math.sin(a) * 3.6);
      gazebo.add(pillar);
    }

    const gRoof = new THREE.Mesh(new THREE.ConeGeometry(4.8, 2.6, 6), new THREE.MeshLambertMaterial({ color: 0x9a3412 }));
    gRoof.position.y = 5.2;
    gazebo.add(gRoof);

    gazebo.position.set(cx - 15, 0, cz);
    this.scene.add(gazebo);
    this.obstacles.push(new THREE.Box3().setFromObject(gazebo));

    // Park Benches
    const benchPositions = [
      { bx: 0, bz: -8, ry: 0 },
      { bx: 0, bz: 8, ry: Math.PI },
      { bx: -8, bz: 0, ry: Math.PI / 2 },
      { bx: 8, bz: 0, ry: -Math.PI / 2 },
    ];
    for (const b of benchPositions) {
      const bench = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.8, 1.0), new THREE.MeshStandardMaterial({ color: 0x92400e }));
      bench.position.set(cx + b.bx, 0.5, cz + b.bz);
      bench.rotation.y = b.ry;
      this.scene.add(bench);
    }
  }

  // Mount Zonah Medical Center & Rooftop Helipad
  private createMountZonahHospital(cx: number, cz: number) {
    const hospGroup = new THREE.Group();
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.35 });

    // Main Hospital Tower (Height 40m)
    const mainGeo = new THREE.BoxGeometry(34, 38, 30);
    const mainBldg = new THREE.Mesh(mainGeo, wallMat);
    mainBldg.position.set(0, 19, 0);
    mainBldg.castShadow = true;
    mainBldg.receiveShadow = true;
    hospGroup.add(mainBldg);

    // Emergency Room Ambulance Bay
    const erGeo = new THREE.BoxGeometry(18, 9, 14);
    const erMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0 });
    const er = new THREE.Mesh(erGeo, erMat);
    er.position.set(-14, 4.5, 18);
    hospGroup.add(er);

    // Glowing Illuminated Red Cross
    const redMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(8, 2.2, 0.5), redMat);
    crossH.position.set(0, 32, 15.3);
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(2.2, 8, 0.5), redMat);
    crossV.position.set(0, 32, 15.3);
    hospGroup.add(crossH, crossV);

    // Hospital Rooftop Helipad
    const padMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 0.8, 16), padMat);
    pad.position.set(0, 38.4, 0);
    hospGroup.add(pad);

    const ringMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const padRing = new THREE.Mesh(new THREE.RingGeometry(7.2, 7.8, 16), ringMat);
    padRing.rotation.x = -Math.PI / 2;
    padRing.position.set(0, 38.85, 0);
    hospGroup.add(padRing);

    // White "H" Marking
    const hBarMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const hL = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 6.0), hBarMat);
    hL.rotation.x = -Math.PI / 2;
    hL.position.set(-1.8, 38.86, 0);
    const hR = hL.clone();
    hR.position.x = 1.8;
    const hC = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.8), hBarMat);
    hC.rotation.x = -Math.PI / 2;
    hC.position.set(0, 38.86, 0);
    hospGroup.add(hL, hR, hC);

    hospGroup.position.set(cx, 0, cz);
    this.scene.add(hospGroup);
    this.obstacles.push(new THREE.Box3().setFromObject(mainBldg));
    this.obstacles.push(new THREE.Box3().setFromObject(er));

    // Spawn Medical Helicopter on the Hospital Helipad!
    this.spawnHelicopter(new THREE.Vector3(cx, 38.8, cz), '#ef4444', false, 'Air Ambulance Helicopter');
  }

  // Arcadius Business Tower Modern Skyscraper
  private createArcadiusSkyscraper(cx: number, cz: number) {
    const towerGroup = new THREE.Group();
    const height = 115;
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      metalness: 0.8,
      roughness: 0.1,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.9,
    });

    // Tier 1 Base
    const base = new THREE.Mesh(new THREE.BoxGeometry(32, 45, 32), glassMat);
    base.position.y = 22.5;
    base.castShadow = true;
    towerGroup.add(base);

    // Tier 2 Middle
    const mid = new THREE.Mesh(new THREE.BoxGeometry(26, 40, 26), glassMat);
    mid.position.y = 65;
    mid.castShadow = true;
    towerGroup.add(mid);

    // Tier 3 Spire
    const top = new THREE.Mesh(new THREE.BoxGeometry(18, 30, 18), glassMat);
    top.position.y = 100;
    towerGroup.add(top);

    // Glowing Architectural Roof Crown
    const crownMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const crown = new THREE.Mesh(new THREE.BoxGeometry(14, 2, 14), crownMat);
    crown.position.y = 116;
    towerGroup.add(crown);

    // Aviation Beacon
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    beacon.position.y = 119;
    towerGroup.add(beacon);
    this.beaconMeshes.push(beacon);

    towerGroup.position.set(cx, 0, cz);
    this.scene.add(towerGroup);
    this.obstacles.push(new THREE.Box3().setFromObject(base));
  }

  // Los Santos International Airport (LSIA)
  private createAirport() {
    const airportGroup = new THREE.Group();

    // Main Asphalt Runway (280m x 36m)
    const runwayGeo = new THREE.PlaneGeometry(36, 280);
    const runwayMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.35 });
    const runway = new THREE.Mesh(runwayGeo, runwayMat);
    runway.rotation.x = -Math.PI / 2;
    runway.position.set(0, 0.04, 270);
    runway.receiveShadow = true;
    airportGroup.add(runway);

    // Centerline Dashed Runway Stripes
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let l = -120; l <= 120; l += 18) {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 9), lineMat);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(0, 0.06, 270 + l);
      airportGroup.add(stripe);
    }

    // Runway Threshold Piano Keys (Zebra markings at both ends)
    for (const endZ of [140, 400]) {
      for (let s = -14; s <= 14; s += 3.2) {
        const thresh = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 16), lineMat);
        thresh.rotation.x = -Math.PI / 2;
        thresh.position.set(s, 0.06, endZ);
        airportGroup.add(thresh);
      }
    }

    // Runway Edge Lights (Green at threshold, Red at end, White along sides)
    const edgeWhite = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const edgeGreen = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const edgeRed = new THREE.MeshBasicMaterial({ color: 0xef4444 });

    for (let rz = 135; rz <= 405; rz += 20) {
      for (const rx of [-18.5, 18.5]) {
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 6), edgeWhite);
        bulb.position.set(rx, 0.3, rz);
        airportGroup.add(bulb);
      }
    }

    // Apron Concrete Tarmac
    const apronGeo = new THREE.PlaneGeometry(220, 70);
    const apronMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });
    const apron = new THREE.Mesh(apronGeo, apronMat);
    apron.rotation.x = -Math.PI / 2;
    apron.position.set(0, 0.03, 195);
    apron.receiveShadow = true;
    airportGroup.add(apron);

    // Yellow Taxiway Guidance Lines
    const taxiMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const taxiLine = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 160), taxiMat);
    taxiLine.rotation.x = -Math.PI / 2;
    taxiLine.rotation.z = Math.PI / 2;
    taxiLine.position.set(0, 0.05, 205);
    airportGroup.add(taxiLine);

    // Airport Passenger Terminal Building
    const termGeo = new THREE.BoxGeometry(70, 16, 26);
    const termMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.3 });
    const terminal = new THREE.Mesh(termGeo, termMat);
    terminal.position.set(35, 8, 175);
    terminal.castShadow = true;
    terminal.receiveShadow = true;
    airportGroup.add(terminal);
    this.obstacles.push(new THREE.Box3().setFromObject(terminal));

    // Glass Terminal Windows
    const termGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(66, 9),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.8 })
    );
    termGlass.position.set(35, 8, 188.1);
    airportGroup.add(termGlass);

    // Passenger Jetway / Boarding Bridge
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(6, 4.5, 18), new THREE.MeshStandardMaterial({ color: 0x94a3b8 }));
    bridge.position.set(20, 5, 202);
    airportGroup.add(bridge);

    // Illuminated "LSIA" Terminal Sign
    const signMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const lsiaSign = new THREE.Mesh(new THREE.BoxGeometry(32, 3, 0.6), signMat);
    lsiaSign.position.set(35, 17, 188.4);
    airportGroup.add(lsiaSign);

    // Air Traffic Control Tower (Height 44m)
    const towerShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(3.6, 5.0, 36, 12),
      new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.5 })
    );
    towerShaft.position.set(-60, 18, 180);
    towerShaft.castShadow = true;
    airportGroup.add(towerShaft);
    this.obstacles.push(new THREE.Box3().setFromObject(towerShaft));

    // 360-Degree Observation Deck Cabin
    const deckGeo = new THREE.CylinderGeometry(8.0, 6.0, 7.0, 12);
    const deckMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9 });
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.set(-60, 39, 180);
    airportGroup.add(deck);

    // Rotating Radar Scanner Antenna on Tower Roof
    const dishMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.8 });
    const radarDish = new THREE.Mesh(new THREE.BoxGeometry(5.0, 1.2, 0.3), dishMat);
    radarDish.position.set(-60, 44, 180);
    airportGroup.add(radarDish);
    this.airportRadarDish = radarDish;

    // Aviation Beacon atop tower
    const tBeacon = new THREE.Mesh(new THREE.SphereGeometry(1.0, 8, 8), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    tBeacon.position.set(-60, 46, 180);
    airportGroup.add(tBeacon);
    this.beaconMeshes.push(tBeacon);

    // Aircraft Cargo Hangars
    for (const hx of [-110, 100]) {
      const hangar = new THREE.Mesh(
        new THREE.CylinderGeometry(14, 14, 38, 12, 1, false, 0, Math.PI),
        new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.4 })
      );
      hangar.rotation.z = Math.PI / 2;
      hangar.position.set(hx, 0, 185);
      airportGroup.add(hangar);
      this.obstacles.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(hx, 7, 185), new THREE.Vector3(38, 14, 28)));
    }

    // Airport Helipad
    const padBase = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 0.2, 16), new THREE.MeshLambertMaterial({ color: 0x1e293b }));
    padBase.position.set(-25, 0.1, 230);
    airportGroup.add(padBase);

    const padCircle = new THREE.Mesh(new THREE.RingGeometry(7.2, 7.8, 16), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
    padCircle.rotation.x = -Math.PI / 2;
    padCircle.position.set(-25, 0.22, 230);
    airportGroup.add(padCircle);

    // Helipad "H"
    const hL = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 5.5), lineMat);
    hL.rotation.x = -Math.PI / 2;
    hL.position.set(-26.5, 0.24, 230);
    const hR = hL.clone();
    hR.position.x = -23.5;
    const hM = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.7), lineMat);
    hM.rotation.x = -Math.PI / 2;
    hM.position.set(-25, 0.24, 230);
    airportGroup.add(hL, hR, hM);

    // Commercial Passenger Jet Parked on Apron
    const airliner = this.createAirlinerMesh();
    airliner.position.set(38, 0, 235);
    airliner.rotation.y = -Math.PI / 6;
    airportGroup.add(airliner);
    this.obstacles.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(38, 5, 235), new THREE.Vector3(36, 12, 38)));

    this.scene.add(airportGroup);

    // Spawn flyable LSIA Maverick Helicopter on the Airport Helipad!
    this.spawnHelicopter(new THREE.Vector3(-25, 0.2, 230), '#0284c7', false, 'LSIA Maverick');
  }

  // Fort Zancudo Military Base
  private createMilitaryBase() {
    const baseGroup = new THREE.Group();
    const bx = 230;
    const bz = -110;

    // Military Compound Ground
    const groundGeo = new THREE.PlaneGeometry(130, 120);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.85 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(bx, 0.04, bz);
    ground.receiveShadow = true;
    baseGroup.add(ground);

    // Security Perimeter Fence & Barbed Wire
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
    const minX = bx - 65;
    const maxX = bx + 65;
    const minZ = bz - 60;
    const maxZ = bz + 60;

    // Fence posts & chainlink boundary
    const fenceHeight = 4.5;
    const addFenceSegment = (p1: THREE.Vector3, p2: THREE.Vector3) => {
      const length = p1.distanceTo(p2);
      const wall = new THREE.Mesh(new THREE.BoxGeometry(0.2, fenceHeight, length), fenceMat);
      wall.position.copy(p1.clone().add(p2).multiplyScalar(0.5));
      wall.position.y = fenceHeight / 2;
      wall.lookAt(p2.x, wall.position.y, p2.z);
      baseGroup.add(wall);
      this.obstacles.push(new THREE.Box3().setFromObject(wall));
    };

    // 4 Perimeter sides (leaving gap at gate)
    addFenceSegment(new THREE.Vector3(minX, 0, minZ), new THREE.Vector3(maxX, 0, minZ)); // North
    addFenceSegment(new THREE.Vector3(maxX, 0, minZ), new THREE.Vector3(maxX, 0, maxZ)); // East
    addFenceSegment(new THREE.Vector3(minX, 0, maxZ), new THREE.Vector3(maxX, 0, maxZ)); // South
    addFenceSegment(new THREE.Vector3(minX, 0, minZ), new THREE.Vector3(minX, 0, bz - 12)); // West upper
    addFenceSegment(new THREE.Vector3(minX, 0, bz + 12), new THREE.Vector3(minX, 0, maxZ)); // West lower

    // Security Checkpoint Gate (West entrance)
    const guardBooth = new THREE.Mesh(new THREE.BoxGeometry(5, 4, 5), new THREE.MeshStandardMaterial({ color: 0x334155 }));
    guardBooth.position.set(minX + 4, 2, bz - 8);
    baseGroup.add(guardBooth);
    this.obstacles.push(new THREE.Box3().setFromObject(guardBooth));

    // Boom Barrier
    const barrier = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 12), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    barrier.position.set(minX, 1.2, bz);
    baseGroup.add(barrier);

    // Warning Signboard
    const sign = new THREE.Mesh(new THREE.BoxGeometry(10, 2.5, 0.4), new THREE.MeshBasicMaterial({ color: 0xdc2626 }));
    sign.position.set(minX - 2, 4.5, bz);
    sign.rotation.y = Math.PI / 2;
    baseGroup.add(sign);

    // 4 Watchtowers at corners
    const towerCoords = [
      { x: minX + 5, z: minZ + 5 },
      { x: maxX - 5, z: minZ + 5 },
      { x: minX + 5, z: maxZ - 5 },
      { x: maxX - 5, z: maxZ - 5 },
    ];
    for (const tw of towerCoords) {
      const tower = new THREE.Group();
      // 4 Steel legs
      for (const lx of [-2, 2]) {
        for (const lz of [-2, 2]) {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 15, 6), fenceMat);
          leg.position.set(lx, 7.5, lz);
          tower.add(leg);
        }
      }
      // Observation Cabin
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(5.5, 4.0, 5.5), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
      cabin.position.y = 17;
      tower.add(cabin);

      // Searchlight
      const light = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 1.2, 8), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
      light.position.set(0, 19.5, 2.2);
      light.rotation.x = Math.PI / 3;
      tower.add(light);

      tower.position.set(tw.x, 0, tw.z);
      baseGroup.add(tower);
      this.obstacles.push(new THREE.Box3().setFromCenterAndSize(tower.position.clone().add(new THREE.Vector3(0, 7.5, 0)), new THREE.Vector3(5, 15, 5)));
    }

    // Command HQ Bunker & Barracks
    const bunkerMat = new THREE.MeshStandardMaterial({ color: 0x3f4f3e, roughness: 0.9 }); // Olive Drab Camo
    const bunker = new THREE.Mesh(new THREE.BoxGeometry(32, 10, 24), bunkerMat);
    bunker.position.set(bx - 15, 5, bz - 25);
    bunker.castShadow = true;
    bunker.receiveShadow = true;
    baseGroup.add(bunker);
    this.obstacles.push(new THREE.Box3().setFromObject(bunker));

    // Satellite Dish on Bunker Roof
    const satDish = new THREE.Mesh(new THREE.SphereGeometry(3.0, 12, 8, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0xf1f5f9 }));
    satDish.rotation.x = Math.PI / 3;
    satDish.position.set(bx - 15, 12.5, bz - 25);
    baseGroup.add(satDish);

    // Fortified Military Aircraft Hangar
    const mHangar = new THREE.Mesh(
      new THREE.CylinderGeometry(15, 15, 40, 12, 1, false, 0, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x3f4f3e, roughness: 0.7 })
    );
    mHangar.rotation.z = Math.PI / 2;
    mHangar.position.set(bx + 25, 0, bz - 25);
    baseGroup.add(mHangar);
    this.obstacles.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(bx + 25, 7.5, bz - 25), new THREE.Vector3(40, 15, 30)));

    // Surface-to-Air Missile (SAM) Battery Platform
    const samBase = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 1.2, 8), new THREE.MeshStandardMaterial({ color: 0x1f2937 }));
    samBase.position.set(bx - 20, 0.6, bz + 30);
    baseGroup.add(samBase);

    for (let m = -1.5; m <= 1.5; m += 1.0) {
      const missile = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.25, 4.5, 6),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
      );
      missile.position.set(bx - 20 + m * 1.5, 3.2, bz + 30);
      missile.rotation.x = -Math.PI / 4;
      baseGroup.add(missile);
    }

    // Military Helipad
    const mPad = new THREE.Mesh(new THREE.CylinderGeometry(8.5, 8.5, 0.2, 16), new THREE.MeshLambertMaterial({ color: 0x1f2937 }));
    mPad.position.set(bx + 30, 0.1, bz + 25);
    baseGroup.add(mPad);

    const mRing = new THREE.Mesh(new THREE.RingGeometry(6.8, 7.4, 16), new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
    mRing.rotation.x = -Math.PI / 2;
    mRing.position.set(bx + 30, 0.22, bz + 25);
    baseGroup.add(mRing);

    const mH = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 5.0), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    mH.rotation.x = -Math.PI / 2;
    mH.position.set(bx + 30, 0.24, bz + 25);
    baseGroup.add(mH);

    this.scene.add(baseGroup);

    // Spawn Armed Buzzard Military Attack Helicopter on Helipad!
    this.spawnHelicopter(new THREE.Vector3(bx + 30, 0.2, bz + 25), '#365314', true, 'Fort Zancudo Buzzard');

    // Spawn Operable Army Rhino Tank in Motor Pool!
    this.spawnTank(new THREE.Vector3(bx - 5, 0, bz + 15));
  }

  // Commercial Airliner Jet 3D Model
  public createAirlinerMesh(): THREE.Group {
    const plane = new THREE.Group();
    const fuselageMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25, metalness: 0.3 });
    const blueAirlineMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.2 });

    // Fuselage (Cylinder)
    const bodyGeo = new THREE.CylinderGeometry(2.4, 2.4, 38, 16);
    bodyGeo.rotateX(Math.PI / 2);
    const body = new THREE.Mesh(bodyGeo, fuselageMat);
    body.position.set(0, 5.2, 0);
    body.castShadow = true;
    plane.add(body);

    // Streamlined Nose cone
    const noseGeo = new THREE.SphereGeometry(2.4, 16, 12);
    noseGeo.scale(1, 0.95, 1.8);
    const nose = new THREE.Mesh(noseGeo, fuselageMat);
    nose.position.set(0, 5.1, 19.5);
    plane.add(nose);

    // Cockpit windows
    const cockpitGeo = new THREE.BoxGeometry(2.6, 0.8, 1.4);
    const cockpit = new THREE.Mesh(cockpitGeo, new THREE.MeshBasicMaterial({ color: 0x0f172a }));
    cockpit.position.set(0, 6.2, 19.2);
    plane.add(cockpit);

    // Swept-Back Main Wings
    const wingGeo = new THREE.BoxGeometry(36, 0.35, 6.5);
    const wings = new THREE.Mesh(wingGeo, fuselageMat);
    wings.position.set(0, 4.4, -2.0);
    wings.castShadow = true;
    plane.add(wings);

    // Winglets at tips
    for (const wSide of [-18, 18]) {
      const winglet = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.2, 1.6), blueAirlineMat);
      winglet.position.set(wSide, 5.3, -2.0);
      plane.add(winglet);
    }

    // Dual Turbofan Jet Engines
    for (const eSide of [-7.5, 7.5]) {
      const engineGeo = new THREE.CylinderGeometry(1.2, 1.1, 5.0, 12);
      engineGeo.rotateX(Math.PI / 2);
      const engine = new THREE.Mesh(engineGeo, blueAirlineMat);
      engine.position.set(eSide, 3.2, 1.5);
      engine.castShadow = true;
      plane.add(engine);

      // Fan disc
      const fanDisc = new THREE.Mesh(new THREE.CircleGeometry(1.1, 12), new THREE.MeshBasicMaterial({ color: 0x18181b }));
      fanDisc.position.set(eSide, 3.2, 4.02);
      plane.add(fanDisc);
    }

    // Vertical Stabilizer / Tail Fin
    const tailFinGeo = new THREE.BoxGeometry(0.4, 8.5, 6.0);
    const tailFin = new THREE.Mesh(tailFinGeo, blueAirlineMat);
    tailFin.position.set(0, 10.2, -16.5);
    tailFin.rotation.x = -0.25;
    tailFin.castShadow = true;
    plane.add(tailFin);

    // Horizontal Tail Stabilizers
    const hTailGeo = new THREE.BoxGeometry(14, 0.25, 3.2);
    const hTail = new THREE.Mesh(hTailGeo, fuselageMat);
    hTail.position.set(0, 6.8, -17.5);
    plane.add(hTail);

    // Landing gear struts and wheels
    const wheelMat = new THREE.MeshLambertMaterial({ color: 0x18181b });
    const gearPositions = [
      [0, 1.2, 14],
      [-4.5, 1.2, -2],
      [4.5, 1.2, -2],
    ];
    for (const [gx, gy, gz] of gearPositions) {
      const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 2.4, 6), fuselageMat);
      strut.position.set(gx, gy + 1.2, gz);
      plane.add(strut);

      const wheelL = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.5, 8), wheelMat);
      wheelL.rotation.z = Math.PI / 2;
      wheelL.position.set(gx - 0.35, gy, gz);
      const wheelR = wheelL.clone();
      wheelR.position.x = gx + 0.35;
      plane.add(wheelL, wheelR);
    }

    return plane;
  }

  // 3D Helicopter Generator (Maverick / Buzzard)
  public createHelicopterMesh(stats: VehicleStats) {
    const group = new THREE.Group();
    const bodyColor = new THREE.Color(stats.color || '#1e293b');

    // Fuselage cabin
    const bodyGeo = new THREE.BoxGeometry(2.2, 1.8, 4.6);
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: bodyColor,
      metalness: 0.8,
      roughness: 0.2,
      clearcoat: 0.8,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 1.6, 0);
    body.castShadow = true;
    group.add(body);

    // Rounded Aerodynamic Nose
    const noseGeo = new THREE.SphereGeometry(1.05, 12, 12);
    noseGeo.scale(1.05, 0.85, 1.4);
    const nose = new THREE.Mesh(noseGeo, bodyMat);
    nose.position.set(0, 1.5, 2.2);
    nose.castShadow = true;
    group.add(nose);

    // Large Glass Cockpit Bubble
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.05,
      metalness: 0.95,
      transparent: true,
      opacity: 0.85,
    });
    const windshieldGeo = new THREE.BoxGeometry(2.0, 1.1, 1.6);
    const windshield = new THREE.Mesh(windshieldGeo, glassMat);
    windshield.position.set(0, 1.9, 1.4);
    group.add(windshield);

    // Tail Boom
    const tailGeo = new THREE.CylinderGeometry(0.3, 0.6, 5.0, 8);
    tailGeo.rotateX(Math.PI / 2);
    const tail = new THREE.Mesh(tailGeo, bodyMat);
    tail.position.set(0, 1.7, -4.2);
    tail.castShadow = true;
    group.add(tail);

    // Vertical Fin
    const finGeo = new THREE.BoxGeometry(0.18, 1.6, 1.2);
    const fin = new THREE.Mesh(finGeo, bodyMat);
    fin.position.set(0, 2.3, -6.4);
    group.add(fin);

    // Horizontal Fin
    const hFinGeo = new THREE.BoxGeometry(1.8, 0.1, 0.6);
    const hFin = new THREE.Mesh(hFinGeo, bodyMat);
    hFin.position.set(0, 1.8, -5.5);
    group.add(hFin);

    // Landing Skids
    const skidMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.3 });
    const skidGeo = new THREE.CylinderGeometry(0.08, 0.08, 4.4, 6);
    skidGeo.rotateX(Math.PI / 2);

    const leftSkid = new THREE.Mesh(skidGeo, skidMat);
    leftSkid.position.set(-1.2, 0.25, 0);
    const rightSkid = leftSkid.clone();
    rightSkid.position.x = 1.2;
    group.add(leftSkid, rightSkid);

    // Skid Connecting Struts
    for (const zOffset of [1.2, -1.2]) {
      const strutGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.1, 6);
      const strutL = new THREE.Mesh(strutGeo, skidMat);
      strutL.position.set(-1.1, 0.8, zOffset);
      strutL.rotation.z = -0.15;
      const strutR = new THREE.Mesh(strutGeo, skidMat);
      strutR.position.set(1.1, 0.8, zOffset);
      strutR.rotation.z = 0.15;
      group.add(strutL, strutR);
    }

    // Main Rotor Mast
    const mastGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.8, 8);
    const mast = new THREE.Mesh(mastGeo, skidMat);
    mast.position.set(0, 2.9, 0.2);
    group.add(mast);

    // Main 4-Blade Spinning Rotor Hub & Blades
    const rotorGroup = new THREE.Group();
    rotorGroup.position.set(0, 3.3, 0.2);

    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.2, 8), skidMat);
    rotorGroup.add(hub);

    const bladeMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.4 });
    for (let b = 0; b < 4; b++) {
      const bladeGeo = new THREE.BoxGeometry(0.35, 0.04, 5.2);
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.position.set(0, 0, 2.5);
      const bladePivot = new THREE.Group();
      bladePivot.rotation.y = (b * Math.PI) / 2;
      bladePivot.add(blade);
      rotorGroup.add(bladePivot);
    }
    group.add(rotorGroup);

    // Tail Rotor
    const tailRotorGeo = new THREE.BoxGeometry(0.1, 1.4, 0.14);
    const tailRotor = new THREE.Mesh(tailRotorGeo, bladeMat);
    tailRotor.position.set(0.18, 2.5, -6.6);
    group.add(tailRotor);

    // Military Rocket Pods (if military buzzard)
    if (stats.id.includes('buzzard') || stats.isPolice) {
      const podMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
      const podGeo = new THREE.CylinderGeometry(0.28, 0.28, 1.8, 8);
      podGeo.rotateX(Math.PI / 2);
      const podL = new THREE.Mesh(podGeo, podMat);
      podL.position.set(-1.5, 1.2, 0.4);
      const podR = podL.clone();
      podR.position.x = 1.5;
      group.add(podL, podR);
    }

    // Navigation Strobe Lights
    const redLight = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    redLight.position.set(-1.25, 1.6, 0.2);
    const greenLight = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), new THREE.MeshBasicMaterial({ color: 0x10b981 }));
    greenLight.position.set(1.25, 1.6, 0.2);
    group.add(redLight, greenLight);

    return {
      group,
      rotorMesh: rotorGroup,
      tailRotorMesh: tailRotor,
    };
  }

  // 3D Army Rhino Tank Generator
  public createTankMesh(stats: VehicleStats) {
    const group = new THREE.Group();
    const armorMat = new THREE.MeshStandardMaterial({
      color: 0x3f4f3e, // Military Olive Drab Camo
      roughness: 0.75,
      metalness: 0.4,
    });
    const trackMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });

    // Lower Hull
    const hullGeo = new THREE.BoxGeometry(3.6, 1.2, 6.2);
    const hull = new THREE.Mesh(hullGeo, armorMat);
    hull.position.y = 0.9;
    hull.castShadow = true;
    group.add(hull);

    // Sloped Front Glacis Plate
    const frontPlateGeo = new THREE.BoxGeometry(3.5, 0.6, 1.5);
    const frontPlate = new THREE.Mesh(frontPlateGeo, armorMat);
    frontPlate.rotation.x = -0.45;
    frontPlate.position.set(0, 1.1, 3.2);
    group.add(frontPlate);

    // Left and Right Continuous Track Treads
    for (const side of [-1.8, 1.8]) {
      const trackGeo = new THREE.BoxGeometry(0.65, 0.95, 6.6);
      const track = new THREE.Mesh(trackGeo, trackMat);
      track.position.set(side, 0.65, 0);
      track.castShadow = true;
      group.add(track);

      // Track Road Wheels
      for (let w = -2.6; w <= 2.6; w += 1.0) {
        const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.68, 8);
        wheelGeo.rotateZ(Math.PI / 2);
        const wheel = new THREE.Mesh(wheelGeo, trackMat);
        wheel.position.set(side, 0.5, w);
        group.add(wheel);
      }
    }

    // Rotating Armored Turret
    const turretGeo = new THREE.BoxGeometry(2.6, 1.0, 3.2);
    const turret = new THREE.Mesh(turretGeo, armorMat);
    turret.position.set(0, 1.9, -0.3);
    turret.castShadow = true;
    group.add(turret);

    // Commander Cupola / Hatch
    const hatch = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.3, 8), armorMat);
    hatch.position.set(-0.6, 2.5, -0.6);
    group.add(hatch);

    // 120mm Heavy Cannon Barrel
    const barrelGeo = new THREE.CylinderGeometry(0.18, 0.22, 4.6, 8);
    barrelGeo.rotateX(Math.PI / 2);
    const barrel = new THREE.Mesh(barrelGeo, armorMat);
    barrel.position.set(0, 2.0, 3.4);
    barrel.castShadow = true;
    group.add(barrel);

    // Muzzle Brake
    const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.6, 8), trackMat);
    muzzle.rotation.x = Math.PI / 2;
    muzzle.position.set(0, 2.0, 5.8);
    group.add(muzzle);

    return {
      group,
      turretMesh: turret,
      barrelMesh: barrel,
    };
  }

  // Spawns a flyable helicopter into the game world
  public spawnHelicopter(pos: THREE.Vector3, color: string = '#0284c7', isMilitary: boolean = false, name: string = 'Helicopter') {
    const stats: VehicleStats = {
      id: `heli_${Date.now()}_${Math.random()}`,
      type: 'helicopter',
      name,
      maxSpeed: 38,
      acceleration: 24,
      handling: 2.2,
      health: 1500,
      maxHealth: 1500,
      color,
      isHelicopter: true,
    };

    const model = this.createHelicopterMesh(stats);
    model.group.position.copy(pos);
    this.scene.add(model.group);

    const heliEntity: VehicleEntity = {
      mesh: model.group,
      stats,
      velocity: new THREE.Vector3(),
      speed: 0,
      steering: 0,
      heading: 0,
      isPlayer: false,
      isPolice: false,
      isTraffic: false,
      isHelicopter: true,
      rotorMesh: model.rotorMesh,
      tailRotorMesh: model.tailRotorMesh,
      altitude: pos.y,
      targetAltitude: pos.y,
      rotorRPM: 0,
    };

    this.vehicles.push(heliEntity);
    return heliEntity;
  }

  // Spawns a controllable Army Rhino Tank
  public spawnTank(pos: THREE.Vector3) {
    const stats: VehicleStats = {
      id: `tank_${Date.now()}_${Math.random()}`,
      type: 'tank',
      name: 'Rhino Tank',
      maxSpeed: 24,
      acceleration: 18,
      handling: 1.6,
      health: 4000,
      maxHealth: 4000,
      color: '#3f4f3e',
      isTank: true,
    };

    const model = this.createTankMesh(stats);
    model.group.position.copy(pos);
    this.scene.add(model.group);

    const tankEntity: VehicleEntity = {
      mesh: model.group,
      stats,
      velocity: new THREE.Vector3(),
      speed: 0,
      steering: 0,
      heading: 0,
      isPlayer: false,
      isPolice: false,
      isTraffic: false,
      isTank: true,
      turretMesh: model.turretMesh,
      barrelMesh: model.barrelMesh,
    };

    this.vehicles.push(tankEntity);
    return tankEntity;
  }

  // Instant Cheat Code Drop: Helicopter
  public spawnHelicopterService(color: string = '#0284c7') {
    const spawnPos = this.playerPos.clone().add(
      new THREE.Vector3(Math.sin(this.playerHeading) * 8, 0.2, Math.cos(this.playerHeading) * 8)
    );
    this.spawnHelicopter(spawnPos, color, false, 'Maverick Helicopter');
  }

  // Instant Cheat Code Drop: Rhino Tank
  public spawnTankService() {
    const spawnPos = this.playerPos.clone().add(
      new THREE.Vector3(Math.sin(this.playerHeading) * 8, 0, Math.cos(this.playerHeading) * 8)
    );
    this.spawnTank(spawnPos);
  }

  private createStuntRamp(pos: THREE.Vector3, rotY: number) {
    const rampGroup = new THREE.Group();
    const rampGeo = new THREE.BoxGeometry(10, 3.5, 14);
    const rampMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 });
    const ramp = new THREE.Mesh(rampGeo, rampMat);
    ramp.rotation.x = -0.35; // slope
    ramp.position.y = 1.2;
    rampGroup.add(ramp);

    // Warning stripes
    const stripeGeo = new THREE.PlaneGeometry(9.6, 2);
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0x111827 });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.rotation.x = -Math.PI / 2 - 0.35;
    stripe.position.set(0, 1.8, 3);
    rampGroup.add(stripe);

    rampGroup.position.copy(pos);
    rampGroup.rotation.y = rotY;
    this.scene.add(rampGroup);

    const box = new THREE.Box3().setFromObject(rampGroup);
    const forward = new THREE.Vector3(0, 0.5, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), rotY).normalize();
    this.rampBoxes.push({ box, dir: forward });
  }

  private createPalmTree(x: number, z: number) {
    const treeGroup = new THREE.Group();
    // Curved trunk
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.55, 8, 6);
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x854d0e });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 4;
    trunk.rotation.z = (Math.random() - 0.5) * 0.15;
    treeGroup.add(trunk);

    // Fronds (Leaves)
    const frondMat = new THREE.MeshLambertMaterial({ color: 0x15803d, side: THREE.DoubleSide });
    for (let a = 0; a < 6; a++) {
      const angle = (a / 6) * Math.PI * 2;
      const frondGeo = new THREE.PlaneGeometry(2, 6);
      const frond = new THREE.Mesh(frondGeo, frondMat);
      frond.position.set(Math.cos(angle) * 1.5, 8, Math.sin(angle) * 1.5);
      frond.rotation.y = angle;
      frond.rotation.x = 0.6;
      treeGroup.add(frond);
    }

    treeGroup.position.set(x, 0, z);
    this.scene.add(treeGroup);
  }

  private createStreetLamp(x: number, z: number) {
    const lampGroup = new THREE.Group();
    const poleGeo = new THREE.CylinderGeometry(0.12, 0.15, 7, 6);
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 3.5;
    lampGroup.add(pole);

    // Arm
    const armGeo = new THREE.BoxGeometry(2, 0.15, 0.15);
    const arm = new THREE.Mesh(armGeo, poleMat);
    arm.position.set(0.8, 6.8, 0);
    lampGroup.add(arm);

    // Light fixture
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), bulbMat);
    bulb.position.set(1.6, 6.7, 0);
    lampGroup.add(bulb);

    lampGroup.position.set(x, 0, z);
    this.scene.add(lampGroup);
  }

  // Vinewood Hills & Mountain Backdrop
  private createMountains() {
    const mountainGroup = new THREE.Group();
    const ridgeConfigs = [
      { x: 0, z: -270, radius: 95, height: 75, color: 0x57534e },
      { x: -120, z: -280, radius: 85, height: 65, color: 0x44403c },
      { x: 130, z: -260, radius: 110, height: 95, color: 0x57534e },
      { x: 230, z: -220, radius: 100, height: 85, color: 0x4b5563 },
      { x: 280, z: -100, radius: 90, height: 70, color: 0x3f3f46 },
      { x: 290, z: 50, radius: 85, height: 60, color: 0x52525b },
      { x: -220, z: -290, radius: 75, height: 50, color: 0x374151 },
    ];

    for (const cfg of ridgeConfigs) {
      const geo = new THREE.ConeGeometry(cfg.radius, cfg.height, 7);
      const mat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        roughness: 0.85,
        metalness: 0.1,
        flatShading: true,
      });
      const peak = new THREE.Mesh(geo, mat);
      peak.position.set(cfg.x, cfg.height / 2 - 4, cfg.z);
      peak.rotation.y = (cfg.x * 0.05) % Math.PI;
      peak.receiveShadow = true;
      mountainGroup.add(peak);

      // Chaparral scrub vegetation on slopes
      for (let s = 0; s < 4; s++) {
        const scrubGeo = new THREE.DodecahedronGeometry(cfg.radius * 0.22, 1);
        const scrubMat = new THREE.MeshLambertMaterial({ color: 0x3f6212 });
        const scrub = new THREE.Mesh(scrubGeo, scrubMat);
        const ang = (s / 4) * Math.PI * 2;
        scrub.position.set(
          cfg.x + Math.cos(ang) * cfg.radius * 0.45,
          cfg.height * 0.25,
          cfg.z + Math.sin(ang) * cfg.radius * 0.45
        );
        mountainGroup.add(scrub);
      }
    }

    this.scene.add(mountainGroup);
  }

  // Iconic 3D "VINEWOOD" hillside sign
  private createVinewoodSign() {
    const signGroup = new THREE.Group();
    const letters = ['V', 'I', 'N', 'E', 'W', 'O', 'O', 'D'];
    const letterMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.3,
      metalness: 0.2,
    });
    const postMat = new THREE.MeshBasicMaterial({ color: 0x334155 });

    const startX = -28;
    const spacing = 7.5;
    const signY = 48;
    const signZ = -230;

    letters.forEach((_char, idx) => {
      const charGroup = new THREE.Group();
      const letterMesh = new THREE.Mesh(new THREE.BoxGeometry(4.8, 6.5, 0.6), letterMat);
      letterMesh.castShadow = true;
      charGroup.add(letterMesh);

      const poleL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 6, 4), postMat);
      poleL.position.set(-1.6, -3.8, -0.2);
      const poleR = poleL.clone();
      poleR.position.x = 1.6;
      charGroup.add(poleL, poleR);

      charGroup.position.set(startX + idx * spacing, signY, signZ);
      signGroup.add(charGroup);
    });

    signGroup.rotation.y = 0.08;
    this.scene.add(signGroup);
  }

  // Sidewalks, pedestrian zebra crossings, and street details
  private createSidewalksAndDetails() {
    const crosswalkMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (let x = -100; x <= 150; x += 50) {
      for (let z = -150; z <= 150; z += 50) {
        // Crosswalk zebra stripes at intersections
        for (let s = -4; s <= 4; s += 2) {
          const stripeZ = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 3), crosswalkMat);
          stripeZ.rotation.x = -Math.PI / 2;
          stripeZ.position.set(x + s, 0.075, z + 8.5);
          this.scene.add(stripeZ);

          const stripeX = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.7), crosswalkMat);
          stripeX.rotation.x = -Math.PI / 2;
          stripeX.position.set(x + 8.5, 0.075, z + s);
          this.scene.add(stripeX);
        }

        // Traffic Light pole at intersection corners
        this.createTrafficLight(x + 7.5, z + 7.5);

        // Modern glowing glass Bus Stop Shelter on major boulevard
        if ((x === 0 || x === 50) && (z === 0 || z === -50 || z === 50)) {
          this.createBusShelter(x + 10, z + 18);
        }

        // Red Fire Hydrant
        this.createFireHydrant(x + 7.8, z - 8);
      }
    }
  }

  private createTrafficLight(x: number, z: number) {
    const group = new THREE.Group();
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.15, 6, 6),
      new THREE.MeshStandardMaterial({ color: 0x1f2937 })
    );
    pole.position.y = 3;
    group.add(pole);

    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.15, 0.15),
      new THREE.MeshStandardMaterial({ color: 0x1f2937 })
    );
    arm.position.set(1.8, 5.8, 0);
    group.add(arm);

    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 1.4, 0.4),
      new THREE.MeshBasicMaterial({ color: 0x111827 })
    );
    box.position.set(3.2, 5.5, 0);
    group.add(box);

    const greenLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0x10b981 })
    );
    greenLight.position.set(3.2, 5.1, 0.22);
    group.add(greenLight);

    const yellowLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0x78350f })
    );
    yellowLight.position.set(3.2, 5.5, 0.22);
    group.add(yellowLight);

    const redLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0x7f1d1d })
    );
    redLight.position.set(3.2, 5.9, 0.22);
    group.add(redLight);

    group.position.set(x, 0, z);
    this.scene.add(group);
  }

  private createBusShelter(x: number, z: number) {
    const shelter = new THREE.Group();
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      metalness: 0.9,
    });
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 0.1), glassMat);
    backWall.position.set(0, 1.5, 0);
    shelter.add(backWall);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.12, 2.4), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
    roof.position.set(0, 3.05, 0.9);
    shelter.add(roof);

    const bench = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.1, 0.6), new THREE.MeshLambertMaterial({ color: 0x78350f }));
    bench.position.set(0, 0.55, 0.6);
    shelter.add(bench);

    const adBox = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.4, 0.25), new THREE.MeshBasicMaterial({ color: 0x10b981 }));
    adBox.position.set(3.3, 1.4, 0.5);
    shelter.add(adBox);

    shelter.position.set(x, 0, z);
    this.scene.add(shelter);
  }

  private createFireHydrant(x: number, z: number) {
    const hydrant = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.22, 0.8, 8),
      new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3, metalness: 0.5 })
    );
    body.position.y = 0.4;
    hydrant.add(body);

    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0xdc2626 })
    );
    cap.position.y = 0.8;
    hydrant.add(cap);

    hydrant.position.set(x, 0, z);
    this.scene.add(hydrant);
  }

  // Iconic Los Santos rooftop billboards
  private createBillboardsAndSigns() {
    const billboards = [
      { text: 'FLYUS - FLY TO LIBERTY CITY', color: 0x0284c7, x: 25, y: 72, z: 25, angle: 0 },
      { text: 'SPRUNK - THE ESSENCE OF LIFE', color: 0x16a34a, x: -25, y: 64, z: -25, angle: Math.PI / 2 },
      { text: 'AMMU-NATION - PROTECT & SERVE', color: 0xb91c1c, x: 75, y: 56, z: -25, angle: -Math.PI / 4 },
      { text: 'E-COLA - DELICIOUSLY INFECTIOUS', color: 0xd97706, x: -75, y: 60, z: 75, angle: Math.PI / 4 },
    ];

    for (const b of billboards) {
      const group = new THREE.Group();
      const board = new THREE.Mesh(
        new THREE.BoxGeometry(20, 5.5, 0.8),
        new THREE.MeshBasicMaterial({ color: b.color })
      );
      board.position.y = 3;
      group.add(board);

      const leg1 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 4, 6),
        new THREE.MeshStandardMaterial({ color: 0x334155 })
      );
      leg1.position.set(-7, 0, 0);
      const leg2 = leg1.clone();
      leg2.position.x = 7;
      group.add(leg1, leg2);

      group.position.set(b.x, b.y, b.z);
      group.rotation.y = b.angle;
      this.scene.add(group);
    }
  }

  // Procedural volumetric cloud clusters in the sky
  private createClouds() {
    const cloudMat = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.72,
    });

    for (let c = 0; c < 12; c++) {
      const cloud = new THREE.Group();
      const numPuffs = 4 + Math.floor(Math.random() * 3);
      for (let p = 0; p < numPuffs; p++) {
        const puffGeo = new THREE.SphereGeometry(7 + Math.random() * 6, 8, 8);
        const puff = new THREE.Mesh(puffGeo, cloudMat);
        puff.position.set(
          (Math.random() - 0.5) * 24,
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 18
        );
        puff.scale.set(1.4, 0.6, 1.2);
        cloud.add(puff);
      }
      cloud.position.set(
        (Math.random() - 0.5) * 500,
        95 + Math.random() * 30,
        (Math.random() - 0.5) * 500
      );
      this.clouds.push(cloud);
      this.scene.add(cloud);
    }
  }

  // Create iconic 3D Character (Franklin, Michael, Trevor with distinct accessories)
  private createPlayer() {
    this.playerGroup = new THREE.Group();

    // Body / Torso (with Franklin/Michael/Trevor shirt colors)
    const bodyGeo = new THREE.BoxGeometry(0.8, 1.1, 0.5);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.8 }); // Franklin blue
    this.playerBodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    this.playerBodyMesh.position.y = 1.2;
    this.playerBodyMesh.castShadow = true;
    this.playerGroup.add(this.playerBodyMesh);

    // Head
    const headGeo = new THREE.BoxGeometry(0.45, 0.5, 0.45);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x8d5b4c, roughness: 0.7 });
    this.playerHeadMesh = new THREE.Mesh(headGeo, headMat);
    this.playerHeadMesh.position.y = 1.95;
    this.playerHeadMesh.castShadow = true;
    this.playerGroup.add(this.playerHeadMesh);

    // Franklin's Backwards Snapback Cap
    this.franklinCap = new THREE.Group();
    const capCrown = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.28, 0.18, 12),
      new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.9 })
    );
    capCrown.position.y = 2.22;
    this.franklinCap.add(capCrown);
    // Backwards visor / brim
    const capBrim = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.04, 0.25),
      new THREE.MeshStandardMaterial({ color: 0x172554, roughness: 0.9 })
    );
    capBrim.position.set(0, 2.14, -0.28);
    this.franklinCap.add(capBrim);
    this.playerGroup.add(this.franklinCap);

    // Michael's Aviator Sunglasses
    const glassesGeo = new THREE.BoxGeometry(0.42, 0.12, 0.08);
    const glassesMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      roughness: 0.1,
      metalness: 0.95,
    });
    this.michaelGlasses = new THREE.Mesh(glassesGeo, glassesMat);
    this.michaelGlasses.position.set(0, 1.97, 0.24);
    this.michaelGlasses.visible = false;
    this.playerGroup.add(this.michaelGlasses);

    // Legs
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    this.playerLegLeft = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.9, 0.35), legMat);
    this.playerLegLeft.position.set(-0.22, 0.45, 0);
    this.playerLegLeft.castShadow = true;
    this.playerGroup.add(this.playerLegLeft);

    this.playerLegRight = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.9, 0.35), legMat);
    this.playerLegRight.position.set(0.22, 0.45, 0);
    this.playerLegRight.castShadow = true;
    this.playerGroup.add(this.playerLegRight);

    // Arms
    const armMat = new THREE.MeshStandardMaterial({ color: 0x8d5b4c });
    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.8, 0.24), armMat);
    rightArm.position.set(0.52, 1.2, 0);
    this.playerGroup.add(rightArm);

    // Weapon in hand
    const weaponGeo = new THREE.BoxGeometry(0.12, 0.18, 0.6);
    const weaponMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8, roughness: 0.2 });
    this.playerWeaponMesh = new THREE.Mesh(weaponGeo, weaponMat);
    this.playerWeaponMesh.position.set(0.55, 1.15, 0.4);
    this.playerGroup.add(this.playerWeaponMesh);

    this.playerGroup.position.copy(this.playerPos);
    this.scene.add(this.playerGroup);

    // Set initial character look
    this.updateCharacterModel(this.activeCharacter);
  }

  // Update 3D Character Mesh & Persona Outfits
  public updateCharacterModel(charId: CharacterId) {
    if (!this.playerBodyMesh) return;

    if (charId === 'franklin') {
      (this.playerBodyMesh.material as THREE.MeshStandardMaterial).color.setHex(0x2563eb); // Blue jacket
      (this.playerHeadMesh.material as THREE.MeshStandardMaterial).color.setHex(0x8d5b4c);
      (this.playerLegLeft.material as THREE.MeshStandardMaterial).color.setHex(0x1e293b);
      (this.playerLegRight.material as THREE.MeshStandardMaterial).color.setHex(0x1e293b);
      if (this.franklinCap) this.franklinCap.visible = true;
      if (this.michaelGlasses) this.michaelGlasses.visible = false;
    } else if (charId === 'michael') {
      (this.playerBodyMesh.material as THREE.MeshStandardMaterial).color.setHex(0x475569); // Slate suit jacket
      (this.playerHeadMesh.material as THREE.MeshStandardMaterial).color.setHex(0xc29b88);
      (this.playerLegLeft.material as THREE.MeshStandardMaterial).color.setHex(0x334155);
      (this.playerLegRight.material as THREE.MeshStandardMaterial).color.setHex(0x334155);
      if (this.franklinCap) this.franklinCap.visible = false;
      if (this.michaelGlasses) this.michaelGlasses.visible = true;
    } else {
      // Trevor Philips
      (this.playerBodyMesh.material as THREE.MeshStandardMaterial).color.setHex(0xf8fafc); // Dirty white tank top
      (this.playerHeadMesh.material as THREE.MeshStandardMaterial).color.setHex(0xb8836b);
      (this.playerLegLeft.material as THREE.MeshStandardMaterial).color.setHex(0x1d4ed8); // Distressed jeans
      (this.playerLegRight.material as THREE.MeshStandardMaterial).color.setHex(0x1d4ed8);
      if (this.franklinCap) this.franklinCap.visible = false;
      if (this.michaelGlasses) this.michaelGlasses.visible = false;
    }
  }

  // 3D Vehicle Generator: Supercars, Police Cruisers, Muscle Cars, Helicopters, Tanks
  public createVehicleMesh(stats: VehicleStats): {
    group: THREE.Group;
    lightR?: THREE.PointLight;
    lightB?: THREE.PointLight;
    exhaustL?: THREE.Mesh;
    exhaustR?: THREE.Mesh;
    rotorMesh?: THREE.Group | THREE.Mesh;
    tailRotorMesh?: THREE.Mesh;
    turretMesh?: THREE.Mesh;
    barrelMesh?: THREE.Mesh;
  } {
    if (stats.type === 'helicopter') {
      return this.createHelicopterMesh(stats);
    }
    if (stats.type === 'tank') {
      return this.createTankMesh(stats);
    }

    const group = new THREE.Group();
    const primaryColor = new THREE.Color(stats.color);

    // Main Chassis
    let chassisGeo: THREE.BufferGeometry;
    let cabinGeo: THREE.BufferGeometry;

    if (stats.type === 'supercar') {
      chassisGeo = new THREE.BoxGeometry(2.3, 0.65, 4.8);
      cabinGeo = new THREE.BoxGeometry(1.8, 0.55, 2.3);
    } else if (stats.type === 'police' || stats.type === 'muscle') {
      chassisGeo = new THREE.BoxGeometry(2.2, 0.75, 4.6);
      cabinGeo = new THREE.BoxGeometry(1.85, 0.65, 2.5);
    } else {
      chassisGeo = new THREE.BoxGeometry(2.1, 0.8, 4.2);
      cabinGeo = new THREE.BoxGeometry(1.8, 0.7, 2.4);
    }

    const chassisMat = new THREE.MeshPhysicalMaterial({
      color: primaryColor,
      metalness: 0.85,
      roughness: 0.12,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      reflectivity: 0.95,
    });
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    chassis.position.y = 0.65;
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    group.add(chassis);

    // Vehicle contact ambient occlusion shadow on asphalt
    const shadowGeo = new THREE.PlaneGeometry(2.4, 5.0);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x050505,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.03;
    group.add(shadowMesh);

    // Side mirrors
    const mirrorGeo = new THREE.BoxGeometry(0.3, 0.15, 0.2);
    const mirrorMat = new THREE.MeshStandardMaterial({ color: primaryColor, metalness: 0.85 });
    const mirrorL = new THREE.Mesh(mirrorGeo, mirrorMat);
    mirrorL.position.set(-1.12, 1.15, 0.4);
    const mirrorR = mirrorL.clone();
    mirrorR.position.x = 1.12;
    group.add(mirrorL, mirrorR);

    // Front radiator grille
    const grille = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.35, 0.1),
      new THREE.MeshBasicMaterial({ color: 0x09090b })
    );
    grille.position.set(0, 0.45, 2.42);
    group.add(grille);

    // Cabin / Windshield
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.08,
      metalness: 0.95,
    });
    const cabin = new THREE.Mesh(cabinGeo, glassMat);
    cabin.position.set(0, 1.2, -0.2);
    cabin.castShadow = true;
    group.add(cabin);

    // Spoiler for Supercar
    if (stats.type === 'supercar') {
      const spoiler = new THREE.Mesh(
        new THREE.BoxGeometry(2.1, 0.1, 0.6),
        new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.3 })
      );
      spoiler.position.set(0, 1.25, -2.1);
      group.add(spoiler);
    }

    // Wheels (4 wheels with rims & red brake calipers)
    const wheelGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.4, 12);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const caliperMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

    const wheelPositions = [
      [-1.15, 0.48, 1.4],
      [1.15, 0.48, 1.4],
      [-1.15, 0.48, -1.4],
      [1.15, 0.48, -1.4],
    ];

    wheelPositions.forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(wx, wy, wz);
      wheel.castShadow = true;
      group.add(wheel);

      // Chrome rim
      const rim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.28, 0.42, 6),
        new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.9 })
      );
      rim.rotation.z = Math.PI / 2;
      rim.position.set(wx, wy, wz);
      group.add(rim);

      // Red performance brake caliper
      const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.16), caliperMat);
      caliper.position.set(wx > 0 ? wx - 0.14 : wx + 0.14, wy + 0.08, wz);
      group.add(caliper);
    });

    // Headlights (glowing front lenses)
    const headLightMat = new THREE.MeshBasicMaterial({ color: 0xfffbeb });
    const hlLeft = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.2, 0.1), headLightMat);
    hlLeft.position.set(-0.75, 0.65, 2.41);
    const hlRight = hlLeft.clone();
    hlRight.position.x = 0.75;
    group.add(hlLeft, hlRight);

    // Forward Volumetric Headlight Light Cones
    const beamGeo = new THREE.ConeGeometry(2.4, 14, 12, 1, true);
    beamGeo.rotateX(Math.PI / 2);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xffedd5,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const beamLeft = new THREE.Mesh(beamGeo, beamMat);
    beamLeft.position.set(-0.75, 0.55, 7.0);
    const beamRight = beamLeft.clone();
    beamRight.position.x = 0.75;
    group.add(beamLeft, beamRight);
    this.headlightConesList.push(beamLeft, beamRight);

    // Taillights
    const tailLightMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const tlLeft = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.1), tailLightMat);
    tlLeft.position.set(-0.75, 0.65, -2.41);
    const tlRight = tlLeft.clone();
    tlRight.position.x = 0.75;
    group.add(tlLeft, tlRight);

    // Exhaust Pipes (for nitro booster flames)
    const exhaustMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const exhaustGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.6, 8);
    exhaustGeo.rotateX(Math.PI / 2);
    const exhaustL = new THREE.Mesh(exhaustGeo, exhaustMat);
    exhaustL.position.set(-0.6, 0.4, -2.6);
    exhaustL.visible = false;
    const exhaustR = new THREE.Mesh(exhaustGeo, exhaustMat);
    exhaustR.position.set(0.6, 0.4, -2.6);
    exhaustR.visible = false;
    group.add(exhaustL, exhaustR);

    // Police Strobe Bar (if police cruiser)
    let lightR: THREE.PointLight | undefined;
    let lightB: THREE.PointLight | undefined;

    if (stats.isPolice) {
      // Light bar base
      const barBase = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.15, 0.35),
        new THREE.MeshStandardMaterial({ color: 0x1f2937 })
      );
      barBase.position.set(0, 1.58, -0.2);
      group.add(barBase);

      // Red dome
      const redDome = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.18, 0.3),
        new THREE.MeshBasicMaterial({ color: 0xef4444 })
      );
      redDome.position.set(-0.32, 1.62, -0.2);
      group.add(redDome);

      // Blue dome
      const blueDome = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.18, 0.3),
        new THREE.MeshBasicMaterial({ color: 0x3b82f6 })
      );
      blueDome.position.set(0.32, 1.62, -0.2);
      group.add(blueDome);

      // Flashing point lights
      lightR = new THREE.PointLight(0xef4444, 2.5, 25);
      lightR.position.set(-0.35, 1.8, -0.2);
      group.add(lightR);

      lightB = new THREE.PointLight(0x3b82f6, 2.5, 25);
      lightB.position.set(0.35, 1.8, -0.2);
      group.add(lightB);
    }

    return { group, lightR, lightB, exhaustL, exhaustR };
  }

  // Spawn cars around the map
  private spawnInitialVehicles() {
    // Player's starting Supercar (Custom Pegassi Zentorno style)
    const playerCarStats: VehicleStats = {
      id: 'player_car_1',
      type: 'supercar',
      name: 'Pegassi Zentorno',
      maxSpeed: 42,
      acceleration: 38,
      handling: 2.8,
      health: 1000,
      maxHealth: 1000,
      color: '#f59e0b', // Sunset Orange
    };
    const playerCarModel = this.createVehicleMesh(playerCarStats);
    playerCarModel.group.position.set(8, 0, 15);
    this.scene.add(playerCarModel.group);

    this.vehicles.push({
      mesh: playerCarModel.group,
      stats: playerCarStats,
      velocity: new THREE.Vector3(),
      speed: 0,
      steering: 0,
      heading: 0,
      isPlayer: false,
      isPolice: false,
      isTraffic: false,
      exhaustL: playerCarModel.exhaustL,
      exhaustR: playerCarModel.exhaustR,
    });

    // Muscle car parked near bank
    const muscleStats: VehicleStats = {
      id: 'muscle_1',
      type: 'muscle',
      name: 'Bravado Gauntlet',
      maxSpeed: 36,
      acceleration: 32,
      handling: 2.3,
      health: 900,
      maxHealth: 900,
      color: '#dc2626',
    };
    const muscleModel = this.createVehicleMesh(muscleStats);
    muscleModel.group.position.set(-45, 0, 55);
    this.scene.add(muscleModel.group);
    this.vehicles.push({
      mesh: muscleModel.group,
      stats: muscleStats,
      velocity: new THREE.Vector3(),
      speed: 0,
      steering: 0,
      heading: Math.PI / 2,
      isPlayer: false,
      isPolice: false,
      isTraffic: false,
      exhaustL: muscleModel.exhaustL,
      exhaustR: muscleModel.exhaustR,
    });

    // Spawn 8 ambient traffic cars cruising on streets
    const trafficColors = ['#2563eb', '#10b981', '#ffffff', '#1f2937', '#e11d48', '#8b5cf6'];
    for (let i = 0; i < 8; i++) {
      const stats: VehicleStats = {
        id: `traffic_${i}`,
        type: 'suv',
        name: 'Dundreary Landstalker',
        maxSpeed: 24,
        acceleration: 18,
        handling: 2.0,
        health: 700,
        maxHealth: 700,
        color: trafficColors[i % trafficColors.length],
      };
      const model = this.createVehicleMesh(stats);
      const isVertical = i % 2 === 0;
      const x = isVertical ? ((i % 4) - 2) * 50 + 3.5 : (Math.random() * 200 - 100);
      const z = isVertical ? (Math.random() * 200 - 100) : ((i % 4) - 2) * 50 + 3.5;
      model.group.position.set(x, 0, z);
      this.scene.add(model.group);

      this.vehicles.push({
        mesh: model.group,
        stats,
        velocity: new THREE.Vector3(),
        speed: 12 + Math.random() * 8,
        steering: 0,
        heading: isVertical ? 0 : Math.PI / 2,
        isPlayer: false,
        isPolice: false,
        isTraffic: true,
      });
    }
  }

  // Spawn pedestrians strolling on sidewalks
  private spawnPedestrians() {
    const clothesColors = [0xef4444, 0x10b981, 0x3b82f6, 0xf59e0b, 0x8b5cf6, 0xec4899];
    for (let i = 0; i < 20; i++) {
      const pedGroup = new THREE.Group();
      const color = clothesColors[Math.floor(Math.random() * clothesColors.length)];

      const pedBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 1.0, 0.4),
        new THREE.MeshStandardMaterial({ color })
      );
      pedBody.position.y = 1.1;
      pedGroup.add(pedBody);

      const pedHead = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.45, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x8d5b4c })
      );
      pedHead.position.y = 1.8;
      pedGroup.add(pedHead);

      const x = (Math.random() * 200 - 100);
      const z = (Math.random() * 200 - 100);
      pedGroup.position.set(x, 0, z);
      this.scene.add(pedGroup);

      this.pedestrians.push({
        mesh: pedGroup,
        pos: pedGroup.position,
        dir: new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize(),
        speed: 1.5 + Math.random() * 1.5,
        health: 100,
        fleeing: false,
        ragdoll: false,
        rotSpeed: 0,
      });
    }
  }

  // Event Listeners for WASD, Mouse, Keys
  private setupEventListeners() {
    window.addEventListener('keydown', (e) => {
      const code = e.code;
      this.keys[code] = true;

      sound.init(); // Auto-init on first keypress
      sound.resume();

      // Enter/Exit Vehicle (E key or F key)
      if (code === 'KeyE' || code === 'KeyF') {
        this.toggleEnterVehicle();
      }

      // Horn / Siren (H key)
      if (code === 'KeyH') {
        sound.playHorn();
      }

      // Special Ability (Caps / KeyX)
      if (code === 'KeyX' || code === 'CapsLock') {
        this.toggleSpecialAbility();
      }

      // Character Switch Wheel (KeyC, KeyV, or Alt)
      if (code === 'KeyC' || code === 'KeyV' || code === 'AltLeft' || code === 'AltRight') {
        e.preventDefault();
        if (this.callbacks.onToggleCharacterWheel) {
          this.callbacks.onToggleCharacterWheel();
        }
      }

      // Graphics Modal (KeyG)
      if (code === 'KeyG') {
        if (this.callbacks.onToggleGraphicsModal) {
          this.callbacks.onToggleGraphicsModal();
        }
      }

      // Radio Station change (Q or R)
      if (code === 'KeyR') {
        this.cycleRadio();
      }

      // Quick Weapon hotkeys 1-6 & Direct Character switch 7, 8, 9
      if (code === 'Digit1') this.selectWeapon('fist');
      if (code === 'Digit2') this.selectWeapon('pistol');
      if (code === 'Digit3') this.selectWeapon('smg');
      if (code === 'Digit4') this.selectWeapon('rifle');
      if (code === 'Digit5') this.selectWeapon('rpg');
      if (code === 'Digit6') this.selectWeapon('grenade');
      if (code === 'Digit7') this.switchCharacter('franklin');
      if (code === 'Digit8') this.switchCharacter('michael');
      if (code === 'Digit9') this.switchCharacter('trevor');
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    this.container.addEventListener('pointerdown', (e) => {
      sound.init();
      sound.resume();
      if (e.button === 0) {
        this.isPointerDown = true;
        this.performAttack();
      }
    });

    window.addEventListener('pointerup', () => {
      this.isPointerDown = false;
    });

    window.addEventListener('pointermove', (e) => {
      const rect = this.container.getBoundingClientRect();
      this.mousePos.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mousePos.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Mouse Look / Orbit Camera when RMB held or in combat
      if (e.buttons === 2 || (!this.currentVehicle && e.buttons === 1)) {
        this.cameraYaw -= e.movementX * 0.005;
        this.cameraPitch = Math.max(0.05, Math.min(1.2, this.cameraPitch + e.movementY * 0.005));
      }
    });

    // Prevent default context menu on right click
    this.container.addEventListener('contextmenu', (e) => e.preventDefault());

    // Window Resize
    window.addEventListener('resize', () => {
      const width = this.container.clientWidth || window.innerWidth;
      const height = this.container.clientHeight || window.innerHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    });
  }

  // Toggle Enter / Exit nearest vehicle
  public toggleEnterVehicle() {
    if (this.currentVehicle) {
      // Exit vehicle
      const exitPos = this.currentVehicle.mesh.position.clone().add(new THREE.Vector3(-2.2, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.currentVehicle.heading));
      exitPos.y = Math.max(0, exitPos.y);
      this.playerPos.copy(exitPos);
      this.playerGroup.position.copy(this.playerPos);
      this.playerGroup.visible = true;
      this.currentVehicle.isPlayer = false;

      if (this.currentVehicle.isHelicopter) {
        sound.updateHelicopterSound(false, 0);
      } else {
        sound.updateEngineSound(0, false);
      }

      this.currentVehicle = null;
      this.callbacks.onStateUpdate({ inVehicle: false, inHelicopter: false, vehicleSpeedMph: 0, altitude: 0 });
    } else {
      // Find closest vehicle within 6.5 meters
      let closest: VehicleEntity | null = null;
      let minDistance = 6.5;

      for (const v of this.vehicles) {
        const dist = v.mesh.position.distanceTo(this.playerPos);
        if (dist < minDistance) {
          minDistance = dist;
          closest = v;
        }
      }

      if (closest) {
        this.currentVehicle = closest;
        closest.isPlayer = true;
        this.playerGroup.visible = false;

        // If stolen police car or witness nearby, might increase wanted level
        if (closest.isPolice && this.wantedStars === 0) {
          this.addWantedStars(1);
        }

        if (closest.isHelicopter) {
          if (closest.altitude === undefined) {
            closest.altitude = closest.mesh.position.y;
          }
          sound.updateHelicopterSound(true, 0.4);
        } else {
          sound.updateEngineSound(0.2, true);
        }

        this.callbacks.onStateUpdate({
          inVehicle: true,
          inHelicopter: !!closest.isHelicopter,
          vehicleHealth: closest.stats.health,
          vehicleMaxHealth: closest.stats.maxHealth,
          altitude: closest.isHelicopter ? Math.round(closest.mesh.position.y) : 0,
        });
      }
    }
  }

  // Special ability trigger (Franklin Slowmo, Michael Bullet Time, Trevor Rage)
  public toggleSpecialAbility() {
    if (this.isSpecialActive) {
      this.isSpecialActive = false;
    } else if (this.specialMeter > 25) {
      this.isSpecialActive = true;
    }
    this.callbacks.onStateUpdate({ isSpecialActive: this.isSpecialActive });
  }

  // Cycle Radio Stations
  public cycleRadio() {
    const stations: RadioStationId[] = ['radio_los_santos', 'non_stop_pop', 'west_coast_classics', 'vinewood_boulevard', 'off'];
    const idx = stations.indexOf(this.currentRadio);
    const next = stations[(idx + 1) % stations.length];
    this.setRadioStation(next);
  }

  public setRadioStation(station: RadioStationId) {
    this.currentRadio = station;
    sound.setRadio(station);
    this.callbacks.onStateUpdate({ currentRadio: station });
  }

  // Weapon Select
  public selectWeapon(type: WeaponType) {
    this.selectedWeapon = type;
    this.callbacks.onStateUpdate({ selectedWeapon: type });

    // Update weapon model visual
    if (type === 'fist') {
      this.playerWeaponMesh.visible = false;
    } else {
      this.playerWeaponMesh.visible = true;
      if (type === 'rpg') {
        this.playerWeaponMesh.scale.set(1.5, 1.5, 2.5);
      } else if (type === 'rifle' || type === 'smg') {
        this.playerWeaponMesh.scale.set(1.1, 1.1, 1.8);
      } else {
        this.playerWeaponMesh.scale.set(1, 1, 1);
      }
    }
  }

  // Shooting & Combat attack
  public performAttack() {
    const now = performance.now();

    // Vehicle Specific Heavy Weapons: Tank Cannon & Helicopter Rocket Pods
    if (this.currentVehicle?.isTank) {
      if (now - this.lastShotTime < 1600) return;
      this.lastShotTime = now;
      sound.playTankCannon();
      this.spawnMuzzleFlash();
      const origin = this.currentVehicle.mesh.position.clone().add(new THREE.Vector3(0, 2.0, 0));
      const aimDir = new THREE.Vector3(Math.sin(this.currentVehicle.heading), 0, Math.cos(this.currentVehicle.heading)).normalize();

      const shellGeo = new THREE.CylinderGeometry(0.2, 0.2, 1.2, 8);
      shellGeo.rotateX(Math.PI / 2);
      const shellMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 });
      const shell = new THREE.Mesh(shellGeo, shellMat);
      shell.position.copy(origin).add(aimDir.clone().multiplyScalar(4.5));
      this.scene.add(shell);

      this.projectiles.push({
        mesh: shell,
        pos: shell.position,
        velocity: aimDir.clone().multiplyScalar(65),
        lifetime: 3.0,
        damage: 1500,
        isRPG: true,
      });

      if (this.wantedStars < 3) this.addWantedStars(1);
      return;
    }

    if (this.currentVehicle?.isHelicopter) {
      if (now - this.lastShotTime < 450) return;
      this.lastShotTime = now;
      sound.playRPGLaunch();
      this.spawnMuzzleFlash();
      const origin = this.currentVehicle.mesh.position.clone().add(new THREE.Vector3(0, 1.0, 0));
      const aimDir = new THREE.Vector3(Math.sin(this.currentVehicle.heading), -0.12, Math.cos(this.currentVehicle.heading)).normalize();

      const rocketGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.9, 8);
      rocketGeo.rotateX(Math.PI / 2);
      const rocketMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9 });
      const rocket = new THREE.Mesh(rocketGeo, rocketMat);
      rocket.position.copy(origin).add(aimDir.clone().multiplyScalar(2.5));
      this.scene.add(rocket);

      this.projectiles.push({
        mesh: rocket,
        pos: rocket.position,
        velocity: aimDir.clone().multiplyScalar(55),
        lifetime: 3.5,
        damage: 600,
        isRPG: true,
      });
      return;
    }

    const isRPG = this.selectedWeapon === 'rpg';
    const isMelee = this.selectedWeapon === 'fist';
    const fireInterval = this.selectedWeapon === 'smg' ? 120 : (this.selectedWeapon === 'rifle' ? 180 : (isRPG ? 1200 : 350));

    if (now - this.lastShotTime < fireInterval) return;
    this.lastShotTime = now;

    if (isMelee) {
      sound.playPunch();
      this.checkMeleeHit();
      return;
    }

    // Play procedural weapon sound
    if (this.selectedWeapon === 'pistol') sound.playPistol();
    else if (this.selectedWeapon === 'smg') sound.playSMG();
    else if (this.selectedWeapon === 'rifle') sound.playRifle();
    else if (isRPG) sound.playRPGLaunch();
    else sound.playPistol();

    // Muzzle flash particle
    this.spawnMuzzleFlash();

    // Shooting alerts nearby police or triggers wanted star if civilians present
    if (this.wantedStars === 0 && Math.random() > 0.4) {
      this.addWantedStars(1);
    }

    // Bullet direction
    const origin = this.currentVehicle ? this.currentVehicle.mesh.position.clone().add(new THREE.Vector3(0, 1.2, 0)) : this.playerPos.clone().add(new THREE.Vector3(0, 1.3, 0));
    
    // Shoot forward along player heading or towards aim raycast
    const aimDir = new THREE.Vector3(Math.sin(this.playerHeading), 0, Math.cos(this.playerHeading)).normalize();

    if (isRPG) {
      // Spawn 3D Rocket Projectile
      const rocketGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.8, 8);
      rocketGeo.rotateX(Math.PI / 2);
      const rocketMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 });
      const rocket = new THREE.Mesh(rocketGeo, rocketMat);
      rocket.position.copy(origin).add(aimDir.clone().multiplyScalar(1.5));
      this.scene.add(rocket);

      this.projectiles.push({
        mesh: rocket,
        pos: rocket.position,
        velocity: aimDir.clone().multiplyScalar(45),
        lifetime: 3.5,
        damage: 500,
        isRPG: true,
      });
    } else {
      // Fast projectile / tracer
      const tracerGeo = new THREE.BoxGeometry(0.08, 0.08, 1.2);
      const tracerMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      const tracer = new THREE.Mesh(tracerGeo, tracerMat);
      tracer.position.copy(origin).add(aimDir.clone().multiplyScalar(1.2));
      tracer.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), aimDir);
      this.scene.add(tracer);

      this.projectiles.push({
        mesh: tracer,
        pos: tracer.position,
        velocity: aimDir.clone().multiplyScalar(110),
        lifetime: 0.8,
        damage: this.selectedWeapon === 'rifle' ? 65 : (this.selectedWeapon === 'smg' ? 35 : 45),
        isRPG: false,
      });
    }

    // Pedestrians nearby panic & flee
    this.alertNearbyPedestrians(origin, 35);
  }

  private checkMeleeHit() {
    const punchPos = this.playerPos.clone().add(new THREE.Vector3(Math.sin(this.playerHeading), 0, Math.cos(this.playerHeading)).multiplyScalar(1.6));
    for (const ped of this.pedestrians) {
      if (ped.pos.distanceTo(punchPos) < 2.0 && !ped.ragdoll) {
        ped.health -= 50;
        ped.fleeing = true;
        if (ped.health <= 0) {
          ped.ragdoll = true;
          ped.mesh.rotation.x = Math.PI / 2;
          this.money += Math.floor(20 + Math.random() * 80);
          this.callbacks.onStateUpdate({ money: this.money });
          if (this.wantedStars === 0) this.addWantedStars(1);
        }
      }
    }
  }

  private spawnMuzzleFlash() {
    const flashGeo = new THREE.SphereGeometry(0.2, 6, 6);
    const flashMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const flash = new THREE.Mesh(flashGeo, flashMat);
    const offset = new THREE.Vector3(Math.sin(this.playerHeading) * 1.2, 1.3, Math.cos(this.playerHeading) * 1.2);
    flash.position.copy(this.playerPos).add(offset);
    this.scene.add(flash);

    this.particles.push({
      mesh: flash,
      velocity: new THREE.Vector3(),
      lifetime: 0.05,
      maxLifetime: 0.05,
    });
  }

  private alertNearbyPedestrians(center: THREE.Vector3, radius: number) {
    for (const ped of this.pedestrians) {
      if (ped.pos.distanceTo(center) < radius) {
        ped.fleeing = true;
        ped.speed = 5.5 + Math.random() * 2;
        ped.dir.subVectors(ped.pos, center).normalize();
      }
    }
  }

  // Wanted Stars Logic (1-5 stars)
  public addWantedStars(count: number) {
    const prev = this.wantedStars;
    this.wantedStars = Math.min(5, this.wantedStars + count);
    if (this.wantedStars > prev) {
      sound.playWantedSting();
      sound.setSiren(true);
      this.spawnPoliceReinforcements();
    }
    this.wantedCooling = false;
    this.wantedCoolingTimer = 0;
    this.callbacks.onStateUpdate({
      wantedStars: this.wantedStars,
      wantedCooling: false,
      wantedCoolingProgress: 0,
    });
  }

  public clearWantedLevel() {
    this.wantedStars = 0;
    this.wantedCooling = false;
    sound.setSiren(false);
    this.callbacks.onStateUpdate({ wantedStars: 0, wantedCooling: false, wantedCoolingProgress: 0 });

    // Despawn police cruisers
    this.vehicles = this.vehicles.filter((v) => {
      if (v.isPolice) {
        this.scene.remove(v.mesh);
        return false;
      }
      return true;
    });
  }

  // Spawn police pursuit cruisers based on wanted stars
  private spawnPoliceReinforcements() {
    const neededPolice = this.wantedStars * 2;
    const currentPolice = this.vehicles.filter((v) => v.isPolice).length;
    const toSpawn = Math.max(0, neededPolice - currentPolice);

    for (let i = 0; i < toSpawn; i++) {
      const stats: VehicleStats = {
        id: `police_${Date.now()}_${i}`,
        type: 'police',
        name: 'Vapid Stanier Cruiser',
        maxSpeed: 38 + this.wantedStars * 2,
        acceleration: 30 + this.wantedStars * 3,
        handling: 2.6,
        health: 1200,
        maxHealth: 1200,
        color: '#ffffff',
        isPolice: true,
      };

      const model = this.createVehicleMesh(stats);
      // Spawn along road 70m away from player
      const angle = Math.random() * Math.PI * 2;
      const dist = 60 + Math.random() * 25;
      const spawnX = this.playerPos.x + Math.cos(angle) * dist;
      const spawnZ = this.playerPos.z + Math.sin(angle) * dist;

      model.group.position.set(spawnX, 0, spawnZ);
      this.scene.add(model.group);

      this.vehicles.push({
        mesh: model.group,
        stats,
        velocity: new THREE.Vector3(),
        speed: 25,
        steering: 0,
        heading: angle + Math.PI,
        isPlayer: false,
        isPolice: true,
        isTraffic: false,
        policeLightR: model.lightR,
        policeLightB: model.lightB,
        strobeTimer: 0,
        strobeState: false,
      });
    }
  }

  // Set Active Mission & 3D Waypoint
  public setActiveMission(mission: Mission | null) {
    this.activeMission = mission;
    if (this.missionMarkerMesh) {
      this.scene.remove(this.missionMarkerMesh);
      this.missionMarkerMesh = null;
    }

    if (mission) {
      // Create glowing vertical 3D cylinder waypoint & beacon
      const markerGroup = new THREE.Group();
      const beaconGeo = new THREE.CylinderGeometry(mission.targetRadius, mission.targetRadius, 25, 16, 1, true);
      const beaconMat = new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
      });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.y = 12.5;
      markerGroup.add(beacon);

      // Rotating diamond icon on top
      const diamondGeo = new THREE.OctahedronGeometry(2, 0);
      const diamondMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.1, metalness: 0.8 });
      const diamond = new THREE.Mesh(diamondGeo, diamondMat);
      diamond.position.y = 5;
      markerGroup.add(diamond);

      markerGroup.position.set(mission.targetPos.x, 0, mission.targetPos.z);
      this.scene.add(markerGroup);
      this.missionMarkerMesh = markerGroup;
    }

    this.callbacks.onStateUpdate({ currentMission: mission });
  }

  // Authentic GTA V Character Switch Sequence (Sky Satellite Zoom & Swoop)
  public switchCharacter(charId: CharacterId) {
    if (this.isSwitchingCharacter) return;

    this.pendingCharacter = charId;
    this.isSwitchingCharacter = true;
    this.switchTimer = 0;
    this.characterSwapped = false;

    // Capture starting position
    const currentPos = this.currentVehicle ? this.currentVehicle.mesh.position : this.playerPos;
    this.switchStartPos.copy(currentPos);

    // If currently driving, exit smoothly before sky rocket
    if (this.currentVehicle) {
      this.currentVehicle.isPlayer = false;
      this.currentVehicle.speed = 0;
      this.currentVehicle = null;
      this.playerGroup.visible = true;
    }

    // Set signature home base coordinates for trio:
    if (charId === 'franklin') {
      this.switchTargetPos.set(25, 1, 25); // Forum Drive / LS Customs
    } else if (charId === 'michael') {
      this.switchTargetPos.set(100, 1, 80); // Rockford Hills Mansion
    } else {
      this.switchTargetPos.set(-120, 1, -110); // Sandy Shores Coastal lot
    }

    // Play iconic sub-bass & stratosphere sting sound
    sound.playCharacterSwitchSound();

    // Signal React UI
    this.callbacks.onStateUpdate({
      isSwitchingCharacter: true,
      inVehicle: false,
    });
  }

  // Mid-flight character swap
  private executeCharacterSwap(charId: CharacterId) {
    this.activeCharacter = charId;
    this.playerPos.copy(this.switchTargetPos);
    this.playerGroup.position.copy(this.playerPos);

    // Update 3D clothes and accessories (snapback cap, aviators, tank top)
    this.updateCharacterModel(charId);

    // Spawn personal vehicle parked neatly adjacent
    this.spawnCharacterPersonalCar(charId);

    const profile = CHARACTERS_DATA.find((c) => c.id === charId);
    if (profile) {
      this.callbacks.onStateUpdate({
        character: charId,
        health: 100,
        armor: 100,
        specialMeter: 100,
        characterSwitchBanner: {
          name: profile.name.toUpperCase(),
          subtitle: `${profile.locationName.toUpperCase()} • ${profile.specialAbilityName}`,
          color: profile.color,
        },
      });
    }
  }

  // Spawn signature personal car for the switched character
  private spawnCharacterPersonalCar(charId: CharacterId) {
    let carStats: VehicleStats;
    let spawnOffset: THREE.Vector3;

    if (charId === 'franklin') {
      carStats = {
        id: `personal_franklin_${Date.now()}`,
        type: 'supercar',
        name: 'Bravado Buffalo S',
        maxSpeed: 42,
        acceleration: 38,
        handling: 3.2,
        health: 1000,
        maxHealth: 1000,
        color: '#2563eb', // Metallic Blue
      };
      spawnOffset = new THREE.Vector3(6, 0, 4);
    } else if (charId === 'michael') {
      carStats = {
        id: `personal_michael_${Date.now()}`,
        type: 'sedan',
        name: 'Obey Tailgater',
        maxSpeed: 36,
        acceleration: 32,
        handling: 2.8,
        health: 1100,
        maxHealth: 1100,
        color: '#1e293b', // Executive Black / Slate
      };
      spawnOffset = new THREE.Vector3(6, 0, 4);
    } else {
      carStats = {
        id: `personal_trevor_${Date.now()}`,
        type: 'muscle',
        name: 'Canis Bodhi 4x4',
        maxSpeed: 34,
        acceleration: 35,
        handling: 2.6,
        health: 1400,
        maxHealth: 1400,
        color: '#ea580c', // Dirty Red / Orange
      };
      spawnOffset = new THREE.Vector3(6, 0, 4);
    }

    const model = this.createVehicleMesh(carStats);
    const carPos = this.playerPos.clone().add(spawnOffset);
    model.group.position.set(carPos.x, 0, carPos.z);
    this.scene.add(model.group);

    this.vehicles.push({
      mesh: model.group,
      stats: carStats,
      velocity: new THREE.Vector3(),
      speed: 0,
      steering: 0,
      heading: 0,
      isPlayer: false,
      isPolice: false,
      isTraffic: false,
      exhaustL: model.exhaustL,
      exhaustR: model.exhaustR,
    });
  }

  // Super Ultra Graphics Settings API
  public applyGraphicsSettings(newSettings: Partial<GraphicsSettings>) {
    this.graphicsSettings = { ...this.graphicsSettings, ...newSettings };

    if (newSettings.timeOfDay) {
      this.applyTimeOfDay(this.graphicsSettings.timeOfDay);
    }

    if (newSettings.quality) {
      const q = newSettings.quality;
      if (q === 'super_ultra') {
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.dirLight.castShadow = true;
        this.dirLight.shadow.mapSize.set(4096, 4096);
        this.dirLight.shadow.radius = 2.5;
      } else if (q === 'ultra') {
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        this.renderer.shadowMap.enabled = true;
        this.dirLight.castShadow = true;
        this.dirLight.shadow.mapSize.set(2048, 2048);
        this.dirLight.shadow.radius = 1.5;
      } else {
        this.renderer.setPixelRatio(1);
        this.renderer.shadowMap.enabled = true;
        this.dirLight.castShadow = true;
        this.dirLight.shadow.mapSize.set(1024, 1024);
        this.dirLight.shadow.radius = 1.0;
      }
    }

    if (newSettings.shadows !== undefined) {
      this.renderer.shadowMap.enabled = this.graphicsSettings.shadows;
      this.dirLight.castShadow = this.graphicsSettings.shadows;
    }

    if (newSettings.reflections !== undefined) {
      const roughness = this.graphicsSettings.reflections ? 0.12 : 0.45;
      const metalness = this.graphicsSettings.reflections ? 0.3 : 0.05;
      for (const mat of this.roadMats) {
        mat.roughness = roughness;
        mat.metalness = metalness;
      }
    }

    if (newSettings.volumetricLights !== undefined) {
      for (const cone of this.headlightConesList) {
        cone.visible = this.graphicsSettings.volumetricLights;
      }
      if (this.sunCorona) {
        this.sunCorona.visible = this.graphicsSettings.volumetricLights;
      }
    }

    this.callbacks.onStateUpdate({ graphicsSettings: this.graphicsSettings });
  }

  // Dynamic Lighting & Skybox Atmosphere
  public applyTimeOfDay(time: TimeOfDay) {
    if (!this.scene || !this.dirLight || !this.hemiLight) return;

    if (time === 'sunset') {
      // Iconic Los Santos Golden Sunset Hour
      this.scene.background = new THREE.Color(0xd97736);
      this.scene.fog = new THREE.FogExp2(0xd97736, 0.003);
      this.dirLight.color.setHex(0xffaa44);
      this.dirLight.intensity = 2.0;
      this.dirLight.position.set(180, 85, -140);
      this.hemiLight.color.setHex(0xffaa77);
      this.hemiLight.groundColor.setHex(0x553344);
      this.ambientLight.color.setHex(0x774433);
      this.ambientLight.intensity = 0.55;
      this.renderer.toneMappingExposure = 1.15;
      if (this.sunMesh) {
        this.sunMesh.visible = true;
        this.sunMesh.position.set(380, 180, -320);
        (this.sunMesh.material as THREE.MeshBasicMaterial).color.setHex(0xffedd5);
      }
      if (this.sunCorona) {
        this.sunCorona.visible = true;
        this.sunCorona.position.copy(this.sunMesh.position);
        (this.sunCorona.material as THREE.MeshBasicMaterial).color.setHex(0xf59e0b);
      }
      for (const mat of this.windowMats) {
        mat.color.setHex(0xfef08a);
      }
    } else if (time === 'noon') {
      // Blazing California Sunshine & Blue Sky
      this.scene.background = new THREE.Color(0x60a5fa);
      this.scene.fog = new THREE.FogExp2(0x93c5fd, 0.002);
      this.dirLight.color.setHex(0xfffaed);
      this.dirLight.intensity = 2.2;
      this.dirLight.position.set(60, 220, 60);
      this.hemiLight.color.setHex(0xffffff);
      this.hemiLight.groundColor.setHex(0x444455);
      this.ambientLight.color.setHex(0xffffff);
      this.ambientLight.intensity = 0.45;
      this.renderer.toneMappingExposure = 1.1;
      if (this.sunMesh) {
        this.sunMesh.visible = true;
        this.sunMesh.position.set(120, 440, 120);
        (this.sunMesh.material as THREE.MeshBasicMaterial).color.setHex(0xffffff);
      }
      if (this.sunCorona) {
        this.sunCorona.visible = false;
      }
      for (const mat of this.windowMats) {
        mat.color.setHex(0x64748b);
      }
    } else if (time === 'night') {
      // Cyberpunk Neon Night Los Santos
      this.scene.background = new THREE.Color(0x090d16);
      this.scene.fog = new THREE.FogExp2(0x0b1120, 0.0035);
      this.dirLight.color.setHex(0x38bdf8);
      this.dirLight.intensity = 0.45;
      this.dirLight.position.set(-80, 160, 90);
      this.hemiLight.color.setHex(0x1e293b);
      this.hemiLight.groundColor.setHex(0x0f172a);
      this.ambientLight.color.setHex(0x334155);
      this.ambientLight.intensity = 0.85;
      this.renderer.toneMappingExposure = 1.05;
      if (this.sunMesh) {
        this.sunMesh.visible = true;
        this.sunMesh.position.set(-180, 320, 220); // Moon
        (this.sunMesh.material as THREE.MeshBasicMaterial).color.setHex(0xe0f2fe);
      }
      if (this.sunCorona) {
        this.sunCorona.visible = false;
      }
      for (const mat of this.windowMats) {
        mat.color.setHex(Math.random() > 0.4 ? 0xfef08a : (Math.random() > 0.5 ? 0x38bdf8 : 0xf472b6));
      }
    } else {
      // Wet Asphalt Rain Reflections
      this.scene.background = new THREE.Color(0x272e39);
      this.scene.fog = new THREE.FogExp2(0x334155, 0.0055);
      this.dirLight.color.setHex(0x94a3b8);
      this.dirLight.intensity = 1.0;
      this.dirLight.position.set(100, 150, -50);
      this.hemiLight.color.setHex(0x475569);
      this.hemiLight.groundColor.setHex(0x1e293b);
      this.ambientLight.color.setHex(0x64748b);
      this.ambientLight.intensity = 0.6;
      this.renderer.toneMappingExposure = 1.15;
      if (this.sunMesh) this.sunMesh.visible = false;
      if (this.sunCorona) this.sunCorona.visible = false;
      for (const mat of this.roadMats) {
        mat.roughness = 0.05; // Ultra wet glossy reflection
        mat.metalness = 0.45;
      }
    }

    // Refresh dynamic environment reflections to match current atmosphere
    this.updateEnvironmentMap(time);
  }

  // Main 60 FPS Game Loop
  private startLoop() {
    const loop = () => {
      this.animId = requestAnimationFrame(loop);
      const delta = Math.min(this.clock.getDelta(), 0.1);

      // Animate ocean water ripples & wave swell
      if (this.oceanMesh) {
        this.oceanMesh.position.y = -0.4 + Math.sin(Date.now() * 0.0018) * 0.12;
      }

      // Slowly drift procedural 3D clouds across the sky
      for (const c of this.clouds) {
        c.position.x += delta * 2.2;
        if (c.position.x > 320) {
          c.position.x = -320;
        }
      }

      // Blink red rooftop aviation beacons
      this.beaconTimer += delta;
      const beaconVisible = Math.floor(this.beaconTimer * 2.2) % 2 === 0;
      for (const b of this.beaconMeshes) {
        b.visible = beaconVisible;
      }

      // Rotate Airport Radar Dish
      if (this.airportRadarDish) {
        this.airportRadarDish.rotation.y += delta * 1.6;
      }

      // Animate Central Garden Fountain water spray particles
      if (this.gardenFountainParticles) {
        const pPos = this.gardenFountainParticles.geometry.attributes.position;
        const count = pPos.count;
        for (let i = 0; i < count; i++) {
          let py = pPos.getY(i) + (1.2 + Math.random() * 0.8) * delta;
          if (py > 5.0) py = 2.8;
          pPos.setY(i, py);
        }
        pPos.needsUpdate = true;
      }

      // Check for Fort Zancudo Military Restricted Zone Trespassing
      const activePos = this.currentVehicle ? this.currentVehicle.mesh.position : this.playerPos;
      if (activePos.x >= 165 && activePos.x <= 295 && activePos.z >= -170 && activePos.z <= -50) {
        if (!this.militaryAlarmTriggered) {
          this.militaryAlarmTriggered = true;
          sound.playAirRaidSiren();
          if (this.wantedStars < 4) {
            this.addWantedStars(4 - this.wantedStars);
          }
        }
        this.militaryWarningTimer += delta;
        if (this.militaryWarningTimer > 5.0) {
          this.militaryWarningTimer = 0;
          sound.playAirRaidSiren();
        }
      } else {
        this.militaryAlarmTriggered = false;
        this.militaryWarningTimer = 0;
      }

      // Special Ability Time Dilation
      const timeScale = this.isSpecialActive
        ? this.activeCharacter === 'franklin' && this.currentVehicle
          ? 0.35
          : this.activeCharacter === 'michael'
          ? 0.25
          : 1.0
        : 1.0;
      const scaledDelta = delta * timeScale;

      this.updatePlayer(scaledDelta);
      this.updateVehicles(scaledDelta);
      this.updatePedestrians(scaledDelta);
      this.updateProjectiles(scaledDelta);
      this.updateParticles(scaledDelta);
      this.updatePoliceAI(scaledDelta);
      this.updateMission(scaledDelta);
      this.updateCamera(delta);

      // Special Meter Drain/Regen
      if (this.isSpecialActive) {
        this.specialMeter = Math.max(0, this.specialMeter - delta * 18);
        if (this.specialMeter <= 0) {
          this.isSpecialActive = false;
        }
      } else {
        this.specialMeter = Math.min(100, this.specialMeter + delta * 5);
      }

      // Render Three.js scene
      this.renderer.render(this.scene, this.camera);
    };

    loop();
  }

  // Player On-Foot Physics & Movement
  private updatePlayer(delta: number) {
    if (this.currentVehicle) {
      // In Vehicle: update player position to vehicle
      this.playerPos.copy(this.currentVehicle.mesh.position);
      return;
    }

    // WASD Movement
    const moveX = (this.keys['KeyD'] ? 1 : 0) - (this.keys['KeyA'] ? 1 : 0);
    const moveZ = (this.keys['KeyS'] ? 1 : 0) - (this.keys['KeyW'] ? 1 : 0);
    this.isSprinting = !!this.keys['ShiftLeft'] || !!this.keys['ShiftRight'];

    if (moveX !== 0 || moveZ !== 0) {
      const inputDir = new THREE.Vector3(moveX, 0, moveZ).normalize();
      // Rotate relative to camera yaw
      inputDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraYaw);

      const moveSpeed = this.isSprinting ? 9.5 : 4.5;
      this.playerVelocity.x = inputDir.x * moveSpeed;
      this.playerVelocity.z = inputDir.z * moveSpeed;

      // Smooth heading rotate
      this.playerHeading = Math.atan2(inputDir.x, inputDir.z);
      this.playerGroup.rotation.y = this.playerHeading;

      // Bobbing walking animation
      const t = performance.now() * 0.012;
      this.playerGroup.position.y = this.playerPos.y + Math.abs(Math.sin(t)) * 0.12;
    } else {
      this.playerVelocity.x = 0;
      this.playerVelocity.z = 0;
      this.playerGroup.position.y = this.playerPos.y;
    }

    // Jump
    if (this.keys['Space'] && this.isGrounded) {
      this.playerVelocity.y = 7.5;
      this.isGrounded = false;
    }

    // Gravity
    if (!this.isGrounded) {
      this.playerVelocity.y -= 18 * delta;
    }

    // Move player position with collision check
    const nextPos = this.playerPos.clone().add(this.playerVelocity.clone().multiplyScalar(delta));

    // Ground level clamp
    if (nextPos.y <= 0) {
      nextPos.y = 0;
      this.playerVelocity.y = 0;
      this.isGrounded = true;
    }

    // Building Collision Check
    const playerBox = new THREE.Box3().setFromCenterAndSize(
      nextPos.clone().add(new THREE.Vector3(0, 1, 0)),
      new THREE.Vector3(1, 2, 1)
    );

    let collided = false;
    for (const b of this.obstacles) {
      if (b.intersectsBox(playerBox)) {
        collided = true;
        break;
      }
    }

    if (!collided) {
      this.playerPos.copy(nextPos);
      this.playerGroup.position.copy(this.playerPos);
    }

    // Continuous attack while mouse held for automatic weapons
    if (this.isPointerDown && (this.selectedWeapon === 'smg' || this.selectedWeapon === 'rifle')) {
      this.performAttack();
    }

    // Send state to React HUD
    this.callbacks.onStateUpdate({
      position: { x: this.playerPos.x, y: this.playerPos.y, z: this.playerPos.z },
      headingAngle: this.playerHeading,
      health: this.health,
      armor: this.armor,
      specialMeter: this.specialMeter,
      nitroRemaining: this.nitroRemaining,
    });
  }

  // Vehicle Driving Physics & Stunt Jumps
  private updateVehicles(delta: number) {
    for (const v of this.vehicles) {
      if (v.isHelicopter) {
        // Rotate rotors
        if (v.isPlayer) {
          v.rotorRPM = Math.min(1.0, (v.rotorRPM || 0) + delta * 0.7);
        } else {
          v.rotorRPM = Math.max(0, (v.rotorRPM || 0) - delta * 0.4);
        }

        if (v.rotorMesh) {
          v.rotorMesh.rotation.y += (v.rotorRPM || 0) * delta * 45;
        }
        if (v.tailRotorMesh) {
          v.tailRotorMesh.rotation.x += (v.rotorRPM || 0) * delta * 50;
        }

        if (v.isPlayer) {
          // Helicopter Flight Controls
          const throttle = (this.keys['KeyW'] || this.keys['ArrowUp'] ? 1 : 0) - (this.keys['KeyS'] || this.keys['ArrowDown'] ? 0.7 : 0);
          const rudder = (this.keys['KeyA'] || this.keys['ArrowLeft'] ? 1 : 0) - (this.keys['KeyD'] || this.keys['ArrowRight'] ? 1 : 0);
          const ascend = (this.keys['Space'] || this.keys['ShiftLeft'] ? 1 : 0);
          const descend = (this.keys['ControlLeft'] || this.keys['KeyC'] || this.keys['KeyZ'] ? 1 : 0);

          // Vertical collective climb / descent
          if (v.altitude === undefined) v.altitude = v.mesh.position.y;
          const climbRate = 18;
          if (ascend > 0) {
            v.altitude = Math.min(180, v.altitude + climbRate * delta);
          } else if (descend > 0) {
            v.altitude = Math.max(0.2, v.altitude - climbRate * delta);
          } else if (v.altitude > 0.5) {
            // Gentle natural hover buoyancy
            v.altitude += Math.sin(Date.now() * 0.003) * 0.04 * delta;
          }

          // Forward / Reverse flight speed
          if (throttle > 0) {
            v.speed = Math.min(v.stats.maxSpeed, v.speed + v.stats.acceleration * delta);
          } else if (throttle < 0) {
            v.speed = Math.max(-12, v.speed - v.stats.acceleration * delta);
          } else {
            v.speed *= Math.pow(0.96, delta * 60);
          }

          // Rudder heading
          v.heading += rudder * v.stats.handling * delta;

          // Banking tilt
          const pitchTilt = (v.speed / v.stats.maxSpeed) * 0.28;
          const rollTilt = rudder * 0.22;
          v.mesh.rotation.set(pitchTilt, v.heading, rollTilt);

          // Translate horizontal position
          v.mesh.position.x += Math.sin(v.heading) * v.speed * delta;
          v.mesh.position.z += Math.cos(v.heading) * v.speed * delta;
          v.mesh.position.y = v.altitude;

          // Sound updates
          sound.updateHelicopterSound(true, v.rotorRPM || 0);

          this.callbacks.onStateUpdate({
            vehicleSpeedMph: Math.abs(Math.round(v.speed * 2.8)),
            vehicleHealth: Math.max(0, v.stats.health),
            altitude: Math.round(v.mesh.position.y),
            position: { x: v.mesh.position.x, y: v.mesh.position.y, z: v.mesh.position.z },
          });
        }
        continue;
      }

      if (v.isPlayer) {
        // Player Driving Controls
        const accelInput = (this.keys['KeyW'] || this.keys['ArrowUp'] ? 1 : 0) - (this.keys['KeyS'] || this.keys['ArrowDown'] ? 0.6 : 0);
        const steerInput = (this.keys['KeyA'] || this.keys['ArrowLeft'] ? 1 : 0) - (this.keys['KeyD'] || this.keys['ArrowRight'] ? 1 : 0);
        const handbrake = !!this.keys['Space'];
        const nitro = (!!this.keys['ShiftLeft'] || !!this.keys['ShiftRight']) && this.nitroRemaining > 0;

        // Nitro boost mechanics
        let topSpeed = v.stats.maxSpeed;
        if (nitro && accelInput > 0) {
          topSpeed *= 1.45;
          v.speed += v.stats.acceleration * 1.8 * delta;
          this.nitroRemaining = Math.max(0, this.nitroRemaining - delta * 30);

          if (v.exhaustL && v.exhaustR) {
            v.exhaustL.visible = true;
            v.exhaustR.visible = true;
          }
        } else {
          this.nitroRemaining = Math.min(100, this.nitroRemaining + delta * 6);
          if (v.exhaustL && v.exhaustR) {
            v.exhaustL.visible = false;
            v.exhaustR.visible = false;
          }
        }

        // Acceleration & Braking
        if (accelInput > 0) {
          v.speed = Math.min(topSpeed, v.speed + v.stats.acceleration * delta);
        } else if (accelInput < 0) {
          v.speed = Math.max(-14, v.speed - v.stats.acceleration * 1.2 * delta);
        } else {
          // Coasting drag
          v.speed *= Math.pow(0.97, delta * 60);
        }

        if (handbrake) {
          v.speed *= Math.pow(0.92, delta * 60);
          sound.playTireScreech();

          if (Math.abs(v.speed) > 4) {
            const rearL = v.mesh.position.clone().add(
              new THREE.Vector3(-1.0, 0.25, -1.5).applyAxisAngle(new THREE.Vector3(0, 1, 0), v.heading)
            );
            const rearR = v.mesh.position.clone().add(
              new THREE.Vector3(1.0, 0.25, -1.5).applyAxisAngle(new THREE.Vector3(0, 1, 0), v.heading)
            );
            this.spawnTireSmoke(rearL);
            this.spawnTireSmoke(rearR);
          }
        }

        // Steering based on speed
        if (Math.abs(v.speed) > 0.5) {
          const steerRate = v.stats.handling * (handbrake ? 1.6 : 1.0);
          v.heading += steerInput * steerRate * (v.speed > 0 ? 1 : -1) * delta;
        }

        // Forward vector
        const forward = new THREE.Vector3(Math.sin(v.heading), 0, Math.cos(v.heading));
        v.velocity.copy(forward).multiplyScalar(v.speed);

        // Check Stunt Ramps!
        const carBox = new THREE.Box3().setFromObject(v.mesh);
        for (const ramp of this.rampBoxes) {
          if (ramp.box.intersectsBox(carBox) && v.speed > 18) {
            v.mesh.position.y += 0.8;
            v.velocity.y = v.speed * 0.45;
            this.isStuntCam = true;
            this.stuntTimer = 2.0;
            this.callbacks.onStuntJump(Math.floor(v.speed * 12));
          }
        }

        // Apply position
        const nextPos = v.mesh.position.clone().add(v.velocity.clone().multiplyScalar(delta));

        // Stunt flight gravity
        if (v.mesh.position.y > 0.1) {
          v.velocity.y -= 25 * delta;
          nextPos.y = Math.max(0, v.mesh.position.y + v.velocity.y * delta);
          if (nextPos.y <= 0.05) {
            nextPos.y = 0;
            v.velocity.y = 0;
            this.isStuntCam = false;
          }
        }

        // Building obstacle collision
        const testBox = new THREE.Box3().setFromCenterAndSize(
          nextPos.clone().add(new THREE.Vector3(0, 1, 0)),
          new THREE.Vector3(2.2, 1.5, 4.4)
        );

        let hitObstacle = false;
        for (const b of this.obstacles) {
          if (b.intersectsBox(testBox)) {
            hitObstacle = true;
            break;
          }
        }

        if (hitObstacle) {
          // Crash impact
          sound.playCarCrash();
          v.stats.health -= Math.floor(Math.abs(v.speed) * 4);
          v.speed = -v.speed * 0.35; // bounce back
          if (v.stats.health <= 0) {
            this.explodeVehicle(v);
          }
        } else {
          v.mesh.position.copy(nextPos);
        }

        v.mesh.rotation.y = v.heading;

        // Sound & HUD update
        sound.updateEngineSound(v.speed / v.stats.maxSpeed, true);
        const speedMph = Math.abs(Math.round(v.speed * 2.8));
        this.callbacks.onStateUpdate({
          vehicleSpeedMph: speedMph,
          vehicleHealth: Math.max(0, v.stats.health),
          position: { x: v.mesh.position.x, y: v.mesh.position.y, z: v.mesh.position.z },
          headingAngle: v.heading,
          nitroRemaining: this.nitroRemaining,
        });

        // Car smoke if damaged
        if (v.stats.health < 350 && Math.random() > 0.5) {
          this.spawnSmokeParticle(v.mesh.position.clone().add(new THREE.Vector3(0, 1.2, 1.8)));
        }

        // Near LS Customs check
        if (v.mesh.position.distanceTo(new THREE.Vector3(50, 0, 0)) < 16) {
          this.callbacks.onOpenCustoms();
        }

      } else if (v.isTraffic) {
        // Simple ambient traffic cruising
        const forward = new THREE.Vector3(Math.sin(v.heading), 0, Math.cos(v.heading));
        v.mesh.position.add(forward.multiplyScalar(v.speed * delta));

        // Wrap around city boundary
        if (Math.abs(v.mesh.position.x) > 160) v.mesh.position.x *= -0.95;
        if (Math.abs(v.mesh.position.z) > 160) v.mesh.position.z *= -0.95;
        v.mesh.rotation.y = v.heading;
      }
    }
  }

  // Police AI pursuit & siren strobe
  private updatePoliceAI(delta: number) {
    const playerTarget = this.currentVehicle ? this.currentVehicle.mesh.position : this.playerPos;

    for (const v of this.vehicles) {
      if (!v.isPolice) continue;

      // Strobe beacon
      v.strobeTimer = (v.strobeTimer || 0) + delta * 12;
      if (v.strobeTimer > 1) {
        v.strobeTimer = 0;
        v.strobeState = !v.strobeState;
        if (v.policeLightR) v.policeLightR.intensity = v.strobeState ? 4 : 0.2;
        if (v.policeLightB) v.policeLightB.intensity = v.strobeState ? 0.2 : 4;
      }

      if (this.wantedStars > 0) {
        // Steer towards player
        const toPlayer = new THREE.Vector3().subVectors(playerTarget, v.mesh.position);
        const dist = toPlayer.length();
        const targetHeading = Math.atan2(toPlayer.x, toPlayer.z);

        // Turn towards player smoothly
        let angleDiff = targetHeading - v.heading;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        v.heading += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), v.stats.handling * delta);
        v.mesh.rotation.y = v.heading;

        // Drive towards player
        v.speed = Math.min(v.stats.maxSpeed, v.speed + v.stats.acceleration * delta);
        const forward = new THREE.Vector3(Math.sin(v.heading), 0, Math.cos(v.heading));
        v.mesh.position.add(forward.multiplyScalar(v.speed * delta));

        // Ram into player car or arrest player
        if (dist < 4.2) {
          if (this.currentVehicle) {
            // Ram player car
            sound.playCarCrash();
            this.currentVehicle.stats.health -= 35 * delta * 20;
            this.currentVehicle.speed *= 0.8;
          } else {
            // On foot: police shoot player
            this.health = Math.max(0, this.health - 25 * delta);
            if (this.health <= 0) {
              this.callbacks.onPlayerWasted();
            }
          }
        }
      }
    }

    // Wanted Level Cooldown Logic
    if (this.wantedStars > 0) {
      // Check if any police within 65m
      let policeNearby = false;
      for (const v of this.vehicles) {
        if (v.isPolice && v.mesh.position.distanceTo(playerTarget) < 65) {
          policeNearby = true;
          break;
        }
      }

      if (!policeNearby) {
        this.wantedCooling = true;
        this.wantedCoolingTimer += delta;
        const progress = Math.min(1, this.wantedCoolingTimer / 10);
        this.callbacks.onStateUpdate({
          wantedCooling: true,
          wantedCoolingProgress: progress,
        });

        // 10s outside police vision clears wanted level
        if (this.wantedCoolingTimer >= 10) {
          this.clearWantedLevel();
          this.money += 2000; // Evasion bonus
          this.callbacks.onStateUpdate({ money: this.money });
        }
      } else {
        this.wantedCooling = false;
        this.wantedCoolingTimer = 0;
        this.callbacks.onStateUpdate({ wantedCooling: false, wantedCoolingProgress: 0 });
      }
    }
  }

  // Pedestrians walking & reacting
  private updatePedestrians(delta: number) {
    for (const ped of this.pedestrians) {
      if (ped.ragdoll) continue;

      if (ped.fleeing) {
        ped.pos.add(ped.dir.clone().multiplyScalar(ped.speed * delta));
        ped.mesh.rotation.y = Math.atan2(ped.dir.x, ped.dir.z);
      } else {
        // Stroll around
        ped.pos.add(ped.dir.clone().multiplyScalar(ped.speed * delta));
        ped.mesh.rotation.y = Math.atan2(ped.dir.x, ped.dir.z);

        // Turn around occasionally or if hitting border
        if (Math.random() < 0.01 || Math.abs(ped.pos.x) > 130 || Math.abs(ped.pos.z) > 130) {
          ped.dir.set(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
        }
      }

      // Check car running over pedestrian
      if (this.currentVehicle && Math.abs(this.currentVehicle.speed) > 6) {
        if (ped.pos.distanceTo(this.currentVehicle.mesh.position) < 2.5) {
          ped.health = 0;
          ped.ragdoll = true;
          ped.mesh.rotation.x = Math.PI / 2;
          sound.playPunch();
          this.addWantedStars(1);
          this.money += Math.floor(40 + Math.random() * 100);
          this.callbacks.onStateUpdate({ money: this.money });
        }
      }
    }
  }

  // Projectiles (bullets, RPG rockets)
  private updateProjectiles(delta: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.lifetime -= delta;
      p.pos.add(p.velocity.clone().multiplyScalar(delta));
      p.mesh.position.copy(p.pos);

      // RPG rocket smoke trail
      if (p.isRPG) {
        this.spawnSmokeParticle(p.pos);
      }

      let hit = false;

      // Check hit vehicles
      for (const v of this.vehicles) {
        if (v.mesh.position.distanceTo(p.pos) < 3.2) {
          v.stats.health -= p.damage;
          hit = true;
          if (p.isRPG || v.stats.health <= 0) {
            this.explodeVehicle(v);
          }
          break;
        }
      }

      // Check hit pedestrians
      if (!hit) {
        for (const ped of this.pedestrians) {
          if (!ped.ragdoll && ped.pos.distanceTo(p.pos) < 1.8) {
            ped.health -= p.damage;
            hit = true;
            if (ped.health <= 0) {
              ped.ragdoll = true;
              ped.mesh.rotation.x = Math.PI / 2;
            }
            break;
          }
        }
      }

      // Ground or building hit
      if (!hit && p.pos.y <= 0.2) {
        hit = true;
        if (p.isRPG) {
          this.spawnExplosion(p.pos);
        }
      }

      if (hit || p.lifetime <= 0) {
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
      }
    }
  }

  // Particle updates (smoke, sparks, explosions)
  private updateParticles(delta: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const part = this.particles[i];
      part.lifetime -= delta;
      part.mesh.position.add(part.velocity.clone().multiplyScalar(delta));

      const scale = part.lifetime / part.maxLifetime;
      part.mesh.scale.set(scale, scale, scale);

      if (part.lifetime <= 0) {
        this.scene.remove(part.mesh);
        this.particles.splice(i, 1);
      }
    }
  }

  // Vehicle explosion
  private explodeVehicle(v: VehicleEntity) {
    this.spawnExplosion(v.mesh.position);
    sound.playExplosion();

    if (v.isPlayer) {
      this.health = 0;
      this.callbacks.onPlayerWasted();
    }

    // Replace vehicle with charred chassis or remove
    v.stats.health = 0;
    (v.mesh.children[0] as THREE.Mesh).material = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    this.addWantedStars(2);
  }

  public spawnExplosion(pos: THREE.Vector3) {
    sound.playExplosion();
    // Fireball
    const fireGeo = new THREE.SphereGeometry(3.5, 8, 8);
    const fireMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
    const fireball = new THREE.Mesh(fireGeo, fireMat);
    fireball.position.copy(pos);
    this.scene.add(fireball);

    this.particles.push({
      mesh: fireball,
      velocity: new THREE.Vector3(0, 2, 0),
      lifetime: 0.4,
      maxLifetime: 0.4,
    });

    // Sparks
    for (let s = 0; s < 16; s++) {
      const spark = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 4, 4),
        new THREE.MeshBasicMaterial({ color: 0xfef08a })
      );
      spark.position.copy(pos);
      this.scene.add(spark);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 25,
        Math.random() * 15 + 5,
        (Math.random() - 0.5) * 25
      );

      this.particles.push({
        mesh: spark,
        velocity: vel,
        lifetime: 0.8 + Math.random() * 0.4,
        maxLifetime: 1.2,
      });
    }
  }

  private spawnSmokeParticle(pos: THREE.Vector3) {
    const smoke = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0x475569, transparent: true, opacity: 0.6 })
    );
    smoke.position.copy(pos);
    this.scene.add(smoke);

    this.particles.push({
      mesh: smoke,
      velocity: new THREE.Vector3((Math.random() - 0.5) * 1.5, 3 + Math.random() * 2, (Math.random() - 0.5) * 1.5),
      lifetime: 0.8,
      maxLifetime: 0.8,
    });
  }

  public spawnTireSmoke(pos: THREE.Vector3) {
    const smoke = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xf1f5f9, transparent: true, opacity: 0.65 })
    );
    smoke.position.copy(pos);
    this.scene.add(smoke);

    this.particles.push({
      mesh: smoke,
      velocity: new THREE.Vector3((Math.random() - 0.5) * 2.5, 1.2 + Math.random() * 1.5, (Math.random() - 0.5) * 2.5),
      lifetime: 0.45,
      maxLifetime: 0.45,
    });
  }

  // Mission Check
  private updateMission(_delta: number) {
    if (!this.activeMission || !this.missionMarkerMesh) return;

    // Rotate diamond
    this.missionMarkerMesh.children[1].rotation.y += 0.03;

    const targetPos = new THREE.Vector3(this.activeMission.targetPos.x, 0, this.activeMission.targetPos.z);
    const playerCurPos = this.currentVehicle ? this.currentVehicle.mesh.position : this.playerPos;

    if (playerCurPos.distanceTo(targetPos) < this.activeMission.targetRadius + 1.5) {
      // Mission Complete!
      sound.playMissionComplete();
      this.money += this.activeMission.reward;
      this.callbacks.onMissionCompleted(this.activeMission);
      this.callbacks.onStateUpdate({ money: this.money, currentMission: null });

      if (this.activeMission.wantedStarsBonus) {
        this.addWantedStars(this.activeMission.wantedStarsBonus);
      }

      this.scene.remove(this.missionMarkerMesh);
      this.missionMarkerMesh = null;
      this.activeMission = null;
    }
  }

  // Camera follow & cinematic zoom
  private updateCamera(delta: number) {
    // Iconic GTA V Character Switch Sky Satellite Transition
    if (this.isSwitchingCharacter) {
      this.switchTimer += delta;
      const progress = Math.min(1, this.switchTimer / this.switchDuration);

      // Phase 1 (0 -> 0.45): Rocket up into high satellite altitude (y: 280)
      // Phase 2 (0.45 -> 0.55): Peak altitude pan across Los Santos & swap character
      // Phase 3 (0.55 -> 1.0): High-speed swoop descent into new character shoulder
      const apexHeight = 280;
      let camX: number;
      let camY: number;
      let camZ: number;
      let lookX: number;
      let lookY = 0;
      let lookZ: number;

      if (progress < 0.45) {
        const t = progress / 0.45;
        const easeUp = Math.sin((t * Math.PI) / 2);
        camX = this.switchStartPos.x;
        camY = 8 + easeUp * (apexHeight - 8);
        camZ = this.switchStartPos.z + 10 * (1 - t);
        lookX = this.switchStartPos.x;
        lookZ = this.switchStartPos.z;
      } else if (progress < 0.55) {
        const t = (progress - 0.45) / 0.1;
        camX = THREE.MathUtils.lerp(this.switchStartPos.x, this.switchTargetPos.x, t);
        camY = apexHeight;
        camZ = THREE.MathUtils.lerp(this.switchStartPos.z, this.switchTargetPos.z, t);
        lookX = camX;
        lookZ = camZ;

        // Perform mid-flight swap at apex
        if (!this.characterSwapped && this.pendingCharacter) {
          this.characterSwapped = true;
          this.executeCharacterSwap(this.pendingCharacter);
        }
      } else {
        const t = (progress - 0.55) / 0.45;
        const easeDown = Math.cos((t * Math.PI) / 2);
        camX = this.switchTargetPos.x;
        camY = 4.5 + easeDown * (apexHeight - 4.5);
        camZ = this.switchTargetPos.z + 8 - easeDown * 4;
        lookX = this.switchTargetPos.x;
        lookY = 1.6;
        lookZ = this.switchTargetPos.z;
      }

      this.camera.position.set(camX, camY, camZ);
      this.camera.lookAt(lookX, lookY, lookZ);

      if (progress >= 1) {
        this.isSwitchingCharacter = false;
        this.callbacks.onStateUpdate({ isSwitchingCharacter: false });
      }
      return;
    }

    const target = this.currentVehicle ? this.currentVehicle.mesh.position : this.playerPos;

    if (this.isStuntCam) {
      // Stunt jump cinematic slow-motion cam
      this.stuntTimer -= delta;
      if (this.stuntTimer <= 0) this.isStuntCam = false;
      this.camera.position.lerp(new THREE.Vector3(target.x - 12, target.y + 2, target.z - 12), 0.05);
      this.camera.lookAt(target);
      return;
    }

    if (this.currentVehicle) {
      if (this.currentVehicle.isHelicopter) {
        // Helicopter Flight Camera (higher, panoramic view with smooth chase)
        const hHeading = this.currentVehicle.heading;
        const hAlt = this.currentVehicle.mesh.position.y;
        const camDist = 14 + Math.min(16, hAlt * 0.1);
        const camHeight = 4.5 + Math.min(12, hAlt * 0.15);

        this.targetCameraPos.set(
          target.x - Math.sin(hHeading) * camDist,
          target.y + camHeight,
          target.z - Math.cos(hHeading) * camDist
        );
        this.targetLookAt.set(target.x, target.y + 1.2, target.z);

        this.camera.position.lerp(this.targetCameraPos, 0.09);
        this.camera.lookAt(this.targetLookAt);
        return;
      }

      // Vehicle dynamic chase camera
      const carHeading = this.currentVehicle.heading;
      const camDist = (this.currentVehicle.isTank ? 14 : 11) + Math.abs(this.currentVehicle.speed) * 0.12;
      const camHeight = this.currentVehicle.isTank ? 5.2 : 4.2;

      this.targetCameraPos.set(
        target.x - Math.sin(carHeading) * camDist,
        target.y + camHeight,
        target.z - Math.cos(carHeading) * camDist
      );
      this.targetLookAt.set(target.x, target.y + 1.4, target.z);

      this.camera.position.lerp(this.targetCameraPos, 0.1);
      this.camera.lookAt(this.targetLookAt);
    } else {
      // Third-person on-foot camera with orbit
      const dist = 6.5;
      const camX = target.x + Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch) * dist;
      const camY = target.y + Math.sin(this.cameraPitch) * dist + 1.6;
      const camZ = target.z + Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch) * dist;

      this.targetCameraPos.set(camX, camY, camZ);
      this.targetLookAt.set(target.x, target.y + 1.5, target.z);

      this.camera.position.lerp(this.targetCameraPos, 0.18);
      this.camera.lookAt(this.targetLookAt);
    }
  }

  // Spawns a customized supercar right in front of player (Mechanic service)
  public spawnSupercarService(color: string = '#f59e0b') {
    const spawnPos = this.playerPos.clone().add(new THREE.Vector3(Math.sin(this.playerHeading) * 6, 0, Math.cos(this.playerHeading) * 6));
    const stats: VehicleStats = {
      id: `custom_drop_${Date.now()}`,
      type: 'supercar',
      name: 'Pegassi Osíris',
      maxSpeed: 44,
      acceleration: 42,
      handling: 3.0,
      health: 1200,
      maxHealth: 1200,
      color,
    };
    const model = this.createVehicleMesh(stats);
    model.group.position.copy(spawnPos);
    this.scene.add(model.group);

    this.vehicles.push({
      mesh: model.group,
      stats,
      velocity: new THREE.Vector3(),
      speed: 0,
      steering: 0,
      heading: this.playerHeading,
      isPlayer: false,
      isPolice: false,
      isTraffic: false,
      exhaustL: model.exhaustL,
      exhaustR: model.exhaustR,
    });
  }

  // Los Santos Customs tuning modifications
  public applyCustomsUpgrade(color: string, engineLevel: number) {
    if (!this.currentVehicle) return;
    this.currentVehicle.stats.color = color;
    this.currentVehicle.stats.maxSpeed += engineLevel * 3;
    this.currentVehicle.stats.acceleration += engineLevel * 4;
    this.currentVehicle.stats.health = this.currentVehicle.stats.maxHealth;

    // Repaint chassis
    const chassisMesh = this.currentVehicle.mesh.children[0] as THREE.Mesh;
    if (chassisMesh && (chassisMesh.material as THREE.MeshStandardMaterial).color) {
      (chassisMesh.material as THREE.MeshStandardMaterial).color.set(color);
    }
  }

  // Clean up on component unmount
  public dispose() {
    if (this.animId) cancelAnimationFrame(this.animId);
    this.renderer.dispose();
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
  }
}
