// Mock for @clerk/backend crypto module (ESM-friendly)
import { webcrypto as nodeWebcrypto } from 'node:crypto';

const cryptoImpl = globalThis.crypto ?? nodeWebcrypto ?? {};

export const webcrypto = cryptoImpl;
export default cryptoImpl;
