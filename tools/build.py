#!/usr/bin/env python3
"""index.html과 assets/ 안의 CSS·JS를 한 파일로 묶는다.

사용법
  python3 tools/build.py                   # dist/jinro-didimdol.html 만들기
  python3 tools/build.py --fragment 경로   # <html>, <head>, <body> 태그 없이 내용만 담은 파일도 만들기
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "dist" / "jinro-didimdol.html"


def bundle() -> str:
    html = (ROOT / "index.html").read_text(encoding="utf-8")

    def inline_css(m):
        return "<style>\n" + (ROOT / m.group(1)).read_text(encoding="utf-8") + "</style>"

    def inline_js(m):
        code = (ROOT / m.group(1)).read_text(encoding="utf-8")
        return "<script>\n" + code.replace("</script", "<\\/script") + "</script>"

    html, n_css = re.subn(r'<link rel="stylesheet" href="(assets/[^"]+\.css)">', inline_css, html)
    html, n_js = re.subn(r'<script src="(assets/[^"]+\.js)"></script>', inline_js, html)
    if n_css != 1 or n_js < 1:
        sys.exit(f"index.html에서 묶을 파일을 찾지 못했어요 (css {n_css}개, js {n_js}개)")
    return html


def fragment(html: str) -> str:
    drop = (r"<!doctype html>\n", r'<html lang="ko">\n', r"</html>\n?", r"<head>\n", r"</head>\n",
            r"<body>\n", r"</body>\n", r'<meta charset="utf-8">\n', r'<meta name="viewport"[^>]*>\n')
    for pat in drop:
        html = re.sub(pat, "", html, count=1, flags=re.I)
    return html


def main(argv):
    html = bundle()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(html, encoding="utf-8")
    print(f"만듦: {OUT.relative_to(ROOT)} ({len(html.encode('utf-8')) // 1024} KB)")
    if len(argv) == 3 and argv[1] == "--fragment":
        path = pathlib.Path(argv[2])
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(fragment(html), encoding="utf-8")
        print(f"만듦: {path}")


if __name__ == "__main__":
    main(sys.argv)
