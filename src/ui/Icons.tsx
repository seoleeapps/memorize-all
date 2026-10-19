import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { colors } from './theme';

// Original vector symbols: keep a visible text label beside each symbol.
export function TopicIcon({ topic, size = 44 }: { topic: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessible={false}>
      <Rect x="1" y="1" width="62" height="62" rx="18" fill={colors.pale} />
      {topic === 'geography' ? (
        <>
          <Circle cx="32" cy="32" r="20" stroke={colors.green} strokeWidth="2" fill="none" />
          <Ellipse
            cx="32"
            cy="32"
            rx="9"
            ry="20"
            stroke={colors.green}
            strokeWidth="2"
            fill="none"
          />
          <Path d="M12 32h40M16 21h32M16 43h32" stroke={colors.green} strokeWidth="2" />
        </>
      ) : topic === 'elements' ? (
        <>
          <Rect
            x="15"
            y="13"
            width="34"
            height="38"
            rx="5"
            stroke={colors.green}
            strokeWidth="2"
            fill="none"
          />
          <Circle cx="25" cy="24" r="3" fill={colors.green} />
          <Path d="M23 39h18M23 44h12M35 22v9m-4-5h8" stroke={colors.green} strokeWidth="2" />
        </>
      ) : topic === 'moon' || topic === 'astronomy' ? (
        <>
          <Path d="M39 13a20 20 0 1 0 12 30A22 22 0 0 1 39 13Z" fill={colors.green} />
          <Path d="m47 14 1 4 4 1-4 1-1 4-1-4-4-1 4-1Z" fill={colors.gold} />
        </>
      ) : topic === 'coffee' ? (
        <>
          <Path
            d="M16 27h29v11a12 12 0 0 1-12 12h-5a12 12 0 0 1-12-12ZM45 28h4a6 6 0 0 1 0 12h-4M13 52h36M24 21c-6-5 6-6 0-11M35 21c-6-5 6-6 0-11"
            stroke={colors.green}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        </>
      ) : topic === 'wine' ? (
        <>
          <Path
            d="M21 12h22l-2 18a9 9 0 0 1-18 0ZM32 39v13m-9 0h18"
            stroke={colors.green}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          <Path d="m23 25 2 6a7 7 0 0 0 14 0l1-6Z" fill="#A75466" />
        </>
      ) : (
        <>
          <Path
            d="M13 16h16l3 4 3-4h16v32H35l-3 4-3-4H13ZM32 20v31M19 26h7m-7 8h7m12-8h7m-7 8h7"
            stroke={colors.green}
            strokeWidth="2"
            fill="none"
            strokeLinejoin="round"
          />
        </>
      )}
    </Svg>
  );
}
export function TabIcon({ tab, selected }: { tab: string; selected: boolean }) {
  const stroke = selected ? colors.green : colors.muted;
  const paths: Record<string, string> = {
    today: 'M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M5.6 18.4 7 17m10-10 1.4-1.4',
    explore: 'M3 3h7v7H3Zm11 0h7v7h-7ZM3 14h7v7H3Zm11 0h7v7h-7Z',
    collection: 'M3 4h7l2 2 2-2h7v15h-7l-2 2-2-2H3ZM12 6v15',
    settings: 'M5 4v16m7-16v16m7-16v16M2 8h6m1 8h6m1-9h6',
  };
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" accessible={false}>
      {tab === 'today' && (
        <Circle cx="12" cy="12" r="4" fill="none" stroke={stroke} strokeWidth="1.7" />
      )}
      <Path
        d={paths[tab]}
        stroke={stroke}
        strokeWidth="1.7"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
export function CardTurnIcon() {
  return (
    <Svg width={42} height={42} viewBox="0 0 48 48" accessible={false}>
      <Rect
        x="10"
        y="7"
        width="26"
        height="34"
        rx="5"
        fill={colors.pale}
        stroke={colors.green}
        strokeWidth="2"
      />
      <Path
        d="M16 24a9 9 0 0 1 16-5m0-6v6h-6M32 26a9 9 0 0 1-16 5m0 6v-6h6"
        fill="none"
        stroke={colors.green}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}
