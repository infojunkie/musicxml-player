describe('MusicXML Player', () => {
  beforeAll(async () => {
    await browser
      .defaultBrowserContext()
      .overridePermissions('http://localhost:8081', ['midi']);
  });

  it('should include the svg element', async () => {
    await page.goto('http://localhost:8081/test-svg.html');
    await expect(page).toMatchElement('svg', { timeout: 0 });
  });

  it('should not crash on multiple staves', async () => {
    await page.goto('http://localhost:8081/test-staves.html?renderer=osmd');
    await expect(page).toMatchElement('svg', { timeout: 0 });
    await page.goto('http://localhost:8081/test-staves.html?renderer=vrv');
    await expect(page).toMatchElement('svg', { timeout: 0 });
  });
});
