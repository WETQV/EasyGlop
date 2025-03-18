import io from 'socket.io-client';

class NetworkManager {
  constructor() {
    this.socket = null;
    this.gameEngine = null;
    this.connected = false;
    this.players = {};
    this.playerId = null;
  }
  
  init(gameEngine) {
    this.gameEngine = gameEngine;
    
    // Подключаемся к серверу
    this.socket = io();
    
    // Обработка событий сокета
    this.socket.on('connect', () => {
      console.log('Подключение к серверу установлено');
      this.connected = true;
      this.playerId = this.socket.id;
    });
    
    this.socket.on('disconnect', () => {
      console.log('Отключение от сервера');
      this.connected = false;
    });
    
    this.socket.on('room_state', (data) => {
      this.handleRoomState(data);
    });
    
    this.socket.on('player_joined', (data) => {
      this.handlePlayerJoined(data);
    });
    
    this.socket.on('player_left', (data) => {
      this.handlePlayerLeft(data);
    });
    
    this.socket.on('player_moved', (data) => {
      this.handlePlayerMoved(data);
    });
    
    this.socket.on('player_shot', (data) => {
      this.handlePlayerShot(data);
    });
    
    this.socket.on('player_hit', (data) => {
      this.handlePlayerHit(data);
    });
    
    this.socket.on('game_over', (data) => {
      this.handleGameOver(data);
    });
    
    this.socket.on('new_map', (data) => {
      this.handleNewMap(data);
    });
  }
  
  handleRoomState(data) {
    // Обновляем состояние игры на основе данных от сервера
    console.log('Получено состояние комнаты:', data);
    
    // Обновляем карту
    if (this.gameEngine) {
      this.gameEngine.updateMap(data.mapData);
    }
    
    // Добавляем других игроков
    for (const playerId in data.players) {
      if (playerId !== this.playerId) {
        this.handlePlayerJoined({
          id: playerId,
          position: data.players[playerId].position
        });
      }
    }
  }
  
  handlePlayerJoined(data) {
    console.log('Игрок присоединился:', data.id);
    
    if (this.gameEngine && data.id !== this.playerId) {
      this.gameEngine.addPlayer(data.id, data.position);
    }
  }
  
  handlePlayerLeft(data) {
    console.log('Игрок покинул игру:', data.id);
    
    if (this.gameEngine) {
      this.gameEngine.removePlayer(data.id);
    }
  }
  
  handlePlayerMoved(data) {
    if (this.gameEngine && data.id !== this.playerId) {
      this.gameEngine.updatePlayerPosition(data.id, data.position);
    }
  }
  
  handlePlayerShot(data) {
    if (this.gameEngine && data.id !== this.playerId) {
      this.gameEngine.playerShot(data.id, data.position, data.direction);
    }
  }
  
  handlePlayerHit(data) {
    console.log('Игрок попал:', data);
    
    if (this.gameEngine) {
      if (data.shooter === this.playerId) {
        this.gameEngine.updateScore(data.shooterScore);
      }
      
      this.gameEngine.playerHit(data.target);
    }
  }
  
  handleGameOver(data) {
    console.log('Игра окончена:', data);
    
    if (this.gameEngine) {
      this.gameEngine.endGame();
      
      // Показываем результаты
      const isWinner = data.winner === this.playerId;
      this.gameEngine.showGameResults(isWinner, data.score);
    }
  }
  
  handleNewMap(data) {
    console.log('Новая карта:', data);
    
    if (this.gameEngine) {
      this.gameEngine.updateMap(data);
    }
  }
  
  sendPlayerMove(position) {
    if (this.connected) {
      this.socket.emit('player_move', { position });
    }
  }
  
  sendPlayerShoot(position, direction) {
    if (this.connected) {
      this.socket.emit('player_shoot', { position, direction });
    }
  }
  
  getSocketId() {
    return this.playerId;
  }
}

const networkManager = new NetworkManager();

export function initNetwork(gameEngine) {
  networkManager.init(gameEngine);
  return networkManager;
}

export default networkManager;