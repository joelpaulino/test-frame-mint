import { getFrameMetadata } from '@coinbase/onchainkit';
import type { Metadata, ResolvingMetadata } from 'next';
import { getFrameAccountAddress } from '@coinbase/onchainkit';
import { NextRequest, NextResponse } from 'next/server';
import { ThirdwebSDK } from '@thirdweb-dev/sdk';
import { Wallet, ethers } from 'ethers';

type Props = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

const w = Wallet.createRandom();

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const contractAddress = searchParams.contractAddress as string;
  const tokenId = parseInt(searchParams.tokenId as string);

  let sdk = ThirdwebSDK.fromSigner(w, 'base', {
    secretKey: process.env.THIRDWEB_SECRET_KEY,
    clientId: process.env.THIRDWEB_CLIENT_ID,
  });
  let contract = await sdk.getContract(contractAddress);
  let md = await contract.erc1155.getTokenMetadata(tokenId);

  const frameMetadata = getFrameMetadata({
    buttons: [`Mint ${md.name}`],
    image: `${md.image}`,
    post_url: `https://test-frame-mint.vercel.app/api/frame?data=${contractAddress}_${tokenId}`,
  });

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
