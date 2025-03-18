import * as THREE from 'three';

class Weapon {
  constructor(scene, camera, type) {
    this.scene = scene;
    this.camera = camera;
    this.type = type;
    this.damage = 0;
    this.fireRate = 0;
    this.reloadTime = 0;
    this.ammo = 0;
    this.maxAmmo = 0;
    this.isReloading = false;
    this.lastFired = 0;
    
    this.createWeaponModel();
  }
  
  createWeaponModel() {
    // Базовая модель оружия
    const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.5);
    const material = new THREE.MeshStandardMaterial({ color: 0x333333 });
    this.mesh = new THREE.Mesh(geometry, material);
    
    // Добавляем модель в сцену и привязываем к камере
    this.scene.add(this.mesh);
  }
  
  update() {
    // Обновляем позицию оружия относительно камеры
    const cameraDirection = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDirection);
    
    // Позиционируем оружие перед камерой
    this.mesh.position.copy(this.camera.position);
    this.mesh.position.add(cameraDirection.multiplyScalar(0.5));
    
    // Немного опускаем оружие вниз от центра экрана
    this.mesh.position.y -= 0.2;
    
    // Поворачиваем оружие в направлении камеры
    this.mesh.rotation.copy(this.camera.rotation);
  }
  
  fire() {
    const now = Date.now();
    if (this.isReloading || now - this.lastFired < this.fireRate || this.ammo <= 0) {
      return false;
    }
    
    this.lastFired = now;
    this.ammo--;
    
    // Создаем луч для определения попадания
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    
    // Проверяем пересечения с объектами сцены
    const intersects = raycaster.intersectObjects(this.scene.children, true);
    
    // Визуализация выстрела (простая линия)
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -50)
    ]);
    
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffff00 });
    const line = new THREE.Line(lineGeometry, lineMaterial);
    
    line.position.copy(this.mesh.position);
    line.rotation.copy(this.mesh.rotation);
    this.scene.add(line);
    
    // Удаляем линию через короткое время
    setTimeout(() => {
      this.scene.remove(line);
    }, 100);
    
    // Проверяем попадание
    if (intersects.length > 0) {
      const hit = intersects[0];
      // Если попали в игрока
      if (hit.object.userData.isPlayer) {
        hit.object.userData.player.takeDamage(this.damage);
      }
    }
    
    return true;
  }
  
  reload() {
    if (this.isReloading || this.ammo === this.maxAmmo) {
      return;
    }
    
    this.isReloading = true;
    
    setTimeout(() => {
      this.ammo = this.maxAmmo;
      this.isReloading = false;
    }, this.reloadTime);
  }
}

class Pistol extends Weapon {
  constructor(scene, camera) {
    super(scene, camera, 'pistol');
    this.damage = 25;
    this.fireRate = 500; // ms между выстрелами
    this.reloadTime = 1000; // ms
    this.ammo = 10;
    this.maxAmmo = 10;
    
    // Переопределяем модель для пистолета
    this.createWeaponModel();
  }
  
  createWeaponModel() {
    // Создаем более детальную модель пистолета
    const group = new THREE.Group();
    
    // Ствол
    const barrelGeometry = new THREE.BoxGeometry(0.05, 0.05, 0.3);
    const barrelMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.position.z = -0.15;
    group.add(barrel);
    
    // Рукоятка
    const handleGeometry = new THREE.BoxGeometry(0.06, 0.15, 0.06);
    const handleMaterial = new THREE.MeshStandardMaterial({ color: 0x663300 });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.y = -0.1;
    group.add(handle);
    
    this.mesh = group;
    this.scene.add(this.mesh);
  }
}

class Rifle extends Weapon {
  constructor(scene, camera) {
    super(scene, camera, 'rifle');
    this.damage = 15;
    this.fireRate = 100; // ms между выстрелами
    this.reloadTime = 2000; // ms
    this.ammo = 30;
    this.maxAmmo = 30;
    
    // Переопределяем модель для винтовки
    this.createWeaponModel();
  }
  
  createWeaponModel() {
    // Создаем более детальную модель винтовки
    const group = new THREE.Group();
    
    // Ствол
    const barrelGeometry = new THREE.BoxGeometry(0.05, 0.05, 0.5);
    const barrelMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.position.z = -0.25;
    group.add(barrel);
    
    // Приклад
    const stockGeometry = new THREE.BoxGeometry(0.06, 0.1, 0.2);
    const stockMaterial = new THREE.MeshStandardMaterial({ color: 0x663300 });
    const stock = new THREE.Mesh(stockGeometry, stockMaterial);
    stock.position.z = 0.1;
    group.add(stock);
    
    // Рукоятка
    const handleGeometry = new THREE.BoxGeometry(0.06, 0.15, 0.06);
    const handleMaterial = new THREE.MeshStandardMaterial({ color: 0x663300 });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.y = -0.1;
    handle.position.z = -0.05;
    group.add(handle);
    
    this.mesh = group;
    this.scene.add(this.mesh);
  }
}

let currentWeapon = null;
const weapons = {};

export function initWeapons(scene, camera) {
  weapons.pistol = new Pistol(scene, camera);
  weapons.rifle = new Rifle(scene, camera);
  
  // Устанавливаем пистолет как оружие по умолчанию
  currentWeapon = weapons.pistol;
  
  // Обработчики для стрельбы и смены оружия
  document.addEventListener('mousedown', (event) => {
    if (event.button === 0) { // ЛКМ
      currentWeapon.fire();
    }
  });
  
  document.addEventListener('keydown', (event) => {
    if (event.code === 'KeyR') {
      currentWeapon.reload();
    } else if (event.code === 'Digit1') {
      switchWeapon('pistol');
    } else if (event.code === 'Digit2') {
      switchWeapon('rifle');
    }
  });
}

function switchWeapon(type) {
  if (weapons[type] && currentWeapon.type !== type) {
    // Скрываем текущее оружие
    currentWeapon.mesh.visible = false;
    
    // Переключаемся на новое оружие
    currentWeapon = weapons[type];
    currentWeapon.mesh.visible = true;
  }
}

export function updateWeapons() {
  if (currentWeapon) {
    currentWeapon.update();
  }
}

export function getCurrentWeapon() {
  return currentWeapon;
}