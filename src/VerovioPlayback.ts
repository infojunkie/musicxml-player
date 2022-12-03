export class VerovioPlayback {
  // constructor(vrv) {
  //   this.vrv = vrv;
  //   this.ids = [];
  //   this.measures = [];

  //   // Build measure timemap and setup event listeners on notes.
  //   this.vrv.renderToTimemap({ includeMeasures: true, includeRests: true }).forEach(event => {
  //     if ('measureOn' in event) {
  //       this.measures.push({
  //         timestamp: event.tstamp
  //       });
  //     }
  //     const measureIndex = this.measures.length - 1;
  //     Array(...(event.on || []), ...(event.restsOn || [])).forEach(noteid => {
  //       document.getElementById(noteid).addEventListener('click', _ => {
  //         const measureMillisecs = event.tstamp - this.measures[measureIndex].timestamp;
  //         this.moveToMeasureTime(measureIndex, measureMillisecs + 1);
  //         seekMidi(measureIndex, measureMillisecs);
  //       });
  //     });
  //   });

  //   this.moveToMeasureTime(0, 0);
  // }

  // moveToMeasureTime(measureIndex, measureMillisecs) {
  //   const timestamp = Math.max(0,
  //     Math.min(
  //       measureIndex < this.measures.length - 1 ? this.measures[measureIndex + 1].timestamp : this.measures[measureIndex].timestamp + measureMillisecs,
  //       this.measures[measureIndex].timestamp + measureMillisecs)
  //   );
  //   const elements = this.vrv.getElementsAtTime(timestamp);
  //   if ((elements.notes.length > 0) && (this.ids != elements.notes)) {
  //     this.ids.forEach(noteid => {
  //       if (!elements.notes.includes(noteid)) {
  //         const note = document.getElementById(noteid);
  //         note.setAttribute('fill', '#000');
  //         note.setAttribute('stroke', '#000');
  //       }
  //     });
  //     this.ids = elements.notes;
  //     this.ids.forEach(noteid => {
  //       const note = document.getElementById(noteid);
  //       note.setAttribute('fill', '#c00');
  //       note.setAttribute('stroke', '#c00');
  //     });
  //   }
  // }
}
