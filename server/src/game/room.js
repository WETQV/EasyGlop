const WEAPONS = {
  pistol: { damage: 34 },
  rifle: { damage: 18 }
};

function generateMap() {
  const mapSize = 50;
  const half = mapSize / 2;
  const hotZone = { x: 0, z: 0 };

  const spawnPoints = [
    { x: -18, y: 1.6, z: -14 },
    { x: 18, y: 1.6, z: -14 },
    { x: -18, y: 1.6, z: 14 },
    { x: 18, y: 1.6, z: 14 },
    { x: 0, y: 1.6, z: 20 }
  ];

  const coverPairs = [
    { x: -9, z: -8, w: 3, h: 3, d: 6 },
    { x: 9, z: -8, w: 3, h: 3, d: 6 },
    { x: -9, z: 8, w: 3, h: 3, d: 6 },
    { x: 9, z: 8, w: 3, h: 3, d: 6 },
    { x: 0, z: -14, w: 6, h: 2.2, d: 3.2 },
    { x: 0, z: 14, w: 6, h: 2.2, d: 3.2 },
    { x: -15, z: 0, w: 3.2, h: 2.8, d: 6.5 },
    { x: 15, z: 0, w: 3.2, h: 2.8, d: 6.5 }
  ];

  const obstacles = coverPairs.map((cover) => ({
    kind: 'cover',
    position: { x: cover.x, y: 0, z: cover.z },
    size: { width: cover.w, height: cover.h, depth: cover.d }
  }));

  const laneDecor = [];
  for (let i = 0; i < 6; i += 1) {
    laneDecor.push({
      kind: 'decor',
      position: {
        x: (Math.random() - 0.5) * (half - 8),
        y: 0,
        z: (Math.random() - 0.5) * (half - 8)
      },
      size: {
        width: 1.5 + Math.random() * 2,
        height: 2 + Math.random() * 3,
        depth: 1.5 + Math.random() * 2
      }
    });
  }

  return {
    size: mapSize,
    hotZone,
    landmarks: [
      { position: { x: 0, z: -20 }, height: 8 },
      { position: { x: -20, z: 0 }, height: 6 },
      { position: { x: 20, z: 0 }, height: 6 }
    ],
    obstacles: [...obstacles, ...laneDecor],
    spawnPoints
  };
}

class GameRoom {
  constructor(id) {
    this.id = id;
    this.players = {};
    this.mapData = generateMap();
    this.gameActive = true;
    this.startTime = Date.now();
    this.timeLimit = 6 * 60 * 1000;
    this.scoreToWin = 10;
  }

  addPlayer(id) {
    this.players[id] = {
      id,
      position: this.getRandomSpawnPosition(),
      health: 100,
      score: 0,
      deaths: 0,
      lastShootTime: 0
    };

    return this.players[id];
  }

  removePlayer(id) {
    delete this.players[id];
  }

  getPlayer(id) {
    return this.players[id];
  }

  getRandomSpawnPosition() {
    const spawnPoint = this.mapData.spawnPoints[Math.floor(Math.random() * this.mapData.spawnPoints.length)];
    return { ...spawnPoint };
  }

  updatePlayerPosition(id, position) {
    if (!this.players[id]) {
      return;
    }

    this.players[id].position = { ...position };
  }

  getPlayerPosition(id) {
    return this.players[id]?.position || null;
  }

  processShot(shooterId, direction, weaponId = 'pistol') {
    const shooter = this.players[shooterId];
    if (!shooter) {
      return null;
    }

    const now = Date.now();
    const shotCooldown = weaponId === 'rifle' ? 120 : 220;
    if (now - shooter.lastShootTime < shotCooldown) {
      return null;
    }

    shooter.lastShootTime = now;
    const weapon = WEAPONS[weaponId] || WEAPONS.pistol;
    const shooterPos = shooter.position;
    let closestHit = null;
    let closestDistance = Infinity;

    Object.entries(this.players).forEach(([playerId, target]) => {
      if (playerId === shooterId) {
        return;
      }

      const dx = target.position.x - shooterPos.x;
      const dy = target.position.y - shooterPos.y;
      const dz = target.position.z - shooterPos.z;
      const distance = Math.hypot(dx, dy, dz);

      if (distance === 0 || distance > 60) {
        return;
      }

      const normalized = {
        x: dx / distance,
        y: dy / distance,
        z: dz / distance
      };

      const dot = (
        normalized.x * direction.x +
        normalized.y * direction.y +
        normalized.z * direction.z
      );

      if (dot > 0.92 && distance < closestDistance) {
        closestDistance = distance;
        closestHit = playerId;
      }
    });

    if (!closestHit) {
      return null;
    }

    const target = this.players[closestHit];
    target.health = Math.max(0, target.health - weapon.damage);

    const result = {
      shooter: shooterId,
      target: closestHit,
      damage: weapon.damage,
      targetHealth: target.health,
      shooterScore: shooter.score,
      defeated: false
    };

    if (target.health <= 0) {
      shooter.score += 1;
      target.deaths += 1;
      result.shooterScore = shooter.score;
      result.defeated = true;
      const respawn = this.respawnPlayer(closestHit);
      result.respawn = respawn;
    }

    return result;
  }

  respawnPlayer(playerId) {
    const player = this.players[playerId];
    if (!player) {
      return null;
    }

    player.position = this.getRandomSpawnPosition();
    player.health = 100;
    return {
      id: playerId,
      position: { ...player.position },
      health: player.health
    };
  }

  getState() {
    return {
      id: this.id,
      players: this.players,
      mapData: this.mapData,
      gameActive: this.gameActive,
      timeRemaining: this.getTimeRemaining()
    };
  }

  getMapData() {
    return this.mapData;
  }

  getTimeRemaining() {
    const elapsed = Date.now() - this.startTime;
    const remaining = Math.max(0, this.timeLimit - elapsed);
    return Math.floor(remaining / 1000);
  }

  shouldEndGame(score) {
    return score >= this.scoreToWin || this.getTimeRemaining() <= 0;
  }

  generateNewMap() {
    this.mapData = generateMap();
    Object.values(this.players).forEach((player) => {
      player.position = this.getRandomSpawnPosition();
      player.health = 100;
      player.lastShootTime = 0;
    });
    this.startTime = Date.now();
    return this.mapData;
  }
}

function createGameRoom(id) {
  return new GameRoom(id);
}

module.exports = {
  createGameRoom
};
