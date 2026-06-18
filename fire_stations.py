from __future__ import annotations

import math
import os
import json
import urllib.parse
import urllib.request
from dataclasses import asdict, dataclass


API_URL = "https://safemap.go.kr/openapi2/IF_0038"
DEFAULT_SERVICE_KEY = os.getenv(
    "SAFEMAP_SERVICE_KEY",
    "28OZGEW1-28OZ-28OZ-28OZ-28OZGEW1UY",
)
DEFAULT_PAGE_SIZE = 1000
EARTH_RADIUS_M = 6378137.0


@dataclass(slots=True)
class FireStation:
    object_id: int
    facility_type: str
    facility_code: str
    name: str
    phone: str
    road_address: str
    address: str
    province_code: str
    district_code: str
    emd_code: str
    x: float
    y: float
    lng: float
    lat: float


def mercator_to_lonlat(x: float, y: float) -> tuple[float, float]:
    lng = math.degrees(x / EARTH_RADIUS_M)
    lat = math.degrees((2 * math.atan(math.exp(y / EARTH_RADIUS_M))) - (math.pi / 2))
    return lng, lat


def clean_text(value: object) -> str:
    if value is None:
        return ""
    text = str(value).strip()
    return "" if text == "-" else text


def parse_station(item: dict) -> FireStation | None:
    try:
        x = float(item.get("x"))
        y = float(item.get("y"))
    except (TypeError, ValueError):
        return None

    lng, lat = mercator_to_lonlat(x, y)

    return FireStation(
        object_id=int(item.get("objt_id") or 0),
        facility_type=clean_text(item.get("fclty_ty")),
        facility_code=clean_text(item.get("fclty_cd")),
        name=clean_text(item.get("fclty_nm")),
        phone=clean_text(item.get("telno")),
        road_address=clean_text(item.get("rn_adres")),
        address=clean_text(item.get("adres")),
        province_code=clean_text(item.get("ctprvn_cd")),
        district_code=clean_text(item.get("sgg_cd")),
        emd_code=clean_text(item.get("emd_cd")),
        x=x,
        y=y,
        lng=round(lng, 6),
        lat=round(lat, 6),
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
        raise RuntimeError(header.get("resultMsg") or "fire station API request failed")

    body = payload.get("body") or {}
    total_count = int(body.get("totalCount") or 0)
    items = (((body.get("items") or {}).get("item")) or [])
    if isinstance(items, dict):
        return [items], total_count
    if isinstance(items, list):
        return items, total_count
    return [], total_count


def fetch_fire_stations(
    service_key: str = DEFAULT_SERVICE_KEY,
    *,
    page_size: int = DEFAULT_PAGE_SIZE,
) -> list[dict]:
    page_no = 1
    stations: list[dict] = []

    while True:
        payload = read_page(service_key, page_no, page_size)
        items, total_count = extract_items(payload)

        for item in items:
            station = parse_station(item)
            if station and station.name:
                stations.append(asdict(station))

        if len(stations) >= total_count or not items:
            break
        page_no += 1

    if not stations:
        raise RuntimeError("usable fire station coordinates were not found in the API response")

    return stations
