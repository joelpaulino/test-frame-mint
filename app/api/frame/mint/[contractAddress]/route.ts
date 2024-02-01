import { getFrameAccountAddress, getFrameValidatedMessage } from '@coinbase/onchainkit';
import { NextRequest, NextResponse } from 'next/server';
import { ThirdwebSDK } from '@thirdweb-dev/sdk';
import { Wallet, ethers } from 'ethers';

//TODO: we should generate this once by reading a erc1155 uri() function for all tokenIds and following paths to IPFS
const TokenMetaData = [
  {
    name: 'RedBlue',
    description: '',
    image: 'ipfs://QmTF4DPLNPzTKK7916dobictZmdLSWG5jrTW6Wd5ctHNxe/0.jpg',
    external_url: '',
    background_color: '',
    customImage: '',
    customAnimationUrl: '',
    gatewayImage:
      process.env.IPFS_PUBLIC_GATEWAY +
      '/ipfs/QmTF4DPLNPzTKK7916dobictZmdLSWG5jrTW6Wd5ctHNxe/0.jpg',
  },
  {
    name: 'RedPill',
    description: '',
    image: 'ipfs://QmdwDgH84CgEFyNrNM2ras7BxiV6SFwUpCGYsJZn6RYaUh/1.png',
    external_url: '',
    background_color: '',
    customImage: '',
    customAnimationUrl: '',
    gatewayImage:
      process.env.IPFS_PUBLIC_GATEWAY +
      '/ipfs/QmdwDgH84CgEFyNrNM2ras7BxiV6SFwUpCGYsJZn6RYaUh/1.png',
  },
  {
    name: 'BluePill',
    description: '',
    image: 'ipfs://QmRXzPiFGZwSR8VF9swjB8T1yt2qmknDiR33SQt9FniW3d/2.png',
    external_url: '',
    background_color: '',
    customImage: '',
    customAnimationUrl: '',
    gatewayImage:
      process.env.IPFS_PUBLIC_GATEWAY +
      '/ipfs/QmRXzPiFGZwSR8VF9swjB8T1yt2qmknDiR33SQt9FniW3d/2.png',
  },
];

const ABI = [
  {
    inputs: [
      {
        internalType: 'address[]',
        name: 'accounts',
        type: 'address[]',
      },
      {
        internalType: 'uint256[]',
        name: 'ids',
        type: 'uint256[]',
      },
    ],
    name: 'balanceOfBatch',
    outputs: [
      {
        internalType: 'uint256[]',
        name: '',
        type: 'uint256[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_receiver',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: '_tokenId',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '_quantity',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: '_currency',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: '_pricePerToken',
        type: 'uint256',
      },
      {
        components: [
          {
            internalType: 'bytes32[]',
            name: 'proof',
            type: 'bytes32[]',
          },
          {
            internalType: 'uint256',
            name: 'quantityLimitPerWallet',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'pricePerToken',
            type: 'uint256',
          },
          {
            internalType: 'address',
            name: 'currency',
            type: 'address',
          },
        ],
        internalType: 'struct IDrop1155.AllowlistProof',
        name: '_allowlistProof',
        type: 'tuple',
      },
      {
        internalType: 'bytes',
        name: '_data',
        type: 'bytes',
      },
    ],
    name: 'claim',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_tokenId',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '_conditionId',
        type: 'uint256',
      },
    ],
    name: 'getClaimConditionById',
    outputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'startTimestamp',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'maxClaimableSupply',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'supplyClaimed',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'quantityLimitPerWallet',
            type: 'uint256',
          },
          {
            internalType: 'bytes32',
            name: 'merkleRoot',
            type: 'bytes32',
          },
          {
            internalType: 'uint256',
            name: 'pricePerToken',
            type: 'uint256',
          },
          {
            internalType: 'address',
            name: 'currency',
            type: 'address',
          },
          {
            internalType: 'string',
            name: 'metadata',
            type: 'string',
          },
        ],
        internalType: 'struct IClaimCondition.ClaimCondition',
        name: 'condition',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];

