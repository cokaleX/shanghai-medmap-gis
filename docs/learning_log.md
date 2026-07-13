# 沪医空间学习日志



## 2026-07-12：建立项目和确认基础环境



### 本次完成



- 确定项目名称为“沪医空间——上海社区医疗设施空间数据治理与地图服务项目”。

- 确定以上海徐家汇公共地标为中心，建立约3千米 × 3千米的研究区域。

- 将项目根目录确定为D盘，避免后续空间数据占满C盘。

- 创建QGIS项目 `qgis/shanghai_medmap.qgz`。

- 将QGIS项目坐标系设置为EPSG:32651。

- 在D盘项目根目录初始化Git仓库。

- 创建项目README。



### 本次理解



- EPSG:32651使用米作为坐标单位，适合在上海地区进行距离和面积计算。

- Git用于记录本地项目版本，GitHub是以后用于在线保存和展示仓库的平台。

- Git状态中的 `??` 表示文件尚未纳入版本跟踪，不是报错。

- Markdown中的 `#` 表示标题，`-` 表示列表；在符号前添加反斜杠会取消Markdown格式。



### 环境检查结果



- QGIS 4.0.1：已安装并验证可运行。

- QuickOSM 2.5.3：已安装。

- Git 2.53.0：已安装。

- PostgreSQL/PostGIS：当前未安装，阶段3再处理。

- Java和GeoServer：当前未安装，阶段5再处理。

- Node.js：当前未安装，阶段6再处理。



### 验证结果



- QGIS项目文件存在且可以读取。

- QGIS项目主坐标系为EPSG:32651。

- Git仓库根目录位于D盘。

- Git当前分支为main。

- README文件名、UTF-8编码和Markdown格式正确。



### 遇到的问题及处理



1. 最初的Git仓库位于C盘，而QGIS项目保存到了D盘。

   - 处理方法：将D盘目录确定为正式项目根目录，并在D盘重新初始化Git仓库。



2. README中的Markdown符号前出现了多余反斜杠。

   - 处理方法：删除标题和列表符号前的反斜杠，并重新验证格式。

## 2026-07-12：建立徐家汇研究区边界

### 本次完成

- 添加OpenStreetMap在线参考底图，并区分参考底图与可分析矢量数据。
- 将徐家汇站公共坐标转换到EPSG:32651，得到中心坐标 `350637.76, 3452459.54`。
- 使用“创建网格”工具建立3千米 × 3千米方形研究区。
- 将研究区保存为 `data/interim/study_area_boundary.gpkg`。
- 添加 `area_name` 和 `area_km2` 字段。
- 设置无填充、红色0.8毫米描边的研究区样式。

### 本次理解

- 项目坐标系与底图坐标系可以不同，QGIS能够进行实时重投影。
- EPSG:3857适合网络瓦片显示，EPSG:32651适合本项目的米制距离和面积计算。
- GeoPackage中的 `fid` 是内部唯一编号，`id` 是创建网格工具生成的普通字段。
- GeoPackage的REAL字段不一定固定显示小数位，数值 `9` 与 `9.00` 在计算上相同。
- 能够从几何计算的面积应使用表达式生成，避免手工录入。

### 验证结果

- 图层格式：GeoPackage。
- 几何类型：Polygon。
- 要素数量：1。
- 图层坐标系：EPSG:32651。
- 边界范围：X为349137.76至352137.76，Y为3450959.54至3453959.54。
- 独立计算面积：9,000,000平方米，即9平方公里。
- `area_name` 为“徐家汇研究区”，`area_km2` 为数值9。

## 2026-07-12：获取第一批OSM原始数据

### 本次完成

- 使用QuickOSM和研究区图层范围查询医院、诊所、药店和道路。
- 分别保存点、线和面原始GeoPackage，保持EPSG:4326和原始OSM字段。
- 验证要素数量、几何类型、坐标系、OSM ID、分类标签和名称空值。
- 将查询条件、查询日期、边界框、输出文件和许可写入 `docs/data_source.md`。

### 本次理解

