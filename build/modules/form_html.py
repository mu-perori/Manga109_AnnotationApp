# 各漫画のHTMLを作成

def make_html(output_path, src_path, manga_title):
		with open(src_path + "/template.html") as f:
			html = f.read().replace("manga_title", manga_title)

		with open(output_path + "/" + manga_title + "/index.html", 'w') as f:
			f.write(html)
