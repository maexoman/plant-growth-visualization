import type { Environment, Plant, Resources } from "./Plant";
import type { Parameter } from "./World";

const OPTIMUM_GROWTH_TICKS = {
    stem: 5, //5,
    root: 5, //5,
    leaf: 5, //5,
    flower: 5, //5,
};

const OPTIMUM_CREATION_HEIGHTS = {
    leaf: 50,
};

export class PlantManager {
    #stemGrowTicks: number = OPTIMUM_GROWTH_TICKS.stem;
    #rootGrowTicks: number = OPTIMUM_GROWTH_TICKS.root;
    #leafGrowTicks: number = OPTIMUM_GROWTH_TICKS.leaf;
    #leafCreateHeights: number = OPTIMUM_CREATION_HEIGHTS.leaf;

    #flowerGrowTicks: number = OPTIMUM_GROWTH_TICKS.flower;

    #leafHealthChangeDirection: 'worsen' | 'neutral' | 'better' = 'neutral';
    #ticksUntilDeath: number | null = null;


    #lastDecisionFoundation: { environment: Environment, resources: Resources } | null = null;

    readonly #plant: Plant;
    constructor(plant: Plant) {
        this.#plant = plant;
    }

    #stemHealthChangeDirection: 'worsen' | 'neutral' | 'better' = 'neutral';
    #stemHealthTicks: number = 0;
    #stemTicks: number = 0;
    #rootTicks: number = 0;
    #leafTicks: number = 0;
    #flowerTicks: number = 0;
    #leafHealthTicks: number = 0;
    #lastLeafCreationHeight: number = 0;

    #deathTicks: number = 0;

    tick() {
        this.#stemTicks += 1;
        this.#rootTicks += 1;
        this.#leafTicks += 1;
        this.#flowerTicks += 1;

        if (!this.#plant.isFlowering()) {
            this.#flowerTicks = 0;
        } else {
            this.#flowerTicks += 1;
        }

        if (this.#ticksUntilDeath !== null) {
            this.#deathTicks += 1;
        } else {
            this.#deathTicks = 0;
        }

        if (this.#leafHealthChangeDirection === 'neutral') {
            this.#leafHealthTicks = 0;
        } else {
            this.#leafHealthTicks += 1;
        }

        if (this.#stemHealthChangeDirection === 'neutral') {
            this.#stemHealthTicks = 0;
        } else {
            this.#stemHealthTicks += 1;
        }

        if (this.#stemTicks >= this.#stemGrowTicks) {
            this.#plant.growStem();
            this.#stemTicks = 0;
        }
        if (this.#rootTicks >= this.#rootGrowTicks) {
            this.#plant.growRoots();
            this.#rootTicks = 0;
        }
        if (this.#leafTicks >= this.#leafGrowTicks) {
            this.#plant.growLeafs();
            this.#leafTicks = 0;
        }

        if (this.#plant.stemLength() >= this.#lastLeafCreationHeight + this.#leafCreateHeights) {
            this.#plant.createLeaf();
            this.#lastLeafCreationHeight = this.#plant.stemLength();
        }

        if (this.#plant.isGrowing() && this.#plant.isStemFullyGrown()) {
            this.#plant.beginFlowering();
        }

        if (this.#flowerTicks >= this.#flowerGrowTicks) {
            this.#plant.growFlower();
            this.#flowerTicks = 0;
        }

        if (this.#ticksUntilDeath !== null) {
            if (this.#deathTicks >= this.#ticksUntilDeath) {
                this.#plant.die();
            }
        }

        if (this.#leafHealthTicks >= 10) {
            switch (this.#leafHealthChangeDirection) {
                case "worsen":
                    this.#plant.decreaseLeafHealth();
                    break;
                case "better":
                    this.#plant.increaseLeafHealth();
                    break;
            }
            this.#leafHealthTicks = 0;
        }

        if (this.#stemHealthTicks >= 10) {
            switch (this.#stemHealthChangeDirection) {
                case "worsen":
                    this.#plant.decreaseStemHealth();
                    break;
                case "better":
                    this.#plant.increaseStemHealth();
                    break;
            }
            this.#stemHealthTicks = 0;
        }
    }

