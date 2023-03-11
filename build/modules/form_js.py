# xmlをjsに変換するプログラム
# pythonの配列をjsの連想配列の形に変換してcoordinateDataに代入した形のjsファイルを作成

from bs4 import BeautifulSoup

# 各タグのid、xyの最大値最小値が入った辞書を返す
def get_coordinate_dict(tag):
    obj_id = tag.get("id")
    xmin = tag.get("xmin")
    ymin = tag.get("ymin")
    xmax = tag.get("xmax")
    ymax = tag.get("ymax")
    return {"id": obj_id, "xmin": xmin, "ymin": ymin, "xmax": xmax, "ymax": ymax}


# page_dictに指定したタグの座標辞書のリストを入れる
def add_page_dict(page_dict, page, tag_name, key_name):
    got_list = page.find_all(tag_name)
    made_list = []
    for item in got_list:
        made_dict = get_coordinate_dict(item)
        if tag_name == "text":
            made_dict["dialogue"] = item.get_text().replace("\u3000", "").replace("\n", "")
        elif tag_name == "face" or tag_name == "body":
            made_dict["characterId"] = item.get("character")
        made_list.append(made_dict)
    if made_list != []:
        page_dict[key_name] = made_list


def make_js(input_path, output_path, manga_title):
    output_dict = {}  # 出力用の辞書を用意

    # xmlファイルを開く
    markup = open(input_path + "/annotations/" + manga_title + ".xml")
    soup = BeautifulSoup(markup, "xml")  # パース

    # bookタグからtitleを取得して出力用の辞書に入れる
    output_dict["title"] = soup.find("book").get("title")

    # charactersタグの子要素を取得
    character_tag = soup.characters.contents
    # character_tagには改行が含まれているのでリスト内包表記で消す
    character_list = [i for i in character_tag if i != "\n"]

    # キャラクターidとキャラクターの名前の辞書を作成しoutput_dictに入れる
    characters = []
    for i in range(len(character_list)):
        obj_id = character_list[i].get("id")
        name = character_list[i].get("name")
        characters.append({"characterId": obj_id, "name": name})
    output_dict["characters"] = characters

    # ページごとの辞書を作成
    # soupの中からpageタグを子要素を含めて全て取得
    page_list = soup.find_all("page")
    pages = []
    for i in range(len(page_list)):
        page_index = page_list[i].get("index")
        page_width = page_list[i].get("width")
        page_height = page_list[i].get("height")
        page_dict = {"index": page_index, "width": page_width, "height": page_height}
        add_page_dict(page_dict, page_list[i], "frame", "frame")
        add_page_dict(page_dict, page_list[i], "text", "text")
        add_page_dict(page_dict, page_list[i], "face", "face")
        add_page_dict(page_dict, page_list[i], "body", "characterBody")
        pages.append(page_dict)

    # ページごとの辞書をoutput_dictに入れる
    output_dict["pages"] = pages

    # JavaScriptとして書き出し
    with open(output_path + "/" + manga_title + "/coordinates.js", "w") as f:
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
