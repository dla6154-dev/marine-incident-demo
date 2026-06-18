from __future__ import annotations

import base64
import datetime
import hashlib
import json
import os
import pathlib
import struct
import threading
import urllib.error
import urllib.parse
import urllib.request
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

# ── WebSocket (pure Python, no extra deps) ───────────────────────────────────
_ws_clients: set = set()
_ws_lock = threading.Lock()
_ws_latest_state: dict | None = None   # 마지막 폼 상태 (신규 접속자에게 전송)
_WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"


def _ws_handshake(handler) -> None:
    key = handler.headers.get("Sec-WebSocket-Key", "")
    accept = base64.b64encode(
        hashlib.sha1((key + _WS_GUID).encode()).digest()
    ).decode()
    handler.send_response(101)
    handler.send_header("Upgrade", "websocket")
    handler.send_header("Connection", "Upgrade")
    handler.send_header("Sec-WebSocket-Accept", accept)
    handler.end_headers()


def _ws_read_frame(sock):
    """WebSocket 프레임 읽기. (opcode, bytes) 또는 (None, None) 반환."""
    try:
        header = b""
        while len(header) < 2:
            chunk = sock.recv(2 - len(header))
            if not chunk:
                return None, None
            header += chunk
        b1, b2 = header
        opcode = b1 & 0x0F
        masked = bool(b2 & 0x80)
        length = b2 & 0x7F
        if length == 126:
            length = struct.unpack(">H", sock.recv(2))[0]
        elif length == 127:
            length = struct.unpack(">Q", sock.recv(8))[0]
        mask = sock.recv(4) if masked else b""
        data = bytearray()
        remaining = length
        while remaining > 0:
            chunk = sock.recv(min(remaining, 4096))
            if not chunk:
                return None, None
            data.extend(chunk)
            remaining -= len(chunk)
        if masked:
            data = bytes(b ^ mask[i % 4] for i, b in enumerate(data))
        return opcode, bytes(data)
    except Exception:
        return None, None


def _ws_send(sock, text: str) -> bool:
    """WebSocket 텍스트 프레임 전송."""
    try:
        payload = text.encode("utf-8")
        n = len(payload)
        header = bytearray([0x81])
        if n < 126:
            header.append(n)
        elif n < 65536:
            header.append(126)
            header.extend(struct.pack(">H", n))
        else:
            header.append(127)
            header.extend(struct.pack(">Q", n))
        sock.sendall(bytes(header) + payload)
        return True
    except Exception:
        return False


def _ws_broadcast(message: str, exclude=None) -> None:
    """연결된 모든 클라이언트에 메시지 브로드캐스트."""
    with _ws_lock:
        clients = set(_ws_clients)
    dead: set = set()
    for sock in clients:
        if sock is exclude:
            continue
        if not _ws_send(sock, message):
            dead.add(sock)
    if dead:
        with _ws_lock:
            _ws_clients.difference_update(dead)

from fire_stations import (
    DEFAULT_SERVICE_KEY as DEFAULT_SAFEMAP_SERVICE_KEY,
    fetch_fire_stations,
)
from health_centers import fetch_health_centers
from hospitals import fetch_hospitals
from kcg_stations import fetch_kcg_stations, _fetch_from_url, API_BRANCH_URL, DEFAULT_SERVICE_KEY as DEFAULT_KCG_SERVICE_KEY
from nearest_island import (
    fetch_islands_wfs,
    find_nearest_island_wfs,
)


HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
ROOT_DIR = pathlib.Path(__file__).resolve().parent
IS_RAILWAY = bool(os.getenv("RAILWAY_PUBLIC_DOMAIN") or os.getenv("RAILWAY_ENVIRONMENT"))
VWORLD_API_KEY = os.getenv(
    "VWORLD_API_KEY", "9ACC81DD-8F5F-335A-B8C0-04190CEEF1C1"
)
VWORLD_DOMAIN = os.getenv("VWORLD_DOMAIN", "localhost")
VWORLD_DATA_URL = "https://api.vworld.kr/req/data"
VWORLD_WMS_URL = "https://api.vworld.kr/req/wms"
SAFEMAP_SERVICE_KEY = os.getenv("SAFEMAP_SERVICE_KEY", DEFAULT_SAFEMAP_SERVICE_KEY)
KMA_AUTH_KEY = os.getenv("KMA_AUTH_KEY", "QtgDsqcuTp2YA7KnLo6dcA")
KMA_APIHUB_BASE = "https://apihub.kma.go.kr/api/typ01"

