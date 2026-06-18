const STORAGE_KEY = "marineIncident.exclusionBoundaries.v1";
const DEFAULT_CENTER = [125.116658, 34.099686];
const DEFAULT_ZOOM = 8;
const REFERENCE_ZOOM = 11;
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

const query = new URLSearchParams(window.location.search);
const queryLat = Number(query.get("lat"));
const queryLng = Number(query.get("lng"));
const hasReferencePoint = Number.isFinite(queryLat) && Number.isFinite(queryLng);
const referenceCenter = hasReferencePoint ? [queryLng, queryLat] : DEFAULT_CENTER;

const drawStatus = document.getElementById("draw-status");
const polygonCount = document.getElementById("polygon-count");
const vertexCount = document.getElementById("vertex-count");
const boundaryCoordinates = document.getElementById("boundary-coordinates");
const vertexList = document.getElementById("vertex-list");
const backLink = document.getElementById("back-link");
const applyCoordinatesButton = document.getElementById("apply-coordinates-button");
const loadDefaultBoundaryButton = document.getElementById("load-default-boundary-button");

const boundarySource = new ol.source.Vector();
const referenceSource = new ol.source.Vector();
const geoJsonFormat = new ol.format.GeoJSON();

const boundaryLayer = new ol.layer.Vector({
  source: boundarySource,
  style: (feature) => buildBoundaryStyle(feature),
});

