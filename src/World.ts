// import { Vec2 } from "./Vec2";

import { Plant } from "./Plant";
import type { Random } from "./Random";
import { Vec2 } from "./Vec2";

const SKY_RATIO = 3 / 4;
const SUN_RATIO = 0 / 8;
const SUN_MOVEMENT_MAX = 3 / 4;

export class World {
    readonly random: Random;

    readonly #width: number;
    readonly #height: number;

    readonly middleX: number;
    readonly groundY: number;
    readonly sunY: number;

    #sunPosition: Vec2;
    #gravity: Vec2;

    #plant: Plant;
    #stemSegmentsCache: Vec2[] = [];

    constructor(random: Random, width: number, height: number) {
        this.random = random;
        this.#width = width;
        this.#height = height;

        this.middleX = Math.round(this.#width / 2);
        this.sunY = Math.round(this.#height * (1 - SUN_RATIO));
        this.groundY = Math.round(this.#height * (1 - SKY_RATIO));

        this.#gravity = new Vec2(0, 0);
        this.#sunPosition = new Vec2(this.middleX, this.sunY);
        this.#plant = new Plant(this);
    }

    moveSun(offset: number) {
        const isInBounds = -100 <= offset && offset <= 100;
        if (!isInBounds) {
            console.warn(`offset not in range [-100, 100]. offset: ${offset}`);
            return;
        }

        const movementPercent = offset / 100; // [-1, 1]
        const movementMax = (SUN_MOVEMENT_MAX * this.#width);
        const movement = movementPercent * (1 / 2) * movementMax;
        this.#sunPosition = new Vec2(this.middleX + movement, this.sunY);
    }

    setGravity(gravity: number) {
        const isInBounds = 0 <= gravity && gravity <= 10;
        if (!isInBounds) {
            console.warn(`offset not in range [0, 10]. offset: ${gravity}`);
            return;
        }
        // return; // TODO: remove
        this.#gravity = new Vec2(0, -gravity);
    }

    update(deltaTime: number) {
        this.#plant.update(deltaTime);
    }

    reset() {
        this.#plant.reset();
    }


    isExposedToSun(position: Vec2) {
        return position.y >= this.groundY;
    }

    calculateNormalizedSunRayTo(position: Vec2) {
        if (!this.isExposedToSun(position)) {
            return Vec2.zero;
        }

        const sunRayX = position.x - this.#sunPosition.x;
        const sunRayY = position.y - this.#sunPosition.y;
        return new Vec2(sunRayX, sunRayY).normalized();

    }

    get sunPosition() {
        return this.#sunPosition;
    }

    get gravity() {
        return this.#gravity;
    }

    get sunRay() {
        return this.calculateNormalizedSunRayTo(new Vec2(this.middleX, this.groundY));
    }

    get plant() {
        return this.#plant;
    }

    get flower() {
        return this.#plant.flower;
    }

    get leafs() {
        return this.#plant.leafs;
    }

    get stemSegments() {
        return this.#stemSegmentsCache;
    }


    get stemGSegments() {
        return this.#plant.stemGSegments;
    }

    get rootGSegments() {
        return this.#plant.rootGSegments
    }
}