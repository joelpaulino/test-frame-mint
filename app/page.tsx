import { getFrameMetadata } from '@coinbase/onchainkit';
import type { Metadata } from 'next';

const frameMetadata = getFrameMetadata({
  buttons: ['Next image'],
  image: `https://test-frame-mint.vercel.app/park-1.png`,
  post_url: `https://test-frame-mint.vercel.app/api/frame`,
});

export const metadata: Metadata = {
  title: 'Test Frame Mint',
  description: 'LFG',
  openGraph: {
    title: 'Test Frame Mint',
    description: 'LFG',
    images: [`https://test-frame-mint.vercel.app/park-1.png`],
  },
  other: {
    ...frameMetadata,
  },
};

export default function Page() {
  return (
    <>
      <h1>https://test-frame-mint.vercel.app/</h1>
    </>
  );
}
