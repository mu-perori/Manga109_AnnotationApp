#!/usr/bin/python3

import argparse

from modules import setting_dirs, packing, form_js, form_html


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("-i", "--input", help="input path", required=True)
    parser.add_argument("-o", "--output", help="output path", required=True)
    parser.add_argument(
        "-v",
        "--version",
        help="version of annotation tool to build",
        choices=["sigcc", "2"],
        default="2",
    )

    args = parser.parse_args()

    src_path = args.version
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
