// High-Performance 2D QuadTree Spatial Index
// Enables O(log N) neighborhood queries for sensory raycasts and predator-prey searches.

export class QuadTree {
  constructor(boundary, capacity = 8) {
    this.boundary = boundary; // { x, y, width, height }
    this.capacity = capacity;
    this.points = [];
    this.divided = false;
    this.northwest = null;
    this.northeast = null;
    this.southwest = null;
    this.southeast = null;
  }

  subdivide() {
    const { x, y, width, height } = this.boundary;
    const halfW = width / 2;
    const halfH = height / 2;

    this.northwest = new QuadTree({ x: x, y: y, width: halfW, height: halfH }, this.capacity);
    this.northeast = new QuadTree({ x: x + halfW, y: y, width: halfW, height: halfH }, this.capacity);
    this.southwest = new QuadTree({ x: x, y: y + halfH, width: halfW, height: halfH }, this.capacity);
    this.southeast = new QuadTree({ x: x + halfW, y: y + halfH, width: halfW, height: halfH }, this.capacity);

    this.divided = true;
  }

  insert(point) {
    // point: { x, y, data }
    if (!this.contains(this.boundary, point)) {
      return false;
    }

    if (this.points.length < this.capacity && !this.divided) {
      this.points.push(point);
      return true;
    }

    if (!this.divided) {
      this.subdivide();
      // Push existing points down
      while (this.points.length > 0) {
        const p = this.points.pop();
        this.insertToChildren(p);
      }
    }

    return this.insertToChildren(point);
  }

  insertToChildren(point) {
    return (
      this.northwest.insert(point) ||
      this.northeast.insert(point) ||
      this.southwest.insert(point) ||
      this.southeast.insert(point)
    );
  }

  contains(rect, point) {
    return (
      point.x >= rect.x &&
      point.x <= rect.x + rect.width &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.height
    );
  }

  intersects(range, boundary) {
    return !(
      range.x > boundary.x + boundary.width ||
      range.x + range.width < boundary.x ||
      range.y > boundary.y + boundary.height ||
      range.y + range.height < boundary.y
    );
  }

  // Query points within a circular radius
  queryCircle(cx, cy, radius, found = []) {
    const range = {
      x: cx - radius,
      y: cy - radius,
      width: radius * 2,
      height: radius * 2
    };

    if (!this.intersects(range, this.boundary)) {
      return found;
    }

    const radSq = radius * radius;

    for (let i = 0; i < this.points.length; i++) {
      const p = this.points[i];
      const dx = p.x - cx;
      const dy = p.y - cy;
      if (dx * dx + dy * dy <= radSq) {
        found.push(p.data);
      }
    }

    if (this.divided) {
      this.northwest.queryCircle(cx, cy, radius, found);
      this.northeast.queryCircle(cx, cy, radius, found);
      this.southwest.queryCircle(cx, cy, radius, found);
      this.southeast.queryCircle(cx, cy, radius, found);
    }

    return found;
  }
}
