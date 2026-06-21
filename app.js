let _liveVesselItems = []; // [{label, key}] — 선언을 최상단에 둬야 bootstrapVesselData 이전에 참조 가능

const DEFAULT_CENTER = [126.9784, 37.5665];
const SAMPLE_COORDINATES = { lat: 34.099686, lng: 125.116658 };
const SEARCH_RESULT_ZOOM = 11;
const FIXED_ISLAND_TYPE = "inhabited";
const BUNDLED_VESSEL_DATA_URL = "/data/vessel-data.json";
const VESSEL_STORAGE_KEY = "marineIncident.vesselData.v2";
const MAX_VESSEL_SUGGESTIONS = 8;
const FIRE_STATION_API_URL = "/api/fire-stations";
const HEALTH_CENTER_API_URL = "/api/health-centers";
const HOSPITAL_API_URL = "/api/hospitals";
const KCG_STATION_API_URL = "/api/kcg-stations";
const WEATHER_STATION_API_URL = "/data/weather_stations.json";
const EXCLUSION_BOUNDARY_STORAGE_KEY = "marineIncident.exclusionBoundaries.v1";
const DEFAULT_EXCLUSION_BOUNDARIES = [
  [
    [126.691879, 37.471107],
    [126.701152, 37.454377],
    [126.721643, 37.441068],
    [126.758432, 37.421099],
    [126.805932, 37.375224],
    [126.840859, 37.299409],
    [126.756826, 37.205467],
    [126.856692, 37.145516],
    [126.94198, 37.021402],
    [127.061114, 36.892866],
    [126.840004, 36.767905],
    [126.754317, 36.83726],
    [126.670959, 36.901633],
    [126.57689, 36.885619],
    [126.492134, 36.781628],
    [126.588066, 36.766334],
    [126.499585, 36.676375],
    [126.636049, 36.580827],
    [126.689331, 36.295521],
    [126.748925, 36.171383],
    [126.88222, 35.949986],
    [126.708781, 35.492605],
    [126.485635, 35.323359],
    [126.547037, 35.159495],
    [126.488527, 35.064543],
    [126.526832, 34.871719],
    [126.518944, 34.796194],
    [126.445332, 34.644985],
    [126.587106, 34.517797],
    [126.620605, 34.488601],
    [126.771224, 34.698499],
    [126.779477, 34.64027],
    [126.931318, 34.680745],
    [127.001615, 34.75124],
    [127.202652, 34.860788],
    [127.354506, 34.882824],
    [127.563151, 34.965429],
    [127.764167, 35.029213],
    [127.82614, 35.080595],
    [127.848386, 35.103998],
    [128.034448, 35.151892],
    [128.174663, 35.154654],
    [128.600226, 35.229809],
    [128.640747, 35.252521],
    [128.639158, 35.274578],
    [128.688419, 35.264848],
    [128.853578, 35.133225],
    [129.135635, 35.19493],
    [129.26117, 35.385595],
    [129.407363, 35.613928],
    [129.359938, 35.865858],
    [129.27703, 36.370803],
    [129.294065, 36.267318],
    [129.378156, 36.717448],
    [129.23995, 37.12341],
    [129.152307, 37.364919],
    [128.901737, 37.751499],
    [128.176135, 38.350714],
    [127.655954, 38.287031],
    [127.597694, 38.140954],
    [127.269425, 38.379578],
    [126.808737, 38.092742],
    [126.749185, 37.966176],
    [126.66716, 37.910347],
    [126.777275, 37.797674],
    [126.734577, 37.730165],
    [126.652552, 37.680382],
    [126.662665, 37.590511],
    [126.671654, 37.526377],
    [126.671947, 37.490519],
    [126.691879, 37.471107],
  ],
];

const SAMPLE_REPORT = {
  lat: 34.099686,
  lng: 125.116658,
  reportDatetime: "2026-02-21T16:00",
  reportCenter: "목포운항관리센터",
  operationRoute: "진리-재원 항로",
  departurePlace: "점암",
  departureTime: "10:46",
  weatherSummary: "풍향(SE), 풍속(8-9m/s), 파고(0.5-1.0m), 시정(양호)",
  vesselName: "섬사랑3호",
  vesselNumber: "MPR-21628",
  vesselType: "차도선",
  grossTonnage: "156",
  vehicleCount: "1",
  cargoWeight: "",
  registryPort: "목포시",
  nationality: "대한민국",
  ownerName: "신안군",
  inspectionAgency: "KOMSA",
  insuranceStatus: "한국해운조합 - 선체(15억 2천만원), 여객(3억 원)",
  crewCount: "4",
  passengerCount: "2",
  accidentType: "기관손상",
  humanDamage: "없음",
  pollutionDamage: "없음",
  shipDamage: "없음",
  delayTime: "-",
  suspectedCause: "기관계통 고장",
  accidentNote: "기관손상 발생 후 자력 운항 가능 여부와 추가 피해 여부를 확인 중임.",
};

const ACCIDENT_LABELS = {}; // 더 이상 사용 안 함 — value가 바로 한글명

const VESSEL_FIELD_ALIASES = {
  vesselName: [
    "선박명",
    "선명",
    "선 명",
    "선    명",
    "선박이름",
    "vesselname",
    "shipname",
  ],
  vesselNumber: [
    "선박번호",
    "선박 번호",
    "선번",
    "등록번호",
    "vesselnumber",
    "shipnumber",
    "imo",
    "mmsi",
  ],
  vesselType: [
    "선종",
    "선종명",
    "선박종류",
    "선박유형",
    "vesseltype",
    "shiptype",
    "type",
  ],
  grossTonnage: [
    "총톤수",
    "톤수",
    "grosstonnage",
    "gross tonnage",
    "gt",
  ],
  cargoType: [
    "화물",
    "화물차량",
    "화물/차량",
    "차량",
    "차량적재",
    "화물적재",
    "cargotype",
    "cargo",
  ],
  registryPort: [
    "선적항",
    "선적항명",
    "등록항",
    "기항지",
    "선사위치",
    "registryport",
    "portofregistry",
  ],
  nationality: [
    "국적",
    "nationality",
    "flag",
  ],
  ownerName: [
    "소유자",
    "선박회사",
    "소유자또는선박회사",
    "업체명",
    "ownername",
    "owner",
    "company",
  ],
  inspectionAgency: [
    "검사기관",
    "검사",
    "inspectionagency",
    "inspection",
    "class",
  ],
  insuranceStatus: [
    "보험현황",
    "보험",
    "insurancestatus",
    "insurance",
  ],
  crewCount: [
    "승무원",
    "무원",
    "선원수",
    "최소승무정원",
    "crewcount",
    "crew",
  ],
  passengerCount: [
    "여객",
    "승객",
    "여객수",
    "여객정원",
    "passengercount",
    "passenger",
  ],
  routeName: [
    "항로명",
    "route",
    "routename",
  ],
};

const VESSEL_FIELD_LABELS = {
  vesselName: "선박명",
  vesselNumber: "선박번호",
  vesselType: "선종",
  grossTonnage: "총톤수",
  cargoType: "화물/차량",
  registryPort: "선적항",
  nationality: "국적",
  ownerName: "소유자/선박회사",
  inspectionAgency: "검사기관",
  insuranceStatus: "보험현황",
  crewCount: "승무원",
  passengerCount: "여객",
  routeName: "항로명",
};

const latInput = document.getElementById("lat-input");
const lngInput = document.getElementById("lng-input");
const statusBar = document.getElementById("status");

const reportDatetimeInput = document.getElementById("report-datetime");
const reportCenterInput = document.getElementById("report-center");
const operationRouteInput = document.getElementById("operation-route");
const departurePlaceInput = document.getElementById("departure-place");
const departureTimeInput = document.getElementById("departure-time");
const weatherSummaryInput = document.getElementById("weather-summary");

const vesselDataFileInput = document.getElementById("vessel-data-file");
const vesselDataStatus = document.getElementById("vessel-data-status");
const vesselNameInput = document.getElementById("vessel-name");
const vesselNameSuggestionBox = document.getElementById("vessel-name-suggestion-box");
const vesselNumberPickerGroup = document.getElementById("vessel-number-picker-group");
const vesselNumberPicker = document.getElementById("vessel-number-picker");
const vesselNumberInput = document.getElementById("vessel-number");
const vesselTypeInput = document.getElementById("vessel-type");
const grossTonnageInput = document.getElementById("gross-tonnage");
const registryPortInput = document.getElementById("registry-port");
const nationalityInput = document.getElementById("nationality");
const ownerNameInput = document.getElementById("owner-name");
const inspectionAgencyInput = document.getElementById("inspection-agency");
const insuranceStatusInput = document.getElementById("insurance-status");
const crewCountInput = document.getElementById("crew-count");
const passengerCountInput = document.getElementById("passenger-count");
const vehicleCountInput = document.getElementById("vehicle-count");
const cargoWeightInput = document.getElementById("cargo-weight");

const accidentTypeInput = document.getElementById("accident-type");
const humanDamageInput = document.getElementById("human-damage");
const pollutionDamageInput = document.getElementById("pollution-damage");
const shipDamageInput = document.getElementById("ship-damage");
const delayTimeInput = document.getElementById("delay-time");
const suspectedCauseInput = document.getElementById("suspected-cause");
const accidentNoteInput = document.getElementById("accident-note");

const resultOverlay = document.getElementById("map-result-overlay");
const emergencyCardsOverlay = document.getElementById("emergency-cards-overlay");
const resultSummary = document.getElementById("result-summary");
const resultIsland = document.getElementById("result-island");
const resultDirection = document.getElementById("result-direction");
const resultDistance = document.getElementById("result-distance");
const resultLocation = document.getElementById("result-location");
const resultFireStation = document.getElementById("result-fire-station");
const resultFireDistance = document.getElementById("result-fire-distance");
const resultFirePhone = document.getElementById("result-fire-phone");
const resultFireAddress = document.getElementById("result-fire-address");

const reportPreviewOverlay = document.getElementById("report-preview-overlay");
const reportTitle = document.getElementById("report-title");
const previewReportDatetime = document.getElementById("preview-report-datetime");
const previewReportCenter = document.getElementById("preview-report-center");
const previewAccidentSummary = document.getElementById("preview-accident-summary");
const previewWeather = document.getElementById("preview-weather");
const previewVesselName = document.getElementById("preview-vessel-name");
const previewGrossTonnage = document.getElementById("preview-gross-tonnage");
const previewVesselType = document.getElementById("preview-vessel-type");
const previewVesselNumber = document.getElementById("preview-vessel-number");
const previewCargoType = document.getElementById("preview-cargo-type");
const previewRegistryPort = document.getElementById("preview-registry-port");
const previewPersonsOnboard = document.getElementById("preview-persons-onboard");
const previewNationality = document.getElementById("preview-nationality");
const previewInspectionAgency = document.getElementById("preview-inspection-agency");
const previewOwnerName = document.getElementById("preview-owner-name");
const previewInsuranceStatus = document.getElementById("preview-insurance-status");
const previewAccidentType = document.getElementById("preview-accident-type");
const previewHumanDamage = document.getElementById("preview-human-damage");
const previewPollutionDamage = document.getElementById("preview-pollution-damage");
const previewShipDamage = document.getElementById("preview-ship-damage");
const previewDelayTime = document.getElementById("preview-delay-time");
const previewSuspectedCause = document.getElementById("preview-suspected-cause");
const previewNearestFireStation     = document.getElementById("preview-nearest-fire-station");
const previewNearestFireStationName = document.getElementById("preview-nearest-fire-station-name");
const previewNearestFireStationDist = document.getElementById("preview-nearest-fire-station-dist");
const previewNearestHealthCenter     = document.getElementById("preview-nearest-health-center");
const previewNearestHealthCenterName = document.getElementById("preview-nearest-health-center-name");
const previewNearestHealthCenterDist = document.getElementById("preview-nearest-health-center-dist");
const previewNearestHospital         = document.getElementById("preview-nearest-hospital");
const previewNearestHospitalName     = document.getElementById("preview-nearest-hospital-name");
const previewNearestHospitalDist     = document.getElementById("preview-nearest-hospital-dist");
const copyReportButton = document.getElementById("copy-report-button");
const copySmsButton = document.getElementById("copy-sms-button");
const sampleReportButton = document.getElementById("sample-report-button");
const toggleReportButton = document.getElementById("toggle-report-button");

const VESSEL_INPUTS = {
  vesselName: vesselNameInput,
  vesselNumber: vesselNumberInput,
  vesselType: vesselTypeInput,
  grossTonnage: grossTonnageInput,
  registryPort: registryPortInput,
  ownerName: ownerNameInput,
  inspectionAgency: inspectionAgencyInput,
  insuranceStatus: insuranceStatusInput,
};

let latestNearestResult = null;
let latestNearestFireStation = null;
let latestNearestHealthCenter = null;
let latestNearestHospital = null;
let uploadedVesselRecords = [];
let currentVesselMatches = [];
let activeVesselRecordId = null;
let lastAutoRouteValue = "";
let cachedFireStations = [];
let filteredFireStations = [];
let fireStationFetchPromise = null;
let cachedHealthCenters = [];
let filteredHealthCenters = [];
let healthCenterFetchPromise = null;
let cachedHospitals = [];
let filteredHospitals = [];
let hospitalFetchPromise = null;
let latestNearestKcgStation = null;   // 파출소
let latestNearestKcgBranch = null;    // 출장소
let cachedKcgStations = [];
let filteredKcgStations = [];
let kcgStationFetchPromise = null;

// 해양기상 관측지점
let cachedWeatherStations = null;
let weatherStationFetchPromise = null;
let latestNearestWeatherStation = null;

const userSource = new ol.source.Vector();
const islandSource = new ol.source.Vector();
const lineSource = new ol.source.Vector();
const routeLabelSource = new ol.source.Vector();
const fireStationSource = new ol.source.Vector();
const healthCenterSource = new ol.source.Vector();

function buildMarkerSvg(fillColor, strokeColor, innerColor) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 42 42">
      <path d="M21 2C12.163 2 5 9.163 5 18c0 10.879 12.089 20.61 15.18 22.935a1.35 1.35 0 0 0 1.64 0C24.911 38.61 37 28.879 37 18 37 9.163 29.837 2 21 2Z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/>
      <circle cx="21" cy="18" r="7.5" fill="${innerColor}"/>
    </svg>
  `.trim();
}

function buildAccidentVesselSvg() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="78" viewBox="0 0 64 78">
      <defs>
        <filter id="shadow" x="-30%" y="-20%" width="160%" height="180%">
          <feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="rgba(10,26,40,0.28)"/>
        </filter>
      </defs>
      <g filter="url(#shadow)">
        <path d="M32 3C20.4 3 11 12.4 11 24c0 14.4 15.2 27.1 20.1 30.8.6.5 1.2.7 1.9.7.7 0 1.3-.2 1.9-.7C39.8 51.1 55 38.4 55 24 55 12.4 45.6 3 34 3h-2Z" fill="#f36a3a"/>
        <circle cx="32" cy="24" r="14" fill="#fffaf6"/>
        <path d="M24.7 27.8 29.4 18h11.5l3.7 9.8-7.8 5.1h-8.6Z" fill="#f36a3a"/>
        <path d="M30.6 16.5V11l7.8 5.5Z" fill="#f36a3a"/>
        <circle cx="47.5" cy="12.5" r="8.5" fill="#e6283b"/>
        <path d="M47.5 8.2v6.1" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>
        <circle cx="47.5" cy="18.4" r="1.9" fill="#fff"/>
      </g>
    </svg>
  `.trim();
}

let hasCalculated = false;

function buildDotStyle(fillColor, strokeColor, radius = 6) {
  return new ol.style.Style({
    image: new ol.style.Circle({
      radius,
      fill: new ol.style.Fill({ color: fillColor }),
      stroke: new ol.style.Stroke({ color: strokeColor, width: 1.5 }),
    }),
  });
}

function hexA(hex, alpha) {
  return hex + Math.round(alpha * 255).toString(16).padStart(2, "0");
}

function buildDimDotStyle(fillColor, strokeColor, radius = 5) {
  return new ol.style.Style({
    image: new ol.style.Circle({
      radius,
      fill: new ol.style.Fill({ color: hexA(fillColor, 0.22) }),
      stroke: new ol.style.Stroke({ color: hexA(strokeColor, 0.22), width: 1 }),
    }),
  });
}

function buildPinStyle(fillColor, strokeColor, innerColor, labelColor) {
  return new ol.style.Style({
    image: new ol.style.Icon({
      anchor: [0.5, 1],
      src: `data:image/svg+xml;utf8,${encodeURIComponent(buildMarkerSvg(fillColor, strokeColor, innerColor))}`,
      scale: 0.86,
    }),
    text: new ol.style.Text({
      offsetY: -24,
      font: "700 13px Pretendard, sans-serif",
      fill: new ol.style.Fill({ color: labelColor }),
      backgroundFill: new ol.style.Fill({ color: "rgba(255,255,255,0.92)" }),
      padding: [3, 6, 3, 6],
    }),
  });
}

function buildImageNearestStyle(src, scale, labelColor, iconHeightPx, haloColor) {
  const haloRadius = Math.round(iconHeightPx * scale / 2) + 6;
  return (name) => [
    new ol.style.Style({
      image: new ol.style.Circle({
        radius: haloRadius,
        fill: new ol.style.Fill({ color: hexA(haloColor, 0.18) }),
        stroke: new ol.style.Stroke({ color: hexA(haloColor, 0.5), width: 2 }),
      }),
    }),
    new ol.style.Style({
      image: new ol.style.Icon({ src, scale, anchor: [0.5, 0.5] }),
      text: new ol.style.Text({
        text: name || "",
        offsetY: -Math.round(iconHeightPx * scale / 2) - 8,
        font: "bold 16px Pretendard, sans-serif",
        fill: new ol.style.Fill({ color: labelColor }),
        stroke: new ol.style.Stroke({ color: "#fff", width: 3 }),
        textAlign: "center",
      }),
    }),
  ];
}

// 모든 아이콘 렌더링 크기를 40px로 통일
// fire: 450px tall → scale=40/450≈0.089
// kcg:  423px tall → scale=40/423≈0.095
// health: 226px tall → scale=40/226≈0.177
// hospital: 200px tall → scale=40/200=0.20
const fireNearestStyle     = buildImageNearestStyle("/icon_fire.svg",     0.308, "#8f1e26", 130, "#e05060");
const kcgNearestStyle      = buildImageNearestStyle("/icon_kcg.svg",      0.128, "#003366", 312, "#f07020");
const healthNearestStyle   = buildImageNearestStyle("/icon_health.svg",   0.177, "#007a8a", 226, "#00a4b3");
const hospitalNearestStyle = buildImageNearestStyle("/icon_hospital.svg", 0.20,  "#007A33", 200, "#2cb87a");

const fireStationStyles = {
  default: buildDotStyle("#e05060", "#8f1e26"),
  dim: buildDimDotStyle("#e05060", "#8f1e26"),
  nearest: null,
};

const userLayer = new ol.layer.Vector({
  source: userSource,
  style: new ol.style.Style({
    image: new ol.style.Icon({
      anchor: [0.5, 55.5 / 78],
      src: `data:image/svg+xml;utf8,${encodeURIComponent(buildAccidentVesselSvg())}`,
      scale: 0.82,
    }),
  }),
});

const islandLayer = new ol.layer.Vector({
  source: islandSource,
  style: new ol.style.Style({
    image: new ol.style.Circle({
      radius: 8,
      fill: new ol.style.Fill({ color: "#e6b655" }),
      stroke: new ol.style.Stroke({ color: "#fff6d5", width: 2 }),
    }),
  }),
});

const lineLayer = new ol.layer.Vector({
  source: lineSource,
  style: new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: "rgba(29, 182, 164, 0.95)",
      width: 3,
      lineDash: [10, 8],
    }),
  }),
});

const routeLabelLayer = new ol.layer.Vector({
  source: routeLabelSource,
  style: new ol.style.Style({
    text: new ol.style.Text({
      font: "700 14px Pretendard, sans-serif",
      fill: new ol.style.Fill({ color: "#103145" }),
      backgroundFill: new ol.style.Fill({ color: "rgba(255,255,255,0.94)" }),
      padding: [5, 8, 5, 8],
      overflow: true,
    }),
  }),
});

const fireStationLayer = new ol.layer.Vector({
  source: fireStationSource,
  zIndex: 50,
  style: (feature) => {
    if (feature.get("isNearest")) return fireNearestStyle(feature.get("name") || "");
    return hasCalculated ? fireStationStyles.dim : fireStationStyles.default;
  },
});

const healthCenterStyles = {
  default: buildDotStyle("#3a82cb", "#1e4e8f"),
  dim: buildDimDotStyle("#3a82cb", "#1e4e8f"),
  nearest: buildPinStyle("#3a82cb", "#1e4e8f", "#f0f6ff", "#003d7a"),
};

const hospitalStyles = {
  default: buildDotStyle("#2cb87a", "#1a7a52"),
  dim: buildDimDotStyle("#2cb87a", "#1a7a52"),
  nearest: buildPinStyle("#2cb87a", "#1a7a52", "#f0fff8", "#0a4d30"),
};

const kcgStationStyles = {
  default: buildDotStyle("#f07020", "#a04010"),
  dim: buildDimDotStyle("#f07020", "#a04010"),
  nearest: null,
};

// 기상 관측 지점 스타일 (하늘색 계열)
const _weatherPinBase = buildPinStyle("#29b6f6", "#0277bd", "#e8f7ff", "#014d7a");
const weatherStationNearestStyle = (name) => {
  const s = _weatherPinBase.clone();
  s.getText().setText(name);
  return s;
};
const weatherStationStyles = {
  default: buildDotStyle("#29b6f6", "#0277bd"),
  dim: buildDimDotStyle("#29b6f6", "#0277bd"),
};

