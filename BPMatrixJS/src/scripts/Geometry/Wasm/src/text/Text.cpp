#include "Font.hpp"
#include <algorithm>
#include <cmath>
#include <stdexcept>

namespace bptext {
namespace {

struct Placed {
    Mesh mesh;
    double left = 0;
    double bottom = 0;
    double right = 0;
    double top = 0;
};

/** Copy cached font-local vertices into one text layout. */
Contour Place(const Contour& points, double x, double y, double scale) {
    Contour result;
    result.reserve(points.size());
    for (Point point : points) {
        result.push_back({point.x * scale + x, point.y * scale + y});
    }
    return result;
}

/** Find a disjoint-set root for intersecting glyph bounds. */
size_t Root(std::vector<size_t>& roots, size_t index) {
    while (roots[index] != index) {
        roots[index] = roots[roots[index]];
        index = roots[index];
    }
    return index;
}

/** Reuse individual meshes except where positioned glyphs overlap or touch. */
Mesh Merge(std::vector<Placed>& glyphs) {
    std::vector<size_t> order;
    std::vector<size_t> roots;
    for (size_t i = 0; i < glyphs.size(); ++i) {
        order.push_back(i);
        roots.push_back(i);
    }
    std::sort(order.begin(), order.end(), [&](size_t a, size_t b) {
        return glyphs[a].left < glyphs[b].left;
    });
    // Sorted X bounds avoid comparing every glyph in a long ordinary line.
    for (size_t i = 0; i < order.size(); ++i) {
        const auto& first = glyphs[order[i]];
        for (size_t j = i + 1; j < order.size(); ++j) {
            const auto& second = glyphs[order[j]];
            if (second.left <= first.right) {
                if (first.bottom <= second.top && first.top >= second.bottom) {
                    roots[Root(roots, order[j])] = Root(roots, order[i]);
                }
            } else {
                break;
            }
        }
    }
    std::map<size_t, std::vector<size_t>> groups;
    for (size_t i = 0; i < glyphs.size(); ++i) {
        groups[Root(roots, i)].push_back(i);
    }
    Mesh result;
    for (const auto& group : groups) {
        Mesh combined;
        if (group.second.size() == 1) {
            combined = std::move(glyphs[group.second.front()].mesh);
        } else {
            Contours contours;
            const double originX = glyphs[group.second.front()].left;
            const double originY = glyphs[group.second.front()].bottom;
            // Recenter union inputs so long-line position does not change geometric tolerance.
            for (size_t index : group.second) {
                for (const auto& contour : glyphs[index].mesh.contours) {
                    contours.push_back(Place(contour, -originX, -originY, 1));
                }
            }
            combined = Tessellate(contours);
            combined.triangles = Place(combined.triangles, originX, originY, 1);
            for (auto& contour : combined.contours) {
                contour = Place(contour, originX, originY, 1);
            }
        }
        result.triangles.insert(result.triangles.end(), combined.triangles.begin(), combined.triangles.end());
        result.contours.insert(result.contours.end(), combined.contours.begin(), combined.contours.end());
    }
    return result;
}

}

/** Build a multiline text in WASM; output header, CW triangles, then all closed contours. */
std::vector<double> BuildText(Font& font, const uint16_t* text, size_t length,
    double size, double lineSpacing, double letterSpacing, int align, double tolerance, bool vertical) {
    std::vector<std::vector<double>> runs;
    size_t start = 0;
    // CRLF is one line break; original UTF-16 indices are only needed in shape().
    for (size_t i = 0; i <= length; ++i) {
        if (i == length || text[i] == '\n' || text[i] == '\r') {
            runs.push_back(font.shape(text + start, i - start, vertical));
            if (i < length && text[i] == '\r' && i + 1 < length && text[i + 1] == '\n') {
                ++i;
            }
            start = i + 1;
        }
    }
    const double scale = size / font.unitsPerEm;
    const double lineHeight = (font.metrics.ascender - font.metrics.descender + font.metrics.line_gap) * scale + lineSpacing;
    std::vector<double> widths;
    double advance = 0;
    for (const auto& run : runs) {
        const double width = run[0] * scale + std::max(0.0, run[1] - 1) * letterSpacing;
        widths.push_back(width);
        advance = std::max(advance, width);
    }
    double left = INFINITY;
    double bottom = INFINITY;
    double right = -INFINITY;
    double top = -INFINITY;
    std::vector<Placed> glyphs;
    for (size_t row = 0; row < runs.size(); ++row) {
        const auto& run = runs[row];
        double x = 0;
        double y = -static_cast<double>(row) * lineHeight;
        // Each source line becomes a right-to-left column in vertical mode.
        if (vertical) {
            x = -static_cast<double>(row) * lineHeight;
            y = 0;
            // Align along the column, allowing exact half-cell center offsets.
            if (align == 1) {
                y = -(advance - widths[row]) / 2;
            } else if (align == 2) {
                y = -(advance - widths[row]);
            }
        } else if (align == 1) {
            x = (advance - widths[row]) / 2;
        } else if (align == 2) {
            x = advance - widths[row];
        }
        for (size_t i = 0; i < static_cast<size_t>(run[1]); ++i) {
            const size_t offset = 2 + i * 10;
            const double originX = x + run[offset + 4] * scale;
            const double originY = y + run[offset + 5] * scale;
            // Zero-size text keeps advances but never requests degenerate glyph meshes.
            if (size > 0) {
                const Mesh& mesh = font.glyph(run[offset], tolerance / scale);
                if (!mesh.contours.empty()) {
                    Placed placed;
                    placed.left = originX + run[offset + 6] * scale;
                    placed.bottom = originY + run[offset + 7] * scale;
                    placed.right = originX + run[offset + 8] * scale;
                    placed.top = originY + run[offset + 9] * scale;
                    left = std::min(left, placed.left);
                    bottom = std::min(bottom, placed.bottom);
                    right = std::max(right, placed.right);
                    top = std::max(top, placed.top);
                    placed.mesh.triangles = Place(mesh.triangles, originX, originY, scale);
                    for (const auto& contour : mesh.contours) {
                        placed.mesh.contours.push_back(Place(contour, originX, originY, scale));
                    }
                    glyphs.push_back(std::move(placed));
                }
            }
            // Extra letter spacing follows the inline axis, never shifts columns sideways.
            x += run[offset + 2] * scale;
            y += run[offset + 3] * scale;
            if (vertical) {
                y -= letterSpacing;
            } else {
                x += letterSpacing;
            }
        }
    }
    Mesh mesh = Merge(glyphs);
    if (mesh.contours.empty()) {
        left = bottom = right = top = 0;
    }
    const double centerX = (left + right) / 2;
    const double centerY = (bottom + top) / 2;
    const double width = right - left;
    const double height = top - bottom;
    if (std::isfinite(static_cast<float>(width)) && std::isfinite(static_cast<float>(height)) &&
        std::isfinite(static_cast<float>(advance))) {
        double perimeter = 0;
        for (const auto& contour : mesh.contours) {
            for (size_t i = 0; i < contour.size(); ++i) {
                const Point delta = Difference(contour[i], contour[(i + 1) % contour.size()]);
                perimeter += std::hypot(delta.x, delta.y);
            }
        }
        std::vector<double> result{width, height, -width / 2, -height / 2, advance, perimeter,
            static_cast<double>(mesh.triangles.size()), static_cast<double>(mesh.contours.size())};
        for (Point point : mesh.triangles) {
            result.insert(result.end(), {point.x - centerX, point.y - centerY});
        }
        for (const auto& contour : mesh.contours) {
            result.push_back(contour.size());
            for (Point point : contour) {
                result.insert(result.end(), {point.x - centerX, point.y - centerY});
            }
        }
        return result;
    } else {
        throw std::runtime_error("Text bounds must fit finite Float32 values.");
    }
}

}
