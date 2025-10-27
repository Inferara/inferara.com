+++
title = "Introduction to Fully Homomorphic Encryption"
date = 2025-10-27T10:10:15+09:00
draft = false
math = "katex"
summary = "An introduction to Fully Homomorphic Encryption (FHE), a cryptographic technique that allows computations to be performed on encrypted data without needing to decrypt it first."
tags = ["Mathematics", "Cryptography", "Fully Homomorphic Encryption", "Algorithms"]
aliases = ["/blog/fully-homomorphic-introduction"]
+++

**Table of Contents**

- [Introduction](#introduction)
- [What is Fully Homomorphic Encryption (FHE)](#what-is-fully-homomorphic-encryption-fhe)
- [Mathematical Concepts Behind FHE](#mathematical-concepts-behind-fhe)
- [Computer Science Concepts Behind FHE](#computer-science-concepts-behind-fhe)
- [Mathematical Foundations](#mathematical-foundations)
- [Execution Trace Example of CKKS](#execution-trace-example-of-ckks)
- [Rust Example](#rust-example)
- [Conclusion](#conclusion)
- [References](#references)


## Introduction

In an era where data privacy and security have become paramount concerns, the ability to perform computations on encrypted data without compromising its confidentiality represents one of the most significant breakthroughs in modern cryptography. Fully Homomorphic Encryption (FHE) offers exactly this capability—a revolutionary approach that enables arbitrary computations on encrypted data while keeping the underlying information completely hidden.

Imagine being able to send your sensitive financial data to a cloud service for complex analysis, yet never having to reveal the actual numbers to the service provider. Or consider the possibility of training machine learning models on encrypted medical records without ever exposing patient information. These scenarios, once thought impossible, are now within reach thanks to FHE.

This comprehensive introduction explores the mathematical foundations, practical implementations, and real-world applications of Fully Homomorphic Encryption. We'll journey from the basic concepts to advanced cryptographic schemes like BFV, BGV, CKKS, and TFHE, examining how each addresses different computational needs while maintaining absolute data privacy.

Whether you're a cryptography researcher, a software developer interested in privacy-preserving technologies, or simply curious about the future of secure computation, this structured approach will provide you with both theoretical understanding and practical insights into one of cryptography's most promising frontiers.

## What is Fully Homomorphic Encryption (FHE)

To understand the revolutionary nature of FHE, let's begin with its fundamental premise. In simple terms, FHE is a special kind of encryption that enables someone to perform calculations on encrypted data without ever seeing the original data.

Normally, when you encrypt data, you must decrypt it first to perform any useful operations (such as addition, multiplication, or analysis). However, with FHE, you can:

- Encrypt the data
- Give it to someone else (such as a cloud server)
- They can run computations directly on the encrypted data
- When you decrypt the final result, it's identical to what would have been produced if they had performed the computation on the original data

Thus, the data remains private throughout the entire process, even while being processed.

For example, suppose we want to encrypt `5` and `3`. We send the encrypted numbers to a cloud service, which adds them together without decrypting, and we receive back an encrypted result. When we decrypt it, we get `8`. In this example, the cloud service never knew the numbers were `5` or `3`—yet it successfully calculated `5 + 3`.

This seemingly impossible capability opens the door to transformative applications across multiple industries. Let's explore the most compelling use cases where FHE is making a real difference today.

**Practical Use Cases**

1. **Privacy-Preserving Cloud Computing**: Users can store and process sensitive data (such as medical records or financial information) in the cloud without revealing the actual content to the cloud provider.

2. **Secure Machine Learning (Encrypted AI)**: AI models can be trained or make predictions on encrypted data. For example, a hospital could allow an AI system to analyze patient data for disease risk assessment without revealing any personal details.

3. **Finance & Banking**: Banks can perform risk analysis or fraud detection on encrypted customer data without ever seeing the actual balances or transactions.

4. **Government & Defense**: Agencies can share or analyze classified information securely with external parties.

5. **Data Sharing Between Companies**: Two companies can collaborate (for example, on customer behavior analysis) without exposing their raw data to each other.

>FHE is mathematically complex and computationally intensive, making it significantly slower than normal operations. However, recent improvements in libraries such as Microsoft SEAL [[1]], IBM HElib [[2]], Google's FHE libraries [[3]][[4]], and Zama Concrete [[5]] are making FHE increasingly practical, especially for limited computations or small datasets.
{.note}

To better illustrate FHE's transformative potential, let's examine two detailed scenarios that demonstrate how this technology is already solving real-world privacy challenges:

**Healthcare — Secure Medical Analysis**

Consider the challenge facing modern healthcare: Hospitals and clinics often want to analyze patient data (like MRI results or genetic information) to find disease patterns or improve treatments. However, this data is highly sensitive and cannot legally be shared openly due to privacy laws like HIPAA or GDPR.

How FHE helps:

1. Each hospital encrypts patient data using FHE before uploading it to a central cloud or research server.
2. Researchers or AI systems in the cloud perform computations — e.g.:
* 2.1. "What percentage of patients with this gene develop diabetes?"
* 2.2. "Train an AI model to detect early cancer signs."
1. All these computations happen on encrypted data.

The hospitals then decrypt the final results, getting useful statistics or trained AI models without revealing any individual's personal medical information.

The breakthrough benefit: Sensitive medical records never leave the hospital in readable form—yet global research collaboration becomes possible, accelerating medical discoveries while preserving patient privacy.

**Banking — Privacy-Preserving Credit Scoring**

Similarly, the financial sector faces a parallel dilemma: Banks want to calculate credit scores using comprehensive data including income, spending habits, and debts. However, customers are increasingly reluctant to expose all their private financial information to external scoring services or cloud platforms.

How FHE helps:

1. A user's financial data is encrypted before being sent to the scoring service.
2. The scoring service runs its algorithm (sum, average, risk formulas) on encrypted data.
3. The result (credit score) is encrypted and returned to the bank.
4. The bank decrypts it locally — getting the credit score without the scoring company ever seeing any real numbers.

The result: The scoring system remains accurate, but no sensitive financial data is revealed—not even to the service provider, creating a win-win scenario for all parties involved.

These examples represent just the beginning. Emerging applications span across numerous domains:

* **IoT devices**: Smart sensors can send encrypted readings (like from home energy meters) for analysis without revealing exact behavior patterns
* **Cloud storage providers**: They can offer "search" or "filter" functions on encrypted databases
* **Elections**: Encrypted vote counting ensures results can be tallied without exposing individual votes

Having explored the practical applications, we now turn to the fundamental question: How does FHE actually work? To answer this, we must delve into the mathematical principles that make this seemingly magical capability possible.

## Mathematical Concepts Behind FHE

At its heart, FHE relies on a clever mathematical insight. When you encrypt data using traditional methods, you transform it into ciphertext—a jumble of random-looking numbers. In normal encryption schemes (such as AES), this ciphertext is completely useless until you decrypt it.
However, with FHE, the ciphertext is structured in a special way so that mathematical operations performed on it still "make sense" after decryption.

In other words:

**Encrypted operations = Real operations on hidden data**

So if:

* Encrypt $5 \rightarrow E(5)$
* Encrypt $3 \rightarrow E(3)$

Then:

* $E(5)+E(3)=E(8)$
* $E(5) \times E(3)=E(15)$

When decryption takes place, the correct results are obtained—even though the initial information remained encrypted throughout the entire process.

This remarkable property emerges from the careful mathematical structure of FHE schemes. Conceptually, every FHE scheme involves three fundamental steps:

1. **Encryption**: Each number is transformed into a polynomial (a mathematical formula) using a secret key. It's scrambled so that no one can guess the real number from it.

2. **Computation on Encrypted Data**: Operations such as addition or multiplication are translated into operations on the polynomials. These operations work in such a way that, after decryption, the result corresponds to the correct output.

3. **Decryption**: A secret key is used to "unscramble" the final ciphertext and reveal the actual computed result.

The term "homomorphic" captures the essential mathematical property that makes this possible.

>Why is it called "homomorphic"? The word *homomorphic* means "same structure."
>
>In this context, it means that operations on ciphertexts (such as $+$ or $\times$) behave the same way as operations on plaintexts.
{.note}

| Operation Type               | What It Means                                     | Example                                               |
| ---------------------------- | --------------------------------------------------| ----------------------------------------------------- |
| Additively homomorphic       | Additively combine encrypted data                 | $E(5) + E(3) = E(8)$                                  |
| Multiplicatively homomorphic | Multiply encrypted data                           | $E(2) \times E(4) = E(8)$                             |
| **Fully** homomorphic        | *Both* addition and multiplication are possible   | $\rightarrow$ Can compute **any function** on encrypted data! |

This distinction is crucial because it represents decades of cryptographic research. For many years, encryption schemes could only support one type of operation (either addition or multiplication), not both. This limitation severely restricted their practical applications. The breakthrough came in 2009 when Craig Gentry [[6]], in his Stanford PhD dissertation, created the first fully homomorphic encryption system.

The major challenge was that:

* Every operation adds some "noise" to the ciphertext
* Too much noise makes the data unreadable
* Gentry's key insight was to "refresh" ciphertexts periodically to reduce noise (a process called bootstrapping)

This breakthrough made FHE theoretically possible, opening the door to practical privacy-preserving computation.

Building on Gentry's foundational work, modern FHE libraries have transformed his theoretical insights into usable systems. While these implementations remain significantly slower than normal computation, they incorporate sophisticated optimizations:

* Using lattice-based cryptography (which we'll explore next)
* Approximating real numbers for faster operations
* Parallelizing computations for improved performance

These advances bridge the gap between theory and practice, but to truly understand FHE's capabilities and limitations, we need to examine the computational science principles that govern its operation.

## Computer Science Concepts Behind FHE

Having established the mathematical intuition, we can now formalize FHE's definition and explore the computational challenges it addresses. In formal terms, FHE can be defined as follows:

FHE is an encryption scheme $(KeyGen, Enc, Dec, Eval)$ such that: $Dec(sk, Eval(pk, f, Enc(pk, x))) = f(x)$ for any efficiently computable function $f$.

That is, given ciphertexts $c_i = Enc(pk, x_i)$, one can compute an encrypted result $c_f = Eval(pk, f, c_1, \ldots, c_n)$ without ever decrypting, and $Dec(sk, c_f) = f(x_1, \ldots, x_n)$.

So, FHE provides a homomorphism between:

* the **plaintext domain** (e.g., integers, reals, vectors)
* and the **ciphertext domain** (usually polynomials over modular rings)

Most practical FHE schemes are based on **Learning With Errors (LWE)** [[7]] or its ring variant **Ring-LWE** [[8]].

The key idea:

A ciphertext is represented as noisy linear or polynomial equations: $c = (a, b = \langle a, s \rangle + m + e) \bmod q$ where:
* $s$: secret key (vector or polynomial)
* $m$: plaintext (embedded in a small modulus $t$)
* $e$: noise term (small random error)
* $q$: ciphertext modulus

Decryption means: $m \approx b - \langle a, s \rangle \bmod q$. As long as $e$ remains small, $m$ can be recovered. However, as homomorphic operations are performed, noise grows—hence **bootstrapping** (noise refreshing) is needed.

Ciphertexts support two primitive operations:
1. **Addition**: Add ciphertexts component-wise: $(a_1,b_1) + (a_2,b_2) = (a_1+a_2, b_1+b_2)$. This corresponds to plaintext addition; noise increases slightly.

2. **Multiplication**: Multiply ciphertexts polynomially. Noise grows much faster (roughly multiplicatively), hence the need for:
   * **Modulus switching**: Reduce modulus $q$ to shrink noise
   * **Re-linearization**: Project the result back to a fixed ciphertext dimension

>Noise management is the central engineering challenge in FHE.
{.important}

**Bootstrapping (Gentry's Insight)** involves homomorphically evaluating the decryption circuit itself.
* The secret key is encrypted under itself
* When noise becomes large, the ciphertext is refreshed by running $Eval$ on the decryption function using the encrypted key
* This produces a new ciphertext with lower noise but the same plaintext

Bootstrapping is expensive (orders of magnitude slower than native operations) but crucial for "full" homomorphism. A significant part of modern FHE research involves **compilers and intermediate representations** for encrypted computation.

Conceptually:

```plaintext
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

From a compiler development perspective, FHE is essentially about **mapping high-level code to algebraic circuits** under the following constraints:

* **Add/multiply only**: No branches or arbitrary memory access
* **Noise tracking**: Similar to precision analysis
* **Circuit depth minimization**: Like optimizing floating-point pipelines
* **Vectorized packing (SIMD in ciphertexts)**: Batching multiple plaintext slots using polynomial CRT representations

In many ways, FHE compilers resemble:

* **Hardware synthesis tools** (Verilog → gates)
* **Secure MPC compilers**, but with algebraic noise models

Current implementation performance characteristics:
* Basic arithmetic: milliseconds
* Bootstrapping: ~10–100 ms (improving rapidly)
* Still $10^4$ to $10^6$ times slower than plaintext computation, but improving

This parallel with traditional compilation reveals why FHE development requires expertise from both cryptography and systems engineering:

| Aspect                 | Traditional Systems         | FHE Equivalent                     |
| ---------------------- | --------------------------- | ---------------------------------- |
| **Data type**          | Encrypted integers or reals | Ciphertexts in modular rings       |
| **Operation**          | ALU ops ($+$, $\times$)     | Homomorphic Eval                   |
| **Precision tracking** | Floating-point rounding     | Noise tracking                     |
| **Optimization goal**  | Performance                 | Circuit depth & noise minimization |
| **Memory layout**      | Vectorization               | Ciphertext batching                |
| **IR / backend**       | LLVM, MLIR                  | FHE DSLs / frameworks              |

While these computational frameworks provide the practical tools for FHE development, they rest upon deep mathematical foundations. To truly understand how FHE achieves its security guarantees and computational capabilities, we must examine the underlying mathematical structures that make it all possible.

## Mathematical Foundations

The security of modern FHE schemes relies on problems from lattice cryptography—a branch of mathematics dealing with geometric structures in high-dimensional spaces. Let's begin with the fundamental building blocks.

**Lattice definition**: A **lattice** $\mathcal{L} \subset \mathbb{R}^n$ is the set of all integer linear combinations of basis vectors:
$\mathcal{L} = \{ a_1\mathbf{v_1} + a_2\mathbf{v_2} + \dots + a_k\mathbf{v_k} \mid a_i \in \mathbb{Z} \}$, where $\mathbf{v_1}, \ldots, \mathbf{v_k}$ are the basis vectors. This resembles a discrete grid in high-dimensional space.

Building upon this geometric foundation, the **Learning With Errors (LWE) problem** provides the security backbone for most FHE schemes:

Given many samples of the form $(a_i, b_i = \langle a_i, s \rangle + e_i \bmod q)$ where $a_i \in \mathbb{Z}_q^n$ are random, $e_i$ are small "errors", and $s \in \mathbb{Z}_q^n$ is the secret vector, it is computationally hard (quantum-resistant) to recover $s$.

This computational hardness assumption ensures that ciphertexts leak no useful information about the plaintext, even to quantum adversaries.

However, pure LWE-based schemes would be prohibitively slow for practical use. To achieve the efficiency needed for real applications, we generalize LWE to operate within polynomial rings.

Let: $R_q = \mathbb{Z}_q[x]/(x^N + 1)$.

That is, polynomials modulo both a large integer $q$ and the cyclotomic polynomial $(x^N + 1)$.
Operations are done coefficient-wise mod $(q)$, with degree reduction by $(x^N + 1)$.

* $N$: ring dimension (power of 2, e.g. $2^{14} = 16384$)
* $q$: ciphertext modulus (a large prime or composite integer)

The **security** of this approach comes from the **Ring-LWE** assumption—the polynomial analogue of LWE that maintains the same hardness properties while enabling much more efficient operations.

With these mathematical structures in place, we can now describe how encryption and decryption actually work in practice.

**Encryption**

Let $s \in R_q$ be the secret key (a small polynomial). To encrypt plaintext $m \in R_t$, where $t \ll q$: 

$$c = (c_0, c_1) = (b, a) = (a \cdot s + m + e, -a)$$

Where:

* $a \leftarrow R_q$ is random
* $e \leftarrow \text{small noise}$
* $m$ is scaled up to fit modulus $q$

**Decryption**

$$m' = (c_0 + c_1 \cdot s) \bmod q$$

If noise $e$ is small, rounding recovers $m \bmod t$.

**Homomorphic Operations**

**Addition**: $(c_0, c_1) + (c_0', c_1') = (c_0 + c_0', c_1 + c_1')$. Plaintext result = $(m + m')$; noise increases linearly.

**Multiplication**: 
$$(c_0, c_1) \cdot (c_0', c_1') = (c_0 c_0', c_0 c_1' + c_1 c_0', c_1 c_1')$$

This produces a **3-term ciphertext** of degree 2 in $s$.

To restore it to 2 components, **relinearization** is performed using precomputed *key-switching* keys.

**Modulus and Scaling**

FHE operates modulo a large modulus $q$ (such as $2^{200}$ to $2^{600}$). Each operation increases the noise term $e$, which must remain small relative to $q$.

To control growth:

* **Modulus switching**: Reduce $q$ to a smaller modulus after some operations
* **Rescaling (CKKS)**: Divide ciphertext by a scaling factor to maintain numeric precision for approximate arithmetic

**CKKS: Approximate Arithmetic for Real Numbers**

For ML and signal processing, exact integers aren't enough.

**CKKS** encodes real numbers as scaled integers, allowing approximate operations.

Encode: $m \mapsto \lfloor \Delta \cdot m \rceil \mod q$ where $\Delta$ is a large scaling factor (e.g. $2^{40}$).

After each multiplication, ciphertexts are divided by $\Delta$ to keep scale consistent:
$c' = \text{Rescale}(c_1 \cdot c_2, \Delta)$.

Decryption gives a real approximation of the true value, with precision loss bounded by noise.

When noise nears $q/2$, ciphertexts become undecryptable.
Bootstrapping resets the noise by **homomorphically evaluating the decryption function**.

Mathematically, bootstrapping homomorphically evaluates the decryption circuit. The encrypted secret key is used along with the noisy ciphertext to produce a fresh encryption of the same plaintext with reduced noise.
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
| $\Delta$  | $2^{40}$               | Scaling factor     |
| Security  | 128 bits               | Standard           |
| Encoding  | Complex packing (SIMD) | Pack ~8192 slots   |

Through the **Chinese Remainder Theorem (CRT)** [[13]], multiple plaintexts can be packed into one ciphertext.
Operations on ciphertexts then act *component-wise* across all slots — essentially encrypted SIMD.

Mathematically: $R_t / (x^N+1) \cong \prod_{i=1}^{N/2} \mathbb{C}$.
Each complex slot can store one value $\rightarrow$ huge parallelism gain.

These mathematical foundations work together in a carefully orchestrated hierarchy:

| Layer                   | Concept                           | Formal Structure          |
| ----------------------- | --------------------------------- | ------------------------- |
| **Security base**       | Hard lattice problems             | (Ring-)LWE                |
| **Algebraic structure** | Polynomial rings $\bmod ( q, x^N+1 )$ | $R_q$                   |
| **Encryption**          | Noisy linear map                  | $b = a \cdot s + m + e$       |
| **Homomorphism**        | Ring operations                   | Add/Mul in $R_q$        |
| **Noise control**       | Modulus switching, bootstrapping  | Keep $e \ll q/2$        |
| **Encoding**            | Integer / floating-point packing  | CRT + scaling             |
| **Evaluation**          | Arithmetic circuits               | Add, Mul, Rotate, Rescale |

Now that we understand the theoretical foundations, let's see how these abstract concepts translate into concrete computations. We'll trace through a complete CKKS computation to observe how all these pieces work together in practice.

## Execution Trace Example of CKKS

To bridge the gap between theory and practice, let's walk through a detailed example of CKKS in action. We'll compute $(x+1)^2$—a simple expression that demonstrates the key concepts of homomorphic evaluation.

**Parameters (illustrative but realistic)**

* Ring: $R_q=\mathbb{Z}_q[x]/(x^N+1)$, where $N=2^{14}=16384$
* Modulus chain (top → bottom): $\mathcal{Q}=[q_0,q_1,q_2]=[\approx 2^{40}, \approx 2^{40}, \approx 2^{40}]$
* Initial scale: $\Delta = 2^{40}$ (so after multiplication and rescaling we return near $2^{40}$)
* Target security: ~128-bit (with these $N,q_i$ magnitudes)
* Encoding: CKKS complex slots; here we use **one real** slot
* Example value: $x=1.2345$ → ground-truth $(x+1)^2 = 4.99299025$

>Note 1: Level ($L$) indexes how many primes remain in the chain. We start at ($L=2$) (using ($q_0q_1q_2$)).
{.note}

>Note 2: "Noise budget" is the common "bits until failure" indicator; exact numbers depend on implementation - values below are illustrative.
{.note}

**Step-by-step trace**

| Step | Operation      | Ciphertexts in / out         | Value (ideal)                | Scale                           | Level                  | What happens to noise                                                                                        |
| ---- | -------------- | ---------------------------- | ---------------------------- | ------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------ |
| 0    | **Encode** $x$ | $- \rightarrow p_x$                    | $x$                          | $\Delta \approx 2^{40}$         | L2                     | Encoder maps (x) to a polynomial; rounding error (<!1/\Delta).                                               |
| 0′   | **Encode** (1) | $- \rightarrow p_1$                    | (1)                          | ($\Delta$)                        | L2                     | Same scale so we can add later without rescale.                                                              |
| 1    | **Encrypt**    | ($p_x \to c_x$), ($p_1 \to c_1$) | ($x,;1$)                       | ($\Delta$)                        | L2                     | Each ciphertext gets RLWE noise ($\varepsilon \sim \mathcal{O}(\sigma)$).                                      |
| 2    | **Add**        | ($c_a = c_x + c_1$)            | ($x+1$)                        | ($\Delta$)                        | L2                     | Noise adds linearly; budget drops slightly.                                                                  |
| 3    | **Square**     | ($c_s = c_a \times c_a$)       | (($x+1)^2$)                    | ($\Delta^2 \approx 2^{80}$)       | L2 → L2 (pre-rescale)  | Noise multiplies; degree grows; perform **relinearization** to return to 2 components-noise increases again. |
| 4    | **Rescale**    | ($c_r = \text{Rescale}(c_s)$)  | (($x+1)^2$)                    | ($\Delta^2 / q_2 \approx 2^{40}$) | **L1** (dropped ($q_2$)) | Dividing by ($q_2$) reduces magnitude (and effective noise); scale is back near ($\Delta$).                      |
| 5    | **Decrypt**    | ($c_r \to p_r$)                | (($x+1)^2 + \text{err}$)       | ($\Delta$)                        | L1                     | Correct if total error (< $\Delta/2$).                                                                         |
| 6    | **Decode**     | ($p_r \to \hat{y}$)            | ($\hat{y} \approx 4.99299025$) | -                               | -                      | Final rounding to a real value; error dominated by encoding + CKKS approximation + op noise.                 |

Typical **noise budget** evolution (illustrative): start ~110–120 bits at L2 → after add ~108 bits → after multiply + relinearization ~60–70 bits → after rescale ~50–60 bits remaining (plenty for a few more operations).

**What the numbers look like (approximately)**

* After **Add**: value $\approx 2.2345$, scale $2^{40}$
* After **Square** (pre-rescale): value $\approx 4.99299025$, scale $2^{80}$
* After **Rescale** by $q_2 \approx 2^{40}$: value $\approx 4.99299025$, scale back to $2^{40}$, level drops to L1
* **Decrypt/Decode** returns something like: $4.99299025 \pm 10^{-9}$ (the tolerance depends on $\Delta$, $N$, and parameter choices)

Ground truth: $(1.2345+1)^2 = 4.99299025$.

**Key observations:**

* **Scale discipline (CKKS)**: Keep operands at compatible scales; after multiplication, **rescale** to restore the working scale and drop one prime from the chain
* **Depth management**: This circuit has multiplicative depth 1 (just one square), so a single rescale suffices; **no bootstrapping** required
* **Relinearization**: Required after multiplication to project back to a fixed ciphertext size (for performance and noise reasons)
* **Parameter selection**: Choose $\Delta$ close to a 40-bit prime so that $\Delta^2/q \approx \Delta$ post-rescale; choose chain length for your worst-case depth

**Minimal IR for $(x+1)^2$ (CKKS-style)**

```plaintext
c_x   = Enc(x, scale=2^40, level=L2)
c_one = Enc(1, scale=2^40, level=L2)

c_a   = Add(c_x, c_one)                 // scale 2^40, L2
c_s   = Mul(c_a, c_a)                   // scale ~2^80, L2
c_s   = Relin(c_s)                      // same scale, L2
c_r   = Rescale(c_s)                    // scale ~2^40, L1

y_hat = Dec( c_r )                      // ≈ (x+1)^2
```

>If another multiplication is needed, we still have $L1$ and could multiply once more (then rescale to $L0$). For deeper circuits, the chain is extended; when it's exhausted, we either stop or **bootstrap** to refresh noise/levels.
{.note}

Having traced through the mathematical operations at the CKKS level, we can now see how these concepts translate into practical code. Modern FHE libraries abstract away much of this complexity, allowing developers to work with encrypted data using familiar programming patterns.

## Rust Example

Let's implement the same $(x+1)^2$ computation using TFHE-rs, a high-performance Rust library for FHE. This example will demonstrate how the complex mathematical operations we've discussed can be expressed through simple, intuitive code.

TFHE-rs supports encrypted integers (8–128 bits) with operator overloading; relinearization and key-switching are handled automatically.

**Cargo.toml**

```toml
[package]
name = "fhe_test"
version = "0.1.0"
edition = "2024"

[dependencies]
tfhe = { version = "~1.4.1", features = ["integer"]}

[profile.release]
lto = "fat"
```

{{< detail-tag "Gist" >}}
{{<rawhtml>}}
<script src="https://gist.github.com/0xGeorgii/7cc261b052b0384e879095db935f5fe6.js"></script>
{{</rawhtml>}}
{{< /detail-tag >}}

```rust
use tfhe::{ConfigBuilder, FheUint64, generate_keys, prelude::*, set_server_key};

fn main() -> tfhe::Result<()> {
    let config = ConfigBuilder::default().build();

    // 2) Client keygen
    let (client_key, server_key) = generate_keys(config);

    // 3) "Upload" server key (in real applications, the server holds this)
    set_server_key(server_key);

    // Plain value of x:
    let x_clear: u64 = 1_234_567;

    // 4) Encrypt x and the constant 1
    let x: FheUint64 = FheUint64::try_encrypt(x_clear, &client_key)?;
    let one: FheUint64 = FheUint64::try_encrypt(1u64, &client_key)?;

    // 5) Homomorphic computation: (x + 1)^2
    //    Thanks to operator overloading, this looks like plain Rust
    let y = (&x + &one) * (&x + &one);

    // 6) Decrypt
    let y_clear: u64 = y.decrypt(&client_key);

    // Sanity check with plaintext computation
    let expected = (x_clear + 1).wrapping_mul(x_clear + 1);
    assert_eq!(y_clear, expected);
    Ok(())
}
```

**Notes:**

* The example uses `FheUint64`; change to `FheIntXX` / `FheUintXX` as needed
* TFHE-rs provides integer operations `+ - * / % << >> & | ^` and comparisons over encrypted values; constants can be plaintext or encrypted

![alt text](/img/fhe-execution.png)

Command:
```bash
RUSTFLAGS="-C target-cpu=native" cargo run --release
```

10 subsequent runs yield the following performance results:

```plaintext
===============================================================================
FHE EXPERIMENT RESULTS - 10 RUNS
===============================================================================
Run  |      Key Gen |   Encryption |  Computation |   Decryption |        Total
-----+--------------+--------------+--------------+--------------+-------------
1    |        655ms |          5ms |        5.43s |          0ms |        6.09s
2    |        445ms |          5ms |        5.49s |          0ms |        5.95s
3    |        469ms |          5ms |        5.37s |          0ms |        5.85s
4    |        427ms |          5ms |        5.36s |          0ms |        5.79s
5    |        469ms |          5ms |        5.39s |          0ms |        5.87s
6    |        447ms |          5ms |        5.50s |          0ms |        5.96s
7    |        470ms |          5ms |        5.44s |          0ms |        5.92s
8    |        434ms |          5ms |        5.56s |          0ms |        6.01s
9    |        451ms |          5ms |        5.48s |          0ms |        5.94s
10   |        435ms |          5ms |        5.42s |          0ms |        5.87s
-----+--------------+--------------+--------------+--------------+-------------
AVG  |        470ms |          5ms |        5.44s |          0ms |        5.93s
===============================================================================
```

This code example illustrates the remarkable accessibility that modern FHE libraries provide. What began as complex mathematical operations involving polynomial rings, noise management, and bootstrapping has been abstracted into simple, familiar programming constructs. The gap between FHE theory and practice continues to narrow as these tools mature.

## Conclusion

As we reach the end of our exploration, it's worth reflecting on the remarkable journey that Fully Homomorphic Encryption represents—both as a field of study and as a transformative technology. FHE truly represents a paradigm shift in how we approach privacy-preserving computation. From Craig Gentry's groundbreaking theoretical work in 2009 to today's practical implementations in libraries like TFHE-rs, Microsoft SEAL, and Zama's Concrete, FHE has evolved from an abstract mathematical concept to a deployable technology with real-world applications.

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
- [Hitchhiker's Guide to the TFHE Scheme][12]
- [Chinese Remainder Theorem][13]
- [TFHE-rs][14]
- [OpenFHE-rs][15]

[1]: https://github.com/microsoft/SEAL
[2]: https://github.com/homenc/HElib
[3]: https://github.com/google/fully-homomorphic-encryption
[4]: https://github.com/google/heir
[5]: https://github.com/zama-ai/concrete
[6]: https://dl.acm.org/doi/10.1145/1536414.1536440
[7]: https://en.wikipedia.org/wiki/Learning_with_errors
[8]: https://en.wikipedia.org/wiki/Ring_learning_with_errors
[9]: https://faculty.kfupm.edu.sa/coe/mfelemban/SEC595/References/Introduction%20to%20the%20BFV%20FHE%20Scheme.pdf
[10]: https://faculty.kfupm.edu.sa/coe/mfelemban/SEC595/References/Introduction%20to%20the%20BGV%20FHE%20Scheme.pdf
[11]: https://faculty.kfupm.edu.sa/coe/mfelemban/SEC595/References/Introduction%20to%20the%20CKKS-HEAAN%20FHE%20Scheme.pdf
[12]: https://hal.science/hal-04121360/document
[13]: https://en.wikipedia.org/wiki/Chinese_remainder_theorem
[14]: https://github.com/zama-ai/tfhe-rs
[15]: https://github.com/fairmath/openfhe-rs
