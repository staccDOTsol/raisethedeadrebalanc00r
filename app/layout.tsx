import '@mantine/core/styles.css';
import React from 'react';
import { MantineProvider, ColorSchemeScript } from '@mantine/core';
import { NavigationProgress } from '@mantine/nprogress';

import { theme } from '../theme';

import '@mantine/dropzone/styles.css';
import '@mantine/carousel/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/code-highlight/styles.css';
import '@solana/wallet-adapter-react-ui/styles.css';
import { Providers } from '@/providers/Providers';

export const metadata = {
  title: 'Raise the Dead',
  description: 'A revolutionary DeFi platform that combines the thrill of necromancy with the power of decentralized finance. Resurrect your assets, stake your claim in the underworld, and earn rewards in this unique gamified liquidity experience on the Solana blockchain.',
};
export default function RootLayout({ children }: { children: any }) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript />
        <link rel="shortcut icon" href="/favicon.png" />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
        />
      </head>
      <body>
        <MantineProvider theme={theme} defaultColorScheme="dark">
          <NavigationProgress />
          <Providers>{children}</Providers>
        </MantineProvider>
      </body>
    </html>
  );
}
