/**
 * 確認ダイアログを表示し、ユーザーの選択に応じて処理を実行します。
 * @returns {boolean} ユーザーが「はい」を選択した場合はtrue、そうでない場合はfalse
 */
export function showConfirmationDialog(): boolean {
    const ui: string = Browser.msgBox('確認', 'CSV結合を実行しますか？', Browser.Buttons.YES_NO);
    return ui === 'yes';
}
