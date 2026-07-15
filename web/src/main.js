import './style.css'
import 'ol/ol.css'

import OLMap from 'ol/Map.js'
import Overlay from 'ol/Overlay.js'
import View from 'ol/View.js'
import TileLayer from 'ol/layer/Tile.js'
import VectorLayer from 'ol/layer/Vector.js'
import OSM from 'ol/source/OSM.js'
import TileWMS from 'ol/source/TileWMS.js'
import VectorSource from 'ol/source/Vector.js'
import GeoJSON from 'ol/format/GeoJSON.js'
import ScaleLine from 'ol/control/ScaleLine.js'
import { defaults as defaultControls } from 'ol/control/defaults.js'
import { fromLonLat } from 'ol/proj.js'
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

document.querySelector('#app').innerHTML = `
  <header class="site-header">
    <div class="brand-block">
      <h1>沪医空间</h1>
      <span class="brand-divider" aria-hidden="true"></span>
      <p>徐家汇社区医疗设施空间数据治理与地图服务</p>
    </div>
    <div class="map-status" role="status" aria-live="polite">
      <span class="status-dot" aria-hidden="true"></span>
      <span id="status-text">地图服务加载中</span>
    </div>
  </header>
  <main class="map-shell">
    <div id="map" aria-label="徐家汇研究区交互地图"></div>
    <aside class="layer-panel" aria-labelledby="layer-panel-title">
      <div class="layer-panel__heading">
        <h2 id="layer-panel-title">图层与筛选</h2>
        <span>GeoServer WMS</span>
      </div>
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
        <p>数据来源：OpenStreetMap · <time datetime="2026-07-12">2026-07-12</time></p>
        <p>数量仅反映获取时已标注对象</p>
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

const geoserverWmsUrl = '/geoserver/huyi_space/wms'
const osmSource = new OSM()
const wmsSources = new globalThis.Map()
const overlayLayers = new globalThis.Map()

for (const definition of layerDefinitions) {
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
    url: '/data/study_area.geojson',
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

const map = new OLMap({
  target: 'map',
  layers: [
    new TileLayer({ source: osmSource }),
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

async function queryVisibleFacilityLayers(coordinate, view) {
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
      return features[0]
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
    const feature = await queryVisibleFacilityLayers(
      event.coordinate,
      view,
    )

    if (!feature) {
      featureInfoTitle.textContent = '设施属性'
      featureInfoMessage.textContent = '该位置未查询到医疗设施'
      featureInfoMessage.hidden = false
      featureInfoDetails.hidden = true
      return
    }

    const properties = feature.properties

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
const roadsSource = wmsSources.get('roads')
const allRoadClassCount = roadGroupDefinitions.reduce(
  (total, group) => total + group.classes.length,
  0,
)

function updateRoadFilter() {
  const selectedRoadClasses = roadGroupCheckboxes.flatMap((checkbox) => {
    if (!checkbox.checked) {
      return []
    }

    const group = roadGroupDefinitions.find(
      ({ id }) => id === checkbox.dataset.roadGroup,
    )
    return group.classes
  })

  let cqlFilter = 'EXCLUDE'

  if (selectedRoadClasses.length === allRoadClassCount) {
    cqlFilter = 'INCLUDE'
  } else if (selectedRoadClasses.length > 0) {
    const values = selectedRoadClasses
      .map((roadClass) => `'${roadClass}'`)
      .join(', ')
    cqlFilter = `road_class IN (${values})`
  }

  roadsSource.updateParams({ CQL_FILTER: cqlFilter })
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
const loadedWmsLayers = new Set()

for (const [id, source] of wmsSources) {
  source.on('tileloadend', () => {
    loadedWmsLayers.add(id)
    if (loadedWmsLayers.size === layerDefinitions.length) {
      status.classList.remove('is-error')
      statusText.textContent = '地图服务已加载'
    }
  })

  source.on('tileloaderror', () => {
    status.classList.add('is-error')
    statusText.textContent = 'GeoServer 图层异常'
  })
}

window.addEventListener('resize', () => map.updateSize())
