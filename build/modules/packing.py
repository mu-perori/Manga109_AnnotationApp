# 画像ファイルとannotation.jsとindex.cssを出力先にコピー

import shutil

# annotation.jsを出力先にコピー
def copy_annotation(output_path, src_path):
  shutil.copy(src_path + "/annotation.js", output_path)

# index.cssを出力先にコピー
def copy_css(output_path, src_path):
  shutil.copy(src_path + "/index.css", output_path)

# 各漫画の画像が入っているフォルダを漫画のタイトルからimagesにリネームして出力先にコピー
def copy_img(input_path, output_path, manga_title):
  img_path = input_path + "/images/"
  shutil.copytree(img_path + manga_title, output_path + "/" + manga_title + "/images")
