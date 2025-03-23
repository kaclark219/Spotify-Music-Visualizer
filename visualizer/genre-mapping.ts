// Mapping music genres to a cluster of three colors
type GenreColors = { [genre: string]: string[] };

const genreColors: GenreColors = {
  "Pop": ["#ff007f", "#ffff00", "#00bfff"], // Pink, Yellow, Blue
  "Rock": ["#ff0000", "#000000", "#808080"], // Red, Black, Grey
  "Hip-Hop": ["#ff6347", "#f4a300", "#222222"], // Tomato, Orange, Black
  "Electronic": ["#00ffff", "#800080", "#ff1493"], // Cyan, Purple, Deep Pink
  "Jazz": ["#a52a2a", "#d2691e", "#ff6347"], // Brown, Chocolate, Tomato
  "Classical": ["#c0c0c0", "#000080", "#808080"], // Silver, Navy, Gray
  "Blues": ["#003366", "#000000", "#4682b4"], // Navy, Black, Steel Blue
  "Reggae": ["#008000", "#ffcc00", "#ff0000"], // Green, Yellow, Red
  "R&B": ["#8b0000", "#ff6347", "#000000"], // Dark Red, Tomato, Black
  "Soul": ["#ff6347", "#800080", "#ffff00"], // Tomato, Purple, Yellow
  "Country": ["#8b4513", "#d2b48c", "#f4a300"], // Saddle Brown, Tan, Orange
  "Indie": ["#a9a9a9", "#dc143c", "#32cd32"], // DarkGray, Crimson, LimeGreen
  "Alternative": ["#9b111e", "#3a3a3a", "#7f5a5a"], // Red, Dark Gray, Brown
  "Metal": ["#000000", "#c0c0c0", "#8b0000"], // Black, Silver, DarkRed
  "Folk": ["#8b4513", "#d2b48c", "#deb887"], // Saddle Brown, Tan, BurlyWood
  "Punk": ["#ff1493", "#000000", "#f0e68c"], // Deep Pink, Black, Khaki
  "Latin": ["#ff6347", "#f0e68c", "#32cd32"], // Tomato, Khaki, Lime Green
  "Disco": ["#ff00ff", "#ffff00", "#ff1493"], // Magenta, Yellow, Deep Pink
  "House": ["#ff007f", "#ff1493", "#00bfff"], // Pink, Deep Pink, Blue
  "Techno": ["#00ffff", "#000080", "#ff1493"], // Cyan, Navy, Deep Pink
  "Trap": ["#f4a300", "#222222", "#ff6347"], // Orange, Black, Tomato
  "Dance": ["#ff00ff", "#ffff00", "#ff1493"], // Magenta, Yellow, Deep Pink
  "Ambient": ["#a9a9a9", "#000080", "#4682b4"], // Dark Gray, Navy, Steel Blue
  "Acoustic": ["#deb887", "#f4a300", "#a52a2a"], // Burly Wood, Orange, Brown
  "Grunge": ["#3a3a3a", "#000000", "#808080"], // Dark Gray, Black, Gray
  "Ska": ["#ff6347", "#0000ff", "#f0e68c"], // Tomato, Blue, Khaki
  "Bluegrass": ["#8b4513", "#deb887", "#d2b48c"], // Saddle Brown, Burly Wood, Tan
  "Funk": ["#a52a2a", "#ff6347", "#800080"], // Brown, Tomato, Purple
  "World Music": ["#ff6347", "#000080", "#32cd32"], // Tomato, Navy, Lime Green
  "K-pop": ["#ff007f", "#ff1493", "#00bfff"], // Pink, Deep Pink, Blue
  "Experimental": ["#808080", "#a9a9a9", "#000000"], // Gray,  , Black
  "Gospel": ["#ff0000", "#ffffff", "#000080"], // Red, White, Navy
  "Reggaeton": ["#ff6347", "#ffcc00", "#000000"], // Tomato, Yellow, Black
  "Salsa": ["#ff6347", "#f0e68c", "#008000"], // Tomato, Khaki, Green
  "Tropical": ["#ff6347", "#00bfff", "#32cd32"], // Tomato, Blue, Lime Green
  "Tech House": ["#ff007f", "#000080", "#ffff00"], // Pink, Navy, Yellow
  "Dubstep": ["#800080", "#000000", "#ff1493"], // Purple, Black, Deep Pink
  "Folk Rock": ["#8b4513", "#d2b48c", "#32cd32"], // Saddle Brown, Tan, Lime Green
  "Hard Rock": ["#ff0000", "#000000", "#808080"], // Red, Black, Gray
  "New Age": ["#c0c0c0", "#f0f8ff", "#32cd32"], // Silver, Alice Blue, Lime Green
  "Industrial": ["#808080", "#000000", "#a9a9a9"], // Gray, Black, Dark Gray
  "Post-Rock": ["#8b4513", "#000080", "#4682b4"], // Saddle Brown, Navy, SteelBlue
  "Psychedelic Rock": ["#ff1493", "#0000ff", "#ffff00"], // Deep Pink, Blue, Yellow
  "Dancehall": ["#ff6347", "#f0e68c", "#ff0000"], // Tomato, Khaki, Red
  "Electronic Rock": ["#ff1493", "#000000", "#800080"], // Deep Pink, Black, Purple
  "Post-Punk": ["#9b111e", "#000000", "#f0e68c"], // Red, Black, Khaki
  "Synthwave": ["#ff00ff", "#000080", "#00bfff"], // Magenta, Navy, Blue
};

console.log(genreColors);