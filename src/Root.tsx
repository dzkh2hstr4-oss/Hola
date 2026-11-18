import { Composition } from "remotion";
import { Anuncio, ANUNCIO_DURATION } from "./Anuncio/Anuncio";
import { QP_DURATION, QuePrefieres } from "./QuePrefieres/QuePrefieres";
import { defaultReelProps, Reel, ReelProps } from "./Reel/Reel";
import { DURATION, FPS, H, W } from "./Lumora/common";
import { Video1 } from "./Lumora/Video1";
import { Video2 } from "./Lumora/Video2";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Reel"
        component={Reel}
        durationInFrames={300}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={defaultReelProps}
        calculateMetadata={({ props }: { props: ReelProps }) => ({
          durationInFrames: props.scenes.length ? props.scenes[props.scenes.length - 1].to : 300,
        })}
      />
      <Composition
        id="Que-Prefieres"
        component={QuePrefieres}
        durationInFrames={QP_DURATION}
        fps={FPS}
        width={W}
        height={H}
      />
      <Composition
        id="Anuncio-Navidad"
        component={Anuncio}
        durationInFrames={ANUNCIO_DURATION}
        fps={FPS}
        width={W}
        height={H}
      />
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
