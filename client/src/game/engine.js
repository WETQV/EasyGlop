import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import Player from './player';  // Changed from createPlayer to direct Player import
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
    this.map = null;
    this.debugMode = true; // Add debug flag
    this.materials = new Map();
    this.keys = {};
  }

  async loadShaders() {
    try {
      const response = await fetch('/shaders/phong.frag');
      const fragmentShader = await response.text();
      
      const material = new THREE.ShaderMaterial({
        uniforms: {
          diffuse: { value: new THREE.Color(0x808080) },
          emissive: { value: new THREE.Color(0x000000) },
          specular: { value: new THREE.Color(0x111111) },
          shininess: { value: 30 },
          opacity: { value: 1.0 },
          ambientLightColor: { value: new THREE.Color(0x404040) },
          directionalLightColor: { value: new THREE.Color(0xffffff) },
          directionalLightDirection: { value: new THREE.Vector3(0.5, 1, 0.5) }
        },
        vertexShader: THREE.ShaderLib.phong.vertexShader,
        fragmentShader: fragmentShader,
        lights: true
      });

      this.materials.set('phong', material);
      console.log('Shaders loaded successfully');
      return true;
    } catch (error) {
      console.error('Failed to load shaders:', error);
      return false;
    }
  }

  async init(container) {
    window.gameEngine = this;
    console.log('DOM ready:', document.readyState);
    console.log('Container exists:', !!container);
    console.log('Three.js version:', THREE.REVISION);

    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    
    // Camera setup
    this.camera = new THREE.PerspectiveCamera(
      75, 
      window.innerWidth / window.innerHeight, 
      0.1, 
      1000
    );
    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(0, 0, 0);
    
    // Enhanced lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);
    
    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: false
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    container.appendChild(this.renderer.domElement);
    console.log('Canvas added to DOM:', container.contains(this.renderer.domElement));

    await this.loadShaders();
    
    // Debug objects
    if (this.debugMode) {
      // Add reference cube
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.set(0, 0.5, 0);
      cube.castShadow = true;
      cube.receiveShadow = true;
      this.scene.add(cube);
      
      // Add grid helper
      const gridHelper = new THREE.GridHelper(10, 10);
      this.scene.add(gridHelper);
      
      // Add axes helper
      const axesHelper = new THREE.AxesHelper(5);
      this.scene.add(axesHelper);
      
      console.log('Debug scene:', {
        scene: this.scene,
        camera: this.camera,
        renderer: this.renderer
      });
    }
    
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
    this.currentPlayer = new Player({
      id: 'local',
      position: new THREE.Vector3(0, 1.6, 0),
      rotation: new THREE.Euler(0, 0, 0),
      controls: this.controls,
      camera: this.camera,
      scene: this.scene
    });
    
    // Инициализируем оружие
    initWeapons(this.scene, this.camera);
    
    // Инициализируем сеть
    initNetwork(this);
    
    // Обработчик изменения размера окна
    window.addEventListener('resize', this.onWindowResize.bind(this));
    
    // Запускаем игровой цикл
    this.animate();

    container.addEventListener('click', () => {
      if (!this.isGameActive) return;
      console.log('Attempting to lock pointer');
      this.controls.lock();
    });

    this.controls.addEventListener('lock', () => {
      console.log('Controls locked');
    });

    this.controls.addEventListener('unlock', () => {
      console.log('Controls unlocked');
    });

    // Setup input handling
    document.addEventListener('keydown', (event) => {
      this.keys[event.code] = true;
      console.log('Key down:', event.code);
    });

    document.addEventListener('keyup', (event) => {
      this.keys[event.code] = false;
    });
  }

  updateMap(mapData) {
    console.log('Updating map:', mapData);
    
    if (this.map) {
        this.scene.remove(this.map);
    }
    
    this.map = new THREE.Group();
    
    const floorGeometry = new THREE.PlaneGeometry(mapData.size, mapData.size);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x888888,
        roughness: 0.8 
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.map.add(floor);
    
    if (mapData.obstacles) {
        for (const obstacle of mapData.obstacles) {
            const geometry = new THREE.BoxGeometry(
                obstacle.size.width,
                obstacle.size.height,
                obstacle.size.depth
            );
            const material = new THREE.MeshStandardMaterial({ 
                color: 0x777777,
                roughness: 0.7 
            });
            const mesh = new THREE.Mesh(geometry, material);
            
            mesh.position.set(
                obstacle.position.x,
                obstacle.position.y + obstacle.size.height / 2,
                obstacle.position.z
            );
            
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            
            this.map.add(mesh);
        }
    }
    
    this.scene.add(this.map);
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
    
    // Create player and bind to camera
    this.currentPlayer = new Player({
      id: this.networkManager && this.networkManager.socket ? this.networkManager.socket.id : 'local',
      position: new THREE.Vector3(0, 1.6, 0),
      rotation: new THREE.Euler(0, 0, 0),
      controls: this.controls,
      camera: this.camera,
      scene: this.scene
    });
    
    this.camera.position.copy(this.currentPlayer.position);
    
    const mainMenu = document.querySelector('.main-menu');
    if (mainMenu) {
        mainMenu.style.display = 'none';
    }
    
    this.controls.lock();
    console.log('Game started, player created:', this.currentPlayer);
    
    // Start game timer
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
      if (this.currentPlayer) {
        this.currentPlayer.update();
      }
      
      Object.values(this.players).forEach(player => {
        if (player.update) player.update();
      });
    }
    
    if (this.debugMode) {
      console.log('Animation frame:', performance.now().toFixed(0));
      // Log any rendering issues
      const gl = this.renderer.getContext();
      const error = gl.getError();
      if (error !== gl.NO_ERROR) {
        console.error('WebGL Error:', error);
      }
    }
    
    this.renderer.render(this.scene, this.camera);
  }

  // Add new method for creating players
  addPlayer(id, position, rotation, isCurrentPlayer = false) {
    this.players[id] = new Player({
      id: id,
      position: position || new THREE.Vector3(0, 1.6, 0),
      rotation: rotation || new THREE.Euler(0, 0, 0),
      controls: isCurrentPlayer ? this.controls : null,
      camera: isCurrentPlayer ? this.camera : null,
      scene: this.scene
    });
    return this.players[id];
  }
}

export default new GameEngine();