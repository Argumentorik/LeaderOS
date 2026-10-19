/**
 * WladBotAvatar · Voxel-Charakter-System für WladBot.
 *
 * Eine 16×24 Minecraft-DNA-Figur in 8 Posen, jede als eigene React-
 * Komponente exportiert. Die Figur trägt grünes Samt-Sakko (matched
 * Wlads echtes Foto), helles Hemd, dunkle Augen, leicht stoppeliger
 * Bart, Lime-Pocket-Square als Brand-Signal.
 *
 * Posen:
 *   <WladIdle />          · Hände an der Seite (Default)
 *   <WladPoint />         · Linker Arm hoch, zeigt nach vorne
 *   <WladThink />         · Hand am Kinn, leichte Kopfneigung
 *   <WladTalk />          · Mund offen, Sprech-Geste
 *   <WladHeadset />       · Mit Headphones (Voice-Call)
 *   <WladBook />          · Hält Buch (Lernen)
 *   <WladTablet />        · Hält iPad (Chat)
 *   <WladPodium />        · Mit Rednerpult (Public Speaking)
 *
 * Props (alle optional):
 *   - size: number · pixel-Größe (default 96)
 *   - background: 'transparent' | 'lime' | 'cream' | 'dark'
 *   - frame: bool · zeichnet 2px-Border
 *
 * Convenience-Wrapper:
 *   <WladBotAvatar pose="point" size={120} background="dark" frame />
 */

const COLORS = {
  hair: '#3A2418',
  skin: '#F2C8A4',
  stubble: '#6B4530',
  eye: '#0A0A0A',
  shirt: '#E8F1FF',
  jacket: '#0E3B1F',
  jacketDark: '#072714',
  jacketLight: '#1A5530',
  lime: '#BFFF00',
  trousers: '#1A1A1A',
  paper: '#FFFFFF',
  black: '#0A0A0A',
};

