import * as PIXI from 'pixi.js';

interface VolumeAABBType {
  id: number;
  radius: number;
  parent: VolumeAABBType | CircleMinimal | undefined;
  right: VolumeAABBType | CircleMinimal | undefined;
  left: VolumeAABBType | CircleMinimal | undefined;
  AABB_left: number;
  AABB_top: number;
  AABB_right: number;
  AABB_bottom: number;
}

export class CircleMinimal {
  id: number;
  x: number;
  y: number;
  radius: number;
  scale: number;
  tag: number;
  parent: VolumeAABBType | CircleMinimal | undefined;
  right: VolumeAABBType | CircleMinimal | undefined;
  left: VolumeAABBType | CircleMinimal | undefined;
  AABB_left: number;
  AABB_top: number;
  AABB_right: number;
  AABB_bottom: number;

  constructor(id = 0, x = 0, y = 0, radius = 1, scale = 1, tag = 0) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.scale = scale;
    this.tag = tag;
    this.parent = undefined;
    this.right = undefined;
    this.left = undefined;
    this.AABB_left = 0;
    this.AABB_top = 0;
    this.AABB_right = 0;
    this.AABB_bottom = 0;
  }

  draw(context: PIXI.Graphics): void {
    const { x, y, radius: radiusWithoutScale, scale } = this;
    const radius = radiusWithoutScale * scale;
    context.moveTo(x + radius, y);
    context.drawCircle(x, y, radius);
  }
}

type setupReturnType = {
  insert: (circle: CircleMinimal, updating?: boolean) => void;
  remove: (circle: CircleMinimal, updating?: boolean) => void;
  getPotentials: (body: CircleMinimal) => CircleMinimal[];
  update: () => void;
  areCirclesColliding: (a: CircleMinimal, b: CircleMinimal) => boolean;
  forEach: (callback: (circle: CircleMinimal) => void) => void;
};

