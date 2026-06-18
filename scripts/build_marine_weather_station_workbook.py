from __future__ import annotations

import csv
import json
import math
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

import pandas as pd
import shapefile
from pyproj import Transformer


ROOT = Path(__file__).resolve().parents[1]
BUSAN_CSV = ROOT / "tmp_busan_aton.csv"
LIGHTHOUSE_SHP = next((ROOT / "tmp_lighthouse").rglob("*.shp"))
SEANAME_SHP = next((ROOT / "tmp_seanames").rglob("*.shp"))
OUTPUT_XLSX = ROOT / "docs" / "해양기상_풍향풍속_지점위치정리.xlsx"
OUTPUT_CSV = ROOT / "docs" / "해양기상_풍향풍속_지점위치정리.csv"
OUTPUT_JSON = ROOT / "docs" / "해양기상_풍향풍속_지점위치정리.json"


TARGETS: list[dict[str, str]] = [
    {"mmaf": "101", "office": "부산청", "mmsi": "1019001", "station_name": "남항동방파제등대", "observations": "풍향, 풍속, 기온, 습도, 기압"},
    {"mmaf": "101", "office": "부산청", "mmsi": "1019003", "station_name": "송정리등표", "observations": "풍향, 풍속, 기온, 습도, 기압"},
    {"mmaf": "101", "office": "부산청", "mmsi": "994401579", "station_name": "감천항유도등부표(랜비)", "observations": "풍향, 풍속, 수온, 염분, 기온, 습도, 기압, 유향, 유속"},
    {"mmaf": "101", "office": "부산청", "mmsi": "994401583", "station_name": "신항유도등부표(랜비)", "observations": "풍향, 풍속, 수온, 염분, 기온, 습도, 기압, 유향, 유속"},
    {"mmaf": "101", "office": "부산청", "mmsi": "994401584", "station_name": "부산항신항중앙C호등부표", "observations": "풍향, 풍속, 수온, 염분, 기온, 습도, 기압, 유향, 유속"},
    {"mmaf": "101", "office": "부산청", "mmsi": "994401587", "station_name": "나무섬등대", "observations": "풍향, 풍속, 기온, 습도, 기압"},
    {"mmaf": "101", "office": "부산청", "mmsi": "994401588", "station_name": "가덕도등대", "observations": "풍향, 풍속, 기온, 습도, 기압"},
    {"mmaf": "101", "office": "부산청", "mmsi": "994401594", "station_name": "남형제도등표", "observations": "풍향, 풍속, 기온, 습도, 기압"},
    {"mmaf": "101", "office": "부산청", "mmsi": "994401597", "station_name": "부산항유도등부표(랜비)", "observations": "풍향, 풍속, 수온, 염분, 기온, 습도, 기압, 유향, 유속"},
    {"mmaf": "102", "office": "인천청", "mmsi": "1021013", "station_name": "팔미도등대", "observations": "풍향, 풍속, 기온, 습도, 기압"},
    {"mmaf": "102", "office": "인천청", "mmsi": "1021018", "station_name": "인천항석탄부두A호등대", "observations": "풍향, 풍속, 기온, 습도, 기압"},
    {"mmaf": "102", "office": "인천청", "mmsi": "1021024", "station_name": "민어여등표", "observations": "풍향, 풍속, 기온, 습도, 기압"},
    {"mmaf": "102", "office": "인천청", "mmsi": "1029001", "station_name": "백령도 용기포항여객터미널", "observations": "풍향, 풍속, 기온, 습도, 기압, 시정"},
    {"mmaf": "102", "office": "인천청", "mmsi": "994401014", "station_name": "부도등대", "observations": "풍향, 풍속, 기온, 습도, 기압"},
    {"mmaf": "102", "office": "인천청", "mmsi": "994401015", "station_name": "선미도등대", "observations": "풍향, 풍속, 기온, 습도, 기압"},
    {"mmaf": "102", "office": "인천청", "mmsi": "994401020", "station_name": "소연평도등대", "observations": "풍향, 풍속, 기온, 습도, 기압"},
    {"mmaf": "102", "office": "인천청", "mmsi": "994401021", "station_name": "서포리남방등표", "observations": "풍향, 풍속, 기온, 습도, 기압"},
    {"mmaf": "102", "office": "인천청", "mmsi": "994401022", "station_name": "북장자서등표", "observations": "풍향, 풍속, 기온, 습도, 기압"},
    {"mmaf": "102", "office": "인천청", "mmsi": "994401023", "station_name": "초치암등표", "observations": "풍향, 풍속, 기온, 습도, 기압"},
    {"mmaf": "102", "office": "인천청", "mmsi": "994401039", "station_name": "고식이등표", "observations": "풍향, 풍속, 기온, 습도, 기압"},
    {"mmaf": "103", "office": "여수청", "mmsi": "1030262", "station_name": "여초등표", "observations": "풍향, 풍속, 기온, 습도, 기압"},
    {"mmaf": "103", "office": "여수청", "mmsi": "1030384", "station_name": "여수해만중앙A호유도등부표", "observations": "풍향, 풍속, 수온, 기온, 습도, 기압, 시정, 유향, 유속"},
    {"mmaf": "103", "office": "여수청", "mmsi": "994402917", "station_name": "광양항등표", "observations": "풍향, 풍속, 기온, 습도, 기압, 시정"},
    {"mmaf": "103", "office": "여수청", "mmsi": "994402925", "station_name": "종걸도등대", "observations": "풍향, 풍속, 기온, 습도, 기압"},
    {"mmaf": "104", "office": "울산청", "mmsi": "1041519", "station_name": "울산항동방파제서단등대", "observations": "풍향, 풍속, 기온, 습도, 기압, 시정"},
    {"mmaf": "105", "office": "대산청", "mmsi": "1051101", "station_name": "외연도항동방파제등대", "observations": "풍향, 풍속, 시정"},
    {"mmaf": "105", "office": "대산청", "mmsi": "4402675", "station_name": "소녀암등표", "observations": "풍향, 풍속, 기온, 습도, 기압"},
    {"mmaf": "105", "office": "대산청", "mmsi": "4402692", "station_name": "신도타서등표", "observations": "풍향, 풍속, 기온, 습도, 기압"},
    {"mmaf": "105", "office": "대산청", "mmsi": "4422880", "station_name": "대산항제2항로제3호등부표", "observations": "풍향, 풍속, 수온, 기온, 습도, 기압, 유향, 유속"},
    {"mmaf": "106", "office": "평택청", "mmsi": "994401037", "station_name": "무당서등표", "observations": "풍향, 풍속, 기온, 습도, 기압"},
    {"mmaf": "106", "office": "평택청", "mmsi": "994401042", "station_name": "입파도등대", "observations": "풍향, 풍속, 기온, 습도, 기압"},
    {"mmaf": "107", "office": "목포청", "mmsi": "1079001", "station_name": "안좌여객선터미널", "observations": "풍향, 풍속, 기온, 습도, 기압, 시정"},
    {"mmaf": "107", "office": "목포청", "mmsi": "1079002", "station_name": "홍도등대", "observations": "풍향, 풍속, 기온, 습도, 기압"},
    {"mmaf": "107", "office": "목포청", "mmsi": "1079003", "station_name": "가거도등대", "observations": "풍향, 풍속, 기온, 습도, 기압"},
    {"mmaf": "107", "office": "목포청", "mmsi": "1079004", "station_name": "계마항방파제등대", "observations": "풍향, 풍속, 기온, 습도, 기압"},
    {"mmaf": "107", "office": "목포청", "mmsi": "1079005", "station_name": "매물도등대", "observations": "풍향, 풍속, 기온, 습도, 기압"},
    {"mmaf": "107", "office": "목포청", "mmsi": "1079006", "station_name": "우세도등대", "observations": "풍향, 풍속, 기온, 습도, 기압"},
    {"mmaf": "107", "office": "목포청", "mmsi": "1079007", "station_name": "대노록도등대", "observations": "풍향, 풍속, 기온, 습도, 기압"},
    {"mmaf": "107", "office": "목포청", "mmsi": "1079008", "station_name": "외달도등표", "observations": "풍향, 풍속, 기온, 습도, 기압"},
    {"mmaf": "108", "office": "군산청", "mmsi": "1085555", "station_name": "상왕등도등대", "observations": "풍향, 풍속, 기온, 습도, 기압, 시정"},
    {"mmaf": "108", "office": "군산청", "mmsi": "4406120", "station_name": "비응항서방파제남단등대", "observations": "풍향, 풍속, 기온, 습도, 기압, 시정"},
    {"mmaf": "108", "office": "군산청", "mmsi": "994403652", "station_name": "군산연도등대", "observations": "풍향, 풍속, 기온, 습도, 기압, 시정"},
    {"mmaf": "108", "office": "군산청", "mmsi": "994403658", "station_name": "흑서등표", "observations": "풍향, 풍속, 기온, 습도, 기압, 시정"},
    {"mmaf": "108", "office": "군산청", "mmsi": "994403661", "station_name": "군산흑도등표", "observations": "풍향, 풍속, 기온, 습도, 기압, 시정"},
    {"mmaf": "109", "office": "마산청", "mmsi": "1095079", "station_name": "흑암등표", "observations": "풍향, 풍속, 기온, 습도, 기압"},
    {"mmaf": "109", "office": "마산청", "mmsi": "994401606", "station_name": "고암등대", "observations": "풍향, 풍속, 기온, 습도, 기압"},
    {"mmaf": "109", "office": "마산청", "mmsi": "994401623", "station_name": "고도등표", "observations": "풍향, 풍속, 기온, 습도, 기압"},
    {"mmaf": "110", "office": "포항청", "mmsi": "1103579", "station_name": "영일만항분리항로등부표(랜비)", "observations": "풍향, 풍속, 수온, 기온, 습도, 유향"},
    {"mmaf": "110", "office": "포항청", "mmsi": "994403582", "station_name": "도동등대", "observations": "풍향, 풍속, 기온, 습도, 기압"},
    {"mmaf": "111", "office": "동해청", "mmsi": "1119808", "station_name": "동해항남방파제등대", "observations": "풍향, 풍속, 기온, 습도, 기압, 시정"},
    {"mmaf": "111", "office": "동해청", "mmsi": "994403807", "station_name": "임원항방파제등대", "observations": "풍향, 풍속, 기온, 습도, 기압, 시정"},
    {"mmaf": "111", "office": "동해청", "mmsi": "994403810", "station_name": "주문진항동방파제등대", "observations": "풍향, 풍속, 기온, 습도, 기압, 시정"},
    {"mmaf": "112", "office": "제주단", "mmsi": "994403894", "station_name": "김녕항서방파제등대", "observations": "풍향, 풍속, 기온, 습도, 기압"},
    {"mmaf": "112", "office": "제주단", "mmsi": "994403895", "station_name": "방서등대", "observations": "풍향, 풍속, 기온, 습도, 기압"},
    {"mmaf": "112", "office": "제주단", "mmsi": "994403896", "station_name": "개민포등대", "observations": "풍향, 풍속, 기온, 습도, 기압"},
    {"mmaf": "112", "office": "제주단", "mmsi": "994403901", "station_name": "종뢰등표", "observations": "풍향, 풍속, 기온, 습도, 기압"},
    {"mmaf": "113", "office": "진도소", "mmsi": "1139001", "station_name": "하조도등대", "observations": "풍향, 풍속, 기온, 습도, 기압"},
    {"mmaf": "113", "office": "진도소", "mmsi": "1139002", "station_name": "아롱도등대", "observations": "풍향, 풍속, 기온, 습도, 기압"},
    {"mmaf": "113", "office": "진도소", "mmsi": "1139006", "station_name": "횡간도등대", "observations": "풍향, 풍속, 기온, 습도, 기압"},
    {"mmaf": "113", "office": "진도소", "mmsi": "1139007", "station_name": "완도항 유도등부표", "observations": "풍향, 풍속, 수온, 기온, 습도, 기압, 유향, 유속"},
]


