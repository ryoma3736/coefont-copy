# CoeFont Clone - 機能要件定義書 V2

**Version:** 2.0.0
**Date:** 2025-11-28
**Status:** Updated (徹底スクレイピング反映)

---

## 最上位原理

```
Agent(Intent, World) = lim_{n→∞} (θₙ_{Learn} ⊗ θₙ_{Integrate} ⊗ θₙ_{Execute} ⊗ θₙ_{Allocate} ⊗ θₙ_{Generate} ⊗ θₙ_{Understand})^n(Intent, World)
```

---

## 1. スクレイピング結果サマリー V2

| 項目 | V1 | V2 | 変化 |
|------|----|----|------|
| 解析ページ数 | 14 | 16 | +2 |
| 検出API数 | 18 | 86 | +68 |
| 検出フォーム数 | - | 2 | 新規 |
| 検出ボタン数 | - | 29 | 新規 |
| CSSクラス数 | - | 151 | 新規 |
| ナビゲーションリンク数 | 20 | 21 | +1 |

---

## 2. 技術スタック（確定）

### 2.1 フロントエンド

| 技術 | 詳細 | 根拠 |
|------|------|------|
| **フレームワーク** | Next.js 14+ (App Router) | CSS Modules命名規則（`__`ハッシュ）|
| **ランタイム** | React 18+ | 同上 |
| **スタイリング** | CSS Modules | `Button_button__wfofQ` 形式 |
| **ホスティング** | Vercel | `x-vercel-*` ヘッダー |
| **モニタリング** | Sentry | `sentry-*` バゲージ |
| **フォント** | カスタムフォント | `__className_39a0a9` |

### 2.2 バックエンド/認証

| 技術 | 詳細 | 根拠 |
|------|------|------|
| **認証** | Firebase Authentication | `identitytoolkit.googleapis.com` |
| **API Key** | `AIzaSyB6hVR2Wd56drainYJpkO_slko5GMPIrtY` | スクレイピングで検出 |
| **プロジェクトID** | `299026383647` | API応答 |
| **プロバイダー** | Google, Apple, Facebook, Email, SAML SSO | ボタン検出 |
| **セッション** | Cookie-based (`/api/auth/session`) | API検出 |

---

## 3. コンポーネントカタログ（完全版）

### 3.1 Buttonコンポーネント

```typescript
// 検出されたバリエーション
interface ButtonProps {
  variant: 'fill' | 'text' | 'outline';
  size: 'sm' | 'md' | 'lg';
  block?: boolean;
  disabled?: boolean;
}

// CSSクラス構成
const buttonClasses = {
  base: 'Button_button__wfofQ Button_buttonBase__2juIe',
  sizes: {
    lg: 'Button_lg__ll6C_'
  },
  variants: {
    fill: 'Button_fill__X9ePS',
    text: 'Button_text__HvhbT',
    outline: 'Button_outline__kf5T2'
  },
  modifiers: {
    block: 'Button_block__NrstN'
  }
};
```

### 3.2 SSOSubmitコンポーネント（新規発見）

```typescript
// ソーシャルログインボタン
interface SSOSubmitProps {
  provider: 'google' | 'apple' | 'facebook';
  id: string;
}

// CSSクラス
const ssoClasses = {
  base: 'SSOSubmit_btn__ondxC SSOSubmit_btnContents__Hi2Np',
  providers: {
    google: 'SSOSubmit_google__vdaNq',
    apple: 'SSOSubmit_apple__lhH7o',
    facebook: 'SSOSubmit_facebook__mP4jv'
  }
};

// 検出されたボタンID
const ssoButtonIds = {
  google: 'google-submit',
  apple: 'apple-submit',
  facebook: 'facebook-submit'
};
```

### 3.3 Inputコンポーネント

```typescript
// CSSクラス
const inputClasses = {
  wrapper: 'Input_iconWrapper__z0RwR',
  input: 'Input_input__ekO_Z'
};

// 検出されたフィールド
const loginFields = [
  { type: 'email', name: 'email', placeholder: 'メールアドレス' },
  { type: 'password', name: 'password', placeholder: 'パスワード' }
];
```

### 3.4 IconButtonコンポーネント

