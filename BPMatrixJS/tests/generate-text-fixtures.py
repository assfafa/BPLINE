"""Generate small original fonts for deterministic WASM decoder and winding tests."""
from pathlib import Path
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.t2CharStringPen import T2CharStringPen

destination = Path(__file__).parent / "fixtures"


def draw(pen, loops):
    """Draw independent closed loops; opposite directions represent holes."""
    for loop in loops:
        pen.moveTo(loop[0])
        for point in loop[1:]:
            pen.lineTo(point)
        pen.closePath()


outer = [(0, 0), (1000, 0), (1000, 1000), (0, 1000)]
hole = [(200, 200), (200, 800), (800, 800), (800, 200)]
outlines = {
    ".notdef": [outer],
    "space": [],
    "hole": [outer, hole],
    "overlap": [outer, [(500, 0), (1500, 0), (1500, 1000), (500, 1000)]],
    "touch": [outer, [(1000, 0), (2000, 0), (2000, 1000), (1000, 1000)]],
    "cross": [[(0, 0), (1000, 1000), (0, 1000), (1000, 0)]],
    "cancel": [outer, list(reversed(outer))],
    "curve": [],
}

for is_ttf in [True, False]:
    builder = FontBuilder(1000, isTTF=is_ttf)
    builder.setupGlyphOrder(list(outlines))
    builder.setupCharacterMap({32: "space", 65: "hole", 66: "overlap", 67: "touch", 68: "cross", 69: "cancel", 70: "curve"})
    glyphs = {}
    for name, loops in outlines.items():
        if is_ttf:
            pen = TTGlyphPen(None)
        else:
            pen = T2CharStringPen(2200, None)
        draw(pen, loops)
        if name == "curve":
            pen.moveTo((0, 0))
            if is_ttf:
                pen.qCurveTo((500, 1500), (1000, 0))
            else:
                pen.curveTo((0, 1000), (1000, 1000), (1000, 0))
            pen.closePath()
        if is_ttf:
            glyphs[name] = pen.glyph()
        else:
            glyphs[name] = pen.getCharString()
    if is_ttf:
        builder.setupGlyf(glyphs)
    else:
        builder.setupCFF("BPTextTest", {}, glyphs, {})
    builder.setupHorizontalMetrics({name: (2200, 0) for name in outlines})
    builder.setupHorizontalHeader(ascent=1000, descent=-200)
    builder.setupNameTable({"familyName": "BPTextTest", "styleName": "Regular", "uniqueFontIdentifier": "BPTextTest", "fullName": "BPTextTest", "psName": "BPTextTest"})
    builder.setupOS2(sTypoAscender=1000, sTypoDescender=-200, usWinAscent=1000, usWinDescent=200)
    builder.setupPost()
    builder.font["head"].created = 3406620150
    builder.font["head"].modified = 3406620150
    builder.font.recalcTimestamp = False
    extension = "otf"
    if is_ttf:
        extension = "ttf"
    builder.save(destination / ("WasmTextTest." + extension))
    if is_ttf:
        for flavor in ["woff", "woff2"]:
            builder.font.flavor = flavor
            builder.save(destination / ("WasmTextTest." + flavor))
