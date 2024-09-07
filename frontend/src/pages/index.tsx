// @ts-nocheck
import Head from "next/head";
import { useState } from "react";
import { useWeb3Modal } from "@web3modal/ethers5/react";
import { useWeb3ModalProvider } from "@web3modal/ethers5/react";
import { useWeb3ModalAccount } from '@web3modal/ethers5/react'
import * as ethers from "ethers";
import React from "react";
import { BigNumber } from "ethers";

export default function Home() {
	const { walletProvider } = useWeb3ModalProvider()
	const [isNetworkSwitchHighlighted, setIsNetworkSwitchHighlighted] =
		useState(false);
	const [isConnectHighlighted, setIsConnectHighlighted] = useState(false);

	const closeAll = () => {
		setIsNetworkSwitchHighlighted(false);
		setIsConnectHighlighted(false);
	};

	// create a local ethers provider
	const provider = new ethers.providers.JsonRpcProvider("[RPC]", 1)
	const [balance, setBalance] = useState(0)

	// load results from `public/results.json`





	const { open, close } = useWeb3Modal()
	const { address, chainId, isConnected } = useWeb3ModalAccount()
	React.useEffect(() => {
		if (address) {
			provider?.getBalance(address).then((balance) => {
				setBalance(balance)
			})
		}

	}, [address])
	// open prompt to connect to ETH wallet
	const openWallet = () => {
		open().then(() => {
			console.log("connected to ETH wallet")

			if (walletProvider) {
				console.log(walletProvider)
				console.log(address)
				console.log(chainId)
				if (chainId != 1) {
					// switch network to sepolia
					walletProvider?.request({
						method: 'wallet_switchEthereumChain',
						params: [{ chainId: '0x1' }],
					})
				}
			}
		})
	}

	const [showTokenList, setShowTokenList] = useState(false)
	const [selectedToken, setSelectedToken] = useState(["0xc9bca88b04581699fab5aa276ccaff7df957cbbf", "VISTA"])

	const [inputValue, setInputValue] = useState('')
	const [outputValue, setOutputValue] = useState('0')


	const [availableTokens, setAvailableTokens] = useState([])
	const [filteredTokens, setFilteredTokens] = useState([])

	const [slippage, setSlippage] = useState(0.01)

	React.useEffect(() => {
		fetch('/results.json').then(res => res.json()).then(data => {
			let tokens = []

			for (let i = 0; i < data.result.rows.length; i++) {
				if (data.result.rows[i].symbol0 != 'WETH') {
					tokens.push([data.result.rows[i].token0, data.result.rows[i].symbol0])
				}

				if (data.result.rows[i].symbol1 != 'WETH') {
					tokens.push([data.result.rows[i].token1, data.result.rows[i].symbol1])
				}
			}
			setAvailableTokens(tokens)
			setFilteredTokens(tokens)
			updateBalance("0xc9bca88b04581699fab5aa276ccaff7df957cbbf")
		})
	}, [])

	const [clickedAmount, setClickedAmount] = useState(false)
	const [showSlippagePopup, setShowSlippagePopup] = useState(false)

	const [outputBalance, setOutputBalance] = useState(0)
	const [outputDecimals, setOutputDecimals] = useState(18)
	const [loadingEstimate, setLoadingEstimate] = useState(false)

	React.useEffect(() => {
		// get decimals of output token
		provider?.call({
			to: selectedToken[0],
			data: "0x313ce567"
		}).then((decimals) => {
			console.log(BigNumber.from(decimals).toNumber())
			setOutputDecimals(BigNumber.from(decimals).toNumber())
		})
	}, [selectedToken])

	const estimateOut = async (
		amountIn: string,
		tokenOut: string
	) => {
		if (amountIn == "" || amountIn == "0") {
			return "0"
		}
		setLoadingEstimate(true)
		try {
			let encoder = new ethers.utils.AbiCoder()
			let estimate = await provider?.call({
				to: "0x078609EFFd0A4E1c5dFAe0F03A614d2175450EF4",
				from: "0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8",
				data: "0xa59ac6dd" + encoder.encode(["address", "uint256", "uint256"], [tokenOut, 0, ethers.utils.parseEther('1000')]).substring(2,),
				value: ethers.utils.parseEther(amountIn)
			})
			if (estimate == undefined || estimate.length > 66) {
				return "0"
			}
			setLoadingEstimate(false)
			return estimate
		} catch (e) {
			console.log(e)
			setLoadingEstimate(false)
		}
	}



	const sendTx = async (tokenOut: string, amountIn: string, outputValue: string, slippage: number) => {
		let minOut = BigNumber.from(outputValue).mul(BigNumber.from(100).sub(BigNumber.from(slippage * 100))).div(BigNumber.from(100))

		console.log(minOut)
		console.log(amountIn)
		let encoder = new ethers.utils.AbiCoder()
		walletProvider?.sendAsync({
			method: 'eth_sendTransaction',
			params: [{
				from: address,
				to: "0x078609EFFd0A4E1c5dFAe0F03A614d2175450EF4",
				value: ethers.utils.parseEther(amountIn).toHexString(),
				data: "0xa59ac6dd" + encoder.encode(["address", "uint256", "uint256"], [tokenOut, minOut, ethers.utils.parseEther('1000')]).substring(2,),
			}]
		})
	}


	const updateBalance = async (token: string) => {
		// call balanceOf on token contract
		if (address) {
			let encoder = new ethers.utils.AbiCoder()
			let balance = await provider?.call({
				to: token,
				from: address,
				data: "0x70a08231" + encoder.encode(["address"], [address]).substring(2,)
			})
			console.log(balance)

			setOutputBalance(balance)
		}
	}
	const [winWidth, setWinWidth] = useState(0)
	React.useEffect(() => {
		setWinWidth(window.innerWidth)
	}, [])
	window.addEventListener('resize', () => {
		setWinWidth(window.innerWidth)
	})

	React.useEffect(() => {
		updateBalance(selectedToken[0])
	}, [selectedToken, address])
	return (
		<>
			<Head>
				<title>Ethervista Buy Wrapper</title>
				<meta name="description" content="A Ethervista interface for token swapping that bypasses buy fee. " />
				<link rel="icon" href="/favicon.ico" />
				<link rel="preconnect" href="https://fonts.googleapis.com"></link>
				<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin></link>
				<link href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&family=Protest+Guerrilla&display=swap" rel="stylesheet"></link>

			</Head>
			<div style={{
				marginTop: '1em',
				marginLeft: '20px',
				marginRight: '20px',
				fontFamily: 'Open Sans, sans-serif',
				backgroundColor: 'rgba(241, 196,0, 0.2)', // "#f1c40f"
				borderRadius: '10px',
				padding: '5px 20px',

			}}>
				<p style={{
				}}>
					This Ethervista wrapper uses the <a href="https://x.com/shoucccc/status/1831707216711446842">Ethervista bug</a> to bypass the buy fee.
					Use at your own risk.
				</p>
			</div>
			<main style={{
				display: 'flex',
				justifyContent: 'space-around',
				padding: '20px',
				backgroundColor: '#ffffff',
				fontFamily: 'Open Sans, sans-serif',
				flexDirection: winWidth > 768 ? 'row' : 'column',
			}}>
				<iframe
					width="100%"
					height={winWidth > 768 ? '600' : '300'}
					style={{
						borderRadius: '10px',
						marginRight: '20px',
						border: '1px solid #e0e0e0'
					}}
					src={
						`https://birdeye.so/tv-widget/${selectedToken[0]}?chain=ethereum&viewMode=pair&chartInterval=1D&chartType=CANDLE&chartTimezone=America%2FLos_Angeles&chartLeftToolbar=show&theme=light`
					}
					frameborder="0"
					allowfullscreen>
				</iframe>
				<div style={{
					maxWidth: '400px',
					width: '100%',
					backgroundColor: 'white',
					borderRadius: '20px',
					border: '1px solid #e0e0e0',
					height: '100%',
					marginTop: winWidth > 768 ? '0' : '20px'

				}}>
					<div style={{
						padding: '20px'
					}}>
						<h1 style={{
							fontSize: '24px',
							fontWeight: 'bold',
							textAlign: 'left',
							marginBottom: '20px',
						}}>Swap</h1>
						<div style={{
							display: 'flex',
							flexDirection: 'column',
							gap: '10px'
						}}>
							<div style={{
								backgroundColor: clickedAmount ? '#f4f4f4' : '#f7f8fa',
								transition: 'background-color 0.2s',
								borderRadius: '16px',
								padding: '16px',

							}} onMouseEnter={() => setClickedAmount(true)} onMouseLeave={() => setClickedAmount(false)}>
								<div style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									marginBottom: '8px'
								}}>
									<input
										type="number"
										placeholder="0"
										style={{
											width: '60%',
											padding: '8px 5px',
											fontSize: '24px',
											fontWeight: 'bold',
											border: 'none',
											backgroundColor: 'transparent',
											outline: 'none'
										}}

										onChange={async (e) => {
											setInputValue(e.target.value)
											setOutputValue(await estimateOut(e.target.value, selectedToken[0]))
										}}
									/>
									<button style={{
										padding: '8px 12px',
										backgroundColor: '#ffffff',
										border: '1px solid #e0e0e0',
										borderRadius: '100px',
										cursor: 'pointer',
										display: 'flex',
										alignItems: 'center',
										gap: '4px'
									}}>
										ETH
									</button>
								</div>
								<div style={{ fontSize: '14px', color: '#aaa' }}>Balance: {
									(balance.toString() / 10 ** 18).toFixed(4)
								}ETH</div>
							</div>
							<div style={{
								textAlign: 'center',
								margin: '4px 0'
							}}>
								↓
							</div>
							<div style={{
								backgroundColor: '#f7f8fa',
								borderRadius: '16px',
								padding: '16px',
							}}>
								<div style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center'
								}}>
									{loadingEstimate ? (
										<div style={{
											width: '60%',
											padding: '8px',
											fontSize: '24px',
											fontWeight: 'bold',
											color: '#888',
										}}>
											Loading...
										</div>
									) : (
										<input
											type="number"
											placeholder="0"
											style={{
												width: '60%',
												padding: '8px',
												fontSize: '24px',
												fontWeight: 'bold',
												border: 'none',
												backgroundColor: 'transparent',
												outline: 'none'
											}}
											disabled
											value={ethers.utils.formatUnits(outputValue || '0', outputDecimals)}
										/>
									)}
									<div style={{ position: 'relative' }}>
										<button
											style={{
												padding: '8px 12px',
												backgroundColor: '#ffffff',
												border: 'none',
												borderRadius: '100px',
												cursor: 'pointer',
												color: '#000'
											}}
											onClick={() => setShowTokenList(!showTokenList)}
										>
											{selectedToken ? selectedToken[1] : 'Select Token'} ▼
										</button>
										{showTokenList && (
											<div style={{
												position: 'absolute',
												top: 'calc(100% + 8px)',
												right: 0,
												backgroundColor: 'white',
												border: '1px solid #e0e0e0',
												borderRadius: '12px',
												boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
												zIndex: 1000,
												width: '340px',
												overflow: 'hidden',
											}}>
												<div style={{ padding: '12px' }}>
													<div>
														<input
															type="text"
															placeholder="Search token name or address"
															style={{
																width: 'calc(100% - 24px)',
																padding: '10px 12px',
																border: '1px solid #e0e0e0',
																borderRadius: '8px',
																fontSize: '14px',
																outline: 'none',
																transition: 'border-color 0.2s',
															}}
															onChange={async (e) => {
																if (/[0-9a-fA-F]{40}$/.test(e.target.value)) {
																	console.log("here")
																	let symbolResp = await provider?.call(
																		{
																			to: e.target.value,
																			from: address,
																			data: "0x95d89b41"
																		}
																	);
																	let decoder = new ethers.utils.AbiCoder()
																	let symbol = decoder.decode(["string"], symbolResp)[0]
																	let tokenSymbol = [e.target.value, symbol]
																	setFilteredTokens([tokenSymbol] as any)
																} else {
																	if (e.target.value.length > 0) {
																		setFilteredTokens(availableTokens.filter(token =>
																			token[1].toLowerCase().includes(e.target.value.toLowerCase())
																		))
																	} else {
																		setFilteredTokens(availableTokens)
																	}
																}


																// Implement search functionality here
																// This could filter the list of tokens based on the input

																// setAvailableTokens(availableTokens.filter(token => token.toLowerCase().includes(e.target.value.toLowerCase())))
															}}
														/>
													</div>
													<ul style={{
														listStyle: 'none',
														padding: '8px 0',
														margin: '12px 0 0 0',
														maxHeight: '200px',
														overflowY: 'auto'
													}}>
														{filteredTokens.map((token) => (
															<li
																key={token[0]}
																style={{
																	padding: '10px 12px',
																	cursor: 'pointer',
																	transition: 'background-color 0.2s',
																	borderRadius: '6px',
																	':hover': {
																		backgroundColor: '#f5f5f5'
																	}
																}}
																onClick={() => {
																	setSelectedToken(token);
																	setShowTokenList(false);
																	updateBalance(token[0])
																}}
															>
																{token[1]} ({token[0].slice(0, 6)}...{token[0].slice(-4)})
															</li>
														))}
													</ul>
												</div>
											</div>
										)}
									</div>

								</div>
								<div style={{ fontSize: '14px', color: '#aaa' }}>Balance: {
									(outputBalance / 10 ** 18).toFixed(4)
								}ETH</div>
							</div>
							<button
								style={{
									width: '100%',
									padding: '16px',
									backgroundColor: '#000',
									color: 'white',
									border: 'none',
									borderRadius: '16px',
									fontSize: '18px',
									fontWeight: 'bold',
									cursor: 'pointer',
									marginTop: '10px'
								}}
								onClick={() => !isConnected ? openWallet() : sendTx(selectedToken[0], inputValue, outputValue, slippage)}
							>
								{isConnected ? 'Continue' : 'Connect Wallet'}
							</button>
						</div>
						{isConnected && (
							<div style={{
								marginTop: '20px',
								fontSize: '14px',
								color: '#666',
								display: 'flex',
							}}>
								<p>Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
								<p style={{
									marginLeft: '3px'
								}}>
									<button
										onClick={() => {
											open()
										}}
										style={{
											background: 'none',
											border: '1px solid #000000',
											color: '#000000',
											cursor: 'pointer',
											padding: '2px 4px',
											borderRadius: '4px',
											fontSize: '12px',
											fontWeight: 'bold',
											transition: 'all 0.3s ease',
											marginLeft: '2px'
										}}
										onMouseEnter={(e) => {
											e.currentTarget.style.background = '#000000';
											e.currentTarget.style.color = 'white';
										}}
										onMouseLeave={(e) => {
											e.currentTarget.style.background = 'none';
											e.currentTarget.style.color = '#000000';
										}}
									>
										Disconnect
									</button>
								</p>
							</div>
						)}

						{
							outputValue != "0" && (
								<div style={{
									fontSize: '14px',
									color: '#666'
								}}>
									<p>
										Slippage: {slippage * 100}%{' '}
										<button
											onClick={() => setShowSlippagePopup(true)}
											style={{
												background: 'none',
												border: '1px solid #000000',
												color: '#000000',
												cursor: 'pointer',
												padding: '2px 4px',
												borderRadius: '4px',
												fontSize: '12px',
												fontWeight: 'bold',
												transition: 'all 0.3s ease',
												marginLeft: '2px'
											}}
											onMouseEnter={(e) => {
												e.currentTarget.style.background = '#000000';
												e.currentTarget.style.color = 'white';
											}}
											onMouseLeave={(e) => {
												e.currentTarget.style.background = 'none';
												e.currentTarget.style.color = '#000000';
											}}
										>
											Edit
										</button>
									</p>
									<p>Minimum received: {(parseFloat(ethers.utils.formatUnits(outputValue > 0 ? outputValue : '0', outputDecimals)) * (1 - slippage)).toFixed(5)}</p>
									{showSlippagePopup && (
										<div
											style={{
												position: 'fixed',
												top: '50%',
												left: '50%',
												transform: 'translate(-50%, -50%)',
												background: 'white',
												padding: '20px',
												borderRadius: '10px',
												boxShadow: '0 0 10px rgba(0,0,0,0.1)',
												zIndex: 1000,
												display: 'flex',
												flexDirection: 'column',
												alignItems: 'center',
												width: '300px'
											}}
										>
											<h3 style={{ marginBottom: '15px', color: '#333' }}>Set Slippage</h3>
											<input
												type="number"
												value={slippage * 100}
												onChange={(e) => setSlippage(parseFloat(e.target.value) / 100)}
												step="0.1"
												min="0"
												max="100"
												style={{
													width: '100%',
													padding: '10px',
													marginBottom: '15px',
													borderRadius: '5px',
													border: '1px solid #ccc',
													fontSize: '16px'
												}}
											/>
											<button
												onClick={() => setShowSlippagePopup(false)}
												style={{
													padding: '10px 20px',
													backgroundColor: '#000',
													color: 'white',
													border: 'none',
													borderRadius: '5px',
													fontSize: '16px',
													cursor: 'pointer',
													transition: 'background-color 0.3s'
												}}
											>
												Save
											</button>
										</div>
									)}
								</div>
							)
						}
					</div>
				</div>

			</main>

			<div style={{
				bottom: '0',
				left: '0',
				right: '0',
				padding: '10px',
				textAlign: 'center',
				fontSize: '15px',
				fontFamily: 'Open Sans, sans-serif',
			}}>
				Powered by <a href="https://fuzz.land">Fuzzland</a> and <a href="https://sentio.xyz/">Sentio</a>
			</div>
		</>
	);
}
