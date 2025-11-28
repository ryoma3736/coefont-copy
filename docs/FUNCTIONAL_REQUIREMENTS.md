# CoeFont Clone - 機能要件定義書

**Version:** 1.0.0
**Date:** 2025-11-28
**Status:** Draft

---

## 最上位原理

```
Agent(Intent, World) = lim_{n→∞} (θₙ_{Learn} ⊗ θₙ_{Integrate} ⊗ θₙ_{Execute} ⊗ θₙ_{Allocate} ⊗ θₙ_{Generate} ⊗ θₙ_{Understand})^n(Intent, World)
```

---

## 1. エグゼクティブサマリー

### 1.1 プロジェクト概要

CoeFont Clone は、AI音声合成サービス「CoeFont」のローカル版クローンアプリケーション。
ユーザーがAI音声（CoeFont）を使用してテキストから音声を生成できるWebアプリケーションを構築する。

### 1.2 スクレイピング結果サマリー

| 項目 | 数値 |
|------|------|
| 解析ページ数 | 14 |
| 検出API数 | 18 |
| 検出リンク数 | 20 |
| エラー数 | 0 |

---

## 2. 技術スタック（検出結果）

### 2.1 フロントエンド

| 技術 | バージョン/詳細 |
|------|----------------|
| **フレームワーク** | Next.js (App Router) |
| **ランタイム** | React 18+ |
| **スタイリング** | CSS Modules |
| **ホスティング** | Vercel |
| **モニタリング** | Sentry |

### 2.2 バックエンド/認証

| 技術 | 詳細 |
|------|------|
| **認証** | Firebase Authentication |
| **プロバイダー** | Google, Apple, Facebook, Email/Password |
| **セッション管理** | Cookie-based (`/api/auth/session`) |
| **API** | Next.js API Routes |

### 2.3 検出されたFirebase設定

```json
{
  "projectId": "299026383647",
  "apiKey": "AIzaSyB6hVR2Wd56drainYJpkO_slko5GMPIrtY",
  "authorizedDomains": [
    "localhost",
    "coefont-corporate.firebaseapp.com",
    "coefont-corporate.web.app",
    "coefont.cloud",
    "corporate.coefont.cloud"
  ]
}
```

---

## 3. ページ構造

### 3.1 サイトマップ

```
coefont.cloud/
├── /home                 # ホーム（認証前ランディング）
├── /login                # ログインページ
├── /sso                  # SSO認証
├── /resetPassword        # パスワードリセット
├── /selectPlan           # プラン選択
├── /dashboard            # ダッシュボード（要認証）
├── /studio               # 音声生成スタジオ（要認証）
├── /fonts                # フォント一覧（要認証）
├── /mypage               # マイページ（要認証）
├── /settings             # 設定（要認証）
├── /pricing              # 料金プラン
├── /help                 # ヘルプ
├── /terms                # 利用規約
├── /privacy              # プライバシーポリシー
└── /contact              # お問い合わせ
```

### 3.2 認証フロー

```
[未認証] → /login → [Firebase Auth] → /sso → /selectPlan → /home
                  ↓
           [Google/Apple/Facebook OAuth]
```

---

## 4. コンポーネント仕様

### 4.1 共通UIコンポーネント

#### Button コンポーネント
```typescript
interface ButtonProps {
  variant: 'fill' | 'text' | 'outline';
  size: 'sm' | 'md' | 'lg';
  block?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

// CSSクラス
// Button_button__wfofQ
// Button_buttonBase__2juIe
// Button_lg__ll6C_
// Button_fill__X9ePS
// Button_block__NrstN
// Button_text__HvhbT
```

#### Header コンポーネント
```typescript
interface HeaderProps {
  showLogo?: boolean;
  showActions?: boolean;
  transparent?: boolean;
}

// CSSクラス
// Header_header__qBw1J
// Header_side__P_aql
// Header_headerLeft__LAbYZ
// Header_actions__dkylq
// Header_right__AJNjV
```

#### Footer コンポーネント
```typescript
interface FooterProps {
  showLanguageSelector?: boolean;
}

// CSSクラス
// Footer_footer__CZmev
// Footer_langSelect__Qlim_
// Footer_label__jo6T7
```

#### Select コンポーネント
```typescript
interface SelectProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// CSSクラス
// Select_trigger__J072j
```

#### Logo コンポーネント
```typescript
interface LogoProps {
  size: 'small' | 'medium' | 'large';
}

// CSSクラス
// Logo_wrapper__1lmvu
// Logo_medium__llauI
```

### 4.2 レイアウトコンポーネント

```typescript
// CSSクラス
// layout_body__oiEIT
// layout_page__bq_5_
// layout_container__fv90u
// layout_title__h_Jmb
// layout_submit__4Kofk
// layout_accountForm__SXh4Y
// layout_login__JcF1A
// page_wrapper__obI9k
```

