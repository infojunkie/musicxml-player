MusicXML Player
===============

[![npm](https://img.shields.io/npm/v/%40music-i18n%2Fmusicxml-player)](https://www.npmjs.com/package/@music-i18n/musicxml-player)
[![build](https://github.com/infojunkie/musicxml-player/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/infojunkie/musicxml-player/actions/workflows/test.yml)

A TypeScript component that loads and plays MusicXML files in the browser using Web Audio and Web MIDI.

![Screenshot](screenshot.png?raw=true)

# Getting started
```
npm install
npm run build
npm test
npm run demo:develop
```
Then open http://127.0.0.1:8080/

NOTE! To use the MMA (Musical MIDI Accompaniment) feature, you need to [install and run `musicxml-midi`](https://github.com/infojunkie/musicxml-midi) separately. Typically, running `PORT=3000 npm run start` from the `musicxml-midi` folder in a separate console should be enough.

# Theory of operation
This component synchronizes rendering and playback of MusicXML scores. Rendering is done using existing Web-based music engraving libraries such as [Verovio](https://github.com/rism-digital/verovio) or [OpenSheetMusicDisplay](https://github.com/opensheetmusicdisplay/opensheetmusicdisplay). Rendering can also use pre-rendered assets (SVG, metadata) obtained from MuseScore or Verovio. Playback uses standard MIDI files that are expected to correspond to the given MusicXML, and sends the MIDI events to either a Web MIDI output, or to a Web Audio synthesizer, using the module [`spessasynth_lib`](https://github.com/spessasus/spessasynth_lib).

The crucial part of this functionality is to synchronize the measures and beats in the MusicXML file with the events of the MIDI file. In a nutshell, the player expects the provider of the MIDI file (an implementation of `IMidiConverter`) to supply a "timemap", which associates each measure in the MusicXML file to a timestamp at which this measure occurs. In the case of repeats and jumps, the same measure will be referenced several times in the timemap.

There are 3 bundled implementations of `IMidiConverter` in this module:
- An API client that connects to the [`musicxml-midi`](https://github.com/infojunkie/musicxml-midi) API server. `musicxml-midi` is a converter whose major contribution is to generate a MIDI accompaniment in addition to the music in the MusicXML score.
- [Verovio](https://github.com/rism-digital/verovio), that generates a faithful rendition of the MusicXML score but lacks accompaniment generation.
- It is also possible to hand-craft the MIDI and timemap files, and instruct the player to read those explicitly.

# API usage
At the moment, the only documentation available for the usage of the player is located in the [demo app](demo/demo.mjs).

# Tests
This project uses Vitest for testing:
- Unit tests run in Node.
- Integration tests (that might rely on browser-like APIs) run with a jsdom environment. 
Use the commands below to run all tests, a single file, or a single test in watch or non-watch mode.

- All tests
```bash
npm test
```

- Single file
```bash
npm test -- src/helpers/fetish.spec.ts
```

- Single test by name (pattern)
```bash
npm test -- -t "should throw if not ok"
```

- Watch mode (all tests)
```bash
npm test -- --watch
```

- Watch a single file
```bash
npm test -- src/helpers/fetish.spec.ts --watch
```

- Watch a single test in a file
```bash
npm test -- src/helpers/fetish.spec.ts -t "should throw if not ok" --watch
```

