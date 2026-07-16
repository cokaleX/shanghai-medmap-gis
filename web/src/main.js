import './style.css'
import 'ol/ol.css'

import OLMap from 'ol/Map.js'
import Overlay from 'ol/Overlay.js'
import View from 'ol/View.js'
import TileLayer from 'ol/layer/Tile.js'
import VectorLayer from 'ol/layer/Vector.js'
import OSM from 'ol/source/OSM.js'
import TileWMS from 'ol/source/TileWMS.js'
import XYZ from 'ol/source/XYZ.js'
import VectorSource from 'ol/source/Vector.js'
import GeoJSON from 'ol/format/GeoJSON.js'
import ScaleLine from 'ol/control/ScaleLine.js'
import { defaults as defaultControls } from 'ol/control/defaults.js'
import { fromLonLat } from 'ol/proj.js'
import CircleStyle from 'ol/style/Circle.js'
import RegularShape from 'ol/style/RegularShape.js'
import { Fill, Stroke, Style } from 'ol/style.js'

const layerDefinitions = [
  { id: 'roads', label: '道路', color: '#7d858d' },
  { id: 'hospitals', label: '医院', color: '#b82f2f' },
  { id: 'clinics', label: '诊所', color: '#267aa6' },
  { id: 'pharmacies', label: '药店', color: '#3e8b63' },
]

const roadGroupDefinitions = [
  {
    id: 'major',
    label: '主干道路',
    classes: [
      'trunk',
      'trunk_link',
      'primary',
      'primary_link',
      'secondary',
      'secondary_link',
      'tertiary',
    ],
  },
  {
    id: 'community',
    label: '社区道路',
    classes: ['residential', 'living_street', 'unclassified'],
  },
  {
    id: 'active',
    label: '慢行道路',
    classes: ['footway', 'pedestrian', 'cycleway', 'path', 'steps'],
  },
  {
    id: 'service',
    label: '服务道路',
    classes: ['service'],
  },
  {
    id: 'planned',
    label: '规划／施工道路',
    classes: ['planned', 'construction'],
  },
]

const queryParameters = new URLSearchParams(window.location.search)
const requestedDataMode = queryParameters.get('mode')
const localHostnames = new Set(['localhost', '127.0.0.1', '::1', '[::1]'])
const useStaticData =
  requestedDataMode === 'static' ||
  (requestedDataMode !== 'service' && !localHostnames.has(window.location.hostname))
const dataSourceLabel = useStaticData ? '静态 GeoJSON' : 'GeoServer WMS'
const initialStatusText = useStaticData ? '静态数据加载中' : '地图服务加载中'
const publicDataUrl = (filename) => `${import.meta.env.BASE_URL}data/${filename}`
const tiandituToken = (import.meta.env.VITE_TIANDITU_TOKEN || '').trim()
const availableBasemapIds = new Set(['tianditu', 'osm', 'local'])
const requestedBasemap = queryParameters.get('basemap')
const defaultBasemap = tiandituToken ? 'tianditu' : 'osm'
let activeBasemap = availableBasemapIds.has(requestedBasemap)
  ? requestedBasemap
  : defaultBasemap

if (activeBasemap === 'tianditu' && !tiandituToken) {
  activeBasemap = 'osm'
}

let selectedRoadClasses = new Set(
  roadGroupDefinitions.flatMap((group) => group.classes),
)

const hospitalStyle = new Style({
  fill: new Fill({ color: 'rgba(217, 75, 75, 0.55)' }),
  stroke: new Stroke({ color: '#8F1D2C', width: 1.4 }),
})

const clinicStyle = new Style({
  image: new CircleStyle({
    radius: 5,
    fill: new Fill({ color: '#2F80ED' }),
    stroke: new Stroke({ color: '#FFFFFF', width: 1.3 }),
  }),
})

const pharmacyStyle = new Style({
  image: new RegularShape({
    points: 4,
    radius: 5.5,
    angle: Math.PI / 4,
    fill: new Fill({ color: '#27AE60' }),
    stroke: new Stroke({ color: '#FFFFFF', width: 1.3 }),
  }),
})

