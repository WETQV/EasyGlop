import * as THREE from 'three';
import { GAME_CONFIG, getWeaponConfig } from '../config/gameConfig';

class WeaponSystem {
  constructor(scene, camera, networkManager, callbacks) {
    this.scene = scene;
    this.camera = camera;
    this.networkManager = networkManager;
    this.callbacks = callbacks;
    this.weaponOrder = ['pistol', 'rifle'];
    this.currentWeaponId = 'pistol';
    this.lastShotAt = 0;
    this.isReloading = false;
    this.weaponState = {};
    this.traces = [];

    this.weaponOrder.forEach((weaponId) => {
      const config = getWeaponConfig(weaponId);
      this.weaponState[weaponId] = {
        ammoInMag: config.ammo,
        reserveAmmo: config.reserveAmmo
      };
    });
  }

  getCurrentWeapon() {
    const config = getWeaponConfig(this.currentWeaponId);
    const state = this.weaponState[this.currentWeaponId];
    return {
      ...config,
      ...state
    };
  }

  switchWeapon(nextWeaponId) {
    if (!this.weaponState[nextWeaponId] || this.currentWeaponId === nextWeaponId) {
      return;
    }

    this.currentWeaponId = nextWeaponId;
    this.isReloading = false;
    this.callbacks.onWeaponChanged(this.getCurrentWeapon());
    this.callbacks.onFlash(
      this.getCurrentWeapon().label,
      'New tempo, new rhythm.',
      { mode: 'compact' }
    );
  }

  reload() {
    const weapon = this.getCurrentWeapon();
    if (this.isReloading || weapon.reserveAmmo <= 0 || weapon.ammoInMag === weapon.ammo) {
      return;
    }

    this.isReloading = true;
    this.callbacks.onRoundCue(`Reloading: ${weapon.label}`);

    window.setTimeout(() => {
      const state = this.weaponState[this.currentWeaponId];
      const missing = weapon.ammo - state.ammoInMag;
      const moved = Math.min(missing, state.reserveAmmo);
      state.ammoInMag += moved;
      state.reserveAmmo -= moved;
      this.isReloading = false;
      this.callbacks.onWeaponChanged(this.getCurrentWeapon());
      this.callbacks.onRoundCue('Reload complete. Back to the show.');
    }, weapon.reloadMs);
  }

  fire() {
    const weapon = this.getCurrentWeapon();
    if (this.isReloading) {
      return false;
    }

    const now = Date.now();
    if (now - this.lastShotAt < weapon.fireIntervalMs || weapon.ammoInMag <= 0) {
      if (weapon.ammoInMag <= 0) {
        this.callbacks.onRoundCue('Magazine empty. Hit R or swap weapons.');
      }
      return false;
    }

    this.lastShotAt = now;
    this.weaponState[this.currentWeaponId].ammoInMag -= 1;

    const direction = this.buildDirectionWithSpread(weapon.spread);
    this.drawTrace(direction, this.camera.position, weapon.tracerColor);
    this.drawMuzzleFlash(weapon.flashColor);

    this.networkManager?.sendPlayerShoot(this.camera.position, direction, weapon.id);
    this.callbacks.onWeaponChanged(this.getCurrentWeapon());
    this.callbacks.onRecoil(weapon.recoilKick);
    this.callbacks.onFlash(
      pickRandom(GAME_CONFIG.uiCopy.fired),
      `${weapon.label}: shot punched into the arena.`,
      { mode: 'compact' }
    );
    return true;
  }

  buildDirectionWithSpread(spread) {
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    direction.x += (Math.random() - 0.5) * spread;
    direction.y += (Math.random() - 0.5) * spread;
    direction.z += (Math.random() - 0.5) * spread;
    direction.normalize();
    return direction;
  }

  remoteShot(position, direction, weaponId = 'pistol') {
    const weapon = getWeaponConfig(weaponId);
    const origin = new THREE.Vector3(position.x, position.y, position.z);
    const normalizedDirection = new THREE.Vector3(direction.x, direction.y, direction.z).normalize();
    this.drawTrace(normalizedDirection, origin, weapon.tracerColor);
  }

  drawTrace(direction, origin = this.camera.position, color = 0xffff00) {
    const start = origin.clone();
    const end = origin.clone().add(direction.clone().multiplyScalar(28));
    const length = start.distanceTo(end);
    const traceGroup = new THREE.Group();

    const core = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.03, length, 6),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.92
      })
    );
    core.position.copy(start).lerp(end, 0.5);
    core.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(start).normalize());
    traceGroup.add(core);

    const glow = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.09, length, 6),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    glow.position.copy(core.position);
    glow.quaternion.copy(core.quaternion);
    traceGroup.add(glow);

    const impact = this.createSpark(color, 0.2);
    impact.position.copy(end);
    impact.lookAt(this.camera.position);
    traceGroup.add(impact);

    this.scene.add(traceGroup);
    this.traces.push(traceGroup);

    window.setTimeout(() => {
      this.disposeEffect(traceGroup);
      this.traces = this.traces.filter((trace) => trace !== traceGroup);
    }, 90);
  }

  drawMuzzleFlash(color) {
    const flash = this.createSpark(color, 0.12);
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    flash.position.copy(this.camera.position).add(direction.multiplyScalar(0.7));
    flash.lookAt(this.camera.position);
    this.scene.add(flash);

    window.setTimeout(() => {
      this.disposeEffect(flash);
    }, 50);
  }

  createSpark(color, scale = 0.12) {
    const spark = new THREE.Group();
    const makePlane = (width, height, opacity, rotationZ = 0) => {
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(width, height),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide
        })
      );
      plane.rotation.z = rotationZ;
      return plane;
    };

    spark.add(makePlane(scale * 2.8, scale * 0.42, 0.95));
    spark.add(makePlane(scale * 0.42, scale * 2.8, 0.95));
    spark.add(makePlane(scale * 2.1, scale * 0.24, 0.52, Math.PI / 4));
    spark.add(makePlane(scale * 2.1, scale * 0.24, 0.52, -Math.PI / 4));
    return spark;
  }

  disposeEffect(object) {
    if (!object) {
      return;
    }

    this.scene.remove(object);
    object.traverse((child) => {
      if (child.geometry) {
        child.geometry.dispose();
      }

      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((material) => material.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }
}

function pickRandom(options) {
  return options[Math.floor(Math.random() * options.length)];
}

export function createWeaponSystem(scene, camera, networkManager, callbacks) {
  return new WeaponSystem(scene, camera, networkManager, callbacks);
}