FIRE_STATION_CACHE: list[dict] | None = None
HEALTH_CENTER_CACHE: list[dict] | None = None
HOSPITAL_CACHE: list[dict] | None = None
KCG_STATION_CACHE: list[dict] | None = None

# WFS 결과 캐시 (메모리 + 디스크 병행)
import time as _time
WFS_CACHE: dict[str, list] = {}          # 메모리 캐시: key → features
WFS_CACHE_TTL = 7 * 24 * 3600           # 7일
WFS_GRID_DEG = 0.25                      # 0.25도 격자 (≈15nm)
WFS_DISK_CACHE_DIR = ROOT_DIR / ".cache" / "wfs"


def _wfs_cache_key(lat: float, lng: float, island_type: str) -> str:
    g = WFS_GRID_DEG
    glat = round(round(lat / g) * g, 4)
    glng = round(round(lng / g) * g, 4)
    return f"{glat}_{glng}_{island_type}"


def _wfs_disk_path(key: str) -> pathlib.Path:
    return WFS_DISK_CACHE_DIR / f"{key}.json"


def get_cached_wfs(lat: float, lng: float, island_type: str):
    key = _wfs_cache_key(lat, lng, island_type)
    if key in WFS_CACHE:
        return WFS_CACHE[key]
    path = _wfs_disk_path(key)
    if path.exists() and (_time.time() - path.stat().st_mtime) < WFS_CACHE_TTL:
        try:
            features = json.loads(path.read_text(encoding="utf-8"))
            WFS_CACHE[key] = features
            return features
        except Exception:
            pass
    return None


def set_cached_wfs(lat: float, lng: float, island_type: str, features: list) -> None:
    key = _wfs_cache_key(lat, lng, island_type)
    WFS_CACHE[key] = features
    try:
        WFS_DISK_CACHE_DIR.mkdir(parents=True, exist_ok=True)
        _wfs_disk_path(key).write_text(json.dumps(features, ensure_ascii=False), encoding="utf-8")
    except Exception as exc:
        print(f"[wfs-cache] disk write failed: {exc}")


def _load_bundle(filename: str) -> list[dict]:
    return json.loads((ROOT_DIR / "data" / filename).read_text(encoding="utf-8"))


def get_fire_stations() -> list[dict]:
    global FIRE_STATION_CACHE
    if FIRE_STATION_CACHE is None:
        if IS_RAILWAY:
            FIRE_STATION_CACHE = _load_bundle("fire_stations.json")
        else:
            FIRE_STATION_CACHE = fetch_fire_stations(SAFEMAP_SERVICE_KEY)
    return FIRE_STATION_CACHE


def get_health_centers() -> list[dict]:
    global HEALTH_CENTER_CACHE
    if HEALTH_CENTER_CACHE is None:
        if IS_RAILWAY:
            HEALTH_CENTER_CACHE = _load_bundle("health_centers.json")
        else:
            HEALTH_CENTER_CACHE = fetch_health_centers(SAFEMAP_SERVICE_KEY)
    return HEALTH_CENTER_CACHE


def get_hospitals() -> list[dict]:
    global HOSPITAL_CACHE
    if HOSPITAL_CACHE is None:
        if IS_RAILWAY:
            HOSPITAL_CACHE = _load_bundle("hospitals.json")
        else:
            HOSPITAL_CACHE = fetch_hospitals(SAFEMAP_SERVICE_KEY)
    return HOSPITAL_CACHE


def get_kcg_stations() -> list[dict]:
    global KCG_STATION_CACHE
    if KCG_STATION_CACHE is None:
        if IS_RAILWAY:
            KCG_STATION_CACHE = _load_bundle("kcg_stations.json")
        else:
            stations = fetch_kcg_stations()
            if not any("출장소" in s.get("name", "") for s in stations):
                try:
                    branches = _fetch_from_url(API_BRANCH_URL, DEFAULT_KCG_SERVICE_KEY)
                    existing = {s["id"] for s in stations}
                    for b in branches:
                        if b["id"] not in existing:
                            stations.append(b)
                            existing.add(b["id"])
                    print(f"[kcg-stations] 출장소 {len(branches)}개 병합 완료, 총 {len(stations)}개")
                except Exception as exc:
                    print(f"[kcg-stations] 출장소 병합 실패: {exc}")
            KCG_STATION_CACHE = stations
    return KCG_STATION_CACHE


