let socket = null;
let gameEngine = null;

export function initNetwork(engine) {
  gameEngine = engine;
  
  // Сокет будет установлен позже через setSocket
}

export function setSocket(socketInstance) {
  socket = socketInstance;
}

export function sendPlayerPosition(position) {
  if (socket && socket.connected) {
    socket.emit('player_move', {
      position: {
        x: position.x,
        y: position.y,
        z: position.z
      }
    });
  }
}

export function sendPlayerShoot(position, direction) {
  if (socket && socket.connected) {
    socket.emit('player_shoot', {
      position: {
        x: position.x,
        y: position.y,
        z: position.z
      },
      direction: {
        x: direction.x,
        y: direction.y,
        z: direction.z
      }
    });
  }
}

export function getSocketId() {
  return socket ? socket.id : null;
}