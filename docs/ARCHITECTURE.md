# CoeFont Clone - アーキテクチャ設計書

**Version:** 1.0.0
**Date:** 2025-11-28

---

## 最上位原理

```
Agent(Intent, World) = lim_{n→∞} (θₙ_{Learn} ⊗ θₙ_{Integrate} ⊗ θₙ_{Execute} ⊗ θₙ_{Allocate} ⊗ θₙ_{Generate} ⊗ θₙ_{Understand})^n(Intent, World)
```

---

## 1. システムアーキテクチャ

### 1.1 全体構成図

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Next.js Frontend                      │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │   │
│  │  │  Pages   │ │Components│ │  Hooks   │ │  Store   │   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API Layer                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Next.js API Routes                      │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │   │
│  │  │  /auth   │ │  /voice  │ │  /fonts  │ │  /user   │   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
└───────┬───────────────────┬───────────────────┬─────────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│    Firebase   │   │   TTS Engine  │   │   Storage     │
│     Auth      │   │  (AI Voice)   │   │   (Audio)     │
└───────────────┘   └───────────────┘   └───────────────┘
```

### 1.2 ディレクトリ構造

```
coefont-copy/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # 認証グループ
│   │   │   ├── login/
│   │   │   ├── sso/
│   │   │   └── reset-password/
│   │   ├── (main)/            # メインアプリグループ
│   │   │   ├── dashboard/
│   │   │   ├── studio/
│   │   │   ├── fonts/
│   │   │   ├── mypage/
│   │   │   └── settings/
│   │   ├── (public)/          # 公開ページグループ
│   │   │   ├── pricing/
│   │   │   ├── help/
│   │   │   ├── terms/
│   │   │   └── privacy/
│   │   ├── api/               # API Routes
│   │   │   ├── auth/
│   │   │   ├── voice/
│   │   │   ├── fonts/
│   │   │   └── user/
│   │   ├── layout.tsx
│   │   └── page.tsx           # /home
│   │
│   ├── components/            # UIコンポーネント
│   │   ├── ui/               # 汎用UI
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   ├── Select/
│   │   │   ├── Modal/
│   │   │   └── Card/
│   │   ├── layout/           # レイアウト
│   │   │   ├── Header/
│   │   │   ├── Footer/
│   │   │   ├── Sidebar/
│   │   │   └── Logo/
│   │   └── features/         # 機能別
│   │       ├── auth/
│   │       ├── voice/
│   │       └── fonts/
│   │
│   ├── hooks/                 # カスタムフック
│   │   ├── useAuth.ts
│   │   ├── useVoice.ts
│   │   └── useFonts.ts
│   │
│   ├── lib/                   # ユーティリティ
│   │   ├── firebase/
│   │   │   ├── config.ts
│   │   │   ├── auth.ts
│   │   │   └── admin.ts
│   │   ├── api/
│   │   │   └── client.ts
│   │   └── utils/
│   │       ├── cn.ts
│   │       └── format.ts
│   │
│   ├── store/                 # 状態管理
│   │   ├── auth.ts
│   │   ├── voice.ts
│   │   └── ui.ts
│   │
│   ├── types/                 # 型定義
│   │   ├── auth.ts
│   │   ├── voice.ts
│   │   ├── font.ts
│   │   └── api.ts
│   │
│   └── styles/                # スタイル
│       ├── globals.css
│       └── variables.css
│
├── public/                    # 静的ファイル
│   ├── images/
│   └── fonts/
│
├── docs/                      # ドキュメント
│   ├── FUNCTIONAL_REQUIREMENTS.md
│   ├── ARCHITECTURE.md
│   └── scraping-results/
│
├── tests/                     # テスト
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .claude/                   # Claude Code設定
├── .github/                   # GitHub Actions
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
└── CLAUDE.md
```

---

## 2. コンポーネント設計

### 2.1 Button コンポーネント

```typescript
// src/components/ui/Button/Button.tsx
import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import styles from './Button.module.css';

const buttonVariants = cva(styles.button, {
  variants: {
    variant: {
      fill: styles.fill,
      text: styles.text,
      outline: styles.outline,
    },
    size: {
      sm: styles.sm,
      md: styles.md,
      lg: styles.lg,
    },
    block: {
      true: styles.block,
    },
  },
  defaultVariants: {
    variant: 'fill',
    size: 'md',
  },
});

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, block, isLoading, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={buttonVariants({ variant, size, block, className })}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? <Spinner /> : children}
      </button>
    );
  }
);
```

### 2.2 Header コンポーネント

```typescript
// src/components/layout/Header/Header.tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { Logo } from '../Logo';
import { Button } from '@/components/ui/Button';
import styles from './Header.module.css';

interface HeaderProps {
  transparent?: boolean;
}

