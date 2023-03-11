# Manga109 Annotation Application
これは[Manga109データセット](http://www.manga109.org/ja/index.html)に含まれる漫画のコマ・テキストの読み順をアノテーションするWebアプリです。
詳細は[こちらの論文](https://drive.google.com/file/d/1mIA6n2XiCl_GKNDYOi7GDN2uMRUAEzEc/view)を参照してください。

## 必要なソフトウェア
- Python 3
- ブラウザ

## 動作環境
次の環境で動作することを確認しています。
- OS: macOS 10.15.7
- ブラウザ: Google Chrome 97.0.4692.99, Safari 15.3
- Python 3.8

## 使い方
アノテーションツールを利用するには以下の2ステップを行う必要があります:
1. 作業環境の構築。あらかじめ用意されたPythonスクリプトを実行して、Manga109データセットから、アノテーション対象のデータとツールの実行環境を作成します。
1. 作成したツールの実行環境を利用して、アノテーションを行います。

### 作業環境の構築
1. [Manga109データセット](http://www.manga109.org/ja/download.html)をダウンロードします。
1. [このプロジェクトのコードをダウンロード](https://github.com/mu-perori/Manga109_AnnotationApp/archive/refs/tags/v3.0.zip)して、解凍します。
1. ターミナルから以下のコマンドを実行し、コードが置いてあるフォルダに移動して必要なパッケージをインストールします。
   ```
   cd path/to/Manga109_AnnotationApp
   python3 -m pip install -r requirements.txt
   ```
1. ターミナルから以下のコマンドを実行すると、作業環境用のフォルダ
が作成され、そのフォルダ内に作品ごとのフォルダとデータが作成されます。
   ```
   python3 build/build.py -i <ダウンロードしたManga109データセットのフォルダのパス> -o <作業環境用のフォルダのパス>
   ```
   第6回コミック工学研究会発表会にて発表したアノテーションツールを使用したい場合は、
   `-v sigcc` を指定して `build/build.py` を実行してください:
   ```
   python3 build/build.py -v sigcc -i <ダウンロードしたManga109データセットのフォルダのパス> -o <作業環境用のフォルダのパス>

   version2のアノテーションツールを使用したい場合は、
   `-v version2` を指定して `build/build.py` を実行してください:
   ```
   python3 build/build.py -v version2 -i <ダウンロードしたManga109データセットのフォルダのパス> -o <作業環境用のフォルダのパス>

   ```

### アノテーション方法

1.作業環境フォルダ内にある`annotation_tool.html`をブラウザで開きます。
1. アプリ内の[作業の手順]をクリックして参照し、アノテーションを行ってください。
   作業のやりなおし等を行いたい場合は[ツールの説明]をクリックし、参照してください。

#### 以前のバージョン
1. アノテーション対象とする作品を選び、フォルダを開きます。
1. 開いたフォルダ内にある`index.html`をブラウザで開きます。
1. アプリ内の[作業の手順]をクリックして参照し、アノテーションを行ってください。
   作業のやりなおし等を行いたい場合は[ツールの説明]をクリックし、参照してください。

## 謝辞
本アプリは科学研究費助成事業 基盤研究(B) （課題番号 21H03491）
「巨大知識グラフに対するクエリ検索の近似的な高速化」
の助成を得て作成したものです。
