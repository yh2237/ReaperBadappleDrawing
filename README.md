# ReaperBadappleDrawing

REAPERで空のアイテムを表示させて、映像を流す。

動画ファイルをモノクロ/カラーのフレームデータに変換してREAPER上で再生したり、
デスクトップ画面をリアルタイムでREAPERにミラーリングしたりできる。

## デモ

- [実行例（Youtube）](https://www.youtube.com/watch?v=Cpo9RPN1bbQ)
- [実行例（ニコニコ）](https://www.nicovideo.jp/watch/sm44343220)
- [カラー描画（ニコニコ）](https://www.nicovideo.jp/watch/sm45003861)

## モード

| モード | 説明 | Node.js側 | Luaスクリプト |
|--------|------|-----------|---------------|
| `monochrome` | モノクロ動画再生 | mp4→白黒フレームデータ変換 | `scripts/drawing.lua` |
| `colour` | カラー動画再生 | mp4→カラーフレームデータ変換 | `scripts/colour-drawing.lua` |
| `screen` | リアルタイム画面ミラー | デスクトップキャプチャ | `scripts/screen-drawing.lua` |

## 要件

- [Node.js](https://nodejs.org/)
- [ffmpeg](https://ffmpeg.org/)（`monochrome`/`colour` モードで必要。PATHに通しておくこと）
- [REAPER](https://www.reaper.fm/)

## セットアップ

```bash
npm install
```

## 使い方

### npm scripts

| コマンド | 説明 |
|----------|------|
| `npm start` | `config.json` の `processMode` に従って実行 |
| `npm run monochrome` | モノクロモードで動画→フレーム変換 |
| `npm run colour` | カラーモードで動画→フレーム変換 |
| `npm run screen` | リアルタイムスクリーンキャプチャ開始 |
| `npm run displays` | 利用可能なディスプレイ一覧を表示 |
| `npm run clean` | 生成済みフレームデータを全削除 |

### 付属データを使う場合

1. `data/badApple_data.zip`（モノクロ）または `data/colour-UgokuUgoku_data.zip`（カラー）を解凍
2. `scripts/` 内の対応するLuaスクリプトを開き、先頭の `baseDir` と `frameDataDirName` を自分の環境に合わせて変更
3. REAPERで「アクション → アクションリストを開く → 新規アクション → ReaScriptを読み込み」からLuaスクリプトを読み込んで実行

### mp4ファイルを変換する場合

1. `config.json` を編集:
   - `videoPath`: 動画ファイルのパス
   - 各モードの `sizeX`, `sizeY` で解像度を指定（33x25 推奨）

2. フレームデータを生成:
   ```bash
   npm run monochrome   # モノクロの場合
   npm run colour       # カラーの場合
   ```

3. `scripts/` 内の対応するLuaスクリプトの先頭設定を編集して、REAPERで実行

### リアルタイムスクリーンキャプチャ

1. 使用するディスプレイIDを確認:
   ```bash
   npm run displays
   ```

2. `config.json` を編集:
   - `screen.displayId`: 上で確認したディスプレイID（`null` でデフォルト）
   - `screen.sizeX`, `screen.sizeY` で解像度を指定

3. キャプチャを開始:
   ```bash
   npm run screen
   ```

4. REAPERで `scripts/screen-drawing.lua` を実行（先頭の設定を自分の環境に合わせること）

5. `Ctrl+C` でキャプチャを停止

### 生成データの削除

```bash
npm run clean
```

`frames/`, `frames_data/`, `colour-frames_data/`, `screen_frames_data/` を一括削除します。

## config.json

```json
{
  "videoPath": "input.mp4",
  "framesDir": "frames",
  "frameRate": 30,
  "processMode": "monochrome",
  "monochrome": {
    "framesDataDir": "frames_data",
    "sizeX": 33,
    "sizeY": 25
  },
  "colour": {
    "framesDataDir": "colour-frames_data",
    "sizeX": 33,
    "sizeY": 25
  },
  "screen": {
    "framesDataDir": "screen_frames_data",
    "sizeX": 53,
    "sizeY": 40,
    "displayId": null
  }
}
```

| キー | 説明 |
|------|------|
| `videoPath` | 入力動画ファイルのパス |
| `framesDir` | ffmpegが抽出したフレーム画像の保存先 |
| `frameRate` | フレームレート（fps） |
| `processMode` | 処理モード: `"monochrome"`, `"colour"`, `"screen"` |
| `*.framesDataDir` | 変換済みテキストデータの保存先 |
| `*.sizeX / sizeY` | 解像度（ピクセル数 = REAPERのアイテム数） |
| `screen.displayId` | キャプチャ対象のディスプレイID（`npm run displays` で確認） |

## ファイル構成

```
├── config.json               # 設定ファイル
├── src/
│   ├── index.js              # メインスクリプト（3モード対応）
│   ├── get.js                # ディスプレイ一覧表示
│   ├── clean.js              # 生成データ削除
│   └── util/
│       ├── monochrome.js     # モノクロフレーム変換
│       └── colour.js         # カラーフレーム変換
├── scripts/
│   ├── drawing.lua           # REAPER: モノクロ再生
│   ├── colour-drawing.lua    # REAPER: カラー再生
│   └── screen-drawing.lua    # REAPER: リアルタイムミラー
└── data/
    ├── badApple_data.zip     # サンプルデータ（モノクロ）
    └── colour-UgokuUgoku_data.zip  # サンプルデータ（カラー）
```

## ライセンス

[MITライセンス](./LICENSE)