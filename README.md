# Seminar Design Compass

`Seminar Design Compass` は、開催情報、対象者、メッセージ、時間配分、ディスカッション、講師役割、台本、チェック、出力文面を一体で設計する日本語UIの静的SPAです。

MVPでは外部API、サーバー、ログイン、DBを使いません。入力データはブラウザの `localStorage` と、ユーザーが保存するJSONファイルだけに保持します。

## 実行方法

Windowsでは、次のファイルをダブルクリックすると起動できます。

```txt
start-seminar-design-compass.bat
```

初回だけ依存関係のセットアップを行い、その後ブラウザで `http://127.0.0.1:5173/` を開きます。

同じWi-Fi上のスマホ・タブレットから開きたい場合は、起動時の黒い画面に表示される `Phone/tablet URL on the same Wi-Fi` のURLをスマホ側のブラウザで開いてください。Windows Firewallの確認が出た場合は、プライベートネットワークでのアクセスを許可します。

```bash
npm install
npm run dev
```

## ビルド方法

```bash
npm run build
```

## テスト方法

```bash
npm run test
```

## GitHub Pagesでの配信方法

このフォルダは、GitHub Pagesでそのまま公開できる独立リポジトリとして切り出しています。

想定リポジトリ名：

```txt
seminar-design-compass
```

公開URLの例：

```txt
https://takatrp.github.io/seminar-design-compass/
```

手順：

1. GitHubで `seminar-design-compass` リポジトリを作成します。
2. このフォルダの中身だけをそのリポジトリへpushします。
3. GitHubの `Settings > Pages` で `GitHub Actions` を選びます。
4. `main` ブランチへpushすると `.github/workflows/pages.yml` が `npm ci`、`npm run test`、`npm run build` を実行し、`dist` をPagesへ公開します。

Viteの `base` は相対パスにしているため、GitHub Pagesのサブディレクトリ配信でも動作します。

## データ保存方針

- 自動保存キー：`seminar-design-compass:v1`
- JSON保存形式：`SeminarPlan` をそのまま保存
- 初期ファイル名：`seminar-design-plan-YYYYMMDD-HHmm.json`
- 外部送信なし

## context packの追加方法

1. `src/contextPacks` に新しいpackファイルを追加します。
2. `ContextPack` 型に合わせて、柱、役割、テンプレート、推奨語彙、リスク語彙を定義します。
3. `src/contextPacks/index.ts` の `contextPacks` に追加します。
4. 汎用ロジックへ固有ルールを直接書かず、必要なチェックは `src/domain/scoring.ts` からpack IDで分岐できる形にします。

## TKC context pack利用上の注意

TKC向けの柱、テンプレート、推奨語彙、リスク語彙は `src/contextPacks/tkc.ts` に閉じ込めています。画面や汎用ドメインロジックに固定講師名、固定時間、固有の進行名を直書きしないでください。

公開リポジトリや初期データには、機密資料、内部資料画像、個別顧問先情報、APIキー、非公開URLを入れないでください。
