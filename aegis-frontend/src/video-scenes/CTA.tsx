import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { colors as c, fonts as f, headline, body, AEGIS_ICON, sceneBase, container, appear } from "./tokens";

/** Scene 12: CTA / CLOSE. 3s (90 frames) */

export const CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const exit = interpolate(frame, [78, 90], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ ...sceneBase, opacity: exit }}>
      <div style={{
        ...container,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}>
        {/* Shield icon */}
        <div style={{
          width: 64,
          height: 64,
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...appear(frame, 3),
        }}>
          <svg width={64} height={64} viewBox="0 0 3797 3797">
            <path d={AEGIS_ICON} fill="white" fillOpacity={0.9} />
          </svg>
        </div>

        {/* Title */}
        <div style={{
          ...headline,
          fontSize: 56,
          fontWeight: f.weight.regular,
          marginBottom: 0,
          ...appear(frame, 10),
        }}>
          aegisplace.com
        </div>

        {/* Subtitle */}
        <div style={{
          fontFamily: f.family,
          fontSize: 18,
          fontWeight: f.weight.regular,
          marginTop: 16,
          color: "rgba(255,255,255,0.40)",
          ...appear(frame, 16),
        }}>
          Build skills. Agents pay. You earn.
        </div>
      </div>
    </AbsoluteFill>
  );
};
