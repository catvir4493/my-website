"use client";
import { useRef, useState } from "react";
import { allocate, release, freeSegments, heapSize, type MemoryBlock } from "@/lib/memory";
export function MemoryExperiment() {
  const [blocks, setBlocks] = useState<MemoryBlock[]>([]);
  const [size, setSize] = useState("8");
  const [stack, setStack] = useState<number[]>([0]);
  const [message, setMessage] = useState(
    "Ready. Allocate a block to inspect its simulated address.",
  );
  const sequence = useRef(0);
  const frames = useRef(0);
  const allocated = blocks.reduce((sum, block) => sum + block.size, 0);
  const free = freeSegments(blocks);
  return (
    <div className="experiment-panel">
      <div className="experiment-heading">
        <div>
          <h2>Where does a value live?</h2>
          <p>
            A first-fit heap allocator and a call-stack model. Addresses and bytes belong to this
            teaching model; they do not measure or allocate actual browser memory.
          </p>
        </div>
        <span className="mono text-cyan">EXP_004 / EXPERIMENTAL / SIMULATION</span>
      </div>
      <div className="experiment-controls">
        <label>
          ALLOCATION SIZE / BYTES
          <input
            type="number"
            min="1"
            max={heapSize}
            value={size}
            onChange={(event) => setSize(event.target.value)}
          />
        </label>
        <button
          className="button primary"
          onClick={() => {
            const id = sequence.current + 1;
            const next = allocate(blocks, Number(size), id);
            if (!next) {
              setMessage("malloc failed: invalid size or no contiguous free block large enough.");
              return;
            }
            sequence.current = id;
            setBlocks(next);
            const block = next.find((item) => item.id === id)!;
            setMessage(
              `malloc(${block.size}) → block ${id} at 0x${block.start.toString(16).padStart(2, "0").toUpperCase()}.`,
            );
          }}
        >
          malloc
        </button>
        <button
          className="button secondary"
          onClick={() => {
            if (stack.length >= 8) {
              setMessage("Simulated stack limit reached: 8 frames.");
              return;
            }
            setStack([...stack, ++frames.current]);
            setMessage(
              "Function called: a stack frame was pushed. Heap allocation lifetime is independent.",
            );
          }}
        >
          Call function
        </button>
        <button
          className="button secondary"
          disabled={stack.length <= 1}
          onClick={() => {
            setStack(stack.slice(0, -1));
            setMessage(
              "Function returned: its stack frame was popped. Heap blocks remain until free.",
            );
          }}
        >
          Return
        </button>
        <button
          className="button secondary"
          onClick={() => {
            setBlocks([]);
            setStack([0]);
            sequence.current = 0;
            frames.current = 0;
            setMessage("Simulation reset. Heap is free; main remains on the stack.");
          }}
        >
          Reset memory
        </button>
      </div>
      <div className="memory-lab-layout">
        <section className="sim-stack">
          <h3 className="mono">STACK / LAST IN, FIRST OUT</h3>
          {[...stack].reverse().map((id, index) => (
            <div className="stack-frame" key={id}>
              <span>{id === 0 ? "main()" : `function_${id}()`}</span>
              <small>{index === 0 ? "CURRENT FRAME" : "CALLER"}</small>
            </div>
          ))}
        </section>
        <section>
          <h3 className="mono">HEAP / 64 SIMULATED BYTES</h3>
          <div className="heap-regions" aria-label="Contiguous allocated and free memory regions">
            {[
              ...blocks.map((block) => ({ ...block, allocated: true })),
              ...free.map((segment) => ({
                ...segment,
                id: `free-${segment.start}`,
                allocated: false,
              })),
            ]
              .sort((a, b) => a.start - b.start)
              .map((region) => (
                <div
                  key={region.id}
                  data-allocated={region.allocated}
                  style={{ flexGrow: region.size }}
                  title={`${region.allocated ? `Block ${region.id}` : "Free"}: ${region.size} simulated bytes`}
                >
                  <span className="sr-only">
                    {region.allocated ? `Block ${region.id}` : "Free region"}: {region.size}{" "}
                    simulated bytes.
                  </span>
                </div>
              ))}
          </div>
          <div className="heap-cells" aria-label="Simulated heap allocation map">
            {Array.from({ length: heapSize }, (_, address) => {
              const block = blocks.find(
                (item) => address >= item.start && address < item.start + item.size,
              );
              return (
                <div
                  key={address}
                  data-allocated={!!block}
                  data-block-start={block?.start === address}
                  data-block-end={!!block && block.start + block.size - 1 === address}
                  title={`0x${address.toString(16).padStart(2, "0")}: ${block ? `block ${block.id}` : "free"}`}
                >
                  <small>{address.toString(16).padStart(2, "0")}</small>
                  <span>{block ? `B${block.id}` : "FREE"}</span>
                </div>
              );
            })}
          </div>
          <div className="allocation-list">
            {blocks.map((block) => (
              <div key={block.id}>
                <span className="mono">
                  BLOCK {block.id} / {block.size} B / 0x{block.start.toString(16).padStart(2, "0")}
                </span>
                <button
                  className="button secondary"
                  aria-label={`free block ${block.id}`}
                  onClick={() => {
                    setBlocks(release(blocks, block.id));
                    setMessage(
                      `free(block ${block.id}). Adjacent free regions are available for reuse.`,
                    );
                  }}
                >
                  free
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
      <div className="experiment-metrics mono">
        <span>
          ALLOCATED <strong>{allocated} B</strong>
        </span>
        <span>
          FREE <strong>{heapSize - allocated} B</strong>
        </span>
        <span>
          LARGEST FREE REGION{" "}
          <strong>{Math.max(0, ...free.map((segment) => segment.size))} B</strong>
        </span>
        <span>
          STACK <strong>{stack.length} FRAMES</strong>
        </span>
      </div>
      <p className="experiment-note" role="status">
        {message}
      </p>
    </div>
  );
}
