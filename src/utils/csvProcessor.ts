import File = GoogleAppsScript.Drive.File;

/**
 * CSVファイルを読み込んでデータを結合する処理
 * @param {File} inputFile - 入力ファイルオブジェクト
 * @param {Array} combinedData - 結合されたデータの配列
 */
export function processFile(inputFile: File, combinedData: string[][]): void {
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
 * @param {File} outputFile - 保存先のファイル
 */
export function saveCombinedCsv(combinedData: string[][], outputFile: File): void {
    const csvString: string = combinedData.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');

    const shiftJisBlob = Utilities.newBlob(csvString, MimeType.CSV);
    outputFile.setContent(shiftJisBlob.getDataAsString());
}
