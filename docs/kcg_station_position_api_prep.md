# KCG Station Position API Prep

Last verified: 2026-06-16 (Asia/Seoul)

Status:
- Prepared only
- Not integrated into the app yet

## 1. What this API is

This API provides `해양경찰서 파출소` position data.

Verified live endpoint:
- `https://apis.data.go.kr/1532000/KCG_Station_Position/list_view`

Verified dataset characteristics:
- facility type: 해양경찰 파출소
- response format: XML only
- verified total count: `97`

Important limitations:
- this API does **not** return address
- this API does **not** return phone number
- this API does **not** return a stable official numeric id field
- it mainly provides:
  - station name
  - longitude
  - latitude

If later the app needs:
- address
- contact number
- jurisdiction metadata

then an additional source will still be required.

## 2. Verified request format

Verified working request:

```text
GET https://apis.data.go.kr/1532000/KCG_Station_Position/list_view
  ?serviceKey=<SERVICE_KEY>
  &rowsCount=100000
  &startPage=1
```

Verified response top-level fields:
- `resultCode = 40`
- `resultMsg = NON_ERROR`
- `rowsCount`
- `startPage`
- `contentsLength`
- `totalCount`
- `body > content[]`

Important:
- this API does not appear to switch to JSON with `type=json` or `resultType=json`
- live testing showed XML response even when JSON-style parameters were added

## 3. Verified XML response shape

Each record is shaped like:

```xml
<content>
  <c_myeongching>감천파출소</c_myeongching>
  <c_kyeongdo>129.00055810</c_kyeongdo>
  <c_wido>35.08440914</c_wido>
</content>
```

Confirmed field meanings:

| Field | Meaning | Recommended later use |
| --- | --- | --- |
| `c_myeongching` | 파출소명 | marker label / nearest result text |
| `c_kyeongdo` | longitude | distance calculation / map placement |
| `c_wido` | latitude | distance calculation / map placement |

## 4. Verified live values

Full fetch test with `rowsCount=100000`:
- returned `97` records
- first station: `감천파출소`
- last station: `흑산파출소`

## 5. Important paging note

Live testing showed that `startPage` did **not** change the returned first record.

Tested values:
- `startPage=1`
- `startPage=2`
- `startPage=3`
- `startPage=10`

All of them still returned the same first station in the sampled test.

Recommended later approach:
- do **not** rely on paging
- request everything in one call with:
  - `rowsCount=100000`
  - `startPage=1`

This is safe here because the verified total count is only `97`.

## 6. Recommended later backend normalization

Because the API is XML-only and minimal, later Claude should normalize it server-side into JSON for the frontend.

Suggested normalized shape:

```json
{
  "count": 97,
  "stations": [
    {
      "id": "감천파출소::129.00055810::35.08440914",
      "name": "감천파출소",
      "lng": 129.0005581,
      "lat": 35.08440914
    }
  ]
}
```

Recommended mapping:
- `id` <- synthetic id from `name + lng + lat`
- `name` <- `c_myeongching`
- `lng` <- numeric `c_kyeongdo`
- `lat` <- numeric `c_wido`

## 7. Recommended later integration plan

If implementation is requested later:

1. create a helper file such as `kcg_stations.py`
2. fetch the XML endpoint server-side
3. parse XML into normalized JSON
4. expose a backend route such as:
   - `/api/kcg-stations`
   - or `/api/coast-guard-stations`
5. optionally compute nearest station from current accident coordinate
6. optionally render station markers on the map

## 8. Existing project patterns to reuse later

This project already has similar server-side fetch/normalize patterns.

Later Claude should review:
- [fire_stations.py](/C:/Users/USER/Documents/해양사고 자동계산/fire_stations.py)
- [server.py](/C:/Users/USER/Documents/해양사고 자동계산/server.py)
- [app.js](/C:/Users/USER/Documents/해양사고 자동계산/app.js)

If inland exclusion filtering is needed later:
- reuse the same localStorage key and polygon exclusion logic already used for fire stations
- current key:
  - `marineIncident.exclusionBoundaries.v1`

## 9. Special caveats for later Claude work

- do not validate success using `resultCode == 00` only
- this API returned:
  - `resultCode = 40`
  - `resultMsg = NON_ERROR`
- treat `NON_ERROR` as success for this endpoint

- do not wait for JSON support from this API
- parse XML directly

- do not assume addresses or phone numbers exist in this endpoint
- if the app later needs richer coast guard metadata, plan a second source

## 10. Suggested later MVP use

Good MVP scope for this dataset:
- show all KCG station markers
- find nearest KCG station to accident coordinate
- show:
  - station name
  - distance

Not possible from this API alone:
- show station phone
- show station address

## 11. Files created with this prep

- summary:
  [docs/kcg_station_position_api_prep.md](/C:/Users/USER/Documents/해양사고 자동계산/docs/kcg_station_position_api_prep.md)
- sample XML:
  [docs/kcg_station_position_sample.xml](/C:/Users/USER/Documents/해양사고 자동계산/docs/kcg_station_position_sample.xml)
- ready-to-send Claude prompt:
  [docs/kcg_station_position_claude_prompt.txt](/C:/Users/USER/Documents/해양사고 자동계산/docs/kcg_station_position_claude_prompt.txt)
