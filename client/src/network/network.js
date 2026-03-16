import { io } from 'socket.io-client';
import * as THREE from 'three';
import { GAME_CONFIG } from '../config/gameConfig';

class NetworkManager {
  constructor() {
    this.socket = null;
    this.gameEngine = null;
    this.connected = false;
    this.playerId = null;
  }

  init(gameEngine) {
    this.gameEngine = gameEngine;

    this.socket = io(GAME_CONFIG.socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true
    });

    this.socket.on('connect', () => {
      this.connected = true;
      this.playerId = this.socket.id;
      this.gameEngine?.onNetworkConnected(this.playerId);
    });

    this.socket.on('disconnect', (reason) => {
      this.connected = false;
      this.gameEngine?.onNetworkDisconnected(reason);
    });

    this.socket.on('room_state', (data) => {
      this.gameEngine?.applyRoomState(data, this.playerId);
    });

    this.socket.on('player_joined', (data) => {
      this.gameEngine?.handleRemotePlayerJoined(data);
    });

    this.socket.on('player_left', (data) => {
      this.gameEngine?.removePlayer(data.id);
    });

    this.socket.on('player_moved', (data) => {
      this.gameEngine?.updatePlayerPosition(data.id, data.position);
    });

    this.socket.on('player_shot', (data) => {
      this.gameEngine?.playerShot(data.id, data.position, data.direction, data.weaponId);
    });

    this.socket.on('player_hit', (data) => {
      this.gameEngine?.playerHit(data);
    });

    this.socket.on('player_respawned', (data) => {
      this.gameEngine?.playerRespawned(data);
    });

    this.socket.on('game_over', (data) => {
      this.gameEngine?.showGameResults(data);
    });

    this.socket.on('new_map', (data) => {
      this.gameEngine?.updateMap(data);
    });
  }

  sendPlayerMove(position) {
    if (!this.connected || !this.socket) {
      return;
    }

    this.socket.emit('player_move', {
      position: vectorToObject(position)
    });
  }

  sendPlayerShoot(position, direction, weaponId) {
    if (!this.connected || !this.socket) {
      return;
    }

    this.socket.emit('player_shoot', {
      position: vectorToObject(position),
      direction: vectorToObject(direction),
      weaponId
    });
  }
}

function vectorToObject(vector) {
  if (vector instanceof THREE.Vector3) {
    return {
      x: Number(vector.x.toFixed(3)),
      y: Number(vector.y.toFixed(3)),
      z: Number(vector.z.toFixed(3))
    };
  }

  return vector;
}

const networkManager = new NetworkManager();

export function initNetwork(gameEngine) {
  networkManager.init(gameEngine);
  return networkManager;
}

export default networkManager;
