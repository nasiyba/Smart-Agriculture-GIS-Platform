"""
Converts the raw Esri "export as GeoJSON per layer" dump into the three
clean layers the Agri Census app expects:

  farms.geojson         — from Area.geojson
  tree_points.geojson   — from Trees.geojson (Grass_Points dropped per decision)
  tree_polygons.geojson — merged from all per-crop polygon files + Grass_Polygon

Decisions baked in (per Nasiyba, 2026-09-14):
  - Blank Tree_Type on individual tree points -> labeled "Unknown", still counted.
  - Grass_Points.geojson (70,190 pts, no Tree_Type) -> dropped entirely.
  - Grass_Polygon.geojson (47 polygons, no Tree_Count) -> kept as a "Grass" area
    layer with Tree_Count = 0 (shows on map, doesn't inflate Total Trees).
  - Farm_ID assigned from Area.geojson's OBJECTID (no source Farm_ID existed).
  - Farm_ID for trees/crop-polygons assigned by spatial join (point/centroid
    falls inside a farm boundary) since the source had no foreign key.
  - Governorate derived from Wilayat (WILAYAT_TO_GOVERNORATE below) since the
    source only had Wilayat. Extend this table if your data covers more
    wilayats than just Barka.
  - Farm_Area / area (ha) computed from the source Shape_Area attribute,
    assumed to be in square meters (Shape_Area / 10000).
  - Tree type label normalized from filename (e.g. "Coconut_Trees" -> "Coconut",
    "Palm_Mix_Fruite" typo in Trees.geojson -> "Palm & Mixed Fruit" to match
    the polygon file naming).

Run:  python3 convert_geojson.py
Reads from ./geojson/*.geojson, writes farms.geojson, tree_points.geojson,
tree_polygons.geojson into ./converted/
"""

import json
import os
import glob
from shapely.geometry import shape, mapping

SRC_DIR = "geojson"
OUT_DIR = "converted"

WILAYAT_TO_GOVERNORATE = {
    "Barka": "Al Batinah South",
    # Add more wilayats here if your dataset grows beyond Barka, e.g.:
    # "Rustaq": "Al Batinah South",
    # "Salalah": "Dhofar",
}

# Filename -> clean Tree_Type label (crop polygon files, one per type).
CROP_FILE_LABELS = {
    "Banana": "Banana",
    "Betham": "Betham",
    "Cassava": "Cassava",
    "Coconut_Trees": "Coconut",
    "Fig": "Fig",
    "Lemon": "Lemon",
    "Lemon_Orange": "Lemon & Orange",
    "Mango": "Mango",
    "Mixed_Fruit_Tree": "Mixed Fruit",
    "Orange": "Orange",
    "Palm_Mix_Fruit": "Palm & Mixed Fruit",
    "Papaya": "Papaya",
    "Pomegranate": "Pomegranate",
    "Prickly_Pear": "Prickly Pear",
    "Sidr": "Sidr",
    "palm": "Palm",
    "Grass_Polygon": "Grass",
}

# Cleans up the inconsistent Tree_Type spellings found inside Trees.geojson.
POINT_TREE_TYPE_LABELS = {
    "Palm_Mix_Fruite": "Palm & Mixed Fruit",
    "Coconut_Trees": "Coconut",
    "Mixed_Fruit_Tree": "Mixed Fruit",
    "Prickly_Pear": "Prickly Pear",
}


def load(path):
    with open(path) as f:
        return json.load(f)


def governorate_for(wilayat):
    return WILAYAT_TO_GOVERNORATE.get(wilayat, "Unknown")


