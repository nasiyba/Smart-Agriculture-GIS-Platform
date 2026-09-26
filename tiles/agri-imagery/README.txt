Put your generated tile pyramid here.

After running gdal2tiles.py (see project README), you'll get a folder like:
  agri-imagery/
    0/
    1/
    ...
    18/

Copy the numbered zoom-level folders (0, 1, 2, ...) directly into this
"agri-imagery" folder, replacing this README if needed. The app expects
tiles at: /tiles/agri-imagery/{level}/{col}/{row}.png
