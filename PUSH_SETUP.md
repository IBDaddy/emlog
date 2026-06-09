# サーバー通知（Web Push）セットアップ手順

アプリを閉じていても毎晩 21:00（日本時間）にリマインド通知が届くようにする手順です。
コードはすべてリポジトリに入っているので、やることは **Vercel の画面で環境変数を設定するだけ** です。

## 仕組みのおさらい

```
Vercel Cron（毎日 12:00 UTC = 21:00 JST）
  → /api/remind が実行される
  → Google のプッシュサーバーへ「起こして」と送る
  → Pixel の Service Worker が起きる
  → 今日まだ記録していなければ通知を表示（記録済みなら何も出ない）
```

## 手順

### 1. デプロイする

このブランチを main にマージ（または push）すると Vercel が自動でデプロイします。

### 2. Vercel に環境変数を設定する

Vercel のダッシュボード → プロジェクトを開く → **Settings → Environment Variables** で
以下の3つを追加します（Environment は Production だけで OK）。

| Name | Value |
|---|---|
| `VAPID_PUBLIC_KEY` | `BHHJ6cEpxJe9IfMeaEg17K5eT6NjXRFBj1vrpO_FsbzxXCFJce7sit6LUWTfSLHKAd1Nb-vEfvbj9qaL4GtuwsE` |
| `VAPID_PRIVATE_KEY` | （秘密鍵。チャットで渡した43文字の文字列。**この値は誰にも見せない**） |
| `VAPID_SUBJECT` | `mailto:あなたのメールアドレス` |

> 秘密鍵をなくした場合は鍵ペアを作り直せば OK（その場合は公開鍵も
> `prototype/bundle.jsx` の `VAPID_PUBLIC_KEY` を書き換えて、端末で再登録が必要）。

### 3. Pixel で購読を登録する

1. Pixel で emlog を開く（一度アプリを完全に閉じて開き直すと新しい Service Worker に更新される）
2. 設定（歯車）→「**サーバー通知**」の「**登録**」を押す
3. 通知の許可を求められたら「許可」
4. 「**購読情報をコピー**」を押す

### 4. 購読情報を Vercel に貼り付ける

1. コピーした文字列（`{"endpoint":"https://fcm.googleapis.com/...フルJSON}`）を
   PC に送る（自分宛てメールや Keep などで）
2. Vercel の Environment Variables に追加：

| Name | Value |
|---|---|
| `PUSH_SUBSCRIPTION` | （コピーした JSON をそのまま貼り付け） |

3. **環境変数を変えたら再デプロイが必要**です。
   Deployments タブ → 最新のデプロイの「…」→ **Redeploy** を押す。

### 5. テストする

ブラウザで `https://あなたのアプリのURL/api/remind` を開くと、その場で1回プッシュが送られます。

- `"ok": true` と表示され、数秒以内に Pixel に通知が来れば成功
- **今日すでに記録している場合は通知が出ません**（それが正しい動き）。
  翌日の記録前に試すか、動作確認したいときは今日の記録を一度消してから試してください
- `"needsResubscribe": true` が出たら、手順3からやり直し（購読が無効になっています）

### 6. 完了

以降は毎日 21:00（JST）に自動で実行されます。
**その日すでに記録していれば通知は来ません**（Daylio と同じ挙動）。

## トラブルシューティング

| 症状 | 原因と対処 |
|---|---|
| `/api/remind` が `missing env vars` | 環境変数が未設定 or 再デプロイし忘れ |
| `pushStatus: 410` | 購読が失効。手順3〜4をやり直す |
| 通知が来ない | 今日すでに記録済みでは？／Android の設定でアプリの通知が許可されているか確認 |
| 時刻を変えたい | `vercel.json` の `schedule` を変更（UTC表記。21時JST = `0 12 * * *`、22時JST = `0 13 * * *`） |

## 注意

- 無料プランの Vercel Cron は **1日1回まで**。時刻の変更は可能、回数は増やせません
- 機種変更やアプリ再インストール時は手順3〜4の再登録が必要です
