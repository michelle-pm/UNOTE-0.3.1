export const gradients = [
  // Subtle & Cool
  { color: '#6E85B7', color2: '#B2C8DF' }, // Dusty Blue
  { color: '#89CFF0', color2: '#B2FFFF' }, // Baby Blue to Light Cyan
  { color: '#A7C7E7', color2: '#E0F0FF' }, // Light Steel Blue
  { color: '#B9D9EB', color2: '#F0F8FF' }, // Alice Blue gradient

  // Subtle & Warm
  { color: '#FFDAB9', color2: '#FFE4B5' }, // Peach to Moccasin
  { color: '#F8C8DC', color2: '#FFDFD3' }, // Pastel Pink to Apricot
  { color: '#F3E5AB', color2: '#F5F5DC' }, // Vanilla to Beige
  
  // Muted & Elegant
  { color: '#C3B1E1', color2: '#E0BBE4' }, // Lavender to Orchid Pink
  { color: '#98DDCA', color2: '#D5F5E3' }, // Mint to Light Green
  { color: '#D3D3D3', color2: '#E5E4E2' }, // Light Gray to Platinum
  
  // Kept from original for some variety
  { color: '#84fab0', color2: '#8fd3f4' }, // Calm
  { color: '#a18cd1', color2: '#fbc2eb' }, // Purple
];

export const getRandomGradient = () => {
  const grad = gradients[Math.floor(Math.random() * gradients.length)];
  // For PieWidget, the colors are named color1 and color2
  return { ...grad, color1: grad.color, color2: grad.color2 };
};

export const hexToRgba = (hex: string, opacity: number = 0.25): string => {
    let c: any;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');
        if (c.length === 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        return `rgba(${[(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',')},${opacity})`;
    }
    // Fallback for invalid hex
    return 'rgba(197, 167, 255, 0.25)';
};