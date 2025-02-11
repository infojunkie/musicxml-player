MusicXML Player
===============

[![Build](https://github.com/infojunkie/musicxml-player/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/infojunkie/musicxml-player/actions/workflows/test.yml)

A TypeScript component that loads   and plays MusicXML files in the browser using Web Audio and Web MIDI.

![Screenshot](https://github.com/infojunkie/musicxml-player/blob/main/screenshot.png?raw=true)

# Getting started
```
npm install
npm run build
npm test
npm run demo
```
Then open http://127.0.0.1:8080/
# Theory of operation
This component synchronizes rendering and playback of MusicXML documents. Rendering is done using existing Web-based music engraving libraries such as [OpenSheetMusicDisplay](https://github.com/opensheetmusicdisplay/opensheetmusicdisplay) or [Verovio](https://github.com/rism-digital/verovio). Playback uses standard MIDI files that are expected to correspond to the given MusicXML, and sends the MIDI events to either a Web MIDI output, or to a Web Audio synthesizer, using the module [`midi-player`](https://github.com/infojunkie/midi-player).

The crucial part of this functionality is to synchronize the measures and beats in the MusicXML file with the events of the MIDI file. In a nutshell, the player expects the provider of the MIDI file (an implementation of `IMidiConverter`) to supply a "timemap", which associates each measure in the MusicXML file to a timestamp at which this measure occurs. In the case of repeats and jumps, the same measure will be referenced several times in the timemap.

There are 3 bundled implementations of `IMidiConverter` in this module:
- An API client that connects to the [`musicxml-midi`](https://github.com/infojunkie/musicxml-midi) API server. `musicxml-midi` is a converter whose major contribution is to generate a MIDI accompaniment in addition to the music in the MusicXML score.
- [Verovio](https://github.com/rism-digital/verovio), that generates a faithful rendition of the MusicXML score but lacks advanced features like microtonal support and accompaniment generation.
- It is also possible to hand-craft the MIDI and timemap files, and instruct the player to read those explicitly.

# API usage
At the moment, the only documentation available for the usage of the player is located in the [demo app](demo/demo.mjs).
