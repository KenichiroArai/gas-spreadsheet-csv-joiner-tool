import Folder = GoogleAppsScript.Drive.Folder;
import FolderIterator = GoogleAppsScript.Drive.FolderIterator;
import File = GoogleAppsScript.Drive.File;
import FileIterator = GoogleAppsScript.Drive.FileIterator;
import Sheet = GoogleAppsScript.Spreadsheet.Sheet;
import Blob = GoogleAppsScript.Base.Blob;

/** ログシート名 */
const LOG_SHEET_NAME: string = 'ログ';

/** ツールシート名 */
const TOOL_SHEET_NAME: string = 'CSV結合ツール';

/** 出力情報のセル */
const OUTPUT_INFO_CELL: string = 'A7';

/** データ開始行 */
const DATA_START_ROW: number = 11;

/** スプレッドシートのセルの最大文字数 */
const MAX_CELL_LENGTH: number = 50000;

function myFunction() {
    showConfirmationDialog();
}

function showConfirmationDialog() {
    // ダイアログの表示とユーザーの選択の取得
    var ui: string = Browser.msgBox('確認', 'CSV結合を実行しますか？', Browser.Buttons.YES_NO);

    // ユーザーが「はい」を選択した場合の処理
    if (ui == 'yes') {
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
    const logSheet: Sheet = ss.getSheetByName(LOG_SHEET_NAME);

    /* ログシートをクリア */
    logSheet.clear();

    writeLog('---------- CSV結合ツールを開始します。 ----------');

    // CSV結合ツールのシートを取得
    const sheet = ss.getSheetByName(TOOL_SHEET_NAME);

    /* 出力情報を取得 */
    writeLog('----- 出力情報を取得します。 -----');
    const outputInfo: string = sheet.getRange(OUTPUT_INFO_CELL).getValue();
    // 出力ファイルIDを取得する。出力ファイルが無い場合は、新規ファイルを作成する。
    const outputFile: File | undefined = getFile(outputInfo, MimeType.CSV, true);
    if (!outputFile) {
        writeLog('出力情報からファイルを取得できませんでした。');
        return;
    }
    writeLog(`出力ファイル名：[${outputFile.getName()}], ID：[${outputFile.getId()}]`);
    writeLog('----- 出力情報を取得しました。 -----');

    /* 入力情報を取得 */
    writeLog('----- 入力情報を取得します。 -----');
    let inputInfos: string[] = [];
    const lastRow = sheet.getLastRow();
    for (let i = DATA_START_ROW; i <= lastRow; i++) {
        const inputInfo: string = sheet.getRange(i, 1).getValue();
        if (inputInfo === 'Unknown') {
            writeLog(`[${inputInfo}]はファイルではありません。`);
            continue;
        }
        inputInfos.push(inputInfo);
    }
    writeLog('----- 入力情報を取得しました。 -----');

    /* 入力情報を結合する */
    writeLog('----- 入力情報を結合します。 -----');
    let combinedData: string[][] = [];
    for (const inputInfo of inputInfos) {
        // 入力ファイルIDを取得
        let inputFile: File | undefined = getFile(inputInfo, MimeType.CSV);
        if (!inputFile) {
            writeLog(`[${inputInfo}]からファイルを取得できませんでした。`);
            return;
        }

        writeLog(`--- [${inputFile.getName()}]の読み込み ---`);
        writeLog(`開始します。`);
        try {
            processFile(inputFile, combinedData);
        } catch (error) {
            writeLog('エラーが発生しました: ' + error.message);
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
    }
    writeLog('終了しました。');
    writeLog('---------- CSV結合ツールが全て終了しました。 ----------');
}

/**
 * ログ書き込み関数
 * 指定されたメッセージをログシートに書き込みます。
 * @param {string} message - ログメッセージ
 */
function writeLog(message: string) {
    console.log(message);

    const logSheet: GoogleAppsScript.Spreadsheet.Sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LOG_SHEET_NAME);
    let lastRow: number = logSheet.getLastRow();

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
 * @param {string} path - ファイルまたはフォルダのパスを '/' で区切った文字列。
 * @param {string|null} mimeType - ファイルのMIMEタイプ。デフォルトはnull。nullの場合はMIMEタイプをチェックせず、最初に見つかったファイルまたはフォルダのIDを返す。
 * @param {boolean} createFile - ファイルが見つからない場合に新規ファイルを作成するかどうか。デフォルトはfalse。
 * @returns {string|undefined} - 指定されたパスに対応するファイルまたはフォルダのID。見つからない場合は undefined。
 */
function getItemIdFromPath(path: string, mimeType: string | null = null, createFile: boolean = false): string | undefined {
    // 結果を初期化
    let result: string | undefined = undefined;

    // ルートフォルダから開始
    let targetFolder: Folder = DriveApp.getRootFolder();

    // パスを個々のフォルダ名とファイル名に分割
    path = path.substring(1);
    let pathItems: string[] = path.split('/');

    // パス内の各アイテムを順に処理
    for (let pathItem of pathItems) {
        // パスアイテムのUnicode正規化を行い、文字コードを統一
        pathItem = pathItem.normalize('NFC');

        // 現在のパスアイテムのIDを格納する変数
        let targetId: string | undefined = undefined;

        // 現在のフォルダ内のサブフォルダを確認
        let folders: FolderIterator = DriveApp.getFolderById(targetFolder.getId()).getFolders();
        while (folders.hasNext()) {
            const folder: Folder = folders.next();
            if (folder.getName() !== pathItem) {
                // フォルダ名が一致しない場合は次のフォルダに進む
                continue;
            }
            targetId = folder.getId();
            break;
        }

        // サブフォルダに一致するものが見つからないか
        if (targetId == undefined) {
            // 見つからない場合、ファイルを検索

            let files: FileIterator = DriveApp.getFolderById(targetFolder.getId()).getFiles();
            while (files.hasNext()) {
                const file: File = files.next();
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

            writeLog(`ファイル名:[${pathItem}]は見つかりませんでした。`);

            if (createFile) {
                // 新規ファイルを作成する場合

                // ターゲットフォルダの配下にパス項目のファイルを作成する
                const newFile: File = mimeType ? targetFolder.createFile(pathItem, '', mimeType) : targetFolder.createFile(pathItem, '');
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
 * @param {string} url - ファイルのURL
 * @returns {string|null} ファイルIDもしくはnull
 */
function getFileIdFromUrl(url: string): string | null {
    let result: string | null = null;
    const match = url.match(/[-\w]{25,}/);
    result = match ? match[0] : null;
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
function determineFileInfo(value: string): string {
    let result: string = 'Unknown';

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
function getFile(fileInfo: string, mimeType: string | null = null, createFile: boolean = false): File | undefined {
    let result: File | undefined = undefined;

    let fileId: string | undefined = undefined;
    let fileInfoType = determineFileInfo(fileInfo);
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
    result = DriveApp.getFileById(fileId);
    return result;
}

/**
 * CSVファイルを読み込んでデータを結合する処理
 * @param {File} inputFile - 入力ファイルオブジェクト
 * @param {Array} combinedData - 結合されたデータの配列
 */
function processFile(inputFile: File, combinedData: string[][]) {
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
 * @param {Array} combinedData - 結合されたデータの配列
 * @param {File} outputFile - 保存先のフォルダ
 */
function saveCombinedCsv(combinedData: string[][], outputFile: File) {
    // 結合されたデータをCSVの文字列に変換
    const csvString: string = combinedData.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');

    // CSVの文字列をバイナリデータに変換
    const shiftJisBlob: Blob = Utilities.newBlob(csvString, MimeType.CSV);

    // ファイルの中身を更新
    outputFile.setContent(shiftJisBlob.getDataAsString());
}
