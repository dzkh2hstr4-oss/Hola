import { Composition } from "remotion";
import { GTA6Short, GTA6Props, gta6Duration } from "./GTA6/GTA6Short";
import short1 from "../content/gta6/short1.json";
import { GTA6Long, GTA6LongProps, gta6LongDuration } from "./GTA6/GTA6Long";
import largo from "../content/gta6/largo.json";
import { GTA6Doc, DocProps, docDuration } from "./GTA6/GTA6Doc";
import docA from "../content/gta6/docA.json";
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
      <Composition
        id="GTA6Doc"
        component={GTA6Doc}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={docA as unknown as DocProps}
        calculateMetadata={({ props }: { props: DocProps }) => ({ durationInFrames: docDuration(props) })}
      />
      <Composition
        id="GTA6Long"
        component={GTA6Long}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={largo as unknown as GTA6LongProps}
        calculateMetadata={({ props }: { props: GTA6LongProps }) => ({ durationInFrames: gta6LongDuration(props) })}
      />
      <Composition
        id="GTA6Short"
        component={GTA6Short}
        durationInFrames={300}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={short1 as unknown as GTA6Props}
        calculateMetadata={({ props }: { props: GTA6Props }) => ({ durationInFrames: gta6Duration(props) })}
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
