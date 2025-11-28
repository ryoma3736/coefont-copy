/**
 * CoeFont Scraper V2 - 徹底スクレイピングスクリプト
 *
 * Agent Principle:
 * Agent(Intent, World) = lim_{n→∞} (θₙ_{Learn} ⊗ θₙ_{Integrate} ⊗ θₙ_{Execute} ⊗ θₙ_{Allocate} ⊗ θₙ_{Generate} ⊗ θₙ_{Understand})^n(Intent, World)
 *
 * 改善点:
 * - 認証成功必須（リトライ機能追加）
 * - 認証後のみアクセス可能なページも完全取得
 * - 全API通信のキャプチャ
 * - フォーム・入力要素の完全解析
 * - 音声機能の詳細解析
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 設定
const CONFIG = {
  baseUrl: 'https://coefont.cloud',
  credentials: {
    email: 'ridh.mount37@gmail.com',
    password: '0422ryoma'
  },
  outputDir: path.join(__dirname, '..', 'docs', 'scraping-results-v2'),
  maxMemoryPercent: 65,
  maxRetries: 3,
  timeout: 60000
};

// 結果格納
const results = {
  auth: { success: false, attempts: 0 },
  pages: [],
  apis: [],
  forms: [],
  buttons: [],
  navigation: [],
  components: [],
  cssClasses: new Set(),
  scripts: [],
  errors: []
};

// ユーティリティ
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function saveJson(filename, data) {
  ensureDir(CONFIG.outputDir);
  const filepath = path.join(CONFIG.outputDir, filename);
  // SetをArrayに変換
  const processedData = JSON.parse(JSON.stringify(data, (key, value) => {
    if (value instanceof Set) return Array.from(value);
    return value;
  }));
  fs.writeFileSync(filepath, JSON.stringify(processedData, null, 2), 'utf-8');
  console.log(`[Save] ${filepath}`);
}

function saveHtml(filename, html) {
  ensureDir(path.join(CONFIG.outputDir, 'html'));
  const filepath = path.join(CONFIG.outputDir, 'html', filename);
  fs.writeFileSync(filepath, html, 'utf-8');
  console.log(`[Save] ${filepath}`);
}

function checkMemory() {
  const used = process.memoryUsage();
  const heapPercent = (used.heapUsed / used.heapTotal) * 100;
  if (heapPercent > CONFIG.maxMemoryPercent) {
    console.warn(`[Memory] ${heapPercent.toFixed(1)}% - GC推奨`);
    if (global.gc) global.gc();
  }
  return heapPercent;
}

// API通信キャプチャ（強化版）
function setupApiCapture(page) {
  page.on('request', request => {
    const url = request.url();
    // より広範囲のAPIをキャプチャ
    if (url.includes('/api/') ||
        url.includes('graphql') ||
        url.includes('/v1/') ||
        url.includes('googleapis.com') ||
        url.includes('firebase') ||
        (request.method() === 'POST' && url.includes(CONFIG.baseUrl))) {
      results.apis.push({
        method: request.method(),
        url: url,
        headers: request.headers(),
        postData: request.postData(),
        resourceType: request.resourceType(),
        timestamp: new Date().toISOString()
      });
    }
  });

  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/api/') ||
        url.includes('graphql') ||
        url.includes('/v1/') ||
        url.includes('googleapis.com')) {
      try {
        const contentType = response.headers()['content-type'] || '';
        if (contentType.includes('application/json') || contentType.includes('text/')) {
          const body = await response.text();
          const apiIndex = results.apis.findIndex(a => a.url === url && !a.response);
          if (apiIndex !== -1) {
            results.apis[apiIndex].response = {
              status: response.status(),
              statusText: response.statusText(),
              headers: response.headers(),
              body: body.substring(0, 50000) // 50KB
            };
          }
        }
      } catch (e) {
        // バイナリはスキップ
      }
    }
  });
}

// ログイン処理（リトライ機能付き）
async function login(page, attempt = 1) {
  console.log(`[Auth] ログイン試行 ${attempt}/${CONFIG.maxRetries}...`);
  results.auth.attempts = attempt;

  try {
    await page.goto(`${CONFIG.baseUrl}/login`, {
      waitUntil: 'networkidle',
      timeout: CONFIG.timeout
    });

    // ログインページ保存
    saveHtml('login-page.html', await page.content());

    // フォーム要素解析
    const formData = await page.evaluate(() => {
      const form = document.querySelector('form') || document.body;
      const inputs = Array.from(form.querySelectorAll('input'));
      const buttons = Array.from(form.querySelectorAll('button'));

      return {
        inputs: inputs.map(i => ({
          type: i.type,
          name: i.name,
          id: i.id,
          placeholder: i.placeholder,
          required: i.required,
          pattern: i.pattern
        })),
        buttons: buttons.map(b => ({
          type: b.type,
          text: b.textContent.trim(),
          className: b.className
        }))
      };
    });

    results.auth.formData = formData;
    console.log('[Auth] フォーム要素:', JSON.stringify(formData.inputs, null, 2));

    // メールアドレス入力
    await page.waitForSelector('input[name="email"], input[type="email"]', { timeout: 10000 });
    await page.fill('input[name="email"], input[type="email"]', CONFIG.credentials.email);
    await page.waitForTimeout(500);

    // パスワード入力
    await page.fill('input[type="password"]', CONFIG.credentials.password);
    await page.waitForTimeout(500);

    // スクリーンショット（入力後）
    ensureDir(path.join(CONFIG.outputDir, 'screenshots'));
    await page.screenshot({
      path: path.join(CONFIG.outputDir, 'screenshots', `login-filled-attempt${attempt}.png`),
      fullPage: true
    });

    // ログインボタンクリック
    const loginButton = await page.$('button:has-text("Log in"), button:has-text("ログイン"), button[type="submit"]:has-text("Log")');
    if (loginButton) {
      await loginButton.click();
      console.log('[Auth] ログインボタンクリック');
    }

    // 遷移待機（複数パターン対応）
    try {
      await Promise.race([
        page.waitForURL('**/home**', { timeout: 20000 }),
        page.waitForURL('**/dashboard**', { timeout: 20000 }),
        page.waitForURL('**/studio**', { timeout: 20000 }),
        page.waitForURL('**/selectPlan**', { timeout: 20000 }),
        page.waitForURL('**/sso**', { timeout: 20000 })
      ]);
    } catch (e) {
      console.log('[Auth] URL遷移タイムアウト、現在のURLを確認...');
    }

    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log('[Auth] 現在のURL:', currentUrl);

    // ログイン成功判定
    const isLoggedIn = !currentUrl.includes('/login') || currentUrl.includes('route=');

    if (isLoggedIn) {
      console.log('[Auth] ✅ ログイン成功!');
      results.auth.success = true;
      results.auth.currentUrl = currentUrl;

      // 認証情報保存
      results.auth.cookies = await page.context().cookies();
      results.auth.localStorage = await page.evaluate(() => {
        const items = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          items[key] = localStorage.getItem(key);
        }
        return items;
      });

      // ログイン後ページ保存
      saveHtml('after-login.html', await page.content());
      await page.screenshot({
        path: path.join(CONFIG.outputDir, 'screenshots', 'login-success.png'),
        fullPage: true
      });

      return true;
    }

    // selectPlanに遷移した場合も成功とみなす
    if (currentUrl.includes('selectPlan')) {
      console.log('[Auth] ✅ ログイン成功（プラン選択ページへ遷移）');
      results.auth.success = true;
      results.auth.currentUrl = currentUrl;
      return true;
    }

    // 失敗時リトライ
    if (attempt < CONFIG.maxRetries) {
      console.log('[Auth] ログイン失敗、リトライ...');
      await page.waitForTimeout(2000);
      return login(page, attempt + 1);
    }

    console.log('[Auth] ❌ ログイン失敗（最大リトライ回数到達）');
    results.auth.error = 'Max retries reached';
    return false;

  } catch (error) {
    console.error('[Auth] エラー:', error.message);
    results.auth.error = error.message;

    if (attempt < CONFIG.maxRetries) {
      await page.waitForTimeout(2000);
      return login(page, attempt + 1);
    }
    return false;
  }
}

