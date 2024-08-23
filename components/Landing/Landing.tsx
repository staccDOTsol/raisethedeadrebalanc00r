// @ts-nocheck  
import { useEffect, useState } from 'react';
import { Container, Text, Box, Group, Card, Loader, Image, Slider, Alert, List, Button, Grid, Tooltip, Tabs } from '@mantine/core';
import { WhirlpoolClient, WhirlpoolContext, buildWhirlpoolClient, PDAUtil, WhirlpoolAccountFetcher, DEFAULT_WHIRLPOOL_RETENTION_POLICY, ORCA_WHIRLPOOL_PROGRAM_ID, WhirlpoolIx, PriceMath, TickUtil, IncreaseLiquidityQuote, WhirlpoolData, increaseLiquidityQuoteByInputTokenWithParamsUsingPriceSlippage, Position, PositionData, PoolUtil } from '@orca-so/whirlpools-sdk';
import { PublicKey, Connection, ComputeBudgetProgram, Keypair, Transaction, VersionedTransaction, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { Percentage, SimpleAccountFetcher, TransactionBuilder } from '@orca-so/common-sdk';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { AccountLayout, createAssociatedTokenAccountInstruction, getAssociatedTokenAddressSync, getMint, NATIVE_MINT, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import Decimal from 'decimal.js';
import { Whirlpool } from '@orca-so/whirlpools-sdk/dist/artifacts/whirlpool';
import { AnchorProvider, BN, Idl, Program } from '@coral-xyz/anchor';
import { IconInfoCircle } from '@tabler/icons-react';
import { BondingCurveAccount } from './BondingCurveAccount';
import { Jupiter } from '@jup-ag/api';

// @ts-ignore
import { motion } from 'framer-motion';
// @ts-ignore
import styled, { css, keyframes } from 'styled-components';

const TICK_SPACING = 64; // Replace with actual tick spacing
const TOKEN_ADDRESSES = {
  NATIVE_MINT: NATIVE_MINT,
  BONK: new PublicKey("DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"),
  WEN: new PublicKey("WENWENvqqNya429ubCdR81ZmD69brwQaaBYY6p3LCpk"),
  SLERF: new PublicKey("7BgBvyjrZX1YKz4oh9mjb8ZScatkkwb8DzFx7LoiVkM3")
};
const idl = {
  "version": "0.1.0",
  "name": "pump",
  "instructions": [
    {
      "name": "initialize",
      "docs": [
        "Creates the global state."
      ],
      "accounts": [
        {
          "name": "global",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "setParams",
      "docs": [
        "Sets the global state parameters."
      ],
      "accounts": [
        {
          "name": "global",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "eventAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "program",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "feeRecipient",
          "type": "publicKey"
        },
        {
          "name": "initialVirtualTokenReserves",
          "type": "u64"
        },
        {
          "name": "initialVirtualSolReserves",
          "type": "u64"
        },
        {
          "name": "initialRealTokenReserves",
          "type": "u64"
        },
        {
          "name": "tokenTotalSupply",
          "type": "u64"
        },
        {
          "name": "feeBasisPoints",
          "type": "u64"
        }
      ]
    },
    {
      "name": "create",
      "docs": [
        "Creates a new coin and bonding curve."
      ],
      "accounts": [
        {
          "name": "mint",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "mintAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bondingCurve",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedBondingCurve",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "global",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mplTokenMetadata",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "metadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "eventAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "program",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "symbol",
          "type": "string"
        },
        {
          "name": "uri",
          "type": "string"
        }
      ]
    },
    {
      "name": "buy",
      "docs": [
        "Buys tokens from a bonding curve."
      ],
      "accounts": [
        {
          "name": "global",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "feeRecipient",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bondingCurve",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedBondingCurve",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedUser",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "eventAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "program",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "maxSolCost",
          "type": "u64"
        }
      ]
    },
    {
      "name": "sell",
      "docs": [
        "Sells tokens into a bonding curve."
      ],
      "accounts": [
        {
          "name": "global",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "feeRecipient",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bondingCurve",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedBondingCurve",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedUser",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "eventAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "program",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "minSolOutput",
          "type": "u64"
        }
      ]
    },
    {
      "name": "withdraw",
      "docs": [
        "Allows the admin to withdraw liquidity for a migration once the bonding curve completes"
      ],
      "accounts": [
        {
          "name": "global",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bondingCurve",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedBondingCurve",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedUser",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "eventAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "program",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "Global",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "initialized",
            "type": "bool"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "feeRecipient",
            "type": "publicKey"
          },
          {
            "name": "initialVirtualTokenReserves",
            "type": "u64"
          },
          {
            "name": "initialVirtualSolReserves",
            "type": "u64"
          },
          {
            "name": "initialRealTokenReserves",
            "type": "u64"
          },
          {
            "name": "tokenTotalSupply",
            "type": "u64"
          },
          {
            "name": "feeBasisPoints",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "BondingCurve",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "virtualTokenReserves",
            "type": "u64"
          },
          {
            "name": "virtualSolReserves",
            "type": "u64"
          },
          {
            "name": "realTokenReserves",
            "type": "u64"
          },
          {
            "name": "realSolReserves",
            "type": "u64"
          },
          {
            "name": "tokenTotalSupply",
            "type": "u64"
          },
          {
            "name": "complete",
            "type": "bool"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "CreateEvent",
      "fields": [
        {
          "name": "name",
          "type": "string",
          "index": false
        },
        {
          "name": "symbol",
          "type": "string",
          "index": false
        },
        {
          "name": "uri",
          "type": "string",
          "index": false
        },
        {
          "name": "mint",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "bondingCurve",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "user",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "TradeEvent",
      "fields": [
        {
          "name": "mint",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "solAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "isBuy",
          "type": "bool",
          "index": false
        },
        {
          "name": "user",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        },
        {
          "name": "virtualSolReserves",
          "type": "u64",
          "index": false
        },
        {
          "name": "virtualTokenReserves",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "CompleteEvent",
      "fields": [
        {
          "name": "user",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "mint",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "bondingCurve",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "SetParamsEvent",
      "fields": [
        {
          "name": "feeRecipient",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "initialVirtualTokenReserves",
          "type": "u64",
          "index": false
        },
        {
          "name": "initialVirtualSolReserves",
          "type": "u64",
          "index": false
        },
        {
          "name": "initialRealTokenReserves",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenTotalSupply",
          "type": "u64",
          "index": false
        },
        {
          "name": "feeBasisPoints",
          "type": "u64",
          "index": false
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "NotAuthorized",
      "msg": "The given account is not authorized to execute this instruction."
    },
    {
      "code": 6001,
      "name": "AlreadyInitialized",
      "msg": "The program is already initialized."
    },
    {
      "code": 6002,
      "name": "TooMuchSolRequired",
      "msg": "slippage: Too much SOL required to buy the given amount of tokens."
    },
    {
      "code": 6003,
      "name": "TooLittleSolReceived",
      "msg": "slippage: Too little SOL received to sell the given amount of tokens."
    },
    {
      "code": 6004,
      "name": "MintDoesNotMatchBondingCurve",
      "msg": "The mint does not match the bonding curve."
    },
    {
      "code": 6005,
      "name": "BondingCurveComplete",
      "msg": "The bonding curve has completed and liquidity migrated to raydium."
    },
    {
      "code": 6006,
      "name": "BondingCurveNotComplete",
      "msg": "The bonding curve has not completed."
    },
    {
      "code": 6007,
      "name": "NotInitialized",
      "msg": "The program is not initialized."
    }
  ],
  "metadata": {
    "address": "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"
  }
}
interface TokenDefinition {
  symbol: string,
  mint: PublicKey,
  decimals: number,
}

async function checkAccountExists(connection: Connection, client: WhirlpoolClient, address: string): Promise<boolean> {
  try {
    const publicKey = new PublicKey(address);
    const accountInfo = await connection.getAccountInfo(publicKey);
    return accountInfo != undefined;
  } catch (error) {
    console.error('Error checking account info:', error);
    return false;
  }
}const flashingYellow = keyframes`
0% { background-color: transparent; }
50% { background-color: rgba(255, 255, 0, 0.3); }
100% { background-color: transparent; }
`;



// Update the styled components
const StyledCard = styled(motion.div)<{ $isFlashing: boolean }>`
  width: 100%;
  margin-bottom: 1rem;

  @media (min-width: 768px) {
    width: calc(50% - 0.5rem);
  }

  @media (min-width: 1024px) {
    width: calc(33.33% - 0.67rem);
  }

  ${(props:any) => props.$isFlashing && css`
    animation: ${flashingYellow} 1s infinite;
  `}
`;

const CardContent = styled.div`
  color: white;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
`;

const CardTitle = styled(Text)`
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 0.25rem;

  @media (min-width: 768px) {
    font-size: 1.2rem;
    margin-bottom: 0.5rem;
  }
`;

const CardDescription = styled(Text)`
  font-size: 0.8rem;
  margin-bottom: 0.25rem;

  @media (min-width: 768px) {
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
  }
`;

const CardBeta = styled(Text)`
  font-size: 0.8rem;
  font-weight: 600;

  @media (min-width: 768px) {
    font-size: 0.9rem;
  }
`;

export function Landing() {
  const [features, setFeatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortedFeatures, setSortedFeatures] = useState<any[]>([]);
  const [dollarAmount, setDollarAmount] = useState<number>(0.01);
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [selectedToken, setSelectedToken] = useState<keyof typeof TOKEN_ADDRESSES>("NATIVE_MINT");
// reference: https://orca-so.gitbook.io/orca-developer-portal/whirlpools/interacting-with-the-protocol/position-management/identifying-whirlpool-tokens
async function get_whirlpool_position_pubkeys(
  ctx: WhirlpoolContext,
  fetcher: WhirlpoolClient,
  position_owner: PublicKey,
): Promise<PublicKey[]> {
  // get all token accounts
  const token_accounts = (await ctx.connection.getTokenAccountsByOwner(position_owner, {programId: TOKEN_PROGRAM_ID})).value;

  // get position PDA from mint
  const whirlpool_position_candidate_pubkeys = token_accounts.map((ta) => {
    const parsed = AccountLayout.decode(ta.account.data);
    const pda = PDAUtil.getPosition(ctx.program.programId, parsed.mint);
    // amount == 1 check
    return new BN(parsed.amount.toString()).eq(new BN(1)) ? pda.publicKey : undefined;
  }).filter(pubkey => pubkey !== undefined) as PublicKey[];

  // check position PDA existance
  const whirlpool_position_candidate_datas = await fetcher.getPositions(whirlpool_position_candidate_pubkeys);
  console.log("whirlpool_position_candidate_datas", whirlpool_position_candidate_datas);
  const whirlpool_positions = whirlpool_position_candidate_pubkeys.filter((pubkey, i) => 
    whirlpool_position_candidate_datas[i] !== null
  );

  return whirlpool_positions;
}
async function closeAllPositions() {
  if (!wallet || !connection) {
    console.error("Wallet or connection not available");
    return;
  }

  const ctx = WhirlpoolContext.from(connection, wallet, ORCA_WHIRLPOOL_PROGRAM_ID);
  const client = buildWhirlpoolClient(ctx);

  try {
    for (const position of positions) {
      const pool = await client.getPool((await (position.data)).getData().whirlpool);
      const tx = await pool.closePosition(position.pubkey, Percentage.fromDecimal(new Decimal(0.01)));
      for (const ix of tx){
      const txId = await ix.buildAndExecute();
      console.log(`Closed position ${position.pubkey.toBase58()}. Transaction ID: ${txId}`);
      }
    }
    // Clear the positions array after closing all positions
    setPositions([]);
  } catch (error) {
    console.error("Error closing positions:", error);
  }
}
async function collectAllFees(){
  if (!wallet || !connection) {
    console.error("Wallet or connection not available");
    return;
  }

  const ctx = WhirlpoolContext.from(connection, wallet, ORCA_WHIRLPOOL_PROGRAM_ID);

  try {
    for (const position of positions) {
     const tx = await (await position.data).collectFees(true)
     const txId = await tx.buildAndExecute()
     console.log(`Collected fees for position ${position.pubkey.toBase58()}. Transaction ID: ${txId}`);
    }
  } catch (error) {
    console.error("Error collecting fees:", error);
  }
}

async function collectFees(mint: PublicKey) {
  if (!wallet) return 

  const fetcher = new WhirlpoolAccountFetcher(connection, new SimpleAccountFetcher(connection, DEFAULT_WHIRLPOOL_RETENTION_POLICY));
  const ctx = WhirlpoolContext.from(connection, wallet, ORCA_WHIRLPOOL_PROGRAM_ID, fetcher);
  const client = buildWhirlpoolClient(ctx);

  const whirlpoolPubkey1 = PDAUtil.getWhirlpool(
    ctx.program.programId,
    new PublicKey("J5T5RStZBW2ayuTp5dGCQMHsUApCReRbytDMRd4ZP2aR"),
    new PublicKey(mint),
    TOKEN_ADDRESSES[selectedToken],
    TICK_SPACING
  ).publicKey;

  const whirlpoolPubkey2 = PDAUtil.getWhirlpool(
    ctx.program.programId,
    new PublicKey("J5T5RStZBW2ayuTp5dGCQMHsUApCReRbytDMRd4ZP2aR"),
    TOKEN_ADDRESSES[selectedToken],
    new PublicKey(mint),
    TICK_SPACING
  ).publicKey;

  const accountExists1 = await checkAccountExists(connection, client, whirlpoolPubkey1.toString());
const id = accountExists1  ? whirlpoolPubkey1 : whirlpoolPubkey2;
  if (!wallet || !connection) {
    console.error("Wallet or connection not available");
    return;
  }

    for (const position of positions){
      try {
      const wp = await (await (position.data)).getData().whirlpool.equals(id)
      if (!wp) continue

    const tx = await (await position.data).collectFees(true);
    const txId = await tx.buildAndExecute();
    console.log(`Collected fees for position ${id.toBase58()}. Transaction ID: ${txId}`);
   
  } catch (error) {
    console.error("Error collecting fees:", error);
  } }
}

async function closePosition(mint: PublicKey) {
  
  if (!wallet) return 

  const fetcher = new WhirlpoolAccountFetcher(connection, new SimpleAccountFetcher(connection, DEFAULT_WHIRLPOOL_RETENTION_POLICY));
  const ctx = WhirlpoolContext.from(connection, wallet, ORCA_WHIRLPOOL_PROGRAM_ID, fetcher);
  const client = buildWhirlpoolClient(ctx);

  const whirlpoolPubkey1 = PDAUtil.getWhirlpool(
    ctx.program.programId,
    new PublicKey("J5T5RStZBW2ayuTp5dGCQMHsUApCReRbytDMRd4ZP2aR"),
    new PublicKey(mint),
    TOKEN_ADDRESSES[selectedToken],
    TICK_SPACING
  ).publicKey;

  const whirlpoolPubkey2 = PDAUtil.getWhirlpool(
    ctx.program.programId,
    new PublicKey("J5T5RStZBW2ayuTp5dGCQMHsUApCReRbytDMRd4ZP2aR"),
    TOKEN_ADDRESSES[selectedToken],
    new PublicKey(mint),
    TICK_SPACING
  ).publicKey;

  const accountExists1 = await checkAccountExists(connection, client, whirlpoolPubkey1.toString());
const id = accountExists1  ? whirlpoolPubkey1 : whirlpoolPubkey2;
  if (!wallet || !connection) {
    console.error("Wallet or connection not available");
    return;
  }

    for (const position of positions){
      try {
      const wp = await (await (position.data)).getData().whirlpool.equals(id)
      if (!wp) continue

    const pool = await client.getPool(id);
    const tx = await pool.closePosition(position.pubkey, Percentage.fromDecimal(new Decimal(0.01)));
    for (const ix of tx){
      const txId = await ix.buildAndExecute();
      console.log(`Closed position ${position.pubkey.toBase58()}. Transaction ID: ${txId}`);
    }
    // Remove the closed position from the positions array
    setPositions(prevPositions => prevPositions.filter(p => !p.pubkey.equals(position.pubkey)));
  } catch (error) {
    console.error("Error closing position:", error);
  }
}
}
const [positions, setPositions] = useState<{ pubkey: PublicKey; data: Promise<Position>; }[]>([])
const [netWorth, setNetWorth ] = useState<number>(0)
const [pendingYield, setPendingYield] = useState<number>()

  useEffect(() => { 
    
    if (!wallet) return;

    const fetcher = new WhirlpoolAccountFetcher(connection, new SimpleAccountFetcher(connection, DEFAULT_WHIRLPOOL_RETENTION_POLICY));
    const ctx = WhirlpoolContext.from(connection, wallet, ORCA_WHIRLPOOL_PROGRAM_ID, fetcher);
    const client = buildWhirlpoolClient(ctx);


    async function getTokenPrice(mint: PublicKey, bondingCurvePublicKey: PublicKey) {
        try {
          const response = await fetch(`https://price.jup.ag/v6/price?ids=${mint.toBase58()}&vsToken=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`);
          const data = await response.json();
          return new Decimal(data.data[mint.toBase58()].price);
        } catch (error) {
          console.error("Error fetching price from Jupiter:", error);
          
          // Fallback to bonding curve price
          try {
            const bondingCurveAccount = await connection.getAccountInfo(bondingCurvePublicKey);
            if (!bondingCurveAccount) {
              throw new Error("Bonding curve account not found");
            }
            
            const decodedData = bondingCurveAccount.data;
            const virtualSolReserves = Number(decodedData.readBigUInt64LE(8));
            const virtualTokenReserves = Number(decodedData.readBigUInt64LE(0));
            
            if (virtualTokenReserves === 0 || virtualSolReserves === 0) {
              throw new Error("Invalid bonding curve reserves");
            }
            
            const buyQuote = (amount: number): number => {
              const solCost = (amount * virtualSolReserves) / (virtualTokenReserves - amount);
              return Math.floor(solCost);
            };
            
            const tokenAmount = 1e6; // 1 token
            const solAmount = buyQuote(tokenAmount);
            const price = new Decimal(solAmount).div(tokenAmount);
            
            return price;
          } catch (bondingCurveError) {
            console.error("Error fetching price from bonding curve:", bondingCurveError);
            throw new Error("Failed to fetch token price");
          }
        }
    }
    const getPositionValue = async (client: WhirlpoolClient, position: PositionData, bondingCurvePublicKey: PublicKey): Promise<number> => {
      const pool = await client.getPool(position.whirlpool);
      const tokenAInfo = pool.getTokenAInfo();
      const tokenBInfo = pool.getTokenBInfo();
    
      const tokenAPrice = await getTokenPrice(tokenAInfo.mint, bondingCurvePublicKey) as unknown as Decimal
      const tokenBPrice = await getTokenPrice(tokenBInfo.mint, bondingCurvePublicKey)as unknown as Decimal
    
      if (tokenAPrice === undefined || tokenBPrice === undefined) {
        console.error('Failed to fetch token prices');
        return 0;
      }
      const whirlpool = (await client.getPool(position.whirlpool)).getData();
      const amounts = PoolUtil.getTokenAmountsFromLiquidity(
        position.liquidity,
        whirlpool.sqrtPrice,
        PriceMath.tickIndexToSqrtPriceX64(position.tickLowerIndex),
        PriceMath.tickIndexToSqrtPriceX64(position.tickUpperIndex),
        true
      );

      const tokenAValue = tokenAPrice.mul(amounts.tokenA.toString());
      const tokenBValue = tokenBPrice.mul(amounts.tokenB.toString());
      return tokenAValue.add(tokenBValue).toNumber();
    };

    async function getPendingFeesValue(client: WhirlpoolClient, positionData: PositionData, bondingCurvePublicKey: PublicKey): Promise<number> {
      const pool = await client.getPool(positionData.whirlpool);
      const fees = {
        tokenA: positionData.feeOwedA,
        tokenB: positionData.feeOwedB
      };
      const tokenAPrice = (await getTokenPrice(pool.getTokenAInfo().mint, bondingCurvePublicKey)) as unknown as Decimal
      const tokenBPrice = (await getTokenPrice(pool.getTokenBInfo().mint, bondingCurvePublicKey)) as unknown as Decimal
    
      const tokenAFeesValue = tokenAPrice.mul(fees.tokenA.toNumber());
      const tokenBFeesValue = tokenBPrice.mul(fees.tokenB.toNumber());
    
      return tokenAFeesValue.add(tokenBFeesValue).toNumber();
    }
    
    const fetchData = async () => {
      try {
        const whirlpool_positions = await get_whirlpool_position_pubkeys(ctx, client, wallet.publicKey);
        console.log("whirlpool_positions", whirlpool_positions);
        setPositions(whirlpool_positions.map((position) => {
          return {
            pubkey: position,
            data: client.getPosition(position)
          }
        }))
        const positionsData = whirlpool_positions.map((position) => {
          return {
            pubkey: position,
            data: client.getPosition(position)
          }
        });
        setPositions(positionsData);
// @ts-ignore
        const fetchAndUpdateData = async () => {

          try {
            const response = await fetch('https://blink.blinkflip.fun/heehee.json');
            const data = [await response.json()];
            const updatedFeatures = await Promise.all(
              data.map(async (feature: any) => {
                const buyQuote = (amount: number): number => {
                  const solCost = (amount * virtualSolReserves) / (virtualTokenReserves - amount);
                  return Math.floor(solCost);
                };

                // Function to calculate sell quote (this is what we'll use)
                const sellQuote = (solAmount: number): number => {
                  const tokenOutput = (solAmount * virtualTokenReserves) / (virtualSolReserves + solAmount);
                  return Math.floor(tokenOutput);
                };

    // @ts-ignore
    const provider = new AnchorProvider(connection);
    const program = new Program(idl as Idl, new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"), provider);

                // Extract virtual reserves from parsed data
                const bondingCurveAccount = await program.provider.connection.getAccountInfo(new PublicKey(feature.bonding_curve));
                const bondingCurveData = bondingCurveAccount?.data as Buffer;
                const decodedData = bondingCurveData; // Remove last 8 bits
                // Define an interface for the bonding curve data
                interface BondingCurveData {
                  virtualTokenReserves: bigint;
                  virtualSolReserves: bigint;
                  realTokenReserves: bigint;
                  realSolReserves: bigint;
                  tokenTotalSupply: bigint;
                }
              
                // Parse the decoded data
                const parsedData: BondingCurveData = {
                  virtualTokenReserves: BigInt(decodedData.readBigUInt64LE(0)),
                  virtualSolReserves: BigInt(decodedData.readBigUInt64LE(8)),
                  realTokenReserves: BigInt(decodedData.readBigUInt64LE(16)),
                  realSolReserves: BigInt(decodedData.readBigUInt64LE(24)),
                  tokenTotalSupply: BigInt(decodedData.readBigUInt64LE(32)),
                };
              
              
                // Extract virtual reserves from parsed data
                const virtualSolReserves = Number(parsedData.realTokenReserves);
                const virtualTokenReserves = Number(parsedData.realTokenReserves)
                            console.log(virtualSolReserves, virtualSolReserves)
                if (virtualTokenReserves === 0 || virtualSolReserves === 0) return null;
const currentTokenMint =  TOKEN_ADDRESSES[selectedToken]
                const solAmount = 1e9; // 1 SOL8 1
                const tokenAmount = sellQuote(solAmount)  * 10 ** 6
                const effectivePrice = solAmount / tokenAmount;
                const whirlpoolPubkey1 = PDAUtil.getWhirlpool(
                  ctx.program.programId,
                  new PublicKey("J5T5RStZBW2ayuTp5dGCQMHsUApCReRbytDMRd4ZP2aR"),
                  new PublicKey(feature.mint),
                  currentTokenMint,
                  TICK_SPACING
                ).publicKey;

                const whirlpoolPubkey2 = PDAUtil.getWhirlpool(
                  ctx.program.programId,
                  new PublicKey("J5T5RStZBW2ayuTp5dGCQMHsUApCReRbytDMRd4ZP2aR"),
                  currentTokenMint,
                  new PublicKey(feature.mint),
                  TICK_SPACING
                ).publicKey;

                const accountExists1 = await checkAccountExists(connection, client, whirlpoolPubkey1.toString());
                const accountExists2 = await checkAccountExists(connection, client, whirlpoolPubkey2.toString());

                return {
                  ...feature,
                  accountExists: accountExists1 || accountExists2,
                  betaPercentage: parseFloat(feature.usd_market_cap),
                };
              })
            );

            const sortedFeatures = updatedFeatures.filter((feature) => feature != null);
            setFeatures(sortedFeatures);
            const sorted = updatedFeatures
            .filter((feature) => feature != null)
            .sort((a, b) => b.betaPercentage - a.betaPercentage);
  
          setSortedFeatures(sorted);
  
            let totalNetWorth = 0;
            let totalPendingYield = 0;
            
            for (const position of positionsData) {
              const positionData = await position.data;
              const whirlpoolData = await positionData.getWhirlpoolData();
              const feature = sortedFeatures.find((f: any) => 
                f.mint === whirlpoolData.tokenMintA.toBase58() || 
                f.mint === whirlpoolData.tokenMintB.toBase58()
              );
              
              if (!feature) {
                console.error(`No feature found for position ${position.pubkey.toBase58()}`);
                continue;
              }
              
              const bondingCurvePublicKey = new PublicKey(feature.bonding_curve);
              const positionValue = await getPositionValue(client, positionData.getData(), bondingCurvePublicKey);
              const pendingFeesValue = await getPendingFeesValue(client, positionData.getData(), bondingCurvePublicKey);
            
              totalNetWorth += positionValue;
              totalPendingYield += pendingFeesValue;
            }
            
            console.log("totalNetWorth", totalNetWorth);
            console.log("totalPendingYield", totalPendingYield);

            setNetWorth(totalNetWorth);
            setPendingYield(totalPendingYield);

          } catch (error) {
            console.error('Error fetching data:', error);

          }
        };

        // Fetch data immediately
        fetchAndUpdateData();
        
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [wallet, connection, selectedToken]);
const [range, setRange] = useState<number>(0.5)
  const handleCardClick = async (feature: any) => {
    if (!wallet ) return;
    const fetcher = new WhirlpoolAccountFetcher(connection, new SimpleAccountFetcher(connection, DEFAULT_WHIRLPOOL_RETENTION_POLICY));
    const ctx = WhirlpoolContext.from(connection, wallet, ORCA_WHIRLPOOL_PROGRAM_ID, fetcher);
    const client = buildWhirlpoolClient(ctx);
    const config = new PublicKey("J5T5RStZBW2ayuTp5dGCQMHsUApCReRbytDMRd4ZP2aR"); 
    const tokenA = { symbol: "bonk", mint: TOKEN_ADDRESSES[selectedToken], decimals: 9 }; // Replace with actual token A details
    const tokenB = { symbol: "pamp", mint: new PublicKey(feature.mint), decimals: 6 }; // Replace with actual token B details
    const initPrice = new Decimal(1); // Replace with actual initial price

    const inverse = !(tokenB.mint.toBuffer().compare(tokenA.mint.toBuffer()) < 0); // Set to true if needed

    const whirlpoolPubkey = !inverse
      ? PDAUtil.getWhirlpool(ctx.program.programId, config, tokenB.mint, tokenA.mint, TICK_SPACING).publicKey
      : PDAUtil.getWhirlpool(ctx.program.programId, config, tokenA.mint, tokenB.mint, TICK_SPACING).publicKey;
console.log('feature',feature)
try {      await openNewPosition(
        whirlpoolPubkey,
        wallet,
        client,
        new PublicKey(feature.bonding_curve),
        dollarAmount * 10 ** 9,
        inverse ? tokenB : tokenA,
        inverse ? tokenA : tokenB,
        inverse
      );
    }
      catch (err){
        console.log(err)
      

  // Fetch candlestick data for tokenA
    
// @ts-ignore
const provider = new AnchorProvider(connection);
const program = new Program(idl as Idl, new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"), provider);

  // Find the bonding curve PDA
  // Fetch bonding curve data
  const bondingCurveAccount = await program.provider.connection.getAccountInfo(new PublicKey(feature.bonding_curve));

  // Decode the bonding curve data
  const bondingCurveData = bondingCurveAccount?.data as Buffer;
  const decodedData = bondingCurveData; // Remove last 8 bits
  // Define an interface for the bonding curve data
  interface BondingCurveData {
    virtualTokenReserves: bigint;
    virtualSolReserves: bigint;
    realTokenReserves: bigint;
    realSolReserves: bigint;
    tokenTotalSupply: bigint;
  }

  // Parse the decoded data
  const parsedData: BondingCurveData = {
    virtualTokenReserves: BigInt(decodedData.readBigUInt64LE(0)),
    virtualSolReserves: BigInt(decodedData.readBigUInt64LE(8)),
    realTokenReserves: BigInt(decodedData.readBigUInt64LE(16)),
    realSolReserves: BigInt(decodedData.readBigUInt64LE(24)),
    tokenTotalSupply: BigInt(decodedData.readBigUInt64LE(32)),
  };

  console.log("Decoded bonding curve data:", parsedData);

  // Extract virtual reserves from parsed data
  const virtualSolReserves = Number(parsedData.realTokenReserves);
  const virtualTokenReserves = Number(parsedData.realTokenReserves)
  if (virtualTokenReserves == 0 || virtualSolReserves == 0) return
  const buyQuote = (amount: number): number => {
    const solCost = (amount * virtualSolReserves) / (virtualTokenReserves - amount);
    return Math.floor(solCost);
  };

  // Function to calculate sell quote (this is what we'll use)
  const sellQuote = (solAmount: number): number => {
    const tokenOutput = (solAmount * virtualTokenReserves) / (virtualSolReserves + solAmount);
    return Math.floor(tokenOutput);
  };
  
  // Calculate how many tokens we can get for our SOL
  const solAmount = dollarAmount * 10 ** 9; // This is the amount of SOL we want to spend
  const tokenAmount = sellQuote(solAmount);

  console.log("SOL amount to spend:", solAmount / 1e9, "SOL");
  console.log("Token amount to receive:", tokenAmount);

  // Calculate the effective price
  const effectivePrice = (solAmount / 10 ** 9) / (tokenAmount / 10 ** 6);


      await create_whirlpool_and_tickarrays(ctx, config, !inverse ? tokenB : tokenA,!inverse ? tokenA : tokenB, TICK_SPACING, new Decimal(effectivePrice), !inverse
      ? PDAUtil.getWhirlpool(ctx.program.programId, config, tokenB.mint, tokenA.mint, TICK_SPACING).publicKey
      : PDAUtil.getWhirlpool(ctx.program.programId, config, tokenA.mint, tokenB.mint, TICK_SPACING).publicKey);
    }
  };

////////////////////////////////////////////////////////////////////////////////
// deposit function
////////////////////////////////////////////////////////////////////////////////
async function get_increase_liquidity_quote(
  ctx: WhirlpoolContext,
  whirlpool_data: WhirlpoolData,
  whirlpool: PublicKey,
  token_input: TokenDefinition,
  amount_in: number,
  acceptable_slippage: Decimal,
  token_a: TokenDefinition,
  token_b: TokenDefinition,
  lower: number,
  upper: number
): Promise<any> {
  const tickSpacing = whirlpool_data.tickSpacing;


  // Adjust lower and upper ticks to be initializable
  const adjustedLower = TickUtil.getInitializableTickIndex(lower, tickSpacing);
  const adjustedUpper = TickUtil.getInitializableTickIndex(upper, tickSpacing);

  console.log("Adjusted lower tick:", adjustedLower);
  console.log("Adjusted upper tick:", adjustedUpper);
  lower = adjustedLower 
  upper = adjustedUpper
  console.log("Lower price:", PriceMath.tickIndexToPrice(adjustedLower, token_a.decimals, token_b.decimals).toString());
  console.log("Upper price:", PriceMath.tickIndexToPrice(adjustedUpper, token_a.decimals, token_b.decimals).toString());

  try {
    console.log("Input amount:", amount_in);

    const quote = increaseLiquidityQuoteByInputTokenWithParamsUsingPriceSlippage({
      inputTokenMint: token_input.mint,
      inputTokenAmount: new BN(amount_in),
      tokenMintA: token_a.mint,
      tokenMintB: token_b.mint,
      tickCurrentIndex: whirlpool_data.tickCurrentIndex,
      sqrtPrice: whirlpool_data.sqrtPrice,
      tickLowerIndex: adjustedLower,
      tickUpperIndex: adjustedUpper,
      slippageTolerance: Percentage.fromDecimal(acceptable_slippage),
      tokenExtensionCtx: {
        currentEpoch: whirlpool_data.rewardLastUpdatedTimestamp.toNumber(),
        tokenMintWithProgramA: { tokenProgram: TOKEN_PROGRAM_ID, ...(await getMint(ctx.connection, token_a.mint)) },
        tokenMintWithProgramB: { tokenProgram: TOKEN_PROGRAM_ID, ...(await getMint(ctx.connection, token_b.mint)) },
      },
    });

    console.log("Detailed quote:", {
      liquidityAmount: quote.liquidityAmount.toString(),
      tokenMaxA: quote.tokenMaxA.toString(),
      tokenMaxB: quote.tokenMaxB.toString(),
      tokenEstA: quote.tokenEstA.toString(),
      tokenEstB: quote.tokenEstB.toString(),
    });
    const currentTokenMint =  TOKEN_ADDRESSES[selectedToken]
    // Check which token is NATIVE_MINT and get the max output
    const nativeToken = token_a.mint.equals(currentTokenMint) ? token_a : token_b;
    let  maxNativeOutput = Number(quote.tokenMaxA.toString()) > Number(quote.tokenMaxB.toString()) 
    ? (quote.tokenMaxA)  : (quote.tokenMaxB) 
    if (maxNativeOutput.eq(new BN(0))){
      // If maxNativeOutput is 0, use tokenEstA or tokenEstB
      maxNativeOutput = nativeToken.mint.equals(token_a.mint) ? quote.tokenEstA : quote.tokenEstB;
      console.log("Using estimated token amount:", maxNativeOutput.toString());
      // Check if we need to create tick arrays for the upper tick
      const upper_start_index = TickUtil.getStartTickIndex(upper, tickSpacing);
      const upper_tickarray_pda = PDAUtil.getTickArrayFromTickIndex(upper, tickSpacing, whirlpool, ORCA_WHIRLPOOL_PROGRAM_ID);
      const upper_tickArrays = [{ startTickIndex: upper_start_index, initialized: false }];

      // Create missing tick arrays for upper tick if necessary
      for (const tickArray of upper_tickArrays) {
        if ((await ctx.connection.getAccountInfo(upper_tickarray_pda.publicKey)) == undefined) {
          if (!ctx.wallet) return;
          console.log(`Creating tick array for upper start tick: ${tickArray.startTickIndex}`);
          const upperTickArrayPda = PDAUtil.getTickArray(ORCA_WHIRLPOOL_PROGRAM_ID, whirlpool, tickArray.startTickIndex);
          const upperTickArrayAccount = await ctx.connection.getAccountInfo(upperTickArrayPda.publicKey);
          if (upperTickArrayAccount == undefined) {
            const initUpperTickArrayIx = WhirlpoolIx.initTickArrayIx(ctx.program, {
              startTick: tickArray.startTickIndex,
              tickArrayPda: upperTickArrayPda,
              whirlpool: whirlpool,
              funder: ctx.wallet.publicKey,
            });
          
            const tx = new TransactionBuilder(ctx.provider.connection, ctx.wallet);
            tx.addInstruction(initUpperTickArrayIx);
            await tx.buildAndExecute();
          }
        }
      }
      
      // If tokenEst is also 0, throw an error
      if (maxNativeOutput.eq(new BN(0))) {
        maxNativeOutput = nativeToken.mint.equals(token_a.mint) ? quote.tokenEstA : quote.tokenEstB;

      }
    }
    // Get the wallet's SOL balance
    const walletBalance = await ctx.connection.getBalance(ctx.wallet.publicKey);

    // If the max output is larger than the wallet balance, recursively reduce the input amount
    if (maxNativeOutput.gt(new BN(walletBalance))) {
      console.log("Max native output exceeds wallet balance. Reducing input amount.");
      return get_increase_liquidity_quote(
        ctx,
        whirlpool_data,
        whirlpool,
        token_input,
        Math.floor(amount_in / 2),
        acceptable_slippage,
        token_a,
        token_b,
        lower,
        upper
      );
    }
    // Check if we need to create tick arrays
    const start_index = TickUtil.getStartTickIndex(lower, tickSpacing);

    const tickarray_pda = PDAUtil.getTickArrayFromTickIndex(lower, tickSpacing, whirlpool, ORCA_WHIRLPOOL_PROGRAM_ID);
    const tickArrays = [{ startTickIndex: start_index, initialized: false }];
    
    // Create missing tick arrays if necessary
    for (const tickArray of tickArrays) {
      if ((await connection.getAccountInfo(tickarray_pda.publicKey)) == undefined) {
if (!wallet ) return
  const ctx = WhirlpoolContext.from(connection, wallet, ORCA_WHIRLPOOL_PROGRAM_ID);
  const client = buildWhirlpoolClient(ctx);
        console.log(`Creating tick array for start tick: ${tickArray.startTickIndex}`);
        const tickArrayPda = PDAUtil.getTickArray(ORCA_WHIRLPOOL_PROGRAM_ID, whirlpool, tickArray.startTickIndex);
        const tickArrayAccount = await connection.getAccountInfo(tickArrayPda.publicKey);
        if (tickArrayAccount == undefined) {
          const initTickArrayIx = WhirlpoolIx.initTickArrayIx(ctx.program, {
            startTick: tickArray.startTickIndex,
            tickArrayPda: tickArrayPda,
            whirlpool: whirlpool,
            funder: ctx.wallet.publicKey,
          });
        
        const tx = new TransactionBuilder(ctx.provider.connection, ctx.wallet);
        tx.addInstruction(initTickArrayIx);
        
        try {
          const signature = await tx.buildAndExecute();
          console.log(`Tick array created. Signature: ${signature}`);
          await ctx.provider.connection.confirmTransaction(signature);
        } catch (err) {
          console.error(err)
          throw err;
        }
      }
      }
    }

    console.log("Liquidity quote:", quote);

    if (quote.liquidityAmount.lte(new BN(0))) {
      throw new Error("Calculated liquidity is zero or negative");
    }

    return { lower_tick_index: lower, upper_tick_index: upper, quote };
  } catch (error) {
    console.error("Error in get_increase_liquidity_quote:", error);
    throw error;
  }
}
async function open_position(
  ctx: WhirlpoolContext,
  whirlpool: any,
  quote: any,
) {
  console.log("Opening position with quote:", quote);
    let position_mint_tx = await whirlpool.openPosition(
      quote.lower_tick_index,
      quote.upper_tick_index,
      quote.quote,
    );
    console.log("Position mint transaction:", position_mint_tx);
    position_mint_tx.tx.instructions.push(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 333333 }));

    const signature = await position_mint_tx.tx.buildAndExecute();
    console.log("open_position signature", signature);
    console.log("position NFT", position_mint_tx.positionMint.toBase58());
    await ctx.connection.confirmTransaction(signature);

}
const feeRecipient = new PublicKey("CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM");
const global = new PublicKey("4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf");

async function openNewPosition(
  pool: PublicKey,
  wallet: any,
  client: WhirlpoolClient,
  bondingCurvePublicKey: PublicKey,
  dollarAmount: number,
  token_a: TokenDefinition,
  token_b: TokenDefinition,
  inverse: boolean
): Promise<void> {
  const provider = new AnchorProvider(connection);
  const program = new Program(idl as Idl, new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"), provider);
  
  const tokenAMint = new PublicKey(token_a.mint);
  const tokenBMint = new PublicKey(token_b.mint);
  const currentTokenMint =  TOKEN_ADDRESSES[selectedToken]
  
  const userPublicKey = wallet.publicKey;

  // Fetch bonding curve data
  const bondingCurveAccount = await program.provider.connection.getAccountInfo(bondingCurvePublicKey);
  const bondingCurveData = BondingCurveAccount.fromBuffer(bondingCurveAccount?.data as Buffer);

  // Extract virtual reserves from parsed data
  const virtualSolReserves = Number(bondingCurveData.virtualSolReserves);
  const virtualTokenReserves = Number(bondingCurveData.virtualTokenReserves);
  if (virtualTokenReserves === 0 || virtualSolReserves === 0) return;

  const getBuyPrice = (tokens: bigint): bigint => {
    return bondingCurveData.getBuyPrice(tokens);
  };

  // Calculate SOL amount based on dollar amount
  const solAmount = Math.floor(dollarAmount * 1e9); // Convert to lamports

  console.log("SOL amount to spend:", solAmount / 1e9, "SOL");

  let tokenAmount: number;
  tokenAmount = Number(getBuyPrice(BigInt(solAmount))) / 1e6;

  // For currentTokenMint, use the bonding curve
  if (!tokenAMint.equals(currentTokenMint)) {
    // Perform Jupiter swap for non-native tokens
    // Get SOL price in USDC
    const solPriceResponse = await fetch('https://price.jup.ag/v6/price?ids=SOL');
    const solPriceData = await solPriceResponse.json();
    const solPriceInUSDC = solPriceData.data.SOL.price;
    // For non-native tokens, we need to calculate the amount of tokens to swap
    const usdcAmount = solAmount / solPriceInUSDC;
    console.log("USDC amount to swap:", usdcAmount / 1e6, "USDC");

    // Get token price in USDC
    const tokenPriceResponse = await fetch(`https://price.jup.ag/v6/price?ids=${token_a.symbol}`);
    const tokenPriceData = await tokenPriceResponse.json();
    const tokenPriceInUSDC = tokenPriceData.data[token_a.symbol].price;

    // Calculate token amount based on USDC amount
    const ta = usdcAmount / tokenPriceInUSDC;
    console.log("Token amount to receive:", ta, token_a.symbol);

    // Perform Jupiter swap from SOL to USDC, then USDC to token
   await performJupiterSwap(connection, wallet, NATIVE_MINT, tokenAMint, ta);
  }

  console.log("Token amount to receive:", tokenAmount);

  // Calculate the effective price
  const effectivePrice = (solAmount / 1e9) / tokenAmount;
  console.log("Effective price (SOL per token):", effectivePrice);

  if (effectivePrice <= 0 || !isFinite(effectivePrice)) {
    console.error("Invalid effective price calculated:", effectivePrice);
    return;
  }

  // Get associated token accounts
  const associatedUser = await getAssociatedTokenAddressSync(tokenAMint, userPublicKey);

  // Check if user's associated token account exists
  const userTokenAccountInfo = await connection.getAccountInfo(associatedUser);
  
  // Prepare transaction
  const transaction = new Transaction();
  
  // Add compute budget instruction
  transaction.add(
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 333333 })
  );

  if (userTokenAccountInfo === null) {
    transaction.add(
      createAssociatedTokenAccountInstruction(
        userPublicKey,
        associatedUser,
        userPublicKey,
        tokenAMint
      )
    );
  }
  
  // Add transfer instruction for fee
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: userPublicKey,
      toPubkey: new PublicKey("Czbmb7osZxLaX5vGHuXMS2mkdtZEXyTNKwsAUUpLGhkG"),
      lamports: 0.01 * 1e9,
    })
  );
  
  let currentBalance = 0;
  // Check user's token balance
  try {
    const userTokenBalance = await connection.getTokenAccountBalance(associatedUser);
    currentBalance = userTokenBalance.value.uiAmount || 0;
    console.log("Current token balance:", currentBalance);
    console.log("Required amount:", tokenAmount);
  } catch (err) {
    console.error("Error fetching token balance:", err);
  }

  if (currentBalance < tokenAmount) {
    // Use the bonding curve to buy tokens
    const buyInstruction = await program.methods.buy(
      new BN(Math.floor((tokenAmount - currentBalance) * 1e6)),
      new BN(solAmount)
    ).accounts({
      global,
      feeRecipient,
      mint: tokenAMint,
      bondingCurve: bondingCurvePublicKey,
      associatedBondingCurve: getAssociatedTokenAddressSync(tokenAMint, bondingCurvePublicKey, true),
      associatedUser,
      user: userPublicKey,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      rent: SYSVAR_RENT_PUBKEY,
    }).instruction();

    transaction.add(buyInstruction);
  } else {
    console.log("User already has sufficient tokens. Skipping buy.");
  }

  // Set recent blockhash and fee payer
  transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  transaction.feePayer = userPublicKey;

  // Sign and send transaction
  const signedTransaction = await wallet.signTransaction(transaction);
  const txid = await connection.sendRawTransaction(signedTransaction.serialize());
  await connection.confirmTransaction(txid);

  console.log(`Transaction completed. Transaction ID: ${txid}`);

  // Continue with the rest of the function (calculating price ranges, opening position, etc.)
  // ... (rest of the function remains unchanged)
}
     async function create_whirlpool_and_tickarrays(
    ctx: WhirlpoolContext,
    config: PublicKey,
    token_a: TokenDefinition,
    token_b: TokenDefinition,
    tick_spacing: number,
    init_price: Decimal,
    whirlpool_pubkey: PublicKey,
  ): Promise<PublicKey[]> {
    console.log("create_whirlpool_and_tickarrays");
    console.log("  whirlpool program", ctx.program.programId.toBase58());
    console.log("  config", config.toBase58());
    console.log("  token_a", `symbol ${token_a.symbol} mint ${token_a.mint.toBase58()} decimals ${token_a.decimals}`);
    console.log("  token_b", `symbol ${token_b.symbol} mint ${token_b.mint.toBase58()} decimals ${token_b.decimals}`);
    console.log("  tick_spacing", tick_spacing);
    console.log("  init_price", init_price.toString());
  
    // Calculate current tick index
    const current_tick_index = PriceMath.priceToTickIndex(init_price, token_a.decimals, token_b.decimals);
  
    // Create a single tick array around the current tick index
    const start_index = TickUtil.getStartTickIndex(current_tick_index, tick_spacing);
    const tickarray_pda = PDAUtil.getTickArrayFromTickIndex(current_tick_index, tick_spacing, whirlpool_pubkey, ctx.program.programId);
  
    // Create whirlpool instruction
    const whirlpool_pda = PDAUtil.getWhirlpool(
      ctx.program.programId,
      config,
      token_a.mint,token_b.mint,
      tick_spacing);
    const feetier_pda = PDAUtil.getFeeTier(ctx.program.programId, config, tick_spacing);
    const token_a_vault_keypair = Keypair.generate();
    const token_b_vault_keypair = Keypair.generate();
    const init_sqrt_price = PriceMath.priceToSqrtPriceX64(init_price, token_a.decimals,  token_b.decimals);
  
    const whirlpool_ix = WhirlpoolIx.initializePoolIx(ctx.program, {
      initSqrtPrice: init_sqrt_price,
      tickSpacing: tick_spacing,
      tokenMintA: token_a.mint,
      tokenMintB: token_b.mint,
      tokenVaultAKeypair: token_a_vault_keypair,
      tokenVaultBKeypair: token_b_vault_keypair,
      whirlpoolPda: whirlpool_pda,
      whirlpoolsConfig: config,
      feeTierKey: feetier_pda.publicKey,
      funder: ctx.wallet.publicKey,
    });
    whirlpool_ix.instructions.push(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 333333 }));
  
    // Create tick array instruction
    const tickarray_ix = WhirlpoolIx.initTickArrayIx(ctx.program, {
      funder: ctx.wallet.publicKey,
      startTick: start_index,
      tickArrayPda: tickarray_pda,
      whirlpool: whirlpool_pda.publicKey,
    });
  
    // Combine instructions into one transaction
    const tx = new TransactionBuilder(ctx.provider.connection, ctx.wallet, {
      defaultBuildOption: {
        maxSupportedTransactionVersion: "legacy",
        blockhashCommitment: "recent"
      },
      defaultSendOption: {},
      defaultConfirmationCommitment: "recent"
    });
    tx.addInstruction(whirlpool_ix);
    tx.addInstruction(tickarray_ix);
  
    // Execute transaction
    try {
      const built = (await tx.buildAndExecute())
      return [whirlpool_pda.publicKey, tickarray_pda.publicKey];
    } catch (err) {
      console.error("Error executing transaction:", JSON.stringify(err).toString());
      return [whirlpool_pda.publicKey, tickarray_pda.publicKey];
    }
  }
  
  async function performJupiterSwap(
    inputToken: PublicKey,
    outputToken: PublicKey,
    amount: number,
    slippage: number
  ) {
    if (!wallet || !connection) return;
  
    const jupiter = await Jupiter.load({
      connection,
      cluster: 'mainnet-beta',
      user: wallet.publicKey,
    });
  
    const routes = await jupiter.computeRoutes({
      inputMint: inputToken,
      outputMint: outputToken,
      amount,
      slippageBps: slippage * 100,
    });
  
    if (routes.routesInfos.length === 0) {
      console.error('No routes found');
      return;
    }
  
    const bestRoute = routes.routesInfos[0];
    const { transactions } = await jupiter.exchange({
      routeInfo: bestRoute,
    });
    const signed = await wallet.signAllTransactions(transactions.txs);
    const txids  = await connection.sendRawTransactions(signed.map(tx => tx.serialize()));
    console.log(`Swap completed. Transaction ID: ${txids[0]}`);
  }
  const ImageWithFallback = ({ src, alt, height }: { src: string, alt: string, height: number }) => {
    const [currentSrc, setCurrentSrc] = useState(src);
  
    const onError = () => {
      if (currentSrc.includes('cf-ipfs.com')) {
        // Fallback to ipfs.io if Cloudflare fails
        setCurrentSrc(src.replace('https://cf-ipfs.com/ipfs/', 'https://ipfs.io/ipfs/'));
      } else if (currentSrc.includes('ipfs.io')) {
        // Fallback to default image if both gateways fail
        setCurrentSrc(src.replace('https://ipfs.io/ipfs/', 'https://ipfs.io/ipfs/'));
      }
    };
  
    return <Image src={currentSrc} alt={alt} height={height} onError={onError} />;
  };
  return (
    <Container size="md" py="xl">
      {!wallet ? (
        <Text>Please connect your wallet to continue...</Text>
      ) : loading ? (
        <Loader />
      ) : (
        <>
<Tabs value={selectedToken} onChange={(value) => setSelectedToken(value as keyof typeof TOKEN_ADDRESSES)}>
    <Tabs.List>
    <Tabs.Tab value="NATIVE_MINT">SOL</Tabs.Tab>
    <Tabs.Tab value="BONK">BONK</Tabs.Tab>
    <Tabs.Tab value="WEN">WEN</Tabs.Tab>
    <Tabs.Tab value="SLERF">SLERF</Tabs.Tab>
  </Tabs.List>
</Tabs>
          <Box mt="md">
            <Text size="sm">Total Net Worth: ${(netWorth /(10**6)).toFixed(2)}</Text>
            <Text size="sm">Total Pending Yield: ${(pendingYield?pendingYield/(10**6):0).toFixed(2)}</Text>
            <Group mb="md" spacing="xs">
              <Text size="sm">Actions:</Text>
              <Button size="xs" onClick={collectAllFees}>Collect All Fees</Button>
              <Button size="xs" onClick={closeAllPositions}>Close All Positions</Button>
            </Group>
          </Box>
          <Group mb="md" direction="column" grow>
            <Text size="sm">New Position Range: {range}%</Text>
            <Slider
              min={0.1}
              max={100}
              defaultValue={2}
              step={0.1}
              value={range}
              onChange={setRange}
              style={{ width: '100%' }}
            />
          </Group>
          <Group mb="md" direction="column" grow>
            <Text size="sm">Sol Amount: {dollarAmount || 0}</Text>
            <Slider
              min={0.01}
              max={10}
              step={0.01}
              value={dollarAmount || 1}
              onChange={setDollarAmount}
              style={{ width: '100%' }}
            />
          </Group>
          
          <Tooltip
            label={
              <Box>
                <Text>Directions:</Text>
                <List>
                  <List.Item>You need SOL or the correct tokens to play.</List.Item>
                  <List.Item>Each pool needs at least $500 in total liquidity for Jupiter to route trades, heehee.</List.Item>
                  <List.Item>Green cards: Press to open a position.</List.Item>
                  <List.Item>Red cards: Press if you dare! This will create a new pool. And then refresh da page.</List.Item>
                  <List.Item>Yellow flashing cards: These have high volatility. Nice! We trade volatility!</List.Item>
                  <List.Item>Black cards: These pools have migrated to Raydium. Swapping and depositing liquidity for these is not currently supported.</List.Item>
                  <List.Item>Use at your own risk. This is experimental software.</List.Item>
                  <List.Item>Past performance does not guarantee future results.</List.Item>
                  <List.Item>Only invest what you can afford to lose.</List.Item>
                  <List.Item>Dev is a methematician not a mathemitician.</List.Item>
                  <List.Item>English r hard.</List.Item>
                  <List.Item>You ain't gotta trust me, verify the tx as they pop up in your wallet: tis pamp n whirlpools, no weirdness. verify.</List.Item>
                  <List.Item>Also for some strange reason this thing will just keep trying out of your entire bags to enter sol if the thing is super lopsided.</List.Item>
                  <List.Item>This thing is 5cESeFSaeDv9VWSmssbEQdV11dfkFdkZTLtqWN6apump only for now. once ray, no more, dump your positions if you please.</List.Item>
                </List>
              </Box>
            }
            position="bottom"
            withArrow
            multiline
            width={300}
            transition="fade"
            transitionProps={{ duration: 200 }}
            color="blue"
          >
            <Button variant="outline" size="lg" radius="xl" mb="md">
              USE A BURNER WALLET! click me for how to play
            </Button>
          </Tooltip>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            {sortedFeatures.filter(feature => feature.raydium_complete == null).slice(0, 1).map((feature) => {
             const imageUri = feature.image_uri ? 
             feature.image_uri.replace('ipfs://', 'https://cf-ipfs.com/ipfs/') : 
             'https://ipfs.io/ipfs/QmTjvoYnHMFYguYzwVmRYCuKZQmJJB9R8oKMX7j56ayEnQ';
              return (
                <StyledCard
                  key={feature.mint}
                  $isFlashing={Math.abs(feature.betaPercentage) > 0.1}
                  animate={Math.abs(feature.betaPercentage) > 0.1 ? { x: [-5, 5, -5, 5, 0] } : {}}
                  transition={{ duration: 0.5 }}
                  style={{ width: '80%', maxWidth: '500px' }}
                >
                  <Card
                    shadow="sm"
                    padding="lg"
                    radius="md"
                    withBorder
                    style={{
                      height: 'auto',
                      width: '100%',
                      backgroundColor: feature.complete ? 'rgba(0, 0, 0, 0.8)' : 
                        (feature.accountExists || feature.targetAccountExists ? 'rgba(0, 128, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)'),
                    }}
                    onClick={() => {
                      handleCardClick(feature);
                    }}
                  >
                <ImageWithFallback src={imageUri} alt={feature.name} height={200} />
                <CardContent>
                      <CardTitle style={{ fontSize: '1.5em' }}>{feature.name}</CardTitle>
                      <Text size="md" c="rgba(255,255,255,0.8)" mb="sm">{feature.symbol}</Text>
                      <CardDescription style={{ fontSize: '1.2em' }}>{feature.description}</CardDescription>
                      <CardBeta style={{ fontSize: '1.2em' }}>
                        Beta: {feature.betaPercentage.toFixed(2)}%
                      </CardBeta>
                      {(feature.accountExists || feature.targetAccountExists) && (
                        <Group mt="md" spacing="sm">
                          <Button size="md" variant="light" onClick={(e) => { e.stopPropagation(); collectFees(feature.mint); }}>Collect Fees</Button>
                          <Button size="md" variant="light" onClick={(e) => { e.stopPropagation(); closePosition(feature.mint); }}>Close Position</Button>
                        </Group>
                      )}
                    </CardContent>
                  </Card>
                </StyledCard>
              );
            })}
          </Box>
        </>
      )}
    </Container>
  );
}