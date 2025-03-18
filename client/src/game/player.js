import * as THREE from 'three';
import networkManager from '../network/network';

class Player {
  constructor(scene, camera, controls, isCurrentPlayer = false) {
    this.scene = scene;
    this.camera = camera;
    this.controls = controls;
    this.isCurrentPlayer = isCurrentPlayer;
    
    this.position = new THREE.Vector3(0, 1, 0);
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    
    this.moveSpeed = 0.1;
    this.health = 100;
    this.score = 0;
    
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.canJump = false;
    
    this.createPlayerModel();
    
    if (isCurrentPlayer) {
      this.setupControls();
    }
  }
  
  createPlayerModel() {
    if (this.isCurrentPlayer) {
      // Для текущего игрока не создаем модель, так как используем камеру от первого лица
      return;
    }
    
    // Создаем модель игрока
    const geometry = new THREE.BoxGeometry(1, 2, 1);
    const material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(this.position);
    
    this.scene.add(this.mesh);
  }
  
  setupControls() {
    // Настройка управления с клавиатуры
    const onKeyDown = (event) => {
      switch (event.code) {
        case 'KeyW':
          this.moveForward = true;
          break;
        case 'KeyA':
          this.moveLeft = true;
          break;
        case 'KeyS':
          this.moveBackward = true;
          break;
        case 'KeyD':
          this.moveRight = true;
          break;
        case 'Space':
          if (this.canJump) {
            this.velocity.y += 10;
            this.canJump = false;
          }
          break;
      }
    };
    
    const onKeyUp = (event) => {
      switch (event.code) {
        case 'KeyW':
          this.moveForward = false;
          break;
        case 'KeyA':
          this.moveLeft = false;
          break;
        case 'KeyS':
          this.moveBackward = false;
          break;
        case 'KeyD':
          this.moveRight = false;
          break;
      }
    };
    
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    
    // Настройка стрельбы
    document.addEventListener('mousedown', (event) => {
      if (event.button === 0) { // ЛКМ
        this.shoot();
      }
    });
  }
  
  update() {
    if (this.isCurrentPlayer) {
      // Обновляем движение текущего игрока
      this.updateMovement();
      
      // Отправляем позицию на сервер
      networkManager.sendPlayerMove({
        x: this.position.x,
        y: this.position.y,
        z: this.position.z
      });
    } else if (this.mesh) {
      // Обновляем позицию модели другого игрока
      this.mesh.position.copy(this.position);
    }
  }
  
  updateMovement() {
    // Получаем направление движения из камеры
    const direction = new THREE.Vector3();
    this.controls.getDirection(direction);
    direction.y = 0;
    direction.normalize();
    
    // Вектор движения
    const moveVector = new THREE.Vector3();
    
    if (this.moveForward) {
      moveVector.add(direction);
    }
    if (this.moveBackward) {
      moveVector.sub(direction);
    }
    
    // Боковое движение (перпендикулярно направлению)
    const sideDirection = new THREE.Vector3(-direction.z, 0, direction.x);
    
    if (this.moveRight) {
      moveVector.add(sideDirection);
    }
    if (this.moveLeft) {
      moveVector.sub(sideDirection);
    }
    
    // Нормализуем вектор движения, если он не нулевой
    if (moveVector.length() > 0) {
      moveVector.normalize();
      moveVector.multiplyScalar(this.moveSpeed);
    }
    
    // Применяем гравитацию
    this.velocity.y -= 0.01;
    
    // Обновляем позицию
    this.position.add(moveVector);
    this.position.y += this.velocity.y;
    
    // Проверяем столкновение с землей
    if (this.position.y < 1) {
      this.position.y = 1;
      this.velocity.y = 0;
      this.canJump = true;
    }
    
    // Обновляем позицию камеры
    this.camera.position.copy(this.position);
  }
  
  shoot() {
    // Получаем направление выстрела из камеры
    const direction = new THREE.Vector3();
    this.controls.getDirection(direction);
    
    // Отправляем информацию о выстреле на сервер
    networkManager.sendPlayerShoot(
      {
        x: this.position.x,
        y: this.position.y,
        z: this.position.z
      },
      {
        x: direction.x,
        y: direction.y,
        z: direction.z
      }
    );
  }
  
  setPosition(position) {
    this.position.set(position.x, position.y, position.z);
    
    if (this.mesh) {
      this.mesh.position.copy(this.position);
    }
  }
  
  hit() {
    // Визуальный эффект попадания
    if (this.isCurrentPlayer) {
      // Эффект красного экрана для текущего игрока
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(255, 0, 0, 0.3);
        pointer-events: none;
        z-index: 1000;
      `;
      
      document.body.appendChild(overlay);
      
      setTimeout(() => {
        document.body.removeChild(overlay);
      }, 300);
    } else if (this.mesh) {
      // Эффект для других игроков
      const originalColor = this.mesh.material.color.getHex();
      this.mesh.material.color.set(0xff0000);
      
      setTimeout(() => {
        this.mesh.material.color.set(originalColor);
      }, 300);
    }
  }
  
  updateScore(score) {
    this.score = score;
  }
}

export function createPlayer(scene, camera, controls, isCurrentPlayer = false) {
  return new Player(scene, camera, controls, isCurrentPlayer);
}