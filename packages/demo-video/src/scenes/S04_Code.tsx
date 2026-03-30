import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { t, text } from "../theme";

/**
 * S04 — The actual code. Two panels side by side.
 * Left: Anchor/Rust (the on-chain program)
 * Right: TypeScript (the gateway)
 * Lines appear one by one. Real code, not pseudocode.
 */

const RUST_LINES = [
  { text: "pub fn invoke_skill(", color: t.t70 },
  { text: "    ctx: Context<InvokeSkill>,", color: t.t30 },
  { text: ") -> Result<()> {", color: t.t70 },
  { text: "    let operator = &mut ctx.accounts.operator;", color: t.t30 },
  { text: "    let price = operator.price_lamports;", color: t.t30 },
  { text: "", color: t.t08 },
  { text: "    // 60% creator | 15% validator | 12% treasury | 8% safety | 3% referrer | 2% burn", color: t.t15 },
  { text: "    let creator_share = price", color: t.t50 },
  { text: "        .checked_mul(config.fee_bps[0] as u64).unwrap()", color: t.t50 },
  { text: "        .checked_div(10_000).unwrap();", color: t.t50 },
  { text: "", color: t.t08 },
  { text: "    // SPL Token transfer → creator", color: t.t15 },
  { text: "    token::transfer(", color: t.t70 },
  { text: '        CpiContext::new(token_program, Transfer {', color: t.t30 },
  { text: "            from: caller_token.to_account_info(),", color: t.t30 },
  { text: "            to: creator_token.to_account_info(),", color: t.t30 },
  { text: "            authority: caller.to_account_info(),", color: t.t30 },
  { text: "        }),", color: t.t30 },
  { text: "        creator_share,", color: t.t50 },
  { text: "    )?;", color: t.t70 },
  { text: "", color: t.t08 },
  { text: "    operator.total_invocations += 1;", color: t.t50 },
  { text: '    emit!(SkillInvoked { operator_id, caller, amount: price });', color: t.t50 },
  { text: "    Ok(())", color: t.t70 },
  { text: "}", color: t.t70 },
];

const TS_LINES = [
  { text: "// x402 Payment Gateway", color: t.t15 },
  { text: "app.post('/v1/invoke/:slug', async (req, res) => {", color: t.t70 },
  { text: "  const payment = req.headers['x-payment-signature'];", color: t.t50 },
  { text: "", color: t.t08 },
  { text: "  if (!payment) {", color: t.t30 },
  { text: "    return res.status(402).header(", color: t.t50 },
  { text: "      'X-Payment-Required',", color: t.t50 },
  { text: "      JSON.stringify({", color: t.t30 },
  { text: '        amount: operator.pricePerCall,', color: t.t30 },
  { text: "        currency: 'USDC',", color: t.t30 },
  { text: "        network: 'solana',", color: t.t30 },
  { text: "      })", color: t.t30 },
  { text: "    ).send();", color: t.t50 },
  { text: "  }", color: t.t30 },
  { text: "", color: t.t08 },
  { text: "  // Verify on-chain payment", color: t.t15 },
  { text: "  const verified = await verifyUSDC(payment);", color: t.t70 },
  { text: "  const result = await forwardToOperator(req);", color: t.t70 },
  { text: "  const score = scoreQuality(result);", color: t.t50 },
  { text: "", color: t.t08 },
  { text: "  // Distribute fees via Anchor program", color: t.t15 },
  { text: "  await program.methods.invokeSkill()", color: t.t50 },
  { text: "    .accounts({ operator, caller, treasury })", color: t.t30 },
  { text: "    .rpc();", color: t.t50 },
  { text: "});", color: t.t70 },
];

function CodePanel({
  title,
  lang,
  lines,
  frame,
  startFrame,
}: {
  title: string;
  lang: string;
  lines: { text: string; color: string }[];
  frame: number;
  startFrame: number;
}) {
  const panelOp = interpolate(frame, [startFrame, startFrame + 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        flex: 1,
        opacity: panelOp,
        border: `1px solid ${t.border}`,
        background: t.card,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Title bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 16px",
          borderBottom: `1px solid ${t.border}`,
        }}
      >
        <span style={{ fontFamily: t.mono, fontSize: 12, color: t.t30 }}>{title}</span>
        <span style={{ fontFamily: t.mono, fontSize: 10, color: t.t15 }}>{lang}</span>
      </div>

      {/* Code */}
      <div style={{ padding: "14px 18px", flex: 1 }}>
        {lines.map((line, i) => {
          const lineStart = startFrame + 10 + i * 5;
          const lineOp = interpolate(frame, [lineStart, lineStart + 8], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={i}
              style={{
                opacity: lineOp,
                fontFamily: t.mono,
                fontSize: 13.5,
                lineHeight: 1.65,
                color: line.color,
                whiteSpace: "pre",
              }}
            >
              {line.text || "\u00A0"}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const S04_Code: React.FC = () => {
  const frame = useCurrentFrame();

  const headerOp = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const exit = interpolate(frame, [335, 360], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: t.bg, padding: "80px 100px", opacity: exit }}>
      {/* Header */}
      <div style={{ opacity: headerOp, marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={text.label}>The code</span>
        <span style={{ ...text.label, color: t.t15 }}>On-chain program + Gateway</span>
      </div>

      {/* Two code panels */}
      <div style={{ display: "flex", gap: 20, flex: 1 }}>
        <CodePanel
          title="programs/aegis/src/invoke_skill.rs"
          lang="Rust / Anchor"
          lines={RUST_LINES}
          frame={frame}
          startFrame={5}
        />
        <CodePanel
          title="packages/gateway/src/routes/invoke.ts"
          lang="TypeScript / Fastify"
          lines={TS_LINES}
          frame={frame}
          startFrame={60}
        />
      </div>
    </AbsoluteFill>
  );
};
