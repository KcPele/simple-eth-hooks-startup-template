import Portis from "@portis/web3";
import WalletConnectProvider from "@walletconnect/web3-provider";
import "antd/dist/antd.css";
import Authereum from "authereum";
import {
  useBalance,
  useContractLoader,
  useContractReader,
  useGasPrice,
  useOnBlock,
  useUserProviderAndSigner,
} from "eth-hooks";
import { useExchangeEthPrice } from "eth-hooks/dapps/dex";
import { useEventListener } from "eth-hooks/events/useEventListener";
import Fortmatic from "fortmatic";
import React, { useCallback, useEffect, useState } from "react";

import WalletLink from "walletlink";
import Web3Modal from "web3modal";
import "./App.css";
import { INFURA_ID, NETWORK, NETWORKS } from "./constants";
import { Notifier} from "./helpers";
import { Account, Balance, Wallet, Blockie, Address, AddressInput, EtherInput } from './components'
// contracts
import externalContracts from "./contracts/external_contracts";
import deployedContracts from "./contracts/hardhat_contracts.json";
const { ethers } = require("ethers");

/// 📡 What chain are your contracts deployed to?
// if u are using a deffrent nextwork also change the "4" to the chainId, name: "rinkeby" and chainId: "4" to the network you are using in hardhat_contract.json
const targetNetwork = NETWORKS.rinkeby // <------- select your target frontend network (localhost, rinkeby, xdai, mainnet)


const poktMainnetProvider = navigator.onLine
  ? new ethers.providers.StaticJsonRpcProvider(
      "https://eth-mainnet.gateway.pokt.network/v1/lb/611156b4a585a20035148406",
    )
  : null;
const mainnetInfura = navigator.onLine
  ? new ethers.providers.StaticJsonRpcProvider("https://mainnet.infura.io/v3/" + INFURA_ID)
  : null;
// ( ⚠️ Getting "failed to meet quorum" errors? Check your INFURA_ID

// 🏠 Your local provider is usually pointed at your local blockchain
const localProviderUrl = targetNetwork.rpcUrl;
// as you deploy to other networks you can set REACT_APP_PROVIDER=https://dai.poa.network in packages/react-app/.env
const localProviderUrlFromEnv = process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : localProviderUrl;
const localProvider = new ethers.providers.StaticJsonRpcProvider(localProviderUrlFromEnv);

// 🔭 block explorer URL
const blockExplorer = targetNetwork.blockExplorer;

// Coinbase walletLink init
const walletLink = new WalletLink({
  appName: "coinbase",
});

// WalletLink provider
const walletLinkProvider = walletLink.makeWeb3Provider(`https://mainnet.infura.io/v3/${INFURA_ID}`, 1);

// Portis ID: 6255fb2b-58c8-433b-a2c9-62098c05ddc9
/*
  Web3 modal helps us "connect" external wallets:
*/
const web3Modal = new Web3Modal({
  network: "mainnet", // Optional. If using WalletConnect on xDai, change network to "xdai" and add RPC info below for xDai chain.
  cacheProvider: true, // optional
  theme: "light", // optional. Change to "dark" for a dark theme.
  providerOptions: {
    walletconnect: {
      package: WalletConnectProvider, // required
      options: {
        bridge: "https://polygon.bridge.walletconnect.org",
        infuraId: INFURA_ID,
        rpc: {
          1: `https://mainnet.infura.io/v3/${INFURA_ID}`, // mainnet // For more WalletConnect providers: https://docs.walletconnect.org/quick-start/dapps/web3-provider#required
          42: `https://kovan.infura.io/v3/${INFURA_ID}`,
          100: "https://dai.poa.network", // xDai
        },
      },
    },
    portis: {
      display: {
        logo: "https://user-images.githubusercontent.com/9419140/128913641-d025bc0c-e059-42de-a57b-422f196867ce.png",
        name: "Portis",
        description: "Connect to Portis App",
      },
      package: Portis,
      options: {
        id: "6255fb2b-58c8-433b-a2c9-62098c05ddc9",
      },
    },
    fortmatic: {
      package: Fortmatic, // required
      options: {
        key: "pk_live_5A7C91B2FC585A17", // required
      },
    },
    // torus: {
    //   package: Torus,
    //   options: {
    //     networkParams: {
    //       host: "https://localhost:8545", // optional
    //       chainId: 1337, // optional
    //       networkId: 1337 // optional
    //     },
    //     config: {
    //       buildEnv: "development" // optional
    //     },
    //   },
    // },
    "custom-walletlink": {
      display: {
        logo: "https://play-lh.googleusercontent.com/PjoJoG27miSglVBXoXrxBSLveV6e3EeBPpNY55aiUUBM9Q1RCETKCOqdOkX2ZydqVf0",
        name: "Coinbase",
        description: "Connect to Coinbase Wallet (not Coinbase App)",
      },
      package: walletLinkProvider,
      connector: async (provider, _options) => {
        await provider.enable();
        return provider;
      },
    },
    authereum: {
      package: Authereum, // required
    },
  },
});