const staticRoadStyleRules = [
  {
    classes: ['trunk', 'trunk_link', 'primary', 'primary_link'],
    color: '#E76F51',
    width: 3,
  },
  {
    classes: ['secondary', 'secondary_link', 'tertiary'],
    color: '#F4A261',
    width: 2.2,
  },
  {
    classes: ['residential', 'living_street', 'unclassified', 'service'],
    color: '#8D99AE',
    width: 1.2,
  },
  {
    classes: ['footway', 'pedestrian', 'steps', 'cycleway', 'path'],
    color: '#B8B8B8',
    width: 0.9,
    lineDash: [4, 3],
  },
  {
    classes: ['planned', 'construction'],
    color: '#9C6644',
    width: 1.4,
    lineDash: [6, 4],
  },
]

const staticRoadStyles = new globalThis.Map()

for (const rule of staticRoadStyleRules) {
  const style = new Style({
    stroke: new Stroke({
      color: rule.color,
      width: rule.width,
      lineDash: rule.lineDash,
      lineCap: 'round',
    }),
  })

  rule.classes.forEach((roadClass) => {
    staticRoadStyles.set(roadClass, style)
  })
}

const fallbackMajorRoadClasses = new Set([
  'trunk',
  'trunk_link',
  'primary',
  'primary_link',
  'secondary',
  'secondary_link',
  'tertiary',
])

const fallbackMajorRoadStyle = new Style({
  stroke: new Stroke({ color: '#c5beb3', width: 1.6, lineCap: 'round' }),
})

const fallbackLocalRoadStyle = new Style({
  stroke: new Stroke({ color: '#d7d1c8', width: 0.8, lineCap: 'round' }),
})

