-- ===== 設定 =====
-- プロジェクトルートの絶対パスを入力してください
local baseDir = ""
-- フレームデータのディレクトリ名（config.json の screen.framesDataDir と合わせる）
local frameDataDirName = "screen_frames_data"
-- 縦サイズ（config.json の screen.sizeY と合わせる）
local frameHeight = 40
-- 横サイズ（config.json の screen.sizeX と合わせる）
local sizeX = 53
-- 各ピクセルに対応するアイテムの長さ
local pixelWidth = 0.1
-- 目標FPS（config.json の frameRate と合わせる）
local targetFps = 30
-- ===============

local frameDataDir = baseDir .. "\\" .. frameDataDirName
local frameFilePath = frameDataDir .. "\\current_frame.txt"
local updateInterval = 1.0 / targetFps

local lastFrameData = {}
local itemMap = {}

function rgbToReaperColor(r, g, b)
    return 0x01000000 + r + g * 256 + b * 65536
end

function initializeTracksAndCache()
    reaper.Undo_BeginBlock()
    if reaper.CountTracks(0) ~= frameHeight then
        while reaper.CountTracks(0) > 0 do
            reaper.DeleteTrack(reaper.GetTrack(0, 0))
        end
        for i = 1, frameHeight do
            reaper.InsertTrackAtIndex(i - 1, false)
        end
    else
        reaper.ShowConsoleMsg("INFO: アイテムをクリア\n")
        clearAllItems()
    end

    reaper.ShowConsoleMsg("INFO: キャッシュを初期化\n")
    lastFrameData = {}
    itemMap = {}
    for y = 1, frameHeight do
        itemMap[y] = {}
        lastFrameData[y] = {}
    end

    reaper.ShowConsoleMsg("INFO: 描画用トラックを初期化\n")
    reaper.Undo_EndBlock("Initialize Screen Drawing Tracks", -1)
    reaper.UpdateArrange()
end

function loadFrameData()
    local file = io.open(frameFilePath, "r")
    if not file then
        return nil
    end
    local content = file:read("*a")
    file:close()

    if not content or content == "" then
        return nil
    end

    local data = {}
    local y = 1
    for line in string.gmatch(content, "([^\n]*)") do
        if y <= frameHeight and line ~= "" and string.len(line) == sizeX * 6 then
            data[y] = {}
            for x = 1, sizeX do
                local hexColor = string.sub(line, (x - 1) * 6 + 1, x * 6)
                local r = tonumber(string.sub(hexColor, 1, 2), 16)
                local g = tonumber(string.sub(hexColor, 3, 4), 16)
                local b = tonumber(string.sub(hexColor, 5, 6), 16)
                if r and g and b then
                    table.insert(data[y], {r, g, b})
                else
                    reaper.ShowConsoleMsg("ERROR: 色の解析に失敗\n")
                    table.insert(data[y], {0, 0, 0})
                end
            end
            y = y + 1
        end
    end
    return data
end

function clearAllItems()
    for i = 0, reaper.CountTracks(0) - 1 do
        local track = reaper.GetTrack(0, i)
        if track then
            while reaper.CountTrackMediaItems(track) > 0 do
                reaper.DeleteTrackMediaItem(track, reaper.GetTrackMediaItem(track, 0))
            end
        end
    end
end

function drawFrame(frameData)
    reaper.Undo_BeginBlock()

    for y = 1, frameHeight do
        local track = reaper.GetTrack(0, y - 1)
        if track then
            local newRowData = frameData[y] or {}

            for x = 1, sizeX do
                local newPixel = newRowData[x] or {0, 0, 0}
                local lastPixel = lastFrameData[y] and lastFrameData[y][x]

                local r, g, b = newPixel[1], newPixel[2], newPixel[3]

                if not itemMap[y][x] then
                    local item = reaper.AddMediaItemToTrack(track)
                    reaper.SetMediaItemInfo_Value(item, "D_POSITION", (x - 1) * pixelWidth)
                    reaper.SetMediaItemInfo_Value(item, "D_LENGTH", pixelWidth)
                    reaper.SetMediaItemInfo_Value(item, "I_CUSTOMCOLOR",
                        rgbToReaperColor(r, g, b))
                    itemMap[y][x] = item
                else
                    if not lastPixel
                        or r ~= lastPixel[1]
                        or g ~= lastPixel[2]
                        or b ~= lastPixel[3] then

                        reaper.SetMediaItemInfo_Value(
                            itemMap[y][x],
                            "I_CUSTOMCOLOR",
                            rgbToReaperColor(r, g, b)
                        )
                    end
                end
            end
        end
    end

    reaper.UpdateArrange()
    reaper.Undo_EndBlock("Update Screen Frame", 0)

    lastFrameData = frameData
end

local isRunning = true
local lastUpdateTime = 0

function processLoop()
    if not isRunning then
        return
    end

    local currentTime = reaper.time_precise()
    if currentTime - lastUpdateTime >= updateInterval then
        local frameData = loadFrameData()
        if frameData then
            drawFrame(frameData)
            lastUpdateTime = currentTime
        end
    end

    if isRunning then
        reaper.defer(processLoop)
    end
end

function on_destroy()
    isRunning = false
    reaper.ShowConsoleMsg("INFO: スクリーン描画スクリプト停止。アイテムをクリアします...\n")
    clearAllItems()
    reaper.UpdateArrange()
    reaper.ShowConsoleMsg("INFO: クリーンアップ完了。\n")
end

function main()
    reaper.ShowConsoleMsg("INFO: スクリーン描画スクリプト開始\n\n")
    initializeTracksAndCache()
    reaper.atexit(on_destroy)
    processLoop()
end

main()