- QuickOSM查询结果中的点、线、面数量不能直接等于现实设施或道路数量。
- Overpass递归查询会返回构成路径和关系所需的辅助节点或辅助面。
- 判断对象是否属于目标类别，需要检查 `amenity` 或 `highway` 标签，而不能只看图层名称。
- 同一条现实道路可能由多个OSM way组成，因此线对象数量不是现实道路条数。
- 原始数据应保留WGS 84和原始字段，清洗、投影与裁剪结果应另存。

### 初步验证结果

- 医院面：15条，全部为 `amenity=hospital`，其中2条缺少名称。
- 诊所点：1条，为 `amenity=clinic`，只有英文名称。
- 药店点：6条，全部为 `amenity=pharmacy`，其中3条缺少名称。
- 道路线：1130条，包含18种 `highway` 类型，其中755条缺少名称。
- 道路面：5条，其中4条为步行区域，1条为递归返回的花园辅助面。

## 2026-07-12：完成第一版数据清洗与标准化

### 本次完成

- 将医院、诊所、药店和道路线转换为EPSG:32651。
- 使用研究区边界裁剪医院面和道路线。
- 检查几何有效性、来源ID、名称空值和完全重复几何。
- 为医疗设施建立统一的 `source_id`、`name`、`facility_type`、`address` 和 `source` 字段。
- 使用“重构字段”生成字段顺序和类型一致的标准成果。
- 为道路线生成 `road_class` 和 `length_m` 等标准字段。
- 创建 `docs/data_dictionary.md`。

### 本次理解

- 重投影改变坐标表达，不应改变OSM ID和属性记录。
- 裁剪会保留研究区内部几何并切掉边界外部分，因此记录数和总面积或长度可能变化。
- 外接矩形查询结果可能包含精确研究区外的对象，必须使用研究区面再次裁剪。
- 来源ID唯一、名称相同和几何相同是不同层次的重复检查。
- “重构字段”适合一次完成字段新增、删除、重命名、类型转换和排序，并生成新图层。
- 道路同名通常不代表重复，同一路名可能由多个OSM way组成。

### 标准成果验证

- 医院：14条MultiPolygon，2条名称缺失，10条地址缺失。
- 诊所：1条Point，名称和地址均非空。
- 药店：6条Point，3条名称缺失，4条地址缺失。
- 道路：1095条MultiLineString，18种道路类型，总长度约164.37公里。
- 所有标准成果均为EPSG:32651，来源ID唯一，几何有效且位于研究区内。

## 2026-07-13：建立PostgreSQL/PostGIS数据库并完成入库

### 本次完成

- 将PostgreSQL 18.4安装到D盘，并将数据库数据目录独立设置为 `D:\PostgreSQL\18\data`。
- 安装PostGIS 3.6.2，并验证PostgreSQL服务、5432端口、PostGIS扩展文件及PROJ、GDAL环境变量。
- 创建受限项目角色 `huyi_owner`、项目数据库 `huyi_space` 和 `processed` schema。
- 在 `huyi_space` 中启用PostGIS扩展。
- 从QGIS导入医院、诊所、药店和道路标准GeoPackage。
- 验证四张表的记录数、空几何、无效几何、SRID、几何类型、主键和空间索引。
- 删除导入产生的冗余 `fid`，将 `source_id` 和 `geom` 设置为非空，并为 `source_id` 添加唯一约束。
- 在QGIS中使用 `huyi_owner` 连接数据库并正常显示四张PostGIS图层。

### 本次理解

- PostgreSQL是数据库服务器，PostGIS是按数据库启用的空间扩展；安装PostGIS文件后仍需执行 `CREATE EXTENSION postgis`。
- `postgres` 是服务器超级管理员，日常QGIS连接应使用权限更小的项目角色。
- database、schema和table分别对应数据库实例中的项目容器、名称空间和数据表。
- `id` 是数据库内部主键，`source_id` 是外部来源标识，两者用途不同。
- `PRIMARY KEY` 自动保证非空和唯一；`UNIQUE` 用于约束其他候选唯一字段，必要时应另加 `NOT NULL`。
- B-tree适合编号、文本的精确匹配、范围和排序；GiST用于加速PostGIS空间关系查询。
- 事务中的多项结构修改只有在 `COMMIT` 后才整体生效，失败时可用 `ROLLBACK` 撤销。
- 图形客户端未响应不等于数据库任务失败，批量任务需要区分客户端显示开销与服务器执行状态。