document.querySelector('#app').innerHTML = `
  <header class="site-header">
    <div class="brand-block">
      <h1>沪医空间</h1>
      <span class="brand-divider" aria-hidden="true"></span>
      <p>徐家汇社区医疗设施空间数据治理与地图服务</p>
    </div>
    <div class="map-status" role="status" aria-live="polite">
      <span class="status-dot" aria-hidden="true"></span>
      <span id="status-text">${initialStatusText}</span>
    </div>
  </header>
  <main class="map-shell">
    <div id="map" aria-label="徐家汇研究区交互地图"></div>
    <button
      type="button"
      class="layer-panel-toggle"
      id="layer-panel-toggle"
      aria-controls="layer-panel"
      aria-expanded="false"
    >
      <span class="layer-panel-toggle__icon" aria-hidden="true"></span>
      图层
    </button>
    <aside
      class="layer-panel"
      id="layer-panel"
      aria-labelledby="layer-panel-title"
    >
      <div class="layer-panel__heading">
        <div>
          <h2 id="layer-panel-title">图层与筛选</h2>
          <span>${dataSourceLabel}</span>
        </div>
        <button
          type="button"
          class="layer-panel__close"
          id="layer-panel-close"
          aria-label="关闭图层面板"
        >
          ×
        </button>
      </div>
      <fieldset class="basemap-selector">
        <legend>底图</legend>
        <label class="basemap-option">
          <input
            type="radio"
            name="basemap"
            data-basemap-id="tianditu"
            ${activeBasemap === 'tianditu' ? 'checked' : ''}
            ${tiandituToken ? '' : 'disabled'}
          >
          <span class="layer-symbol layer-symbol--tianditu" aria-hidden="true"></span>
          <span>天地图</span>
          ${tiandituToken ? '' : '<small>需配置密钥</small>'}
        </label>
        <label class="basemap-option">
          <input
            type="radio"
            name="basemap"
            data-basemap-id="osm"
            ${activeBasemap === 'osm' ? 'checked' : ''}
          >
          <span class="layer-symbol layer-symbol--basemap" aria-hidden="true"></span>
          <span>OpenStreetMap</span>
        </label>
        <label class="basemap-option">
          <input
            type="radio"
            name="basemap"
            data-basemap-id="local"
            ${activeBasemap === 'local' ? 'checked' : ''}
          >
          <span class="layer-symbol layer-symbol--local" aria-hidden="true"></span>
          <span>简洁底图</span>
        </label>
      </fieldset>
      <div class="layer-list">
        <label class="layer-control">
          <input
            type="checkbox"
            data-layer-id="study-area"
            checked
          >
          <span
            class="layer-symbol layer-symbol--boundary"
            aria-hidden="true"
          ></span>
          <span>研究区边界</span>
        </label>
        ${layerDefinitions.map((layer) => `
          <label class="layer-control">
            <input type="checkbox" data-layer-id="${layer.id}" checked>
            <span
              class="layer-symbol${layer.id === 'roads' ? ' layer-symbol--line' : ''}"
              style="--layer-color: ${layer.color}"
              aria-hidden="true"
            ></span>
            <span>${layer.label}</span>
          </label>
        `).join('')}
      </div>
      <details class="road-filter" open>
        <summary>道路分类筛选</summary>
        <div class="road-filter__content">
          <div class="road-filter__groups">
            ${roadGroupDefinitions.map((group) => `
              <label>
                <input
                  type="checkbox"
                  data-road-group="${group.id}"
                  checked
                >
                <span>${group.label}</span>
              </label>
            `).join('')}
          </div>
          <div class="road-filter__actions">
            <button type="button" id="road-filter-select-all">全选</button>
            <button type="button" id="road-filter-clear">清空</button>
          </div>
        </div>
      </details>
      <div class="layer-actions">
        <button
          type="button"
          class="layer-action"
          id="hide-all-layers"
        >
          全部隐藏
        </button>

        <button
          type="button"
          class="layer-action"
          id="show-all-layers"
        >
          全部显示
        </button>
      </div>
      <section class="data-overview" aria-labelledby="data-overview-title">
        <h3 id="data-overview-title">数据概览</h3>
        <dl>
          <div>
            <dt>研究区</dt>
            <dd>9 km²</dd>
          </div>
          <div>
            <dt>医院</dt>
            <dd>14</dd>
          </div>
          <div>
            <dt>诊所</dt>
            <dd>1</dd>
          </div>
          <div>
            <dt>药店</dt>
            <dd>6</dd>
          </div>
        </dl>
        <p>数据来源：© OpenStreetMap contributors · <time datetime="2026-07-12">2026-07-12</time></p>
        <p>数量仅反映获取时已标注对象</p>
        <p>在线底图不可用时显示项目道路简图</p>
      </section>
    </aside>
<aside
  class="feature-info"
  id="feature-info"
  aria-labelledby="feature-info-title"
  hidden
>
  <div class="feature-info__heading">
    <h2 id="feature-info-title">设施属性</h2>

    <button
      type="button"
      class="feature-info__close"
      id="feature-info-close"
      aria-label="关闭设施属性面板"
    >
      ×
    </button>
  </div>

  <p class="feature-info__message" id="feature-info-message"></p>

  <dl class="feature-info__details" id="feature-info-details" hidden>
    <div>
      <dt>设施类型</dt>
      <dd id="feature-type"></dd>
    </div>

    <div>
      <dt>来源编号</dt>
      <dd id="feature-source-id"></dd>
    </div>

    <div>
      <dt>数据来源</dt>
      <dd id="feature-source"></dd>
    </div>
  </dl>
</aside>
  </main>
`

const layerPanel = document.querySelector('#layer-panel')
const layerPanelToggle = document.querySelector('#layer-panel-toggle')
const layerPanelClose = document.querySelector('#layer-panel-close')
const mobileLayerPanelQuery = window.matchMedia('(max-width: 720px)')

function setLayerPanelOpen(open) {
  if (!mobileLayerPanelQuery.matches) {
    layerPanel.classList.remove('is-open')
    layerPanel.removeAttribute('aria-hidden')
    layerPanel.inert = false
    layerPanelToggle.setAttribute('aria-expanded', 'false')
    return
  }

  layerPanel.classList.toggle('is-open', open)
  layerPanel.setAttribute('aria-hidden', String(!open))
  layerPanel.inert = !open
  layerPanelToggle.setAttribute('aria-expanded', String(open))
}

layerPanelToggle.addEventListener('click', () => {
  setLayerPanelOpen(!layerPanel.classList.contains('is-open'))
})

layerPanelClose.addEventListener('click', () => setLayerPanelOpen(false))

mobileLayerPanelQuery.addEventListener('change', () => setLayerPanelOpen(false))

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && mobileLayerPanelQuery.matches) {
    setLayerPanelOpen(false)
    layerPanelToggle.focus()
  }
})

setLayerPanelOpen(false)

