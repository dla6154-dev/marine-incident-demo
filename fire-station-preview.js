const FIRE_STATION_API_URL = "/api/fire-stations";
const EXCLUSION_BOUNDARY_STORAGE_KEY = "marineIncident.exclusionBoundaries.v1";
const DEFAULT_EXCLUSION_BOUNDARIES = [
  [
    [127.014207, 37.580675],
    [127.174638, 36.844257],
    [126.773561, 36.746342],
    [126.636049, 36.580827],
    [127.018027, 35.973993],
    [126.823218, 35.452775],
    [126.639868, 35.04399],
    [126.599693, 34.783954],
    [126.771224, 34.698499],
    [127.202652, 34.860788],
    [127.73284, 35.107876],
    [127.862788, 35.311798],
    [128.174663, 35.154654],
    [128.564508, 35.358458],
    [128.845196, 35.316041],
    [129.151873, 35.794055],
    [129.188258, 36.32788],
    [129.151873, 37.061659],
    [128.694456, 37.673262],
    [128.28382, 38.169575],
    [127.597694, 38.140954],
    [127.025923, 37.968992],
    [127.014207, 37.580675],
  ],
];
const DEFAULT_CENTER = [126.9784, 37.5665];
const DEFAULT_ZOOM = 7;
const SELECTED_ZOOM = 11;

const query = new URLSearchParams(window.location.search);
const queryLat = Number(query.get("lat"));
const queryLng = Number(query.get("lng"));
const hasReferencePoint = Number.isFinite(queryLat) && Number.isFinite(queryLng);
const referenceCenter = hasReferencePoint ? [queryLng, queryLat] : DEFAULT_CENTER;

const stationName = document.getElementById("station-name");
const stationDistance = document.getElementById("station-distance");
const stationPhone = document.getElementById("station-phone");
const stationAddress = document.getElementById("station-address");
const stationCoordinates = document.getElementById("station-coordinates");
const pickedCoordinates = document.getElementById("picked-coordinates");
const boundaryCoordinates = document.getElementById("boundary-coordinates");
const statusText = document.getElementById("status-text");
const polygonCount = document.getElementById("polygon-count");
const vertexCount = document.getElementById("vertex-count");
const remainingStationCount = document.getElementById("remaining-station-count");
const vertexList = document.getElementById("vertex-list");
const copyStationCoordinatesButton = document.getElementById("copy-station-coordinates-button");
const copyPickedCoordinatesButton = document.getElementById("copy-picked-coordinates-button");
const resetPickedCoordinatesButton = document.getElementById("reset-picked-coordinates-button");
const focusSelectedStationButton = document.getElementById("focus-selected-station-button");
const copyCoordinatesButton = document.getElementById("copy-coordinates-button");
const copyGeoJsonButton = document.getElementById("copy-geojson-button");
const applyCoordinatesButton = document.getElementById("apply-coordinates-button");
const loadDefaultBoundaryButton = document.getElementById("load-default-boundary-button");
const startDrawButton = document.getElementById("start-draw-button");
const finishDrawButton = document.getElementById("finish-draw-button");
const undoPointButton = document.getElementById("undo-point-button");
const deleteLastButton = document.getElementById("delete-last-button");
const clearAllButton = document.getElementById("clear-all-button");
const backLink = document.getElementById("back-link");

const geoJsonFormat = new ol.format.GeoJSON();
const boundarySource = new ol.source.Vector();
const referenceSource = new ol.source.Vector();
const stationSource = new ol.source.Vector();
const pickedSource = new ol.source.Vector();
const lineSource = new ol.source.Vector();

let rawStations = [];
let allStations = [];
let selectedStation = null;
let pickedPoint = hasReferencePoint ? [queryLng, queryLat] : null;
let sketchFeature = null;
let sketchGeometryListener = null;
let latestPreviewCoordinates = [];
let isDrawing = false;

