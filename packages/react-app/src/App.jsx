import WalletConnectProvider from "@walletconnect/web3-provider";
import { Alert, Button, Col, Row, Image, Input, Spin } from "antd";
import { LoadingOutlined } from '@ant-design/icons';
import "antd/dist/antd.css";
import React, { useCallback, useEffect, useState } from "react";
// import ReactJson from "react-json-view";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import Web3Modal from "web3modal";
import "./App.css";
import { Account, Contract } from "./components";
import { INFURA_ID, NETWORK, NETWORKS } from "./constants";
import { Transactor } from "./helpers";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { faTwitter, faDiscord } from '@fortawesome/free-brands-svg-icons';

import {
  useBalance,
  useContractLoader,
  useContractReader,
  useExchangePrice,
  useGasPrice,
  useOnBlock,
  useUserSigner,
} from "./hooks";
import ReCAPTCHA from "react-google-recaptcha";
var CryptoJS = require("crypto-js");
const crypto = require("crypto");
require('dotenv').config()
var jwt = require('jsonwebtoken');

const { ethers } = require("ethers");
/// 📡 What chain are your contracts deployed to?
const targetNetwork = NETWORKS.mainnet; // <------- select your target frontend network (localhost, rinkeby, xdai, mainnet)

// 😬 Sorry for all the console logging
const DEBUG = false;
const NETWORKCHECK = false;
const IS_PRESALE_BUY = false;
const IS_LAUNCH_BUY = false;
let PRICE = 0.1919;
let MAX_MINT = 5;

// 🛰 providers
if (DEBUG) console.log("📡 Connecting to Mainnet Ethereum");
const scaffoldEthProvider = null && navigator.onLine ? new ethers.providers.StaticJsonRpcProvider("https://rpc.scaffoldeth.io:48544") : null;
const mainnetInfura = navigator.onLine ? new ethers.providers.StaticJsonRpcProvider("https://mainnet.infura.io/v3/" + INFURA_ID) : null;// ( ⚠️ Getting "failed to meet quorum" errors? Check your INFURA_I

// 🏠 Your local provider is usually pointed at your local blockchain
const localProviderUrl = targetNetwork.rpcUrl;
// as you deploy to other networks you can set REACT_APP_PROVIDER=https://dai.poa.network in packages/react-app/.env
const localProviderUrlFromEnv = process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : localProviderUrl;
if (DEBUG) console.log("🏠 Connecting to provider:", localProviderUrlFromEnv);
const localProvider = new ethers.providers.StaticJsonRpcProvider(localProviderUrlFromEnv);

// 🔭 block explorer URL
const blockExplorer = targetNetwork.blockExplorer;

/*
  Web3 modal helps us "connect" external wallets:
*/
const web3Modal = new Web3Modal({
  // network: "mainnet", // optional
  cacheProvider: true, // optional
  providerOptions: {
    walletconnect: {
      package: WalletConnectProvider, // required
      options: {
        infuraId: INFURA_ID,
      },
    },
  },
});

const logoutOfWeb3Modal = async () => {
  await web3Modal.clearCachedProvider();
  setTimeout(() => {
    window.location.reload();
  }, 1);
};

