import * as THREE from 'three';
import networkManager from '../network/network';

class Player {
    constructor({ id, position, rotation, controls, camera, scene }) {
        this.id = id;
        this.position = position || new THREE.Vector3(0, 1.6, 0);
        this.rotation = rotation || new THREE.Euler(0, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.controls = controls;
        this.camera = camera;
        this.scene = scene;
        
        this.createModel();
        console.log('Player created with ID:', id);
    }
    
    createModel() {
        const geometry = new THREE.BoxGeometry(0.6, 1.8, 0.6);
        const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.scene.add(this.mesh);
        
        if (this.controls) {
            this.mesh.visible = false;
        }
    }
    
    update() {
        if (this.controls) {
            const speed = 0.1;
            const direction = new THREE.Vector3();
            
            const gameEngine = window.gameEngine;
            if (gameEngine.keys['KeyW']) direction.z -= 1;
            if (gameEngine.keys['KeyS']) direction.z += 1;
            if (gameEngine.keys['KeyA']) direction.x -= 1;
            if (gameEngine.keys['KeyD']) direction.x += 1;
            
            if (direction.length() > 0) {
                direction.normalize();
                
                this.velocity.x = direction.x * speed;
                this.velocity.z = direction.z * speed;
                
                const cameraDirection = new THREE.Vector3();
                this.camera.getWorldDirection(cameraDirection);
                const cameraAngle = Math.atan2(cameraDirection.x, cameraDirection.z);
                
                this.velocity.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraAngle);
                this.position.add(this.velocity);
                this.camera.position.copy(this.position);
                
                console.log('Player moved to:', this.position);
            }
        } else {
            this.mesh.position.copy(this.position);
            this.mesh.rotation.copy(this.rotation);
        }
    }
}

export default Player;