import { Composition } from "remotion";
import { Animado, AnimadoProps, animadoDuration } from "./Animado/Animado";
import { Anuncio, ANUNCIO_DURATION } from "./Anuncio/Anuncio";
import { QP_DURATION, QuePrefieres } from "./QuePrefieres/QuePrefieres";
import { defaultReelProps, Reel, ReelProps } from "./Reel/Reel";
import { Clips, ClipsProps, clipsDuration, defaultClipsProps } from "./Clips/Clips";
import { defaultReel2Props, Reel2, Reel2Props, reel2Duration } from "./Reel2/Reel2";
import { DURATION, FPS, H, W } from "./Lumora/common";
import { Video1 } from "./Lumora/Video1";
import { Video2 } from "./Lumora/Video2";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Animado"
        component={Animado}
        durationInFrames={300}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{ producto: "atardecer", escenas: [{ tipo: "gancho", dur: 90, lineas: [{ text: "¿Tu habitación" }, { text: "se ve así?", bg: "#c9ccd4", color: "#1a1d24" }] }] } as AnimadoProps}
        calculateMetadata={({ props }: { props: AnimadoProps }) => ({ durationInFrames: Math.max(1, animadoDuration(props)) })}
      />
      <Composition
        id="Clips"
        component={Clips}
        durationInFrames={240}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={defaultClipsProps}
        calculateMetadata={({ props }: { props: ClipsProps }) => ({ durationInFrames: Math.max(1, clipsDuration(props)) })}
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
