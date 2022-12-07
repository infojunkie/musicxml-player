describe('MusicXML Player', () => {
  beforeAll(async () => {
    await page.goto('http://localhost:8080');
  });

  it('should include the OpenSheetMusicDisplay svg element', async () => {
    await expect(page).toMatchElement('svg#osmdSvgPage1', { timeout: 0 });
  });
});
