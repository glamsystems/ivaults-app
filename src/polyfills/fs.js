// Mock fs module for React Native
// This is a polyfill to satisfy Node.js fs imports that don't actually get used

module.exports = {
  readFile: () => {
    throw new Error('fs.readFile is not available in React Native');
  },
  readFileSync: () => {
    throw new Error('fs.readFileSync is not available in React Native');
  },
  writeFile: () => {
    throw new Error('fs.writeFile is not available in React Native');
  },
  writeFileSync: () => {
    throw new Error('fs.writeFileSync is not available in React Native');
  },
  existsSync: () => false,
  mkdirSync: () => {},
  readdirSync: () => [],
  statSync: () => ({}),
  // Add other commonly used fs methods as needed
};