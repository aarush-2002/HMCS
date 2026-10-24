/**
 * HMCS Night Hostel Scene — Main Scene Builder
 * Procedural geometry for the complete hostel complex with scroll-driven animations.
 */

import * as THREE from 'three';
import {
  createSlateTexture,
  createConcreteTexture,
  createMetalTexture,
  createWindowLatticeTexture,
  createMoonTexture,
  createGlowSprite,
  createWispSprite,
} from './textures';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface WindowState {
  mesh: THREE.Mesh;
  material: THREE.MeshStandardMaterial;
  baseIntensity: number;
  targetIntensity: number;
  currentIntensity: number;
  state: 'waiting' | 'emergency' | 'resolved';
  flickerOffset: number;
}

export interface LampPost {
  group: THREE.Group;
  light: THREE.PointLight;
  glowSprite: THREE.Sprite;
  baseIntensity: number;
  targetIntensity: number;
}

export interface SceneConfig {
  lowQuality: boolean;
}

// ─── Scene Builder ─────────────────────────────────────────────────────────────

export class HostelScene {
  private scene: THREE.Scene;
  private config: SceneConfig;
  
  // Collections
  private windows: WindowState[] = [];
  private lampPosts: LampPost[] = [];
  private leaves: THREE.InstancedMesh | null = null;
  private embers: THREE.Points | null = null;
  private drizzle: THREE.Points | null = null;
  
  // State
  private scrollProgress = 0;
  private time = 0;
  
  // Materials (shared)
  private concreteMat!: THREE.MeshStandardMaterial;
  private windowMat!: THREE.MeshStandardMaterial;
  private metalMat!: THREE.MeshStandardMaterial;
  
  constructor(scene: THREE.Scene, config: SceneConfig) {
    this.scene = scene;
    this.config = config;
    
    this.initMaterials();
    this.buildCourt();
    this.buildHostel();
    this.buildGate();
    this.buildLampPosts();
    this.buildMoon();
    this.buildBackdrop();
    this.buildTrees();
    this.buildAtmosphere();
    this.buildLeafFall();
  }
  
  // ─── Materials ─────────────────────────────────────────────────────────────
  
  private initMaterials(): void {
    // Concrete (board-formed)
    this.concreteMat = new THREE.MeshStandardMaterial({
      map: createConcreteTexture(),
      roughness: 0.9,
      metalness: 0.0,
    });
    
    // Window (emissive amber with lattice)
    this.windowMat = new THREE.MeshStandardMaterial({
      map: createWindowLatticeTexture(),
      emissive: new THREE.Color(0xf5a524),
      emissiveIntensity: 2.5,
      roughness: 0.3,
      metalness: 0.1,
    });
    
    // Metal (roof, tank, antenna)
    this.metalMat = new THREE.MeshStandardMaterial({
      map: createMetalTexture(),
      roughness: 0.7,
      metalness: 0.4,
    });
  }
  
  // ─── Court Floor ───────────────────────────────────────────────────────────
  
  private buildCourt(): void {
    const courtGeom = new THREE.PlaneGeometry(60, 60);
    const courtMat = new THREE.MeshStandardMaterial({
      map: createSlateTexture(),
      roughness: 0.7,
      metalness: 0.1,
    });
    
    const court = new THREE.Mesh(courtGeom, courtMat);
    court.rotation.x = -Math.PI / 2;
    court.position.set(0, 0, -15);
    court.receiveShadow = true;
    this.scene.add(court);
  }
  
  // ─── Hostel Block ──────────────────────────────────────────────────────────
  
