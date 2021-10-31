import WalletConnectProvider from "@walletconnect/web3-provider";
import { Alert, Button, Col, Row, Drawer, Anchor, Image, Input } from "antd";
import "antd/dist/antd.css";
import React, { useCallback, useEffect, useState } from "react";
// import ReactJson from "react-json-view";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import Web3Modal from "web3modal";
import "./App.css";
import { Account, Contract } from "./components";
import { INFURA_ID, NETWORK, NETWORKS } from "./constants";
import { Transactor } from "./helpers";
import {
  useBalance,
  useContractLoader,
  useContractReader,
  useExchangePrice,
  useGasPrice,
  useOnBlock,
  useUserSigner,
} from "./hooks";
import ReactFullpage from "@fullpage/react-fullpage";

// const { BufferList } = require("bl");
// https://www.npmjs.com/package/ipfs-http-client
// const ipfsAPI = require("ipfs-http-client");
// const ipfs = ipfsAPI({ host: "ipfs.infura.io", port: "5001", protocol: "https" });

const { ethers } = require("ethers");
const DemoBox = props => <p className={`height-${props.value}`}>{props.children}</p>;
/*
    Welcome to 🏗 scaffold-eth !

    Code:
    https://github.com/austintgriffith/scaffold-eth

    Support:
    https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA
    or DM @austingriffith on twitter or telegram

    You should get your own Infura.io ID and put it in `constants.js`
    (this is your connection to the main Ethereum network for ENS etc.)


    🌏 EXTERNAL CONTRACTS:
    You can also bring in contract artifacts in `constants.js`
    (and then use the `useExternalContractLoader()` hook!)
*/

/// 📡 What chain are your contracts deployed to?
const targetNetwork = NETWORKS.rinkeby; // <------- select your target frontend network (localhost, rinkeby, xdai, mainnet)

// 😬 Sorry for all the console logging
const DEBUG = true;
const NETWORKCHECK = true;

// EXAMPLE STARTING JSON:
// const STARTING_JSON = {
//   description: "It's actually a bison?",
//   external_url: "https://austingriffith.com/portfolio/paintings/", // <-- this can link to a page for the specific file too
//   image: "https://austingriffith.com/images/paintings/buffalo.jpg",
//   name: "Buffalo",
//   attributes: [
//     {
//       trait_type: "BackgroundColor",
//       value: "green",
//     },
//     {
//       trait_type: "Eyes",
//       value: "googly",
//     },
//   ],
// };

// helper function to "Get" from IPFS
// you usually go content.toString() after this...
// const getFromIPFS = async hashToGet => {
//   for await (const file of ipfs.get(hashToGet)) {
//     console.log(file.path);
//     if (!file.content) continue;
//     const content = new BufferList();
//     for await (const chunk of file.content) {
//       content.append(chunk);
//     }
//     console.log(content);
//     return content;
//   }
// };

