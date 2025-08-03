// Mock for @clerk/backend crypto module
module.exports = {
  webcrypto: global.crypto || {},
};
