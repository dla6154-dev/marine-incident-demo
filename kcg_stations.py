from __future__ import annotations

import os
import urllib.parse
import urllib.request
from dataclasses import asdict, dataclass
from xml.etree import ElementTree as ET


API_URL        = "https://apis.data.go.kr/1532000/KCG_Station_Position/list_view"
API_BRANCH_URL = "https://apis.data.go.kr/1532000/KCG_Station_Branch_Position/list3"
DEFAULT_SERVICE_KEY = os.getenv(
    "KCG_SERVICE_KEY",
    "4063f2c2047eaf451ca47bba11369c953e228d145a62d2be87ad7af1d0f3960f",
)


@dataclass(slots=True)
class KcgStation:
    id: str
    name: str
    lat: float
    lng: float


def _fetch_from_url(api_url: str, service_key: str) -> list[dict]:
    params = urllib.parse.urlencode({
        "serviceKey": service_key,
        "rowsCount": 100000,
        "startPage": 1,
    })
    url = f"{api_url}?{params}"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "marine-incident-demo/1.0", "Accept": "application/xml"},
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        xml_bytes = resp.read()

    root = ET.fromstring(xml_bytes)

    result_msg = (root.findtext("resultMsg") or "").strip()
    if result_msg != "NON_ERROR":
        result_code = (root.findtext("resultCode") or "").strip()
        raise RuntimeError(f"KCG API error: resultCode={result_code} resultMsg={result_msg}")

    stations: list[dict] = []
    for content in root.findall("./body/content"):
        name = (content.findtext("c_myeongching") or "").strip()
        if not name:
            continue
        try:
            lat = float(content.findtext("c_wido") or "")
            lng = float(content.findtext("c_kyeongdo") or "")
        except (TypeError, ValueError):
            continue
        if not (30 <= lat <= 40 and 120 <= lng <= 135):
            continue
        station = KcgStation(
            id=f"{name}::{lng}::{lat}",
            name=name,
            lat=round(lat, 8),
            lng=round(lng, 8),
        )
        stations.append(asdict(station))

    return stations


def fetch_kcg_stations(service_key: str = DEFAULT_SERVICE_KEY) -> list[dict]:
    # 파출소
    stations = _fetch_from_url(API_URL, service_key)
    if not stations:
        raise RuntimeError("KCG station data was empty or unparseable")

    # 출장소 — 실패해도 파출소 결과는 유지
    try:
        branches = _fetch_from_url(API_BRANCH_URL, service_key)
        existing_ids = {s["id"] for s in stations}
        for b in branches:
            if b["id"] not in existing_ids:
                stations.append(b)
                existing_ids.add(b["id"])
    except Exception as exc:
        print(f"[kcg-stations] 출장소 조회 실패 (무시): {exc}")

    return stations
