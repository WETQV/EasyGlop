import createMainMenu from './MainMenu';
import createHud from './Hud';

export default function createUi(root, gameEngine) {
  const menuMount = document.createElement('div');
  menuMount.id = 'menu-root';

  const hudMount = document.createElement('div');
  hudMount.id = 'hud-root';

  const modalMount = document.createElement('div');
  modalMount.id = 'modal-root';

  root.appendChild(menuMount);
  root.appendChild(hudMount);
  root.appendChild(modalMount);

  return {
    menu: createMainMenu(menuMount, modalMount, gameEngine),
    hud: createHud(hudMount)
  };
}
