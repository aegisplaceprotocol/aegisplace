import { Composition } from "remotion";
import { AegisDemo } from "./AegisDemo";
import { SkillCreatorVideo } from "./scenes/S07_SkillCreator";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="AegisDemo"
        component={AegisDemo}
        durationInFrames={1650}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="SkillCreator"
        component={SkillCreatorVideo}
        durationInFrames={1035}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
