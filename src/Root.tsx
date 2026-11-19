import { Composition } from "remotion";
import { G_FPS, G_H, G_W, Golpe, GOLPE_DURATION } from "./Golpe/Golpe";
import { calcLyricMetadata, defaultLyricProps, LV_FPS, LV_H, LV_W, LyricVideo } from "./Letras/LyricVideo";
import { Anuncio, ANUNCIO_DURATION } from "./Anuncio/Anuncio";
import { QP_DURATION, QuePrefieres } from "./QuePrefieres/QuePrefieres";
import { defaultReelProps, Reel, ReelProps } from "./Reel/Reel";
import { defaultReel2Props, Reel2, Reel2Props, reel2Duration } from "./Reel2/Reel2";
import { DURATION, FPS, H, W } from "./Lumora/common";
import { Video1 } from "./Lumora/Video1";
import { Video2 } from "./Lumora/Video2";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="ElGolpeDelBalonDeOro" component={Golpe} durationInFrames={GOLPE_DURATION} fps={G_FPS} width={G_W} height={G_H} />
      <Composition
        id="VideoLetra"
        component={LyricVideo}
        durationInFrames={900}
        fps={LV_FPS}
        width={LV_W}
        height={LV_H}
        defaultProps={defaultLyricProps}
        calculateMetadata={calcLyricMetadata}
      />
      <Composition
        id="Reel2"
        component={Reel2}
        durationInFrames={200}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={defaultReel2Props}
        calculateMetadata={({ props }: { props: Reel2Props }) => ({ durationInFrames: reel2Duration(props.beats) })}
      />
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
