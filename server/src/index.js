const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const { createGameRoom } = require('./game/room');

const PORT = Number(process.env.PORT || 3000);
const CLIENT_DIST = path.join(__dirname, '../../client/dist');
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const rooms = {
  main: createGameRoom('main')
};

app.use(express.static(CLIENT_DIST));
app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    port: PORT,
    clientDist: CLIENT_DIST
  });
});

io.on('connection', (socket) => {
  const roomId = 'main';
  const room = rooms[roomId];

  console.log(`[socket] connect ${socket.id}`);

  socket.join(roomId);
  room.addPlayer(socket.id);

  socket.emit('room_state', room.getState());
  socket.to(roomId).emit('player_joined', {
    id: socket.id,
    position: room.getPlayerPosition(socket.id)
  });

  socket.on('player_move', (data = {}) => {
    const position = sanitizePosition(data.position);
    if (!position) {
      return;
    }

    room.updatePlayerPosition(socket.id, position);
    socket.to(roomId).emit('player_moved', {
      id: socket.id,
      position
    });
  });

  socket.on('player_shoot', (data = {}) => {
    const direction = sanitizeDirection(data.direction);
    const position = sanitizePosition(data.position);
    const weaponId = sanitizeWeaponId(data.weaponId);
    if (!direction || !position) {
      return;
    }

    const result = room.processShot(socket.id, direction, weaponId);
    if (result) {
      const shooter = room.getPlayer(socket.id);
      io.to(roomId).emit('player_hit', {
        ...result,
        from: describeHitDirection(direction),
        shooterScore: shooter.score
      });

      if (result.respawn) {
        io.to(roomId).emit('player_respawned', result.respawn);
      }

      if (room.shouldEndGame(shooter.score)) {
        io.to(roomId).emit('game_over', {
          winner: socket.id,
          score: shooter.score
        });

        room.generateNewMap();
        io.to(roomId).emit('new_map', room.getMapData());
      }
    }

    socket.to(roomId).emit('player_shot', {
      id: socket.id,
      position,
      direction,
      weaponId
    });
  });

  socket.on('disconnect', () => {
    console.log(`[socket] disconnect ${socket.id}`);
    room.removePlayer(socket.id);
    socket.to(roomId).emit('player_left', { id: socket.id });
  });
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`[server] Port ${PORT} is already busy.`);
    console.error('[server] Stop the old process or set another PORT before starting the server.');
    return;
  }

  console.error('[server] Fatal startup error:', error);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[server] EasyGlop listening on http://127.0.0.1:${PORT}`);
  console.log('[server] Same-PC VPN-safe path: keep the client on 127.0.0.1/localhost.');
});

function sanitizePosition(position) {
  if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.y) || !Number.isFinite(position.z)) {
    return null;
  }

  return {
    x: clamp(position.x, -25, 25),
    y: clamp(position.y, 1, 4),
    z: clamp(position.z, -25, 25)
  };
}

function sanitizeDirection(direction) {
  if (!direction || !Number.isFinite(direction.x) || !Number.isFinite(direction.y) || !Number.isFinite(direction.z)) {
    return null;
  }

  const length = Math.hypot(direction.x, direction.y, direction.z);
  if (length === 0) {
    return null;
  }

  return {
    x: direction.x / length,
    y: direction.y / length,
    z: direction.z / length
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function sanitizeWeaponId(weaponId) {
  return weaponId === 'rifle' ? 'rifle' : 'pistol';
}

function describeHitDirection(direction) {
  if (Math.abs(direction.x) > Math.abs(direction.z)) {
    return direction.x > 0 ? 'Справа прилетело.' : 'Слева прилетело.';
  }

  return direction.z > 0 ? 'Сзади опасно.' : 'Спереди опасно.';
}
