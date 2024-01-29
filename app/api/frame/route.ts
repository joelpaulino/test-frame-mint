import { getFrameAccountAddress } from '@coinbase/onchainkit';
import { NextRequest, NextResponse } from 'next/server';
import { ThirdwebSDK } from '@thirdweb-dev/sdk';
import { Wallet, ethers } from 'ethers';

// let sdk = new ThirdwebSDK('base', {
//   secretKey: process.env.THIRDWEB_SECRET_KEY,
// });
const w = Wallet.createRandom();
async function getResponse(req: NextRequest): Promise<NextResponse> {
  //console.log("random wallet:",w.address);
  // let sdk = ThirdwebSDK.fromSigner(w, 'base');
  // let contract = await sdk.getContract('0x6F45df69821667E38CBc5A249ABa11df12c73645');
  // let tx = await contract.erc1155.claimTo.prepare(`0xa14a25930babc1220df002070be86b030b1d4c68` as string, 0, 1);
  // let encoded = tx.encode();
  // const provider = new ethers.providers.JsonRpcProvider(`https://mainnet.base.org`);
  // const signer = new ethers.Wallet(
  //   process.env.PK as string,
  //   provider,
  // );
  // console.log('loaded:', signer.address);
  // const txx = await signer.sendTransaction({
  //   to: '0x6F45df69821667E38CBc5A249ABa11df12c73645',
  //   value: ethers.utils.parseUnits('0.0001', 'ether'),
  //   data: tx.encode(),
  // });
  // console.log(txx);

  console.log('get address');
  let accountAddress: string | undefined = '';
  try {
    const body: { trustedData?: { messageBytes?: string } } = await req.json();
    accountAddress = await getFrameAccountAddress(body, { NEYNAR_API_KEY: 'NEYNAR_API_DOCS' });
  } catch (err) {
    console.error(err);
  }
  console.log(accountAddress);

  //sdk.updateSignerOrProvider(w);
  let sdk = ThirdwebSDK.fromSigner(w, 'base', { secretKey: process.env.THIRDWEB_SECRET_KEY });
  let contract = await sdk.getContract('0x6F45df69821667E38CBc5A249ABa11df12c73645');
  let tx = await contract.erc1155.claimTo.prepare(accountAddress as string, 0, 1);
  let encoded = tx.encode();

  let random = Math.random().toString();
  return new NextResponse(`<!DOCTYPE html><html><head>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:button:1" content="${random}" />
    <meta property="fc:frame:post_url" content="https://test-frame-mint.vercel.app/api/frame" />
    <meta property="cb:tx" content="to:0x6F45df69821667E38CBc5A249ABa11df12c73645,data:${encoded}" />
  </head></html>`);
}

export async function POST(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

export const dynamic = 'force-dynamic';
