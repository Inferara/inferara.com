+++
title = "Fully Homomorphic Introduction"
date = 2025-10-24T10:10:15+09:00
draft = false
math = "katex"
summary = "An introduction to Fully Homomorphic Encryption (FHE), a cryptographic technique that allows computations to be performed on encrypted data without needing to decrypt it first."
tags = ["Mathematics", "Cryptography", "Fully Homomorphic Encryption", "Algorithms"]
aliases = ["/blog/fully-homomorphic-introduction"]
+++

**Table of Contents**

- [Introduction](#introduction)
- [What is Fully Homomorphic Encryption (FHE)](#what-is-fully-homomorphic-encryption-fhe)
- [Base mathematical Concepts Behind FHE](#base-mathematical-concepts-behind-fhe)
- [Computer Science Concepts Behind FHE](#computer-science-concepts-behind-fhe)
- [Mathematical Foundations](#mathematical-foundations)
- [Execution trace example of CKKS](#execution-trace-example-of-ckks)
- [Rust example](#rust-example)
- [Conclusion](#conclusion)
- [References](#references)


## Introduction

In an era where data privacy and security have become paramount concerns, the ability to perform computations on encrypted data without compromising its confidentiality represents one of the most significant breakthroughs in modern cryptography. Fully Homomorphic Encryption (FHE) offers exactly this capability—a revolutionary approach that enables arbitrary computations on encrypted data while keeping the underlying information completely hidden.

Imagine being able to send your sensitive financial data to a cloud service for complex analysis, yet never having to reveal the actual numbers to the service provider. Or consider the possibility of training machine learning models on encrypted medical records without ever exposing patient information. These scenarios, once thought impossible, are now within reach thanks to FHE.

This comprehensive introduction explores the mathematical foundations, practical implementations, and real-world applications of Fully Homomorphic Encryption. We'll journey from the basic concepts to advanced cryptographic schemes like BFV, BGV, CKKS, and TFHE, examining how each addresses different computational needs while maintaining absolute data privacy.

Whether you're a cryptography researcher, a software developer interested in privacy-preserving technologies, or simply curious about the future of secure computation, this article will provide you with both theoretical understanding and practical insights into one of cryptography's most promising frontiers.

## What is Fully Homomorphic Encryption (FHE)

In simple words: It’s a special kind of encryption that lets someone perform calculations on encrypted data without ever seeing the original data.

Normally, when you encrypt data, you must decrypt it first to do anything useful (like add, multiply, or analyze).
But with FHE, you can:
- Encrypt the data
- Give it to someone else (like a cloud server)
- They can run computations directly on the encrypted data
- And when you decrypt the final result, it’s the same as if they had done the computation on the original data

So, the data stays private the whole time, even while being processed.

For example, let’s say we want to encrypt `5` and `3`. We send the encrypted numbers to a cloud service, which adds them together without decrypting and we get back an encrypted result. When we decrypt it, it says `8`. In this example, the cloud never knew the numbers were `5` or `3` — yet it still managed to calculate `5 + 3`.

**Practical Use Cases**

1. Privacy-Preserving Cloud Computing: A user can store and process sensitive data (like medical records or financial data) in the cloud without revealing the actual content to the cloud provider.
2. Secure Machine Learning (Encrypted AI): AI models can be trained or make predictions on encrypted data. For example, a hospital could let an AI analyze patient data for disease risk without revealing any personal details.
3. Finance & Banking: Banks can perform risk analysis or fraud detection on encrypted customer data without ever seeing the actual balances or transactions.
4. Government & Defense: Agencies can share or analyze classified information securely with external parties.
5. Data Sharing Between Companies: Two companies can collaborate (e.g., on customer behavior data) without actually exposing the raw data to each other.

>[!note]
FHE is mathematically complex and computationally heavy, meaning it’s slow compared to normal operations. However, in recent years, improvements (like Microsoft SEAL [[1]], IBM HElib [[2]], Google’s FHE libraries [[3]][[4]], and Zama Concrete[[5]]) are making it more practical, especially for limited computations or small datasets.

Now, consider some practical examples with a bit more details:

**Healthcare — Secure Medical Analysis**

The problem: Hospitals and clinics often want to analyze patient data (like MRI results or genetic information) to find disease patterns or improve treatments. But this data is highly sensitive and cannot legally be shared openly (due to privacy laws like HIPAA or GDPR).

How FHE helps:

1. Each hospital encrypts patient data using FHE before uploading it to a central cloud or research server.
2. Researchers or AI systems in the cloud perform computations — e.g.:
* 2.1. "What percentage of patients with this gene develop diabetes?"
* 2.2. "Train an AI model to detect early cancer signs."
3. All these computations happen on encrypted data.

The hospitals then decrypt the final results, getting useful statistics or trained AI models without revealing any individual’s personal medical information.

Benefit: Sensitive medical records never leave the hospital in readable form — yet global research collaboration becomes possible.

**Banking — Privacy-Preserving Credit Scoring**

The problem: Banks want to calculate credit scores using income, spending habits, and debts — but customers don’t want to expose all their private data to external scoring services or cloud platforms.

How FHE helps:

1. A user’s financial data is encrypted before being sent to the scoring service.
2. The scoring service runs its algorithm (sum, average, risk formulas) on encrypted data.
3. The result (credit score) is encrypted and returned to the bank.
4. The bank decrypts it locally — getting the credit score without the scoring company ever seeing any real numbers.

Benefit: The scoring system remains accurate, but no sensitive financial data is revealed — not even to the service provider.

Other emerging examples:

* IoT devices: Smart sensors can send encrypted readings (like from home energy meters) for analysis without revealing exact behavior patterns.
* Cloud storage providers: They can offer “search” or “filter” functions on encrypted databases.
* Elections: Encrypted vote counting ensures results can be tallied without exposing individual votes.

## Base mathematical Concepts Behind FHE

The Core Idea of FHE is that when the data encryption, you turn it into ciphertext — a jumble of random-looking numbers.
In normal encryption (like AES), this ciphertext is useless until you decrypt it.
But with FHE, the ciphertext is structured in a special way so that math operations done on it still “make sense” after decryption.

In other words:

Encrypted operations = Real operations on hidden data.

So if:

* Encrypt $5 \rightarrow E(5)$
* Encrypt $3 \rightarrow E(3)$

Then:

* $E(5)+E(3)=E(8)$
* $E(5) \times E(3)=E(15)$

When the decryption takes place, the correct results are obtained — even though initial information stayed encrypted during the process.

Conceptually, in FHE scheme 3 steps are involved:
1. Each number is turned into a polynomial (a kind of mathematical formula) with a secret key. It’s scrambled so that nobody can guess the real number from it.
2. Compute on Encrypted Data. Operations like addition or multiplication are translated into operations on the polynomials. These work in a way that, after decryption, the result corresponds to the correct output.
3. Decrypt the Result. A secret key is used to "unscramble" the final ciphertext and reveal the actual computed answer.

>[!note]
> So, why it is called homomorphic? The word *homomorphic* means “same structure”.

In this context, it means the operations on ciphertexts (like $+$ or $\times$) behave the same way as operations on plaintexts.

| Operation Type               | What It Means                                     | Example                                               |
| ---------------------------- | --------------------------------------------------| ----------------------------------------------------- |
| Additively homomorphic       | Additively combine encrypted data                 | $E(5) + E(3) = E(8)$                                  |
| Multiplicatively homomorphic | Multiply encrypted data                           | $E(2) \times E(4) = E(8)$                             |
| **Fully** homomorphic        | *Both* addition and multiplication are possible   | $\rightarrow$ Can compute **any function** on encrypted data! |

For decades, encryption schemes could only do one type of operation (addition or multiplication), not both. It wasn’t until 2009 that Craig Gentry [[6]] (IBM researcher) created the first fully homomorphic encryption system.

The big challenge was that:

* Every operation adds a bit of "noise" to the ciphertext
* Too much noise $\rightarrow$ data becomes unreadable
* Gentry’s insight was to "refresh" ciphertexts occasionally to reduce noise (a process called bootstrapping).

That idea made FHE theoretically possible.

Modern FHE libraries (mentioned above) make Gentry scheme usable for real-world tasks — though still slower than normal computation.

These libraries implement clever tricks like:
* Using lattice-based cryptography (explained below)
* Approximating real numbers for faster operations
* Parallelizing computations for better performance

## Computer Science Concepts Behind FHE

In Formal Terms, FHE can be defined as follows:

FHE is an encryption scheme $(KeyGen, Enc, Dec, Eval)$ such that: $Dec(sk, Eval(pk, f, Enc(pk, x))) = f(x)$ for any efficiently computable function $f$.

That is, given ciphertexts $c_i = Enc(pk, x_i)$, one can compute an encrypted result $c_f = Eval(pk, f, c_1, \ldots, c_n)$ without ever decrypting, and $Dec(sk, c_f) = f(x_1, \ldots, x_n)$.

So, FHE provides a homomorphism between:

* the **plaintext domain** (e.g., integers, reals, vectors)
* and the **ciphertext domain** (usually polynomials over modular rings)

Most practical FHE schemes are based on **Learning With Errors (LWE)** [[7]] or its ring variant **Ring-LWE** [[8]].

Key idea:

A ciphertext is represented as noisy linear or polynomial equations: $c = (a, b = a \cdot s + m + e) \mod q$ where:
* $s$: secret key (vector or polynomial)
* $m$: plaintext (embedded in a small modulus $t$)
* $e$: noise term (small random error)
* $q$: ciphertext modulus

Decrypting means: $m \approx b - a \cdot s \mod q$, as long as $e$ stays small, $m$ can be recovered.
But as homomorphic operations are performed, noise grows — hence **bootstrapping** (noise refreshing) is needed.

Ciphertexts support two primitive operations:
1. Addition
   Add ciphertexts component-wise: $(a_1,b_1) + (a_2,b_2) = (a_1+a_2, b_1+b_2)$ $\rightarrow$ corresponds to plaintext addition, noise increases slightly.
2. Multiplication:
   Multiply ciphertexts polynomially.
   Noise grows much faster (roughly multiplicatively), hence the need for:
   * **Modulus switching:** reduce modulus $q$ to shrink noise.
   * **Re-linearization:** project the result back to a fixed ciphertext dimension.

>[!important]
>Noise management is the central engineering challenge in FHE

Bootstrapping (Gentry’s Insight) = homomorphically evaluating the decryption circuit itself.
* The secret key is encrypted under itself.
* When noise gets large, the ciphertext is refreshed by running $Eval$ on the decryption function using the encrypted key.
* This produces a new ciphertext with lower noise, but same plaintext.

Bootstrapping is expensive (orders of magnitude slower than native ops) but crucial for "full" homomorphism.
A big part of modern FHE research involves **compilers and intermediate representations** for encrypted computation.

Conceptually:

```
High-Level Program (Python, C++, ML model)
           ↓
Homomorphic IR (add/mul/rot, modular arithmetic)
           ↓
Circuit Representation (Boolean or Arithmetic)
           ↓
Ciphertext Operations (Eval gates)
```

Compilers perform:

* **Circuit optimization** (minimize multiplicative depth to avoid bootstrapping)
* **Parameter selection** (choosing $q, t, N$ for security vs. precision)
* **Noise tracking** through symbolic analysis

Different FHE Schemes

| Scheme   | Type                                  | Features           | Typical Use      |
| -------- | ------------------------------------- | ------------------ | ---------------- |
| **BFV** [[9]] | Exact integer arithmetic              | Modular arithmetic | Database queries |
| **BGV** [[10]]  | Exact integer arithmetic              | Modulus switching  | General-purpose  |
| **CKKS** [[11]] | Approximate arithmetic (reals/floats) | Scaled encoding    | ML inference     |
| **TFHE** [[12]] | Bit-level Boolean logic               | Bootstrapping fast | Logic circuits   |

For a compiler development point of view, FHE is essentially about **mapping high-level code to algebraic circuits** under the following constraints:

* **Add/multiply only** (no branches or arbitrary memory access)
* **Noise tracking** akin to precision analysis
* **Circuit depth minimization** like optimizing floating-point pipelines
* **Vectorized packing (SIMD in ciphertexts)** — batching multiple plaintext slots using polynomial CRT representations

In many ways, FHE compilers resemble:

* **Hardware synthesis tools (Verilog $\rightarrow$ gates)**
* or **secure MPC compilers**, but with algebraic noise models.

Current implementations performance characteristics:
* Basic arithmetic: milliseconds
* Bootstrapping: ~10–100 ms (improving rapidly)
* Still $10^4 \sim 10^6 \times$ slower than plaintext computation, but improving.

**Comparison of FHE concepts to traditional compiler concepts:**

| Aspect                 | Analogy                     | FHE Equivalent                     |
| ---------------------- | --------------------------- | ---------------------------------- |
| **Data type**          | Encrypted integers or reals | Ciphertexts in modular rings       |
| **Operation**          | ALU ops ($+$, $\times$)     | Homomorphic Eval                   |
| **Precision tracking** | Floating-point rounding     | Noise tracking                     |
| **Optimization goal**  | Performance                 | Circuit depth & noise minimization |
| **Memory layout**      | Vectorization               | Ciphertext batching                |
| **IR / backend**       | LLVM, MLIR                  | FHE DSLs / frameworks              |

## Mathematical Foundations

Lattice definition: a **lattice** $\mathcal{L} \subset \mathbb{R}^n$ is the set of all integer linear combinations of basis vectors:
$\mathcal{L} = { a_1b_1 + a_2b_2 + \dots + a_kb_k \mid a_i \in \mathbb{Z} }$, which resembles a discrete grid in high-dimensional space.

The **LWE problem** underpins most FHE security:

Given many samples of the form $(a_i, b_i = a_i \cdot s + e_i \mod q)$ where $a_i$ are random, $e_i$ are small "errors", and $s$ is secret,
it’s computationally hard (quantum-resistant) to recover $s$.

That hardness ensures that ciphertexts leak no useful information about the plaintext.

To make FHE efficient, we generalize LWE to polynomial rings.

Let: $R_q = \mathbb{Z}_q[x]/(x^N + 1)$.

That is, polynomials modulo both a large integer $q$ and the cyclotomic polynomial $(x^N + 1)$.
Operations are done coefficient-wise mod $(q)$, with degree reduction by $(x^N + 1)$.

* $N$: ring dimension (power of 2, e.g. $2^{14} = 16384$)
* $q$: ciphertext modulus (a large prime or composite integer)

**Security** comes from the **Ring-LWE** assumption — the polynomial analogue of LWE.

**Encryption**

Let $s \in R_q$ be the secret key (a small polynomial).
To encrypt plaintext $m \in R_t$, where $t \ll q$: $c = (c_0, c_1) = (b, a) = (a \cdot s + m + e, -a)$

Where:

* $a \leftarrow R_q$ random,
* $e \leftarrow \text{small noise}$,
* $m$ is scaled up to fit modulus $q$.

**Decryption**

$m' = (c_0 + c_1 \cdot s) \mod q$ If noise $e$ is small, rounding recovers $m \mod t$.

**Homomorphic Operations**

Addition: $(c_0, c_1) + (c_0', c_1') = (c_0 + c_0', c_1 + c_1')$. Plaintext result = $(m + m')$, noise increases linearly.

Multiplication:

$(c_0, c_1) \cdot (c_0', c_1') = (c_0 c_0', c_0 c_1' + c_1 c_0', c_1 c_1')$
This produces a **3-term ciphertext** $degree 2 in ( s )$.

To restore it to 2 components, a **relinearization** is performed using precomputed *key-switching* keys.

Modulus and Scaling

FHE works modulo a large modulus $q$ (like $2^{200}$–$2^{600}$).
Each operation increases the noise term $e$, which must stay small relative to $q$.

To control growth:

* **Modulus switching:** reduce $q$ to a smaller modulus after some ops.
* **Rescaling (CKKS):** divide ciphertext by a scaling factor to maintain numeric precision for approximate arithmetic.
CKKS: Approximate Arithmetic (for Real Numbers)

For ML and signal processing, exact integers aren’t enough.

**CKKS** encodes real numbers as scaled integers, allowing approximate operations.

Encode: $m \mapsto \lfloor \Delta \cdot m \rceil \mod q$ where $\Delta$ is a large scaling factor (e.g. $2^{40}$).

After each multiplication, ciphertexts are divided by $\Delta$ to keep scale consistent:
$c' = \text{Rescale}(c_1 \cdot c_2, \Delta)$.

Decryption gives a real approximation of the true value, with precision loss bounded by noise.

When noise nears $q/2$, ciphertexts become undecryptable.
Bootstrapping resets the noise by **homomorphically evaluating the decryption function**.

Mathematically: $c' = Eval(E(sk), Dec(c))$.
An encrypted secret key ($E(sk)$) is taken, and used to re-encrypt ($c$) freshly.
This involves evaluating modular reduction and rounding polynomials homomorphically — the hardest part computationally.

Parameters must balance:

* **Security:** determined by Ring-LWE hardness (~128-bit security typical)
* **Correctness:** ensure noise < $q/2$
* **Precision:** controlled by scaling factor ($\Delta$)
* **Performance:** larger ($N$) and ($q$) = slower ops

A typical CKKS setup:

| Parameter | Value                  | Meaning            |
| --------- | ---------------------- | ------------------ |
| $N$       | $2^{14} = 16384$       | Polynomial degree  |
| $q$       | $~2^{400}$             | Ciphertext modulus |
| $t$       | $2^{40}$               | Plaintext modulus  |
| Security  | 128 bits               | Standard           |
| Encoding  | Complex packing (SIMD) | Pack ~8192 slots   |

Through the **Chinese Remainder Theorem (CRT)** [[13]], multiple plaintexts can be packed into one ciphertext.
Operations on ciphertexts then act *component-wise* across all slots — essentially encrypted SIMD.

Mathematically: $R_t / (x^N+1) \cong \prod_{i=1}^{N/2} \mathbb{C}$.
Each complex slot can store one value $\rightarrow$ huge parallelism gain.

**Summary of FHE Layers**

| Layer                   | Concept                           | Formal Structure          |
| ----------------------- | --------------------------------- | ------------------------- |
| **Security base**       | Hard lattice problems             | (Ring-)LWE                |
| **Algebraic structure** | Polynomial rings $mod ( q, x^N+1 )$ | $R_q$                   |
| **Encryption**          | Noisy linear map                  | $b = a \cdot s + m + e$       |
| **Homomorphism**        | Ring operations                   | Add/Mul in $R_q$        |
| **Noise control**       | Modulus switching, bootstrapping  | Keep $e \ll q/2$        |
| **Encoding**            | Integer / floating-point packing  | CRT + scaling             |
| **Evaluation**          | Arithmetic circuits               | Add, Mul, Rotate, Rescale |

## Execution trace example of CKKS

As an example we will use $(x+1)^2$.

Parameters (illustrative but realistic)

* Ring: $R_q=\mathbb{Z}_q[x]/(x^N+1)$, (N=2^{14}=16384)
* Modulus chain (top → bottom): $\mathcal{Q}=[q_0,q_1,q_2]=[\approx 2^{40},; \approx 2^{40},; \approx 2^{40}]$
* Initial scale ($\Delta = 2^{40}$) (so after a mul and rescale we come back near ($2^{40}$))
* Target security: ~128-bit (with these ($N,q_i$) magnitudes)
* Encoding: CKKS complex slots; here we use **one real** slot
* Example value: ($x=1.2345$) → ground-truth (($x+1)^2 = 4.99299025$)

> [!note]
>Note 1: Level ($L$) indexes how many primes remain in the chain. We start at ($L=2$) (using ($q_0q_1q_2$)).

>[!note]
>Note 2: "Noise budget" is the common "bits until failure" indicator; exact numbers depend on implementation—values below are illustrative.

Step-by-step trace

| Step | Operation      | Ciphertexts in / out         | Value (ideal)                | Scale                           | Level                  | What happens to noise                                                                                        |
| ---- | -------------- | ---------------------------- | ---------------------------- | ------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------ |
| 0    | **Encode** $x$ | $— \rightarrow p_x$                    | $x$                          | $\Delta \approx 2^{40}$         | L2                     | Encoder maps (x) to a polynomial; rounding error (<!1/\Delta).                                               |
| 0′   | **Encode** (1) | $— \rightarrow p_1$                    | (1)                          | ($\Delta$)                        | L2                     | Same scale so we can add later without rescale.                                                              |
| 1    | **Encrypt**    | ($p_x \to c_x$), ($p_1 \to c_1$) | ($x,;1$)                       | ($\Delta$)                        | L2                     | Each ciphertext gets RLWE noise ($\varepsilon \sim \mathcal{O}(\sigma)$).                                      |
| 2    | **Add**        | ($c_a = c_x + c_1$)            | ($x+1$)                        | ($\Delta$)                        | L2                     | Noise adds linearly; budget drops slightly.                                                                  |
| 3    | **Square**     | ($c_s = c_a \times c_a$)       | (($x+1)^2$)                    | ($\Delta^2 \approx 2^{80}$)       | L2 → L2 (pre-rescale)  | Noise multiplies; degree grows; perform **relinearization** to return to 2 components—noise increases again. |
| 4    | **Rescale**    | ($c_r = \text{Rescale}(c_s)$)  | (($x+1)^2$)                    | ($\Delta^2 / q_2 \approx 2^{40}$) | **L1** (dropped ($q_2$)) | Dividing by ($q_2$) reduces magnitude (and effective noise); scale is back near ($\Delta$).                      |
| 5    | **Decrypt**    | ($c_r \to p_r$)                | (($x+1)^2 + \text{err}$)       | ($\Delta$)                        | L1                     | Correct if total error (< $\Delta/2$).                                                                         |
| 6    | **Decode**     | ($p_r \to \hat{y}$)            | ($\hat{y} \approx 4.99299025$) | —                               | —                      | Final rounding to a real value; error dominated by encoding + CKKS approximation + op noise.                 |

Typical **noise budget** evolution (illustrative): start ~110–120 bits at L2 → after add ~108 bits → after mul+relin ~60–70 bits → after rescale ~50–60 bits remaining (plenty for a few more ops).

What the numbers look like (approx.)

* After **Add**: value $ \approx (2.2345)$, scale $2^{40}$
* After **Square** (pre-rescale): value $ \approx (4.99299025)$, scale $2^{80}$
* After **Rescale** by (q_2\approx 2^{40}): value $ \approx (4.99299025)$, scale back to $2^{40}$, level drops to L1
* **Decrypt/Decode** returns something like: $(4.99299025 \pm 10^{-9})$ (the tolerance depends on $(\Delta)$, $(N)$, and parameter choices)

Ground truth: $((1.2345+1)^2 = 4.99299025)$.

* **Scale discipline (CKKS)**: keep operands at compatible scales; after a mul, **rescale** to restore the working scale and drop one prime from the chain.
* **Depth management**: this circuit has multiplicative depth 1 (just one square), so a single rescale suffices; **no bootstrapping** required.
* **Relinearization**: required after mul to project back to a fixed ciphertext size (performance + noise reasons).
* **Parameter selection**: choose $\Delta$ close to a 40-bit prime so that $(\Delta^2/q \approx \Delta)$ post-rescale; choose chain length for your worst-case depth.

Minimal IR for $(x+1)^2$ (CKKS-style)

```
c_x   = Enc(x, scale=2^40, level=L2)
c_one = Enc(1, scale=2^40, level=L2)

c_a   = Add(c_x, c_one)                 // scale 2^40, L2
c_s   = Mul(c_a, c_a)                   // scale ~2^80, L2
c_s   = Relin(c_s)                      // same scale, L2
c_r   = Rescale(c_s)                    // scale ~2^40, L1

y_hat = Dec( c_r )                      // ≈ (x+1)^2
```

>[!note]
>> If another multiplication is needed, still have $L1$ and could multiply once more (then rescale to $L0$). For deeper circuits, the chain is extended; when it’s exhausted, it is either stopped or **bootstrap** to refresh noise/levels.

## Rust example

Below is an example in Rust to show the same idea: compute $(x+1)^2$ on encrypted data and decrypt the result.

TFHE-rs supports encrypted integers (8–128 bits) with operator overloading, relinearization/keyswitching handled.

**Cargo.toml**

```toml
[package]
name = "fhe_tfhe_example"
version = "0.1.0"
edition = "2021"

[dependencies]
tfhe = ">=1.4.1"        # use the latest released version
rand = "0.8"
```

**src/main.rs**

```rust
use rand::thread_rng;
use tfhe::prelude::*;
use tfhe::integer::prelude::*;

// Compute (x + 1)^2 on encrypted 64-bit unsigned integers.
fn main() -> tfhe::core_crypto::prelude::Result<()> {
    // 1) Parameter set — choose a standard 128-bit secure config provided by the lib
    let config = tfhe::ConfigBuilder::all_disabled()
        .enable_default_integers() // enable integer types/ops
        .build();

    // 2) Client keygen
    let mut rng = thread_rng();
    let (client_key, server_key) = tfhe::integer::gen_keys(config, &mut rng);

    // 3) "Upload" server key (in real apps, the server holds this)
    tfhe::integer::set_server_key(server_key);

    // Plain x:
    let x_clear: u64 = 1_234_567;

    // 4) Encrypt x and the constant 1
    let x: FheUint64 = FheUint64::try_encrypt(x_clear, &client_key)?;
    let one: FheUint64 = FheUint64::try_encrypt(1u64, &client_key)?;

    // 5) Homomorphic compute: (x + 1)^2
    //    Thanks to operator overloading, this looks like plain Rust.
    let y = (&x + &one) * (&x + &one);

    // 6) Decrypt
    let y_clear: u64 = y.decrypt(&client_key);
    println!("Result = {}", y_clear);

    // Sanity check in the clear
    let expected = (x_clear + 1).wrapping_mul(x_clear + 1);
    assert_eq!(y_clear, expected);
    Ok(())
}
```

* The example uses `FheUint64`; change to `FheIntXX` / `FheUintXX` as needed.
* TFHE-rs provides integer ops `+ - * / % << >> & | ^` and comparisons over encrypted values; constants can be plaintext or encrypted.


## Conclusion

Fully Homomorphic Encryption represents a paradigm shift in how we approach privacy-preserving computation. From Craig Gentry's groundbreaking theoretical work in 2009 to today's practical implementations in libraries like TFHE-rs, Microsoft SEAL, and Zama's Concrete, FHE has evolved from an abstract mathematical concept to a deployable technology with real-world applications.

Throughout this exploration, we've seen how different FHE schemes—BFV, BGV, CKKS, and TFHE—each bring unique strengths to the table. BFV and BGV excel at exact integer arithmetic, making them ideal for applications requiring precise calculations on whole numbers. CKKS introduces approximate arithmetic for real numbers, enabling privacy-preserving machine learning and statistical analysis. TFHE pushes the boundaries with its ability to perform arbitrary Boolean circuits on encrypted data with minimal noise growth.

The mathematical foundations we've examined, from lattice-based cryptography and the Learning With Errors problem to polynomial rings and modular arithmetic, demonstrate the sophisticated theoretical framework that makes FHE possible. Yet, as our Rust examples show, these complex mathematical operations can be abstracted into intuitive APIs that developers can readily use.

**Key Takeaways:**

- **Privacy without Compromise**: FHE enables computation on encrypted data without ever revealing the underlying information, opening new possibilities for cloud computing, healthcare, finance, and collaborative research.

- **Diverse Schemes for Different Needs**: The variety of FHE schemes means that different applications can choose the most appropriate approach based on their specific requirements for precision, performance, and functionality.

- **Ongoing Evolution**: While current implementations face performance challenges, active research and engineering efforts continue to improve efficiency, making FHE increasingly practical for real-world deployment.

- **Practical Implementation**: Modern libraries abstract away much of the mathematical complexity, making FHE accessible to developers who want to build privacy-preserving applications.

As we look toward the future, FHE stands poised to become a cornerstone technology for privacy-preserving computation. With continued research into optimization techniques, specialized hardware acceleration, and more efficient algorithms, we can expect to see FHE deployed across an increasingly wide range of applications—from secure multi-party computation to privacy-preserving artificial intelligence.

The journey from Gentry's first FHE construction to today's practical implementations demonstrates the power of theoretical cryptography to reshape our digital world. As data privacy concerns continue to grow and regulatory frameworks become more stringent, FHE provides a mathematical guarantee that sensitive information can remain private while still being useful for computation—a promise that may well define the future of secure computing.

## References

- [Microsoft SEAL][1]
- [IBM HElib][2]
- [Google An FHE compiler for C++][3]
- [heir][4]
- [Zama Concrete][5]
- [Fully Homomorphic Encryption Using Ideal Lattices][6]
- [Learning with Errors][7]
- [Ring Learning with Errors][8]
- [Introduction to the BFV FHE Scheme][9]
- [Introduction to the BGV FHE Scheme][10]
- [Introduction to the CKKS/HEAAN FHE Scheme][11]
- [Hitchhiker’s Guide to the TFHE Scheme][12]
- [Chinese Remainder Theorem][13]
- [TFHE-rs][14]
- [OpenFHE-rs][15]

[1]: https://github.com/microsoft/SEAL
[2]: https://github.com/homenc/HElib
[3]: https://github.com/google/fully-homomorphic-encryption
[4]: https://github.com/google/heir
[5]: https://github.com/zama-ai/concrete
[6]: https://www.cs.cmu.edu/~odonnell/hits09/gentry-homomorphic-encryption.pdf
[7]: https://en.wikipedia.org/wiki/Learning_with_errors
[8]: https://en.wikipedia.org/wiki/Ring_learning_with_errors
[9]: https://faculty.kfupm.edu.sa/coe/mfelemban/SEC595/References/Introduction%20to%20the%20BFV%20FHE%20Scheme.pdf
[10]: https://faculty.kfupm.edu.sa/coe/mfelemban/SEC595/References/Introduction%20to%20the%20BGV%20FHE%20Scheme.pdf
[11]: https://faculty.kfupm.edu.sa/coe/mfelemban/SEC595/References/Introduction%20to%20the%20CKKS-HEAAN%20FHE%20Scheme.pdf
[12]: https://hal.science/hal-04121360/document
[13]: https://en.wikipedia.org/wiki/Chinese_remainder_theorem
[14]: https://github.com/zama-ai/tfhe-rs
[15]: https://github.com/fairmath/openfhe-rs
