from __future__ import annotations

import json
import re
import sys

import requests


def main() -> int:
    if len(sys.argv) < 2:
      print("usage: python inspect_data_go_file_page.py <page-url> [<page-url> ...]")
      return 1

    headers = {"User-Agent": "Mozilla/5.0"}
    for url in sys.argv[1:]:
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        html = response.text
        title_match = re.search(r"<title>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
        title = title_match.group(1).strip() if title_match else ""
        content_url = None

        match = re.search(r'"contentUrl"\s*:\s*"([^"]+)"', html)
        if match:
            content_url = match.group(1)

        print(json.dumps({
            "page_url": url,
            "title": title,
            "content_url": content_url,
        }, ensure_ascii=False))

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
