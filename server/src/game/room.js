// Генерация случайной карты
function generateMap() {
    const mapSize = 50;
    const map = {
      size: mapSize,
      obstacles: [],
      spawnPoints: []
    };
    
    // Генерируем препятствия
    for (let i = 0; i < 20; i++) {
      map.obstacles.push({
        position: {
          x: Math.random() * mapSize - mapSize/2,
          y: 0,
          z: Math.random() * mapSize - mapSize/2
        },
        size: {
          width: Math.random() * 5 + 1,
          height: Math.random() * 5 + 1,
          depth: Math.random() * 5 + 1
        }
      });
    }
    
    // Генерируем точки появления
    for (let i = 0; i < 5; i++) {
      map.spawnPoints.push({
        x: Math.random() * mapSize - mapSize/2,
        y: 1,
        z: Math.random() * mapSize - mapSize/2
      });
    }
    
    return map;
  }
  
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
    
    getRandomSpawnPosition() {
      const spawnPoint = this.mapData.spawnPoints[
        Math.floor(Math.random() * this.mapData.spawnPoints.length)
      ];
      
      return {
        x: spawnPoint.x,
        y: spawnPoint.y,
        z: spawnPoint.z
      };
    }
    
    updatePlayerPosition(id, position) {
      if (this.players[id]) {
        this.players[id].position = position;
      }
    }
    
    getPlayerPosition(id) {
      if (this.players[id]) {
        return this.players[id].position;
      }
      return null;
    }
    
    processShot(shooterId, direction) {
      // Проверяем, может ли игрок стрелять (кулдаун)
      const shooter = this.players[shooterId];
      if (!shooter) return null;
      
      const now = Date.now();
      if (now - shooter.lastShootTime < 500) {
        return null; // Слишком рано для нового выстрела
      }
      
      shooter.lastShootTime = now;
      
      // Простая проверка попадания - находим ближайшего игрока в направлении выстрела
      const shooterPos = shooter.position;
      let closestHit = null;
      let closestDistance = Infinity;
      
      for (const playerId in this.players) {
        if (playerId === shooterId) continue; // Не стреляем в себя
        
        const target = this.players[playerId];
        const targetPos = target.position;
        
        // Вектор от стрелка к цели
        const toTarget = {
          x: targetPos.x - shooterPos.x,
          y: targetPos.y - shooterPos.y,
          z: targetPos.z - shooterPos.z
        };
        
        // Нормализуем вектор
        const distance = Math.sqrt(
          toTarget.x * toTarget.x + 
          toTarget.y * toTarget.y + 
          toTarget.z * toTarget.z
        );
        
        if (distance > 50) continue; // Слишком далеко
        
        const normalized = {
          x: toTarget.x / distance,
          y: toTarget.y / distance,
          z: toTarget.z / distance
        };
        
        // Скалярное произведение для определения угла
        const dot = 
          normalized.x * direction.x + 
          normalized.y * direction.y + 
          normalized.z * direction.z;
        
        // Если цель находится в пределах 0.9 косинуса угла (примерно 25 градусов)
        if (dot > 0.9) {
          if (distance < closestDistance) {
            closestDistance = distance;
            closestHit = playerId;
          }
        }
      }
      
      if (closestHit) {
        // Увеличиваем счет стрелка
        shooter.score += 1;
        return closestHit;
      }
      
      return null;
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
    
    startGame() {
      this.gameActive = true;
      this.startTime = Date.now();
    }
    
    endGame() {
      this.gameActive = false;
      this.startTime = null;
    }
    
    getTimeRemaining() {
      if (!this.gameActive || !this.startTime) return this.timeLimit / 1000;
      
      const elapsed = Date.now() - this.startTime;
      const remaining = Math.max(0, this.timeLimit - elapsed);
      return Math.floor(remaining / 1000);
    }
    
    generateNewMap() {
      this.mapData = generateMap();
      return this.mapData;
    }

    generateMap() {
        const mapSize = 50;
        const obstacles = [];
        
        for (let i = 0; i < 10; i++) {
            obstacles.push({
                position: {
                    x: (Math.random() - 0.5) * mapSize * 0.8,
                    y: 0,
                    z: (Math.random() - 0.5) * mapSize * 0.8
                },
                size: {
                    width: 1 + Math.random() * 3,
                    height: 1 + Math.random() * 4,
                    depth: 1 + Math.random() * 3
                }
            });
        }
        
        this.mapData = {
            size: mapSize,
            obstacles: obstacles
        };
        
        return this.mapData;
    }
  }
  
  function createGameRoom(id) {
    return new GameRoom(id);
  }
  
  module.exports = {
    createGameRoom
  };