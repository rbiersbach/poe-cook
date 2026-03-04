/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ExchangeRate = {
    /**
     * poe.ninja detailsId (e.g. "divine-orb", "chaos-orb")
     */
    id: string;
    /**
     * Display name (e.g. "Divine Orb")
     */
    name: string;
    /**
     * How many chaos orbs one unit of this currency is worth
     */
    chaosValue: number;
    /**
     * When this rate was last fetched from poe.ninja
     */
    fetchedAt: string;
};

