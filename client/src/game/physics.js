import * as THREE from 'three';

class PhysicsEngine {
  constructor() {
    this.gravity = 9.8; // м/с²
    this.objects = [];
  }
  
  addObject(object) {
    this.objects.push({
      object,
      velocity: new THREE.Vector3(0, 0, 0),
      acceleration: new THREE.Vector3(0, -this.gravity, 0),
      mass: 1,
      isStatic: false
    });
    
    return this.objects[this.objects.length - 1];
  }
  
  setStatic(physicsObject, isStatic) {
    physicsObject.isStatic = isStatic;
  }
  
  applyForce(physicsObject, force) {
    if (physicsObject.isStatic) return;
    
    const acceleration = force.clone().divideScalar(physicsObject.mass);
    physicsObject.acceleration.add(acceleration);
  }
  
  update(deltaTime) {
    for (const physicsObject of this.objects) {
      if (physicsObject.isStatic) continue;
      
      // Обновляем скорость
      physicsObject.velocity.add(
        physicsObject.acceleration.clone().multiplyScalar(deltaTime)
      );
      
      // Обновляем позицию
      const deltaPosition = physicsObject.velocity.clone().multiplyScalar(deltaTime);
      physicsObject.object.position.add(deltaPosition);
      
      // Сбрасываем ускорение (кроме гравитации)
      physicsObject.acceleration.set(0, -this.gravity, 0);
    }
  }
  
  checkCollisions(gameMap) {
    for (const physicsObject of this.objects) {
      if (physicsObject.isStatic) continue;
      
      // Проверяем столкновение с картой
      if (gameMap.checkCollision(physicsObject.object.position)) {
        // Обрабатываем столкновение
        this.resolveCollision(physicsObject);
      }
    }
  }
  
  resolveCollision(physicsObject) {
    // Простая реализация - отражаем скорость
    physicsObject.velocity.multiplyScalar(-0.5); // Затухание при отскоке
  }
}

export function createPhysicsEngine() {
  return new PhysicsEngine();
}