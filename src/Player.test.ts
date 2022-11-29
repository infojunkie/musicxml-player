import { Player } from '.';

const html = `
<!DOCTYPE html>
<html>
    <head>
        <title>MusicXML Player Demo</title>
    </head>
    <body>
        <h1>MusicXML Player</h1>
        <div id="sheet"></div>
    </body>
</html>
`;

describe('Player', () => {
  beforeEach(() => {
    document.documentElement.innerHTML = html.toString();
  });

  it('instantiates the player', () => {
    const player = Player.load('hello, world!', 'sheet');
    expect(player).not.toBeNull();
  });
});
