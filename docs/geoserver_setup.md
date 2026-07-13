# GeoServer配置与服务说明

## 本机环境

- Java：Eclipse Temurin JDK 17.0.19+10（x64）
- GeoServer：3.0.0
- 内置服务器：Jetty 12.1.10
- GeoServer程序目录：`D:\GeoServer\3.0.0`
- GeoServer数据目录：`D:\GeoServer\data_huyi_space`
- 本机端口：8080

GeoServer数据目录包含用户、加密后的连接密码和服务配置，不进入Git仓库。本文档不记录任何密码。

## 手动启动

在新的PowerShell中执行：

```powershell
$env:GEOSERVER_HOME = 'D:\GeoServer\3.0.0'
$env:GEOSERVER_DATA_DIR = 'D:\GeoServer\data_huyi_space'
Set-Location "$env:GEOSERVER_HOME\bin"
.\startup.bat
```

启动窗口需要保持运行。首次验证时欢迎页返回HTTP 200，GeoServer Web应用状态为 `AVAILABLE`。

## 正常停止

在另一个PowerShell中执行：

```powershell
Set-Location 'D:\GeoServer\3.0.0\bin'
.\shutdown.bat
```

停止后应确认8080端口关闭，GeoServer Java进程退出，日志出现清理序列。

## 工作区与数据存储

- Workspace：`huyi_space`
- Namespace URI：`https://cokalex.github.io/huyi-space`
- PostGIS Store：`huyi_postgis`
- 数据库：`huyi_space`
- Schema：`processed`
- 发布数据库角色：`huyi_geoserver`

`huyi_geoserver` 只具有数据库连接、schema使用和表查询权限，不具有插入权限。

## 已发布图层

| 完整图层名 | 标题 | 几何类型 | SRID | 默认样式 |
|---|---|---|---:|---|
| `huyi_space:hospitals` | 徐家汇研究区医院 | MultiPolygon | 32651 | `hospitals_style` |
| `huyi_space:clinics` | 徐家汇研究区诊所 | Point | 32651 | `clinics_style` |
| `huyi_space:pharmacies` | 徐家汇研究区药店 | Point | 32651 | `pharmacies_style` |
| `huyi_space:roads` | 徐家汇研究区道路 | MultiLineString | 32651 | `roads_style` |

图层组：`huyi_space:medical_facilities_map`

图层组绘制顺序：道路、医院、诊所、药店。

## 本机服务地址

工作区WMS capabilities：

```text
http://localhost:8080/geoserver/huyi_space/wms?service=WMS&version=1.3.0&request=GetCapabilities
```

工作区WFS capabilities：

```text
http://localhost:8080/geoserver/huyi_space/ows?service=WFS&version=2.0.0&request=GetCapabilities
```

工作区WMS中的图层使用短名称，例如 `hospitals`；全局WMS中的图层使用完整名称，例如 `huyi_space:hospitals`。

## 样式源文件

可版本控制的SLD源文件位于：

```text
geoserver/styles/hospitals.sld
geoserver/styles/clinics.sld
geoserver/styles/pharmacies.sld
geoserver/styles/roads.sld
```

- 医院：红色半透明面和深红描边。
- 诊所：蓝色圆点和白色描边。
- 药店：绿色方点和白色描边。
- 道路：按18种 `road_class` 分为5组线型规则。

## 安全边界

- GeoServer管理员密码、数据库密码和GeoServer数据目录不进入Git。
- 本机服务用于学习与开发，不应直接暴露到公网。
- GeoServer当前通过手动脚本启动，尚未配置为Windows服务。
- 发布数据库角色为只读账号；QGIS数据治理仍使用 `huyi_owner`。
