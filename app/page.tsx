import { getFrameMetadata } from '@coinbase/onchainkit';
import type { Metadata, ResolvingMetadata } from 'next';
import { getFrameAccountAddress } from '@coinbase/onchainkit';
import { NextRequest, NextResponse } from 'next/server';
import { ThirdwebSDK } from '@thirdweb-dev/sdk';
import { Wallet, ethers } from 'ethers';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';

type Props = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};
const provider = new ethers.providers.JsonRpcProvider(`https://mainnet.base.org`);
const w = Wallet.createRandom();
const signer = w.connect(provider);
const client = new NeynarAPIClient(process.env.NEYNAR_API_KEY as string);

// read more about signers:
// https://docs.neynar.com/docs/write-to-farcaster-with-neynar-managed-signers
const signerUUID = process.env.SIGNER_UUID as string;

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const contractAddress = `0x6F45df69821667E38CBc5A249ABa11df12c73645`; //searchParams.contractAddress as string;
  const tokenId = 0; //parseInt(searchParams.tokenId as string);

  let sdk = ThirdwebSDK.fromSigner(w, 'base', {
    secretKey: process.env.THIRDWEB_SECRET_KEY,
    clientId: process.env.THIRDWEB_CLIENT_ID,
  });
  console.log(new Date().toISOString());
  let contract = await sdk.getContract(contractAddress, 'edition-drop');
  console.log(new Date().toISOString());
  let md = await contract.erc1155.getTokenMetadata(tokenId);
  console.log(new Date().toISOString());
  const frameMetadata = getFrameMetadata({
    buttons: [`Mint ${md.name}`],
    image: `${md.image}`,
    post_url: `https://test-frame-mint.vercel.app/api/frame`,
  });
  const USDC_ON_BASE = `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`;
  const usdc = new ethers.Contract(
    USDC_ON_BASE,
    [
      {
        constant: false,
        inputs: [
          {
            name: '_to',
            type: 'address',
          },
          {
            name: '_value',
            type: 'uint256',
          },
        ],
        name: 'transfer',
        outputs: [
          {
            name: '',
            type: 'bool',
          },
        ],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
    ],
    signer,
  );
  const tx = await usdc.populateTransaction.transfer(
    `0x4C64C7dC4fc7ba5B89fAd3AEbC68892bFC1B67d5`,
    1_000_000,
  );
  const feeData = await signer.getFeeData();
  const gasLimit = 200_000; //TODO: estimate gas
  const _metadata: Metadata = {
    title: 'Mint',
    description: md.description,
    openGraph: {
      title: `Mint ${md.name}`,
      description: (md.description as string) || '',
      images: [md.image as string],
    },
    other: {
      ...frameMetadata,
      ...{
        'cb:tx': `to:${contractAddress},data:${tx.data},gasLimit:${gasLimit},baseFeePerGas:${feeData.lastBaseFeePerGas},maxFeePerGas:${feeData.maxFeePerGas},gasPrice:${feeData.gasPrice},maxPriorityFeePerGas:${feeData.maxPriorityFeePerGas}`,
      },
    },
  };

  return _metadata;
}

export default function Page({ params, searchParams }: Props) {
  console.log(searchParams);
  return (
    <>
      <h1>https://test-frame-mint.vercel.app/</h1>
    </>
  );
}
