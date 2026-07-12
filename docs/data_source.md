# 数据来源记录

## 研究区

- 名称：徐家汇研究区
- 形状：3千米 × 3千米方形
- 面积：9平方公里
- 工作坐标系：EPSG:32651（WGS 84 / UTM zone 51N）
- 中心坐标（EPSG:32651）：`350637.76, 3452459.54`
- 投影边界：X为349137.76至352137.76，Y为3450959.54至3453959.54
- WGS 84边界框：西121.4167921，南31.1829724，东121.4478236，北31.2104147
- 边界文件：`data/interim/study_area_boundary.gpkg`

研究区中心使用徐家汇站公共坐标作为可复现参考，不代表测绘级站点坐标，也不涉及个人家庭住址。

## OSM查询001：医院

### 查询信息

- 查询日期：2026-07-12
- 数据来源：OpenStreetMap
- 查询工具：QGIS 4.0.1中的QuickOSM 2.5.3
- 查询接口：Overpass API，由QuickOSM当前服务器设置执行
- 查询范围：`study_area_boundary`图层范围
- 查询标签：`amenity=hospital`

### Overpass查询结构

```overpass
[out:xml][timeout:25];
(
  node["amenity"="hospital"]({{bbox}});
  way["amenity"="hospital"]({{bbox}});
  relation["amenity"="hospital"]({{bbox}});
);
(._;>;);
out body;
```

`{{bbox}}` 由QuickOSM在运行时替换为所选图层的范围。递归部分会返回构成路径和关系所需的辅助节点，因此QuickOSM点图层不能直接解释为医院数量。

### 原始输出

#### 查询返回节点

- 文件：`data/raw/osm_hospital_points_raw.gpkg`
- 图层：`hospital_points_raw`
- 几何类型：Point
- 坐标系：EPSG:4326
- 记录数：39
- 说明：这些记录没有 `amenity` 和 `name` 字段，样例包含 `entrance=yes`，主要是构成医院面的辅助节点，不能统计为39家医院。

#### 医院面对象

- 文件：`data/raw/osm_hospital_polygons_raw.gpkg`
- 图层：`hospital_polygons_raw`
- 几何类型：Multi Polygon
- 坐标系：EPSG:4326
- 记录数：15
- `amenity=hospital`：15条
- `osm_type=way`：15条
- OSM ID非空且唯一：15条
- 名称非空：13条
- 名称为空：2条

Overpass按边界框选择对象后会返回完整几何，因此个别医院面可能延伸到研究区边界之外。后续处理阶段需要按研究区边界检查和裁剪，不能只根据输出图层范围判断查询范围错误。

## OSM查询002：诊所

### 查询信息

- 查询日期：2026-07-12
- 数据来源：OpenStreetMap
- 查询工具：QGIS 4.0.1中的QuickOSM 2.5.3
- 查询范围：`study_area_boundary`图层范围
- 查询标签：`amenity=clinic`

### 原始输出

- 文件：`data/raw/osm_clinic_points_raw.gpkg`
- 图层：`clinic_points_raw`
- 几何类型：Point
- 坐标系：EPSG:4326
- 记录数：1
- OSM ID：`6467392385`
- OSM类型：`node`
- `amenity=clinic`：1条
- 默认 `name` 字段：不存在
- 英文名称 `name:en`：`western eye center`
- 地址：永嘉路4号

该对象具有明确的 `amenity=clinic` 标签，可以认定为OSM诊所对象。后续标准化时可以保留英文名称，但不能在没有可靠来源时自行补造中文名称。

## OSM查询003：药店

### 查询信息

- 查询日期：2026-07-12
- 数据来源：OpenStreetMap
- 查询工具：QGIS 4.0.1中的QuickOSM 2.5.3
- 查询范围：`study_area_boundary`图层范围
- 查询标签：`amenity=pharmacy`

### 原始输出

- 文件：`data/raw/osm_pharmacy_points_raw.gpkg`
- 图层：`pharmacy_points_raw`
- 几何类型：Point
- 坐标系：EPSG:4326
- 记录数：6
- `amenity=pharmacy`：6条
- `osm_type=node`：6条
- OSM ID非空且唯一：6条
- 名称非空：3条
- 名称为空：3条

6条记录都具有明确的 `amenity=pharmacy` 标签，可以认定为OSM药店点对象。名称完整率为50%，但名称为空不否定药店分类，后续不能自行补造名称。

## OSM查询004：道路

### 查询信息

- 查询日期：2026-07-12
- 数据来源：OpenStreetMap
- 查询工具：QGIS 4.0.1中的QuickOSM 2.5.3
- 查询范围：`study_area_boundary`图层范围
- 查询关键字：`highway`
- 查询值：所有具有 `highway` 标签的值

### 道路线原始输出

- 文件：`data/raw/osm_roads_lines_raw.gpkg`
- 图层：`roads_lines_raw`
- 几何类型：LineString
- 坐标系：EPSG:4326
- 记录数：1130
- OSM ID非空且唯一：1130条
- `highway`为空：0条
- `name`为空：755条
- 道路类型：18种
- 不完全位于研究区WGS 84边界框内的完整线段：155条

主要道路类型包括：`service` 433条、`footway` 186条、`residential` 116条、`primary` 84条、`tertiary` 77条、`secondary` 73条和 `living_street` 70条。道路在OSM中可能被拆成多个路径，因此1130条线对象不能直接解释为1130条现实道路。

### 道路面原始输出

- 文件：`data/raw/osm_roads_polygons_raw.gpkg`
- 图层：`roads_polygons_raw`
- 几何类型：MultiPolygon
- 坐标系：EPSG:4326
- 记录数：5
- OSM ID唯一：5条
- `highway=pedestrian`：4条
- `highway`为空：1条
- OSM类型：2条relation，3条way

`full_id=w899417895` 的记录没有 `highway` 标签，实际具有 `leisure=garden`，属于递归查询返回的辅助面，不能认定为道路面。其余4条为步行区域。

### 未保存的道路节点输出

QuickOSM还返回548个点对象，其中包含构成道路路径所需的辅助节点，也可能包含路口或信号灯等带 `highway` 标签的节点。本项目最小版本以道路线为分析对象，因此不把这548个点作为道路数量，也不将其作为正式道路原始图层保存。道路线几何已经保留了路径形状。

## 数据许可

Data © OpenStreetMap contributors, available under the Open Database License (ODbL).

- OpenStreetMap版权与许可：https://www.openstreetmap.org/copyright
- 原始数据文件保持不覆盖，后续清洗结果另存到 `data/processed`。

## 第一版标准成果

- `data/processed/hospitals_processed.gpkg`：14条医院面。
- `data/processed/clinics_processed.gpkg`：1条诊所点。
- `data/processed/pharmacies_processed.gpkg`：6条药店点。
- `data/processed/roads_processed.gpkg`：1095条道路线。

全部标准成果采用EPSG:32651。清洗过程包括重投影、研究区裁剪、几何有效性检查、来源ID检查、重复检查和字段标准化。字段定义见 `docs/data_dictionary.md`。
