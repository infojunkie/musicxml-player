import * as MusicXmlPlayer from './dist/musicxml-player.esm.js';
import iRealMusicXml from 'https://cdn.jsdelivr.net/npm/ireal-musicxml/+esm';

const DEFAULT_RENDERER = 'vrv';
const DEFAULT_OUTPUT = 'local';
const DEFAULT_SHEET = 'data/asa-branca.musicxml';
const DEFAULT_GROOVE = 'Default';
const DEFAULT_CONVERTER = 'midi';

const PLAYER_PLAYING = 1;

const g_state = {
  webmidi: null,
  player: null,
  params: null,
  musicXml: null,
}

async function createPlayer() {
  // Destroy previous player.
  document.getElementById('sheet').remove();
  const div = document.createElement('div');
  div.setAttribute('id', 'sheet');
  document.getElementById('sheet-container').appendChild(div);
  if (g_state.player) {
    g_state.player.rewind();
    delete g_state.player;
    g_state.player = null;
  }

  // Reset UI elements.
  const sheet = g_state.params.get('sheet');
  const output = g_state.params.get('output') ?? DEFAULT_OUTPUT;
  const renderer = g_state.params.get('renderer') ?? DEFAULT_RENDERER;
  const groove = g_state.params.get('groove') ?? DEFAULT_GROOVE;
  const converter = g_state.params.get('converter') ?? DEFAULT_CONVERTER;

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
  document.getElementById('download').innerHTML = '';
  document.getElementById('error').textContent = '';
  document.getElementById('grooves').value = groove === DEFAULT_GROOVE ? null : groove;

  // Create new player.
  if (g_state.musicXml) {
    try {
      const player = await MusicXmlPlayer.Player.load({
        musicXml: g_state.musicXml,
        container: 'sheet',
        renderer: createRenderer(renderer),
        output: createOutput(output),
        converter: await createConverter(converter, sheet, groove),
      });
      document.getElementById('version').textContent = JSON.stringify(player.version);

      const title = player.title.toLowerCase().replace(/[/\\?%*:|"'<>\s]/g, '-') + '.musicxml';
      const a = document.createElement('a');
      a.setAttribute('href', 'data:text/xml;charset=utf-8,' + encodeURIComponent(player.musicXml));
      a.setAttribute('download', title);
      a.innerText = title;
      download.appendChild(a);

      g_state.player = player;
    }
    catch (error) {
      console.error(`Error creating player: ${error}`);
      document.getElementById('error').textContent = 'Error creating player. Please try another setting.';
    }
  }
}

function createRenderer(renderer) {
  switch (renderer) {
    case 'osmd':
      return new MusicXmlPlayer.OpenSheetMusicDisplayRenderer();
    case 'vrv':
      return new MusicXmlPlayer.VerovioRenderer();
    default:
      console.warn(`Unknown renderer ${renderer}`);
      return createRenderer(DEFAULT_RENDERER);
  }
}

async function createConverter(converter, sheet, groove) {
  const candidates = [{
    converter: new MusicXmlPlayer.VerovioConverter(),
    id: 'vrv',
    priority: 1
  }];

  try {
    if (!sheet.endsWith('.musicxml') && !sheet.endsWith('.mxl')) throw 'next';
    const base = sheet.startsWith('http') || sheet.startsWith('data/') ? sheet : `data/${sheet}`;
    const midi = base.replace(/\.musicxml$|\.mxl$/, '.mid');
    const timemap = base.replace(/\.musicxml$|\.mxl$/, '.timemap.json');
    await MusicXmlPlayer.fetish(midi, { method: 'HEAD' });
    try {
      await MusicXmlPlayer.fetish(timemap, { method: 'HEAD' });
      candidates.push({
        converter: new MusicXmlPlayer.FetchConverter(midi, timemap),
        id: 'midi',
        priority: 5
      });
    }
    catch {
      candidates.push({
        converter: new MusicXmlPlayer.FetchConverter(midi),
        id: 'midi',
        priority: 5
      });
    }
  }
  catch {
    document.querySelector('input[name="converter"][id="midi"]').disabled = true;
  }

  try {
    await MusicXmlPlayer.fetish(`http://localhost:3000`, { method: 'HEAD' });
    const parameters = {};
    if (groove !== DEFAULT_GROOVE) {
      parameters['globalGroove'] = groove;
    }
    candidates.push({
      converter: new MusicXmlPlayer.MmaConverter(`http://localhost:3000`, parameters),
      id: 'mma',
      priority: 10
    });
  }
  catch {
    document.querySelector('input[name="converter"][id="mma"]').disabled = true;
  }

  const chosen = candidates.reduce((chosen, candidate) => {
    document.querySelector(`input[name="converter"][id="${candidate.id}"]`).disabled = false;
    if (candidate.id === converter) {
      candidate.priority = Number.POSITIVE_INFINITY;
    }
    if (!chosen || chosen.priority < candidate.priority) {
      return candidate;
    }
    return chosen;
  }, null);
  document.querySelector(`input[name="converter"][id="${chosen.id}"]`).checked = true;

  if (chosen.id !== 'mma') {
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
    const lines = await (await MusicXmlPlayer.fetish('http://localhost:3000/grooves')).text();
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

async function handleSampleSelect(e) {
  if (!e.target.value) return;
  const sheet = e.target.value;
  if (sheet.endsWith('.musicxml') || sheet.endsWith('.mxl')) {
    const musicXml = await (await MusicXmlPlayer.fetish(sheet)).arrayBuffer();
    g_state.musicXml = musicXml;
    g_state.params.set('sheet', sheet);
    g_state.params.set('groove', DEFAULT_GROOVE);
    createPlayer();
  }
  else {
    try {
      const ireal = await (await MusicXmlPlayer.fetish(sheet)).text();
      const playlist = new iRealMusicXml.Playlist(ireal);
      const sheets = document.getElementById('sheets');
      sheets.innerHTML = '';
      playlist.songs.forEach(song => {
        const option = document.createElement('option');
        option.value = JSON.stringify(song);
        option.text = song.title;
        sheets.add(option);
      });
      g_state.params.set('sheet', sheet);
      sheets.dispatchEvent(new Event('change'));
    }
    catch (error) {
      console.error(`Failed to load sheet ${sheet}: ${error}`);
    }
  }
}

function handleSheetSelect(e) {
  const song = JSON.parse(e.target.value);
  g_state.musicXml = iRealMusicXml.MusicXML.convert(song, {
    notation: 'rhythmic'
  });
  g_state.params.set('groove', DEFAULT_GROOVE);
  createPlayer();
}

async function handleFileUpload(e) {
  const reader = new FileReader();
  const file = e.target.files[0];
  reader.onloadend = async (upload) => {
    const musicXmlAndTitle = await MusicXmlPlayer.parseMusicXml(upload.target.result);
    if (musicXmlAndTitle) {
      g_state.musicXml = musicXmlAndTitle.musicXml;
      g_state.params.set('sheet', file.name);
      createPlayer();
    }
    else {
      document.getElementById('error').textContent = 'This file is not recognized as valid MusicXML.';
    }
  };
  if (file.size < 1*1024*1024) {
    reader.readAsArrayBuffer(file);
  }
  else {
    document.getElementById('error').textContent = 'This file is too large.';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  g_state.params = new URLSearchParams(document.location.search);

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
    await g_state.player?.play();
  });
  document.getElementById('pause').addEventListener('click', async () => {
    await g_state.player?.pause();
  });
  document.getElementById('rewind').addEventListener('click', async () => {
    await g_state.player?.rewind();
  });
  document.getElementById('upload').addEventListener('change', handleFileUpload);
  document.getElementById('samples').addEventListener('change', handleSampleSelect);
  document.getElementById('sheets').addEventListener('change', handleSheetSelect);
  document.getElementById('grooves').addEventListener('change', handleGrooveSelect);
  document.getElementById('outputs').addEventListener('change', handleMidiOutputSelect);
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

  // Start the app.
  await handleSampleSelect({ target: { value: g_state.params.get('sheet') ?? DEFAULT_SHEET }});
});
