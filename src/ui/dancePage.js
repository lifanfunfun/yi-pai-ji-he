import cameraPreview from '../../assets/dance-camera-preview.png';
import lilyReference from '../../assets/lily-reference.png';
import homeLogo from '../../assets/yi-pa-logo-original-clean.png';

// Presentation only: reuse the original stage, controls, and their event handlers.
export function setupDancePage({ setInstrument, setVolume, getVolume, openCameraPicker, setLilyVolume } = {}) {
  const coverLogo = document.querySelector('.cover-brand__logo');
  const alignCoverText = () => {
    const bounds = coverLogo.getBoundingClientRect();
    const drawnWidth = Math.min(bounds.width, bounds.height * 2040 / 1218);
    coverLogo.parentElement.style.setProperty('--logo-text-offset', `${drawnWidth * 0.066}px`);
  };
  new ResizeObserver(alignCoverText).observe(coverLogo);
  alignCoverText();
  const svg = (content) => `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${content}</svg>`;
  const cameraIcon = svg('<path d="M5 9h5l2-4h8l2 4h5v18H5Z"/><circle cx="16" cy="18" r="5"/>');
  const soundIcon = svg('<path d="M11 5L5 8L2 15L8 18L11 14V28H25V14L28 18L31 15L28 8L22 5C22 12 11 12 11 5Z"/>');
  const settingsIcon = svg('<path d="m13 4-1 4-4 2-4-1-2 5 3 3v4l-1 3 5 3 3-2h4l3 2 5-3-1-4 2-3 3-2-2-5-4 1-3-2-1-4Z"/><circle cx="15" cy="16" r="4"/>');
  const celloIcon = svg('<path d="M16 3v25M13 5h6M13 12c-6-4-10 3-6 7-5 7 0 11 9 11s14-4 9-11c4-4 0-11-6-7M12 7v-3M20 7v-3"/>');
  const keyboardIcon = svg('<rect x="4" y="5" width="24" height="23" rx="3"/><path d="M12 5v23M20 5v23M9 5v12h5V5M18 5v12h5V5"/>');
  const drumIcon = svg('<ellipse cx="16" cy="13" rx="12" ry="5"/><path d="M4 13v12c0 6 24 6 24 0V13M10 18v10M22 18v10M16 10l9-7"/>');
  const bearIcon = svg('<circle cx="16" cy="19" r="10"/><path d="M8 10C0 3 11 0 12 9M21 9c3-9 13-3 7 3M12 17h.1M20 17h.1"/><ellipse cx="16" cy="23" rx="4" ry="3"/>');
  const root = document.createElement('section');
  root.className = 'dance-page';
  root.setAttribute('aria-label', '舞：挥一挥');
  root.innerHTML = `
    <div class="dance-decor dance-decor--blue" aria-hidden="true"></div>
    <div class="dance-decor dance-decor--yellow" aria-hidden="true"></div>
    <div class="dance-decor dance-decor--red" aria-hidden="true"></div>
    <div class="dance-decor--orbit" aria-hidden="true"></div>
    <header class="dance-topbar">
      <div class="dance-brand"><span data-dance-back></span><button class="dance-brand-home" type="button" aria-label="一拍即合，返回首页"><span class="inner-brand-logo"><img src="${homeLogo}" alt="一拍即合"></span></button></div>
      <div class="dance-toolbar">
        <button class="dance-icon-button is-blue" data-dance-camera type="button" aria-label="选择摄像头" aria-haspopup="dialog">${cameraIcon}</button>
        <button class="dance-icon-button" data-dance-sound type="button" aria-label="切换皮肤" title="切换皮肤">${soundIcon}</button>
        <button class="dance-icon-button" data-dance-settings type="button" aria-label="打开全部设置" aria-haspopup="dialog">${settingsIcon}</button>
      </div>
    </header>
    <div class="dance-content">
      <div class="dance-camera-frame">
        <div data-dance-stage></div>
        <span class="dance-camera-status" role="status"><i></i><span data-dance-status>示意画面 · 摄像头未连接</span></span>
        <button class="dance-fullscreen" type="button" aria-label="全屏显示摄像头">${svg('<path d="M4 12V4h8M20 4h8v8M28 20v8h-8M12 28H4v-8"/>')}</button>
      </div>
      <aside class="dance-sidebar">
        <div class="dance-title"><strong>舞</strong><div><h1>挥一挥</h1><p>身体动作</p></div></div>
        <div class="dance-controls">
          <section class="dance-instruments"><h2>音色</h2><div class="dance-instrument-grid">
            <button class="dance-instrument is-selected" data-instrument="cello" type="button" aria-pressed="true">${celloIcon}<span>大提琴</span></button>
            <button class="dance-instrument" data-instrument="synth" type="button" aria-pressed="false" title="Airy Pad 合成器">${keyboardIcon}<span>合成器</span></button>
            <button class="dance-instrument" data-instrument="percussion" type="button" aria-pressed="false" title="旋律打击乐">${drumIcon}<span>打击乐</span></button>
            <button class="dance-instrument" data-instrument="dog" type="button" aria-pressed="false" title="狗叫采样随曲目变调">${bearIcon}<span>动物声</span></button>
          </div></section>
          <section class="dance-sensitivity"><h2><label for="danceVolume">音量</label></h2><div class="dance-slider-row"><input id="danceVolume" type="range" min="0" max="100" step="1" value="70"/><output for="danceVolume">70%</output></div></section>
          <section class="dance-songs"><h2>曲库</h2><div class="dance-song-grid">
            <button type="button" data-dance-song="0" class="is-selected" aria-pressed="true">乐曲一</button>
            <button type="button" data-dance-song="1" aria-pressed="false">乐曲二</button>
            <button type="button" disabled title="暂无此曲目">乐曲三</button>
            <button type="button" disabled title="暂无此曲目">乐曲四</button>
          </div></section>
        </div>
        <div class="lily-control-host"></div>
        <div class="sequencer-control-host"></div>
        <div class="drawing-control-host"></div>
      </aside>
    </div>
    <footer class="dance-bottom">
      <div class="dance-start-area" data-dance-start></div>
      <div class="dance-gesture-hint"><span class="dance-hint-icon"></span><div><strong>挥动双手</strong><p>控制音色和乐曲</p></div></div>
    </footer>
    <dialog class="dance-settings-dialog" aria-label="舞的全部设置">
      <header><strong>全部设置</strong><button type="button" data-dance-close aria-label="关闭设置">×</button></header>
      <div class="dance-extra-actions" data-dance-extra></div><div data-dance-panel></div>
    </dialog>`;
  document.body.append(root);
  const find = (selector) => root.querySelector(selector);
  const original = {
    stage: document.querySelector('#stage'),
    panel: document.querySelector('.panel'),
    start: document.querySelector('#startButton'),
    back: document.querySelector('#backToCoverButton'),
    mode: document.querySelector('.mode-select'),
    export: document.querySelector('#downloadZipButton'),
    lily: document.querySelector('#lilyControls'),
    sequencer: document.querySelector('.sequencer-card'),
    doodle: document.querySelector('#doodleControls'),
  };
  const anchors = {};
  for (const [key, element] of Object.entries(original)) {
    anchors[key] = document.createComment(`Original ${key} position`);
    element.before(anchors[key]);
  }
  const legacyStart = document.createElement('div');
  find('.sequencer-control-host').append(original.sequencer);
  original.sequencer.querySelector('.sequencer-card__title').hidden = true;
  original.sequencer.append(original.sequencer.querySelector('#playSequencerButton'));
  original.sequencer.querySelector('#playSequencerButton').textContent = '暂停播放';
  for (const input of original.sequencer.querySelectorAll('input[type="range"]')) {
    const paint = () => input.style.setProperty('--progress', `${(input.value - input.min) / (input.max - input.min) * 100}%`);
    input.addEventListener('input', paint);
    paint();
  }
  legacyStart.className = 'legacy-start-area';
  document.querySelector('.stage-shell').append(legacyStart);
  const lily = original.lily;
  lily.querySelector('#lilySetSourceButton').hidden = true;
  lily.querySelector('.lily-actions').hidden = true;
  lily.querySelector('.lily-card__title strong').textContent = '声音 / 设置';
  const volumeRow = document.createElement('label');
  volumeRow.className = 'lily-control';
  volumeRow.innerHTML = '<span>音量</span><input id="lilyVolumeInput" type="range" min="0" max="100" value="100" aria-label="漾的音量"><b>100%</b>';
  lily.append(volumeRow);
  volumeRow.querySelector('input').addEventListener('input', event => {
    setLilyVolume(event.target.value);
    volumeRow.querySelector('b').textContent = `${event.target.value}%`;
  });
  for (const selector of ['#lilyIntervalInput', '#lilyRangeInput', '#lilySpreadInput', '#lilyMappingMode', '#lilyScaleSelect', '#lilyInstrumentSelect']) {
    lily.append(lily.querySelector(selector).closest('.lily-control'));
  }
  const optionRow = document.createElement('div');
  optionRow.className = 'lily-option-row';
  for (const [selector, title] of [['#lilyInstrumentSelect', '音色'], ['#lilyMappingMode', '玩法'], ['#lilyScaleSelect', '音阶']]) {
    const select = lily.querySelector(selector);
    select.closest('.lily-control').hidden = true;
    const menu = document.createElement('details');
    menu.className = 'lily-option-menu';
    menu.innerHTML = `<summary>${title}</summary><div class="lily-option-list" role="group" aria-label="${title}选项"></div>`;
    const list = menu.querySelector('.lily-option-list');
    const syncOptions = () => {
      for (const button of list.querySelectorAll('button')) {
        button.setAttribute('aria-pressed', String(button.dataset.value === select.value));
      }
      menu.querySelector('summary').title = select.selectedOptions[0]?.textContent || title;
    };
    for (const option of select.options) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = option.textContent;
      button.dataset.value = option.value;
      button.addEventListener('click', () => {
        select.value = option.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        menu.open = false;
        syncOptions();
      });
      list.append(button);
    }
    select.addEventListener('change', syncOptions);
    menu.addEventListener('toggle', () => {
      if (menu.open) for (const other of optionRow.querySelectorAll('details')) if (other !== menu) other.open = false;
    });
    syncOptions();
    optionRow.append(menu);
  }
  lily.append(optionRow);
  const playbackRow = document.createElement('div');
  playbackRow.className = 'lily-playback-row';
  playbackRow.append(lily.querySelector('#lilyPlayButton'));
  lily.append(playbackRow);
  const paintLilySliders = () => {
    for (const input of lily.querySelectorAll('input[type="range"]')) {
      const percent = (Number(input.value) - Number(input.min)) / (Number(input.max) - Number(input.min)) * 100;
      input.style.setProperty('--progress', `${percent}%`);
    }
  };
  for (const input of lily.querySelectorAll('input[type="range"]')) input.addEventListener('input', paintLilySliders);
  paintLilySliders();
  find('.dance-brand-home').addEventListener('click', () => original.back.click());
  find('.dance-brand').addEventListener('click', (event) => {
    if (!event.target.closest('button')) original.back.click();
  });
  const instrumentButtons = [...root.querySelectorAll('.dance-instrument')];
  root.dataset.instrument = 'cello';
  for (const button of instrumentButtons) button.addEventListener('click', async () => {
    for (const item of instrumentButtons) item.disabled = true;
    try {
      await setInstrument(button.dataset.instrument);
      root.dataset.instrument = button.dataset.instrument;
      for (const item of instrumentButtons) {
        const selected = item === button;
        item.classList.toggle('is-selected', selected);
        item.setAttribute('aria-pressed', String(selected));
      }
    } catch (error) {
      console.error('Instrument load failed:', error);
      find('[data-dance-status]').textContent = '音色加载失败，请重试';
    } finally {
      for (const item of instrumentButtons) item.disabled = false;
    }
  });
  // The photograph is an explicitly labelled preview, never a simulated live feed.
  const preview = document.createElement('img');
  preview.className = 'dance-demo-image';
  preview.src = cameraPreview;
  preview.alt = '挥手互动的示意画面';
  original.stage.prepend(preview);
  const danceHint = document.querySelector('.module-card--blue svg').outerHTML;
  const lilyHint = svg('<circle cx="21" cy="10" r="8" stroke="#ff795c"/><circle cx="21" cy="10" r="4" stroke="#ff795c"/><path d="M9 29 5 20c-1-3 2-4 4-1l2 3V12c0-3 4-3 4 0v6l5-5c2-2 5 1 3 3l-4 6-2 7"/>');
  const lilyPreview = document.createElement('div');
  lilyPreview.className = 'lily-demo';
  lilyPreview.innerHTML = `<img src="${lilyReference}" alt="未开启摄像头时的水波示意画面">`;
  original.stage.prepend(lilyPreview);
  const dialog = find('dialog');
  const songSelect = document.querySelector('#celloSongSelect');
  const slider = find('#danceVolume');
  const syncControls = () => {
    const percent = getVolume();
    slider.value = percent;
    slider.style.setProperty('--progress', `${percent}%`);
    find('output').textContent = `${percent}%`;
    for (const button of root.querySelectorAll('[data-dance-song]')) {
      const selected = button.dataset.danceSong === songSelect.value;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    }
  };
  slider.addEventListener('input', () => {
    setVolume(Number(slider.value));
    syncControls();
  });
  songSelect.addEventListener('change', syncControls);
  for (const button of root.querySelectorAll('[data-dance-song]')) button.addEventListener('click', () => {
    songSelect.value = button.dataset.danceSong;
    songSelect.dispatchEvent(new Event('change', { bubbles: true }));
  });
  const openSettings = (tab) => {
    if (!dialog.open) dialog.showModal();
    document.querySelector(`[data-tab="${tab}"]`)?.click();
  };
  find('[data-dance-settings]').addEventListener('click', () => openSettings('setup'));
  let cloudSkin=true;
  try {cloudSkin=localStorage.getItem('yipai-skin')!=='simple';} catch {}
  const applySkin=()=>{
    root.classList.toggle('skin-cloud',cloudSkin);
    find('[data-dance-sound]').setAttribute('aria-pressed',String(cloudSkin));
    find('[data-dance-sound]').title=cloudSkin?'当前：积木云朵，点击切换简洁版':'当前：简洁版，点击切换积木云朵';
  };
  applySkin();
  find('[data-dance-sound]').addEventListener('click', () => {
    cloudSkin=!cloudSkin;applySkin();
    try {localStorage.setItem('yipai-skin',cloudSkin?'cloud':'simple');} catch {}
  });
  find('[data-dance-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  find('[data-dance-camera]').addEventListener('click', openCameraPicker);
  find('.dance-fullscreen').addEventListener('click', async () => {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await find('.dance-camera-frame').requestFullscreen?.();
  });
  let mounted = false;
  const refresh = () => {
    const mode = document.body.dataset.playMode;
    const isLily = mode === 'lily';
    const active = document.body.dataset.appView === 'studio';
    const labels = {
      interactive: ['舞', '挥一挥', '身体动作', '挥动双手', '控制音色和乐曲'],
      lily: ['漾', '连一连', '空间连接', '点一点 连一连', '让涟漪发出声音'],
      sequencer: ['织', '拼一拼', '节奏组合', '拼出你的节奏', '用物件组合节奏'],
      doodle: ['绘', '画一画', '图像表达', '画出你的音乐', '让图画发出声音'],
    };
    const [character, action, category, hint, description] = labels[mode] || labels.interactive;
    root.classList.toggle('is-lily', isLily);
    root.classList.toggle('is-sequencer', mode === 'sequencer');
    root.classList.toggle('is-doodle', mode === 'doodle');
    if (root.dataset.viewMode !== document.body.dataset.playMode) {
      root.dataset.viewMode = document.body.dataset.playMode;
      find('.dance-hint-icon').innerHTML = isLily ? lilyHint : mode === 'sequencer' ? document.querySelector('.module-card--yellow svg').outerHTML : mode === 'doodle' ? document.querySelector('.module-card--green svg').outerHTML : danceHint;
    }
    root.setAttribute('aria-label', `${character}：${action}`);
    find('.dance-title > strong').textContent = character;
    find('.dance-title h1').textContent = action;
    find('.dance-title p').textContent = category;
    find('.dance-gesture-hint strong').textContent = hint;
    find('.dance-gesture-hint p').textContent = description;
    find('dialog').setAttribute('aria-label', `${character}的全部设置`);
    if (active !== mounted) {
      mounted = active;
      document.body.classList.toggle('dance-active', active);
      if (active) {
        find('[data-dance-stage]').append(original.stage);
        find('[data-dance-panel]').append(original.panel);
        find('[data-dance-start]').append(original.start);
        find('[data-dance-back]').append(original.back);
        find('[data-dance-extra]').append(original.mode, original.export);
        find('.lily-control-host').append(original.lily);
        find('.sequencer-control-host').append(original.sequencer);
        find('.drawing-control-host').append(original.doodle);
        if (original.start.textContent === '启动') original.start.textContent = '开始互动';
        syncControls();
      } else {
        if (dialog.open) dialog.close();
        for (const [key, element] of Object.entries(original)) anchors[key].after(element);
        if (original.start.textContent === '开始互动') original.start.textContent = '启动';
      }
    }
    if (!active && document.body.dataset.appView === 'studio') {
      legacyStart.append(original.start);
      if (original.start.textContent === '启动') original.start.textContent = '开始互动';
    }
    const video = document.querySelector('#camera');
    const connected = video.srcObject?.getVideoTracks().some(track => track.readyState === 'live') || false;
    root.classList.toggle('has-camera', connected);
    const status = document.body.dataset.status;
    find('[data-dance-status]').textContent = connected ? '摄像头已连接' : status === '启动中' ? '正在连接摄像头…' : mode === 'interactive' ? '示意画面 · 摄像头未连接' : '摄像头未连接';
  };
  new MutationObserver(refresh).observe(document.body, { attributes: true, attributeFilter: ['data-app-view', 'data-play-mode', 'data-status'] });
  document.querySelector('#camera').addEventListener('loadeddata', refresh);
  refresh();
}