// ページ詳細解析
async function analyzePage(page, url, name) {
  console.log(`[Page] 解析: ${name} (${url})`);
  const memUsage = checkMemory();
  console.log(`[Memory] ${memUsage.toFixed(1)}%`);

  try {
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: CONFIG.timeout
    });

    // 完全なページデータ取得
    const pageData = await page.evaluate(() => {
      // DOM構造（深さ制限付き）
      const getStructure = (el, depth = 0, maxDepth = 6) => {
        if (!el || depth > maxDepth) return null;
        const children = depth < maxDepth
          ? Array.from(el.children).slice(0, 20).map(c => getStructure(c, depth + 1, maxDepth)).filter(Boolean)
          : [];
        return {
          tag: el.tagName?.toLowerCase(),
          id: el.id || null,
          classes: Array.from(el.classList || []),
          attributes: Array.from(el.attributes || [])
            .filter(a => ['data-', 'aria-', 'role'].some(p => a.name.startsWith(p)))
            .reduce((acc, a) => ({ ...acc, [a.name]: a.value }), {}),
          children
        };
      };

      // 全リンク
      const links = Array.from(document.querySelectorAll('a[href]')).map(a => ({
        href: a.href,
        text: a.textContent?.trim().substring(0, 200),
        target: a.target,
        rel: a.rel
      }));

      // 全ボタン
      const buttons = Array.from(document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]')).map(b => ({
        tag: b.tagName.toLowerCase(),
        type: b.type,
        text: b.textContent?.trim().substring(0, 200),
        id: b.id,
        classes: Array.from(b.classList),
        disabled: b.disabled,
        ariaLabel: b.getAttribute('aria-label')
      }));

      // 全フォーム
      const forms = Array.from(document.querySelectorAll('form')).map(f => ({
        id: f.id,
        action: f.action,
        method: f.method,
        name: f.name,
        inputs: Array.from(f.querySelectorAll('input, select, textarea')).map(i => ({
          tag: i.tagName.toLowerCase(),
          type: i.type,
          name: i.name,
          id: i.id,
          placeholder: i.placeholder,
          required: i.required,
          pattern: i.pattern,
          minLength: i.minLength,
          maxLength: i.maxLength,
          options: i.tagName === 'SELECT'
            ? Array.from(i.options).map(o => ({ value: o.value, text: o.text }))
            : undefined
        }))
      }));

      // 全入力要素（フォーム外も含む）
      const allInputs = Array.from(document.querySelectorAll('input, select, textarea')).map(i => ({
        tag: i.tagName.toLowerCase(),
        type: i.type,
        name: i.name,
        id: i.id,
        placeholder: i.placeholder,
        required: i.required,
        inForm: !!i.form
      }));

      // CSSクラス収集
      const cssClasses = new Set();
      document.querySelectorAll('*').forEach(el => {
        el.classList?.forEach(c => cssClasses.add(c));
      });

      // スクリプト
      const scripts = Array.from(document.querySelectorAll('script[src]')).map(s => s.src);

      // スタイルシート
      const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l => l.href);

      // メタ情報
      const meta = {
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.content,
        ogTitle: document.querySelector('meta[property="og:title"]')?.content,
        ogImage: document.querySelector('meta[property="og:image"]')?.content,
        viewport: document.querySelector('meta[name="viewport"]')?.content
      };

      // 画像
      const images = Array.from(document.querySelectorAll('img')).slice(0, 50).map(img => ({
        src: img.src,
        alt: img.alt,
        width: img.width,
        height: img.height
      }));

      // 動画/音声
      const media = Array.from(document.querySelectorAll('video, audio')).map(m => ({
        tag: m.tagName.toLowerCase(),
        src: m.src,
        controls: m.controls,
        autoplay: m.autoplay
      }));

      return {
        structure: getStructure(document.body),
        links,
        buttons,
        forms,
        allInputs,
        cssClasses: Array.from(cssClasses),
        scripts,
        styles,
        meta,
        images,
        media,
        innerText: document.body.innerText?.substring(0, 10000)
      };
    });

    // HTML保存
    const safeName = name.replace(/[^a-zA-Z0-9-]/g, '-');
    saveHtml(`${safeName}.html`, await page.content());

    // スクリーンショット
    await page.screenshot({
      path: path.join(CONFIG.outputDir, 'screenshots', `${safeName}.png`),
      fullPage: true
    });

    // 結果追加
    const result = {
      name,
      url,
      ...pageData,
      timestamp: new Date().toISOString()
    };
    results.pages.push(result);

    // グローバルCSSクラス追加
    pageData.cssClasses.forEach(c => results.cssClasses.add(c));

    // ナビゲーションリンク追加
    pageData.links
      .filter(l => l.href?.startsWith(CONFIG.baseUrl))
      .forEach(l => {
        if (!results.navigation.find(n => n.href === l.href)) {
          results.navigation.push(l);
        }
      });

    // フォーム追加
    pageData.forms.forEach(f => {
      results.forms.push({ ...f, foundOn: name });
    });

    // ボタン追加
    pageData.buttons.forEach(b => {
      results.buttons.push({ ...b, foundOn: name });
    });

    console.log(`[Page] ✅ ${name}: links=${pageData.links.length}, buttons=${pageData.buttons.length}, forms=${pageData.forms.length}`);
    return result;

  } catch (error) {
    console.error(`[Page] ❌ ${name}:`, error.message);
    results.errors.push({ page: name, url, error: error.message });
    return null;
  }
}