def _kma_fetch(url: str) -> str:
    import ssl
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    req = urllib.request.Request(url, headers={"User-Agent": "marine-incident-demo/1.0"})
    with urllib.request.urlopen(req, timeout=15, context=ctx) as r:
        return r.read().decode("euc-kr", errors="replace")


def _kma_val(v: str):
    """숫자 변환. 결측(-9, -99 등) → None."""
    v = v.strip()
    if not v or v in ("-", ""):
        return None
    try:
        f = float(v)
        return None if f <= -9 else f
    except ValueError:
        return v or None


def _deg_to_dir(deg) -> str:
    if deg is None:
        return ""
    dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
            "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    return dirs[int((float(deg) + 11.25) / 22.5) % 16]


def _parse_sea_obs(text: str, stn: str) -> dict | None:
    """해상 관측자료(sea_obs.php) 쉼표 구분 파싱.
    col: 0=TP 1=TM 2=STN_ID 3=STN_KO 4=LON 5=LAT 6=WH 7=WD 8=WS 9=WS_GST 10=TW 11=TA 12=PA 13=HM
    """
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        parts = [p.strip() for p in line.split(",")]
        if len(parts) < 13:
            continue
        if stn != "0" and parts[2] != stn:
            continue
        wd = _kma_val(parts[7])
        ws = _kma_val(parts[8])
        return {
            "stn": parts[2],
            "name": parts[3],
            "tm": parts[1],
            "wind_dir_deg": wd,
            "wind_dir": _deg_to_dir(wd),
            "wind_speed": ws,
            "wind_gust": _kma_val(parts[9]),
            "wave_height": _kma_val(parts[6]),
            "sea_temp": _kma_val(parts[10]),
            "air_temp": _kma_val(parts[11]),
            "pressure": _kma_val(parts[12]),
            "humidity": _kma_val(parts[13]) if len(parts) > 13 else None,
        }
    return None


def _parse_buoy(text: str, stn: str) -> dict | None:
    """기상청 BUOY 파싱.
    필드: TM STN WD1 WS1 WS1_GST WD2 WS2 WS2_GST PA HM TA TW WH_MAX WH_SIG WH_AVE WP WO
    """
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        parts = line.split()
        if len(parts) < 14:
            continue
        if stn != "0" and parts[1].strip() != stn:
            continue
        wd  = _kma_val(parts[2])
        ws  = _kma_val(parts[3])
        wsg = _kma_val(parts[4])
        wh  = _kma_val(parts[13])   # WH_SIG
        wp  = _kma_val(parts[15]) if len(parts) > 15 else None
        ta  = _kma_val(parts[10])
        tw  = _kma_val(parts[11])
        return {
            "stn": parts[1].strip(),
            "tm": parts[0].strip(),
            "wind_dir_deg": wd,
            "wind_dir": _deg_to_dir(wd),
            "wind_speed": ws,
            "wind_gust": wsg,
            "wave_height": wh,
            "wave_period": wp,
            "air_temp": ta,
            "sea_temp": tw,
            "pressure": _kma_val(parts[8]),
            "humidity": _kma_val(parts[9]),
        }
    return None


