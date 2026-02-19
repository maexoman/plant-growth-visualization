import { Flower } from "./Flower";
import { Growable } from "./Growable";
import { Leaf } from "./Leaf";
import { Vec2 } from "./Vec2";
import type { World } from "./World";

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
    water: number;
    carbonDioxide: number;
    nutrients: number;
};

export type Environment = {
    lightHours: number;
    temperature: number;
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

    #stem: Growable;
    #roots: Growable[];
    #leafs: Leaf[] = [];
    #flower: Flower | null = null;

    #policy: GrowthPolicy;
    constructor(ownerWorld: World) {
        this.#ownerWorld = ownerWorld;

        this.#state = 'growing';

        this.#policy = (environment: Environment, resources: Resources, plantInfo: PlantInfo) => {
            if (plantInfo.state === 'dead') {
                return {
                    growthProbabilities: {
                        stem: 0,
                        roots: 0,
                        leafs: 0,
                        flower: 0,
                    },

                    creationProbabilities: {
                        leaf: 0,
                    },

                    transitionProbabilities: {
                        toDead: 0,
                        toFlowering: 0,
                    }
                };
            }

            const OPTIMUM_GROWTH_PROBABILITIES = {
                stem: 100,
                roots: 100,
                leafs: 100,
                flower: 100,
            };

            const OPTIMUM_CREATION_PROBABILITIES = {
                leaf: 4,
            };

            const growthProbabilities = {
                stem: OPTIMUM_GROWTH_PROBABILITIES.stem,
                roots: OPTIMUM_GROWTH_PROBABILITIES.roots,
                leafs: OPTIMUM_GROWTH_PROBABILITIES.leafs,
                flower: OPTIMUM_GROWTH_PROBABILITIES.flower,
            };

            const creationProbabilities = {
                leaf: OPTIMUM_CREATION_PROBABILITIES.leaf,
            };


            const transitionProbabilities = {
                toDead: 0,
                toFlowering: 0,
            };

            // allowed: step: 2, range: 0 - 24
            if (environment.lightHours === 0) {
                growthProbabilities.stem -= 0.00 * OPTIMUM_GROWTH_PROBABILITIES.stem;
                growthProbabilities.roots -= 0.00 * OPTIMUM_GROWTH_PROBABILITIES.roots;
                growthProbabilities.leafs -= 1.00 * OPTIMUM_GROWTH_PROBABILITIES.leafs;
                growthProbabilities.flower -= 0.50 * OPTIMUM_GROWTH_PROBABILITIES.flower;

                creationProbabilities.leaf -= 1.00 * creationProbabilities.leaf;

                transitionProbabilities.toDead += plantInfo.normalizedStemLength * (plantInfo.age / 1_000) * 50;
                transitionProbabilities.toFlowering -= 50;
            } else if (0 < environment.lightHours && environment.lightHours <= 8) {
                growthProbabilities.stem -= 0.20 * OPTIMUM_GROWTH_PROBABILITIES.stem;
                growthProbabilities.roots -= 0.00 * OPTIMUM_GROWTH_PROBABILITIES.roots;
                growthProbabilities.leafs -= 0.75 * OPTIMUM_GROWTH_PROBABILITIES.leafs;
                growthProbabilities.flower -= 0.75 * OPTIMUM_GROWTH_PROBABILITIES.flower;

                creationProbabilities.leaf -= 0.50 * OPTIMUM_CREATION_PROBABILITIES.leaf;

                transitionProbabilities.toDead += 0;
                transitionProbabilities.toFlowering -= 25;

            } else if (8 < environment.lightHours && environment.lightHours <= 16) {
                // optimum
                growthProbabilities.stem -= 0.00 * OPTIMUM_GROWTH_PROBABILITIES.stem;
                growthProbabilities.roots -= 0.00 * OPTIMUM_GROWTH_PROBABILITIES.roots;
                growthProbabilities.leafs -= 0.00 * OPTIMUM_GROWTH_PROBABILITIES.leafs;
                growthProbabilities.flower -= 0.00 * OPTIMUM_GROWTH_PROBABILITIES.flower;

                creationProbabilities.leaf -= 0.00 * OPTIMUM_CREATION_PROBABILITIES.leaf;

                transitionProbabilities.toDead += 0;
                transitionProbabilities.toFlowering += 0;
            } else {
                growthProbabilities.stem -= 0.05 * OPTIMUM_GROWTH_PROBABILITIES.stem;
                growthProbabilities.roots -= 0.00 * OPTIMUM_GROWTH_PROBABILITIES.roots;
                growthProbabilities.leafs -= 0.05 * OPTIMUM_GROWTH_PROBABILITIES.leafs;
                growthProbabilities.flower -= 0.05 * OPTIMUM_GROWTH_PROBABILITIES.flower;

                creationProbabilities.leaf -= 0.05 * OPTIMUM_CREATION_PROBABILITIES.leaf;

                transitionProbabilities.toDead += 0;
                transitionProbabilities.toFlowering += 0;
            }

            // allowed: step: 5, range: 0 - 40
            if (environment.temperature < 10) {
                growthProbabilities.stem -= 1.00 * OPTIMUM_GROWTH_PROBABILITIES.stem;
                growthProbabilities.roots -= 1.00 * OPTIMUM_GROWTH_PROBABILITIES.roots;
                growthProbabilities.leafs -= 1.00 * OPTIMUM_GROWTH_PROBABILITIES.leafs;
                growthProbabilities.flower -= 1.00 * OPTIMUM_GROWTH_PROBABILITIES.flower;

                creationProbabilities.leaf -= 1.00 * OPTIMUM_CREATION_PROBABILITIES.leaf;

                transitionProbabilities.toDead += environment.temperature < 5 ? 75 : 50;
                transitionProbabilities.toFlowering -= 100;
            } else if (10 <= environment.temperature && environment.temperature <= 20) {
                growthProbabilities.stem -= 0.50 * OPTIMUM_GROWTH_PROBABILITIES.stem;
                growthProbabilities.roots -= 0.50 * OPTIMUM_GROWTH_PROBABILITIES.roots;
                growthProbabilities.leafs -= 0.50 * OPTIMUM_GROWTH_PROBABILITIES.leafs;
                growthProbabilities.flower -= 0.50 * OPTIMUM_GROWTH_PROBABILITIES.flower;

                creationProbabilities.leaf -= 0.50 * OPTIMUM_CREATION_PROBABILITIES.leaf;

                transitionProbabilities.toDead += 0;
                transitionProbabilities.toFlowering += 0;
            } else if (20 < environment.temperature && environment.temperature <= 25) {
                // optimum
                growthProbabilities.stem -= 0.00 * OPTIMUM_GROWTH_PROBABILITIES.stem;
                growthProbabilities.roots -= 0.00 * OPTIMUM_GROWTH_PROBABILITIES.roots;
                growthProbabilities.leafs -= 0.00 * OPTIMUM_GROWTH_PROBABILITIES.leafs;
                growthProbabilities.flower -= 0.00 * OPTIMUM_GROWTH_PROBABILITIES.flower;

                creationProbabilities.leaf -= 0.00 * OPTIMUM_CREATION_PROBABILITIES.leaf;

                transitionProbabilities.toDead += 0;
                transitionProbabilities.toFlowering += 0;
            } else {
                growthProbabilities.stem -= 0.99 * OPTIMUM_GROWTH_PROBABILITIES.stem;
                growthProbabilities.roots -= 0.99 * OPTIMUM_GROWTH_PROBABILITIES.roots;
                growthProbabilities.leafs -= 0.99 * OPTIMUM_GROWTH_PROBABILITIES.leafs;
                growthProbabilities.flower -= 0.99 * OPTIMUM_GROWTH_PROBABILITIES.flower;

                creationProbabilities.leaf -= 0.99 * OPTIMUM_CREATION_PROBABILITIES.leaf;

                transitionProbabilities.toDead += 0;
                transitionProbabilities.toFlowering += 0;
            }

            // allowed: step: 100, range: 0 - 900
            if (resources.carbonDioxide <= 100) {
                growthProbabilities.stem -= 1.00 * OPTIMUM_GROWTH_PROBABILITIES.stem;
                growthProbabilities.roots -= 1.00 * OPTIMUM_GROWTH_PROBABILITIES.roots;
                growthProbabilities.leafs -= 1.00 * OPTIMUM_GROWTH_PROBABILITIES.leafs;
                growthProbabilities.flower -= 1.00 * OPTIMUM_GROWTH_PROBABILITIES.flower;

                creationProbabilities.leaf -= 1.00 * OPTIMUM_CREATION_PROBABILITIES.leaf;

                transitionProbabilities.toDead += 25;
                transitionProbabilities.toFlowering -= 25;
            } else if (100 < resources.carbonDioxide && resources.carbonDioxide <= 300) {
                growthProbabilities.stem -= 0.50 * OPTIMUM_GROWTH_PROBABILITIES.stem;
                growthProbabilities.roots -= 0.50 * OPTIMUM_GROWTH_PROBABILITIES.roots;
                growthProbabilities.leafs -= 0.50 * OPTIMUM_GROWTH_PROBABILITIES.leafs;
                growthProbabilities.flower -= 0.50 * OPTIMUM_GROWTH_PROBABILITIES.flower;

                creationProbabilities.leaf -= 0.50 * OPTIMUM_CREATION_PROBABILITIES.leaf;

                transitionProbabilities.toDead += 0;
                transitionProbabilities.toFlowering += 0;
            } else if (300 < resources.carbonDioxide && resources.carbonDioxide <= 600) {
                // optimum
                growthProbabilities.stem -= 0.00 * OPTIMUM_GROWTH_PROBABILITIES.stem;
                growthProbabilities.roots -= 0.00 * OPTIMUM_GROWTH_PROBABILITIES.roots;
                growthProbabilities.leafs -= 0.00 * OPTIMUM_GROWTH_PROBABILITIES.leafs;
                growthProbabilities.flower -= 0.00 * OPTIMUM_GROWTH_PROBABILITIES.flower;

                creationProbabilities.leaf -= 0.00 * OPTIMUM_CREATION_PROBABILITIES.leaf;

                transitionProbabilities.toDead += 0;
                transitionProbabilities.toFlowering += 0;
            } else {
                growthProbabilities.stem -= 0.05 * OPTIMUM_GROWTH_PROBABILITIES.stem;
                growthProbabilities.roots -= 0.05 * OPTIMUM_GROWTH_PROBABILITIES.roots;
                growthProbabilities.leafs -= 0.05 * OPTIMUM_GROWTH_PROBABILITIES.leafs;
                growthProbabilities.flower -= 0.05 * OPTIMUM_GROWTH_PROBABILITIES.flower;

                creationProbabilities.leaf -= 0.05 * OPTIMUM_CREATION_PROBABILITIES.leaf;

                transitionProbabilities.toDead += 0;
                transitionProbabilities.toFlowering += 0;
            }

            // allowed: sehr wenig (0), wenig (1), gleichmäßig (2), viel (3), sehr viel (4)
            switch (resources.water) {
                case 0:
                    growthProbabilities.stem -= 1.00 * OPTIMUM_GROWTH_PROBABILITIES.stem;
                    growthProbabilities.roots -= 1.00 * OPTIMUM_GROWTH_PROBABILITIES.roots;
                    growthProbabilities.leafs -= 1.00 * OPTIMUM_GROWTH_PROBABILITIES.leafs;
                    growthProbabilities.flower -= 1.00 * OPTIMUM_GROWTH_PROBABILITIES.flower;

                    creationProbabilities.leaf -= 1.00 * OPTIMUM_CREATION_PROBABILITIES.leaf;

                    transitionProbabilities.toDead += 25;
                    transitionProbabilities.toFlowering -= 25;
                    break;

                case 1:
                    growthProbabilities.stem -= 0.75 * OPTIMUM_GROWTH_PROBABILITIES.stem;
                    growthProbabilities.roots -= 0.75 * OPTIMUM_GROWTH_PROBABILITIES.roots;
                    growthProbabilities.leafs -= 0.75 * OPTIMUM_GROWTH_PROBABILITIES.leafs;
                    growthProbabilities.flower -= 0.75 * OPTIMUM_GROWTH_PROBABILITIES.flower;

                    creationProbabilities.leaf -= 0.75 * OPTIMUM_CREATION_PROBABILITIES.leaf;

                    transitionProbabilities.toDead += 0;
                    transitionProbabilities.toFlowering += 0;
                    break;

                case 2:
                    // optimum
                    growthProbabilities.stem -= 0.00 * OPTIMUM_GROWTH_PROBABILITIES.stem;
                    growthProbabilities.roots -= 0.00 * OPTIMUM_GROWTH_PROBABILITIES.roots;
                    growthProbabilities.leafs -= 0.00 * OPTIMUM_GROWTH_PROBABILITIES.leafs;
                    growthProbabilities.flower -= 0.00 * OPTIMUM_GROWTH_PROBABILITIES.flower;

                    creationProbabilities.leaf -= 0.00 * OPTIMUM_CREATION_PROBABILITIES.leaf;

                    transitionProbabilities.toDead += 0;
                    transitionProbabilities.toFlowering += 0;
                    break;

                case 3:
                    growthProbabilities.stem -= 0.75 * OPTIMUM_GROWTH_PROBABILITIES.stem;
                    growthProbabilities.roots -= 0.75 * OPTIMUM_GROWTH_PROBABILITIES.roots;
                    growthProbabilities.leafs -= 0.75 * OPTIMUM_GROWTH_PROBABILITIES.leafs;
                    growthProbabilities.flower -= 0.75 * OPTIMUM_GROWTH_PROBABILITIES.flower;

                    creationProbabilities.leaf -= 0.75 * OPTIMUM_CREATION_PROBABILITIES.leaf;

                    transitionProbabilities.toDead += 0;
                    transitionProbabilities.toFlowering += 0;
                    break;

                case 4:
                default:
                    growthProbabilities.stem -= 1.00 * OPTIMUM_GROWTH_PROBABILITIES.stem;
                    growthProbabilities.roots -= 1.00 * OPTIMUM_GROWTH_PROBABILITIES.roots;
                    growthProbabilities.leafs -= 1.00 * OPTIMUM_GROWTH_PROBABILITIES.leafs;
                    growthProbabilities.flower -= 1.00 * OPTIMUM_GROWTH_PROBABILITIES.flower;

                    creationProbabilities.leaf -= 1.00 * OPTIMUM_CREATION_PROBABILITIES.leaf;

                    transitionProbabilities.toDead += 25;
                    transitionProbabilities.toFlowering -= 25;
                    break;
            }

            // allowed: sehr wenig (0), wenig (1), gleichmäßig (2), viel (3), sehr viel (4)
            switch (resources.nutrients) {
                case 0:
                    growthProbabilities.stem -= 1.00 * OPTIMUM_GROWTH_PROBABILITIES.stem;
                    growthProbabilities.roots -= 1.00 * OPTIMUM_GROWTH_PROBABILITIES.roots;
                    growthProbabilities.leafs -= 1.00 * OPTIMUM_GROWTH_PROBABILITIES.leafs;
                    growthProbabilities.flower -= 1.00 * OPTIMUM_GROWTH_PROBABILITIES.flower;

                    creationProbabilities.leaf -= 1.00 * OPTIMUM_CREATION_PROBABILITIES.leaf;

                    transitionProbabilities.toDead += 25;
                    transitionProbabilities.toFlowering -= 25;
                    break;

                case 1:
                    growthProbabilities.stem -= 0.75 * OPTIMUM_GROWTH_PROBABILITIES.stem;
                    growthProbabilities.roots -= 0.75 * OPTIMUM_GROWTH_PROBABILITIES.roots;
                    growthProbabilities.leafs -= 0.75 * OPTIMUM_GROWTH_PROBABILITIES.leafs;
                    growthProbabilities.flower -= 0.75 * OPTIMUM_GROWTH_PROBABILITIES.flower;

                    creationProbabilities.leaf -= 0.75 * OPTIMUM_CREATION_PROBABILITIES.leaf;

                    transitionProbabilities.toDead += 0;
                    transitionProbabilities.toFlowering += 0;
                    break;

                case 2:
                    // optimum
                    growthProbabilities.stem -= 0.00 * OPTIMUM_GROWTH_PROBABILITIES.stem;
                    growthProbabilities.roots -= 0.00 * OPTIMUM_GROWTH_PROBABILITIES.roots;
                    growthProbabilities.leafs -= 0.00 * OPTIMUM_GROWTH_PROBABILITIES.leafs;
                    growthProbabilities.flower -= 0.00 * OPTIMUM_GROWTH_PROBABILITIES.flower;

                    creationProbabilities.leaf -= 0.00 * OPTIMUM_CREATION_PROBABILITIES.leaf;

                    transitionProbabilities.toDead += 0;
                    transitionProbabilities.toFlowering += 0;
                    break;

                case 3:
                    growthProbabilities.stem -= 0.75 * OPTIMUM_GROWTH_PROBABILITIES.stem;
                    growthProbabilities.roots -= 0.75 * OPTIMUM_GROWTH_PROBABILITIES.roots;
                    growthProbabilities.leafs -= 0.75 * OPTIMUM_GROWTH_PROBABILITIES.leafs;
                    growthProbabilities.flower -= 0.75 * OPTIMUM_GROWTH_PROBABILITIES.flower;

                    creationProbabilities.leaf -= 0.75 * OPTIMUM_CREATION_PROBABILITIES.leaf;

                    transitionProbabilities.toDead += 0;
                    transitionProbabilities.toFlowering += 0;
                    break;

                case 4:
                default:
                    growthProbabilities.stem -= 1.00 * OPTIMUM_GROWTH_PROBABILITIES.stem;
                    growthProbabilities.roots -= 1.00 * OPTIMUM_GROWTH_PROBABILITIES.roots;
                    growthProbabilities.leafs -= 1.00 * OPTIMUM_GROWTH_PROBABILITIES.leafs;
                    growthProbabilities.flower -= 1.00 * OPTIMUM_GROWTH_PROBABILITIES.flower;

                    creationProbabilities.leaf -= 1.00 * OPTIMUM_CREATION_PROBABILITIES.leaf;

                    transitionProbabilities.toDead += 25;
                    transitionProbabilities.toFlowering -= 25;
                    break;
            }

            // transitionProbabilities.toFlowering += (plantInfo.age / 10_000) * 50;
            // transitionProbabilities.toFlowering += plantInfo.normalizedStemLength * 25;
            // transitionProbabilities.toDead += (this.#age / 100_000) * 50;
            if (plantInfo.normalizedStemLength >= 1) {
                transitionProbabilities.toFlowering = 99;
            }

            if (plantInfo.state === 'flowering') {
                creationProbabilities.leaf = 0;
            } else {
                growthProbabilities.flower = 0;
            }

            return {
                growthProbabilities: {
                    stem: Math.round(Math.min(Math.max(0, growthProbabilities.stem), 100)),
                    roots: Math.round(Math.min(Math.max(0, growthProbabilities.roots), 100)),
                    leafs: Math.round(Math.min(Math.max(0, growthProbabilities.leafs), 100)),
                    flower: Math.round(Math.min(Math.max(0, growthProbabilities.flower), 100)),
                },

                creationProbabilities: {
                    leaf: Math.round(Math.min(Math.max(0, creationProbabilities.leaf), 100)),
                },

                transitionProbabilities: {
                    toDead: Math.round(Math.min(Math.max(0, transitionProbabilities.toDead), 100)),
                    toFlowering: Math.round(Math.min(Math.max(0, transitionProbabilities.toFlowering), 100)),
                },
            };
        }

        this.#stem = new Growable(new Vec2(ownerWorld.middleX, ownerWorld.groundY), {
            segmentMax: this.#ownerWorld.random.int(175, 200),
            segmentSize: 2,
            changeAngleMaxDeg: 2,

            sunInfluence: { xInfluence: -3, yInfluence: -3 },
            gravityInfluence: { xInfluence: 0, yInfluence: -1 },
            randomJitterInfluence: { xInfluence: 0, yInfluence: 0 },
        });
        this.#roots = Array(5).fill(1).map(() => new Growable(new Vec2(ownerWorld.middleX, ownerWorld.groundY), {
            segmentMax: this.#ownerWorld.random.int(175, 200),
            segmentSize: 1,
            changeAngleMaxDeg: this.#ownerWorld.random.int(5, 15),

            sunInfluence: { xInfluence: 5, yInfluence: 5 },
            gravityInfluence: { xInfluence: 0, yInfluence: 1 },
            randomJitterInfluence: { xInfluence: 5, yInfluence: 5 },
        }));
    }

    update(deltaTime: number) {
        if (this.#state === 'dead') {
            console.log('dead');
            return;
        }

        console.log('render');
        this.#age += 1;

        const random = this.#ownerWorld.random;
        const probabilities = this.#policy(this.#ownerWorld.environment, this.#ownerWorld.resources, {
            age: this.#age,
            state: this.#state,
            normalizedStemLength: this.#stem.normalizedLength,
            normalizedRootLength: this.#roots.length === 0 ? 0 : this.#roots[0].normalizedLength,
            leafCount: this.#leafs.length,
        });

        // console.log(probabilities);

        if (random.int(1, 100) < probabilities.growthProbabilities.stem) {
            this.#stem.grow(this.#ownerWorld);
        }

        if (random.int(1, 100) < probabilities.growthProbabilities.roots) {
            this.#roots.forEach(r => r.grow(this.#ownerWorld));
        }

        if (random.int(1, 100) < probabilities.growthProbabilities.leafs) {
            this.#leafs.forEach(l => l.grow());
        }

        if (random.int(1, 100) < probabilities.growthProbabilities.flower) {
            if (this.#flower !== null) {
                this.#flower.grow();
            }
        }

        if (random.int(1, 100) < probabilities.creationProbabilities.leaf) {
            const sign = this.#leafs.length % 2 == 0 ? 1 : -1;
            const auxBud = this.#stem.calculateAuxillaryBud(sign * this.#ownerWorld.random.int(20, 60));
            if (auxBud === null) {
                return;
            }
            this.#leafs.push(
                new Leaf(auxBud, this.#ownerWorld.random.int(25, 50), this.#ownerWorld.random.int(30, 50))
            );
        }

        if (random.int(1, 100) < probabilities.transitionProbabilities.toFlowering) {
            if (this.#flower === null) {
                this.#state = 'flowering';
                this.#flower = new Flower(random, this.#stem.endPosition);
            }
        }

        if (random.int(1, 100) < probabilities.transitionProbabilities.toDead) {
            this.#state = 'dead';
        }
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

    get stemGSegments() {
        return this.#stem.segments;
    }

    get rootGSegments() {
        return this.#roots.map(r => r.segments);
    }
}

