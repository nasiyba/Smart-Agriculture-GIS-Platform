# GeoJson2 data update review

The platform data was updated from the uploaded `GeoJson2.zip` schema.

## Core platform mapping

- `Farm_Area.geojson` → Farm Areas / farm boundaries
  - `Farm_ID_` is used as the farm ID.
  - `Shape_Area` is treated as square metres and converted internally to hectares because the existing calculation model stores farm area in hectares. The UI continues to display metric square metres.
- `Vegetation.geojson` → Vegetation point census
  - `Vegetation_ID` → record ID
  - `Vegetation_Type_EN` → vegetation type
  - `Vegetation_Type_AR`, `Vegetation_Height`, `Vegetation_Health`, and `Canopy_Diamete` are retained and available to the platform.
  - Farm IDs are derived spatially by intersecting each vegetation point with `Farm_Area`.
- The old tree polygon dataset was retired because the new package does not contain a valid vegetation/tree-area polygon layer.

## Additional map layers

The following supplied datasets are now available from the Layers panel:

- Animal Pens
- Buildings & Facilities
- Greenhouses
- Shade Houses
- Solar Panels
- Streets

The supplied Agricultural Fields layer contains no valid geometry, while Desalination Plants, Farm Land Cover, and Wells are empty. They remain listed but disabled so the schema is visible without creating fake features.

## Data review results

- Farm Areas: 23
- Valid vegetation points: 13,299
- Vegetation records with null geometry skipped: 5
- Vegetation points spatially linked to a farm: 13,218
- Vegetation points outside farm polygons: 510
- Total farm area: 1,584,631.18 m²

The headline vegetation/tree total uses the vegetation point layer itself, including valid points outside farm polygons. Farm-specific summaries only use records spatially linked to that farm.


## Individual tree layer refresh — Tree2409.geojson

- Replaced the previous individual vegetation point layer with Tree2409.geojson.
- Valid point records: 13,299.
- 13,118 points intersect a farm polygon and received a Farm ID; 181 remain outside farm polygons.
- Platform display labels are normalized from Vegetation_Type_EN (for example Palm_Tree → Palm, Coconut_Palm → Coconut).
- Height, health, canopy diameter, Arabic vegetation type, coordinates, Governorate and Wilayat are preserved.
