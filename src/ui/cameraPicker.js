export function setupCameraPicker({ refreshDevices, selectDevice }) {
  const original = document.querySelector('#cameraSelect');
  const dialog = document.createElement('dialog');
  dialog.className = 'camera-picker-dialog';
  dialog.setAttribute('aria-label', '选择摄像头');
  dialog.innerHTML = `<header><strong>选择摄像头</strong><button type="button" aria-label="关闭摄像头选择">×</button></header>
    <label for="cameraPickerSelect">本机 / 外置摄像头</label><select id="cameraPickerSelect"></select><span class="camera-device-name"></span>
    <p role="status">未开始时只保存选择；运行中选择设备会立即切换。</p>
    <footer><button type="button" data-refresh>刷新设备</button><button type="button" data-apply>使用所选摄像头</button></footer>`;
  document.body.append(dialog);
  const select = dialog.querySelector('select');
  const status = dialog.querySelector('p');
  const fullName = dialog.querySelector('.camera-device-name');
  const showName = () => {
    fullName.textContent = select.selectedOptions[0]?.textContent || '未发现摄像头';
    select.title = fullName.textContent;
  };
  const sync = () => {
    select.replaceChildren(...[...original.options].map(option => option.cloneNode(true)));
    select.value = original.value;
    showName();
  };
  const refresh = async () => { await refreshDevices(); sync(); };
  let applying = false;
  const apply = async () => {
    if (applying) return;
    applying = true;
    select.disabled = true;
    for (const button of dialog.querySelectorAll('footer button')) button.disabled = true;
    try { await selectDevice(select.value); dialog.close(); }
    catch (error) { status.textContent = `切换失败：${error.message}`; }
    finally {
      applying = false;
      select.disabled = false;
      for (const button of dialog.querySelectorAll('footer button')) button.disabled = false;
    }
  };
  select.addEventListener('change', () => { showName(); apply(); });
  dialog.querySelector('[data-apply]').addEventListener('click', apply);
  dialog.querySelector('[data-refresh]').addEventListener('click', refresh);
  dialog.querySelector('header button').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  const open = () => { sync(); status.textContent = '未开始时只保存选择；运行中选择设备会立即切换。'; dialog.showModal(); refresh().catch(error => { status.textContent = error.message; }); };
  // The legacy module pages share this same picker.
  const button = document.createElement('button');
  button.className = 'legacy-camera-picker';
  button.type = 'button';
  button.innerHTML = '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 9h5l2-4h8l2 4h5v18H5Z"/><circle cx="16" cy="18" r="5"/></svg>';
  button.setAttribute('aria-label', '选择摄像头');
  document.querySelector('.topbar__actions').prepend(button);
  button.addEventListener('click', open);
  return open;
}
