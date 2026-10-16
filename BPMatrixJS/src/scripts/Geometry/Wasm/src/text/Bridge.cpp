#include "Font.hpp"
#include <emscripten/emscripten.h>
#include <functional>
#include <memory>
#include <stdexcept>

namespace bptext {
std::vector<double> BuildText(Font&, const uint16_t*, size_t, double, double, double, int, double);
}

namespace {
std::map<unsigned, std::unique_ptr<bptext::Font>> fonts;
unsigned nextId = 1;
std::vector<double> result;
std::string error;

/** Translate native exceptions into JS errors without leaking partial registration. */
int Run(const std::function<void()>& operation) {
    try {
        result.clear();
        error.clear();
        operation();
        return 1;
    } catch (const std::exception& exception) {
        error = exception.what();
        result.clear();
        return 0;
    }
}

bptext::Font& Get(unsigned id) {
    const auto found = fonts.find(id);
    if (found != fonts.end()) {
        return *found->second;
    } else {
        throw std::runtime_error("Font handle is no longer registered.");
    }
}
}

extern "C" {

/** Register an owned face and return its handle and font-unit metrics. */
EMSCRIPTEN_KEEPALIVE int text_register(const uint8_t* bytes, size_t length) {
    return Run([&] {
        auto font = std::make_unique<bptext::Font>(bytes, length);
        const unsigned id = nextId++;
        result = {static_cast<double>(id), static_cast<double>(font->unitsPerEm),
            static_cast<double>(font->metrics.ascender), static_cast<double>(font->metrics.descender),
            static_cast<double>(font->metrics.line_gap)};
        fonts.emplace(id, std::move(font));
    });
}

/** Release font bytes and all native cache entries. */
EMSCRIPTEN_KEEPALIVE void text_unregister(unsigned id) {
    fonts.erase(id);
}

/** Shape UTF-16 input for renderer/editor metrics without constructing geometry. */
EMSCRIPTEN_KEEPALIVE int text_shape(unsigned id, const uint16_t* text, size_t length) {
    return Run([&] { result = Get(id).shape(text, length); });
}

/** Run font shaping, curve flattening, winding resolution and text placement. */
EMSCRIPTEN_KEEPALIVE int text_mesh(unsigned id, const uint16_t* text, size_t length,
    double size, double lineSpacing, double letterSpacing, int align, double tolerance) {
    return Run([&] { result = bptext::BuildText(Get(id), text, length, size, lineSpacing, letterSpacing, align, tolerance); });
}

/** Return observable cache counters for performance checks and applications. */
EMSCRIPTEN_KEEPALIVE int text_stats(unsigned id) {
    return Run([&] {
        const auto& font = Get(id);
        result = {static_cast<double>(font.hits), static_cast<double>(font.misses), static_cast<double>(font.cacheBytes)};
    });
}

EMSCRIPTEN_KEEPALIVE int text_clear(unsigned id) {
    return Run([&] { Get(id).clear(); });
}
EMSCRIPTEN_KEEPALIVE const double* text_result_data() { return result.data(); }
EMSCRIPTEN_KEEPALIVE size_t text_result_size() { return result.size(); }
EMSCRIPTEN_KEEPALIVE const char* text_error() { return error.c_str(); }

}