const referenceLayer = new ol.layer.Vector({
  source: referenceSource,
  style: new ol.style.Style({
    image: new ol.style.Circle({
      radius: 7,
      fill: new ol.style.Fill({ color: "#0d8bc3" }),
      stroke: new ol.style.Stroke({ color: "#e5f8ff", width: 2 }),
    }),
    text: new ol.style.Text({
      text: "기준 좌표",
      offsetY: -18,
      font: "600 13px Pretendard, sans-serif",
      fill: new ol.style.Fill({ color: "#103145" }),
      backgroundFill: new ol.style.Fill({ color: "rgba(255,255,255,0.88)" }),
      padding: [3, 6, 3, 6],
    }),
  }),
});

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
    boundaryLayer,
    referenceLayer,
  ],
  view: new ol.View({
    center: ol.proj.fromLonLat(referenceCenter),
    zoom: hasReferencePoint ? REFERENCE_ZOOM : DEFAULT_ZOOM,
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

let sketchFeature = null;
let sketchGeometryListener = null;
let latestPreviewCoordinates = [];

if (hasReferencePoint) {
  referenceSource.addFeature(
    new ol.Feature(new ol.geom.Point(ol.proj.fromLonLat(referenceCenter))),
  );
  backLink.href = `/?lat=${queryLat}&lng=${queryLng}`;
}

drawInteraction.on("drawstart", (event) => {
  sketchFeature = event.feature;
  setDrawingState(true);
  setStatus("지도에서 점을 찍고, 더블클릭하거나 '현재 폴리곤 완료'를 누르세요.");
  latestPreviewCoordinates = [];

  sketchGeometryListener = sketchFeature.getGeometry().on("change", () => {
    const coordinates = extractPreviewCoordinates(sketchFeature.getGeometry());
    latestPreviewCoordinates = coordinates;
    renderVertexList(coordinates);
    vertexCount.textContent = String(coordinates.length);
  });
});

drawInteraction.on("drawend", () => {
  if (sketchGeometryListener) {
    ol.Observable.unByKey(sketchGeometryListener);
    sketchGeometryListener = null;
  }
  sketchFeature = null;
  latestPreviewCoordinates = [];
  setDrawingState(false);
  // OpenLayers inserts the finished feature into the source after drawend fires.
  // Defer sidebar/state updates until the feature is actually present.
  window.requestAnimationFrame(() => {
    saveBoundaries();
    renderBoundaryState();
    setStatus("바운더리가 저장되었습니다. 새 바운더리를 추가로 그릴 수 있습니다.");
  });
});

modifyInteraction.on("modifyend", () => {
  saveBoundaries();
  renderBoundaryState();
  setStatus("바운더리를 수정했습니다.");
});

document.getElementById("start-draw-button").addEventListener("click", () => {
  if (drawInteraction.getActive()) {
    setStatus("이미 그리기 중입니다.");
    return;
  }
  drawInteraction.setActive(true);
  setDrawingState(true);
  renderVertexList([]);
  vertexCount.textContent = "0";
  setStatus("그리기를 시작했습니다. 지도에서 점을 찍어 주세요.");
});

document.getElementById("finish-draw-button").addEventListener("click", () => {
  if (!drawInteraction.getActive() || !sketchFeature) {
    setStatus("완료할 폴리곤이 없습니다.");
    return;
  }
  drawInteraction.finishDrawing();
});

document.getElementById("undo-point-button").addEventListener("click", () => {
  if (!drawInteraction.getActive()) {
    setStatus("현재 그리기 중이 아닙니다.");
    return;
  }
  drawInteraction.removeLastPoint();
  setStatus("마지막 점을 취소했습니다.");
});

document.getElementById("delete-last-button").addEventListener("click", () => {
  const features = boundarySource.getFeatures();
  if (!features.length) {
    setStatus("삭제할 폴리곤이 없습니다.");
    return;
  }
  boundarySource.removeFeature(features[features.length - 1]);
  saveBoundaries();
  renderBoundaryState();
  setStatus("마지막 폴리곤을 삭제했습니다.");
});

document.getElementById("clear-all-button").addEventListener("click", () => {
  boundarySource.clear();
  latestPreviewCoordinates = [];
  renderVertexList([]);
  saveBoundaries();
  renderBoundaryState();
  setStatus("모든 바운더리를 삭제했습니다.");
});

document.getElementById("copy-coordinates-button").addEventListener("click", async () => {
  await copyText(boundaryCoordinates.value, "좌표 배열을 복사했습니다.");
});

document.getElementById("copy-geojson-button").addEventListener("click", async () => {
  const geoJsonText = JSON.stringify(exportGeoJson(), null, 2);
  await copyText(geoJsonText, "GeoJSON을 복사했습니다.");
});

applyCoordinatesButton.addEventListener("click", () => {
  try {
    const rings = normalizeCoordinateRings(JSON.parse(boundaryCoordinates.value));
    applyCoordinateRings(rings, {
      statusMessage: "좌표 배열을 적용했습니다.",
    });
  } catch (error) {
    console.error(error);
    setStatus(`좌표 적용 실패: ${error.message}`);
  }
});

loadDefaultBoundaryButton.addEventListener("click", () => {
  applyCoordinateRings(DEFAULT_EXCLUSION_BOUNDARIES, {
    statusMessage: "기본 내륙 바운더리를 불러왔습니다.",
  });
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && drawInteraction.getActive()) {
    drawInteraction.abortDrawing();
    if (sketchGeometryListener) {
      ol.Observable.unByKey(sketchGeometryListener);
      sketchGeometryListener = null;
    }
    sketchFeature = null;
    latestPreviewCoordinates = [];
    setDrawingState(false);
    renderVertexList([]);
    vertexCount.textContent = "0";
    setStatus("현재 그리기를 취소했습니다.");
  }
});

restoreBoundaries();
renderBoundaryState();

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

function setDrawingState(isDrawing) {
  drawInteraction.setActive(isDrawing);
  map.getTargetElement().classList.toggle("drawing", isDrawing);
}

function setStatus(message) {
  drawStatus.textContent = message;
}

function renderBoundaryState() {
  const rings = exportCoordinateRings();
  polygonCount.textContent = String(rings.length);
  boundaryCoordinates.value = JSON.stringify(rings, null, 2);

  if (latestPreviewCoordinates.length) {
    renderVertexList(latestPreviewCoordinates);
    vertexCount.textContent = String(latestPreviewCoordinates.length);
    return;
  }

  const lastRing = rings[rings.length - 1] || [];
  renderVertexList(lastRing);
  vertexCount.textContent = String(lastRing.length ? Math.max(lastRing.length - 1, 0) : 0);
}

function renderVertexList(coordinates) {
  vertexList.innerHTML = "";

  const visibleCoordinates = coordinates.length > 1 && isClosedRing(coordinates)
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

function formatCoordinate(value) {
  return Number(value).toFixed(6);
}

function extractPreviewCoordinates(geometry) {
  const polygonCoordinates = geometry.getCoordinates()[0] || [];
  return polygonCoordinates.map((coordinate) => {
    const [lng, lat] = ol.proj.toLonLat(coordinate);
    return [Number(lng.toFixed(6)), Number(lat.toFixed(6))];
  });
}

function isClosedRing(ring) {
  if (ring.length < 2) return false;
  const first = ring[0];
  const last = ring[ring.length - 1];
  return first[0] === last[0] && first[1] === last[1];
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

function exportGeoJson() {
  return geoJsonFormat.writeFeaturesObject(boundarySource.getFeatures(), {
    dataProjection: "EPSG:4326",
    featureProjection: "EPSG:3857",
  });
}

function applyCoordinateRings(inputRings, options = {}) {
  const {
    statusMessage = "바운더리를 적용했습니다.",
    fitView = true,
  } = options;

  const rings = normalizeCoordinateRings(inputRings);
  const features = rings.map((ring) => {
    const projected = ring.map((coordinate) => ol.proj.fromLonLat(coordinate));
    return new ol.Feature(new ol.geom.Polygon([projected]));
  });

  boundarySource.clear();
  boundarySource.addFeatures(features);
  latestPreviewCoordinates = [];

  if (fitView && features.length) {
    const extent = boundarySource.getExtent();
    if (extent && extent.every(Number.isFinite)) {
      map.getView().fit(extent, {
        padding: [50, 50, 50, 50],
        maxZoom: 8,
        duration: 0,
      });
    }
  }

  saveBoundaries();
  renderBoundaryState();
  setStatus(statusMessage);
}

function saveBoundaries() {
  if (!boundarySource.getFeatures().length) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(exportGeoJson()));
}

function restoreBoundaries() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    applyCoordinateRings(DEFAULT_EXCLUSION_BOUNDARIES, {
      statusMessage: "기본 내륙 바운더리를 불러왔습니다.",
      fitView: true,
    });
    return;
  }

  try {
    const payload = JSON.parse(raw);
    const features = geoJsonFormat.readFeatures(payload, {
      dataProjection: "EPSG:4326",
      featureProjection: "EPSG:3857",
    });
    boundarySource.addFeatures(features);

    if (features.length) {
      const extent = boundarySource.getExtent();
      if (extent && extent.every(Number.isFinite)) {
        map.getView().fit(extent, {
          padding: [50, 50, 50, 50],
          maxZoom: 12,
          duration: 0,
        });
      }
      setStatus("저장된 바운더리를 불러왔습니다.");
    }
  } catch (error) {
    console.error(error);
    localStorage.removeItem(STORAGE_KEY);
    applyCoordinateRings(DEFAULT_EXCLUSION_BOUNDARIES, {
      statusMessage: "저장된 바운더리를 읽지 못해 기본 내륙 바운더리로 초기화했습니다.",
      fitView: true,
    });
  }
}

function normalizeCoordinateRings(raw) {
  if (!Array.isArray(raw)) {
    throw new Error("좌표 배열은 배열 형식이어야 합니다.");
  }

  const rings = raw.map((ring) => {
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

  return rings;
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
