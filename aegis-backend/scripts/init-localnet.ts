import * as anchor from "@coral-xyz/anchor";
import {
  createAccount,
  createMint,
  getAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";

import aegisIdl from "../../target/idl/aegis.json";

const RPC_URL = process.env.SOLANA_RPC_URL ?? "http://127.0.0.1:8899";
const PROGRAM_ID = new PublicKey(
  process.env.AEGIS_PROGRAM_ID ?? aegisIdl.address,
);
const FEE_BPS = [6000, 1500, 1200, 800, 300, 200] as const;

function getConfigPda(programId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync([Buffer.from("config")], programId)[0];
}

async function ensureAirdrop(connection: Connection, publicKey: PublicKey, sol = 5) {
  const balance = await connection.getBalance(publicKey, "confirmed");
  if (balance >= sol * LAMPORTS_PER_SOL) return balance;

  const signature = await connection.requestAirdrop(publicKey, sol * LAMPORTS_PER_SOL);
  const latestBlockhash = await connection.getLatestBlockhash("confirmed");
  await connection.confirmTransaction(
    {
      signature,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    },
    "confirmed",
  );

  return connection.getBalance(publicKey, "confirmed");
}

async function main() {
  const connection = new Connection(RPC_URL, "confirmed");
  const admin = Keypair.generate();

  const provider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(admin),
    { commitment: "confirmed" },
  );
  anchor.setProvider(provider);

  const program = new anchor.Program(aegisIdl as anchor.Idl, provider);
  const configPda = getConfigPda(PROGRAM_ID);
  const existingConfig = await connection.getAccountInfo(configPda, "confirmed");

  if (existingConfig) {
    console.log(`Protocol config already exists at ${configPda.toBase58()}`);
    return;
  }

  const programInfo = await connection.getAccountInfo(PROGRAM_ID, "confirmed");
  if (!programInfo) {
    throw new Error(`Program ${PROGRAM_ID.toBase58()} is not deployed on ${RPC_URL}`);
  }

  const fundedBalance = await ensureAirdrop(connection, admin.publicKey);
  console.log(`Admin wallet: ${admin.publicKey.toBase58()}`);
  console.log(`Admin balance: ${fundedBalance / LAMPORTS_PER_SOL} SOL`);

  const usdcMint = await createMint(
    connection,
    admin,
    admin.publicKey,
    admin.publicKey,
    6,
  );
  const aegisMint = await createMint(
    connection,
    admin,
    admin.publicKey,
    null,
    9,
  );

  const treasury = await createAccount(connection, admin, usdcMint, admin.publicKey, Keypair.generate());
  const validatorPool = await createAccount(connection, admin, usdcMint, admin.publicKey, Keypair.generate());
  const stakerPool = await createAccount(connection, admin, usdcMint, admin.publicKey, Keypair.generate());
  const insuranceFund = await createAccount(connection, admin, usdcMint, admin.publicKey, Keypair.generate());

  await program.methods
    .initialize([...FEE_BPS])
    .accounts({
      admin: admin.publicKey,
      config: configPda,
      treasury,
      validatorPool,
      stakerPool,
      insuranceFund,
      aegisMint,
      usdcMint,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .signers([admin])
    .rpc({ commitment: "confirmed" });

  const treasuryAccount = await getAccount(connection, treasury, "confirmed");
  const validatorAccount = await getAccount(connection, validatorPool, "confirmed");
  const stakerAccount = await getAccount(connection, stakerPool, "confirmed");
  const insuranceAccount = await getAccount(connection, insuranceFund, "confirmed");

  console.log("Localnet protocol initialized");
  console.log(`Config PDA: ${configPda.toBase58()}`);
  console.log(`Program ID: ${PROGRAM_ID.toBase58()}`);
  console.log(`USDC Mint: ${usdcMint.toBase58()}`);
  console.log(`AEGIS Mint: ${aegisMint.toBase58()}`);
  console.log(`Treasury Token Account: ${treasury.toBase58()} (owner ${treasuryAccount.owner.toBase58()})`);
  console.log(`Validator Pool Token Account: ${validatorPool.toBase58()} (owner ${validatorAccount.owner.toBase58()})`);
  console.log(`Staker Pool Token Account: ${stakerPool.toBase58()} (owner ${stakerAccount.owner.toBase58()})`);
  console.log(`Insurance Fund Token Account: ${insuranceFund.toBase58()} (owner ${insuranceAccount.owner.toBase58()})`);
  console.log(`Treasury Wallet Owner: ${admin.publicKey.toBase58()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});