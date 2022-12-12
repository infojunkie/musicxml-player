describe('MusicXML Player', () => {
  beforeAll(async () => {
    await browser
      .defaultBrowserContext()
      .overridePermissions('http://localhost:8080', ['midi']);
    await page.goto('http://localhost:8080');
  });

  it('should include the svg element', async () => {
    await expect(page).toMatchElement('svg', { timeout: 0 });
  });
});
