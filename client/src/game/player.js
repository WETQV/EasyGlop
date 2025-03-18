import * as THREE from 'three';

export class Player {
  constructor(id, scene, camera, isCurrentPlayer = false) {
    this.id = id;
    this.scene = scene;
    this.camera = camera;
    this.isCurrentPlayer = isCurrentPlayer;
    
    this.moveSpeed = 0.15;
    this.jumpForce = 0.5;
    this.gravity = 0.01;
    this.health = 100;
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.onGround = true;
    
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.jump = false;
    
    this.createPlayerModel();
    
    if (isCurrentPlayer) {
      this.setupControls();
    }
  }
  
  createPlayerModel() {
    // Создаем модель игрока (куб)
    const geometry = new THREE.BoxGeometry(1, 2, 1);
    const material = new THREE.MeshStandardMaterial({ 
      color: this.isCurrentPlayer ? 0x00ff00 : 0xff0000 
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.y = 1; // Поднимаем над полом
    
    if (!this.isCurrentPlayer) {
      this.scene.add(this.mesh);
    }
  }
  
  setupControls() {
    // Настраиваем управление клавиатурой
    document.addEventListener('keydown', (event) => {
      switch (event.code) {
        case 'KeyW':
          this.moveForward = true;
          break;
        case 'KeyS':
          this.moveBackward = true;
          break;
        case 'KeyA':
          this.moveLeft = true;
          break;
        case 'KeyD':
          this.moveRight = true;
          break;
        case 'Space':
          if (this.onGround) {
            this.velocity.y = this.jumpForce;
            this.onGround = false;
          }
          break;
      }
    });
    
    document.addEventListener('keyup', (event) => {
      switch (event.code) {
        case 'KeyW':
          this.moveForward = false;
          break;
        case 'KeyS':
          this.moveBackward = false;
          break;
        case 'KeyA':
          this.moveLeft = false;
          break;
        case 'KeyD':
          this.moveRight = false;
          break;
      }
    });
  }
  
  update() {
    if (this.isCurrentPlayer) {
      // Обновляем позицию текущего игрока на основе ввода
      const direction = new THREE.Vector3();
      
      // Получаем направление движения из камеры
      const cameraDirection = new THREE.Vector3();
      this.camera.getWorldDirection(cameraDirection);
      
      // Нормализуем для горизонтального движения
      cameraDirection.y = 0;
      cameraDirection.normalize();
      
      // Вычисляем вектор движения
      if (this.moveForward) {
        direction.add(cameraDirection);
      }
      if (this.moveBackward) {
        direction.sub(cameraDirection);
      }
      
      // Боковое движение (перпендикулярно направлению камеры)
      const rightVector = new THREE.Vector3();
      rightVector.crossVectors(this.camera.up, cameraDirection).normalize();
      
      if (this.moveLeft) {
        direction.sub(rightVector);
      }
      if (this.moveRight) {
        direction.add(rightVector);
      }
      
      // Нормализуем вектор движения для постоянной скорости
      if (direction.length() > 0) {
        direction.normalize();
        
        // Применяем скорость движения
        this.camera.position.x += direction.x * this.moveSpeed;
        this.camera.position.z += direction.z * this.moveSpeed;
      }
      
      // Применяем гравитацию
      this.velocity.y -= this.gravity;
      this.camera.position.y += this.velocity.y;
      
      // Проверяем столкновение с полом
      if (this.camera.position.y < 1.6) { // Высота глаз
        this.camera.position.y = 1.6;
        this.velocity.y = 0;
        this.onGround = true;
      }
    } else {
      // Обновляем позицию других игроков на основе данных с сервера
      // Это будет реализовано в сетевом коде
    }
  }
  
  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.die();
    }
  }
  
  die() {
    // Логика смерти игрока
    if (this.isCurrentPlayer) {
      // Респаун текущего игрока
      this.health = 100;
      this.camera.position.set(0, 1.6, 0);
    } else {
      // Обработка смерти другого игрока
    }
  }
  
  getPosition() {
    if (this.isCurrentPlayer) {
      return this.camera.position;
    } else {
      return this.mesh.position;
    }
  }
  
  setPosition(position) {
    if (!this.isCurrentPlayer) {
      this.mesh.position.copy(position);
    }
  }
}

export function createPlayer(scene, camera) {
  return new Player('local', scene, camera, true);
}