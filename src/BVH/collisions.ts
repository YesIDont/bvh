import * as PIXI from 'pixi.js';

export function makeCircle(id = 0, x = 0, y = 0, radius = 1, scale = 1, tag = 0): number[] {
  return [
    // 0: id
    id,
    // 1: parent id,
    -1,
    // 2: right id,
    -1,
    // 3: left id,
    -1,
    // 4: AABB_left limit,
    0,
    // 5: AABB_top limit,
    0,
    // 6: AABB_right limit,
    0,
    // 7: AABB_bottom limit,
    0,
    // 8: x,
    x,
    // 9: y,
    y,
    // 10: radius,
    radius,
    // 11: scale,
    scale,
    // 12: tag,
    tag,
  ];
}

const i_id = 0;
const i_parentId = 1;
const i_rightId = 2;
const i_leftId = 3;
const i_AABB_left = 4;
const i_AABB_top = 5;
const i_AABB_right = 6;
const i_AABB_bottom = 7;
const i_x = 8;
const i_y = 9;
const i_radius = 10;
const i_scale = 11;
const i_tag = 12;

export function setupCollisions(): any {
  const { min, max } = Math;
  const bodies = new Map<number, number[]>();
  let root: number[] = [];

  let radius = 0;
  let _circle: number[] = [];
  let min_x = 0;
  let min_y = 0;
  let max_x = 0;
  let max_y = 0;
  let left_min_x = 0;
  let left_min_y = 0;
  let left_max_x = 0;
  let left_max_y = 0;
  let right_min_x = 0;
  let right_min_y = 0;
  let right_max_x = 0;
  let right_max_y = 0;
  let parent_min_x = 0;
  let parent_min_y = 0;
  let parent_max_x = 0;
  let parent_max_y = 0;

  // Inserts a body into the BVH
  function insert(id: number): void {
    _circle = bodies.get(id)!;
    const x = _circle[i_x];
    const y = _circle[i_y];
    radius = _circle[i_radius];
    const body_min_x = x - radius;
    const body_min_y = y - radius;
    const body_max_x = x + radius;
    const body_max_y = y + radius;

    _circle[i_AABB_left] = body_min_x;
    _circle[i_AABB_top] = body_min_y;
    _circle[i_AABB_right] = body_max_x;
    _circle[i_AABB_bottom] = body_max_y;

    if (!root[i_id]) {
      root = _circle;

      return;
    }

    let current = root;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      /** is of BranchType */
      if (current[10] < 0) {
        const left = bodies.get(current[i_leftId])!;
        /** Get left AABB */
        left_min_x = left[i_AABB_left];
        left_min_y = left[i_AABB_top];
        left_max_x = left[i_AABB_right];
        left_max_y = left[i_AABB_bottom];

        /** Simulate new left AABB by extending it with newCircle AABB */
        const left_new_min_x = min(body_min_x, left_min_x);
        const left_new_min_y = min(body_min_y, left_min_y);
        const left_new_max_x = max(body_max_x, left_max_x);
        const left_new_max_y = max(body_max_y, left_max_y);

        const left_volume = (left_max_x - left_min_x) * (left_max_y - left_min_y);
        const left_new_volume =
          (left_new_max_x - left_new_min_x) * (left_new_max_y - left_new_min_y);
        const left_difference = left_new_volume - left_volume;

        /** Get right AABB */
        const right = bodies.get(current[i_rightId])!;
        right_min_x = right[i_AABB_left];
        right_min_y = right[i_AABB_top];
        right_max_x = right[i_AABB_right];
        right_max_y = right[i_AABB_bottom];

        /** Simulate new right AABB by extending it with newCircle AABB */
        const right_new_min_x = min(body_min_x, right_min_x);
        const right_new_min_y = min(body_min_y, right_min_y);
        const right_new_max_x = max(body_max_x, right_max_x);
        const right_new_max_y = max(body_max_y, right_max_y);

        const right_volume = (right_max_x - right_min_x) * (right_max_y - right_min_y);
        const right_new_volume =
          (right_new_max_x - right_new_min_x) * (right_new_max_y - right_new_min_y);
        const right_difference = right_new_volume - right_volume;

        current[i_AABB_left] = min(left_new_min_x, right_new_min_x);
        current[i_AABB_top] = min(left_new_min_y, right_new_min_y);
        current[i_AABB_right] = max(left_new_max_x, right_new_max_x);
        current[i_AABB_bottom] = max(left_new_max_y, right_new_max_y);

        current = left_difference <= right_difference ? left : right;
      }
      // Leaf
      else {
        const grandparent = bodies.get(current[i_parentId]) ?? false;
        parent_min_x = current[i_AABB_left];
        parent_min_y = current[i_AABB_top];
        parent_max_x = current[i_AABB_right];
        parent_max_y = current[i_AABB_bottom];
        const new_parent = [
          // 0: id
          0,
          // 1: parent id,
          0,
          // 2: right id,
          0,
          // 3: left id,
          0,
          // 4: AABB_left limit,
          0,
          // 5: AABB_top limit,
          0,
          // 6: AABB_right limit,
          0,
          // 7: AABB_bottom limit,
          0,
        ];
        current[i_parentId] = new_parent[i_id];
        _circle[i_parentId] = new_parent[i_id];

        new_parent[i_leftId] = current[i_id];
        new_parent[i_rightId] = _circle[i_id];
        new_parent[i_parentId] = grandparent[i_id] ?? -1;
        new_parent[i_AABB_left] = min(body_min_x, parent_min_x);
        new_parent[i_AABB_top] = min(body_min_y, parent_min_y);
        new_parent[i_AABB_right] = max(body_max_x, parent_max_x);
        new_parent[i_AABB_bottom] = max(body_max_y, parent_max_y);

        if (!grandparent) {
          root = new_parent;
        } else if (grandparent[i_leftId] === current[i_id]) {
          grandparent[i_leftId] = new_parent[i_id];
        } else {
          grandparent[i_rightId] = new_parent[i_id];
        }

        break;
      }
    }
  }

  function remove(id: number): void {
    if (root && root[i_id] === id) {
      return;
    }

    _circle = bodies.get(id)!;
    const parent = _circle[i_parentId]!;
    const grandparent = parent[i_parentId]!;
    const parent_left = parent[i_leftId]!;
    const sibling = (parent_left[i_id] === id ? parent[i_rightId] : parent_left)!;

    sibling[i_parentId] = grandparent;

    if (grandparent) {
      if (grandparent.left === parent) {
        grandparent.left = sibling;
      } else {
        grandparent.right = sibling;
      }

      let branch = grandparent;

      while (branch) {
        const left = bodies.get(branch[i_leftId])!;
        /** Get left AABB */
        left_min_x = left[i_AABB_left];
        left_min_y = left[i_AABB_top];
        left_max_x = left[i_AABB_right];
        left_max_y = left[i_AABB_bottom];

        /** Get right AABB */
        const right = bodies.get(branch[i_rightId])!;
        right_min_x = right[i_AABB_left];
        right_min_y = right[i_AABB_top];
        right_max_x = right[i_AABB_right];
        right_max_y = right[i_AABB_bottom];

        branch[i_AABB_left] = min(left_min_x, right_min_x);
        branch[i_AABB_top] = min(left_min_y, right_min_y);
        branch[i_AABB_right] = max(left_max_x, right_max_x);
        branch[i_AABB_bottom] = max(left_max_y, right_max_y);

        branch = bodies.get(branch[i_parentId]);
      }
    } else {
      root = sibling;
    }
  }

  // Updates the BVH. Moved bodies are removed/inserted.
  function update(): void {
    const count = bodies.size;
    let x = 0;
    let y = 0;

    let i = 0;
    for (i = 0; i < count; ++i) {
      _circle = bodies.get(i)!;
      x = _circle[i_x];
      y = _circle[i_y];
      radius = _circle[i_radius];

      if (
        x - radius < _circle[i_AABB_left] ||
        y - radius < _circle[i_AABB_top] ||
        x + radius > _circle[i_AABB_right] ||
        y + radius > _circle[i_AABB_bottom]
      ) {
        remove(i);
        insert(i);
      }
    }
  }

  // Returns a list of potential collisions for a body
  function getPotentials(id: number): number[] {
    const potentials: number[] = [];
    _circle = bodies.get(id)!;
    min_x = _circle[i_AABB_left];
    min_y = _circle[i_AABB_top];
    max_x = _circle[i_AABB_right];
    max_y = _circle[i_AABB_bottom];

    let current = root;
    if (!current || current[i_radius] > 0 /** isn't of BranchType */) {
      return potentials;
    }

    let traverse_left = true;
    while (current) {
      if (traverse_left) {
        traverse_left = false;

        let left = !current[i_x] /** is of BranchType */ ? bodies.get(current[i_leftId])! : [];

        while (
          left[0] &&
          left[i_AABB_left] >= min_x &&
          left[i_AABB_top] >= min_y &&
          left[i_AABB_right] <= max_x &&
          left[i_AABB_bottom] <= max_y
        ) {
          current = left;
          left = current[0] < 0 /** is of BranchType */ ? bodies.get(current[i_leftId])! : [];
        }
      }

      const isBranch = !!current[i_x];
      const right = isBranch ? bodies.get(current[i_rightId])! : [];

      if (
        right[0] &&
        right[i_AABB_left] > min_x &&
        right[i_AABB_top] > min_y &&
        right[i_AABB_right] < max_x &&
        right[i_AABB_bottom] < max_y
      ) {
        current = right;
        traverse_left = true;
      } else {
        if (!isBranch && current[i_id] !== id) {
          potentials.push(current[i_id]);
        }

        let parent = bodies.get(current[i_parentId]);

        if (parent) {
          while (parent && parent[i_rightId] === current[i_id]) {
            current = parent;
            parent = bodies.get(current[i_parentId]);
          }

          current = parent!;
        } else {
          break;
        }
      }
    }

    return potentials;
  }

  function areCirclesColliding(aID: number, bID: number, result: number[]): boolean {
    const a = bodies[aID];
    const b = bodies[bID];
    /** Stage 1: AABB test step by step */
    const xA = a[i_x];
    const yA = a[i_y];
    const radiusA = a[i_radius];
    const scaleA = a[i_scale];
    const radiusAScaled = radiusA * scaleA;
    const a_min_x = xA - radiusAScaled;
    const a_min_y = yA - radiusAScaled;
    const a_max_x = xA + radiusAScaled;
    const a_max_y = yA + radiusAScaled;

    const xB = a[i_x];
    const yB = a[i_y];
    const radiusB = a[i_radius];
    const scaleB = a[i_scale];
    const radiusBScaled = radiusB * scaleB;
    const b_min_x = xB - radiusBScaled;
    const b_min_y = yB - radiusBScaled;
    const b_max_x = xB + radiusBScaled;
    const b_max_y = yB + radiusBScaled;

    if (a_min_x > b_max_x) return false;
    if (a_min_y > b_max_y) return false;
    if (a_max_x < b_min_x) return false;
    if (a_max_y < b_min_y) return false;

    /** Stage 2: circle vs circle collision/overlap detection */
    const difference_x = xB - xA;
    const difference_y = yB - yA;
    const radius_sum = radiusAScaled + radiusBScaled;
    const length_squared = difference_x * difference_x + difference_y * difference_y;

    if (length_squared > radius_sum * radius_sum) {
      return false;
    }

    const length = Math.sqrt(length_squared);

    // overlap length
    result[0] = radius_sum - length;
    // overlap x normal
    result[1] = difference_x / length;
    // overlap y normal
    result[2] = difference_y / length;

    return true;
  }

  function addCircle(id = 0, x = 0, y = 0, _radius = 1, scale = 1, tag = 0): void {
    const circle = makeCircle(id, x, y, _radius, scale, tag);
    bodies.set(id, circle);
    insert(id);
  }

  function drawCircles(context: PIXI.Graphics): void {
    bodies.forEach((circle: number[]) => {
      const x = circle[i_x];
      const y = circle[i_y];
      context.drawCircle(x, y, circle[i_radius]);
    });
  }

  return {
    insert,
    remove,
    update,
    getPotentials,
    areCirclesColliding,
    forEach: bodies.forEach.bind(bodies),
    addCircle,
    drawCircles,
  };
}
