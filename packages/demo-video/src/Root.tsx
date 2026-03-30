import { Composition } from "remotion";
import { AegisDemo } from "./AegisDemo";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="AegisDemo"
      component={AegisDemo}
      durationInFrames={1650}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