```typescript
const iconButtonClasses = {
  base: 'IconButton_button__K3OF1'
};
```

### 3.5 Selectコンポーネント

```typescript
const selectClasses = {
  trigger: 'Select_trigger__J072j',
  left: 'Select_left__w1JDL'
};
```

### 3.6 PlanCardコンポーネント（新規発見）

```typescript
// プラン表示カード
interface PlanCardProps {
  name: string;
  description: string;
  price: number;
  features: string[];
  isRecommended?: boolean;
  hasCampaign?: boolean;
}

// CSSクラス
const planCardClasses = {
  card: 'PlanCard_card___5eB_',
  title: 'PlanCard_planTitle__CRgG5',
  name: 'PlanCard_name__ztnjp',
  description: 'PlanCard_description__70XoM',
  descriptionRemark: 'PlanCard_descriptionRemark__Uh_EL',
  divider: 'PlanCard_divider__y2jbq',
  planDescription: 'PlanCard_planDescription__r5mr_',
  priceWrapper: 'PlanCard_priceWrapper___SPYh',
  price: 'PlanCard_price__MO3oU',
  tax: 'PlanCard_tax__wg8jI',
  buttonWrapper: 'PlanCard_planButtonWrapper__Y0yHi',
  featureWrapper: 'PlanCard_featureWrapper__j4Kx7',
  featureList: 'PlanCard_featureList__vPqUO',
  listText: 'PlanCard_listText__jX3qQ',
  priceRemark: 'PlanCard_priceRemark__pnlgc',
  feature: 'PlanCard_feature__QIWYE',
  recommend: 'PlanCard_recoment___Azfx',
  campaign: 'PlanCard_campaign__nsFoD'
};

// コンテナ
const planCardBoxClasses = {
  wrap4: 'PlanCardBox_planCardWrap4__qinR4',
  button: 'PlanCardBox_planButton__bWrhg'
};
```

### 3.7 ComparePlanTableコンポーネント（新規発見）

```typescript
// プラン比較テーブル
const comparePlanTableClasses = {
  title: 'ComparePlanTable_title__30ANr',
  tableWrap: 'ComparePlanTable_tableWrap__SmcVZ',
  table: 'ComparePlanTable_table__J3Xre',
  hideTableHead: 'ComparePlanTable_hideTableHead__AQ5Zh',
  tableRow: 'ComparePlanTable_tableRow__a1PQz',
  tableHeadRow: 'ComparePlanTable_tableHeadRow__uWbJn',
  fixedTableHead: 'ComparePlanTable_fixedTableHead__TdxUF',
  tableRow12: 'ComparePlanTable_tableRow12__3W5O2',
  tableRowItem: 'ComparePlanTable_tableRowItem__STTJR',
  tableTextMain: 'ComparePlanTable_tableTextMain__gDcr1',
  tableTitleText: 'ComparePlanTable_tableTitleText__jnArV',
  planTitleText: 'ComparePlanTable_planTitleText__FysI4',
  tableTextMainBold: 'ComparePlanTable_tableTextMainBold__W69Q_',
  tableBodyRow: 'ComparePlanTable_tableBodyRow__HRtaI',
  tableText: 'ComparePlanTable_tableText__Ws1yN',
  tableTextMainSub: 'ComparePlanTable_tableTextMainSub__DZfcW',
  tableTextMainLink: 'ComparePlanTable_tableTextMainLink__3Qico',
  linkText: 'ComparePlanTable_linkText__Hp00I'
};
```

### 3.8 SampleVoicesコンポーネント（新規発見）

```typescript
// サンプル音声プレイヤー
interface SampleVoiceProps {
  actorInfo: ActorInfo;
  onPlay: () => void;
  onSelect: () => void;
}

const sampleVoicesClasses = {
  title: 'SampleVoices_title__Ap5Zy',
  itemsWrap: 'SampleVoices_itemsWrap__AjjDk',
  listItem: 'SampleVoices_listItem__h8zeI',
  actorInfo: 'SampleVoices_actorInfo__YACmX',
  img: 'SampleVoices_img__voZ06',
  buttons: 'SampleVoices_buttons__CfhkF',
  playButton: 'SampleVoices_playButton__Yu5JA'
};

// 検出されたボタン
const sampleVoiceButtons = [
  { text: 'サンプルを再生', action: 'play' },
  { text: 'この声を使う', action: 'select' }
];
```