const geoserverWmsUrl = '/geoserver/huyi_space/wms'
const osmSource = new OSM()
const createTiandituSource = (layerCode) =>
  new XYZ({
    urls: Array.from(
      { length: 8 },
      (_, index) =>
        `https://t${index}.tianditu.gov.cn/DataServer?T=${layerCode}&x={x}&y={y}&l={z}&tk=${encodeURIComponent(tiandituToken)}`,
    ),
    attributions: '地图服务 © 国家地理信息公共服务平台 天地图',
    maxZoom: 18,
    transition: 180,
  })
const wmsSources = new globalThis.Map()
const staticSources = new globalThis.Map()
const overlayLayers = new globalThis.Map()

for (const definition of layerDefinitions) {
  if (useStaticData) {
    const source = new VectorSource({
      url: publicDataUrl(`${definition.id}.geojson`),
      format: new GeoJSON({
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
      }),
    })
    const style =
      definition.id === 'roads'
        ? (feature) => {
            const roadClass = feature.get('road_class')
            return selectedRoadClasses.has(roadClass)
              ? staticRoadStyles.get(roadClass)
              : null
          }
        : {
            hospitals: hospitalStyle,
            clinics: clinicStyle,
            pharmacies: pharmacyStyle,
          }[definition.id]

    staticSources.set(definition.id, source)
    overlayLayers.set(
      definition.id,
      new VectorLayer({ source, style, visible: true }),
    )
    continue
  }

  const source = new TileWMS({
    url: geoserverWmsUrl,
    params: {
      LAYERS: `huyi_space:${definition.id}`,
      TILED: true,
      FORMAT: 'image/png',
      TRANSPARENT: true,
    },
    serverType: 'geoserver',
    transition: 180,
  })

  wmsSources.set(definition.id, source)
  overlayLayers.set(definition.id, new TileLayer({ source, visible: true }))
}

const studyAreaLayer = new VectorLayer({
  source: new VectorSource({
    url: publicDataUrl('study_area.geojson'),
    format: new GeoJSON({
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857',
    }),
  }),
  style: new Style({
    fill: new Fill({
      color: 'rgba(184, 47, 47, 0.035)',
    }),
    stroke: new Stroke({
      color: 'rgba(184, 47, 47, 0.85)',
      width: 2,
    }),
  }),
  zIndex: 20,
})

overlayLayers.set('study-area', studyAreaLayer)

const fallbackBasemapLayer = useStaticData
  ? new VectorLayer({
      source: staticSources.get('roads'),
      style: (feature) =>
        fallbackMajorRoadClasses.has(feature.get('road_class'))
          ? fallbackMajorRoadStyle
          : fallbackLocalRoadStyle,
      zIndex: -2,
    })
  : null

const osmLayer = new TileLayer({
  source: osmSource,
  visible: activeBasemap === 'osm',
  zIndex: -1,
})

const tiandituVectorLayer = new TileLayer({
  source: createTiandituSource('vec_w'),
  visible: activeBasemap === 'tianditu',
  zIndex: -1,
})

const tiandituLabelLayer = new TileLayer({
  source: createTiandituSource('cva_w'),
  visible: activeBasemap === 'tianditu',
  zIndex: 0,
})

const map = new OLMap({
  target: 'map',
  layers: [
    ...(fallbackBasemapLayer ? [fallbackBasemapLayer] : []),
    osmLayer,
    tiandituVectorLayer,
    tiandituLabelLayer,
    ...layerDefinitions.map(({ id }) => overlayLayers.get(id)),
    studyAreaLayer,
  ],
  view: new View({
    center: fromLonLat([121.43231, 31.19669]),
    zoom: 14.5,
  }),
  controls: defaultControls().extend([
    new ScaleLine({ units: 'metric', bar: true, steps: 2, text: true, minWidth: 110 }),
  ]),
})

function setBasemap(basemapId) {
  const nextBasemap =
    basemapId === 'tianditu' && !tiandituToken ? 'osm' : basemapId

  activeBasemap = nextBasemap
  tiandituVectorLayer.setVisible(nextBasemap === 'tianditu')
  tiandituLabelLayer.setVisible(nextBasemap === 'tianditu')
  osmLayer.setVisible(nextBasemap === 'osm')

  document.querySelectorAll('[data-basemap-id]').forEach((radio) => {
    radio.checked = radio.dataset.basemapId === nextBasemap
  })
}