    manage(environment: Environment, resources: Resources): void {
        if (!this.#shouldReevaluate(environment, resources)) {
            return;
        }

        const oldDecisionFoundation = this.#lastDecisionFoundation;
        this.#lastDecisionFoundation = { environment, resources };

        const hasTemperatureChanged = (
            oldDecisionFoundation === null ||
            oldDecisionFoundation.environment.temperature !== environment.temperature
        );
        if (hasTemperatureChanged) {
            this.#decideBasedOnTemperature(environment.temperature);
            return;
        }

        const hasLightChanged = (
            oldDecisionFoundation === null ||
            oldDecisionFoundation.environment.lightHours !== environment.lightHours
        );
        if (hasLightChanged) {
            this.#decideBasedOnLight(environment.lightHours);
            return;
        }

        const hasWaterChanged = (
            oldDecisionFoundation === null ||
            oldDecisionFoundation.resources.water !== resources.water
        );
        if (hasWaterChanged) {
            this.#decideBasedOnWater(resources.water);
            return;
        }

        const hasCarbonDioxideChanged = (
            oldDecisionFoundation === null ||
            oldDecisionFoundation.resources.carbonDioxide !== resources.carbonDioxide
        );
        if (hasCarbonDioxideChanged) {
            this.#decideBasedOnCarbonDioxide(resources.carbonDioxide);
            return;
        }

        const hasNutrientsChanged = (
            oldDecisionFoundation === null ||
            oldDecisionFoundation.resources.nutrients !== resources.nutrients
        );
        if (hasNutrientsChanged) {
            this.#decideBasedOnNutrients(resources.nutrients);
            return;
        }
    }

