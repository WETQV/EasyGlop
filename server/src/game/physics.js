const { distance3D, normalizeVector } = require('../../../shared/utils');

class PhysicsEngine {
  constructor() {
    this.gravity = 9.8; // м/с²
  }
  
  update(players, deltaTime, map) {
    // Обновляем физику для всех игроков
    for (const playerId in players) {
      const player = players[playerId];
      player.update(deltaTime, this, map);
    }
    
    // Проверяем столкновения между игроками
    this.checkPlayerCollisions(players);
  }
  
  checkCollisions(position, radius, map) {
    const collisions = [];
    
    // Проверяем столкновение с границами карты
    const mapBoundaries = map.getBoundaries();
    
    // Проверка на выход за границы карты
    if (position.x - radius < mapBoundaries.minX) {
      collisions.push({
        normal: { x: 1, y: 0, z: 0 },
        depth: radius - (position.x - mapBoundaries.minX)
      });
    }
    
    if (position.x + radius > mapBoundaries.maxX) {
      collisions.push({
        normal: { x: -1, y: 0, z: 0 },
        depth: radius - (mapBoundaries.maxX - position.x)
      });
    }
    
    if (position.z - radius < mapBoundaries.minZ) {
      collisions.push({
        normal: { x: 0, y: 0, z: 1 },
        depth: radius - (position.z - mapBoundaries.minZ)
      });
    }
    
    if (position.z + radius > mapBoundaries.maxZ) {
      collisions.push({
        normal: { x: 0, y: 0, z: -1 },
        depth: radius - (mapBoundaries.maxZ - position.z)
      });
    }
    
    // Проверяем столкновение с препятствиями
    const obstacles = map.getObstacles();
    for (const obstacle of obstacles) {
      const collision = this.checkObstacleCollision(position, radius, obstacle);
      if (collision) {
        collisions.push(collision);
      }
    }
    
    return collisions;
  }
  
  checkObstacleCollision(position, radius, obstacle) {
    // Для простоты считаем все препятствия прямоугольными параллелепипедами
    const box = {
      minX: obstacle.position.x - obstacle.size.width / 2,
      maxX: obstacle.position.x + obstacle.size.width / 2,
      minY: obstacle.position.y,
      maxY: obstacle.position.y + obstacle.size.height,
      minZ: obstacle.position.z - obstacle.size.depth / 2,
      maxZ: obstacle.position.z + obstacle.size.depth / 2
    };
    
    // Находим ближайшую точку на прямоугольнике к центру сферы
    const closestPoint = {
      x: Math.max(box.minX, Math.min(position.x, box.maxX)),
      y: Math.max(box.minY, Math.min(position.y, box.maxY)),
      z: Math.max(box.minZ, Math.min(position.z, box.maxZ))
    };
    
    // Вычисляем расстояние от центра сферы до ближайшей точки
    const distance = distance3D(position, closestPoint);
    
    // Если расстояние меньше радиуса, то есть столкновение
    if (distance < radius) {
      // Вычисляем нормаль столкновения
      let normal;
      if (distance === 0) {
        // Если центр сферы внутри прямоугольника, выбираем ближайшую грань
        const distToMinX = position.x - box.minX;
        const distToMaxX = box.maxX - position.x;
        const distToMinY = position.y - box.minY;
        const distToMaxY = box.maxY - position.y;
        const distToMinZ = position.z - box.minZ;
        const distToMaxZ = box.maxZ - position.z;
        
        const minDist = Math.min(
          distToMinX, distToMaxX,
          distToMinY, distToMaxY,
          distToMinZ, distToMaxZ
        );
        
        if (minDist === distToMinX) normal = { x: -1, y: 0, z: 0 };
        else if (minDist === distToMaxX) normal = { x: 1, y: 0, z: 0 };
        else if (minDist === distToMinY) normal = { x: 0, y: -1, z: 0 };
        else if (minDist === distToMaxY) normal = { x: 0, y: 1, z: 0 };
        else if (minDist === distToMinZ) normal = { x: 0, y: 0, z: -1 };
        else normal = { x: 0, y: 0, z: 1 };
      } else {
        // Вычисляем нормаль от ближайшей точки к центру сферы
        normal = {
          x: position.x - closestPoint.x,
          y: position.y - closestPoint.y,
          z: position.z - closestPoint.z
        };
        normal = normalizeVector(normal);
      }
      
      return {
        normal,
        depth: radius - distance,
        obstacle
      };
    }
    
    return null;
  }
  
