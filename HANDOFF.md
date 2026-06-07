# emlog 引継ぎ書

## プロジェクト概要

個人用の気分・行動記録PWA。コンセプトは「記録は軽く、振り返りは深く」。
感情のパターン分析（出来事×気分の相関）がキラー機能。**永久に個人利用のみ**。

## 技術スタック

- **フロントエンド**: React 18 + Babel（ブラウザトランスパイル、CDN経由）
- **データ**: localStorage のみ（サーバーなし）
- **PWA**: Service Worker（cache-first） + manifest.json
- **デプロイ**: Vercel（ユーザーが設定済み）
- **ブランチ**: `claude/confident-faraday-OEsaA`

ビルドツールなし。HTMLにCDN scriptタグ + `<script type="text/babel" src="prototype/bundle.jsx">` で動作。

## ファイル構成

```
index.html          — CSS全量 + CDN読み込み + SW登録 (464行)
prototype/bundle.jsx — アプリ全ロジック (1017行)
sw.js               — Service Worker, cache-first (45行)
manifest.json       — PWAマニフェスト
icon-192.png / icon-512.png — アプリアイコン
```

## データ構造

### localStorage キー

| キー | 内容 |
|------|------|
| `emlog_proto_records_v1` | 全記録 `{ "2026-06-07": {mood, tags, goodThings, why, photo, updatedAt} }` |
| `emlog_proto_tags_v5` | タグ定義 `[{name, neg, group}]` |
| `emlog_proto_settings_v1` | 設定 `{reminderOn, reminderTime, theme}` |

### 気分 5段階

| 値 | ラベル | 色変数 |
|----|--------|--------|
| 1 | しんどい | `--m1` |
| 2 | いまいち | `--m2` |
| 3 | ふつう | `--m3` |
| 4 | いい | `--m4` |
| 5 | 最高 | `--m5` |

### タグ構造

`{name: string, neg: boolean, group: 'work'|'health'|'hobby'}`

21個のデフォルトタグ:
- 仕事: 出勤, 在宅, 勉強, 早帰り, 残業(neg), ストレス(neg)
- 健康: 朝活, 運動, サウナ, 早寝, 健康食, 寝不足(neg), 体調(neg), 疲れ(neg)
- 趣味: 創作, 読書, ゲーム, お酒, ガジェ, 買物, 掃除

## UI構成

### 2タブ + 設定

```
[Home]  [分析]  [⚙]
```

- **Home**: アコーディオン式記録（気分選択 → タグ+メモがスライドダウン） + 直近5日の記録カード
- **分析**: 期間フィルター付きの各種分析ビュー
- **⚙**: ボトムシート（リマインド、テーマ切替、Export/Import）

### 分析タブのセクション（上から順）

1. 期間フィルター（1W / 1M / 3M / 6M / ALL）
2. 気分の波 — 折れ線チャート + タグオーバーレイ（60日超は週平均に自動ダウンサンプリング）
3. 行動×気分 — やった日 vs やってない日の平均気分の差（バー表示）
4. 気分の分布 — 5段階の横バー
5. 曜日べつ平均 — 7本の縦バー
6. 安定度 — 月別の平均±SD
7. カレンダーヒートマップ — 月表示、気分レベルで色分け
8. 概要タイル — 記録日数 + 平均きぶん

※ 安定度とカレンダーは期間フィルター非連動（全期間ベース）

### テーマ

- **Dark**: OLED黒 + 琥珀アクセント（デフォルト）
- **Warm Light**: クリーム背景 + アンバーアクセント
- CSS変数ベース。`[data-theme="light"]` で切替

## 主要コンポーネント（bundle.jsx）

| コンポーネント | 役割 |
|---|---|
| `App` | ルート。records/tags/settings管理、タブ切替、シート制御 |
| `HomeScreen` | 記録UI（アコーディオン）+ 最近の記録カード |
| `AnalysisScreen` | 全分析ビューの親 |
| `MoodChart` | SVG折れ線チャート。60日超で週平均ダウンサンプリング |
| `MoodDistribution` | 気分分布の横バー |
| `WeekdayBars` | 曜日別平均の縦バー |
| `StabilityView` | 月別 平均±SD |
| `CalendarHeatmap` | 月カレンダー（気分色分け） |
| `PeriodFilter` | 期間切替ピルボタン |
| `DaySheet` | 日別記録の閲覧/新規入力（ボトムシート） |
| `TagManagerSheet` | タグ編集（ボトムシート） |
| `SettingsSheet` | 設定 + Export/Import（ボトムシート） |
| `MoodSelector` | 5段階の気分選択UI |
| `MoodFace` | SVG顔アイコン |

## インポート対応

- **emlog JSON**: そのまま読み込み
- **emlog CSV**: 自前フォーマット
- **Daylio CSV**: UTF-8 BOM対応済み。`DAYLIO_TAG_MAP` で活動名をemlogタグに変換。感情名も日英両対応
- インポート時は既存データを**完全置換**（マージではない）

## 過去に解決した問題

1. **Daylio CSVのBOM**: `charCodeAt(0)===0xFEFF` でスライス
2. **PWAインストール不可**: SW追加 + iOS meta tags + maskable icon
3. **タグv1→v5移行**: `time`→`group`フィールド変換の後方互換
4. **HomeScreenの状態同期**: `records[tk]?.updatedAt` をウォッチするuseEffect追加
5. **チャート崩れ（大量データ）**: 60日超で週平均ダウンサンプリング

## 未実装・改善候補

- アコーディオン閉じアニメのもっさり感（max-height:2000px→0の問題。grid-template-rows: 0fr/1fr に置換可能）
- 未使用CSS（旧4タブ時代のカレンダー/年ビュー等）の掃除
- 分析セクションのカード並べ替え/非表示（ユーザー要望あり、優先度低で据え置き）
- 写真添付機能（コードはあるが現UIから導線なし）
- 通知リマインド（実装済みだがアプリを開いている間のみ動作）

## コミット履歴（新→旧）

```
d45399d fix: import replaces data, chart downsamples for large datasets
3622433 feat: Phase 4 — Dark / Warm Light theme switching
333dc81 feat: Phase 3 — distribution, weekday bars, stability, calendar heatmap
a00a90d feat: Phase 2 — period filter, line chart, ranking
dd26456 fix: sync HomeScreen state when today's record changes externally
12ff65b feat: Phase 1 — 2-tab layout with accordion recording + recent cards
e136db8 feat: remove fake status bar & greeting, move settings to nav
2229a65 feat: add Service Worker for PWA installability + offline
4fe0127 fix: strip UTF-8 BOM from Daylio CSV before parsing
8a4d344 feat: Daylio→emlog tag mapping for seamless import
7b64443 feat: genre-based tags, Daylio CSV import, correlation analysis
```

## ユーザーの設計思想

- スマホ一画面に収まることを重視（スクロール最小限）
- 記録は「軽く」— 気分タップ→保存が最短パス
- 分析は「深く」— 行動×気分の相関が最重要
- 余計なUI要素は排除（ステータスバー風、挨拶文など削除済み）
- 「選ばない＝やってない」（タグ未選択＝その行動をしなかった日として扱う）
