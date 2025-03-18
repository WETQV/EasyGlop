// Утилиты, используемые и на клиенте, и на сервере

/**
 * Генерирует случайное целое число в заданном диапазоне
 * @param {number} min - Минимальное значение (включительно)
 * @param {number} max - Максимальное значение (включительно)
 * @returns {number} Случайное целое число
 */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  /**
   * Генерирует случайное число с плавающей точкой в заданном диапазоне
   * @param {number} min - Минимальное значение (включительно)
   * @param {number} max - Максимальное значение (исключительно)
   * @returns {number} Случайное число с плавающей точкой
   */
  function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
  }
  
  /**
   * Вычисляет расстояние между двумя точками в 3D пространстве
   * @param {Object} point1 - Первая точка с координатами x, y, z
   * @param {Object} point2 - Вторая точка с координатами x, y, z
   * @returns {number} Расстояние между точками
   */
  function distance3D(point1, point2) {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const dz = point2.z - point1.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  
  /**
   * Нормализует вектор (приводит его длину к 1)
   * @param {Object} vector - Вектор с координатами x, y, z
   * @returns {Object} Нормализованный вектор
   */
  function normalizeVector(vector) {
    const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
    if (length === 0) return { x: 0, y: 0, z: 0 };
    
    return {
      x: vector.x / length,
      y: vector.y / length,
      z: vector.z / length
    };
  }
  
  /**
   * Вычисляет скалярное произведение двух векторов
   * @param {Object} v1 - Первый вектор с координатами x, y, z
   * @param {Object} v2 - Второй вектор с координатами x, y, z
   * @returns {number} Скалярное произведение
   */
  function dotProduct(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  }
  
  /**
   * Форматирует время в секундах в формат MM:SS
   * @param {number} seconds - Время в секундах
   * @returns {string} Отформатированное время в формате MM:SS
   */
  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  // Экспорт для Node.js
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      randomInt,
      randomFloat,
      distance3D,
      normalizeVector,
      dotProduct,
      formatTime
    };
  }