  private buildHostel(): void {
    const hostelGroup = new THREE.Group();
    hostelGroup.position.set(0, 0, -40);
    
    // Main building (4 storeys, 38m wide, 14m tall, 12m deep)
    const buildingGeom = new THREE.BoxGeometry(38, 14, 12);
    const building = new THREE.Mesh(buildingGeom, this.concreteMat);
    building.position.set(0, 7, 0);
    building.castShadow = true;
    building.receiveShadow = true;
    hostelGroup.add(building);
    
    // Damp plinth (darker base)
    const plinthGeom = new THREE.BoxGeometry(38.2, 0.5, 12.2);
    const plinthMat = new THREE.MeshStandardMaterial({
      color: 0x1a1f24,
      roughness: 0.95,
      metalness: 0.0,
    });
    const plinth = new THREE.Mesh(plinthGeom, plinthMat);
    plinth.position.set(0, 0.25, 0);
    plinth.castShadow = true;
    hostelGroup.add(plinth);
    
    // Windows (instanced)
    this.buildWindows(hostelGroup);
    
    // Central stair tower
    this.buildStairTower(hostelGroup);
    
    // Roof elements
    this.buildRoof(hostelGroup);
    
    // Corridor balconies (floors 2 and 3)
    this.buildBalconies(hostelGroup);
    
    this.scene.add(hostelGroup);
  }
  
  private buildWindows(hostelGroup: THREE.Group): void {
    const windowGeom = new THREE.PlaneGeometry(1.8, 2.2);
    
    // 4 floors, 12 windows per floor = 48 windows
    for (let floor = 0; floor < 4; floor++) {
      for (let col = 0; col < 12; col++) {
        const windowMesh = new THREE.Mesh(windowGeom, this.windowMat.clone());
        
        const x = -17 + col * 3.1;
        const y = 2 + floor * 3.2;
        const z = 6.01; // Slightly in front of facade
        
        windowMesh.position.set(x, y, z);
        hostelGroup.add(windowMesh);
        
        // Window state
        const brightness = 0.7 + Math.random() * 0.3; // 70% lit variation
        const isLit = Math.random() < 0.7;
        const isEmergency = Math.random() < 0.02; // 2% emergency
        const isSpecial = Math.random() < 0.05; // 5% special
        
        const state: WindowState = {
          mesh: windowMesh,
          material: windowMesh.material as THREE.MeshStandardMaterial,
          baseIntensity: isLit ? brightness * 2.5 : 0.3,
          targetIntensity: isLit ? brightness * 2.5 : 0.3,
          currentIntensity: isLit ? brightness * 2.5 : 0.3,
          state: isEmergency ? 'emergency' : 'waiting',
          flickerOffset: Math.random() * Math.PI * 2,
        };
        
        this.windows.push(state);
        
        // Point light for each window (only if lit)
        if (isLit && !this.config.lowQuality) {
          const windowLight = new THREE.PointLight(0xf5a524, 0.3, 4);
          windowLight.position.set(x, y, z + 0.5);
          hostelGroup.add(windowLight);
        }
      }
    }
  }
  
  private buildStairTower(hostelGroup: THREE.Group): void {
    // Projecting central stair tower
    const towerGeom = new THREE.BoxGeometry(4, 14.5, 2);
    const tower = new THREE.Mesh(towerGeom, this.concreteMat);
    tower.position.set(0, 7.25, 7);
    tower.castShadow = true;
    hostelGroup.add(tower);
    
    // Vertical slot window (lit)
    const slotGeom = new THREE.PlaneGeometry(0.6, 10);
    const slotMat = new THREE.MeshStandardMaterial({
      emissive: new THREE.Color(0xf5a524),
      emissiveIntensity: 3.0,
      roughness: 0.2,
    });
    const slot = new THREE.Mesh(slotGeom, slotMat);
    slot.position.set(0, 7, 8.01);
    hostelGroup.add(slot);
  }
  
