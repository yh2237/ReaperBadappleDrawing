local frameDataDir = "./frames_data" -- フレームデータのディレクトリのパス
local frameHeight = 25 -- 縦サイズ（config/config.ymlのサイズと同じにする）
local totalFrames = 4709 -- 何フレーム分描画するのか（テキストファイルの個数分を書く）
local pixelWidth = 0.1 -- 各ピクセルに対応するアイテムの長さ

function initializeTracks()
    while reaper.CountTracks(0) > 0 do
        local track = reaper.GetTrack(0, 0)
        reaper.DeleteTrack(track)
    end

    for i = 1, frameHeight do
        reaper.InsertTrackAtIndex(i - 1, false)
    end
end

function loadFrameData(frameNumber)
    local frameFilePath = frameDataDir .. "\\frame_" .. frameNumber .. ".txt"

    reaper.ShowConsoleMsg("フレームを処理" .. frameFilePath .. "\n")

    local file = io.open(frameFilePath, "r")
    if not file then
        reaper.ShowConsoleMsg("エラー: フレームファイルを読み込めません: " .. frameFilePath .. "\n")
        return nil
    end

    local data = {}
    local y = 1
    for line in file:lines() do
        table.insert(data, line)
        y = y + 1
    end
    file:close()

    if y - 1 ~= frameHeight then
        reaper.ShowConsoleMsg(string.format("警告: フレーム %d の行数が一致しません。%d 行が正常値ですが、%d 行でした。\n",
            frameNumber, frameHeight, y - 1))
    end

    return data
end

function processTrack(frameData, y)
    local track = reaper.GetTrack(0, y - 1)
    if not track then
        return
    end

    local line = frameData[y]
    if not line then
        return
    end

    local startX, endX = 1, 1
    while true do
        startX, endX = string.find(line, "1+", endX)
        if not startX then
            break
        end

        local startPos = (startX - 1) * pixelWidth
        local itemLength = (endX - startX + 1) * pixelWidth

        local item = reaper.AddMediaItemToTrack(track)
        if item then
            reaper.SetMediaItemInfo_Value(item, "D_POSITION", startPos)
            reaper.SetMediaItemInfo_Value(item, "D_LENGTH", itemLength)
        end

        endX = endX + 1
    end
end

function drawFrame(frameData)
    for y = 1, frameHeight do
        processTrack(frameData, y)
    end
    reaper.UpdateArrange()
end

function clearItems()
    for i = 0, reaper.CountTracks(0) - 1 do
        local track = reaper.GetTrack(0, i)
        if track then
            while reaper.CountTrackMediaItems(track) > 0 do
                local item = reaper.GetTrackMediaItem(track, 0)
                if item then
                    reaper.DeleteTrackMediaItem(track, item)
                end
            end
        end
    end
end

function processFrame(frameNumber)
    if frameNumber > totalFrames then
        reaper.ShowConsoleMsg("すべてのフレームが処理されました\n")
        return
    end

    local frameData = loadFrameData(frameNumber)
    if not frameData then
        reaper.defer(function()
            processFrame(frameNumber + 1)
        end)
        return
    end

    clearItems()
    drawFrame(frameData)

    reaper.defer(function()
        processFrame(frameNumber + 1)
    end)
end

function main()
    reaper.ShowConsoleMsg("スクリプト開始\n")
    initializeTracks()
    processFrame(1)
end

main()