def _fetch_open_meteo(lat: float, lng: float) -> dict | None:
    """Open-Meteo API로 기상+해양 데이터 조회 — 대기/해양 병렬 호출."""
    import ssl
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    atmos_url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat}&longitude={lng}"
        f"&current=wind_speed_10m,wind_direction_10m,temperature_2m"
        f"&wind_speed_unit=ms&timezone=Asia%2FSeoul"
    )
    marine_url = (
        f"https://marine-api.open-meteo.com/v1/marine?"
        f"latitude={lat}&longitude={lng}"
        f"&current=wave_height&timezone=Asia%2FSeoul"
    )

    atmos_result: dict = {}
    marine_result: dict = {}

    def _fetch_atmos():
        try:
            req = urllib.request.Request(atmos_url, headers={"User-Agent": "marine-incident-demo/1.0"})
            with urllib.request.urlopen(req, timeout=8, context=ctx) as r:
                atmos_result.update(json.loads(r.read()).get("current", {}))
        except Exception as exc:
            print(f"[open-meteo] atmos error: {exc}")

    def _fetch_marine():
        try:
            req = urllib.request.Request(marine_url, headers={"User-Agent": "marine-incident-demo/1.0"})
            with urllib.request.urlopen(req, timeout=8, context=ctx) as r:
                marine_result.update(json.loads(r.read()).get("current", {}))
        except Exception as exc:
            print(f"[open-meteo] marine error: {exc}")

    t1 = threading.Thread(target=_fetch_atmos)
    t2 = threading.Thread(target=_fetch_marine)
    t1.start(); t2.start()
    t1.join(); t2.join()

    wd = atmos_result.get("wind_direction_10m")
    ws = atmos_result.get("wind_speed_10m")
    ta = atmos_result.get("temperature_2m")
    wh = marine_result.get("wave_height")

    if wd is None and ws is None and wh is None:
        return None
    return {
        "stn": "open-meteo",
        "name": "Open-Meteo",
        "tm": "",
        "wind_dir_deg": wd,
        "wind_dir": _deg_to_dir(wd),
        "wind_speed": ws,
        "wind_gust": None,
        "wave_height": wh,
        "sea_temp": None,
        "air_temp": ta,
        "pressure": None,
        "humidity": None,
        "source": "open-meteo",
    }


_ISLANDS_CACHE: list[dict] | None = None

def _get_islands_from_bundle() -> list[dict]:
    global _ISLANDS_CACHE
    if _ISLANDS_CACHE is None:
        path = ROOT_DIR / "data" / "islands.json"
        _ISLANDS_CACHE = json.loads(path.read_text(encoding="utf-8"))
    return _ISLANDS_CACHE


def _find_nearest_island_from_bundle(lat: float, lng: float, island_type_filter: str) -> dict | None:
    """번들된 섬 데이터(data/islands.json)에서 가장 가까운 섬 검색."""
    from nearest_island import (
        haversine_nm, initial_bearing, bearing_to_direction,
        format_distance_nm, ZERO_DISTANCE_NM,
    )
    islands = _get_islands_from_bundle()
    best: dict | None = None
    best_dist = float("inf")
    for isl in islands:
        if island_type_filter == "inhabited" and isl.get("type") != "유인도":
            continue
        if island_type_filter == "uninhabited" and isl.get("type") != "무인도":
            continue
        dist = haversine_nm(lat, lng, isl["lat"], isl["lng"])
        if dist < best_dist:
            best_dist = dist
            best = isl

    if best is None or best_dist > 120:  # 120nm 이상이면 무효
        return None

    name = best["name"]
    ilat, ilng = best["lat"], best["lng"]
    res: dict = {
        "query_lat": lat,
        "query_lng": lng,
        "distance_nm": round(best_dist, 3),
        "coastline_distance_nm": round(best_dist, 3),
        "coastline_point": {"lat": round(ilat, 6), "lng": round(ilng, 6)},
        "island": {
            "island_id": best.get("id", ""),
            "name": name,
            "island_type": best.get("type", "도서"),
            "location": best.get("location", ""),
            "lat": round(ilat, 6),
            "lng": round(ilng, 6),
        },
    }
    if best_dist >= ZERO_DISTANCE_NM:
        bearing = initial_bearing(ilat, ilng, lat, lng)
        res["bearing_deg"] = round(bearing, 1)
        res["direction"] = bearing_to_direction(bearing)
        res["summary"] = f"{name} {res['direction']} {format_distance_nm(best_dist)}해리"
    else:
        res["bearing_deg"] = None
        res["direction"] = None
        res["summary"] = f"{name} {format_distance_nm(best_dist)}해리"
    return res


