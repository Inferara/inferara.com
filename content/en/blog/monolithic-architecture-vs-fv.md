+++
title = "Monolithic Architecture vs. Formal Verification: The Combinatorial Explosion Problem"
date = 2025-12-17T15:56:00+09:00
draft = false
math = "katex"
summary = "Monolithic architectures create combinatorial explosions in verification complexity. Modular boundaries tame this growth, making bytecode-level formal verification tractable."
tags = ["Architecture", "Formal Verification", "Stellar", "Polkadot", "Arbitrum"]
aliases = ["/blog/monolithic-architecture-vs-fv"]
+++

**Table of contents**

- [1. Introduction](#1-introduction)
- [2. What the Compiler Does to Your Code](#2-what-the-compiler-does-to-your-code)
  - [2.1 The Semantic Gap](#21-the-semantic-gap)
  - [2.2 The Rogues' Gallery of Optimizations](#22-the-rogues-gallery-of-optimizations)
  - [2.3 Link-Time Optimization (LTO): When It Gets Worse](#23-link-time-optimization-lto-when-it-gets-worse)
- [3. The Combinatorial Pain Point](#3-the-combinatorial-pain-point)
  - [3.1 State Space Explosion](#31-state-space-explosion)
  - [3.2 The Monolithic Multiplier](#32-the-monolithic-multiplier)
  - [3.3 Why Monoliths Make It Worse](#33-why-monoliths-make-it-worse)
  - [3.4 Concrete Complexity Estimates](#34-concrete-complexity-estimates)
- [4. Concrete Examples](#4-concrete-examples)
  - [4.1 Polkadot Substrate: The Monolithic Runtime Problem](#41-polkadot-substrate-the-monolithic-runtime-problem)
  - [4.2 Stellar Soroban: Designed for Verification Boundaries](#42-stellar-soroban-designed-for-verification-boundaries)
  - [4.3 Arbitrum Stylus: The Hybrid Approach](#43-arbitrum-stylus-the-hybrid-approach)
  - [4.4 Synthesis: What the Examples Teach Us](#44-synthesis-what-the-examples-teach-us)
    - [The Boundary Principle Validated](#the-boundary-principle-validated)
    - [The Performance-Verification Trade-off is Real](#the-performance-verification-trade-off-is-real)
    - [Architectural Decisions are Verification Decisions](#architectural-decisions-are-verification-decisions)
- [5. Why Microservices/Modular Boundaries Help](#5-why-microservicesmodular-boundaries-help)
  - [5.1 The Verification Boundary Principle](#51-the-verification-boundary-principle)
  - [5.2 Compositional Verification](#52-compositional-verification)
  - [5.3 The Microservice Verification Advantage](#53-the-microservice-verification-advantage)
  - [5.4 The Cost of Boundaries](#54-the-cost-of-boundaries)
- [6. Practical Architectural Strategies](#6-practical-architectural-strategies)
    - [Identify Your Verification Targets Early](#identify-your-verification-targets-early)
    - [The Verification Kernel Pattern](#the-verification-kernel-pattern)
    - [Design Boundaries the Compiler Cannot Cross](#design-boundaries-the-compiler-cannot-cross)
    - [Minimize Generics in Verification Targets](#minimize-generics-in-verification-targets)
    - [Thoughtful Compilation and Building](#thoughtful-compilation-and-building)
    - [Specification as a natural part of documentation](#specification-as-a-natural-part-of-documentation)
- [7. Conclusion](#7-conclusion)


**When one attempts bytecode-level formal verification on monolithic systems, the compiler becomes an adversary.** Every optimization, every inlined function, every monomorphization of generics _that could have been avoided_ creates verification obligations that grow combinatorially with system complexity.

## 1. Introduction

Humanity has already grown accustomed to the fact that damage from software engineering errors can be measured in tens of millions of dollars. Many methods have been invented to combat this, yet few can stand alongside classical formal verification of executable modules at the bytecode level in terms of the reliability of the guarantees they provide. The problem is that the very idea of bytecode-level verification naturally tempts one to postpone questions of reliability until the appearance of the actual executable module subject to verification. However, without prior architectural planning that accounts for the difficulties one will almost inevitably encounter on this path, applying formal methods in this way has extremely little chance of success.

The enticing promise of formal verification is _total correctness_ -mathematical proof that your code does exactly what it should, and nothing else. But this promise comes with a brutal caveat: **you are not verifying the code you wrote; you are verifying the code the compiler produced**. Between your elegant source and the actual executing bytecode lies a transformation pipeline that can - and will - destroy the structural assumptions your verification strategy depends upon.

We argue that architectural decisions made at project inception have profound, often deterministic effects on whether formal verification remains tractable. Specifically, we demonstrate that monolithic architectures create verification state spaces that grow superlinearly with system size, while modular architectures with well-defined boundaries can reduce verification complexity to something manageable - or at least, not catastrophically unmanageable.

## 2. What the Compiler Does to Your Code

### 2.1 The Semantic Gap

When one writes:

```rust
fn calculate_interest(principal: u64, rate: f64, years: u32) -> f64 {
    principal as f64 * rate * years as f64
}

fn process_account(account: &Account) -> f64 {
    calculate_interest(account.balance, account.rate, account.tenure)
}
```

You imagine two discrete functions with a clear call boundary. The compiler sees an optimization opportunity. After inlining, constant propagation, and dead code elimination, in the bytecode you may see:

- No function boundary exists anymore
- `calculate_interest` has been absorbed into `process_account`
- If `rate` was constant-propagated, the multiplication might be strength-reduced
- The u64→f64 conversions might be fused with the multiplication on certain architectures

**This is not a bug.** This is the compiler doing its job - producing fast code. But every transformation it applies creates a _semantic gap_ between what you wrote and what you must verify.

### 2.2 The Rogues' Gallery of Optimizations

The following compiler behaviors are particularly destructive to verification tractability:

**Inlining**

Inlining eliminates call boundaries, merging the callee's code into the caller. For verification:

- The verifier can no longer reason about `calculate_interest` in isolation
- Every call site becomes a separate verification target
- If `calculate_interest` is called from $n$ locations, you now have $n$ separate copies of its logic to verify, each in a different context

**Monomorphization**

Generic code like:

```
fn max<T: Ord>(a: T, b: T) -> T {
    if a > b { a } else { b }
}
```

becomes, at bytecode level, potentially dozens of concrete implementations:

- `max_u32`
- `max_u64`
- `max_i32`
- `max_String`
- `max_MyCustomType`
- ...

Each monomorphized instance is a separate verification target. A generic function called with $k$ distinct type instantiations produces $k$ copies of the verification obligation.

**Loop Unrolling**

```
for i in 0..4 {
    buffer[i] = 0;
}
```

May become:

```
mov [buffer + 0], 0
mov [buffer + 1], 0
mov [buffer + 2], 0
mov [buffer + 3], 0
```

The original loop had a single invariant to verify. The unrolled version requires reasoning about four separate memory operations and their interactions.

**Devirtualization and Speculative Optimization**

When the compiler can prove (or probabilistically guess) the concrete type behind a trait object or interface, it may:

- Replace virtual calls with direct calls
- Inline the now-known concrete implementation
- Apply further optimizations to the result

This destroys the abstraction boundaries that made your architecture comprehensible.

### 2.3 Link-Time Optimization (LTO): When It Gets Worse

Modern compilers offer _link-time optimization_, which defers many optimization decisions until all compilation units are visible. This means:

- Functions you thought were in separate modules can be inlined across module boundaries
- The _entire program_ becomes a single optimization target
- Call graphs that looked modular at source level become arbitrarily tangled at bytecode level

With LTO enabled on a monolithic codebase, **there are no boundaries the compiler must respect**.

## 3. The Combinatorial Pain Point

### 3.1 State Space Explosion

Formal verification fundamentally involves exploring a state space. For a program with $n$ boolean variables, the naive state space has $2^n$ states. Real programs have vastly larger state spaces due to:

- Integer variables with wide ranges
- Pointer aliasing possibilities
- Concurrent interleavings
- Floating-point states

Verification tools manage this through _abstraction_ - grouping states into equivalence classes and reasoning about representatives. But abstraction requires _structure_: recognizable patterns, function boundaries, loop invariants, module interfaces.

**When the compiler destroys structure, it destroys the verifier's ability to abstract.**

### 3.2 The Monolithic Multiplier

Consider a monolithic system with $n$ modules, each with $m$ functions, where the compiler performs aggressive whole-program optimization. The verification state space growth can be modeled as:

$$S_{\text{mono}} = O\left(\prod_{i=1}^{n} \prod_{j=1}^{m} |s_{ij}|\right)$$

where $|s_{ij}|$ is the state space of function $j$ in module $i$.

In a _truly modular_ system where module boundaries are preserved, this becomes:

$$S_{\text{modular}} = O\left(\sum_{i=1}^{n} \prod_{j=1}^{m} |s_{ij}|\right)$$

The difference between product-of-products and sum-of-products is the difference between **tractable and impossible**.

### 3.3 Why Monoliths Make It Worse

In a monolithic architecture:

1. **Everything can call everything.** Without enforced boundaries, the compiler's inlining and optimization decisions create cross-cutting dependencies that span the entire codebase.

2. **Shared state multiplies.** Global variables, singletons, and shared mutable state create verification obligations that must consider all possible interleavings of all possible accessors.

3. **Types propagate unboundedly.** A generic utility function at the "bottom" of your codebase may be monomorphized with types from the "top," creating verification obligations that require understanding the entire system.

4. **Changes have non-local effects.** Modifying one function can change the optimization decisions for distant code, invalidating previous verification efforts.

### 3.4 Concrete Complexity Estimates

Let's make this painfully concrete. Consider verifying memory safety for a function that:
- Takes $p$ pointer arguments
- Contains a loop bounded by a 32-bit integer
- Calls several other functions (post-inlining)

With bounded model checking:
- Each pointer has aliasing possibilities: $O(p^2)$ where $p$ is pointer count
- Loop bound exploration: $O(2^{32})$ worst case, or $O(k)$ with invariant
- Each inlined function multiplies the path count

A verification query might involve:

$$\text{Paths} \approx (\text{branch factor})^{\text{depth}} \times \text{loop iterations} \times \text{aliasing configurations}$$

For a monolithic system where a "core" function is inlined into 100 call sites, each in different contexts, you're looking at 100× the verification work - **minimum**. More realistically, the different contexts create different path explosions, and you're looking at orders of magnitude more.

---
## 4. Concrete Examples

Blockchain platforms provide an ideal lens for examining bytecode-level verification challenges. They are:
- **High-stakes**: Bugs directly translate to financial losses, often irrecoverable
- **Bytecode-executed**: Smart contracts run as bytecode on virtual machines
- **Heavily optimized**: Gas costs create intense pressure to minimize bytecode size and execution
- **Compositional by nature**: Contracts call other contracts, creating complex interaction patterns

We examine three contemporary platforms that represent fundamentally different architectural philosophies: Polkadot Substrate, Stellar Soroban, and Arbitrum Stylus.

### 4.1 Polkadot Substrate: The Monolithic Runtime Problem

Based on [research](https://www.inferara.com/en/blog/preparing-polkadot-pallet-balances-for-formal-verification/) we conducted for a Web3 Foundation grant. Our experience of evaluating `pallet_balances` for formal verifiability potential became the main inspiration for this article.

**Architecture Overview**

Substrate framework is designed to be evergrowing collection of reusable, type-safe and performant implementations for the most common patterns of blockchain accounting. Developers are encouraged to build their own combinations of its components and extend with custom functionality at will. Sophisticated build system combines everything into a single, heavily optimized WebAssembly module. A typical Substrate runtime consists of:

- **Pallets**: Modular components providing specific functionality (balances, staking, governance, etc.)
- **Runtime composition**: All pallets compiled together into one Wasm binary
- **Host functions**: Interface between the Wasm runtime and the node's native code

```rust
// Typical Substrate runtime composition
construct_runtime!(
    pub enum Runtime where
        Block = Block,
        NodeBlock = opaque::Block,
        UncheckedExtrinsic = UncheckedExtrinsic
    {
        System: frame_system,
        Timestamp: pallet_timestamp,
        Balances: pallet_balances,
        Staking: pallet_staking,
        Democracy: pallet_democracy,
        // ... potentially dozens more pallets
    }
);
```
**The Verification Challenge**

This architecture creates severe verification challenges:

**1. Monomorphization Explosion**

Substrate makes heavy use of Rust generics for flexibility. A pallet is typically generic over:

```rust
pub trait Config: frame_system::Config {
    type RuntimeEvent: From<Event<Self>> + IsType<<Self as frame_system::Config>::RuntimeEvent>;
    type Currency: ReservableCurrency<Self::AccountId>;
    type WeightInfo: WeightInfo;
    // ... many more associated types
}
```

When the runtime is compiled, each pallet's generic code is monomorphized with the concrete runtime types. A single utility function in `frame_support` might be instantiated hundreds of times with different type parameters.

Consider a simplified example of state access:

```rust
// In frame_support
pub fn get<T: Decode>(key: &[u8]) -> Option<T> {
    storage::get(key).and_then(|v| T::decode(&mut &v[..]).ok())
}
```

This innocent-looking function, after monomorphization across all storage types in all pallets, might generate 50+ distinct bytecode implementations. Each requires separate verification.

**2. Cross-Pallet Coupling**

Pallets interact through trait bounds and runtime composition:

```rust
// Staking pallet depends on Currency
impl<T: Config> Pallet<T> {
    pub fn bond(origin: OriginFor<T>, value: BalanceOf<T>) -> DispatchResult {
        let stash = ensure_signed(origin)?;
        // This call goes to pallet_balances, but after compilation,
        // the boundary may be erased entirely
        T::Currency::reserve(&stash, value)?;
        // ...
    }
}
```

At source level, this looks modular. At bytecode level, after LTO (which Substrate uses aggressively for performance), the `reserve` call may be inlined, and the "boundary" between staking and balances logic ceases to exist.

**3. State Space Multiplication**

The verification state space for a Substrate runtime can be approximated as:

$$S_{\text{substrate}} \approx \prod_{p \in \text{pallets}} |S_p| \times |\text{interleavings}|$$

For a runtime with 30 pallets, even if each pallet has a "modest" state space of $10^6$ states, the combined space exceeds $10^{180}$ — vastly larger than the number of atoms in the observable universe.

**Lessons for Verification Architecture**

Substrate illustrates the verification cost of runtime flexibility:

| Feature                   | Developer Benefit | Verification Cost          |
| ------------------------- | ----------------- | -------------------------- |
| Generic pallets           | Reusability       | Monomorphization explosion |
| Tight coupling via traits | Type safety       | Boundary erasure           |
| Whole-program LTO         | Performance       | Cross-cutting optimization |

It must be noted, that benefits of flexibility are undoubtful virtues, deserving to be pursued. We just need to take into account the less obvious downsides of chasing them.

### 4.2 Stellar Soroban: Designed for Verification Boundaries

**Architecture Overview**

Soroban, Stellar's smart contract platform, took a radically different approach. Rather than compiling everything together, Soroban enforces strict separation:

```plaintext
┌────────────────────────────────────────────────────────┐
│                    Stellar Core                        │
│  (Native code, handles consensus, ledger operations)   │
├────────────────────────────────────────────────────────┤
│                    Soroban Host                        │
│  (Defines host functions, enforces boundaries)         │
├──────────┬──────────┬──────────┬──────────┬────────────┤
│Contract A│Contract B│Contract C│Contract D│ Contract E │
│  (Wasm)  │  (Wasm)  │  (Wasm)  │  (Wasm)  │   (Wasm)   │
└──────────┴──────────┴──────────┴──────────┴────────────┘
```

Protocol core serves purely as p2p-connected cryptographic ledger - an abstract state machine that delegates all particularities of accounting to the hosted contracts. This design does not encourage core or host customization as there is nothing meaningful to add or remove there. All business logic (normally handled in Substrate by pallets) here is the responsibility of a contract.  Key architectural decisions:

**1. Small, Independent Contracts**

Each Soroban contract compiles to its own Wasm module. There is no "runtime composition" that merges contracts:

```rust
// Soroban contract - this compiles to an independent Wasm blob
#[contract]
pub struct TokenContract;

#[contractimpl]
impl TokenContract {
    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();
        // All storage access goes through env, not direct state access
        let from_balance: i128 = env.storage().persistent().get(&from).unwrap_or(0);
        // ...
    }
}
```

**2. Host Function Boundary**

All interaction with the outside world goes through a defined host function interface:

```rust
// These are the ONLY ways a contract can affect the world
env.storage()       // Read/write contract storage
env.events()        // Emit events  
env.invoke_contract() // Call another contract (cross-contract call)
env.crypto()        // Cryptographic operations
```

The host function boundary is **physical**: it's the Wasm import/export mechanism. The compiler cannot inline across it because the host functions are external to the Wasm module.

**3. No Shared Mutable State**

Contracts cannot share memory. All cross-contract communication is explicit:

```rust
// Contract A calling Contract B
let result: i128 = env.invoke_contract(
    &contract_b_address,
    &Symbol::new(&env, "get_price"),
    vec![&env, asset.into_val(&env)]
);
```

This call is:
- Visible in the bytecode as a host function invocation
- Cannot be optimized away or inlined
- Has explicit parameters that can be formally specified

**4. Constrained Type System**

Soroban deliberately limits the types that can cross boundaries. Only these types can be passed to/from host functions:
- `i32`, `u32`, `i64`, `u64`, `i128`, `u128`
- `Bool`, `Symbol`, `Address`, `Bytes`, `String`
- `Vec<T>`, `Map<K,V>` where T, K, V are valid Soroban types

This constraint eliminates an entire class of verification complexity: reasoning about arbitrary type layouts and representations.

**Verification Tractability**

Soroban's architecture transforms verification complexity:

**1. Per-Contract Verification**

Each contract is verified independently:

$$S_{\text{soroban}} = \sum_{c \in \text{contracts}} |S_c| + \sum_{(c_i, c_j) \in \text{interactions}} |S_{\text{interface}_{ij}}|$$

This is sum, not product. A bug in Contract A cannot affect Contract B's internal invariants (only the values Contract B receives via explicit calls).

**2. Bounded Host Function Semantics**

The host function interface has formally specifiable semantics:

```rust
// Formal specification of storage host function (pseudocode)
host_function storage_get(key: Bytes) -> Option<Val>
  requires: key.len() <= MAX_KEY_SIZE
  ensures: result == STORAGE[contract_id][key]
  
host_function storage_put(key: Bytes, val: Val) -> ()
  requires: key.len() <= MAX_KEY_SIZE && val.size() <= MAX_VAL_SIZE
  modifies: STORAGE[contract_id][key]
  ensures: STORAGE[contract_id][key] == val
```

Verification can assume these semantics rather than re-verifying them for each contract.

**The Trade-off: Performance and Flexibility**

Soroban's verification-friendly architecture comes at costs:

| Verification Benefit     | Performance/Flexibility Cost              |
| ------------------------ | ----------------------------------------- |
| Independent Wasm modules | No cross-contract inlining; call overhead |
| Host function boundary   | Every operation pays crossing cost        |
| No shared memory         | Data must be serialized/deserialized      |
| Constrained types        | Cannot use arbitrary Rust types           |

Anticipated overhead: Without proper comparative benchmarking of WebAssembly-centered blockchains one can only speculate, but common sense suggests, that Soroban contracts, prevented from utilizing most potent optimization techniques, may execute 2-5× slower than equivalent Substrate pallet code for compute-heavy operations. The verification advantage, though, is decisive: **Soroban contracts can actually be verified in their current state without significant modifications**.

### 4.3 Arbitrum Stylus: The Hybrid Approach

**Architecture Overview**

Arbitrum Stylus along with Stellar Soroban chooses path of not interleaving framework with accounting logic in single binary module. However, it introduces other unique challenges, stemming from its multi-VM architecture:

```plaintext
┌────────────────────────────────────────────────────────────┐
│                    Arbitrum Chain                          │
├────────────────────────────────────────────────────────────┤
│                    Stylus VM                               │
│  ┌────────────────────┐    ┌────────────────────┐          │
│  │    Wasm Contracts  │    │    EVM Contracts   │          │
│  │  (Rust, C, C++)    │    │    (Solidity)      │          │
│  └────────────────────┘    └────────────────────┘          │
│              │                      │                      │
│              └──────────┬───────────┘                      │
│                         │                                  │
│              ┌──────────▼───────────┐                      │
│              │  Host I/O Interface  │                      │
│              │   (Shared State)     │                      │
│              └──────────────────────┘                      │
└────────────────────────────────────────────────────────────┘
```

Key architectural decisions:

**1. Separate Compilation, Shared State**

Each Stylus contract compiles independently (Wasm or EVM bytecode), but contracts share the Ethereum-style state model:

```rust
// Stylus contract (Rust)
sol_storage! {
    #[entrypoint]
    pub struct Counter {
        uint256 count;
        mapping(address => uint256) balances;
    }
}

#[external]
impl Counter {
    pub fn increment(&mut self) {
        let count = self.count.get();
        self.count.set(count + U256::from(1));
    }
}
```

Storage layout follows Ethereum conventions, allowing interoperability with EVM contracts.

**2. Cross-VM Calls**

Stylus contracts can call both Wasm and EVM contracts through a unified interface:

```rust
// Calling an EVM contract from Wasm
let result = call(
    Call::new()
        .gas(50000)
        .value(U256::ZERO),
    evm_contract_address,
    &calldata
)?;

// Calling a Wasm contract from Wasm (same interface)
let result = call(
    Call::new()
        .gas(50000),
    wasm_contract_address,
    &calldata
)?;
```

**3. The HostIO Layer**

All state access and cross-contract calls go through a Host I/O layer:

```rust
// From stylus-sdk: all storage operations are host calls
extern "C" {
    fn storage_load_bytes32(key: *const u8, dest: *mut u8);
    fn storage_store_bytes32(key: *const u8, value: *const u8);
    fn call_contract(
        contract: *const u8,
        calldata: *const u8,
        calldata_len: usize,
        value: *const u8,
        gas: u64,
        return_data_len: *mut usize,
    ) -> u8;
}
```

Like Soroban, this creates a physical boundary the compiler cannot cross.

**The Hybrid Verification Challenge**

Stylus introduces unique verification complexity due to its hybrid nature:

**1. Cross-VM Semantics**

When a Wasm contract calls an EVM contract, verification must reason about:
- Wasm semantics for the caller
- EVM semantics for the callee
- The translation layer between them
- Reentrancy across VM boundaries

```plaintext
Wasm Contract A                    EVM Contract B
     │                                   │
     │ ── call() ──────────────────────► │
     │                                   │
     │    ┌─────────────────────────┐    │
     │    │ Semantic translation:   │    │
     │    │ - Wasm→EVM ABI encoding │    │
     │    │ - Gas accounting        │    │
     │    │ - Error propagation     │    │
     │    └─────────────────────────┘    │
     │                                   │
     │ ◄─── return ────────────────────  │
     │                                   │
```

**2. Shared State Complexity**

Unlike Soroban, Stylus contracts share the global Ethereum state trie. This reintroduces state space multiplication:

$$S_{\text{stylus}} = \sum_{c \in \text{contracts}} |S_c| + |S_{\text{shared}}|^{|\text{contracts accessing it}|}$$

When multiple contracts can modify the same storage slot, verification must consider all interleavings.

**3. Monomorphization Within Contracts**

While contracts are independently compiled, the Stylus SDK uses Rust generics internally:

```rust
// This generic impl generates multiple bytecode paths
impl<T: TopLevelStorage> StorageCache for T {
    fn flush(&mut self) {
        // Generic code monomorphized per storage type
    }
}
```

Each contract may contain monomorphized code for all its storage types, increasing intra-contract verification complexity.

**4. The Reentrancy Matrix**

Stylus inherits Ethereum's reentrancy model. Any external call can result in a callback. The verification space for reentrancy scenarios grows as:

$$R = |\text{external calls}| \times |\text{public functions}| \times |\text{call depth limit}|$$

With Arbitrum's generous gas limits, deep call stacks are possible.

**Stylus: Verification Complexity Compared**

| Aspect | Substrate | Soroban | Stylus |
|--------|-----------|---------|--------|
| Compilation unit | Entire runtime | Single contract | Single contract |
| Cross-unit boundaries | Erased by LTO | Physical (host functions) | Physical (host functions) |
| Shared state | Full access within runtime | None | Ethereum state trie |
| Monomorphization | Extreme | Minimal | Moderate |
| Verification tractability | Low | High | Medium |
| Reentrancy concern | N/A (sequential) | Explicit control | Full Ethereum model |

### 4.4 Synthesis: What the Examples Teach Us

These three platforms illuminate a spectrum of architectural choices and their verification consequences:

#### The Boundary Principle Validated

Soroban demonstrates that **physical boundaries enable tractable verification**. The host function interface creates an uncrossable barrier that:
- Prevents compiler optimizations from destroying abstraction
- Forces explicit interface contracts
- Enables compositional reasoning

Substrate demonstrates the converse: **logical boundaries are insufficient**. Despite Rust's module system and FRAME's pallet architecture, the compiler's whole-program view eliminates verification boundaries.

#### The Performance-Verification Trade-off is Real

Soroban pays for verification tractability with:
- Execution overhead for host function crossing
- Restricted expressiveness (no arbitrary Rust types)
- No cross-contract optimization

Stylus attempts to minimize this trade-off but inherits EVM's shared-state complexity.

Substrate maximizes performance but renders bytecode-level verification impractical for the full runtime.

#### Architectural Decisions are Verification Decisions

The most important insight: **the time to decide on verification architecture is before writing the first line of code**. 

- Soroban's verification tractability is the result of deliberate architectural constraints imposed from the beginning.
- Substrate's verification challenges are not failures, they're the predictable consequence of prioritizing flexibility over verifiability.

## 5. Why Microservices/Modular Boundaries Help

### 5.1 The Verification Boundary Principle

**A verification boundary is only useful if the compiler respects it.**

Source-level modules provide logical organization but no verification benefit if the compiler erases them. To create meaningful verification boundaries, you need:

1. **Physical separation**: Separate compilation units, ideally separate processes
2. **Interface contracts**: Formally specified preconditions, postconditions, and invariants at the boundary
3. **No shared mutable state**: Communication through well-defined channels only
4. **Runtime enforcement**: The boundary exists at bytecode level, not just in the developer's mind

Microservices naturally provide all four properties. Other architectural patterns can provide subsets.

### 5.2 Compositional Verification

With proper boundaries, verification becomes *compositional*:

1. **Verify each module against its interface contract**
2. **Prove that module composition preserves properties** (given that each module satisfies its contract)

The key insight: you verify module A assuming module B satisfies its contract, and verify module B assuming module A satisfies its contract. You never need to consider the full state space of A × B simultaneously.

This transforms the complexity from:

$$S = S_A \times S_B$$

to:

$$S = S_A + S_B + S_{\text{interface}}$$

where $S_{\text{interface}}$ is the (typically much smaller) state space of the interface contract verification.

### 5.3 The Microservice Verification Advantage

Microservices provide verification advantages beyond mere modularity:

**Independent Deployment = Independent Verification**

Each microservice can be verified independently of others. When Service A is updated, only Service A needs re-verification (assuming interface contracts are unchanged).

**Technology Heterogeneity**

Different services can use different languages optimized for verifiability. Your critical payment calculation might run in a formally verified DSL, while your user interface runs in JavaScript. The network boundary ensures the unverified code cannot corrupt the verified code's invariants.

**Forced Interface Explicitness**

Network boundaries force interfaces to be explicit and serializable. You *cannot* accidentally pass a reference that creates hidden coupling. The interface contract is literally the wire protocol.

**State Isolation**
Each microservice owns its state exclusively. Concurrent access patterns are constrained to message passing. This eliminates entire categories of concurrency verification obligations.

### 5.4 The Cost of Boundaries

Boundaries are not free. The verification advantages come with:

- **Distributed systems complexity**: Network failures, partial failures, consistency challenges
- **Interface versioning**: Changes to contracts require coordination
- **Performance overhead**: Serialization, network latency, no inlining across boundaries

The architectural choice involves trading *verification complexity* for *operational complexity*. For safety-critical systems where correctness is paramount, this trade is often favorable.

## 6. Practical Architectural Strategies

Having examined how architectural choices in Substrate, Soroban, and Stylus affect verification tractability, we now derive actionable strategies.

#### Identify Your Verification Targets Early

Before writing code, explicitly classify each component:

| Classification | Examples | Verification Approach |
|---------------|----------|----------------------|
| **Safety-Critical** | Fund transfers, cryptographic signatures, consensus logic | Full formal verification at bytecode level |
| **Security-Critical** | Access control, authentication, rate limiting | Formal verification of key properties + extensive testing |
| **Correctness-Critical** | Business logic, calculations, state transitions | Model checking + property-based testing |
| **Quality-Critical** | User interfaces, logging, non-essential features | Standard testing practices |

#### The Verification Kernel Pattern

Inspired by microkernel OS design, structure your system with a minimal verified core:

```plaintext
┌────────────────────────────────────────────────────────────┐
│                 Application / Interface Layer              │
│         (Complex, frequently changing, not verified)       │
│                                                            │
│   ┌─────────────────────────────────────────────────────┐  │
│   │                Adapter / Glue Layer                 │  │
│   │      (Translates between app and kernel)            │  │
│   └──────────────────────┬──────────────────────────────┘  │
│                          │                                 │
│   ╔══════════════════════╧════════════════════════════╗    │
│   ║            Verification Kernel                    ║    │
│   ║   ┌──────────┐ ┌──────────┐ ┌──────────────┐      ║    │
│   ║   │ Transfer │ │ Escrow   │ │ Multi-sig    │      ║    │
│   ║   │ Logic    │ │ Logic    │ │ Verification │      ║    │
│   ║   └──────────┘ └──────────┘ └──────────────┘      ║    │
│   ║                                                   ║    │
│   ║   Properties: total_supply_conserved,             ║    │
│   ║               all_transfers_authorized,           ║    │
│   ║               no_double_spend                     ║    │
│   ╚═══════════════════════════════════════════════════╝    │
└────────────────────────────────────────────────────────────┘
```

**Key Principles:**
1. The kernel is **physically separate** (own binary module, own deployment)
2. The kernel has **minimal functionality** (only what needs verification)
3. The kernel has **no dependencies on unverified code**
4. The kernel's **interface is the verification contract**

#### Design Boundaries the Compiler Cannot Cross

Source-level boundaries (modules, visibility) are suggestions to the compiler. Only physical boundaries are guaranteed:

| Boundary Type | Compiler Respects? | Verification Useful? | Example |
|--------------|-------------------|---------------------|---------|
| Private function | No | No | `fn helper()` |
| Module | No (with LTO) | No | `mod utils { }` |
| Crate | Sometimes | Weak | Separate Cargo package |
| Wasm import/export | **Yes** | **Yes** | Host functions |
| Process | **Yes** | **Yes** | Microservice |
| Network | **Yes** | **Yes** | Service boundary |

#### Minimize Generics in Verification Targets

Generic code creates monomorphization. In verification targets, prefer concrete types:

**Why This Helps:**
- Each function is verified once, not once per type instantiation
- The verification tool sees concrete types, enabling stronger reasoning
- Code duplication is explicit and visible (you know what you're verifying)

**When Generics Are Acceptable:**
- Outside verification targets
- When the number of instantiations is small and known
- When the generic is over a trait with a single implementation

#### Thoughtful Compilation and Building

- **Verification-Compatible Compiler Settings**: Compiler optimizations must be managed differently for verified vs. unverified code.
- **Ensuring Bytecode Reproducibility**: Verification is only useful if you can verify the exact bytecode that executes. Non-reproducible builds mean you verify one thing and deploy another.
- **Separate Compilation Units**: Structure your build to produce separate artifacts for verified and unverified code.

#### Specification as a natural part of documentation

For the key components of your infrastructure documentation should be accompanied by some form of formal specification from the start. In practice, this may be the hardest recommendation to follow within mainstream development methodology, as it requires application of mathematical rigor at the earliest stages of a project, when development teams usually consist of a couple enthusiasts without the special knowledge, required for such an approach.

Fortunately, at the moment our company works on a product, that may significantly lower the barriers of entry into formal methods for mere *mortals* without a PhD. The emerging Inferara verification framework relies on the innovative concept of [non-deterministic specification](https://www.inferara.com/en/papers/specifying-algorithms-using-non-deterministic-computations/), which allows stating complex properties of algorithms without separate mathematical notation, in slightly extended imperative paradigm familiar to every programmer.

The [Inference programming language specification](https://github.com/Inferara/inference-language-spec) is also available.

## 7. Conclusion

**The Fundamental Trade-off**

Formal verification at the bytecode level offers guarantees that no other quality assurance technique can match. But it is not free, and its costs are not linear. The complexity of verification scales with:

- The **size** of the verification target
- The **density of interactions** between components
- The **optimization aggression** of the compiler
- The **absence of exploitable structure** in the code

Monolithic architectures systematically make all four factors worse. Microservice and modular architectures can systematically make them better - but only if designed with verification in mind from the beginning.

**The Architectural Imperative**

The title of this post states that the compiler becomes your adversary when verifying monolithic systems. This is true but perhaps unfair to the compiler. The compiler is doing its job: making your code fast. **The adversarial relationship exists because monolithic architecture creates goals that are fundamentally in tension**.

The compiler wants to:

- Erase boundaries for cross-boundary optimization
- Duplicate code for specialization
- Eliminate structure for efficiency

The verifier needs:

- Clear boundaries for compositional reasoning
- Minimal code copies to reduce verification obligations
- Preserved structure for abstraction

**There is no compiler flag that resolves this tension.** The only resolution is architectural: create boundaries the compiler cannot erase, because they are physical boundaries between separate processes, separate deployment units, separate systems.

**Recommendations**

For organizations considering formal verification of critical systems:

1. **Verify early, verify small.** The best time to decide on verification boundaries is before writing code. The second best time is now.
2. **Isolate verification targets.** Every line of code in the verification scope multiplies complexity. Minimize ruthlessly.
3. **Make boundaries physical.** Module boundaries in source code are suggestions. Process boundaries are enforced by the operating system. Network boundaries are enforced by physics.
4. **Accept the trade-off explicitly.** You are trading operational complexity (distributed systems challenges) for verification complexity (state space explosion). Make this trade consciously.
5. **Budget for verification.** A rough heuristic: expect to spend effort proportional to the square of code size on verification. Plan accordingly.
6. **Reverify after changes.** Verification is not a one-time activity. Any change to verified code—or its dependencies, or compiler versions, or optimization settings—potentially invalidates previous verification.

**Final Thoughts**

The dream of formal verification is mathematical certainty about software behavior. This dream is achievable - seL4, CompCert, and other projects have demonstrated it. But achieving it requires treating verifiability as a first-class architectural concern, not an afterthought to be handled once the code is "done."

The compiler is not your adversary if you respect its nature. The compiler will optimize across any boundary you give it permission to cross. The solution is simple in principle, if challenging in practice: **don't give it permission**. Build systems where the critical paths are isolated, the boundaries are physical, and the verification targets are small enough that mathematical certainty remains within reach.

In an era where software failures cost billions and can cost lives, the investment in verification-ready architecture is not merely prudent - it is, increasingly, a professional obligation.
