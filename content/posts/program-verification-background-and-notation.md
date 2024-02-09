+++
title = 'Program Verification: background and notation'
date = 2024-02-01T19:34:48+08:00
draft = false
math = "katex"
summary = "This article examines the field of program verification, emphasizing the precise implementation of algorithms through computational models like finite automata and Turing machines."
+++

_Tags: #mathematics #program-verification #foundations_

## Table of Contents

- [Introduction](#introduction)
- [Specification-vs-Computation Gap](#specification-vs-computation-gap)
  - [Example: Graph Colorers](#example-graph-colorers)
- [Abstract Computing Device](#abstract-computing-device)
  - [Example 1: Finite Automaton](#example-1-finite-automaton)
  - [Example 2: Turing Machine](#example-2-turing-machine)
- [Closing the Gap](#closing-the-gap)
  - [Example 3: Totality of Finite Automatons](#example-3-totality-of-finite-automatons)
- [Conclusion](#conclusion)
- [References](#references)

## Introduction

This study delves into the intricacies of program verification in software engineering, a pivotal domain that integrates theoretical mathematical principles with practical computational applications. It scrutinizes the congruence between algorithmic specifications and their manifestation through the operation of abstract computational models. This examination is pivotal in addressing the pivotal challenges associated with ascertaining program correctness and dependability. Employing a systematic analytical framework, the article traverses a spectrum of computational paradigms, ranging from finite automata to Turing machines, thereby elucidating their respective roles and impacts within the broader context of program verification. The objective of this scholarly exposition is to furnish a comprehensive and nuanced perspective on program verification, underscoring its significance in the enhancement and evolution of reliable software methodologies in the context of the digital era.

Consider a defined class $S \subset X \rightharpoonup Y$ comprising partial functions, where $X$ represents an enumerable domain and $Y$ the corresponding codomain. Concurrently, envisage a computational machine $\mathfrak M : P \to X \rightharpoonup Y$, capable of processing a program $p \in P$ ($P$ being an enumerable set) with an input $x \in X$ to potentially yield an output $y \in Y$, represented as $\mathfrak M_p(x)=y$. In this context, 'potentially' signifies that $\mathfrak M$ operates as a deterministic machine, with attributes such as totality and determinism being integral to program design by engineers. Consequently, the quintessential task in program verification can be succinctly articulated as follows:

> Given $p$, $\mathfrak M$ and $S$. Ascertain whether the proposition $\mathfrak M_p \in S$ holds $true$.

## Specification-vs-Computation Gap

The intricacy of this verification issue emanates from a discernible semantic disjunction between the descriptive framework of $S$ and the operational dynamics of $\mathfrak M_p$. The conventional approach to delineating a function class involves a declarative methodology, emphasizing the logical interrelations of inputs and outputs, whilst typically abstracting away the evaluative process as a conceptual 'black box'. In contrast, the functional paradigm of $\mathfrak M_p$ adheres to a deterministic modality, characterized by the systematic and inductive application of a predetermined array of operational rules. This process incrementally alters the machine's internal state, informed by the specific program $p$ and a given input $x$, and continues until a predefined termination criterion is satisfied, culminating in the generation of a discrete output $y$. Notably, this operational process does not inherently account for the logical coherence between varying input-output pairs and, in the context of $\mathfrak M$ possessing Turing completeness does not inherently assure termination as per the halting problem [[1]].

Also, a noteworthy detail is that sometimes people confuse the true verification problem as stated above with a much weaker variation:

> Given $p$, $\mathfrak M$ and a specifically delineated set $S' \subseteq X \times Y$ of permissible input-output pairs, one must ascertain the veracity of the proposition $\forall x \in X, (x, \mathfrak M_p(x)) \in S'$.

In such a problem statement (intuitively well-aligned with the essence of manual program testing) we can not express many important function properties of integral nature, for instance, its bijectiveness. Understanding this difference allows us to discern the nuanced distinction between verifying the absolute correctness of $\mathfrak M_p$ as opposed to its conformity with a predetermined spectrum of acceptable responses.

### Example: Graph Colorers

In an endeavor to elucidate the aforementioned verification challenge, consider a hypothetical scenario of a programming competition aimed at designing an algorithm for coloring the vertices of an arbitrary loopless planar graph. The objective is to utilize the minimal number of colors such that adjacent vertices are not identically colored [[2]]. While the verification of solution correctness for a specific input in this context is straightforward, addressing more abstract inquiries, such as the absolute optimality of the algorithm (i.e., its inability to be surpassed in efficiency by any alternative algorithm across all inputs), presents a more profound challenge. Despite the potential for extensive test suites, the absence of algorithmic failure within these parameters does not irrefutably guarantee universal applicability. Furthermore, an analytical review of the algorithm's internal mechanics poses significant difficulties. For instance, consider an algorithm structured as follows:

1. Evaluate if the graph contains any edges; if absent edges, color the entire graph uniformly and terminate.
2. Determine if the graph is bipartite; if affirmative, employ a dual-coloring scheme and terminate.
3. Engage in a comprehensive evaluation for a viable 3-coloring solution; upon success, terminate.
4. Similarly, exhaustively explore possible 4-coloring solutions; terminate upon finding a solution.
5. In the absence of a solution, conclude with an 'Unexpected!' error.

Even with a rigorous code audit confirming its adherence to the above algorithm, uncertainties persist — specifically, the algorithm's reliance on an exhaustive search strategy raises questions about its ability to invariably reach a conclusive outcome without resorting to the 'Unexpected!' termination. To answer this question positively, mathematicians had to prove the Four Color Theorem (Appel & Haken, 1976) — a landmark result in graph theory that, even in its most modern variation, requires careful analysis of 633 reducible configurations [[3]]. This scenario underscores the intricate nature of bridging the gap between a theoretical specification and its practical algorithmic realization, where validating the latter's comprehensive alignment with the former can be an arduous task.

This serves as a perfect illustration of the idea that when we are talking about formal verification of the infamous **specification – algorithm – implementation** workflow chain, the hardest tasks are not about detecting discrepancies between algorithm and implementation — actually the standard industrial practices have made this affair pretty mundane already. The main dehiscent gap lies between specification and algorithm, as making sure that the second obeys the first sometimes may require tremendous efforts, easily towering both specification and algorithm complexities.

## Abstract Computing Device

In addressing the theoretical delineation of the discrepancy between algorithmic specifications and their respective implementations, it is imperative to commence with a rigorous formalization of both constructs. Our discourse initiates from the algorithmic perspective, arguably more accessible to the reader. Attaining a comprehensive level of abstraction necessitates transcending the particularities of programming languages and computational platforms, as well as the inherent distinctions amongst computational models. This approach is predicated on two fundamental premises:

1. The efficacy of an algorithm's representation is often contingent upon the computational model employed. For instance, the Turing machine [[4]] serves as a quintessential model for algorithms processing fixed-sized data, offering intuitive understanding and simplicity. Conversely, Markov algorithms [[5]] provide an optimal framework for intricate string operations. Algorithms manipulating tree-structured data are succinctly expressed via lambda calculus [[6]]. The unique attributes of each computational model necessitate a versatile and universally applicable formal language to accurately represent diverse algorithmic structures.
2. The computational demands of certain algorithms do not necessitate the extensive capabilities of a Turing machine or its equivalents. For instance, deploying a general recursive function to articulate a basic regular language [[7]] classifier may constitute an unnecessary complexity. More efficient articulation can be achieved through computational models restricted in their operational capacity, thereby simplifying the reasoning process for such algorithms. Hence, a universal formal language, capable of accommodating various levels within the Chomsky hierarchy [[8]], is instrumental in conserving analytical effort and cognitive resources.

With all this in mind, let us define two essential components of every abstract sequential automaton:

- A countably infinite set $M$ of all possible memory states, along with the functions $in : X \to M$ and $out : M \to Y$, defining its interface with the environment;
- A finite set of operators $Ops = \\{op_i : M \to (M \times R_i) \cup \\{\blacktriangledown\\}, i=\overline\{1,n\}\\}$, representing atomic memory-transforming actions, where each $R_i$ is a finite set of $op_i$ return values and $\blacktriangledown$ is our notation for program halting.

In such terms, for a program $p$ every individual run of $\mathfrak M_p$ over a particular input $x$ (in case of its eventual termination) can be represented as a function composition $y = (out \circ \overline\{op_\{i_k\}\} \circ \ldots \circ \overline\{op_\{i_1\}\} \circ in) (x)$, where $\overline\{op_i\} : M_i \to M$ projects $op_i$ into its memory effect over $M_i = \\{m \in M \mid op_i(m) \neq \blacktriangledown\\}$, disregarding the return value. What remains a mystery is how the machine selects the particular sequence $op_\{i_1\}, \ldots, op_\{i_k\}$ of operators appropriate for each specific input $x$. Naturally, its behavior is defined by a program, which can be represented as a marked directed multigraph $p = \langle V, P, E, V_\blacktriangle \rangle$, where:

- $V$ is a finite set of vertices representing distinct execution states;
- The mark $P : V \to Ops$ associates states with operators to be executed upon their activation;
- A set of marked edges $E \subseteq \\{(v, r, w) \mid v, w \in V, r \in R_\{P(v)\}\\}$ represents possible paths of transitions from one active state $v$ to another $w$, depending on the return value $r$ of the executed operator $P(v)$;
- A subset $V_\blacktriangle \subseteq V$ denotes the potential starting states of the program execution.

If $V_\blacktriangle$ consists of exactly one state, and for each pair $(v,r) \in V \times R_\{P(v)\}$ there is exactly one $w \in V : (v, r, w) \in E$, then such a program can be called deterministic. Using this notation for an abstract machine and program, we can represent a wide range of automatons across the power hierarchy.

### Example 1: Finite Automaton

A class of acceptor finite-state automatons [[9]] over the alphabet $\Sigma$ can be described as a machine $\mathfrak M^F$ with memory $M = \Sigma^* \cup \\{\mathbf T, \mathbf F\\}$ holding either an arbitrary string or ending states of success/failure. Two operators needed for its execution are:

- $op_\{\tt next/t\}$ with $R_\{\tt next/t\} = \Sigma \cup \\{\blacktriangledown\\}$, which consumes the first symbol from the string in memory and passes it back as a return value, or, in the case of an empty string, sets the memory to the success state $\mathbf T$ and returns $\blacktriangledown$, otherwise, if the memory already holds one of the ending states, terminating the program;
- $op_\{\tt next/f\}$ with identical $R_\{\tt next/f\} = \Sigma \cup \\{\blacktriangledown\\}$, has the same overall behavior except for setting the memory to the failure state $\mathbf F$;

The construction of the program graph for this example is straightforward — each state of the finite automaton is represented as exactly one vertex with a looping $\blacktriangledown$-marked edge.

### Example 2: Turing Machine

Another example too significant to overlook is the Turing machine $\mathfrak M^T$ over an alphabet $\Gamma = \\{\gamma_0, \ldots, \gamma_n\\}$ with a blank symbol $\gamma_0$, whose memory $M = \cal T \times \Z$ holds both the states of the tape $\bold t \in \cal T \subset \Z \to \Gamma$ and the position of the head $h \in \Z$. The ensemble of operators needed for $\mathfrak M^T$ execution includes:

- $op_\{\tt read\}$ with $R_\{\tt read\}=\Gamma$, which has no effect on memory and returns $\bold t(h)$, the current symbol on the tape under the head;
- $op_\{\tt write\_0\}, \ldots, op_\{\tt write\_n\}$ with $R_\{\tt write\_0\} = \ldots = R_\{\tt write\_n\}=\\{\checkmark\\}$, writing the corresponding individual symbol $\gamma_i \in \Gamma$ to the tape under the head, and replacing $\bold t$ with $\bold t|_h^\{\gamma_i\}$;
- $op_\{\tt left\}$ and $op_\{\tt right\}$ with $R_\{\tt left\} = R_\{\tt right\} = \\{\checkmark\\}$, moving the head left and right by decrementing or incrementing $h$ respectively;
- And obligatory $op_\{\blacktriangledown\}$, which terminates program execution.

Here, constructing a program graph is relatively straightforward as well. When translating arbitrary Turing machines to $\mathfrak M^T$, for each state, one must create a corresponding $op_\{\tt read\}$ node (or the $op_\{\blacktriangledown\}$ ​node for the accepting state) and connect these through intersecting chains of $op_\{\tt write\_i\}$ and $op_\{\tt left|right\}$ intermediate nodes.

## Closing the Gap

Now, having outlined the definition of execution semantics, let's return to the verification problem. Using the above elaborations, we can start to comprehend what "given $\mathfrak M$" actually means. The semantics of $\mathfrak M$'s execution can be expressed through an axiomatic description of properties held by its ensemble of operators ($op_1, \ldots, op_n$). If we aim to ensure $\mathfrak M_p \in S$ for some program $p$, we can deduce the necessary logical connections between every $x$ and $\mathfrak M_p(x)$ by verifying that the control flow of $p$ can produce operator sequences adhering to it. This can be done in multiple ways; for example, we can pursue symbolic computation of $p$, eliminating branches that contradict our main supposition, and hope that automated formula composition exhausts the decision tree for us. Alternatively, we can manually construct a proof of the needed proposition by formulating useful intermediary invariants that every execution state preserves.

### Example 3: Totality of Finite Automatons

Let's state a well-known fact about finite automata, formulated as a property of $\mathfrak M^F$:

> For every deterministic program $p$ and input $x \in \Sigma^*$, an execution of the $\mathfrak M^F_p(x)$ halts in either $\mathbf T$ or $\mathbf F$ state.

This can be proven by simple induction over the length of an input string at any point in $\mathfrak M^F_p$ execution:

1. $\left| x \right| = 0:$ when the active state is marked with $op_\{\tt next/t\}$ (or $op_\{\tt next/f\}$), its execution sets the memory to the $\mathbf T$ (or $\mathbf F$) state and triggers a transition through the edge marked with $\blacktriangledown$ marking. Regardless of the subsequent state's marking, the program terminates. The base case is proven.
2. $\left| x \right| = l+1:$ irrespective of the active state's marking, the first letter $x$ will be consumed during its execution. For the subsequent active state, the memory holds a string of length $l$, and thus, the induction step is also proven. $\Box$

This informal proof serves as a principal demonstration of the reasoning that assures us about facts not just for one particular input or one particular program, but for a whole class of automata operating on arbitrary programs and inputs.

## Conclusion

In this discourse, we have embarked on a preliminary exploration of the domain of program verification, laying foundational insights into its complexities and intricacies. While the examples provided are intentionally simplified to facilitate comprehension without the necessity of software aids, they nevertheless highlight the profound challenges inherent in this field. The endeavor of aligning an algorithm with its specification, as illustrated, can hinge on complex mathematical conjectures, such as the Four Color Theorem, whose proofs may elude straightforward analytical methods and instead require computational validation.

This exploration underscores a critical aspect of modern software engineering: the necessity for robust, automated tools in program verification. Such tools are indispensable, especially when the verification tasks involve ensuring that complex systems adhere to multifaceted specifications. As we have seen, even seemingly straightforward algorithms can depend on deeply layered logical structures, making manual verification a daunting, if not impractical, task. In the era where the reliability and correctness of software are paramount, the field of program verification emerges not merely as an academic interest but as a cornerstone in the development of dependable and secure software systems.

The ongoing evolution of program verification methodologies and tools will undoubtedly play a pivotal role in addressing future challenges in software engineering, thereby contributing significantly to the advancement of technology and its applications in our increasingly digital world.

## References

- [Halting Problem. _wiki.c2._][1]
- [Graph coloring. _Encyclopedia of Mathematics._][2]
- [Four Color Theorem. _GitHub._][3]
- [Turing machine. _Encyclopedia of Mathematics._][4]
- [Normal algorithm. _Encyclopedia of Mathematics._][5]
- [Lambda calculus. _Encyclopedia of Mathematics._][6]
- [Regular event. _Encyclopedia of Mathematics._][7]
- [Formal languages and automata. _Encyclopedia of Mathematics._][8]
- [Finite Automaton. _Encyclopedia of Mathematics._][9]

[1]: http://wiki.c2.com/?HaltingProblem
[2]: https://encyclopediaofmath.org/wiki/Graph_colouring
[3]: https://github.com/coq-community/fourcolor
[4]: https://encyclopediaofmath.org/wiki/Turing_machine
[5]: https://encyclopediaofmath.org/wiki/Normal_algorithm
[6]: https://encyclopediaofmath.org/wiki/Lambda-calculus
[7]: https://encyclopediaofmath.org/wiki/Regular_event
[8]: https://encyclopediaofmath.org/wiki/Formal_languages_and_automata
[9]: https://encyclopediaofmath.org/wiki/Automaton,_finite

---

Discuss [this post](https://t.me/inferara/4) in our telegram channel [@inferara](https://t.me/inferara/).
