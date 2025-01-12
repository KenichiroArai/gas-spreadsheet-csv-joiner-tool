// Compiled using gas-spreadsheet-csv-joiner-tool 1.0.0 (TypeScript 4.9.5)
//import Folder = GoogleAppsScript.Drive.Folder;
//import FolderIterator = GoogleAppsScript.Drive.FolderIterator;
//import File = GoogleAppsScript.Drive.File;
//import FileIterator = GoogleAppsScript.Drive.FileIterator;
//import Sheet = GoogleAppsScript.Spreadsheet.Sheet;
//import Blob = GoogleAppsScript.Base.Blob;
/** ログシート名 */
const LOG_SHEET_NAME = 'ログ';
/** ツールシート名 */
const TOOL_SHEET_NAME = 'CSV結合ツール';
/** 出力情報のセル */
const OUTPUT_INFO_CELL = 'A7';
/** データ開始行 */
const DATA_START_ROW = 11;
/** スプレッドシートのセルの最大文字数 */
const MAX_CELL_LENGTH = 50000;
/**
 * メイン関数。確認ダイアログを表示します。
 */
function myFunction() {
    showConfirmationDialog();
}
/**
 * 確認ダイアログを表示し、ユーザーの選択に応じて処理を実行します。
 */
function showConfirmationDialog() {
    // ダイアログの表示とユーザーの選択の取得
    const ui = Browser.msgBox('確認', 'CSV結合を実行しますか？', Browser.Buttons.YES_NO);
    // ユーザーが「はい」を選択した場合の処理
    if (ui === 'yes') {
        // CSV結合操作を実行
        combineCsvFromSheet();
    } else {
        // 「いいえ」を選択した場合の処理（必要なら）
        Logger.log('操作はキャンセルされました。');
    }
}
/**
 * シートからCSVを結合するメイン関数
 */
function combineCsvFromSheet() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const logSheet = ss.getSheetByName(LOG_SHEET_NAME);
    /* ログシートをクリア */
    logSheet.clear();
    writeLog('---------- CSV結合ツールを開始します。 ----------');
    let hasError = false; // エラーがあるかどうか
    let hasWarning = false; // 警告があるかどうか
    try {
        // CSV結合ツールのシートを取得
        const sheet = ss.getSheetByName(TOOL_SHEET_NAME);
        /* 出力情報を取得 */
        writeLog('----- 出力情報を取得します。 -----');
        const outputInfo = sheet.getRange(OUTPUT_INFO_CELL).getValue();
        // 出力ファイルIDを取得する。出力ファイルが無い場合は、新規ファイルを作成する。
        const outputFile = getFile(outputInfo, MimeType.CSV, true);
        if (!outputFile) {
            writeLog('出力情報からファイルを取得できませんでした。');
            hasError = true;
            return;
        }
        writeLog(`出力ファイル名：[${outputFile.getName()}], ID：[${outputFile.getId()}]`);
        writeLog('----- 出力情報を取得しました。 -----');
        /* 入力情報を取得 */
        writeLog('----- 入力情報を取得します。 -----');
        const inputInfos = [];
        const lastRow = sheet.getLastRow();
        for (let i = DATA_START_ROW; i <= lastRow; i++) {
            const inputInfo = sheet.getRange(i, 1).getValue();
            if (inputInfo === 'Unknown') {
                writeLog(`[${inputInfo}]はファイルではありません。`);
                continue;
            }
            inputInfos.push(inputInfo);
        }
        writeLog('----- 入力情報を取得しました。 -----');
        /* 入力情報を結合する */
        writeLog('----- 入力情報を結合します。 -----');
        const combinedData = [];
        for (const inputInfo of inputInfos) {
            // 入力ファイルIDを取得
            const inputFile = getFile(inputInfo, MimeType.CSV);
            if (!inputFile) {
                writeLog(`[${inputInfo}]からファイルを取得できませんでした。`);
                hasWarning = true;
                continue;
            }
            writeLog(`--- ファイル名: [${inputFile.getName()}], ファイルID: [${inputFile.getId()}] の読み込み ---`);
            writeLog(`開始します。`);
            try {
                processFile(inputFile, combinedData);
            } catch (error) {
                writeLog('エラーが発生しました: ' + error.message);
                hasWarning = true;
                continue;
            }
            writeLog(`終了しました。`);
        }
        writeLog('----- 入力情報を結合しました。 -----');
        writeLog(`----- 出力ファイル[${outputFile.getName()}]の出力 -----`);
        writeLog('開始します。');
        try {
            saveCombinedCsv(combinedData, outputFile);
        } catch (error) {
            writeLog('CSVファイルの保存中にエラーが発生しました: ' + error.message);
            hasError = true;
            return;
        }
        writeLog('終了しました。');
    } finally {
        writeLog('---------- CSV結合ツールが全て終了しました。 ----------');
        // 成功/警告/失敗のダイアログ表示
        if (hasError) {
            Browser.msgBox('失敗', 'CSVの結合に失敗しました。ログを確認してください。', Browser.Buttons.OK);
            return;
        }
        if (hasWarning) {
            Browser.msgBox('警告', 'CSVの結合に警告がありました。ログを確認してください。', Browser.Buttons.OK);
            return;
        }
        Browser.msgBox('成功', 'CSVの結合に成功しました。', Browser.Buttons.OK);
    }
}
/**
 * ログ書き込み関数
 * 指定されたメッセージをログシートに書き込みます。
 * @param message - ログメッセージ
 */
