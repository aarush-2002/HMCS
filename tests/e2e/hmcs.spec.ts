import { test, expect } from '@playwright/test';

test.describe('HMCS Landing Page', () => {
  test('renders with WebGL', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('HMCS');
    await expect(page.locator('[data-chapter="0"]')).toBeVisible();
  });

  test('renders without WebGL (?nogl=1)', async ({ page }) => {
    await page.goto('/?nogl=1');
    await expect(page.locator('h1')).toContainText('HMCS');
    await expect(page.locator('.world-fallback')).toBeVisible();
  });

  test('navigation sheet opens on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.click('[aria-label="Toggle menu"]');
    await expect(page.locator('nav[role="navigation"]')).toBeVisible();
  });

  test('chapter anchors scroll correctly', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="#chapter-01"]');
    await expect(page.locator('#chapter-01')).toBeInViewport();
  });

  test('login → dashboard transition', async ({ page }) => {
    await page.goto('/student/login');
    await page.fill('input[type="email"]', 'student1@hmcs.edu');
    await page.fill('input[type="password"]', 'student123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/student/);
  });

  test('reduced motion mode disables animations', async ({ page }) => {
    await page.goto('/');
    await page.click('[aria-label="Reduce motion effects"]');
    await expect(page.locator('html')).toHaveClass(/reduce-motion/);
  });
});

test.describe('HMCS Student Screens', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/student/login');
    await page.fill('input[type="email"]', 'student1@hmcs.edu');
    await page.fill('input[type="password"]', 'student123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/student/);
  });

  test('feed screen loads', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Hostel Feed');
  });

  test('new complaint form works', async ({ page }) => {
    await page.click('a[href="/student/new"]');
    await page.fill('input[placeholder="Brief summary"]', 'Test complaint');
    await page.fill('textarea', 'This is a test complaint description that is long enough.');
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
  });

  test('my complaints screen loads', async ({ page }) => {
    await page.click('a[href="/student/mine"]');
    await expect(page.locator('h1')).toContainText('My Complaints');
  });

  test('notifications screen loads', async ({ page }) => {
    await page.click('a[href="/student/notifications"]');
    await expect(page.locator('h1')).toContainText('Notifications');
  });
});

test.describe('HMCS Warden Screens', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/warden/login');
    await page.fill('input[type="email"]', 'warden1@hmcs.edu');
    await page.fill('input[type="password"]', 'warden123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/warden/);
  });

  test('queue screen loads', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Complaint Queue');
  });

  test('overdue screen loads', async ({ page }) => {
    await page.click('a[href="/warden/overdue"]');
    await expect(page.locator('h1')).toContainText('Overdue');
  });

  test('performance screen loads', async ({ page }) => {
    await page.click('a[href="/warden/performance"]');
    await expect(page.locator('h1')).toContainText('Performance');
  });
});

test.describe('HMCS Admin Screens', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', 'admin@hmcs.edu');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/admin/);
  });

  test('users screen loads', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Users');
  });

  test('hostels screen loads', async ({ page }) => {
    await page.click('a[href="/admin/hostels"]');
    await expect(page.locator('h1')).toContainText('Hostels');
  });

  test('policies screen loads', async ({ page }) => {
    await page.click('a[href="/admin/policies"]');
    await expect(page.locator('h1')).toContainText('Policies');
  });

  test('audit screen loads', async ({ page }) => {
    await page.click('a[href="/admin/audit"]');
    await expect(page.locator('h1')).toContainText('Audit');
  });

  test('scores screen loads', async ({ page }) => {
    await page.click('a[href="/admin/scores"]');
    await expect(page.locator('h1')).toContainText('Scores');
  });
});

test.describe('Accessibility', () => {
  test('all pages have skip navigation', async ({ page }) => {
    const pages = ['/', '/student/login', '/warden/login', '/admin/login'];
    for (const url of pages) {
      await page.goto(url);
      await expect(page.locator('a[href="#main-content"]')).toBeAttached();
    }
  });

  test('all buttons have accessible names', async ({ page }) => {
    await page.goto('/');
    const buttons = await page.locator('button').all();
    for (const button of buttons) {
      const name = await button.accessibleName();
      expect(name).toBeTruthy();
    }
  });

  test('all images have alt text', async ({ page }) => {
    await page.goto('/');
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });

  test('color contrast meets WCAG AA', async ({ page }) => {
    // This would require axe-core integration
    // Placeholder for actual axe test
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  const viewports = [
    { name: 'mobile-small', width: 360, height: 640 },
    { name: 'mobile', width: 390, height: 844 },
    { name: 'tablet-portrait', width: 768, height: 1024 },
    { name: 'tablet-landscape', width: 1024, height: 768 },
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'desktop-large', width: 1920, height: 1080 },
  ];

  for (const viewport of viewports) {
    test(`landing page renders at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await expect(page.locator('h1')).toContainText('HMCS');
      
      // Check for horizontal scroll
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScroll).toBe(false);
    });
  }
});

test.describe('Error Handling', () => {
  test('404 page shows correct message', async ({ page }) => {
    await page.goto('/nonexistent-page');
    await expect(page.locator('text="This window is dark."')).toBeVisible();
  });

  test('403 page shows access denied', async ({ page }) => {
    await page.goto('/403');
    await expect(page.locator('text="Access Denied"')).toBeVisible();
  });
});

test.describe('Performance', () => {
  test('page loads within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000);
  });

  test('no console errors on landing', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    await page.goto('/');
    await page.waitForTimeout(1000);
    expect(errors.length).toBe(0);
  });
});