const map = new ol.Map({
  target: "map",
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM(),
    }),
    new ol.layer.Tile({
      opacity: 0.82,
      source: new ol.source.TileWMS({
        url: "/api/vworld/wms",
        params: {
          SERVICE: "WMS",
          VERSION: "1.3.0",
          REQUEST: "GetMap",
          FORMAT: "image/png",
          TRANSPARENT: true,
          LAYERS: "lt_l_toisdepcntah",
        },
        crossOrigin: "anonymous",
      }),
    }),
    new ol.layer.Vector({
      source: boundarySource,
      style: (feature) => buildBoundaryStyle(feature),
    }),
    new ol.layer.Vector({
      source: lineSource,
      style: new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: "rgba(240, 179, 92, 0.9)",
          width: 3,
          lineDash: [10, 8],
        }),
      }),
    }),
    new ol.layer.Vector({
      source: stationSource,
      style: (feature) => buildStationStyle(feature),
    }),
    new ol.layer.Vector({
      source: referenceSource,
      style: new ol.style.Style({
        image: new ol.style.Circle({
          radius: 7,
          fill: new ol.style.Fill({ color: "#0d8bc3" }),
          stroke: new ol.style.Stroke({ color: "#e6f8ff", width: 2 }),
        }),
        text: new ol.style.Text({
          text: "사고 좌표",
          offsetY: -18,
          font: "700 13px Pretendard, sans-serif",
          fill: new ol.style.Fill({ color: "#103145" }),
          backgroundFill: new ol.style.Fill({ color: "rgba(255,255,255,0.88)" }),
          padding: [3, 6, 3, 6],
        }),
      }),
    }),
    new ol.layer.Vector({
      source: pickedSource,
      style: new ol.style.Style({
        image: new ol.style.Circle({
          radius: 7,
          fill: new ol.style.Fill({ color: "#1db6a4" }),
          stroke: new ol.style.Stroke({ color: "#eafffb", width: 2 }),
        }),
        text: new ol.style.Text({
          text: "선택 좌표",
          offsetY: -18,
          font: "700 13px Pretendard, sans-serif",
          fill: new ol.style.Fill({ color: "#12443d" }),
          backgroundFill: new ol.style.Fill({ color: "rgba(255,255,255,0.88)" }),
          padding: [3, 6, 3, 6],
        }),
      }),
    }),
  ],
  view: new ol.View({
    center: ol.proj.fromLonLat(referenceCenter),
    zoom: hasReferencePoint ? SELECTED_ZOOM : DEFAULT_ZOOM,
  }),
  controls: ol.control.defaults.defaults({
    attributionOptions: {
      collapsible: true,
    },
  }),
});

const drawInteraction = new ol.interaction.Draw({
  source: boundarySource,
  type: "Polygon",
});
drawInteraction.setActive(false);

const modifyInteraction = new ol.interaction.Modify({
  source: boundarySource,
});

const snapInteraction = new ol.interaction.Snap({
  source: boundarySource,
});

map.addInteraction(drawInteraction);
map.addInteraction(modifyInteraction);
map.addInteraction(snapInteraction);

if (hasReferencePoint) {
  referenceSource.addFeature(new ol.Feature(new ol.geom.Point(ol.proj.fromLonLat(referenceCenter))));
  backLink.href = `/?lat=${queryLat}&lng=${queryLng}`;
}

drawInteraction.on("drawstart", (event) => {
  sketchFeature = event.feature;
  latestPreviewCoordinates = [];
  setDrawingState(true);
  setStatus("제외 바운더리 작성 중입니다. 더블클릭하거나 '현재 폴리곤 완료'를 눌러 확정하세요.");

  sketchGeometryListener = sketchFeature.getGeometry().on("change", () => {
    latestPreviewCoordinates = extractPreviewCoordinates(sketchFeature.getGeometry());
    renderBoundaryState();
  });
});

drawInteraction.on("drawend", () => {
  cleanupSketchListener();
  sketchFeature = null;
  latestPreviewCoordinates = [];
  setDrawingState(false);

  window.requestAnimationFrame(() => {
    saveBoundaries();
    refreshStationData({
      statusMessage: "제외 바운더리를 저장했습니다. 해당 영역의 소방서를 즉시 제외했습니다.",
      keepSelection: true,
      recenter: false,
    });
  });
});

modifyInteraction.on("modifyend", () => {
  saveBoundaries();
  refreshStationData({
    statusMessage: "제외 바운더리를 수정했습니다.",
    keepSelection: true,
    recenter: false,
  });
});