  resolveCollisions(player, collisions) {
    for (const collision of collisions) {
      // Корректируем позицию
      player.position.x += collision.normal.x * collision.depth;
      player.position.y += collision.normal.y * collision.depth;
      player.position.z += collision.normal.z * collision.depth;
      
      // Отражаем скорость с затуханием
      const dot = player.velocity.x * collision.normal.x +
                  player.velocity.y * collision.normal.y +
                  player.velocity.z * collision.normal.z;
      
      if (dot < 0) {
        const bounceFactor = 0.5; // Коэффициент отскока
        
        player.velocity.x -= (1 + bounceFactor) * dot * collision.normal.x;
        player.velocity.y -= (1 + bounceFactor) * dot * collision.normal.y;
        player.velocity.z -= (1 + bounceFactor) * dot * collision.normal.z;
      }
    }
  }
  
  checkPlayerCollisions(players) {
    const playerIds = Object.keys(players);
    
    for (let i = 0; i < playerIds.length; i++) {
      for (let j = i + 1; j < playerIds.length; j++) {
        const player1 = players[playerIds[i]];
        const player2 = players[playerIds[j]];
        
        // Пропускаем мертвых игроков
        if (!player1.isAlive || !player2.isAlive) continue;
        
        // Проверяем столкновение
        const dist = distance3D(player1.position, player2.position);
        const minDist = 1.0; // Минимальное расстояние между игроками
        
        if (dist < minDist) {
          // Вычисляем вектор отталкивания
          const pushVector = {
            x: player1.position.x - player2.position.x,
            y: 0, // Не отталкиваем по вертикали
            z: player1.position.z - player2.position.z
          };
          
          // Нормализуем вектор
          const pushNormal = normalizeVector(pushVector);
          
          // Вычисляем глубину проникновения
          const depth = minDist - dist;
          
          // Отталкиваем игроков друг от друга
          const pushStrength = depth / 2;
          
          player1.position.x += pushNormal.x * pushStrength;
          player1.position.z += pushNormal.z * pushStrength;
          
          player2.position.x -= pushNormal.x * pushStrength;
          player2.position.z -= pushNormal.z * pushStrength;
        }
      }
    }
  }
  
  raycast(origin, direction, maxDistance, players, map) {
    // Нормализуем направление
    direction = normalizeVector(direction);
    
    // Проверяем пересечение с игроками
    let closestHit = null;
    let closestDistance = maxDistance;
    
    // Проверяем пересечение с игроками
    for (const playerId in players) {
      const player = players[playerId];
      
      // Пропускаем мертвых игроков и самого стрелка
      if (!player.isAlive || player.id === origin.id) continue;
      
      const playerPos = player.position;
      const playerRadius = 0.5; // Радиус игрока
      
      // Вектор от начала луча к центру игрока
      const toPlayer = {
        x: playerPos.x - origin.position.x,
        y: playerPos.y - origin.position.y,
        z: playerPos.z - origin.position.z
      };
      
      // Проекция вектора toPlayer на направление луча
      const projectionLength = toPlayer.x * direction.x + 
                               toPlayer.y * direction.y + 
                               toPlayer.z * direction.z;
      
      // Если проекция отрицательная, игрок находится позади луча
      if (projectionLength < 0) continue;
      
      // Если проекция больше maxDistance, игрок слишком далеко
      if (projectionLength > closestDistance) continue;
      
      // Находим ближайшую точку на луче к центру игрока
      const closestPoint = {
        x: origin.position.x + direction.x * projectionLength,
        y: origin.position.y + direction.y * projectionLength,
        z: origin.position.z + direction.z * projectionLength
      };
      
      // Вычисляем расстояние от ближайшей точки до центра игрока
      const distToPlayer = distance3D(closestPoint, playerPos);
      
      // Если расстояние меньше радиуса игрока, луч пересекает игрока
      if (distToPlayer < playerRadius) {
        closestHit = player;
        closestDistance = projectionLength;
      }
    }
    
    // Проверяем пересечение с препятствиями
    // (для простоты опустим эту часть, но в реальной игре нужно проверять)
    
    return closestHit;
  }
}

function createPhysicsEngine() {
  return new PhysicsEngine();
}

module.exports = {
  PhysicsEngine,
  createPhysicsEngine
};