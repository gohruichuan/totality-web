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
const targetNetwork = NETWORKS.rinkeby; // <------- select your target frontend network (localhost, rinkeby, xdai, mainnet)

// 😬 Sorry for all the console logging
const DEBUG = false;
const NETWORKCHECK = true;
const IS_PRESALE_BUY = false;
const IS_LAUNCH_BUY = false;
let PRICE = 0.07;
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
    if (web3Modal.cachedProvider) {
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

  let [tokenQuantity, setTokenQuantity] = useState(1); // default tokenQuantity

  let [isCaptchaVerified, setCaptchaVerified] = useState(false);

  let [totalSupply, setTotalSupply] = useState();

  let [isLoading, setIsLoading] = useState(false);

  let spinnerDiplay = "";

  if(isLoading){
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


  !totalSupply && readContracts && readContracts.Totality && readContracts.Totality.totalSupply().then(result => setTotalSupply(result.toNumber()));

  function refreshTotalSupply(){
    readContracts && readContracts.Totality && readContracts.Totality.totalSupply().then(result => setTotalSupply(result.toNumber()));
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
      <h1 style={{  marginTop: 50 }}>
        Minting Coming Soon...
      </h1>
    )
  } else {

    if(IS_PRESALE_BUY){
      PRICE = 0.05;
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
            <span style={{ marginRight: 88 }}>Price per Eclipse</span>
            <span style={{float: "right"}}> {PRICE} ETH</span>
          </h2>
          <Input placeholder="Quantity" maxLength={1} defaultValue={tokenQuantity} style={{ width: "23rem", borderRadius: 10 }} onChange={event => {
            setTokenQuantity(event.target.value)
          }} /> 
          <br></br><br></br>
          <h2>
            <span style={{ marginRight: 50 }}> {totalSupply} / 1919 Minted</span>
            <span style={{float: "right"}}>Total {(tokenQuantity * PRICE).toFixed(2)} ETH</span>
          </h2>

          <br></br><br></br>
          <Button disabled={!isCaptchaVerified} style={{borderRadius: 10, backgroundColor:"white" }} size="large"
            onClick={() => {
              if (tokenQuantity === 0) {
                setWhitelistMessage(
                  <div style={{ color: "red" }}>
                    Quantity is 0
                  </div>
                );
                return;
              }
              if (!address) {
                loadWeb3Modal();
              } else {
                if (!IS_PRESALE_BUY && IS_LAUNCH_BUY) { // Launch
                  setIsLoading(true);
                  const etherPrice = (tokenQuantity * PRICE).toString();
                  console.warn("LAUNCH MINTING!");
                  console.warn("tokenQuantity ! ", tokenQuantity);
                  console.warn("etherPrice ! ", etherPrice);
                  tx(writeContracts.Totality.buy(tokenQuantity, { value: ethers.utils.parseEther(etherPrice) }),
                    update => {
                      setIsLoading(false);
                      if (update.status === "confirmed" || update.status === 1) {
                        refreshTotalSupply();
                        setWhitelistMessage(
                          <div style={{ color: "green" }}>
                            Successfully minted {tokenQuantity} tokens!
                          </div>
                        );
                      } else {
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
                        const etherPrice = (tokenQuantity * PRICE).toString();

                        console.warn("PRESALE MINTING!");
                        console.warn("tokenQuantity ! ", tokenQuantity);
                        console.warn("etherPrice ! ", etherPrice);

                        var bytes = CryptoJS.AES.decrypt(res.ciphertext, process.env.REACT_APP_CRYPTO_SECRET_KEY);
                        var decrypted = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

                        tx(writeContracts.Totality.presaleBuy(decrypted.signature, decrypted.nonce, decrypted.tokenQuantity, { value: ethers.utils.parseEther(etherPrice) }),
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
                                  <div style={{ color: "green" }}>
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
                      else {
                        setIsLoading(false);
                        setWhitelistMessage(
                          <div style={{ color: "red" }}>
                            Sorry! You are Not whitelisted!
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
                <Row type="flex" align="middle" style={{ alignItems: 'center', marginTop: "-15vh" }}>
                  <Col span={11}>
                  </Col>
                  <Col span={12}>
                    <img src={require('./scroll.svg')} />
                  </Col>
                </Row>
              </div>
              <div className="section">
                <Row justify="center">
                  <Col sm={20} lg={10} xl={9}>
                    <h2 style={{ fontSize: "5vw" }}>
                      Umbraphile Universe
                    </h2>
                    <p>
                      TOTALITY is a collection of 1,919 uniquely
                      generative Solar Eclipses with <u>3,840,000,000</u> combinations living in the blockchain <br></br> <br></br>

                      Each solar eclipse artwork is generated and
                      animated using R programming <br></br> <br></br>
                    </p>

                    <h2 style={{ fontSize: "2vw" }}>
                      Join our Umbraphile Community
                    </h2>
                    <p>
                      Join our <b>#UMBRAPHILE</b> community to get the latest news and follow our latest announcements. <br></br><br></br>
                      <b>Get whitelisted for our presale now!</b>  <br></br><br></br>
                      <Image className="discordBtn" preview={false} src={require('./discord.png')} />

                    </p>
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
                    <h2 style={{ fontSize: "5vw" }}>
                      FAQ
                    </h2>

                    <h2 style={{ marginBottom: "1rem", marginTop: "3rem" }}>
                    What is Generative Art?
                    </h2>
                    <p className="verticalAlignText">
                      Generative Arts are designs generated, composed, or constructed through computer software algorithms, or similar mathematical, or mechanical autonomous processes. <br></br><br></br>
                      The common forms of generative arts are graphics that visually represents complex processes, music, or language-based compositions like poetry. <br></br><br></br>
                      Other applications include architectural design, models for understanding sciences such as evolution, and artificial intelligence systems.
                    </p>

                    <h2 style={{ marginBottom: "1rem", marginTop: "3rem" }}>
                      What is Totality's design inspiration?
                    </h2>
                    <p className="verticalAlignText">
                      On May 29, 1919, the solar eclipse affirmed the prediction of Einstein’s theory of general relativity,
                      ascribing gravity to a warp in the geometry of space-time, that gravity could bend light beams. <br></br><br></br>

                      Totality art designs consists of stars, solar eclipse, gravitational force, magnetic fields, and many more
                    </p>

                    <h2 style={{ marginBottom: "1rem", marginTop: "3rem" }}>
                      Is Totality a good investment? Listen up diamond hands!
                    </h2>
                    <p className="verticalAlignText">
                      Totality is totally about you. We believe in giving back our Eclipse holders reflection rewards to all Eclipse holders. <br></br><br></br>

                      The more Eclipses you hold, the more rewards will you earn (ETH) for being a supporter of our community!
                    </p>

                    <h2 style={{ marginBottom: "1rem", marginTop: "3rem" }}>
                      Totality's utility
                    </h2>
                    <p className="verticalAlignText">
                      Totality is not just an art project, it is a project that focuses on utility with technical
                      advancements as the project grows, enabling staking, and building of Metaverse. Trust me, I'm a software engineer 👨‍💻
                    </p>

                    <h2 style={{ marginBottom: "1rem", marginTop: "3rem" }}>
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
                    <h2 style={{ fontSize: "5vw" }}>
                      Roadmap v1
                    </h2>
                    <Row style={{ marginBottom: "3rem" }}>
                      <Col span={4}>
                        <Image className="scalable-roadmap-image" preview={false} src={require('./roadmap-25.svg')} />
                      </Col>
                      <Col span={18} style={{ alignSelf: "center" }}>
                        <p className="verticalAlignText">
                          Redistribute 5% reflection rewards to all Eclipse holders
                          <br></br><br></br>
                        </p>
                      </Col>
                    </Row>
                    <Row style={{ marginBottom: "3rem" }}>
                      <Col span={4}>
                        <Image className="scalable-roadmap-image" preview={false} src={require('./roadmap-50.svg')} />
                      </Col>
                      <Col span={18} style={{ alignSelf: "center" }}>
                        <p className="verticalAlignText">
                          Redistribute 10% reflection rewards to all Eclipse holders
                          <br></br><br></br>
                          Chill out in Eclipse Chasers Lo-fi playlist
                        </p>
                      </Col>
                    </Row>
                    <Row style={{ marginBottom: "3rem" }}>
                      <Col span={4}>
                        <Image className="scalable-roadmap-image" preview={false} src={require('./roadmap-75.svg')} />
                      </Col>
                      <Col span={18} style={{ alignSelf: "center" }}>
                        <p className="verticalAlignText">
                          Redistribute 15% reflection rewards to all Eclipse holders
                        </p>
                      </Col>
                    </Row>
                    <Row style={{ marginBottom: "3rem" }}>
                      <Col span={4}>
                        <Image className="scalable-roadmap-image" preview={false} src={require('./roadmap-100.svg')} />
                      </Col>
                      <Col span={18} style={{ alignSelf: "center" }}>
                        <p className="verticalAlignText">
                          Roadmap v2 preparation
                          <br></br><br></br>
                          Commit 20 ETH to treasury Fund for Gen 2 development
                          <br></br><br></br>
                          Collaboraion with artists for Gen 2 Totality NFT
                          <br></br><br></br>
                          Gen 2 Totality NFT utility for Eclipse holders
                          <br></br><br></br>
                          5% of royalties will be redistributed as NFT giveaway
                        </p>
                      </Col>
                    </Row>
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
      <div style={{ position: "absolute", textAlign: "right", right: 0, top: 0, padding: 10 }}>
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
      </div>
    </div>
  );
}

export default App;