### 入库验证结果

| 表 | 记录数 | 几何类型 | SRID | 主键 | 来源唯一约束 | 空间索引 |
|---|---:|---|---:|---|---|---|
| `processed.hospitals` | 14 | MultiPolygon | 32651 | `id` | `source_id` | GiST (`geom`) |
| `processed.clinics` | 1 | Point | 32651 | `id` | `source_id` | GiST (`geom`) |
| `processed.pharmacies` | 6 | Point | 32651 | `id` | `source_id` | GiST (`geom`) |
| `processed.roads` | 1095 | MultiLineString | 32651 | `id` | `source_id` | GiST (`geom`) |

- 四张表的空几何和无效几何均为0。
- 道路零长度记录为0；属性总长度为164366.46米，按PostGIS几何重算为164366.37米，差异来自小数舍入。
- QGIS项目未保存数据库用户名或明文密码。

### 遇到的问题及处理

1. 安装前本机只有Anaconda附带的 `pg_config` 开发组件，没有PostgreSQL服务器。
   - 处理方法：先只读检查服务、程序、端口和客户端，再安装完整的PostgreSQL 18.4。
2. PostGIS安装器可自动创建空间数据库和允许外部栅格访问。
   - 处理方法：取消自动建库和Out-db Raster，手动创建项目数据库并显式启用扩展。
3. QGIS导入GeoPackage时同时生成了PostgreSQL主键 `id` 并复制了文件内部 `fid`。
   - 处理方法：验证 `source_id` 非空且唯一后，删除冗余 `fid`，保留内部主键和外部来源标识的双标识结构。

## 2026-07-13：完成基础SQL与PostGIS空间查询

### 本次完成

- 使用 `SELECT`、`FROM`、`ORDER BY` 和 `LIMIT` 读取医院字段。
- 使用 `WHERE name IS NULL` 查询名称缺失记录，并区分NULL、空字符串和纯空格文本。
- 使用 `GROUP BY` 统计18种道路分类的OSM线要素数量。
- 使用 `UNION ALL` 跨表统计医院、诊所和药店数量。
- 使用 `ST_DWithin` 查询徐家汇中心点1千米范围内的医疗设施。
- 使用 `LATERAL`、GiST最近邻运算符 `<->` 和 `ST_Distance` 查询诊所到最近道路的直线距离。
- 使用 `EXPLAIN (ANALYZE, BUFFERS)` 对比空间索引搜索与全量距离排序。
- 创建并完整执行 `sql/01_basic_and_spatial_queries.sql`，全过程无错误。

### 本次理解

- `NULL` 表示未知或缺失，不能使用 `= NULL` 判断；空字符串是另一种实际文本值。
- `GROUP BY` 对相同字段值分组，`COUNT(*)` 统计的是每组记录数。
- `UNION ALL` 保留所有输入记录；`UNION` 会去重，不适合直接用于设施数量拼接统计。
- EPSG:32651的坐标单位是米，因此空间距离参数可以直接使用米。
- 医院面到指定点的距离是点到面的最短距离，不等同于医院质心或入口距离。
- `<->` 可利用GiST索引寻找最近候选对象，`ST_Distance` 用于输出精确距离。
- `EXPLAIN` 中的cost是优化器内部估算，不是毫秒；实际耗时应查看 `Execution Time`。
- 小表使用顺序扫描可能比索引更合理，出现 `Seq Scan` 不等于索引失效。

### 查询验证结果

- 医院名称为NULL：2条；空字符串和纯空格名称均为0条。
- 医疗设施数量：医院14、诊所1、药店6。
- 徐家汇中心1千米内设施：5个。
- `western eye center` 到最近道路永嘉路的直线距离：53.4米。
- 最近邻索引查询读取4个缓存页，执行时间0.076毫秒。
- 全量距离计算读取33个缓存页和1095条道路，首次对比执行时间0.357毫秒。
- 完整脚本复验中，全量距离排序执行时间0.495毫秒；运行过程无ERROR。

