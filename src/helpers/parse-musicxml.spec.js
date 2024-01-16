import chai, { expect } from '@esm-bundle/chai';
import chaiAsPromised from '@esm-bundle/chai-as-promised';
import { parseMusicXML } from '../../dist/musicxml-player.esm';

chai.use(chaiAsPromised);

describe('parseMusicXML', () => {
  it('correctly parses uncompressed MusicXML', async () => {
    await expect(
      parseMusicXML(
        `
    <?xml version="1.0" encoding="UTF-8" standalone="no"?>
    <!DOCTYPE score-partwise PUBLIC
        "-//Recordare//DTD MusicXML 4.0 Partwise//EN"
        "http://www.musicxml.org/dtds/partwise.dtd">
    <score-partwise version="4.0">
      <part-list>
        <score-part id="P1">
          <part-name>Music</part-name>
        </score-part>
      </part-list>
      <part id="P1">
        <measure number="1">
          <attributes>
            <divisions>1</divisions>
            <key>
              <fifths>0</fifths>
            </key>
            <time>
              <beats>4</beats>
              <beat-type>4</beat-type>
            </time>
            <clef>
              <sign>G</sign>
              <line>2</line>
            </clef>
          </attributes>
          <note>
            <pitch>
              <step>C</step>
              <octave>4</octave>
            </pitch>
            <duration>4</duration>
            <type>whole</type>
          </note>
        </measure>
      </part>
    </score-partwise>
    `.trim(),
      ),
    ).to.not.be.rejectedWith();
  });

  it('correctly throws on invalid MusicXML', async () => {
    await expect(
      parseMusicXML(
        `
THIS IS NOT MUSICXML
    `.trim(),
      ),
    ).to.be.rejectedWith();
  });

  it('correctly throws on valid HTML', async () => {
    await expect(
      parseMusicXML(
        `
        <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
        <html xmlns="http://www.w3.org/1999/xhtml">
        <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, minimum-scale=1, maximum-scale=1" />
        <title>iReal Pro</title>
        <style type="text/css">
        .help {
        font-size: small;
        color: #999999;
        }
        </style>
        </head>
        <body style="color: rgb(230, 227, 218); background-color: rgb(27, 39, 48); font-family: Helvetica,Arial,sans-serif;" alink="#b2e0ff" link="#94d5ff" vlink="#b2e0ff">
        <br/><br/><h3><a href="irealb://Strange%20Times%3Dinfojunkie%3D%3DAfoxe%3DC%3D%3D1r34LbKcu7%2C7%5EC%2CD-7%2CA%7Cpp%2C7%5EC%2CA%2FW%2C7G7%2CD%7C%2C7%5EC%2C7G%2C7D%2C7p%20%20G7s45T%7BG%207D%20D-7%2CAD47T%7B%20QyXQyXQy%7DX%207%5EC%7C%2C7G%2C7D%7C%2C7-7%20A744T%7B%7D7%2C%7CC%5E7%20Eh7%2CA7%7D%2C%20%3DJazz-Medium%20Swing%3D100%3D3">Strange Times</a> - infojunkie<br/><br/></h3><br/>
        <br/>Made with iReal Pro
        <a href="http://www.irealpro.com"><img src="http://www.irealb.com/forums/images/images/misc/ireal-pro-logo-50.png" width="25" height="25" hspace="10" alt=""/></a>
        <br/><br/><span class="help">To import this song/playlist tap or click the link on an Android or iOS device or Mac with iReal Pro installed.</span><br/>
        </body>
        </html>
      `.trim(),
      ),
    ).to.be.rejectedWith();
  });
});
