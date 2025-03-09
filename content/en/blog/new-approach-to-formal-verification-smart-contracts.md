+++
title = "New Approach to Formal Verification Methods for Combating Vulnerabilities in Smart Contracts"
date = 2025-03-10T11:20:45+09:00
draft = false
math = "katex"
summary = "Embedding formal specification constructs directly into programming languages could revolutionize smart contract development and eradicate vulnerabilities in smart contracts."
tags = ["Program Verification", "Formal Verification", "Formal Specification"]
aliases = ["/blog/new-approach-to-formal-verification-smart-contracts"]
+++

**Table of Contents**
- [Introduction](#introduction)
- [A New Perspective on the Problem](#a-new-perspective-on-the-problem)
- [A New Approach to the Problem](#a-new-approach-to-the-problem)
- [Conclusion](#conclusion)


## Introduction

Attempts to address the problem of vulnerabilities in smart contracts and the surrounding blockchain infrastructure using formal algorithm verification methods have been underway for several years. One of the earliest works in this direction (Bhargavan et al. (2016): “Formal Verification of Smart Contracts: Short Paper.” PLAS 2016[^1]) demonstrated a parallel translation into a subset of the `F*` language of both the Solidity contract’s source code and its compiled EVM bytecode, with the aim of formally proving the equivalence of their semantics.

In theory, this would eliminate both unintentional compilation errors and the malicious substitution of EVM bytecode at the time of contract deployment on the blockchain. Later, in another work (Mavridou & Laszka (2018): “Designing Secure Ethereum Smart Contracts: A Finite State Machine Based Approach (FSolidM).” Financial Cryptography (FC) 2018[^2]), an alternative approach to the design of smart contracts was proposed—one that restricts their computational model by the formalism of a finite automaton, whose conceptual simplicity is well suited for “one-click” verification of many security-critical properties.

Proponents of more classical solutions (Tsankov et al. (2018): “Securify: Practical Security Analysis of Smart Contracts.” ACM CCS 2018[^3]) were not far behind, with static analysis tools demonstrating the ability to automatically check Ethereum contracts for the presence of typical algorithmic patterns associated with security issues. A similar methodological direction can be observed in another work (“ZEUS: Analyzing Safety of Smart Contracts.” NDSS 2018[^4]), where typical vulnerability patterns are recognized during symbolic interpretation of a specially compiled LLVM version of the Solidity source.

Finally, in this context one cannot fail to mention the solution (Sergey et al. (2019): “Scilla: a Smart Contract Intermediate-Level Language.” ACM PLDI 2019[^5]), which involves incorporating into the blockchain infrastructure a domain-specific language for the intermediate representation of contracts, designed to be friendly to the logical formalization tools used in interactive theorem proving. The current state of the art in this field can be more fully assessed by meta-surveys (Tolmach et al. (2021): “A Survey of Smart Contract Formal Specification and Verification.” arXiv e-print 2008.02712[^6]), which, alas, still depict a picture of methodological diversity that is rarely applied in industrial practice.

## A New Perspective on the Problem

Within our research, we wish to offer a perspective on the problem of combating smart contract vulnerabilities from a slightly different angle—one that generalizes the issue to the challenges noted long ago by Leslie Lamport in his analysis of the inevitable abundance of errors in any complex software system. Building on his philosophy of rigorous design, we maintain that the primary cause of the most insidious critical errors in the classical approach to software development (by which both traditional software and smart contracts are currently created) is the absence of a formal specification phase for the algorithm to be implemented—a phase that should precede the actual implementation.

The conventional methodology replaces specification with an informal documentation of the developer’s intentions, at best accompanied by a test suite illustrating the main usage patterns. We, however, posit that the fight against zero-day vulnerabilities (especially dangerous in the crypto-financial context) is essentially lost the moment the first line of code is written without prior coverage by a formal specification that precisely accounts for its effects within the surrounding execution context. This development perspective, stemming from the aforementioned methodological premise, inevitably highlights several facts:

1. Despite the obvious importance of work on formal verification of compilers and the checking of semantic equivalence between source code and executable binaries, their practical impact is inevitably limited and does not cover a vast class of vulnerabilities that arise already in the program’s source code.
2. Any solution to the problem of software reliability that entails a significant narrowing of a programmer’s toolkit cannot claim universality. Not all financial transaction logic is conveniently expressed by finite automata; beyond their domain of applicability, the intensity of the problem remains undiminished.
3. Tools for static code analysis targeting typical vulnerabilities, while undeniably practically useful, cannot replace full formal specification — primarily because their application is possible only on already written code. Moreover, they cannot help prevent genuinely new logical errors that do not reduce to already known patterns.
4. Given the current state of the software development industry, it is difficult to imagine the widespread adoption of paradigms that force programmers to use high-entry-threshold tools for code specification (such as Rocq (Coq), Lean, Agda, etc.). This appears to be the most challenging practical obstacle to the implementation of the described methodology — until formal descriptions of program properties no longer require a high level of expertise in specialized areas of mathematical logic, only very few will be able to begin development with a proper specification.

## A New Approach to the Problem

Considering the above, it must be noted that a transition to a specification-driven development paradigm requires a radical overhaul of the methods used to describe algorithmic properties. As a result of such a transformation, the toolkit of an ordinary programmer must be adapted to meet the following requirements:

1. The developer must be able to formulate specifications for the algorithms they implement in a form sufficiently expressive to describe arbitrary logical properties.
2. The means of writing these specifications should be intuitive and accessible, minimizing the entry barrier and enabling widespread adoption among developers.
3. It is necessary to develop mechanisms for the automated verification of code conformance with its formal specification during the development process, allowing early detection and correction of discrepancies.
The toolchain must be seamlessly integrated with popular development environments and version control systems, ensuring that the process of specification and verification does not disrupt the conventional workflow.
1. The approach should allow for backward compatibility and a gradual transition from traditional development methods to a specification-driven paradigm, thereby facilitating the incorporation of formal methods into existing projects.

## Conclusion

In conclusion, addressing these challenges will not only improve the security and reliability of crypto-financial products but also set a new standard in software development practices. By ensuring that formal verification becomes a fundamental part of the development lifecycle, we can effectively mitigate the risks associated with zero-day vulnerabilities and foster the creation of a more robust, secure, and trustworthy software ecosystem.

Although it is hard to deny that the prospects for a real technological revolution of this kind still carry an unmistakable hint of utopianism, we would like to propose a research direction capable of converting even a relatively modest amount of effort into compelling evidence that the bright future of specification-driven development may be much closer than it appears today. If our assumptions are correct, the foundation of the new methodology will rest on the following postulate:

> A program in any Turing-complete programming language can be specified, essentially, in the same language, supplemented with just a few additional constructs with non-deterministic semantics.

The use of a special non-deterministic generalization of the very language in which programs are written for specifying those programs may well become the decisive breakthrough for the widespread adoption of these ideas. If it proves possible to establish sufficiently general principles by which any imperative programming language can be extended with new constructs that allow for the formulation of arbitrary logical properties of algorithms, code specification will cease to be the esoteric art of a select few scholars and will become a routine element of a programmer’s craft—much like substructural type systems, which only a few years ago emerged from the mathematical underground.

As an initial testing ground for these new ideas, we propose the use of the WebAssembly computational model [^7], which combines thoroughly formalized semantics, widespread adoption in the crypto-financial industry, and mature mechanization on the platform of the interactive theorem prover Rocq[^8] (WasmCert-Coq[^9]).

[^1]: https://dl.acm.org/doi/10.1145/2993600.2993611
[^2]: https://fc18.ifca.ai/preproceedings/101.pdf
[^3]: https://files.sri.inf.ethz.ch/website/papers/ccs18-securify.pdf
[^4]: https://www.ndss-symposium.org/wp-content/uploads/2018/02/ndss2018_09-1_Kalra_paper.pdf
[^5]: https://ilyasergey.net/papers/scilla-oopsla19.pdf
[^6]: https://arxiv.org/pdf/2008.02712
[^7]: https://webassembly.github.io/spec/core/exec/index.html
[^8]: https://rocq-prover.org
[^9]: https://github.com/WasmCert/WasmCert-Coq

{{<post-socials page_content_type="blog" telegram_post_id="26">}}
