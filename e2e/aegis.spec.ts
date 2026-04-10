import { test, expect } from '@playwright/test';

// Run tests serially to avoid rate limiting (200 req / 15 min global limit)
test.describe.configure({ mode: 'serial' });

test.describe('Aegis Protocol E2E', () => {

  test('homepage loads and shows Aegis branding', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Aegis/i);
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    const html = await page.content();
    expect(html.length).toBeGreaterThan(1000);
  });

  test('marketplace page loads operators', async ({ page }) => {
    await page.goto('/marketplace');
    await page.waitForTimeout(2000);
    const body = await page.textContent('body');
    expect(body).toContain('Jupiter');
  });

  test('connect page shows MCP config', async ({ page }) => {
    await page.goto('/connect');
    await page.waitForTimeout(1000);
    const body = await page.textContent('body');
    expect(body).toContain('api.aegisplace.com/mcp');
    expect(body).toMatch(/\d+ Tools? Available/i);
  });

  test('docs page loads with sections', async ({ page }) => {
    await page.goto('/docs');
    await page.waitForTimeout(1000);
    const body = await page.textContent('body');
    expect(body).toContain('Documentation');
    expect(body).toContain('MCP');
  });

  test('dashboard loads with sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    const body = await page.textContent('body');
    expect(body).toContain('EARNED');
    expect(body).toContain('INVOCATIONS');
  });

  test('tasks page loads', async ({ page }) => {
    await page.goto('/tasks');
    await page.waitForTimeout(2000);
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    expect(body!.length).toBeGreaterThan(100);
  });

  test('leaderboard page loads', async ({ page }) => {
    await page.goto('/leaderboard');
    await page.waitForTimeout(2000);
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('API serves SPA for unknown routes', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.ok()).toBeTruthy();
    const text = await res.text();
    expect(text).toContain('Aegis Protocol');
  });

  test('tRPC stats endpoint returns operator count', async ({ request }) => {
    const res = await request.get('/api/trpc/stats.overview');
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    const data = json.result.data.json;
    expect(data.totalOperators).toBeGreaterThan(400);
    expect(data.avgTrustScore).toBeGreaterThan(0);
  });

  test('MCP endpoint returns tools list', async ({ request }) => {
    const res = await request.post('/mcp', {
      headers: { 'Content-Type': 'application/json' },
      data: { jsonrpc: '2.0', id: 1, method: 'tools/list' },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.result.tools.length).toBeGreaterThanOrEqual(6);
  });

  test('MCP invoke aegis_get_categories returns data', async ({ request }) => {
    const res = await request.post('/mcp', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        jsonrpc: '2.0', id: 2,
        method: 'tools/call',
        params: { name: 'aegis_get_categories', arguments: {} },
      },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    const categories = JSON.parse(json.result.content[0].text);
    expect(Array.isArray(categories.categories)).toBeTruthy();
  });

  test('SSE feed endpoint connects', async ({ page }) => {
    await page.goto('/');
    const result = await page.evaluate(() => {
      return new Promise<string>((resolve) => {
        const controller = new AbortController();
        const timer = setTimeout(() => {
          controller.abort();
          resolve('timeout');
        }, 5000);
        fetch('/api/feed', { signal: controller.signal })
          .then(async (res) => {
            if (!res.ok || !res.body) {
              clearTimeout(timer);
              resolve(`error:${res.status}`);
              return;
            }
            const reader = res.body.getReader();
            const { value } = await reader.read();
            clearTimeout(timer);
            controller.abort();
            resolve(new TextDecoder().decode(value));
          })
          .catch(() => {
            clearTimeout(timer);
            resolve('aborted');
          });
      });
    });
    expect(result).toContain(':ok');
  });

});
