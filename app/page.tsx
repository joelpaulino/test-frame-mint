import { getFrameMetadata } from '@coinbase/onchainkit';
import type { Metadata } from 'next';

const frameMetadata = getFrameMetadata({
  buttons: ['Next image'],
  image: `${process.env.DOMAIN}/park-1.png`,
  post_url: `${process.env.DOMAIN}/api/frame`,
});

export const metadata: Metadata = {
  title: 'Test Frame Mint',
  description: 'LFG',
  openGraph: {
    title: 'Test Frame Mint',
    description: 'LFG',
    images: [`${process.env.DOMAIN}/park-1.png`],
  },
  other: {
    ...frameMetadata,
  },
};

export default function Page() {
  return (
    <>
      <h1>{process.env.DOMAIN}</h1>
    </>
  );
}