  private buildRoof(hostelGroup: THREE.Group): void {
    // Parapet
    const parapetGeom = new THREE.BoxGeometry(38.4, 0.8, 12.4);
    const parapet = new THREE.Mesh(parapetGeom, this.concreteMat);
    parapet.position.set(0, 14.4, 0);
    hostelGroup.add(parapet);
    
    // Water tank (on legs)
    const tankGroup = new THREE.Group();
    tankGroup.position.set(8, 14.8, -2);
    
    // Tank legs
    for (let i = 0; i < 4; i++) {
      const legGeom = new THREE.CylinderGeometry(0.15, 0.15, 2);
      const leg = new THREE.Mesh(legGeom, this.metalMat);
      const angle = (i / 4) * Math.PI * 2;
      leg.position.set(Math.cos(angle) * 1.2, 1, Math.sin(angle) * 1.2);
      tankGroup.add(leg);
    }
    
    // Tank body
    const tankGeom = new THREE.CylinderGeometry(1.5, 1.5, 2.5, 16);
    const tank = new THREE.Mesh(tankGeom, this.metalMat);
    tank.position.set(0, 3.25, 0);
    tank.castShadow = true;
    tankGroup.add(tank);
    
    hostelGroup.add(tankGroup);
    
    // Antenna
    const antennaGeom = new THREE.CylinderGeometry(0.05, 0.05, 3);
    const antenna = new THREE.Mesh(antennaGeom, this.metalMat);
    antenna.position.set(-10, 16, 0);
    hostelGroup.add(antenna);
    
    // Vents (2)
    for (let i = 0; i < 2; i++) {
      const ventGeom = new THREE.BoxGeometry(0.8, 0.6, 0.8);
      const vent = new THREE.Mesh(ventGeom, this.metalMat);
      vent.position.set(-5 + i * 10, 14.7, 3);
      hostelGroup.add(vent);
    }
  }
  