function writeLog(message) {
    console.log(message);
    const logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LOG_SHEET_NAME);
    let lastRow = logSheet.getLastRow();
    while (message.length > MAX_CELL_LENGTH) {
        logSheet.getRange(lastRow + 1, 1).setValue(message.substring(0, MAX_CELL_LENGTH));
        message = message.substring(MAX_CELL_LENGTH);
        lastRow++;
    }
    logSheet.getRange(lastRow + 1, 1).setValue(message);
}
/**
 * 指定されたパスに基づいてファイルまたはフォルダのIDを取得します。
 *
 * @param path - ファイルまたはフォルダのパスを '/' で区切った文字列。
 * @param mimeType - ファイルのMIMEタイプ。デフォルトはnull。nullの場合はMIMEタイプをチェックせず、最初に見つかったファイルまたはフォルダのIDを返す。
 * @param createFile - ファイルが見つからない場合に新規ファイルを作成するかどうか。デフォルトはfalse。
 * @returns 指定されたパスに対応するファイルまたはフォルダのID。見つからない場合は undefined。
 */
function getItemIdFromPath(path, mimeType = null, createFile = false) {
    // 結果を初期化
    let result = undefined;
    // ルートフォルダから開始
    let targetFolder = DriveApp.getRootFolder();
    // パスを個々のフォルダ名とファイル名に分割
    path = path.substring(1);
    const pathItems = path.split('/');
    // パス内の各アイテムを順に処理
    for (const pathItem of pathItems) {
        // パスアイテムのUnicode正規化を行い、文字コードを統一
        const normalizedPathItem = pathItem.normalize('NFC');
        // 現在のパスアイテムのIDを格納する変数
        let targetId = undefined;
        // 現在のフォルダ内のサブフォルダを確認
        const folders = DriveApp.getFolderById(targetFolder.getId()).getFolders();
        while (folders.hasNext()) {
            const folder = folders.next();
            if (folder.getName() === normalizedPathItem) {
                targetId = folder.getId();
                break;
            }
        }
        // サブフォルダに一致するものが見つからないか
        if (targetId == undefined) {
            // 見つからない場合、ファイルを検索
            let files = DriveApp.getFolderById(targetFolder.getId()).getFiles();
            while (files.hasNext()) {
                const file = files.next();
                if (file.getName() !== pathItem) {
                    // ファイル名が一致しない場合は次のファイルに進む
                    continue;
                }
                if (file.getMimeType() === MimeType.SHORTCUT) {
                    // ショートカットの場合は「file#getTargetId()」で取得できる
                    targetId = file.getTargetId();
                    break;
                }
                if (mimeType !== null) {
                    if (file.getMimeType() !== mimeType) {
                        // MIMEタイプが一致しない場合は次のファイルに進む
                        continue;
                    }
                }
                // 通常のファイルの場合は、「file#getId()」で取得できる
                targetId = file.getId();
                break;
            }
        }
        // IDが取得できなかったか
        if (targetId === undefined) {
            // 出来なかった場合
            writeLog(`ファイル名:[${normalizedPathItem}]は見つかりませんでした。`);
            if (createFile) {
                // 新規ファイルを作成する場合
                // ターゲットフォルダの配下にパス項目のファイルを作成する
                const newFile = mimeType
                    ? targetFolder.createFile(normalizedPathItem, '', mimeType)
                    : targetFolder.createFile(normalizedPathItem, '');
                // 新規ファイルのIDを取得
                targetId = newFile.getId();
                result = targetId;
                writeLog(`新規ファイル:[${newFile.getName()}], ID:[${targetId}]を作成しました。`);
            }
            return result;
        }
        // 見つかったフォルダまたはファイルを次のターゲットフォルダとして設定
        targetFolder = DriveApp.getFolderById(targetId);
        result = targetId; // 最後に見つかったターゲットIDを保存
    }
    // 最後に見つかったファイルまたはフォルダのIDを返す
    return result;
}
/**
 * URLからファイルIDを取得する関数
 * @param url - ファイルのURL
 * @returns ファイルIDもしくはnull
 */
