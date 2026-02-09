const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const rootDir = path.resolve(__dirname, "..");
const configPath = path.join(rootDir, "config.json");

const configData = fs.readFileSync(configPath, "utf-8");
const config = JSON.parse(configData);

const validModes = ["monochrome", "colour", "screen"];
const argMode = process.argv[2];
const processMode = argMode || config.processMode;

if (!validModes.includes(processMode)) {
    console.error(`エラー: processMode が無効です: "${processMode}"`);
    console.error(`  使い方: node src/index.js [${validModes.join(" | ")}]`);
    console.error("  引数を省略すると config.json の processMode を使用します。");
    process.exit(1);
}

const modeConfig = config[processMode];
if (!modeConfig) {
    console.error(`エラー: config.json に "${processMode}" の設定が見つかりません。`);
    process.exit(1);
}


if (processMode === "screen") {
    runScreenMode(modeConfig);
} else {
    runVideoMode(processMode, modeConfig);
}


async function runVideoMode(mode, modeConfig) {
    const ffmpeg = require("fluent-ffmpeg");

    const videoPath = path.resolve(rootDir, config.videoPath);
    if (!videoPath || !fs.existsSync(videoPath)) {
        console.error(`エラー: 動画ファイルが見つかりません: "${config.videoPath}"`);
        console.error("  config.json の videoPath を確認してください。");
        process.exit(1);
    }

    const framesDir = path.resolve(rootDir, config.framesDir || "frames");
    const framesDataDir = path.resolve(rootDir, modeConfig.framesDataDir);
    const { sizeX, sizeY } = modeConfig;
    const frameRate = config.frameRate || 30;

    const processFrame = mode === "monochrome"
        ? require("./util/monochrome")
        : require("./util/colour");

    if (!fs.existsSync(framesDir)) {
        fs.mkdirSync(framesDir, { recursive: true });
    }
    if (!fs.existsSync(framesDataDir)) {
        fs.mkdirSync(framesDataDir, { recursive: true });
    }

    console.log(`モード: ${mode}`);
    console.log(`動画: ${videoPath}`);
    console.log(`フレームレート: ${frameRate}fps`);
    console.log(`解像度: ${sizeX}x${sizeY}`);
    console.log(`フレーム画像出力先: ${framesDir}/`);
    console.log(`フレームデータ出力先: ${framesDataDir}/`);
    console.log("");
    console.log("Step 1/2: 動画からフレーム画像を抽出中...");

    await new Promise((resolve, reject) => {
        ffmpeg(videoPath)
            .outputOptions([`-r ${frameRate}`, "-q:v 2"])
            .output(path.join(framesDir, "frame_%d.png"))
            .on("start", (cmd) => {
                console.log(`  ffmpeg コマンド: ${cmd}`);
            })
            .on("progress", (progress) => {
                if (progress.frames) {
                    process.stdout.write(`\r  抽出済み: ${progress.frames} フレーム`);
                }
            })
            .on("end", () => {
                console.log("\n  フレーム画像の抽出が完了しました。");
                resolve();
            })
            .on("error", (err) => {
                console.error("\n  ffmpeg エラー:", err.message);
                reject(err);
            })
            .run();
    });

    console.log("Step 2/2: フレーム画像をテキストデータに変換中...");

    const frameFiles = fs.readdirSync(framesDir)
        .filter((f) => f.startsWith("frame_") && f.endsWith(".png"))
        .sort((a, b) => {
            const numA = parseInt(a.match(/frame_(\d+)/)[1], 10);
            const numB = parseInt(b.match(/frame_(\d+)/)[1], 10);
            return numA - numB;
        });

    const totalFrames = frameFiles.length;
    console.log(`  合計フレーム数: ${totalFrames}`);

    for (let i = 0; i < frameFiles.length; i++) {
        const frameFile = frameFiles[i];
        const frameNumber = parseInt(frameFile.match(/frame_(\d+)/)[1], 10);
        const imagePath = path.join(framesDir, frameFile);

        await processFrame(imagePath, frameNumber, { framesDataDir, sizeX, sizeY });

        if ((i + 1) % 100 === 0 || i + 1 === totalFrames) {
            process.stdout.write(`\r  変換済み: ${i + 1}/${totalFrames} フレーム`);
        }
    }

    console.log("\n\n完了しました！");
    console.log(`  フレームデータ: ${framesDataDir}/ (${totalFrames} ファイル)`);
    console.log("  対応する Lua スクリプトでこのデータを使用してください。");
}