### 3.9 CTAButtonコンポーネント（新規発見）

```typescript
const ctaButtonClasses = {
  button: 'CTAButton_button__HZSl0',
  sm: 'CTAButton_sm__Qgkr9',
  fill: 'CTAButton_fill__CMZSn',
  radiusMd: 'CTAButton_radiusMd__ia_mk'
};
```

### 3.10 Vip/LifeSupportコンポーネント（新規発見）

```typescript
// VIPセクション
const vipClasses = {
  wrap: 'Vip_wrap__w4QDS',
  aoni: 'Vip_aoni__East2',
  title: 'Vip_title__wea2E',
  texts: 'Vip_texts__nbUhw',
  iframe: 'Vip_iframe__TrObw'
};

// ライフサポートセクション
const lifeSupportClasses = {
  title: 'LifeSupport_title__bBeSd',
  cardContent: 'LifeSupport_cardContent__TduXg',
  youtubeWrapper: 'LifeSupport_youtubeWrapper__jAyw9',
  youtubeTitle: 'LifeSupport_youtubeTitle__HQWcT',
  aboutText: 'LifeSupport_aboutText__F8mmF',
  toDetailText: 'LifeSupport_toDetailText__pQGjy'
};

// SideBySideContent
const sideBySideClasses = {
  wrap: 'SideBySideContent_wrap__Q91A5',
  textWrap: 'SideBySideContent_textWrap__PnJCN',
  textWrapHeading: 'SideBySideContent_textWrapHeading__HBw8p',
  rightSide: 'SideBySideContent_rightSide__KJ2fa'
};
```

---

## 4. ページ構造（更新版）

### 4.1 完全サイトマップ

```
coefont.cloud/
├── 公開ページ
│   ├── /home                 # ホーム（ログイン/登録）
│   ├── /login                # ログインページ
│   ├── /sso                  # SAML SSOログイン
│   ├── /resetPassword        # パスワードリセット
│   ├── /selectPlan           # プラン選択（重要ページ）
│   ├── /pricing              # 料金プラン
│   ├── /terms                # 利用規約
│   ├── /privacy              # プライバシーポリシー
│   ├── /help                 # ヘルプ
│   └── /contact              # お問い合わせ
│
├── 認証必須ページ
│   ├── /dashboard            # ダッシュボード
│   ├── /studio               # 音声生成スタジオ（メイン機能）
│   ├── /fonts                # CoeFont一覧
│   ├── /mypage               # マイページ
│   └── /settings             # 設定
│
└── エラーページ
    └── /404 (not-found)      # 404エラー
```

### 4.2 selectPlanページ（重要）

**URL:** `/selectPlan?route=%2Fhome`

**検出された要素:**
- リンク数: 34
- ボタン数: 6
- 「サンプルを再生」ボタン x3
- 「この声を使う」ボタン x2

**機能:**
1. プランカード表示（4プラン想定）
2. プラン比較テーブル
3. サンプル音声再生
4. 音声選択・使用開始

---

## 5. 認証機能（詳細）

### 5.1 ログインフォーム

```typescript
// 検出されたフォーム構造
interface LoginForm {
  email: {
    type: 'email';
    name: 'email';
    placeholder: 'メールアドレス';
    required: false; // 注: HTML属性ではfalse
  };
  password: {
    type: 'password';
    name: 'password';
    placeholder: 'パスワード';
    required: false;
  };
  submitButton: {
    id: 'mail_submit';
    text: 'ログイン';
  };
}
```

### 5.2 ソーシャルログイン

| プロバイダー | ボタンID | テキスト |
|--------------|----------|----------|
| Google | `google-submit` | Googleでログイン |
| Apple | `apple-submit` | Appleでログイン |
| Facebook | `facebook-submit` | Facebookでログイン |

### 5.3 SAML SSO

**URL:** `/sso`

```typescript
interface SSOForm {
  // フォーム検出: 1件
  input: {
    // 組織識別子などの入力
  };
  submitButton: {
    text: 'SAML SSO でログイン';
  };
}
```

