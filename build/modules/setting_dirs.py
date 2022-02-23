# 各作品ごとのフォルダ作る

import os
import glob#ファイル名を一度に取得するのに使う

# input_path = "/Volumes/USAGI02/03Programming/00_01漫画_読み順/Local/Manga109_released_2020_12_18"
# output_path = "/Volumes/USAGI02/03Programming/00_01漫画_読み順/Local/output_folder"

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
def make_dirs(output_path, title_list):
  for manga_title in title_list:
    os.makedirs(output_path + "/" + manga_title, exist_ok=True)
