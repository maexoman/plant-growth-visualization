// import { Vec2 } from "./Vec2";

import { Plant, type Environment, type Resources } from "./Plant";
import { Random } from "./Random";
import { ResourcePool } from "./ResourcePool";
import { Vec2 } from "./Vec2";

const SKY_RATIO = 3 / 4;
const SUN_RATIO = 0 / 8;
const SUN_MOVEMENT_MAX = 3 / 4;

export class World {
    random: Random;

    readonly #width: number;
    readonly #height: number;

    readonly middleX: number;
    readonly groundY: number;
    readonly sunY: number;

    // Environment Data:
    #gravity: Vec2;

    #sunPosition: Vec2;
    #lightHours: number;
    #temperature: number;
    #water: number;
    #nutrients: number;
    #carbonDioxide: number;

    #plant: Plant;

    constructor(random: Random, width: number, height: number) {
        this.random = random;
        this.#width = width;
        this.#height = height;

        this.middleX = Math.round(this.#width / 2);
        this.sunY = Math.round(this.#height * (1 - SUN_RATIO));
        this.groundY = Math.round(this.#height * (1 - SKY_RATIO));

        this.#gravity = new Vec2(0, -10);
        this.#sunPosition = new Vec2(this.middleX, this.sunY);
        this.#lightHours = 14;
        this.#temperature = 22;
        this.#carbonDioxide = 400;

        this.#nutrients = 2;
        this.#water = 2;

        this.#plant = new Plant(this);
    }

    get environment(): Environment {
        return {
            lightHours: this.#lightHours,
            temperature: this.#temperature,
        };
    }

    get resources(): Resources {
        return {
            water: this.#water,
            carbonDioxide: this.#carbonDioxide,
            nutrients: this.#nutrients,
        };
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
            console.warn(`gravity not in range [0, 10]. gravity: ${gravity}`);
            return;
        }
        this.#gravity = new Vec2(0, -gravity);
    }

    setSunHours(sunHours: number) {
        const isInBounds = 0 <= sunHours && sunHours <= 24;
        if (!isInBounds) {
            console.warn(`sun hours not in range [0, 24]. sun hours: ${sunHours}`);
            return;
        }
        const isMulipleOfTwo = sunHours % 2 == 0;
        if (!isMulipleOfTwo) {
            console.warn(`sun hours must be a multiple of two`);
            return;
        }
        this.#lightHours = sunHours;
    }

    setTemperature(temperature: number) {
        const isInBounds = 0 <= temperature && temperature <= 40;
        if (!isInBounds) {
            console.warn(`temperature not in range [0, 40]. temperature: ${temperature}`);
            return;
        }
        const isMulipleOfFive = temperature % 5 == 0;
        if (!isMulipleOfFive) {
            console.warn(`temperature must be a multiple of five`);
            return;
        }
        this.#temperature = temperature;
    }

    setCarbonDioxide(carbonDioxide: number) {
        const isInBounds = 0 <= carbonDioxide && carbonDioxide <= 40;
        if (!isInBounds) {
            console.warn(`carbonDioxide not in range [0, 900]. carbonDioxide: ${carbonDioxide}`);
            return;
        }
        const isMulipleOfFive = carbonDioxide % 100 == 0;
        if (!isMulipleOfFive) {
            console.warn(`carbonDioxide must be a multiple of 100`);
            return;
        }
        this.#carbonDioxide = carbonDioxide;
    }

    setWater(water: number) {
        const isInBounds = 0 <= water && water <= 4;
        if (!isInBounds) {
            console.warn(`water not in range [0, 4]. water: ${water}`);
            return;
        }
        this.#water = water;
    }

    setNutrients(nutrients: number) {
        const isInBounds = 0 <= nutrients && nutrients <= 4;
        if (!isInBounds) {
            console.warn(`nutrients not in range [0, 4]. nutrients: ${nutrients}`);
            return;
        }
        this.#nutrients = nutrients;
    }

    update(deltaTime: number) {
        this.#plant.update(deltaTime);
    }

    reset() {
        this.random = new Random(this.random.seed);
        this.#plant = new Plant(this);
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

    get stemGSegments() {
        return this.#plant.stemGSegments;
    }

    get rootGSegments() {
        return this.#plant.rootGSegments
    }
}