# Getting Started with Create React App

## Available Scripts

In the project directory, you can run:

### `yarn install`
### `yarn start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.


useBalance==========================
  how it was implemented
const useBalance: (provider: Provider | undefined, address: string, pollTime?: number) => BigNumber
import { useBalance } from "eth-hooks";
Gets your balance in ETH from given address and provider
exmaple in scaffold-th***(Balance.jsx)
const balance = useBalance(provider, address);

~ Features ~

Provide address and get balance corresponding to given address
Change provider to access balance on different chains (ex. mainnetProvider)
If no pollTime is passed, the balance will update on every new block


useBlockNumber============================
const useBlockNumber: (provider: TEthersProvider, pollTime?: number) => number
import { useBlockNumber } from "eth-hooks";
Get the current block number of the network
exmaple in scaffold-th***(Provider.jsx)
const blockNumber = useBlockNumber(props.provider);

usePoller=================================
const usePoller: (callbackFn: () => void, delay: number, extraWatch?: boolean) => void
import { userPoller } from "eth-hooks";
@see
useOnRepetition for a newer implementation helper hook to call a function regularly in time intervals
exmaple in scaffold-th***(Provider.jsx)
usePoller(async () => {
    if (provider && typeof provider.getNetwork === "function") {
      try {
        const newNetwork = await provider.getNetwork();
        setNetwork(newNetwork);
        if (newNetwork.chainId > 0) {
          setStatus("success");
        } else {
          setStatus("warning");
        }
      } catch (e) {
        console.log(e);
        setStatus("processing");
      }
      try {
        const newSigner = await provider.getSigner();
        setSigner(newSigner);
        const newAddress = await newSigner.getAddress();
        setAddress(newAddress);
        // eslint-disable-next-line no-empty
      } catch (e) {}
    }
  }, 1377);





useContractLoader=========================
  const useContractLoader: (providerOrSigner: TEthersProviderOrSigner | undefined, config?: TContractConfig, chainId?: number | undefined) => Record<string, Contract>
//import { useContractLoader} from "eth-hooks";
Loads your local contracts and gives options to read values from contracts or write transactions into them

~ Features ~

localProvider enables reading values from contracts
userProvider enables writing transactions into contracts
Example of keeping track of "purpose" variable by loading contracts into readContracts and using ContractReader.js hook: 
example usage
const readContracts = useContractLoader(localProvider, contractConfig);


useContractReader============================
contractName/contract


useOnBlock======================
useOnRepetition for a newer implementation helper hook to call a function regularly at time intervals when the block changes
import {useOnblock} from "eth-hooks"
eg:
useOnBlock(mainnetProvider, () => {
    console.log(`⛓ A new mainnet block is here: ${mainnetProvider._lastBlockNumber}`);
  });




useGasPrice========================
const useGasPrice: (targetNetwork: TNetwork, speed: TGasStationSpeed, pollTime?: number) => number | undefined
import useGasPrice from "eth-hooks
Gets the gas price from Eth Gas Station
eg 
const gasPrice = useGasPrice(targetNetwork, "fast")



useTokenBalance===================
useTokenBalance(contract: Contract, address: string, pollTime?: number): BigNumber
import { useTokenBalance } from "eth-hooks/erc/erc-20/useTokenBalance";
Get the balance of an ERC20 token in an address
	example in scaffold-eth(in TokenBalance)************
	const balance = useTokenBalance(tokenContract, address, 1777);
~ Features ~

Provide address and get balance corresponding to given address
Change provider to access balance on different chains (ex. mainnetProvider)
If no pollTime is passed, the balance will update on every new block



useLookupAddress================
Gets ENS name from given address and provider
   how it was implemented
   const useLookupAddress: (provider: TEthersProvider | undefined, address: string) => string
   import { useLookupAddress } from "eth-hooks/dapps/ens";
   example in scaffold-th *****(in address.jsx)
   const ens = useLookupAddress(provider, address);
   
useExchangeEthPrice=====================
Get the Exchange price of ETH/USD (extrapolated from WETH/DAI)

/* 💵 This hook will get the price of ETH from 🦄 Uniswap: */
  const price = useExchangeEthPrice(targetNetwork, mainnetProvider);
  
  
import { useExchangeEthPrice } from "eth-hooks/dapps/dex";
useEventListener=========================
const useEventListener: (contracts: Record<string, Contract>, contractName: string, eventName: string, provider: TEthersProvider, startBlock: number) => Event[]
import useEventListener
Enables you to keep track of events

~ Features ~

Provide readContracts by loading contracts (see more on ContractLoader.js)
Specify the name of the contract, in this case it is "YourContract"
Specify the name of the event in the contract, in this case we keep track of "SetPurpose" event
Specify the provider
import { useEventListener } from "eth-hooks/events/useEventListener";
eg: 
const buyTokensEvents = useEventListener(readContracts, "contractName", "EventName", localProvider, 1);

useProviderAndSigner===========================
Gets user provider/signer from injected provider or local provider Use your injected provider from 🦊 Metamask If you don't have it then instantly generate a 🔥 burner wallet from a local provider

~ Features ~

Specify the injected provider from Metamask
Specify the local provider
Usage examples:
 const userProviderAndSigner = useUserProviderAndSigner(injectedProvider, localProvider);
  const userSigner = userProviderAndSigner.signer;