function runScreenMode(modeConfig) {
    const screenshot = require("screenshot-desktop");

    const framesDataDir = path.resolve(rootDir, modeConfig.framesDataDir);
    const { sizeX, sizeY } = modeConfig;
    const frameRate = config.frameRate || 30;
    const displayId = config.screen.displayId || null;
    const frameDataPath = path.join(framesDataDir, "current_frame.txt");

    if (!fs.existsSync(framesDataDir)) {
        fs.mkdirSync(framesDataDir, { recursive: true });
    }

    let isRunning = true;
    let timerId = null;

    async function captureAndProcessFrame() {
        try {
            const screenshotOptions = { format: "png" };
            if (displayId) {
                screenshotOptions.screen = displayId;
            }

            const buffer = await screenshot(screenshotOptions);

            const { data, info } = await sharp(buffer)
                .resize(sizeX, sizeY, {
                    fit: "contain",
                    background: { r: 0, g: 0, b: 0, alpha: 1 },
                })
                .raw()
                .toBuffer({ resolveWithObject: true });

            const lines = new Array(info.height);
            for (let y = 0; y < info.height; y++) {
                const line = new Array(info.width);
                for (let x = 0; x < info.width; x++) {
                    const pixelIndex = (y * info.width + x) * info.channels;
                    const r = data[pixelIndex];
                    const g = data[pixelIndex + 1];
                    const b = data[pixelIndex + 2];
                    line[x] =
                        r.toString(16).padStart(2, "0") +
                        g.toString(16).padStart(2, "0") +
                        b.toString(16).padStart(2, "0");
                }
                lines[y] = line.join("");
            }
            const frameData = lines.join("\n");

            fs.writeFile(frameDataPath, frameData, (err) => {
                if (err) {
                    console.error("フレームデータの書き込みエラー:", err);
                }
            });
        } catch (error) {
            console.error("フレームのキャプチャまたは処理中にエラーが発生しました:", error);
        }
    }

    console.log("モード: screen (リアルタイムスクリーンキャプチャ)");
    console.log(`フレームレート: ${frameRate}fps`);
    console.log(`解像度: ${sizeX}x${sizeY}`);
    console.log(`ディスプレイ: ${displayId || "(デフォルト)"}`);
    console.log(`フレームデータ: ${frameDataPath}`);
    console.log("Ctrl+C で停止します。");
    console.log("");

    const interval = 1000 / frameRate;

    const mainLoop = async () => {
        if (!isRunning) return;
        await captureAndProcessFrame();
        if (isRunning) {
            timerId = setTimeout(mainLoop, interval);
        }
    };

    mainLoop();

    process.on("SIGINT", () => {
        console.log("\nキャプチャを停止しています...");
        isRunning = false;
        if (timerId) {
            clearTimeout(timerId);
        }
        setTimeout(() => {
            try {
                if (fs.existsSync(frameDataPath)) {
                    console.log(`フレームデータファイル '${frameDataPath}' を削除します...`);
                    fs.unlinkSync(frameDataPath);
                }
                if (fs.existsSync(framesDataDir)) {
                    if (fs.readdirSync(framesDataDir).length === 0) {
                        fs.rmdirSync(framesDataDir);
                    }
                }
                console.log("クリーンアップ完了。");
            } catch (e) {
                console.error("クリーンアップ中にエラー:", e);
            } finally {
                process.exit(0);
            }
        }, 250);
    });
}
