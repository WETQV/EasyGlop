import './styles/main.css';
import gameEngine from './game/engine';
import createMainMenu from './components/MainMenu';

// Инициализация игры
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded');
  const container = document.getElementById('game-container');
  
  if (!container) {
    console.error('Game container not found!');
    return;
  }
  
  // Создаем главное меню
  const mainMenu = createMainMenu(gameEngine);
  
  // Инициализируем игровой движок
  console.log('Initializing game engine...');
  gameEngine.init(container);
  
  // Обработка нажатия клавиши ESC для показа/скрытия меню
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (gameEngine.isGameActive) {
        mainMenu.showMainMenu();
      }
    }
  });
});