function App() {

  // this section sets your provider ============================
  const mainnetProvider =
    poktMainnetProvider && poktMainnetProvider._isProvider
      ? poktMainnetProvider
      : mainnetInfura;

  const [injectedProvider, setInjectedProvider] = useState();
  const [address, setAddress] = useState();

//  can be called on your logout button 
  const logoutOfWeb3Modal = async () => {
    await web3Modal.clearCachedProvider();
    if (injectedProvider && injectedProvider.provider && typeof injectedProvider.provider.disconnect == "function") {
      await injectedProvider.provider.disconnect();
    }
    setTimeout(() => {
      window.location.reload();
    }, 1);
  };

  /* 💵 This hook will get the price of ETH from 🦄 Uniswap: */
  const price = useExchangeEthPrice(targetNetwork, mainnetProvider);

  /* 🔥 This hook will get the price of Gas from ⛽️ EtherGasStation */
  const gasPrice = useGasPrice(targetNetwork, "fast");
  // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
  const userProviderAndSigner = useUserProviderAndSigner(injectedProvider, localProvider);
  const userSigner = userProviderAndSigner.signer;

  useEffect(() => {
    async function getAddress() {
      if (userSigner) {
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

  // The Notifier wraps transactions and provides notificiations
  const tx = Notifier(userSigner, gasPrice);
  

  const yourLocalBalance = useBalance(localProvider, address);

  // Just plug in different 🛰 providers to get your balance on different chains:
  const yourMainnetBalance = useBalance(mainnetProvider, address);

  const contractConfig = {deployedContracts: deployedContracts || {},  externalContracts: externalContracts || {},  };


  // Load in your local 📝 contract and read a value from it:
  const readContracts = useContractLoader(localProvider, contractConfig);

  // If you want to make 🔐 write transactions to your contracts, use the userSigner:
  const writeContracts = useContractLoader(userSigner, contractConfig, localChainId);

  // EXTERNAL CONTRACT EXAMPLE:
  //
  // If you want to bring in the mainnet DAI contract it would look like:
  const mainnetContracts = useContractLoader(mainnetProvider, contractConfig);

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
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);

  // events that are emited from the smart contract
  //to get the contract address
  const storageAddress =
    readContracts && readContracts.Storage && readContracts.Storage.address;

  const storageETHBalance = useBalance(localProvider, storageAddress);


  //useContractReader it is use to read a function or any value that is not writing to the smart contract
  // const anyName = useContractReader(readContract, "ContractName", "function name in smart contract", [if it accepts any args])
  const retrieveNumber = useContractReader(
    readContracts,
    "Storage",
    "retrieveNumber"
  )
  const retrieveValue = useContractReader(
    readContracts,
    "Storage",
    "retrieveValue"
  );
  
  const retrieveBalance = useContractReader(
    readContracts,
    "Storage",
    "retrieveBalance"
  );

  //constantly listing to event emited in the contract
  const storeNumberEvents = useEventListener(
    readContracts,
    "Storage",
    "StoreNumber",
    localProvider,
    1
  );
  
  const storeValueEvents = useEventListener(
    readContracts,
    "Storage",
    "StoreValue",
    localProvider,
    1
  );

  const [num, setNum] = useState(0);
  const [val, setVal] = useState("");

  const handleStoreNumber = async (e) => {
    e.preventDefault();
    console.log(num);
    // console.log(mainnetContracts)
     // to write to your contract 
     await tx(writeContracts.Storage.storeNumber(num),);
     setNum(0)
    console.log("📟 storeValueEvents:", storeNumberEvents);
    
  };
  const getStoredNumber = () => {
    console.log(retrieveNumber);
  };
  const handleStoreValue = async (e) => {
    e.preventDefault();
    
    // to write to your contract 
    await tx(writeContracts.Storage.storeValue(val));
    setVal("")
    console.log("📟 storeValueEvents:", storeValueEvents);
  };
  const getStoredValue = () => {
    console.log(retrieveValue);
  };
  const getContractBalance = () => {
    console.log("blance");
    console.log("retrieve   Balance", retrieveBalance);
    console.log("storage balance", storageETHBalance);
  };
  
  return (
    <div className="App">
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

      <h2>Start up</h2>
      <button onClick={getContractBalance}>Contract Balance</button>
      <hr />
      <button onClick={getStoredNumber}>Get Stored Number</button>
      <p>The stored number is {retrieveNumber && retrieveNumber.toNumber()}</p>
      <form onSubmit={handleStoreNumber}>
        <input
          type="number"
          value={num}
          onChange={(e) => setNum(e.target.value)}
        />
        <button type="submit">Store Number</button>
      </form>
      <hr />
      <div>
        <p>Value: {retrieveValue}</p>
        <button onClick={getStoredValue}>Get Stored Number</button>
        <form onSubmit={handleStoreValue}>
          <input
            type="text"
            value={val}
            onChange={(e) => setVal(e.target.value)}
          />
          <button type="submit">Store value</button>
        </form>
      </div>
      <div>
     
      </div>
    </div>
  );
}

export default App;
