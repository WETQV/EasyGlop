import * as THREE from 'three';

class GameMap {
  constructor(scene) {
    this.scene = scene;
    this.obstacles = [];
    this.size = 50;
  }
  
  generate(mapData) {
    // Очищаем предыдущую карту
    this.clear();
    
    // Создаем пол
    this.createFloor();
    
    // Создаем препятствия
    if (mapData && mapData.obstacles) {
      mapData.obstacles.forEach(obstacle => {
        this.createObstacle(
          obstacle.position,
          obstacle.size
        );
      });
    }
    
    // Создаем границы карты
    this.createBoundaries();
  }
  
  clear() {
    // Удаляем все препятствия
    this.obstacles.forEach(obstacle => {
      this.scene.remove(obstacle);
    });
    
    this.obstacles = [];
  }
  
  createFloor() {
    const floorGeometry = new THREE.PlaneGeometry(this.size, this.size);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.8,
      metalness: 0.2
    });
    
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    
    this.scene.add(floor);
  }
  
  createObstacle(position, size) {
    const geometry = new THREE.BoxGeometry(size.width, size.height, size.depth);
    const material = new THREE.MeshStandardMaterial({
      color: Math.random() * 0xffffff,
      roughness: 0.7,
      metalness: 0.3
    });
    
    const obstacle = new THREE.Mesh(geometry, material);
    obstacle.position.set(position.x, position.y + size.height / 2, position.z);
    obstacle.castShadow = true;
    obstacle.receiveShadow = true;
    
    this.scene.add(obstacle);
    this.obstacles.push(obstacle);
    
    return obstacle;
  }
  
  createBoundaries() {
    const wallHeight = 5;
    const wallThickness = 1;
    const halfSize = this.size / 2;
    
    // Материал для стен
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x0088ff,
      roughness: 0.5,
      metalness: 0.5,
      transparent: true,
      opacity: 0.3
    });
    
    // Северная стена
    const northWallGeometry = new THREE.BoxGeometry(this.size + wallThickness * 2, wallHeight, wallThickness);
    const northWall = new THREE.Mesh(northWallGeometry, wallMaterial);
    northWall.position.set(0, wallHeight / 2, -halfSize - wallThickness / 2);
    this.scene.add(northWall);
    this.obstacles.push(northWall);
    
    // Южная стена
    const southWall = new THREE.Mesh(northWallGeometry, wallMaterial);
    southWall.position.set(0, wallHeight / 2, halfSize + wallThickness / 2);
    this.scene.add(southWall);
    this.obstacles.push(southWall);
    
    // Восточная стена
    const eastWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, this.size);
    const eastWall = new THREE.Mesh(eastWallGeometry, wallMaterial);
    eastWall.position.set(halfSize + wallThickness / 2, wallHeight / 2, 0);
    this.scene.add(eastWall);
    this.obstacles.push(eastWall);
    
    // Западная стена
    const westWall = new THREE.Mesh(eastWallGeometry, wallMaterial);
    westWall.position.set(-halfSize - wallThickness / 2, wallHeight / 2, 0);
    this.scene.add(westWall);
    this.obstacles.push(westWall);
  }
  
  checkCollision(position, radius = 0.5) {
    // Проверка столкновения с границами карты
    const halfSize = this.size / 2;
    
    if (
      position.x < -halfSize + radius ||
      position.x > halfSize - radius ||
      position.z < -halfSize + radius ||
      position.z > halfSize - radius
    ) {
      return true;
    }
    
    // Проверка столкновения с препятствиями
    for (const obstacle of this.obstacles) {
      const box = new THREE.Box3().setFromObject(obstacle);
      
      // Создаем сферу вокруг игрока
      const sphere = new THREE.Sphere(position, radius);
      
      if (box.intersectsSphere(sphere)) {
        return true;
      }
    }
    
    return false;
  }
}

export function createGameMap(scene) {
  return new GameMap(scene);
}