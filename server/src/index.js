const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const { createGameRoom } = require('./game/room');

// Инициализация Express
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Настройка статических файлов
app.use(express.static(path.join(__dirname, '../../client/dist')));

// Игровые комнаты
const rooms = {};
const defaultRoom = 'main';

// Создаем основную комнату
rooms[defaultRoom] = createGameRoom(defaultRoom);

// Обработка подключений Socket.IO
io.on('connection', (socket) => {
  console.log(`Новое подключение: ${socket.id}`);
  
  // Игрок по умолчанию присоединяется к основной комнате
  let currentRoom = defaultRoom;
  
  // Регистрируем игрока в комнате
  socket.join(currentRoom);
  rooms[currentRoom].addPlayer(socket.id);
  
  // Отправляем информацию о текущем состоянии комнаты
  socket.emit('room_state', rooms[currentRoom].getState());
  
  // Сообщаем всем в комнате о новом игроке
  socket.to(currentRoom).emit('player_joined', {
    id: socket.id,
    position: rooms[currentRoom].getPlayerPosition(socket.id)
  });
  
  // Обработка движения игрока
  socket.on('player_move', (data) => {
    rooms[currentRoom].updatePlayerPosition(socket.id, data.position);
    
    // Отправляем обновленную позицию всем игрокам в комнате, кроме отправителя
    socket.to(currentRoom).emit('player_moved', {
      id: socket.id,
      position: data.position
    });
  });
  
  // Обработка выстрела
  socket.on('player_shoot', (data) => {
    const hitPlayerId = rooms[currentRoom].processShot(socket.id, data.direction);
    
    // Если попали в игрока
    if (hitPlayerId) {
      // Обновляем счет
      const shooter = rooms[currentRoom].getPlayer(socket.id);
      
      // Отправляем информацию о попадании
      io.to(currentRoom).emit('player_hit', {
        shooter: socket.id,
        target: hitPlayerId,
        shooterScore: shooter.score
      });
      
      // Проверяем условие победы
      if (shooter.score >= 10) {
        io.to(currentRoom).emit('game_over', {
          winner: socket.id,
          score: shooter.score
        });
        
        // Генерируем новую карту
        rooms[currentRoom].generateNewMap();
        io.to(currentRoom).emit('new_map', rooms[currentRoom].getMapData());
      }
    }
    
    // Отправляем информацию о выстреле всем в комнате
    socket.to(currentRoom).emit('player_shot', {
      id: socket.id,
      position: data.position,
      direction: data.direction
    });
  });
  
  // Обработка отключения игрока
  socket.on('disconnect', () => {
    console.log(`Отключение: ${socket.id}`);
    
    // Удаляем игрока из комнаты
    if (rooms[currentRoom]) {
      rooms[currentRoom].removePlayer(socket.id);
      
      // Сообщаем всем в комнате об отключении игрока
      socket.to(currentRoom).emit('player_left', {
        id: socket.id
      });
    }
  });
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});