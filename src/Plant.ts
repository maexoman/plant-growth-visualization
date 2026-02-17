import { Flower } from "./Flower";
import { Growable } from "./Growable";
import { Leaf } from "./Leaf";
import { Vec2 } from "./Vec2";
import type { World } from "./World";

export type PlantState = 'growing' | 'flowering' | 'dead';

export class Plant {
    readonly #ownerWorld: World;

    #state: PlantState;
    #stemG: Growable;
    #rootsG: Growable[];
    #leafs: Leaf[] = [];
    #flower: Flower | null = null;
    constructor(ownerWorld: World) {
        this.#ownerWorld = ownerWorld;

        this.#state = 'growing';

        this.#stemG = new Growable(new Vec2(ownerWorld.middleX, ownerWorld.groundY), {
            segmentMax: 250,
            segmentSize: 2,
            changeAngleMaxDeg: 2,

            sunInfluence: { xInfluence: -3, yInfluence: -3 },
            gravityInfluence: { xInfluence: 0, yInfluence: -1 },
            randomJitterInfluence: { xInfluence: 0, yInfluence: 0 },
        });
        this.#rootsG = Array(5).fill(1).map(() => new Growable(new Vec2(ownerWorld.middleX, ownerWorld.groundY), {
            segmentMax: 150,
            segmentSize: 1,
            changeAngleMaxDeg: 10,

            sunInfluence: { xInfluence: 5, yInfluence: 5 },
            gravityInfluence: { xInfluence: 0, yInfluence: 1 },
            randomJitterInfluence: { xInfluence: 5, yInfluence: 5 },
        }));
    }

    #total: number = 0;
    #temp: number = 0;
    update(deltaTime: number) {
        this.#temp += deltaTime;
        this.#total += deltaTime;
        // @ts-ignore
        // if (this.#temp >= 50) {
        if (this.#state === 'growing') {
            this.#stemG.grow(this.#ownerWorld);
            this.#rootsG.forEach(r => r.grow(this.#ownerWorld));
            this.#leafs.forEach(l => l.grow());
            this.#temp = 0;

            if (this.#ownerWorld.random.int(1, 100) < Math.round(0.05 * Math.round((0.75 - this.#stemG.normalizedLength) * 100))) {
                const sign = this.#leafs.length % 2 == 0 ? 1 : -1;
                // span leaf
                // const sign = this.#ownerWorld.random.int(0, 100) > 50 ? -1 : 1;
                const auxBud = this.#stemG.calculateAuxillaryBud(sign * this.#ownerWorld.random.int(20, 60));
                if (auxBud === null) {
                    return;
                }
                this.#leafs.push(
                    new Leaf(auxBud, this.#ownerWorld.random.int(50, 100), this.#ownerWorld.random.int(30, 50))
                )
            }

            if (this.#stemG.isFullyGrown() && this.#leafs.every(l => l.isFullyGrown())) {
                this.#state = 'flowering';
            }
        }

        if (this.#state === 'flowering') {
            if (this.#flower === null) {
                this.#flower = new Flower(this.#ownerWorld.random, this.#stemG.endPosition);
            }
            this.#flower.grow();
        }

        if (this.#total >= 30_000) {
            this.#state = 'dead';
        }

        // }
    }

    get state() {
        return this.#state;
    }

    reset() {
    }

    get flower() {
        return this.#flower;
    }

    get leafs() {
        return this.#leafs;
    }

    get topPosition() {
        return this.#stemG.endPosition;
    }

    get stemGSegments() {
        return this.#stemG.segments;
    }

    get rootGSegments() {
        return this.#rootsG.map(r => r.segments);
    }
}