## 2026-07-13：使用GeoServer发布地图服务

### 本次完成

- 安装并验证Eclipse Temurin JDK 17.0.19+10，设置系统级 `JAVA_HOME` 和PATH。
- 下载并解压GeoServer 3.0.0 Platform Independent Binary，使用内置Jetty运行。
- 将程序目录与项目数据目录分离：程序位于 `D:\GeoServer\3.0.0`，配置位于 `D:\GeoServer\data_huyi_space`。
- 首次手动启动GeoServer，验证8080端口、HTTP 200响应、Web应用和独立数据目录。
- 修改默认GeoServer管理员密码。
- 创建 `huyi_space` 工作区和 `huyi_postgis` PostGIS数据存储。
- 创建只读数据库角色 `huyi_geoserver`，授予连接、schema使用和表查询权限，不授予写入权限。
- 发布医院、诊所、药店和道路四个图层，统一声明EPSG:32651。
- 通过WMS capabilities、WFS GeoJSON和QGIS客户端验证服务记录数、几何类型与空间对齐。
- 创建并应用医院、诊所、药店和道路SLD样式。
- 创建 `huyi_space:medical_facilities_map` 组合图层组。
- 使用 `shutdown.bat` 正常关闭GeoServer，验证端口关闭、Java进程退出和清理日志。

### 本次理解

- JDK提供Java运行环境和诊断工具；GeoServer 3.0支持Java 17和21，本项目选择官方推荐的Temurin 17 LTS。
- Platform Independent Binary自带Jetty，不需要另外安装Tomcat，适合初次学习时观察启动日志。
- GeoServer程序目录可以随版本替换，数据目录保存工作区、数据存储、样式、用户和服务配置，应独立维护且不进入Git。
- Workspace用于隔离项目名称空间；Store保存数据连接；Layer将数据表注册为可发布资源。
- GeoServer数据库账号应遵循最小权限原则，本项目发布账号只能SELECT，不能INSERT。
- WMS返回服务端渲染的地图图片，适合展示；WFS返回矢量几何与属性，适合查询和客户端分析。
- 工作区专属WMS使用短图层名，全局WMS使用 `workspace:layer` 完整名称。
- SLD控制地图符号，不修改PostGIS几何或属性；样式源文件应进入Git以便复现。
- 图层组按照列表顺序合成服务端地图，独立图层仍可分别请求。
- 正常停止服务应使用停止脚本，让Jetty和GeoServer完成清理，不应直接强制结束Java进程。

### 服务验证结果

| 图层 | WFS记录数 | 几何类型 | WMS CRS |
|---|---:|---|---|
| `huyi_space:hospitals` | 14 | MultiPolygon | EPSG:32651 |
| `huyi_space:clinics` | 1 | Point | EPSG:32651 |
| `huyi_space:pharmacies` | 6 | Point | EPSG:32651 |
| `huyi_space:roads` | 1095 | MultiLineString | EPSG:32651 |

- QGIS中的WMS、WFS与研究区边界和OSM底图对齐。
- 组合图层组为 `huyi_space:medical_facilities_map`，四类内容均可正常渲染。
- 800×800透明PNG GetMap请求返回HTTP 200。
- GeoServer数据目录和所有密码均不进入Git仓库。

### 遇到的问题及处理

1. GeoServer 3.0管理界面中没有旧教程所称的 `Layer Preview` 菜单。
   - 处理方法：根据3.0官方文档改用 `Browse Layers`，再从图层行点击OpenLayers。
2. 首次导入SLD时出现 `Field 'styleEditor' is required`。
   - 原因：只选择了本地文件，没有点击Upload将内容载入样式编辑器。
   - 处理方法：按 `Choose file → Upload → Validate → Save` 顺序操作。
3. GeoServer默认数据目录与程序目录位于同一版本文件夹。
   - 处理方法：复制为独立的 `D:\GeoServer\data_huyi_space`，通过 `GEOSERVER_DATA_DIR` 指定项目配置目录。

