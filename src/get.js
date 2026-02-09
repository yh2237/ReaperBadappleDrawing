const screenshot = require("screenshot-desktop");

(async () => {
    const displays = await screenshot.listDisplays();
    console.log("利用可能なディスプレイ:");
    console.log("");
    displays.forEach((d, i) => {
        console.log(`  [${i}] id: ${d.id}`);
        if (d.name) console.log(`      name: ${d.name}`);
        console.log("");
    });
    console.log("config.json の screen.displayId に id の値を設定してください。");
    console.log('  例: "displayId": "\\\\\\\\.\\\\DISPLAY1"');
})();
