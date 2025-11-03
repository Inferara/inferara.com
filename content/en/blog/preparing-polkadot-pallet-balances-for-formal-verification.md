+++
title = "Preparing Polkadot pallet Balances for Formal Verification"
date = 2025-11-03T09:42:25+09:00
draft = false
math = "katex"
summary = "Preparing Polkadot pallet Balances for formal verification by reimplementing it as an Ink! smart contract for isolated analysis."
tags = [ "Polkadot", "Formal Verification", "Formal Specification", "Smart Contracts", "Rust", "Wasm", "Blockchain"]
aliases = ["/blog/preparing-polkadot-pallet-balances-for-formal-verification"]
+++

**Table of Contents**

- [Introduction](#introduction)
- [Methodology definition](#methodology-definition)
- [Methodology execution](#methodology-execution)
- [Reproducibility guide](#reproducibility-guide)
  - [Textual description of fungible traits specification: public functions, involved in implementation of traits](#textual-description-of-fungible-traits-specification-public-functions-involved-in-implementation-of-traits)
- [Analysis of `balances_contract` Disassembly Results and Verification Prospects](#analysis-of-balances_contract-disassembly-results-and-verification-prospects)
  - [1. Structural Observations](#1-structural-observations)
  - [2. Verification Challenges Specific to This Architecture](#2-verification-challenges-specific-to-this-architecture)
  - [3. Balance Operation Verification Strategy](#3-balance-operation-verification-strategy)
  - [4. Concrete Verification Challenges in the Annotated Code](#4-concrete-verification-challenges-in-the-annotated-code)
- [Roadmap for Incremental Verification](#roadmap-for-incremental-verification)
  - [Foundation Phase (Infrastructure Axiomatization)](#foundation-phase-infrastructure-axiomatization)
  - [Business Logic Phase (Functional Correctness)](#business-logic-phase-functional-correctness)
  - [Integration Phase](#integration-phase)
  - [Expected Outcomes and Limitations](#expected-outcomes-and-limitations)
  - [Contract Infrastructure reasoning applicability comparison with the whole Polkadot runtime](#contract-infrastructure-reasoning-applicability-comparison-with-the-whole-polkadot-runtime)
- [Conclusion](#conclusion)


## Introduction

In the crypto-financial industry, every bug that goes undetected before deployment can have catastrophic financial consequences. This is especially acute for systems that allow third-party developers to upload and execute arbitrary contracts on-chain, as this creates two distinct classes of threats. First, the necessity of providing numerous users with an isolated environment for Turing-complete computations inevitably creates an extensive attack surface against their shared infrastructure. Second, even without malicious intent from contract developers, algorithmic errors in business logic implementation or incorrect use of infrastructure primitives can allow third parties to cause financial harm to users who have entrusted their assets to the contract. While platform developers bear no direct responsibility for such situations, it's clear that the tools and interfaces they provide for contract creation greatly influence how easily reliable algorithms can be implemented with them.

In more established engineering disciplines that acutely face the cost of bugs - such as microcontroller programming for failure-critical tasks (medicine, chemical/nuclear industry, aviation, military applications, etc.) - formal verification methods are widely used, enabling reliability levels unattainable through paradigms familiar to typical programmers. Unfortunately, directly transferring this experience to the relatively young crypto-finance sphere is complicated by several objective circumstances. At first glance, it might seem the central problem is the enormous instrumental distance - the "reliable" programming industry universally employs highly specialized solutions optimized over decades for use in closed ecosystems, whereas the crypto-financial industry relies on massive open-source infrastructure that until recently had no acute need for radical reliability solutions.

We are convinced, however, that the problem runs deeper and is methodological rather than instrumental - in industrial practice, workflows for creating "reliable" software are organized in completely different ways, difficult to imagine in the context of the dynamic young crypto-finance industry. For example, one cannot expect blockchain developers, in the midst of a continuous race for the technological frontier, to begin development not with rapid prototyping of new concepts but with creating detailed mathematical specifications of the key components of the designed system - startups typically have neither the time nor the necessary skills for such a thorough approach. The situation only worsens from there - when choosing tools to implement their ideas, rare teams will agree to limit themselves to languages and frameworks with mature logical mechanization that admits proof of formal statements about program behavior, thereby denying themselves access to the overwhelming majority of truly powerful and convenient open technologies.

The consequence of this quite understandable state of the industry is that obtaining ultimate reliability guarantees through logical verification of program properties becomes a truly non-standard task, even by the standards of what specialists in this field usually face. Preparing the `pallet_balances` subsystem for formal specification became a vivid illustration of this problem. Below we attempt to explain what exactly we encountered during this work, how this experience affects assessments of the prospects for further research in this direction, and what choices will need to be made if a decision is made to continue.

## Methodology definition

Since the primary development language for Polkadot is Rust, we must first say a few words about its place in the methodological space of formal verification. Like most other high-level languages widespread in the industry, Rust has no formal description of its semantics at the source code level, and consequently, one can hardly hope for the emergence of high-level logical mechanizations that would allow formulating and proving properties of algorithms. For algorithm specification, therefore, it is necessary either to completely abstract from implementation, describing the behavior of some formalized pseudocode (in the spirit of, for example, $TLA^+$), or conversely, descend one level lower and describe the behavior of assembly modules obtained as a result of compilation.

The first of these paths, for meaningful application, would unfortunately require a radical revision of workflows, since complex systems can be adequately approximated by a pseudocode description only when such a description is a central element of project documentation and is finalized before the first line of actual code is written. In this case, the programmer engaged in translating such a formally specified reference with proven properties into code executable on the target platform needs only to ensure that real instructions comply with local, clearly defined rules in the specification - global reliability is ensured by the proven pseudocode reference. Attempting to reconstruct such a formal description for a project already in active development post-factum makes little sense, since it's impossible to truly verify that the pseudocode retelling of an already implemented algorithm doesn't abstract away, in addition to unimportant implementation details, potentially non-local errors already contained in it.

Progress on the second path, in theory, could yield positive effects without revolutions, since the object of specification and verification here is actually executing assembly code, whose semantics for popular platforms has a strict formal description - for WebAssembly and RISC-V, for example, logical mechanizations are actively developing in Rocq and Lean respectively. However, in practice this strategy is fraught with several quite labor-intensive problems. As our encounter with the internal structure of Polkadot's on-chain runtime showed, when compiling a sufficiently complex Rust project into a monolithic blob, it becomes practically impossible to isolate its individual subsystems for formal description. We attempted to isolate only the assembly functions containing a module's business logic for close examination. However, these attempts became hopelessly bogged down. This was due to the code being interleaved, line-by-line, with non-trivial infrastructure automatically generated by both FRAME's macros and the Rust compiler's internals.

In such a situation, no matter how we delineate the boundaries of the subsystem whose properties are to be formalized, inside will be a significant volume (exceeding the main code by two times or more) of code which has no direct relation to the core business-logic procedures that constitute the essence of `pallet_balances`. Worse still, the boundary drawn inside a monolithic architecture module won't actually allow abstracting from any details of its internal structure even when formulating the specification, let alone proving the properties fixed in it. Given that the number of instructions in the disassembled Polkadot runtime listing is literally measured in millions, and most of them constitute a single infrastructure permeating every module function, for a formal verification of `pallet_balances` business-logic properties in isolation from the surrounding context is considered the only possible way to approach the problem.

## Methodology execution

Since the central obstacle on the chosen path turned out to be the monolithic architecture of the runtime, we decided to bypass it by porting `pallet_balances` functionality to the Ink! platform, which will later allow us to use smart contract isolation mechanisms to draw a natural boundary between the described module and its execution environment. Having produced a sufficiently mechanical reimplementation of the algorithm accounting for not overly significant differences between the pallet and contract environments, we obtained a new artifact we call `balances_contract` - a small module (just over a thousand lines of Rust) that successfully passes all tests from the "fungible conformance" suite and compiles via the `cargo-contract` build system into a relatively compact (about 16 thousand lines in disassembled form) Wasm module.

Although this isolation method doesn't eliminate the problem of the module being loaded with ancillary infrastructure (in the disassembled listing of `balances_contract`, at most 20-25% of the code can be considered relevant to its accounting properties), an undoubted advantage is the emergence of a clearly delineated and documented boundary with its execution environment. The contract interface, unlike any boundary drawn inside a monolithic runtime, is a product of meaningful engineering design rather than the outcome of a combination of factors internal to FRAME infrastructure and the Rust compiler - one can quite firmly expect that its specification will be not only substantially simpler but also, possibly, more useful from the standpoint of subsequent result reuse. For formalization of any aspects of the monolithic runtime's internal structure to actually contribute to Polkadot's reliability (in the sense of "reliability" as understood in the verification industry), it would need to be inscribed in the context of a global specification of the entire runtime, which currently appears to be a very distant prospect. Verification of a contract-like module isolated into a separate module can subsequently be used as a reference for verifying other palletes, contracts, and critical algorithms that, regardless of their functionality, include the same infrastructure elements. Having once proven properties of, for example, the SCALE codec, call dispatcher, or vector allocator, we can generalize the concrete proof into a more universal tactic that solves this problem in advance for those users who want to truly ensure the reliability of their own implementations.

## Reproducibility guide

Compilation of contract into `.wasm` was performed by `cargo contract build --verifiable` toolchain in the following environment:

```plaintext
Operating System: Kubuntu 25.04
Kernel Version: 6.14.0-33-generic (64-bit)
Processors: 16 × AMD Ryzen 7 7840HS w/ Radeon 780M Graphics
Memory: 14.8 GiB of RAM
Source record of build json:
    "hash": "0x7130f80848d2f90872da6be9fdf595c4c222b6980eabe050fae953da53f90ea0",
    "language": "ink! 5.1.1",
    "compiler": "rustc 1.84.0",
    "build_info": {
      "build_mode": "Release",
      "cargo_contract_version": "5.0.3",
      "rust_toolchain": "stable-x86_64-unknown-linux-gnu",
      "wasm_opt_settings": {
        "keep_debug_symbols": false,
        "optimization_passes": "Z"
      }
    }
```

Binary was decompiled by `wasm2wat` version `1.0.36` and manually annotated. Bit-exactness of annotated module to the build atrifact was checked by comparing assembly output:

```plaintext
~/Git/pallet-balances-formal-verification/balances_contract$ wat2wasm balances_contract.wat 
~/Git/pallet-balances-formal-verification/balances_contract$ cmp balances_contract.wasm target/ink/polkadot_balances_contract_formal_verification.wasm 
```

We have encountered some build reproducability issues, as on other machines `cargo contract build --verifiable` was producing semanticaly equal, but not bit-exact (discrepancy in order of functions in the module, and thus different indexes) artifacts. Though, such minor differences have no significant impact on the preliminary analysis of formal methods application.

[WASM binary compilation artifact](https://github.com/Inferara/pallet-balances-formal-verification/blob/main/balances_contract/balances_contract.wasm)

### Textual description of fungible traits specification: public functions, involved in implementation of traits

The full description of the mapping of `pallet_balances` trait methods to WebAssembly implementation can be found in the [Mapping Pallet Balances Trait Methods to WebAssembly Implementation](https://github.com/Inferara/pallet-balances-formal-verification/blob/main/preparation/mapping-trait-methods-to-wasm-implementation.md) document.

## Analysis of `balances_contract` Disassembly Results and Verification Prospects

The annotated WebAssembly representation of `balances_contract` reveals a structure that is more malleable but still presents some challenges for formal verification. Below is the analysis of the key aspects and their implications for specification and verification efforts:

### 1. Structural Observations

The disassembled Wasm module exhibits a clear three-tier architecture:

**Infrastructure Layer (~30% of code)**
- Memory management primitives (`memcpy`, `memmove`, `memset`, `memcmp`)
- SCALE codec operations (encoding/decoding of Rust types to byte representations)
- Panic handlers and error reporting mechanisms
- Allocation primitives (`alloc`, `vec_reserve`, etc.)

**Host Interface Layer (~40% of code)**
- Storage operations wrapping `seal_get_storage`, `seal_set_storage`, `seal_clear_storage`
- Event emission via `seal_deposit_event`
- Caller identification and value transfer handling
- Cryptographic primitives (BLAKE2-256 hashing for storage keys)

**Business Logic Layer (~30% of code)**
- Message dispatchers (`dispatch_call`, `dispatch_deploy`)
- Balance operations (`transfer`, `mint`, `burn_from`)
- Account state management
- Lock/unlock mechanisms
- Query methods returning account data

### 2. Verification Challenges Specific to This Architecture

**Challenge 2.1: SCALE Codec Correctness**

The SCALE codec, being the serialization format for all contract state and messages, is ubiquitous throughout the code. Key functions like `encode_u128`, `encode_compact_u32`, and their decoding counterparts appear in every storage operation. To verify balance operations, we need guarantees that:

- **Encoding is deterministic and injective**: `∀x, y: encode(x) = encode(y) → x = y`
- **Decode is left-inverse to encode**: `∀x: decode(encode(x)) = Some(x)`
- **Encoding preserves value bounds**: `∀x: 0 ≤ x < 2^128 → length(encode(x)) = 16`

The current implementation uses complex bit-shifting operations (visible in the massive selector dispatch) to reconstruct multi-byte values from unaligned memory loads. Verifying these operations requires reasoning about:
- Byte-level memory layout
- Endianness guarantees (little-endian for `u128`)
- Overflow behavior during bit operations

**Recommended Approach**: Before attempting to verify balance invariants, establish a standalone specification of the SCALE codec subset used (`Compact<u32>`, `u32`, `u128`, `AccountId`, `Vec<T>`, `Option<T>`). This can be formalized as a bidirectional relation between Wasm memory regions and abstract Rust values, with proven round-trip properties.

**Challenge 2.2: Storage Key Generation Non-Injectivity**

The mapping from `AccountId → AccountData` uses BLAKE2-256 hashing to derive storage keys:

```wasm
storage_key = BLAKE2-256(mapping_prefix || account_id)
```

While BLAKE2-256 has strong collision-resistance properties for random inputs, verifying that this mapping is injective for our specific use case requires:
- Assuming collision-resistance of the cryptographic hash function as an axiom
- Showing that `mapping_prefix` doesn't overlap with other storage namespaces
- Guaranteeing that 32-byte `AccountId` encoding is canonical

The hash function itself is implemented in the host environment (`seal_hash_blake2_256`), not in the contract Wasm. Our specification must therefore axiomatize host function behavior.

**Recommended Approach**: Model storage as an abstract key-value store with axiomatic collision-freedom for distinct `(prefix, AccountId)` pairs. The actual collision resistance of BLAKE2-256 need not be proven; instead, we specify it as a precondition.

**Challenge 2.3: Message Dispatch Complexity**

Function `dispatch_call` is a 1000+ line implementing selector matching through deeply nested blocks. The selector matching logic uses a multi-level cascade:
1. First-level dispatch on selector byte 0 (br_table with 9 cases)
2. Second-level subtables for specific byte ranges (e.g., `0xC8`-`0xD0`, `0xF3`-`0xFA`)
3. Individual 4-byte exact matches for remaining selectors

This complexity arises from compiler optimization rather than semantic necessity. For verification purposes, we need to:
- Prove dispatch completeness: every valid 4-byte selector maps to exactly one handler
- Show that invalid selectors are rejected (return error, not panic)
- Verify parameter decoding correctness for each message type

**Recommended Approach**: Abstract the dispatch mechanism into a partial function `dispatch: (u32, &[u8]) → Result<MessageHandler>`. Prove that for all 35 supported selectors, this function returns the correct handler and correctly decodes parameters. The nested block structure can be abstracted away in the specification.

### 3. Balance Operation Verification Strategy

The core balance operations exhibit several patterns amenable to formal specification:

**Pattern 3.1: Checked Arithmetic with Overflow Handling**

All balance updates use explicit overflow checking (e.g., in function `deposit_into_account`):

```wasm
local.get 0          ;; account.free (low 64)
local.get 2          ;; amount (low 64)
i64.add
local.tee 11         ;; new_free (low 64)
local.get 7
i64.lt_u             ;; Check for carry
```

This pattern can be specified as:

```plaintext
checked_add(a: u128, b: u128) → Result<u128> where
  a + b < 2^128 → Ok(a + b)
  a + b ≥ 2^128 → Err(Overflow)
```

**Pattern 3.2: Preservation Mode Enforcement**

Functions like `transfer_with_checks` implement complex logic for preservation modes:

```plaintext
if preservation = Preserve then
  new_balance ≥ existential_deposit ∨ new_balance = 0
```

This requires verification that:
- `Expendable`: allows any final balance (including zero)
- `Preserve`: final balance ≥ ED or = 0 (dust is handled)
- `Protect`: final balance ≥ ED strictly (no dust)

**Pattern 3.3: Lock Respect During Withdrawals**

Function `transfer_with_checks` ensures transfers respect frozen balances:

```plaintext
usable_balance = account.free - account.frozen
withdraw_amount ≤ usable_balance
```

This must be proven for all withdrawal paths (transfer, burn, etc.).

### 4. Concrete Verification Challenges in the Annotated Code

Some specific sections of the provided WAT that present verification difficulties need to be highlighted:

**Challenge 4.1: Complex Control Flow in Dispatch**

The dispatch function has 68 nested blocks and a `br_table` with 35+ cases. While this is semantically equivalent to a simple switch statement, proving its correctness requires:
- Showing that all reachable branches decode parameters correctly
- Verifying that byte-shifting reconstructions (e.g., lines reconstructing u128 from unaligned i64 loads) preserve values
- Ensuring no undefined behavior from alignment violations (WebAssembly allows unaligned loads, but correctness depends on reconstruction logic)

**Example** from selector matching (handler 4, mint):

```wasm
local.get 1
i64.load offset=27 align=1     ;; Load 8 bytes at offset 27 (unaligned)
local.tee 11
i64.const 56
i64.shl                         ;; Shift left 56 bits
local.get 1
i64.load offset=19 align=1     ;; Load 8 bytes at offset 19
local.tee 10
i64.const 8
i64.shr_u                       ;; Shift right 8 bits
i64.or                          ;; Combine to reconstruct u128 low 64 bits
local.set 12                    ;; Store as amount_low
```

This reconstructs a little-endian u128 from two overlapping unaligned `i64` loads. To verify this preserves the encoded value, we need to prove:

```plaintext
∀ bytes[0..16]: u128::from_le_bytes(bytes) = 
  (bytes[11..19] as u64) << 56 | (bytes[19..27] as u64) >> 8
```

**Challenge 4.2: Lock Aggregation Correctness**

The `set_lock` implementation searches a vector for an existing lock ID, updates it, or appends a new entry. The maximum lock amount is then recalculated:

```wasm
;; Pseudo-specification:
∀ account: account.frozen = max { lock.amount | lock ∈ locks(account) }
```

Verifying this requires:
1. Proving the vector search correctly identifies matching `lock.id`
2. Showing that `max` computation iterates over all locks
3. Ensuring no lock is inadvertently dropped during vector operations

The vector growth logic (function `vec_reserve`) must preserve all existing elements.

**Challenge 4.3: Dust Handling Soundness (Function `check_deposit_feasibility`)**

The dust collection mechanism (transferring sub-ED balances to `dust_trap`) must maintain total issuance:

```plaintext
Pre:  total_issuance = Σ(account.free) + Σ(account.reserved)
Post: total_issuance' = Σ(account'.free) + Σ(account'.reserved)
      ∨ (dust_trap.is_none() ∧ total_issuance' = total_issuance - dust_removed)
```

The current implementation (scattered across several functions) handles dust in multiple code paths. Verification requires:
- Proving all paths correctly update `total_issuance`
- Showing no double-counting or loss of tokens
- Verifying `DustLost` events are emitted if and only if dust is burned

## Roadmap for Incremental Verification

Given the complexity, we propose **incremental formalization** rather than attempting to verify the entire contract at once. Realistically, this endeavor can be approached in three phases:

### Foundation Phase (Infrastructure Axiomatization)

**Step 1: Codec Verification**
- Prove round-trip properties for SCALE encoding/decoding of:
  - `u32`, `u64`, `u128`
  - `Compact<u32>`
  - `AccountId` (32-byte array)
  - `Option<T>`, `Result<T, E>`
- **Goal**: Proven lemma `∀x: T. decode(encode(x)) = Some(x)` for each type

**Step 2: Storage Abstraction**
- Model storage as a partial map `Storage: (Prefix × Key) ⇀ Value`
- Prove storage operations maintain:
  - **Set-Get Round-trip**: `storage_set(k, v); storage_get(k) = Some(v)`
  - **Key Isolation**: `k₁ ≠ k₂ → storage_set(k₁, v₁) doesn't affect storage_get(k₂)`
- Abstract away BLAKE2 hashing (assume collision-free)

### Business Logic Phase (Functional Correctness)

**Step 3: Core Balance Invariants**
- Prove for `mint`, `burn_from`, `transfer`:
  - **Total Conservation** (with dust accounting)
  - **Non-Negativity**
  - **Overflow Freedom** (all checked arithmetic succeeds within preconditions)
- Define **invariant predicate** `I(state)`:
  ```plaintext
  I(state) ≜ 
    total_issuance = Σ(account.free) + Σ(account.reserved) - dust_lost ∧
    ∀ account: account.free ≥ 0 ∧
    ∀ account: account.free > 0 → account.free ≥ ED ∨ in_dust_handling(account)
  ```
- Prove `∀ msg: {I(state)} handle(msg) {I(state')}`

**Step 4: Lock Mechanism Verification**
- Prove lock invariant: `∀ account: frozen = max(locks.map(_.amount))`
- Show `set_lock` and `remove_lock` maintain this invariant
- Verify that `usable_balance = free - frozen` is respected during withdrawals

### Integration Phase

**Step 5: End-to-End Message Safety**
- Prove dispatch function correctness:
  - All 35 selectors decode parameters correctly
  - Invalid selectors return `Err` (not panic)
- Verify panic-freedom under all valid inputs
- Establish refinement relation between Wasm execution and high-level specification

### Expected Outcomes and Limitations

**Preliminary Time Expenditure**: 2 months per phase, 6 month total

**What Can Be Achieved**:
- **High Assurance** for balance conservation, non-negativity, and overflow freedom under specified preconditions
- **Proven Message Dispatch Correctness**: all valid inputs lead to correct handler invocation
- **Formally Verified SCALE Codec Subset**: reusable for other Ink! contracts
- **Lock Mechanism Soundness**: frozen balances correctly computed from lock vector

**What Remains Out of Scope** (due to axiomatization):
- **Host Function Bugs**: We assume `seal_get_storage` etc. behave as specified; bugs in Substrate's implementation are not caught
- **Cryptographic Assumptions**: BLAKE2 collision resistance is assumed, not proven

### Contract Infrastructure reasoning applicability comparison with the whole Polkadot runtime

Verifying `balances_contract` versus `pallet_balances` in the monolithic runtime:

| Aspect | Contract (Wasm) | Runtime (Native) |
|--------|----------------|------------------|
| **Code Size** | 16K WAT lines (~4K business logic) | 2M+ assembly lines |
| **Boundary Clarity** | Clean ABI (message selectors) | Implicit (no formal interface) |
| **Infrastructure Isolation** | Host functions axiomatized | Entangled with runtime internals |
| **Reusability of Proofs** | High (other Ink! contracts) | Low (Polkadot-runtime specific) |
| **Feasibility** | Challenging but tractable | Currently impractical |

## Conclusion

The `balances_contract` provides a **significantly more tractable target** for formal verification than the monolithic runtime `pallet_balances`, primarily due to:
1. **Clear interface boundaries** (message selectors, host function ABI)
2. **Manageable code size** (~16K lines, of which ~4K are business logic)
3. **Isolation from runtime complexity** (host functions abstract Substrate internals)

However, **some challenges remain**:
- SCALE codec verification requires reasoning about byte-level memory layout
- Lock mechanism correctness depends on vector operation proofs
- Preservation mode logic is intricate with multiple interacting conditions

A **phased approach** starting with infrastructure axiomatization, then core balance invariants, and finally end-to-end message safety offers the best balance between ambition and feasibility.

{{<post-socials page_content_type="blog" telegram_post_id="37" x_post_id="1985161277346562147">}}
