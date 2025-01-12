# CSV 結合ツール GAS 地域企業協働プログラム用 

## 概要

このツールは Google Apps Script を利用して、Google スプレッドシート上で複数の CSV ファイルを結合するためのスクリプトを提供します。以下の手順に従って、環境を構築し、スクリプトを実行する準備をします。

## 開発環境の構築

### 1. パッケージのインストール

初めに、必要な npm パッケージをインストールします。

```bash
npm install
```

### 2. .clasp.json の作成

リポジトリの .clasp.json.sample ファイルをコピーし、.clasp.json という名前で保存します。このファイルは Google Apps Script プロジェクトの設定に使用されます。

### 3. Google Apps Script API の有効化

API を有効にするため、<https://script.google.com/home/usersettings> にアクセスし、「Google Apps Script API」を有効化してください。

### 4. Google スプレッドシートの準備

提供された spreadsheet/CSV 結合ツール.xlsx ファイルを Google ドライブにアップロードします。それを開き、「ファイル」メニューから「Google スプレッドシートとして保存」を選択して、Google スプレッドシートで編集可能にします。

### 5. Google アカウントにログイン

Google アカウントにログインして、clasp を使用する準備を整えます。

```bash
clasp login
```

### 6. スプレッドシートにスクリプトを反映

以下のコマンドを実行して、Google スプレッドシートにスクリプトをプッシュします。

```bash
clasp push
```

#### (参考) 時間計測付きで clasp push を実行

```powershell
$start = Get-Date;
Write-Output "Start Time: $($start.ToString('yyyy/MM/dd HH:mm:ss'))";
clasp push;
$end = Get-Date;
Write-Output "End Time: $($end.ToString('yyyy/MM/dd HH:mm:ss'))";
$elapsed = $end - $start;
Write-Output "Elapsed Time: $elapsed"
```

#### (参考) Google Apps Script の提供ファイル

clasp push 後、`spreadsheet/apps_script/main.gs` にスクリプトが配置されます。開発環境がない場合、このファイルを手動で Apps Script エディタに貼り付けて使用できます。

### 7. Google スプレッドシートの設定

作成した Google スプレッドシートを開き、「CSV 結合ツール」シート内の「CSV 結合の開始」ボタンにスクリプトを割り当てます。

- ボタンを右クリックし、「スクリプトを割り当て」を選択。
- 「myFunction」と入力して確定します。