const healthCenterLayer = new ol.layer.Vector({
  source: healthCenterSource,
  zIndex: 50,
  style: (feature) => {
    if (feature.get("isNearest")) return healthNearestStyle(feature.get("name") || "");
    return hasCalculated ? healthCenterStyles.dim : healthCenterStyles.default;
  },
});

const hospitalSource = new ol.source.Vector();
const hospitalLayer = new ol.layer.Vector({
  source: hospitalSource,
  zIndex: 50,
  style: (feature) => {
    if (feature.get("isNearest")) return hospitalNearestStyle(feature.get("name") || "");
    return hasCalculated ? hospitalStyles.dim : hospitalStyles.default;
  },
});

const kcgStationSource = new ol.source.Vector();
const kcgStationLayer = new ol.layer.Vector({
  source: kcgStationSource,
  zIndex: 50,
  style: (feature) => {
    if (feature.get("isNearest")) return kcgNearestStyle(feature.get("name") || "");
    return hasCalculated ? kcgStationStyles.dim : kcgStationStyles.default;
  },
});

const weatherStationSource = new ol.source.Vector();
const weatherStationLayer = new ol.layer.Vector({
  source: weatherStationSource,
  zIndex: 45,
  style: (feature) => {
    if (feature.get("isNearest")) return weatherStationNearestStyle(feature.get("name") || "");
    return hasCalculated ? weatherStationStyles.dim : weatherStationStyles.default;
  },
});

const map = new ol.Map({
  target: "map",
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM(),
    }),
    // VWorld 수심도 레이어: 로컬(localhost)에서만 활성화, Railway 등 외부 배포에서는 생략
    ...(location.hostname === "localhost" || location.hostname === "127.0.0.1" ? [
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
    ] : []),
    fireStationLayer,
    healthCenterLayer,
    hospitalLayer,
    kcgStationLayer,
    weatherStationLayer,
    lineLayer,
    routeLabelLayer,
    islandLayer,
    userLayer,
  ],
  view: new ol.View({
    center: ol.proj.fromLonLat(DEFAULT_CENTER),
    zoom: 7,
  }),
  controls: ol.control.defaults.defaults({
    attributionOptions: {
      collapsible: true,
    },
  }),
});

document.getElementById("search-form").addEventListener("submit", (event) => {
  event.preventDefault();
  runSearch();
});

document.getElementById("sample-button").addEventListener("click", () => {
  latInput.value = SAMPLE_COORDINATES.lat;
  lngInput.value = SAMPLE_COORDINATES.lng;
  runSearch();
  _wsBroadcast();
});

sampleReportButton.addEventListener("click", () => {
  fillSampleReport();
});

vesselDataFileInput.addEventListener("change", async (event) => {
  const [file] = event.target.files || [];
  if (!file) return;

  latestNearestFireStation = null;
  renderNearestFireStationResult();
  fireStationSource.clear();

  resultOverlay.classList.add("hidden");
  routeLabelSource.clear();

  try {
    const rows = await parseVesselDataFile(file);
    loadVesselDataFromRows(rows, file.name);
    vesselDataFileInput.value = "";
  } catch (error) {
    console.error(error);
    updateVesselDataStatus(`자료 불러오기 실패: ${error.message}`);
    setStatus(`선박자료 업로드 실패: ${error.message}`);
  }
});

vesselNameInput.addEventListener("input", () => {
  renderVesselNameSuggestions(vesselNameInput.value);
  syncVesselLookup();
});

vesselNameInput.addEventListener("focus", () => {
  renderVesselNameSuggestions(vesselNameInput.value);
});

vesselNameInput.addEventListener("change", () => {
  renderVesselNameSuggestions(vesselNameInput.value);
  syncVesselLookup();
});

vesselNumberInput.addEventListener("input", () => {
  syncVesselLookup({ allowSingleStatus: false });
});

vesselNumberPicker.addEventListener("change", () => {
  const record = currentVesselMatches.find((item) => item.id === vesselNumberPicker.value);
  if (!record) return;

  applyVesselRecord(record);
  setStatus(`${record.vesselName}의 선박번호 ${record.vesselNumber || "미기재"} 제원을 불러왔습니다.`);
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".vessel-name-field")) {
    hideVesselNameSuggestions();
  }
});

map.on("click", (event) => {
  if (IS_VIEW_MODE) return; // 뷰어는 클릭 좌표 등록 불가
  const [lng, lat] = ol.proj.toLonLat(event.coordinate);
  latInput.value = lat.toFixed(6);
  lngInput.value = lng.toFixed(6);

  // 결과를 기다리지 않고 선박 마커를 즉시 표시
  userSource.clear();
  islandSource.clear();
  lineSource.clear();
  routeLabelSource.clear();
  userSource.addFeature(new ol.Feature(new ol.geom.Point(ol.proj.fromLonLat([lng, lat]))));

  runSearch();
  _wsBroadcast(); // 좌표 변경을 뷰어에 즉시 전송
});

[
  vesselNameInput,        // 선박명 — 보고서 제목·선박제원에 직접 반영
  vesselNumberInput,
  reportDatetimeInput,
  reportCenterInput,
  operationRouteInput,
  departurePlaceInput,
  departureTimeInput,
  weatherSummaryInput,
  vesselTypeInput,
  grossTonnageInput,
  registryPortInput,
  nationalityInput,
  ownerNameInput,
  inspectionAgencyInput,
  insuranceStatusInput,
  crewCountInput,
  passengerCountInput,
  vehicleCountInput,
  cargoWeightInput,
  accidentTypeInput,
  humanDamageInput,
  pollutionDamageInput,
  shipDamageInput,
  delayTimeInput,
  suspectedCauseInput,
  accidentNoteInput,
].forEach((element) => {
  element.addEventListener("input", updateReportPreview);
  element.addEventListener("change", updateReportPreview);
});

toggleReportButton.addEventListener("click", () => {
  const isCollapsed = reportPreviewOverlay.classList.toggle("collapsed");
  const label = toggleReportButton.querySelector(".toggle-report-label");
  toggleReportButton.setAttribute("aria-expanded", String(!isCollapsed));
  label.textContent = isCollapsed ? "보고서 펼치기" : "보고서 접기";
  toggleReportButton.title = isCollapsed ? "보고서 펼치기" : "보고서 접기";
});

let _toastTimer = null;
function showToast(msg) {
  const toast = document.getElementById("copy-toast");
  const msgEl = document.getElementById("copy-toast-msg");
  msgEl.textContent = msg;
  toast.classList.add("show");
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => toast.classList.remove("show"), 2000);
}

copyReportButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(buildReportText());
    showToast("보고서 문구가 복사됐습니다");
  } catch (error) {
    console.error(error);
    setStatus("복사에 실패했습니다.");
  }
});

copySmsButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(buildSmsText());
    showToast("문자 형식 문구가 복사됐습니다");
  } catch (error) {
    console.error(error);
    setStatus("복사에 실패했습니다.");
  }
});

setDefaultReportValues();
initializeFromQuery();
updateReportPreview();
bootstrapVesselData();

async function bootstrapVesselData() {
  updateVesselDataStatus("기본 선박자료를 확인하는 중입니다.");

  if (restoreStoredVesselData()) {
    return;
  }

  await loadBundledVesselData();
}

async function runSearch() {
  const lat = Number(latInput.value);
  const lng = Number(lngInput.value);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    setStatus("위도와 경도를 정확히 입력해 주세요.");
    return;
  }

  setStatus("최근접 섬을 계산하는 중입니다.");

  try {
    const [nearestResultState, fireStationState, healthCenterState, hospitalState, kcgStationState] = await Promise.allSettled([
      fetchNearestIsland(lat, lng),
      updateFireStationContext(lat, lng),
      updateHealthCenterContext(lat, lng),
      updateHospitalContext(lat, lng),
      updateKcgStationContext(lat, lng),
      updateWeatherStationContext(lat, lng),
    ]);

    if (nearestResultState.status !== "fulfilled") {
      throw nearestResultState.reason;
    }

    const nearestResult = nearestResultState.value;
    latestNearestResult = nearestResult;
    hasCalculated = true;
    renderNearestResult(nearestResult);
    drawMapFeatures(lat, lng, nearestResult);
    fitAllFacilities(lat, lng);
    updateQueryString(lat, lng);
    updateReportPreview();

    const warnings = [];
    if (fireStationState.status === "rejected") {
      console.error(fireStationState.reason);
      warnings.push("소방서");
    }
    if (healthCenterState.status === "rejected") {
      console.error(healthCenterState.reason);
      warnings.push("보건소");
    }
    if (hospitalState.status === "rejected") {
      console.error(hospitalState.reason);
      warnings.push("병원");
    }
    if (warnings.length) {
      setStatus(`섬 계산은 완료됐지만 ${warnings.join("·")} 정보를 불러오지 못했습니다.`);
      return;
    }
    setStatus("계산이 완료되었습니다.");
    // 좌표 변경 시 활성 선박 항로 패널 재갱신 (현위치→다음기항지 선 업데이트)
    if (_activeVesselKey) onLiveVesselSelect(_activeVesselKey);
  } catch (error) {
    console.error(error);
    setStatus(`조회 실패: ${error.message}`);
  }
}

