import * as MusicXMLPlayer from './dist/musicxml-player.esm.js';
import iRealMusicXML from 'https://cdn.jsdelivr.net/npm/ireal-musicxml/+esm';
import { TimingObject } from 'https://cdn.jsdelivr.net/npm/timing-object@3.1.61/+esm';
import { setTimingsrc } from 'https://cdn.jsdelivr.net/npm/timingsrc@1.4.5/+esm';

const DEFAULT_RENDERER = 'vrv';
const DEFAULT_OUTPUT = 'local';
const DEFAULT_SHEET = 'data/asa-branca.musicxml';
const DEFAULT_GROOVE = 'Default';
const DEFAULT_CONVERTER = 'midi';
const DEFAULT_OPTIONS = {
  unroll: false,
  horizontal: false,
  mute: false,
};

const PLAYER_PLAYING = 1;

const LOCALSTORAGE_KEY = 'musicxml-player';

const g_state = {
  webmidi: null,
  player: null,
  params: null,
  musicXml: null,
  options: DEFAULT_OPTIONS,
  timingObject: null,
}

async function createPlayer() {
  // Destroy previous player.
  g_state.player?.destroy();

  // Set the player parameters.
  const sheet = g_state.params.get('sheet');
  const output = g_state.params.get('output') ?? DEFAULT_OUTPUT;
  const renderer = g_state.params.get('renderer') ?? DEFAULT_RENDERER;
  const groove = g_state.params.get('groove') ?? DEFAULT_GROOVE;
  const converter = g_state.params.get('converter') ?? DEFAULT_CONVERTER;
  const options = g_state.options;

  // Reset UI elements.
  const samples = document.getElementById('samples');
  samples.selectedIndex = 0;
  for (const option of samples.options) {
    if (option.value === sheet) {
      samples.value = sheet;
      break;
    }
  }
  const upload = document.getElementById('upload');
  if (!upload.value.endsWith(sheet)) {
    upload.value = '';
  }
  document.getElementById('download-musicxml').innerHTML = '';
  document.getElementById('download-midi').innerHTML = '';
  document.getElementById('error').textContent = '';
  document.getElementById('ireal').value = '';
  document.getElementById('grooves').value = groove === DEFAULT_GROOVE ? null : groove;

  // Create new player.
  if (g_state.musicXml) {
    try {
      const player = await MusicXMLPlayer.Player.load({
        musicXml: g_state.musicXml,
        container: 'sheet-container',
        renderer: createRenderer(renderer, options),
        output: createOutput(output),
        converter: await createConverter(converter, sheet, groove),
        unroll: options.unroll,
        timingsrc: g_state.timingObject,
        mute: options.mute,
      });
      document.getElementById('version').textContent = JSON.stringify(player.version);

      // Update the UI elements.
      const title = player.title?.toLowerCase().replace(/[/\\?%*:|"'<>\s]/g, '-') ?? 'untitled';
      const a1 = document.createElement('a');
      a1.setAttribute('href', 'data:text/xml;charset=utf-8,' + encodeURIComponent(player.musicXml));
      a1.setAttribute('download', `${title}.musicxml`);
      a1.innerText = `${title}.musicxml`;
      document.getElementById('download-musicxml').appendChild(a1);
      const a2 = document.createElement('a');
      a2.setAttribute('href', URL.createObjectURL(new Blob([await player.midi()], { type: 'audio/midi' })));
      a2.setAttribute('download', `${title}.mid`);
      a2.innerText = `${title}.mid`;
      document.getElementById('download-midi').appendChild(a2);

      // Save the state and player parameters.
      g_state.player = player;
      g_state.options = options;
      try {
        window.localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify({
          params: [...g_state.params.entries()],
          options: g_state.options,
        }));
      }
      catch (error) {
        console.warn(`Error saving player state: ${error}`);
      }
    }
    catch (error) {
      console.error(error);
      document.getElementById('error').textContent = 'Error creating player. Please try another setting.';
    }
  }
}

function createRenderer(renderer, options) {
  switch (renderer) {
    case 'osmd':
      return new MusicXMLPlayer.OpenSheetMusicDisplayRenderer({
        renderSingleHorizontalStaffline: options.horizontal,
      });
    case 'vrv':
      return new MusicXMLPlayer.VerovioRenderer({
        breaks: options.horizontal ? 'none' : 'smart',
        spacingNonLinear: options.horizontal ? 1.0 : undefined,
        spacingLinear: options.horizontal ? 0.04 : undefined,
        fingeringScale: 0.6,
        justificationBracketGroup: 5,
        scale: 60,
      }, {
        scrollOffset: 100,
      });
    default:
      console.warn(`Unknown renderer ${renderer}`);
      return createRenderer(DEFAULT_RENDERER);
  }
}

function getMmaEndpoint() {
  return window.location.href + 'mma';
}

async function createConverter(converter, sheet, groove) {
  const candidates = [{
    converter: new MusicXMLPlayer.VerovioConverter(),
    id: 'converter-vrv',
    priority: 1
  }];

  try {
    if (!sheet.endsWith('.musicxml') && !sheet.endsWith('.mxl')) throw 'next';
    const base = sheet.startsWith('http') || sheet.startsWith('data/') ? sheet : `data/${sheet}`;
    const midi = base.replace(/\.musicxml$|\.mxl$/, '.mid');
    const timemap = base.replace(/\.musicxml$|\.mxl$/, '.timemap.json');
    await MusicXMLPlayer.fetish(midi, { method: 'HEAD' });
    try {
      await MusicXMLPlayer.fetish(timemap, { method: 'HEAD' });
      candidates.push({
        converter: new MusicXMLPlayer.FetchConverter(midi, timemap),
        id: 'converter-midi',
        priority: 5
      });
    }
    catch {
      candidates.push({
        converter: new MusicXMLPlayer.FetchConverter(midi),
        id: 'converter-midi',
        priority: 5
      });
    }
  }
  catch {
    document.querySelector('input[name="converter"][id="converter-midi"]').disabled = true;
  }

  try {
    await MusicXMLPlayer.fetish(`${getMmaEndpoint()}/`, { method: 'HEAD' });
    const parameters = {};
    if (groove !== DEFAULT_GROOVE) {
      parameters['globalGroove'] = groove;
    }
    candidates.push({
      converter: new MusicXMLPlayer.MmaConverter(getMmaEndpoint(), parameters),
      id: 'converter-mma',
      priority: 10
    });
  }
  catch {
    document.querySelector('input[name="converter"][id="converter-mma"]').disabled = true;
  }

  const chosen = candidates.reduce((chosen, candidate) => {
    document.querySelector(`input[name="converter"][id="${candidate.id}"]`).disabled = false;
    if (candidate.id === `converter-${converter}`) {
      candidate.priority = Number.POSITIVE_INFINITY;
    }
    if (!chosen || chosen.priority < candidate.priority) {
      return candidate;
    }
    return chosen;
  }, null);
  document.querySelector(`input[name="converter"][id="${chosen.id}"]`).checked = true;

  if (chosen.id !== 'converter-mma') {
    g_state.params.set('groove', DEFAULT_GROOVE);
  }

  return chosen.converter;
}

function createOutput(output) {
  if (g_state.webmidi) {
    return Array.from(g_state.webmidi.outputs.values()).find(o => o.id === output) ?? null;
  }
  return null;
}

function populateMidiOutputs(webmidi) {
  const outputs = document.getElementById('outputs');
  const current = outputs.value;
  outputs.innerHTML = '';
  [{ id: 'local', name: '(local synth)' }].concat(...(webmidi?.outputs?.values() ?? [])).forEach(output => {
    const option = document.createElement('option');
    option.value = output.id;
    option.text = output.name;
    if (option.value === current) option.selected = true;
    outputs.add(option);
  });
}

async function populateGrooves() {
  const grooves = document.getElementById('grooves');
  const groovesList = document.getElementById('grooves-list');
  try {
    const lines = await (await MusicXMLPlayer.fetish(`${getMmaEndpoint()}/grooves`)).text();
    ['Default', 'No groove override, just whatever is specified in the score.', 'None', 'No groove, just the chords.'].concat(lines.split('\n')).forEach((line, index, lines) => {
      if (index % 2 === 1) {
        const option = document.createElement('option');
        option.value = lines[index-1].trim();
        option.text = line.trim();
        groovesList.appendChild(option);
      }
    });
    grooves.disabled = false;
  }
  catch (error) {
    grooves.disabled = true;
  }
}

function handleGrooveSelect(e) {
  if ([...document.getElementById('grooves-list').options].find(g => g.value === e.target.value)) {
    g_state.params.set('groove', e.target.value);
    g_state.params.set('converter', 'mma');
    createPlayer();
  }
}

function handleMidiOutputSelect(e) {
  g_state.params.set('output', e.target.value);
  createPlayer();
}

function handleRendererChange(e) {
  g_state.params.set('renderer', e.target.value);
  createPlayer();
}

function handleConverterChange(e) {
  g_state.params.set('converter', e.target.value);
  createPlayer();
}

function handlePlayPauseKey(e) {
  if (e.key === ' ' && g_state.player) {
    e.preventDefault();
    if (g_state.player.state === PLAYER_PLAYING) {
      g_state.player.pause();
    }
    else {
      g_state.player.play();
    }
  }
}

function populateSheets(ireal) {
  const playlist = new iRealMusicXML.Playlist(ireal);
  const sheets = document.getElementById('sheets');
  sheets.innerHTML = '';
  playlist.songs.forEach(song => {
    const option = document.createElement('option');
    option.value = JSON.stringify(song);
    option.text = song.title;
    sheets.add(option);
  });
  g_state.params.delete('sheet');
  g_state.params.set('groove', DEFAULT_GROOVE);
  sheets.dispatchEvent(new Event('change'));
}

async function handleSampleSelect(e) {
  if (!e.target.value) return;
  const sheet = e.target.value;
  try {
    if (sheet.endsWith('.musicxml') || sheet.endsWith('.mxl')) {
      const musicXml = await (await MusicXMLPlayer.fetish(sheet)).arrayBuffer();
      g_state.musicXml = musicXml;
      g_state.params.set('sheet', sheet);
      g_state.params.set('groove', DEFAULT_GROOVE);
      createPlayer();
    }
    else {
      const ireal = await (await MusicXMLPlayer.fetish(sheet)).text();
      populateSheets(ireal);
    }
  }
  catch (error) {
    console.error(`Failed to load sheet ${sheet}: ${error}`);
  }
}

function handleSheetSelect(e) {
  const song = JSON.parse(e.target.value);
  g_state.musicXml = iRealMusicXML.MusicXML.convert(song, {
    notation: 'rhythmic'
  });
  g_state.params.set('groove', DEFAULT_GROOVE);
  createPlayer();
}

async function handleFileBuffer(buffer) {
  const parseResult = await MusicXMLPlayer.parseMusicXML(buffer);
  if (parseResult) {
    g_state.musicXml = parseResult.musicXml;
    g_state.params.delete('sheet');
    createPlayer();
  }
  else {
    try {
      const ireal = new TextDecoder().decode(buffer);
      populateSheets(ireal);
    }
    catch (error) {
      document.getElementById('error').textContent = 'This file is not recognized as either MusicXML or iReal Pro.';
    }
  }
}

async function handleFileUpload(e) {
  const reader = new FileReader();
  const file = e.target.files[0];
  reader.onloadend = async (upload) => {
    await handleFileBuffer(upload.target.result);
  };
  if (file.size < 1*1024*1024) {
    reader.readAsArrayBuffer(file);
  }
  else {
    document.getElementById('error').textContent = 'This file is too large.';
  }
}

function handleIRealChange(e) {
  if (!e.target.value) return;
  try {
    populateSheets(e.target.value);
  }
  catch {
    document.getElementById('error').textContent = 'This URI is not recognized as iReal Pro.';
    document.getElementById('ireal').value = '';
  }
}

function handleOptionChange(e) {
  g_state.options = {
    unroll: !!document.getElementById('option-unroll').checked,
    horizontal: !!document.getElementById('option-horizontal').checked,
    mute: !!document.getElementById('option-mute').checked,
  };
  createPlayer();
}

function handleAudioChange(e) {
  const file = e.target.files[0];
  document.getElementById('audio-track').setAttribute('src', URL.createObjectURL(file));
  document.getElementById('audio-offset').disabled = true;
}

function handleAudioLoaded(e) {
  document.getElementById('audio-offset').disabled = false;
  setTimingsrc(
    document.getElementById('audio-track'),
    g_state.timingObject,
    ({ position, ...vector }) => ({ ...vector, position: position + Number(document.getElementById('audio-offset').value) / 1000 })
  );
}

function handleAudioDelaychange(e) {
  setTimingsrc(
    document.getElementById('audio-track'),
    g_state.timingObject,
    ({ position, ...vector }) => ({ ...vector, position: position + Number(document.getElementById('audio-offset').value) / 1000 })
  );
}

document.addEventListener('DOMContentLoaded', async () => {
  // Load the parameters from local storage and/or the URL.
  const params = new URLSearchParams(document.location.search);
  try {
    const stored = JSON.parse(window.localStorage.getItem(LOCALSTORAGE_KEY));
    g_state.params = new URLSearchParams([...stored.params, ...[...params.entries()]]);
    g_state.options = stored.options;
  }
  catch {
    g_state.params = params;
  }

  // Build the UI.
  await populateGrooves();

  document.querySelectorAll('input[name="converter"]').forEach(input => {
    input.addEventListener('change', handleConverterChange);
    if (input.value === (g_state.params.get('converter') ?? DEFAULT_CONVERTER)) {
      input.setAttribute('checked', 'checked');
    }
  });
  document.querySelectorAll('input[name="renderer"]').forEach(input => {
    input.addEventListener('change', handleRendererChange);
    if (input.value === (g_state.params.get('renderer') ?? DEFAULT_RENDERER)) {
      input.setAttribute('checked', 'checked');
    }
  });
  document.getElementById('play').addEventListener('click', async () => {
    g_state.timingObject?.update({ velocity: 1 });
  });
  document.getElementById('pause').addEventListener('click', async () => {
    g_state.timingObject?.update({ velocity: 0 });
  });
  document.getElementById('rewind').addEventListener('click', async () => {
    g_state.timingObject?.update({ position: 0, velocity: 0 });
  });
  document.getElementById('upload').addEventListener('change', handleFileUpload);
  document.getElementById('samples').addEventListener('change', handleSampleSelect);
  document.getElementById('sheets').addEventListener('change', handleSheetSelect);
  document.getElementById('grooves').addEventListener('change', handleGrooveSelect);
  document.getElementById('outputs').addEventListener('change', handleMidiOutputSelect);
  document.getElementById('ireal').addEventListener('change', handleIRealChange);
  document.getElementById('audio-file').addEventListener('change', handleAudioChange);
  document.getElementById('audio-track').addEventListener('loadeddata', handleAudioLoaded);
  document.getElementById('audio-offset').addEventListener('change', handleAudioDelaychange);
  document.querySelectorAll('.player-option').forEach(element => {
    if (!!g_state.options[element.id.replace('option-', '')]) {
      element.setAttribute('checked', 'checked');
    }
    element.addEventListener('change', handleOptionChange);
  });
  window.addEventListener('keydown', handlePlayPauseKey);

  // Initialize Web MIDI.
  if (navigator.requestMIDIAccess) navigator.requestMIDIAccess().then(webmidi => {
    populateMidiOutputs(webmidi);
    webmidi.onstatechange = () => populateMidiOutputs(webmidi);
    g_state.webmidi = webmidi;
  }, error => {
    console.error(error);
    populateMidiOutputs();
  });

  // Create the TimingObject.
  g_state.timingObject = new TimingObject();

  // Start the app.
  await handleSampleSelect({ target: { value: g_state.params.get('sheet') ?? DEFAULT_SHEET }});
});
