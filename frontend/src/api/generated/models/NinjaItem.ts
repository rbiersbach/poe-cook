/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type NinjaItem = {
    id: string;
    name: string;
    icon: string;
    category: NinjaItem.category;
    detailsId: string;
    price: number;
    priceHistory: Array<number>;
    volume: number;
    maxVolumeCurrency: string;
    maxVolumeRate: number;
    fetchedAt: string;
};
export namespace NinjaItem {
    export enum category {
        CURRENCY = 'Currency',
        FRAGMENT = 'Fragment',
        RUNEGRAFT = 'Runegraft',
        ALLFLAME_EMBER = 'AllflameEmber',
        TATTOO = 'Tattoo',
        OMEN = 'Omen',
        DIVINATION_CARD = 'DivinationCard',
        ARTIFACT = 'Artifact',
        OIL = 'Oil',
        SCARAB = 'Scarab',
        FOSSIL = 'Fossil',
        RESONATOR = 'Resonator',
        ESSENCE = 'Essence',
    }
}

