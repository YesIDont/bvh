import * as PIXI from 'pixi.js';
import { randomUnitVector } from 'utils/math';

export function setupCollisions(bodiesMaxCount = 500): any {
  const { min, max, abs, sqrt } = Math;
  const bodies: number[][] = [];
  bodies.length = bodiesMaxCount;
  const branches: number[][] = [];
  const avilableNodeBranches: number[] = [];
  branches.length = 2 * bodiesMaxCount - 1;
  let lastNodeBranchIndex = bodiesMaxCount;
  let rootBranch: number[] = [];
  const iId = 0;

  // Branch/Leaf
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

  // Branch properties indexes
  const iIsLeaf = 1;
  const iAABB_left = 2;
  const iAABB_top = 3;
  const iAABB_right = 4;
  const iAABB_bottom = 5;
  const iParentId = 6;
  const iRightId = 7;
  const iLeftId = 8;

  // Body::Circle
  /* ------------- */
  /* 0: id         */
  /* 1: x          */
  /* 2: y          */
  /* 3: velocity x */
  /* 4: velocity y */
  /* 5: radius     */
  /* 6: scale      */
  /* 7: tag        */
  /* 8: spawnTime  */

  // Circle properties indexes
  const iX = 1;
  const iY = 2;
  const iXV = 3;
  const iYV = 4;
  const iRadius = 5;
  const iScale = 6;
  const iTag = 7;
  const iSpawnTime = 8;

  // Inserts a body into the BVH
  function insert(body: number[]): void {
    const id = body[iId];
    const x = body[iX];
    const y = body[iY];
    const radius = body[iRadius];
    const xMin = x - radius;
    const yMin = y - radius;
    const xMax = x + radius;
    const yMax = y + radius;

    /**
     * Create branch node that will represent the body in the tree.
     * Its id should be the same as the id of the body it represents.
     */
    const newBranch = [id, 1, xMin, yMin, xMax, yMax, -1, -1, -1];
    branches[id] = newBranch;

    if (rootBranch.length === 0) {
      rootBranch = newBranch;

      return;
    }

    let current = rootBranch;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      /** is of BranchType */
      if (current[iIsLeaf] === 0) {
        const left = branches[current[iLeftId]];
        /** Get left AABB */
        const xMinLeft = left[iAABB_left];
        const yMinLeft = left[iAABB_top];
        const xMaxLeft = left[iAABB_right];
        const yMaxLeft = left[iAABB_bottom];

        /** Simulate new left AABB by extending it with newCircle AABB */
        const left_new_min_x = min(xMin, xMinLeft);
        const left_new_min_y = min(yMin, yMinLeft);
        const left_new_max_x = max(xMax, xMaxLeft);
        const left_new_max_y = max(yMax, yMaxLeft);

        const left_volume = (xMaxLeft - xMinLeft) * (yMaxLeft - yMinLeft);
        const left_new_volume =
          (left_new_max_x - left_new_min_x) * (left_new_max_y - left_new_min_y);
        const left_difference = left_new_volume - left_volume;

        /** Get right AABB */
        const right = branches[current[iRightId]];
        const xMinRight = right[iAABB_left];
        const yMinRight = right[iAABB_top];
        const xMaxRight = right[iAABB_right];
        const yMaxRight = right[iAABB_bottom];

        /** Simulate new right AABB by extending it with newCircle AABB */
        const right_new_min_x = min(xMin, xMinRight);
        const right_new_min_y = min(yMin, yMinRight);
        const right_new_max_x = max(xMax, xMaxRight);
        const right_new_max_y = max(yMax, yMaxRight);

        const right_volume = (xMaxRight - xMinRight) * (yMaxRight - yMinRight);
        const right_new_volume =
          (right_new_max_x - right_new_min_x) * (right_new_max_y - right_new_min_y);
        const right_difference = right_new_volume - right_volume;

        current[iAABB_left] = min(left_new_min_x, right_new_min_x);
        current[iAABB_top] = min(left_new_min_y, right_new_min_y);
        current[iAABB_right] = max(left_new_max_x, right_new_max_x);
        current[iAABB_bottom] = max(left_new_max_y, right_new_max_y);

        current = left_difference <= right_difference ? left : right;
      }
      // Leaf
      else {
        const parentId = current[iParentId];
        const grandparent = branches[parentId] ?? [];
        const parent_min_x = current[iAABB_left];
        const parent_min_y = current[iAABB_top];
        const parent_max_x = current[iAABB_right];
        const parent_max_y = current[iAABB_bottom];
        const branchId = avilableNodeBranches.pop() ?? lastNodeBranchIndex++;
        const newParent = [
          branchId,
          0,
          min(xMin, parent_min_x),
          min(yMin, parent_min_y),
          max(xMax, parent_max_x),
          max(yMax, parent_max_y),
          parentId > -1 ? grandparent[iId] : -1,
          newBranch[iId],
          current[iId],
        ];
        branches[branchId] = newParent;
        current[iParentId] = branchId;
        newBranch[iParentId] = branchId;

        if (grandparent.length === 0) {
          rootBranch = newParent;
        } else if (grandparent[iLeftId] === current[iId]) {
          grandparent[iLeftId] = branchId;
        } else {
          grandparent[iRightId] = branchId;
        }

        break;
      }
    }
  }

  function remove(branch: number[]): void {
    const id = branch[iId];
    /** Don't remove root body/branch */
    if (rootBranch.length > 0 && rootBranch[iId] === id) {
      rootBranch = [];

      return;
    }

    const parentId = branch[iParentId];
    const parent = branches[parentId];
    const grandparent = branches[parent[iParentId]] ?? [];
    const parentLeftId = parent[iLeftId];
    const parentLeft = branches[parentLeftId] ?? [];
    const sibling = parentLeftId === id ? branches[parent[iRightId]] : parentLeft;

    sibling[iParentId] = grandparent[iId];

    if (grandparent.length > 0) {
      if (grandparent[iLeftId] === parentId) {
        grandparent[iLeftId] = sibling[iId];
      } else {
        grandparent[iRightId] = sibling[iId];
      }

      let tempBranch = grandparent;

      while (tempBranch) {
        const left = branches[tempBranch[iLeftId]];
        /** Get left AABB */
        const xMinLeft = left[iAABB_left];
        const yMinLeft = left[iAABB_top];
        const xMaxLeft = left[iAABB_right];
        const yMaxLeft = left[iAABB_bottom];

        /** Get right AABB */
        const right = branches[tempBranch[iRightId]];
        const xMinRight = right[iAABB_left];
        const yMinRight = right[iAABB_top];
        const xMaxRight = right[iAABB_right];
        const yMaxRight = right[iAABB_bottom];

        tempBranch[iAABB_left] = min(xMinLeft, xMinRight);
        tempBranch[iAABB_top] = min(yMinLeft, yMinRight);
        tempBranch[iAABB_right] = max(xMaxLeft, xMaxRight);
        tempBranch[iAABB_bottom] = max(yMaxLeft, yMaxRight);

        tempBranch = bodies[branch[iParentId]];
      }
    } else {
      rootBranch = sibling;
    }

    avilableNodeBranches.push(id, parentId);
  }

  /** Updates the BVH. Moved that have changed their positions removed/inserted. */
  function updateBVH(): void {
    /**
     * TODO: instead of iterating over all bodies
     * create array of ids of objects, that should
     * have their BVH updated. Object who's position
     * was changed will have it's id placed in that
     * array and after update removed from the array.
     * It's a solution to collisions where most of
     * bodies are static, otherwise it could do more
     * harm than optimisation.
     */
    bodies.forEach((body: number[]) => {
      const x = body[iX];
      const y = body[iY];
      const radius = body[iRadius];
      const branch = branches[body[iId]];

      if (
        x - radius < branch[iAABB_left] ||
        y - radius < branch[iAABB_top] ||
        x + radius > branch[iAABB_right] ||
        y + radius > branch[iAABB_bottom]
      ) {
        remove(branch);
        insert(body);
      }
    });
  }

  // Returns a list of potential collisions for a body
  function getPotentials(body: number[]): number[] {
    const potentials: number[] = [];
    if (rootBranch.length === 0 || rootBranch[iIsLeaf] === 1) {
      return potentials;
    }

    const id = body[iId];
    const branch = branches[id];
    const xMin = branch[iAABB_left];
    const yMin = branch[iAABB_top];
    const xMax = branch[iAABB_right];
    const yMax = branch[iAABB_bottom];

    let current = rootBranch;
    let traverse_left = true;
    while (current.length > 0) {
      if (traverse_left) {
        traverse_left = false;

        let left = current[iIsLeaf] === 0 ? branches[current[iLeftId]] : [];

        while (
          left.length > 0 &&
          left[iAABB_right] >= xMin &&
          left[iAABB_bottom] >= yMin &&
          left[iAABB_left] <= xMax &&
          left[iAABB_top] <= yMax
        ) {
          current = left;
          left = current[iIsLeaf] === 0 ? branches[current[iLeftId]] : [];
        }
      }

      const isLeaf = current[iIsLeaf] === 1;
      const right = isLeaf ? [] : branches[current[iRightId]];

      if (
        right.length > 0 &&
        right[iAABB_right] > xMin &&
        right[iAABB_bottom] > yMin &&
        right[iAABB_left] < xMax &&
        right[iAABB_top] < yMax
      ) {
        current = right;
        traverse_left = true;
      } else {
        if (isLeaf && current[iId] !== id) {
          potentials.push(current[iId]);
        }

        if (current[iParentId] > -1) {
          let parent = branches[current[iParentId]] ?? [];
          while (parent.length > 0 && parent[iRightId] === current[iId]) {
            current = parent;
            parent = branches[current[iParentId]] ?? [];
          }

          current = parent;
        } else {
          break;
        }
      }
    }

    return potentials;
  }

  function areCirclesColliding(aIndex: number, bIndex: number): boolean {
    /** Stage 1: AABB test step by step */
    const a = bodies[aIndex];
    const b = bodies[bIndex];
    const xA = a[iX];
    const yA = a[iY];
    const radiusA = a[iRadius];
    const scaleA = a[iScale];
    const radiusAScaled = radiusA * scaleA;
    const a_min_x = xA - radiusAScaled;
    const a_min_y = yA - radiusAScaled;
    const a_max_x = xA + radiusAScaled;
    const a_max_y = yA + radiusAScaled;

    const xB = b[iX];
    const yB = b[iY];
    const radiusB = b[iRadius];
    const scaleB = b[iScale];
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

    if (abs(length_squared) > radius_sum * radius_sum) {
      return false;
    }

    /**
     * Stage 3: collision response: push back both circles
     * by the half of the length of their overlap
     */
    let length = sqrt(length_squared);
    const x = difference_x / length;
    const y = difference_y / length;
    length = (radius_sum - length) * 0.5;
    a[1] -= length * x;
    a[2] -= length * y;
    b[1] += length * x;
    b[2] += length * y;

    return true;
  }

  function solveSingle(body: number[]): void {
    for (const other of getPotentials(body)) {
      areCirclesColliding(body[0], other);
    }
  }

  function solve(): void {
    updateBVH();
    bodies.forEach(solveSingle);
  }

  function drawCircles(context: PIXI.Graphics) {
    bodies.forEach((body: number[]) => {
      context.drawCircle(body[iX], body[iY], body[iRadius]);
    });
  }

  /** Draw the Bounding Volume Hierarchy */
  function drawBVH(context: PIXI.Graphics) {
    branches.forEach((branch: number[]) => {
      const xMin = branch[iAABB_left];
      const yMin = branch[iAABB_top];
      const xMax = branch[iAABB_right];
      const yMax = branch[iAABB_bottom];
      const width = xMax - xMin;
      const height = yMax - yMin;
      context.drawRect(xMin, yMin, width, height);
    });
  }

  function addCircle(id: number, x = -10, y = -10, radius = 1): number[] {
    const [xv, yv] = randomUnitVector();
    // prettier-ignore
    const circle = [
      id,                 /* 0: id          */
      x,                  /* 1: x           */
      y,                  /* 2: y           */
      xv,                 /* 3: velocity x  */
      yv,                 /* 4: velocity y  */
      radius,             /* 5: radius      */
      1,                  /* 6: scale       */
      0,                  /* 7: tag         */
      performance.now(),  /* 8: spawnTime   */
    ];
    bodies[id] = circle;
    insert(circle);

    return circle;
  }

  return {
    addCircle,
    bodies,
    branches,
    drawBVH,
    drawCircles,
    getPotentials,
    insert,
    remove,
    solve,
    updateBVH,
  };
}
