MusicXML Player
===============

[![Build](https://github.com/infojunkie/musicxml-player/actions/workflows/continuous-integrations.yaml/badge.svg?branch=main)](https://github.com/infojunkie/musicxml-player/actions/workflows/continuous-integrations.yaml)

A TypeScript component that loads and plays MusicXML files in the browser using Web Audio and Web MIDI.

# Getting started
```
npm install
npm run build
npm test
```

# Running the demo
This is a demo showcasing MusicXML rendering, MIDI conversion, Web Audio and Web MIDI playback. It is an enhanced replica of the [earlier demo](https://github.com/infojunkie/ireal-musicxml/tree/main/demo/web) where the above functionality was hard-coded into the HTML app. By contrast, in this demo, the playback and rendering functionalities are all encapsulated in the present module, with only the demo UI coded in `demo.mjs`.

- Install and run [`musicxml-mma` API endpoint separately](https://github.com/infojunkie/musicxml-mma#installation) and make sure it runs on port 3000.
- Start this demo `npm run demo:develop`
- Open http://127.0.0.1:8080/

# Theory of operation
This component synchronizes rendering and playback of MusicXML documents. Rendering is done using existing Web-based music engraving libraries such as [OpenSheetMusicDisplay](https://github.com/opensheetmusicdisplay/opensheetmusicdisplay) or [Verovio](https://github.com/rism-digital/verovio). Playback uses standard MIDI files that are expected to correspond to the given MusicXML, and sends the MIDI events to either a Web MIDI output, or to a Web Audio synthesizer.

The crucial part of this functionality is to synchronize the measures and beats in the MusicXML file with the events of the MIDI file. In a nutshell, the player expects the provider of the MIDI file (an implementation of `IMidiConverter`) to supply a "timemap", which associates each measure in the MusicXML file to a timestamp at which this measure occurs. In the case of repeats and jumps, the same measure will be referenced several times in the timemap.

Several tools exist to produce such MIDI files and timemaps from a MusicXML score, and the player comes with two implementations. One of them utilizes the companion tool [`musicxml-mma`](https://github.com/infojunkie/musicxml-mma).
