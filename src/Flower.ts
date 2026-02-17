import type { Random } from "./Random";
import type { Vec2 } from "./Vec2";

export class Flower {
    readonly #petalCount: number;
    readonly #sizeMax: number;

    readonly #position: Vec2;
    #size: number;

    constructor(random: Random, position: Vec2) {
        this.#petalCount = random.int(14, 18);
        this.#sizeMax = random.int(25, 30);
        this.#position = position;
        this.#size = 0;
    }


    get position() {
        return this.#position;
    }

    get size() {
        return this.#size;
    }

    get petalCount() {
        return this.#petalCount;
    }

    isFullyGrown() {
        return this.#size >= this.#sizeMax;
    }

    grow() {
        if (this.isFullyGrown()) {
            return;
        }

        this.#size += 1;
    }
}