---

## 5. API仕様

### 5.1 認証API

#### セッション管理

```
DELETE /api/auth/session
```

**説明:** セッションの削除（ログアウト）

**リクエストヘッダー:**
```
sentry-trace: <trace-id>
baggage: sentry-environment=vercel-production,...
```

**レスポンス:**
- `204 No Content` - 成功

---

### 5.2 Firebase Identity Toolkit API

```
GET https://identitytoolkit.googleapis.com/v1/projects?key=<API_KEY>
```

**説明:** Firebase プロジェクト情報の取得

**レスポンス:**
```json
{
  "projectId": "299026383647",
  "authorizedDomains": [
    "localhost",
    "coefont-corporate.firebaseapp.com",
    "coefont.cloud"
  ]
}
```

---

## 6. 機能要件

### 6.1 認証機能 (AUTH)

| ID | 機能名 | 優先度 | 説明 |
|----|--------|--------|------|
| AUTH-001 | メールログイン | P0 | Email/Password による認証 |
| AUTH-002 | Googleログイン | P1 | Google OAuth 2.0 による認証 |
| AUTH-003 | Appleログイン | P2 | Apple Sign In による認証 |
| AUTH-004 | Facebookログイン | P2 | Facebook OAuth による認証 |
| AUTH-005 | パスワードリセット | P1 | メールによるパスワードリセット |
| AUTH-006 | セッション管理 | P0 | Cookie-based セッション管理 |
| AUTH-007 | ログアウト | P0 | セッション削除によるログアウト |

### 6.2 音声生成機能 (VOICE)

| ID | 機能名 | 優先度 | 説明 |
|----|--------|--------|------|
| VOICE-001 | テキスト入力 | P0 | 音声化するテキストの入力 |
| VOICE-002 | CoeFont選択 | P0 | 使用するAI音声の選択 |
| VOICE-003 | 音声生成 | P0 | テキストからの音声生成 |
| VOICE-004 | 音声再生 | P0 | 生成した音声のプレビュー再生 |
| VOICE-005 | 音声ダウンロード | P1 | 生成した音声のダウンロード |
| VOICE-006 | パラメータ調整 | P2 | 速度・ピッチ・音量の調整 |

### 6.3 フォント管理機能 (FONT)

| ID | 機能名 | 優先度 | 説明 |
|----|--------|--------|------|
| FONT-001 | フォント一覧 | P0 | 利用可能なCoeFontの一覧表示 |
| FONT-002 | フォント検索 | P1 | キーワードによるフォント検索 |
| FONT-003 | フォント試聴 | P1 | サンプル音声の再生 |
| FONT-004 | お気に入り | P2 | フォントのお気に入り登録 |

### 6.4 ユーザー管理機能 (USER)

| ID | 機能名 | 優先度 | 説明 |
|----|--------|--------|------|
| USER-001 | プロフィール表示 | P1 | ユーザー情報の表示 |
| USER-002 | プロフィール編集 | P2 | ユーザー情報の編集 |
| USER-003 | プラン表示 | P1 | 契約プランの表示 |
| USER-004 | 使用量表示 | P1 | API使用量の表示 |

### 6.5 プラン・課金機能 (PLAN)

| ID | 機能名 | 優先度 | 説明 |
|----|--------|--------|------|
| PLAN-001 | プラン一覧 | P1 | 利用可能なプランの一覧 |
| PLAN-002 | プラン比較 | P2 | プラン間の機能比較 |
| PLAN-003 | プラン変更 | P2 | 契約プランの変更 |

---

## 7. 非機能要件

### 7.1 パフォーマンス

| 項目 | 目標値 |
|------|--------|
| 初期ロード時間 | < 3秒 |
| 音声生成時間 | < 5秒 |
| API レスポンス時間 | < 500ms |

### 7.2 可用性

| 項目 | 目標値 |
|------|--------|
| 稼働率 | 99.9% |
| 障害復旧時間 | < 1時間 |

### 7.3 セキュリティ

| 項目 | 要件 |
|------|------|
| 認証 | Firebase Authentication |
| 通信 | HTTPS 必須 |
| CORS | 同一オリジンポリシー |
| XSS対策 | Content Security Policy |

---

