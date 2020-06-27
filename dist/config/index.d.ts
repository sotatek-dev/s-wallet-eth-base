export interface IEthConfig {
    averageBlockTime: number;
    requiredConfirmations: number;
    explorerEndpoint: string;
    chainId: number;
}
export declare const EthConfig: IEthConfig;
export declare function updateEthConfig(network: string): void;
