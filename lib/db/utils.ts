const HEX_DIGITS = '0123456789abcdef';

const randomHex = (length: number): string => {
  let output = '';

  for (let i = 0; i < length; i += 1) {
    output += HEX_DIGITS[Math.floor(Math.random() * HEX_DIGITS.length)];
  }

  return output;
};

export const createObjectId = (): string => {
  const timestamp = Math.floor(Date.now() / 1000)
    .toString(16)
    .padStart(8, '0');

  return `${timestamp}${randomHex(16)}`;
};

export const nowIsoString = (): string => new Date().toISOString();
