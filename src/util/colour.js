const sharp = require("sharp");
const fs = require("fs");

/**
 * @param {string} imagePath
 * @param {number} frameNumber
 * @param {object} options
 * @param {string} options.framesDataDir
 * @param {number} options.sizeX
 * @param {number} options.sizeY
 */

async function processColourFrame(imagePath, frameNumber, { framesDataDir, sizeX, sizeY }) {
    const frameDataPath = `${framesDataDir}/frame_${frameNumber}.txt`;
    const { data, info } = await sharp(imagePath)
        .resize(sizeX, sizeY)
        .raw()
        .toBuffer({ resolveWithObject: true });

    let frameData = "";
    for (let y = 0; y < info.height; y++) {
        for (let x = 0; x < info.width; x++) {
            const pixelIndex = (y * info.width + x) * info.channels;
            const r = data[pixelIndex];
            const g = data[pixelIndex + 1];
            const b = data[pixelIndex + 2];
            const hexColor = r.toString(16).padStart(2, '0') +
                g.toString(16).padStart(2, '0') +
                b.toString(16).padStart(2, '0');
            frameData += hexColor;
        }
        frameData += "\n";
    }
    fs.writeFileSync(frameDataPath, frameData);
}

module.exports = processColourFrame;