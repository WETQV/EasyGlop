import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { createPlayer } from './player';
import { initWeapons } from './weapons';
import { initNetwork } from '../network/network';

class GameEngine {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.players = {};
    this.currentPlayer = null;
    this.isGameActive = false;
    this.killCount = 0;
    this.timeRemaining = 600; // 10 minutes in seconds
  }

  init() {
    // Создаем сцену
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    
    // Создаем камеру
    this.camera = new THREE.PerspectiveCamera(
      75, 
      window.innerWidth / window.innerHeight, 
      0.1, 
      1000
    );
    this.camera.position.y = 1.6; // Высота глаз
    
    // Создаем рендерер
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(this.renderer.domElement);
    
    // Добавляем освещение
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);
    
    // Создаем контроллер для управления камерой
    this.controls = new PointerLockControls(this.camera, document.body);
    
    // Создаем пол
    const floorGeometry = new THREE.PlaneGeometry(50, 50);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x808080,
      roughness: 0.8
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);
    
    // Инициализируем игрока
    this.currentPlayer = createPlayer(this.scene, this.camera);
    
    // Инициализируем оружие
    initWeapons(this.scene, this.camera);
    
    // Инициализируем сеть
    initNetwork(this);
    
    // Обработчик изменения размера окна
    window.addEventListener('resize', this.onWindowResize.bind(this));
    
    // Запускаем игровой цикл
    this.animate();
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  startGame() {
    this.isGameActive = true;
    this.controls.lock();
    this.killCount = 0;
    this.timeRemaining = 600;
    
    // Запускаем таймер
    this.gameTimer = setInterval(() => {
      this.timeRemaining--;
      if (this.timeRemaining <= 0) {
        this.endGame();
      }
    }, 1000);
  }

  endGame() {
    this.isGameActive = false;
    clearInterval(this.gameTimer);
    this.controls.unlock();
    // Показываем экран результатов
    document.getElementById('game-over').style.display = 'flex';
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    
    if (this.isGameActive) {
      // Обновляем логику игры
      this.currentPlayer.update();
      
      // Обновляем позиции других игроков
      Object.values(this.players).forEach(player => {
        player.update();
      });
    }
    
    this.renderer.render(this.scene, this.camera);
  }
}

export default new GameEngine();