map.on("singleclick", (event) => {
  if (isDrawing) {
    return;
  }

  const clickedStation = findStationAtPixel(event.pixel);
  if (clickedStation) {
    selectedStation = clickedStation;
    renderStations();
    renderSelectedStation();
    renderStationLine();
    centerOnSelectedStation();
    setStatus(`${clickedStation.name}을(를) 선택했습니다.`);
    return;
  }

  const [lng, lat] = ol.proj.toLonLat(event.coordinate);
  pickedPoint = [Number(lng.toFixed(6)), Number(lat.toFixed(6))];
  renderPickedPoint();
  renderStationLine();
  setStatus("지도 클릭 좌표를 반영했습니다.");
});

copyStationCoordinatesButton.addEventListener("click", async () => {
  if (!selectedStation) {
    setStatus("선택된 소방서가 없습니다.");
    return;
  }

  await copyText(formatCoordinatePair(selectedStation.lng, selectedStation.lat), "소방서 좌표를 복사했습니다.");
});

copyPickedCoordinatesButton.addEventListener("click", async () => {
  if (!pickedPoint) {
    setStatus("선택된 좌표가 없습니다.");
    return;
  }

  await copyText(formatCoordinatePair(pickedPoint[0], pickedPoint[1]), "선택 좌표를 복사했습니다.");
});

resetPickedCoordinatesButton.addEventListener("click", () => {
  if (!hasReferencePoint) {
    setStatus("사고 기준 좌표가 없습니다.");
    return;
  }

  pickedPoint = [queryLng, queryLat];
  renderPickedPoint();
  renderStationLine();
  setStatus("선택 좌표를 사고 좌표로 되돌렸습니다.");
});

focusSelectedStationButton.addEventListener("click", () => {
  if (!selectedStation) {
    setStatus("선택된 소방서가 없습니다.");
    return;
  }

  centerOnSelectedStation();
  setStatus(`${selectedStation.name} 위치로 이동했습니다.`);
});

startDrawButton.addEventListener("click", () => {
  if (isDrawing) {
    setStatus("이미 바운더리를 그리고 있습니다.");
    return;
  }

  latestPreviewCoordinates = [];
  renderBoundaryState();
  setDrawingState(true);
  setStatus("그리기를 시작했습니다. 지도에서 꼭짓점을 순서대로 클릭하세요.");
});

finishDrawButton.addEventListener("click", () => {
  if (!isDrawing || !sketchFeature) {
    setStatus("완료할 폴리곤이 없습니다.");
    return;
  }

  drawInteraction.finishDrawing();
});

undoPointButton.addEventListener("click", () => {
  if (!isDrawing) {
    setStatus("현재 그리기 중이 아닙니다.");
    return;
  }

  drawInteraction.removeLastPoint();
  setStatus("마지막 점을 취소했습니다.");
});

deleteLastButton.addEventListener("click", () => {
  const features = boundarySource.getFeatures();
  if (!features.length) {
    setStatus("삭제할 폴리곤이 없습니다.");
    return;
  }

  boundarySource.removeFeature(features[features.length - 1]);
  saveBoundaries();
  refreshStationData({
    statusMessage: "마지막 제외 폴리곤을 삭제했습니다.",
    keepSelection: true,
    recenter: false,
  });
});

clearAllButton.addEventListener("click", () => {
  boundarySource.clear();
  latestPreviewCoordinates = [];
  cleanupSketchListener();
  sketchFeature = null;
  setDrawingState(false);
  saveBoundaries();
  refreshStationData({
    statusMessage: "모든 제외 바운더리를 삭제했습니다.",
    keepSelection: false,
    recenter: false,
  });
});

copyCoordinatesButton.addEventListener("click", async () => {
  await copyText(boundaryCoordinates.value, "좌표 배열을 복사했습니다.");
});

copyGeoJsonButton.addEventListener("click", async () => {
  await copyText(JSON.stringify(exportGeoJson(), null, 2), "GeoJSON을 복사했습니다.");
});

applyCoordinatesButton.addEventListener("click", () => {
  try {
    const rings = normalizeCoordinateRings(JSON.parse(boundaryCoordinates.value));
    applyCoordinateRings(rings, {
      statusMessage: "좌표 배열을 적용했습니다.",
      keepSelection: true,
      recenter: false,
    });
  } catch (error) {
    console.error(error);
    setStatus(`좌표 적용 실패: ${error.message}`);
  }
});

