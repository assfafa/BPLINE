#pragma once

#include "Geometry.hpp"
#include <hb.h>
#include <cstdint>
#include <map>
#include <string>

namespace bptext {

/** One registered face owns its font bytes and bounded reusable glyph meshes. */
class Font {
public:
    hb_font_t* font = nullptr;
    unsigned unitsPerEm = 0;
    hb_font_extents_t metrics{};
    uint64_t hits = 0;
    uint64_t misses = 0;
    size_t cacheBytes = 0;

    /** Decode one TTF/OTF/WOFF/WOFF2 face and retain HarfBuzz ownership. */
    Font(const uint8_t* bytes, size_t length);
    ~Font();
    Font(const Font&) = delete;
    Font& operator=(const Font&) = delete;

    /** Reuse geometry in font units; tolerance includes the requested size/precision. */
    const Mesh& glyph(unsigned id, double tolerance);
    /** Return UTF-16 cluster indices and positioned glyph metrics without building meshes. */
    std::vector<double> shape(const uint16_t* text, size_t length) const;
    /** Drop cached meshes while retaining the registered face. */
    void clear();

private:
    struct Entry {
        Mesh mesh;
        size_t bytes = 0;
        uint64_t used = 0;
    };
    std::map<std::pair<unsigned, double>, Entry> _glyphs;
    uint64_t _clock = 0;
    Mesh _transient;
};

}