document.querySelectorAll('[data-basemap-id]').forEach((radio) => {
  radio.addEventListener('change', (event) => {
    if (event.currentTarget.checked) {
      setBasemap(event.currentTarget.dataset.basemapId)
    }
  })
})

const featureInfoPanel = document.querySelector('#feature-info')
const featureInfoClose = document.querySelector('#feature-info-close')
const featureInfoTitle = document.querySelector('#feature-info-title')
const featureInfoMessage = document.querySelector('#feature-info-message')
const featureInfoDetails = document.querySelector('#feature-info-details')
const featureType = document.querySelector('#feature-type')
const featureSourceId = document.querySelector('#feature-source-id')
const featureSource = document.querySelector('#feature-source')

const featureInfoOverlay = new Overlay({
  element: featureInfoPanel,
  positioning: 'bottom-center',
  offset: [0, -16],
  autoPan: {
    animation: {
      duration: 200,
    },
    margin: 24,
  },
  className: 'ol-overlay-container ol-selectable facility-overlay',
  stopEvent: true,
})

map.addOverlay(featureInfoOverlay)

featureInfoClose.addEventListener('click', () => {
  featureInfoPanel.hidden = true
  featureInfoOverlay.setPosition(undefined)
})

async function queryFeaturesAtCoordinate(source, coordinate, view) {
  const featureInfoUrl = source.getFeatureInfoUrl(
    coordinate,
    view.getResolution(),
    view.getProjection(),
    {
      INFO_FORMAT: 'application/json',
      FEATURE_COUNT: 5,
      FI_POINT_TOLERANCE: 10,
    },
  )

  if (!featureInfoUrl) {
    return []
  }

  const response = await fetch(featureInfoUrl)

  if (!response.ok) {
    throw new Error(`GetFeatureInfo请求失败：${response.status}`)
  }

  const data = await response.json()
  return data.features
}

const facilityLayerIds = ['clinics', 'pharmacies', 'hospitals']

const facilityTypeLabels = {
  clinic: '诊所',
  pharmacy: '药店',
  hospital: '医院',
}

async function queryVisibleServiceFacilityLayers(coordinate, view) {
  for (const id of facilityLayerIds) {
    const layer = overlayLayers.get(id)

    if (!layer.getVisible()) {
      continue
    }

    const features = await queryFeaturesAtCoordinate(
      wmsSources.get(id),
      coordinate,
      view,
    )

    if (features.length > 0) {
      return features[0].properties
    }
  }

  return null
}

function queryVisibleStaticFacilityLayers(pixel) {
  for (const id of facilityLayerIds) {
    const layer = overlayLayers.get(id)

    if (!layer.getVisible()) {
      continue
    }

    const feature = map.forEachFeatureAtPixel(
      pixel,
      (candidate) => candidate,
      {
        layerFilter: (candidateLayer) => candidateLayer === layer,
        hitTolerance: 10,
      },
    )

    if (feature) {
      const properties = { ...feature.getProperties() }
      delete properties.geometry
      return properties
    }
  }

  return null
}

map.on('singleclick', async (event) => {
  const view = map.getView()

  featureInfoOverlay.setPosition(event.coordinate)
  featureInfoPanel.hidden = false
  featureInfoTitle.textContent = '设施属性'
  featureInfoMessage.textContent = '正在查询…'
  featureInfoMessage.hidden = false
  featureInfoDetails.hidden = true

  try {
    const properties = useStaticData
      ? queryVisibleStaticFacilityLayers(event.pixel)
      : await queryVisibleServiceFacilityLayers(event.coordinate, view)

    if (!properties) {
      featureInfoTitle.textContent = '设施属性'
      featureInfoMessage.textContent = '该位置未查询到医疗设施'
      featureInfoMessage.hidden = false
      featureInfoDetails.hidden = true
      return
    }

    featureInfoTitle.textContent = properties.name || '未命名医疗设施'
    featureType.textContent =
      facilityTypeLabels[properties.facility_type] ||
      properties.facility_type ||
      '—'
    featureSourceId.textContent = properties.source_id || '—'
    featureSource.textContent = properties.source || '—'

    featureInfoMessage.hidden = true
    featureInfoDetails.hidden = false
  } catch (error) {
    featureInfoTitle.textContent = '设施属性'
    featureInfoMessage.textContent = '医疗设施属性查询失败'
    featureInfoMessage.hidden = false
    featureInfoDetails.hidden = true
    console.error('医疗设施属性查询失败：', error)
  }
})