    #decideBasedOnWater(water: Parameter) {
        switch (water) {
            case "very_low":
                this.#stemGrowTicks = Infinity;
                this.#rootGrowTicks = Infinity;
                this.#leafGrowTicks = Infinity;
                this.#flowerGrowTicks = Infinity;
                this.#leafCreateHeights = Infinity;

                this.#plant.setStemSizePotential(0.5);
                this.#plant.setRootSizePotential(1.5);
                this.#plant.setLeafSizePotential(0.5);

                this.#ticksUntilDeath = 100;

                this.#stemHealthChangeDirection = 'neutral';
                this.#leafHealthChangeDirection = 'neutral';
                return;

            case "low":
                this.#stemGrowTicks = Math.round(2 * OPTIMUM_GROWTH_TICKS.stem);
                this.#rootGrowTicks = Math.round(0.5 * OPTIMUM_GROWTH_TICKS.root);
                this.#leafGrowTicks = Math.round(2 * OPTIMUM_GROWTH_TICKS.leaf);
                this.#flowerGrowTicks = Math.round(2 * OPTIMUM_GROWTH_TICKS.flower);
                this.#leafCreateHeights = Math.round(2 * OPTIMUM_CREATION_HEIGHTS.leaf);

                this.#plant.setStemSizePotential(0.75);
                this.#plant.setRootSizePotential(1.25);
                this.#plant.setLeafSizePotential(0.75);

                this.#stemHealthChangeDirection = 'neutral';
                this.#leafHealthChangeDirection = 'neutral';
                return;

            case "optimal":
                this.#stemGrowTicks = Math.round(OPTIMUM_GROWTH_TICKS.stem);
                this.#rootGrowTicks = Math.round(OPTIMUM_GROWTH_TICKS.root);
                this.#leafGrowTicks = Math.round(OPTIMUM_GROWTH_TICKS.leaf);
                this.#flowerGrowTicks = Math.round(OPTIMUM_GROWTH_TICKS.flower);
                this.#leafCreateHeights = Math.round(OPTIMUM_CREATION_HEIGHTS.leaf);

                this.#plant.setStemSizePotential(1);
                this.#plant.setRootSizePotential(1);
                this.#plant.setLeafSizePotential(1);

                this.#stemHealthChangeDirection = 'neutral';
                this.#leafHealthChangeDirection = 'better';
                return;

            case "high":
                this.#stemGrowTicks = Math.round(2 * OPTIMUM_GROWTH_TICKS.stem);
                this.#rootGrowTicks = Math.round(2 * OPTIMUM_GROWTH_TICKS.root);
                this.#leafGrowTicks = Math.round(2 * OPTIMUM_GROWTH_TICKS.leaf);
                this.#flowerGrowTicks = Math.round(2 * OPTIMUM_GROWTH_TICKS.leaf);
                this.#leafCreateHeights = Math.round(1.5 * OPTIMUM_CREATION_HEIGHTS.leaf);

                this.#plant.setStemSizePotential(0.5);
                this.#plant.setRootSizePotential(0.5);
                this.#plant.setLeafSizePotential(0.75);

                this.#stemHealthChangeDirection = 'neutral';
                this.#leafHealthChangeDirection = 'neutral';
                return;

            case "very_high":
                console.log('water is very high')
                this.#stemGrowTicks = Math.round(4 * OPTIMUM_GROWTH_TICKS.stem);
                this.#rootGrowTicks = Math.round(4 * OPTIMUM_GROWTH_TICKS.root);
                this.#leafGrowTicks = Math.round(4 * OPTIMUM_GROWTH_TICKS.leaf);
                this.#flowerGrowTicks = Infinity;
                this.#leafCreateHeights = Math.round(OPTIMUM_CREATION_HEIGHTS.leaf);

                this.#plant.setStemSizePotential(0.35);
                this.#plant.setRootSizePotential(0.25);
                this.#plant.setLeafSizePotential(0.5);

                this.#ticksUntilDeath = 1_000;

                this.#stemHealthChangeDirection = 'neutral';
                this.#leafHealthChangeDirection = 'worsen';
                return;
        }
    }

    #decideBasedOnCarbonDioxide(carbonDioxide: Parameter) {
        switch (carbonDioxide) {
            case "very_low":
                this.#stemGrowTicks = Infinity;
                this.#rootGrowTicks = Infinity;
                this.#leafGrowTicks = Infinity;
                this.#flowerGrowTicks = Infinity;
                this.#leafCreateHeights = Infinity;

                this.#plant.setStemSizePotential(0.5);
                this.#plant.setRootSizePotential(1.5);
                this.#plant.setLeafSizePotential(0.5);

                this.#ticksUntilDeath = 100;

                this.#stemHealthChangeDirection = 'neutral';
                this.#leafHealthChangeDirection = 'neutral';
                return;

            case "low":
                this.#stemGrowTicks = Math.round(4 * OPTIMUM_GROWTH_TICKS.stem);
                this.#rootGrowTicks = Math.round(4 * OPTIMUM_GROWTH_TICKS.root);
                this.#leafGrowTicks = Math.round(4 * OPTIMUM_GROWTH_TICKS.leaf);
                this.#flowerGrowTicks = Math.round(4 * OPTIMUM_GROWTH_TICKS.flower);
                this.#leafCreateHeights = Math.round(2 * OPTIMUM_CREATION_HEIGHTS.leaf);

                this.#plant.setStemSizePotential(0.75);
                this.#plant.setRootSizePotential(0.75);
                this.#plant.setLeafSizePotential(0.75);

                this.#stemHealthChangeDirection = 'neutral';
                this.#leafHealthChangeDirection = 'neutral';
                return;

            case "optimal":
                this.#stemGrowTicks = Math.round(OPTIMUM_GROWTH_TICKS.stem);
                this.#rootGrowTicks = Math.round(OPTIMUM_GROWTH_TICKS.root);
                this.#leafGrowTicks = Math.round(OPTIMUM_GROWTH_TICKS.leaf);
                this.#flowerGrowTicks = Math.round(OPTIMUM_GROWTH_TICKS.flower);
                this.#leafCreateHeights = Math.round(OPTIMUM_CREATION_HEIGHTS.leaf);

                this.#plant.setStemSizePotential(1);
                this.#plant.setRootSizePotential(1);
                this.#plant.setLeafSizePotential(1);

                this.#stemHealthChangeDirection = 'neutral';
                this.#leafHealthChangeDirection = 'better';
                return;

            case "high":
                this.#stemGrowTicks = Math.round(0.5 * OPTIMUM_GROWTH_TICKS.stem);
                this.#rootGrowTicks = Math.round(0.5 * OPTIMUM_GROWTH_TICKS.root);
                this.#leafGrowTicks = Math.round(0.5 * OPTIMUM_GROWTH_TICKS.leaf);
                this.#flowerGrowTicks = Math.round(0.5 * OPTIMUM_GROWTH_TICKS.flower);
                this.#leafCreateHeights = Math.round(0.75 * OPTIMUM_CREATION_HEIGHTS.leaf);

                this.#plant.setStemSizePotential(1.125);
                this.#plant.setRootSizePotential(1);
                this.#plant.setLeafSizePotential(1.125);

                this.#stemHealthChangeDirection = 'neutral';
                this.#leafHealthChangeDirection = 'better';
                return;

            case "very_high":
                console.log('water is very high')
                this.#stemGrowTicks = Math.round(0);
                this.#rootGrowTicks = Math.round(0);
                this.#leafGrowTicks = Math.round(0);
                this.#flowerGrowTicks = Math.round(0);
                this.#leafCreateHeights = Math.round(0.75 * OPTIMUM_CREATION_HEIGHTS.leaf);

                this.#plant.setStemSizePotential(1.25);
                this.#plant.setRootSizePotential(1);
                this.#plant.setLeafSizePotential(1.25);

                this.#stemHealthChangeDirection = 'neutral';
                this.#leafHealthChangeDirection = 'better';
                return;
        }
    }

    #decideBasedOnNutrients(nutrients: Parameter) {
        switch (nutrients) {
            case "very_low":
                this.#stemGrowTicks = Infinity;
                this.#rootGrowTicks = Infinity;
                this.#leafGrowTicks = Infinity;
                this.#flowerGrowTicks = Infinity;
                this.#leafCreateHeights = Infinity;

                this.#plant.setStemSizePotential(0.5);
                this.#plant.setRootSizePotential(1.5);
                this.#plant.setLeafSizePotential(0.5);

                this.#ticksUntilDeath = 100;

                this.#stemHealthChangeDirection = 'neutral';
                this.#leafHealthChangeDirection = 'neutral';
                return;

            case "low":
                this.#stemGrowTicks = Math.round(2 * OPTIMUM_GROWTH_TICKS.stem);
                this.#rootGrowTicks = Math.round(2 * OPTIMUM_GROWTH_TICKS.root);
                this.#leafGrowTicks = Math.round(2 * OPTIMUM_GROWTH_TICKS.leaf);
                this.#flowerGrowTicks = Math.round(2 * OPTIMUM_GROWTH_TICKS.flower);
                this.#leafCreateHeights = Math.round(2 * OPTIMUM_CREATION_HEIGHTS.leaf);

                this.#plant.setStemSizePotential(0.75);
                this.#plant.setRootSizePotential(0.75);
                this.#plant.setLeafSizePotential(0.75);

                this.#stemHealthChangeDirection = 'neutral';
                this.#leafHealthChangeDirection = 'neutral';
                return;

            case "optimal":
                this.#stemGrowTicks = Math.round(OPTIMUM_GROWTH_TICKS.stem);
                this.#rootGrowTicks = Math.round(OPTIMUM_GROWTH_TICKS.root);
                this.#leafGrowTicks = Math.round(OPTIMUM_GROWTH_TICKS.leaf);
                this.#flowerGrowTicks = Math.round(OPTIMUM_GROWTH_TICKS.flower);
                this.#leafCreateHeights = Math.round(OPTIMUM_CREATION_HEIGHTS.leaf);

                this.#plant.setStemSizePotential(1);
                this.#plant.setRootSizePotential(1);
                this.#plant.setLeafSizePotential(1);

                this.#stemHealthChangeDirection = 'neutral';
                this.#leafHealthChangeDirection = 'better';
                return;

            case "high":
                this.#stemGrowTicks = Math.round(2 * OPTIMUM_GROWTH_TICKS.stem);
                this.#rootGrowTicks = Math.round(2 * OPTIMUM_GROWTH_TICKS.root);
                this.#leafGrowTicks = Math.round(2 * OPTIMUM_GROWTH_TICKS.leaf);
                this.#flowerGrowTicks = Math.round(2 * OPTIMUM_GROWTH_TICKS.flower);
                this.#leafCreateHeights = Math.round(2 * OPTIMUM_CREATION_HEIGHTS.leaf);

                this.#plant.setStemSizePotential(0.75);
                this.#plant.setRootSizePotential(0.75);
                this.#plant.setLeafSizePotential(0.75);

                this.#stemHealthChangeDirection = 'neutral';
                this.#leafHealthChangeDirection = 'neutral';
                return;

            case "very_high":
                this.#stemGrowTicks = Infinity;
                this.#rootGrowTicks = Infinity;
                this.#leafGrowTicks = Infinity;
                this.#flowerGrowTicks = Infinity;
                this.#leafCreateHeights = Infinity;

                this.#plant.setStemSizePotential(0.5);
                this.#plant.setRootSizePotential(1.5);
                this.#plant.setLeafSizePotential(0.5);

                this.#ticksUntilDeath = 100;

                this.#stemHealthChangeDirection = 'neutral';
                this.#leafHealthChangeDirection = 'neutral';
                return;
        }
    }

    #decideBasedOnTemperature(temperature: Parameter) {
        switch (temperature) {
            case "very_low":
                this.#stemGrowTicks = Infinity;
                this.#rootGrowTicks = Infinity;
                this.#leafGrowTicks = Infinity;
                this.#flowerGrowTicks = Infinity;
                this.#leafCreateHeights = Infinity;

                this.#plant.setStemSizePotential(0.5);
                this.#plant.setRootSizePotential(1.5);
                this.#plant.setLeafSizePotential(0.5);

                this.#ticksUntilDeath = 100;

                this.#stemHealthChangeDirection = 'neutral';
                this.#leafHealthChangeDirection = 'neutral';
                return;

            case "low":
                this.#stemGrowTicks = Math.round(2 * OPTIMUM_GROWTH_TICKS.stem);
                this.#rootGrowTicks = Math.round(2 * OPTIMUM_GROWTH_TICKS.root);
                this.#leafGrowTicks = Math.round(2 * OPTIMUM_GROWTH_TICKS.leaf);
                this.#flowerGrowTicks = Math.round(2 * OPTIMUM_GROWTH_TICKS.leaf);
                this.#leafCreateHeights = Math.round(1.5 * OPTIMUM_CREATION_HEIGHTS.leaf);

                this.#plant.setStemSizePotential(1.0);
                this.#plant.setRootSizePotential(1.0);
                this.#plant.setLeafSizePotential(1.0);

                this.#stemHealthChangeDirection = 'neutral';
                this.#leafHealthChangeDirection = 'neutral';
                return;

            case "optimal":
                this.#stemGrowTicks = Math.round(OPTIMUM_GROWTH_TICKS.stem);
                this.#rootGrowTicks = Math.round(OPTIMUM_GROWTH_TICKS.root);
                this.#leafGrowTicks = Math.round(OPTIMUM_GROWTH_TICKS.leaf);
                this.#flowerGrowTicks = Math.round(OPTIMUM_GROWTH_TICKS.flower);
                this.#leafCreateHeights = Math.round(OPTIMUM_CREATION_HEIGHTS.leaf);

                this.#plant.setStemSizePotential(1);
                this.#plant.setRootSizePotential(1);
                this.#plant.setLeafSizePotential(1);

                this.#stemHealthChangeDirection = 'neutral';
                this.#leafHealthChangeDirection = 'better';
                return;

            case "high":
                this.#stemGrowTicks = Math.round(2 * OPTIMUM_GROWTH_TICKS.stem);
                this.#rootGrowTicks = Math.round(2 * OPTIMUM_GROWTH_TICKS.root);
                this.#leafGrowTicks = Math.round(2 * OPTIMUM_GROWTH_TICKS.leaf);
                this.#flowerGrowTicks = Math.round(2 * OPTIMUM_GROWTH_TICKS.leaf);
                this.#leafCreateHeights = Math.round(1.5 * OPTIMUM_CREATION_HEIGHTS.leaf);

                this.#plant.setStemSizePotential(1.0);
                this.#plant.setRootSizePotential(1.0);
                this.#plant.setLeafSizePotential(1.0);

                this.#stemHealthChangeDirection = 'neutral';
                this.#leafHealthChangeDirection = 'neutral';
                return;

            case "very_high":
                this.#stemGrowTicks = Infinity;
                this.#rootGrowTicks = Infinity;
                this.#leafGrowTicks = Infinity;
                this.#flowerGrowTicks = Infinity;
                this.#leafCreateHeights = Infinity;

                this.#plant.setStemSizePotential(0.5);
                this.#plant.setRootSizePotential(1.5);
                this.#plant.setLeafSizePotential(0.5);

                this.#ticksUntilDeath = 100;

                this.#stemHealthChangeDirection = 'neutral';
                this.#leafHealthChangeDirection = 'neutral';
                return;
        }
    }

    #decideBasedOnLight(light: Parameter) {
        switch (light) {
            case "very_low":
                this.#stemGrowTicks = Math.round(OPTIMUM_GROWTH_TICKS.stem);
                this.#rootGrowTicks = Math.round(OPTIMUM_GROWTH_TICKS.root);
                this.#leafGrowTicks = Math.round(OPTIMUM_GROWTH_TICKS.leaf);
                this.#flowerGrowTicks = Infinity;
                this.#leafCreateHeights = Math.round(3 * OPTIMUM_CREATION_HEIGHTS.leaf);

                this.#ticksUntilDeath = 1200;

                this.#plant.setStemSizePotential(1.0);
                this.#plant.setRootSizePotential(1.0);
                this.#plant.setLeafSizePotential(0.5);

                this.#stemHealthChangeDirection = 'worsen';
                this.#leafHealthChangeDirection = 'neutral';
                return;

            case "low":
                this.#stemGrowTicks = Math.round(OPTIMUM_GROWTH_TICKS.stem);
                this.#rootGrowTicks = Math.round(OPTIMUM_GROWTH_TICKS.root);
                this.#leafGrowTicks = Math.round(OPTIMUM_GROWTH_TICKS.leaf);
                this.#flowerGrowTicks = Math.round(OPTIMUM_GROWTH_TICKS.flower);
                this.#leafCreateHeights = Math.round(2 * OPTIMUM_CREATION_HEIGHTS.leaf);

                this.#plant.setStemSizePotential(1.0);
                this.#plant.setRootSizePotential(1.0);
                this.#plant.setLeafSizePotential(0.75);

                this.#stemHealthChangeDirection = 'worsen';
                this.#leafHealthChangeDirection = 'neutral';
                return;

            case "optimal":
                this.#stemGrowTicks = Math.round(OPTIMUM_GROWTH_TICKS.stem);
                this.#rootGrowTicks = Math.round(OPTIMUM_GROWTH_TICKS.root);
                this.#leafGrowTicks = Math.round(OPTIMUM_GROWTH_TICKS.leaf);
                this.#flowerGrowTicks = Math.round(OPTIMUM_GROWTH_TICKS.flower);
                this.#leafCreateHeights = Math.round(OPTIMUM_CREATION_HEIGHTS.leaf);

                this.#plant.setStemSizePotential(1);
                this.#plant.setRootSizePotential(1);
                this.#plant.setLeafSizePotential(1);

                this.#stemHealthChangeDirection = 'better';
                this.#leafHealthChangeDirection = 'better';
                return;

            case "high":
                this.#stemGrowTicks = Math.round(OPTIMUM_GROWTH_TICKS.stem);
                this.#rootGrowTicks = Math.round(OPTIMUM_GROWTH_TICKS.root);
                this.#leafGrowTicks = Math.round(OPTIMUM_GROWTH_TICKS.leaf);
                this.#flowerGrowTicks = Math.round(OPTIMUM_GROWTH_TICKS.leaf);
                this.#leafCreateHeights = Math.round(0.75 * OPTIMUM_CREATION_HEIGHTS.leaf);

                this.#plant.setStemSizePotential(1);
                this.#plant.setRootSizePotential(1);
                this.#plant.setLeafSizePotential(1);

                this.#stemHealthChangeDirection = 'better';
                this.#leafHealthChangeDirection = 'better';
                return;

            case "very_high":
                this.#stemGrowTicks = Math.round(OPTIMUM_GROWTH_TICKS.stem);
                this.#rootGrowTicks = Math.round(OPTIMUM_GROWTH_TICKS.root);
                this.#leafGrowTicks = Math.round(OPTIMUM_GROWTH_TICKS.leaf);
                this.#flowerGrowTicks = Math.round(OPTIMUM_GROWTH_TICKS.leaf);
                this.#leafCreateHeights = Math.round(0.75 * OPTIMUM_CREATION_HEIGHTS.leaf);

                this.#plant.setStemSizePotential(1);
                this.#plant.setRootSizePotential(1);
                this.#plant.setLeafSizePotential(1);

                this.#stemHealthChangeDirection = 'better';
                this.#leafHealthChangeDirection = 'better';
                return;
        }
    }

    #shouldReevaluate(environment: Environment, resources: Resources) {
        return (
            this.#lastDecisionFoundation === null ||

            // has environment changed
            this.#lastDecisionFoundation.environment.lightHours !== environment.lightHours ||
            this.#lastDecisionFoundation.environment.temperature !== environment.temperature ||

            // have resources changed
            this.#lastDecisionFoundation.resources.water !== resources.water ||
            this.#lastDecisionFoundation.resources.nutrients !== resources.nutrients ||
            this.#lastDecisionFoundation.resources.carbonDioxide !== resources.carbonDioxide
        );
    }
}