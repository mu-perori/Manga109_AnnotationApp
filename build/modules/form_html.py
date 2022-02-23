# 各漫画のHTMLを作成

# input_path = "/Volumes/USAGI02/03Programming/00_01漫画_読み順/Local/Manga109_released_2020_12_18"
# output_path = "/Volumes/USAGI02/03Programming/00_01漫画_読み順/Local/output_folder"
# src_path = "../sigcc"

def make_html(output_path, src_path, title_list):
	for manga_title in title_list:
		with open(src_path + "/template.html") as f:
			html = f.read().replace("manga_title", manga_title)

		with open(output_path + "/" + manga_title + "/index.html", 'w') as f:
			f.write(html)
