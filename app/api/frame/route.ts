import { getFrameAccountAddress } from '@coinbase/onchainkit';
import { NextRequest, NextResponse } from 'next/server';
import { ThirdwebSDK } from '@thirdweb-dev/sdk';
import { Wallet, ethers } from 'ethers';

async function getResponse(req: NextRequest): Promise<NextResponse> {
  const w = Wallet.createRandom();
  const data = req.nextUrl.searchParams.get('data');
  const sdata = data?.split('_');
  const contractAddress = sdata?.[0];
  const tokenId = parseInt(sdata?.[1] as string | '0', 10);

  console.log('get address');

  let accountAddress: string | undefined = '';

  try {
    const body = await req.json();
    if (body.hasOwnProperty('address')) {
      accountAddress = body.address as string;
    } else {
      let fcBody: { trustedData?: { messageBytes?: string } } = body;
      accountAddress = await getFrameAccountAddress(fcBody, { NEYNAR_API_KEY: 'NEYNAR_API_DOCS' });
    }
  } catch (err) {
    console.error(err);
  }
  console.log(accountAddress);

  let sdk = ThirdwebSDK.fromSigner(w, 'base', {
    secretKey: process.env.THIRDWEB_SECRET_KEY,
    clientId: process.env.THIRDWEB_CLIENT_ID,
  });
  let contract = await sdk.getContract(contractAddress as string);
  let md = await contract.erc1155.getTokenMetadata(tokenId);
  let tx = await contract.erc1155.claimTo.prepare(accountAddress as string, 0, 1);

  const cc = await contract.erc1155.claimConditions.prepareClaim(
    tokenId,
    1,
    false,
    accountAddress as string,
  );

  const priceWei = cc.price;
  const priceEther = ethers.utils.formatEther(priceWei);
  console.log('price:', cc.price);
  let encoded = tx.encode();
  console.log('encoded:', encoded);

  // const provider = new ethers.providers.JsonRpcProvider(`https://mainnet.base.org`);
  // const signer = new ethers.Wallet(process.env.PK as string, provider);
  // console.log('loaded:', signer.address);
  // const txx = await signer.sendTransaction({
  //   to: contractAddress,
  //   value: ethers.utils.parseUnits(priceEther, 'ether'),
  //   data: tx.encode(),
  // });
  // console.log(txx);

  if (accountAddress === undefined) {
    return new NextResponse(`<!DOCTYPE html><html><head>
    <meta property="fc:frame" content="vNext" />  
    <meta property="fc:frame:button:1" content="Need Address To Pop" />
  </head></html>`);
  }
  let random = Math.random().toString();
  return new NextResponse(`<!DOCTYPE html><html><head>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:button:1" content="Cant Drop ${accountAddress}! Try a Wallet" />
    <meta property="fc:frame:post_url" content="https://test-frame-mint.vercel.app/api/frame?data=${contractAddress}_${tokenId}" />
    <meta property="cb:tx" content="to:0x6F45df69821667E38CBc5A249ABa11df12c73645,data:${encoded},value:${priceEther}" />
  </head></html>`);
}

export async function POST(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

export const dynamic = 'force-dynamic';
