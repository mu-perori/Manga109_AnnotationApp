#!/usr/bin/python3

import argparse

from modules import setting_dirs, packing, form_js, form_html, v3


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("-i", "--input", help="input path", required=True)
    parser.add_argument("-o", "--output", help="output path", required=True)
    parser.add_argument(
        "-v",
        "--version",
        help="version of annotation tool to build",
        choices=["sigcc", "2", "3"],
        default="3",
    )

    args = parser.parse_args()

    src_path = args.version
    if src_path == "3":
        src_path = "version3"
        # ピックアップ.csvとManga109からcoordinates.jsを作成
        v3.form_data(args.input, args.output, src_path)
        # annotation_tool.htmlをコピー
        packing.copy_html(args.output, src_path)

    else:
        if src_path == "2":
            src_path = "version2"
    
        title_list = setting_dirs.get_titles(args.input)
    
        for t in title_list:
            setting_dirs.make_dirs(args.output, t)
            packing.copy_img(args.input, args.output, t)
            form_js.make_js(args.input, args.output, t)
            form_html.make_html(args.output, src_path, t)

    packing.copy_annotation(args.output, src_path)
    packing.copy_css(args.output, src_path)


main()
