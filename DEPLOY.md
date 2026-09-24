# 無料で公開する手順(Render + Turso)

## 全体像
- **Render**(無料): サーバーを1つ動かし、API とビルド済みフロント画面を両方配信する
- **Turso**(無料): データベース(SQLite互換)をクラウド上に置く。これにより Render を再起動してもデータが消えない

## 1. Turso でデータベースを作る

1. https://turso.tech にアクセスし、無料アカウントを作成
2. ダッシュボードで新しいデータベースを作成(名前は任意、例: `task-manager`)
3. 作成後、以下の2つを控える
   - **Database URL**(`libsql://xxxx.turso.io` のような形式)
   - **Auth Token**(ダッシュボードの「Create Token」から発行)

## 2. GitHub にコードを置く

このプロジェクトはすでにローカルで git 初期化済みです。GitHub 上で新しい空のリポジトリを作成したら、そのURLを教えてください。こちらでリモート追加とプッシュを行います(プッシュ前に必ず内容を確認して進めます)。

## 3. Render でデプロイする

1. https://render.com にアクセスし、無料アカウントを作成(GitHubアカウントでログイン可能)
2. 「New +」→「Web Service」→ 先ほどのGitHubリポジトリを選択
3. 以下の設定を入力

   | 項目 | 値 |
   |---|---|
   | Root Directory | (空欄のまま、リポジトリ直下) |
   | Build Command | `npm --prefix client install && npm --prefix client run build && npm --prefix server install` |
   | Start Command | `npm --prefix server start` |
   | Instance Type | Free |

4. 「Environment」タブで以下の環境変数を追加

   | Key | Value |
   |---|---|
   | `TURSO_DATABASE_URL` | Tursoで控えたDatabase URL |
   | `TURSO_AUTH_TOKEN` | Tursoで控えたAuth Token |
   | `JWT_SECRET` | 下記の生成済みの値を使用 |

   ```
   925a8652a39e95864d549e4e1f82e140171d835b011e9549f6b82b73481c6ad0001b93acd14db5adb4c88203633c1f94
   ```

5. 「Create Web Service」で公開開始。数分でビルドが完了すると、`https://<サービス名>.onrender.com` のようなURLが発行されます。このURLを知っている人なら誰でもアクセスでき、中身はこれまで通りログインが必要です。

## 注意点

- 無料プランは一定時間アクセスがないとスリープし、次のアクセス時に起動まで数十秒かかることがあります。
- 独自ドメインを使いたい場合は、Renderの設定から追加できます(無料プランでも設定は可能ですがドメイン自体の取得は別途有料です)。

## 新規ユーザーの承認について

- 最初に登録したアカウント(二谷様)が自動的に管理者になっています。
- それ以降に登録した人は「承認待ち」状態になり、ログインできません。
- 管理者は「設定」画面の「承認待ちユーザー」から承認・却下できます。
- 各ユーザーが登録する案件・既存企業データは、他のユーザーには一切見えません(完全に個人ごとに分離されています)。
