import type { MeasureIndex, MillisecsTimestamp, Player } from './Player';

/**
 * Interface to a MusicXML sheet renderer.
 *
 * The renderer is given a MusicXML doc to render, a container DIV element, and an instance of the player object.
 * It is expected to do the following:
 * - Update a cursor to a given location when being called on the moveTo() method
 * - Detect user interactions on the sheet, and call back the Player.moveTo() function for playback sync
 */
export interface ISheetRenderer {
  player?: Player;
  destroy(): void;
  initialize(container: HTMLElement, musicXml: string): Promise<void>;
  moveTo(
    index: MeasureIndex,
    start: MillisecsTimestamp,
    offset: MillisecsTimestamp,
    duration?: MillisecsTimestamp,
  ): void;
  resize(): void;
  get version(): string;
}
