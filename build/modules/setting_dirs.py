# 各作品ごとのフォルダ作る

import os
import glob#ファイル名を一度に取得するのに使う

# タイトルリストを作成して返す
def get_titles(input_path):
  xml_path = input_path + "/annotations/"
  manga_title_paths = glob.glob(xml_path + "*.xml")
  manga_titles = []
  for title_path in manga_title_paths:
    manga_title = title_path.replace(xml_path, "").replace(".xml", "")
    manga_titles.append(manga_title)
  return manga_titles

#漫画タイトルのフォルダを作成
def make_dirs(output_path, manga_title):
  os.makedirs(output_path + "/" + manga_title, exist_ok=True)
