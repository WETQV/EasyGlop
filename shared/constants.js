// Общие константы для клиента и сервера

// Игровые константы
const GAME_CONSTANTS = {
    // Физика
    GRAVITY: 9.8,
    JUMP_FORCE: 10,
    PLAYER_SPEED: 0.1,
    
    // Игровые правила
    MAX_HEALTH: 100,
    RESPAWN_TIME: 3000, // мс
    SCORE_TO_WIN: 10,
    GAME_TIME: 10 * 60 * 1000, // 10 минут в мс
    
    // Карта
    MAP_SIZE: 50,
    OBSTACLE_COUNT: 20,
    SPAWN_POINTS_COUNT: 5,
    
    // Оружие
    WEAPON_COOLDOWN: 500, // мс между выстрелами
    WEAPON_RANGE: 50,
    WEAPON_DAMAGE: 25,
    
    // Сеть
    TICK_RATE: 20 // обновлений в секунду
  };
  
  // Типы сообщений
  const MESSAGE_TYPES = {
    PLAYER_JOIN: 'player_joined',
    PLAYER_LEAVE: 'player_left',
    PLAYER_MOVE: 'player_moved',
    PLAYER_SHOOT: 'player_shot',
    PLAYER_HIT: 'player_hit',
    GAME_START: 'game_start',
    GAME_OVER: 'game_over',
    ROOM_STATE: 'room_state',
    NEW_MAP: 'new_map'
  };
  
  // Экспорт для Node.js
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      GAME_CONSTANTS,
      MESSAGE_TYPES
    };
  }