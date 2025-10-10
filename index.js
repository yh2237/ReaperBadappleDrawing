const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const yaml = require('js-yaml');
const processMonochromeFrame = require("./util/monochrome");
const processColourFrame = require("./util/colour");

const config = yaml.load(fs.readFileSync('config/config.yml', 'utf8'));
const { videoPath, framesDir, processMode, frameRate, sizeX, sizeY, pixelWidth } = config;
const modeConfig = config[processMode];

if (!modeConfig) {
    console.error("無効な処理モードが指定されました。'monochrome' または 'color' を指定してください。");
    process.exit(1);
}

const framesDataDir = modeConfig.framesDataDir;
const processFrame = processMode === 'color' ? processColourFrame : processMonochromeFrame;
const processConfig = { framesDataDir, sizeX, sizeY };

if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir);
if (!fs.existsSync(framesDataDir)) fs.mkdirSync(framesDataDir, { recursive: true });

ffmpeg.ffprobe(videoPath, (err, metadata) => {
    if (err) {
        console.error("ffprobeエラー:", err);
        return;
    }
});

ffmpeg(videoPath)
    .output(`${framesDir}/frame_%04d.png`)
    .outputOptions([`-vf fps=${frameRate}`])
    .on("end", async () => {
        console.log("フレームの抽出が完了しました！");

        const frameFiles = fs.readdirSync(framesDir).sort();

        for (let i = 0; i < frameFiles.length; i++) {
            const file = frameFiles[i];
            const frameNumber = i + 1;
            try {
                await processFrame(`${framesDir}/${file}`, frameNumber, processConfig);
                console.log(`フレーム${frameNumber}を処理`);
            } catch (error) {
                console.error(`フレーム処理エラー${frameNumber}:`, error);
            }
        }

        console.log("すべてのフレームデータが生成されました！");
        
        generateLuaScript(frameFiles.length);
    })
    .on("error", (err) => {
        console.error("FFmpeg エラー:", err);
    })
    .run();

function generateLuaScript(totalFrames) {
    const luaScriptName = processMode === 'color' ? 'colour-drawing.lua' : 'drawing.lua';
    const templatePath = `bin/${luaScriptName}`;
    const outputPath = luaScriptName;
    
    try {
        let template = fs.readFileSync(templatePath, 'utf8');

        const luaFrameDataDir = `./${framesDataDir}`;
        
        template = template.replace(/(local frameDataDir = ).*/, `$1"${luaFrameDataDir}" -- フレームデータのディレクトリのパス`);
        template = template.replace(/(local frameHeight = ).*/, `$1${sizeY} -- 縦サイズ（config/config.ymlのサイズと同じにする）`);
        template = template.replace(/(local totalFrames = ).*/, `$1${totalFrames} -- 何フレーム分描画するのか（テキストファイルの個数分を書く）`);
        template = template.replace(/(local pixelWidth = ).*/, `$1${pixelWidth} -- 各ピクセルに対応するアイテムの長さ`);

        if (processMode === 'color') {
            template = template.replace(/(local sizeX = ).*/, `$1${sizeX} -- 横サイズ（config/config.ymlのサイズと同じにする）`);
        }

        fs.writeFileSync(outputPath, template);
        console.log(`Luaスクリプト ${outputPath} をプロジェクトルートに生成しました。`);

    } catch (error) {
        console.error(`Luaスクリプトの生成エラー: ${error}`);
    }
}