  private buildBalconies(hostelGroup: THREE.Group): void {
    // Corridor balconies on floors 2 and 3
    for (let floor = 1; floor <= 2; floor++) {
      const balconyGeom = new THREE.BoxGeometry(36, 0.2, 1.5);
      const balcony = new THREE.Mesh(balconyGeom, this.concreteMat);
      balcony.position.set(0, 2 + floor * 3.2 + 1.2, 6.75);
      balcony.castShadow = true;
      hostelGroup.add(balcony);
      
      // Railing
      const railingGeom = new THREE.BoxGeometry(36, 1, 0.1);
      const railingMat = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.8,
        metalness: 0.3,
      });
      const railing = new THREE.Mesh(railingGeom, railingMat);
      railing.position.set(0, 2 + floor * 3.2 + 1.7, 7.45);
      hostelGroup.add(railing);
    }
  }
  
  // ─── Gate ──────────────────────────────────────────────────────────────────
  
  private buildGate(): void {
    const gateGroup = new THREE.Group();
    gateGroup.position.set(0, 0, -8);
    
    // Two concrete pillars
    for (let i = 0; i < 2; i++) {
      const pillarGeom = new THREE.BoxGeometry(0.8, 3, 0.8);
      const pillar = new THREE.Mesh(pillarGeom, this.concreteMat);
      pillar.position.set(-3 + i * 6, 1.5, 0);
      pillar.castShadow = true;
      gateGroup.add(pillar);
    }
    
    // Lintel
    const lintelGeom = new THREE.BoxGeometry(7, 0.4, 0.8);
    const lintel = new THREE.Mesh(lintelGeom, this.concreteMat);
    lintel.position.set(0, 3.2, 0);
    lintel.castShadow = true;
    gateGroup.add(lintel);
    
    // Notice board
    const boardGeom = new THREE.BoxGeometry(2.5, 1.8, 0.1);
    const boardMat = new THREE.MeshStandardMaterial({
      color: 0x2a2f34,
      roughness: 0.9,
    });
    const board = new THREE.Mesh(boardGeom, boardMat);
    board.position.set(0, 2.2, 0.5);
    gateGroup.add(board);
    
    // Pinned papers (procedural texture)
    const paperGeom = new THREE.PlaneGeometry(0.4, 0.5);
    const paperMat = new THREE.MeshStandardMaterial({
      color: 0xe8e4d8,
      roughness: 0.8,
    });
    
    for (let i = 0; i < 5; i++) {
      const paper = new THREE.Mesh(paperGeom, paperMat);
      paper.position.set(-0.8 + i * 0.4, 2.2 + (Math.random() - 0.5) * 0.3, 0.56);
      paper.rotation.z = (Math.random() - 0.5) * 0.2;
      gateGroup.add(paper);
    }
    
    this.scene.add(gateGroup);
  }
  
  // ─── Lamp Posts ────────────────────────────────────────────────────────────
  
  private buildLampPosts(): void {
    const positions = [
      new THREE.Vector3(-12, 0, -5),
      new THREE.Vector3(-6, 0, -10),
      new THREE.Vector3(0, 0, -15),
      new THREE.Vector3(6, 0, -10),
      new THREE.Vector3(12, 0, -5),
      new THREE.Vector3(15, 0, -20),
    ];
    
    positions.forEach(pos => {
      const lampGroup = new THREE.Group();
      lampGroup.position.copy(pos);
      
      // Post (stone base + metal shaft)
      const baseGeom = new THREE.CylinderGeometry(0.2, 0.25, 0.5);
      const baseMat = new THREE.MeshStandardMaterial({
        color: 0x3a3f44,
        roughness: 0.9,
      });
      const base = new THREE.Mesh(baseGeom, baseMat);
      base.position.set(0, 0.25, 0);
      base.castShadow = true;
      lampGroup.add(base);
      
      const shaftGeom = new THREE.CylinderGeometry(0.08, 0.08, 2.5);
      const shaft = new THREE.Mesh(shaftGeom, this.metalMat);
      shaft.position.set(0, 1.75, 0);
      shaft.castShadow = true;
      lampGroup.add(shaft);
      
      // Lamp head (glowing sphere)
      const headGeom = new THREE.SphereGeometry(0.25, 16, 16);
      const headMat = new THREE.MeshStandardMaterial({
        color: 0xf5a524,
        emissive: new THREE.Color(0xf5a524),
        emissiveIntensity: 3.0,
        roughness: 0.2,
      });
      const head = new THREE.Mesh(headGeom, headMat);
      head.position.set(0, 3.2, 0);
      lampGroup.add(head);
      
      // Point light
      const light = new THREE.PointLight(0xf5a524, 1.5, 10);
      light.position.set(0, 3.2, 0);
      light.castShadow = !this.config.lowQuality;
      if (!this.config.lowQuality) {
        light.shadow.mapSize.set(512, 512);
      }
      lampGroup.add(light);
      
      // Glow sprite (additive billboard)
      const glowMat = new THREE.SpriteMaterial({
        map: createGlowSprite(),
        color: 0xf5a524,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
      });
      const glowSprite = new THREE.Sprite(glowMat);
      glowSprite.position.set(0, 3.2, 0);
      glowSprite.scale.set(2, 2, 1);
      lampGroup.add(glowSprite);
      
      this.scene.add(lampGroup);
      
      this.lampPosts.push({
        group: lampGroup,
        light,
        glowSprite,
        baseIntensity: 1.5,
        targetIntensity: 1.5,
      });
    });
  }
  
  // ─── Moon ──────────────────────────────────────────────────────────────────
  
  private buildMoon(): void {
    const moonGeom = new THREE.SphereGeometry(2, 32, 32);
    const moonMat = new THREE.MeshBasicMaterial({
      map: createMoonTexture(),
      color: 0xfff0c8,
    });
    const moon = new THREE.Mesh(moonGeom, moonMat);
    moon.position.set(20, 18, -60); // Far back, behind water tank
    this.scene.add(moon);
    
    // Moon corona (wide faint glow)
    const coronaMat = new THREE.SpriteMaterial({
      map: createGlowSprite(),
      color: 0xfff0c8,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
    });
    const corona = new THREE.Sprite(coronaMat);
    corona.position.copy(moon.position);
    corona.scale.set(12, 12, 1);
    this.scene.add(corona);
  }
  
  // ─── Backdrop ──────────────────────────────────────────────────────────────
  
  private buildBackdrop(): void {
    // Night sky gradient
    const skyGeom = new THREE.PlaneGeometry(200, 100);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x050a0e) },
        bottomColor: { value: new THREE.Color(0x0a1520) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        varying vec2 vUv;
        void main() {
          gl_FragColor = vec4(mix(bottomColor, topColor, vUv.y), 1.0);
        }
      `,
      side: THREE.DoubleSide,
    });
    const sky = new THREE.Mesh(skyGeom, skyMat);
    sky.position.set(0, 30, -80);
    this.scene.add(sky);
    
    // Stars (faint scatter)
    const starGeom = new THREE.BufferGeometry();
    const starCount = 200;
    const starPositions = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 150;
      starPositions[i * 3 + 1] = 20 + Math.random() * 40;
      starPositions[i * 3 + 2] = -70 - Math.random() * 20;
    }
    
    starGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.1,
      transparent: true,
      opacity: 0.4,
    });
    const stars = new THREE.Points(starGeom, starMat);
    this.scene.add(stars);
    
    // Tree-line ridge silhouette (2 layers)
    for (let layer = 0; layer < 2; layer++) {
      const ridgeGeom = new THREE.PlaneGeometry(200, 15);
      const ridgeMat = new THREE.MeshBasicMaterial({
        color: layer === 0 ? 0x0a0f14 : 0x0f151a,
        transparent: true,
        opacity: layer === 0 ? 0.8 : 0.6,
      });
      const ridge = new THREE.Mesh(ridgeGeom, ridgeMat);
      ridge.position.set(0, 8 + layer * 2, -75 + layer * 5);
      this.scene.add(ridge);
    }
  }
  
  // ─── Trees ─────────────────────────────────────────────────────────────────
  
  private buildTrees(): void {
    const treePositions = [
      new THREE.Vector3(-15, 0, -12),
      new THREE.Vector3(18, 0, -18),
      new THREE.Vector3(-20, 0, -25),
      new THREE.Vector3(22, 0, -30),
    ];
    
    treePositions.forEach(pos => {
      const treeGroup = new THREE.Group();
      treeGroup.position.copy(pos);
      
      // Trunk
      const trunkGeom = new THREE.CylinderGeometry(0.3, 0.4, 4);
      const trunkMat = new THREE.MeshStandardMaterial({
        color: 0x3a2f24,
        roughness: 0.9,
      });
      const trunk = new THREE.Mesh(trunkGeom, trunkMat);
      trunk.position.set(0, 2, 0);
      trunk.castShadow = true;
      treeGroup.add(trunk);
      
      // Leaf cards (instanced)
      const leafGeom = new THREE.PlaneGeometry(0.8, 0.8);
      const leafMat = new THREE.MeshStandardMaterial({
        color: 0x2a4a2a,
        roughness: 0.8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
      });
      
      const leafCount = 50;
      const leaves = new THREE.InstancedMesh(leafGeom, leafMat, leafCount);
      
      const dummy = new THREE.Object3D();
      for (let i = 0; i < leafCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 1 + Math.random() * 2;
        const height = 3 + Math.random() * 3;
        
        dummy.position.set(
          Math.cos(angle) * radius,
          height,
          Math.sin(angle) * radius
        );
        dummy.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );
        dummy.updateMatrix();
        leaves.setMatrixAt(i, dummy.matrix);
      }
      
      leaves.castShadow = true;
      treeGroup.add(leaves);
      
      this.scene.add(treeGroup);
    });
  }
  
  // ─── Atmosphere ────────────────────────────────────────────────────────────
  
  private buildAtmosphere(): void {
    // Drifting haze slabs (additive)
    const hazeGeom = new THREE.PlaneGeometry(30, 8);
    const hazeMat = new THREE.MeshBasicMaterial({
      color: 0x1a2030,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    
    for (let i = 0; i < 3; i++) {
      const haze = new THREE.Mesh(hazeGeom, hazeMat);
      haze.position.set(
        (Math.random() - 0.5) * 40,
        5 + Math.random() * 10,
        -20 - Math.random() * 20
      );
      haze.rotation.y = Math.random() * Math.PI;
      this.scene.add(haze);
    }
    
    // Embers (400 slow rising particles)
    if (!this.config.lowQuality) {
      const emberGeom = new THREE.BufferGeometry();
      const emberCount = 400;
      const emberPositions = new Float32Array(emberCount * 3);
      const emberVelocities = new Float32Array(emberCount * 3);
      
      for (let i = 0; i < emberCount; i++) {
        emberPositions[i * 3] = (Math.random() - 0.5) * 30;
        emberPositions[i * 3 + 1] = Math.random() * 15;
        emberPositions[i * 3 + 2] = -10 - Math.random() * 30;
        
        emberVelocities[i * 3] = (Math.random() - 0.5) * 0.02;
        emberVelocities[i * 3 + 1] = 0.01 + Math.random() * 0.02;
        emberVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
      }
      
      emberGeom.setAttribute('position', new THREE.BufferAttribute(emberPositions, 3));
      (emberGeom as any).velocities = emberVelocities;
      
      const emberMat = new THREE.PointsMaterial({
        color: 0xf5a524,
        size: 0.08,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
      });
      
      this.embers = new THREE.Points(emberGeom, emberMat);
      this.scene.add(this.embers);
    }
    
    // Light drizzle (skip on LOW)
    if (!this.config.lowQuality) {
      const drizzleGeom = new THREE.BufferGeometry();
      const drizzleCount = 1000;
      const drizzlePositions = new Float32Array(drizzleCount * 3);
      
      for (let i = 0; i < drizzleCount; i++) {
        drizzlePositions[i * 3] = (Math.random() - 0.5) * 40;
        drizzlePositions[i * 3 + 1] = Math.random() * 20;
        drizzlePositions[i * 3 + 2] = (Math.random() - 0.5) * 40 - 15;
      }
      
      drizzleGeom.setAttribute('position', new THREE.BufferAttribute(drizzlePositions, 3));
      
      const drizzleMat = new THREE.PointsMaterial({
        color: 0x88aacc,
        size: 0.03,
        transparent: true,
        opacity: 0.3,
      });
      
      this.drizzle = new THREE.Points(drizzleGeom, drizzleMat);
      this.scene.add(this.drizzle);
    }
  }
  
  // ─── Leaf Fall ─────────────────────────────────────────────────────────────
  
  private buildLeafFall(): void {
    const leafGeom = new THREE.PlaneGeometry(0.15, 0.15);
    const leafMat = new THREE.MeshBasicMaterial({
      color: 0x4a6a3a,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    
    const leafCount = 170;
    this.leaves = new THREE.InstancedMesh(leafGeom, leafMat, leafCount);
    
    const dummy = new THREE.Object3D();
    for (let i = 0; i < leafCount; i++) {
      dummy.position.set(
        (Math.random() - 0.5) * 20,
        Math.random() * 15,
        -10 - Math.random() * 20
      );
      dummy.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      dummy.updateMatrix();
      this.leaves.setMatrixAt(i, dummy.matrix);
    }
    
    this.scene.add(this.leaves);
  }
  
  // ─── Update ────────────────────────────────────────────────────────────────
  
  public update(deltaTime: number, scrollProgress: number): void {
    this.time += deltaTime;
    this.scrollProgress = scrollProgress;
    
    this.updateWindows();
    this.updateLampPosts();
    this.updateEmbers();
    this.updateDrizzle();
    this.updateLeaves();
  }
  
  private updateWindows(): void {
    // Scroll-driven state changes
    const resolveStart = 0.5; // Chapter 03 (Resolve)
    const daybreakStart = 0.7; // Chapter 04 (Daybreak)
    
    this.windows.forEach((window, idx) => {
      // Determine target state based on scroll
      let targetState: 'waiting' | 'emergency' | 'resolved' = window.state;
      
      if (this.scrollProgress >= daybreakStart) {
        // Daybreak: most windows settle to sage
        if (Math.random() < 0.01) { // Slow transition
          targetState = 'resolved';
        }
      } else if (this.scrollProgress >= resolveStart) {
        // Resolve: some windows transition
        if (idx % 10 === 0 && Math.random() < 0.02) {
          targetState = 'resolved';
        }
      }
      
      window.state = targetState;
      
      // Update intensity based on state
      if (window.state === 'resolved') {
        window.targetIntensity = 1.5; // Calm sage
        window.material.emissive.setHex(0x6fcf97);
      } else if (window.state === 'emergency') {
        window.targetIntensity = 3.5; // Flickering warm red
        window.material.emissive.setHex(0xe5484d);
      } else {
        window.targetIntensity = window.baseIntensity;
        window.material.emissive.setHex(0xf5a524);
      }
      
      // Smooth interpolation (1.2s per window, staggered)
      const lerpSpeed = 0.8;
      window.currentIntensity += (window.targetIntensity - window.currentIntensity) * lerpSpeed * 0.016;
      
      // Tiny flicker
      const flicker = Math.sin(this.time * 2 + window.flickerOffset) * 0.1;
      window.material.emissiveIntensity = window.currentIntensity + flicker;
    });
  }
  
  private updateLampPosts(): void {
    this.lampPosts.forEach(lamp => {
      // Smooth intensity interpolation
      lamp.light.intensity += (lamp.targetIntensity - lamp.light.intensity) * 0.1;
      
      // Intensity flicker
      const flicker = Math.sin(this.time * 3 + lamp.group.position.x) * 0.2;
      lamp.light.intensity += flicker;
      
      // Update glow sprite opacity
      (lamp.glowSprite.material as THREE.SpriteMaterial).opacity = 0.4 + flicker * 0.2;
    });
  }
  
  private updateEmbers(): void {
    if (!this.embers) return;
    
    const positions = this.embers.geometry.attributes.position.array as Float32Array;
    const velocities = (this.embers.geometry as any).velocities as Float32Array;
    
    for (let i = 0; i < positions.length / 3; i++) {
      positions[i * 3] += velocities[i * 3];
      positions[i * 3 + 1] += velocities[i * 3 + 1];
      positions[i * 3 + 2] += velocities[i * 3 + 2];
      
      // Reset if too high
      if (positions[i * 3 + 1] > 20) {
        positions[i * 3] = (Math.random() - 0.5) * 30;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = -10 - Math.random() * 30;
      }
    }
    
    this.embers.geometry.attributes.position.needsUpdate = true;
  }
  
  private updateDrizzle(): void {
    if (!this.drizzle) return;
    
    const positions = this.drizzle.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < positions.length / 3; i++) {
      positions[i * 3 + 1] -= 0.15; // Fall speed
      
      // Reset if too low
      if (positions[i * 3 + 1] < 0) {
        positions[i * 3 + 1] = 20;
      }
    }
    
    this.drizzle.geometry.attributes.position.needsUpdate = true;
  }
  
  private updateLeaves(): void {
    if (!this.leaves) return;
    
    const dummy = new THREE.Object3D();
    const matrix = new THREE.Matrix4();
    
    for (let i = 0; i < this.leaves.count; i++) {
      this.leaves.getMatrixAt(i, matrix);
      matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
      
      // Tumble on two axes
      dummy.rotation.x += 0.02 + Math.sin(this.time + i) * 0.01;
      dummy.rotation.z += 0.015 + Math.cos(this.time + i) * 0.01;
      
      // Slip sideways
      dummy.position.x += Math.sin(this.time * 0.5 + i * 0.1) * 0.01;
      
      // Fall
      dummy.position.y -= 0.02;
      
      // Reset if too low
      if (dummy.position.y < 0) {
        dummy.position.y = 15;
        dummy.position.x = (Math.random() - 0.5) * 20;
        dummy.position.z = -10 - Math.random() * 20;
      }
      
      dummy.updateMatrix();
      this.leaves.setMatrixAt(i, dummy.matrix);
    }
    
    this.leaves.instanceMatrix.needsUpdate = true;
  }
  
  // ─── Public API ────────────────────────────────────────────────────────────
  
  public highlightLamp(index: number): void {
    if (index >= 0 && index < this.lampPosts.length) {
      this.lampPosts[index].targetIntensity = this.lampPosts[index].baseIntensity * 1.3;
    }
  }
  
  public resetLamp(index: number): void {
    if (index >= 0 && index < this.lampPosts.length) {
      this.lampPosts[index].targetIntensity = this.lampPosts[index].baseIntensity;
    }
  }
  
  public dispose(): void {
    // Dispose all geometries and materials
    this.scene.traverse(obj => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.InstancedMesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
      if (obj instanceof THREE.Points) {
        obj.geometry.dispose();
        (obj.material as THREE.PointsMaterial).dispose();
      }
      if (obj instanceof THREE.Sprite) {
        (obj.material as THREE.SpriteMaterial).dispose();
      }
    });
  }
}