export function Header({ transparent }: HeaderProps) {
  const { user, signOut } = useAuth();

  return (
    <header className={cn(styles.header, transparent && styles.transparent)}>
      <div className={styles.side}>
        <Logo size="medium" />
      </div>

      <div className={styles.actions}>
        {user ? (
          <Button variant="text" onClick={signOut}>
            Logout
          </Button>
        ) : (
          <Button variant="fill" href="/login">
            Login
          </Button>
        )}
      </div>
    </header>
  );
}
```

---

## 3. 認証フロー

### 3.1 Firebase Auth 設定

```typescript
// src/lib/firebase/config.ts
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
```

### 3.2 認証Hook

```typescript
// src/hooks/useAuth.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    // セッションCookieも削除
    await fetch('/api/auth/session', { method: 'DELETE' });
  }, []);

  return {
    user,
    loading,
    signInWithEmail,
    signInWithGoogle,
    signOut,
  };
}
```

### 3.3 セッション API

```typescript
// src/app/api/auth/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// セッション削除
export async function DELETE(request: NextRequest) {
  const cookieStore = cookies();

  // セッションCookieを削除
  cookieStore.delete('session');

  return new NextResponse(null, { status: 204 });
}

// セッション作成
export async function POST(request: NextRequest) {
  const { idToken } = await request.json();

  // Firebase Admin SDKでトークンを検証
  // セッションCookieを設定

  return NextResponse.json({ success: true });
}
```

---

## 4. 音声生成機能

### 4.1 Voice Generation API

```typescript
// src/app/api/voice/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  // 認証確認
  const session = await verifySession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { text, coefontId, parameters } = await request.json();

  // バリデーション
  if (!text || !coefontId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // 使用量チェック
  const usage = await checkUsage(session.userId);
  if (usage.charactersUsed + text.length > usage.charactersLimit) {
    return NextResponse.json({ error: 'Usage limit exceeded' }, { status: 429 });
  }

  // TTS エンジンで音声生成
  const audioBuffer = await generateVoice(text, coefontId, parameters);

  // ストレージに保存
  const audioUrl = await uploadAudio(audioBuffer, session.userId);

  // 使用量を更新
  await updateUsage(session.userId, text.length);

  return NextResponse.json({
    audioUrl,
    characterCount: text.length,
  });
}
```

### 4.2 Voice Generation Hook

```typescript
// src/hooks/useVoice.ts
'use client';

import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';

interface GenerateVoiceParams {
  text: string;
  coefontId: string;
  parameters?: {
    speed?: number;
    pitch?: number;
    volume?: number;
  };
}

export function useVoice() {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const generateMutation = useMutation({
    mutationFn: async (params: GenerateVoiceParams) => {
      const response = await fetch('/api/voice/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error('Voice generation failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setAudioUrl(data.audioUrl);
    },
  });

  const generate = useCallback((params: GenerateVoiceParams) => {
    generateMutation.mutate(params);
  }, [generateMutation]);

  return {
    generate,
    audioUrl,
    isLoading: generateMutation.isPending,
    error: generateMutation.error,
  };
}
```

---

## 5. 状態管理

### 5.1 Zustand Store

```typescript
// src/store/voice.ts
import { create } from 'zustand';

interface VoiceState {
  text: string;
  selectedFontId: string | null;
  parameters: {
    speed: number;
    pitch: number;
    volume: number;
  };
  setText: (text: string) => void;
  setSelectedFont: (fontId: string) => void;
  setParameters: (params: Partial<VoiceState['parameters']>) => void;
  reset: () => void;
}

const initialState = {
  text: '',
  selectedFontId: null,
  parameters: {
    speed: 1.0,
    pitch: 1.0,
    volume: 1.0,
  },
};

export const useVoiceStore = create<VoiceState>((set) => ({
  ...initialState,
  setText: (text) => set({ text }),
  setSelectedFont: (fontId) => set({ selectedFontId: fontId }),
  setParameters: (params) =>
    set((state) => ({
      parameters: { ...state.parameters, ...params },
    })),
  reset: () => set(initialState),
}));
```

---

## 6. 環境変数

```bash
# .env.local

# Firebase (Client)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase (Admin)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# TTS Engine
TTS_API_KEY=
TTS_API_ENDPOINT=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 7. デプロイ設定

### 7.1 Vercel 設定

```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "regions": ["hnd1"],
  "env": {
    "NEXT_PUBLIC_FIREBASE_API_KEY": "@firebase-api-key",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN": "@firebase-auth-domain",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID": "@firebase-project-id"
  }
}
```

### 7.2 GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 8. テスト戦略

### 8.1 ユニットテスト

```typescript
// tests/unit/hooks/useAuth.test.ts
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';

describe('useAuth', () => {
  it('should initialize with null user', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeNull();
  });

  it('should handle sign in with email', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signInWithEmail('test@example.com', 'password');
    });

    expect(result.current.user).not.toBeNull();
  });
});
```

### 8.2 E2Eテスト

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should login with email', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button:has-text("Log in")');

    await expect(page).toHaveURL('/dashboard');
  });
});
```

---

**Document End**

---

🤖 Generated with Miyabi Agentic OS
