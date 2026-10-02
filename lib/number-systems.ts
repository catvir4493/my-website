export type BitWidth = 8 | 16 | 32 | 64;
export type Radix = 2 | 8 | 10 | 16;
export function parseNumberInput(
  input: string,
  radix: Radix,
  width: BitWidth,
  signed: boolean,
): { bits: bigint; error?: never } | { error: string; bits?: never } {
  const clean = input
    .trim()
    .replace(radix === 2 ? /^0b/i : radix === 8 ? /^0o/i : radix === 16 ? /^0x/i : /^$/, "");
  if (
    !(
      radix === 10 ? /^-?\d+$/ : radix === 2 ? /^[01]+$/ : radix === 8 ? /^[0-7]+$/ : /^[0-9a-f]+$/i
    ).test(clean)
  )
    return { error: "Enter digits valid for the selected base." };
  try {
    const number = BigInt(
      radix === 10 ? clean : `${radix === 2 ? "0b" : radix === 8 ? "0o" : "0x"}${clean}`,
    );
    const maximum =
      radix === 10 && signed ? (1n << BigInt(width - 1)) - 1n : (1n << BigInt(width)) - 1n;
    const minimum = radix === 10 && signed ? -(1n << BigInt(width - 1)) : 0n;
    if (number < minimum || number > maximum)
      return {
        error: `Value is outside the ${signed && radix === 10 ? "signed" : "unsigned"} ${width}-bit range (${minimum} to ${maximum}).`,
      };
    return { bits: BigInt.asUintN(width, number) };
  } catch {
    return { error: "The input could not be converted." };
  }
}
export function numberRepresentations(bits: bigint, width: BitWidth, signed: boolean) {
  return {
    2: bits.toString(2).padStart(width, "0"),
    8: bits.toString(8),
    10: (signed ? BigInt.asIntN(width, bits) : bits).toString(10),
    16: bits.toString(16).toUpperCase(),
  };
}