export function setupCircleMinimalCollisions(): setupReturnType {
  const { min, max } = Math;
  const bodies: CircleMinimal[] = [];
  const branchPool: VolumeAABBType[] = [];
  let root: VolumeAABBType | undefined;

  // Inserts a body into the BVH
  function insert(circle: CircleMinimal, updating = false): void {
    if (!updating) {
      bodies.push(circle);
    }

    const { x, y, radius } = circle;
    const body_min_x = x - radius;
    const body_min_y = y - radius;
    const body_max_x = x + radius;
    const body_max_y = y + radius;

    circle.AABB_left = body_min_x;
    circle.AABB_top = body_min_y;
    circle.AABB_right = body_max_x;
    circle.AABB_bottom = body_max_y;

    if (!root) {
      root = circle;

      return;
    }

    let current = root;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      /** is of BranchType */
      if (current.radius < 0) {
        const left = current.left!;
        /** Get left AABB */
        const {
          AABB_left: left_min_x,
          AABB_top: left_min_y,
          AABB_right: left_max_x,
          AABB_bottom: left_max_y,
        } = left;

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
        const right = current.right!;
        const {
          AABB_left: right_min_x,
          AABB_top: right_min_y,
          AABB_right: right_max_x,
          AABB_bottom: right_max_y,
        } = right;

        /** Simulate new right AABB by extending it with newCircle AABB */
        const right_new_min_x = min(body_min_x, right_min_x);
        const right_new_min_y = min(body_min_y, right_min_y);
        const right_new_max_x = max(body_max_x, right_max_x);
        const right_new_max_y = max(body_max_y, right_max_y);

        const right_volume = (right_max_x - right_min_x) * (right_max_y - right_min_y);
        const right_new_volume =
          (right_new_max_x - right_new_min_x) * (right_new_max_y - right_new_min_y);
        const right_difference = right_new_volume - right_volume;

        current.AABB_left = min(left_new_min_x, right_new_min_x);
        current.AABB_top = min(left_new_min_y, right_new_min_y);
        current.AABB_right = max(left_new_max_x, right_new_max_x);
        current.AABB_bottom = max(left_new_max_y, right_new_max_y);

        current = left_difference <= right_difference ? left : right;
      }
      // Leaf
      else {
        const grandparent = current.parent;
        const {
          AABB_left: parent_min_x,
          AABB_top: parent_min_y,
          AABB_right: parent_max_x,
          AABB_bottom: parent_max_y,
        } = current;
        const new_parent =
          branchPool.length > 0
            ? branchPool.pop()!
            : /* prettier-ignore */ {
              id: -9,
              radius: -1,
              parent: undefined,
              left: undefined,
              right: undefined,
              AABB_left: 0,
              AABB_top: 0,
              AABB_right: 0,
              AABB_bottom: 0,
            };
        current.parent = new_parent;
        circle.parent = new_parent;

        new_parent.left = current;
        new_parent.right = circle;
        new_parent.parent = grandparent;
        new_parent.AABB_left = min(body_min_x, parent_min_x);
        new_parent.AABB_top = min(body_min_y, parent_min_y);
        new_parent.AABB_right = max(body_max_x, parent_max_x);
        new_parent.AABB_bottom = max(body_max_y, parent_max_y);

        if (!grandparent) {
          root = new_parent;
        } else if (grandparent.left === current) {
          grandparent.left = new_parent;
        } else {
          grandparent.right = new_parent;
        }

        break;
      }
    }
  }

  function remove(circle: CircleMinimal, updating = false): void {
    if (root && root.id === circle.id) {
      return;
    }

    if (!updating) {
      bodies.splice(bodies.indexOf(circle), 1);
    }

    const { parent } = circle;
    const grandparent = parent!.parent;
    const parent_left = parent!.left;
    const sibling = (parent_left === circle ? parent!.right : parent_left)!;

    sibling.parent = grandparent;

    if (grandparent) {
      if (grandparent.left === parent) {
        grandparent.left = sibling;
      } else {
        grandparent.right = sibling;
      }

      let branch = grandparent;

      while (branch) {
        const {
          AABB_left: left_min_x,
          AABB_top: left_min_y,
          AABB_right: left_max_x,
          AABB_bottom: left_max_y,
        } = branch.left!;

        const {
          AABB_left: right_min_x,
          AABB_top: right_min_y,
          AABB_right: right_max_x,
          AABB_bottom: right_max_y,
        } = branch.right!;

        branch.AABB_left = min(left_min_x, right_min_x);
        branch.AABB_top = min(left_min_y, right_min_y);
        branch.AABB_right = max(left_max_x, right_max_x);
        branch.AABB_bottom = max(left_max_y, right_max_y);

        branch = branch.parent as CircleMinimal;
      }
    } else {
      root = sibling;
    }

    branchPool.push(parent!);
  }

  // Updates the BVH. Moved bodies are removed/inserted.
  function update(): void {
    const count = bodies.length;

    let i = 0;
    for (i = 0; i < count; ++i) {
      const body = bodies[i];
      const { x, y, radius } = body as CircleMinimal;

      if (
        x - radius < body.AABB_left ||
        y - radius < body.AABB_top ||
        x + radius > body.AABB_right ||
        y + radius > body.AABB_bottom
      ) {
        remove(body, true);
        insert(body, true);
      }
    }
  }

  // Returns a list of potential collisions for a body
  function getPotentials(circle: CircleMinimal): CircleMinimal[] {
    const potentials: CircleMinimal[] = [];
    const { AABB_left: min_x, AABB_top: min_y, AABB_right: max_x, AABB_bottom: max_y } = circle;

    let current = root;
    if (!current || current.radius > 0 /** isn't of BranchType */) {
      return potentials;
    }

    let traverse_left = true;
    while (current) {
      if (traverse_left) {
        traverse_left = false;

        let left = current.radius < 0 /** is of BranchType */ ? current.left : undefined;

        while (
          left &&
          left.AABB_right >= min_x &&
          left.AABB_bottom >= min_y &&
          left.AABB_left <= max_x &&
          left.AABB_top <= max_y
        ) {
          current = left;
          left = current!.radius < 0 /** is of BranchType */ ? current!.left : undefined;
        }
      }

      const isBranch = current.radius < 0;
      const right = isBranch ? current!.right : undefined;

      if (
        right &&
        right.AABB_right > min_x &&
        right.AABB_bottom > min_y &&
        right.AABB_left < max_x &&
        right.AABB_top < max_y
      ) {
        current = right;
        traverse_left = true;
      } else {
        if (!isBranch && current.id !== circle.id) {
          potentials.push(current as CircleMinimal);
        }

        let { parent } = current!;

        if (parent) {
          while (parent && parent.right === current) {
            current = parent;
            parent = current.parent;
          }

          current = parent!;
        } else {
          break;
        }
      }
    }

    return potentials;
  }

  function areCirclesColliding(a: CircleMinimal, b: CircleMinimal): boolean {
    /** Stage 1: AABB test step by step */
    const { x: xA, y: yA, radius: radiusA, scale: scaleA } = a;
    const radiusAScaled = radiusA * scaleA;
    const a_min_x = xA - radiusAScaled;
    const a_min_y = yA - radiusAScaled;
    const a_max_x = xA + radiusAScaled;
    const a_max_y = yA + radiusAScaled;

    const { x: xB, y: yB, radius: radiusB, scale: scaleB } = b;
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

    return true;
  }

  return {
    insert,
    remove,
    update,
    getPotentials,
    areCirclesColliding,
    forEach: bodies.forEach.bind(bodies),
  };
}
