# PostgreSQL/PostGIS配置记录

## 软件版本

- PostgreSQL：18.4（Windows x64）
- PostGIS：3.6.2
- 数据库端口：5432
- PostgreSQL服务：`postgresql-x64-18`
- 程序目录：`D:\Program Files\PostgreSQL\18`
- 数据目录：`D:\PostgreSQL\18\data`

本文档不记录任何数据库密码。

## 项目数据库

- 数据库：`huyi_space`
- 数据库所有者：`huyi_owner`
- 编码：UTF8
- schema：`processed`
- 空间扩展：PostGIS 3.6.2

`postgres` 仅用于服务器级管理和创建扩展。QGIS及日常项目操作使用非超级用户 `huyi_owner`。

## 标准成果表

| 表 | 记录数 | 几何类型 | SRID |
|---|---:|---|---:|
| `processed.hospitals` | 14 | MultiPolygon | 32651 |
| `processed.clinics` | 1 | Point | 32651 |
| `processed.pharmacies` | 6 | Point | 32651 |
| `processed.roads` | 1095 | MultiLineString | 32651 |

四张表均满足：

- `id` 为自动递增主键，并具有B-tree索引；
- `source_id` 为 `NOT NULL` 和 `UNIQUE`，并具有B-tree唯一索引；
- `geom` 为 `NOT NULL`，类型和SRID由PostGIS字段定义约束；
- `geom` 具有GiST空间索引；
- 空几何和无效几何均为0。

## QGIS连接

- 连接名称：`huyi_space_local`
- 主机：`localhost`
- 端口：5432
- 数据库：`huyi_space`
- 用户：`huyi_owner`

QGIS项目中不保存用户名和明文密码。密码由用户在本机安全管理，不进入Git仓库。

## 常用只读验证

```sql
SELECT current_database(), current_user, PostGIS_Version();
```

```sql
SELECT
    COUNT(*) AS total_count,
    COUNT(*) FILTER (WHERE geom IS NULL) AS null_geom,
    COUNT(*) FILTER (WHERE NOT ST_IsValid(geom)) AS invalid_geom,
    MIN(ST_SRID(geom)) AS min_srid,
    MAX(ST_SRID(geom)) AS max_srid,
    STRING_AGG(DISTINCT GeometryType(geom), ', ') AS geometry_types
FROM processed.hospitals;
```

数据库本身位于本机PostgreSQL数据目录中，不作为普通文件提交到Git。Git保存数据库结构说明、验证结果和可重复执行的SQL文档，不保存密码或数据库数据目录。
