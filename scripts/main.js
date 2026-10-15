// PvZ2 Gardendless 0.15.0 / GP-Next 1.5.2.
// Only the UI scale changes. Saved values remain native linear audio gains,
// so loading/unloading this mod never changes the current audible volume.
const MIN_GAIN = 0.001; // -60 dB at 1%; 0 remains true mute.
const clamp = value => Math.max(0, Math.min(1, Number(value) || 0));

export function toGain(position) {
  const p = clamp(position);
  return p < 0.01 ? p * 100 * MIN_GAIN : 10 ** ((-60 + (p - 0.01) * 60 / 0.99) / 20);
}

export function toPosition(gain) {
  const g = clamp(gain);
  return g < MIN_GAIN ? g / MIN_GAIN * 0.01 : clamp(0.01 + (20 * Math.log10(g) + 60) * 0.99 / 60);
}

export default {
  setup(ctx) {
    const engine = ctx.unsafe?.engine;
    const hooks = ctx.unsafe?.hooks;
    if (!engine?.getModuleExport || !engine?.getCc || !hooks?.wrapMethod) {
      throw new Error('Smooth Volume requires the engine and method-hook interfaces from GP-Next 1.5.2.');
    }
    const get = (file, name) => engine.getModuleExport('chunks:///_virtual/' + file + '.ts', name);
    const music = get('SoundsController', 'MusicController');
    const sfx = get('SoundsController', 'SoundFXController');
    const settings = get('SettingWindow', 'SettingWindow');
    const pause = get('PauseScreen', 'PauseScreen');
    const cc = engine.getCc();
    if (!music || !sfx || !cc?.ProgressBar || !settings?.prototype || !pause?.prototype) {
      throw new Error('Volume controls for version 0.15.0 were not found; the mod was not enabled.');
    }
    for (const owner of [settings, pause]) {
      for (const name of ['start', 'update', 'musicSlide', 'sfxSlide']) {
        if (typeof owner.prototype[name] !== 'function') throw new Error('Incompatible volume control: ' + name);
      }
    }
    const windows = new Set();
    let enabled = true;
    function render(view, logarithmic = true) {
      if (!view || (cc.isValid && !cc.isValid(view))) {
        windows.delete(view);
        return;
      }
      const values = [['music', music.MusicVolume], ['sfx', sfx.SoundFXVolume]];
      for (const [kind, gain] of values) {
        const slider = view[kind + 'Slider'];
        if (!slider) continue;
        const position = logarithmic ? toPosition(gain) : clamp(gain);
        slider.progress = position;
        if (slider.handle?.node) slider.handle.node.angle = -360 * position;
        const bar = view[kind + 'SliderBar'] || slider.getComponent?.(cc.ProgressBar);
        if (bar) bar.progress = position;
      }
    }
    const disposers = [];
    function wrap(target, methodName, handler) {
      const dispose = hooks.wrapMethod({ target, methodName, handler });
      if (typeof dispose === 'function') disposers.push(dispose);
    }
    try {
      for (const owner of [settings, pause]) {
        for (const name of ['start', 'update']) {
          wrap(owner.prototype, name, ({ thisArg, args, callNext }) => {
            const result = callNext(...args);
            if (enabled) { windows.add(thisArg); render(thisArg); }
            return result;
          });
        }
        for (const [name, sliderKey] of [['musicSlide', 'musicSlider'], ['sfxSlide', 'sfxSlider']]) {
          wrap(owner.prototype, name, ({ thisArg, args, callNext }) => {
            if (!enabled) return callNext(...args);
            const slider = thisArg[sliderKey];
            if (!slider) return callNext(...args);
            // Native callbacks consume gain, persist it, and update their own UI.
            // Convert once before the callback, then restore the logarithmic UI.
            slider.progress = toGain(slider.progress);
            try { return callNext(...args); }
            finally { windows.add(thisArg); render(thisArg); }
          });
        }
      }
    } catch (error) {
      enabled = false;
      for (const dispose of disposers.reverse()) dispose();
      throw error;
    }
    function percent(gain) { return Math.round(toPosition(gain) * 100); }
    ctx.controls.definePanel({
      title: 'Smooth Volume (0–100)',
      groups: [{ title: '0: mute · 1–100: evenly spaced decibel steps', items: [
        { type: 'number', key: 'music', label: 'Music volume', min: 0, max: 100, step: 1,
          getValue: () => percent(music.MusicVolume),
          setValue: value => { music.setMusicVolume(toGain(Number(value) / 100)); for (const view of windows) render(view); } },
        { type: 'number', key: 'sfx', label: 'Sound effects volume', min: 0, max: 100, step: 1,
          getValue: () => percent(sfx.SoundFXVolume),
          setValue: value => { sfx.setSoundFxVolume(toGain(Number(value) / 100)); for (const view of windows) render(view); } }
      ] }]
    });
    ctx.log.info('Smooth Volume 1.0.0: main and pause menus now use a decibel curve. Current loudness is preserved.');
    ctx.ui.toast('Smooth Volume enabled: use the full slider range to adjust volume.', 'success');
    return () => {
      enabled = false;
      for (const dispose of disposers.reverse()) dispose();
      for (const view of windows) render(view, false);
      windows.clear();
    };
  }
};
