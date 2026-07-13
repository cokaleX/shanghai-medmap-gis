<?xml version="1.0" encoding="UTF-8"?>
<sld:StyledLayerDescriptor
    version="1.0.0"
    xmlns="http://www.opengis.net/sld"
    xmlns:sld="http://www.opengis.net/sld"
    xmlns:ogc="http://www.opengis.net/ogc"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.opengis.net/sld http://schemas.opengis.net/sld/1.0.0/StyledLayerDescriptor.xsd">
  <sld:NamedLayer>
    <sld:Name>hospitals</sld:Name>
    <sld:UserStyle>
      <sld:Name>hospitals_style</sld:Name>
      <sld:Title>Hospitals</sld:Title>
      <sld:FeatureTypeStyle>
        <sld:Rule>
          <sld:Name>hospital_polygon</sld:Name>
          <sld:Title>Hospital polygon</sld:Title>
          <sld:PolygonSymbolizer>
            <sld:Fill>
              <sld:CssParameter name="fill">#D94B4B</sld:CssParameter>
              <sld:CssParameter name="fill-opacity">0.55</sld:CssParameter>
            </sld:Fill>
            <sld:Stroke>
              <sld:CssParameter name="stroke">#8F1D2C</sld:CssParameter>
              <sld:CssParameter name="stroke-width">1.4</sld:CssParameter>
            </sld:Stroke>
          </sld:PolygonSymbolizer>
        </sld:Rule>
      </sld:FeatureTypeStyle>
    </sld:UserStyle>
  </sld:NamedLayer>
</sld:StyledLayerDescriptor>