def _fetch_nearest_island_overpass(lat: float, lng: float, island_type_filter: str) -> dict | None:
    """Overpass API(OSM)로 주변 섬 검색 — VWorld 접근 불가 환경 fallback."""
    import ssl
    from nearest_island import (
        haversine_nm, initial_bearing, bearing_to_direction,
        format_distance_nm, ZERO_DISTANCE_NM,
    )

    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    radius_m = 111120  # ~60nm
    query = (
        f"[out:json][timeout:30];"
        f"("
        f'node["place"~"^(island|islet)$"](around:{radius_m},{lat},{lng});'
        f'way["place"~"^(island|islet)$"](around:{radius_m},{lat},{lng});'
        f'relation["place"~"^(island|islet)$"](around:{radius_m},{lat},{lng});'
        f");out center;"
    )
    url = "https://overpass-api.de/api/interpreter"
    data_enc = urllib.parse.urlencode({"data": query}).encode()
    req = urllib.request.Request(url, data=data_enc, headers={"User-Agent": "marine-incident-demo/1.0"})
    with urllib.request.urlopen(req, timeout=35, context=ctx) as r:
        elements = json.loads(r.read()).get("elements", [])

    best: dict | None = None
    best_dist = float("inf")
    for el in elements:
        if "lat" in el and "lon" in el:
            elat, elng = el["lat"], el["lon"]
        elif "center" in el:
            elat, elng = el["center"]["lat"], el["center"]["lon"]
        else:
            continue
        if not (33 <= elat <= 39 and 124 <= elng <= 132):
            continue
        tags = el.get("tags", {})
        name = tags.get("name:ko") or tags.get("name") or ""
        if not name:
            continue
        dist = haversine_nm(lat, lng, elat, elng)
        if dist < best_dist:
            best_dist = dist
            best = {"name": name, "lat": elat, "lng": elng}

    if not best:
        return None

    name = best["name"]
    ilat, ilng, dist_nm = best["lat"], best["lng"], best_dist
    res: dict = {
        "query_lat": lat,
        "query_lng": lng,
        "distance_nm": round(dist_nm, 3),
        "coastline_distance_nm": round(dist_nm, 3),
        "coastline_point": {"lat": round(ilat, 6), "lng": round(ilng, 6)},
        "island": {
            "island_id": "",
            "name": name,
            "island_type": "도서",
            "location": "",
            "lat": round(ilat, 6),
            "lng": round(ilng, 6),
        },
    }
    if dist_nm >= ZERO_DISTANCE_NM:
        bearing = initial_bearing(ilat, ilng, lat, lng)
        res["bearing_deg"] = round(bearing, 1)
        res["direction"] = bearing_to_direction(bearing)
        res["summary"] = f"{name} {res['direction']} {format_distance_nm(dist_nm)}해리"
    else:
        res["bearing_deg"] = None
        res["direction"] = None
        res["summary"] = f"{name} {format_distance_nm(dist_nm)}해리"
    return res


def _parse_aws(text: str, stn: str) -> dict | None:
    """AWS 분자료(nph-aws2_min) 파싱 – disp=1 형식."""
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        parts = line.split()
        if len(parts) < 8:
            continue
        if stn != "0" and parts[1].strip() != stn:
            continue
        wd = _kma_val(parts[3])
        ws = _kma_val(parts[4])
        return {
            "stn": parts[1].strip(),
            "tm": parts[0].strip(),
            "wind_dir_deg": wd,
            "wind_dir": _deg_to_dir(wd),
            "wind_speed": ws,
            "wind_gust": _kma_val(parts[5]) if len(parts) > 5 else None,
            "air_temp": _kma_val(parts[6]) if len(parts) > 6 else None,
            "pressure": _kma_val(parts[7]) if len(parts) > 7 else None,
        }
    return None


def build_vworld_query(
    query_items: list[tuple[str, str]],
    *,
    service: str,
    request: str,
) -> str:
    lowered = {key.lower() for key, _ in query_items}
    merged = list(query_items)
    if "service" not in lowered:
        merged.append(("service", service))
    if "request" not in lowered:
        merged.append(("request", request))
    if "key" not in lowered:
        merged.append(("key", VWORLD_API_KEY))
    if "domain" not in lowered:
        merged.append(("domain", VWORLD_DOMAIN))
    # Railway 배포 시 실제 서비스 도메인으로 override
    railway_domain = os.getenv("RAILWAY_PUBLIC_DOMAIN", "")
    if railway_domain:
        merged = [(k, v) for k, v in merged if k != "domain"]
        merged.append(("domain", railway_domain))
    return urllib.parse.urlencode(merged, doseq=True)