async function fetchNearestIsland(lat, lng) {
  const url = new URL("/api/nearest", window.location.origin);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lng", String(lng));
  url.searchParams.set("islandType", FIXED_ISLAND_TYPE);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

async function updateFireStationContext(lat, lng) {
  const stations = await ensureFireStationsLoaded();
  const exclusionBoundaries = getExclusionBoundaries();
  filteredFireStations = filterFireStationsByBoundaries(stations, exclusionBoundaries);
  // 제외 경계로 모두 필터링된 경우 전체 목록으로 폴백
  const searchList = filteredFireStations.length > 0 ? filteredFireStations : stations;
  latestNearestFireStation = findNearestFireStation(lat, lng, searchList);
  renderFireStations(filteredFireStations, latestNearestFireStation);
  renderNearestFireStationResult();
  return {
    count: filteredFireStations.length,
    nearestStation: latestNearestFireStation,
  };
}

async function ensureFireStationsLoaded() {
  if (cachedFireStations.length) {
    return cachedFireStations;
  }

  if (!fireStationFetchPromise) {
    fireStationFetchPromise = fetchFireStations()
      .then((stations) => {
        cachedFireStations = Array.isArray(stations) ? stations : [];
        return cachedFireStations;
      })
      .finally(() => {
        fireStationFetchPromise = null;
      });
  }

  return fireStationFetchPromise;
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

function getExclusionBoundaries() {
  try {
    const raw = localStorage.getItem(EXCLUSION_BOUNDARY_STORAGE_KEY);
    if (!raw) {
      return normalizeBoundaryRings(DEFAULT_EXCLUSION_BOUNDARIES);
    }

    const payload = JSON.parse(raw);
    const rings = extractBoundaryRings(payload);
    return rings.length ? rings : normalizeBoundaryRings(DEFAULT_EXCLUSION_BOUNDARIES);
  } catch (error) {
    console.error(error);
    return normalizeBoundaryRings(DEFAULT_EXCLUSION_BOUNDARIES);
  }
}

function extractBoundaryRings(payload) {
  if (Array.isArray(payload)) {
    return normalizeBoundaryRings(payload);
  }

  const features = Array.isArray(payload?.features) ? payload.features : [];
  const rings = [];

  features.forEach((feature) => {
    const geometry = feature?.geometry;
    if (!geometry) return;

    if (geometry.type === "Polygon") {
      const outerRing = geometry.coordinates?.[0];
      if (outerRing) {
        rings.push(outerRing);
      }
      return;
    }

    if (geometry.type === "MultiPolygon") {
      geometry.coordinates.forEach((polygon) => {
        const outerRing = polygon?.[0];
        if (outerRing) {
          rings.push(outerRing);
        }
      });
    }
  });

  return normalizeBoundaryRings(rings);
}

function normalizeBoundaryRings(raw) {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((ring) => {
      if (!Array.isArray(ring) || ring.length < 3) {
        return null;
      }

      const normalized = ring
        .map((point) => {
          if (!Array.isArray(point) || point.length < 2) {
            return null;
          }

          const lng = Number(point[0]);
          const lat = Number(point[1]);
          if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
            return null;
          }

          return [lng, lat];
        })
        .filter(Boolean);

      if (normalized.length < 3) {
        return null;
      }

      const first = normalized[0];
      const last = normalized[normalized.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        normalized.push([...first]);
      }

      return normalized;
    })
    .filter(Boolean);
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

function isClosedRing(ring) {
  if (!Array.isArray(ring) || ring.length < 2) {
    return false;
  }

  const first = ring[0];
  const last = ring[ring.length - 1];
  return first[0] === last[0] && first[1] === last[1];
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

function isPointOnSegment(px, py, x1, y1, x2, y2) {
  const cross = (py - y1) * (x2 - x1) - (px - x1) * (y2 - y1);
  if (Math.abs(cross) > 1e-9) {
    return false;
  }

  const dot = (px - x1) * (px - x2) + (py - y1) * (py - y2);
  return dot <= 1e-9;
}

function findNearestFireStation(lat, lng, stations) {
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

function bearingDeg(lat1, lng1, lat2, lng2) {
  const φ1 = lat1 * Math.PI / 180, φ2 = lat2 * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}
function bearingToCompass(deg) {
  const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
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

function renderFireStations(stations, nearestStation) {
  fireStationSource.clear();

  stations.forEach((station) => {
    const feature = new ol.Feature({
      geometry: new ol.geom.Point([station.x, station.y]),
      name: station.name,
      phone: station.phone,
      address: getFireStationAddress(station),
      isNearest: Boolean(nearestStation && station.object_id === nearestStation.object_id),
    });
    fireStationSource.addFeature(feature);
  });
}

function renderNearestFireStationResult() {
  if (!latestNearestFireStation) {
    resultFireStation.textContent = "제외 후 소방서 없음";
    resultFireDistance.textContent = "-";
    resultFirePhone.textContent = "-";
    resultFireAddress.textContent = "-";
    return;
  }

  resultFireStation.textContent = latestNearestFireStation.name;
  resultFireDistance.textContent = formatDistanceNm(latestNearestFireStation.distance_nm);
  resultFirePhone.textContent = latestNearestFireStation.phone || "-";
  resultFireAddress.textContent = getFireStationAddress(latestNearestFireStation) || "-";
}

function formatDistanceNm(value) {
  if (!Number.isFinite(value)) {
    return "-";
  }
  return `${formatNumber(value, value < 1 ? 2 : 1)} 해리`;
}

function getFireStationAddress(station) {
  if (!station) {
    return "";
  }
  return station.road_address || station.address || "-";
}

function formatFireStationSummary(station) {
  if (!station) {
    return "제외 바운더리 밖 최근접 소방서 없음";
  }

  return [
    station.name || "이름 미상",
    station.phone || "전화번호 미상",
    getFireStationAddress(station) || "주소 미상",
    formatDistanceNm(station.distance_nm),
  ].join(" / ");
}

async function updateHealthCenterContext(lat, lng) {
  const centers = await ensureHealthCentersLoaded();
  const exclusionBoundaries = getExclusionBoundaries();
  filteredHealthCenters = filterFireStationsByBoundaries(centers, exclusionBoundaries);
  const searchList = filteredHealthCenters.length > 0 ? filteredHealthCenters : centers;
  latestNearestHealthCenter = findNearestHealthCenter(lat, lng, searchList);
  renderHealthCenters(filteredHealthCenters, latestNearestHealthCenter);
  renderNearestHealthCenterResult();
  return {
    count: filteredHealthCenters.length,
    nearestCenter: latestNearestHealthCenter,
  };
}

async function ensureHealthCentersLoaded() {
  if (cachedHealthCenters.length) {
    return cachedHealthCenters;
  }

  if (!healthCenterFetchPromise) {
    healthCenterFetchPromise = fetchHealthCenters()
      .then((centers) => {
        cachedHealthCenters = Array.isArray(centers) ? centers : [];
        return cachedHealthCenters;
      })
      .finally(() => {
        healthCenterFetchPromise = null;
      });
  }

  return healthCenterFetchPromise;
}

async function fetchHealthCenters() {
  const response = await fetch(HEALTH_CENTER_API_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(await response.text());
  }

  const payload = await response.json();
  if (!payload || !Array.isArray(payload.centers)) {
    throw new Error("보건소 데이터 형식이 올바르지 않습니다.");
  }

  return payload.centers;
}

function findNearestHealthCenter(lat, lng, centers) {
  if (!centers.length) {
    return null;
  }

  let nearest = null;

  centers.forEach((center) => {
    const distanceNm = haversineNm(lat, lng, center.lat, center.lng);
    if (!nearest || distanceNm < nearest.distance_nm) {
      nearest = { ...center, distance_nm: distanceNm };
    }
  });

  return nearest;
}

function renderHealthCenters(centers, nearestCenter) {
  healthCenterSource.clear();

  centers.forEach((center) => {
    const coordinate = ol.proj.fromLonLat([center.lng, center.lat]);
    const feature = new ol.Feature({
      geometry: new ol.geom.Point(coordinate),
      name: center.name,
      phone: center.phone,
      address: center.address,
      isNearest: Boolean(nearestCenter && center.id === nearestCenter.id),
    });
    healthCenterSource.addFeature(feature);
  });
}

function renderNearestHealthCenterResult() {
  const el = document.getElementById("result-health-center");
  const elDist = document.getElementById("result-health-center-distance");
  const elPhone = document.getElementById("result-health-center-phone");
  const elAddr = document.getElementById("result-health-center-address");
  if (!el) return;

  if (!latestNearestHealthCenter) {
    el.textContent = "보건소 없음";
    if (elDist) elDist.textContent = "-";
    if (elPhone) elPhone.textContent = "-";
    if (elAddr) elAddr.textContent = "-";
    return;
  }

  el.textContent = latestNearestHealthCenter.name;
  if (elDist) elDist.textContent = formatDistanceNm(latestNearestHealthCenter.distance_nm);
  if (elPhone) elPhone.textContent = latestNearestHealthCenter.phone || "-";
  if (elAddr) elAddr.textContent = latestNearestHealthCenter.address || "-";
}

function formatHealthCenterSummary(center) {
  if (!center) {
    return "최근접 보건소 없음";
  }

  return [
    center.name || "이름 미상",
    center.phone || "전화번호 미상",
    center.address || "주소 미상",
    formatDistanceNm(center.distance_nm),
  ].join(" / ");
}

// ── 병원 ────────────────────────────────────────────────

async function updateHospitalContext(lat, lng) {
  const hospitals = await ensureHospitalsLoaded();
  const exclusionBoundaries = getExclusionBoundaries();
  filteredHospitals = filterFireStationsByBoundaries(hospitals, exclusionBoundaries);
  const searchList = filteredHospitals.length > 0 ? filteredHospitals : hospitals;
  latestNearestHospital = findNearestHospital(lat, lng, searchList);
  renderHospitals(filteredHospitals, latestNearestHospital);
  renderNearestHospitalResult();
  return { count: filteredHospitals.length, nearest: latestNearestHospital };
}

async function ensureHospitalsLoaded() {
  if (cachedHospitals.length) return cachedHospitals;
  if (!hospitalFetchPromise) {
    hospitalFetchPromise = fetchHospitals()
      .then((hospitals) => {
        cachedHospitals = Array.isArray(hospitals) ? hospitals : [];
        return cachedHospitals;
      })
      .catch((err) => {
        hospitalFetchPromise = null;
        throw err;
      });
  }
  return hospitalFetchPromise;
}

async function fetchHospitals() {
  const response = await fetch(HOSPITAL_API_URL, { cache: "no-store" });
  if (!response.ok) throw new Error(`병원 API 오류: ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data.hospitals || [];
}

function findNearestHospital(lat, lng, hospitals) {
  if (!hospitals.length) return null;
  let nearest = null;
  hospitals.forEach((h) => {
    const distanceNm = haversineNm(lat, lng, h.lat, h.lng);
    if (!nearest || distanceNm < nearest.distance_nm) {
      nearest = { ...h, distance_nm: distanceNm };
    }
  });
  return nearest;
}

function renderHospitals(hospitals, nearestHospital) {
  hospitalSource.clear();
  hospitals.forEach((h) => {
    const feature = new ol.Feature({
      geometry: new ol.geom.Point(ol.proj.fromLonLat([h.lng, h.lat])),
      name: h.name,
      phone: h.phone,
      address: h.address,
      isNearest: Boolean(nearestHospital && h.id === nearestHospital.id),
    });
    hospitalSource.addFeature(feature);
  });
}

function renderNearestHospitalResult() {
  const el = document.getElementById("result-hospital");
  const elDist = document.getElementById("result-hospital-distance");
  const elPhone = document.getElementById("result-hospital-phone");
  const elAddr = document.getElementById("result-hospital-address");
  if (!el) return;

  if (!latestNearestHospital) {
    el.textContent = "병원 없음";
    if (elDist) elDist.textContent = "-";
    if (elPhone) elPhone.textContent = "-";
    if (elAddr) elAddr.textContent = "-";
    return;
  }

  el.textContent = latestNearestHospital.name;
  if (elDist) elDist.textContent = formatDistanceNm(latestNearestHospital.distance_nm);
  if (elPhone) elPhone.textContent = latestNearestHospital.phone || "-";
  if (elAddr) elAddr.textContent = latestNearestHospital.address || "-";
}

// ── 해경파출소 ────────────────────────────────────────────────

async function updateKcgStationContext(lat, lng) {
  const stations = await ensureKcgStationsLoaded();
  filteredKcgStations = stations;

  const pachulso  = stations.filter(s => s.name.includes("파출소"));
  const chuljanso = stations.filter(s => s.name.includes("출장소"));

  latestNearestKcgStation = findNearestKcgStation(lat, lng, pachulso);
  latestNearestKcgBranch  = findNearestKcgStation(lat, lng, chuljanso);

  renderKcgStations(filteredKcgStations, latestNearestKcgStation, latestNearestKcgBranch);
  renderNearestKcgStationResult();
  return { count: filteredKcgStations.length, nearest: latestNearestKcgStation };
}

async function ensureKcgStationsLoaded() {
  if (cachedKcgStations.length) return cachedKcgStations;
  if (!kcgStationFetchPromise) {
    kcgStationFetchPromise = fetchKcgStations()
      .then((stations) => {
        cachedKcgStations = Array.isArray(stations) ? stations : [];
        return cachedKcgStations;
      })
      .catch((err) => {
        console.error("해경파출소 API 오류:", err);
        kcgStationFetchPromise = null;
        return [];
      });
  }
  return kcgStationFetchPromise;
}

// ── 해양기상 관측지점 ──────────────────────────────────────
async function ensureWeatherStationsLoaded() {
  if (cachedWeatherStations) return cachedWeatherStations;
  if (!weatherStationFetchPromise) {
    weatherStationFetchPromise = fetch(WEATHER_STATION_API_URL)
      .then(r => r.json())
      .then(d => {
        // 정적 JSON은 배열, API는 {stations:[]} 형태 둘 다 지원
        cachedWeatherStations = Array.isArray(d) ? d : (Array.isArray(d.stations) ? d.stations : []);
        return cachedWeatherStations;
      })
      .catch(err => {
        console.error("기상지점 API 오류:", err);
        weatherStationFetchPromise = null;
        cachedWeatherStations = [];
        return [];
      });
  }
  return weatherStationFetchPromise;
}

function findNearestWeatherStation(lat, lng, typeFilter = null) {
  if (!cachedWeatherStations || cachedWeatherStations.length === 0) return null;
  let nearest = null, minDist = Infinity;
  for (const s of cachedWeatherStations) {
    if (typeFilter && !typeFilter.includes(s.type)) continue;
    const d = haversineNm(lat, lng, s.lat, s.lng);
    if (d < minDist) { minDist = d; nearest = s; }
  }
  return nearest ? { ...nearest, distance_nm: minDist } : null;
}

function renderWeatherStations() {
  weatherStationSource.clear();
  if (!cachedWeatherStations) return;
  cachedWeatherStations.forEach((s) => {
    const feature = new ol.Feature({
      geometry: new ol.geom.Point(ol.proj.fromLonLat([s.lng, s.lat])),
      name: `${s.name} (${s.id})`,
      isNearest: Boolean(latestNearestWeatherStation && s.id === latestNearestWeatherStation.id),
    });
    weatherStationSource.addFeature(feature);
  });
}

async function _fetchWeatherData(station) {
  if (!station) return null;
  try {
    const p = new URLSearchParams({ stn: station.id, type: "sea" });
    if (station.lat != null) p.set("lat", station.lat);
    if (station.lng != null) p.set("lng", station.lng);
    const res = await fetch(`/api/kma-weather?${p}`);
    if (!res.ok) return null;
    const d = await res.json();
    return d.error ? null : d;
  } catch (e) {
    return null;
  }
}

async function fetchAndFillWeather(windStation, buoyStation) {
  // 풍향·풍속·기온: AWS/ASOS 최근접, 파고: BUOY 최근접 — 동시 조회 후 병합
  const [windData, buoyData] = await Promise.all([
    _fetchWeatherData(windStation),
    _fetchWeatherData(buoyStation),
  ]);

  // 카드에 출처별 값 표시
  const windNameEl = document.getElementById("result-weather-wind-stn-name");
  const windDistEl = document.getElementById("result-weather-wind-stn-dist");
  const windValEl  = document.getElementById("result-weather-wind-val");
  const buoyNameEl = document.getElementById("result-weather-buoy-stn-name");
  const buoyDistEl = document.getElementById("result-weather-buoy-stn-dist");
  const buoyValEl  = document.getElementById("result-weather-buoy-val");

  if (windNameEl) windNameEl.textContent = windStation ? windStation.name : "-";
  if (windDistEl) windDistEl.textContent = windStation ? formatDistanceNm(windStation.distance_nm) : "";
  if (buoyNameEl) buoyNameEl.textContent = buoyStation ? buoyStation.name : "-";
  if (buoyDistEl) buoyDistEl.textContent = buoyStation ? formatDistanceNm(buoyStation.distance_nm) : "";

  const windParts = [];
  if (windData?.wind_dir && windData?.wind_speed != null)
    windParts.push(`풍향(${windData.wind_dir}), 풍속(${windData.wind_speed}m/s)`);
  if (windData?.air_temp != null)
    windParts.push(`기온(${windData.air_temp}℃)`);
  if (windData?.wave_height != null)
    windParts.push(`파고(${windData.wave_height}m)`);
  if (windValEl) windValEl.textContent = windParts.length ? windParts.join(", ") : "데이터 없음";

  const buoyParts = [];
  if (buoyData?.wave_height != null)
    buoyParts.push(`파고(${buoyData.wave_height}m)`);
  if (buoyData?.wind_dir && buoyData?.wind_speed != null)
    buoyParts.push(`풍향(${buoyData.wind_dir}), 풍속(${buoyData.wind_speed}m/s)`);
  if (buoyValEl) buoyValEl.textContent = buoyParts.length ? buoyParts.join(", ") : "데이터 없음";

  // 현지기상 필드: 병합값 (파고는 BUOY 우선)
  const waveHeight = buoyData?.wave_height ?? windData?.wave_height;
  const summaryParts = [];
  if (windData?.wind_dir && windData?.wind_speed != null)
    summaryParts.push(`풍향(${windData.wind_dir}), 풍속(${windData.wind_speed}m/s)`);
  if (waveHeight != null)
    summaryParts.push(`파고(${waveHeight}m)`);
  if (windData?.air_temp != null)
    summaryParts.push(`기온(${windData.air_temp}℃)`);

  const summary = summaryParts.join(", ");
  const weatherInput = document.getElementById("weather-summary");
  if (weatherInput) {
    weatherInput.value = summary;
    weatherInput.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

async function updateWeatherStationContext(lat, lng) {
  await ensureWeatherStationsLoaded();
  // 전체 기준 가장 가까운 지점 (카드·지도 표시용)
  latestNearestWeatherStation = findNearestWeatherStation(lat, lng);
  // 풍향·풍속: AWS/ASOS 중 최근접, 파고: BUOY 중 최근접
  const windStation = findNearestWeatherStation(lat, lng, ["AWS", "ASOS"]);
  const buoyStation = findNearestWeatherStation(lat, lng, ["BUOY"]);
  renderWeatherStations();
  renderNearestWeatherStationResult();
  fetchAndFillWeather(windStation, buoyStation);
}

function renderNearestWeatherStationResult() {
  // 요약 헤더(summary)에는 전체 최근접 지점 표시
  const nameEl = document.getElementById("result-weather-station-name");
  const distEl = document.getElementById("result-weather-station-dist");
  const s = latestNearestWeatherStation;
  if (nameEl) nameEl.textContent = s ? s.name : "-";
  if (distEl) distEl.textContent = s ? formatDistanceNm(s.distance_nm) : "-";
}

async function fetchKcgStations() {
  const response = await fetch(KCG_STATION_API_URL, { cache: "no-store" });
  if (!response.ok) throw new Error(`해경파출소 API 오류: ${response.status}`);
  const data = await response.json();
  return data.stations || [];
}

function findNearestKcgStation(lat, lng, stations) {
  if (!stations || !stations.length) return null;
  let nearest = null;
  let minDist = Infinity;
  for (const s of stations) {
    const d = haversineNm(lat, lng, s.lat, s.lng);
    if (d < minDist) {
      minDist = d;
      nearest = { ...s, distance_nm: d };
    }
  }
  return nearest;
}

function renderKcgStations(stations, nearestPachulso, nearestBranch) {
  kcgStationSource.clear();
  const nearestIds = new Set([nearestPachulso?.id, nearestBranch?.id].filter(Boolean));
  stations.forEach((s) => {
    const feature = new ol.Feature({
      geometry: new ol.geom.Point(ol.proj.fromLonLat([s.lng, s.lat])),
      name: s.name,
      isNearest: nearestIds.has(s.id),
    });
    kcgStationSource.addFeature(feature);
  });
}

function renderNearestKcgStationResult() {
  // 파출소
  const el     = document.getElementById("result-kcg-station");
  const elDist = document.getElementById("result-kcg-station-distance");
  if (el) {
    el.textContent     = latestNearestKcgStation ? latestNearestKcgStation.name : "-";
    if (elDist) elDist.textContent = latestNearestKcgStation ? formatDistanceNm(latestNearestKcgStation.distance_nm) : "-";
  }
  // 출장소
  const elB     = document.getElementById("result-kcg-branch");
  const elBDist = document.getElementById("result-kcg-branch-distance");
  if (elB) {
    elB.textContent     = latestNearestKcgBranch ? latestNearestKcgBranch.name : "-";
    if (elBDist) elBDist.textContent = latestNearestKcgBranch ? formatDistanceNm(latestNearestKcgBranch.distance_nm) : "-";
  }

  // 카드 UI
  const nameEl = document.getElementById("preview-nearest-kcg-station-name");
  const distEl = document.getElementById("preview-nearest-kcg-station-dist");
  const bodyEl = document.getElementById("preview-nearest-kcg-station");
  if (nameEl) nameEl.textContent = latestNearestKcgStation?.name || "-";
  if (distEl) distEl.textContent = latestNearestKcgStation ? formatDistanceNm(latestNearestKcgStation.distance_nm) : "-";

  const branchNameEl = document.getElementById("preview-nearest-kcg-branch-name");
  const branchDistEl = document.getElementById("preview-nearest-kcg-branch-dist");
  if (branchNameEl) branchNameEl.textContent = latestNearestKcgBranch?.name || "-";
  if (branchDistEl) branchDistEl.textContent = latestNearestKcgBranch ? formatDistanceNm(latestNearestKcgBranch.distance_nm) : "-";
}

function getDisplayDistance(result) {
  return result.coastline_distance_nm ?? result.distance_nm;
}

function buildIslandSummary(result) {
  const dist = getDisplayDistance(result);
  const directionText = result.direction || "";
  return `${result.island.name} ${directionText} ${formatDistanceForLineLabel(dist)}`.trim();
}

function renderNearestResult(result) {
  const dist = getDisplayDistance(result);
  const hasCoastline = result.coastline_distance_nm != null;
  resultSummary.textContent = buildIslandSummary(result);
  resultIsland.textContent = `${result.island.name} (${result.island.island_type || "유형 미상"})`;
  resultDirection.textContent = result.direction || "동일 지점";
  resultDistance.textContent = `${formatNumber(dist, dist < 1 ? 2 : 1)} 해리`;
  resultLocation.textContent = result.island.location || "위치 정보 없음";
  resultOverlay.classList.add("hidden");
}

function drawMapFeatures(lat, lng, nearestResult) {
  userSource.clear();
  islandSource.clear();
  lineSource.clear();
  routeLabelSource.clear();

  const userCoordinate = ol.proj.fromLonLat([lng, lat]);
  const island = nearestResult.island;

  // 해안선 좌표가 있으면 해안선 최근접점을, 없으면 섬 중심점을 선 끝으로 사용
  const cp = nearestResult.coastline_point;
  const lineEndpoint = cp
    ? ol.proj.fromLonLat([cp.lng, cp.lat])
    : ol.proj.fromLonLat([island.lng, island.lat]);
  const islandCenterCoordinate = ol.proj.fromLonLat([island.lng, island.lat]);

  userSource.addFeature(new ol.Feature(new ol.geom.Point(userCoordinate)));

  // 섬 이름 라벨은 항상 중심점에 표시
  const islandFeature = new ol.Feature(new ol.geom.Point(islandCenterCoordinate));
  islandFeature.setStyle(
    new ol.style.Style({
      image: new ol.style.Circle({
        radius: 8,
        fill: new ol.style.Fill({ color: "#e6b655" }),
        stroke: new ol.style.Stroke({ color: "#fff6d5", width: 2 }),
      }),
      text: new ol.style.Text({
        text: island.name,
        offsetY: -18,
        font: "600 13px Pretendard, sans-serif",
        fill: new ol.style.Fill({ color: "#203544" }),
        backgroundFill: new ol.style.Fill({ color: "rgba(255,255,255,0.88)" }),
        padding: [3, 6, 3, 6],
      }),
    }),
  );
  islandSource.addFeature(islandFeature);

  // 해안선 최근접점에 별도 마커 표시
  if (cp) {
    const coastDotFeature = new ol.Feature(new ol.geom.Point(lineEndpoint));
    coastDotFeature.setStyle(
      new ol.style.Style({
        image: new ol.style.Circle({
          radius: 5,
          fill: new ol.style.Fill({ color: "#1db6a4" }),
          stroke: new ol.style.Stroke({ color: "#ffffff", width: 1.5 }),
        }),
      }),
    );
    islandSource.addFeature(coastDotFeature);
  }

  lineSource.addFeature(
    new ol.Feature(new ol.geom.LineString([userCoordinate, lineEndpoint])),
  );

  // 거리 라벨은 지도 선 위에 표시하지 않고 해경 카드 아래 별도 표시
}

function buildNearestIslandLineLabel(result) {
  if (!result?.island?.name) {
    return "";
  }

  return buildIslandSummary(result);
}

function formatDistanceForLineLabel(value) {
  if (!Number.isFinite(value)) {
    return "-";
  }

  return `${formatNumber(value, value < 1 ? 2 : 1)}NM`;
}

function centerOnSearchPoint(lat, lng) {
  map.getView().animate({
    center: ol.proj.fromLonLat([lng, lat]),
    zoom: SEARCH_RESULT_ZOOM,
    duration: 500,
  });
}

function fitAllFacilities(lat, lng) {
  const points = [[lng, lat]];

  if (latestNearestFireStation) points.push([latestNearestFireStation.lng, latestNearestFireStation.lat]);
  if (latestNearestHealthCenter) points.push([latestNearestHealthCenter.lng, latestNearestHealthCenter.lat]);
  if (latestNearestHospital) points.push([latestNearestHospital.lng, latestNearestHospital.lat]);
  if (latestNearestKcgStation) points.push([latestNearestKcgStation.lng, latestNearestKcgStation.lat]);

  if (points.length < 2) {
    centerOnSearchPoint(lat, lng);
    return;
  }

  const coords = points.map((p) => ol.proj.fromLonLat(p));
  const xs = coords.map((c) => c[0]);
  const ys = coords.map((c) => c[1]);
  const extent = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];

  map.getView().fit(extent, {
    padding: [60, 60, 60, 60],
    duration: 600,
    maxZoom: 12,
  });
}

function updateReportPreview() {
  if (!latestNearestResult) {
    reportPreviewOverlay.classList.add("hidden");
    if (emergencyCardsOverlay) emergencyCardsOverlay.classList.add("hidden");
    const islandDistCardHide = document.getElementById("island-dist-card");
    if (islandDistCardHide) islandDistCardHide.classList.add("hidden");
    return;
  }

  reportPreviewOverlay.classList.remove("hidden");
  if (emergencyCardsOverlay) emergencyCardsOverlay.classList.remove("hidden");

  const islandDistEl = document.getElementById("island-dist-value");
  const islandDistCard = document.getElementById("island-dist-card");
  if (islandDistEl && islandDistCard) {
    const r = latestNearestResult;
    const dist = getDisplayDistance(r);
    const name = r.island?.name || "";
    const dir = r.direction || "";
    islandDistEl.textContent = `${name}${dir ? " " + dir : ""} ${formatDistanceForLineLabel(dist)}`;
    islandDistCard.classList.remove("hidden");
  }

  const vesselName = readValue(vesselNameInput, "선박명 미입력");
  const vesselType = readValue(vesselTypeInput, "선종 미입력");
  const accidentType = accidentTypeInput.value || "사고유형 미입력";
  const grossTonnage = readValue(grossTonnageInput, "-");
  const vesselNumber = readValue(vesselNumberInput, "-");
  const registryPort = readValue(registryPortInput, "-");
  const nationality = readValue(nationalityInput, "-");
  const ownerName = readValue(ownerNameInput, "-");
  const inspectionAgency = readValue(inspectionAgencyInput, "-");
  const insuranceStatus = readValue(insuranceStatusInput, "-");
  const reportCenter = readValue(reportCenterInput, "-");
  const weatherSummary = readValue(weatherSummaryInput, "-");
  const humanDamage = readValue(humanDamageInput, "없음");
  const pollutionDamage = readValue(pollutionDamageInput, "없음");
  const shipDamage = readValue(shipDamageInput, "없음");
  const delayTime = readValue(delayTimeInput, "-");
  const suspectedCause = readValue(suspectedCauseInput, "-");

  const crewCount = parseNumberOrZero(crewCountInput.value);
  const passengerCount = parseNumberOrZero(passengerCountInput.value);
  const vehicleCount = parseNumberOrZero(vehicleCountInput.value);
  const onboardSummary = buildOnboardSummary(crewCount, passengerCount);
  const loadSummary = buildLoadSummary(vehicleCount, cargoWeightInput.value);
  const transportSummary = buildTransportSummary(onboardSummary, loadSummary);

  reportTitle.textContent = `[${vesselName} ${accidentType}] 사고 보고`;
  previewReportDatetime.textContent = formatReportDatetime(reportDatetimeInput.value);
  previewReportCenter.textContent = reportCenter;
  previewAccidentSummary.textContent = buildAccidentSummary(transportSummary, accidentType);
  const previewDetails = document.getElementById("preview-accident-details");
  if (previewDetails) {
    const noteVal = accidentNoteInput.value || "-";
    previewDetails.innerHTML = noteVal.split("\n").map(l => escapeHtml(l)).join("<br>");
  }
  previewWeather.textContent = weatherSummary;

  previewVesselName.textContent = vesselName;
  previewGrossTonnage.textContent = grossTonnage;
  previewVesselType.textContent = vesselType;
  previewVesselNumber.textContent = vesselNumber;
  previewCargoType.textContent = loadSummary;
  previewRegistryPort.textContent = registryPort;
  previewPersonsOnboard.textContent = onboardSummary;
  previewNationality.textContent = nationality;
  previewInspectionAgency.textContent = inspectionAgency;
  previewOwnerName.textContent = ownerName;
  previewInsuranceStatus.textContent = insuranceStatus;
  previewAccidentType.textContent = accidentType;
  previewHumanDamage.textContent = humanDamage;
  previewPollutionDamage.textContent = pollutionDamage;
  previewShipDamage.textContent = shipDamage;
  previewDelayTime.textContent = delayTime;
  previewSuspectedCause.textContent = suspectedCause;
  // 소방서 카드
  const fsPhone = document.getElementById("preview-nearest-fire-station-phone");
  const fsAddr  = document.getElementById("preview-nearest-fire-station-addr");
  if (latestNearestFireStation) {
    if (previewNearestFireStationName) previewNearestFireStationName.textContent = latestNearestFireStation.name || "-";
    if (previewNearestFireStationDist) previewNearestFireStationDist.textContent = formatDistanceNm(latestNearestFireStation.distance_nm);
    if (fsPhone) fsPhone.textContent = latestNearestFireStation.phone || "-";
    if (fsAddr)  fsAddr.textContent  = getFireStationAddress(latestNearestFireStation) || "-";
  } else {
    if (previewNearestFireStationName) previewNearestFireStationName.textContent = "없음";
    if (previewNearestFireStationDist) previewNearestFireStationDist.textContent = "-";
    if (fsPhone) fsPhone.textContent = "-";
    if (fsAddr)  fsAddr.textContent  = "-";
  }

  // 보건소 카드
  const hcPhone = document.getElementById("preview-nearest-health-center-phone");
  const hcAddr  = document.getElementById("preview-nearest-health-center-addr");
  if (latestNearestHealthCenter) {
    if (previewNearestHealthCenterName) previewNearestHealthCenterName.textContent = latestNearestHealthCenter.name || "-";
    if (previewNearestHealthCenterDist) previewNearestHealthCenterDist.textContent = formatDistanceNm(latestNearestHealthCenter.distance_nm);
    if (hcPhone) hcPhone.textContent = latestNearestHealthCenter.phone || "-";
    if (hcAddr)  hcAddr.textContent  = latestNearestHealthCenter.address || "-";
  } else {
    if (previewNearestHealthCenterName) previewNearestHealthCenterName.textContent = "없음";
    if (previewNearestHealthCenterDist) previewNearestHealthCenterDist.textContent = "-";
    if (hcPhone) hcPhone.textContent = "-";
    if (hcAddr)  hcAddr.textContent  = "-";
  }

  // 병원 카드
  const hoPhone = document.getElementById("preview-nearest-hospital-phone");
  const hoAddr  = document.getElementById("preview-nearest-hospital-addr");
  if (latestNearestHospital) {
    if (previewNearestHospitalName) previewNearestHospitalName.textContent = latestNearestHospital.name || "-";
    if (previewNearestHospitalDist) previewNearestHospitalDist.textContent = formatDistanceNm(latestNearestHospital.distance_nm);
    if (hoPhone) hoPhone.textContent = latestNearestHospital.phone || "-";
    if (hoAddr)  hoAddr.textContent  = latestNearestHospital.address || "-";
  } else {
    if (previewNearestHospitalName) previewNearestHospitalName.textContent = "없음";
    if (previewNearestHospitalDist) previewNearestHospitalDist.textContent = "-";
    if (hoPhone) hoPhone.textContent = "-";
    if (hoAddr)  hoAddr.textContent  = "-";
  }

  // 해경 파출소 카드
  const previewNearestKcgStationName = document.getElementById("preview-nearest-kcg-station-name");
  const previewNearestKcgStationDist = document.getElementById("preview-nearest-kcg-station-dist");
  const previewNearestKcgStation = document.getElementById("preview-nearest-kcg-station");
  if (latestNearestKcgStation) {
    if (previewNearestKcgStationName) previewNearestKcgStationName.textContent = latestNearestKcgStation.name || "-";
    if (previewNearestKcgStationDist) previewNearestKcgStationDist.textContent = formatDistanceNm(latestNearestKcgStation.distance_nm);
    if (previewNearestKcgStation) previewNearestKcgStation.textContent = "연락처 미제공";
  } else {
    if (previewNearestKcgStationName) previewNearestKcgStationName.textContent = "없음";
    if (previewNearestKcgStationDist) previewNearestKcgStationDist.textContent = "-";
    if (previewNearestKcgStation) previewNearestKcgStation.textContent = "-";
  }
  // 해경 출장소 카드
  const previewNearestKcgBranchName = document.getElementById("preview-nearest-kcg-branch-name");
  const previewNearestKcgBranchDist = document.getElementById("preview-nearest-kcg-branch-dist");
  const previewNearestKcgBranch = document.getElementById("preview-nearest-kcg-branch");
  if (latestNearestKcgBranch) {
    if (previewNearestKcgBranchName) previewNearestKcgBranchName.textContent = latestNearestKcgBranch.name || "-";
    if (previewNearestKcgBranchDist) previewNearestKcgBranchDist.textContent = formatDistanceNm(latestNearestKcgBranch.distance_nm);
    if (previewNearestKcgBranch) previewNearestKcgBranch.textContent = "연락처 미제공";
  } else {
    if (previewNearestKcgBranchName) previewNearestKcgBranchName.textContent = "없음";
    if (previewNearestKcgBranchDist) previewNearestKcgBranchDist.textContent = "-";
    if (previewNearestKcgBranch) previewNearestKcgBranch.textContent = "-";
  }

  highlightMissingPreviewFields();
}

function highlightMissingPreviewFields() {
  const MISSING_WORDS = ["미입력", "미계산", "미기재", "미제공"];
  const PRESERVE_HTML_IDS = new Set(["preview-accident-details"]);
  const pattern = new RegExp(`(${MISSING_WORDS.join("|")})`, "g");
  document.querySelectorAll(".report-paper [id^='preview-']").forEach(el => {
    if (PRESERVE_HTML_IDS.has(el.id)) {
      // <br> 줄바꿈 보존: innerHTML 내 텍스트 노드만 치환
      el.innerHTML = el.innerHTML.replace(pattern, '<span class="report-missing">$1</span>');
      return;
    }
    const original = el.textContent || "";
    if (pattern.test(original)) {
      el.innerHTML = original.replace(
        new RegExp(`(${MISSING_WORDS.join("|")})`, "g"),
        '<span class="report-missing">$1</span>'
      );
    } else {
      el.innerHTML = original;
    }
  });
}

function buildAccidentSummary(transportSummary, accidentType) {
  const reportDate = formatNarrativeDate(reportDatetimeInput.value);
  const route = readValue(operationRouteInput, "항로 미입력");
  const departurePlace = readValue(departurePlaceInput, "출항지 미입력");
  const departureTime = departureTimeInput.value ? `${departureTimeInput.value}경` : "시각 미입력";
  const vesselName = readValue(vesselNameInput, "선박명 미입력");
  const vesselType = readValue(vesselTypeInput, "선종 미입력");
  const locationText = latestNearestResult ? buildIslandSummary(latestNearestResult) : "위치 미계산";
  const coordinateText = latInput.value && lngInput.value
    ? `${formatCoordinate(latInput.value)}N ${formatCoordinate(lngInput.value)}E`
    : "좌표 미입력";

  return `${route}를 운항하는 ${vesselType} ${vesselName}가 ${departureTime} ${departurePlace}에서 출항하여 ${transportSummary} 상태로 운항 중 ${locationText} (${coordinateText}) 해상에서 ${accidentType} 사고가 발생함.`;
}

function buildOnboardSummary(crewCount, passengerCount) {
  return [`승무원 ${crewCount}명`, `여객 ${passengerCount}명`].join(", ");
}

function buildLoadSummary(vehicleCount, cargoText) {
  const parts = [];

  if (vehicleCount > 0) {
    parts.push(`차량 ${vehicleCount}대`);
  }

  const cargoSummary = normalizeCargoSummary(cargoText);
  if (cargoSummary) {
    parts.push(cargoSummary);
  }

  return parts.length ? parts.join(" / ") : "없음";
}

function buildTransportSummary(onboardSummary, loadSummary) {
  if (!loadSummary || loadSummary === "없음") {
    return onboardSummary;
  }

  return `${onboardSummary}, ${loadSummary}`;
}

function normalizeCargoSummary(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  if (text.startsWith("화물")) return text;
  if (/^\d+(\.\d+)?$/.test(text)) {
    return `화물 ${text}톤`;
  }
  return `화물 ${text}`;
}

function buildReportText() {
  return [
    reportTitle.textContent,
    `기준 일시: ${previewReportDatetime.textContent}`,
    `보고 센터: ${previewReportCenter.textContent}`,
    "",
    "[사고개요]",
    previewAccidentSummary.textContent,
    `현지기상: ${previewWeather.textContent}`,
    "",
    "[선박제원]",
    `선명: ${previewVesselName.textContent}`,
    `선박번호: ${previewVesselNumber.textContent}`,
    `총톤수: ${previewGrossTonnage.textContent}`,
    `선종: ${previewVesselType.textContent}`,
    `승선 현황: ${previewPersonsOnboard.textContent}`,
    `차량/화물: ${previewCargoType.textContent}`,
    `선적항: ${previewRegistryPort.textContent}`,
    `국적: ${previewNationality.textContent}`,
    `검사기관: ${previewInspectionAgency.textContent}`,
    `소유자 또는 선박회사: ${previewOwnerName.textContent}`,
    `보험 현황: ${previewInsuranceStatus.textContent}`,
    "",
    "[피해사항]",
    `사고종류: ${previewAccidentType.textContent}`,
    `인명: ${previewHumanDamage.textContent}`,
    `오염: ${previewPollutionDamage.textContent}`,
    `선박·시설물 등: ${previewShipDamage.textContent}`,
    `지연시간: ${previewDelayTime.textContent}`,
    `사고 추정원인: ${previewSuspectedCause.textContent}`,
    `최근접 소방서: ${latestNearestFireStation ? [latestNearestFireStation.name, latestNearestFireStation.phone, getFireStationAddress(latestNearestFireStation)].filter(Boolean).join(" / ") : "-"}`,
    "",
    "[조치사항]",
    document.getElementById("preview-accident-details")?.textContent || "-",
  ].join("\n");
}

function buildSmsText() {
  const vesselName = readValue(vesselNameInput, "선박명 미입력");
  const accidentType = accidentTypeInput.value || "사고유형 미입력";
  const humanDamage = readValue(humanDamageInput, "-");
  const pollutionDamage = readValue(pollutionDamageInput, "-");
  const grossTonnage = readValue(grossTonnageInput, "-");
  const crewCount = crewCountInput.value || "0";
  const passengerCount = passengerCountInput.value || "0";
  const vehicleCount = vehicleCountInput.value || "0";
  const route = readValue(operationRouteInput, "항로 미입력");
  const departurePlace = readValue(departurePlaceInput, "출항지 미입력");
  const departureTime = departureTimeInput.value ? `${departureTimeInput.value}경` : "시각 미입력";
  const weather = readValue(weatherSummaryInput, "-");
  const note = readValue(accidentNoteInput, "");
  const locationText = latestNearestResult ? buildIslandSummary(latestNearestResult) : "위치 미계산";

  // 보고 센터에서 지역명 추출 (예: "목포운항관리센터" → "목포")
  const center = readValue(reportCenterInput, "");
  const region = center.replace(/운항관리센터.*/, "").replace(/관리센터.*/, "") || "지역";

  // 날짜 M. D. 형식
  const dtVal = reportDatetimeInput.value;
  let dateShort = "-";
  if (dtVal) {
    const d = new Date(dtVal);
    dateShort = `${d.getMonth() + 1}. ${d.getDate()}.`;
  }

  // 인명·오염피해 요약
  const noHuman = !humanDamage || humanDamage === "-" || humanDamage.includes("없음");
  const noPollution = !pollutionDamage || pollutionDamage === "-" || pollutionDamage.includes("없음");
  let damageSummary = "";
  if (noHuman && noPollution) damageSummary = "인명·오염피해 없음";
  else if (noHuman) damageSummary = `인명피해 없음, 오염 ${pollutionDamage}`;
  else damageSummary = `인명 ${humanDamage}${noPollution ? ", 오염피해 없음" : ", 오염 " + pollutionDamage}`;

  // 피해사항 줄 구성
  const shipDmg = readValue(shipDamageInput, "");
  const delayT = readValue(delayTimeInput, "");
  const dmgLines = [];
  if (!noHuman) dmgLines.push(` - 인명피해: ${humanDamage}`);
  if (!noPollution) dmgLines.push(` - 오염피해: ${pollutionDamage}`);
  if (shipDmg && shipDmg !== "-") dmgLines.push(` - 선박·시설물: ${shipDmg}`);
  if (delayT && delayT !== "-") dmgLines.push(` - 지연시간: ${delayT}`);
  if (dmgLines.length === 0) dmgLines.push(" - 피해 없음");

  // 조치사항 — 입력된 조치사항 우선, 없으면 기본 문구
  const actionLines = note
    ? note.split("\n").map(l => ` - ${l.trim()}`).filter(l => l.trim() !== "-")
    : [" - 관계기관 상황전파 및 현장 대응 중"];

  // 기상 파싱 (있으면 그대로, 없으면 "-")
  const weatherLine = weather && weather !== "-" ? weather : "-";

  return [
    `◈ (${region}) ${vesselName} ${accidentType} 사고 발생(${damageSummary}) - 1보`,
    "",
    `ㅇ (개요) ${dateShort} ${departureTime} ${departurePlace}를 출항예정인 ${vesselName}(${route}, ${grossTonnage}톤, 선원 ${crewCount}명, 여객 ${passengerCount}명, 차량 ${vehicleCount}대)가 ${departureTime} ${locationText} 해상에서 ${accidentType} 발생함`,
    "",
    "ㅇ (피해사항)",
    ...dmgLines,
    "",
    "ㅇ (조치사항)",
    ...actionLines,
    "",
    "ㅇ (현지기상)",
    `- ${weatherLine}`,
    "",
    "<KOMSA 운항상황센터>",
  ].join("\n");
}

function fillSampleReport() {
  latInput.value = SAMPLE_REPORT.lat;
  lngInput.value = SAMPLE_REPORT.lng;
  reportDatetimeInput.value = SAMPLE_REPORT.reportDatetime;
  reportCenterInput.value = SAMPLE_REPORT.reportCenter;
  operationRouteInput.value = SAMPLE_REPORT.operationRoute;
  populateDepartureSelect(SAMPLE_REPORT.operationRoute);
  departurePlaceInput.value = SAMPLE_REPORT.departurePlace;
  departureTimeInput.value = SAMPLE_REPORT.departureTime;
  weatherSummaryInput.value = SAMPLE_REPORT.weatherSummary;
  vesselNameInput.value = SAMPLE_REPORT.vesselName;
  vesselNumberInput.value = SAMPLE_REPORT.vesselNumber;
  vesselTypeInput.value = SAMPLE_REPORT.vesselType;
  grossTonnageInput.value = SAMPLE_REPORT.grossTonnage;
  registryPortInput.value = SAMPLE_REPORT.registryPort;
  nationalityInput.value = SAMPLE_REPORT.nationality;
  ownerNameInput.value = SAMPLE_REPORT.ownerName;
  inspectionAgencyInput.value = SAMPLE_REPORT.inspectionAgency;
  insuranceStatusInput.value = SAMPLE_REPORT.insuranceStatus;
  crewCountInput.value = SAMPLE_REPORT.crewCount;
  passengerCountInput.value = SAMPLE_REPORT.passengerCount;
  vehicleCountInput.value = SAMPLE_REPORT.vehicleCount;
  cargoWeightInput.value = SAMPLE_REPORT.cargoWeight;
  accidentTypeInput.value = SAMPLE_REPORT.accidentType;
  document.getElementById("accident-type-filter").value = SAMPLE_REPORT.accidentType;
  const atLbl = document.getElementById("accident-type-label");
  const atTrg = document.getElementById("accident-type-trigger");
  if (atLbl && SAMPLE_REPORT.accidentType) { atLbl.textContent = SAMPLE_REPORT.accidentType; atTrg.dataset.selected = "true"; }
  humanDamageInput.value = SAMPLE_REPORT.humanDamage;
  pollutionDamageInput.value = SAMPLE_REPORT.pollutionDamage;
  shipDamageInput.value = SAMPLE_REPORT.shipDamage;
  delayTimeInput.value = SAMPLE_REPORT.delayTime;
  suspectedCauseInput.value = SAMPLE_REPORT.suspectedCause;
  document.getElementById("suspected-cause-filter").value = SAMPLE_REPORT.suspectedCause;
  const scLbl = document.getElementById("suspected-cause-label");
  const scTrg = document.getElementById("suspected-cause-trigger");
  if (scLbl && SAMPLE_REPORT.suspectedCause) { scLbl.textContent = SAMPLE_REPORT.suspectedCause; scTrg.dataset.selected = "true"; }
  accidentNoteInput.value = SAMPLE_REPORT.accidentNote;

  syncVesselLookup({ allowSingleStatus: false });
  hideVesselNameSuggestions();
  runSearch();
  _wsBroadcast();
}

async function parseVesselDataFile(file) {
  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith(".json")) {
    return parseJsonRows(await file.text());
  }
  if (lowerName.endsWith(".csv")) {
    return parseDelimitedRows(await file.text());
  }
  if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")) {
    return parseSpreadsheetRows(await file.arrayBuffer());
  }
  throw new Error("지원하지 않는 파일 형식입니다.");
}

function parseJsonRows(text) {
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error("JSON 형식이 올바르지 않습니다.");
  }

  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.records)) return payload.records;
  if (payload && Array.isArray(payload.data)) return payload.data;

  throw new Error("JSON 안에서 선박자료 배열을 찾지 못했습니다.");
}

function parseDelimitedRows(text) {
  const normalizedText = text.replace(/^\uFEFF/, "");
  const lines = normalizedText.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (!lines.length) {
    throw new Error("CSV 데이터가 비어 있습니다.");
  }

  const delimiter = detectDelimiter(lines[0]);
  const rows = parseDelimitedMatrix(normalizedText, delimiter).filter((row) =>
    row.some((cell) => String(cell).trim() !== ""),
  );

  if (rows.length < 2) {
    throw new Error("CSV 데이터에 본문 행이 없습니다.");
  }

  const headers = rows[0].map((value, index) => {
    const header = String(value ?? "").trim();
    return header || `column_${index + 1}`;
  });

  return rows.slice(1).map((cells) => {
    const row = {};
    headers.forEach((header, index) => {
      row[header] = String(cells[index] ?? "").trim();
    });
    return row;
  });
}

function parseSpreadsheetRows(buffer) {
  if (!window.XLSX) {
    throw new Error("엑셀 파서가 준비되지 않았습니다.");
  }

  const workbook = window.XLSX.read(buffer, { type: "array" });
  const target = detectWorksheetTarget(workbook);
  if (!target) {
    throw new Error("선박명과 선박번호가 들어 있는 시트를 찾지 못했습니다.");
  }

  const worksheet = workbook.Sheets[target.sheetName];
  return window.XLSX.utils.sheet_to_json(worksheet, {
    defval: "",
    raw: false,
    range: target.headerRowIndex - 1,
  });
}

function detectWorksheetTarget(workbook) {
  let bestTarget = null;

  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const matrix = window.XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
      raw: false,
      blankrows: false,
    });

    matrix.slice(0, 20).forEach((row, index) => {
      const rowValues = row.map((cell) => normalizeHeader(cell));
      const matchedFields = new Set();

      Object.entries(VESSEL_FIELD_ALIASES).forEach(([field, aliases]) => {
        if (aliases.some((alias) => rowValues.some((value) => isAliasMatch(value, alias)))) {
          matchedFields.add(field);
        }
      });

      if (!matchedFields.has("vesselName")) return;

      const score = matchedFields.size;
      if (!bestTarget || score > bestTarget.score) {
        bestTarget = {
          sheetName,
          headerRowIndex: index + 1,
          score,
        };
      }
    });
  });

  return bestTarget;
}

function detectDelimiter(firstLine) {
  const candidates = [",", "\t", ";", "|"];
  let bestDelimiter = ",";
  let bestScore = -1;

  candidates.forEach((delimiter) => {
    const score = firstLine.split(delimiter).length;
    if (score > bestScore) {
      bestScore = score;
      bestDelimiter = delimiter;
    }
  });

  return bestDelimiter;
}

function parseDelimitedMatrix(text, delimiter) {
  const rows = [];
  let currentRow = [];
  let currentCell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === "\"") {
      if (inQuotes && nextChar === "\"") {
        currentCell += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      currentRow.push(currentCell);
      currentCell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = "";
      continue;
    }

    currentCell += char;
  }

  if (currentCell !== "" || currentRow.length) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  return rows;
}

function loadVesselDataFromRows(rows, sourceLabel, options = {}) {
  const { persist = true } = options;
  const normalizedRows = Array.isArray(rows)
    ? rows.filter((row) => row && typeof row === "object" && !Array.isArray(row))
    : [];

  if (!normalizedRows.length) {
    throw new Error("선박자료 행을 찾지 못했습니다.");
  }

  const columnMap = detectVesselColumnMap(normalizedRows);
  if (!columnMap.vesselName) {
    throw new Error("선박명 또는 선명 컬럼을 찾지 못했습니다.");
  }

  const records = normalizedRows
    .map((row, index) => mapVesselRow(row, columnMap, index))
    .filter((record) => isMeaningfulVesselName(record.vesselName));

  if (!records.length) {
    throw new Error("유효한 선박명 데이터가 없습니다.");
  }

  uploadedVesselRecords = records;
  currentVesselMatches = [];
  activeVesselRecordId = null;

  renderVesselNameSuggestions(vesselNameInput.value);
  hideVesselNumberPicker();
  updateVesselDataStatus(buildVesselDataSummary(sourceLabel, records.length, columnMap));
  syncVesselLookup({ allowSingleStatus: false });

  if (persist) {
    saveVesselDataToStorage(records, sourceLabel);
  }
}

function detectVesselColumnMap(rows) {
  const columns = [];
  const seen = new Set();

  rows.slice(0, 30).forEach((row) => {
    Object.keys(row).forEach((column) => {
      if (!seen.has(column)) {
        seen.add(column);
        columns.push(column);
      }
    });
  });

  const normalizedColumns = columns.map((column) => ({
    original: column,
    normalized: normalizeHeader(column),
  }));

  return Object.fromEntries(
    Object.entries(VESSEL_FIELD_ALIASES).map(([field, aliases]) => [
      field,
      findMatchingColumn(normalizedColumns, aliases),
    ]),
  );
}

function findMatchingColumn(normalizedColumns, aliases) {
  for (const alias of aliases) {
    const normalizedAlias = normalizeHeader(alias);
    const exactMatch = normalizedColumns.find((column) => column.normalized === normalizedAlias);
    if (exactMatch) {
      return exactMatch.original;
    }
  }

  for (const alias of aliases) {
    const normalizedAlias = normalizeHeader(alias);
    const looseMatch = normalizedColumns.find((column) => isAliasMatch(column.normalized, normalizedAlias));
    if (looseMatch) {
      return looseMatch.original;
    }
  }

  return "";
}

function mapVesselRow(row, columnMap, index) {
  const mapped = {
    id: "",
    sourceRowNumber: index + 2,
    routeName: "",
  };

  Object.keys(VESSEL_FIELD_ALIASES).forEach((field) => {
    mapped[field] = normalizeCellValue(row[columnMap[field]]);
  });

  mapped.vesselName = mapped.vesselName.trim();
  mapped.vesselNumber = mapped.vesselNumber.trim();
  mapped.vesselNameNormalized = normalizeText(mapped.vesselName);
  mapped.vesselNumberNormalized = normalizeText(mapped.vesselNumber);

  if (!mapped.registryPort) {
    mapped.registryPort = extractRegistryPort(row, columnMap);
  }

  if (!mapped.nationality) {
    mapped.nationality = "";
  }

  mapped.id = `${mapped.vesselNameNormalized || "row"}::${mapped.vesselNumberNormalized || index}`;
  return mapped;
}

function extractRegistryPort(row, columnMap) {
  const berthColumn = columnMap.registryPort || "";
  const routeColumn = columnMap.routeName || "";
  const berthText = normalizeCellValue(row[berthColumn]);
  if (berthText) {
    return firstToken(berthText);
  }

  const routeText = normalizeCellValue(row[routeColumn]);
  if (routeText) {
    return firstToken(routeText);
  }

  return "";
}

function firstToken(text) {
  const value = String(text || "").trim();
  if (!value) return "";

  for (const divider of [",", "/", "·"]) {
    if (value.includes(divider)) {
      return value.split(divider)[0].trim();
    }
  }

  return value;
}

function normalizeCellValue(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "number" && Number.isFinite(value)) {
    return Number.isInteger(value) ? String(value) : String(value);
  }
  return String(value).trim();
}

function normalizeHeader(value) {
  return normalizeText(value);
}

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^0-9a-zA-Z가-힣]/g, "");
}

function isAliasMatch(value, alias) {
  return value === alias || value.includes(alias) || alias.includes(value);
}

function isMeaningfulVesselName(value) {
  const text = String(value ?? "").trim();
  if (!text) return false;
  const normalized = normalizeText(text);
  return !["ref", "nan", "null", "none", "undefined"].includes(normalized);
}

function getUniqueVesselNames(records = uploadedVesselRecords) {
  const grouped = new Map();

  records.forEach((record) => {
    if (!grouped.has(record.vesselNameNormalized)) {
      grouped.set(record.vesselNameNormalized, {
        name: record.vesselName,
        count: 0,
      });
    }
    grouped.get(record.vesselNameNormalized).count += 1;
  });

  return Array.from(grouped.values()).sort((left, right) =>
    left.name.localeCompare(right.name, "ko"),
  );
}

function renderVesselNameSuggestions(query) {
  const normalizedQuery = normalizeText(query);
  vesselNameSuggestionBox.textContent = "";

  // ── 운항 중 선박 (API) ──
  const liveMatches = normalizedQuery
    ? _liveVesselItems.filter(it => normalizeText(it.label).includes(normalizedQuery))
    : _liveVesselItems;
  liveMatches.slice(0, 15).forEach(it => {
    const v = liveVesselDataMap.get(it.key);
    const updateTime = v && v.lastUpdateDt ? v.lastUpdateDt.slice(11, 16) : "";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "suggestion-item suggestion-live";
    btn.innerHTML = `<strong>${escapeHtml(v.psnshp_nm)}</strong><span>${escapeHtml(v.lcns_seawy_nm)}${v.nvg_seawy_nm ? " · " + escapeHtml(v.nvg_seawy_nm) : ""} | ${sailTmToTime(v.sail_tm)} 출항${updateTime ? " · 최종 " + updateTime : ""}</span>`;
    btn.addEventListener("click", async () => {
      vesselNameInput.value = v.psnshp_nm;
      hideVesselNameSuggestions();
      syncVesselLookup();
      await onLiveVesselSelect(it.key);
    });
    vesselNameSuggestionBox.appendChild(btn);
  });

  // ── 로컬 선박 데이터 ──
  if (normalizedQuery && uploadedVesselRecords.length) {
    const localSuggestions = getUniqueVesselNames()
      .filter((item) => normalizeText(item.name).includes(normalizedQuery))
      .sort((left, right) => {
        const leftKey = normalizeText(left.name);
        const rightKey = normalizeText(right.name);
        const leftStarts = leftKey.startsWith(normalizedQuery) ? 0 : 1;
        const rightStarts = rightKey.startsWith(normalizedQuery) ? 0 : 1;
        if (leftStarts !== rightStarts) return leftStarts - rightStarts;
        return left.name.localeCompare(right.name, "ko");
      })
      .slice(0, MAX_VESSEL_SUGGESTIONS);
    localSuggestions.forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "suggestion-item";
      button.innerHTML = `<strong>${escapeHtml(item.name)}</strong><span>${item.count > 1 ? `제원 ${item.count}건` : "제원 1건"}</span>`;
      button.addEventListener("click", () => {
        vesselNameInput.value = item.name;
        hideVesselNameSuggestions();
        syncVesselLookup();
      });
      vesselNameSuggestionBox.appendChild(button);
    });
  }

  if (vesselNameSuggestionBox.children.length === 0) {
    hideVesselNameSuggestions();
    return;
  }
  vesselNameSuggestionBox.classList.remove("hidden");
}

function hideVesselNameSuggestions() {
  vesselNameSuggestionBox.classList.add("hidden");
  vesselNameSuggestionBox.textContent = "";
}

function buildVesselDataSummary(sourceLabel, recordCount, columnMap) {
  const fields = Object.entries(columnMap)
    .filter(([, column]) => column)
    .map(([field]) => VESSEL_FIELD_LABELS[field])
    .filter(Boolean);

  return `${sourceLabel}: ${recordCount}건 저장됨. 인식 컬럼 - ${fields.join(", ")}`;
}

function syncVesselLookup(options = {}) {
  const { allowSingleStatus = true } = options;

  if (!uploadedVesselRecords.length) {
    hideVesselNumberPicker();
    currentVesselMatches = [];
    activeVesselRecordId = null;
    return;
  }

  const vesselNameKey = normalizeText(vesselNameInput.value);
  if (!vesselNameKey) {
    hideVesselNumberPicker();
    currentVesselMatches = [];
    activeVesselRecordId = null;
    return;
  }

  let matches = uploadedVesselRecords.filter((record) => record.vesselNameNormalized === vesselNameKey);

  // '호' 접미사 차이로 매칭 실패 시 유연 재시도
  if (!matches.length) {
    const altKey = vesselNameKey.endsWith("호")
      ? vesselNameKey.slice(0, -1)      // 섬사랑9호 → 섬사랑9
      : vesselNameKey + "호";            // 섬사랑9 → 섬사랑9호
    matches = uploadedVesselRecords.filter((record) => record.vesselNameNormalized === altKey);
  }

  currentVesselMatches = matches;

  if (!matches.length) {
    hideVesselNumberPicker();
    activeVesselRecordId = null;
    return;
  }

  if (matches.length === 1) {
    hideVesselNumberPicker();
    applyVesselRecord(matches[0]);
    if (allowSingleStatus) {
      setStatus(`${matches[0].vesselName} 제원을 자동으로 불러왔습니다.`);
    }
    return;
  }

  renderVesselNumberPicker(matches);
  const vesselNumberKey = normalizeText(vesselNumberInput.value);
  if (vesselNumberKey) {
    const exactNumberMatch = matches.find((record) => record.vesselNumberNormalized === vesselNumberKey);
    if (exactNumberMatch) {
      vesselNumberPicker.value = exactNumberMatch.id;
      applyVesselRecord(exactNumberMatch);
      return;
    }
  }

  activeVesselRecordId = null;
  setStatus(`동일한 선박명 ${matches.length}건이 있습니다. 선박번호를 선택해 주세요.`);
}

function renderVesselNumberPicker(matches) {
  vesselNumberPicker.textContent = "";

  const placeholderOption = document.createElement("option");
  placeholderOption.value = "";
  placeholderOption.textContent = "선박번호를 선택하세요";
  vesselNumberPicker.appendChild(placeholderOption);

  matches.forEach((record) => {
    const option = document.createElement("option");
    option.value = record.id;
    option.textContent = buildVesselMatchLabel(record);
    vesselNumberPicker.appendChild(option);
  });

  const selected = matches.find((record) => record.id === activeVesselRecordId);
  vesselNumberPicker.value = selected ? selected.id : "";
  vesselNumberPickerGroup.classList.remove("hidden");
}

function hideVesselNumberPicker() {
  vesselNumberPickerGroup.classList.add("hidden");
  vesselNumberPicker.textContent = "";

  const placeholderOption = document.createElement("option");
  placeholderOption.value = "";
  placeholderOption.textContent = "선박번호를 선택하세요";
  vesselNumberPicker.appendChild(placeholderOption);
}

function buildVesselMatchLabel(record) {
  const parts = [record.vesselNumber || `자료 ${record.sourceRowNumber}행`];
  if (record.routeName) parts.push(record.routeName);
  if (record.ownerName) parts.push(record.ownerName);
  return parts.join(" / ");
}

function applyVesselRecord(record) {
  activeVesselRecordId = record.id;

  Object.entries(VESSEL_INPUTS).forEach(([field, input]) => {
    input.value = record[field] || "";
  });

  nationalityInput.value = "대한민국";

  if (record.routeName) {
    const currentRoute = operationRouteInput.value.trim();
    if (!currentRoute || currentRoute === lastAutoRouteValue) {
      operationRouteInput.value = record.routeName;
      lastAutoRouteValue = record.routeName;
    }
  }

  if (currentVesselMatches.length > 1) {
    vesselNumberPicker.value = record.id;
  }

  updateReportPreview();
}

function saveVesselDataToStorage(records, sourceLabel) {
  try {
    localStorage.setItem(
      VESSEL_STORAGE_KEY,
      JSON.stringify({
        sourceLabel,
        savedAt: new Date().toISOString(),
        records,
      }),
    );
  } catch (error) {
    console.error(error);
  }
}

function restoreStoredVesselData() {
  try {
    const raw = localStorage.getItem(VESSEL_STORAGE_KEY);
    if (!raw) return false;

    const payload = JSON.parse(raw);
    if (!payload || !Array.isArray(payload.records) || !payload.records.length) {
      return false;
    }

    loadVesselDataFromRows(payload.records, payload.sourceLabel || "저장된 선박자료", {
      persist: false,
    });
    setStatus("저장된 선박자료를 불러왔습니다.");
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

async function loadBundledVesselData() {
  try {
    const response = await fetch(BUNDLED_VESSEL_DATA_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    const rows = Array.isArray(payload) ? payload : payload.records || payload.data || [];
    const sourceLabel = payload.sheetName
      ? `기본 선박자료(${payload.sheetName})`
      : "기본 선박자료";

    loadVesselDataFromRows(rows, sourceLabel);
    setStatus("기본 선박자료를 불러왔습니다.");
  } catch (error) {
    console.error(error);
    updateVesselDataStatus("기본 선박자료를 불러오지 못했습니다. 파일 업로드로 직접 등록해 주세요.");
  }
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function readValue(input, fallback) {
  return input.value.trim() || fallback;
}

function parseNumberOrZero(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCoordinate(value) {
  return Number(value).toFixed(6);
}

function formatNumber(value, digits) {
  return Number(value).toFixed(digits);
}

function formatReportDatetime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatNarrativeDate(value) {
  if (!value) return "기준일시 미입력";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}. ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function updateQueryString(lat, lng) {
  const url = new URL(window.location.href);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lng", String(lng));
  history.replaceState({}, "", url);
}

function updateVesselDataStatus(message) {
  vesselDataStatus.textContent = message;
}

function setStatus(message) {
  if (statusBar) statusBar.textContent = message;
}

function setDefaultReportValues() {
  if (!reportDatetimeInput.value) {
    const now = new Date();
    reportDatetimeInput.value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }
  if (!reportCenterInput.value) {
    reportCenterInput.value = "목포운항관리센터";
  }
  nationalityInput.value = "대한민국";
}

function initializeFromQuery() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("demo") === "1") {
    fillSampleReport();
    return;
  }

  const lat = params.get("lat");
  const lng = params.get("lng");
  if (lat && lng) {
    latInput.value = lat;
    lngInput.value = lng;
    runSearch();
  }
}

// ── 항로/기항지 드롭다운 ────────────────────────────────────────────
const ROUTE_SNAPSHOT_URL =
  "https://fnpsaypaxpxyyqmrqwai.supabase.co/storage/v1/object/public/snapshots/route-stopover/latest.json";

// routeName → forwardStops[] 맵
let routeStopsMap = new Map();

function normalizeApiList(item) {
  if (!item) return [];
  return Array.isArray(item) ? item : [item];
}

function buildRouteStopsMap(routeLineItems) {
  const grouped = new Map();
  for (const row of routeLineItems) {
    const lc = (row.lcns_seawy_cd || "").trim();
    const nv = (row.nvg_seawy_cd || "").trim();
    const key = `${lc}||${nv}`;
    if (!lc && !nv) continue;
    if (!grouped.has(key)) {
      // nvg_seawy_nm이 있으면 우선 사용, 없으면 lcns_seawy_nm
      const nvgNm = (row.nvg_seawy_nm || "").trim();
      const lcnNm = (row.lcns_seawy_nm || "").trim();
      const displayName = nvgNm
        ? `${lcnNm} (${nvgNm})`
        : lcnNm;
      grouped.set(key, { name: displayName, rows: [] });
    }
    grouped.get(key).rows.push(row);
  }

  const result = new Map();
  grouped.forEach(({ name, rows }) => {
    if (!name) return;
    rows.sort((a, b) => Number(a.portcl_sn || 0) - Number(b.portcl_sn || 0));
    const fwdRows = rows.filter((r) => /^[Yy1]$/.test((r.fwd_stp_yn || "").trim()));
    const stops = (fwdRows.length > 0 ? fwdRows : rows)
      .map((r) => (r.portcl_nm || "").trim())
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i);
    if (stops.length > 0) {
      // 동일 표시명 충돌 시 번호 부여
      let finalName = name;
      let idx = 2;
      while (result.has(finalName)) finalName = `${name} #${idx++}`;
      result.set(finalName, stops);
    }
  });
  return result;
}

const routeSuggestionBox = document.getElementById("route-suggestion-box");

function populateDepartureSelect(routeName) {
  const stops = routeStopsMap.get(routeName) || [];
  departureSuggestion.setOptions(stops);
  departurePlaceFilterInput.value = "";
  departurePlaceInput.value = "";
  departurePlaceFilterInput.placeholder = stops.length > 0 ? "출항지 검색..." : "항로 선택 후 표시";
  departurePlaceFilterInput.disabled = stops.length === 0;
}

function showRouteSuggestions(query) {
  const q = query.trim();
  const allNames = Array.from(routeStopsMap.keys()).sort((a, b) => a.localeCompare(b, "ko"));
  const matches = q
    ? allNames.filter((n) => n.includes(q))
    : allNames;

  if (matches.length === 0) {
    routeSuggestionBox.classList.add("hidden");
    return;
  }

  routeSuggestionBox.innerHTML = matches.slice(0, 20).map((n) => `
    <button type="button" class="suggestion-item" data-route="${n}">
      <strong>${n}</strong>
    </button>
  `).join("");

  routeSuggestionBox.querySelectorAll(".suggestion-item").forEach((btn) => {
    btn.addEventListener("mousedown", (e) => {
      e.preventDefault();
      const name = btn.dataset.route;
      operationRouteInput.value = name;
      routeSuggestionBox.classList.add("hidden");
      populateDepartureSelect(name);
    });
  });

  routeSuggestionBox.classList.remove("hidden");
}

operationRouteInput.addEventListener("input", () => {
  showRouteSuggestions(operationRouteInput.value);
});

operationRouteInput.addEventListener("focus", () => {
  if (routeStopsMap.size > 0) showRouteSuggestions(operationRouteInput.value);
});

operationRouteInput.addEventListener("blur", () => {
  setTimeout(() => routeSuggestionBox.classList.add("hidden"), 150);
  // 직접 입력한 항로명으로도 출항지 목록 채우기
  const name = operationRouteInput.value.trim();
  if (name) populateDepartureSelect(name);
});

// 항로 좌표 경로 데이터 (koast_routes.json)
let koastRoutes = {};

async function fetchRouteData() {
  try {
    const [snapshotRes, routesRes] = await Promise.all([
      fetch(ROUTE_SNAPSHOT_URL),
      fetch("data/koast_routes.json"),
    ]);
    if (snapshotRes.ok) {
      const json = await snapshotRes.json();
      const routeLinePayload = json.routeLine || json;
      const root = routeLinePayload?.response || routeLinePayload;
      const items = normalizeApiList(root?.body?.items?.item);
      if (items.length > 0) {
        routeStopsMap = buildRouteStopsMap(items);
        operationRouteInput.placeholder = `항로명 검색... (${routeStopsMap.size}개)`;
      }
    }
    if (routesRes.ok) {
      koastRoutes = await routesRes.json();
    }
  } catch (e) {
    operationRouteInput.placeholder = "항로 불러오기 실패";
    console.warn("항로 데이터 fetch 실패:", e);
  }
}

// lcns_seawy_cd + nvg_seawy_cd로 koastRoutes에서 항로 경로 찾기
// koast_routes.json 키 형식: "F02-01-1" (면허코드-세부코드-방향)
// nvg_drc_cd: 1=정방향, 2=역방향 (없으면 정방향 우선)
function findKoastRoute(lcns_seawy_cd, nvg_seawy_cd, nvg_drc_cd) {
  const total = Object.keys(koastRoutes).length;
  console.log("[findKoastRoute] koastRoutes 키수:", total, "| 입력:", lcns_seawy_cd, nvg_seawy_cd, nvg_drc_cd);
  if (!lcns_seawy_cd || total === 0) return null;

  const lcd = String(lcns_seawy_cd).trim();
  const ncd = nvg_seawy_cd ? String(nvg_seawy_cd).padStart(2, "0") : null;
  const dir = nvg_drc_cd ? String(nvg_drc_cd) : "1";

  if (ncd) {
    // 정확한 세부항로 + 방향
    const key1 = `${lcd}-${ncd}-${dir}`;
    if (koastRoutes[key1]) return koastRoutes[key1];
    // 반대 방향 폴백
    const key2 = `${lcd}-${ncd}-${dir === "1" ? "2" : "1"}`;
    if (koastRoutes[key2]) return koastRoutes[key2];
    // 세부항로 코드가 있는데 CSV에 없으면 null → orderedStops 직선 폴백으로 위임
    return null;
  }

  // 세부항로 코드 없을 때만 면허코드 하위 정방향 중 첫 번째 사용
  const fallback = Object.keys(koastRoutes)
    .filter(k => k.startsWith(`${lcd}-`) && k.endsWith("-1"))
    .sort()[0];
  return fallback ? koastRoutes[fallback] : null;
}

fetchRouteData();


// ── 필터링 제안박스 공통 헬퍼 ────────────────────────────────────────
function setupSuggestion(filterInputEl, boxEl, hiddenInputEl, getOptions) {
  // getOptions() → string[] (동적 옵션 지원)
  function render(query) {
    const opts = getOptions();
    const q = (query || "").trim();
    const matches = q ? opts.filter(o => o.includes(q)) : opts;
    if (matches.length === 0) { boxEl.classList.add("hidden"); return; }
    boxEl.innerHTML = matches.slice(0, 40).map(o =>
      `<button type="button" class="suggestion-item">${o}</button>`
    ).join("");
    boxEl.querySelectorAll(".suggestion-item").forEach(btn => {
      btn.addEventListener("mousedown", e => {
        e.preventDefault();
        filterInputEl.value = btn.textContent;
        if (hiddenInputEl) {
          hiddenInputEl.value = btn.textContent;
          hiddenInputEl.dispatchEvent(new Event("input", { bubbles: true }));
          hiddenInputEl.dispatchEvent(new Event("change", { bubbles: true }));
        }
        filterInputEl.dispatchEvent(new Event("change", { bubbles: true }));
        boxEl.classList.add("hidden");
      });
    });
    boxEl.classList.remove("hidden");
  }
  filterInputEl.addEventListener("input", () => {
    render(filterInputEl.value);
    // 직접 입력 시 즉시 hidden input에도 반영 (목록 선택 안 해도 됨)
    if (hiddenInputEl) {
      hiddenInputEl.value = filterInputEl.value.trim();
      hiddenInputEl.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
  filterInputEl.addEventListener("focus", () => render(filterInputEl.value));
  filterInputEl.addEventListener("blur", () => setTimeout(() => boxEl.classList.add("hidden"), 150));
  return { refresh: () => render(filterInputEl.value) };
}

// 출항지 suggestion
const departurePlaceFilterInput = document.getElementById("departure-place-filter");
const departurePlaceBox         = document.getElementById("departure-place-box");
let   _departureOptions = [];
const departureSuggestion = setupSuggestion(
  departurePlaceFilterInput, departurePlaceBox, departurePlaceInput,
  () => _departureOptions
);
departureSuggestion.setOptions = (opts) => { _departureOptions = opts; };

// ── 사고종류 / 추정원인 중앙 모달 피커 ──────────────────────────────────────
const ACCIDENT_TYPES = ["충돌","접촉","좌초","전복","화재","폭발","침몰","행방불명",
  "기관손상","추진축계손상","조타장치손상","속구손상","침수","부유물감김",
  "운항저해","해양오염","안전사고","기타"];

const SUSPECTED_CAUSES = [
  "선장업무 소홀(조선미숙 등)","견시 소홀","정비점검 소홀","당직근무 소홀",
  "부적절한 충돌회피(조선)","무리한 운항(기상)","선위 부정확","근접 항해",
  "추월 위반","안전업무 소홀","선저 파공(누수)","기관계통 고장","전기계통 고장",
  "항해계기 고장","선박속구 고장","기상악화","해상 부유물","외부 발화원(차량/화물)",
  "지병","과로","자살(추정)","여객 부주의","기타(1~22번 이외의 것)"];

(function setupPickerModal() {
  const modal      = document.getElementById("picker-modal");
  const backdrop   = modal.querySelector(".picker-modal-backdrop");
  const title      = document.getElementById("picker-modal-title");
  const searchInput= document.getElementById("picker-modal-search");
  const list       = document.getElementById("picker-modal-list");
  const closeBtn   = document.getElementById("picker-modal-close");

  let _options  = [];
  let _hidden   = null;   // hidden input
  let _trigger  = null;   // trigger button
  let _label    = null;   // span inside trigger

  function renderList(query) {
    const q = (query || "").trim();
    const matches = q ? _options.filter(o => o.includes(q)) : _options;
    const current = _hidden ? _hidden.value : "";
    list.innerHTML = matches.map(o =>
      `<button type="button" class="picker-modal-item${o === current ? " selected" : ""}">${o}</button>`
    ).join("");
    list.querySelectorAll(".picker-modal-item").forEach(btn => {
      btn.addEventListener("click", () => {
        const val = btn.textContent;
        _hidden.value = val;
        _hidden.dispatchEvent(new Event("input", { bubbles: true }));
        _hidden.dispatchEvent(new Event("change", { bubbles: true }));
        // 필터 hidden input도 동기화 (WS 동기화용)
        const filterId = _hidden.id + "-filter";
        const filterEl = document.getElementById(filterId);
        if (filterEl) { filterEl.value = val; filterEl.dispatchEvent(new Event("change", { bubbles: true })); }
        _label.textContent = val;
        _trigger.dataset.selected = "true";
        close();
      });
    });
  }

  function open(options, hiddenInput, triggerBtn, labelEl, modalTitle) {
    _options = options;
    _hidden  = hiddenInput;
    _trigger = triggerBtn;
    _label   = labelEl;
    title.textContent = modalTitle;
    searchInput.value = "";
    renderList("");
    modal.classList.remove("hidden");
    setTimeout(() => searchInput.focus(), 80);
  }

  function close() {
    modal.classList.add("hidden");
    _trigger && _trigger.focus();
  }

  closeBtn.addEventListener("click", close);
  backdrop.addEventListener("click", close);
  document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
  searchInput.addEventListener("input", () => renderList(searchInput.value));

  // 사고종류 트리거
  const atTrigger = document.getElementById("accident-type-trigger");
  const atLabel   = document.getElementById("accident-type-label");
  atTrigger.addEventListener("click", () =>
    open(ACCIDENT_TYPES, accidentTypeInput, atTrigger, atLabel, "사고종류 선택")
  );

  // 추정원인 트리거
  const scTrigger = document.getElementById("suspected-cause-trigger");
  const scLabel   = document.getElementById("suspected-cause-label");
  scTrigger.addEventListener("click", () =>
    open(SUSPECTED_CAUSES, suspectedCauseInput, scTrigger, scLabel, "추정 원인 선택")
  );

  // WS 동기화 시 버튼 라벨 복원
  function syncTriggerLabel(hiddenInput, trigger, label) {
    hiddenInput.addEventListener("change", () => {
      const v = hiddenInput.value;
      label.textContent = v || "선택하세요";
      trigger.dataset.selected = v ? "true" : "false";
    });
  }
  syncTriggerLabel(accidentTypeInput, atTrigger, atLabel);
  syncTriggerLabel(suspectedCauseInput, scTrigger, scLabel);
})();


// ── 실시간 운항 선박 조회 ──────────────────────────────────────────
const LIVE_API_KEY = "4063f2c2047eaf451ca47bba11369c953e228d145a62d2be87ad7af1d0f3960f";
const FERRY_ROUTE_INFO_BASE = "https://apis.data.go.kr/B554035/ferry-route-info-v4/get-ferry-route-info-v4";
const OPRT_LINE_INFO_BASE   = "https://apis.data.go.kr/B554035/oprt-line-info-v2/get-oprt-line-info-v2";

const vesselLastUpdateBadge = document.getElementById("vessel-last-update");
const liveVesselDataMap = new Map(); // key → vessel object

// ferry_route_cache 전체 레코드 메모리 캐시 (1분마다 갱신)
let _routeCacheItems = [];
let _routeCacheFetchedAt = null;

async function loadRouteCache() {
  try {
    const res = await fetch(
      `${SUPA_URL}/rest/v1/ferry_route_cache?id=eq.1&select=data,fetched_at&limit=1`,
      { headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` } }
    );
    const rows = await res.json();
    if (!rows[0]) return false;
    const body = rows[0].data?.response?.body ?? rows[0].data?.body ?? rows[0].data;
    _routeCacheItems = normalizeApiList(body?.items?.item);
    _routeCacheFetchedAt = rows[0].fetched_at;
    return true;
  } catch (e) {
    console.warn("ferry_route_cache 조회 실패", e);
    return false;
  }
}

function todayYMD() {
  const d = new Date();
  return d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0");
}

function sailTmToTime(sailTm) {
  const s = String(sailTm).padStart(4, "0");
  return `${s.slice(0, 2)}:${s.slice(2)}`;
}


async function fetchOperatingVessels() {
  await loadRouteCache();
  let items = _routeCacheItems;
  // 캐시가 비어있으면 KOAST API 직접 호출로 폴백
  if (items.length === 0) {
    console.warn("ferry_route_cache 비어있음 — KOAST API 직접 호출");
    const ymd = todayYMD();
    const url = `${FERRY_ROUTE_INFO_BASE}?serviceKey=${LIVE_API_KEY}&pageNo=1&numOfRows=3000&dataType=JSON&rlvtYmd=${ymd}`;
    const res = await fetch(url);
    const json = await res.json();
    items = normalizeApiList(json.response?.body?.items?.item);
  }

  // Group by vessel + sail_tm
  const grouped = new Map();
  for (const item of items) {
    const key = `${item.psnshp_cd}_${item.sail_tm}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(item);
  }

  const allVessels = [];
  grouped.forEach((records, key) => {
    const isActive = records.some(r => ["2","4","5","6"].includes(String(r.nvg_stts_cd)));
    if (!isActive) return;
    const base = records[0];
    const depRec = records.find(r => r.emkt_nope != null);
    const totalEmkt = records.reduce((s, r) => s + (Number(r.emkt_nope) || 0), 0);
    const totalLvsp = records.reduce((s, r) => s + (Number(r.lvsp_nope) || 0), 0);
    // 가장 최근 상태 변경 시각
    const lastUpdateDt = records.reduce((latest, r) =>
      (r.nvg_stts_chg_dt || "") > latest ? (r.nvg_stts_chg_dt || "") : latest, "");
    allVessels.push({
      key,
      psnshp_nm: base.psnshp_nm,
      sail_tm: base.sail_tm,
      lcns_seawy_cd: base.lcns_seawy_cd,
      lcns_seawy_nm: base.lcns_seawy_nm,
      nvg_seawy_cd: base.nvg_seawy_cd,
      nvg_seawy_nm: base.nvg_seawy_nm,
      nvg_drc_cd: base.nvg_drc_cd,
      emkt_nope: depRec ? Number(depRec.emkt_nope) : totalEmkt,
      currentAboard: Math.max(0, totalEmkt - totalLvsp),
      vsl_no: base.vsl_no,
      lastUpdateDt,
    });
  });

  // 선박명별 가장 늦은 출항 1개만
  const byName = new Map();
  allVessels.sort((a, b) => Number(b.sail_tm) - Number(a.sail_tm)); // 내림차순
  for (const v of allVessels) {
    if (!byName.has(v.psnshp_nm)) byName.set(v.psnshp_nm, v);
  }
  return Array.from(byName.values()).sort((a, b) => a.psnshp_nm.localeCompare(b.psnshp_nm, "ko"));
}

const _stopsCache = new Map(); // "lcns-nvg" → items[]

async function fetchStopsFromApi({ lcns_seawy_cd, nvg_seawy_cd, lcns_seawy_nm, nvg_seawy_nm }) {
  const cacheKey = `${lcns_seawy_cd || ""}-${nvg_seawy_cd || ""}-${lcns_seawy_nm || ""}`;
  if (_stopsCache.has(cacheKey)) return _stopsCache.get(cacheKey);

  const cache = (items) => { _stopsCache.set(cacheKey, items); return items; };

  // 1차: 운항항로코드 단독 (서브루트 정확한 기항지 순서)
  if (nvg_seawy_cd) {
    try {
      const res = await fetch(`${OPRT_LINE_INFO_BASE}?serviceKey=${LIVE_API_KEY}&pageNo=1&numOfRows=200&dataType=JSON&nvgSeawyCd=${encodeURIComponent(nvg_seawy_cd)}`);
      const json = await res.json();
      const items = normalizeApiList(json.response?.body?.items?.item);
      if (items.length > 0) return cache(items);
    } catch (_) {}
  }
  // 2차 폴백: 면허항로코드만으로 조회 후 nvg_seawy_cd로 필터링
  if (lcns_seawy_cd) {
    try {
      const res = await fetch(`${OPRT_LINE_INFO_BASE}?serviceKey=${LIVE_API_KEY}&pageNo=1&numOfRows=200&dataType=JSON&lcnsSeawyCd=${encodeURIComponent(lcns_seawy_cd)}`);
      const json = await res.json();
      let items = normalizeApiList(json.response?.body?.items?.item);
      if (nvg_seawy_cd) items = items.filter(i => String(i.nvg_seawy_cd) === String(nvg_seawy_cd));
      if (items.length > 0) return cache(items);
    } catch (_) {}
  }
  // 3차 폴백: 이름으로 조회
  try {
    const res = await fetch(`${OPRT_LINE_INFO_BASE}?serviceKey=${LIVE_API_KEY}&pageNo=1&numOfRows=200&dataType=JSON&lcnsSeawyNm=${encodeURIComponent(lcns_seawy_nm || "")}`);
    const json = await res.json();
    let items = normalizeApiList(json.response?.body?.items?.item);
    if (nvg_seawy_cd) items = items.filter(i => String(i.nvg_seawy_cd) === String(nvg_seawy_cd));
    return cache(items);
  } catch (_) {}
  return cache([]);
}

async function fetchVesselSailingRecords(psnshp_nm, sail_tm) {
  // 캐시에서 해당 선박+항차 레코드 필터링 (추가 API 호출 없음)
  return _routeCacheItems.filter(
    r => r.psnshp_nm === psnshp_nm && String(r.sail_tm) === String(sail_tm)
  );
}

let _activeVesselKey = null; // 현재 선택된 선박 키

async function onLiveVesselSelect(key) {
  _activeVesselKey = key;
  const v = liveVesselDataMap.get(key);
  if (!v) return;

  // 최종 업데이트 시간 배지
  if (v.lastUpdateDt) {
    const t = v.lastUpdateDt.slice(11, 16);
    vesselLastUpdateBadge.textContent = `최종 ${t}`;
    vesselLastUpdateBadge.classList.remove("hidden");
  }

  if (v.sail_tm) departureTimeInput.value = sailTmToTime(v.sail_tm);

  operationRouteInput.value = v.lcns_seawy_nm || "";

  // 운항기록 + 기항지 목록 동시 조회
  departurePlaceFilterInput.value = "";
  departurePlaceFilterInput.placeholder = "기항지 조회 중...";
  departurePlaceFilterInput.disabled = true;

  let sailingRecords = [];
  try {
    sailingRecords = await fetchVesselSailingRecords(v.psnshp_nm, v.sail_tm);
  } catch (_) {}

  // 승선인원 계산
  if (sailingRecords.length > 0) {
    const totalEmkt = sailingRecords.reduce((s, r) => s + (Number(r.emkt_nope) || 0), 0);
    const totalLvsp = sailingRecords.reduce((s, r) => s + (Number(r.lvsp_nope) || 0), 0);
    const currentAboard = Math.max(0, totalEmkt - totalLvsp);
    passengerCountInput.value = currentAboard > 0 ? currentAboard : totalEmkt;

    const lastDt = sailingRecords.reduce((latest, r) =>
      (r.nvg_stts_chg_dt || "") > latest ? (r.nvg_stts_chg_dt || "") : latest, "");
    if (lastDt) {
      vesselLastUpdateBadge.textContent = `최종 ${lastDt.slice(11, 16)}`;
      vesselLastUpdateBadge.classList.remove("hidden");
    }
  } else {
    if (v.currentAboard > 0) passengerCountInput.value = v.currentAboard;
    else if (v.emkt_nope > 0) passengerCountInput.value = v.emkt_nope;
  }

  // 운항기록에서 출발항 추출 (시간순 첫 번째 portcl_nm)
  let autoPort = "";
  if (sailingRecords.length > 0) {
    const sorted = sailingRecords
      .filter(r => r.portcl_nm)
      .sort((a, b) => (a.nvg_stts_chg_dt || "") < (b.nvg_stts_chg_dt || "") ? -1 : 1);
    if (sorted.length > 0) autoPort = sorted[0].portcl_nm;
  }

  // 기항지 목록: oprt-line-info-v2 API (면허항로코드 + 운항항로코드)
  try {
    const stops = await fetchStopsFromApi({
      lcns_seawy_cd: v.lcns_seawy_cd,
      nvg_seawy_cd: v.nvg_seawy_cd,
      lcns_seawy_nm: v.lcns_seawy_nm,
      nvg_seawy_nm: v.nvg_seawy_nm,
    });
    const seenCd = new Set();
    const stopNames = stops
      .sort((a, b) => Number(a.portcl_sn) - Number(b.portcl_sn))
      .filter(s => {
        if (!s.portcl_nm) return false;
        const key = s.portcl_cd || s.portcl_nm;
        if (seenCd.has(key)) return false;
        seenCd.add(key);
        return true;
      })
      .map(s => s.portcl_nm);

    departureSuggestion.setOptions(stopNames);

    // 운항기록 출발항 자동 입력 (드롭다운 목록에 있는 값이면 우선 사용)
    const preSelect = autoPort && (stopNames.includes(autoPort) ? autoPort : stopNames[0] || autoPort);
    if (preSelect) {
      departurePlaceFilterInput.value = preSelect;
      departurePlaceInput.value = preSelect;
    }

    departurePlaceFilterInput.placeholder = stopNames.length > 0 ? `출항지 검색... (${stopNames.length}개)` : "기항지 없음";
    departurePlaceFilterInput.disabled = false;
  } catch (e) {
    // 기항지 목록 실패해도 운항기록 출발항은 채우기
    if (autoPort) {
      departurePlaceFilterInput.value = autoPort;
      departurePlaceInput.value = autoPort;
    }
    departurePlaceFilterInput.placeholder = "출항지 검색...";
    departurePlaceFilterInput.disabled = false;
    console.warn("기항지 조회 실패:", e);
  }

  // ── 출항지/시각 자동입력 + 항로 현황 패널 ─────────────────────
  await updateRouteStatusPanel(v, sailingRecords);
}

// ── Supabase port_locations 좌표 조회 ──────────────────────────
const SUPA_URL  = "https://fnpsaypaxpxyyqmrqwai.supabase.co";
const SUPA_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZucHNheXBheHB4eXlxbXJxd2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5OTc1NzYsImV4cCI6MjA4OTU3MzU3Nn0.yZir2n-zxnbedVdIKwpqJAnWjuwEp96jIYjOY6cNPe4";
const _portCoordCache = new Map();

async function fetchPortCoord(portcl_cd) {
  if (!portcl_cd) return null;
  if (_portCoordCache.has(portcl_cd)) return _portCoordCache.get(portcl_cd);
  try {
    const res = await fetch(
      `${SUPA_URL}/rest/v1/port_locations?portcl_cd=eq.${encodeURIComponent(portcl_cd)}&select=lat,lot&limit=1`,
      { headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` } }
    );
    const rows = await res.json();
    const coord = rows[0] ? { lat: Number(rows[0].lat), lng: Number(rows[0].lot) } : null;
    _portCoordCache.set(portcl_cd, coord);
    return coord;
  } catch { return null; }
}

// ── 별도 항로 레이어 (기존 lineSource와 분리) ──────────────────
const ferryRouteSource = new ol.source.Vector();
const ferryRouteLayer  = new ol.layer.Vector({
  source: ferryRouteSource,
  style: () => new ol.style.Style({
    stroke: new ol.style.Stroke({ color: "#4ade80", width: 3, lineDash: [8, 4] }),
  }),
  zIndex: 5,
});
map.addLayer(ferryRouteLayer);

// 현위치→다음기항지 직선 전용 레이어
const curToNextSource = new ol.source.Vector();
const curToNextLayer  = new ol.layer.Vector({
  source: curToNextSource,
  zIndex: 8,
});
map.addLayer(curToNextLayer);

function makeNextPortCallout(portName, distNm) {
  const line1 = portName || "";
  const line2 = `→ ${distNm.toFixed(1)} NM`;
  const dpr = window.devicePixelRatio || 1;
  const pad = 8, gap = 4, leaderH = 28;
  const tmpC = document.createElement("canvas");
  const tmpX = tmpC.getContext("2d");
  tmpX.font = `bold ${11 * dpr}px Pretendard, sans-serif`;
  const w1 = tmpX.measureText(line1).width;
  tmpX.font = `${11 * dpr}px Pretendard, sans-serif`;
  const w2 = tmpX.measureText(line2).width;
  const boxW = Math.max(w1, w2) + pad * 2 * dpr;
  const boxH = (11 * 2 + gap + pad * 2) * dpr;
  const totalH = (boxH + leaderH * dpr);
  const canvas = document.createElement("canvas");
  canvas.width = boxW + 2 * dpr;
  canvas.height = totalH + 2 * dpr;
  const ctx = canvas.getContext("2d");
  const cx = canvas.width / 2;

  // 점선 리더
  ctx.save();
  ctx.setLineDash([3 * dpr, 2 * dpr]);
  ctx.strokeStyle = "#f97316";
  ctx.lineWidth = 1.5 * dpr;
  ctx.beginPath();
  ctx.moveTo(cx, canvas.height - dpr);
  ctx.lineTo(cx, boxH + dpr);
  ctx.stroke();
  ctx.restore();

  // 말풍선 박스
  const rx = 4 * dpr;
  ctx.fillStyle = "#fff7ed";
  ctx.strokeStyle = "#f97316";
  ctx.lineWidth = 1.5 * dpr;
  ctx.beginPath();
  ctx.roundRect(dpr, dpr, boxW, boxH, rx);
  ctx.fill();
  ctx.stroke();

  // 기항지명
  ctx.fillStyle = "#c2410c";
  ctx.font = `bold ${11 * dpr}px Pretendard, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(line1, cx, (pad + 1) * dpr);

  // 거리
  ctx.font = `${11 * dpr}px Pretendard, sans-serif`;
  ctx.fillText(line2, cx, (pad + 11 + gap) * dpr);

  return { canvas, anchorY: 1.0 };
}

function drawCurToNextLine(curLat, curLng, nextCoord, distNm, portName) {
  curToNextSource.clear();
  if (!nextCoord || isNaN(curLat) || isNaN(curLng)) return;

  const from = ol.proj.fromLonLat([curLng, curLat]);
  const to   = ol.proj.fromLonLat([nextCoord.lng, nextCoord.lat]);
  const brg  = bearingDeg(curLat, curLng, nextCoord.lat, nextCoord.lng);
  const brgRad = brg * Math.PI / 180;
  const orange = "#f97316";

  // 1. 주 선
  const lineFeature = new ol.Feature({ geometry: new ol.geom.LineString([from, to]) });
  lineFeature.setStyle(new ol.style.Style({
    stroke: new ol.style.Stroke({ color: orange, width: 3 }),
  }));
  curToNextSource.addFeature(lineFeature);

  // 2. 끝점 화살표 (채운 삼각형)
  const arrowFeat = new ol.Feature({ geometry: new ol.geom.Point(to) });
  arrowFeat.setStyle(new ol.style.Style({
    image: new ol.style.RegularShape({
      points: 3,
      radius: 13,
      fill: new ol.style.Fill({ color: orange }),
      rotation: brgRad,
    }),
  }));
  curToNextSource.addFeature(arrowFeat);

  // 3. 선 전체에 일정 간격으로 채운 삼각형 화살표
  const step = 0.10;
  for (let t = 0.10; t < 0.92; t += step) {
    const cx = from[0] + (to[0] - from[0]) * t;
    const cy = from[1] + (to[1] - from[1]) * t;
    const chevron = new ol.Feature({ geometry: new ol.geom.Point([cx, cy]) });
    chevron.setStyle(new ol.style.Style({
      image: new ol.style.RegularShape({
        points: 3,
        radius: 9,
        fill: new ol.style.Fill({ color: orange }),
        stroke: new ol.style.Stroke({ color: "#fff", width: 1 }),
        rotation: brgRad,
      }),
    }));
    curToNextSource.addFeature(chevron);
  }

  // 4. 목적지 말풍선 (점선 리더 + 박스)
  const { canvas } = makeNextPortCallout(portName || "", distNm);
  const calloutFeat = new ol.Feature({ geometry: new ol.geom.Point(to) });
  calloutFeat.setStyle(new ol.style.Style({
    image: new ol.style.Icon({
      img: canvas,
      imgSize: [canvas.width, canvas.height],
      anchor: [0.5, 1.0],
      anchorXUnits: "fraction",
      anchorYUnits: "fraction",
      scale: 1 / (window.devicePixelRatio || 1),
    }),
  }));
  curToNextSource.addFeature(calloutFeat);
}

async function updateRouteStatusPanel(v, sailingRecords) {
  const panel = document.getElementById("route-status-panel");
  if (!panel) return;

  // 1. 출항 기록 (nvg_stts_cd=4) 시간순 정렬
  const depRecords = sailingRecords
    .filter(r => r.portcl_nm && String(r.nvg_stts_cd) === "4")
    .sort((a, b) => (a.nvg_stts_chg_dt || "") < (b.nvg_stts_chg_dt || "") ? -1 : 1);

  const firstDep = depRecords[0];    // 최초 출항 (출항지)
  const lastDep  = depRecords[depRecords.length - 1]; // 가장 최근 출항 (현재 위치 추정)

  // 출항지/시각 보고서 자동입력 — 가장 최근 지난 기항지(lastDep)를 출항지로
  if (lastDep) {
    departurePlaceInput.value = lastDep.portcl_nm;
    departurePlaceFilterInput.value = lastDep.portcl_nm;
  } else if (firstDep) {
    departurePlaceInput.value = firstDep.portcl_nm;
    departurePlaceFilterInput.value = firstDep.portcl_nm;
  }
  const depForTime = lastDep || firstDep;
  if (depForTime) {
    departureTimeInput.value = depForTime.nvg_stts_chg_dt.slice(11, 16);
  }

  // 2. 기항지 순서 목록 (oprt-line-info-v2)
  // - orderedStops: 현재 서브루트(nvg_seawy_cd) 기준 → 다음 기항지 계산용
  // - allLcnsStops: 면허항로 전체 기항지 → 지도 항로도 표시용
  let orderedStops = [], allLcnsStops = [];
  const dedup = (stops) => {
    const seen = new Set();
    return stops
      .sort((a, b) => Number(a.portcl_sn) - Number(b.portcl_sn))
      .filter(s => {
        if (!s.portcl_cd && !s.portcl_nm) return false;
        const k = s.portcl_cd || s.portcl_nm;
        if (seen.has(k)) return false;
        seen.add(k); return true;
      });
  };
  try {
    const stops = await fetchStopsFromApi({
      lcns_seawy_cd: v.lcns_seawy_cd, nvg_seawy_cd: v.nvg_seawy_cd,
      lcns_seawy_nm: v.lcns_seawy_nm, nvg_seawy_nm: v.nvg_seawy_nm,
    });
    orderedStops = dedup(stops);
  } catch (e) { console.warn("기항지 목록 조회 실패", e); }
  try {
    // 면허항로 전체 기항지 (nvg_seawy_cd 필터 없이)
    const allStops = await fetchStopsFromApi({
      lcns_seawy_cd: v.lcns_seawy_cd,
      lcns_seawy_nm: v.lcns_seawy_nm,
    });
    allLcnsStops = dedup(allStops);
  } catch (e) { console.warn("면허항로 기항지 조회 실패", e); }

  // 출항지 드롭다운 옵션을 이 항로의 기항지 목록으로 설정
  if (orderedStops.length > 0) {
    departureSuggestion.setOptions(orderedStops.map(s => s.portcl_nm).filter(Boolean));
    departurePlaceFilterInput.placeholder = `출항지 검색... (${orderedStops.length}개)`;
  }

  // 3. 현재 위치 (마지막 출항 기항지) → 다음 기항지 추정
  // nvg_drc_cd: 1=정방향(순서대로), 2=역방향(거꾸로)
  const isReverse = String(v.nvg_drc_cd) === "2";
  let nextStop = null;
  if (lastDep && orderedStops.length > 0) {
    const curIdx = orderedStops.findIndex(
      s => s.portcl_cd === lastDep.portcl_cd || s.portcl_nm === lastDep.portcl_nm
    );
    if (isReverse) {
      if (curIdx > 0) nextStop = orderedStops[curIdx - 1];
    } else {
      if (curIdx >= 0 && curIdx < orderedStops.length - 1) nextStop = orderedStops[curIdx + 1];
    }
  }

  // 4. 좌표 조회 및 거리 계산
  const depCoord  = lastDep  ? await fetchPortCoord(lastDep.portcl_cd)  : null;
  const nextCoord = nextStop ? await fetchPortCoord(nextStop.portcl_cd) : null;

  // 현재 선박 좌표 (입력값) → 다음 기항지 거리
  const curLat = parseFloat(latInput.value);
  const curLng = parseFloat(lngInput.value);
  const hasCurrentPos = !isNaN(curLat) && !isNaN(curLng);

  let distNm = null;
  if (hasCurrentPos && nextCoord) {
    distNm = haversineNm(curLat, curLng, nextCoord.lat, nextCoord.lng);
  } else if (depCoord && nextCoord) {
    // 현재 좌표 없으면 마지막 기항지 기준
    distNm = haversineNm(depCoord.lat, depCoord.lng, nextCoord.lat, nextCoord.lng);
  }

  // 5. 패널 업데이트
  const lastUpd = (lastDep?.nvg_stts_chg_dt || v.lastUpdateDt || "").slice(11, 16);
  document.getElementById("rsp-vessel-nm").textContent = v.psnshp_nm || "-";
  document.getElementById("rsp-route-nm").textContent  = v.lcns_seawy_nm || v.nvg_seawy_nm || "-";
  document.getElementById("rsp-dep").textContent =
    lastDep ? `${lastDep.portcl_nm} (${lastDep.nvg_stts_chg_dt.slice(11, 16)} 출항)` : "-";
  document.getElementById("rsp-next").textContent  = nextStop?.portcl_nm || (lastDep ? "마지막 기항지" : "-");
  const distLabel = hasCurrentPos && nextCoord ? "현위치→" : (depCoord && nextCoord ? "출항지→" : "");
  document.getElementById("rsp-dist").textContent  = distNm != null ? `${distLabel}${nextStop?.portcl_nm || ""} ${distNm.toFixed(1)} NM` : "-";
  document.getElementById("rsp-updated").textContent = lastUpd ? `마지막 상태 ${lastUpd}` : "";
  panel.classList.remove("hidden");

  // 6. 지도에 항로 표시
  ferryRouteSource.clear();
  curToNextSource.clear();

  // koast_routes.json에서 항로 경로 좌표 찾기
  console.log("[항로] lcns_seawy_cd=", v.lcns_seawy_cd, "nvg_seawy_cd=", v.nvg_seawy_cd, "nvg_drc_cd=", v.nvg_drc_cd, "lcns_nm=", v.lcns_seawy_nm);
  const routePath = findKoastRoute(v.lcns_seawy_cd, v.nvg_seawy_cd, v.nvg_drc_cd);

  if (routePath && routePath.length >= 2) {
    // koast_routes 경로로 전체 항로 그리기 (회색 점선)
    const allProjCoords = routePath.map(p => ol.proj.fromLonLat([p[1], p[0]]));
    ferryRouteSource.addFeature(new ol.Feature({
      geometry: new ol.geom.LineString(allProjCoords),
      highlight: false,
    }));

    // 현재 위치 → 다음 기항지 직선 (별도 레이어)
    if (hasCurrentPos && nextCoord && distNm != null) {
      drawCurToNextLine(curLat, curLng, nextCoord, distNm, nextStop?.portcl_nm);
    } else {
      curToNextSource.clear();
    }

    // 기항지별 실제 출항 시각 맵 (portcl_nm → HH:MM)
    const depTimeMap = new Map();
    for (const r of depRecords) {
      if (r.portcl_nm && r.nvg_stts_chg_dt)
        depTimeMap.set(r.portcl_nm, r.nvg_stts_chg_dt.slice(11, 16));
    }

    // 기항지 마커 (orderedStops 기준)
    const stopCoords = await Promise.all(orderedStops.map(s => fetchPortCoord(s.portcl_cd)));
    stopCoords.forEach((c, i) => {
      if (!c?.lat || !c?.lng) return;
      const nm = orderedStops[i].portcl_nm;
      const isFirst = i === 0, isLast = i === orderedStops.length - 1;
      const isCurrent = nm === lastDep?.portcl_nm;
      const isNext    = nm === nextStop?.portcl_nm;
      const isPassed  = depTimeMap.has(nm);
      const depTime   = depTimeMap.get(nm);
      // 통과한 기항지·현재·다음 모두 하이라이트
      const isHighlight = isCurrent || isNext || isPassed || isFirst || isLast;
      const color = isCurrent ? "#f59e0b" : isNext ? "#2563eb" : isPassed ? "#16a34a" : "#94a3b8";
      const r = isCurrent ? 9 : isHighlight ? 7 : 4;
      // 라벨: 통과시각 있으면 "포트명\nHH:MM 출항", 다음 기항지는 "포트명\n▶ 다음"
      const label = depTime
        ? `${nm}\n${depTime} 출항`
        : isNext ? `${nm}\n▶ 다음` : nm;
      const feat = new ol.Feature({ geometry: new ol.geom.Point(ol.proj.fromLonLat([c.lng, c.lat])) });
      feat.setStyle(new ol.style.Style({
        image: new ol.style.Circle({
          radius: r,
          fill: new ol.style.Fill({ color }),
          stroke: new ol.style.Stroke({ color: "#fff", width: 2 }),
        }),
        text: isHighlight ? new ol.style.Text({
          text: label,
          font: "bold 11px Pretendard, sans-serif",
          fill: new ol.style.Fill({ color: "#1e293b" }),
          stroke: new ol.style.Stroke({ color: "#fff", width: 3 }),
          offsetY: -16,
          textAlign: "center",
        }) : null,
      }));
      ferryRouteSource.addFeature(feat);
    });

    // 전체 항로가 화면에 보이도록
    const ext = ol.extent.boundingExtent(allProjCoords);
    map.getView().fit(ext, { padding: [80, 80, 80, 300], duration: 600, maxZoom: 11 });

  } else if (orderedStops.length >= 2) {
    // koast_routes 없으면 기항지 좌표 직선 연결로 폴백
    const coords = await Promise.all(orderedStops.map(s => fetchPortCoord(s.portcl_cd)));
    const validCoords = coords.map((c, i) => ({ ...c, name: orderedStops[i].portcl_nm })).filter(c => c.lat && c.lng);
    if (validCoords.length >= 2) {
      ferryRouteSource.addFeature(new ol.Feature({
        geometry: new ol.geom.LineString(validCoords.map(c => ol.proj.fromLonLat([c.lng, c.lat]))),
      }));
      if (hasCurrentPos && nextCoord && distNm != null) {
        drawCurToNextLine(curLat, curLng, nextCoord, distNm, nextStop?.portcl_nm);
      } else {
        curToNextSource.clear();
      }
      const ext = ol.extent.boundingExtent(validCoords.map(c => ol.proj.fromLonLat([c.lng, c.lat])));
      map.getView().fit(ext, { padding: [80, 80, 80, 300], duration: 600, maxZoom: 11 });
    }
  }
}

// ──────────────────────────────────────────────
// 조류 레이어
// ──────────────────────────────────────────────
const TIDAL_API_KEY = "4063f2c2047eaf451ca47bba11369c953e228d145a62d2be87ad7af1d0f3960f"; // ← 만료 시 교체
const TIDAL_BASE = "https://apis.data.go.kr/1192136/crntFcstTime/GetCrntFcstTimeApiService";

// 예보지점 목록 (obsCode, 지점명) — 좌표는 API 응답에서 수집 후 캐시
const TIDAL_STATIONS = [
  ["06SA18","경치동수도"],["06YME1","광도동측"],["06YS04","서수도(여자만)"],["06YS09","거금수도"],
  ["18MTC10","초도남측"],["01MP-2","목포구"],["01SR-1","사량도북측"],["02JJ-1","제주항"],
  ["03DS-1","장안서"],["03PT-1","아산만입구"],["05GH-5","장봉수도"],["06GH01","득량만입구"],
  ["06GH07","거금도남측"],["06GS07","고군산군도"],["06JD01","외병도"],["06SA01","면도수도"],
  ["06SA10","팔구포북측"],["06YME4","보길도남서측"],["06YME5","장죽수도"],["06YME6","맹골수도"],
  ["06YME8","매물수도"],["06YS03","신강수도"],["07DS02","대산항"],["07GG03","석모수도"],
  ["07GG06","인천갑문"],["07GG11","덕적도"],["07JB12","수도수도북측"],["07JB14","수도수도"],
  ["07KS01","원산도"],["07KS03","외연열도"],["07TA03","태안"],["07TA04","만리포"],
  ["07TA05","안흥"],["07TA09","격렬비열도"],["08F","추자도남서측"],["08GA01","감천항입구"],
  ["08GY-5","묘도수도"],["08JJ03","성산포"],["08JJ07","서귀포"],["08JJ13","애월항북측"],
  ["09IC01","인천남항"],["09IC07","경인아라뱃길"],["10ED01","이어도"],["10GD03","가덕수도"],
  ["10MP07","시아해"],["11JD02","정등해"],["11JD09","마로해"],["12JB11","비인만"],
  ["12JB14","군산항입구"],["12YS08","광양항"],["13PT01","평택항"],["13WD01","소안도"],
  ["14BP01","병풍도북측"],["14IC03","자월도북측"],["14IC04","이작도서측"],["14JD03","정등해북측"],
  ["15HD05","하동항"],["15LTC01","염하수도"],["15LTC02","어청도서측"],["15LTC03","위도동측"],
  ["15LTC04","홍도항로"],["15LTC05","만재도서측"],["15LTC06","거차수도"],["15LTC07","독거군도동측"],
  ["15LTC08","장고도수도"],["15LTC09","금당수도"],["15LTC10","여수해만"],["15SE01","노량수도"],
  ["16DJ04","시화방조제"],["16LTC01","인천대교"],["16LTC02","인천동수도입구"],["16LTC03","천수만"],
  ["16LTC04","역도"],["16LTC05","목포북항북측"],["16LTC06","시아해북측"],["16LTC07","장산도동측"],
  ["16LTC08","광양항제1항로"],["16LTC09","통영해만"],["16LTC10","비진도남측"],["16LTC11","부도수도"],
  ["16LTC12","낙동포"],["16LTC13","부산항입구"],["16LTC14","울산신항"],["16MTC01","미조수도"],
  ["16MTC16","지심도서측"],["17LTC01","인천신항입구"],["17LTC02","경기만북수도"],["17LTC03","자월도남측"],
  ["17LTC04","문갑도동측"],["17LTC05","울도"],["17LTC06","가로림만입구"],["17LTC07","울도남측"],
  ["17LTC08","녹도북측"],["17LTC09","십이동파도"],["17LTC10","고군산군도북측"],["17LTC11","가사도동측"],
  ["17LTC12","소안수도"],["17LTC13","완도통항분리대"],["17LTC14","욕지도북측"],["17MTC14","위도서측"],
  ["17MTC19","안마도서측"],["17MTC20","안마도동측"],["18LTC01","난지도북측"],["18LTC02","와도서측"],
  ["18LTC03","안좌도북측"],["18LTC04","비금수도"],["18LTC05","흑일도남측"],["18LTC06","여수해협"],
  ["18LTC07","여수해만입구"],["18LTC08","두미도북측"],["18LTC09","사량도동측"],["18LTC10","가조도수도"],
  ["18LTC11","진해만(통영항로)"],["18LTC12","거제도동측"],["18LTC13","해운대"],["18LTC14","대왕암남측"],
  ["19LTC01","화성방조제"],["19LTC02","외연도동측"],["19LTC03","재원동수도"],["19LTC04","증도동측"],
  ["19LTC05","매화도서측"],["19LTC06","하의수도"],["19LTC07","청산도동측"],["19LTC08","대병풍도서측"],
  ["19LTC09","초도동측"],["19LTC10","손죽도북측"],["19LTC11","나로도동측"],["19LTC12","여수해만남측"],
  ["19LTC13","대병대도동측"],["19LTC14","광안리"],["JejuStrait","추자도동측"],
  ["20LTC01","어불도서측"],["20LTC02","독거군도북측"],["20LTC03","외모군도남측"],["20LTC04","영흥도서측"],
  ["20LTC05","함평만입구"],["20LTC06","금오열도남측"],["20LTC07","자월도북서측"],["20LTC08","우이수도"],
  ["20LTC09","송이도북측"],["20LTC11","덕적군도서측"],["20LTC12","수우도서측"],["20LTC13","관리도"],
  ["20LTC14","가덕도남측"],["20LTC15","거금도동측"],["GwangyangHang","광양항입구"],
  ["21LTC01","태종대남측"],["21LTC02","북형제도남측"],["21LTC03","가덕도남서측"],["21LTC04","부산항신항"],
  ["21LTC05","저도서측"],["21LTC06","내도동측"],["21LTC07","칠천도북서측"],["21LTC08","장사도북측"],
  ["21LTC09","용초도북측"],["21LTC10","견내량해협"],["21LTC11","오곡도북측"],["21LTC12","곤리도남측"],
  ["21LTC13","사량도북동측"],["21LTC14","신수도동측"],["22EW01","대화사도서측"],
  ["22LTC01","삼천포-제주항로"],["22LTC02","대방수도"],["22LTC03","노량수도동측"],["22LTC04","외수도"],
  ["22LTC05","금오수도"],["22LTC06","백야도동측"],["22LTC07","백야수도"],["22LTC08","외나로도서측"],
  ["22LTC09","손죽도서측"],["22LTC10","소록도동측"],["22LTC12","마량항"],["22LTC13","청산도서측"],
  ["22LTC14","황제도동측"],["22LTC15","광양항A호등부표"],["22MTC03","제주해협"],
  ["23GA01","안면도서측"],["23LTC01","우도북서측"],["23LTC02","제주도서측"],["23LTC03","백일도동측"],
  ["23LTC04","어룡도북측"],["23LTC05","율도북동측"],["23LTC06","대야도동측"],["23LTC07","우이도남측"],
  ["23LTC08","장산도서측"],["23LTC09","달리도서측"],["23YG03","외나로도남측"],
  ["24GW02","완도항"],["24LTC01","재원도남서측"],["24LTC02","어의도북측"],["24LTC03","안마도남측"],
  ["24LTC04","거륜도남서측"],["24LTC05","말도남측"],["24LTC06","소횡경도북측"],["24LTC07","십이동파도남동측"],
  ["24LTC08","대화사도남측"],["24LTC09","삽시도북측"],["24LTC10","외파수도남측"],["24LTC11","가의도북동측"],
  ["24TJ02","가로림만"],["24TJ04","입파도"],["24TJ05","아산만28호등부표"],["MyeongYang_Sudo","명량수도"],
  ["98HG-1","횡간수도"],
];

// 좌표 캐시 (obsCode → {lat, lng})
const _tidalCoordCache = new Map();
// 조류 데이터 캐시 (obsCode → {crdir, crsp, predcDt, ts})
const _tidalDataCache = new Map();
const TIDAL_CACHE_TTL = 5 * 60 * 1000; // 5분

let _tidalLayerOn = false;

const tidalSource = new ol.source.Vector();
const tidalLayer = new ol.layer.Vector({ source: tidalSource, zIndex: 15 });
map.addLayer(tidalLayer);

function tidalDirToDeg(crdir) {
  const v = parseFloat(crdir);
  if (!isNaN(v)) return v;
  const map = {"북":0,"북북동":22.5,"북동":45,"동북동":67.5,"동":90,"동남동":112.5,"남동":135,"남남동":157.5,
    "남":180,"남남서":202.5,"남서":225,"서남서":247.5,"서":270,"서북서":292.5,"북서":315,"북북서":337.5};
  return map[String(crdir).trim()] ?? 0;
}

function makeTidalArrow(name, crdir, crsp) {
  const dpr = window.devicePixelRatio || 1;
  const brgRad = crdir * Math.PI / 180;
  const spd = parseFloat(crsp) || 0;
  const r = 14 * dpr;
  const color = spd >= 30 ? "#ef4444" : spd >= 15 ? "#f97316" : spd >= 5 ? "#22c55e" : "#94a3b8";
  const size = (r * 2 + 8) * dpr;
  const canvas = document.createElement("canvas");
  canvas.width = size + 40 * dpr;
  canvas.height = size + 28 * dpr;
  const ctx = canvas.getContext("2d");
  const cx = canvas.width / 2, cy = (size / 2) + 4 * dpr;

  // 원형 배경
  ctx.beginPath();
  ctx.arc(cx, cy, r + 3 * dpr, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5 * dpr;
  ctx.stroke();

  // 화살표
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(brgRad);
  ctx.fillStyle = color;
  const ar = r * 0.75;
  ctx.beginPath();
  ctx.moveTo(0, -ar);
  ctx.lineTo(ar * 0.45, ar * 0.55);
  ctx.lineTo(0, ar * 0.25);
  ctx.lineTo(-ar * 0.45, ar * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 유속 텍스트
  ctx.fillStyle = "#1e293b";
  ctx.font = `bold ${10 * dpr}px Pretendard,sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2 * dpr;
  const kt = (spd / 51.44).toFixed(1);
  ctx.strokeText(`${kt}kt`, cx, cy + r + 5 * dpr);
  ctx.fillText(`${kt}kt`, cx, cy + r + 5 * dpr);

  return canvas;
}

async function fetchTidalCurrentNow(obsCode) {
  const cached = _tidalDataCache.get(obsCode);
  if (cached && Date.now() - cached.ts < TIDAL_CACHE_TTL) return cached;

  const now = new Date();
  const pad = n => String(n).padStart(2, "0");
  const reqDate = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}`;
  const url = `${TIDAL_BASE}?serviceKey=${TIDAL_API_KEY}&obsCode=${encodeURIComponent(obsCode)}&numOfRows=25&type=json&min=60&reqDate=${reqDate}`;
  try {
    const res = await fetch(url);
    const json = await res.json();
    const body = json?.response?.body ?? json?.body;
    const items = body?.items?.item ?? [];
    const list = Array.isArray(items) ? items : (items && typeof items === "object" ? [items] : []);
    if (!list.length) return null;

    // 현재 시각과 가장 가까운 항목 선택
    const nowMs = now.getTime();
    let best = null, bestDiff = Infinity;
    for (const it of list) {
      if (!it.predcDt && !it.obsrvnDt) continue;
      const dt = new Date((it.predcDt || it.obsrvnDt).replace(" ", "T") + ":00");
      const diff = Math.abs(dt.getTime() - nowMs);
      if (diff < bestDiff) { bestDiff = diff; best = it; }
    }
    if (!best) return null;

    // 좌표도 캐시
    if (best.lat && best.lot && !_tidalCoordCache.has(obsCode)) {
      _tidalCoordCache.set(obsCode, { lat: parseFloat(best.lat), lng: parseFloat(best.lot) });
    }

    const result = {
      crdir: tidalDirToDeg(best.crdir),
      crsp: parseFloat(best.crsp) || 0,
      predcDt: best.predcDt || best.obsrvnDt || "",
      ts: Date.now(),
    };
    _tidalDataCache.set(obsCode, result);
    return result;
  } catch { return null; }
}

let _tidalRefreshId = 0;
async function refreshTidalLayer() {
  if (!_tidalLayerOn) return;
  const thisId = ++_tidalRefreshId;

  const extent = map.getView().calculateExtent(map.getSize());
  const [minX, minY, maxX, maxY] = ol.proj.transformExtent(extent, "EPSG:3857", "EPSG:4326");

  const inView = TIDAL_STATIONS.filter(([code]) => {
    const c = _tidalCoordCache.get(code);
    return c && c.lng >= minX && c.lng <= maxX && c.lat >= minY && c.lat <= maxY;
  });
  const uncached = TIDAL_STATIONS.filter(([code]) => !_tidalCoordCache.has(code));

  function addTidalFeature(code, name, data) {
    const coord = _tidalCoordCache.get(code);
    if (!coord || coord.lng < minX || coord.lng > maxX || coord.lat < minY || coord.lat > maxY) return;
    const canvas = makeTidalArrow(name, data.crdir, data.crsp);
    const feat = new ol.Feature({ geometry: new ol.geom.Point(ol.proj.fromLonLat([coord.lng, coord.lat])) });
    feat.setStyle(new ol.style.Style({
      image: new ol.style.Icon({
        src: canvas.toDataURL(),
        scale: 1 / (window.devicePixelRatio || 1),
        anchor: [0.5, 0.5],
        anchorXUnits: "fraction",
        anchorYUnits: "fraction",
      }),
      text: new ol.style.Text({
        text: name,
        font: "10px Pretendard,sans-serif",
        fill: new ol.style.Fill({ color: "#374151" }),
        stroke: new ol.style.Stroke({ color: "#fff", width: 2 }),
        offsetY: 28,
        textAlign: "center",
      }),
    }));
    tidalSource.addFeature(feat);
  }

  // 한 번만 clear, 이후 각 요청 완료 즉시 개별 추가 (스트리밍 렌더링)
  tidalSource.clear();

  const targets = [
    ...inView,
    ...uncached.slice(0, 20),
  ];

  targets.forEach(([code, name]) => {
    fetchTidalCurrentNow(code).then(data => {
      if (thisId !== _tidalRefreshId) return; // stale refresh → 무시
      if (data) addTidalFeature(code, name, data);
    });
  });
}

// 토글 버튼
document.getElementById("tidal-toggle-btn")?.addEventListener("click", () => {
  _tidalLayerOn = !_tidalLayerOn;
  const btn = document.getElementById("tidal-toggle-btn");
  const label = document.getElementById("tidal-toggle-label");
  if (_tidalLayerOn) {
    btn.style.background = "rgba(14,165,233,0.15)";
    btn.style.borderColor = "#0ea5e9";
    btn.style.color = "#0369a1";
    label.textContent = "조류 ON";
    refreshTidalLayer();
  } else {
    btn.style.background = "rgba(255,255,255,0.95)";
    btn.style.borderColor = "#cbd5e1";
    btn.style.color = "#374151";
    label.textContent = "조류";
    tidalSource.clear();
  }
});

// 지도 이동/줌 시 자동 갱신
map.on("moveend", () => { if (_tidalLayerOn) refreshTidalLayer(); });

// 1시간마다 자동 갱신 (데이터가 1시간 단위)
setInterval(() => {
  if (_tidalLayerOn) {
    _tidalDataCache.clear(); // 캐시 무효화 후 재조회
    refreshTidalLayer();
  }
}, 30 * 60 * 1000);

async function initLiveVesselSelect() {
  vesselNameInput.placeholder = "조회 중...";
  try {
    const vessels = await fetchOperatingVessels();
    liveVesselDataMap.clear();
    _liveVesselItems = vessels.map(v => {
      const label = `${v.psnshp_nm} | ${v.lcns_seawy_nm}${v.nvg_seawy_nm ? " · " + v.nvg_seawy_nm : ""} | ${sailTmToTime(v.sail_tm)} 출항`;
      liveVesselDataMap.set(v.key, v);
      return { label, key: v.key };
    });
    vesselNameInput.placeholder = `선박명 또는 운항선박 검색... (운항 ${vessels.length}척)`;
    // fetched_at 배지 표시
    if (_routeCacheFetchedAt) {
      vesselLastUpdateBadge.textContent = `갱신 ${_routeCacheFetchedAt.slice(11, 16)}`;
      vesselLastUpdateBadge.classList.remove("hidden");
    }
  } catch (e) {
    vesselNameInput.placeholder = "선박명 또는 운항선박 검색...";
    console.warn("운항 선박 조회 실패:", e);
  }
}

initLiveVesselSelect();
// 1분마다 캐시 갱신 + 선박 목록 자동 업데이트 + 항로도 갱신
setInterval(async () => {
  await initLiveVesselSelect();
  if (_activeVesselKey) await onLiveVesselSelect(_activeVesselKey);
}, 60_000);

// 모든 input 포커스 시 텍스트 전체 선택
document.addEventListener("focusin", e => {
  if (e.target.tagName === "INPUT" && e.target.type !== "checkbox" && e.target.type !== "radio") {
    e.target.select();
  }
});

// 필수 입력 항목 — 빈 상태: 연한 주황, 값 있으면 흰색
(function setupRequiredFields() {
  // accident-type-filter / suspected-cause-filter 는 표시용 텍스트 입력
  // 실제 값은 hidden input에 있지만 시각 표시는 filter input에 한다
  const REQUIRED_IDS = [
    "vessel-name",
    "lat-input",
    "lng-input",
    "weather-summary",
    "crew-count",
    "passenger-count",
    "vehicle-count",
    "delay-time",
    "accident-type-filter",
    "suspected-cause-filter",
  ];

  function updateRequired(input) {
    const empty = input.value.trim() === "";
    input.classList.toggle("required-empty", empty);
    input.classList.toggle("required-filled", !empty);
  }

  REQUIRED_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    updateRequired(el);
    el.addEventListener("input", () => updateRequired(el));
    el.addEventListener("change", () => updateRequired(el));
  });

  // suggestion으로 값 선택 시 filter input 값이 채워지면 갱신
  // MutationObserver로 value 변화 감지 (hidden input 쪽)
  [["accident-type", "accident-type-filter"], ["suspected-cause", "suspected-cause-filter"]].forEach(([hiddenId, filterId]) => {
    const hidden = document.getElementById(hiddenId);
    const filterEl = document.getElementById(filterId);
    if (!hidden || !filterEl) return;
    const obs = new MutationObserver(() => updateRequired(filterEl));
    obs.observe(hidden, { attributes: true, attributeFilter: ["value"] });
  });
})();


// 패널 접기/펼치기
const panelEl = document.querySelector(".panel");
const panelToggleBtn = document.getElementById("panel-toggle");
panelToggleBtn.addEventListener("click", () => {
  const collapsed = panelEl.classList.toggle("collapsed");
  panelToggleBtn.querySelector(".toggle-chevron").style.transform = collapsed ? "rotate(180deg)" : "";
});


// ── 실시간 WebSocket 동기화 ──────────────────────────────────────────────────
const _WS_FIELDS = [
  // 선박
  "vessel-name", "vessel-number", "vessel-type", "gross-tonnage",
  "registry-port", "nationality", "owner-name", "inspection-agency", "insurance-status",
  // 위치
  "lat-input", "lng-input",
  // 보고
  "report-datetime", "report-center",
  // 운항
  "operation-route", "departure-place-filter", "departure-place", "departure-time",
  "weather-summary", "crew-count", "passenger-count", "vehicle-count", "cargo-weight",
  // 피해/사고
  "human-damage", "pollution-damage", "ship-damage", "delay-time",
  "accident-type-filter", "accident-type", "suspected-cause-filter", "suspected-cause",
  "accident-note",
];

let _ws = null;
let _wsSyncing = false;
let _wsReconnectTimer = null;

function _wsCollectState() {
  const state = {};
  for (const id of _WS_FIELDS) {
    const el = document.getElementById(id);
    if (el) state[id] = el.value;
  }
  return state;
}

function _wsApplyState(state, skipSearch = false) {
  _wsSyncing = true;
  let latChanged = false;
  const prevLat = document.getElementById("lat-input")?.value;
  const prevLng = document.getElementById("lng-input")?.value;
  const incomingLat = state["lat-input"];
  const incomingLng = state["lng-input"];
  if (IS_VIEW_MODE && (incomingLat !== prevLat || incomingLng !== prevLng)) {
    console.log(`[뷰어 좌표변경] ${new Date().toLocaleTimeString()} | 이전: (${prevLat}, ${prevLng}) → 수신: (${incomingLat}, ${incomingLng}) | clientId: ${state._clientId || "없음"}`);
  }

  for (const [id, value] of Object.entries(state)) {
    const el = document.getElementById(id);
    if (!el || el.value === value) continue;
    el.value = value;
    // hidden input은 change 이벤트, 나머지는 input 이벤트
    const evt = el.type === "hidden" ? "change" : "input";
    el.dispatchEvent(new Event(evt, { bubbles: true }));
  }

  // 위도·경도가 바뀌었으면 자동으로 위치 검색 실행
  const newLat = state["lat-input"];
  const newLng = state["lng-input"];
  if (newLat && newLng && (newLat !== prevLat || newLng !== prevLng)) {
    latChanged = true;
  }
  _wsSyncing = false;

  if (latChanged && !skipSearch) {
    runSearch(); // runSearch 내부에서 updateReportPreview 호출
  } else if (IS_VIEW_MODE && latestNearestResult) {
    updateReportPreview(); // 좌표 변화 없이 선박명·기타 필드만 변경된 경우
  }
}

const _reporterClientId = Math.random().toString(36).slice(2);

function _wsBroadcast() {
  if (_wsSyncing) return;
  const state = _wsCollectState();
  state._clientId = _reporterClientId;
  if (_activeVesselKey) state._vesselKey = _activeVesselKey;
  fetch("/api/state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state),
  }).catch(() => {});
}

function _wsSetStatus(connected) {
  const dot = document.getElementById("ws-status-dot");
  const txt = document.getElementById("ws-status-text");
  if (dot) dot.className = "ws-dot " + (connected ? "online" : "offline");
  if (txt) txt.textContent = connected ? "실시간 연결됨" : "연결 끊김";
}

// _viewerFirstState를 _wsConnect 밖에 선언: 재연결 시 리셋되지 않도록
// (연결이 500ms 만에 끊겨도 runSearch 예약은 유지됨)
let _viewerFirstState = true;
let _viewerLockedClientId = null; // 뷰어가 수신을 허용하는 보고자 clientId
let _viewerLastVesselKey = null;
let _viewerRouteLastDrawn = 0; // 마지막으로 항로를 그린 시각 (ms)
const _VIEWER_ROUTE_THROTTLE = 60_000; // 60초에 1회만 재실행

function _viewerApplyRouteIfNeeded(data) {
  if (!IS_VIEW_MODE) return;
  const key = data._vesselKey;
  if (!key) return;
  const now = Date.now();
  // 같은 키이고 60초 이내면 스킵
  if (key === _viewerLastVesselKey && now - _viewerRouteLastDrawn < _VIEWER_ROUTE_THROTTLE) return;
  _viewerLastVesselKey = key;
  _viewerRouteLastDrawn = now;
  onLiveVesselSelect(key).catch(() => {});
}

function _wsConnect() {
  clearTimeout(_wsReconnectTimer);
  const proto = location.protocol === "https:" ? "wss:" : "ws:";
  _ws = new WebSocket(`${proto}//${location.host}`);

  _ws.onopen = () => {
    _wsSetStatus(true);
    console.log("[ws] connected");
    if (IS_VIEW_MODE) {
      // 뷰어: 서버에 state가 없을 경우를 대비해 보고자에게 state 요청
      setTimeout(() => {
        if (_ws && _ws.readyState === WebSocket.OPEN)
          _ws.send(JSON.stringify({ type: "request_state" }));
      }, 100);
    } else {
      // 보고자: 연결 즉시 현재 상태 전송 (뷰어가 받을 수 있도록)
      setTimeout(_wsBroadcast, 200);
    }
  };

  _ws.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);

      // 보고자: 뷰어의 state 요청 수신 → 즉시 현재 상태 전송
      if (msg.type === "request_state" && !IS_VIEW_MODE) {
        _wsBroadcast();
        return;
      }

      if (msg.type === "state" && msg.data) {
        if (IS_VIEW_MODE && _viewerFirstState) {
          // 뷰어 최초 수신: 좌표 변경 여부와 무관하게 runSearch 강제 실행
          _viewerFirstState = false;
          _wsApplyState(msg.data);
          const lat = parseFloat(msg.data["lat-input"]);
          const lng = parseFloat(msg.data["lng-input"]);
          if (!isNaN(lat) && !isNaN(lng)) {
            // 지도 크기 재계산 완료 후 실행 (연결 끊겨도 타이머는 유지됨)
            setTimeout(() => {
              if (typeof map !== "undefined") { map.updateSize(); map.renderSync(); }
              runSearch();
            }, 150);
          }
        } else {
          _wsApplyState(msg.data);
        }
      }
    } catch (_) {}
  };

  _ws.onclose = () => {
    _wsSetStatus(false);
    _wsReconnectTimer = setTimeout(_wsConnect, 3000);
  };

  _ws.onerror = () => _ws.close();
}

// ── 뷰어 모드 (?view 파라미터) ───────────────────────────────────────────────
const IS_VIEW_MODE = new URLSearchParams(location.search).has("view");

if (IS_VIEW_MODE) {
  document.body.classList.add("view-mode");

  const badge = document.getElementById("viewer-badge");
  if (badge) badge.classList.remove("hidden");

  document.addEventListener("DOMContentLoaded", () => {
    // 보고서 패널 강제 펼치기
    const overlay = document.getElementById("report-preview-overlay");
    if (overlay) {
      overlay.classList.remove("hidden", "collapsed");
      const btn = document.getElementById("toggle-report-button");
      if (btn) btn.setAttribute("aria-expanded", "true");
    }
    // CSS 레이아웃 변경 후 OpenLayers 지도 크기 재계산
    const _fixMapSize = () => {
      if (typeof map !== "undefined") {
        map.updateSize();
        map.renderSync();
        window.dispatchEvent(new Event("resize"));
      }
    };
    setTimeout(_fixMapSize, 50);
    setTimeout(_fixMapSize, 300);
    // URL에 lat/lng가 있으면 지도 크기 확정 후 runSearch 재실행
    const _urlParams = new URLSearchParams(location.search);
    const _urlLat = parseFloat(_urlParams.get("lat"));
    const _urlLng = parseFloat(_urlParams.get("lng"));
    if (!isNaN(_urlLat) && !isNaN(_urlLng)) {
      setTimeout(() => {
        _fixMapSize();
        // SSE state가 먼저 수신됐으면 URL 파라미터로 덮어쓰지 않음
        if (!_viewerFirstState) return;
        latInput.value = _urlLat.toFixed(6);
        lngInput.value = _urlLng.toFixed(6);
        runSearch();
      }, 500);
    } else {
      setTimeout(_fixMapSize, 800);
    }
  });
}

// ── SSE 뷰어 수신 (Railway WS 업스트림 차단 문제 우회) ───────────────────────
function _sseConnect() {
  const evtSource = new EventSource("/api/sse");

  evtSource.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);
      if (msg.type === "state" && msg.data) {
        const incomingId = msg.data._clientId;
        // 처음 수신한 clientId에 락 (이후 다른 clientId는 무시)
        if (!_viewerLockedClientId && incomingId) _viewerLockedClientId = incomingId;
        if (_viewerLockedClientId && (!incomingId || incomingId !== _viewerLockedClientId)) return;

        if (_viewerFirstState) {
          _viewerFirstState = false;
          _wsApplyState(msg.data, true);
          const lat = parseFloat(msg.data["lat-input"]);
          const lng = parseFloat(msg.data["lng-input"]);
          if (!isNaN(lat) && !isNaN(lng)) {
            setTimeout(() => {
              if (typeof map !== "undefined") { map.updateSize(); map.renderSync(); }
              runSearch();
              _viewerApplyRouteIfNeeded(msg.data);
            }, 150);
          }
        } else {
          _wsApplyState(msg.data);
          _viewerApplyRouteIfNeeded(msg.data);
        }
      }
    } catch (_) {}
  };

  evtSource.onerror = () => {
    // EventSource는 자동 재연결하므로 별도 처리 불필요
    console.log("[sse] reconnecting...");
  };
}

// ── 보고자용 화면 크기 조정 위젯 ──────────────────────────────────────────────
(function initReporterLayout() {
  const R = {
    PANEL_H: "reporter-panel-h",
    REPORT_W: "reporter-report-w",
    REPORT_ZOOM: "reporter-report-zoom",
  };

  function applyLayout(panelH, reportW, reportZoom) {
    const root = document.documentElement;
    if (panelH)     root.style.setProperty("--reporter-panel-h", panelH + "vh");
    if (reportW)    root.style.setProperty("--reporter-report-w", reportW + "px");
    if (reportZoom) {
      root.style.setProperty("--reporter-report-zoom", reportZoom / 100);
      const paper = document.querySelector(".report-paper");
      if (paper) paper.style.zoom = reportZoom / 100;
    }
  }

  // 저장된 값 즉시 적용
  const savedH    = localStorage.getItem(R.PANEL_H);
  const savedW    = localStorage.getItem(R.REPORT_W);
  const savedZoom = localStorage.getItem(R.REPORT_ZOOM);
  applyLayout(savedH, savedW, savedZoom);

  document.addEventListener("DOMContentLoaded", () => {
    if (IS_VIEW_MODE) return; // 뷰어에서는 표시 안 함

    const btn   = document.getElementById("reporter-layout-btn");
    const panel = document.getElementById("reporter-layout-panel");
    const slH   = document.getElementById("rlp-panel-h");
    const slW   = document.getElementById("rlp-report-w");
    const slZ   = document.getElementById("rlp-report-zoom");
    const valH  = document.getElementById("rlp-panel-h-val");
    const valW  = document.getElementById("rlp-report-w-val");
    const valZ  = document.getElementById("rlp-report-zoom-val");
    const saveBtn  = document.getElementById("rlp-save");
    const resetBtn = document.getElementById("rlp-reset");
    const savedMsg = document.getElementById("rlp-saved-msg");
    if (!btn || !panel) return;

    // 슬라이더 초기값 = 저장된 값 or 기본값
    slH.value = savedH    || 40;
    slW.value = savedW    || 840;
    slZ.value = savedZoom || 100;
    valH.textContent = slH.value;
    valW.textContent = slW.value;
    valZ.textContent = slZ.value;

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      panel.classList.toggle("hidden");
    });

    slH.addEventListener("input", () => {
      valH.textContent = slH.value;
      applyLayout(slH.value, null, null);
    });
    slW.addEventListener("input", () => {
      valW.textContent = slW.value;
      applyLayout(null, slW.value, null);
    });
    slZ.addEventListener("input", () => {
      valZ.textContent = slZ.value;
      applyLayout(null, null, slZ.value);
    });

    saveBtn.addEventListener("click", () => {
      localStorage.setItem(R.PANEL_H,    slH.value);
      localStorage.setItem(R.REPORT_W,   slW.value);
      localStorage.setItem(R.REPORT_ZOOM, slZ.value);
      savedMsg.textContent = "저장됨 ✓";
      setTimeout(() => { savedMsg.textContent = ""; }, 2500);
    });

    resetBtn.addEventListener("click", () => {
      Object.values(R).forEach(k => localStorage.removeItem(k));
      slH.value = 40; valH.textContent = 40;
      slW.value = 840; valW.textContent = 840;
      slZ.value = 100; valZ.textContent = 100;
      document.documentElement.style.removeProperty("--reporter-panel-h");
      document.documentElement.style.removeProperty("--reporter-report-w");
      document.documentElement.style.removeProperty("--reporter-report-zoom");
      const paper = document.querySelector(".report-paper");
      if (paper) paper.style.zoom = "";
      savedMsg.textContent = "초기화됨";
      setTimeout(() => { savedMsg.textContent = ""; }, 2000);
    });

    document.addEventListener("click", (e) => {
      if (!panel.contains(e.target) && e.target !== btn) {
        panel.classList.add("hidden");
      }
    });
  });
})();

// 뷰어 보고서 크기 적용 (report-sizer.html 연동)
function _applyViewerReportSize(zoomStr, panelWStr) {
  if (zoomStr) {
    const zoom = parseFloat(zoomStr);
    if (!isNaN(zoom)) {
      const paper = document.querySelector(".report-paper");
      if (paper) paper.style.zoom = zoom;
    }
  }
  if (panelWStr) {
    const w = parseInt(panelWStr);
    if (!isNaN(w)) {
      document.documentElement.style.setProperty("--viewer-panel-w", w + "px");
    }
  }
}

// 폼 필드 변경 시 브로드캐스트 등록
document.addEventListener("DOMContentLoaded", () => {
  if (IS_VIEW_MODE) {
    // 뷰어: SSE로 수신
    _sseConnect();
    _wsSetStatus(true); // 뷰어는 항상 "연결됨" 표시

    // 저장된 크기 설정 적용 (report-sizer.html에서 저장)
    _applyViewerReportSize(
      localStorage.getItem("viewer-report-zoom"),
      localStorage.getItem("viewer-panel-w")
    );

    // report-sizer.html에서 실시간 미리보기 postMessage 수신
    window.addEventListener("message", (e) => {
      if (e.data && e.data.type === "viewer-size-preview") {
        _applyViewerReportSize(
          e.data.zoom !== undefined ? String(e.data.zoom) : null,
          e.data.panelW !== undefined ? String(e.data.panelW) : null
        );
      }
    });
  } else {
    // 보고자: HTTP POST로 state 전송 (Railway WS 업스트림 차단 우회)
    _wsSetStatus(true);
    for (const id of _WS_FIELDS) {
      const el = document.getElementById(id);
      if (!el) continue;
      el.addEventListener("input", _wsBroadcast);
      el.addEventListener("change", _wsBroadcast);
    }
    // 30초마다 자동 재전송 + 초기 전송
    setTimeout(_wsBroadcast, 500);
    setInterval(_wsBroadcast, 30000);
  }
});
