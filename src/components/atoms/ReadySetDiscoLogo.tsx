import React from 'react';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Path,
} from 'react-native-svg';

export default function ReadySetDiscoPixelLogo() {
  return (
    <Svg width={420} height={260} viewBox="0 0 420 260">
      <Defs>
        <LinearGradient id="chrome" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#FFFFFF" />
          <Stop offset="25%" stopColor="#E7E7F2" />
          <Stop offset="50%" stopColor="#AFAFC2" />
          <Stop offset="75%" stopColor="#F6F6FF" />
          <Stop offset="100%" stopColor="#72728C" />
        </LinearGradient>

        <LinearGradient id="purpleGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FF4DFF" />
          <Stop offset="100%" stopColor="#7A2BFF" />
        </LinearGradient>
      </Defs>

      {/* Orbit swoosh */}
      <Path
        d="M40 180 C120 40 320 40 390 170"
        stroke="url(#purpleGlow)"
        strokeWidth={4}
        fill="none"
        opacity={0.9}
      />

      {/* READY */}
      <PixelWord
        text="READY"
        x={60}
        y={40}
        scale={1.2}
      />

      {/* SET */}
      <PixelWord
        text="SET"
        x={135}
        y={105}
        scale={1}
      />

      {/* DISCO */}
      <PixelWord
        text="DISCO"
        x={25}
        y={150}
        scale={1.5}
      />

      {/* Sparkles */}
      <PixelStar x={25} y={25} />
      <PixelStar x={355} y={90} />
      <PixelStar x={210} y={230} />
    </Svg>
  );
}

function PixelWord({
  text,
  x,
  y,
  scale,
}: {
  text: string;
  x: number;
  y: number;
  scale: number;
}) {
  const letters: Record<string, number[][]> = {
    R: [
      [1,1,1,0],
      [1,0,1,0],
      [1,1,1,0],
      [1,0,1,0],
      [1,0,0,1],
    ],
    E: [
      [1,1,1],
      [1,0,0],
      [1,1,0],
      [1,0,0],
      [1,1,1],
    ],
    A: [
      [0,1,0],
      [1,0,1],
      [1,1,1],
      [1,0,1],
      [1,0,1],
    ],
    D: [
      [1,1,0],
      [1,0,1],
      [1,0,1],
      [1,0,1],
      [1,1,0],
    ],
    Y: [
      [1,0,1],
      [1,0,1],
      [0,1,0],
      [0,1,0],
      [0,1,0],
    ],
    S: [
      [1,1,1],
      [1,0,0],
      [1,1,1],
      [0,0,1],
      [1,1,1],
    ],
    T: [
      [1,1,1],
      [0,1,0],
      [0,1,0],
      [0,1,0],
      [0,1,0],
    ],
    I: [
      [1,1,1],
      [0,1,0],
      [0,1,0],
      [0,1,0],
      [1,1,1],
    ],
    C: [
      [1,1,1],
      [1,0,0],
      [1,0,0],
      [1,0,0],
      [1,1,1],
    ],
    O: [
      [1,1,1],
      [1,0,1],
      [1,0,1],
      [1,0,1],
      [1,1,1],
    ],
  };

  const pixelSize = 8 * scale;
  let offsetX = x;

  return (
    <>
      {text.split('').map((char, index) => {
        const grid = letters[char];

        const rendered = (
          <React.Fragment key={`${char}-${index}`}>
            {grid.map((row, rowIndex) =>
              row.map((cell, colIndex) =>
                cell ? (
                  <Rect
                    key={`${rowIndex}-${colIndex}`}
                    x={offsetX + colIndex * pixelSize}
                    y={y + rowIndex * pixelSize}
                    width={pixelSize}
                    height={pixelSize}
                    fill="url(#chrome)"
                    stroke="#7A2BFF"
                    strokeWidth={1}
                  />
                ) : null
              )
            )}
          </React.Fragment>
        );

        offsetX += (grid[0].length + 1.5) * pixelSize;

        return rendered;
      })}
    </>
  );
}

function PixelStar({
  x,
  y,
}: {
  x: number;
  y: number;
}) {
  const size = 6;

  return (
    <>
      <Rect x={x + size} y={y} width={size} height={size * 3} fill="#FFFFFF" />
      <Rect x={x} y={y + size} width={size * 3} height={size} fill="#FFFFFF" />
    </>
  );
}
