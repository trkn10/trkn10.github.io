// 楽曲データベース（拡張性重視）
export const DIFFICULTIES = [
  { id: 'prelude', label: 'Prelude', order: 1 },
  { id: 'refrain', label: 'Refrain', order: 2 },
  { id: 'finale', label: 'Finale', order: 3 }
];

export const MUSIC_LIST = [
  {
    id: 'song1',
    title: '雨の音 Feat. Ayame',
    artist: 'Tak_mfk',
    file: 'amenooto.mp3',
    duration: 229,
    levels: {
      prelude: 3,
      refrain: 7,
      finale: 12
    },
    patterns: {
      prelude: [
        { time: 0.5, config: { x: 0, y: 0, angle: 0, speed: 2, type: 'normal', color: 'rgb(255, 255, 255)', origin: 'center' } },
        { time: 1.0, config: { x: 0, y: 0, angle: 0, speed: 2, type: 'normal', color: 'rgb(255, 255, 255)', origin: 'left' } },
        { time: 1.5, config: { x: 0, y: 0, angle: Math.PI, speed: 2, type: 'normal', color: 'rgb(255, 255, 255)', origin: 'right' } },
        { time: 2.0, config: { x: 0, y: 0, angle: Math.PI/2, speed: 2, type: 'normal', color: 'rgb(255, 255, 255)', origin: 'top' } },
        { time: 2.5, config: { x: 0, y: 0, angle: -Math.PI/2, speed: 2, type: 'normal', color: 'rgb(255, 255, 255)', origin: 'bottom' } },
      ],
      refrain: [
        { time: 0.5, config: { x: 100, y: 100, angle: Math.PI/4, speed: 2.5, type: 'normal', color: '#f44' } },
        { time: 1.0, config: { x: 320, y: 400, angle: -Math.PI/2, speed: 3, type: 'normal', color: '#ff0' } }
      ],
      finale: [
        { time: 0.5, config: { x: 320, y: 180, angle: Math.PI/2, speed: 4, type: 'normal', color: '#f44' } },
        { time: 1.0, config: { x: 320, y: 400, angle: -Math.PI/2, speed: 4, type: 'normal', color: '#ff0' } },
        { time: 2.0, config: { x: 100, y: 240, angle: 0, speed: 3, type: 'normal', color: '#4af' } }
      ]
    }
  },
  {
    id: 'song2',
    title: '鏡の国のアリス症候群',
    artist: 'EigHt',
    file: 'kagaminokuninoarisusyoukougun.mp3',
    duration: 168,
    levels: {
      prelude: 2,
      refrain: 6,
      finale: 10
    },
    patterns: {
      prelude: [
        { time: 1.0, config: { x: 320, y: 80, angle: Math.PI/2, speed: 2, type: 'normal', color: '#4af' } }
      ],
      refrain: [
        { time: 0.5, config: { x: 320, y: 80, angle: Math.PI/2, speed: 3, type: 'normal', color: '#f44' } },
        { time: 1.5, config: { x: 320, y: 400, angle: -Math.PI/2, speed: 3, type: 'normal', color: '#ff0' } }
      ],
      finale: [
        { time: 0.5, config: { x: 100, y: 100, angle: Math.PI/4, speed: 4, type: 'normal', color: '#f44' } },
        { time: 1.0, config: { x: 540, y: 100, angle: Math.PI*3/4, speed: 4, type: 'normal', color: '#4af' } },
        { time: 2.0, config: { x: 320, y: 400, angle: -Math.PI/2, speed: 4, type: 'normal', color: '#ff0' } }
      ]
    }
  }
];
