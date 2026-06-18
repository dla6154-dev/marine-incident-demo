from __future__ import annotations

import json
import os
import urllib.parse
import urllib.request
from dataclasses import asdict, dataclass


API_URL = "https://safemap.go.kr/openapi2/IF_0022"
DEFAULT_SERVICE_KEY = os.getenv(
    "SAFEMAP_SERVICE_KEY",
    "28OZGEW1-28OZ-28OZ-28OZ-28OZGEW1UY",
)
DEFAULT_PAGE_SIZE = 1000


@dataclass(slots=True)
class Hospital:
    id: str
    name: str
    phone: str
    address: str
    type: str
    lat: float
    lng: float
    x: float
    y: float


def clean_text(value: object) -> str:
    if value is None:
        return ""
    text = str(value).strip()
    return "" if text == "-" else text


def parse_hospital(item: dict) -> Hospital | None:
    try:
        lat = float(item.get("lat"))
        lng = float(item.get("lon"))
    except (TypeError, ValueError):
        return None

    try:
        x = float(item.get("x") or 0)
        y = float(item.get("y") or 0)
    except (TypeError, ValueError):
        x, y = 0.0, 0.0

    name = clean_text(item.get("dutyname"))
    if not name:
        return None

    return Hospital(
        id=clean_text(item.get("hpid")),
        name=name,
        phone=clean_text(item.get("dutytel1")),
        address=clean_text(item.get("dutyaddr")),
        type=clean_text(item.get("dutydivname")) or "응급병원",
        lat=round(lat, 6),
        lng=round(lng, 6),
        x=x,
        y=y,
    )


def build_url(service_key: str, page_no: int, num_rows: int) -> str:
    query = urllib.parse.urlencode(
        {
            "serviceKey": service_key,
            "returnType": "json",
            "pageNo": page_no,
            "numOfRows": num_rows,
        }
    )
    return f"{API_URL}?{query}"


def read_page(service_key: str, page_no: int, num_rows: int) -> dict:
    request = urllib.request.Request(
        build_url(service_key, page_no, num_rows),
        headers={
            "User-Agent": "marine-incident-demo/1.0",
            "Accept": "application/json",
        },
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        return json.load(response)


def extract_items(payload: dict) -> tuple[list[dict], int]:
    header = payload.get("header") or {}
    if header.get("resultCode") != "00":
        raise RuntimeError(header.get("resultMsg") or "hospital API request failed")

    body = payload.get("body") or {}
    total_count = int(body.get("totalCount") or 0)
    items = (((body.get("items") or {}).get("item")) or [])
    if isinstance(items, dict):
        return [items], total_count
    if isinstance(items, list):
        return items, total_count
    return [], total_count


def fetch_hospitals(
    service_key: str = DEFAULT_SERVICE_KEY,
    *,
    page_size: int = DEFAULT_PAGE_SIZE,
) -> list[dict]:
    page_no = 1
    hospitals: list[dict] = []

    while True:
        payload = read_page(service_key, page_no, page_size)
        items, total_count = extract_items(payload)

        for item in items:
            hospital = parse_hospital(item)
            if hospital:
                hospitals.append(asdict(hospital))

        if len(hospitals) >= total_count or not items:
            break
        page_no += 1

    if not hospitals:
        raise RuntimeError("usable hospital coordinates were not found in the API response")

    return hospitals
