export class MainMenu {
    constructor(gameEngine) {
      this.gameEngine = gameEngine;
      this.createMenuElements();
    }
    
    createMenuElements() {
      // Создаем контейнер для меню
      this.menuContainer = document.createElement('div');
      this.menuContainer.id = 'main-menu';
      this.menuContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        font-family: Arial, sans-serif;
        z-index: 1000;
      `;
      
      // Заголовок
      const title = document.createElement('h1');
      title.textContent = 'EasyGlop';
      title.style.cssText = `
        font-size: 4rem;
        margin-bottom: 2rem;
        color: #ff4500;
        text-shadow: 0 0 10px rgba(255, 69, 0, 0.7);
      `;
      
      // Кнопка "Играть"
      const playButton = document.createElement('button');
      playButton.textContent = 'Играть';
      playButton.style.cssText = this.getButtonStyle();
      playButton.addEventListener('click', () => this.startGame());
      
      // Кнопка "Настройки"
      const settingsButton = document.createElement('button');
      settingsButton.textContent = 'Настройки';
      settingsButton.style.cssText = this.getButtonStyle();
      settingsButton.addEventListener('click', () => this.showSettings());
      
      // Кнопка "Выход"
      const exitButton = document.createElement('button');
      exitButton.textContent = 'Выход';
      exitButton.style.cssText = this.getButtonStyle();
      exitButton.addEventListener('click', () => this.exitGame());
      
      // Добавляем элементы в контейнер
      this.menuContainer.appendChild(title);
      this.menuContainer.appendChild(playButton);
      this.menuContainer.appendChild(settingsButton);
      this.menuContainer.appendChild(exitButton);
      
      // Добавляем меню в документ
      document.body.appendChild(this.menuContainer);
      
      // Создаем экран настроек (скрытый по умолчанию)
      this.createSettingsScreen();
      
      // Создаем экран окончания игры (скрытый по умолчанию)
      this.createGameOverScreen();
    }
    
    getButtonStyle() {
      return `
        background-color: #ff4500;
        color: white;
        border: none;
        padding: 1rem 2rem;
        margin: 0.5rem;
        font-size: 1.5rem;
        border-radius: 5px;
        cursor: pointer;
        transition: background-color 0.3s;
        width: 200px;
        
        &:hover {
          background-color: #ff6a33;
        }
      `;
    }
    
    createSettingsScreen() {
      this.settingsContainer = document.createElement('div');
      this.settingsContainer.id = 'settings-menu';
      this.settingsContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: none;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        font-family: Arial, sans-serif;
        z-index: 1000;
      `;
      
      // Заголовок
      const title = document.createElement('h2');
      title.textContent = 'Настройки';
      title.style.cssText = `
        font-size: 2.5rem;
        margin-bottom: 2rem;
        color: #ff4500;
      `;
      
      // Настройка чувствительности мыши
      const sensitivityContainer = document.createElement('div');
      sensitivityContainer.style.cssText = `
        display: flex;
        align-items: center;
        margin-bottom: 1rem;
        width: 300px;
      `;
      
      const sensitivityLabel = document.createElement('label');
      sensitivityLabel.textContent = 'Чувствительность мыши:';
      sensitivityLabel.style.cssText = `
        flex: 1;
        margin-right: 1rem;
      `;
      
      const sensitivitySlider = document.createElement('input');
      sensitivitySlider.type = 'range';
      sensitivitySlider.min = '1';
      sensitivitySlider.max = '10';
      sensitivitySlider.value = '5';
      sensitivitySlider.style.cssText = `
        flex: 1;
      `;
      
      sensitivityContainer.appendChild(sensitivityLabel);
      sensitivityContainer.appendChild(sensitivitySlider);
      
      // Настройка громкости
      const volumeContainer = document.createElement('div');
      volumeContainer.style.cssText = `
        display: flex;
        align-items: center;
        margin-bottom: 1rem;
        width: 300px;
      `;
      
      const volumeLabel = document.createElement('label');
      volumeLabel.textContent = 'Громкость:';
      volumeLabel.style.cssText = `
        flex: 1;
        margin-right: 1rem;
      `;
      
      const volumeSlider = document.createElement('input');
      volumeSlider.type = 'range';
      volumeSlider.min = '0';
      volumeSlider.max = '100';
      volumeSlider.value = '50';
      volumeSlider.style.cssText = `
        flex: 1;
      `;
      
      volumeContainer.appendChild(volumeLabel);
      volumeContainer.appendChild(volumeSlider);
      
      // Кнопка "Назад"
      const backButton = document.createElement('button');
      backButton.textContent = 'Назад';
      backButton.style.cssText = this.getButtonStyle();
      backButton.addEventListener('click', () => this.hideSettings());
      
      // Добавляем элементы в контейнер
      this.settingsContainer.appendChild(title);
      this.settingsContainer.appendChild(sensitivityContainer);
      this.settingsContainer.appendChild(volumeContainer);
      this.settingsContainer.appendChild(backButton);
      
      // Добавляем настройки в документ
      document.body.appendChild(this.settingsContainer);
    }
    
