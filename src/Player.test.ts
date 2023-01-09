describe('MusicXML Player', () => {
  beforeAll(async () => {
    await browser
      .defaultBrowserContext()
      .overridePermissions('http://localhost:8081', ['midi']);
  });

  it('should include the svg element', async () => {
    await page.goto(
      'http://localhost:8081/index.html?renderer=vrv&sheet=salma-ya-salama',
    );
    await expect(page).toMatchElement('svg', { timeout: 0 });
  });

  it('should not crash on multiple staves', async () => {
    await page.goto(
      'http://localhost:8081/index.html?renderer=osmd&sheet=neville-san',
    );
    await expect(page).toMatchElement('svg', { timeout: 0 });
    await page.goto(
      'http://localhost:8081/index.html?renderer=vrv&sheet=neville-san',
    );
    await expect(page).toMatchElement('svg', { timeout: 0 });
  });
});
