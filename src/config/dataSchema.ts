export const UPDATED_DATASET_SUMMARY = [
  { layer: "Farm Area", file: "Farm_Area.geojson", records: 23, geometry: "Polygon", fields: "Farm_ID_, Governorate, Wilayat, Shape_Area, Latitude, Longitude" },
  { layer: "Vegetation", file: "Vegetation.geojson", records: 13299, geometry: "Point", fields: "OBJECTID, Vegetation_Type_EN/AR, Vegetation_Height, Vegetation_Health, Canopy_Diamete, Latitude, Longitude, Governorate, Wilayat" },
  { layer: "Buildings & Facilities", file: "Buildings_and_Facilities.geojson", records: 207, geometry: "Polygon", fields: "Building_ID, Building_Type, Governorate, Wilayat, Shape_Area" },
  { layer: "Animal Pens", file: "Animal_Pens.geojson", records: 87, geometry: "Polygon", fields: "Pen_ID, Governorate, Wilayat, Shape_Area" },
  { layer: "Shade Houses", file: "Shade_Houses.geojson", records: 24, geometry: "Polygon", fields: "Shadehouse_ID_, Governorate, Wilayat, Shape_Area" },
  { layer: "Greenhouses", file: "Greenhouses.geojson", records: 14, geometry: "Polygon", fields: "Greenhouse_ID, Crop_Type, Governorate, Wilayat, Shape_Area" },
  { layer: "Solar Panels", file: "Solar_Panels.geojson", records: 10, geometry: "Polygon", fields: "Solar_Panel_ID_, Panels_Count, Governorate, Wilayat, Shape_Area" },
  { layer: "Streets", file: "Streets.geojson", records: 105, geometry: "LineString", fields: "Street_ID, Governorate, Wilayat, Shape_Length" },
  { layer: "Agricultural Fields", file: "Agricultural_Field.geojson", records: 376, geometry: "Polygon", fields: "Field_ID, Governorat, Wilayat, Plant_Type, Plant_Ty_1, Tree_Count, Survey_Dat, Latitude, Longitude, Shape_Area" },
  { layer: "Farm Land Cover", file: "Farm_Land_Cover.geojson", records: 69, geometry: "Polygon", fields: "Farm_ID, Land_Cover, Land_Cov_1, Governorat, Wilayat, Latitude, Longitude, Shape_Area" },
  { layer: "Desalination Plants", file: "Desalination_Plants.geojson", records: 0, geometry: "Empty", fields: "—" },
  { layer: "Wells", file: "Wells.geojson", records: 0, geometry: "Empty", fields: "—" },
] as const;