function App(props) {
  const mainnetProvider = scaffoldEthProvider && scaffoldEthProvider._network ? scaffoldEthProvider : mainnetInfura;
  const [injectedProvider, setInjectedProvider] = useState();
  const [address, setAddress] = useState();
  /* 💵 This hook will get the price of ETH from 🦄 Uniswap: */
  // const price = useExchangePrice(targetNetwork, mainnetProvider);

  /* 🔥 This hook will get the price of Gas from ⛽️ EtherGasStation */
  const gasPrice = useGasPrice(targetNetwork, "average");
  // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
  const userSigner = useUserSigner(injectedProvider, localProvider);
  useEffect(() => {
    async function getAddress() {
      if (web3Modal.cachedProvider && userSigner) {
        const newAddress = await userSigner.getAddress();
        setAddress(newAddress);
      }
    }
    getAddress();
  }, [userSigner]);

  // You can warn the user if you would like them to be on a specific network
  const localChainId = localProvider && localProvider._network && localProvider._network.chainId;
  const selectedChainId =
    userSigner && userSigner.provider && userSigner.provider._network && userSigner.provider._network.chainId;

  // For more hooks, check out 🔗eth-hooks at: https://www.npmjs.com/package/eth-hooks

  // The transactor wraps transactions and provides notificiations
  const tx = Transactor(userSigner, gasPrice);

  // Faucet Tx can be used to send funds from the faucet
  // const faucetTx = Transactor(localProvider, gasPrice);

  // 🏗 scaffold-eth is full of handy hooks like this one to get your balance:
  // const yourLocalBalance = useBalance(localProvider, address);

  // // Just plug in different 🛰 providers to get your balance on different chains:
  // const yourMainnetBalance = useBalance(mainnetProvider, address);

  // Load in your local 📝 contract and read a value from it:
  const readContracts = useContractLoader(localProvider);
  // If you want to make 🔐 write transactions to your contracts, use the userSigner:
  const writeContracts = useContractLoader(userSigner, { chainId: localChainId });

  // EXTERNAL CONTRACT EXAMPLE:
  //
  // If you want to bring in the mainnet DAI contract it would look like:
  // const mainnetContracts = useContractLoader(mainnetProvider);

  // If you want to call a function on a new block
  // useOnBlock(mainnetProvider, () => {
  //   console.log(`⛓ A new mainnet block is here: ${mainnetProvider._lastBlockNumber}`);
  // });

  // Then read your DAI balance like:
  // const myMainnetDAIBalance = useContractReader(mainnetContracts, "DAI", "balanceOf", [
  //   "0x34aA3F359A9D614239015126635CE7732c18fDF3",
  // ]);

  // keep track of a variable from the contract in the local React state:
  // const balance = useContractReader(readContracts, "Totality", "balanceOf", [address]);
  // console.log("🤗 balance:", balance);


  // // 📟 Listen for broadcast events
  // const transferEvents = useEventListener(readContracts, "Totality", "Transfer", localProvider, 1);
  // console.log("📟 Transfer events:", transferEvents);

  //
  // 🧠 This effect will update yourCollectibles by polling when your balance changes
  //
  // const yourBalance = balance && balance.toNumber && balance.toNumber();
  // console.log("🤗 yourBalance:", yourBalance);

  // const totalSupplyBigNum = useContractReader(readContracts, "Totality", "totalSupply");
  // console.log("CALLED INFURA");
  // const totalSupply = totalSupplyBigNum && totalSupplyBigNum.toNumber();


  // const contract = new web3.eth.Contract(contractInfo.ABI, contractInfo.contract_address);

  // console.warn("contract ", contract);
  //
  // 🧫 DEBUG 👨🏻‍🔬
  //
  // useEffect(() => {
  //   if (
  //     DEBUG 
  //     // &&
  //     // mainnetProvider &&
  //     // address &&
  //     // selectedChainId &&
  //     // yourLocalBalance &&
  //     // yourMainnetBalance &&
  //     // readContracts &&
  //     // writeContracts &&
  //     // mainnetContracts
  //   ) {
  //     console.log("_____________________________________ 🏗 scaffold-eth _____________________________________");
  //     // console.log("🌎 mainnetProvider", mainnetProvider);
  //     // console.log("🏠 localChainId", localChainId);
  //     // console.log("👩‍💼 selected address:", address);
  //     // console.log("🕵🏻‍♂️ selectedChainId:", selectedChainId);
  //     // console.log("💵 yourLocalBalance", yourLocalBalance ? ethers.utils.formatEther(yourLocalBalance) : "...");
  //     // console.log("💵 yourMainnetBalance", yourMainnetBalance ? ethers.utils.formatEther(yourMainnetBalance) : "...");
  //     // console.log("📝 readContracts", readContracts);

  //     // console.log("🌍 DAI contract on mainnet:", mainnetContracts);
  //     // console.log("💵 yourMainnetDAIBalance", myMainnetDAIBalance);
  //     // console.log("🔐 writeContracts", writeContracts);
  //   }
  // }, [
  //   // mainnetProvider,
  //   // address,
  //   // selectedChainId,
  //   // yourLocalBalance,
  //   // yourMainnetBalance,
  //   readContracts,
  //   // writeContracts,
  //   // mainnetContracts,
  // ]);

  // const totalSupply = new Promise((resolve, reject) => {
  //    readContracts && readContracts.Totality && readContracts.Totality.totalSupply().then(result => result.toNumber());
  // });

  //  let totalSupply = readContracts && readContracts.Totality && readContracts.Totality.totalSupply().then(function(result) {
  //   return result && result.toNumber();
  //  });


  // totalSupply && totalSupply.then( res => {return res});

  let networkDisplay = "";
  if (NETWORKCHECK && localChainId && selectedChainId && localChainId !== selectedChainId) {
    const networkSelected = NETWORK(selectedChainId);
    const networkLocal = NETWORK(localChainId);
    if (selectedChainId === 1337 && localChainId === 31337) {
      networkDisplay = (
        <div style={{ zIndex: 2, position: "absolute", right: 0, top: 60, padding: 16 }}>
          <Alert
            message="⚠️ Wrong Network ID"
            description={
              <div>
                You have <b>chain id 1337</b> for localhost and you need to change it to <b>31337</b> to work with
                HardHat.
                <div>(MetaMask -&gt; Settings -&gt; Networks -&gt; Chain ID -&gt; 31337)</div>
              </div>
            }
            type="error"
            closable={false}
          />
        </div>
      );
    } else {
      networkDisplay = (
        <div style={{ zIndex: 2, position: "absolute", right: 0, top: 60, padding: 16 }}>
          <Alert
            message="⚠️ Wrong Network"
            description={
              <div>
                You have <b>{networkSelected && networkSelected.name}</b> selected and you need to be on{" "}
                <Button
                  onClick={async () => {
                    const ethereum = window.ethereum;
                    const data = [
                      {
                        chainId: "0x" + targetNetwork.chainId.toString(16),
                        chainName: targetNetwork.name,
                        nativeCurrency: targetNetwork.nativeCurrency,
                        rpcUrls: [targetNetwork.rpcUrl],
                        blockExplorerUrls: [targetNetwork.blockExplorer],
                      },
                    ];
                    console.log("data", data);
                    const tx = await ethereum.request({ method: "wallet_addEthereumChain", params: data }).catch();
                    if (tx) {
                      console.log(tx);
                    }
                  }}
                >
                  <b>{networkLocal && networkLocal.name}</b>
                </Button>.
              </div>
            }
            type="error"
            closable={false}
          />
        </div>
      );
    }
  } else {
    networkDisplay = (
      <div style={{ zIndex: -1, position: "absolute", right: 154, top: 28, padding: 16, color: targetNetwork.color }}>
        {targetNetwork.name}
      </div>
    );
  }

  const loadWeb3Modal = useCallback(async () => {
    const provider = await web3Modal.connect();
    setInjectedProvider(new ethers.providers.Web3Provider(provider));

    provider.on("chainChanged", chainId => {
      console.log(`chain changed to ${chainId}! updating providers`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    provider.on("accountsChanged", () => {
      console.log(`account changed!`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    // Subscribe to session disconnection
    provider.on("disconnect", (code, reason) => {
      console.log(code, reason);
      logoutOfWeb3Modal();
    });
  }, [setInjectedProvider]);

  useEffect(() => {
    // console.warn("web3Modal.cachedProvider ", web3Modal.cachedProvider);
    if (web3Modal.cachedProvider && (IS_PRESALE_BUY || IS_LAUNCH_BUY)) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);


  const genToken = () => {
    var token = jwt.sign({
      data: crypto.randomBytes(9).toString("base64"),
      iat: (new Date().getTime()) / 1000,
      exp: (new Date().getTime() + 5 * 1000) / 1000,
    }, process.env.REACT_APP_API_SECRET_KEY);
    return token;
  }
  const validateWhitelist = async (address, tokenQuantity) => {
    const requestUrl = "https://api-totality-nft-whitelist.herokuapp.com/check/whitelist/" + address + "/" + tokenQuantity;
    // const requestUrl = "http://localhost:4000/check/whitelist/" + address + "/" + tokenQuantity;
    const getData = await fetch(requestUrl, {
      method: "GET",
      headers: {
        'Authorization': 'Bearer ' + genToken()
      }
    });
    let data = await getData.json();
    return data;
  }

  const successfulMint = async (address, tokenQuantity) => {
    const requestUrl = "https://api-totality-nft-whitelist.herokuapp.com/successful/mint/" + address + "/" + tokenQuantity;
    // const requestUrl = "http://localhost:4000/successful/mint/" + address + "/" + tokenQuantity;
    const getData = await fetch(requestUrl, {
      method: "GET",
      headers: {
        'Authorization': 'Bearer ' + genToken()
      }
    });
    let data = await getData.json();
    return data;
  }

  const failMint = async (address) => {
    const requestUrl = "https://api-totality-nft-whitelist.herokuapp.com/fail/mint/" + address;
    // const requestUrl = "http://localhost:4000/fail/mint/" + address;
    const getData = await fetch(requestUrl, {
      method: "GET",
      headers: {
        'Authorization': 'Bearer ' + genToken()
      }
    })
    let data = await getData.json();
    return data;
  }

  let [whitelistMessage, setWhitelistMessage] = useState();

  let [tokenQuantity, setTokenQuantity] = useState(1);

  let [isCaptchaVerified, setCaptchaVerified] = useState(false);

  let [totalSupply, setTotalSupply] = useState();

  let [isLoading, setIsLoading] = useState(false);

  let spinnerDiplay = "";

  if (isLoading) {
    const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;
    spinnerDiplay = (
      <h4>
        <Spin indicator={antIcon} /> Mint
      </h4>
    )
  } else {
    spinnerDiplay = (
      <h4>
        Mint
      </h4>
    )
  }
  // let [isCaptchaVerified, setCaptchaVerified] = useState(false); // default tokenQuantity


  (IS_PRESALE_BUY || IS_LAUNCH_BUY) && !totalSupply && readContracts && readContracts.Totality && readContracts.Totality.totalSupply().then(result => setTotalSupply(result.toNumber()));

  function refreshTotalSupply() {
    (IS_PRESALE_BUY || IS_LAUNCH_BUY) && readContracts && readContracts.Totality && readContracts.Totality.totalSupply().then(result => setTotalSupply(result.toNumber()));
  }

  function onChange(value) {
    console.log("Captcha value:", value);
    if (value) {
      setCaptchaVerified(true);
    }
  }


  let mintDisplay = "";
  if (!IS_LAUNCH_BUY && !IS_PRESALE_BUY) {
    mintDisplay = (
      <h1 style={{ marginTop: 50 }}>
        Minting Coming Soon...
        <a href="https://discord.gg/U6QFZsJJc4"><b><p>Get whitelisted for our presale <FontAwesomeIcon icon={faExternalLinkAlt} /></p></b></a>
        <p>Presale Mint Price: 0.0919<span className="ether">Ξ</span> each</p>
        <p>Launch Mint Price: 0.1919<span className="ether">Ξ</span> each</p> 
      </h1>
    )
  } else {

    if (IS_PRESALE_BUY) {
      MAX_MINT = 2;
      PRICE = 0.0919;
    }

    mintDisplay = (
      <div style={{ margin: "auto", marginTop: 32, paddingBottom: 32 }}>
        <div style={{ padding: 32 }}>
          <ReCAPTCHA
            sitekey="6LeK4QMdAAAAANekL14gqheznwSRx7MJ-U_n0TLy"
            onChange={onChange}
          />
          <br></br><br></br>
          <h2>
            <span style={{ marginRight: 88 }}>Price per Totality</span>
            <span style={{ float: "right" }}> {PRICE} ETH</span>
          </h2>
          
          <Input placeholder="Quantity" maxLength={1} defaultValue={tokenQuantity} value={tokenQuantity} style={{ width: "23rem", borderRadius: 10 }} onChange={event => {

            let min;
            let max;
            let value  = event.target.value;
            if(IS_PRESALE_BUY){
              min = 1;
              max = 2;
            } else {
              min = 1;
              max = 5;
            }

            value = Math.max(Number(min), Math.min(Number(max), Number(value)));
            setTokenQuantity(value)
          }} />

          {IS_PRESALE_BUY ? (
            <h3>
              <span>Max {MAX_MINT} mints per Whitelisted Wallet Address</span>
            </h3>
          ) : (
            <h3>
              <span>Max {MAX_MINT} mints per transaction</span>
            </h3>
          )}
          <br></br>
          <h2>
            <span style={{ marginRight: 50 }}> {totalSupply} / 1919 Minted</span>
            <span style={{ float: "right" }}>Total {(tokenQuantity * PRICE).toFixed(4)} ETH</span>
          </h2>

          <br></br><br></br>
          <Button disabled={!isCaptchaVerified || isLoading} style={{ borderRadius: 10, backgroundColor: "white" }} size="large"
            onClick={() => {
              if (tokenQuantity === 0) {
                setWhitelistMessage(
                  <div style={{ color: "red" }}>
                    Quantity is 0
                  </div>
                );
                return;
              }
              if (!address && (IS_PRESALE_BUY || IS_LAUNCH_BUY)) {
                loadWeb3Modal();
              } else {
                if (!IS_PRESALE_BUY && IS_LAUNCH_BUY) { // Launch
                  setIsLoading(true);
                  let etherPrice = (tokenQuantity * PRICE);
                  console.warn("LAUNCH MINTING!");
                  console.warn("tokenQuantity ! ", tokenQuantity);
                  console.warn("etherPrice ! ", etherPrice);

                  etherPrice = Math.round(etherPrice * 1e4) / 1e4;
                  tx(writeContracts.Totality.buy(tokenQuantity, { value: ethers.utils.parseEther(etherPrice.toString()) }),
                    update => {
                      setIsLoading(false);
                      if (update.status === "confirmed" || update.status === 1) {
                        refreshTotalSupply();
                        setWhitelistMessage(
                          <div style={{ color: "lightgreen" }}>
                            Successfully minted {tokenQuantity} tokens!
                          </div>
                        );
                      } else if (update && (update.status !== "confirmed" && update.status !== 1 && update.status !== "sent" && update.status !== "pending")) {
                        console.warn("📡 TX FAILED");
                        setWhitelistMessage(
                          <div style={{ color: "red" }}>
                            Failed to mint {tokenQuantity} tokens!
                          </div>
                        );
                      }
                    });
                } else if (IS_PRESALE_BUY && !IS_LAUNCH_BUY) { // PRESALE
                  setIsLoading(true);
                  const getValidateWhitelist = async () => {
                    await validateWhitelist(address, tokenQuantity).then(res => {
                      if (res.result === "Whitelisted") {
                        let etherPrice = (tokenQuantity * PRICE);
                        console.warn("PRESALE MINTING!");
                        console.warn("tokenQuantity ! ", tokenQuantity);
                        console.warn("etherPrice ! ", etherPrice);
      
                        etherPrice = Math.round(etherPrice * 1e4) / 1e4;
      
                        var bytes = CryptoJS.AES.decrypt(res.ciphertext, process.env.REACT_APP_CRYPTO_SECRET_KEY);
                        var decrypted = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

                        tx(writeContracts.Totality.presaleBuy(decrypted.signature, decrypted.nonce, decrypted.tokenQuantity, { value: ethers.utils.parseEther(etherPrice.toString()) }),
                          update => {
                            setIsLoading(false);

                            console.warn("📡 Transaction Update:", update);
                            if (update && (update.status !== "confirmed" && update.status !== 1 && update.status !== "sent" && update.status !== "pending")) {
                              console.warn("📡 TX FAILED");
                              failMint(address)
                            } else if (update.status === "confirmed" || update.status === 1) {
                              refreshTotalSupply();
                              // const balance = useContractReader(readContracts, "Totality", "balanceOf", [address]);
                              // const yourBalance = balance && balance.toNumber && balance.toNumber();
                              // console.warn("yourBalance ", yourBalance);
                              // for (let tokenIndex = 0; tokenIndex < balance; tokenIndex++) {
                              //   const tokenId = readContracts.Totality.tokenOfOwnerByIndex(address, tokenIndex);
                              //   console.warn("tokenId ", tokenId);
                              // }
                              successfulMint(address, decrypted.tokenQuantity).then(res => {
                                setWhitelistMessage(
                                  <div style={{ color: "lightgreen" }}>
                                    Successfully minted {decrypted.tokenQuantity} tokens!
                                  </div>
                                );
                              });
                            }
                          });
                      }
                      else if (res.result === "pending") {
                        setWhitelistMessage(
                          <div>
                            Please wait while we proccess your mint!
                          </div>
                        );
                      }
                      else if (res.result === "Mint exceed limit") {
                        setIsLoading(false);
                        setWhitelistMessage(
                          <div style={{ color: "red" }}>
                            You have exceed the presale mint limit of 2
                          </div>
                        );
                      }
                      else if (res.result === "Not Whitelisted") {
                        setIsLoading(false);
                        setWhitelistMessage(
                          <div style={{ color: "red" }}>
                            Sorry! You are Not whitelisted!
                          </div>
                        );
                      }
                      else {
                        setIsLoading(false);
                        setWhitelistMessage(
                          <div style={{ color: "red" }}>
                            Failed to mint {tokenQuantity} tokens!
                          </div>
                        );
                      }
                    });
                  }
                  getValidateWhitelist();
                }
              }
            }}
          >
            {spinnerDiplay}
          </Button>
          {whitelistMessage}
        </div>
      </div>
    )
  }
  return (
    <div className="App">
      {/* ✏️ Edit the header and change the title to your project name */}
      {/* <Header /> */}
      <BrowserRouter>
        <Switch>
          <Route exact path="/">
            {/*
                🎛 this scaffolding is full of commonly used components
                this <Contract/> component will automatically parse your ABI
                and give you a form to interact with it locally
            */}
            {/* 
             */}

            {/* <ReactFullpage
              scrollOverflow={false}
              anchors={['firstPage', 'secondPage', 'thirdPage']}
              render={({ state, fullpageApi }) => {
                return ( */}
            <div id="fullpage-wrapper">
              {/* <div style={{position: "fixed"}}>
                      <img style={{ height:"82vh"}} src="hero.jpg"/>
                    </div> */}
              <div className="section1">
                <Row type="flex" align="middle" style={{ alignItems: 'center', height: '100vh' }}>
                  <Col span={6}>
                  </Col>
                  <Col span={4}>
                    <h1 style={{ fontSize: "10vw" }}>
                      TOTALITY
                    </h1>
                  </Col>
                  <Row>
                    <Col span={6}>
                    </Col>
                    <Col span={8} style={{ display: "contents" }}>
                      <h1 style={{ fontSize: "4vw", marginTop: "10vw" }}>
                        BY REI
                      </h1>
                    </Col>
                  </Row>
                </Row>
                {/* <Row type="flex" align="middle" style={{ alignItems: 'center', marginTop: "-15vh" }}>
                  <Col span={11}>
                  </Col>
                  <Col span={12}>
                    <img src={require('./scroll.svg')} />
                  </Col>
                </Row> */}
              </div>
              <div className="section">
                <Row justify="center">
                  <Col sm={20} lg={10} xl={9}>
                    <h2 style={{ fontSize: "5rem" }}>
                      Umbraphile Universe
                    </h2>
                    <p>
                      TOTALITY is an active, generative NFT project with a collection of <u>1,919</u> uniquely generative art composed of <u>18 distinct chaotic systems</u> that each develop their own characteristics of <u>3,840,000,000</u> combinations <br></br><br></br>

                      TOTALITY's artwork synthesizes methodical art using trigonometry cipher written on <u>R programming language</u> typically used in statistical computing
                    </p> <br></br><br></br>
                    <p><b>#UMBRAPHILE</b></p>
                    <p><i>noun</i></p>
                    <p><i>The term, describes one who loves eclipses, often travelling to see them.</i></p>
                  </Col>
                  <Col span={9.5} lg={10}>
                    <Row gutter={[16, 16]} style={{ marginBottom: "1rem" }}>
                      <Col span={8}>
                        <Image className="scalable-image" src={require('./marketing1.gif')} />
                      </Col>
                      <Col span={8}>
                        <Image className="scalable-image" src={require('./marketing2.gif')} />
                      </Col>
                      <Col span={8}>
                        <Image className="scalable-image" src={require('./marketing3.gif')} />
                      </Col>
                    </Row>
                    <Row gutter={[16, 16]}>
                      <Col span={8}>
                        <Image className="scalable-image" src={require('./marketing4.gif')} />
                      </Col>
                      <Col span={8}>
                        <Image className="scalable-image" src={require('./marketing5.gif')} />
                      </Col>
                      <Col span={8}>
                        <Image className="scalable-image" src={require('./marketing6.gif')} />
                      </Col>
                    </Row>
                    <div style={{ textAlign: "-webkit-right" }}>
                      {mintDisplay}
                    </div>
                  </Col>
                </Row>
              </div>
              <div className="section">
                <Row justify="center">
                  <Col span={19}>
                    <h2 style={{ fontSize: "5rem" }}>
                      Design Inspiration
                    </h2>

                    <h2 style={{ marginBottom: "1rem", marginTop: "3rem", fontSize: "2rem" }}>
                      Limit Cycles Oscillations
                    </h2>
                    <p className="verticalAlignText">
                      Inspired by <i>Limit Cycles Oscillations</i> in <i>Dynamical Systems</i>, Totality's artwork is generatively drawn on a
                      two-dimensional phase space in a closed trajectory having it's trajectory spirals into either infinity or
                      negative infinity. <br></br><br></br>

                      Similarly to <i>Limit Cycles</i>, Totality's artwork consists of stable, unstable, and semi-stable limit cycles
                      oscillations with a spherical structure emerged from its chaotic systems, considering a dynamic system
                      with a chaotic system is locally unstable yet globally stable with its trajectory spirals diverge/converge
                      with another but never deviate from its spherical structure.
                    </p>

                    <h2 style={{ marginBottom: "1rem", marginTop: "3rem", fontSize: "2rem" }}>
                      Solar Eclipse
                    </h2>
                    <p className="verticalAlignText">
                      Totality art designs consists of stars, solar eclipse, gravitational force, and magnetic fields and many more.
                      <br></br><br></br>
                      Below are a <b>few</b> examples of Totality's artwork
                    </p>

                    <h2 style={{ marginBottom: "1rem", marginTop: "3rem", fontSize: "2rem" }}>
                      Solar Prominence
                    </h2>
                    <Row type="flex" align="center" style={{ alignItems: 'center' }}>
                      <Image className="solar-example" src={require('./solar-prominence.gif')} />
                    </Row>
                    <p className="verticalAlignText">
                      A <i>Solar Prominence</i>, is referred to a filament when viewed against the solar disk, is a large, bright, gaseous, feature extending outward from the Sun's surface, often in a loop shape. Prominence are anchored to the Sun's surface in the photosphere, and extend outwards into the Solar Corona.
                    </p>

                    <h2 style={{ marginBottom: "1rem", marginTop: "3rem", fontSize: "2rem" }}>
                      Baily's Beads
                    </h2>
                    <Row type="flex" align="center" style={{ alignItems: 'center' }}>
                      <Image className="solar-example" src={require('./bailey-beads.gif')} />
                    </Row>
                    <p className="verticalAlignText">
                      The <i>Baily's beads effect</i> or <i>diamond ring effect</i> is a feature of total and annular solar eclipses. As the Moon covers the Sun during a solar eclipse, the rugged topography of the lunar limb allows beads of sunlight to shine through in some places while not in others.
                    </p>
                  </Col>
                </Row>
              </div>
              <div className="section">
                <Row justify="center">
                  <Col span={19}>
                  </Col>
                </Row>
              </div>
              <div className="section">
                <Row justify="center">
                  <Col span={19}>
                    <h2 style={{ fontSize: "5rem" }}>
                      Technical Description
                    </h2>
                    <h2 style={{ marginBottom: "1rem", marginTop: "3rem", fontSize: "2rem" }}>
                      Example of Limit Cycles in Non-Linear Systems
                    </h2>
                    <Row type="flex" align="center" style={{ alignItems: 'center' }}>
                      <Image className="solar-example" src={require('./limit-cycle.png')} />
                    </Row>
                    <Row style={{ marginTop: "3rem" }}>
                      <Col xs={{ span: 5, offset: 0 }} lg={{ span: 6, offset: 2 }}>
                        <p><b>Where</b></p>
                        <p>min x = -5, max x = 5</p>
                        <p>min y = -5, max y =5</p>
                      </Col>
                      <Col xs={{ span: 11, offset: 3 }} lg={{ span: 6, offset: 2 }}>
                        <br></br><br></br>
                        <p>x'=x-y-x^3-x*y^2</p>
                        <p>y'=x+y-x^2*y-y^3</p>
                      </Col>
                      <Col xs={{ span: 5, offset: 0 }} lg={{ span: 6, offset: 2 }}>
                        <br></br><br></br>
                        <a className="icon" href="https://aeb019.hosted.uark.edu/pplane.html"><p>Try it <FontAwesomeIcon icon={faExternalLinkAlt} /></p></a>
                      </Col>
                    </Row>
                  </Col>
                  <Col span={19}>
                    <h2 style={{ marginBottom: "1rem", marginTop: "3rem", fontSize: "2rem" }}>
                      Example of Totality Art
                    </h2>
                    <Row type="flex" align="center" style={{ alignItems: 'center' }}>
                      <Image className="solar-example" src={require('./totality-example-204.gif')} />
                    </Row>
                    <p>The example is inspired by the <i>Limit Cycles</i>, which can be visualized as an Eclipse with a tinge of <i>Chaos</i>, which can be imagined as Solar
                      Prominences of the Sun emerging dense clouds of incandescent ionized gas to protect from the Sun's
                      chromosphere into the corona.
                      <br></br><br></br>
                      The curvature trajectories that converges into the spherical structure can be seen as magnetic fields
                      manifesting in the void of our overall universe.
                    </p>
                    <br></br><br></br>
                    <p>Created by the following algorithm:</p>
                    <Row style={{ marginTop: "3rem" }}>
                      <Col xs={{ span: 10, offset: 0 }} lg={{ span: 10, offset: 2 }}>
                        <p><i>p</i> - Polarity of closed trajectory spirals into infinity or negative infinity</p>
                        <p><i>x</i> - Horizontal Variation</p>
                        <p><i>y</i> - Vertical Variation</p>
                        <p><i>d</i> - Density of the convergence/divergence of trajectory spirals</p>
                        <p><i>cv</i> - Chaos Variation</p>
                        <p><i>ca</i> - Chaos Amplifier</p>
                        <p><i>trigo</i> - Trigonometric Identities</p>
                      </Col>
                      <Col xs={{ span: 10, offset: 4 }} lg={{ span: 10, offset: 2 }}>
                        <p><b>Where</b></p>
                        <p>x axis = <i>p * x^d - trigo(y^cv) * ca</i></p>
                      <p>x axis = <i>p * x^d - trigo(y^cv) * ca</i></p> 
                        <p>x axis = <i>p * x^d - trigo(y^cv) * ca</i></p>
                        <p>y axis = <i>p * y^d - trigo(x^cv) * ca</i></p><br></br>
                        <p><b>Note: Not all Totality art are using same algorithm</b></p>
                      </Col>

                    </Row>
                    <h2 style={{ marginBottom: "1rem", marginTop: "3rem", fontSize: "5rem" }}>
                      Design Animations
                    </h2>
                    <h2 style={{ marginBottom: "1rem", marginTop: "3rem", fontSize: "2rem" }}>
                      Active Rotation
                    </h2>
                    <Row type="flex" align="center" style={{ alignItems: 'center' }}>
                      <Image className="solar-example" src={require('./rotate-left.gif')} />
                      <Image className="solar-example" src={require('./rotate-right.gif')} />
                    </Row>
                    <p>Totality's artwork animation is inspired by the <i>polarity reversals</i> that occurs on our Earth, Jupiter, and
                      Saturn, where magnetic fields can become unstable and the <i>polarity</i> would be reversed changing the
                      planet's life and climate. <br></br><br></br>

                      Totality's artwork rotational direction is determined by the <i>polarity</i> of the x and y axis, where the
                      polarities competes itself of which would be dominant. The dominant <i>polarity</i> decides the rotational
                      direction of each Totality's artwork
                    </p>

                    <h2 style={{ marginBottom: "1rem", marginTop: "3rem", fontSize: "2rem" }}>
                      Magnetic Storms
                    </h2>
                    <p>Inspired by the magnetic storms which is caused by a strong surge of solar wind which disturbs the outer
                      part of the Earth's magnetic field causing a complex oscillation, generating electric currents and magnetic
                      field variations.</p>
                    <Row type="flex" align="center" style={{ alignItems: 'center' }}>
                      <Image className="solar-example" src={require('./surge.png')} />
                    </Row>
                    <p style={{ marginTop: "3rem" }}>
                      Totality's artwork is infused with a active rotation that is created by integrating a scaling function in ggplot2. This randomly create a <i>surge</i> on the x-axis on the decided the rotational direction by the <i>dominant polarity</i>. This <i>surge</i> can be understood as unusual and mysterious, like in our milky way.
                    </p>

                  </Col>
                </Row>
              </div>

              <div className="section">
                <Row justify="center">
                  <Col span={19}>
                    <h2 style={{ fontSize: "5rem" }}>
                      FAQ
                    </h2>

                    <h2 style={{ marginBottom: "1rem", marginTop: "3rem", fontSize: "2rem" }}>
                      What is Generative Art?
                    </h2>
                    <p className="verticalAlignText">
                      Generative Arts are designs generated, composed, or constructed through computer software algorithms, or similar mathematical, or mechanical autonomous processes. <br></br><br></br>
                      The common forms of generative arts are graphics that visually represents complex processes, music, or language-based compositions like poetry. <br></br><br></br>
                      Other applications include architectural design, models for understanding sciences such as evolution, and artificial intelligence systems.
                    </p>

                    <h2 style={{ marginBottom: "1rem", marginTop: "3rem", fontSize: "2rem" }}>
                      What is Totality's 1,919 quantity inspiration?
                    </h2>
                    <p className="verticalAlignText">
                      On May 29, 1919, the solar eclipse affirmed the prediction of Einstein’s theory of general relativity,
                      ascribing gravity to a warp in the geometry of space-time, that gravity could bend light beams. <br></br><br></br>
                    </p>

                    <h2 style={{ marginBottom: "1rem", marginTop: "3rem", fontSize: "2rem" }}>
                      How much will Totality's artwork cost?
                    </h2>
                    <p className="verticalAlignText">
                      <p>Presale Mint Price: 0.0919<span className="ether">Ξ</span> each</p>
                      <p>Launch Mint Price: 0.1919<span className="ether">Ξ</span> each</p> 
                    </p>

                    <h2 style={{ marginBottom: "1rem", marginTop: "3rem", fontSize: "2rem" }}>
                      Why you should hold Totality artworks?
                    </h2>
                    <p className="verticalAlignText">
                      Totality's one of a kind artwork is written, generated, and animated in <u>R programming language</u>.
                      Which sets us apart from previous generative art projects that commonly uses JavaScript library p5js. This also means there are <b>NO</b> post-processings (Photoshop, After Effects, or any third-party software effects) involved. Totality's artwork effects are 100% authentically <b>achieved by code</b>. <br></br><br></br>

                      By holding Totality artwork, grants holders <u>access to exclusive discord channel</u> where in-depth knowledge
                      sharing of artistry, creative process of generating art, and technology development such as NFT
                      generation, Front-end & Backend development, off-chain whitelisting, and smart contract development. <br></br><br></br>

                      And lastly, by holding Totality's artwork, we will be <u>redistributing reflection rewards</u> to <b>all Totality artwork
                        holders</b>. Totality is totally about you. The more Totality artwork you hold, the <b>more rewards</b> will you earn
                      (ETH) for being a supporter of our community!
                    </p>
                    <h2 style={{ marginBottom: "1rem", marginTop: "3rem", fontSize: "2rem" }}>
                      Totality x Aritsts x Metaverse
                    </h2>
                    <p className="verticalAlignText">
                      Totality would love to collaborate with other digital artists to enhance our NFT art be it hand-drawn or
                      generative art using AI models. Which would eventually contribute into building our metaverse. <br></br><br></br>

                      I am following very closely to <a href="https://about.facebook.com/meta">Mark Zuckerberg's Metaverse</a> plan 🌐  <br></br>
                      Keeping you guys updated towards a bigger future via <a href="https://twitter.com/totalitybyrei">Twitter</a>! <br></br><br></br>

                      Tell us an artist to collaborate with on <a href="https://discord.gg/U6QFZsJJc4">Discord</a>
                    </p>
                  </Col>
                </Row>
              </div>
              <div className="section">
                <Row justify="center">
                  <Col span={19}>
                    <h2 style={{ fontSize: "5rem" }}>
                      Roadmap v1
                    </h2>
                    <Row style={{ marginBottom: "3rem" }}>
                      <Col span={4} style={{ marginRight: "1rem" }}>
                        <Image className="scalable-roadmap-image" preview={false} src={require('./roadmap-0.svg')} />
                      </Col>
                      <Col span={18} style={{ alignSelf: "center" }}>
                        <p className="verticalAlignText">
                          Early members will be able to partake in various activities to secure a spot in our whitelist pre-sale. <br></br><br></br>
                          Whitelistees will be guaranteed a spot to mint 2x Totality at a preferential discounted price of 0.0919<span className="ether">Ξ</span> each
                          <br></br><br></br>
                        </p>
                      </Col>
                    </Row>
                    <Row style={{ marginBottom: "3rem" }}>
                      <Col span={4} style={{ marginRight: "1rem" }}>
                        <Image className="scalable-roadmap-image" preview={false} src={require('./roadmap-25.svg')} />
                      </Col>
                      <Col span={18} style={{ alignSelf: "center" }}>
                        <p className="verticalAlignText">
                          Redistribute 5% proceed from minting (a.k.a reflection rewards) to all Totality holders
                          <br></br>
                          Approx. 3.5<span className="ether">Ξ</span> reflection reward pool to be redistributed back to holders
                        </p>
                      </Col>
                    </Row>
                    <Row style={{ marginBottom: "3rem" }}>
                      <Col span={4} style={{ marginRight: "1rem" }}>
                        <Image className="scalable-roadmap-image" preview={false} src={require('./roadmap-50.svg')} />
                      </Col>
                      <Col span={18} style={{ alignSelf: "center" }}>
                        <p className="verticalAlignText">
                          Redistribute 10% reflection rewards to all Totality holders<br></br>
                          Approx. 9<span className="ether">Ξ</span> reflection reward pool to be redistributed back to holders
                          <br></br><br></br>
                          Chill out in Totality Umbraphile Chasers Lo-fi playlist
                        </p>
                      </Col>
                    </Row>
                    <Row style={{ marginBottom: "3rem" }}>
                      <Col span={4} style={{ marginRight: "1rem" }}>
                        <Image className="scalable-roadmap-image" preview={false} src={require('./roadmap-75.svg')} />
                      </Col>
                      <Col span={18} style={{ alignSelf: "center" }}>
                        <p className="verticalAlignText">
                          Redistribute 15% reflection rewards to all Totality holders<br></br>
                          Approx. 14<span className="ether">Ξ</span> reflection reward pool to be redistributed back to holders
                        </p>
                      </Col>
                    </Row>
                    <Row style={{ marginBottom: "3rem" }}>
                      <Col span={4} style={{ marginRight: "1rem" }}>
                        <Image className="scalable-roadmap-image" preview={false} src={require('./roadmap-100.svg')} />
                      </Col>
                      <Col span={18} style={{ alignSelf: "center" }}>
                        <p className="verticalAlignText">
                          20<span className="ether">Ξ</span> will be committed to treasury fund for Gen 2 development, where we will collaborate with other artist to leverage another dimension to generative art
                          <br></br><br></br>
                          Gen 1 holder would be able to gain early access to upcoming Gen 2 drop
                          <br></br><br></br>
                          5% of Gen 1 secondary sales will also be committed for NFT giveaway periodically exclusive to holder
                        </p>
                      </Col>
                      <br></br><br></br>
                      <p className="verticalAlignText">
                        More development to be unfold; so keep a look out for Roadmap 2.0
                      </p>
                    </Row>
                  </Col>
                </Row>
              </div>

              <div className="section">
                <Row justify="center">
                  <Col span={19}>
                    <h2 style={{ fontSize: "5rem" }}>
                      Join our Umbraphile Community
                    </h2>


                    <h2 style={{ marginBottom: "1rem", marginTop: "3rem", fontSize: "2rem" }}>
                      Our Vision
                    </h2>
                    <p className="verticalAlignText">
                      We aim to help in the development of off-chain capabilities with Web3 and other forms of generative arts,
                      focusing on the NFT ecosystem. <br></br><br></br>

                      We strive to deliver life changing artistry and technology development with our Umbraphile community to
                      enrich creative process of generating art, Web3 developments, building of Metaverse.<br></br><br></br>

                      See you in our curated universe 🌌 <br></br><br></br>
                    </p>
                    <span>
                      <a href="https://twitter.com/totalitybyrei"><FontAwesomeIcon icon={faTwitter} size="3x" className="icon" /></a>
                      <a href="https://discord.gg/U6QFZsJJc4"><FontAwesomeIcon icon={faDiscord} size="3x" className="icon" /></a>
                    </span>
                    <br></br><br></br><br></br><br></br>
                  </Col>
                </Row>
              </div>
            </div>
          </Route>

          {/* <Route path="/debugcontracts">
            <Contract
              name="Totality"
              signer={userSigner}
              provider={localProvider}
              address={address}
              blockExplorer={blockExplorer}
            />
          </Route> */}
        </Switch>
      </BrowserRouter>

      {/* <ThemeSwitch /> */}

      {/* 👨‍💼 Your account is in the top right with a wallet at connect options */}
      <div style={{ position: "fixed", right: 0, top: 0, padding: "10px 0 0 0", backgroundColor: "rgba(0, 0, 0, 0.5)", width: "100vw" }}>
        <h1 style={{ marginLeft: 20, textAlign: "left" }}>TOTALITY
          <Account
            address={address}
            // localProvider={localProvider}
            // userSigner={userSigner}
            mainnetProvider={mainnetProvider}
            // price={price}
            web3Modal={web3Modal}
            loadWeb3Modal={loadWeb3Modal}
            logoutOfWeb3Modal={logoutOfWeb3Modal}
            blockExplorer={blockExplorer}
          />
        </h1>
      </div>
    </div>
  );
}

export default App;
