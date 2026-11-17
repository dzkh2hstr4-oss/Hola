import { Composition } from "remotion";
import { DURATION, FPS, H, W } from "./Lumora/common";
import { Video1 } from "./Lumora/Video1";
import { Video2 } from "./Lumora/Video2";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Video1-CambiaTuCuarto"
        component={Video1}
        durationInFrames={DURATION}
        fps={FPS}
        width={W}
        height={H}
      />
      <Composition
        id="Video2-RegaloNavidad"
        component={Video2}
        durationInFrames={DURATION}
        fps={FPS}
        width={W}
        height={H}
      />
    </>
  );
};