function getFileIdFromUrl(url) {
    let result = null;
    const match = url.match(/[-\w]{25,}/);
    if (match) {
        result = match[0];
    }
    return result;
}
/**
 * ファイルの情報を判定する関数
 *
 * @param value - 評価される文字列。この文字列はURL、ID、もしくはパス。
 *
 * @returns ファイル情報の種類を示す文字列を返します：
 * - 値がGoogleドライブのファイルリンクである場合は "URL"
 * - 値が33文字の識別子である場合は "ID"
 * - パスの場合は "Path"
 * - 値が文字列でない場合は "Unknown"
 */
function determineFileInfo(value) {
    let result = 'Unknown';
    // 文字列でないか
    if (typeof value !== 'string') {
        // 文字列でない場合
        return result;
    }
    // ファイルの形式の判定
    if (value.includes('https://drive.google.com/file/d/')) {
        // URLの場合
        result = 'URL';
    } else if (value.length === 33) {
        // IDの場合
        result = 'ID';
    } else if (value.startsWith('/')) {
        // パスの場合
        result = 'Path';
    }
    return result;
}
/**
 * ファイルオブジェクトを取得する。
 *
 * @param fileInfo ファイル情報の文字列。
 * @param mimeType ファイルのMIMEタイプ。デフォルトはnull。nullの場合はMIMEタイプをチェックせず、最初に見つかったファイルまたはフォルダのIDを返す。
 * @param createFile ファイルが見つからない場合に新規ファイルを作成するかどうか。デフォルトはfalse。
 * @returns ファイルオブジェクト。取得できない場合はundefined。
 */
function getFile(fileInfo, mimeType = null, createFile = false) {
    let result = undefined;
    let fileId = undefined;
    const fileInfoType = determineFileInfo(fileInfo);
    writeLog(`ファイル情報：[${fileInfo}], 種類：[${fileInfoType}]`);
    switch (fileInfoType) {
        case 'Unknown':
            break;
        case 'ID':
            fileId = fileInfo;
            break;
        case 'URL':
            fileId = getFileIdFromUrl(fileInfo);
            break;
        case 'Path':
            fileId = getItemIdFromPath(fileInfo, mimeType, createFile);
            break;
        default:
            break;
    }
    if (!fileId) {
        writeLog('ファイルIDが取得できませんでした。');
        return result;
    }
    // ファイルIDからファイルオブジェクトを取得
    try {
        result = DriveApp.getFileById(fileId);
    } catch (e) {
        writeLog(`ファイルID [${fileId}] の取得に失敗しました: ${e}`);
    }
    return result;
}
/**
 * CSVファイルを読み込んでデータを結合する処理
 * @param inputFile - 入力ファイルオブジェクト
 * @param combinedData - 結合されたデータの配列
 */
function processFile(inputFile, combinedData) {
    const mimeType = inputFile.getMimeType();
    if (mimeType !== MimeType.CSV) {
        throw new Error(`ファイルはCSVではありません。MIMEタイプ: ${mimeType}`);
    }
    const csvData = inputFile.getBlob().getDataAsString('Shift_JIS');
    const parsedCsv = Utilities.parseCsv(csvData);
    if (combinedData.length === 0 && parsedCsv.length > 0) {
        combinedData.push(parsedCsv[0]);
    }
    for (let i = 1; i < parsedCsv.length; i++) {
        combinedData.push(parsedCsv[i]);
    }
}
/**
 * 結合されたデータをCSVファイルとして保存する関数
 * @param combinedData - 結合されたデータの配列
 * @param outputFile - 保存先のファイルオブジェクト
 */
function saveCombinedCsv(combinedData, outputFile) {
    // 結合されたデータをCSVの文字列に変換
    const csvString = combinedData.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
    // CSVの文字列をバイナリデータに変換
    const shiftJisBlob = Utilities.newBlob(csvString, MimeType.CSV);
    // ファイルの中身を更新
    outputFile.setContent(shiftJisBlob.getDataAsString());
}
