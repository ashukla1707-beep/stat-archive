/* Origin-scoped Android transport. Older APKs retain their existing bridges. */
(function () {
  'use strict';
  if (window !== window.top || !window.StatArchiveNative?.postMessage) return;
  const pending = new Map();
  let sequence = 0;
  const channel = window.StatArchiveNative;
  channel.onmessage = event => {
    let result;
    try { result = JSON.parse(event.data); } catch (_) { return; }
    const request = pending.get(result.id);
    if (!request) return;
    pending.delete(result.id);
    clearTimeout(request.timer);
    if (result.error) request.reject(new Error(result.error));
    else request.resolve(result.value);
  };
  function call(method, ...args) {
    return new Promise((resolve, reject) => {
      const id = `${Date.now()}-${++sequence}`;
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error('Android operation timed out. Please try again.'));
      }, method === 'finishBlobTransfer' ? 15 * 60 * 1000 : 60000);
      pending.set(id, {resolve, reject, timer});
      try { channel.postMessage(JSON.stringify({id, method, args})); }
      catch (error) { clearTimeout(timer); pending.delete(id); reject(error); }
    });
  }
  window.AndroidStreamBridge = {
    protocolVersion: 2,
    beginBlobTransfer: (...args) => call('beginBlobTransfer', ...args),
    appendBlobChunk: (...args) => call('appendBlobChunk', ...args),
    finishBlobTransfer: () => call('finishBlobTransfer'),
    cancelBlobTransfer: () => call('cancelBlobTransfer')
  };
  async function transferBase64(data, filename, mime, action) {
    const bridge = window.AndroidStreamBridge;
    if (!await bridge.beginBlobTransfer(filename, mime, action)) throw new Error('Another Android transfer is in progress.');
    try {
      // Base64 chunks must end on a four-character boundary.
      for (let offset = 0; offset < data.length; offset += 262144) {
        if (!await bridge.appendBlobChunk(data.slice(offset, offset + 262144))) throw new Error('Android transfer interrupted.');
      }
      if (!await bridge.finishBlobTransfer()) throw new Error('Android transfer failed.');
      return true;
    } catch (error) { await bridge.cancelBlobTransfer().catch(() => {}); throw error; }
  }
  window.AndroidBridge = {
    protocolVersion: 2,
    scannerTakePhoto: () => call('scannerTakePhoto').catch(error => window.showError?.(error.message)),
    scannerChoosePhotos: () => call('scannerChoosePhotos').catch(error => window.showError?.(error.message)),
    openFile: (data, name, mime) => transferBase64(data, name, mime, 'open'),
    shareFile: (data, name, mime) => transferBase64(data, name, mime, 'share'),
    saveFile: (data, name, mime) => transferBase64(data, name, mime, 'save')
    // Deliberately no passcode read/write API. Android autofill remains available.
  };
})();
