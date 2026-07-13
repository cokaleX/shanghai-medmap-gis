# 数据字典

## 通用说明

- 处理后数据坐标系：EPSG:32651（WGS 84 / UTM zone 51N）
- 坐标单位：米
- 原始数据来源：OpenStreetMap
- 空文本统一保留为NULL，不在没有可靠来源时补造名称或地址。
- `source_id` 使用OSM完整ID，保留node、way或relation类型前缀。

## 医疗设施标准字段

适用图层：

- `data/processed/hospitals_processed.gpkg`
- `data/processed/clinics_processed.gpkg`
- `data/processed/pharmacies_processed.gpkg`

| 字段 | 类型 | 长度 | 含义 | 示例或规则 |
|---|---|---:|---|---|
| `source_id` | Text | 30 | 跨OSM对象类型唯一的来源编号 | `w294625595`、`n6467392385` |
| `osm_id` | Text | 30 | OSM数字ID | 保留为文本，避免大整数兼容问题 |
| `osm_type` | Text | 10 | OSM对象类型 | `node`、`way`、`relation` |
| `name` | Text | 150 | 设施名称 | 缺失时保留NULL |
| `facility_type` | Text | 20 | 统一设施分类 | `hospital`、`clinic`、`pharmacy` |
| `address` | Text | 150 | 街道与门牌号拼接结果 | 两项都缺失时为NULL |
| `source` | Text | 30 | 数据来源 | 固定为 `OpenStreetMap` |

### 医疗设施几何

| 图层 | 几何类型 | 记录数 | 名称缺失 | 地址缺失 |
|---|---|---:|---:|---:|
| `hospitals_processed` | MultiPolygon | 14 | 2 | 10 |
| `clinics_processed` | Point | 1 | 0 | 0 |
| `pharmacies_processed` | Point | 6 | 3 | 4 |

医院以院区或建筑面表示，诊所和药店以点表示。不同几何类型暂不强制合并为一个图层，避免丢失医院面几何信息。

## 道路标准字段

适用图层：`data/processed/roads_processed.gpkg`

| 字段 | 类型 | 长度/精度 | 含义 | 示例或规则 |
|---|---|---:|---|---|
| `source_id` | Text | 30 | OSM完整ID | 通常以 `w` 开头 |
| `osm_id` | Text | 30 | OSM数字ID | 保留为文本 |
| `osm_type` | Text | 10 | OSM对象类型 | 当前主要为 `way` |
| `name` | Text | 150 | 道路名称 | 服务路、步道等可能为NULL |
| `road_class` | Text | 30 | 原始 `highway` 分类标准化字段 | `primary`、`residential`、`footway` 等 |
| `surface` | Text | 30 | 路面材质 | 缺失时为NULL |
| `oneway` | Text | 10 | 单行信息 | 保留OSM原始表达 |
| `maxspeed` | Text | 20 | 限速信息 | 保留OSM原始文本及单位表达 |
| `length_m` | Real | 12/2 | 裁剪后线段长度 | 单位为米，保留两位小数 |
| `source` | Text | 30 | 数据来源 | 固定为 `OpenStreetMap` |

### 道路质量摘要

- 记录数：1095
- 几何类型：MultiLineString
- 道路类型：18种
- 名称缺失：732条
- 零长度线：0条
- 无效几何：0条
- 总长度：约164.37公里
- `planned` 2条、`construction` 1条；保留在数据中，现状道路分析时应明确排除。

## PostGIS表结构

数据库：`huyi_space`
schema：`processed`

| GeoPackage成果 | PostGIS表 | 主键 | 来源唯一约束 | 空间字段 |
|---|---|---|---|---|
| `hospitals_processed` | `processed.hospitals` | `id` | `source_id` | `geometry(MultiPolygon,32651)` |
| `clinics_processed` | `processed.clinics` | `id` | `source_id` | `geometry(Point,32651)` |
| `pharmacies_processed` | `processed.pharmacies` | `id` | `source_id` | `geometry(Point,32651)` |
| `roads_processed` | `processed.roads` | `id` | `source_id` | `geometry(MultiLineString,32651)` |

- `id` 是PostgreSQL导入时生成的内部主键，由序列自动递增。
- `source_id` 是OSM来源标识，设置为 `NOT NULL` 和 `UNIQUE`，用于来源追踪并防止重复入库。
- GeoPackage内部字段 `fid` 未保留在正式PostGIS表中。
- 四张表的 `geom` 均设置为 `NOT NULL`，并创建GiST空间索引。
- 主键和 `source_id` 唯一约束分别创建B-tree索引。
- 道路的 `length_m` 在PostgreSQL中映射为 `double precision`。
