# IF_0024 Health Center API Prep

Last verified: 2026-06-16 (Asia/Seoul)

Status:
- Prepared only
- Not integrated into the app yet

## 1. What this API actually is

This API is for `보건소` data from Safemap.

Important:
- This is not a full general-hospital dataset.
- This is not a dedicated emergency-room dataset.
- If the app later needs `응급실`, `병원`, `외상센터`, or broader medical facilities, a separate API may still be required.

In the verified JSON response:
- `dutydivname` was `보건소`
- sample names were `의령군보건소`, `강북구보건소`, `춘천시보건소`

## 2. Official endpoints

Primary data endpoint:
- `https://safemap.go.kr/openapi2/IF_0024`

WMS endpoint:
- `https://safemap.go.kr/openapi2/IF_0024_WMS`

Recommended use later:
- For nearest-center calculation, address lookup, and phone display:
  use the primary `IF_0024` data endpoint
- For simple map image overlay only:
  `IF_0024_WMS` can be used if needed

## 3. Verified request format

Verified request example:

```text
GET https://safemap.go.kr/openapi2/IF_0024
  ?serviceKey=<SERVICE_KEY>
  &returnType=json
  &numOfRows=5
  &pageNo=1
```

Verified result:
- `header.resultCode = "00"`
- `header.resultMsg = "NORMAL_SERVICE"`
- `body.totalCount = 3435`

WMS request test:

```text
GET https://safemap.go.kr/openapi2/IF_0024_WMS
  ?serviceKey=<SERVICE_KEY>
  &srs=EPSG:4326
  &bbox=126.84814453125,35.137879119634185,126.859130859375,35.146862906756304
  &format=image/png
  &width=256
  &height=256
  &transparent=TRUE
```

Verified result:
- HTTP `200`
- Content-Type `image/png`

## 4. Fields confirmed from live response

Fields that matter most for later integration:

| Field | Meaning | Recommended later use |
| --- | --- | --- |
| `hpid` | unique facility id | record id / dedupe key |
| `dutyname` | facility name | label text |
| `dutyaddr` | address | report / detail panel |
| `dutytel1` | main phone | report / detail panel |
| `lat` | latitude | distance calculation |
| `lon` | longitude | distance calculation |
| `x` | projected x coordinate | map marker placement if reusing projected coordinates |
| `y` | projected y coordinate | map marker placement if reusing projected coordinates |
| `dutydivname` | facility type name | should be checked, expected `보건소` |
| `dutyemclsname` | emergency classification name | optional display |
| `dutytime1s ~ dutytime8c` | open/close time slots | optional display later |
| `dutyweekendat` | weekend availability flag | optional filtering later |

Useful but not required for nearest-center MVP:
- `dutyinf`
- `dutymapimg`
- `dutytel3`
- `postcdn1`
- `postcdn2`
- `dutyeryn`

## 5. Important implementation notes for later Claude work

### Coordinate handling

This API already returns both:
- `lon`, `lat` as geographic coordinates
- `x`, `y` as projected map coordinates

Recommended later approach:
- Use `lon` and `lat` for nearest-distance calculation
- Use `x` and `y` directly for OpenLayers point geometry if the app map remains in projected map coordinates
- Or use `ol.proj.fromLonLat([lon, lat])` if keeping one consistent conversion path

### Existing project patterns to reuse

This project already has a working Safemap integration for fire stations.

Later Claude should copy that pattern from:
- [fire_stations.py](/C:/Users/USER/Documents/해양사고 자동계산/fire_stations.py)
- [server.py](/C:/Users/USER/Documents/해양사고 자동계산/server.py)

Recommended later file plan:
- add new helper: `health_centers.py`
- add new backend route in [server.py](/C:/Users/USER/Documents/해양사고 자동계산/server.py)
  - suggested route: `/api/health-centers`
- add frontend fetch/render logic in [app.js](/C:/Users/USER/Documents/해양사고 자동계산/app.js)

### Existing boundary filtering

If later the same inland-exclusion logic is needed:
- reuse localStorage key `marineIncident.exclusionBoundaries.v1`
- reuse the same polygon exclusion logic already used for fire stations in [app.js](/C:/Users/USER/Documents/해양사고 자동계산/app.js)

### Existing service key handling

Do not introduce a new key pattern unless necessary.

Recommended later approach:
- reuse current Safemap key handling pattern already used for fire stations
- keep `SAFEMAP_SERVICE_KEY` as the main environment variable

## 6. Recommended later backend shape

Suggested normalized output shape for later frontend use:

```json
{
  "count": 123,
  "centers": [
    {
      "id": "E2800010",
      "name": "의령군보건소",
      "phone": "055-570-4010",
      "address": "경상남도 의령군 의령읍 의병로8길 16, 의령군보건소",
      "type": "보건소",
      "lat": 35.3179006973616,
      "lng": 128.25486318014,
      "x": 14277266.06097,
      "y": 4207166.93942
    }
  ]
}
```

Recommended normalization mapping later:
- `id` <- `hpid`
- `name` <- `dutyname`
- `phone` <- `dutytel1`
- `address` <- `dutyaddr`
- `type` <- `dutydivname`
- `lat` <- `lat`
- `lng` <- `lon`
- `x` <- numeric `x`
- `y` <- numeric `y`

## 7. Suggested integration scope later

If later added to the app, the smallest safe scope is:

1. fetch and cache all `IF_0024` pages server-side
2. expose `/api/health-centers`
3. filter inland exclusion polygons if needed
4. compute nearest health center to current accident coordinate
5. show:
   - name
   - phone
   - address
   - distance
6. optionally add map markers

## 8. What to avoid later

- Do not confuse `보건소` with `병원 전체`
- Do not use WMS for nearest-point logic
- Do not rely on address text for distance math when `lon/lat` already exists
- Do not hardcode the service key inside frontend code

## 9. Files created with this prep

- this summary:
  [docs/if_0024_health_center_api_prep.md](/C:/Users/USER/Documents/해양사고 자동계산/docs/if_0024_health_center_api_prep.md)
- sample response:
  [docs/if_0024_health_center_sample.json](/C:/Users/USER/Documents/해양사고 자동계산/docs/if_0024_health_center_sample.json)
- ready-to-send Claude prompt:
  [docs/if_0024_health_center_claude_prompt.txt](/C:/Users/USER/Documents/해양사고 자동계산/docs/if_0024_health_center_claude_prompt.txt)
