# emlog — prototype

気分ロギング＆ふりかえりジャーナル（PWA）のUIプロトタイプ。
琥珀（amber）テーマ／OLEDブラック＋すりガラス／表情つきの気分スケール。

- **ビルド不要。** 静的ファイルだけで動きます（React と Babel は CDN から読み込み、ブラウザ内でJSXを変換）。
- データはブラウザの `localStorage` に保存されます（初回はサンプルデータが入ります）。

## ファイル構成

```
index.html              … アプリ本体（マークアップ＋全CSS）
prototype/bundle.jsx    … 画面ロジック（Log / Calendar / Insights / Export ほか）
manifest.json           … PWA マニフェスト
icon-192.png / icon-512.png … アプリアイコン
```

## ローカルで開く

`index.html` をブラウザで開くだけ。
（`file://` でも動きますが、簡易サーバ経由が確実です）

```bash
python3 -m http.server 8000
# → http://localhost:8000 を開く
```

## 公開（GitHub Pages）

リポジトリの **Settings → Pages → Build and deployment** で
Source を「Deploy from a branch」、Branch を `main` / `/(root)` に設定すれば、
`https://<あなた>.github.io/<リポジトリ名>/` で公開されます。