def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    # ---------------------------------------------------------------- farms
    area = load(os.path.join(SRC_DIR, "Area.geojson"))
    farm_features = []
    farm_shapes = []  # (farm_id, shapely geometry) for spatial join later

    for feat in area["features"]:
        props = feat["properties"]
        farm_id = f"F-{props['OBJECTID']:04d}"
        wilayat = props.get("Wilayat", "Unknown")
        geom = shape(feat["geometry"])
        farm_area_ha = round((props.get("Shape_Area") or 0) / 10000, 3)

        farm_features.append(
            {
                "type": "Feature",
                "geometry": feat["geometry"],
                "properties": {
                    "Farm_ID": farm_id,
                    "Governorate": governorate_for(wilayat),
                    "Wilayat": wilayat,
                    "Farm_Area": farm_area_ha,
                },
            }
        )
        farm_shapes.append((farm_id, wilayat, geom))

    with open(os.path.join(OUT_DIR, "farms.geojson"), "w") as f:
        json.dump({"type": "FeatureCollection", "features": farm_features}, f)
    print(f"farms.geojson: {len(farm_features)} farms")

    def find_farm(point):
        for farm_id, wilayat, geom in farm_shapes:
            if geom.contains(point) or geom.intersects(point):
                return farm_id, wilayat
        return None, None

    # ---------------------------------------------------------- tree points
    trees = load(os.path.join(SRC_DIR, "Trees.geojson"))
    point_features = []
    unmatched_points = 0

    for feat in trees["features"]:
        props = feat["properties"]
        raw_type = props.get("Tree_Type")
        tree_type = POINT_TREE_TYPE_LABELS.get(raw_type, raw_type) if raw_type else "Unknown"

        geom = shape(feat["geometry"])
        farm_id, farm_wilayat = find_farm(geom)
        if farm_id is None:
            unmatched_points += 1
        wilayat = farm_wilayat or props.get("Wilayat", "Unknown")

        point_features.append(
            {
                "type": "Feature",
                "geometry": feat["geometry"],
                "properties": {
                    "Tree_ID": f"T-{props['OBJECTID']}",
                    "Farm_ID": farm_id,  # null if it fell outside every farm boundary
                    "Tree_Type": tree_type,
                    "Longitude": geom.x,
                    "Latitude": geom.y,
                    "Governorate": governorate_for(wilayat),
                    "Wilayat": wilayat,
                },
            }
        )

    with open(os.path.join(OUT_DIR, "tree_points.geojson"), "w") as f:
        json.dump({"type": "FeatureCollection", "features": point_features}, f)
    print(f"tree_points.geojson: {len(point_features)} points ({unmatched_points} outside any farm boundary)")

    # -------------------------------------------------------- tree polygons
    polygon_features = []
    unmatched_polygons = 0
    crop_files = [f for f in CROP_FILE_LABELS if f != "Grass_Polygon"]

    def process_polygon_file(filename, tree_type_label, count_field_candidates):
        nonlocal unmatched_polygons
        data = load(os.path.join(SRC_DIR, f"{filename}.geojson"))
        n = 0
        for feat in data["features"]:
            props = feat["properties"]
            tree_count = 0
            for field in count_field_candidates:
                if field in props and props[field] is not None:
                    tree_count = props[field]
                    break

            geom = shape(feat["geometry"])
            centroid = geom.centroid
            farm_id, farm_wilayat = find_farm(centroid)
            if farm_id is None:
                unmatched_polygons += 1
            wilayat = farm_wilayat or props.get("Wilayat", "Unknown")
            area_ha = round((props.get("Shape_Area") or 0) / 10000, 3)

            polygon_features.append(
                {
                    "type": "Feature",
                    "geometry": feat["geometry"],
                    "properties": {
                        "Area_ID": f"{filename}-{props['OBJECTID']}",
                        "Farm_ID": farm_id,
                        "Tree_Type": tree_type_label,
                        "Tree_Count": tree_count,
                        "Area_Ha": area_ha,
                        "Governorate": governorate_for(wilayat),
                        "Wilayat": wilayat,
                    },
                }
            )
            n += 1
        return n

    total = 0
    for filename in crop_files:
        label = CROP_FILE_LABELS[filename]
        total += process_polygon_file(filename, label, ["Tree_Count", "Trees_Count"])

    # Grass_Polygon: no count field at all -> forced to 0 per decision.
    total += process_polygon_file("Grass_Polygon", "Grass", [])

    with open(os.path.join(OUT_DIR, "tree_polygons.geojson"), "w") as f:
        json.dump({"type": "FeatureCollection", "features": polygon_features}, f)
    print(f"tree_polygons.geojson: {total} polygons ({unmatched_polygons} outside any farm boundary)")

    print("\nDone. Files written to ./converted/")


if __name__ == "__main__":
    main()
