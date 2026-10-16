#include "Geometry.hpp"
#include <algorithm>
#include <cmath>
#include <limits>
#include <map>
#include <stdexcept>
#include <utility>

namespace bptext {
namespace {

struct Edge {
    Point a;
    Point b;
    std::vector<double> cuts{0, 1};
};

/** Interpolate an edge without rounding coordinates to Float32. */
Point At(const Edge& edge, double t) {
    return {edge.a.x + (edge.b.x - edge.a.x) * t, edge.a.y + (edge.b.y - edge.a.y) * t};
}

/** Project a collinear endpoint onto an edge, splitting overlapping runs. */
void AddProjection(Edge& edge, Point point, double epsilon) {
    const Point delta = Difference(edge.a, edge.b);
    const double length2 = delta.x * delta.x + delta.y * delta.y;
    const Point offset = Difference(edge.a, point);
    const double t = (offset.x * delta.x + offset.y * delta.y) / length2;
    // Only points on this finite segment create new topology.
    if (t > 0 && t < 1 && std::abs(Cross(delta, offset)) <= epsilon * std::sqrt(length2)) {
        edge.cuts.push_back(t);
    }
}

/** Split crossings and collinear overlaps before resolving visible boundaries. */
void Split(Edge& a, Edge& b, double epsilon) {
    const Point da = Difference(a.a, a.b);
    const Point db = Difference(b.a, b.b);
    const Point offset = Difference(a.a, b.a);
    const double cross = Cross(da, db);
    const double scale = std::hypot(da.x, da.y) * std::hypot(db.x, db.y);
    // Nonparallel edges have at most one intersection.
    if (std::abs(cross) > scale * 1e-13) {
        const double ta = Cross(offset, db) / cross;
        const double tb = Cross(offset, da) / cross;
        // Include endpoints so touching contours share a graph vertex.
        if (ta >= -1e-12 && ta <= 1 + 1e-12 && tb >= -1e-12 && tb <= 1 + 1e-12) {
            a.cuts.push_back(std::clamp(ta, 0.0, 1.0));
            b.cuts.push_back(std::clamp(tb, 0.0, 1.0));
        }
    } else {
        AddProjection(a, b.a, epsilon);
        AddProjection(a, b.b, epsilon);
        AddProjection(b, a.a, epsilon);
        AddProjection(b, a.b, epsilon);
    }
}

/** Evaluate the nonzero fill on either side of a split segment. */
int Winding(const std::vector<Edge>& edges, Point point) {
    int winding = 0;
    // Half-open Y ranges count shared vertices only once.
    for (const Edge& edge : edges) {
        const double side = Cross(Difference(edge.a, edge.b), Difference(edge.a, point));
        if (edge.a.y <= point.y && edge.b.y > point.y && side > 0) {
            ++winding;
        } else if (edge.b.y <= point.y && edge.a.y > point.y && side < 0) {
            --winding;
        }
    }
    return winding;
}

/** Extract directed visible edges, then trace every exterior and hole. */
Contours Boundaries(const std::vector<Edge>& edges, double epsilon) {
    using Key = std::pair<long long, long long>;
    std::map<Key, size_t> ids;
    Contour vertices;
    std::map<std::pair<size_t, size_t>, bool> unique;
    const auto Vertex = [&](Point point) {
        const Key key{std::llround(point.x / epsilon), std::llround(point.y / epsilon)};
        const auto found = ids.find(key);
        if (found != ids.end()) {
            return found->second;
        } else {
            const size_t id = vertices.size();
            ids.emplace(key, id);
            vertices.push_back(point);
            return id;
        }
    };
    // Interior overlaps are removed here, so borders never expose triangulation seams.
    for (const Edge& edge : edges) {
        for (size_t i = 1; i < edge.cuts.size(); ++i) {
            Point a = At(edge, edge.cuts[i - 1]);
            Point b = At(edge, edge.cuts[i]);
            const Point delta = Difference(a, b);
            const double length = std::hypot(delta.x, delta.y);
            if (length > epsilon) {
                const Point middle{(a.x + b.x) / 2, (a.y + b.y) / 2};
                const double offset = std::min(length * 1e-5, epsilon * 4);
                const Point normal{-delta.y / length * offset, delta.x / length * offset};
                const bool left = Winding(edges, {middle.x + normal.x, middle.y + normal.y}) != 0;
                const bool right = Winding(edges, {middle.x - normal.x, middle.y - normal.y}) != 0;
                // A true boundary separates filled and empty space.
                if (left != right) {
                    if (right) {
                        std::swap(a, b);
                    }
                    const size_t first = Vertex(a);
                    const size_t second = Vertex(b);
                    if (first != second) {
                        unique.emplace(std::make_pair(first, second), false);
                    }
                }
            }
        }
    }
    std::vector<std::pair<size_t, size_t>> links;
    std::vector<std::vector<size_t>> outgoing(vertices.size());
    for (const auto& item : unique) {
        outgoing[item.first.first].push_back(links.size());
        links.push_back(item.first);
    }
    std::vector<bool> used(links.size(), false);
    Contours result;
    constexpr double tau = 6.2831853071795864769;
    for (size_t start = 0; start < links.size(); ++start) {
        // Each directed boundary edge belongs to exactly one ring.
        if (!used[start]) {
            Contour contour;
            size_t current = start;
            bool closed = false;
            for (size_t count = 0; count <= links.size(); ++count) {
                used[current] = true;
                const auto [a, b] = links[current];
                contour.push_back(vertices[a]);
                if (b == links[start].first) {
                    closed = true;
                    break;
                } else {
                    const Point reverse = Difference(vertices[b], vertices[a]);
                    const double reference = std::atan2(reverse.y, reverse.x);
                    size_t next = links.size();
                    double best = std::numeric_limits<double>::infinity();
                    // Follow the face on the left at touching or intersecting vertices.
                    for (size_t candidate : outgoing[b]) {
                        if (!used[candidate]) {
                            const Point delta = Difference(vertices[b], vertices[links[candidate].second]);
                            const double angle = std::fmod(reference - std::atan2(delta.y, delta.x) + tau, tau);
                            if (angle < best) {
                                best = angle;
                                next = candidate;
                            }
                        }
                    }
                    if (next < links.size()) {
                        current = next;
                    } else {
                        throw std::runtime_error("Text boundary could not be closed.");
                    }
                }
            }
            if (closed && contour.size() >= 3) {
                result.push_back(std::move(contour));
            }
        }
    }
    return result;
}

/** Emit a nondegenerate CW triangle. */
void Triangle(Contour& triangles, Point a, Point b, Point c, double epsilon) {
    const double area = Cross(Difference(a, b), Difference(a, c));
    if (std::abs(area) > epsilon * epsilon) {
        if (area > 0) {
            std::swap(b, c);
        }
        triangles.insert(triangles.end(), {a, b, c});
    }
}

/** Evaluate X at a horizontal slice; caller excludes horizontal edges. */
double XAt(const Edge& edge, double y) {
    return edge.a.x + (edge.b.x - edge.a.x) * ((y - edge.a.y) / (edge.b.y - edge.a.y));
}

}

double Cross(Point a, Point b) {
    return a.x * b.y - a.y * b.x;
}

Point Difference(Point a, Point b) {
    return {b.x - a.x, b.y - a.y};
}

Mesh Tessellate(const Contours& contours) {
    std::vector<Edge> edges;
    double extent = 1;
    // Font-local coordinates keep tolerance independent from world translation.
    for (const Contour& contour : contours) {
        for (size_t i = 0; i < contour.size(); ++i) {
            const Point a = contour[i];
            const Point b = contour[(i + 1) % contour.size()];
            if (a.x != b.x || a.y != b.y) {
                edges.push_back({a, b});
                extent = std::max({extent, std::abs(a.x), std::abs(a.y)});
            }
        }
    }
    const double epsilon = extent * 1e-10;
    // Crossings become band boundaries; within one band edge ordering cannot change.
    for (size_t i = 0; i < edges.size(); ++i) {
        for (size_t j = i + 1; j < edges.size(); ++j) {
            Split(edges[i], edges[j], epsilon);
        }
    }
    std::vector<double> levels;
    for (Edge& edge : edges) {
        std::sort(edge.cuts.begin(), edge.cuts.end());
        edge.cuts.erase(std::unique(edge.cuts.begin(), edge.cuts.end()), edge.cuts.end());
        for (double cut : edge.cuts) {
            levels.push_back(At(edge, cut).y);
        }
    }
    std::sort(levels.begin(), levels.end());
    levels.erase(std::unique(levels.begin(), levels.end(), [epsilon](double a, double b) {
        return std::abs(a - b) <= epsilon;
    }), levels.end());
    Mesh mesh;
    mesh.contours = Boundaries(edges, epsilon);
    for (size_t band = 1; band < levels.size(); ++band) {
        const double bottom = levels[band - 1];
        const double top = levels[band];
        const double middle = (bottom + top) / 2;
        std::vector<std::pair<double, const Edge*>> active;
        for (const Edge& edge : edges) {
            // Half-open slices exclude horizontal edges and vertex ambiguity.
            if (middle > std::min(edge.a.y, edge.b.y) && middle < std::max(edge.a.y, edge.b.y)) {
                active.emplace_back(XAt(edge, middle), &edge);
            }
        }
        std::sort(active.begin(), active.end(), [](const auto& a, const auto& b) {
            return a.first < b.first;
        });
        int winding = 0;
        const Edge* left = nullptr;
        for (size_t i = 0; i < active.size();) {
            const int previous = winding;
            const Edge* edge = active[i].second;
            size_t end = i;
            // Coincident edges must change winding together, without a zero-width fill.
            while (end < active.size() && std::abs(active[end].first - active[i].first) <= epsilon) {
                if (active[end].second->b.y > active[end].second->a.y) {
                    ++winding;
                } else {
                    --winding;
                }
                ++end;
            }
            if (previous == 0 && winding != 0) {
                left = edge;
            } else if (previous != 0 && winding == 0 && left != nullptr) {
                const Point a{XAt(*left, bottom), bottom};
                const Point b{XAt(*edge, bottom), bottom};
                const Point c{XAt(*edge, top), top};
                const Point d{XAt(*left, top), top};
                Triangle(mesh.triangles, a, b, c, epsilon);
                Triangle(mesh.triangles, a, c, d, epsilon);
            }
            i = end;
        }
    }
    return mesh;
}

}