### 5.4 パスワードリセット

**URL:** `/resetPassword`

```typescript
interface ResetPasswordForm {
  submitButton: {
    text: 'メールを送信';
    disabled: true; // 初期状態
  };
}
```

---

## 6. API仕様（検出済み）

### 6.1 認証API

```yaml
DELETE /api/auth/session:
  description: セッション削除（ログアウト）
  response: 204 No Content

POST /api/stats/atr:
  description: 統計情報送信
```

### 6.2 Firebase API

```yaml
GET /v1/projects:
  host: identitytoolkit.googleapis.com
  params:
    key: AIzaSyB6hVR2Wd56drainYJpkO_slko5GMPIrtY
  response:
    projectId: "299026383647"
    authorizedDomains:
      - localhost
      - coefont-corporate.firebaseapp.com
      - coefont-corporate.web.app
      - coefont.cloud
      - corporate.coefont.cloud
```

### 6.3 監視API

```yaml
POST /monitoring:
  description: Sentry監視データ送信
```

---

## 7. 機能要件（更新版）

### 7.1 認証機能 (AUTH)

| ID | 機能名 | 優先度 | 実装詳細 |
|----|--------|--------|----------|
| AUTH-001 | メールログイン | P0 | `mail_submit`ボタン、email/passwordフィールド |
| AUTH-002 | Googleログイン | P0 | `google-submit`ボタン、Firebase Auth |
| AUTH-003 | Appleログイン | P1 | `apple-submit`ボタン、Firebase Auth |
| AUTH-004 | Facebookログイン | P1 | `facebook-submit`ボタン、Firebase Auth |
| AUTH-005 | SAML SSOログイン | P2 | `/sso`ページ、エンタープライズ向け |
| AUTH-006 | パスワードリセット | P1 | `/resetPassword`、メール送信 |
| AUTH-007 | セッション管理 | P0 | `/api/auth/session` DELETE |
| AUTH-008 | 言語切替 | P2 | `Select_trigger__J072j`、日本語/English |

### 7.2 プラン選択機能 (PLAN)

| ID | 機能名 | 優先度 | 実装詳細 |
|----|--------|--------|----------|
| PLAN-001 | プランカード表示 | P0 | `PlanCard_*`コンポーネント群 |
| PLAN-002 | プラン比較テーブル | P1 | `ComparePlanTable_*`コンポーネント |
| PLAN-003 | サンプル音声再生 | P0 | `SampleVoices_playButton__Yu5JA` |
| PLAN-004 | 音声選択 | P0 | 「この声を使う」ボタン |
| PLAN-005 | VIP/ライフサポート表示 | P2 | `Vip_*`, `LifeSupport_*` |

### 7.3 音声生成機能 (VOICE)

| ID | 機能名 | 優先度 | 実装詳細 |
|----|--------|--------|----------|
| VOICE-001 | テキスト入力 | P0 | スタジオページ（認証必須） |
| VOICE-002 | CoeFont選択 | P0 | `/fonts`ページ |
| VOICE-003 | 音声生成 | P0 | API呼び出し |
| VOICE-004 | 音声再生 | P0 | HTMLAudioElement |
| VOICE-005 | 音声ダウンロード | P1 | Blobダウンロード |
| VOICE-006 | パラメータ調整 | P2 | 速度・ピッチ・音量 |

---

## 8. レイアウトコンポーネント

### 8.1 Headerコンポーネント

```typescript
const headerClasses = {
  header: 'Header_header__qBw1J',
  side: 'Header_side__P_aql',
  headerLeft: 'Header_headerLeft__LAbYZ',
  actions: 'Header_actions__dkylq',
  right: 'Header_right__AJNjV',
  rightButtonWrap: 'Header_rightButtonWrap__6jfiL',
  tabletHiddenContents: 'Header_tabletHiddenContents__VVdEM',
  linkButton: 'Header_linkButton__FCLWB',
  spHiddenContents: 'Header_spHiddenContents__wHcvD',
  welcomeButton: 'Header_welcomeButton__5tpq_'
};
```

### 8.2 Footerコンポーネント

