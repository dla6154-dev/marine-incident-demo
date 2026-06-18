from __future__ import annotations

import json
import sys
from pathlib import Path

import pandas as pd


SHEET_INDEX = 6

# zero-based column indexes from the verified "26년 현재" sheet layout
COLUMN_INDEX = {
    "operatorLocation": 0,
    "managementBranch": 3,
    "ownerName": 4,
    "companyPhone": 5,
    "routeName": 6,
    "vesselName": 7,
    "vesselType": 16,
    "grossTonnage": 19,
    "passengerCount": 20,
    "crewCount": 21,
    "vehicleLoad": 24,
    "cargoLoadTons": 25,
    "inspectionAgency": 39,
    "vesselNumber": 40,
    "berthInfo": 51,
}


def text(value: object) -> str:
    if value == "" or value is None:
        return ""
    if isinstance(value, float):
        if value.is_integer():
            return str(int(value))
        return f"{value:.3f}".rstrip("0").rstrip(".")
    return str(value).strip()


def first_token(value: object) -> str:
    source = text(value)
    if not source:
        return ""
    for divider in [",", "/", "·"]:
        if divider in source:
            return source.split(divider)[0].strip()
    return source


def cargo_text(vehicle: object, cargo_limit: object) -> str:
    parts: list[str] = []
    vehicle_text = text(vehicle)
    cargo_limit_text = text(cargo_limit)
    if vehicle_text and vehicle_text not in {"0", "-"}:
        parts.append(f"차량 {vehicle_text}대")
    if cargo_limit_text and cargo_limit_text not in {"0", "-"}:
        parts.append(f"화물 {cargo_limit_text}톤")
    return " / ".join(parts)


def extract_records(source_path: Path) -> dict[str, object]:
    dataframe = pd.read_excel(source_path, sheet_name=SHEET_INDEX, header=2).fillna("")
    records: list[dict[str, str]] = []

    for row in dataframe.itertuples(index=False):
        vessel_name = text(row[COLUMN_INDEX["vesselName"]])
        if not vessel_name or vessel_name.upper() == "#REF!":
            continue

        registry_port = (
            first_token(row[COLUMN_INDEX["berthInfo"]])
            or first_token(row[COLUMN_INDEX["routeName"]])
            or text(row[COLUMN_INDEX["operatorLocation"]])
        )

        records.append(
            {
                "vesselName": vessel_name,
                "vesselNumber": text(row[COLUMN_INDEX["vesselNumber"]]),
                "vesselType": text(row[COLUMN_INDEX["vesselType"]]),
                "grossTonnage": text(row[COLUMN_INDEX["grossTonnage"]]),
                "cargoType": cargo_text(
                    row[COLUMN_INDEX["vehicleLoad"]],
                    row[COLUMN_INDEX["cargoLoadTons"]],
                ),
                "registryPort": registry_port,
                "nationality": "",
                "ownerName": text(row[COLUMN_INDEX["ownerName"]]),
                "inspectionAgency": text(row[COLUMN_INDEX["inspectionAgency"]]),
                "insuranceStatus": "",
                "crewCount": text(row[COLUMN_INDEX["crewCount"]]),
                "passengerCount": text(row[COLUMN_INDEX["passengerCount"]]),
                "routeName": text(row[COLUMN_INDEX["routeName"]]),
                "managementBranch": text(row[COLUMN_INDEX["managementBranch"]]),
                "operatorLocation": text(row[COLUMN_INDEX["operatorLocation"]]),
                "berthInfo": text(row[COLUMN_INDEX["berthInfo"]]),
                "companyPhone": text(row[COLUMN_INDEX["companyPhone"]]),
                "navigationArea": "",
            }
        )

    return {
        "sourceFile": source_path.name,
        "sheetName": "26년 현재",
        "recordCount": len(records),
        "records": records,
    }


def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: python extract_vessel_data.py <input.xlsx> <output.json>")
        return 1

    input_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])
    output_path.parent.mkdir(parents=True, exist_ok=True)

    payload = extract_records(input_path)
    output_path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Wrote {payload['recordCount']} vessel records to {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
