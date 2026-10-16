#pragma once

#include <vector>

namespace bptext {

struct Point {
    double x = 0;
    double y = 0;
};

using Contour = std::vector<Point>;
using Contours = std::vector<Contour>;

struct Mesh {
    Contour triangles;
    Contours contours;
};

/** Resolve all contours using nonzero winding; return CW fill and interior-left boundaries. */
Mesh Tessellate(const Contours& contours);

/** Signed cross product of two vectors. */
double Cross(Point a, Point b);

/** Vector from a to b. */
Point Difference(Point a, Point b);

}
