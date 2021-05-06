import * as PIXI from 'pixi.js';

// Branch
/* ---------------------*/
/* 0: id                */
/* 1: is leaft          */
/* 2: AABB_left limit   */
/* 3: AABB_top limit    */
/* 4: AABB_right limit  */
/* 5: AABB_bottom limit */
/* 6: parent id         */
/* 7: right leaf id     */
/* 8: left leaf id      */

// Body::Circle
/* -------------*/
/* 0: id        */
/* 1: x         */
/* 2: y         */
/* 3: radius    */
/* 4: scale     */
/* 5: tag       */
/* 6: spawnTime */

export function setupCollisions(bodiesMaxCount = 500): any {
  const { min, max } = Math;
  const bodies = new Map<number, number[]>();
  const branches = new Map<number, number[]>();
  let rootBranch: number[] = [];

  /**
   * For branches playing the role of nodes, that
   * don't represent bodies keep ids out of
   * bodies ids scope.
   */
  let lastNodeBranchIndex = bodiesMaxCount + 1;
  const index_id = 0;

  // Branch properties indexes
  const index_isLeaf = 1;
  const index_AABB_left = 2;
  const index_AABB_top = 3;
  const index_AABB_right = 4;
  const index_AABB_bottom = 5;
  const index_parentId = 6;
  const index_rightId = 7;
  const index_leftId = 8;

  // Circle properties indexes
  const index_x = 1;
  const index_y = 2;
  const index_radius = 3;
  const index_scale = 4;
  const index_tag = 5;
  const index_spawnTime = 6;

  let _id = 0;
  let _x = 0;
  let _y = 0;
  let _radius = 0;
  let _length = 0;
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
  let parentId = 0;
  let branchId = 0;
  let branch: number[] = [];
  let parent: number[] = [];
  let grandparent: number[] = [];
  let newParent: number[] = [];

  // Inserts a body into the BVH
  function insert(body: number[]): void {
    _id = body[index_id];
    _x = body[index_x];
    _y = body[index_y];
    _radius = body[index_radius];
    min_x = _x - _radius;
    min_y = _y - _radius;
    max_x = _x + _radius;
    max_y = _y + _radius;

    /**
     * Create branch node that will represent the body in the tree.
     * Its id should be the same as the id of the body it represents.
     */
    const newBranch = [_id, 1, min_x, min_y, max_x, max_y, -1, -1, -1];
    branches.set(_id, newBranch);

    if (rootBranch.length === 0) {
      rootBranch = newBranch;

      return;
    }

    let current = rootBranch;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      /** is of BranchType */
      if (current[index_isLeaf] === 0) {
        const left = branches.get(current[index_leftId])!;
        /** Get left AABB */
        left_min_x = left[index_AABB_left];
        left_min_y = left[index_AABB_top];
        left_max_x = left[index_AABB_right];
        left_max_y = left[index_AABB_bottom];

        /** Simulate new left AABB by extending it with newCircle AABB */
        const left_new_min_x = min(min_x, left_min_x);
        const left_new_min_y = min(min_y, left_min_y);
        const left_new_max_x = max(max_x, left_max_x);
        const left_new_max_y = max(max_y, left_max_y);

        const left_volume = (left_max_x - left_min_x) * (left_max_y - left_min_y);
        const left_new_volume =
          (left_new_max_x - left_new_min_x) * (left_new_max_y - left_new_min_y);
        const left_difference = left_new_volume - left_volume;

        /** Get right AABB */
        const right = branches.get(current[index_rightId])!;
        right_min_x = right[index_AABB_left];
        right_min_y = right[index_AABB_top];
        right_max_x = right[index_AABB_right];
        right_max_y = right[index_AABB_bottom];

        /** Simulate new right AABB by extending it with newCircle AABB */
        const right_new_min_x = min(min_x, right_min_x);
        const right_new_min_y = min(min_y, right_min_y);
        const right_new_max_x = max(max_x, right_max_x);
        const right_new_max_y = max(max_y, right_max_y);

        const right_volume = (right_max_x - right_min_x) * (right_max_y - right_min_y);
        const right_new_volume =
          (right_new_max_x - right_new_min_x) * (right_new_max_y - right_new_min_y);
        const right_difference = right_new_volume - right_volume;

        current[index_AABB_left] = min(left_new_min_x, right_new_min_x);
        current[index_AABB_top] = min(left_new_min_y, right_new_min_y);
        current[index_AABB_right] = max(left_new_max_x, right_new_max_x);
        current[index_AABB_bottom] = max(left_new_max_y, right_new_max_y);

        current = left_difference <= right_difference ? left : right;
      }
      // Leaf
      else {
        parentId = current[index_parentId];
        grandparent = parentId > -1 ? branches.get(parentId)! : [];
        parent_min_x = current[index_AABB_left];
        parent_min_y = current[index_AABB_top];
        parent_max_x = current[index_AABB_right];
        parent_max_y = current[index_AABB_bottom];
        branchId = lastNodeBranchIndex;
        lastNodeBranchIndex++;
        newParent = [
          branchId,
          0,
          min(min_x, parent_min_x),
          min(min_y, parent_min_y),
          max(max_x, parent_max_x),
          max(max_y, parent_max_y),
          parentId > -1 ? grandparent[index_id] : -1,
          newBranch[index_id],
          current[index_id],
        ];
        branches.set(branchId, newParent);
        current[index_parentId] = branchId;
        newBranch[index_parentId] = branchId;

        if (grandparent.length === 0) {
          rootBranch = newParent;
        } else if (grandparent[index_leftId] === current[index_id]) {
          grandparent[index_leftId] = branchId;
        } else {
          grandparent[index_rightId] = branchId;
        }

        break;
      }
    }
  }

  function remove(_branch: number[]): void {
    _id = _branch[index_id];
    /** Don't remove root body/branch */
    if (rootBranch.length > 0 && rootBranch[index_id] === _id) {
      rootBranch = [];

      return;
    }

    parentId = _branch[index_parentId];
    parent = branches.get(parentId)!;
    const grandparentId = parent[index_parentId];
    grandparent = grandparentId > -1 ? branches.get(grandparentId)! : [];
    const parentLeftId = parent[index_leftId];
    const parentLeft = parentLeftId > -1 ? branches.get(parentLeftId)! : [];
    const sibling = parentLeftId === _id ? branches.get(parent[index_rightId])! : parentLeft;

    sibling[index_parentId] = grandparent[index_id];

    if (grandparent.length > 0) {
      if (grandparent[index_leftId] === parentId) {
        grandparent[index_leftId] = sibling[index_id];
      } else {
        grandparent[index_rightId] = sibling[index_id];
      }

      let tempBranch = grandparent;

      while (tempBranch) {
        const left = branches.get(tempBranch[index_leftId])!;
        /** Get left AABB */
        left_min_x = left[index_AABB_left];
        left_min_y = left[index_AABB_top];
        left_max_x = left[index_AABB_right];
        left_max_y = left[index_AABB_bottom];

        /** Get right AABB */
        const right = branches.get(tempBranch[index_rightId])!;
        right_min_x = right[index_AABB_left];
        right_min_y = right[index_AABB_top];
        right_max_x = right[index_AABB_right];
        right_max_y = right[index_AABB_bottom];

        tempBranch[index_AABB_left] = min(left_min_x, right_min_x);
        tempBranch[index_AABB_top] = min(left_min_y, right_min_y);
        tempBranch[index_AABB_right] = max(left_max_x, right_max_x);
        tempBranch[index_AABB_bottom] = max(left_max_y, right_max_y);

        tempBranch = bodies.get(_branch[index_parentId])!;
      }
    } else {
      rootBranch = sibling;
    }

    branches.delete(_id);
    branches.delete(parentId);
  }

  /** Updates the BVH. Moved that have changed their positions removed/inserted. */
  function update(): void {
    bodies.forEach((body: number[]) => {
      _x = body[index_x];
      _y = body[index_y];
      _radius = body[index_radius];
      _id = body[index_id];
      branch = branches.get(_id)!;

      if (
        _x - _radius < branch[index_AABB_left] ||
        _y - _radius < branch[index_AABB_top] ||
        _x + _radius > branch[index_AABB_right] ||
        _y + _radius > branch[index_AABB_bottom]
      ) {
        remove(branch);
        insert(body);
      }
    });
  }

  // Returns a list of potential collisions for a body
  function getPotentials(body: number[]): number[][] {
    const potentials: number[][] = [];
    _id = body[index_id];
    branch = branches.get(_id)!;
    min_x = branch[index_AABB_left];
    min_y = branch[index_AABB_top];
    max_x = branch[index_AABB_right];
    max_y = branch[index_AABB_bottom];

    let current = rootBranch;
    if (current.length === 0 || current[index_isLeaf] === 1) {
      return potentials;
    }

    let traverse_left = true;
    while (current.length > 0) {
      if (traverse_left) {
        traverse_left = false;

        let left = current[index_isLeaf] === 0 ? branches.get(current[index_leftId])! : [];

        while (
          left.length > 0 &&
          left[index_AABB_right] >= min_x &&
          left[index_AABB_bottom] >= min_y &&
          left[index_AABB_left] <= max_x &&
          left[index_AABB_top] <= max_y
        ) {
          current = left;
          left = current[index_isLeaf] === 0 ? branches.get(current[index_leftId])! : [];
        }
      }

      const isLeaf = current[index_isLeaf] === 1;
      const right = isLeaf ? [] : branches.get(current[index_rightId])!;

      if (
        right.length > 0 &&
        right[index_AABB_right] > min_x &&
        right[index_AABB_bottom] > min_y &&
        right[index_AABB_left] < max_x &&
        right[index_AABB_top] < max_y
      ) {
        current = right;
        traverse_left = true;
      } else {
        if (isLeaf && current[index_id] !== _id) {
          potentials.push(bodies.get(current[index_id])!);
        }

        parent = current[index_parentId] > -1 ? [] : branches.get(current[index_parentId])!;

        if (parent.length > 0) {
          while (parent && parent[index_rightId] === current[index_id]) {
            current = parent;
            parent = branches.get(current[index_parentId])!;
          }

          current = parent!;
        } else {
          break;
        }
      }
    }

    return potentials;
  }

  function areCirclesColliding(a: number[], b: number[], result: number[]): boolean {
    /** Stage 1: AABB test step by step */
    const xA = a[index_x];
    const yA = a[index_y];
    const radiusA = a[index_radius];
    const scaleA = a[index_scale];
    const radiusAScaled = radiusA * scaleA;
    const a_min_x = xA - radiusAScaled;
    const a_min_y = yA - radiusAScaled;
    const a_max_x = xA + radiusAScaled;
    const a_max_y = yA + radiusAScaled;

    const xB = b[index_x];
    const yB = b[index_y];
    const radiusB = b[index_radius];
    const scaleB = b[index_scale];
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

    _length = Math.sqrt(length_squared);

    result[0] = radius_sum - _length;
    result[1] = difference_x / _length;
    result[2] = difference_y / _length;

    return true;
  }

  function drawCircles(context: PIXI.Graphics) {
    bodies.forEach((body: number[]) => {
      context.drawCircle(body[index_x], body[index_y], body[index_radius]);
    });
  }

  let isLeaf = 0;
  let width = 0;
  let height = 0;
  function drawBVH(context: PIXI.Graphics) {
    branches.forEach((_branch: number[]) => {
      [_id, isLeaf, min_x, min_y, max_x, max_y] = _branch;
      width = max_x - min_x;
      height = max_y - min_y;
      context.drawRect(min_x, min_y, width, height);
    });
  }

  function addCircle(id: number, x = -10, y = -10, radius = 1) {
    // prettier-ignore
    const circle = [
      id,                /* 0: id        */
      x,                 /* 1: x         */
      y,                 /* 2: y         */
      radius,            /* 3: radius    */
      1,                 /* 4: scale     */
      0,                 /* 5: tag       */
      performance.now(), /* 6: spawnTime */
    ];
    bodies.set(id, circle);
    insert(circle);
  }

  return {
    areCirclesColliding,
    bodies,
    branches,
    getPotentials,
    indexes: {
      index_id,
      index_parentId,
      index_rightId,
      index_leftId,
      index_AABB_left,
      index_AABB_top,
      index_AABB_right,
      index_AABB_bottom,
      index_x,
      index_y,
      index_radius,
      index_scale,
      index_tag,
      index_spawnTime,
    },
    insert,
    addCircle,
    remove,
    update,
    drawCircles,
    drawBVH,
  };
}
