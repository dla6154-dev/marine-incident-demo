from __future__ import annotations

import argparse
import json
import math
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from dataclasses import asdict, dataclass
from xml.etree import ElementTree as ET


API_URL = "https://apis.data.go.kr/6460000/island/getIslandList"
DEFAULT_SERVICE_KEY = (
    "4063f2c2047eaf451ca47bba11369c953e228d145a62d2be87ad7af1d0f3960f"
)
VWORLD_DATA_URL = "https://api.vworld.kr/req/data"
COASTLINE_LAYER = "LT_L_TOISDEPCNTAH"
PLACEHOLDER_NAMES = {"", "(미부여)"}
EARTH_RADIUS_NM = 3440.065
ZERO_DISTANCE_NM = 0.05
CACHE_MAX_AGE_SECONDS = 24 * 60 * 60
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CACHE_DIR = os.path.join(SCRIPT_DIR, ".cache")
CACHE_PATH = os.path.join(CACHE_DIR, "island_list.xml")
CARDINAL_DIRECTIONS = [
    "북방",
    "북북동방",
    "북동방",
    "동북동방",
    "동방",
    "동남동방",
    "남동방",
    "남남동방",
    "남방",
    "남남서방",
    "남서방",
    "서남서방",
    "서방",
    "서북서방",
    "북서방",
    "북북서방",
]


@dataclass(frozen=True)
class Island:
    island_id: str
    name: str
    island_type: str
    location: str
    lat: float
    lng: float


def clean_text(value: str | None) -> str:
    return (value or "").strip()


def build_api_url(service_key: str) -> str:
    query = urllib.parse.urlencode(
        {
            "serviceKey": service_key,
            "startPage": 1,
            "pageSize": 100000,
        }
    )
    return f"{API_URL}?{query}"


def parse_coordinate(raw_value: str) -> float:
    value = raw_value.strip()
    if not value:
        raise ValueError("empty coordinate")

    try:
        return float(value)
    except ValueError:
        pass

    normalized = (
        value.upper()
        .replace("º", "°")
        .replace("˚", "°")
        .replace("’", "′")
        .replace("'", "′")
        .replace("”", "″")
        .replace('"', "″")
    )

    match = re.match(
        r"^\s*([+-]?\d+(?:\.\d+)?)\D+(\d+(?:\.\d+)?)\D+(\d+(?:\.\d+)?)\D*([NSEW])?\s*$",
        normalized,
    )
    if not match:
        raise ValueError(f"unsupported coordinate format: {raw_value}")

    degrees = float(match.group(1))
    minutes = float(match.group(2))
    seconds = float(match.group(3))
    hemisphere = match.group(4)

    decimal = abs(degrees) + (minutes / 60.0) + (seconds / 3600.0)
    if degrees < 0 or hemisphere in {"S", "W"}:
        decimal *= -1

    return decimal