loadDefaultBoundaryButton.addEventListener("click", () => {
  applyCoordinateRings(DEFAULT_EXCLUSION_BOUNDARIES, {
    statusMessage: "기본 내륙 제외 바운더리를 불러왔습니다.",
    keepSelection: true,
    recenter: false,
  });
});

window.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !isDrawing) {
    return;
  }

  drawInteraction.abortDrawing();
  cleanupSketchListener();
  sketchFeature = null;
  latestPreviewCoordinates = [];
  setDrawingState(false);
  renderBoundaryState();
  setStatus("현재 그리기를 취소했습니다.");
});

bootstrap();

async function bootstrap() {
  try {
    restoreBoundaries();
    renderBoundaryState();
    renderPickedPoint();
    setStatus("소방서 데이터를 불러오는 중입니다.");

    rawStations = await fetchFireStations();
    refreshStationData({
      keepSelection: false,
      recenter: true,
    });
    setStatus(selectedStation ? `${selectedStation.name}이(가) 현재 선택되어 있습니다.` : "표시 가능한 소방서가 없습니다.");
  } catch (error) {
    console.error(error);
    setStatus(`미리보기 로드 실패: ${error.message}`);
  }
}

async function fetchFireStations() {
  const response = await fetch(FIRE_STATION_API_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(await response.text());
  }

  const payload = await response.json();
  if (!payload || !Array.isArray(payload.stations)) {
    throw new Error("소방서 데이터 형식이 올바르지 않습니다.");
  }

  return payload.stations;
}

function refreshStationData(options = {}) {
  const {
    statusMessage,
    keepSelection = true,
    recenter = false,
  } = options;

  const previousSelectionId = keepSelection ? selectedStation?.object_id ?? null : null;
  allStations = filterFireStationsByBoundaries(rawStations, exportCoordinateRings());
  remainingStationCount.textContent = String(allStations.length);
  selectedStation = pickSelectedStation(previousSelectionId);

  renderStations();
  renderSelectedStation();
  renderPickedPoint();
  renderStationLine();
  renderBoundaryState();

  if (recenter) {
    if (selectedStation) {
      centerOnSelectedStation();
    } else if (hasReferencePoint) {
      centerOnCoordinates(queryLng, queryLat, SELECTED_ZOOM);
    }
  }

  if (statusMessage) {
    setStatus(statusMessage);
  }
}

function pickSelectedStation(previousSelectionId) {
  if (!allStations.length) {
    return null;
  }

  if (previousSelectionId !== null) {
    const preservedStation = allStations.find((station) => station.object_id === previousSelectionId);
    if (preservedStation) {
      return preservedStation;
    }
  }

  if (hasReferencePoint) {
    return findNearestStation(queryLat, queryLng, allStations);
  }

  if (pickedPoint) {
    return findNearestStation(pickedPoint[1], pickedPoint[0], allStations);
  }

  return allStations[0];
}

function renderStations() {
  stationSource.clear();

  allStations.forEach((station) => {
    stationSource.addFeature(
      new ol.Feature({
        geometry: new ol.geom.Point([station.x, station.y]),
        station,
        name: station.name,
        isSelected: Boolean(selectedStation && station.object_id === selectedStation.object_id),
      }),
    );
  });
}

function renderSelectedStation() {
  if (!selectedStation) {
    stationName.textContent = "-";
    stationDistance.textContent = "-";
    stationPhone.textContent = "-";
    stationAddress.textContent = "-";
    stationCoordinates.textContent = "-";
    return;
  }

  stationName.textContent = selectedStation.name || "-";
  stationPhone.textContent = selectedStation.phone || "-";
  stationAddress.textContent = getStationAddress(selectedStation);
  stationCoordinates.textContent = formatCoordinatePair(selectedStation.lng, selectedStation.lat);

  if (hasReferencePoint) {
    stationDistance.textContent = formatDistanceNm(
      haversineNm(queryLat, queryLng, selectedStation.lat, selectedStation.lng),
    );
    return;
  }

  stationDistance.textContent = "-";
}

function renderPickedPoint() {
  pickedSource.clear();

  if (!pickedPoint) {
    pickedCoordinates.textContent = "-";
    return;
  }

  pickedCoordinates.textContent = formatCoordinatePair(pickedPoint[0], pickedPoint[1]);
  pickedSource.addFeature(
    new ol.Feature(new ol.geom.Point(ol.proj.fromLonLat([pickedPoint[0], pickedPoint[1]]))),
  );
}