document.querySelectorAll('[data-layer-id]').forEach((checkbox) => {
  checkbox.addEventListener('change', (event) => {
    const layer = overlayLayers.get(event.currentTarget.dataset.layerId)
    layer.setVisible(event.currentTarget.checked)
  })
})

const roadGroupCheckboxes = [
  ...document.querySelectorAll('[data-road-group]'),
]
const allRoadClassCount = roadGroupDefinitions.reduce(
  (total, group) => total + group.classes.length,
  0,
)

function updateRoadFilter() {
  selectedRoadClasses = new Set(
    roadGroupCheckboxes.flatMap((checkbox) => {
      if (!checkbox.checked) {
        return []
      }

      const group = roadGroupDefinitions.find(
        ({ id }) => id === checkbox.dataset.roadGroup,
      )
      return group.classes
    }),
  )

  if (useStaticData) {
    overlayLayers.get('roads').changed()
    return
  }

  let cqlFilter = 'EXCLUDE'

  if (selectedRoadClasses.size === allRoadClassCount) {
    cqlFilter = 'INCLUDE'
  } else if (selectedRoadClasses.size > 0) {
    const values = [...selectedRoadClasses]
      .map((roadClass) => `'${roadClass}'`)
      .join(', ')
    cqlFilter = `road_class IN (${values})`
  }

  wmsSources.get('roads').updateParams({ CQL_FILTER: cqlFilter })
}

roadGroupCheckboxes.forEach((checkbox) => {
  checkbox.addEventListener('change', updateRoadFilter)
})

document.querySelector('#road-filter-select-all').addEventListener('click', () => {
  roadGroupCheckboxes.forEach((checkbox) => {
    checkbox.checked = true
  })
  updateRoadFilter()
})

document.querySelector('#road-filter-clear').addEventListener('click', () => {
  roadGroupCheckboxes.forEach((checkbox) => {
    checkbox.checked = false
  })
  updateRoadFilter()
})

const hideAllButton = document.querySelector('#hide-all-layers')

hideAllButton.addEventListener('click', () => {
  overlayLayers.forEach((layer) => {
    layer.setVisible(false)
  })

  document.querySelectorAll('[data-layer-id]').forEach((checkbox) => {
    checkbox.checked = false
  })
})

const showAllButton = document.querySelector('#show-all-layers')

showAllButton.addEventListener('click', () => {
  overlayLayers.forEach((layer) => {
    layer.setVisible(true)
  })

  document.querySelectorAll('[data-layer-id]').forEach((checkbox) => {
    checkbox.checked = true
  })
})

const status = document.querySelector('.map-status')
const statusText = document.querySelector('#status-text')
const loadedDataLayers = new Set()

if (useStaticData) {
  for (const [id, source] of staticSources) {
    source.on('featuresloadend', () => {
      loadedDataLayers.add(id)
      if (loadedDataLayers.size === layerDefinitions.length) {
        status.classList.remove('is-error')
        statusText.textContent = '静态演示数据已加载'
      }
    })

    source.on('featuresloaderror', () => {
      status.classList.add('is-error')
      statusText.textContent = '静态数据加载异常'
    })
  }
} else {
  for (const [id, source] of wmsSources) {
    source.on('tileloadend', () => {
      loadedDataLayers.add(id)
      if (loadedDataLayers.size === layerDefinitions.length) {
        status.classList.remove('is-error')
        statusText.textContent = '地图服务已加载'
      }
    })

    source.on('tileloaderror', () => {
      status.classList.add('is-error')
      statusText.textContent = 'GeoServer 图层异常'
    })
  }
}

const mapElement = map.getTargetElement()

function syncMapSize() {
  const { width, height } = mapElement.getBoundingClientRect()

  if (width > 0 && height > 0) {
    map.updateSize()
  }
}

const mapResizeObserver = new ResizeObserver(syncMapSize)
mapResizeObserver.observe(mapElement)

requestAnimationFrame(() => {
  requestAnimationFrame(syncMapSize)
})

window.addEventListener('load', syncMapSize, { once: true })
window.addEventListener('resize', syncMapSize)
