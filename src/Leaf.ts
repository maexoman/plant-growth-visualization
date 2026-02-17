import type { Segment } from "./Growable";
import { Vec2 } from "./Vec2";

export class Leaf {
    readonly #stemStartPosition: Vec2;
    readonly #stemGrowDirection: Vec2;
    readonly #stemSizeMax: number;
    #stemSize: number;
    #stemEndPosition: Vec2;

    readonly #areaMax: number;
    #area: number;

    constructor(stemInfo: { startPosition: Vec2, growDirection: Vec2 }, stemSizeMax: number, leafAreaMax: number) {
        this.#stemStartPosition = stemInfo.startPosition;
        this.#stemGrowDirection = stemInfo.growDirection;
        this.#stemSizeMax = stemSizeMax;
        this.#stemSize = 0;
        this.#stemEndPosition = stemInfo.startPosition;

        this.#areaMax = leafAreaMax;
        this.#area = 0;
    }

    isFullyGrown() {
        return this.#stemSize >= this.#stemSizeMax && this.#area >= this.#areaMax;
    }

    grow() {
        if (this.#stemSize < this.#stemSizeMax) {
            this.#growStem();
            return;
        }

        if (this.#area < this.#areaMax) {
            this.#growLeaf();
            return;
        }
    }
    #growLeaf() {
        this.#area += 2;
    }

    #growStem() {
        this.#stemSize += 1;
        this.#stemEndPosition = Vec2.add(this.#stemStartPosition, this.#stemGrowDirection.scale(this.#stemSize));
    }

    get stemSegment(): Segment {
        return {
            startPosition: this.#stemStartPosition,
            endPosition: this.#stemEndPosition
        }
    }

    get area() {
        return this.#area;
    }
}