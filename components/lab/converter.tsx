"use client";
import { useState } from "react";
import {
  numberRepresentations,
  parseNumberInput,
  type BitWidth,
  type Radix,
} from "@/lib/number-systems";
const bases: { name: string; radix: Radix; hint: string }[] = [
  { name: "DECIMAL", radix: 10, hint: "BASE 10 / INTERPRETED VALUE" },
  { name: "BINARY", radix: 2, hint: "BASE 2 / BIT PATTERN" },
  { name: "HEXADECIMAL", radix: 16, hint: "BASE 16 / COMPACT BITS" },
  { name: "OCTAL", radix: 8, hint: "BASE 8 / BIT GROUPS" },
];
export function ConverterExperiment() {
  const [bits, setBits] = useState(42n);
  const [width, setWidth] = useState<BitWidth>(32);
  const [signed, setSigned] = useState(false);
  const [draft, setDraft] = useState<{ radix: Radix; value: string } | null>(null);
  const [error, setError] = useState("");
  const representations = numberRepresentations(bits, width, signed);
  function update(value: string, radix: Radix) {
    const result = parseNumberInput(value, radix, width, signed);
    setDraft({ radix, value });
    if (result.error) setError(result.error);
    else {
      setError("");
      setBits(result.bits!);
    }
  }
  return (
    <div className="experiment-panel">
      <div className="experiment-heading">
        <div>
          <h2>One value. Four languages.</h2>
          <p>
            Edit any base to update all representations. Signed decimal uses two’s complement;
            binary, hex, and octal show the same underlying bit pattern.
          </p>
        </div>
        <span className="mono text-cyan">EXP_003 / BINARY PLAYGROUND</span>
      </div>
      <div className="experiment-controls">
        <label>
          BIT WIDTH
          <select
            value={width}
            onChange={(event) => {
              const next = Number(event.target.value) as BitWidth;
              setBits(BigInt.asUintN(next, signed ? BigInt.asIntN(width, bits) : bits));
              setWidth(next);
              setDraft(null);
              setError("");
            }}
          >
            {[8, 16, 32, 64].map((value) => (
              <option key={value} value={value}>
                {value} bits
              </option>
            ))}
          </select>
        </label>
        <label>
          INTERPRETATION
          <select
            value={signed ? "signed" : "unsigned"}
            onChange={(event) => {
              setSigned(event.target.value === "signed");
              setDraft(null);
              setError("");
            }}
          >
            <option value="unsigned">Unsigned</option>
            <option value="signed">Signed / two’s complement</option>
          </select>
        </label>
      </div>
      <p className="experiment-note">
        Changing width keeps the low bits; reducing width truncates high bits. Increasing width
        sign-extends signed values. Invalid edits leave the other fields at their last valid value.
      </p>
      <div className="converter-results four-bases">
        {bases.map((base) => (
          <div className="converter-result" key={base.radix}>
            <label className="mono" htmlFor={`number-${base.radix}`}>
              {base.name}
            </label>
            <input
              id={`number-${base.radix}`}
              aria-invalid={!!error && draft?.radix === base.radix}
              aria-describedby={
                error && draft?.radix === base.radix ? "converter-error" : undefined
              }
              value={draft?.radix === base.radix ? draft.value : representations[base.radix]}
              onChange={(event) => update(event.target.value, base.radix)}
              autoComplete="off"
              spellCheck={false}
              maxLength={70}
            />
            <p className="mono">{base.hint}</p>
          </div>
        ))}
      </div>
      <p className="converter-error" id="converter-error" role="status">
        {error}
      </p>
      <div
        className="bit-grid"
        aria-label={`${width}-bit representation${signed ? "; first bit is the sign bit" : ""}`}
      >
        {representations[2].split("").map((bit, index) => (
          <span
            key={index}
            className="bit-cell"
            data-on={bit === "1"}
            data-sign={signed && index === 0}
            title={`${signed && index === 0 ? "Sign bit / " : ""}Bit ${width - 1 - index}`}
          >
            {bit}
          </span>
        ))}
      </div>
      <div className="experiment-metrics mono">
        <span>
          DISPLAY WIDTH <strong>{width} BITS</strong>
        </span>
        <span>
          SET BITS <strong>{representations[2].split("1").length - 1}</strong>
        </span>
        <span>{signed ? "SIGNED / TWO’S COMPLEMENT" : "UNSIGNED / EXACT"}</span>
      </div>
    </div>
  );
}