    createGameOverScreen() {
      this.gameOverContainer = document.createElement('div');
      this.gameOverContainer.id = 'game-over';
      this.gameOverContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: none;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        font-family: Arial, sans-serif;
        z-index: 1000;
      `;
      
      // Заголовок
      const title = document.createElement('h2');
      title.textContent = 'Игра окончена';
      title.style.cssText = `
        font-size: 3rem;
        margin-bottom: 1rem;
        color: #ff4500;
      `;
      
      // Результат
      this.resultText = document.createElement('p');
      this.resultText.textContent = 'Ваш счет: 0';
      this.resultText.style.cssText = `
        font-size: 1.5rem;
        margin-bottom: 2rem;
      `;
      
      // Кнопка "Играть снова"
      const playAgainButton = document.createElement('button');
      playAgainButton.textContent = 'Играть снова';
      playAgainButton.style.cssText = this.getButtonStyle();
      playAgainButton.addEventListener('click', () => this.startGame());
      
      // Кнопка "Главное меню"
      const mainMenuButton = document.createElement('button');
      mainMenuButton.textContent = 'Главное меню';
      mainMenuButton.style.cssText = this.getButtonStyle();
      mainMenuButton.addEventListener('click', () => this.showMainMenu());
      
      // Добавляем элементы в контейнер
      this.gameOverContainer.appendChild(title);
      this.gameOverContainer.appendChild(this.resultText);
      this.gameOverContainer.appendChild(playAgainButton);
      this.gameOverContainer.appendChild(mainMenuButton);
      
      // Добавляем экран окончания игры в документ
      document.body.appendChild(this.gameOverContainer);
    }
    
    startGame() {
      this.menuContainer.style.display = 'none';
      this.settingsContainer.style.display = 'none';
      this.gameOverContainer.style.display = 'none';
      
      // Запускаем игру
      if (this.gameEngine) {
        this.gameEngine.startGame();
      }
    }
    
    showSettings() {
      this.menuContainer.style.display = 'none';
      this.settingsContainer.style.display = 'flex';
    }
    
    hideSettings() {
      this.settingsContainer.style.display = 'none';
      this.menuContainer.style.display = 'flex';
    }
    
    showMainMenu() {
      this.gameOverContainer.style.display = 'none';
      this.settingsContainer.style.display = 'none';
      this.menuContainer.style.display = 'flex';
      
      // Останавливаем игру, если она запущена
      if (this.gameEngine && this.gameEngine.isGameActive) {
        this.gameEngine.endGame();
      }
    }
    
    exitGame() {
      // В браузере мы не можем полностью закрыть игру,
      // поэтому просто показываем подтверждение
      if (confirm('Вы действительно хотите выйти из игры?')) {
        window.close(); // Это может не сработать в некоторых браузерах
      }
    }
    
    updateResult(score) {
      this.resultText.textContent = `Ваш счет: ${score}`;
    }
  }
  
  export default function createMainMenu(gameEngine) {
    return new MainMenu(gameEngine);
  }