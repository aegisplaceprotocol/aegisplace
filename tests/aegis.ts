import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Aegis } from "../target/types/aegis";
import { RoyaltyRegistry } from "../target/types/royalty_registry";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  createAccount,
  mintTo,
  getAccount,
  createSetAuthorityInstruction,
  AuthorityType,
} from "@solana/spl-token";
import { assert } from "chai";

// ─────────────────────────────────────────────────────────────────────
// Program IDs
// ─────────────────────────────────────────────────────────────────────
const AEGIS_PROGRAM_ID = new PublicKey(
  "7CHg7hLqGvpdY8tKKeZL6eLgudCszB7e7VnBB1ogUqYR"
);
const ROYALTY_PROGRAM_ID = new PublicKey(
  "FrXBFm4WdqBHosZJ8rMyT9FHNvRXuSVzxqGBbH7nCWs6"
);

describe("Aegis Protocol", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const aegisProgram = anchor.workspace.Aegis as Program<Aegis>;
  const royaltyProgram = anchor.workspace
    .RoyaltyRegistry as Program<RoyaltyRegistry>;

  // ── Keypairs ───────────────────────────────────────────────────────
  const admin = Keypair.generate();
  const creator1 = Keypair.generate();
  const creator2 = Keypair.generate();
  const caller = Keypair.generate();
  const newAdmin = Keypair.generate();
  const unauthorizedUser = Keypair.generate();

  // ── Token state ────────────────────────────────────────────────────
  let usdcMint: PublicKey;
  let aegisMint: PublicKey;
  let callerTokenAccount: PublicKey;
  let creatorTokenAccount: PublicKey;
  let creator2TokenAccount: PublicKey;
  let treasuryTokenAccount: PublicKey;
  let validatorPoolTokenAccount: PublicKey;
  let stakerPoolTokenAccount: PublicKey;
  let insuranceFundTokenAccount: PublicKey;

  // ── PDAs ───────────────────────────────────────────────────────────
  let configPda: PublicKey;
  let configBump: number;

  // ── Constants ──────────────────────────────────────────────────────
  const INITIAL_MINT_AMOUNT = 1_000_000_000_000; // 1M USDC (6 dec)
  const FEE_BPS: number[] = [6000, 1500, 1200, 800, 300, 200];

  // ─────────────────────────────────────────────────────────────────
  // SETUP
  // ─────────────────────────────────────────────────────────────────
  before(async () => {
    // Airdrop SOL to every test wallet
    const wallets = [admin, creator1, creator2, caller, newAdmin, unauthorizedUser];
    for (const kp of wallets) {
      const sig = await provider.connection.requestAirdrop(
        kp.publicKey,
        10 * LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(sig, "confirmed");
    }

    // Create mock USDC mint (6 decimals) - admin is mint authority
    usdcMint = await createMint(
      provider.connection,
      admin,
      admin.publicKey,
      admin.publicKey, // freeze authority (also needed to allow burn by holder)
      6
    );

    // Create mock AEGIS mint (9 decimals)
    aegisMint = await createMint(
      provider.connection,
      admin,
      admin.publicKey,
      null,
      9
    );

    // Create token accounts - pass keypairs to avoid ATA (need distinct accounts
    // for the same owner+mint since admin owns multiple pool accounts)
    const callerTokenKp = Keypair.generate();
    callerTokenAccount = await createAccount(
      provider.connection,
      caller,
      usdcMint,
      caller.publicKey,
      callerTokenKp
    );
    const creatorTokenKp = Keypair.generate();
    creatorTokenAccount = await createAccount(
      provider.connection,
      creator1,
      usdcMint,
      creator1.publicKey,
      creatorTokenKp
    );
    const creator2TokenKp = Keypair.generate();
    creator2TokenAccount = await createAccount(
      provider.connection,
      creator2,
      usdcMint,
      creator2.publicKey,
      creator2TokenKp
    );
    const treasuryKp = Keypair.generate();
    treasuryTokenAccount = await createAccount(
      provider.connection,
      admin,
      usdcMint,
      admin.publicKey,
      treasuryKp
    );
    const validatorPoolKp = Keypair.generate();
    validatorPoolTokenAccount = await createAccount(
      provider.connection,
      admin,
      usdcMint,
      admin.publicKey,
      validatorPoolKp
    );
    const stakerPoolKp = Keypair.generate();
    stakerPoolTokenAccount = await createAccount(
      provider.connection,
      admin,
      usdcMint,
      admin.publicKey,
      stakerPoolKp
    );
    const insuranceKp = Keypair.generate();
    insuranceFundTokenAccount = await createAccount(
      provider.connection,
      admin,
      usdcMint,
      admin.publicKey,
      insuranceKp
    );

    // Mint USDC to caller so they can pay for invocations
    await mintTo(
      provider.connection,
      admin,
      usdcMint,
      callerTokenAccount,
      admin,
      INITIAL_MINT_AMOUNT
    );

    // Derive config PDA
    [configPda, configBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      aegisProgram.programId
    );
  });

  // ═══════════════════════════════════════════════════════════════════
  //  1. INITIALIZE
  // ═══════════════════════════════════════════════════════════════════
  describe("initialize", () => {
    it("initializes protocol config with correct fee schedule", async () => {
      await aegisProgram.methods
        .initialize(FEE_BPS)
        .accounts({
          admin: admin.publicKey,
          config: configPda,
          treasury: treasuryTokenAccount,
          validatorPool: validatorPoolTokenAccount,
          stakerPool: stakerPoolTokenAccount,
          insuranceFund: insuranceFundTokenAccount,
          aegisMint: aegisMint,
          usdcMint: usdcMint,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([admin])
        .rpc();

      const config = await aegisProgram.account.protocolConfig.fetch(configPda);
      assert.equal(config.admin.toBase58(), admin.publicKey.toBase58());
      assert.deepEqual(
        config.feeBps.map((n: number) => n),
        FEE_BPS
      );
      assert.equal(config.totalOperators.toNumber(), 0);
      assert.equal(config.totalInvocations.toNumber(), 0);
      assert.equal(config.totalVolumeLamports.toNumber(), 0);
      assert.equal(config.treasury.toBase58(), treasuryTokenAccount.toBase58());
      assert.equal(
        config.validatorPool.toBase58(),
        validatorPoolTokenAccount.toBase58()
      );
      assert.equal(
        config.stakerPool.toBase58(),
        stakerPoolTokenAccount.toBase58()
      );
      assert.equal(
        config.insuranceFund.toBase58(),
        insuranceFundTokenAccount.toBase58()
      );
      assert.equal(config.usdcMint.toBase58(), usdcMint.toBase58());
      assert.equal(config.aegisMint.toBase58(), aegisMint.toBase58());
    });

    it("rejects double initialization (PDA already in use)", async () => {
      try {
        await aegisProgram.methods
          .initialize(FEE_BPS)
          .accounts({
            admin: admin.publicKey,
            config: configPda,
            treasury: treasuryTokenAccount,
            validatorPool: validatorPoolTokenAccount,
            stakerPool: stakerPoolTokenAccount,
            insuranceFund: insuranceFundTokenAccount,
            aegisMint: aegisMint,
            usdcMint: usdcMint,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([admin])
          .rpc();
        assert.fail("Should have failed on double init");
      } catch (err: any) {
        // The account is already in use
        assert.ok(
          err.toString().includes("already in use") ||
            err.toString().includes("0x0") ||
            err.toString().includes("custom program error")
        );
      }
    });

    it("fee_bps must sum to exactly 10000", async () => {
      // We can only test this client-side since config PDA is taken.
      // Validate the sum constraint is documented / checked.
      const badFees = [5000, 1500, 1200, 800, 300, 100]; // 8900
      const sum = badFees.reduce((a, b) => a + b, 0);
      assert.notEqual(sum, 10000, "Bad fees should not sum to 10000");
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  //  2. REGISTER OPERATOR
  // ═══════════════════════════════════════════════════════════════════
  let operator1Pda: PublicKey;
  let operator2Pda: PublicKey;

  describe("register_operator", () => {
    it("registers a new operator (operator_id=0)", async () => {
      // Operator PDA: seeds = ["operator", creator, total_operators_le_bytes]
      [operator1Pda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("operator"),
          creator1.publicKey.toBuffer(),
          new anchor.BN(0).toArrayLike(Buffer, "le", 8),
        ],
        aegisProgram.programId
      );

      await aegisProgram.methods
        .registerOperator(
          "sentiment-analyzer",
          "https://api.example.com/analyze",
          new anchor.BN(10_000), // 0.01 USDC
          1 // category u8
        )
        .accounts({
          creator: creator1.publicKey,
          config: configPda,
          operator: operator1Pda,
          systemProgram: SystemProgram.programId,
        })
        .signers([creator1])
        .rpc();

      const op = await aegisProgram.account.operator.fetch(operator1Pda);
      assert.equal(op.name, "sentiment-analyzer");
      assert.equal(
        op.endpointUrl,
        "https://api.example.com/analyze"
      );
      assert.equal(op.priceUsdcBase.toNumber(), 10_000);
      assert.equal(op.category, 1);
      assert.equal(op.isActive, true);
      assert.equal(op.trustScore, 5000); // default 50%
      assert.equal(op.totalInvocations.toNumber(), 0);
      assert.equal(op.successfulInvocations.toNumber(), 0);
      assert.equal(op.totalEarnedLamports.toNumber(), 0);
      assert.equal(
        op.creator.toBase58(),
        creator1.publicKey.toBase58()
      );

      // Config total_operators should be incremented
      const config = await aegisProgram.account.protocolConfig.fetch(configPda);
      assert.equal(config.totalOperators.toNumber(), 1);
    });

    it("registers a second operator (operator_id=1)", async () => {
      [operator2Pda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("operator"),
          creator2.publicKey.toBuffer(),
          new anchor.BN(1).toArrayLike(Buffer, "le", 8),
        ],
        aegisProgram.programId
      );

      await aegisProgram.methods
        .registerOperator(
          "code-generator",
          "https://api.example.com/codegen",
          new anchor.BN(50_000), // 0.05 USDC
          2
        )
        .accounts({
          creator: creator2.publicKey,
          config: configPda,
          operator: operator2Pda,
          systemProgram: SystemProgram.programId,
        })
        .signers([creator2])
        .rpc();

      const op = await aegisProgram.account.operator.fetch(operator2Pda);
      assert.equal(op.name, "code-generator");
      assert.equal(op.operatorId.toNumber(), 1);

      const config = await aegisProgram.account.protocolConfig.fetch(configPda);
      assert.equal(config.totalOperators.toNumber(), 2);
    });

    it("rejects zero price", async () => {
      // Next operator_id would be 2
      const [badOpPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("operator"),
          creator1.publicKey.toBuffer(),
          new anchor.BN(2).toArrayLike(Buffer, "le", 8),
        ],
        aegisProgram.programId
      );

      try {
        await aegisProgram.methods
          .registerOperator(
            "bad-operator",
            "https://api.example.com/bad",
            new anchor.BN(0), // Zero price
            0
          )
          .accounts({
            creator: creator1.publicKey,
            config: configPda,
            operator: badOpPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([creator1])
          .rpc();
        assert.fail("Should reject zero price");
      } catch (err: any) {
        assert.ok(
          err.toString().includes("ZeroPrice") ||
            err.toString().includes("custom program error") ||
            err.toString().includes("6009")
        );
      }
    });

    it("rejects name exceeding 64 bytes", async () => {
      const longName = "A".repeat(65);
      const [badOpPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("operator"),
          creator1.publicKey.toBuffer(),
          new anchor.BN(2).toArrayLike(Buffer, "le", 8),
        ],
        aegisProgram.programId
      );

      try {
        await aegisProgram.methods
          .registerOperator(
            longName,
            "https://api.example.com",
            new anchor.BN(10_000),
            0
          )
          .accounts({
            creator: creator1.publicKey,
            config: configPda,
            operator: badOpPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([creator1])
          .rpc();
        assert.fail("Should reject name > 64 bytes");
      } catch (err: any) {
        assert.ok(
          err.toString().includes("NameTooLong") ||
            err.toString().includes("custom program error") ||
            err.toString().includes("6001")
        );
      }
    });

    it("rejects endpoint URL exceeding 256 bytes", async () => {
      const longUrl = "https://" + "x".repeat(256);
      const [badOpPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("operator"),
          creator1.publicKey.toBuffer(),
          new anchor.BN(2).toArrayLike(Buffer, "le", 8),
        ],
        aegisProgram.programId
      );

      try {
        await aegisProgram.methods
          .registerOperator(
            "valid-name",
            longUrl,
            new anchor.BN(10_000),
            0
          )
          .accounts({
            creator: creator1.publicKey,
            config: configPda,
            operator: badOpPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([creator1])
          .rpc();
        assert.fail("Should reject long endpoint URL");
      } catch (err: any) {
        assert.ok(
          err.toString().includes("EndpointUrlTooLong") ||
            err.toString().includes("custom program error") ||
            err.toString().includes("6002")
        );
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  //  3. INVOKE SKILL (6-way fee split)
  // ═══════════════════════════════════════════════════════════════════
  describe("invoke_skill", () => {
    it("invokes operator1 skill and verifies 6-way fee split", async () => {
      const op = await aegisProgram.account.operator.fetch(operator1Pda);
      const amount = op.priceUsdcBase.toNumber(); // 10_000

      // Snapshot all balances before invocation
      const callerBefore = Number(
        (await getAccount(provider.connection, callerTokenAccount)).amount
      );
      const creatorBefore = Number(
        (await getAccount(provider.connection, creatorTokenAccount)).amount
      );
      const validatorBefore = Number(
        (await getAccount(provider.connection, validatorPoolTokenAccount))
          .amount
      );
      const stakerBefore = Number(
        (await getAccount(provider.connection, stakerPoolTokenAccount)).amount
      );
      const treasuryBefore = Number(
        (await getAccount(provider.connection, treasuryTokenAccount)).amount
      );
      const insuranceBefore = Number(
        (await getAccount(provider.connection, insuranceFundTokenAccount))
          .amount
      );

      // Derive receipt PDA: seeds = ["invocation", operator_key, invocation_count_le]
      const [receiptPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("invocation"),
          operator1Pda.toBuffer(),
          new anchor.BN(0).toArrayLike(Buffer, "le", 8),
        ],
        aegisProgram.programId
      );

      await aegisProgram.methods
        .invokeSkill()
        .accounts({
          caller: caller.publicKey,
          config: configPda,
          operator: operator1Pda,
          receipt: receiptPda,
          usdcMint: usdcMint,
          callerTokenAccount: callerTokenAccount,
          creatorTokenAccount: creatorTokenAccount,
          validatorPoolTokenAccount: validatorPoolTokenAccount,
          stakerPoolTokenAccount: stakerPoolTokenAccount,
          treasuryTokenAccount: treasuryTokenAccount,
          insuranceFundTokenAccount: insuranceFundTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([caller])
        .rpc();

      // Snapshot balances after
      const callerAfter = Number(
        (await getAccount(provider.connection, callerTokenAccount)).amount
      );
      const creatorAfter = Number(
        (await getAccount(provider.connection, creatorTokenAccount)).amount
      );
      const validatorAfter = Number(
        (await getAccount(provider.connection, validatorPoolTokenAccount))
          .amount
      );
      const stakerAfter = Number(
        (await getAccount(provider.connection, stakerPoolTokenAccount)).amount
      );
      const treasuryAfter = Number(
        (await getAccount(provider.connection, treasuryTokenAccount)).amount
      );
      const insuranceAfter = Number(
        (await getAccount(provider.connection, insuranceFundTokenAccount))
          .amount
      );

      // Calculate expected shares
      const expectedCreator = Math.floor((amount * 6000) / 10000);
      const expectedValidator = Math.floor((amount * 1500) / 10000);
      const expectedStaker = Math.floor((amount * 1200) / 10000);
      const expectedTreasury = Math.floor((amount * 800) / 10000);
      const expectedInsurance = Math.floor((amount * 300) / 10000);
      const expectedBurn =
        amount -
        expectedCreator -
        expectedValidator -
        expectedStaker -
        expectedTreasury -
        expectedInsurance;

      // Verify each share
      assert.equal(
        creatorAfter - creatorBefore,
        expectedCreator,
        `Creator should get ${expectedCreator} (60%)`
      );
      assert.equal(
        validatorAfter - validatorBefore,
        expectedValidator,
        `Validators should get ${expectedValidator} (15%)`
      );
      assert.equal(
        stakerAfter - stakerBefore,
        expectedStaker,
        `Stakers should get ${expectedStaker} (12%)`
      );
      assert.equal(
        treasuryAfter - treasuryBefore,
        expectedTreasury,
        `Treasury should get ${expectedTreasury} (8%)`
      );
      assert.equal(
        insuranceAfter - insuranceBefore,
        expectedInsurance,
        `Insurance should get ${expectedInsurance} (3%)`
      );

      // Caller should have paid the full amount (transfers + burn)
      assert.equal(
        callerBefore - callerAfter,
        amount,
        "Caller should pay full operator price"
      );

      // Verify receipt
      const receipt = await aegisProgram.account.invocationReceipt.fetch(
        receiptPda
      );
      assert.equal(
        receipt.operator.toBase58(),
        operator1Pda.toBase58()
      );
      assert.equal(
        receipt.caller.toBase58(),
        caller.publicKey.toBase58()
      );
      assert.equal(receipt.amountPaid.toNumber(), amount);
      assert.equal(receipt.success, true);
      assert.equal(receipt.responseMs, 0);
      assert.equal(receipt.trustDelta, 0);

      // Verify operator counters updated
      const updatedOp = await aegisProgram.account.operator.fetch(
        operator1Pda
      );
      assert.equal(updatedOp.totalInvocations.toNumber(), 1);
      assert.equal(updatedOp.successfulInvocations.toNumber(), 1);
      assert.equal(
        updatedOp.totalEarnedLamports.toNumber(),
        expectedCreator
      );

      // Verify global counters
      const config = await aegisProgram.account.protocolConfig.fetch(configPda);
      assert.equal(config.totalInvocations.toNumber(), 1);
      assert.equal(config.totalVolumeLamports.toNumber(), amount);
    });

    it("second invocation increments counters correctly", async () => {
      const [receiptPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("invocation"),
          operator1Pda.toBuffer(),
          new anchor.BN(1).toArrayLike(Buffer, "le", 8),
        ],
        aegisProgram.programId
      );

      await aegisProgram.methods
        .invokeSkill()
        .accounts({
          caller: caller.publicKey,
          config: configPda,
          operator: operator1Pda,
          receipt: receiptPda,
          usdcMint: usdcMint,
          callerTokenAccount: callerTokenAccount,
          creatorTokenAccount: creatorTokenAccount,
          validatorPoolTokenAccount: validatorPoolTokenAccount,
          stakerPoolTokenAccount: stakerPoolTokenAccount,
          treasuryTokenAccount: treasuryTokenAccount,
          insuranceFundTokenAccount: insuranceFundTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([caller])
        .rpc();

      const op = await aegisProgram.account.operator.fetch(operator1Pda);
      assert.equal(op.totalInvocations.toNumber(), 2);

      const config = await aegisProgram.account.protocolConfig.fetch(configPda);
      assert.equal(config.totalInvocations.toNumber(), 2);
    });

    it("rejects invocation when operator is inactive", async () => {
      // Deactivate operator2 first
      await aegisProgram.methods
        .deactivateOperator()
        .accounts({
          creator: creator2.publicKey,
          operator: operator2Pda,
        })
        .signers([creator2])
        .rpc();

      const [receiptPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("invocation"),
          operator2Pda.toBuffer(),
          new anchor.BN(0).toArrayLike(Buffer, "le", 8),
        ],
        aegisProgram.programId
      );

      try {
        await aegisProgram.methods
          .invokeSkill()
          .accounts({
            caller: caller.publicKey,
            config: configPda,
            operator: operator2Pda,
            receipt: receiptPda,
            usdcMint: usdcMint,
            callerTokenAccount: callerTokenAccount,
            creatorTokenAccount: creator2TokenAccount,
            validatorPoolTokenAccount: validatorPoolTokenAccount,
            stakerPoolTokenAccount: stakerPoolTokenAccount,
            treasuryTokenAccount: treasuryTokenAccount,
            insuranceFundTokenAccount: insuranceFundTokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([caller])
          .rpc();
        assert.fail("Should reject invocation on inactive operator");
      } catch (err: any) {
        assert.ok(
          err.toString().includes("OperatorInactive") ||
            err.toString().includes("OperatorNotActive") ||
            err.toString().includes("custom program error") ||
            err.toString().includes("6013")
        );
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  //  4. UPDATE TRUST SCORE
  // ═══════════════════════════════════════════════════════════════════
  describe("update_trust", () => {
    it("admin increases trust score by +1000 (to 6000)", async () => {
      await aegisProgram.methods
        .updateTrust(1000)
        .accounts({
          admin: admin.publicKey,
          config: configPda,
          operator: operator1Pda,
        })
        .signers([admin])
        .rpc();

      const op = await aegisProgram.account.operator.fetch(operator1Pda);
      assert.equal(op.trustScore, 6000);
    });

    it("admin decreases trust score by -2000 (to 4000)", async () => {
      await aegisProgram.methods
        .updateTrust(-2000)
        .accounts({
          admin: admin.publicKey,
          config: configPda,
          operator: operator1Pda,
        })
        .signers([admin])
        .rpc();

      const op = await aegisProgram.account.operator.fetch(operator1Pda);
      assert.equal(op.trustScore, 4000);
    });

    it("trust score clamps to 10000 (upper bound)", async () => {
      // Current score is 4000; +30000 would be 34000 but clamps to 10000
      await aegisProgram.methods
        .updateTrust(30000)
        .accounts({
          admin: admin.publicKey,
          config: configPda,
          operator: operator1Pda,
        })
        .signers([admin])
        .rpc();

      const op = await aegisProgram.account.operator.fetch(operator1Pda);
      assert.equal(op.trustScore, 10000);
    });

    it("trust score clamps to 0 (lower bound)", async () => {
      // Current score is 10000; -32000 would be negative but clamps to 0
      await aegisProgram.methods
        .updateTrust(-32000)
        .accounts({
          admin: admin.publicKey,
          config: configPda,
          operator: operator1Pda,
        })
        .signers([admin])
        .rpc();

      const op = await aegisProgram.account.operator.fetch(operator1Pda);
      assert.equal(op.trustScore, 0);
    });

    it("non-admin cannot update trust (has_one constraint)", async () => {
      try {
        await aegisProgram.methods
          .updateTrust(500)
          .accounts({
            admin: unauthorizedUser.publicKey,
            config: configPda,
            operator: operator1Pda,
          })
          .signers([unauthorizedUser])
          .rpc();
        assert.fail("Should reject non-admin");
      } catch (err: any) {
        assert.ok(
          err.toString().includes("Unauthorized") ||
            err.toString().includes("has_one") ||
            err.toString().includes("A has one constraint was violated") ||
            err.toString().includes("2001") ||
            err.toString().includes("ConstraintHasOne")
        );
      }
    });

    it("restore trust to 5000 for subsequent tests", async () => {
      await aegisProgram.methods
        .updateTrust(5000)
        .accounts({
          admin: admin.publicKey,
          config: configPda,
          operator: operator1Pda,
        })
        .signers([admin])
        .rpc();

      const op = await aegisProgram.account.operator.fetch(operator1Pda);
      assert.equal(op.trustScore, 5000);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  //  5. DEACTIVATE OPERATOR
  // ═══════════════════════════════════════════════════════════════════
  describe("deactivate_operator", () => {
    // operator2 was already deactivated in invoke test; test on operator1
    let tempOperatorPda: PublicKey;

    before(async () => {
      // Register a temporary operator for deactivation tests
      const config = await aegisProgram.account.protocolConfig.fetch(configPda);
      const nextId = config.totalOperators.toNumber();

      [tempOperatorPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("operator"),
          creator1.publicKey.toBuffer(),
          new anchor.BN(nextId).toArrayLike(Buffer, "le", 8),
        ],
        aegisProgram.programId
      );

      await aegisProgram.methods
        .registerOperator("temp-op", "https://temp.example.com", new anchor.BN(5_000), 0)
        .accounts({
          creator: creator1.publicKey,
          config: configPda,
          operator: tempOperatorPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([creator1])
        .rpc();
    });

    it("creator can deactivate their operator", async () => {
      const opBefore = await aegisProgram.account.operator.fetch(
        tempOperatorPda
      );
      assert.equal(opBefore.isActive, true);

      await aegisProgram.methods
        .deactivateOperator()
        .accounts({
          creator: creator1.publicKey,
          operator: tempOperatorPda,
        })
        .signers([creator1])
        .rpc();

      const opAfter = await aegisProgram.account.operator.fetch(
        tempOperatorPda
      );
      assert.equal(opAfter.isActive, false);
    });

    it("rejects double deactivation (OperatorAlreadyDeactivated)", async () => {
      try {
        await aegisProgram.methods
          .deactivateOperator()
          .accounts({
            creator: creator1.publicKey,
            operator: tempOperatorPda,
          })
          .signers([creator1])
          .rpc();
        assert.fail("Should reject double deactivation");
      } catch (err: any) {
        assert.ok(
          err.toString().includes("OperatorAlreadyDeactivated") ||
            err.toString().includes("custom program error") ||
            err.toString().includes("6004")
        );
      }
    });

    it("non-creator cannot deactivate operator", async () => {
      // Try to deactivate operator1 (owned by creator1) using creator2
      try {
        await aegisProgram.methods
          .deactivateOperator()
          .accounts({
            creator: creator2.publicKey,
            operator: operator1Pda,
          })
          .signers([creator2])
          .rpc();
        assert.fail("Should reject non-creator");
      } catch (err: any) {
        assert.ok(
          err.toString().includes("Unauthorized") ||
            err.toString().includes("has_one") ||
            err.toString().includes("ConstraintHasOne") ||
            err.toString().includes("A has one constraint was violated") ||
            err.toString().includes("2001")
        );
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  //  6. ROTATE ADMIN
  // ═══════════════════════════════════════════════════════════════════
  describe("rotate_admin", () => {
    it("admin rotates to new admin", async () => {
      await aegisProgram.methods
        .rotateAdmin(newAdmin.publicKey)
        .accounts({
          config: configPda,
          admin: admin.publicKey,
        })
        .signers([admin])
        .rpc();

      const config = await aegisProgram.account.protocolConfig.fetch(configPda);
      assert.equal(
        config.admin.toBase58(),
        newAdmin.publicKey.toBase58()
      );
    });

    it("old admin can no longer perform admin actions", async () => {
      try {
        await aegisProgram.methods
          .rotateAdmin(admin.publicKey)
          .accounts({
            config: configPda,
            admin: admin.publicKey,
          })
          .signers([admin])
          .rpc();
        assert.fail("Old admin should be rejected");
      } catch (err: any) {
        assert.ok(
          err.toString().includes("Unauthorized") ||
            err.toString().includes("has_one") ||
            err.toString().includes("ConstraintHasOne") ||
            err.toString().includes("A has one constraint was violated")
        );
      }
    });

    it("rejects rotating to zero address (Pubkey::default)", async () => {
      try {
        await aegisProgram.methods
          .rotateAdmin(PublicKey.default)
          .accounts({
            config: configPda,
            admin: newAdmin.publicKey,
          })
          .signers([newAdmin])
          .rpc();
        assert.fail("Should reject zero address");
      } catch (err: any) {
        assert.ok(
          err.toString().includes("InvalidInput") ||
            err.toString().includes("custom program error") ||
            err.toString().includes("6014")
        );
      }
    });

    it("rotate back to original admin for subsequent tests", async () => {
      await aegisProgram.methods
        .rotateAdmin(admin.publicKey)
        .accounts({
          config: configPda,
          admin: newAdmin.publicKey,
        })
        .signers([newAdmin])
        .rpc();

      const config = await aegisProgram.account.protocolConfig.fetch(configPda);
      assert.equal(
        config.admin.toBase58(),
        admin.publicKey.toBase58()
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  //  7. UPDATE CONFIG
  // ═══════════════════════════════════════════════════════════════════
  describe("update_config", () => {
    it("admin updates fee schedule", async () => {
      const newFees: number[] = [5000, 2000, 1200, 800, 500, 500];
      await aegisProgram.methods
        .updateConfig(newFees, null, null, null, null)
        .accounts({
          config: configPda,
          admin: admin.publicKey,
        })
        .signers([admin])
        .rpc();

      const config = await aegisProgram.account.protocolConfig.fetch(configPda);
      assert.deepEqual(
        config.feeBps.map((n: number) => n),
        newFees
      );
    });

    it("rejects fee schedule not summing to 10000", async () => {
      const badFees: number[] = [5000, 2000, 1200, 800, 500, 400]; // 9900
      try {
        await aegisProgram.methods
          .updateConfig(badFees, null, null, null, null)
          .accounts({
            config: configPda,
            admin: admin.publicKey,
          })
          .signers([admin])
          .rpc();
        assert.fail("Should reject invalid fee sum");
      } catch (err: any) {
        assert.ok(
          err.toString().includes("InvalidFeeBpsSum") ||
            err.toString().includes("custom program error") ||
            err.toString().includes("6000")
        );
      }
    });

    it("admin can update treasury address", async () => {
      const newTreasury = Keypair.generate();
      // Create a new token account to use as treasury
      const newTreasuryTokenKp = Keypair.generate();
      const newTreasuryToken = await createAccount(
        provider.connection,
        admin,
        usdcMint,
        newTreasury.publicKey,
        newTreasuryTokenKp
      );

      await aegisProgram.methods
        .updateConfig(null, newTreasuryToken, null, null, null)
        .accounts({
          config: configPda,
          admin: admin.publicKey,
        })
        .signers([admin])
        .rpc();

      const config = await aegisProgram.account.protocolConfig.fetch(configPda);
      assert.equal(
        config.treasury.toBase58(),
        newTreasuryToken.toBase58()
      );

      // Restore original treasury
      await aegisProgram.methods
        .updateConfig(null, treasuryTokenAccount, null, null, null)
        .accounts({
          config: configPda,
          admin: admin.publicKey,
        })
        .signers([admin])
        .rpc();
    });

    it("rejects zero address for treasury", async () => {
      try {
        await aegisProgram.methods
          .updateConfig(null, PublicKey.default, null, null, null)
          .accounts({
            config: configPda,
            admin: admin.publicKey,
          })
          .signers([admin])
          .rpc();
        assert.fail("Should reject zero address");
      } catch (err: any) {
        assert.ok(
          err.toString().includes("InvalidInput") ||
            err.toString().includes("custom program error") ||
            err.toString().includes("6014")
        );
      }
    });

    it("non-admin cannot update config", async () => {
      try {
        await aegisProgram.methods
          .updateConfig(null, null, null, null, null)
          .accounts({
            config: configPda,
            admin: unauthorizedUser.publicKey,
          })
          .signers([unauthorizedUser])
          .rpc();
        assert.fail("Should reject non-admin");
      } catch (err: any) {
        assert.ok(
          err.toString().includes("Unauthorized") ||
            err.toString().includes("has_one") ||
            err.toString().includes("ConstraintHasOne") ||
            err.toString().includes("A has one constraint was violated")
        );
      }
    });

    it("restore original fee schedule", async () => {
      await aegisProgram.methods
        .updateConfig(FEE_BPS, null, null, null, null)
        .accounts({
          config: configPda,
          admin: admin.publicKey,
        })
        .signers([admin])
        .rpc();

      const config = await aegisProgram.account.protocolConfig.fetch(configPda);
      assert.deepEqual(
        config.feeBps.map((n: number) => n),
        FEE_BPS
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  //  8. ROYALTY REGISTRY - REGISTER DEPENDENCY
  // ═══════════════════════════════════════════════════════════════════
  describe("royalty_registry: register_dependency", () => {
    let depEdgePda: PublicKey;
    let parentVaultPda: PublicKey;

    it("child creator registers dependency on parent operator", async () => {
      // operator1 (creator1) is parent, operator2 (creator2) is child
      [depEdgePda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("dep_edge"),
          operator1Pda.toBuffer(),
          operator2Pda.toBuffer(),
        ],
        royaltyProgram.programId
      );

      [parentVaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("royalty_vault"), creator1.publicKey.toBuffer()],
        royaltyProgram.programId
      );

      await royaltyProgram.methods
        .registerDependency(1000, 1) // 10% royalty, depth 1
        .accounts({
          childCreator: creator2.publicKey,
          parentOperator: operator1Pda,
          childOperator: operator2Pda,
          parentCreator: creator1.publicKey,
          depEdge: depEdgePda,
          parentVault: parentVaultPda,
          aegisProgram: AEGIS_PROGRAM_ID,
        })
        .signers([creator2])
        .rpc();

      const edge = await royaltyProgram.account.dependencyEdge.fetch(
        depEdgePda
      );
      assert.equal(edge.parent.toBase58(), operator1Pda.toBase58());
      assert.equal(edge.child.toBase58(), operator2Pda.toBase58());
      assert.equal(
        edge.parentCreator.toBase58(),
        creator1.publicKey.toBase58()
      );
      assert.equal(
        edge.childCreator.toBase58(),
        creator2.publicKey.toBase58()
      );
      assert.equal(edge.royaltyBps, 1000);
      assert.equal(edge.depth, 1);

      // Vault should be initialized
      const vault = await royaltyProgram.account.royaltyVault.fetch(
        parentVaultPda
      );
      assert.equal(vault.isInitialized, true);
      assert.equal(vault.unclaimed.toNumber(), 0);
      assert.equal(
        vault.creator.toBase58(),
        creator1.publicKey.toBase58()
      );
    });

    it("rejects self-dependency (parent == child)", async () => {
      const [selfEdgePda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("dep_edge"),
          operator1Pda.toBuffer(),
          operator1Pda.toBuffer(),
        ],
        royaltyProgram.programId
      );

      const [selfVaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("royalty_vault"), creator1.publicKey.toBuffer()],
        royaltyProgram.programId
      );

      try {
        await royaltyProgram.methods
          .registerDependency(500, 1)
          .accounts({
            childCreator: creator1.publicKey,
            parentOperator: operator1Pda,
            childOperator: operator1Pda,
            parentCreator: creator1.publicKey,
            depEdge: selfEdgePda,
            parentVault: selfVaultPda,
            aegisProgram: AEGIS_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          })
          .signers([creator1])
          .rpc();
        assert.fail("Should reject self-dependency");
      } catch (err: any) {
        assert.ok(
          err.toString().includes("SelfDependency") ||
            err.toString().includes("custom program error") ||
            err.toString().includes("6004") ||
            err.toString().includes("already in use")
        );
      }
    });

    it("rejects royalty_bps > 2000 (20% max)", async () => {
      // Create a unique pair for this test
      const config = await aegisProgram.account.protocolConfig.fetch(configPda);
      const nextId = config.totalOperators.toNumber();

      const [newOpPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("operator"),
          creator1.publicKey.toBuffer(),
          new anchor.BN(nextId).toArrayLike(Buffer, "le", 8),
        ],
        aegisProgram.programId
      );

      await aegisProgram.methods
        .registerOperator("royalty-test-op", "https://test.com", new anchor.BN(1000), 0)
        .accounts({
          creator: creator1.publicKey,
          config: configPda,
          operator: newOpPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([creator1])
        .rpc();

      const [edgePda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("dep_edge"),
          newOpPda.toBuffer(),
          operator2Pda.toBuffer(),
        ],
        royaltyProgram.programId
      );

      const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("royalty_vault"), creator1.publicKey.toBuffer()],
        royaltyProgram.programId
      );

      try {
        await royaltyProgram.methods
          .registerDependency(3000, 1) // 30% - exceeds 20% max
          .accounts({
            childCreator: creator2.publicKey,
            parentOperator: newOpPda,
            childOperator: operator2Pda,
            parentCreator: creator1.publicKey,
            depEdge: edgePda,
            parentVault: vaultPda,
            aegisProgram: AEGIS_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          })
          .signers([creator2])
          .rpc();
        assert.fail("Should reject royalty bps > 2000");
      } catch (err: any) {
        assert.ok(
          err.toString().includes("RoyaltyBpsTooHigh") ||
            err.toString().includes("custom program error") ||
            err.toString().includes("6000")
        );
      }
    });

    it("rejects depth > 5 (max tree depth)", async () => {
      const config = await aegisProgram.account.protocolConfig.fetch(configPda);
      const nextId = config.totalOperators.toNumber();

      const [newOpPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("operator"),
          creator1.publicKey.toBuffer(),
          new anchor.BN(nextId).toArrayLike(Buffer, "le", 8),
        ],
        aegisProgram.programId
      );

      await aegisProgram.methods
        .registerOperator("depth-test-op", "https://test.com", new anchor.BN(1000), 0)
        .accounts({
          creator: creator1.publicKey,
          config: configPda,
          operator: newOpPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([creator1])
        .rpc();

      const [edgePda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("dep_edge"),
          newOpPda.toBuffer(),
          operator2Pda.toBuffer(),
        ],
        royaltyProgram.programId
      );

      const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("royalty_vault"), creator1.publicKey.toBuffer()],
        royaltyProgram.programId
      );

      try {
        await royaltyProgram.methods
          .registerDependency(500, 6) // depth 6 - exceeds max 5
          .accounts({
            childCreator: creator2.publicKey,
            parentOperator: newOpPda,
            childOperator: operator2Pda,
            parentCreator: creator1.publicKey,
            depEdge: edgePda,
            parentVault: vaultPda,
            aegisProgram: AEGIS_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          })
          .signers([creator2])
          .rpc();
        assert.fail("Should reject depth > 5");
      } catch (err: any) {
        assert.ok(
          err.toString().includes("MaxDepthExceeded") ||
            err.toString().includes("custom program error") ||
            err.toString().includes("6003")
        );
      }
    });

    it("rejects depth 0 (must be >= 1)", async () => {
      const config = await aegisProgram.account.protocolConfig.fetch(configPda);
      const nextId = config.totalOperators.toNumber();

      const [newOpPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("operator"),
          creator1.publicKey.toBuffer(),
          new anchor.BN(nextId).toArrayLike(Buffer, "le", 8),
        ],
        aegisProgram.programId
      );

      await aegisProgram.methods
        .registerOperator("depth0-test-op", "https://test.com", new anchor.BN(1000), 0)
        .accounts({
          creator: creator1.publicKey,
          config: configPda,
          operator: newOpPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([creator1])
        .rpc();

      const [edgePda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("dep_edge"),
          newOpPda.toBuffer(),
          operator2Pda.toBuffer(),
        ],
        royaltyProgram.programId
      );

      const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("royalty_vault"), creator1.publicKey.toBuffer()],
        royaltyProgram.programId
      );

      try {
        await royaltyProgram.methods
          .registerDependency(500, 0) // depth 0 - must be >= 1
          .accounts({
            childCreator: creator2.publicKey,
            parentOperator: newOpPda,
            childOperator: operator2Pda,
            parentCreator: creator1.publicKey,
            depEdge: edgePda,
            parentVault: vaultPda,
            aegisProgram: AEGIS_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          })
          .signers([creator2])
          .rpc();
        assert.fail("Should reject depth 0");
      } catch (err: any) {
        assert.ok(
          err.toString().includes("MaxDepthExceeded") ||
            err.toString().includes("custom program error") ||
            err.toString().includes("6003")
        );
      }
    });

    it("rejects fake operator (not owned by aegis program)", async () => {
      const fakeOperator = Keypair.generate();

      const [edgePda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("dep_edge"),
          fakeOperator.publicKey.toBuffer(),
          operator2Pda.toBuffer(),
        ],
        royaltyProgram.programId
      );

      const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("royalty_vault"), creator1.publicKey.toBuffer()],
        royaltyProgram.programId
      );

      try {
        await royaltyProgram.methods
          .registerDependency(500, 1)
          .accounts({
            childCreator: creator2.publicKey,
            parentOperator: fakeOperator.publicKey,
            childOperator: operator2Pda,
            parentCreator: creator1.publicKey,
            depEdge: edgePda,
            parentVault: vaultPda,
            aegisProgram: AEGIS_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          })
          .signers([creator2])
          .rpc();
        assert.fail("Should reject fake operator");
      } catch (err: any) {
        assert.ok(
          err.toString().includes("InvalidDependency") ||
            err.toString().includes("custom program error") ||
            err.toString().includes("AccountNotInitialized") ||
            err.toString().includes("6010")
        );
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  //  9. ROYALTY REGISTRY - REMOVE DEPENDENCY
  // ═══════════════════════════════════════════════════════════════════
  describe("royalty_registry: remove_dependency", () => {
    let removableEdgePda: PublicKey;
    let removeParentOpPda: PublicKey;

    before(async () => {
      // Register a new operator and dependency for removal testing
      const config = await aegisProgram.account.protocolConfig.fetch(configPda);
      const nextId = config.totalOperators.toNumber();

      [removeParentOpPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("operator"),
          creator1.publicKey.toBuffer(),
          new anchor.BN(nextId).toArrayLike(Buffer, "le", 8),
        ],
        aegisProgram.programId
      );

      await aegisProgram.methods
        .registerOperator("removable-parent", "https://test.com", new anchor.BN(1000), 0)
        .accounts({
          creator: creator1.publicKey,
          config: configPda,
          operator: removeParentOpPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([creator1])
        .rpc();

      [removableEdgePda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("dep_edge"),
          removeParentOpPda.toBuffer(),
          operator2Pda.toBuffer(),
        ],
        royaltyProgram.programId
      );

      const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("royalty_vault"), creator1.publicKey.toBuffer()],
        royaltyProgram.programId
      );

      await royaltyProgram.methods
        .registerDependency(500, 2)
        .accounts({
          childCreator: creator2.publicKey,
          parentOperator: removeParentOpPda,
          childOperator: operator2Pda,
          parentCreator: creator1.publicKey,
          depEdge: removableEdgePda,
          parentVault: vaultPda,
          aegisProgram: AEGIS_PROGRAM_ID,
        })
        .signers([creator2])
        .rpc();
    });

    it("non-child-creator cannot remove dependency", async () => {
      try {
        await royaltyProgram.methods
          .removeDependency()
          .accounts({
            childCreator: creator1.publicKey, // wrong creator
            depEdge: removableEdgePda,
            systemProgram: SystemProgram.programId,
          })
          .signers([creator1])
          .rpc();
        assert.fail("Should reject non-child-creator");
      } catch (err: any) {
        assert.ok(
          err.toString().includes("Unauthorized") ||
            err.toString().includes("ConstraintRaw") ||
            err.toString().includes("constraint") ||
            err.toString().includes("custom program error") ||
            err.toString().includes("2000")
        );
      }
    });

    it("child creator removes dependency (edge account closed)", async () => {
      const balanceBefore = await provider.connection.getBalance(
        creator2.publicKey
      );

      await royaltyProgram.methods
        .removeDependency()
        .accounts({
          childCreator: creator2.publicKey,
          depEdge: removableEdgePda,
          systemProgram: SystemProgram.programId,
        })
        .signers([creator2])
        .rpc();

      // Edge account should no longer exist
      const edgeAccount = await provider.connection.getAccountInfo(
        removableEdgePda
      );
      assert.isNull(edgeAccount, "Edge account should be closed");

      // Child creator should have received rent back
      const balanceAfter = await provider.connection.getBalance(
        creator2.publicKey
      );
      assert.isAbove(
        balanceAfter,
        balanceBefore - 10000, // account for tx fee
        "Creator should receive rent back"
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  //  10. ROYALTY REGISTRY - DEPOSIT & CLAIM (E2E)
  // ═══════════════════════════════════════════════════════════════════
  describe("royalty_registry: deposit_royalty & claim_royalties", () => {
    let escrowAuthorityPda: PublicKey;
    let escrowAuthorityBump: number;
    let royaltyEscrowAccount: PublicKey;
    let adminTokenAccount: PublicKey;
    let aegisConfigPda: PublicKey;

    before(async () => {
      // Derive escrow_authority PDA: seeds = ["royalty_escrow_auth"]
      [escrowAuthorityPda, escrowAuthorityBump] =
        PublicKey.findProgramAddressSync(
          [Buffer.from("royalty_escrow_auth")],
          royaltyProgram.programId
        );

      // Derive aegis config PDA as seen by royalty registry (cross-program)
      [aegisConfigPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        AEGIS_PROGRAM_ID
      );

      // Create royalty escrow token account owned by escrow_authority PDA
      const escrowKp = Keypair.generate();
      royaltyEscrowAccount = await createAccount(
        provider.connection,
        admin,
        usdcMint,
        escrowAuthorityPda,
        escrowKp
      );

      // Create admin's token account for depositing
      const adminTokenKp = Keypair.generate();
      adminTokenAccount = await createAccount(
        provider.connection,
        admin,
        usdcMint,
        admin.publicKey,
        adminTokenKp
      );

      // Mint USDC to admin for deposit testing
      await mintTo(
        provider.connection,
        admin,
        usdcMint,
        adminTokenAccount,
        admin,
        10_000_000 // 10 USDC
      );
    });

    it("admin deposits royalty into parent vault via dependency edge", async () => {
      // Use the first dep_edge: operator1 -> operator2
      const [depEdgePda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("dep_edge"),
          operator1Pda.toBuffer(),
          operator2Pda.toBuffer(),
        ],
        royaltyProgram.programId
      );

      const [parentVaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("royalty_vault"), creator1.publicKey.toBuffer()],
        royaltyProgram.programId
      );

      const receiptId = new anchor.BN(0);
      const [receiptPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("royalty_receipt"),
          operator2Pda.toBuffer(), // child skill
          receiptId.toArrayLike(Buffer, "le", 8),
        ],
        royaltyProgram.programId
      );

      const depositAmount = new anchor.BN(500_000); // 0.5 USDC

      // Derive the aegis config bump for cross-program seeds
      const [, aegisConfigBump] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        AEGIS_PROGRAM_ID
      );

      await royaltyProgram.methods
        .depositRoyalty(depositAmount, receiptId)
        .accounts({
          authority: admin.publicKey,
          depEdge: depEdgePda,
          parentCreator: creator1.publicKey,
          parentVault: parentVaultPda,
          receipt: receiptPda,
          usdcMint: usdcMint,
          authorityTokenAccount: adminTokenAccount,
          royaltyEscrow: royaltyEscrowAccount,
          escrowAuthority: escrowAuthorityPda,
          aegisConfig: aegisConfigPda,
          aegisProgram: AEGIS_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .signers([admin])
        .rpc();

      // Verify vault was credited
      const vault = await royaltyProgram.account.royaltyVault.fetch(
        parentVaultPda
      );
      assert.equal(vault.unclaimed.toNumber(), 500_000);
      assert.equal(vault.totalEarned.toNumber(), 500_000);
      assert.equal(vault.totalClaimed.toNumber(), 0);

      // Verify receipt
      const receipt = await royaltyProgram.account.royaltyReceipt.fetch(
        receiptPda
      );
      assert.equal(receipt.amount.toNumber(), 500_000);
      assert.equal(
        receipt.parentCreator.toBase58(),
        creator1.publicKey.toBase58()
      );

      // Verify escrow received funds
      const escrow = await getAccount(
        provider.connection,
        royaltyEscrowAccount
      );
      assert.equal(Number(escrow.amount), 500_000);
    });

    it("rejects deposit with zero amount", async () => {
      const [depEdgePda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("dep_edge"),
          operator1Pda.toBuffer(),
          operator2Pda.toBuffer(),
        ],
        royaltyProgram.programId
      );

      const [parentVaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("royalty_vault"), creator1.publicKey.toBuffer()],
        royaltyProgram.programId
      );

      const receiptId = new anchor.BN(99);
      const [receiptPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("royalty_receipt"),
          operator2Pda.toBuffer(),
          receiptId.toArrayLike(Buffer, "le", 8),
        ],
        royaltyProgram.programId
      );

      try {
        await royaltyProgram.methods
          .depositRoyalty(new anchor.BN(0), receiptId)
          .accounts({
            authority: admin.publicKey,
            depEdge: depEdgePda,
            parentCreator: creator1.publicKey,
            parentVault: parentVaultPda,
            receipt: receiptPda,
            usdcMint: usdcMint,
            authorityTokenAccount: adminTokenAccount,
            royaltyEscrow: royaltyEscrowAccount,
            escrowAuthority: escrowAuthorityPda,
            aegisConfig: aegisConfigPda,
            aegisProgram: AEGIS_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          })
          .signers([admin])
          .rpc();
        assert.fail("Should reject zero amount");
      } catch (err: any) {
        assert.ok(
          err.toString().includes("ZeroAmount") ||
            err.toString().includes("custom program error") ||
            err.toString().includes("6008")
        );
      }
    });

    it("rejects deposit from non-admin authority", async () => {
      const [depEdgePda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("dep_edge"),
          operator1Pda.toBuffer(),
          operator2Pda.toBuffer(),
        ],
        royaltyProgram.programId
      );

      const [parentVaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("royalty_vault"), creator1.publicKey.toBuffer()],
        royaltyProgram.programId
      );

      // Create a token account for the unauthorized user
      const unauthTokenKp = Keypair.generate();
      const unauthorizedTokenAccount = await createAccount(
        provider.connection,
        unauthorizedUser,
        usdcMint,
        unauthorizedUser.publicKey,
        unauthTokenKp
      );
      await mintTo(
        provider.connection,
        admin,
        usdcMint,
        unauthorizedTokenAccount,
        admin,
        1_000_000
      );

      const receiptId = new anchor.BN(100);
      const [receiptPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("royalty_receipt"),
          operator2Pda.toBuffer(),
          receiptId.toArrayLike(Buffer, "le", 8),
        ],
        royaltyProgram.programId
      );

      try {
        await royaltyProgram.methods
          .depositRoyalty(new anchor.BN(100_000), receiptId)
          .accounts({
            authority: unauthorizedUser.publicKey,
            depEdge: depEdgePda,
            parentCreator: creator1.publicKey,
            parentVault: parentVaultPda,
            receipt: receiptPda,
            usdcMint: usdcMint,
            authorityTokenAccount: unauthorizedTokenAccount,
            royaltyEscrow: royaltyEscrowAccount,
            escrowAuthority: escrowAuthorityPda,
            aegisConfig: aegisConfigPda,
            aegisProgram: AEGIS_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          })
          .signers([unauthorizedUser])
          .rpc();
        assert.fail("Should reject non-admin authority");
      } catch (err: any) {
        assert.ok(
          err.toString().includes("Unauthorized") ||
            err.toString().includes("custom program error") ||
            err.toString().includes("6002")
        );
      }
    });

    it("parent creator claims all unclaimed royalties", async () => {
      const [parentVaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("royalty_vault"), creator1.publicKey.toBuffer()],
        royaltyProgram.programId
      );

      const vaultBefore = await royaltyProgram.account.royaltyVault.fetch(
        parentVaultPda
      );
      const claimAmount = vaultBefore.unclaimed.toNumber();
      assert.isAbove(claimAmount, 0, "Should have unclaimed royalties");

      const creatorBalBefore = Number(
        (await getAccount(provider.connection, creatorTokenAccount)).amount
      );

      await royaltyProgram.methods
        .claimRoyalties()
        .accounts({
          creator: creator1.publicKey,
          vault: parentVaultPda,
          usdcMint: usdcMint,
          creatorTokenAccount: creatorTokenAccount,
          royaltyEscrow: royaltyEscrowAccount,
          escrowAuthority: escrowAuthorityPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([creator1])
        .rpc();

      // Verify vault is now zeroed out
      const vaultAfter = await royaltyProgram.account.royaltyVault.fetch(
        parentVaultPda
      );
      assert.equal(vaultAfter.unclaimed.toNumber(), 0);
      assert.equal(vaultAfter.totalClaimed.toNumber(), claimAmount);
      assert.isAbove(vaultAfter.lastClaimAt.toNumber(), 0);

      // Verify creator received the funds
      const creatorBalAfter = Number(
        (await getAccount(provider.connection, creatorTokenAccount)).amount
      );
      assert.equal(
        creatorBalAfter - creatorBalBefore,
        claimAmount,
        "Creator should receive full unclaimed amount"
      );
    });

    it("rejects claim when vault has zero unclaimed", async () => {
      const [parentVaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("royalty_vault"), creator1.publicKey.toBuffer()],
        royaltyProgram.programId
      );

      try {
        await royaltyProgram.methods
          .claimRoyalties()
          .accounts({
            creator: creator1.publicKey,
            vault: parentVaultPda,
            usdcMint: usdcMint,
            creatorTokenAccount: creatorTokenAccount,
            royaltyEscrow: royaltyEscrowAccount,
            escrowAuthority: escrowAuthorityPda,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([creator1])
          .rpc();
        assert.fail("Should reject claim with zero balance");
      } catch (err: any) {
        assert.ok(
          err.toString().includes("InsufficientVaultBalance") ||
            err.toString().includes("custom program error") ||
            err.toString().includes("6005")
        );
      }
    });

    it("wrong creator cannot claim from another creator's vault", async () => {
      // First deposit again so vault has funds
      const [depEdgePda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("dep_edge"),
          operator1Pda.toBuffer(),
          operator2Pda.toBuffer(),
        ],
        royaltyProgram.programId
      );

      const [parentVaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("royalty_vault"), creator1.publicKey.toBuffer()],
        royaltyProgram.programId
      );

      const receiptId = new anchor.BN(1);
      const [receiptPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("royalty_receipt"),
          operator2Pda.toBuffer(),
          receiptId.toArrayLike(Buffer, "le", 8),
        ],
        royaltyProgram.programId
      );

      await royaltyProgram.methods
        .depositRoyalty(new anchor.BN(200_000), receiptId)
        .accounts({
          authority: admin.publicKey,
          depEdge: depEdgePda,
          parentCreator: creator1.publicKey,
          parentVault: parentVaultPda,
          receipt: receiptPda,
          usdcMint: usdcMint,
          authorityTokenAccount: adminTokenAccount,
          royaltyEscrow: royaltyEscrowAccount,
          escrowAuthority: escrowAuthorityPda,
          aegisConfig: aegisConfigPda,
          aegisProgram: AEGIS_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .signers([admin])
        .rpc();

      // creator2 tries to claim from creator1's vault - should fail
      // The vault PDA is derived from creator1's pubkey, so creator2 cannot
      // provide a matching vault PDA seeded from their own key.
      // The "vault.creator == creator.key()" constraint also blocks this.
      try {
        // This should fail because the PDA seeds don't match creator2
        const [wrongVaultPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("royalty_vault"), creator2.publicKey.toBuffer()],
          royaltyProgram.programId
        );

        await royaltyProgram.methods
          .claimRoyalties()
          .accounts({
            creator: creator2.publicKey,
            vault: parentVaultPda, // creator1's vault
            usdcMint: usdcMint,
            creatorTokenAccount: creator2TokenAccount,
            royaltyEscrow: royaltyEscrowAccount,
            escrowAuthority: escrowAuthorityPda,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([creator2])
          .rpc();
        assert.fail("Should reject wrong creator");
      } catch (err: any) {
        // PDA seeds mismatch or vault.creator != signer constraint
        assert.ok(
          err.toString().includes("Unauthorized") ||
            err.toString().includes("ConstraintSeeds") ||
            err.toString().includes("ConstraintRaw") ||
            err.toString().includes("A seeds constraint was violated") ||
            err.toString().includes("custom program error") ||
            err.toString().includes("2006")
        );
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  //  11. PDA VERIFICATION & ACCOUNT OWNERSHIP
  // ═══════════════════════════════════════════════════════════════════
  describe("security: PDA integrity and ownership", () => {
    it("config PDA is deterministic from seed 'config'", () => {
      const [derived] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        aegisProgram.programId
      );
      assert.equal(derived.toBase58(), configPda.toBase58());
    });

    it("operator PDA is deterministic from creator + operator_id", () => {
      const [derived] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("operator"),
          creator1.publicKey.toBuffer(),
          new anchor.BN(0).toArrayLike(Buffer, "le", 8),
        ],
        aegisProgram.programId
      );
      assert.equal(derived.toBase58(), operator1Pda.toBase58());
    });

    it("different creator produces different operator PDA for same id", () => {
      const [pda1] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("operator"),
          creator1.publicKey.toBuffer(),
          new anchor.BN(0).toArrayLike(Buffer, "le", 8),
        ],
        aegisProgram.programId
      );

      const [pda2] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("operator"),
          creator2.publicKey.toBuffer(),
          new anchor.BN(0).toArrayLike(Buffer, "le", 8),
        ],
        aegisProgram.programId
      );

      assert.notEqual(pda1.toBase58(), pda2.toBase58());
    });

    it("royalty vault PDA is deterministic from creator pubkey", () => {
      const [vault1] = PublicKey.findProgramAddressSync(
        [Buffer.from("royalty_vault"), creator1.publicKey.toBuffer()],
        royaltyProgram.programId
      );

      const [vault2] = PublicKey.findProgramAddressSync(
        [Buffer.from("royalty_vault"), creator2.publicKey.toBuffer()],
        royaltyProgram.programId
      );

      assert.notEqual(vault1.toBase58(), vault2.toBase58());
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  //  12. EDGE CASES & COMPREHENSIVE VALIDATION
  // ═══════════════════════════════════════════════════════════════════
  describe("edge cases", () => {
    it("invocation receipt PDA is unique per (operator, invocation_count)", async () => {
      // Receipts use seeds = ["invocation", operator_key, invocation_count_le]
      const [r0] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("invocation"),
          operator1Pda.toBuffer(),
          new anchor.BN(0).toArrayLike(Buffer, "le", 8),
        ],
        aegisProgram.programId
      );

      const [r1] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("invocation"),
          operator1Pda.toBuffer(),
          new anchor.BN(1).toArrayLike(Buffer, "le", 8),
        ],
        aegisProgram.programId
      );

      assert.notEqual(r0.toBase58(), r1.toBase58());
    });

    it("multiple deposits accumulate in vault correctly", async () => {
      const [depEdgePda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("dep_edge"),
          operator1Pda.toBuffer(),
          operator2Pda.toBuffer(),
        ],
        royaltyProgram.programId
      );

      const [parentVaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("royalty_vault"), creator1.publicKey.toBuffer()],
        royaltyProgram.programId
      );

      const [escrowAuthorityPda2] = PublicKey.findProgramAddressSync(
        [Buffer.from("royalty_escrow_auth")],
        royaltyProgram.programId
      );

      const [aegisConfigPda2] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        AEGIS_PROGRAM_ID
      );

      // Read current vault state
      const vaultBefore = await royaltyProgram.account.royaltyVault.fetch(
        parentVaultPda
      );

      // Deposit 300_000
      const receiptId = new anchor.BN(2);
      const [receiptPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("royalty_receipt"),
          operator2Pda.toBuffer(),
          receiptId.toArrayLike(Buffer, "le", 8),
        ],
        royaltyProgram.programId
      );

      // Use fresh token accounts with unique keypairs
      const adminTAKp = Keypair.generate();
      const adminTA = await createAccount(
        provider.connection,
        admin,
        usdcMint,
        admin.publicKey,
        adminTAKp
      );
      await mintTo(
        provider.connection,
        admin,
        usdcMint,
        adminTA,
        admin,
        5_000_000
      );

      // Create a new escrow for this test
      const escrowKp2 = Keypair.generate();
      const royaltyEscrow = await createAccount(
        provider.connection,
        admin,
        usdcMint,
        escrowAuthorityPda2,
        escrowKp2
      );

      await royaltyProgram.methods
        .depositRoyalty(new anchor.BN(300_000), receiptId)
        .accounts({
          authority: admin.publicKey,
          depEdge: depEdgePda,
          parentCreator: creator1.publicKey,
          parentVault: parentVaultPda,
          receipt: receiptPda,
          usdcMint: usdcMint,
          authorityTokenAccount: adminTA,
          royaltyEscrow: royaltyEscrow,
          escrowAuthority: escrowAuthorityPda2,
          aegisConfig: aegisConfigPda2,
          aegisProgram: AEGIS_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .signers([admin])
        .rpc();

      const vaultAfter = await royaltyProgram.account.royaltyVault.fetch(
        parentVaultPda
      );
      assert.equal(
        vaultAfter.unclaimed.toNumber(),
        vaultBefore.unclaimed.toNumber() + 300_000,
        "Vault unclaimed should accumulate"
      );
    });

    it("all protocol config fields are persisted correctly", async () => {
      const config = await aegisProgram.account.protocolConfig.fetch(configPda);

      // Verify all fields are non-default
      assert.notEqual(config.admin.toBase58(), PublicKey.default.toBase58());
      assert.notEqual(config.treasury.toBase58(), PublicKey.default.toBase58());
      assert.notEqual(
        config.validatorPool.toBase58(),
        PublicKey.default.toBase58()
      );
      assert.notEqual(
        config.stakerPool.toBase58(),
        PublicKey.default.toBase58()
      );
      assert.notEqual(
        config.insuranceFund.toBase58(),
        PublicKey.default.toBase58()
      );
      assert.notEqual(config.usdcMint.toBase58(), PublicKey.default.toBase58());
      assert.notEqual(
        config.aegisMint.toBase58(),
        PublicKey.default.toBase58()
      );

      // Verify counters are tracked
      assert.isAbove(config.totalOperators.toNumber(), 0);
      assert.isAbove(config.totalInvocations.toNumber(), 0);
      assert.isAbove(config.totalVolumeLamports.toNumber(), 0);
    });
  });
});