function renderStationLine() {
  lineSource.clear();

  if (!selectedStation || !pickedPoint) {
    return;
  }

  lineSource.addFeature(
    new ol.Feature(
      new ol.geom.LineString([
        [selectedStation.x, selectedStation.y],
        ol.proj.fromLonLat([pickedPoint[0], pickedPoint[1]]),
      ]),
    ),
  );
}

function renderBoundaryState() {
  const rings = exportCoordinateRings();
  polygonCount.textContent = String(rings.length);
  boundaryCoordinates.value = JSON.stringify(rings, null, 2);

  const visibleCoordinates = latestPreviewCoordinates.length
    ? latestPreviewCoordinates
    : rings[rings.length - 1] || [];

  renderVertexList(visibleCoordinates);
  vertexCount.textContent = String(getVertexCount(visibleCoordinates));
}

function renderVertexList(coordinates) {
  vertexList.innerHTML = "";

  const visibleCoordinates = isClosedRing(coordinates)
    ? coordinates.slice(0, -1)
    : coordinates;

  if (!visibleCoordinates.length) {
    vertexList.classList.add("empty");
    vertexList.textContent = "아직 점이 없습니다.";
    return;
  }

  vertexList.classList.remove("empty");

  visibleCoordinates.forEach((point, index) => {
    const item = document.createElement("div");
    item.className = "vertex-item";
    item.textContent = `${index + 1}. [${formatCoordinate(point[0])}, ${formatCoordinate(point[1])}]`;
    vertexList.appendChild(item);
  });
}

function getVertexCount(coordinates) {
  if (!coordinates.length) {
    return 0;
  }

  return isClosedRing(coordinates) ? coordinates.length - 1 : coordinates.length;
}

function extractPreviewCoordinates(geometry) {
  const polygonCoordinates = geometry.getCoordinates()[0] || [];
  return polygonCoordinates.map((coordinate) => {
    const [lng, lat] = ol.proj.toLonLat(coordinate);
    return [Number(lng.toFixed(6)), Number(lat.toFixed(6))];
  });
}

function applyCoordinateRings(inputRings, options = {}) {
  const {
    statusMessage = "제외 바운더리를 적용했습니다.",
    keepSelection = true,
    recenter = false,
  } = options;

  const rings = normalizeCoordinateRings(inputRings);
  const features = rings.map((ring) => new ol.Feature(
    new ol.geom.Polygon([
      ring.map((coordinate) => ol.proj.fromLonLat(coordinate)),
    ]),
  ));

  boundarySource.clear();
  boundarySource.addFeatures(features);
  latestPreviewCoordinates = [];

  saveBoundaries();
  refreshStationData({
    statusMessage,
    keepSelection,
    recenter,
  });
}

function restoreBoundaries() {
  const raw = localStorage.getItem(EXCLUSION_BOUNDARY_STORAGE_KEY);
  if (!raw) {
    const features = buildPolygonFeatures(DEFAULT_EXCLUSION_BOUNDARIES);
    boundarySource.addFeatures(features);
    return;
  }

  try {
    const payload = JSON.parse(raw);
    const features = Array.isArray(payload)
      ? buildPolygonFeatures(payload)
      : geoJsonFormat.readFeatures(payload, {
        dataProjection: "EPSG:4326",
        featureProjection: "EPSG:3857",
      });

    if (!features.length) {
      throw new Error("비어 있는 바운더리입니다.");
    }

    boundarySource.addFeatures(features);
  } catch (error) {
    console.error(error);
    localStorage.removeItem(EXCLUSION_BOUNDARY_STORAGE_KEY);
    boundarySource.clear();
    boundarySource.addFeatures(buildPolygonFeatures(DEFAULT_EXCLUSION_BOUNDARIES));
    setStatus("저장된 바운더리를 읽지 못해 기본 내륙 제외 바운더리로 복구했습니다.");
  }
}

function buildPolygonFeatures(rings) {
  return normalizeCoordinateRings(rings).map((ring) => new ol.Feature(
    new ol.geom.Polygon([
      ring.map((coordinate) => ol.proj.fromLonLat(coordinate)),
    ]),
  ));
}

