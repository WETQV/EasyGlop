import './styles/main.css';
import gameEngine from './game/engine';
import createUi from './components/createUi';

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('game-container');
  const uiRoot = document.getElementById('ui-root');

  if (!container || !uiRoot) {
    console.error('Required app roots are missing.');
    return;
  }

  const ui = createUi(uiRoot, gameEngine);
  await gameEngine.init(container, ui);
});
