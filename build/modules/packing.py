# 画像ファイルとannotation.jsとindex.cssを出力先にコピー

import shutil

# input_path = "/Volumes/USAGI02/03Programming/00_01漫画_読み順/Local/Manga109_released_2020_12_18"
# output_path = "/Volumes/USAGI02/03Programming/00_01漫画_読み順/Local/output_folder"
# src_path = "../sigcc"

# annotation.jsを出力先にコピー
def copy_annotation(output_path, src_path):
  shutil.copy(src_path + "/annotation.js", output_path)

# index.cssを出力先にコピー
def copy_css(output_path, src_path):
  shutil.copy(src_path + "/index.css", output_path)

# 各漫画の画像が入っているフォルダを漫画のタイトルからimagesにリネームして出力先にコピー
def copy_img(input_path, output_path, title_list):
  img_path = input_path + "/images/"
  for manga_title in title_list:
    shutil.copytree(img_path + manga_title, output_path + "/" + manga_title + "/images")
