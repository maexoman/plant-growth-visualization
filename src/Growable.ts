import { Vec2 } from "./Vec2";
import type { World } from "./World";

export type GrowableOptions = {
    segmentMax: number;
    segmentSize: number;
    changeAngleMaxDeg: number;

    sunInfluence: Influence;
    gravityInfluence: Influence;
    randomJitterInfluence: Influence;
};

type Influence = {
    xInfluence: number;
    yInfluence: number;
}

export type Segment = {
    startPosition: Vec2;
    endPosition: Vec2;
};

export class Growable {
    readonly #startPosition: Vec2;

    readonly #segmentMax: number;
    readonly #segmentSize: number;
    readonly #changeAngleMaxRad: number;

    readonly #sunInfluence: Influence;
    readonly #gravityInfluence: Influence;
    readonly #randomJitterInfluence: Influence;

    #segments: Segment[];
    #lastGrowDirection: Vec2 | null = null;

    constructor(startPosition: Vec2, options: GrowableOptions) {
        this.#segmentMax = options.segmentMax;
        this.#segmentSize = options.segmentSize;
        this.#changeAngleMaxRad = degToRad(options.changeAngleMaxDeg);

        this.#startPosition = startPosition;
        this.#sunInfluence = options.sunInfluence;
        this.#gravityInfluence = options.gravityInfluence;
        this.#randomJitterInfluence = options.randomJitterInfluence;

        this.#segments = [];
    }

    isFullyGrown() {
        return this.segments.length >= this.#segmentMax;
    }

    grow(world: World) {
        if (this.isFullyGrown()) {
            return;
        }

        const newSegmentStartPosition = this.endPosition;

        let normalizedGrowDirection = this.#calculateNormalizedGrowDirection(world);
        if (this.#lastGrowDirection !== null) {
            normalizedGrowDirection = Vec2.clampVectorAngle(this.#lastGrowDirection, normalizedGrowDirection, this.#changeAngleMaxRad);
        }
        this.#lastGrowDirection = normalizedGrowDirection;

        const growDirection = normalizedGrowDirection.scale(this.#segmentSize);
        const newSegmentEndPosition = Vec2.add(newSegmentStartPosition, growDirection);
        this.#segments.push({ startPosition: newSegmentStartPosition, endPosition: newSegmentEndPosition });
    }

    get endPosition() {
        if (this.#segments.length > 0) {
            return this.#segments[this.#segments.length - 1].endPosition;
        }
        return this.#startPosition;
    }

    get normalizedLength() {
        return this.#segments.length / this.#segmentMax;
    }

    get length() {
        return this.#segments.length * this.#segmentSize;
    }

    calculateAuxillaryBud(angleDeg: number) {
        if (this.#lastGrowDirection === null) {
            return null;
        }
        const direction = Vec2.atAngle(this.#lastGrowDirection, degToRad(angleDeg));
        const position = this.endPosition;
        return {
            startPosition: position,
            growDirection: direction,
        };
    }

    #calculateNormalizedGrowDirection(world: World) {
        return Vec2.add(
            this.#calculateGravityInfluence(world),
            this.#calculateSunInfluence(world),
            this.#calculateRandomJitterInfluence(world)
        ).normalized();
    }

    #calculateSunInfluence(world: World) {
        const normalizedSunRay = world.calculateNormalizedSunRayTo(this.endPosition);
        return new Vec2(
            normalizedSunRay.x * this.#sunInfluence.xInfluence,
            normalizedSunRay.y * this.#sunInfluence.yInfluence
        );
    }

    #calculateGravityInfluence(world: World) {
        return new Vec2(
            world.gravity.x * this.#gravityInfluence.xInfluence,
            world.gravity.y * this.#gravityInfluence.yInfluence
        );
    }

    #calculateRandomJitterInfluence(world: World) {
        if (this.#randomJitterInfluence.xInfluence === 0 && this.#randomJitterInfluence.yInfluence === 0) {
            return Vec2.zero;
        }

        const randomJitterX = world.random.int(1, 100);
        const randomJitterXSign = world.random.int(0, 100) >= 50 ? -1 : 1;
        const randomJitterY = world.random.int(1, 100);
        const randomJitterYSign = world.random.int(0, 100) >= 50 ? -1 : 1;
        const randomJitter = new Vec2(randomJitterXSign * randomJitterX, randomJitterYSign * randomJitterY).normalized();

        return new Vec2(
            randomJitter.x * this.#randomJitterInfluence.xInfluence,
            randomJitter.y * this.#randomJitterInfluence.yInfluence
        );
    }

    get segments() {
        return this.#segments;
    }
}

function degToRad(degrees: number): number {
    return degrees * Math.PI / 180;
}