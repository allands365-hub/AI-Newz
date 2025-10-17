const { test, expect } = require('@playwright/test');

test.describe('Newsletter Generation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the newsletter create page
    await page.goto('http://localhost:3000/newsletter/create');
  });

  test('should generate a newsletter with test mode', async ({ page }) => {
    // Enable test mode by adding ?test=true to the URL
    await page.goto('http://localhost:3000/newsletter/create?test=true');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Fill in the newsletter form
    await page.fill('#topic', 'AI and Machine Learning Trends');
    
    // Select style (professional is already selected by default)
    // Select length (medium is already selected by default)
    
    // Click the generate button
    await page.click('text=Generate Newsletter');
    
    // Wait for the generation to complete (look for the generated newsletter section)
    await page.waitForSelector('text=Generated Newsletter', { timeout: 30000 });
    
    // Verify the newsletter was generated
    const generatedNewsletter = await page.textContent('text=Generated Newsletter');
    expect(generatedNewsletter).toBeTruthy();
    
    // Check if newsletter content is displayed
    const newsletterContent = await page.locator('.prose').first();
    await expect(newsletterContent).toBeVisible();
    
    // Check for subject line
    const subjectLine = await page.locator('text=Subject:');
    await expect(subjectLine).toBeVisible();
  });

  test('should save newsletter as draft', async ({ page }) => {
    // Enable test mode
    await page.goto('http://localhost:3000/newsletter/create?test=true');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Fill in the newsletter form
    await page.fill('#topic', 'Tech Industry Updates');
    await page.click('input[value="casual"]'); // Select casual style
    await page.click('input[value="short"]'); // Select short length
    
    // Click the generate button
    await page.click('text=Generate Newsletter');
    
    // Wait for generation to complete
    await page.waitForSelector('text=Generated Newsletter', { timeout: 30000 });
    
    // Click save as draft button
    await page.click('text=Save to Draft');
    
    // Wait for save confirmation
    await page.waitForSelector('text=Newsletter saved to drafts successfully', { timeout: 10000 });
    
    // Verify draft was saved
    const savedMessage = await page.textContent('text=Newsletter saved to drafts successfully');
    expect(savedMessage).toBeTruthy();
  });

  test('should publish newsletter', async ({ page }) => {
    // Enable test mode
    await page.goto('http://localhost:3000/newsletter/create?test=true');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Fill in the newsletter form
    await page.fill('#topic', 'Future of Technology');
    await page.click('input[value="technical"]'); // Select technical style
    await page.click('input[value="long"]'); // Select long length
    
    // Click the generate button
    await page.click('text=Generate Newsletter');
    
    // Wait for generation to complete
    await page.waitForSelector('text=Generated Newsletter', { timeout: 30000 });
    
    // Click publish button
    await page.click('text=Publish');
    
    // Wait for publish confirmation
    await page.waitForSelector('text=Newsletter published successfully', { timeout: 10000 });
    
    // Verify newsletter was published
    const publishedMessage = await page.textContent('text=Newsletter published successfully');
    expect(publishedMessage).toBeTruthy();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Enable test mode
    await page.goto('http://localhost:3000/newsletter/create?test=true');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Don't fill in the topic and disable RSS to trigger an error
    await page.uncheck('#useRss');
    
    // Click the generate button
    await page.click('text=Generate Newsletter');
    
    // Wait for error message
    await page.waitForSelector('.bg-red-50', { timeout: 10000 });
    
    // Verify error is displayed
    const errorMessage = await page.textContent('.bg-red-50');
    expect(errorMessage).toBeTruthy();
    expect(errorMessage).toContain('Please enter a topic');
  });

  test('should generate newsletter with RSS feeds', async ({ page }) => {
    // Enable test mode
    await page.goto('http://localhost:3000/newsletter/create?test=true');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Make sure RSS is enabled (it should be by default)
    const rssCheckbox = await page.locator('#useRss');
    await expect(rssCheckbox).toBeChecked();
    
    // Don't fill in topic (AI will generate from RSS)
    
    // Click the generate button
    await page.click('text=Generate Newsletter');
    
    // Wait for generation to complete
    await page.waitForSelector('text=Generated Newsletter', { timeout: 30000 });
    
    // Verify the newsletter was generated
    const generatedNewsletter = await page.textContent('text=Generated Newsletter');
    expect(generatedNewsletter).toBeTruthy();
    
    // Check if articles were used in generation
    const articlesSection = await page.locator('text=Articles Used in Generation');
    if (await articlesSection.isVisible()) {
      // Verify articles are displayed
      const articleCards = await page.locator('.bg-white.rounded-lg.border');
      expect(await articleCards.count()).toBeGreaterThan(0);
    }
  });
});
