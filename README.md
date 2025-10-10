# ReaperBadappleDrawing

動画をREAPERのタイムライン上に描画するためのツール

別にBadAppleの描画専用ツールではないです（

実行例

<video class="demo" src="https://github.com/user-attachments/assets/0837c8d3-1462-4c09-a26c-a0b067f4d4e2"　width="600"></video>

[カラー実行例（ニコニコ動画）](https://www.nicovideo.jp/watch/sm45003861)

## 動作要件

- [REAPER](https://www.reaper.fm/): これは当たり前
- [Node.js](https://nodejs.org/): v14以上を推奨
- [ffmpeg](https://ffmpeg.org/): PATHが通っている必要があります

## インストール

```bash
git clone https://github.com/yh2237/ReaperBadappleDrawing.git
cd ReaperBadappleDrawing
npm install
```

## 使い方

1. 好きな動画ファイルを用意
2. `config/config.yml` をお好みで編集

    ```yaml
    videoPath: "input.mp4"      # 入力する動画ファイルのパス
    processMode: "monochrome"  # 描画モード ("monochrome" または "color")
    frameRate: 30              # 抽出するフレームレート
    sizeX: 33                  # 描画の横幅（ピクセル数）
    sizeY: 25                  # 描画の縦幅（トラック数）
    pixelWidth: 0.1            # 1ピクセルあたりのアイテムの長さ（秒）
    monochrome:
      framesDataDir: "frames_data" # モノクロのフレームデータを保存するディレクトリ
    color:
      framesDataDir: "colour-frames_data" # カラーのフレームデータを保存するディレクトリ
    ```

    直接 `bin/` からスクリプトをコピーしてきて中身を編集することですでにあるフレームデータも使用可能。 `data/` にフレームデータのサンプルあります

3. スクリプトを実行

    ```bash
    node index.js
    ```

    これにより、フレームデータの生成と、プロジェクトのルートに実行用のスクリプトが作成されます

### REAPERでの実行

[日本語化パッチ（森）](https://github.com/Phroneris/ReaperJPN-Phroneris)を導入している場合

1.  `アクション` > `アクションリストを開く` > `新規アクション` > `ReaScriptを読み込み` から生成されたLuaスクリプト読み込み
2.  読みこんだスクリプトを実行

## 設定の詳細

| キー | 説明 | 例 |
| :--- | :--- | :--- |
| `videoPath` | 入力する動画ファイルのパス | `"input.mp4"` |
| `framesDir` | 抽出したフレーム画像（PNG）を保存するディレクトリ | `"frames"` |
| `processMode` | 処理モードを選択します`"monochrome"`（白黒）または`"color"`（カラー） | `"monochrome"` |
| `frameRate` | 動画から抽出する1秒あたりのフレーム数 | `30` |
| `sizeX` | 描画領域の横幅（ピクセル単位） | `33` |
| `sizeY` | 描画領域の縦幅（トラック数） | `25` |
| `pixelWidth` | 描画される各ピクセルの長さ（秒） | `0.1` |
| `monochrome` | モノクロモード時の設定 | |
| `monochrome.framesDataDir` | モノクロ用のフレームデータを保存するディレクトリ | `"frames_data"` |
| `color` | カラーモード時の設定 | |
| `color.framesDataDir` | カラー用のフレームデータを保存するディレクトリ | `"colour-frames_data"` |


## ライセンス

[MIT License](LICENSE) で公開してます