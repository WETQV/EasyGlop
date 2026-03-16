const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1']);

function resolveSocketUrl() {
  if (typeof window === 'undefined') {
    return 'http://127.0.0.1:3000';
  }

  const params = new URLSearchParams(window.location.search);
  const explicit = params.get('server');
  if (explicit) {
    return explicit;
  }

  const { protocol, hostname, port, origin } = window.location;
  const isLoopback = LOOPBACK_HOSTS.has(hostname);

  if (port === '8080' && isLoopback) {
    return 'http://127.0.0.1:3000';
  }

  if (protocol.startsWith('http')) {
    return origin;
  }

  return 'http://127.0.0.1:3000';
}

export const GAME_CONFIG = {
  debug: false,
  themeMode: 'poop',
  matchLengthSeconds: 360,
  localPlayerHeight: 1.6,
  baseFov: 75,
  movement: {
    acceleration: 30,
    friction: 10,
    maxSpeed: 8.2,
    jumpVelocity: 5.2,
    gravity: 18,
    airControl: 0.4,
    bobSpeed: 12,
    bobAmount: 0.035,
    landingDip: 0.16
  },
  combat: {
    maxHealth: 100,
    lowHealthThreshold: 25,
    remoteLerp: 0.18,
    damageFlashMs: 240,
    killFeedLimit: 5,
    orientationDurationMs: 9000
  },
  weapons: {
    pistol: {
      id: 'pistol',
      label: 'Пистолет',
      ammo: 12,
      reserveAmmo: 48,
      damage: 34,
      fireIntervalMs: 280,
      reloadMs: 900,
      spread: 0.002,
      recoilKick: 0.028,
      tracerColor: 0xffef0a,
      flashColor: 0xff9a1f
    },
    rifle: {
      id: 'rifle',
      label: 'Ритм-винтовка',
      ammo: 24,
      reserveAmmo: 96,
      damage: 18,
      fireIntervalMs: 120,
      reloadMs: 1300,
      spread: 0.006,
      recoilKick: 0.018,
      tracerColor: 0x00ffd0,
      flashColor: 0xff4d6d
    }
  },
  socketUrl: resolveSocketUrl(),
  uiCopy: {
    title: 'EasyGlop',
    strapline: 'Глитч-арена, где побеждает тот, кто держит темп и geometry pressure.',
    fantasy: 'Быстрый хаотичный arena-shooter про движение, стиль и доминирование над синтетической ареной.',
    winCondition: 'Делай фраги, не замирай и первым добери лимит очков до конца короткого раунда.',
    controls: [
      'WASD — движение',
      'Space — короткий прыжок',
      'Мышь — взгляд',
      'ЛКМ — выстрел',
      '1 / 2 — смена оружия',
      'R — перезарядка',
      'Esc — пауза и возврат в меню'
    ],
    mobileWarning: 'Игре нужен десктопный режим: мышь, клавиатура и pointer lock.',
    objectiveLabel: 'Смысл матча',
    objectiveText: 'Держи темп, ломай sightlines, собирай фраги и превращай арену в своё шоу.',
    orientationTitle: 'Сначала сориентируйся',
    orientationHints: [
      'Жёлтый прицел — твой центр внимания. Держи его на проходах и светящихся силуэтах.',
      'Яркие фигуры в центре арены — самый быстрый путь к драке, но там выше риск.',
      'По краям легче пережить старт и перезарядку, в центре легче добрать фраг.'
    ],
    pointerHint: 'Кликни по арене, чтобы захватить курсор и войти в матч.',
    pointerFail: 'Pointer lock сорвался. Нажми по сцене ещё раз.',
    reconnectHint: 'Кликни по сцене, чтобы вернуться в бой.',
    waiting: 'Подключаемся к арене...',
    connected: 'Сокет зацепился. Шоу начинается.',
    disconnected: 'Сервер исчез. Держим лицо и ждём переподключение.',
    start: 'PLAY THE CHAOS',
    howToPlay: 'КАК ЭТО РАБОТАЕТ',
    settings: 'НАСТРОЙКИ ХАОСА',
    close: 'НОРМ, ЗАКРЫТЬ',
    pauseTitle: 'Пауза: сцена ждёт',
    endTitle: 'РАУНД СХЛОПНУЛСЯ',
    restart: 'ЕЩЁ КРУГ',
    backToMenu: 'ОБРАТНО В МЕНЮ',
    fired: ['БДЫЩ', 'PEW PEW', 'УЛЬТРА ХЛОП', 'СЮР-ВЫСТРЕЛ'],
    hit: ['ПОПАЛО', 'КРИТИЧЕСКИЙ МЕМ', 'АЙ', 'СНЕС ЛИЦО'],
    kill: ['ФРАГ', 'РАЗОБРАЛ', 'ШОУ-СТОППЕР', 'КЛИПОВЫЙ МОМЕНТ'],
    death: ['ТЕБЯ СНЯЛИ', 'АРЕНА ОТВЕТИЛА', 'НЕ УСПЕЛ ДОЖАТЬ'],
    lowHealth: 'Экран краснеет: тебя почти выключили.',
    otherPlayerJoined: ['В кадр вкатился новый гладиатор', 'Ещё один герой хаоса вышел на сцену'],
    mapLoaded: ['Новая арена собрана из синтетического бреда', 'Декорации сменились — держи новые линии огня']
  }
};

export function isPoopModeEnabled() {
  return GAME_CONFIG.themeMode === 'poop';
}

export function getWeaponConfig(id) {
  return GAME_CONFIG.weapons[id] || GAME_CONFIG.weapons.pistol;
}
