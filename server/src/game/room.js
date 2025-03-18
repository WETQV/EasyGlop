const { generateMap } = require('./map');
const { Vector3 } = require('three');

class GameRoom {
  constructor(id) {
    this.id = id;
    this.players = {};
    this.mapData = generateMap();
    this.gameActive = false;
    this.startTime = null;
    this.timeLimit = 10 * 60 * 1000; // 10 минут в миллисекундах
  }
  
  addPlayer(id) {
    this.players[id] = {
      id,
      position: this.getRandomSpawnPosition(),
      health: 100,
      score: 0,
      lastShootTime: 0
    };
    
    return this.players[id];
  }
  
  removePlayer(id) {
    if (this.players[id]) {
      delete this.players[id];
    }
  }
  
  getPlayer(id) {
    return this.players[id];
  }
  
  getPlayerPosition(id) {
    return this.players[id] ? this.players[id].position : null;
  }
  
  updatePlayerPosition(id, position) {
    if (this.players[id]) {
      this.players[id].position = position;
    }
  }
  
  getRandomSpawnPosition() {
    // Получаем случайную точку спавна из карты
    const spawnPoints = this.mapData.spawnPoints;
    const randomIndex = Math.floor(Math.random() * spawnPoints.length);
    
    return spawnPoints[randomIndex];
  }
  
  processShot(shooterId, direction) {
    if (!this.players[shooterId]) {
      return null;
    }
    
    // Проверяем, не слишком ли часто стреляет игрок (защита от читеров)
    const now = Date.now();
    if (now - this.players[shooterId].lastShootTime < 100) { // Минимум 100 мс между выстрелами
      return null;
    }
    this.players[shooterId].lastShootTime = now;
    
    // Создаем луч для проверки попаданий
    const shooterPosition = this.players[shooterId].position;
    
    // Проверяем попадание в других игроков
    for (const playerId in this.players) {
      if (playerId === shooterId) continue;
      
      const targetPlayer = this.players[playerId];
      const targetPosition = targetPlayer.position;
      
      // Упрощенная проверка попадания (в реальной игре нужна более сложная логика)
      // Проверяем, находится ли игрок на линии выстрела
      if (this.checkRayIntersection(shooterPosition, direction, targetPosition)) {
        // Наносим урон
        targetPlayer.health -= 25; // 4 попадания для убийства
        
        // Если игрок убит
        if (targetPlayer.health <= 0) {
          // Увеличиваем счет стрелявшего
          this.players[shooterId].score++;
          
          // Респавним убитого игрока
          targetPlayer.health = 100;
          targetPlayer.position = this.getRandomSpawnPosition();
          
          return playerId; // Возвращаем ID убитого игрока
        }
      }
    }
    
    return null; // Никто не убит
  }
  
  checkRayIntersection(origin, direction, targetPosition) {
    // Упрощенная проверка пересечения луча с игроком
    // В реальной игре нужна более точная проверка с учетом хитбоксов
    
    // Вектор от стрелка до цели
    const toTarget = {
      x: targetPosition.x - origin.x,
      y: targetPosition.y - origin.y,
      z: targetPosition.z - origin.z
    };
    
    // Длина вектора направления
    const dirLength = Math.sqrt(
      direction.x * direction.x + 
      direction.y * direction.y + 
      direction.z * direction.z
    );
    
    // Нормализуем направление
    const normalizedDir = {
      x: direction.x / dirLength,
      y: direction.y / dirLength,
      z: direction.z / dirLength
    };
    
    // Проекция вектора toTarget на направление луча
    const projection = 
      toTarget.x * normalizedDir.x + 
      toTarget.y * normalizedDir.y + 
      toTarget.z * normalizedDir.z;
    
    // Если проекция отрицательная, цель позади стрелка
    if (projection < 0) return false;
    
    // Находим ближайшую точку на луче к цели
    const closestPoint = {
      x: origin.x + normalizedDir.x * projection,
      y: origin.y + normalizedDir.y * projection,
      z: origin.z + normalizedDir.z * projection
    };
    
    // Расстояние от ближайшей точки до цели
    const distance = Math.sqrt(
      Math.pow(closestPoint.x - targetPosition.x, 2) +
      Math.pow(closestPoint.y - targetPosition.y, 2) +
      Math.pow(closestPoint.z - targetPosition.z, 2)
    );
    
    // Если расстояние меньше радиуса игрока (1 единица), считаем, что попали
    return distance < 1;
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
  
  getTimeRemaining() {
    if (!this.gameActive || !this.startTime) {
      return this.timeLimit / 1000; // В секундах
    }
    
    const elapsed = Date.now() - this.startTime;
    const remaining = Math.max(0, this.timeLimit - elapsed);
    
    return Math.ceil(remaining / 1000); // В секундах, округленных вверх
  }
  
  startGame() {
    this.gameActive = true;
    this.startTime = Date.now();
    
    // Сбрасываем счет всех игроков
    Object.values(this.players).forEach(player => {
      player.score = 0;
      player.health = 100;
      player.position = this.getRandomSpawnPosition();
    });
  }
  
  endGame() {
    this.gameActive = false;
    this.startTime = null;
  }
  
  generateNewMap() {
    this.mapData = generateMap();
    
    // Респавним всех игроков на новой карте
    Object.values(this.players).forEach(player => {
      player.position = this.getRandomSpawnPosition();
    });
  }
  
  getMapData() {
    return this.mapData;
  }
}

function createGameRoom(id) {
  return new GameRoom(id);
}

module.exports = {
  createGameRoom
};