MANUAL_OVERRIDES: dict[str, dict[str, Any]] = {}


@dataclass
class MatchResult:
    latitude: float | None
    longitude: float | None
    source: str
    source_name: str
    notes: str = ""


def normalize_name(value: str) -> str:
    value = str(value or "")
    value = re.sub(r"\([^)]*\)", "", value)
    value = re.sub(r"[·\-\u2010\u2011\u2012\u2013\u2014\u2212]", "", value)
    value = value.replace(" ", "")
    return value


def build_aliases(name: str) -> list[str]:
    base = normalize_name(name)
    aliases = {base}
    variants = {
        base,
        base.replace("유도등부표", ""),
        base.replace("등부표", ""),
        base.replace("방파제등대", "방파제"),
        base.replace("등대", ""),
        base.replace("등표", ""),
        base.replace("여객선터미널", ""),
        base.replace("여객터미널", ""),
        base.replace("터미널", ""),
        base.replace("랜비", ""),
    }
    aliases.update(v for v in variants if v)
    # Common lighthouse naming simplifications found in official shapefiles.
    for alias in list(aliases):
        aliases.add(alias.replace("항동방파제서단", "항동방파제"))
        aliases.add(alias.replace("항서방파제남단", "항서방파제"))
        aliases.add(alias.replace("항동방파제", "동방파제"))
        aliases.add(alias.replace("항서방파제", "서방파제"))
        aliases.add(alias.replace("중앙C호", "중앙"))
        aliases.add(alias.replace("제2항로제3호", "제2항로"))
        aliases.add(alias.replace("분리항로", ""))
        aliases.add(alias.replace("남방", ""))
        aliases.add(alias.replace("북방", ""))
        aliases.add(alias.replace("타서", ""))
        aliases.add(alias.replace("서수도5호", "서수도"))
        aliases.add(alias.replace("석탄부두A호", "석탄부두"))
    return sorted(a for a in aliases if a)