// 全ページ巡回
async function crawlAllPages(page) {
  console.log('[Crawl] ====== 全ページ巡回開始 ======');

  // 既知の主要ページ
  const primaryPages = [
    { name: 'home', url: `${CONFIG.baseUrl}/home` },
    { name: 'dashboard', url: `${CONFIG.baseUrl}/dashboard` },
    { name: 'studio', url: `${CONFIG.baseUrl}/studio` },
    { name: 'fonts', url: `${CONFIG.baseUrl}/fonts` },
    { name: 'mypage', url: `${CONFIG.baseUrl}/mypage` },
    { name: 'settings', url: `${CONFIG.baseUrl}/settings` },
    { name: 'pricing', url: `${CONFIG.baseUrl}/pricing` },
    { name: 'selectPlan', url: `${CONFIG.baseUrl}/selectPlan` },
    { name: 'terms', url: `${CONFIG.baseUrl}/terms` },
    { name: 'privacy', url: `${CONFIG.baseUrl}/privacy` },
    { name: 'help', url: `${CONFIG.baseUrl}/help` },
    { name: 'contact', url: `${CONFIG.baseUrl}/contact` },
    { name: 'resetPassword', url: `${CONFIG.baseUrl}/resetPassword` },
    { name: 'sso', url: `${CONFIG.baseUrl}/sso` }
  ];

  // 主要ページ解析
  for (const p of primaryPages) {
    await analyzePage(page, p.url, p.name);
    await page.waitForTimeout(1500);
  }

  // 発見したリンクを追加解析（最大50ページ）
  const discovered = results.navigation
    .filter(n => n.href?.startsWith(CONFIG.baseUrl))
    .filter(n => !n.href.includes('#'))
    .filter(n => !primaryPages.find(p => p.url === n.href))
    .filter(n => !results.pages.find(p => p.url === n.href))
    .slice(0, 50);

  console.log(`[Crawl] 追加発見ページ: ${discovered.length}`);

  for (const link of discovered) {
    const pageName = new URL(link.href).pathname.replace(/\//g, '-').substring(1) || 'discovered';
    if (!results.pages.find(p => p.url === link.href)) {
      await analyzePage(page, link.href, pageName);
      await page.waitForTimeout(1500);
    }
  }

  console.log(`[Crawl] ====== 完了: ${results.pages.length}ページ ======`);
}

// サマリー生成
function generateSummary() {
  return {
    timestamp: new Date().toISOString(),
    totalPages: results.pages.length,
    totalApis: results.apis.length,
    totalForms: results.forms.length,
    totalButtons: results.buttons.length,
    totalNavigationLinks: results.navigation.length,
    totalCssClasses: results.cssClasses.size,
    totalErrors: results.errors.length,
    authSuccess: results.auth.success,
    authAttempts: results.auth.attempts,
    pages: results.pages.map(p => ({
      name: p.name,
      url: p.url,
      links: p.links?.length || 0,
      buttons: p.buttons?.length || 0,
      forms: p.forms?.length || 0
    })),
    uniqueApiEndpoints: [...new Set(results.apis.map(a => `${a.method} ${new URL(a.url).pathname}`))],
    memoryUsage: process.memoryUsage()
  };
}

// メイン実行
async function main() {
  console.log('='.repeat(70));
  console.log('CoeFont Scraper V2 - 徹底スクレイピング');
  console.log('Agent Principle: θ_{Learn} ⊗ θ_{Integrate} ⊗ θ_{Execute} ⊗ θ_{Allocate} ⊗ θ_{Generate} ⊗ θ_{Understand}');
  console.log('='.repeat(70));

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'ja-JP'
  });

  const page = await context.newPage();
  setupApiCapture(page);

  try {
    // 1. ログイン
    const loginSuccess = await login(page);
    saveJson('01-auth-result.json', results.auth);

    if (!loginSuccess) {
      console.warn('[Warning] ログイン失敗、公開ページのみスクレイピング');
    }

    // 2. 全ページ巡回
    await crawlAllPages(page);

    // 3. 結果保存
    saveJson('02-pages.json', results.pages);
    saveJson('03-apis.json', results.apis);
    saveJson('04-forms.json', results.forms);
    saveJson('05-buttons.json', results.buttons);
    saveJson('06-navigation.json', results.navigation);
    saveJson('07-css-classes.json', Array.from(results.cssClasses));
    saveJson('08-errors.json', results.errors);

    // 4. サマリー生成
    const summary = generateSummary();
    saveJson('00-summary.json', summary);

    // 5. 結果表示
    console.log('\n' + '='.repeat(70));
    console.log('スクレイピング完了');
    console.log('='.repeat(70));
    console.log(`- 認証: ${summary.authSuccess ? '✅ 成功' : '❌ 失敗'} (${summary.authAttempts}回試行)`);
    console.log(`- ページ数: ${summary.totalPages}`);
    console.log(`- API数: ${summary.totalApis}`);
    console.log(`- フォーム数: ${summary.totalForms}`);
    console.log(`- ボタン数: ${summary.totalButtons}`);
    console.log(`- ナビゲーションリンク数: ${summary.totalNavigationLinks}`);
    console.log(`- CSSクラス数: ${summary.totalCssClasses}`);
    console.log(`- エラー数: ${summary.totalErrors}`);
    console.log(`- ユニークAPIエンドポイント数: ${summary.uniqueApiEndpoints.length}`);
    console.log('='.repeat(70));

  } catch (error) {
    console.error('[Fatal]', error);
    results.errors.push({ fatal: true, error: error.message, stack: error.stack });
    saveJson('error-log.json', results.errors);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
