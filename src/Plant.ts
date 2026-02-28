import { Flower } from "./Flower";
import { Growable } from "./Growable";
import { Leaf } from "./Leaf";
import { PlantManager } from "./PlantManager";
import { Vec2 } from "./Vec2";
import type { Parameter, World } from "./World";

export type PlantState = 'growing' | 'flowering' | 'dead';

export type GrowthProbabilities = {
    growthProbabilities: {
        stem: number;
        roots: number;
        leafs: number;
        flower: number;
    };

    creationProbabilities: {
        leaf: number;
    };

    transitionProbabilities: {
        toDead: number;
        toFlowering: number;
    };
};

export type Resources = {
    water: Parameter;
    carbonDioxide: Parameter;
    nutrients: Parameter;
};

export type Environment = {
    lightHours: Parameter;
    temperature: Parameter;
}

export type PlantInfo = {
    age: number;

    state: PlantState;
    normalizedStemLength: number;
    normalizedRootLength: number;

    leafCount: number;
};

export type GrowthPolicy = (environment: Environment, resources: Resources, plantInfo: PlantInfo) => GrowthProbabilities;

export class Plant {
    readonly #ownerWorld: World;

    #state: PlantState;
    #age: number = 0;

    // range: 0 - 100
    #stemHealth: number;
    #stem: Growable;
    #roots: Growable[];
    #leafs: Leaf[] = [];
    #flower: Flower | null = null;

    #stemGrowthPotential: number = 1;
    #rootGrowthPotential: number = 1;
    #leafGrowthPotential: number = 1;

    #manager: PlantManager;
    // #policy: GrowthPolicy;
    constructor(ownerWorld: World) {
        this.#ownerWorld = ownerWorld;

        this.#state = 'growing';
        this.#manager = new PlantManager(this);

        this.#stemHealth = 100;
        this.#stem = new Growable(new Vec2(ownerWorld.middleX, ownerWorld.groundY), {
            segmentMax: this.#ownerWorld.random.int(175, 200),
            segmentSize: 2,
            changeAngleMaxDeg: 2,
            growthPotential: this.#stemGrowthPotential,

            sunInfluence: { xInfluence: -3, yInfluence: -3 },
            gravityInfluence: { xInfluence: 0, yInfluence: -1 },
            randomJitterInfluence: { xInfluence: 0, yInfluence: 0 },
        });
        this.#roots = Array(5).fill(1).map(() => new Growable(new Vec2(ownerWorld.middleX, ownerWorld.groundY), {
            segmentMax: this.#ownerWorld.random.int(175, 200),
            segmentSize: 1,
            changeAngleMaxDeg: this.#ownerWorld.random.int(5, 15),
            growthPotential: this.#rootGrowthPotential,

            sunInfluence: { xInfluence: 5, yInfluence: 5 },
            gravityInfluence: { xInfluence: 0, yInfluence: 1 },
            randomJitterInfluence: { xInfluence: 5, yInfluence: 5 },
        }));

        this.#manager.manage(this.#ownerWorld.environment, this.#ownerWorld.resources);
    }

    decreaseStemHealth() {
        if (this.#state === 'dead') {
            return;
        }
        this.#stemHealth = Math.max(0, this.#stemHealth - 1);
    }

    increaseStemHealth() {
        if (this.#state === 'dead') {
            return;
        }

        this.#stemHealth = Math.min(100, this.#stemHealth + 1);
    }

    die() {
        this.#state = 'dead';
    }

    isGrowing() {
        return this.#state === 'growing';
    }

    isFlowering() {
        return this.#state === 'flowering';
    }

    isStemFullyGrown() {
        return this.#stem.isFullyGrown();
    }

    beginFlowering() {
        if (this.#state === 'dead') {
            return;
        }

        if (this.#flower === null) {
            this.#flower = new Flower(this.#ownerWorld.random, this.#stem.endPosition);
        }
        this.#state = 'flowering';
    }

    growFlower() {
        if (this.#state !== 'flowering') {
            return;
        }
        if (this.#flower === null) {
            return;
        }
        this.#flower.grow();
    }

    growStem() {
        if (this.#state !== 'growing') {
            return;
        }
        this.#stem.grow(this.#ownerWorld);
    }

    leafCount() {
        return this.#leafs.length;
    }

    stemLength() {
        return this.#stem.length;
    }

    growRoots() {
        if (this.#state !== 'growing') {
            return;
        }
        this.#roots.forEach(r => r.grow(this.#ownerWorld));
    }

    createLeaf() {
        if (this.#state !== 'growing') {
            return;
        }

        const sign = this.#leafs.length % 2 == 0 ? 1 : -1;
        const auxBud = this.#stem.calculateAuxillaryBud(sign * this.#ownerWorld.random.int(20, 60));
        if (auxBud === null) {
            return;
        }

        this.#leafs.push(
            new Leaf(auxBud, this.#leafGrowthPotential, this.#ownerWorld.random.int(25, 50), this.#ownerWorld.random.int(30, 50))
        );
    }

    growLeafs() {
        this.#leafs.forEach(l => l.grow());
    }

    setStemSizePotential(potential: number) {
        this.#stemGrowthPotential = potential;
        this.#stem.setGrowthPotential(potential);
    }

    setRootSizePotential(potential: number) {
        this.#rootGrowthPotential = potential;
        this.#roots.forEach(r => r.setGrowthPotential(potential));
    }

    setLeafSizePotential(leafSizePotential: number) {
        this.#leafGrowthPotential = leafSizePotential;
        this.#leafs.forEach(l => l.setGrowthPotential(leafSizePotential));
    }

    increaseLeafHealth() {
        this.#leafs.forEach(l => l.increaseHealth());
    }

    decreaseLeafHealth() {
        this.#leafs.forEach(l => l.decreaseHealth());
    }

    tick() {
        this.#manager.tick();
        this.#age += 1;
        this.#stem.tick();
        this.#roots.forEach(r => r.tick());
    }

    update(_: number) {
        if (this.#state === 'dead') {
            console.log('dead');
            return;
        }

        this.#manager.manage(this.#ownerWorld.environment, this.#ownerWorld.resources);
        this.tick();
    }

    get state() {
        return this.#state;
    }

    get flower() {
        return this.#flower;
    }

    get leafs() {
        return this.#leafs;
    }

    get topPosition() {
        return this.#stem.endPosition;
    }

    get stemHealth() {
        return this.#stemHealth;
    }

    get stemSegments() {
        return this.#stem.segments;
    }

    get rootSegments() {
        return this.#roots.map(r => r.segments);
    }
}

