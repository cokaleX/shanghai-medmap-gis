-- 沪医空间：阶段4基础SQL与空间查询
-- 目标数据库：huyi_space
-- 执行角色：huyi_owner
-- 本文件中的语句均为只读查询，不修改表结构或数据。

-- 1. 验证当前数据库、角色和PostGIS版本。
SELECT
    current_database() AS database_name,
    current_user AS login_role,
    PostGIS_Version() AS postgis_version;

-- 2. 查看前5条医院记录。
SELECT
    id,
    source_id,
    name,
    facility_type
FROM processed.hospitals
ORDER BY id
LIMIT 5;

-- 3. 查询名称为NULL的医院。
SELECT
    id,
    source_id,
    name,
    facility_type
FROM processed.hospitals
WHERE name IS NULL
ORDER BY id;

-- 4. 区分NULL、空字符串和纯空格文本。
SELECT
    COUNT(*) FILTER (WHERE name IS NULL) AS null_name_count,
    COUNT(*) FILTER (WHERE name = '') AS empty_string_count,
    COUNT(*) FILTER (
        WHERE name IS NOT NULL
          AND BTRIM(name) = ''
    ) AS blank_text_count
FROM processed.hospitals;

-- 5. 按道路分类统计OSM线要素数量。
-- 结果是线要素数量，不等于现实道路条数。
SELECT
    road_class,
    COUNT(*) AS road_segment_count
FROM processed.roads
GROUP BY road_class
ORDER BY road_segment_count DESC, road_class;

-- 6. 跨表统计医疗设施类型数量。
SELECT
    facility_type,
    COUNT(*) AS facility_count
FROM (
    SELECT facility_type
    FROM processed.hospitals

    UNION ALL

    SELECT facility_type
    FROM processed.clinics

    UNION ALL

    SELECT facility_type
    FROM processed.pharmacies
) AS all_facilities
GROUP BY facility_type
ORDER BY facility_type;

-- 7. 查询徐家汇中心点1千米范围内的设施。
-- EPSG:32651的坐标单位为米。
WITH all_facilities AS (
    SELECT source_id, name, facility_type, geom
    FROM processed.hospitals

    UNION ALL

    SELECT source_id, name, facility_type, geom
    FROM processed.clinics

    UNION ALL

    SELECT source_id, name, facility_type, geom
    FROM processed.pharmacies
),
xujiahui_center AS (
    SELECT ST_SetSRID(
        ST_MakePoint(350637.76, 3452459.54),
        32651
    ) AS geom
)
SELECT
    f.source_id,
    f.name,
    f.facility_type,
    ROUND(ST_Distance(f.geom, c.geom)::numeric, 1) AS distance_m
FROM all_facilities f
CROSS JOIN xujiahui_center c
WHERE ST_DWithin(f.geom, c.geom, 1000)
ORDER BY distance_m, facility_type, source_id;

-- 8. 查询诊所点到最近道路线的直线距离。
-- <->用于GiST最近邻搜索，ST_Distance用于输出精确距离。
SELECT
    c.source_id AS clinic_source_id,
    c.name AS clinic_name,
    r.source_id AS road_source_id,
    r.name AS road_name,
    r.road_class,
    ROUND(ST_Distance(c.geom, r.geom)::numeric, 1) AS distance_m
FROM processed.clinics c
CROSS JOIN LATERAL (
    SELECT
        source_id,
        name,
        road_class,
        geom
    FROM processed.roads
    ORDER BY c.geom <-> geom
    LIMIT 1
) r;

-- 9. 查看GiST最近邻索引执行计划。
EXPLAIN (ANALYZE, BUFFERS)
SELECT
    c.source_id,
    r.source_id
FROM processed.clinics c
CROSS JOIN LATERAL (
    SELECT source_id
    FROM processed.roads
    ORDER BY c.geom <-> geom
    LIMIT 1
) r;

-- 10. 对照：使用ST_Distance全量计算和排序的执行计划。
EXPLAIN (ANALYZE, BUFFERS)
SELECT
    c.source_id,
    r.source_id
FROM processed.clinics c
CROSS JOIN LATERAL (
    SELECT source_id
    FROM processed.roads
    ORDER BY ST_Distance(c.geom, geom)
    LIMIT 1
) r;