// 🛰 providers
if (DEBUG) console.log("📡 Connecting to Mainnet Ethereum");
// const mainnetProvider = getDefaultProvider("mainnet", { infura: INFURA_ID, etherscan: ETHERSCAN_KEY, quorum: 1 });
// const mainnetProvider = new InfuraProvider("mainnet",INFURA_ID);
//
// attempt to connect to our own scaffold eth rpc and if that fails fall back to infura...
// Using StaticJsonRpcProvider as the chainId won't change see https://github.com/ethers-io/ethers.js/issues/901
const scaffoldEthProvider = null && navigator.onLine ? new ethers.providers.StaticJsonRpcProvider("https://rpc.scaffoldeth.io:48544") : null;
const mainnetInfura = navigator.onLine ? new ethers.providers.StaticJsonRpcProvider("https://mainnet.infura.io/v3/" + INFURA_ID) : null;
// ( ⚠️ Getting "failed to meet quorum" errors? Check your INFURA_I

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
  const price = useExchangePrice(targetNetwork, mainnetProvider);

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
  const yourLocalBalance = useBalance(localProvider, address);

  // Just plug in different 🛰 providers to get your balance on different chains:
  const yourMainnetBalance = useBalance(mainnetProvider, address);

  // Load in your local 📝 contract and read a value from it:
  const readContracts = useContractLoader(localProvider);

  // If you want to make 🔐 write transactions to your contracts, use the userSigner:
  const writeContracts = useContractLoader(userSigner, { chainId: localChainId });

  // EXTERNAL CONTRACT EXAMPLE:
  //
  // If you want to bring in the mainnet DAI contract it would look like:
  const mainnetContracts = useContractLoader(mainnetProvider);

  // If you want to call a function on a new block
  useOnBlock(mainnetProvider, () => {
    console.log(`⛓ A new mainnet block is here: ${mainnetProvider._lastBlockNumber}`);
  });

  // Then read your DAI balance like:
  const myMainnetDAIBalance = useContractReader(mainnetContracts, "DAI", "balanceOf", [
    "0x34aA3F359A9D614239015126635CE7732c18fDF3",
  ]);

  // keep track of a variable from the contract in the local React state:
  const balance = useContractReader(readContracts, "Totality", "balanceOf", [address]);
  console.log("🤗 balance:", balance);

  // // 📟 Listen for broadcast events
  // const transferEvents = useEventListener(readContracts, "Totality", "Transfer", localProvider, 1);
  // console.log("📟 Transfer events:", transferEvents);

  //
  // 🧠 This effect will update yourCollectibles by polling when your balance changes
  //
  const yourBalance = balance && balance.toNumber && balance.toNumber();
  console.log("🤗 yourBalance:", yourBalance);

  // const [yourCollectibles, setYourCollectibles] = useState();

  // useEffect(() => {
  //   const updateYourCollectibles = async () => {
  //     const collectibleUpdate = [];
  //     for (let tokenIndex = 0; tokenIndex < balance; tokenIndex++) {
  //       try {
  //         console.log("GEtting token index", tokenIndex);
  //         const tokenId = await readContracts.Totality.tokenOfOwnerByIndex(address, tokenIndex);
  //         console.log("tokenId", tokenId);
  //         const tokenURI = await readContracts.Totality.tokenURI(tokenId);
  //         console.log("tokenURI", tokenURI);

  //         const ipfsHash = tokenURI.replace("https://ipfs.io/ipfs/", "");
  //         console.log("ipfsHash", ipfsHash);

  //         const jsonManifestBuffer = await getFromIPFS(ipfsHash);
  //         const obj = JSON.parse(jsonManifestBuffer.toString())

  //         try {
  //           const jsonManifest = JSON.parse(jsonManifestBuffer.toString());
  //           console.log("jsonManifest", jsonManifest);
  //           collectibleUpdate.push({ id: tokenId, imageWithPath: "https://ipfs.io/ipfs/" + obj.image, owner: address, ...jsonManifest });
  //         } catch (e) {
  //           console.log(e);
  //         }
  //       } catch (e) {
  //         console.log(e);
  //       }
  //     }
  //     setYourCollectibles(collectibleUpdate);
  //   };
  //   updateYourCollectibles();
  // }, [address, yourBalance]);

  /*
  const addressFromENS = useResolveName(mainnetProvider, "austingriffith.eth");
  console.log("🏷 Resolved austingriffith.eth as:",addressFromENS)
  */

  //
  // 🧫 DEBUG 👨🏻‍🔬
  //
  useEffect(() => {
    if (
      DEBUG &&
      mainnetProvider &&
      address &&
      selectedChainId &&
      yourLocalBalance &&
      yourMainnetBalance &&
      readContracts &&
      writeContracts &&
      mainnetContracts
    ) {
      console.log("_____________________________________ 🏗 scaffold-eth _____________________________________");
      console.log("🌎 mainnetProvider", mainnetProvider);
      console.log("🏠 localChainId", localChainId);
      console.log("👩‍💼 selected address:", address);
      console.log("🕵🏻‍♂️ selectedChainId:", selectedChainId);
      console.log("💵 yourLocalBalance", yourLocalBalance ? ethers.utils.formatEther(yourLocalBalance) : "...");
      console.log("💵 yourMainnetBalance", yourMainnetBalance ? ethers.utils.formatEther(yourMainnetBalance) : "...");
      console.log("📝 readContracts", readContracts);
      console.log("🌍 DAI contract on mainnet:", mainnetContracts);
      console.log("💵 yourMainnetDAIBalance", myMainnetDAIBalance);
      console.log("🔐 writeContracts", writeContracts);
    }
  }, [
    mainnetProvider,
    address,
    selectedChainId,
    yourLocalBalance,
    yourMainnetBalance,
    readContracts,
    writeContracts,
    mainnetContracts,
  ]);

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
    console.warn("web3Modal.cachedProvider ", web3Modal.cachedProvider);
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);

  // const [route, setRoute] = useState();
  // useEffect(() => {
  //   setRoute(window.location.pathname);
  // }, [setRoute]);

  let [visible, setMenuToggle] = useState(false);

  const openMenu = (_ => {
    setMenuToggle(true);
  });

  const closeMenu = (_ => {
    setMenuToggle(false);
  });
  const { Link } = Anchor;
  
  const validateWhitelist = async (address, tokenQuantity) => {
    console.warn("address ", address);
    // const requestUrl = "https://api-totality-nft-whitelist.herokuapp.com/check/whitelist/" + address;
    const requestUrl = "http://localhost:4000/check/whitelist/" + address + "/" + tokenQuantity;
    const getData = await fetch(requestUrl)
    let data = await getData.json();
    console.warn("data ", data);
    return data;
  }

  const successfulMint = async (address, tokenQuantity) => {
    console.warn("address ", address);
    // const requestUrl = "https://api-totality-nft-whitelist.herokuapp.com/check/whitelist/" + address;
    const requestUrl = "http://localhost:4000/successful/mint/" + address + "/" + tokenQuantity;
    const getData = await fetch(requestUrl)
    let data = await getData.json();
    console.warn("data ", data);
    return data;
  }

  const failMint = async (address) => {
    console.warn("address ", address);
    // const requestUrl = "https://api-totality-nft-whitelist.herokuapp.com/check/whitelist/" + address;
    const requestUrl = "http://localhost:4000/fail/mint/" + address;
    const getData = await fetch(requestUrl)
    let data = await getData.json();
    console.warn("data ", data);
    return data;
  }

  let [whitelistMessage, setWhitelistMessage] = useState();

  let [tokenQuantity, setTokenQuantity] = useState(1); // default tokenQuantity
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
                      generative Solar Eclipses with 3,840,000,000
                      combinations living in the blockchain <br></br> <br></br>

                      Each solar eclipse artwork is generated and
                      animated using R programming
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
                  </Col>
                </Row>
                <Row justify="center">
                  <Col span={9} xl={9}>
                  </Col>
                  <Col span={10} xl={9.5}>
                    <h2>
                      Minting Coming Soon...
                    </h2>
                  </Col>
                </Row>
              </div>
              <div className="section">
                <Row justify="center">
                  <Col span={19}>
                    <h2 style={{ fontSize: "5vw" }}>
                      FAQ
                    </h2>
                    <h2>
                      What is Totality's design inspiration?
                    </h2>
                    <p style={{ marginBottom: "3rem" }}>
                      On May 29, 1919, the solar eclipse affirmed the prediction of Einstein’s theory of general relativity,
                      ascribing gravity to a warp in the geometry of space-time, that gravity could bend light beams. <br></br><br></br>

                      Totality art designs consists of stars, solar eclipse, gravitational force, magnetic fields, and many more
                    </p>

                    <h2>
                      Is Totality a good investment?
                    </h2>
                    <p style={{ marginBottom: "3rem" }}>
                      Totality is totally about you. We believe in giving back our Eclipse holders redistributed to all Eclipse holders. <br></br><br></br>

                      The more Eclipses you hold, the more rewards will you earn for being a supporter of our community!
                    </p>

                    <h2>
                      Totality's utility
                    </h2>
                    <p style={{ marginBottom: "3rem" }}>
                      Totality is not just an art project, it is a project that focuses on utility with technical
                      advancements as the project grows.
                    </p>

                    <h2>
                      Totality x Aritsts
                    </h2>
                    <p style={{ marginBottom: "3rem" }}>
                      Totality would love to collaborate with other digital artists to enhance our NFT art be it hand-drawn or
                      generative art using AI models. Which would eventually contribute into building a metaverse. <br></br><br></br>

                      Tell us an artist to collaborate with on <a href="">Discord</a>
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
                        <p style={{ marginBottom: "3rem" }}>
                          Redistribute 5% reflection rewards will be redistributed to all Eclipse holders
                          <br></br><br></br>
                        </p>
                      </Col>
                    </Row>
                    <Row style={{ marginBottom: "3rem" }}>
                      <Col span={4}>
                        <Image className="scalable-roadmap-image" preview={false} src={require('./roadmap-50.svg')} />
                      </Col>
                      <Col span={18} style={{ alignSelf: "center" }}>
                        <p style={{ marginBottom: "3rem" }}>
                          Redistribute 10% reflection rewards will be redistributed to all Eclipse holders
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
                        <p style={{ marginBottom: "3rem" }}>
                          Redistribute 15% reflection rewards will be redistributed to all Eclipse holders
                        </p>
                      </Col>
                    </Row>
                    <Row style={{ marginBottom: "3rem" }}>
                      <Col span={4}>
                        <Image className="scalable-roadmap-image" preview={false} src={require('./roadmap-100.svg')} />
                      </Col>
                      <Col span={18} style={{ alignSelf: "center" }}>
                        <p style={{ marginBottom: "3rem" }}>
                          Roadmap v2 preparation
                          <br></br><br></br>
                          Treasury Fund to have 20 ETH for Gen 2 development
                          <br></br><br></br>
                          Work with artists to collab Gen 2 Totality NFT
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
              <div className="section">
                <Row justify="center">
                  <Col span={19}>
                    <h2 style={{ fontSize: "5vw" }}>
                      Join our Umbraphile Community
                    </h2>
                    <Row style={{ marginBottom: "3rem" }}>
                      <Col span={19} style={{ alignSelf: "end" }}>
                        <p style={{ marginBottom: "3rem" }}>
                          Join our <b>#UMBRAPHILE</b> community to get the latest news and follow our latest announcements. <br></br><br></br>
                          Tell us an artist to collaborate with on <a href="">Discord</a>
                        </p>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </div>
            </div>
          </Route>

          <Route path="/debugcontracts">
            <Contract
              name="Totality"
              signer={userSigner}
              provider={localProvider}
              address={address}
              blockExplorer={blockExplorer}
            />
          </Route>
        </Switch>
      </BrowserRouter>

      {/* <ThemeSwitch /> */}

      {/* 👨‍💼 Your account is in the top right with a wallet at connect options */}
      <div style={{ position: "fixed", textAlign: "right", right: 0, top: 0, padding: 10 }}>
        <Account
          address={address}
          localProvider={localProvider}
          userSigner={userSigner}
          mainnetProvider={mainnetProvider}
          price={price}
          web3Modal={web3Modal}
          loadWeb3Modal={loadWeb3Modal}
          logoutOfWeb3Modal={logoutOfWeb3Modal}
          blockExplorer={blockExplorer}
        />
        <div style={{ margin: "auto", marginTop: 32, paddingBottom: 32 }}>
          <div style={{ padding: 32 }}>
          {/* <form action="?" method="POST">
            <div class="g-recaptcha" data-sitekey="6LeK4QMdAAAAANekL14gqheznwSRx7MJ-U_n0TLy"></div>
            <br/>
          </form> */}
            <Input placeholder="Quantity" maxLength={1} defaultValue={tokenQuantity} size="small" onChange={event => {
              console.warn("event ", event.target.value);
              setTokenQuantity(event.target.value)}
            } />
            <Button
              onClick={() => {
                // var v = grecaptcha.getResponse();
                // if(v.length == 0)
                // {
                //   console.error("grecaptcha failed");
                //   return;
                // }
                console.warn("tokenQuantity ", tokenQuantity);
                if(tokenQuantity == 0){

                  console.warn("ENTERED");
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
                  const getValidateWhitelist = async () => {
                    await validateWhitelist(address, tokenQuantity).then(res => {
                      if (res.result === "Whitelisted") {
                        console.warn("MINTING!");
                        const etherPrice = (tokenQuantity * 0.08).toString();
                        console.warn("tokenQuantity ! ", tokenQuantity);
                        console.warn("etherPrice ! ", etherPrice);
                        tx(writeContracts.Totality.presaleBuy(res.signature, res.nonce, res.tokenQuantity, { value: ethers.utils.parseEther(etherPrice) }), 
                        update => {
                          console.warn("📡 Transaction Update:", update);
                          if (update && (update.status !== "confirmed" && update.status !== 1 && update.status !== "sent" && update.status !== "pending")) {
                            console.warn("📡 TX FAILED");
                            failMint(address)
                          } else if (update.status === "confirmed" || update.status === 1){
                            // const balance = useContractReader(readContracts, "Totality", "balanceOf", [address]);
                            // const yourBalance = balance && balance.toNumber && balance.toNumber();
                            // console.warn("yourBalance ", yourBalance);
                            // for (let tokenIndex = 0; tokenIndex < balance; tokenIndex++) {
                            //   const tokenId = readContracts.Totality.tokenOfOwnerByIndex(address, tokenIndex);
                            //   console.warn("tokenId ", tokenId);
                            // }
                            successfulMint(address, res.tokenQuantity).then( res => {
                              setWhitelistMessage(
                                <div style={{ color: "green" }}>
                                  Successfully minted {res.tokenQuantity} tokens!
                                </div>
                              );
                            });
                          }
                        });
                      } 
                      else if( res.result === "pending" ) {
                        setWhitelistMessage(
                          <div>
                            Please wait while we proccess your mint!
                          </div>
                        );
                      }
                      else if( res.result === "Mint exceed limit" ) {
                        setWhitelistMessage(
                          <div style={{ color: "red" }}>
                            You have exceed the presale mint limit of 2
                          </div>
                        );
                      }
                      else {
                        setWhitelistMessage(
                          <div style={{ color: "red" }}>
                            Sorry! You are Not whitelisted!
                          </div>
                        );
                      }
                    });
                  }
                  getValidateWhitelist();
                  //now you can directly use jsonData
                }
              }}
            >
              Mint
            </Button>
            {whitelistMessage}
            {/* {networkDisplay} */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
