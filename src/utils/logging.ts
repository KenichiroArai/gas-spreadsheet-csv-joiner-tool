import { LOG_SHEET_NAME, MAX_CELL_LENGTH } from '../constants';

/**
 * ログ書き込み関数
 * 指定されたメッセージをログシートに書き込みます。
 * @param {string} message - ログメッセージ
 */
export function writeLog(message: string): void {
    console.log(message);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const logSheet = ss.getSheetByName(LOG_SHEET_NAME);
    let lastRow: number = logSheet.getLastRow();

    while (message.length > MAX_CELL_LENGTH) {
        logSheet.getRange(lastRow + 1, 1).setValue(message.substring(0, MAX_CELL_LENGTH));
        message = message.substring(MAX_CELL_LENGTH);
        lastRow++;
    }

    logSheet.getRange(lastRow + 1, 1).setValue(message);
}
