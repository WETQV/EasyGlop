import './styles/main.css';
import gameEngine from './game/engine';
import createMainMenu from './components/MainMenu';

// Инициализация игры
document.addEventListener('DOMContentLoaded', () => {
  // Создаем главное меню
  const mainMenu = createMainMenu(gameEngine);
  
  // Инициализируем игровой движок
  gameEngine.init();
  
  // Обработка нажатия клавиши ESC для показа/скрытия меню
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (gameEngine.isGameActive) {
        mainMenu.showMainMenu();
      }
    }
  });
});