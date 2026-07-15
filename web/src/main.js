import './style.css'
import 'ol/ol.css'

import OLMap from 'ol/Map.js'
import View from 'ol/View.js'
import TileLayer from 'ol/layer/Tile.js'
import OSM from 'ol/source/OSM.js'
import TileWMS from 'ol/source/TileWMS.js'
import ScaleLine from 'ol/control/ScaleLine.js'
import { defaults as defaultControls } from 'ol/control/defaults.js'
import { fromLonLat } from 'ol/proj.js'

const layerDefinitions = [
  { id: 'roads', label: '道路', color: '#7d858d' },
  { id: 'hospitals', label: '医院', color: '#b82f2f' },
  { id: 'clinics', label: '诊所', color: '#267aa6' },
  { id: 'pharmacies', label: '药店', color: '#3e8b63' },
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
        <h2 id="layer-panel-title">图层</h2>
        <span>GeoServer WMS</span>
      </div>
<div class="road-filter">
  <label for="road-class-filter">道路分类</label>

<select id="road-class-filter">
  <option value="">全部道路</option>
  <option value="service">服务道路</option>
  <option value="footway">步行道</option>
  <option value="residential">居住区道路</option>
  <option value="primary">主要道路</option>
  <option value="tertiary">三级道路</option>
  <option value="secondary">次要道路</option>
  <option value="living_street">生活街道</option>
  <option value="steps">台阶</option>
  <option value="unclassified">未分类道路</option>
  <option value="pedestrian">步行街</option>
  <option value="trunk">干线道路</option>
  <option value="trunk_link">干线匝道</option>
  <option value="primary_link">主要道路匝道</option>
  <option value="planned">规划道路</option>
  <option value="construction">施工道路</option>
  <option value="cycleway">自行车道</option>
  <option value="path">小径</option>
  <option value="secondary_link">次要道路匝道</option>
</select>
</div>

      <div class="layer-list">
        ${layerDefinitions.map((layer) => `
          <label class="layer-control">
            <input type="checkbox" data-layer-id="${layer.id}" checked>
            <span class="layer-symbol" style="--layer-color: ${layer.color}" aria-hidden="true"></span>
            <span>${layer.label}</span>
          </label>
        `).join('')}
      </div>
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
    </aside>
  </main>
`

const geoserverWmsUrl = 'http://localhost:8080/geoserver/huyi_space/wms'
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

const map = new OLMap({
  target: 'map',
  layers: [
    new TileLayer({ source: osmSource }),
    ...layerDefinitions.map(({ id }) => overlayLayers.get(id)),
  ],
  view: new View({
    center: fromLonLat([121.43231, 31.19669]),
    zoom: 14.5,
  }),
  controls: defaultControls().extend([
    new ScaleLine({ units: 'metric', bar: true, steps: 2, text: true, minWidth: 110 }),
  ]),
})

document.querySelectorAll('[data-layer-id]').forEach((checkbox) => {
  checkbox.addEventListener('change', (event) => {
    const layer = overlayLayers.get(event.currentTarget.dataset.layerId)
    layer.setVisible(event.currentTarget.checked)
  })
})
const roadClassFilter = document.querySelector('#road-class-filter')

roadClassFilter.addEventListener('change', (event) => {
  const roadClass = event.currentTarget.value
  const roadsSource = wmsSources.get('roads')

  const cqlFilter = roadClass
    ? `road_class = '${roadClass}'`
    : 'INCLUDE'

  roadsSource.updateParams({
    CQL_FILTER: cqlFilter,
  })
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