```typescript
const footerClasses = {
  footer: 'Footer_footer__CZmev',
  contentsWrap: 'Footer_contentsWrap__FAhVL',
  top: 'Footer_top__H0sLc',
  topWrapper: 'Footer_topWrapper__wD0ZU',
  logoBoxSns: 'Footer_logoBoxSns__ogTzN',
  linkBox: 'Footer_linkBox___TcxS',
  logoBoxSnsSp: 'Footer_logoBoxSnsSp__7msJm',
  langSelect: 'Footer_langSelect__Qlim_ / Footer_langSelect__uZf7_',
  divider: 'Footer_divider__dU4I7',
  bottom: 'Footer_bottom__o_GvS',
  bottomText: 'Footer_bottomText__82_zH',
  copyright: 'Footer_copyright__SNa_6'
};
```

### 8.3 Layoutコンポーネント

```typescript
const layoutClasses = {
  html: 'layout_html__EHXyd',
  body: 'layout_body__oiEIT',
  page: 'layout_page__bq_5_',
  container: 'layout_container__fv90u',
  title: 'layout_title__h_Jmb',
  submit: 'layout_submit__4Kofk',
  accountForm: 'layout_accountForm__SXh4Y',
  login: 'layout_login__JcF1A'
};
```

### 8.4 Logoコンポーネント

```typescript
const logoClasses = {
  wrapper: 'Logo_wrapper__1lmvu',
  medium: 'Logo_medium__llauI'
};
```

---

## 9. エラーハンドリング

### 9.1 404ページ

```typescript
const notFoundClasses = {
  wrapper: 'not-found_wrapper__gDToA',
  message: 'not-found_message__TkITm',
  btns: 'not-found_btns__SAfDM',
  btn: 'not-found_btn__n7_NK'
};
```

---

## 10. 実装優先順位（更新版）

### Phase 1: 認証・基盤（1週間）

1. [ ] Next.js 14プロジェクトセットアップ
2. [ ] CSS Modulesによるコンポーネント実装
   - Button, Input, Select, IconButton
3. [ ] レイアウトコンポーネント
   - Header, Footer, Layout, Logo
4. [ ] Firebase Auth設定
5. [ ] ログインページ実装
   - メールログイン、ソーシャルログイン

### Phase 2: プラン選択（1週間）

1. [ ] PlanCardコンポーネント
2. [ ] ComparePlanTableコンポーネント
3. [ ] SampleVoicesコンポーネント（音声再生）
4. [ ] selectPlanページ完成

### Phase 3: 音声機能（2週間）

1. [ ] ダッシュボードページ
2. [ ] スタジオページ
3. [ ] フォント一覧ページ
4. [ ] 音声生成API連携
5. [ ] 音声再生・ダウンロード

### Phase 4: ユーザー機能（1週間）

1. [ ] マイページ
2. [ ] 設定ページ
3. [ ] SAML SSOページ
4. [ ] パスワードリセット

---

## 11. 差分レポート（V1 vs V2）

### 新規発見コンポーネント

| コンポーネント | 用途 |
|----------------|------|
| SSOSubmit | ソーシャルログインボタン |
| PlanCard | プラン表示カード |
| PlanCardBox | プランカードコンテナ |
| ComparePlanTable | プラン比較テーブル |
| SampleVoices | サンプル音声プレイヤー |
| CTAButton | CTA用ボタン |
| Vip | VIPセクション |
| LifeSupport | ライフサポートセクション |
| SideBySideContent | 2カラムレイアウト |
| LinkBox | フッターリンクボックス |
| Language | 言語選択メニュー |

### 新規発見機能

1. **SAML SSO**: エンタープライズ向けシングルサインオン
2. **サンプル音声再生**: プラン選択前に音声を試聴可能
3. **「この声を使う」**: 直接音声選択して使用開始
4. **VIP/ライフサポート**: YouTube連携動画コンテンツ

### 修正が必要な記述

1. **認証**: SAML SSOを追加
2. **プラン選択**: 音声試聴機能を追加
3. **コンポーネント**: 大幅に追加（11コンポーネント）

---

**Document End**

---

🤖 Generated with Miyabi Agentic OS
