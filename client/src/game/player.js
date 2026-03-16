import * as THREE from 'three';
import { GAME_CONFIG } from '../config/gameConfig';

const UP = new THREE.Vector3(0, 1, 0);

class Player {
  constructor({ id, position, scene, camera, controls, isLocal = false }) {
    this.id = id;
    this.scene = scene;
    this.camera = camera;
    this.controls = controls;
    this.isLocal = isLocal;
    this.health = GAME_CONFIG.combat.maxHealth;
    this.position = position ? position.clone() : new THREE.Vector3(0, GAME_CONFIG.localPlayerHeight, 0);
    this.targetPosition = this.position.clone();
    this.velocity = new THREE.Vector3();
    this.inputVector = new THREE.Vector3();
    this.bobPhase = 0;
    this.lastBroadcast = 0;
    this.verticalVelocity = 0;
    this.isGrounded = true;
    this.sway = new THREE.Vector2();
    this.cameraOffset = new THREE.Vector3();

    this.createModel();
    this.syncVisuals(0);
  }

  createModel() {
    this.group = new THREE.Group();

    const torso = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 1.2, 0.55),
      new THREE.MeshStandardMaterial({
        color: this.isLocal ? 0xffef0a : 0x00ff9c,
        emissive: this.isLocal ? 0x5d2100 : 0x00331f
      })
    );
    torso.position.y = 1.1;
    torso.castShadow = true;
    torso.receiveShadow = true;

    const head = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.34, 0),
      new THREE.MeshStandardMaterial({
        color: this.isLocal ? 0xff4d6d : 0xfaf7f0,
        emissive: this.isLocal ? 0x2a0010 : 0x262626
      })
    );
    head.position.y = 1.95;
    head.castShadow = true;

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.45, 0.05, 8, 24),
      new THREE.MeshBasicMaterial({
        color: this.isLocal ? 0xffef0a : 0x00ffd0
      })
    );
    halo.rotation.x = Math.PI / 2;
    halo.position.y = 2.2;

    this.group.add(torso);
    this.group.add(head);
    this.group.add(halo);
    this.group.userData.isPlayer = true;
    this.group.userData.player = this;
    this.scene.add(this.group);

    this.torso = torso;
    this.head = head;
    this.halo = halo;

    if (this.isLocal) {
      this.group.visible = false;
    }
  }

  setPosition(nextPosition) {
    this.targetPosition.copy(nextPosition);
    if (!this.isLocal) {
      this.position.lerp(this.targetPosition, 0.65);
      this.syncVisuals(0);
    }
  }

  setHealth(nextHealth) {
    this.health = nextHealth;
  }

  setSway(x, y) {
    this.sway.set(x, y);
  }

  update(deltaSeconds, keys, networkManager) {
    if (this.isLocal) {
      this.updateLocal(deltaSeconds, keys, networkManager);
      return;
    }

    this.position.lerp(this.targetPosition, GAME_CONFIG.combat.remoteLerp);
    this.syncVisuals(deltaSeconds);
  }

  updateLocal(deltaSeconds, keys, networkManager) {
    const acceleration = GAME_CONFIG.movement.acceleration;
    const friction = GAME_CONFIG.movement.friction;
    const maxSpeed = GAME_CONFIG.movement.maxSpeed;

    this.inputVector.set(
      Number(Boolean(keys.KeyD)) - Number(Boolean(keys.KeyA)),
      0,
      Number(Boolean(keys.KeyS)) - Number(Boolean(keys.KeyW))
    );

    if (this.inputVector.lengthSq() > 0) {
      this.inputVector.normalize();
      const forward = new THREE.Vector3();
      this.camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();

      const right = new THREE.Vector3().crossVectors(forward, UP).normalize();
      const desiredVelocity = new THREE.Vector3()
        .addScaledVector(forward, -this.inputVector.z)
        .addScaledVector(right, this.inputVector.x)
        .normalize()
        .multiplyScalar(maxSpeed);

      this.velocity.x = THREE.MathUtils.damp(this.velocity.x, desiredVelocity.x, acceleration, deltaSeconds);
      this.velocity.z = THREE.MathUtils.damp(this.velocity.z, desiredVelocity.z, acceleration, deltaSeconds);
    } else {
      this.velocity.x = THREE.MathUtils.damp(this.velocity.x, 0, friction, deltaSeconds);
      this.velocity.z = THREE.MathUtils.damp(this.velocity.z, 0, friction, deltaSeconds);
    }

    if (keys.Space && this.isGrounded) {
      this.verticalVelocity = GAME_CONFIG.movement.jumpVelocity;
      this.isGrounded = false;
    }

    this.verticalVelocity -= GAME_CONFIG.movement.gravity * deltaSeconds;
    this.position.addScaledVector(this.velocity, deltaSeconds);
    this.position.y += this.verticalVelocity * deltaSeconds;

    if (this.position.y <= GAME_CONFIG.localPlayerHeight) {
      if (!this.isGrounded && this.verticalVelocity < -1) {
        this.sway.y -= GAME_CONFIG.movement.landingDip;
      }

      this.position.y = GAME_CONFIG.localPlayerHeight;
      this.verticalVelocity = 0;
      this.isGrounded = true;
    }

    this.syncVisuals(deltaSeconds);

    const now = performance.now();
    if (networkManager && now - this.lastBroadcast > 50) {
      this.lastBroadcast = now;
      networkManager.sendPlayerMove(this.position);
    }
  }

  syncVisuals(deltaSeconds) {
    const planarSpeed = Math.hypot(this.velocity.x, this.velocity.z);
    if (planarSpeed > 0.05) {
      this.bobPhase += deltaSeconds * GAME_CONFIG.movement.bobSpeed * Math.min(planarSpeed / GAME_CONFIG.movement.maxSpeed, 1.2);
    }

    const bobOffset = Math.sin(this.bobPhase) * GAME_CONFIG.movement.bobAmount;

    this.group.position.copy(this.position);
    this.group.position.y = this.position.y - GAME_CONFIG.localPlayerHeight;
    this.group.position.y += bobOffset * 0.5;

    this.halo.rotation.z += deltaSeconds * 1.7;
    this.halo.position.y = 2.2 + Math.sin(this.bobPhase * 0.7) * 0.06;
    this.head.position.y = 1.95 + bobOffset * 0.3;
    this.group.rotation.y = Math.atan2(this.velocity.x || 0.001, this.velocity.z || 0.001);

    if (this.isLocal && this.camera) {
      const bobCamera = this.isGrounded ? bobOffset * 0.45 : 0;
      this.sway.lerp(new THREE.Vector2(0, 0), Math.min(1, deltaSeconds * 10));
      this.cameraOffset.set(0, bobCamera + this.sway.y, 0);
      this.camera.position.set(
        this.position.x,
        this.position.y + this.cameraOffset.y,
        this.position.z
      );
    }
  }

  dispose() {
    this.scene.remove(this.group);
    this.group.traverse((child) => {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        child.material.dispose();
      }
    });
  }
}

export default Player;
