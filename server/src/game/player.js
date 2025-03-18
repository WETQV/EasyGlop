const { GAME_CONSTANTS } = require('../../../shared/constants');

class Player {
  constructor(id, position = { x: 0, y: 1, z: 0 }) {
    this.id = id;
    this.position = position;
    this.velocity = { x: 0, y: 0, z: 0 };
    this.direction = { x: 0, y: 0, z: 1 }; // Смотрит вперед по умолчанию
    
    this.health = GAME_CONSTANTS.MAX_HEALTH;
    this.score = 0;
    this.isAlive = true;
    this.respawnTime = 0;
    
    this.lastShootTime = 0;
    this.lastHitTime = 0;
    
    this.onGround = false;
  }
  
  update(deltaTime, physics, map) {
    // Если игрок мертв, обрабатываем респаун
    if (!this.isAlive) {
      this.respawnTime -= deltaTime;
      if (this.respawnTime <= 0) {
        this.respawn(map);
      }
      return;
    }
    
    // Применяем гравитацию
    this.velocity.y -= GAME_CONSTANTS.GRAVITY * deltaTime;
    
    // Обновляем позицию
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.position.z += this.velocity.z * deltaTime;
    
    // Проверяем столкновение с землей
    if (this.position.y < 1) {
      this.position.y = 1;
      this.velocity.y = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }
    
    // Проверяем столкновения с препятствиями на карте
    if (map) {
      const collisions = physics.checkCollisions(this.position, 0.5, map);
      if (collisions.length > 0) {
        // Обрабатываем столкновения
        physics.resolveCollisions(this, collisions);
      }
    }
    
    // Замедляем горизонтальное движение (трение)
    this.velocity.x *= 0.9;
    this.velocity.z *= 0.9;
  }
  
  move(direction, speed = GAME_CONSTANTS.PLAYER_SPEED) {
    this.velocity.x = direction.x * speed;
    this.velocity.z = direction.z * speed;
  }
  
  jump() {
    if (this.onGround) {
      this.velocity.y = GAME_CONSTANTS.JUMP_FORCE;
      this.onGround = false;
    }
  }
  
  shoot() {
    const now = Date.now();
    
    // Проверяем кулдаун оружия
    if (now - this.lastShootTime < GAME_CONSTANTS.WEAPON_COOLDOWN) {
      return false;
    }
    
    this.lastShootTime = now;
    return true;
  }
  
  takeDamage(amount) {
    this.health -= amount;
    this.lastHitTime = Date.now();
    
    if (this.health <= 0) {
      this.die();
      return true;
    }
    
    return false;
  }
  
  die() {
    this.isAlive = false;
    this.health = 0;
    this.respawnTime = GAME_CONSTANTS.RESPAWN_TIME;
  }
  
  respawn(map) {
    this.isAlive = true;
    this.health = GAME_CONSTANTS.MAX_HEALTH;
    
    // Получаем случайную точку респауна
    const spawnPoint = map ? map.getRandomSpawnPoint() : { x: 0, y: 1, z: 0 };
    this.position = { ...spawnPoint };
    
    // Сбрасываем скорость
    this.velocity = { x: 0, y: 0, z: 0 };
  }
  
  addScore(points = 1) {
    this.score += points;
    return this.score;
  }
  
  getState() {
    return {
      id: this.id,
      position: this.position,
      direction: this.direction,
      health: this.health,
      score: this.score,
      isAlive: this.isAlive
    };
  }
}

function createPlayer(id, position) {
  return new Player(id, position);
}

module.exports = {
  Player,
  createPlayer
};