def dms_to_decimal(token: str) -> float:
    text = token.strip()
    match = re.match(r"(\d+)-(\d+)-(\d+(?:\.\d+)?)([NSEW])", text, re.IGNORECASE)
    if not match:
        raise ValueError(f"Unrecognized DMS token: {token}")
    degrees, minutes, seconds, hemisphere = match.groups()
    value = int(degrees) + int(minutes) / 60 + float(seconds) / 3600
    if hemisphere.upper() in {"S", "W"}:
        value *= -1
    return value


def load_busan_rows() -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    with BUSAN_CSV.open("r", encoding="cp949", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            position = str(row.get("위치", "")).strip()
            lat = lon = None
            if "," in position:
                lat_token, lon_token = [part.strip() for part in position.split(",", 1)]
                lat = dms_to_decimal(lat_token)
                lon = dms_to_decimal(lon_token)
            rows.append(
                {
                    "name": str(row.get("이름", "")).strip(),
                    "address": str(row.get("주소", "")).strip(),
                    "latitude": lat,
                    "longitude": lon,
                    "normalized": normalize_name(str(row.get("이름", ""))),
                }
            )
    return rows


def load_lighthouse_rows() -> list[dict[str, Any]]:
    reader = shapefile.Reader(str(LIGHTHOUSE_SHP), encoding="euc-kr", encodingErrors="replace")
    fields = [field[0] for field in reader.fields[1:]]
    transformer = Transformer.from_crs("EPSG:5179", "EPSG:4326", always_xy=True)
    rows: list[dict[str, Any]] = []
    for shape, record in zip(reader.iterShapes(), reader.iterRecords()):
        item = {fields[index]: record[index] for index in range(len(fields))}
        if not shape.points:
            continue
        x, y = shape.points[0]
        lon, lat = transformer.transform(x, y)
        name = str(item.get("nobjnm") or "").strip()
        rows.append(
            {
                "name": name,
                "source_name": str(item.get("objnam") or "").strip(),
                "latitude": lat,
                "longitude": lon,
                "normalized": normalize_name(name),
            }
        )
    return rows


def load_seaname_rows() -> list[dict[str, Any]]:
    reader = shapefile.Reader(str(SEANAME_SHP), encoding="euc-kr", encodingErrors="replace")
    fields = [field[0] for field in reader.fields[1:]]
    rows: list[dict[str, Any]] = []
    for record in reader.iterRecords():
        item = {fields[index]: record[index] for index in range(len(fields))}
        name = str(item.get("korn_nm") or "").strip()
        lat = item.get("lat")
        lon = item.get("lot")
        try:
            lat = float(lat)
            lon = float(lon)
        except (TypeError, ValueError):
            continue
        rows.append(
            {
                "name": name,
                "class_name": str(item.get("clsf_kor_n") or "").strip(),
                "latitude": lat,
                "longitude": lon,
                "normalized": normalize_name(name),
            }
        )
    return rows


def exact_name_match(name: str, rows: Iterable[dict[str, Any]], source: str) -> MatchResult | None:
    aliases = build_aliases(name)
    for alias in aliases:
        for row in rows:
            if alias and alias == row.get("normalized"):
                source_name = row.get("name", "")
                notes = row.get("address", "") or row.get("class_name", "") or row.get("source_name", "")
                return MatchResult(row.get("latitude"), row.get("longitude"), source, str(source_name), str(notes))
    return None


def contains_name_match(name: str, rows: Iterable[dict[str, Any]], source: str) -> MatchResult | None:
    aliases = build_aliases(name)
    for alias in aliases:
        for row in rows:
            normalized = str(row.get("normalized", ""))
            if alias and normalized and (alias in normalized or normalized in alias):
                source_name = row.get("name", "")
                notes = row.get("address", "") or row.get("class_name", "") or row.get("source_name", "")
                return MatchResult(row.get("latitude"), row.get("longitude"), source, str(source_name), str(notes))
    return None


def find_best_match(
    station_name: str,
    busan_rows: list[dict[str, Any]],
    lighthouse_rows: list[dict[str, Any]],
    seaname_rows: list[dict[str, Any]],
) -> MatchResult | None:
    manual = MANUAL_OVERRIDES.get(station_name)
    if manual:
        return MatchResult(
            latitude=manual.get("latitude"),
            longitude=manual.get("longitude"),
            source="ManualOverride",
            source_name=str(manual.get("source_name", station_name)),
            notes=str(manual.get("notes", "")),
        )

    # Region data with explicit aid positions is the most reliable source.
    match = exact_name_match(station_name, busan_rows, "부산지방해양수산청_항로표지정보")
    if match:
        return match
    match = contains_name_match(station_name, busan_rows, "부산지방해양수산청_항로표지정보")
    if match:
        return match

    match = exact_name_match(station_name, lighthouse_rows, "국립해양조사원_등대")
    if match:
        return match
    match = contains_name_match(station_name, lighthouse_rows, "국립해양조사원_등대")
    if match:
        return match

    match = exact_name_match(station_name, seaname_rows, "국립해양조사원_해양지명")
    if match:
        return match
    match = contains_name_match(station_name, seaname_rows, "국립해양조사원_해양지명")
    if match:
        return match

    return None


def round_or_none(value: float | None) -> float | None:
    if value is None or math.isnan(value):
        return None
    return round(float(value), 6)


def build_rows() -> list[dict[str, Any]]:
    busan_rows = load_busan_rows()
    lighthouse_rows = load_lighthouse_rows()
    seaname_rows = load_seaname_rows()

    compiled_rows: list[dict[str, Any]] = []
    for target in TARGETS:
        match = find_best_match(target["station_name"], busan_rows, lighthouse_rows, seaname_rows)
        compiled_rows.append(
            {
                **target,
                "latitude": round_or_none(match.latitude) if match else None,
                "longitude": round_or_none(match.longitude) if match else None,
                "location_source": match.source if match else "",
                "matched_name": match.source_name if match else "",
                "match_notes": match.notes if match else "제공 자료 기준 자동 매칭 실패",
                "matched": bool(match),
                "lookup_status": "매칭완료" if match else "추가 원본 필요",
            }
        )
    return compiled_rows


def save_outputs(rows: list[dict[str, Any]]) -> None:
    OUTPUT_XLSX.parent.mkdir(parents=True, exist_ok=True)
    df = pd.DataFrame(rows)
    matched_df = df[df["matched"]].copy()
    unmatched_df = df[~df["matched"]].copy()

    with pd.ExcelWriter(OUTPUT_XLSX, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="전체")
        matched_df.to_excel(writer, index=False, sheet_name="매칭완료")
        unmatched_df.to_excel(writer, index=False, sheet_name="확인필요")

    df.to_csv(OUTPUT_CSV, index=False, encoding="utf-8-sig")
    OUTPUT_JSON.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    rows = build_rows()
    save_outputs(rows)
    matched = sum(1 for row in rows if row["matched"])
    total = len(rows)
    print(
        json.dumps(
            {
                "output_xlsx": str(OUTPUT_XLSX),
                "output_csv": str(OUTPUT_CSV),
                "output_json": str(OUTPUT_JSON),
                "matched": matched,
                "unmatched": total - matched,
                "total": total,
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
