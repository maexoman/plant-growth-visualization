import type { Segment } from "./Growable";
import { Vec2 } from "./Vec2";

export type LeafState = 'growing' | 'mature' | 'dead';
export class Leaf {
    readonly #stemStartPosition: Vec2;
    readonly #stemGrowDirection: Vec2;
    readonly #stemSizeMax: number;
    #stemSize: number;
    #stemEndPosition: Vec2;

    #state: LeafState;

    // range: 0 - 100
    #health: number;

    readonly #areaMax: number;
    #growthPotential: number;
    #area: number;

    constructor(stemInfo: { startPosition: Vec2, growDirection: Vec2 }, growthPotential: number, stemSizeMax: number, leafAreaMax: number) {
        this.#stemStartPosition = stemInfo.startPosition;
        this.#stemGrowDirection = stemInfo.growDirection;
        this.#stemSizeMax = stemSizeMax;
        this.#stemSize = 0;
        this.#stemEndPosition = stemInfo.startPosition;

        this.#state = 'growing';

        this.#health = 10;

        this.#areaMax = leafAreaMax;
        this.#growthPotential = growthPotential;
        this.#area = 0;
    }

    get leafDirection() {
        return this.#stemGrowDirection.x <= 0 ? 'left' : 'right';
    }

    isDone(): unknown {
        if (this.#state === 'growing') {
            return false;
        }
        if (this.#stemSize < this.#growthPotential * this.#stemSizeMax) {
            return false;
        }
        if (this.#area < this.#growthPotential * this.#areaMax) {
            return false;
        }
        return true;
    }

    setGrowthPotential(potential: number) {
        this.#growthPotential = potential;
    }

    decreaseHealth() {
        if (this.#state === 'dead') {
            return;
        }
        this.#health -= 1;
        if (this.#health === 0) {
            this.#state = 'dead';
        }
    }

    increaseHealth() {
        if (this.#state === 'dead') {
            return;
        }
        this.#health += 1;
    }

    tick() {
    }

    grow() {
        if (this.#state !== 'growing') {
            return;
        }
        if (this.#stemSize < this.#growthPotential * this.#stemSizeMax) {
            this.#growStem();
            return;
        }

        if (this.#area < this.#growthPotential * this.#areaMax) {
            this.#growLeaf();
        } else {
            this.#state = 'mature';
        }
    }

    #growLeaf() {
        this.#area += 1;
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

    get health() {
        return this.#health;
    }
}