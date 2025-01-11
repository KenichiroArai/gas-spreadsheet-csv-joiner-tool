import { LOG_SHEET_NAME, TOOL_SHEET_NAME, OUTPUT_INFO_CELL, DATA_START_ROW } from './constants';
import { writeLog } from './utils/logging';
import { getFile } from './utils/fileHandler';
import { processFile, saveCombinedCsv } from './utils/csvProcessor';
import { showConfirmationDialog } from './utils/ui';
import Sheet = GoogleAppsScript.Spreadsheet.Sheet;

/**
 * メイン関数
 */
function myFunction() {
    const userConfirmed = showConfirmationDialog();
    if (userConfirmed) {
        combineCsvFromSheet();
    } else {
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
    const outputFile = getFile(outputInfo, MimeType.CSV, true);
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
        const inputFile = getFile(inputInfo, MimeType.CSV);
        if (!inputFile) {
            writeLog(`[${inputInfo}]からファイルを取得できませんでした。`);
            return;
        }

        writeLog(`--- [${inputFile.getName()}]の読み込み ---`);
        writeLog(`開始します。`);
        try {
            processFile(inputFile, combinedData);
        } catch (error: any) {
            writeLog('エラーが発生しました: ' + error.message);
        }
        writeLog(`終了しました。`);
    }
    writeLog('----- 入力情報を結合しました。 -----');

    writeLog(`----- 出力ファイル[${outputFile.getName()}]の出力 -----`);
    writeLog('開始します。');
    try {
        saveCombinedCsv(combinedData, outputFile);
    } catch (error: any) {
        writeLog('CSVファイルの保存中にエラーが発生しました: ' + error.message);
    }
    writeLog('終了しました。');
    writeLog('---------- CSV結合ツールが全て終了しました。 ----------');
}

// グローバルスコープに関数を公開
globalThis.myFunction = myFunction;