function saveBoundaries() {
  if (!boundarySource.getFeatures().length) {
    localStorage.removeItem(EXCLUSION_BOUNDARY_STORAGE_KEY);
    return;
  }

  localStorage.setItem(EXCLUSION_BOUNDARY_STORAGE_KEY, JSON.stringify(exportGeoJson()));
}

function exportGeoJson() {
  return geoJsonFormat.writeFeaturesObject(boundarySource.getFeatures(), {
    dataProjection: "EPSG:4326",
    featureProjection: "EPSG:3857",
  });
}

function exportCoordinateRings() {
  return boundarySource.getFeatures().map((feature) => {
    const coordinates = feature.getGeometry().getCoordinates()[0] || [];
    return coordinates.map((coordinate) => {
      const [lng, lat] = ol.proj.toLonLat(coordinate);
      return [Number(lng.toFixed(6)), Number(lat.toFixed(6))];
    });
  });
}

function normalizeCoordinateRings(raw) {
  if (!Array.isArray(raw)) {
    throw new Error("좌표 배열은 배열 형식이어야 합니다.");
  }

  return raw.map((ring) => {
    if (!Array.isArray(ring) || ring.length < 3) {
      throw new Error("각 바운더리는 최소 3개의 점이 필요합니다.");
    }

    const normalized = ring.map((point) => {
      if (!Array.isArray(point) || point.length < 2) {
        throw new Error("각 점은 [경도, 위도] 형식이어야 합니다.");
      }

      const lng = Number(point[0]);
      const lat = Number(point[1]);
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
        throw new Error("좌표값은 숫자여야 합니다.");
      }

      return [Number(lng.toFixed(6)), Number(lat.toFixed(6))];
    });

    const first = normalized[0];
    const last = normalized[normalized.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      normalized.push([...first]);
    }

    return normalized;
  });
}

function buildBoundaryStyle(feature) {
  const index = Math.max(boundarySource.getFeatures().indexOf(feature) + 1, 1);
  return new ol.style.Style({
    fill: new ol.style.Fill({
      color: "rgba(217, 106, 94, 0.22)",
    }),
    stroke: new ol.style.Stroke({
      color: "#d96a5e",
      width: 3,
      lineDash: [10, 6],
    }),
    text: new ol.style.Text({
      text: `제외 ${index}`,
      font: "700 13px Pretendard, sans-serif",
      fill: new ol.style.Fill({ color: "#7d1e16" }),
      backgroundFill: new ol.style.Fill({ color: "rgba(255,255,255,0.88)" }),
      padding: [3, 6, 3, 6],
    }),
  });
}

function buildStationStyle(feature) {
  if (feature.get("isSelected")) {
    return new ol.style.Style({
      image: new ol.style.Icon({
        anchor: [0.5, 1],
        src: `data:image/svg+xml;utf8,${encodeURIComponent(buildMarkerSvg("#ff9d47", "#b95614", "#fff8e6"))}`,
        scale: 0.86,
      }),
      text: new ol.style.Text({
        text: feature.get("name") || "선택 소방서",
        offsetY: -24,
        font: "700 13px Pretendard, sans-serif",
        fill: new ol.style.Fill({ color: "#7d2f00" }),
        backgroundFill: new ol.style.Fill({ color: "rgba(255,255,255,0.92)" }),
        padding: [3, 6, 3, 6],
      }),
    });
  }

  return new ol.style.Style({
    image: new ol.style.Icon({
      anchor: [0.5, 1],
      src: `data:image/svg+xml;utf8,${encodeURIComponent(buildMarkerSvg("#cb4d54", "#8f1e26", "#fff4f5"))}`,
      scale: 0.68,
    }),
  });
}

