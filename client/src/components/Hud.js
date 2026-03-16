import { GAME_CONFIG, isPoopModeEnabled } from '../config/gameConfig';

const FLASH_DURATION = 1100;

export class Hud {
  constructor(root) {
    this.root = root;
    this.hideFlashTimer = null;
    this.killFeedItems = [];
    this.build();
  }

  build() {
    this.root.innerHTML = `
      <div class="ui-layer ${isPoopModeEnabled() ? 'poop-mode' : ''}">
        <aside class="hud-panel hud-panel--left">
          <div class="hud-label">${GAME_CONFIG.uiCopy.objectiveLabel}</div>
          <div id="objective" class="hud-objective">${GAME_CONFIG.uiCopy.objectiveText}</div>
          <div class="hud-grid">
            <div>
              <div class="hud-label">frag counter</div>
              <div id="score" class="hud-value">0</div>
            </div>
            <div>
              <div class="hud-label">time left</div>
              <div id="time" class="hud-value">06:00</div>
            </div>
          </div>
          <div class="hud-grid">
            <div>
              <div class="hud-label">health</div>
              <div id="health" class="hud-subvalue">100</div>
            </div>
            <div>
              <div class="hud-label">weapon</div>
              <div id="weapon" class="hud-subvalue">Пистолет</div>
            </div>
          </div>
          <div class="hud-grid">
            <div>
              <div class="hud-label">ammo</div>
              <div id="ammo" class="hud-subvalue">12 / 48</div>
            </div>
            <div>
              <div class="hud-label">status</div>
              <div id="connection-state" class="hud-status">${GAME_CONFIG.uiCopy.waiting}</div>
            </div>
          </div>
        </aside>

        <aside class="hud-panel hud-panel--right">
          <div class="hud-label">kill feed</div>
          <div id="kill-feed" class="kill-feed"></div>
        </aside>

        <div id="crosshair" class="crosshair" aria-hidden="true"></div>

        <div id="damage-overlay" class="damage-overlay" hidden></div>

        <div id="round-cue-wrap" class="round-cue-wrap">
          <div id="round-cue" class="hud-round-cue">${GAME_CONFIG.uiCopy.mobileWarning}</div>
        </div>

        <div id="orientation-card" class="orientation-card" hidden>
          <div class="orientation-card__inner">
            <div class="hud-label">${GAME_CONFIG.uiCopy.orientationTitle}</div>
            <ul id="orientation-list" class="orientation-list"></ul>
          </div>
        </div>

        <div id="event-flash" class="event-flash" hidden>
          <div class="event-flash__inner">
            <div id="event-flash-title" class="event-flash__title"></div>
            <div id="event-flash-subtitle" class="event-flash__subtitle"></div>
          </div>
        </div>

        <div id="pointer-hint" class="pointer-hint" hidden>${GAME_CONFIG.uiCopy.pointerHint}</div>
      </div>
    `;

    this.scoreNode = this.root.querySelector('#score');
    this.timeNode = this.root.querySelector('#time');
    this.healthNode = this.root.querySelector('#health');
    this.weaponNode = this.root.querySelector('#weapon');
    this.ammoNode = this.root.querySelector('#ammo');
    this.connectionNode = this.root.querySelector('#connection-state');
    this.roundCueNode = this.root.querySelector('#round-cue');
    this.flashNode = this.root.querySelector('#event-flash');
    this.flashTitleNode = this.root.querySelector('#event-flash-title');
    this.flashSubtitleNode = this.root.querySelector('#event-flash-subtitle');
    this.pointerHintNode = this.root.querySelector('#pointer-hint');
    this.killFeedNode = this.root.querySelector('#kill-feed');
    this.damageOverlayNode = this.root.querySelector('#damage-overlay');
    this.orientationNode = this.root.querySelector('#orientation-card');
    this.orientationListNode = this.root.querySelector('#orientation-list');
  }

  setScore(score) {
    this.scoreNode.textContent = String(score);
  }

  setTime(seconds) {
    const safeSeconds = Math.max(0, seconds);
    const minutes = Math.floor(safeSeconds / 60);
    const remainder = safeSeconds % 60;
    this.timeNode.textContent = `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  }

  setHealth(health) {
    this.healthNode.textContent = String(Math.max(0, Math.round(health)));
    this.healthNode.dataset.low = health <= GAME_CONFIG.combat.lowHealthThreshold ? 'true' : 'false';
  }

  setWeapon(label, ammoInMag, reserveAmmo) {
    this.weaponNode.textContent = label;
    this.ammoNode.textContent = `${ammoInMag} / ${reserveAmmo}`;
  }

  setConnectionState(message, status = 'normal') {
    this.connectionNode.textContent = message;
    this.connectionNode.dataset.status = status;
  }

  setRoundCue(message) {
    this.roundCueNode.textContent = message;
  }

  showPointerHint(message = GAME_CONFIG.uiCopy.pointerHint) {
    this.pointerHintNode.textContent = message;
    this.pointerHintNode.hidden = false;
  }

  hidePointerHint() {
    this.pointerHintNode.hidden = true;
  }

  showOrientation(items = GAME_CONFIG.uiCopy.orientationHints) {
    this.orientationListNode.innerHTML = items.map((item) => `<li>${item}</li>`).join('');
    this.orientationNode.hidden = false;
  }

  hideOrientation() {
    this.orientationNode.hidden = true;
  }

  showDamage(directionText = '', lowHealth = false) {
    this.damageOverlayNode.hidden = false;
    this.damageOverlayNode.dataset.low = lowHealth ? 'true' : 'false';
    this.damageOverlayNode.textContent = directionText;
    clearTimeout(this.damageTimer);
    this.damageTimer = window.setTimeout(() => {
      this.damageOverlayNode.hidden = true;
    }, GAME_CONFIG.combat.damageFlashMs);
  }

  pushKillFeed(text, tone = 'neutral') {
    this.killFeedItems.unshift({ text, tone });
    this.killFeedItems = this.killFeedItems.slice(0, GAME_CONFIG.combat.killFeedLimit);
    this.killFeedNode.innerHTML = this.killFeedItems
      .map((item) => `<div class="kill-feed__item" data-tone="${item.tone}">${item.text}</div>`)
      .join('');
  }

  hideFlash() {
    clearTimeout(this.hideFlashTimer);
    this.flashNode.hidden = true;
    delete this.flashNode.dataset.mode;
    this.flashNode.classList.remove('event-flash--active');
  }

  flash(title, subtitle = '', options = {}) {
    const mode = options.mode || (options.compact ? 'compact' : 'banner');
    this.flashTitleNode.textContent = title;
    this.flashSubtitleNode.textContent = subtitle;
    this.flashNode.hidden = false;
    this.flashNode.dataset.mode = mode;
    this.flashNode.classList.remove('event-flash--active');
    void this.flashNode.offsetWidth;
    this.flashNode.classList.add('event-flash--active');

    clearTimeout(this.hideFlashTimer);
    this.hideFlashTimer = window.setTimeout(() => {
      this.hideFlash();
    }, FLASH_DURATION);
  }
}

export default function createHud(root) {
  return new Hud(root);
}
