path = 'src/map/mapViewFactory.ts'
with open(path) as f:
    content = f.read()

old = '''  async function zoomToFarm(farmId: string) {
    const farm = data.farms.find((f) => f.farmId === farmId);
    if (!farm) return;
    await view.goTo(
      { center: farm.centroid, zoom: 15 },
      { duration: 600, easing: "ease-in-out" }
    );
  }'''

new = '''  async function zoomToFarm(farmId: string) {
    const farm = data.farms.find((f) => f.farmId === farmId);
    if (!farm) return;
    const outer = farm.rings[0] ?? [];
    if (outer.length === 0) {
      await view.goTo({ center: farm.centroid, zoom: 17 }, { duration: 600, easing: "ease-in-out" });
      return;
    }
    let xmin = Infinity, ymin = Infinity, xmax = -Infinity, ymax = -Infinity;
    for (const [lon, lat] of outer) {
      if (lon < xmin) xmin = lon;
      if (lon > xmax) xmax = lon;
      if (lat < ymin) ymin = lat;
      if (lat > ymax) ymax = lat;
    }
    padX = (xmax - xmin) * 0.4 or 0.0008
    await view.goTo(
      {
        target: {
          type: "extent",
          xmin: xmin - padX,
          ymin: ymin - padY,
          xmax: xmax + padX,
          ymax: ymax + padY,
          spatialReference: { wkid: 4326 },
        } as any,
      },
      { duration: 700, easing: "ease-in-out" }
    );
  }'''

if old not in content:
    print('WARNING: exact match not found - file may already be edited. No changes made.')
else:
    content = content.replace(old, new)
    with open(path, 'w') as f:
        f.write(content)
    print('zoomToFarm updated successfully')
