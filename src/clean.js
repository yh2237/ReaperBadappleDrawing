const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const configPath = path.join(rootDir, "config.json");

const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

const dirs = [
    config.framesDir || "frames",
    config.monochrome?.framesDataDir,
    config.colour?.framesDataDir,
    config.screen?.framesDataDir,
].filter(Boolean).map((d) => path.resolve(rootDir, d));

let cleaned = 0;

for (const dir of dirs) {
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true });
        console.log(`削除: ${path.relative(rootDir, dir)}/`);
        cleaned++;
    }
}

if (cleaned === 0) {
    console.log("削除対象のディレクトリはありません。");
} else {
    console.log(`\n${cleaned} 個のディレクトリを削除しました。`);
}
