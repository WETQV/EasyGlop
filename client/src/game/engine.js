import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import fragmentShader from '../../shaders/phong.frag';
import Player from './player';
import { createWeaponSystem } from './weapons';
import { initNetwork } from '../network/network';
import { GAME_CONFIG, getWeaponConfig } from '../config/gameConfig';

class GameEngine {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.container = null;
    this.ui = null;
    this.networkManager = null;
    this.localPlayer = null;
    this.players = {};
    this.map = null;
    this.weaponSystem = null;
    this.isGameActive = false;
    this.timeRemaining = GAME_CONFIG.matchLengthSeconds;
    this.keys = {};
    this.clock = new THREE.Clock();
    this.gameTimer = null;
    this.pointerLockRequested = false;
    this.firstSpawnShown = false;
    this.localState = {
      score: 0,
      health: GAME_CONFIG.combat.maxHealth
    };
  }

  async init(container, ui) {
    this.container = container;
    this.ui = ui;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x140912);
    this.scene.fog = new THREE.Fog(0x160914, 24, 92);

    this.camera = new THREE.PerspectiveCamera(GAME_CONFIG.baseFov, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, GAME_CONFIG.localPlayerHeight, 10);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);

    this.controls = new PointerLockControls(this.camera, this.renderer.domElement);

    this.installScene();
    this.installInput();
    this.installPointerLockHooks();

    this.networkManager = initNetwork(this);
    this.weaponSystem = createWeaponSystem(this.scene, this.camera, this.networkManager, {
      onFlash: (title, subtitle, options) => this.ui.hud.flash(title, subtitle, options),
      onWeaponChanged: (weapon) => this.syncWeaponHud(weapon),
      onRoundCue: (message) => this.ui.hud.setRoundCue(message),
      onRecoil: (kick) => this.applyRecoil(kick)
    });

    this.createLocalPlayer();
    this.syncHud();
    this.startRenderLoop();
  }

  installScene() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xffb366, 1.4);
    directional.position.set(12, 18, 8);
    directional.castShadow = true;
    this.scene.add(directional);

    const heroCube = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 1.4, 1.4),
      new THREE.ShaderMaterial({
        fragmentShader,
        vertexShader: THREE.ShaderLib.phong.vertexShader,
        uniforms: {
          ...THREE.UniformsUtils.clone(THREE.ShaderLib.phong.uniforms),
          diffuse: { value: new THREE.Color(0xffef0a) },
          emissive: { value: new THREE.Color(0x2b0011) },
          specular: { value: new THREE.Color(0xffffff) },
          shininess: { value: 18 }
        },
        lights: true
      })
    );

    heroCube.position.set(0, 1.8, -8);
    heroCube.castShadow = true;
    heroCube.receiveShadow = true;
    this.scene.add(heroCube);
  }

  installInput() {
    window.addEventListener('resize', () => this.onWindowResize());

    document.addEventListener('keydown', (event) => {
      this.keys[event.code] = true;

      if (event.code === 'Escape' && this.isGameActive) {
        this.stopGame({ showResults: false });
        this.ui.menu.showMainMenu();
      }

      if (event.code === 'Digit1') {
        this.weaponSystem.switchWeapon('pistol');
      }

      if (event.code === 'Digit2') {
        this.weaponSystem.switchWeapon('rifle');
      }

      if (event.code === 'KeyR') {
        this.weaponSystem.reload();
      }
    });

    document.addEventListener('keyup', (event) => {
      this.keys[event.code] = false;
    });

    this.renderer.domElement.addEventListener('click', () => {
      if (!this.isGameActive) {
        return;
      }

      if (!this.controls.isLocked) {
        this.requestPointerLock();
        return;
      }

      this.weaponSystem.fire();
    });
  }

  installPointerLockHooks() {
    this.controls.addEventListener('lock', () => {
      this.pointerLockRequested = false;
      this.ui.hud.hidePointerHint();
      this.ui.hud.setRoundCue('Курсор захвачен. Держи центр и дави проходы.');
    });

    this.controls.addEventListener('unlock', () => {
      if (this.isGameActive) {
        this.ui.hud.showPointerHint(GAME_CONFIG.uiCopy.reconnectHint);
      }
    });
  }

  requestPointerLock() {
    if (this.pointerLockRequested) {
      return;
    }

    this.pointerLockRequested = true;

    try {
      this.controls.lock();
    } catch (error) {
      this.pointerLockRequested = false;
      this.ui.hud.showPointerHint(GAME_CONFIG.uiCopy.pointerFail);
      console.error('Pointer lock failed:', error);
    }
  }

  createLocalPlayer() {
    if (this.localPlayer) {
      this.localPlayer.dispose();
    }

    this.localPlayer = new Player({
      id: 'local',
      position: new THREE.Vector3(0, GAME_CONFIG.localPlayerHeight, 0),
      scene: this.scene,
      camera: this.camera,
      controls: this.controls,
      isLocal: true
    });
  }

  startGame() {
    this.ui.menu.hideMainMenu();
    this.ui.menu.hideGameOver();
    this.isGameActive = true;
    this.timeRemaining = GAME_CONFIG.matchLengthSeconds;
    this.localState.health = GAME_CONFIG.combat.maxHealth;
    this.syncHud();
    this.ui.hud.showPointerHint();
    this.ui.hud.flash(
      'MATCH START',
      'Найди центр, зацепись за cover rhythm и забери темп.',
      { mode: 'banner' }
    );

    if (!this.firstSpawnShown) {
      this.firstSpawnShown = true;
      this.ui.hud.showOrientation();
      window.setTimeout(() => this.ui.hud.hideOrientation(), GAME_CONFIG.combat.orientationDurationMs);
    }

    clearInterval(this.gameTimer);
    this.gameTimer = window.setInterval(() => {
      this.timeRemaining -= 1;
      this.ui.hud.setTime(this.timeRemaining);

      if (this.timeRemaining <= 0) {
        this.showGameResults({
          winner: this.networkManager?.playerId,
          score: this.localState.score
        });
      }
    }, 1000);
  }

  restartGame() {
    this.stopGame({ showResults: false });
    this.startGame();
  }

  stopGame({ showResults = false } = {}) {
    this.isGameActive = false;
    clearInterval(this.gameTimer);
    if (this.controls.isLocked) {
      this.controls.unlock();
    }
    this.ui.hud.hidePointerHint();
    this.ui.hud.hideOrientation();

    if (showResults) {
      this.ui.menu.showGameOver('Раунд закончился, а арена просит ещё один дубль.');
    }
  }

  startRenderLoop() {
    this.clock.start();

    const tick = () => {
      const delta = Math.min(this.clock.getDelta(), 0.05);

      if (this.isGameActive && this.localPlayer) {
        this.localPlayer.update(delta, this.keys, this.networkManager);
        this.camera.fov = THREE.MathUtils.damp(
          this.camera.fov,
          GAME_CONFIG.baseFov + Math.min(2.5, this.localPlayer.velocity.length() * 0.12),
          8,
          delta
        );
        this.camera.updateProjectionMatrix();
      }

      Object.values(this.players).forEach((player) => player.update(delta));
      this.renderer.render(this.scene, this.camera);
      window.requestAnimationFrame(tick);
    };

    tick();
  }

  syncHud() {
    this.ui.hud.setScore(this.localState.score);
    this.ui.hud.setTime(this.timeRemaining);
    this.ui.hud.setHealth(this.localState.health);
    this.syncWeaponHud(this.weaponSystem ? this.weaponSystem.getCurrentWeapon() : getWeaponConfig('pistol'));
    this.ui.hud.setRoundCue(GAME_CONFIG.uiCopy.mobileWarning);
  }

  syncWeaponHud(weapon) {
    if (!weapon) {
      return;
    }
    this.ui.hud.setWeapon(weapon.label, weapon.ammoInMag ?? weapon.ammo, weapon.reserveAmmo ?? 0);
  }

  applyRoomState(data, playerId) {
    this.updateMap(data.mapData);

    Object.entries(data.players || {}).forEach(([id, player]) => {
      if (id === playerId) {
        this.localPlayer.id = id;
        this.localPlayer.setPosition(new THREE.Vector3(player.position.x, GAME_CONFIG.localPlayerHeight, player.position.z));
        this.localState.score = player.score || 0;
        this.localState.health = player.health ?? GAME_CONFIG.combat.maxHealth;
        this.syncHud();
        return;
      }

      this.ensureRemotePlayer(id, player.position);
      this.players[id].setHealth(player.health ?? GAME_CONFIG.combat.maxHealth);
    });
  }

  onNetworkConnected(playerId) {
    this.ui.hud.setConnectionState(`${GAME_CONFIG.uiCopy.connected} id=${playerId}`, 'good');
    this.ui.hud.setRoundCue('Локальная loopback-связь держится. Можно входить в бой.');
  }

  onNetworkDisconnected(reason) {
    this.ui.hud.setConnectionState(`${GAME_CONFIG.uiCopy.disconnected} (${reason})`, 'bad');
    this.ui.hud.setRoundCue('Связь шатается. Держись рядом с 127.0.0.1 и не паникуй.');
  }

  handleRemotePlayerJoined(data) {
    this.ensureRemotePlayer(data.id, data.position);
    this.ui.hud.pushKillFeed(`+ ${data.id.slice(0, 5)} вошёл на сцену`, 'neutral');
    this.ui.hud.flash(pickRandom(GAME_CONFIG.uiCopy.otherPlayerJoined), `Игрок ${data.id.slice(0, 5)} появился на карте`);
  }

  ensureRemotePlayer(id, position) {
    if (this.players[id]) {
      this.updatePlayerPosition(id, position);
      return this.players[id];
    }

    const player = new Player({
      id,
      position: new THREE.Vector3(position.x, GAME_CONFIG.localPlayerHeight, position.z),
      scene: this.scene
    });

    this.players[id] = player;
    return player;
  }

  updatePlayerPosition(id, position) {
    const player = this.players[id];
    if (!player) {
      this.ensureRemotePlayer(id, position);
      return;
    }

    player.setPosition(new THREE.Vector3(position.x, GAME_CONFIG.localPlayerHeight, position.z));
  }

  removePlayer(id) {
    const player = this.players[id];
    if (!player) {
      return;
    }

    player.dispose();
    delete this.players[id];
    this.ui.hud.pushKillFeed(`- ${id.slice(0, 5)} исчез из эфира`, 'neutral');
  }

  playerShot(id, position, direction, weaponId) {
    if (!this.players[id]) {
      this.ensureRemotePlayer(id, position);
    }

    this.weaponSystem.remoteShot(position, direction, weaponId);
  }

  playerHit(data) {
    if (data.target === this.networkManager?.playerId) {
      this.localState.health = data.targetHealth;
      this.ui.hud.setHealth(this.localState.health);
      this.ui.hud.showDamage(data.from || '', this.localState.health <= GAME_CONFIG.combat.lowHealthThreshold);
      if (this.localState.health <= GAME_CONFIG.combat.lowHealthThreshold) {
        this.ui.hud.setRoundCue(GAME_CONFIG.uiCopy.lowHealth);
      }
    }

    if (data.shooter === this.networkManager?.playerId) {
      this.localState.score = data.shooterScore;
      this.ui.hud.setScore(this.localState.score);

      if (data.defeated) {
        this.ui.hud.flash(pickRandom(GAME_CONFIG.uiCopy.kill), `Фраг по ${data.target.slice(0, 5)}. Счёт: ${data.shooterScore}`);
        this.ui.hud.pushKillFeed(`Ты выключил ${data.target.slice(0, 5)}`, 'good');
      } else {
        this.ui.hud.flash(pickRandom(GAME_CONFIG.uiCopy.hit), `Урон по ${data.target.slice(0, 5)}: ${data.damage}`);
      }
    } else if (data.defeated && data.target === this.networkManager?.playerId) {
      this.ui.hud.flash(pickRandom(GAME_CONFIG.uiCopy.death), `Тебя снял ${data.shooter.slice(0, 5)}`);
      this.ui.hud.pushKillFeed(`${data.shooter.slice(0, 5)} выключил тебя`, 'bad');
    }
  }

  playerRespawned(data) {
    if (data.id === this.networkManager?.playerId) {
      this.localState.health = data.health;
      this.ui.hud.setHealth(data.health);
      this.ui.hud.setRoundCue('Респаун. Возвращайся в темп через фланг или центр.');
      this.localPlayer.setPosition(new THREE.Vector3(data.position.x, GAME_CONFIG.localPlayerHeight, data.position.z));
      return;
    }

    this.ensureRemotePlayer(data.id, data.position);
    this.players[data.id].setPosition(new THREE.Vector3(data.position.x, GAME_CONFIG.localPlayerHeight, data.position.z));
    this.players[data.id].setHealth(data.health);
  }

  showGameResults(data) {
    this.stopGame({ showResults: false });
    const isWinner = data.winner === this.networkManager?.playerId;
    const resultText = isWinner
      ? `Ты забрал раунд со счётом ${data.score}. Арена запомнила этот эпизод.`
      : `Раунд завершён. Победный счёт: ${data.score}. Перезапускай и ломай сцену ещё жёстче.`;
    this.ui.menu.showGameOver(resultText);
  }

  updateMap(mapData) {
    if (!mapData) {
      return;
    }

    if (this.map) {
      this.scene.remove(this.map);
      this.disposeGroup(this.map);
    }

    this.map = new THREE.Group();

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(mapData.size, mapData.size),
      new THREE.MeshStandardMaterial({
        color: 0x312733,
        roughness: 0.88,
        emissive: 0x14050d
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.map.add(floor);

    const centerRing = new THREE.Mesh(
      new THREE.TorusGeometry(6, 0.28, 16, 64),
      new THREE.MeshStandardMaterial({
        color: 0xffef0a,
        emissive: 0x6f001b
      })
    );
    centerRing.rotation.x = Math.PI / 2;
    centerRing.position.set(mapData.hotZone?.x || 0, 0.12, mapData.hotZone?.z || 0);
    this.map.add(centerRing);

    (mapData.landmarks || []).forEach((landmark, index) => {
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.8, landmark.height, 6),
        new THREE.MeshStandardMaterial({
          color: index % 2 === 0 ? 0xff4d6d : 0x00d1b2,
          emissive: index % 2 === 0 ? 0x28000b : 0x002822
        })
      );
      mesh.position.set(landmark.position.x, landmark.height / 2, landmark.position.z);
      mesh.castShadow = true;
      this.map.add(mesh);
    });

    (mapData.obstacles || []).forEach((obstacle, index) => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(obstacle.size.width, obstacle.size.height, obstacle.size.depth),
        new THREE.MeshStandardMaterial({
          color: obstacle.kind === 'cover' ? 0x596a78 : (index % 2 === 0 ? 0xff4d6d : 0x00d1b2),
          emissive: obstacle.kind === 'cover' ? 0x111f26 : (index % 2 === 0 ? 0x33000b : 0x002a24)
        })
      );
      mesh.position.set(
        obstacle.position.x,
        obstacle.position.y + obstacle.size.height / 2,
        obstacle.position.z
      );
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.map.add(mesh);
    });

    const border = new THREE.Mesh(
      new THREE.TorusGeometry(mapData.size * 0.49, 0.35, 16, 80),
      new THREE.MeshStandardMaterial({
        color: 0xff8a00,
        emissive: 0x521100
      })
    );
    border.rotation.x = Math.PI / 2;
    border.position.y = 0.02;
    this.map.add(border);

    this.scene.add(this.map);

    if (this.isGameActive) {
      this.ui.hud.flash(
        pickRandom(GAME_CONFIG.uiCopy.mapLoaded),
        '????? ????? ???? ????? ????????, ?????? ? ???????? ???????.',
        { compact: true }
      );
    } else {
      this.ui.hud.hideFlash();
    }
  }

  applyRecoil(kick) {
    if (!this.localPlayer) {
      return;
    }
    this.localPlayer.setSway(0, -kick * 0.65);
  }

  onWindowResize() {
    if (!this.camera || !this.renderer) {
      return;
    }

    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  disposeGroup(group) {
    group.traverse((child) => {
      if (child.geometry) {
        child.geometry.dispose();
      }

      if (child.material) {
        child.material.dispose();
      }
    });
  }
}

function pickRandom(options) {
  return options[Math.floor(Math.random() * options.length)];
}

export default new GameEngine();