def haversine_nm(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lng2 - lng1)

    a = (
        math.sin(delta_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return EARTH_RADIUS_NM * c


def initial_bearing(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_lambda = math.radians(lng2 - lng1)

    x = math.sin(delta_lambda) * math.cos(phi2)
    y = (
        math.cos(phi1) * math.sin(phi2)
        - math.sin(phi1) * math.cos(phi2) * math.cos(delta_lambda)
    )
    return (math.degrees(math.atan2(x, y)) + 360.0) % 360.0


def bearing_to_direction(bearing: float) -> str:
    index = int((bearing + 11.25) // 22.5) % 16
    return CARDINAL_DIRECTIONS[index]


def format_distance_nm(distance_nm: float) -> str:
    if distance_nm < 1:
        return f"{distance_nm:.2f}"
    return f"{distance_nm:.1f}"


def fetch_islands(service_key: str, island_type_filter: str) -> list[Island]:
    root = ET.fromstring(load_api_xml_bytes(service_key))

    islands: list[Island] = []
    for item in root.findall("./body/items/item"):
        name = clean_text(item.findtext("islandNm"))
        if name in PLACEHOLDER_NAMES:
            continue

        island_type = clean_text(item.findtext("islandTy"))
        if island_type_filter == "inhabited" and island_type != "유인도":
            continue
        if island_type_filter == "uninhabited" and island_type != "무인도":
            continue

        lat_raw = clean_text(item.findtext("lat"))
        lng_raw = clean_text(item.findtext("lng"))
        if not lat_raw or not lng_raw:
            continue

        try:
            lat = parse_coordinate(lat_raw)
            lng = parse_coordinate(lng_raw)
        except ValueError:
            continue

        if not (-90 <= lat <= 90 and -180 <= lng <= 180):
            continue

        islands.append(
            Island(
                island_id=clean_text(item.findtext("islandId")),
                name=name,
                island_type=island_type,
                location=clean_text(item.findtext("location")),
                lat=lat,
                lng=lng,
            )
        )

    if not islands:
        raise RuntimeError("usable island coordinates were not found in the API response")

    return islands


def fetch_api_xml_bytes(service_key: str) -> bytes:
    last_error: Exception | None = None

    for attempt in range(3):
        try:
            with urllib.request.urlopen(build_api_url(service_key), timeout=20) as response:
                xml_bytes = response.read()

            root = ET.fromstring(xml_bytes)
            result_code = clean_text(root.findtext("./header/resultCode"))
            result_msg = clean_text(root.findtext("./header/resultMsg"))
            if result_code != "00":
                raise RuntimeError(f"API error {result_code}: {result_msg}")

            os.makedirs(CACHE_DIR, exist_ok=True)
            with open(CACHE_PATH, "wb") as cache_file:
                cache_file.write(xml_bytes)

            return xml_bytes
        except Exception as exc:
            last_error = exc
            if attempt < 2:
                time.sleep(1)

    raise RuntimeError(f"API fetch failed after retries: {last_error}") from last_error


def load_api_xml_bytes(service_key: str) -> bytes:
    if os.path.exists(CACHE_PATH):
        cache_age = time.time() - os.path.getmtime(CACHE_PATH)
        if cache_age <= CACHE_MAX_AGE_SECONDS:
            with open(CACHE_PATH, "rb") as cache_file:
                return cache_file.read()

    try:
        return fetch_api_xml_bytes(service_key)
    except Exception:
        if os.path.exists(CACHE_PATH):
            with open(CACHE_PATH, "rb") as cache_file:
                return cache_file.read()
        raise


ISLAND_TYPE_MAP = {"1": "유인도", "2": "무인도"}
VWORLD_WFS_URL = "https://api.vworld.kr/ned/wfs/getIslandsWFS"
VWORLD_WFS_LAYER = "dt_d158"


def fetch_islands_wfs(
    lat: float,
    lng: float,
    radius_nm: float,
    vworld_key: str,
    vworld_domain: str = "localhost",
    island_type_filter: str = "inhabited",
) -> list[dict]:
    """VWorld WFS에서 주변 섬 폴리곤을 가져온다."""
    deg = radius_nm / 60.0
    bbox = f"{lat - deg},{lng - deg},{lat + deg},{lng + deg},EPSG:4326"
    params = urllib.parse.urlencode([
        ("key", vworld_key),
        ("domain", vworld_domain),
        ("typename", VWORLD_WFS_LAYER),
        ("bbox", bbox),
        ("maxFeatures", "1000"),
        ("srsName", "EPSG:4326"),
        ("output", "application/json"),
    ])
    url = f"{VWORLD_WFS_URL}?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": "marine-incident-demo/1.0"})
    with urllib.request.urlopen(req, timeout=20) as r:
        data = json.loads(r.read())
    features = data.get("features", []) or []

    # 유인도/무인도 필터
    if island_type_filter == "inhabited":
        features = [f for f in features if str(f.get("properties", {}).get("islnds_se_code", "")) == "1"]
    elif island_type_filter == "uninhabited":
        features = [f for f in features if str(f.get("properties", {}).get("islnds_se_code", "")) == "2"]

    return features


def polygon_centroid(coords_ring: list) -> tuple[float, float]:
    """폴리곤 링의 중심점(lng, lat)을 반환한다."""
    n = len(coords_ring)
    if n == 0:
        return (0.0, 0.0)
    lng_sum = sum(c[0] for c in coords_ring)
    lat_sum = sum(c[1] for c in coords_ring)
    return (lng_sum / n, lat_sum / n)


def find_nearest_island_wfs(
    features: list[dict],
    query_lat: float,
    query_lng: float,
) -> dict[str, object] | None:
    """WFS 피처 목록에서 가장 가까운 섬과 해안선 거리를 반환한다."""
    if not features:
        return None

    # 1단계: 모든 피처의 중심점 거리를 빠르게 계산 (꼭짓점 순회 없음)
    candidates: list[tuple[float, tuple[float, float], dict]] = []  # (centroid_dist, centroid, feature)
    for feature in features:
        props = feature.get("properties", {}) or {}
        if not (props.get("islnds_nm") or "").strip():
            continue
        geom = feature.get("geometry") or {}
        first_ring = _first_ring(geom.get("type", ""), geom.get("coordinates") or [])
        if not first_ring:
            continue
        centroid = polygon_centroid(first_ring)
        cdist = haversine_nm(query_lat, query_lng, centroid[1], centroid[0])
        candidates.append((cdist, centroid, feature))

    if not candidates:
        return None

    # 2단계: 중심점 거리 기준 정렬 후 상위 50개만 꼭짓점 상세 검색
    candidates.sort(key=lambda x: x[0])
    TOP_K = 50
    top = candidates[:TOP_K]

    best: dict | None = None
    best_dist_nm: float = float("inf")
    best_coast_lng: float = 0.0
    best_coast_lat: float = 0.0
    best_centroid: tuple[float, float] = (0.0, 0.0)

    MAX_DEG = 0.45  # ~25nm in degrees (이상 꼭짓점 제거용 빠른 필터)

    for centroid_dist_nm, centroid, feature in top:
        geom = feature.get("geometry") or {}
        # 본섬 외곽(가장 큰 링)만 사용 — 부속 소도서 꼭짓점 배제
        main_ring = _first_ring(geom.get("type", ""), geom.get("coordinates") or [])
        if not main_ring:
            continue

        # 섬 중심에서 0.45도 이내 꼭짓점만 사용 (VWorld 데이터 오류 방어)
        clat, clng = centroid[1], centroid[0]
        clean = [(lx, ly) for lx, ly in main_ring
                 if abs(ly - clat) <= MAX_DEG and abs(lx - clng) <= MAX_DEG]
        filtered_rings: list[list[tuple[float, float]]] = [clean] if clean else []

        hit = nearest_coastline_point(query_lat, query_lng, filtered_rings) if filtered_rings else None
        if hit is None:
            dist_nm = centroid_dist_nm
            coast_lng, coast_lat = centroid
        else:
            dist_nm, coast_lng, coast_lat = hit

        if dist_nm < best_dist_nm:
            best_dist_nm = dist_nm
            best_coast_lng = coast_lng
            best_coast_lat = coast_lat
            best_centroid = centroid
            best = feature

    if best is None:
        return None

    props = best.get("properties", {}) or {}
    name = (props.get("islnds_nm") or "").strip()
    se_code = str(props.get("islnds_se_code", ""))
    island_type = ISLAND_TYPE_MAP.get(se_code, "도서")
    location = props.get("ld_cpsg_code", "")

    result: dict[str, object] = {
        "query_lat": query_lat,
        "query_lng": query_lng,
        "distance_nm": round(best_dist_nm, 3),
        "coastline_distance_nm": round(best_dist_nm, 3),
        "coastline_point": {
            "lat": round(best_coast_lat, 6),
            "lng": round(best_coast_lng, 6),
        },
        "island": {
            "island_id": str(props.get("islnds_esntlno", "")),
            "name": name,
            "island_type": island_type,
            "location": str(location),
            "lat": round(best_centroid[1], 6),
            "lng": round(best_centroid[0], 6),
        },
    }

    centroid_lat, centroid_lng = best_centroid[1], best_centroid[0]
    if best_dist_nm >= ZERO_DISTANCE_NM:
        bearing = initial_bearing(centroid_lat, centroid_lng, query_lat, query_lng)
        result["bearing_deg"] = round(bearing, 1)
        result["direction"] = bearing_to_direction(bearing)
        result["summary"] = (
            f"{name} {result['direction']} {format_distance_nm(best_dist_nm)}해리"
        )
    else:
        result["bearing_deg"] = None
        result["direction"] = None
        result["summary"] = f"{name} {format_distance_nm(best_dist_nm)}해리"

    return result


def collect_rings_from_geojson(features: list) -> list[list[tuple[float, float]]]:
    """GeoJSON feature 목록에서 좌표 링 목록을 추출한다."""
    rings: list[list[tuple[float, float]]] = []
    for feature in features:
        geometry = feature.get("geometry") or {}
        _collect_rings(geometry.get("type", ""), geometry.get("coordinates") or [], rings)
    return rings


def _first_ring(geom_type: str, coords: list) -> list[tuple[float, float]] | None:
    """폴리곤 지오메트리에서 꼭짓점이 가장 많은 링을 반환한다 (본섬 중심 계산용).
    MultiPolygon의 경우 첫 번째 링이 부속 소도서일 수 있어 최대 링을 선택한다."""
    rings: list[list] = []
    if geom_type == "Polygon":
        rings = coords
    elif geom_type == "MultiPolygon":
        for polygon in coords:
            rings.extend(polygon)
    if not rings:
        return None
    largest = max(rings, key=len)
    return [(float(c[0]), float(c[1])) for c in largest if len(c) >= 2]


def _collect_rings(
    geom_type: str,
    coords: list,
    out: list[list[tuple[float, float]]],
) -> None:
    if geom_type == "LineString":
        out.append([(float(c[0]), float(c[1])) for c in coords if len(c) >= 2])
    elif geom_type == "MultiLineString":
        for line in coords:
            out.append([(float(c[0]), float(c[1])) for c in line if len(c) >= 2])
    elif geom_type == "Polygon":
        for ring in coords:
            out.append([(float(c[0]), float(c[1])) for c in ring if len(c) >= 2])
    elif geom_type == "MultiPolygon":
        for polygon in coords:
            for ring in polygon:
                out.append([(float(c[0]), float(c[1])) for c in ring if len(c) >= 2])


def nearest_coastline_point(
    query_lat: float,
    query_lng: float,
    rings: list[list[tuple[float, float]]],
) -> tuple[float, float, float] | None:
    """링 목록에서 지점과 가장 가까운 해안선 좌표와 거리(해리)를 반환한다.

    Returns:
        (distance_nm, coastline_lng, coastline_lat) 또는 None
    """
    best_dist: float | None = None
    best_lng: float = 0.0
    best_lat: float = 0.0
    for ring in rings:
        for lng, lat in ring:
            d = haversine_nm(query_lat, query_lng, lat, lng)
            if best_dist is None or d < best_dist:
                best_dist = d
                best_lng = lng
                best_lat = lat
    if best_dist is None:
        return None
    return (best_dist, best_lng, best_lat)


def find_nearest_island(
    islands: list[Island], query_lat: float, query_lng: float
) -> dict[str, object]:
    nearest_island = min(
        islands,
        key=lambda island: haversine_nm(island.lat, island.lng, query_lat, query_lng),
    )
    distance_nm = haversine_nm(
        nearest_island.lat,
        nearest_island.lng,
        query_lat,
        query_lng,
    )

    result: dict[str, object] = {
        "query_lat": query_lat,
        "query_lng": query_lng,
        "distance_nm": round(distance_nm, 3),
        "island": asdict(nearest_island),
    }

    if distance_nm >= ZERO_DISTANCE_NM:
        bearing = initial_bearing(
            nearest_island.lat,
            nearest_island.lng,
            query_lat,
            query_lng,
        )
        result["bearing_deg"] = round(bearing, 1)
        result["direction"] = bearing_to_direction(bearing)
        result["summary"] = (
            f"{nearest_island.name} {result['direction']} {format_distance_nm(distance_nm)}해리"
        )
    else:
        result["bearing_deg"] = None
        result["direction"] = None
        result["summary"] = f"{nearest_island.name} {format_distance_nm(distance_nm)}해리"

    return result


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "입력 좌표를 기준으로 API 상 대표좌표가 가장 가까운 섬을 찾고 "
            "방위와 거리(해리)를 계산합니다."
        )
    )
    parser.add_argument("lat", help='위도. 예: 34.071353 또는 "34° 21′ 14.62″N"')
    parser.add_argument("lng", help='경도. 예: 125.116658 또는 "126° 50′ 47.09″E"')
    parser.add_argument(
        "--service-key",
        default=os.getenv("ISLAND_SERVICE_KEY", DEFAULT_SERVICE_KEY),
        help="공공데이터 API 서비스키. 미지정 시 현재 기본값 사용",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="사람이 읽는 문장 대신 JSON으로 출력",
    )
    parser.add_argument(
        "--island-type",
        choices=("all", "inhabited", "uninhabited"),
        default="all",
        help="섬 유형 필터. all=전체, inhabited=유인도만, uninhabited=무인도만",
    )
    parser.add_argument(
        "--refresh-cache",
        action="store_true",
        help="로컬 캐시를 무시하고 API에서 다시 내려받기",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    try:
        query_lat = parse_coordinate(args.lat)
        query_lng = parse_coordinate(args.lng)
    except ValueError as exc:
        print(f"입력 좌표 해석 실패: {exc}", file=sys.stderr)
        return 1

    if not (-90 <= query_lat <= 90 and -180 <= query_lng <= 180):
        print("입력 좌표 범위가 올바르지 않습니다.", file=sys.stderr)
        return 1

    try:
        if args.refresh_cache and os.path.exists(CACHE_PATH):
            os.remove(CACHE_PATH)
        islands = fetch_islands(args.service_key, args.island_type)
        result = find_nearest_island(islands, query_lat, query_lng)
    except Exception as exc:
        print(f"최근접 섬 계산 실패: {exc}", file=sys.stderr)
        return 1

    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(result["summary"])

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
