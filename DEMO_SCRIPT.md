# Demo Script

Target duration: 2 minutes 30 seconds.

## 0:00-0:15 Hook

Narration: "Browser agents are intelligent, but they pay the cost of intelligence at every click."

Screen action: Show Visual Compiler Studio with compile-time and runtime model counters.

## 0:15-0:35 Problem

Narration: "Repeated model calls add latency, cost, nondeterminism, and audit risk. Deterministic tools are reliable, but they do not understand spatial instructions."

Screen action: Show the demo page with repeated labels, disabled controls, icons, and table rows.

## 0:35-1:20 Compile

Narration: "Visual Compiler uses GPT-5.6 once, at compile time. It reads the page model and converts the instruction into Semantic IR."

Screen action: Enter: "In the row containing 'Pending review', check the first enabled checkbox to the right of the status text, then click the green confirmation button below the table." Click Compile. Show Semantic IR, locator candidates, and generated Playwright.

## 1:20-2:05 Execute Offline

Narration: "Now the compiled artifact runs without a model. We remove the API key, switch to layout variant B, and replay the same workflow."

Screen action: Run variant B. Show successful completion and Runtime LLM calls: 0.

## 2:05-2:25 Architecture

Narration: "The architecture is GPT-5.6 to Semantic IR to locator compiler to Playwright runtime."

Screen action: Show architecture diagram in README.

## 2:25-2:40 Closing

Narration: "We do not need smarter browser agents. We need compiled intelligence."
