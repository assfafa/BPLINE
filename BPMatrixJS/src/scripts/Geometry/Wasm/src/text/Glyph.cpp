#include "Font.hpp"
#include <algorithm>
#include <cmath>

namespace bptext {
namespace {

struct Path {
    Contours contours;
    Contour current;
    double tolerance = 1;
};

/** Append only distinct endpoints; closures are implicit in contour arrays. */
void Push(Contour& points, Point point) {
    if (points.empty() || points.back().x != point.x || points.back().y != point.y) {
        points.push_back(point);
    }
}

/** Complete one contour while ignoring font-internal degenerate paths. */
void Finish(Path& path) {
    if (path.current.size() > 1 && path.current.front().x == path.current.back().x &&
        path.current.front().y == path.current.back().y) {
        path.current.pop_back();
    }
    if (path.current.size() >= 3) {
        path.contours.push_back(std::move(path.current));
    }
    path.current.clear();
}

/** Distance to a finite chord also detects control points beyond the endpoints. */
double Distance(Point point, Point a, Point b) {
    const Point delta = Difference(a, b);
    const double length2 = delta.x * delta.x + delta.y * delta.y;
    if (length2 > 0) {
        const Point offset = Difference(a, point);
        const double t = std::clamp((offset.x * delta.x + offset.y * delta.y) / length2, 0.0, 1.0);
        return std::hypot(point.x - a.x - delta.x * t, point.y - a.y - delta.y * t);
    } else {
        return std::hypot(point.x - a.x, point.y - a.y);
    }
}

Point Middle(Point a, Point b) {
    return {(a.x + b.x) / 2, (a.y + b.y) / 2};
}

/** De Casteljau subdivision uses requested geometric error in font units. */
void Quadratic(Path& path, Point a, Point control, Point b, unsigned depth) {
    if (depth >= 12 || Distance(control, a, b) <= path.tolerance) {
        Push(path.current, b);
    } else {
        const Point first = Middle(a, control);
        const Point second = Middle(control, b);
        const Point center = Middle(first, second);
        Quadratic(path, a, first, center, depth + 1);
        Quadratic(path, center, second, b, depth + 1);
    }
}

void Cubic(Path& path, Point a, Point c1, Point c2, Point b, unsigned depth) {
    if (depth >= 12 || std::max(Distance(c1, a, b), Distance(c2, a, b)) <= path.tolerance) {
        Push(path.current, b);
    } else {
        const Point p = Middle(a, c1);
        const Point q = Middle(c1, c2);
        const Point r = Middle(c2, b);
        const Point s = Middle(p, q);
        const Point t = Middle(q, r);
        const Point center = Middle(s, t);
        Cubic(path, a, p, s, center, depth + 1);
        Cubic(path, center, t, r, b, depth + 1);
    }
}

/** HarfBuzz callbacks stay entirely within WASM during outline extraction. */
void Move(hb_draw_funcs_t*, void* data, hb_draw_state_t*, float x, float y, void*) {
    auto& path = *static_cast<Path*>(data);
    Finish(path);
    Push(path.current, {x, y});
}
void Line(hb_draw_funcs_t*, void* data, hb_draw_state_t*, float x, float y, void*) {
    Push(static_cast<Path*>(data)->current, {x, y});
}
void Quad(hb_draw_funcs_t*, void* data, hb_draw_state_t* state, float cx, float cy, float x, float y, void*) {
    Quadratic(*static_cast<Path*>(data), {state->current_x, state->current_y}, {cx, cy}, {x, y}, 0);
}
void Curve(hb_draw_funcs_t*, void* data, hb_draw_state_t* state,
    float ax, float ay, float bx, float by, float x, float y, void*) {
    Cubic(*static_cast<Path*>(data), {state->current_x, state->current_y}, {ax, ay}, {bx, by}, {x, y}, 0);
}
void Close(hb_draw_funcs_t*, void* data, hb_draw_state_t*, void*) {
    Finish(*static_cast<Path*>(data));
}

}

const Mesh& Font::glyph(unsigned id, double tolerance) {
    const auto key = std::make_pair(id, tolerance);
    auto found = _glyphs.find(key);
    // Repeated glyphs, including across different texts, skip extraction and tessellation.
    if (found != _glyphs.end()) {
        ++hits;
        found->second.used = ++_clock;
        return found->second.mesh;
    } else {
        ++misses;
        Path path;
        path.tolerance = tolerance;
        hb_draw_funcs_t* draw = hb_draw_funcs_create();
        hb_draw_funcs_set_move_to_func(draw, Move, nullptr, nullptr);
        hb_draw_funcs_set_line_to_func(draw, Line, nullptr, nullptr);
        hb_draw_funcs_set_quadratic_to_func(draw, Quad, nullptr, nullptr);
        hb_draw_funcs_set_cubic_to_func(draw, Curve, nullptr, nullptr);
        hb_draw_funcs_set_close_path_func(draw, Close, nullptr, nullptr);
        hb_font_draw_glyph(font, id, draw, &path);
        hb_draw_funcs_destroy(draw);
        Finish(path);
        Entry entry;
        entry.mesh = Tessellate(path.contours);
        entry.bytes = entry.mesh.triangles.size() * sizeof(Point);
        for (const auto& contour : entry.mesh.contours) {
            entry.bytes += contour.size() * sizeof(Point);
        }
        // Bound precision variants and multilingual documents to 16 MiB per face.
        while (!_glyphs.empty() && (cacheBytes + entry.bytes > 16 * 1024 * 1024 || _glyphs.size() >= 1024)) {
            auto oldest = std::min_element(_glyphs.begin(), _glyphs.end(), [](const auto& a, const auto& b) {
                return a.second.used < b.second.used;
            });
            cacheBytes -= oldest->second.bytes;
            _glyphs.erase(oldest);
        }
        // A single oversize mesh is usable but must not claim to fit the cache budget.
        if (entry.bytes <= 16 * 1024 * 1024) {
            cacheBytes += entry.bytes;
            entry.used = ++_clock;
            return _glyphs.emplace(key, std::move(entry)).first->second.mesh;
        } else {
            _transient = std::move(entry.mesh);
            return _transient;
        }
    }
}

void Font::clear() {
    _glyphs.clear();
    _transient = Mesh{};
    cacheBytes = 0;
    hits = 0;
    misses = 0;
}

}
