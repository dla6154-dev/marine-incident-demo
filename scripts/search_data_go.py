from __future__ import annotations

import html
import re
import sys
from pathlib import Path

import requests


def main() -> int:
    keyword = " ".join(sys.argv[1:]).strip()
    if not keyword:
        print("usage: python search_data_go.py <keyword>")
        return 1

    url = "https://www.data.go.kr/tcs/dss/selectDataSetList.do"
    response = requests.get(
        url,
        params={"keyword": keyword},
        headers={"User-Agent": "Mozilla/5.0"},
        timeout=30,
    )
    response.raise_for_status()

    page_html = response.text
    if "에러 | 공공데이터포털" in page_html:
        print("site returned error page")
        return 2

    patterns = [
        r"https://www\.data\.go\.kr/data/\d+/fileData\.do(?:\?recommendDataYn=Y)?",
        r"/data/\d+/fileData\.do(?:\?recommendDataYn=Y)?",
        r"https://www\.data\.go\.kr/data/\d+/openapi\.do(?:\?recommendDataYn=Y)?",
        r"/data/\d+/openapi\.do(?:\?recommendDataYn=Y)?",
    ]

    found: list[str] = []
    for pattern in patterns:
        for match in re.findall(pattern, page_html):
            if match.startswith("/"):
                match = f"https://www.data.go.kr{match}"
            if match not in found:
                found.append(match)

    result_pairs: list[tuple[str, str]] = []
    for match in re.finditer(
        r'<a[^>]+href="(?P<href>/data/\d+/(?:fileData|openapi)\.do[^"]*)"[^>]*>(?P<title>.*?)</a>',
        page_html,
        flags=re.IGNORECASE | re.DOTALL,
    ):
        href = match.group("href")
        title = re.sub(r"<[^>]+>", " ", match.group("title"))
        title = " ".join(html.unescape(title).split())
        full_url = f"https://www.data.go.kr{href}"
        pair = (full_url, title)
        if pair not in result_pairs:
            result_pairs.append(pair)

    print(f"status={response.status_code}")
    print(f"url={response.url}")
    print(f"raw_matches={len(found)}")
    print(f"anchor_matches={len(result_pairs)}")
    for item in result_pairs[:50]:
        print(f"{item[0]}\t{item[1]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