def proxy_request(url: str, handler: "DemoRequestHandler") -> None:
    import ssl
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "marine-incident-demo/1.0",
            "Accept": "*/*",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=30, context=ctx) as response:
            body = response.read()
            content_type = response.headers.get_content_type()
            charset = response.headers.get_content_charset() or "utf-8"
            handler.send_response(response.status)
            if content_type.startswith("text/") or content_type == "application/json":
                header_value = f"{content_type}; charset={charset}"
            else:
                header_value = content_type
            handler.send_header("Content-Type", header_value)
            handler.send_header("Content-Length", str(len(body)))
            handler.end_headers()
            handler.wfile.write(body)
    except urllib.error.HTTPError as exc:
        body = exc.read()
        handler.send_response(exc.code)
        handler.send_header("Content-Type", exc.headers.get("Content-Type", "text/plain"))
        handler.send_header("Content-Length", str(len(body)))
        handler.end_headers()
        handler.wfile.write(body)
    except Exception as exc:
        print(f"[proxy_request] ERROR {url[:80]}: {exc}")
        err = str(exc).encode("utf-8")
        handler.send_response(502)
        handler.send_header("Content-Type", "text/plain; charset=utf-8")
        handler.send_header("Content-Length", str(len(err)))
        handler.end_headers()
        handler.wfile.write(err)


class DemoRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT_DIR), **kwargs)

    def do_GET(self) -> None:
        # WebSocket 업그레이드 요청 처리
        if self.headers.get("Upgrade", "").lower() == "websocket":
            self.handle_websocket()
            return
        parsed = urllib.parse.urlsplit(self.path)
        if parsed.path == "/api/nearest":
            self.handle_nearest(parsed.query)
            return
        if parsed.path == "/api/vworld/data":
            self.handle_vworld_data(parsed.query)
            return
        if parsed.path == "/api/vworld/wms":
            self.handle_vworld_wms(parsed.query)
            return
        if parsed.path == "/api/fire-stations":
            self.handle_fire_stations()
            return
        if parsed.path == "/api/health-centers":
            self.handle_health_centers()
            return
        if parsed.path == "/api/hospitals":
            self.handle_hospitals()
            return
        if parsed.path == "/api/kcg-stations":
            self.handle_kcg_stations()
            return
        if parsed.path == "/api/weather-stations":
            self.handle_weather_stations()
            return
        if parsed.path == "/api/kma-weather":
            self.handle_kma_weather(parsed.query)
            return
        if parsed.path == "/boundary-preview":
            self.path = "/boundary-preview.html"
            super().do_GET()
            return
        if parsed.path == "/fire-station-preview":
            self.path = "/fire-station-preview.html"
            super().do_GET()
            return
        if parsed.path == "/":
            self.path = "/index.html"
        super().do_GET()

    def handle_nearest(self, query_string: str) -> None:
        params = urllib.parse.parse_qs(query_string)
        lat_raw = params.get("lat", [None])[0]
        lng_raw = params.get("lng", [None])[0]
        island_type = params.get("islandType", ["inhabited"])[0]

        if lat_raw is None or lng_raw is None:
            self.send_json({"error": "lat and lng are required"}, status=HTTPStatus.BAD_REQUEST)
            return
        if island_type not in {"all", "inhabited", "uninhabited"}:
            self.send_json({"error": "invalid islandType"}, status=HTTPStatus.BAD_REQUEST)
            return

        try:
            lat = float(lat_raw)
            lng = float(lng_raw)
        except ValueError:
            self.send_json({"error": "lat and lng must be valid decimal numbers"}, status=HTTPStatus.BAD_REQUEST)
            return

        result = None
        # 1순위: VWorld WFS (로컬/한국 IP 환경)
        try:
            wfs_features = get_cached_wfs(lat, lng, island_type)
            if wfs_features is not None:
                print(f"[wfs] cache hit features={len(wfs_features)}")
            else:
                for radius_nm in (30.0, 60.0):
                    wfs_features = fetch_islands_wfs(
                        lat, lng, radius_nm,
                        vworld_key=VWORLD_API_KEY,
                        vworld_domain=VWORLD_DOMAIN,
                        island_type_filter=island_type,
                    )
                    print(f"[wfs] radius={radius_nm}nm features={len(wfs_features)}")
                    if wfs_features:
                        break
                set_cached_wfs(lat, lng, island_type, wfs_features)
            result = find_nearest_island_wfs(wfs_features, lat, lng)
        except Exception as exc:
            print(f"[wfs] VWorld failed ({exc}), trying bundle...")

        # 2순위: 번들 섬 데이터 (data/islands.json — Railway 환경 primary fallback)
        if result is None:
            try:
                result = _find_nearest_island_from_bundle(lat, lng, island_type)
                if result:
                    print(f"[bundle] found: {result.get('island', {}).get('name')}")
            except Exception as exc2:
                print(f"[bundle] error: {exc2}")

        # 3순위: Overpass API (최후 수단)
        if result is None:
            try:
                result = _fetch_nearest_island_overpass(lat, lng, island_type)
                if result:
                    print(f"[overpass] found: {result.get('island', {}).get('name')}")
            except Exception as exc3:
                print(f"[overpass] error: {exc3}")

        if result is None:
            self.send_json({"error": "주변 60NM 이내에 유인도가 없습니다."}, status=HTTPStatus.NOT_FOUND)
            return

        self.send_json(result)

    def handle_vworld_data(self, query_string: str) -> None:
        query_items = urllib.parse.parse_qsl(query_string, keep_blank_values=True)
        if not any(key.lower() == "format" for key, _ in query_items):
            query_items.append(("format", "json"))
        query = build_vworld_query(query_items, service="data", request="GetFeature")
        proxy_request(f"{VWORLD_DATA_URL}?{query}", self)

    def handle_vworld_wms(self, query_string: str) -> None:
        query_items = urllib.parse.parse_qsl(query_string, keep_blank_values=True)
        query = build_vworld_query(query_items, service="WMS", request="GetMap")
        proxy_request(f"{VWORLD_WMS_URL}?{query}", self)

    def handle_fire_stations(self) -> None:
        try:
            stations = get_fire_stations()
        except Exception as exc:
            self.send_json({"error": str(exc)}, status=HTTPStatus.BAD_GATEWAY)
            return

        self.send_json(
            {
                "count": len(stations),
                "stations": stations,
            }
        )

    def handle_health_centers(self) -> None:
        try:
            centers = get_health_centers()
        except Exception as exc:
            import traceback
            print(f"[health-centers] ERROR: {exc}")
            traceback.print_exc()
            self.send_json({"error": str(exc)}, status=HTTPStatus.BAD_GATEWAY)
            return

        self.send_json({"count": len(centers), "centers": centers})

    def handle_hospitals(self) -> None:
        try:
            hospitals = get_hospitals()
        except Exception as exc:
            import traceback
            print(f"[hospitals] ERROR: {exc}")
            traceback.print_exc()
            self.send_json({"error": str(exc)}, status=HTTPStatus.BAD_GATEWAY)
            return

        self.send_json({"count": len(hospitals), "hospitals": hospitals})

    def handle_kcg_stations(self) -> None:
        try:
            stations = get_kcg_stations()
        except Exception as exc:
            import traceback
            print(f"[kcg-stations] ERROR: {exc}")
            traceback.print_exc()
            self.send_json({"error": str(exc)}, status=HTTPStatus.BAD_GATEWAY)
            return

        self.send_json({"count": len(stations), "stations": stations})

    def handle_websocket(self) -> None:
        global _ws_latest_state
        _ws_handshake(self)
        sock = self.request
        sock.settimeout(None)

        # 신규 접속자에게 현재 최신 상태 즉시 전송
        with _ws_lock:
            state_snapshot = _ws_latest_state
        if state_snapshot:
            _ws_send(sock, json.dumps({"type": "state", "data": state_snapshot}, ensure_ascii=False))

        with _ws_lock:
            _ws_clients.add(sock)
        client_ip = self.client_address[0]
        print(f"[ws] {client_ip} connected  (total: {len(_ws_clients)})")

        try:
            while True:
                opcode, data = _ws_read_frame(sock)
                if opcode is None:
                    break
                if opcode == 8:   # Close
                    break
                if opcode == 9:   # Ping → Pong
                    try:
                        sock.sendall(bytes([0x8A, 0x00]))
                    except Exception:
                        break
                    continue
                if opcode == 1:   # Text
                    try:
                        text = data.decode("utf-8")
                        msg = json.loads(text)
                        if msg.get("type") == "state":
                            _ws_latest_state = msg.get("data")
                        _ws_broadcast(text, exclude=sock)
                    except Exception:
                        pass
        finally:
            with _ws_lock:
                _ws_clients.discard(sock)
            print(f"[ws] {client_ip} disconnected  (total: {len(_ws_clients)})")

    def handle_kma_weather(self, query_string: str) -> None:
        params = urllib.parse.parse_qs(query_string)
        stn = params.get("stn", ["0"])[0]
        stype = params.get("type", ["sea"])[0]   # sea | buoy | aws
        lat_raw = params.get("lat", [None])[0]
        lng_raw = params.get("lng", [None])[0]
        # tm 없으면 현재 시각 기준 (30분 전 – 데이터 확정 보장)
        tm_raw = params.get("tm", [None])[0]
        if tm_raw:
            tm = tm_raw
        else:
            past = datetime.datetime.now() - datetime.timedelta(minutes=30)
            tm = past.strftime("%Y%m%d%H%M")

        result = None
        # 1순위: KMA API — Railway 환경에서는 한국 IP 제한으로 스킵
        if not IS_RAILWAY:
            try:
                if stype == "buoy":
                    url = f"{KMA_APIHUB_BASE}/url/kma_buoy.php?tm={tm}&stn={stn}&help=1&authKey={KMA_AUTH_KEY}"
                    raw = _kma_fetch(url)
                    result = _parse_buoy(raw, stn)
                elif stype == "aws":
                    url = f"{KMA_APIHUB_BASE}/cgi-bin/url/nph-aws2_min?tm2={tm}&stn={stn}&disp=1&help=1&authKey={KMA_AUTH_KEY}"
                    raw = _kma_fetch(url)
                    result = _parse_aws(raw, stn)
                else:  # sea (해양종합)
                    url = f"{KMA_APIHUB_BASE}/url/sea_obs.php?tm={tm}&stn={stn}&help=1&authKey={KMA_AUTH_KEY}"
                    raw = _kma_fetch(url)
                    result = _parse_sea_obs(raw, stn)
            except Exception as exc:
                print(f"[kma] failed (stn={stn}): {exc}")

        # 2순위: Open-Meteo (KMA 접근 불가 환경 fallback)
        if result is None and lat_raw and lng_raw:
            try:
                result = _fetch_open_meteo(float(lat_raw), float(lng_raw))
                if result:
                    print(f"[open-meteo] fallback ok stn={stn}")
            except Exception as exc2:
                print(f"[open-meteo] error: {exc2}")

        if result is None:
            self.send_json({"error": "no_data"}, status=HTTPStatus.NOT_FOUND)
            return
        self.send_json(result)

    def handle_weather_stations(self) -> None:
        try:
            data_path = ROOT_DIR / "data" / "weather_stations.json"
            stations = json.loads(data_path.read_text(encoding="utf-8"))
        except Exception as exc:
            self.send_json({"error": str(exc)}, status=HTTPStatus.BAD_GATEWAY)
            return
        self.send_json({"count": len(stations), "stations": stations})

    def send_json(self, payload: dict, status: HTTPStatus = HTTPStatus.OK) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def _kill_port(port: int) -> None:
    """해당 포트를 점유 중인 Windows 프로세스를 강제 종료한다."""
    import subprocess, re
    try:
        out = subprocess.check_output(
            f'netstat -ano | findstr ":{port} "',
            shell=True, text=True, stderr=subprocess.DEVNULL
        )
        pids = set(re.findall(r"\s(\d+)$", out, re.MULTILINE))
        my_pid = str(os.getpid())
        for pid in pids:
            if pid != my_pid and pid != "0":
                subprocess.call(f"taskkill /F /PID {pid}", shell=True,
                                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                print(f"[server] killed old process PID={pid} on port {port}")
    except Exception:
        pass


def main() -> None:
    import socket, time
    _kill_port(PORT)
    time.sleep(0.5)   # TIME_WAIT 해소 대기
    ThreadingHTTPServer.allow_reuse_address = True
    server = ThreadingHTTPServer((HOST, PORT), DemoRequestHandler)
    server.socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    print(f"Serving demo at http://{HOST}:{PORT}")
    print(f"VWorld domain parameter: {VWORLD_DOMAIN}")
    server.serve_forever()


if __name__ == "__main__":
    main()
