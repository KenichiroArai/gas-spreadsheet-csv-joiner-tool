# gas-spreadsheet-csv-joiner-tool

## 開発環境の構築

### パッケージのインストール

npm init -y
npm i -g @google/clasp # clasp はグローバルにインストールする

## ログイン

clasp login

## Google Apps Script API の有効化

<https://script.google.com/home/usersettings>にアクセスし、「Google Apps Script API」を有効にする。

## Google スプレッドシートに反映

clasp push

### PowerShell で開始時間、終了時間、経過時間の表示する

$start = Get-Date; Write-Output "Start Time: $start -Format yyyy/MM/dd HH:mm:ss"; clasp push; $end = Get-Date; Write-Output "End Time: $end -Format yyyy/MM/dd HH:mm:ss"; $elapsed = $end - $start; Write-Output "Elapsed Time: $elapsed"
