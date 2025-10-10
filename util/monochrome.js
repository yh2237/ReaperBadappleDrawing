const sharp = require("sharp");
const fs = require("fs");

async function processMonochromeFrame(imagePath, frameNumber, { framesDataDir, sizeX, sizeY }) {
    const frameDataPath = `${framesDataDir}/frame_${frameNumber}.txt`;
    const { data, info } = await sharp(imagePath)
        .resize(sizeX, sizeY)
        .raw()
        .toBuffer({ resolveWithObject: true });

    let frameData = "";
    for (let y = 0; y < info.height; y++) {
        for (let x = 0; x < info.width; x++) {
            const pixelIndex = (y * info.width + x) * info.channels;
            const brightness =
                0.2126 * data[pixelIndex] +
                0.7152 * data[pixelIndex + 1] +
                0.0722 * data[pixelIndex + 2];
            frameData += brightness > 128 ? "0" : "1";
        }
        frameData += "\n";
    }
    fs.writeFileSync(frameDataPath, frameData);
}

module.exports = processMonochromeFrame;