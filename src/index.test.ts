import { Player } from './';

describe('Player', () => {
  it('instantiates the player', () => {
    const player = Player.load('hello, world!');
    expect(player).not.toBeNull();
  });
});
