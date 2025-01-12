# CSV 結合ツール GAS 用

## 開発環境の構築

### パッケージのインストール

npm install

### 「.clasp.json」の作成

.clasp.json.sample から .clasp.json を作成する。

### Google Apps Script API の有効化

<https://script.google.com/home/usersettings>にアクセスし、「Google Apps Script API」を有効にする。

### Google スプレッドシートのコピー

spreadsheet/CSV 結合ツール.xlsx をコピーして、ファイルを開きます。
「ファイル」→「Google スプレッドシートとして保存」をクリックして、Google スプレッドシートを作成する。

### ログイン

clasp login

### Google スプレッドシートに反映

clasp push

#### 参考：PowerShell で開始時間、終了時間、経過時間の表示する

$start = Get-Date; Write-Output "Start Time: $start -Format yyyy/MM/dd HH:mm:ss"; clasp push; $end = Get-Date; Write-Output "End Time: $end -Format yyyy/MM/dd HH:mm:ss"; $elapsed = $end - $start; Write-Output "Elapsed Time: $elapsed"

#### 参考：Google Apps Script (GAS) のファイル

clasp push 後の gs ファイルは、spreadsheet/apps_script/main.gs になる。開発環境が無い場合は、Apps Script にこちらをコピーしてください。

### Google スプレッドシートの設定

Google スプレッドシートを開き、「CSV 結合ツール」シートの「CSV 結合の開始」の「スクリプトを割り当て」をクリックし、「myFunction」を記入し、確定ボタンをクリックする。
