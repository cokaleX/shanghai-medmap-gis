# 沪医空间——上海社区医疗设施空间数据治理与地图服务项目



英文名称：Shanghai MedMap

在线演示：[https://cokalex.github.io/shanghai-medmap-gis/](https://cokalex.github.io/shanghai-medmap-gis/)

源码仓库：[https://github.com/cokaleX/shanghai-medmap-gis](https://github.com/cokaleX/shanghai-medmap-gis)



## 项目简介



这是一个面向GIS全流程学习的个人实践项目。项目计划围绕上海小范围研究区域，使用开放空间数据完成数据获取、质量检查、字段标准化、空间数据库管理、地图服务发布和基础WebGIS展示。



本项目不用于医疗诊断、医疗决策或医院质量评价。

公开网页采用静态GeoJSON演示，不直接连接本机PostGIS或GeoServer；本地完整模式仍通过GeoServer提供WMS和GetFeatureInfo服务。



## 研究区域



以上海徐家汇站公共坐标为中心，已建立3千米 × 3千米、9平方公里的方形研究区域。研究区采用EPSG:32651，不涉及个人家庭住址。



## 计划技术路线



OpenStreetMap → QGIS → GeoPackage → PostgreSQL/PostGIS → GeoServer → OpenLayers



## 当前进度



- 当前阶段：阶段7——正在进行测试、整理和发布

- 已确认QGIS和Git环境

- 已创建QGIS项目

- QGIS项目坐标系：EPSG:32651

- 已创建研究区边界GeoPackage

- 已验证研究区包含1个面要素，面积为9平方公里

- 已获取医院、诊所、药店和道路OSM原始数据

- 已记录查询条件、数据许可和初步质量检查结果

- 已完成研究区裁剪、坐标转换、几何检查、重复检查和字段标准化

- 已生成医院、诊所、药店和道路线标准GeoPackage

- 已安装并验证PostgreSQL 18.4与PostGIS 3.6.2

- 已创建项目数据库 `huyi_space` 和 `processed` schema

- 已将四个标准成果导入PostGIS，并验证记录数、字段类型、SRID、几何类型和索引

- 已完成设施分类统计、空值检查、1千米范围查询和设施到最近道路查询

- 已使用 `EXPLAIN (ANALYZE, BUFFERS)` 对比GiST最近邻索引与全量距离排序

- 已生成并验证可重复执行的只读SQL脚本

- 已安装并验证Temurin JDK 17与GeoServer 3.0.0

- 已使用只读数据库账号发布医院、诊所、药店和道路图层

- 已验证WMS图片服务、WFS矢量服务和QGIS客户端空间对齐

- 已创建可版本控制的SLD样式及医疗设施组合图层组

- 已安装并验证Node.js、npm和Vite前端开发环境

- 已创建原生JavaScript与OpenLayers Web地图项目

- 已加载EPSG:3857的OSM底图，并定位到徐家汇研究区

- 已接入道路、医院、诊所和药店四个GeoServer WMS图层

- 已实现独立图层开关、全部显示和全部隐藏功能

- 已实现基于 `road_class` 和GeoServer `CQL_FILTER` 的可折叠道路分组多选筛选

- 已通过Vite开发代理解决浏览器跨域访问GeoServer的问题

- 已实现医院、诊所和药店WMS图层的点击属性查询

- 已加载研究区GeoJSON边界，并明确展示9平方公里数据处理范围

- 已使用OpenLayers `Overlay` 实现桌面端坐标气泡和窄屏底部属性卡

- 已加入真实设施数量、OSM获取日期和数据完整性说明

- 已验证WMS请求参数、地图拖动缩放、响应式布局和正式构建

- 已将四类标准成果导出为EPSG:4326 GeoJSON，并完成字段、记录数和几何类型复核

- 已实现本地GeoServer服务模式与GitHub Pages静态演示模式自动切换

- 已验证静态模式的图层显示、道路筛选、设施气泡、响应式布局和生产构建

- 已使用GitHub Actions自动构建并发布GitHub Pages静态演示

- 已增加基于项目道路GeoJSON的简洁底图兜底，在线OSM瓦片不可用时仍可浏览核心空间成果

- 已将720px以下图层面板改为默认收起的移动端抽屉

- 已接入天地图矢量底图与中文注记，并保留OpenStreetMap和项目道路简图两级备选

- 已将本地天地图密钥与Git仓库隔离，并为GitHub Pages构建预留Actions Secret注入方式



## WebGIS运行模式



- 本地完整模式：启动GeoServer后在 `web` 目录执行 `npm run dev`，通过WMS显示图层并使用GetFeatureInfo查询属性。

- 静态演示模式：访问本地页面时添加 `?mode=static`，直接加载 `web/public/data` 中的GeoJSON；部署到非本机域名后会自动使用此模式。

- 配置 `VITE_TIANDITU_TOKEN` 后默认使用天地图矢量底图与中文注记；图层面板可切换为OpenStreetMap或项目道路简图。

- 本地开发密钥保存在不进入Git的 `web/.env.local`；`web/.env.example` 只保留变量名称，不包含真实密钥。

- GitHub Pages通过仓库Actions Secret `VITE_TIANDITU_TOKEN` 注入生产密钥；生产密钥仅允许正式演示域名，本地域名只在测试时临时放行。

- 可使用 `?basemap=tianditu`、`?basemap=osm` 或 `?basemap=local` 指定底图；没有天地图密钥时自动退回OpenStreetMap。

- 720px以下页面默认只显示“图层”按钮，需要时打开抽屉，关闭后地图恢复完整可视区域。

- `web/vite.config.js` 使用相对构建路径，使生产成果可以发布在GitHub Pages的仓库子路径下。

- 静态演示用于作品展示和基础交互，不代表PostGIS与GeoServer后端已经部署到公网。



## 项目说明



本项目是本人在指导下逐步完成的第一个完整GIS学习项目。项目将保留数据来源、处理步骤、质量检查结果和验证记录，并如实说明AI辅助的范围。

