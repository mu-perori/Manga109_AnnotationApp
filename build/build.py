#!/usr/bin/python3

import argparse

from modules import setting_dirs, packing, form_js, form_html

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('-i', '--input', help='input path',  required=True)
    parser.add_argument('-o', '--output', help='output path', required=True)

    args = parser.parse_args()
    src_path = "../sigcc"
    title_list = setting_dirs.get_titles(args.input)

    setting_dirs.make_dirs(args.output, title_list)
    packing.copy_annotation(args.output, src_path)
    packing.copy_css(args.output, src_path)
    packing.copy_img(args.input, args.output, title_list)
    form_js.make_js(args.input, args.output, title_list)
    form_html.make_html(args.output, src_path, title_list)

main()