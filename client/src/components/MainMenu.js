import { GAME_CONFIG, isPoopModeEnabled } from '../config/gameConfig';

export class MainMenu {
  constructor(root, modalRoot, gameEngine) {
    this.root = root;
    this.modalRoot = modalRoot;
    this.gameEngine = gameEngine;
    this.render();
  }

  render() {
    const controlsMarkup = GAME_CONFIG.uiCopy.controls
      .map((line) => `<li class="menu-rule">${line}</li>`)
      .join('');

    this.root.innerHTML = `
      <section id="main-menu" class="main-menu ${isPoopModeEnabled() ? 'poop-mode' : ''}">
        <div class="menu-noise menu-noise--left">LOUD</div>
        <div class="menu-noise menu-noise--right">CUT</div>
        <div class="menu-card">
          <p class="menu-kicker">glitch arena game show</p>
          <h1 class="menu-title">${GAME_CONFIG.uiCopy.title}</h1>
          <p class="menu-copy">${GAME_CONFIG.uiCopy.strapline}</p>

          <div class="menu-brief">
            <div>
              <div class="hud-label">Что это за игра?</div>
              <p>${GAME_CONFIG.uiCopy.fantasy}</p>
            </div>
            <div>
              <div class="hud-label">Как побеждать?</div>
              <p>${GAME_CONFIG.uiCopy.winCondition}</p>
            </div>
          </div>

          <div class="menu-actions">
            <button id="play-button" class="menu-button menu-button--primary">${GAME_CONFIG.uiCopy.start}</button>
            <button id="how-to-button" class="menu-button">${GAME_CONFIG.uiCopy.howToPlay}</button>
            <button id="settings-button" class="menu-button">${GAME_CONFIG.uiCopy.settings}</button>
          </div>

          <p class="menu-footnote">${GAME_CONFIG.uiCopy.mobileWarning}</p>
        </div>
      </section>
    `;

    this.modalRoot.innerHTML = `
      <section id="how-to-modal" class="settings-modal" hidden>
        <div class="settings-card">
          <h2>${GAME_CONFIG.uiCopy.howToPlay}</h2>
          <div class="menu-brief">
            <div>
              <div class="hud-label">Философия матча</div>
              <p>${GAME_CONFIG.uiCopy.objectiveText}</p>
            </div>
            <div>
              <div class="hud-label">Контролы</div>
              <ul class="menu-rules">${controlsMarkup}</ul>
            </div>
          </div>
          <div class="menu-actions">
            <button id="close-how-to" class="menu-button menu-button--primary">${GAME_CONFIG.uiCopy.close}</button>
          </div>
        </div>
      </section>

      <section id="settings-modal" class="settings-modal" hidden>
        <div class="settings-card">
          <h2>${GAME_CONFIG.uiCopy.settings}</h2>
          <label class="settings-row">
            <span>Режим оформления</span>
            <span class="settings-pill">${GAME_CONFIG.themeMode}</span>
          </label>
          <label class="settings-row">
            <span>Socket target</span>
            <span class="settings-pill">${GAME_CONFIG.socketUrl}</span>
          </label>
          <label class="settings-row">
            <span>Философия проекта</span>
            <span class="settings-pill">arcade chaos</span>
          </label>
          <div class="menu-actions">
            <button id="close-settings" class="menu-button menu-button--primary">${GAME_CONFIG.uiCopy.close}</button>
          </div>
        </div>
      </section>

      <section id="game-over-screen" class="game-over-screen" hidden>
        <div class="game-over-card">
          <p class="menu-kicker">match recap</p>
          <h2 id="game-over-title">${GAME_CONFIG.uiCopy.endTitle}</h2>
          <p id="game-over-copy" class="game-over-copy">Арена моргнула, но мы держимся.</p>
          <div class="menu-actions">
            <button id="play-again" class="menu-button menu-button--primary">${GAME_CONFIG.uiCopy.restart}</button>
            <button id="back-to-menu" class="menu-button">${GAME_CONFIG.uiCopy.backToMenu}</button>
          </div>
        </div>
      </section>
    `;

    this.menuNode = this.root.querySelector('#main-menu');
    this.howToNode = this.modalRoot.querySelector('#how-to-modal');
    this.settingsNode = this.modalRoot.querySelector('#settings-modal');
    this.gameOverNode = this.modalRoot.querySelector('#game-over-screen');
    this.gameOverCopyNode = this.modalRoot.querySelector('#game-over-copy');

    this.root.querySelector('#play-button').addEventListener('click', () => this.gameEngine.startGame());
    this.root.querySelector('#how-to-button').addEventListener('click', () => this.showHowTo());
    this.root.querySelector('#settings-button').addEventListener('click', () => this.showSettings());
    this.modalRoot.querySelector('#close-how-to').addEventListener('click', () => this.hideHowTo());
    this.modalRoot.querySelector('#close-settings').addEventListener('click', () => this.hideSettings());
    this.modalRoot.querySelector('#play-again').addEventListener('click', () => this.gameEngine.restartGame());
    this.modalRoot.querySelector('#back-to-menu').addEventListener('click', () => this.showMainMenu());
  }

  showMainMenu() {
    this.gameOverNode.hidden = true;
    this.settingsNode.hidden = true;
    this.howToNode.hidden = true;
    this.menuNode.hidden = false;
    this.gameEngine.ui?.hud?.hideFlash();
    this.gameEngine.stopGame({ showResults: false });
  }

  hideMainMenu() {
    this.menuNode.hidden = true;
  }

  showHowTo() {
    this.howToNode.hidden = false;
  }

  hideHowTo() {
    this.howToNode.hidden = true;
  }

  showSettings() {
    this.settingsNode.hidden = false;
  }

  hideSettings() {
    this.settingsNode.hidden = true;
  }

  showGameOver(resultText) {
    this.menuNode.hidden = true;
    this.settingsNode.hidden = true;
    this.howToNode.hidden = true;
    this.gameOverCopyNode.textContent = resultText;
    this.gameOverNode.hidden = false;
  }

  hideGameOver() {
    this.gameOverNode.hidden = true;
  }
}

export default function createMainMenu(root, modalRoot, gameEngine) {
  return new MainMenu(root, modalRoot, gameEngine);
}
