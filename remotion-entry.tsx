import { registerRoot, Composition } from "remotion";
import { AegisVideo } from "./client/src/video-scenes/AegisVideo";

const Root = () => (
  <Composition
    id="AegisVideo"
    component={AegisVideo}
    width={1920}
    height={1080}
    fps={30}
    durationInFrames={1680}
  />
);

registerRoot(Root);
