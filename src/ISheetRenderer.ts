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
  destroy(): void;
  initialize(
    player: Player,
    container: HTMLElement,
    musicXml: string,
  ): Promise<void>;
  moveTo(measureIndex: MeasureIndex, measureOffset: MillisecsTimestamp): void;
  resize(): void;
  get version(): string;
}