const FrameWrap = ({ children, size, background, frame }) => {
  const bg = {
    transparent: 'transparent',
    lime: COLORS.lime,
    cream: '#F5EFDD',
    dark: COLORS.black,
    white: COLORS.paper,
  }[background] || 'transparent';

  return (
    <div
      style={{
        width: size,
        height: size,
        background: bg,
        border: frame ? `2px solid ${COLORS.black}` : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
};

const Voxel = ({ children, viewBox = '0 0 16 28' }) => (
  <svg
    viewBox={viewBox}
    aria-hidden
    style={{
      imageRendering: 'pixelated',
      shapeRendering: 'crispEdges',
      width: '80%',
      height: '80%',
    }}
  >
    {children}
  </svg>
);

// ───────────────── Base Body (head + jacket) ─────────────────
const Head = ({ x = 3 }) => (
  <g>
    {/* Hair */}
    <rect x={x} y="0" width="10" height="3" fill={COLORS.hair} />
    <rect x={x} y="3" width="10" height="1" fill={COLORS.hair} />
    {/* Forehead skin */}
    <rect x={x} y="4" width="10" height="1" fill={COLORS.skin} />
    {/* Eye row */}
    <rect x={x} y="5" width="10" height="2" fill={COLORS.skin} />
    <rect x={x + 2} y="5" width="2" height="2" fill={COLORS.eye} />
    <rect x={x + 6} y="5" width="2" height="2" fill={COLORS.eye} />
    {/* Cheeks */}
    <rect x={x} y="7" width="10" height="2" fill={COLORS.skin} />
    {/* Stubble */}
    <rect x={x} y="9" width="10" height="1" fill={COLORS.stubble} />
    {/* Neck */}
    <rect x={x + 3} y="10" width="4" height="1" fill={COLORS.skin} />
  </g>
);

const Jacket = ({ x = 2, openPocket = true }) => (
  <g>
    {/* Shirt collar */}
    <rect x={x + 3} y="11" width="6" height="1" fill={COLORS.shirt} />
    {/* Jacket main */}
    <rect x={x} y="12" width="12" height="10" fill={COLORS.jacket} />
    {/* Lapels darker */}
    <rect x={x + 3} y="12" width="1" height="7" fill={COLORS.jacketDark} />
    <rect x={x + 8} y="12" width="1" height="7" fill={COLORS.jacketDark} />
    {/* Velvet highlight */}
    <rect x={x + 1} y="13" width="1" height="6" fill={COLORS.jacketLight} />
    {/* Lime pocket-square */}
    {openPocket && <rect x={x + 8} y="14" width="1" height="2" fill={COLORS.lime} />}
    {/* Belt */}
    <rect x={x} y="22" width="12" height="1" fill={COLORS.jacketDark} />
  </g>
);

const Legs = ({ x = 3 }) => (
  <g>
    <rect x={x} y="23" width="4" height="3" fill={COLORS.trousers} />
    <rect x={x + 6} y="23" width="4" height="3" fill={COLORS.trousers} />
    <rect x={x + 1} y="26" width="2" height="1" fill={COLORS.eye} />
    <rect x={x + 7} y="26" width="2" height="1" fill={COLORS.eye} />
  </g>
);

// ───────────────── Poses ─────────────────

export const WladIdle = ({ size = 96, background = 'transparent', frame = false }) => (
  <FrameWrap size={size} background={background} frame={frame}>
    <Voxel>
      <Head />
      {/* Arms at side */}
      <rect x="0" y="13" width="2" height="7" fill={COLORS.jacket} />
      <rect x="14" y="13" width="2" height="7" fill={COLORS.jacket} />
      <rect x="0" y="20" width="2" height="1" fill={COLORS.skin} />
      <rect x="14" y="20" width="2" height="1" fill={COLORS.skin} />
      <Jacket />
      <Legs />
    </Voxel>
  </FrameWrap>
);

export const WladPoint = ({ size = 96, background = 'transparent', frame = false }) => (
  <FrameWrap size={size} background={background} frame={frame}>
    <Voxel viewBox="0 0 20 28">
      <g transform="translate(2 0)">
        <Head />
        <Jacket />
        {/* Right arm at side */}
        <rect x="14" y="13" width="2" height="7" fill={COLORS.jacket} />
        <rect x="14" y="20" width="2" height="1" fill={COLORS.skin} />
        {/* Left arm raised pointing */}
        <rect x="0" y="13" width="2" height="2" fill={COLORS.jacket} />
        <rect x="-2" y="11" width="2" height="2" fill={COLORS.jacket} />
        <rect x="-4" y="9" width="2" height="2" fill={COLORS.jacket} />
        <rect x="-5" y="8" width="1" height="2" fill={COLORS.skin} />
        {/* Finger pointing */}
        <rect x="-7" y="8" width="2" height="1" fill={COLORS.skin} />
        <Legs />
      </g>
      {/* Lime spark at fingertip */}
      <rect x="-7" y="6" width="1" height="1" fill={COLORS.lime} />
      <rect x="-8" y="7" width="1" height="1" fill={COLORS.lime} />
    </Voxel>
  </FrameWrap>
);

export const WladThink = ({ size = 96, background = 'transparent', frame = false }) => (
  <FrameWrap size={size} background={background} frame={frame}>
    <Voxel>
      <Head />
      <Jacket />
      <Legs />
      {/* Right arm down */}
      <rect x="14" y="13" width="2" height="7" fill={COLORS.jacket} />
      <rect x="14" y="20" width="2" height="1" fill={COLORS.skin} />
      {/* Left arm bent up to chin */}
      <rect x="0" y="13" width="2" height="4" fill={COLORS.jacket} />
      <rect x="2" y="11" width="2" height="2" fill={COLORS.jacket} />
      <rect x="3" y="9" width="2" height="2" fill={COLORS.skin} />
      {/* Thought bubble */}
      <rect x="13" y="0" width="3" height="3" fill={COLORS.lime} />
      <rect x="14" y="-2" width="2" height="2" fill={COLORS.lime} />
      <rect x="12" y="3" width="1" height="1" fill={COLORS.lime} />
    </Voxel>
  </FrameWrap>
);

export const WladTalk = ({ size = 96, background = 'transparent', frame = false }) => (
  <FrameWrap size={size} background={background} frame={frame}>
    <Voxel viewBox="0 0 22 28">
      <g transform="translate(0 0)">
        <Head />
        {/* Mouth opened */}
        <rect x="6" y="8" width="4" height="1" fill={COLORS.eye} />
        <Jacket />
        <Legs />
        {/* Arms at side */}
        <rect x="0" y="13" width="2" height="7" fill={COLORS.jacket} />
        <rect x="14" y="13" width="2" height="7" fill={COLORS.jacket} />
      </g>
      {/* Speech bubble */}
      <g transform="translate(16 2)">
        <rect x="0" y="0" width="6" height="5" fill={COLORS.paper} stroke={COLORS.black} strokeWidth="0.5" />
        <rect x="1" y="2" width="1" height="1" fill={COLORS.lime} />
        <rect x="3" y="2" width="1" height="1" fill={COLORS.lime} />
        <rect x="-1" y="3" width="2" height="1" fill={COLORS.paper} stroke={COLORS.black} strokeWidth="0.4" />
      </g>
    </Voxel>
  </FrameWrap>
);

export const WladHeadset = ({ size = 96, background = 'transparent', frame = false }) => (
  <FrameWrap size={size} background={background} frame={frame}>
    <Voxel>
      <Head />
      {/* Headband */}
      <rect x="3" y="0" width="10" height="1" fill={COLORS.eye} />
      {/* Ear cups */}
      <rect x="2" y="2" width="2" height="4" fill={COLORS.eye} />
      <rect x="12" y="2" width="2" height="4" fill={COLORS.eye} />
      {/* Lime LED on cup */}
      <rect x="2" y="3" width="1" height="1" fill={COLORS.lime} />
      <rect x="13" y="3" width="1" height="1" fill={COLORS.lime} />
      <Jacket />
      <Legs />
      <rect x="0" y="13" width="2" height="7" fill={COLORS.jacket} />
      <rect x="14" y="13" width="2" height="7" fill={COLORS.jacket} />
    </Voxel>
  </FrameWrap>
);

export const WladBook = ({ size = 96, background = 'transparent', frame = false }) => (
  <FrameWrap size={size} background={background} frame={frame}>
    <Voxel>
      <Head />
      <Jacket openPocket={false} />
      <Legs />
      {/* Book held in front */}
      <rect x="4" y="15" width="8" height="6" fill={COLORS.paper} stroke={COLORS.black} strokeWidth="0.5" />
      <rect x="8" y="15" width="0.4" height="6" fill={COLORS.black} />
      <rect x="5" y="17" width="6" height="1" fill={COLORS.lime} />
      {/* Both hands holding book */}
      <rect x="3" y="17" width="1" height="3" fill={COLORS.skin} />
      <rect x="12" y="17" width="1" height="3" fill={COLORS.skin} />
      {/* Arms folded down */}
      <rect x="0" y="13" width="2" height="4" fill={COLORS.jacket} />
      <rect x="14" y="13" width="2" height="4" fill={COLORS.jacket} />
    </Voxel>
  </FrameWrap>
);

export const WladTablet = ({ size = 96, background = 'transparent', frame = false }) => (
  <FrameWrap size={size} background={background} frame={frame}>
    <Voxel>
      <Head />
      <Jacket openPocket={false} />
      <Legs />
      {/* Tablet */}
      <rect x="3" y="14" width="10" height="7" fill={COLORS.black} stroke={COLORS.black} strokeWidth="0.5" />
      {/* Screen content · lime chat bubble */}
      <rect x="4" y="15" width="8" height="5" fill={COLORS.eye} />
      <rect x="5" y="16" width="4" height="1" fill={COLORS.lime} />
      <rect x="5" y="18" width="6" height="1" fill={COLORS.shirt} />
      <rect x="5" y="19" width="3" height="0.5" fill={COLORS.shirt} />
      {/* Hands */}
      <rect x="2" y="17" width="1" height="3" fill={COLORS.skin} />
      <rect x="13" y="17" width="1" height="3" fill={COLORS.skin} />
      {/* Arms */}
      <rect x="0" y="13" width="2" height="4" fill={COLORS.jacket} />
      <rect x="14" y="13" width="2" height="4" fill={COLORS.jacket} />
    </Voxel>
  </FrameWrap>
);

export const WladPodium = ({ size = 96, background = 'transparent', frame = false }) => (
  <FrameWrap size={size} background={background} frame={frame}>
    <Voxel viewBox="0 0 20 28">
      <g transform="translate(0 0)">
        <Head />
        <Jacket />
        <Legs />
        {/* Right arm raised */}
        <rect x="0" y="13" width="2" height="3" fill={COLORS.jacket} />
        <rect x="-2" y="10" width="2" height="3" fill={COLORS.jacket} />
        <rect x="-2" y="9" width="2" height="1" fill={COLORS.skin} />
        {/* Left arm on podium */}
        <rect x="14" y="13" width="2" height="4" fill={COLORS.jacket} />
        <rect x="14" y="17" width="2" height="1" fill={COLORS.skin} />
      </g>
      {/* Podium / lectern */}
      <rect x="13" y="18" width="7" height="2" fill={COLORS.jacketDark} />
      <rect x="15" y="20" width="3" height="6" fill={COLORS.jacketDark} />
      <rect x="14" y="18" width="5" height="1" fill={COLORS.lime} />
    </Voxel>
  </FrameWrap>
);

// ───────────────── Convenience wrapper ─────────────────

const POSE_MAP = {
  idle: WladIdle,
  point: WladPoint,
  think: WladThink,
  talk: WladTalk,
  headset: WladHeadset,
  book: WladBook,
  tablet: WladTablet,
  podium: WladPodium,
};

export const WladBotAvatar = ({ pose = 'idle', ...rest }) => {
  const Component = POSE_MAP[pose] || WladIdle;
  return <Component {...rest} />;
};

export default WladBotAvatar;