## 8. 画面遷移図

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    /home    │────▶│   /login    │────▶│    /sso     │
│  (Landing)  │     │  (認証)     │     │  (SSO)      │
└─────────────┘     └─────────────┘     └──────┬──────┘
                           │                    │
                           ▼                    ▼
                    ┌─────────────┐     ┌─────────────┐
                    │/resetPassword│     │/selectPlan  │
                    │ (PW Reset)   │     │(プラン選択) │
                    └─────────────┘     └──────┬──────┘
                                               │
                    ┌──────────────────────────┴───────┐
                    ▼                                  ▼
            ┌─────────────┐                    ┌─────────────┐
            │ /dashboard  │───────────────────▶│  /studio    │
            │ (ダッシュ)  │                    │ (スタジオ)  │
            └──────┬──────┘                    └─────────────┘
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
┌─────────────┐┌─────────────┐┌─────────────┐
│   /fonts    ││  /mypage    ││ /settings   │
│ (フォント)  ││ (マイページ)││  (設定)     │
└─────────────┘└─────────────┘└─────────────┘
```

---

## 9. データモデル

### 9.1 User

```typescript
interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
  plan: Plan;
  usage: Usage;
}
```

### 9.2 Plan

```typescript
interface Plan {
  id: string;
  name: 'free' | 'lite' | 'standard' | 'business';
  charactersPerMonth: number;
  price: number;
  features: string[];
}
```

### 9.3 CoeFont

```typescript
interface CoeFont {
  id: string;
  name: string;
  description: string;
  category: string;
  sampleAudioUrl: string;
  thumbnailUrl?: string;
  isFavorite?: boolean;
}
```

### 9.4 VoiceGeneration

```typescript
interface VoiceGeneration {
  id: string;
  userId: string;
  coefontId: string;
  text: string;
  audioUrl: string;
  parameters: {
    speed: number;
    pitch: number;
    volume: number;
  };
  createdAt: Date;
  characterCount: number;
}
```

### 9.5 Usage

```typescript
interface Usage {
  userId: string;
  period: string; // YYYY-MM
  charactersUsed: number;
  charactersLimit: number;
  generationCount: number;
}
```

---

## 10. 推奨技術スタック

### 10.1 フロントエンド

```json
{
  "framework": "Next.js 14+ (App Router)",
  "ui": "React 18+",
  "styling": "CSS Modules / Tailwind CSS",
  "state": "Zustand / Jotai",
  "forms": "React Hook Form + Zod",
  "auth": "Firebase Auth",
  "http": "Tanstack Query + Axios"
}
```

### 10.2 バックエンド

```json
{
  "runtime": "Next.js API Routes / Node.js",
  "database": "Firebase Firestore / PostgreSQL",
  "storage": "Firebase Storage / S3",
  "auth": "Firebase Admin SDK",
  "tts": "OpenAI TTS / Google Cloud TTS / Custom"
}
```

### 10.3 インフラ

```json
{
  "hosting": "Vercel / Firebase Hosting",
  "cdn": "Vercel Edge / Cloudflare",
  "monitoring": "Sentry",
  "analytics": "Google Analytics / Mixpanel"
}
```

---

## 11. 実装優先順位

### Phase 1: MVP（1-2週間）

1. [ ] 認証システム（Firebase Auth）
2. [ ] 基本レイアウト（Header, Footer, Layout）
3. [ ] ログイン/ログアウト
4. [ ] ダッシュボード（空）

### Phase 2: 音声生成（2-3週間）

1. [ ] CoeFont一覧ページ
2. [ ] 音声生成スタジオ
3. [ ] 音声再生・ダウンロード
4. [ ] パラメータ調整

### Phase 3: ユーザー機能（1-2週間）

1. [ ] マイページ
2. [ ] 設定ページ
3. [ ] 使用量表示

### Phase 4: 課金機能（1-2週間）

1. [ ] プラン選択
2. [ ] 決済連携（Stripe）
3. [ ] 使用量制限

---

## 12. 付録

### 12.1 検出されたCSSクラス一覧

```
__className_39a0a9
__variable_39a0a9
layout_body__oiEIT
layout_page__bq_5_
layout_container__fv90u
layout_title__h_Jmb
layout_submit__4Kofk
layout_accountForm__SXh4Y
layout_login__JcF1A
page_wrapper__obI9k
Header_header__qBw1J
Header_side__P_aql
Header_headerLeft__LAbYZ
Header_actions__dkylq
Header_right__AJNjV
Footer_footer__CZmev
Footer_langSelect__Qlim_
Footer_label__jo6T7
Button_button__wfofQ
Button_buttonBase__2juIe
Button_lg__ll6C_
Button_fill__X9ePS
Button_block__NrstN
Button_text__HvhbT
Select_trigger__J072j
Logo_wrapper__1lmvu
Logo_medium__llauI
```

### 12.2 スクレイピング成果物

| ファイル | 説明 |
|----------|------|
| `00-summary.json` | スクレイピング結果サマリー |
| `01-auth-result.json` | 認証フロー解析結果 |
| `02-pages.json` | 全ページ構造データ |
| `03-apis.json` | API通信ログ |
| `04-navigation.json` | ナビゲーション構造 |
| `05-errors.json` | エラーログ |
| `06-components.json` | コンポーネント一覧 |
| `html/*.html` | 各ページのHTML |
| `screenshots/*.png` | 各ページのスクリーンショット |

---

**Document End**

---

🤖 Generated with Miyabi Agentic OS
