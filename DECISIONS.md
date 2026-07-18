# Decisions

## ADR-001: Separate Compile Time From Runtime

Date: 2026-07-18

Status: Accepted

Visual Compiler uses GPT-5.6 only during compilation. The generated workflow is a validated artifact that the Playwright runtime can execute later with `OPENAI_API_KEY` unset. This is the central product proof: intelligence is paid for once, execution is deterministic and auditable.

## ADR-002: Controlled Vertical Slice

Date: 2026-07-18

Status: Accepted

The MVP targets a local demo page with two layout variants. This preserves enough complexity to prove spatial reasoning while keeping judge setup reliable.
