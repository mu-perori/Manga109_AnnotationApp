#!/usr/bin/python3

from bs4 import BeautifulSoup
import shutil, os
from modules import packing_pickup_pages as ppp, form_js


def form_data(input_path, output_path, src_path):
    # 変数定義
    csv_path = f"{src_path}/pickup_list.csv"
    xml_path = f"{input_path}/annotations"
    image_path = f"{input_path}/images"
    manga_title = ""
    title_list = [
        item.replace(f"{xml_path}/", "").replace(".xml", "")
        for item in ppp.get_files(xml_path, "xml")
    ]
    output_dict = {"title": "マンガ読み順評価用データセット"}
    pages = []

    os.makedirs(f"{output_path}/images", exist_ok=True)

    # CSV読み込み
    pickup_list = ppp.read_csv(csv_path)

    # CSVの1行ずつfor文を回す
    for i in range(1, len(pickup_list)):
        # 今設定されているmanga_titleと現在の行のマンガのタイトルが違ったら
        if manga_title != pickup_list[i][2]:
            # manga_titleを新しいものに更新
            manga_title = ppp.complement_title(pickup_list[i][2], title_list)
            genre = pickup_list[i][1]
            # xmlを読み込み
            page_list = get_pages(xml_path, manga_title)
        # 必要なページの情報を加工
        index = pickup_list[i][0]
        page_index = pickup_list[i][3]
        class_no = pickup_list[i][4]
        page_dict = make_page_dict(
            page_list[int(page_index)], index, genre, manga_title, page_index, class_no
        )
        pages.append(page_dict)
        # 該当ページの画像をリネームして指定のフォルダに入れる
        ppp.copy_img(f"{image_path}/{manga_title}/{page_index}", f"{output_path}/images/{index}")

    # 出力用の辞書にページのリストを追加
    output_dict["pages"] = pages

    output_js(output_dict, output_path)


def get_pages(target_path, manga_title):
    # xmlファイルを開く
    markup = open(target_path + "/" + manga_title + ".xml")
    soup = BeautifulSoup(markup, "xml")  # パース

    # soupの中からpageタグを子要素を含めて全て取得して返す
    return soup.find_all("page")


def make_page_dict(page, index, genre, manga_title, page_index, page_class):
    page_width = page.get("width")
    page_height = page.get("height")
    page_dict = {
        "index": index,
        "genre": genre,
        "mangaTitel": manga_title,
        "pageIndex": page_index,
        "pageClass": page_class,
        "width": page_width,
        "height": page_height,
    }
    form_js.add_page_dict(page_dict, page, "frame", "frame")
    form_js.add_page_dict(page_dict, page, "text", "text")
    return page_dict


def output_js(output_dict, output_path):
    # JavaScriptとして書き出し
    with open(output_path + "/coordinates.js", "w") as f:
        output_text = "const coordinateData = " + str(output_dict).replace(
            "'title'", "title"
        ).replace("'characters'", "characters").replace("'characterId'", "characterId").replace(
            "'name'", "name"
        ).replace(
            "'index'", "index"
        ).replace(
            "'width'", "width"
        ).replace(
            "'height'", "height"
        ).replace(
            "'frame'", "frame"
        ).replace(
            "'dialogue'", "dialogue"
        ).replace(
            "'text'", "text"
        ).replace(
            "'face'", "face"
        ).replace(
            "'characterBody'", "characterBody"
        ).replace(
            "'pages'", "pages"
        ).replace(
            "'id'", "id"
        ).replace(
            "'xmin'", "xmin"
        ).replace(
            "'ymin'", "ymin"
        ).replace(
            "'xmax'", "xmax"
        ).replace(
            "'ymax'", "ymax"
        )
        f.write(output_text)
