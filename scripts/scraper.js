/**
 * CoeFont Scraper - 完全スクレイピングスクリプト
 *
 * Agent Principle適用:
 * - θ_{Learn}: ページ構造・API通信パターンを学習
 * - θ_{Integrate}: 複数ページの情報を統合
 * - θ_{Execute}: 並列スクレイピング実行
 * - θ_{Allocate}: メモリ65%制限・並列度制御
 * - θ_{Generate}: 要件定義書を生成
 * - θ_{Understand}: サイト全体構造を理解
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
  outputDir: path.join(__dirname, '..', 'docs', 'scraping-results'),
  maxMemoryPercent: 65,
  maxConcurrency: 3
};

// 結果格納
const results = {
  auth: {},
  pages: [],
  apis: [],
  components: [],
  navigation: [],
  errors: []
};

// メモリ監視
function checkMemory() {
  const used = process.memoryUsage();
  const heapPercent = (used.heapUsed / used.heapTotal) * 100;
  console.log(`[Memory] Heap: ${heapPercent.toFixed(1)}%`);
  return heapPercent < CONFIG.maxMemoryPercent;
}

// ディレクトリ作成
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// JSONファイル保存
function saveJson(filename, data) {
  ensureDir(CONFIG.outputDir);
  const filepath = path.join(CONFIG.outputDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`[Save] ${filepath}`);
}

// HTMLファイル保存
function saveHtml(filename, html) {
  ensureDir(path.join(CONFIG.outputDir, 'html'));
  const filepath = path.join(CONFIG.outputDir, 'html', filename);
  fs.writeFileSync(filepath, html, 'utf-8');
  console.log(`[Save] ${filepath}`);
}

// API通信キャプチャ
function setupApiCapture(page) {
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/') || url.includes('graphql') || url.includes('/v1/')) {
      results.apis.push({
        method: request.method(),
        url: url,
        headers: request.headers(),
        postData: request.postData(),
        timestamp: new Date().toISOString()
      });
    }
  });

  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/api/') || url.includes('graphql') || url.includes('/v1/')) {
      try {
        const body = await response.text();
        const apiIndex = results.apis.findIndex(a => a.url === url && !a.response);
        if (apiIndex !== -1) {
          results.apis[apiIndex].response = {
            status: response.status(),
            headers: response.headers(),
            body: body.substring(0, 10000) // 最初の10KB
          };
        }
      } catch (e) {
        // バイナリレスポンスはスキップ
      }
    }
  });
}

// ログイン処理
async function login(page) {
  console.log('[Auth] ログイン開始...');

  await page.goto(`${CONFIG.baseUrl}/login`, { waitUntil: 'networkidle' });

  // ログインページのHTML保存
  const loginHtml = await page.content();
  saveHtml('login-page.html', loginHtml);

  // フォーム要素を探索
  const formElements = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input'));
    const buttons = Array.from(document.querySelectorAll('button'));
    return {
      inputs: inputs.map(i => ({ type: i.type, name: i.name, id: i.id, placeholder: i.placeholder })),
      buttons: buttons.map(b => ({ type: b.type, text: b.textContent.trim() }))
    };
  });

  results.auth.loginFormElements = formElements;
  console.log('[Auth] フォーム要素:', JSON.stringify(formElements, null, 2));

  // ログイン実行
  try {
    // メールアドレス入力
    await page.fill('input[name="email"]', CONFIG.credentials.email);
    console.log('[Auth] メールアドレス入力完了');

    // パスワード入力
    await page.fill('input[name="password"]', CONFIG.credentials.password);
    console.log('[Auth] パスワード入力完了');

    // ログインボタンクリック
    await page.click('button:has-text("Log in")');
    console.log('[Auth] ログインボタンクリック');

    // URL変化を待機（タイムアウト短縮）
    await page.waitForURL(/\/(home|dashboard|studio)/, { timeout: 15000 }).catch(() => {
      console.log('[Auth] URL変化なし、ページ内容確認...');
    });

    // 少し待機
    await page.waitForTimeout(3000);

    // 現在のURL確認
    const currentUrl = page.url();
    console.log('[Auth] 現在のURL:', currentUrl);

    // 認証Cookie取得
    const cookies = await page.context().cookies();
    results.auth.cookies = cookies.map(c => ({
      name: c.name,
      domain: c.domain,
      path: c.path,
      httpOnly: c.httpOnly,
      secure: c.secure,
      value: c.name.includes('token') || c.name.includes('session') ? '[REDACTED]' : c.value.substring(0, 50)
    }));

    // LocalStorage取得
    const localStorage = await page.evaluate(() => {
      const items = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        const value = window.localStorage.getItem(key);
        items[key] = value ? value.substring(0, 200) : null;
      }
      return items;
    });
    results.auth.localStorage = localStorage;

    // ログイン成功判定
    const isLoggedIn = !currentUrl.includes('/login');
    results.auth.success = isLoggedIn;
    results.auth.currentUrl = currentUrl;

    if (isLoggedIn) {
      console.log('[Auth] ログイン成功');
    } else {
      console.log('[Auth] ログイン状態不明、続行します');
    }

    // ログイン後のページ保存
    const afterLoginHtml = await page.content();
    saveHtml('after-login.html', afterLoginHtml);

  } catch (error) {
    console.error('[Auth] ログインエラー:', error.message);
    results.auth.success = false;
    results.auth.error = error.message;

    // エラー時もスクリーンショット保存
    ensureDir(path.join(CONFIG.outputDir, 'screenshots'));
    await page.screenshot({
      path: path.join(CONFIG.outputDir, 'screenshots', 'login-error.png'),
      fullPage: true
    });
  }

  return results.auth.success !== false;
}

// ページ構造解析
async function analyzePage(page, url, name) {
  console.log(`[Page] 解析中: ${name} (${url})`);

  if (!checkMemory()) {
    console.warn('[Memory] メモリ制限に達しました。GC実行...');
    if (global.gc) global.gc();
  }

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    const pageData = await page.evaluate(() => {
      // DOM構造解析
      const getElementInfo = (el, depth = 0) => {
        if (depth > 5) return null;
        return {
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          classes: Array.from(el.classList),
          children: depth < 3 ? Array.from(el.children).slice(0, 10).map(c => getElementInfo(c, depth + 1)).filter(Boolean) : []
        };
      };

      // コンポーネント検出（React/Vue/Angular対応）
      const components = [];
      document.querySelectorAll('[class*="component"], [class*="Component"], [data-component], [class*="MuiButton"], [class*="chakra-"], [class*="ant-"]').forEach(el => {
        components.push({
          classes: Array.from(el.classList),
          dataAttributes: Object.fromEntries(
            Array.from(el.attributes).filter(a => a.name.startsWith('data-')).map(a => [a.name, a.value])
          )
        });
      });

      // リンク収集
      const links = Array.from(document.querySelectorAll('a[href]')).map(a => ({
        href: a.href,
        text: a.textContent.trim().substring(0, 100)
      }));

      // ボタン収集
      const buttons = Array.from(document.querySelectorAll('button')).map(b => ({
        text: b.textContent.trim().substring(0, 100),
        type: b.type,
        classes: Array.from(b.classList)
      }));

      // フォーム収集
      const forms = Array.from(document.querySelectorAll('form')).map(f => ({
        action: f.action,
        method: f.method,
        inputs: Array.from(f.querySelectorAll('input, select, textarea')).map(i => ({
          type: i.type || i.tagName.toLowerCase(),
          name: i.name,
          id: i.id,
          placeholder: i.placeholder
        }))
      }));

      // メタ情報
      const meta = {
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.content,
        viewport: document.querySelector('meta[name="viewport"]')?.content,
        ogTitle: document.querySelector('meta[property="og:title"]')?.content,
        ogDescription: document.querySelector('meta[property="og:description"]')?.content
      };

      // CSSクラス収集（ユニーク）
      const allClasses = new Set();
      document.querySelectorAll('*').forEach(el => {
        el.classList.forEach(c => allClasses.add(c));
      });

      return {
        structure: getElementInfo(document.body),
        components: components.slice(0, 100),
        links: links.slice(0, 100),
        buttons: buttons.slice(0, 50),
        forms,
        meta,
        scripts: Array.from(document.querySelectorAll('script[src]')).map(s => s.src),
        styles: Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l => l.href),
        cssClasses: Array.from(allClasses).slice(0, 500)
      };
    });

    // HTML保存
    const html = await page.content();
    const safeName = name.replace(/[^a-zA-Z0-9]/g, '-');
    saveHtml(`${safeName}.html`, html);

    // スクリーンショット
    ensureDir(path.join(CONFIG.outputDir, 'screenshots'));
    await page.screenshot({
      path: path.join(CONFIG.outputDir, 'screenshots', `${safeName}.png`),
      fullPage: true
    });

    results.pages.push({
      name,
      url,
      ...pageData,
      timestamp: new Date().toISOString()
    });

    // ナビゲーション情報収集
    pageData.links.forEach(link => {
      if (link.href.startsWith(CONFIG.baseUrl) && !results.navigation.find(n => n.href === link.href)) {
        results.navigation.push(link);
      }
    });

    console.log(`[Page] 完了: ${name} (リンク: ${pageData.links.length}, ボタン: ${pageData.buttons.length})`);
    return pageData;

  } catch (error) {
    console.error(`[Page] エラー (${name}):`, error.message);
    results.errors.push({ page: name, url, error: error.message });
    return null;
  }
}

// 全ページ巡回
async function crawlAllPages(page) {
  console.log('[Crawl] 全ページ巡回開始...');

  // 既知のページ（CoeFontの主要ページ）
  const knownPages = [
    { name: 'home', url: `${CONFIG.baseUrl}/home` },
    { name: 'dashboard', url: `${CONFIG.baseUrl}/dashboard` },
    { name: 'studio', url: `${CONFIG.baseUrl}/studio` },
    { name: 'fonts', url: `${CONFIG.baseUrl}/fonts` },
    { name: 'mypage', url: `${CONFIG.baseUrl}/mypage` },
    { name: 'settings', url: `${CONFIG.baseUrl}/settings` },
    { name: 'pricing', url: `${CONFIG.baseUrl}/pricing` },
    { name: 'help', url: `${CONFIG.baseUrl}/help` },
    { name: 'terms', url: `${CONFIG.baseUrl}/terms` },
    { name: 'privacy', url: `${CONFIG.baseUrl}/privacy` },
    { name: 'contact', url: `${CONFIG.baseUrl}/contact` }
  ];

  // 既知ページを解析
  for (const p of knownPages) {
    await analyzePage(page, p.url, p.name);
    await page.waitForTimeout(1500); // レート制限対策
  }

  // 発見したリンクも解析（内部リンクのみ、最大30ページ追加）
  const discoveredUrls = results.navigation
    .filter(n => n.href.startsWith(CONFIG.baseUrl))
    .filter(n => !n.href.includes('#'))
    .filter(n => !knownPages.find(k => k.url === n.href))
    .filter(n => !results.pages.find(p => p.url === n.href))
    .slice(0, 30);

  console.log(`[Crawl] 追加で ${discoveredUrls.length} ページを発見`);

  for (const link of discoveredUrls) {
    const pageName = new URL(link.href).pathname.replace(/\//g, '-').substring(1) || 'root';
    if (!results.pages.find(p => p.url === link.href)) {
      await analyzePage(page, link.href, pageName);
      await page.waitForTimeout(1500);
    }
  }

  console.log(`[Crawl] 完了: ${results.pages.length}ページ解析`);
}

// メイン実行
async function main() {
  console.log('='.repeat(60));
  console.log('CoeFont Scraper - 開始');
  console.log('Agent Principle: θ_{Learn} ⊗ θ_{Integrate} ⊗ θ_{Execute} ⊗ θ_{Allocate} ⊗ θ_{Generate} ⊗ θ_{Understand}');
  console.log('='.repeat(60));

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();

  // API通信キャプチャ設定
  setupApiCapture(page);

  try {
    // 1. ログイン
    const loginSuccess = await login(page);
    saveJson('01-auth-result.json', results.auth);

    // 2. 全ページ巡回（ログイン失敗でも公開ページは取得）
    await crawlAllPages(page);

    // 3. 結果保存
    saveJson('02-pages.json', results.pages);
    saveJson('03-apis.json', results.apis);
    saveJson('04-navigation.json', results.navigation);
    saveJson('05-errors.json', results.errors);

    // 4. コンポーネント抽出
    const allComponents = [];
    results.pages.forEach(p => {
      if (p.components) {
        p.components.forEach(c => {
          const key = c.classes.join(' ');
          if (!allComponents.find(ac => ac.classes.join(' ') === key)) {
            allComponents.push({ ...c, foundOn: p.name });
          }
        });
      }
    });
    saveJson('06-components.json', allComponents);

    // 5. サマリー生成
    const summary = {
      totalPages: results.pages.length,
      totalApis: results.apis.length,
      totalLinks: results.navigation.length,
      totalComponents: allComponents.length,
      errors: results.errors.length,
      loginSuccess: results.auth.success,
      timestamp: new Date().toISOString()
    };
    saveJson('00-summary.json', summary);

    console.log('\n' + '='.repeat(60));
    console.log('スクレイピング完了');
    console.log(`- ページ数: ${summary.totalPages}`);
    console.log(`- API数: ${summary.totalApis}`);
    console.log(`- リンク数: ${summary.totalLinks}`);
    console.log(`- コンポーネント数: ${summary.totalComponents}`);
    console.log(`- エラー数: ${summary.errors}`);
    console.log(`- ログイン: ${summary.loginSuccess ? '成功' : '失敗/不明'}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('[Fatal] 致命的エラー:', error);
    results.errors.push({ fatal: true, error: error.message, stack: error.stack });
    saveJson('error-log.json', results.errors);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