export async function POST(
  req: NextRequest,
  { params }: { params: { contractAddress: string } },
): Promise<Response> {
  const body = await req.json();

  console.log('body:', body);
  const userAddress = await getUserAddress(body);
  const tokenId = await getButtonIndex(body);
  if (!userAddress) {
    return new NextResponse(`<!DOCTYPE html><html><head>
    <meta property="fc:frame" content="vNext" />
    <meta property="og:image" content=${TokenMetaData[parseInt(tokenId)].gatewayImage}/>
    <meta property="fc:frame:button:1" content="No Address Found" />
  </head></html>`);
  }
  //TODO:If not using coinbase format then display invalid client

  //check if user has balance of the NFT
  const w = Wallet.createRandom();
  const provider = new ethers.providers.JsonRpcProvider(`https://mainnet.base.org`);
  const signer = w.connect(provider);
  const nft = new ethers.Contract(params.contractAddress, ABI, signer);

  const [
    startTimestamp,
    maxClaimableSupply,
    supplyClaimed,
    quantityLimitPerWallet,
    merkleRoot,
    pricePerToken,
    currency,
    metadata,
  ] = await nft.getClaimConditionById(tokenId, 0);

  const [balanceOf1, balanceOf2]: ethers.BigNumber[] = await nft.balanceOfBatch(
    [userAddress, userAddress],
    [1, 2],
  );
  console.log('balanceOf1:', balanceOf1, 'balanceOf2:', balanceOf2);

  if (balanceOf1.gt(0)) {
    return new NextResponse(`<!DOCTYPE html><html><head>
    <meta property="fc:frame" content="vNext" />
    <meta property="og:image" content="${TokenMetaData[1].gatewayImage}"/>
    <meta property="fc:frame:button:1" content="Already Minted" />
  </head></html>`);
  }
  if (balanceOf2.gt(0)) {
    return new NextResponse(`<!DOCTYPE html><html><head>
    <meta property="fc:frame" content="vNext" />
    <meta property="og:image" content="${TokenMetaData[2].gatewayImage}"/>
    <meta property="fc:frame:button:1" content="Already Minted" />
  </head></html>`);
  }
  //TODO: check for the active claim condition instead of defaulting to the 0th

  //Note: this only works because there is no allowlist and merkleRoot is 0
  const tx = await nft.populateTransaction.claim(
    userAddress,
    tokenId,
    1,
    currency,
    pricePerToken,
    {
      proof: [merkleRoot],
      quantityLimitPerWallet: quantityLimitPerWallet,
      pricePerToken: pricePerToken,
      currency: currency,
    },
    '0x',
  );

  // Uncomment to test submitting on-chain
  // const provider1 = new ethers.providers.JsonRpcProvider(`https://mainnet.base.org`);
  // const signer1 = new ethers.Wallet(process.env.PK as string, provider);
  // console.log('loaded:', signer.address);
  // const txx = await signer1.sendTransaction({
  //   to: nft.address,
  //   value: pricePerToken,
  //   data: tx.data,
  // });
  // console.log(txx);
  const feeData = await provider.getFeeData();
  const gasLimit = await provider.estimateGas({ ...tx, from: userAddress, value: pricePerToken });
  const value = ethers.utils.formatEther(pricePerToken.toString());

  return new NextResponse(`<!DOCTYPE html><html><head>
  <meta name="fc:frame" content="vNext" />
  <meta name="fc:frame:image" content="${TokenMetaData[parseInt(tokenId)].gatewayImage}"/>
  <meta property="cb:tx:${tokenId}" content="to:${params.contractAddress},data:${tx.data},value:${value},valueWei:${pricePerToken},gasLimit:${gasLimit},baseFeePerGas:${feeData.lastBaseFeePerGas},maxFeePerGas:${feeData.maxFeePerGas},gasPrice:${feeData.gasPrice},maxPriorityFeePerGas:${feeData.maxPriorityFeePerGas}" />
  
</head></html>`);
}

async function getButtonPressOrder(tokenId: number): Promise<string> {
  return `<!DOCTYPE html><html><head>`;
}

async function getUserAddress(body: any): Promise<string | undefined> {
  let accountAddress: string | undefined;
  try {
    //cbwallet compatibility
    if (body.hasOwnProperty('address')) {
      accountAddress = body.address as string;
    } else {
      let fcBody: { trustedData?: { messageBytes?: string } } = body;
      accountAddress = await getFrameAccountAddress(fcBody, { NEYNAR_API_KEY: 'NEYNAR_API_DOCS' });
    }
  } catch (err) {
    console.error(err);
  }
  return accountAddress;
}

/*
body: {
  untrustedData: {
    fid: 238505,
    url: 'https://test-frame-mint.vercel.app',
    messageHash: '0xe5dd0d6b7923bc5fe26c630f139437b57f66c7f3',
    timestamp: 1706769135000,
    network: 1,
    buttonIndex: 2,
    castId: { fid: 238505, hash: '0xe141219f70a05343277077d8a0820af00888acb1' }
  },
  trustedData: {
    messageBytes: '0a52080d10a9c70e18efa9b32e20018201420a2268747470733a2f2f746573742d6672616d652d6d696e742e76657263656c2e61707010021a1a08a9c70e1214e141219f70a05343277077d8a0820af00888acb11214e5dd0d6b7923bc5fe26c630f139437b57f66c7f3180122402f795dbe8f4dc4e6fca0f0be954ba82e2c5945a010b0888a6ad6dc74388043e25a44acfd528ad06b8d8c340e1c8e0a9a80e9b14a42c0aa1aeb258e4c0788c00828013220bbef8ee0fb1c365596b880642aa2d53582f1ca36b9352ea741659d2de07826c9'
  }
}
*/
async function getButtonIndex(body: any): Promise<string> {
  if (body.hasOwnProperty('buttonIndex')) {
    return body.buttonIndex as string;
  } else {
    const msg = await getFrameValidatedMessage(body);
    return msg?.data?.frameActionBody?.buttonIndex.toString() as string;
  }
}
/*
 claim(
    "0xA14A25930BaBC1220df002070be86b030B1d4c68",
    0,
    1,
    "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    {"type":"BigNumber","hex":"0x5af3107a4000"},
    {
      "proof": [
        "0x0000000000000000000000000000000000000000000000000000000000000000"
      ],
      "quantityLimitPerWallet": {
        "type": "BigNumber",
        "hex": "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      },
      "pricePerToken": {
        "type": "BigNumber",
        "hex": "0x5af3107a4000"
      },
      "currency": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
    },
    {}
  )


*/
export const dynamic = 'force-dynamic';