function buildMarkerSvg(fillColor, strokeColor, innerColor) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 42 42">
      <path d="M21 2C12.163 2 5 9.163 5 18c0 10.879 12.089 20.61 15.18 22.935a1.35 1.35 0 0 0 1.64 0C24.911 38.61 37 28.879 37 18 37 9.163 29.837 2 21 2Z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/>
      <circle cx="21" cy="18" r="7.5" fill="${innerColor}"/>
    </svg>
  `.trim();
}

function setDrawingState(active) {
  isDrawing = active;
  drawInteraction.setActive(active);
  map.getTargetElement().classList.toggle("drawing", active);
}

function cleanupSketchListener() {
  if (!sketchGeometryListener) {
    return;
  }

  ol.Observable.unByKey(sketchGeometryListener);
  sketchGeometryListener = null;
}

function centerOnSelectedStation() {
  if (!selectedStation) {
    return;
  }

  map.getView().animate({
    center: [selectedStation.x, selectedStation.y],
    zoom: SELECTED_ZOOM,
    duration: 450,
  });
}

function centerOnCoordinates(lng, lat, zoom = SELECTED_ZOOM) {
  map.getView().animate({
    center: ol.proj.fromLonLat([lng, lat]),
    zoom,
    duration: 450,
  });
}

function findStationAtPixel(pixel) {
  let matchedStation = null;

  map.forEachFeatureAtPixel(pixel, (feature) => {
    const station = feature.get("station");
    if (station) {
      matchedStation = station;
      return true;
    }
    return false;
  });

  return matchedStation;
}

function findNearestStation(lat, lng, stations) {
  if (!stations.length) {
    return null;
  }

  let nearestStation = null;

  stations.forEach((station) => {
    const distanceNm = haversineNm(lat, lng, station.lat, station.lng);
    if (!nearestStation || distanceNm < nearestStation.distance_nm) {
      nearestStation = {
        ...station,
        distance_nm: distanceNm,
      };
    }
  });

  return nearestStation;
}

function filterFireStationsByBoundaries(stations, exclusionBoundaries) {
  if (!Array.isArray(stations) || !stations.length) {
    return [];
  }

  if (!exclusionBoundaries.length) {
    return [...stations];
  }

  return stations.filter((station) => !isPointInsideAnyBoundary(station.lng, station.lat, exclusionBoundaries));
}

function isPointInsideAnyBoundary(lng, lat, boundaries) {
  return boundaries.some((ring) => isPointInRing([lng, lat], ring));
}

function isPointInRing(point, ring) {
  const [px, py] = point;
  const coordinates = isClosedRing(ring) ? ring.slice(0, -1) : ring;
  let inside = false;

  for (let index = 0, lastIndex = coordinates.length - 1; index < coordinates.length; lastIndex = index, index += 1) {
    const [x1, y1] = coordinates[index];
    const [x2, y2] = coordinates[lastIndex];

    if (isPointOnSegment(px, py, x1, y1, x2, y2)) {
      return true;
    }

    const intersects = ((y1 > py) !== (y2 > py))
      && (px < ((x2 - x1) * (py - y1)) / ((y2 - y1) || Number.EPSILON) + x1);

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function isClosedRing(ring) {
  if (!Array.isArray(ring) || ring.length < 2) {
    return false;
  }

  const first = ring[0];
  const last = ring[ring.length - 1];
  return first[0] === last[0] && first[1] === last[1];
}

function isPointOnSegment(px, py, x1, y1, x2, y2) {
  const cross = (py - y1) * (x2 - x1) - (px - x1) * (y2 - y1);
  if (Math.abs(cross) > 1e-9) {
    return false;
  }

  const dot = (px - x1) * (px - x2) + (py - y1) * (py - y2);
  return dot <= 1e-9;
}

function haversineNm(lat1, lng1, lat2, lng2) {
  const toRadians = (value) => (value * Math.PI) / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const startLat = toRadians(lat1);
  const endLat = toRadians(lat2);
  const haversine = Math.sin(dLat / 2) ** 2
    + Math.cos(startLat) * Math.cos(endLat) * Math.sin(dLng / 2) ** 2;
  const distanceMeters = 2 * 6371000 * Math.asin(Math.sqrt(haversine));
  return distanceMeters / 1852;
}

function formatDistanceNm(value) {
  if (!Number.isFinite(value)) {
    return "-";
  }

  return `${value < 1 ? value.toFixed(2) : value.toFixed(1)} 해리`;
}

function formatCoordinate(value) {
  return Number(value).toFixed(6);
}

function formatCoordinatePair(lng, lat) {
  return `${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}`;
}

function getStationAddress(station) {
  return station?.road_address || station?.address || "-";
}

function setStatus(message) {
  statusText.textContent = message;
}

async function copyText(text, successMessage) {
  if (!text.trim()) {
    setStatus("복사할 내용이 없습니다.");
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    setStatus(successMessage);
  } catch (error) {
    console.error(error);
    setStatus("클립보드 복사에 실패했습니다.");
  }
}
