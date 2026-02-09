-- ===== 設定 =====
-- プロジェクトルートの絶対パスを入力してください
local baseDir = ""
-- フレームデータのディレクトリ名（config.json の monochrome.framesDataDir と合わせる）
local frameDataDirName = "frames_data"
-- 縦サイズ（config.json の sizeY と合わせる）
local frameHeight = 25
-- ===============

local frameDataDir = baseDir .. "\\" .. frameDataDirName

function countFrameFiles()
    local count = 0
    while true do
        local filePath = frameDataDir .. "\\frame_" .. (count + 1) .. ".txt"
        local file = io.open(filePath, "r")
        if not file then
            break
        end
        file:close()
        count = count + 1
    end
    return count
end

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

    local file = io.open(frameFilePath, "r")
    if not file then
        reaper.ShowConsoleMsg("エラー: フレームファイルを読み込めません: " .. frameFilePath .. "\n")
        return nil
    end

    local data = {}
    for line in file:lines() do
        table.insert(data, line)
    end
    file:close()

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

        local startPos = (startX - 1) * 0.1
        local itemLength = (endX - startX + 1) * 0.1

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

function processFrame(frameNumber, totalFrames)
    if frameNumber > totalFrames then
        reaper.ShowConsoleMsg("すべてのフレームが処理されました\n")
        return
    end

    local frameData = loadFrameData(frameNumber)
    if not frameData then
        return
    end

    clearItems()
    drawFrame(frameData)

    reaper.defer(function()
        processFrame(frameNumber + 1, totalFrames)
    end)
end

function main()
    reaper.ShowConsoleMsg("スクリプト開始\n")

    local totalFrames = countFrameFiles()
    if totalFrames == 0 then
        reaper.ShowConsoleMsg("エラー: フレームデータが見つかりません: " .. frameDataDir .. "\n")
        return
    end
    reaper.ShowConsoleMsg("検出されたフレーム数: " .. totalFrames .. "\n")

    initializeTracks()
    processFrame(1, totalFrames)
end

main()
