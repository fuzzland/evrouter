import "@/styles/globals.css";
import { createWeb3Modal, defaultConfig } from "@web3modal/ethers5/react";

import type { AppProps } from "next/app";
import { useEffect, useState } from "react";

const chains = [1];

// 1. Get projectID at https://cloud.walletconnect.com

const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || "";

const metadata = {
	name: "Next Starter Template",
	description: "A Next.js starter template with Web3Modal v3 + Wagmi",
	url: "https://web3modal.com",
	icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

const ethersConfig = defaultConfig({ metadata });

createWeb3Modal({
	ethersConfig, projectId, chains: [{
		rpcUrl: "https://rpc.ankr.com/eth",
		explorerUrl: "https://etherscan.io",
		currency: "ETH",
		name: "Ethereum",
		chainId: 1
	}]
});

export default function App({ Component, pageProps }: AppProps) {
	const [ready, setReady] = useState(false);

	useEffect(() => {
		setReady(true);
	}, []);
	return <>{ready ? <Component {...pageProps} /> : null}</>;
}
