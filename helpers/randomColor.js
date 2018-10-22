function getRandomColor() {
    return {
      r: Math.random() * 255,
      g: Math.random() * 255,
      b: Math.random() * 255,
    };
}

module.exports = getRandomColor;