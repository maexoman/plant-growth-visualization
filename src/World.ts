// import { Vec2 } from "./Vec2";

import { Plant, type Environment, type Resources } from "./Plant";
import { Random } from "./Random";
import { Vec2 } from "./Vec2";

const SKY_RATIO = 3 / 4;
const SUN_RATIO = 0 / 8;
const SUN_MOVEMENT_MAX = 3 / 4;

export type Parameter = 'very_low' | 'low' | 'optimal' | 'high' | 'very_high';
function numberToParameter(number: number) {
    switch (number) {
        case 0: return 'very_low';
        case 1: return 'low';
        case 2: return 'optimal';
        case 3: return 'high';
        case 4: return 'very_high';
        default: return null;
    }
}

export function parameterToNumber(parameter: Parameter) {
    switch (parameter) {
        case 'very_low': return 0;
        case 'low': return 1;
        case 'optimal': return 2;
        case 'high': return 3;
        case 'very_high': return 4;
        default: throw new Error('unkwon');
    }
}

export function parameterToName(parameter: Parameter) {
    switch (parameter) {
        case 'very_low': return 'sehr wenig';
        case 'low': return 'wenig';
        case 'optimal': return 'optimal';
        case 'high': return 'viel';
        case 'very_high': return 'sehr viel';
        default: throw new Error('unkwon');
    }
}

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
    #lightHours: Parameter;
    #temperature: Parameter;
    #water: Parameter;
    #nutrients: Parameter;
    #carbonDioxide: Parameter;

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

        this.#lightHours = 'optimal';
        this.#temperature = 'optimal';
        this.#carbonDioxide = 'optimal';
        this.#nutrients = 'optimal';
        this.#water = 'optimal';

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

    #restoreOptimum() {
        this.#lightHours = 'optimal';
        this.#temperature = 'optimal';
        this.#water = 'optimal';
        this.#nutrients = 'optimal';
        this.#carbonDioxide = 'optimal';
    }

    setSunHours(sunHours: number) {
        const temp = numberToParameter(sunHours);
        this.#restoreOptimum();
        if (temp === null) {
            return;
        }
        this.#lightHours = temp;
    }

    setTemperature(temperature: number) {
        const temp = numberToParameter(temperature);
        this.#restoreOptimum();
        if (temp === null) {
            return;
        }
        this.#temperature = temp;
    }

    setCarbonDioxide(carbonDioxide: number) {
        const temp = numberToParameter(carbonDioxide);
        this.#restoreOptimum();
        if (temp === null) {
            return;
        }
        this.#carbonDioxide = temp;
    }

    setWater(water: number) {
        const temp = numberToParameter(water);
        this.#restoreOptimum();
        if (temp === null) {
            return;
        }
        this.#water = temp;
    }

    setNutrients(nutrients: number) {
        const temp = numberToParameter(nutrients);
        this.#restoreOptimum();
        if (temp === null) {
            return;
        }
        this.#nutrients = temp;
    }

    update(deltaTime: number) {
        this.#plant.update(deltaTime);
    }

    reset() {
        this.random = new Random(this.random.seed);
        this.#lightHours = 'optimal';
        this.#temperature = 'optimal';
        this.#water = 'optimal';
        this.#carbonDioxide = 'optimal';
        this.#nutrients = 'optimal';
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