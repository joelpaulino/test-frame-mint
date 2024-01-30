import { getFrameAccountAddress } from '@coinbase/onchainkit';
import { NextRequest, NextResponse } from 'next/server';
import { ThirdwebSDK } from '@thirdweb-dev/sdk';
import { Wallet, ethers } from 'ethers';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';

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

  //sdk.updateSignerOrProvider(w);
  let sdk = ThirdwebSDK.fromSigner(w, 'base', {
    secretKey: process.env.THIRDWEB_SECRET_KEY,
    clientId: process.env.THIRDWEB_CLIENT_ID,
  });
  let contract = await sdk.getContract('0x6F45df69821667E38CBc5A249ABa11df12c73645');
  let md = await contract.erc1155.getTokenMetadata(0);
  let tx = await contract.erc1155.claimTo.prepare(accountAddress as string, 0, 1);

  const cc = await contract.erc1155.claimConditions.prepareClaim(
    0,
    1,
    false,
    accountAddress as string,
  );

  const priceWei = cc.price;
  const priceEther = ethers.utils.formatEther(priceWei);
  console.log('price:', cc.price);
  let encoded = tx.encode();
  console.log('encoded:', encoded);
  if (accountAddress === undefined) {
    return new NextResponse(`<!DOCTYPE html><html><head>
    <meta property="fc:frame" content="vNext" />
    <meta property="og:image" content=${md.image}/>
    <meta property="fc:frame:button:1" content="Need Address To Mint" />
  </head></html>`);
  }
  let random = Math.random().toString();
  return new NextResponse(`<!DOCTYPE html><html><head>
    <meta property="fc:frame" content="vNext" />
    <meta property="og:image" content=${md.image}/>
    <meta property="fc:frame:button:1" content="Cant Drop! Try Wallet" />
    <meta property="fc:frame:post_url" content="https://test-frame-mint.vercel.app/api/frame" />
    <meta property="cb:tx" content="to:0x6F45df69821667E38CBc5A249ABa11df12c73645,data:${encoded},value:${priceEther}" />
  </head></html>`);
}

const client = new NeynarAPIClient(process.env.NEYNAR_API_KEY as string);

// read more about signers:
// https://docs.neynar.com/docs/write-to-farcaster-with-neynar-managed-signers
const signerUUID = process.env.SIGNER_UUID as string;

async function recast(contractAddress: string, tokenId: number): Promise<boolean> {
  const frame =
    'https://test-frame-mint.vercel.app?contractAddress=' + contractAddress + '&tokenId=' + tokenId;
  const result = await client.publishCast(signerUUID, frame);
  return true;
}

export async function POST(req: NextRequest): Promise<Response> {
  //return getResponse(req);
  const body = await req.json();
  console.log('body:', body);
  if (body.data.text) {
    let split = body.data.text.split(':');
    console.log('split:', split);
    await recast(split[0], parseInt(split[1]));
  }

  return new NextResponse(null);
  //use neynar bot to create frame cast for me
}
/*
{
  "created_at": 1706588724,
  "type": "cast.created",
  "data": {
    "object": "cast",
    "hash": "0xf6b497ac265c4c74179e71089112ad0c0b4f1262",
    "thread_hash": "0xf6b497ac265c4c74179e71089112ad0c0b4f1262",
    "parent_hash": null,
    "parent_url": "https://onchainsummer.xyz",
    "root_parent_url": "https://onchainsummer.xyz",
    "parent_author": {
      "fid": null
    },
    "author": {
      "object": "user",
      "fid": 238505,
      "custody_address": "0x2d1d3dafcea725e7c398adc7ef984dded28cf728",
      "username": "alka-horra",
      "display_name": "Alka",
      "pfp_url": "https://i.imgur.com/6YIztQW.jpg",
      "profile": {
        "bio": {
          "text": "Web3 enthusiast",
          "mentioned_profiles": []
        }
      },
      "follower_count": 4,
      "following_count": 66,
      "verifications": [
        "0x4c64c7dc4fc7ba5b89fad3aebc68892bfc1b67d5"
      ],
      "active_status": "inactive"
    },
    "text": "good for health bad for education",
    "timestamp": "2024-01-30T04:25:24.000Z",
    "embeds": [],
    "reactions": {
      "likes": [],
      "recasts": []
    },
    "replies": {
      "count": 0
    },
    "mentioned_profiles": []
  }
}*/
