import { getFrameAccountAddress } from '@coinbase/onchainkit';
import { NextRequest, NextResponse } from 'next/server';
import { ThirdwebSDK } from '@thirdweb-dev/sdk';
import { Wallet, ethers } from 'ethers';

async function getResponse(req: NextRequest): Promise<NextResponse> {
  const w = Wallet.createRandom();
  // const data = req.nextUrl.searchParams.get('data');
  // const sdata = data?.split('_');
  const contractAddress = `0x6F45df69821667E38CBc5A249ABa11df12c73645`; //sdata?.[0];
  const tokenId = 0; //parseInt(sdata?.[1] as string | '0', 10);

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

  let sdk = ThirdwebSDK.fromSigner(w, 'base', {
    secretKey: process.env.THIRDWEB_SECRET_KEY,
    clientId: process.env.THIRDWEB_CLIENT_ID,
  });

  let contract = await sdk.getContract(contractAddress as string, 'edition-drop');
  let txP = await contract.erc1155.claimTo.prepare(accountAddress as string, 0, 1);
  let mdP = await contract.erc1155.getTokenMetadata(tokenId);
  const ccP = await contract.erc1155.claimConditions.prepareClaim(
    tokenId,
    1,
    false,
    accountAddress as string,
  );
  const feeDataP = sdk.getProvider().getFeeData();
  const [md, tx, cc, feeData] = await Promise.all([mdP, txP, ccP, feeDataP]);
  const priceWei = cc.price;
  // tx.updateOverrides({ from: accountAddress });
  let gasLimit = 350_000; //TODO: this isnt working as expected await tx.estimateGasLimit();
  const priceEther = ethers.utils.formatEther(priceWei);
  let encoded = tx.encode();

  // Uncomment to test submitting on-chain
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
    <meta name="fc:frame" content="vNext" />  
    <meta name="fc:frame:image" content="${md.image}"/>
    <meta name="fc:frame:button:1" content="Need Address To Pop" />
  </head></html>`);
  }
  let random = Math.random().toString();
  return new NextResponse(`<!DOCTYPE html><html><head>
    <meta name="fc:frame" content="vNext" />
    <meta name="fc:frame:image" content="${md.image}"/>
    <meta name="fc:frame:button:1" content="Sorry, Cant Drop" />
    <meta property="cb:tx" content="to:${contractAddress},data:${encoded},value:${priceEther},gasLimit:${gasLimit},baseFeePerGas:${feeData.lastBaseFeePerGas},maxFeePerGas:${feeData.maxFeePerGas},gasPrice:${feeData.gasPrice},maxPriorityFeePerGas:${feeData.maxPriorityFeePerGas}" />
  </head></html>`);
}

export async function POST(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

export const dynamic = 'force-dynamic';
