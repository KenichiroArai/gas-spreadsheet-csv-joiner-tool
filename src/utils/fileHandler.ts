import Folder = GoogleAppsScript.Drive.Folder;
import FolderIterator = GoogleAppsScript.Drive.FolderIterator;
import File = GoogleAppsScript.Drive.File;
import FileIterator = GoogleAppsScript.Drive.FileIterator;
import { writeLog } from './logging';

/**
 * 指定されたパスに基づいてファイルまたはフォルダのIDを取得します。
 *
 * @param {string} path - ファイルまたはフォルダのパスを '/' で区切った文字列。
 * @param {string|null} mimeType - ファイルのMIMEタイプ。デフォルトはnull。nullの場合はMIMEタイプをチェックせず、最初に見つかったファイルまたはフォルダのIDを返す。
 * @param {boolean} createFile - ファイルが見つからない場合に新規ファイルを作成するかどうか。デフォルトはfalse。
 * @returns {string|undefined} - 指定されたパスに対応するファイルまたはフォルダのID。見つからない場合は undefined。
 */
export function getItemIdFromPath(path: string, mimeType: string | null = null, createFile: boolean = false): string | undefined {
    let result: string | undefined = undefined;
    let targetFolder: Folder = DriveApp.getRootFolder();
    path = path.substring(1);
    let pathItems: string[] = path.split('/');

    for (let pathItem of pathItems) {
        pathItem = pathItem.normalize('NFC');
        let targetId: string | undefined = undefined;

        let folders: FolderIterator = targetFolder.getFolders();
        while (folders.hasNext()) {
            const folder: Folder = folders.next();
            if (folder.getName() !== pathItem) {
                continue;
            }
            targetId = folder.getId();
            break;
        }

        if (targetId == undefined) {
            let files: FileIterator = targetFolder.getFiles();
            while (files.hasNext()) {
                const file: File = files.next();
                if (file.getName() !== pathItem) {
                    continue;
                }

                if (file.getMimeType() === MimeType.SHORTCUT) {
                    targetId = file.getTargetId();
                    break;
                }

                if (mimeType !== null && file.getMimeType() !== mimeType) {
                    continue;
                }

                targetId = file.getId();
                break;
            }
        }

        if (targetId === undefined) {
            writeLog(`ファイル名:[${pathItem}]は見つかりませんでした。`);

            if (createFile) {
                const newFile: File = mimeType ? targetFolder.createFile(pathItem, '', mimeType) : targetFolder.createFile(pathItem, '');
                targetId = newFile.getId();
                result = targetId;
                writeLog(`新規ファイル:[${newFile.getName()}], ID:[${targetId}]を作成しました。`);
            }
            return result;
        }

        targetFolder = DriveApp.getFolderById(targetId);
        result = targetId;
    }

    return result;
}

/**
 * URLからファイルIDを取得する関数
 * @param {string} url - ファイルのURL
 * @returns {string|null} ファイルIDもしくはnull
 */
export function getFileIdFromUrl(url: string): string | null {
    const match = url.match(/[-\w]{25,}/);
    return match ? match[0] : null;
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
export function determineFileInfo(value: string): string {
    let result: string = 'Unknown';

    if (typeof value !== 'string') {
        return result;
    }

    if (value.includes('https://drive.google.com/file/d/')) {
        result = 'URL';
    } else if (value.length === 33) {
        result = 'ID';
    } else if (value.startsWith('/')) {
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
export function getFile(fileInfo: string, mimeType: string | null = null, createFile: boolean = false): File | undefined {
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
        return undefined;
    }

    return DriveApp.getFileById(fileId);
}
