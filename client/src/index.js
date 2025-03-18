import * as THREE from 'three';
import { io } from 'socket.io-client';
import gameEngine from './game/engine';
import { createMainMenu } from './components/MainMenu';

// Инициализация игры
document.addEventListener('DOMContentLoaded', () => {
  // Создаем главное меню
  const mainMenu = createMainMenu(gameEngine);
  
  // Инициализируем игровой движок
  gameEngine.init();
  
  // Подключаемся к серверу
  const socket = io();
  
  // Обработка подключения к серверу
  socket.on('connect', () => {
    console.log('Подключено к серверу');
    
    // Сохраняем сокет в игровом движке
    gameEngine.setSocket(socket);
  });
  
  // Обработка ошибки подключения
  socket.on('connect_error', (error) => {
    console.error('Ошибка подключения:', error);
  });
  
  // Обработка отключения от сервера
  socket.on('disconnect', () => {
    console.log('Отключено от сервера');
  });
  
  // Обработка событий игры
  setupGameEvents(socket, gameEngine, mainMenu);
});

function setupGameEvents(socket, gameEngine, mainMenu) {
  // Получение состояния комнаты
  socket.on('room_state', (state) => {
    gameEngine.updateRoomState(state);
  });
  
  // Подключение нового игрока
  socket.on('player_joined', (data) => {
    gameEngine.addPlayer(data.id, data.position);
  });
  
  // Отключение игрока
  socket.on('player_left', (data) => {
    gameEngine.removePlayer(data.id);
  });
  
  // Движение игрока
  socket.on('player_moved', (data) => {
    gameEngine.updatePlayerPosition(data.id, data.position);
  });
  
  // Выстрел игрока
  socket.on('player_shot', (data) => {
    gameEngine.showShot(data.id, data.position, data.direction);
  });
  
  // Попадание в игрока
  socket.on('player_hit', (data) => {
    gameEngine.showHit(data.shooter, data.target);
    
    // Если это мы стреляли, обновляем счет
    if (data.shooter === socket.id) {
      gameEngine.updateScore(data.shooterScore);
    }
  });
  
  // Окончание игры
  socket.on('game_over', (data) => {
    const isWinner = data.winner === socket.id;
    gameEngine.endGame(isWinner, data.score);
    
    // Обновляем результат в меню
    mainMenu.updateResult(gameEngine.getScore());
    
    // Показываем экран окончания игры
    document.getElementById('game-over').style.display = 'flex';
  });
  
  // Новая карта
  socket.on('new_map', (mapData) => {
    gameEngine.loadNewMap(mapData);
  });
}