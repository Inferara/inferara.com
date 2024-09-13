+++
title = 'Verification-driven development'
date = 2024-03-06T21:21:31+08:00
draft = false
math = "katex"
tags = ["Program Verification", "Verification Driven Development"]
summary = "In this paper the 'reasonable machine' term is presented along with the hypothesis that all practically applicable computing paradigms can be represented in the form of such machines."
aliases = ["verification-driven-development"]
+++

## Table of Contents

- [Introduction](#introduction)
- [Formal specifications 101](#formal-specifications-101)
- [Modular testing tarpit](#modular-testing-tarpit)
- [Escape from tarpit](#escape-from-tarpit)
- [Conclusion](#conclusion)
- [References](#references)

## Introduction

In the previous publication [[1]] we have formalized the operational side of the algorithm-specification problem. Now, we elaborate on what it means when one says they want to define an algorithm. In the most common sense, a program specification procedure usually takes the form of setting restrictions that are implied onto the algorithm's behaviour; thus, creating an equivalence class of programs, constricted by the same set of rules.

## Formal specifications 101

When one says that _$s$ is a sorting algorithm over a sequence of $\Gamma$ elements according to the strict order $\prec$_, the expected $\mathfrak M_s : \Gamma^* \rightharpoonup \Gamma^*$ behaviour can be formalized as following:

1. $\forall x \in \Gamma^*, \exists y = \mathfrak M_s(x)$, i.e. $\mathfrak M_s$ is total;
2. $\forall x \in \Gamma^*, y = \mathfrak M_s(x), \forall \gamma \in \Gamma, \displaystyle\sum_\{i=1\}^\{\left| x \right|\} [x_i=\gamma] = \displaystyle\sum_\{i=1\}^\{\left| y \right|\} [y_i=\gamma]$, i.e. output of $\mathfrak M_s$ is always a permutation of the input (written using Iverson bracket [[2]] notation);
3. $\forall x \in \Gamma^*, y = \mathfrak M_s(x), \forall i,j \in \\{1, \ldots, \left| x \right|\\}, y_i \prec y_j \rArr i < j$, i.e. an output of $\mathfrak M_s$ is always sorted.

These three formulas of the first-order logic together exhaustively describe a set of all sorting algorithms. In other words, every program that implements all three can be called a "sorting algorithm", and every sorting algorithm must implement all three.

The most important consequence of creating an equivalence class like the above is the ability to dismiss every implementation detail of a specified algorithm in the context of reasoning about its properties. One can design a complex program $p(\ldots, s, \ldots)$, embed arbitrary sorting algorithm $s$ as a subroutine, and ensure that if $s'$ is a sorting algorithm, then the reasoning about the properties of $p(\ldots, s', \ldots)$ will be exactly the same. It is important to understand though, that such a consideration leads to indistinguishability of reasoning about program properties, and **not about the indistinguishability of the program behaviour**, as an algorithm specification covers only the essential aspects, disregarding the non-important ones. For example, consider a partially ordered alphabet $\Gamma = \\{\mathtt A, \mathtt B, \mathtt C, \mathtt D\\}$:

- $\mathtt A \prec \mathtt B \prec \mathtt D$,
- $\mathtt A \prec \mathtt C \prec \mathtt D$,

where $\tt B$ and $\tt C$ are not comparable. Then at least two different sorting algorithms $s$ and $s'$ can emerge. The application of these algorithms to the same sequence $\tt CDACB$ produce two different outputs:

- $\mathfrak M_s(\{\tt CDACB\}) = \{\tt ABCCD\}$
- $\mathfrak M_\{s'\}(\{\tt CDACB\}) = \{\tt ACCBD\}$

Such discrepancies do not validate the correctness, meaning that a certain specification does not restrict the algorithm's behaviour more than required. Consequently, composite programs $p(\ldots, s, \ldots)$ and $p(\ldots, s', \ldots)$ can behave differently too, but the reasoning about their properties that relies only on the correctness of $s$ and $s'$ will be the same. This approach prevents one of the most dangerous classes of software engineering predicaments &mdash; **modular testing tarpit** [[3], page 4].

## Modular testing tarpit

Consider a case of a program design $\mathfrak M_p : X \rightharpoonup Z$ so it implements a formally defined specification $\forall x \in X, \mathtt\{test\}(x, \mathfrak M_p(x)) = \mathtt\{true\}$. Where $\mathtt\{test\} : X \times Z \to Bool$ is computable, and exists a natural enumeration $(x_i \in X, i \in \N)$ of a domain, that can be used to test the final solution for conformity with the specification. The high-level view of the development cycle of such a program could look like an incremental process, starting with an empty operation $p_0$. Next, the repetitive patching of code, every $p_i$ to $p_\{i+1\}$ improves its quality until the desired observable behaviour is reached [[4]]. With the natural enumeration of $X$ the term _quality_ of $p_i$ can be considered as a set of passed tests before encountering the first failure. In such terms, the goal of the development is to approach such iteration $n$, that the _quality_ of a $p_n$ turns out to be impossible to measure, because the failed test cannot be found.

This concept looks good, and frankly, it would not have became an industrial standard without a reason &mdash; it is truly simple and approachable. However, this workflow has some hidden drawbacks that can emerge when scrutinized deeper to the tactical level. In case of operating in the complex endeavors the patching $p_i$ to $p_\{i+1\}$ without quality degradation is a non-trivial process. It is difficult to think about a complex system as a whole. This problem is usually tackled by dissecting the big features into subtasks that are considered independently in some sense. Usually, the changes are narrowed to individual components instead of the entire codebase. The quality of that changes usually relies on the individual thinking about the imposed quality of whole $p$.

Consider $\mathfrak M_p := \mathfrak M_\{\hat p\} \circ \mathfrak M_\{\check p\}$ as a composition of two parts, a _producer_ $\mathfrak M_\{\check p\} : X \rightharpoonup Y$ and a _consumer_ $\mathfrak M_\{\hat p\} : Y \rightharpoonup Z$. An interface between these two parts is described as a countable set $Y$ of possible intermediate data structures passed from the _producer_ to the _consumer_. Naturally, such modularization works only if it is possible to specify a behavior of the components with testing functions $\mathtt\{test/prod\} : X \times Y \to Bool$ and $\mathtt\{test/cons\} : Y \times Z \to Bool$, in a way that $\forall x \in X, z \in Z, \mathtt\{test\}(x, z) \hArr \exists y \in Y : \mathtt\{test/prod\}(x, y) \land \mathtt\{test/cons\}(y, z)$. Please note that we are talking about a theoretical possibility of an individual test function existences as a formal prerequisite of a proper modularization, and not about an actual formalization, as in real-life cases traditional development workflow does not consider it obligatory.

Now, consider the case where $\mathtt\{test/prod\}$ and $\mathtt\{test/cons\}$ are formalized before the module segregation. Therefore, it is required to implement the smaller parts of the task, so for any $\mathfrak M_\{\check p\}$ adhering to $\mathtt\{test/prod\}$ and $\mathfrak M_\{\hat p\}$ adhering to $\mathtt\{test/cons\}$, the composition $\mathfrak M_\{\hat p\} \circ \mathfrak M_\{\check p\}$ will be adhering to $\mathtt\{test\}$, as a consequence of a proper specification design. However, an iterative process of the program development is complicated by the fact that programs are not developed error-free.

The quality of the producer can be defined in the same way as the quality of the whole program is &mdash; by testing it against the natural enumeration of the domain $X$, determining the quality of the consumer turns out to be a non-trivial task. The intermediate domain $Y$ was defined arbitrarily, so it does not have any given natural enumeration. The quality of a consumer tested against a fixed enumeration $(y_i \in Y, i \in \N)$ has a questionable impact on the quality of the whole program, as it requires an application of $\mathfrak M_\{\hat p\}$ to the artificial enumeration $(\mathfrak M_\{\check p\}(x_i), i \in \N)$ that necessarily depends on the particular _implementation_ of a producer. This leads to one of the most well-known and universal problems of iterative development of modular programs:

> Lehman and Belady have studied the history of successive releases in a large operating system. They find that the total number of modules increases linearly with release number, but that the number of modules affected increases exponentially with release number. All repairs tend to destroy the structure, to increase the entropy and disorder of the system. Less and less effort is spent on fixing original design flaws; more and more is spent on fixing flaws introduced by earlier fixes. As time passes, the system becomes less and less well-ordered. Sooner or later the fixing ceases to gain any ground. Each forward step is matched by a backward one. Although in principle usable forever, the system has worn out as a base for progress. Furthermore, machines change, configurations change, and user requirements change, so the system is not in fact usable forever. A brand-new, from-theground-up redesign is necessary [[3], page 122].

Problem, that was described by Frederick P. Brooks Jr. in his monumental "The Mythical Man-Month", on the large part can be attributed to the inadequacy of quality metric implied by testing. A patch, making producer pass a larger sequence of tests against a natural enumeration of the domain, can come at the cost of a changing its behaviour through the earlier tests. Even if such changes are valid within the specification of the producer, a consumer that was well-tested against the producer's output at the previous development iteration may start encountering failures earlier, due to the novel testing environment. That is, in the quality metric of testing, improvement of the producer may lead to degradation of the whole program, which raises a concern about the validity of such metric.

## Escape from tarpit

Here, we raise an important question: "If a paradigm of modular testing can sometimes fail, what could be an alternative?". If the assertion that the submodule environmental behaviour validation can be wrong, the submodule behaviour verification against the specification of its environment can be an option. Following the concept stated above, modularization now should begin with the dissection of a program specification into the independent subspecs of its parts and it needs to be taken to the logical endpoint if independently specified submodules are small enough to be verified by formal reasoning, the verification of whole program becomes possible by rules of logical inference.

Consider a specification $S = \\{f : X \rightharpoonup Y \mid \ldots\\}$, that is used in the implementation in a program $p$ for the executable machine $\mathfrak M$. Instead of starting with empty an program $\mathfrak M_\{p_0\} \notin S$ and incrementally amending it up to $\mathfrak M_\{p_n\} \in S$ (contra cannot be caught by testing), it instead would be rewritten as $S$ using the rules of logical equivalence until the trivial, to implement correctly iteration is reached. To describe the suggested procedure in detail, introduce some notation first:

- $\left|p\right| \in \N$ denotes the complexity of a program $p$ with a metric (number of distinct execution states, for example);
- $\left|S / \mathfrak M\right| = \displaystyle\min_\{p,\mathfrak M_p \in S\}\left|p\right|$, denotes the complexity of the simplest $S$ implementation on $\mathfrak M$;
- $q(p_1, \ldots, p_k) : P \times \ldots \times P \to P$ denotes a _program template_ &mdash; a computable function, that aggregates several arbitrary programs into one;
- $T(S_1, \ldots, S_k) : 2^\{X \rightharpoonup Y\} \times \ldots \times 2^\{X \rightharpoonup Y\} \to 2^\{X \rightharpoonup Y\}$ denotes a _specification template_ &mdash; a non-computable function, that aggregates several arbitrary specifications into one;
- $q \models T$ denotes a relation of the _template congruity_ interpreted as follows $\forall p_1, \ldots, p_k \in P, S_1, \ldots, S_k \subseteq X \rightharpoonup Y, \mathfrak M_\{p_1\} \in S_1 \land \ldots \land \mathfrak M_\{p_k\} \in S_k \rArr \mathfrak M_\{q(p_1, \ldots, p_k)\} \in T(S_1, \ldots, S_k)$.

Inroduce one important definition:

> A machine $\mathfrak M$ is called _reasonable_ if it has a finite system of _congruent templates_ $q_1 \models T_1, \ldots, q_t \models T_t$ and _triviality bound_ $n \in \N$ that is for every specification $S$ of the complexity $n < \left|S / \mathfrak M\right| < \infty$ can be refined to $\empty \sub T_i(S_1, \ldots, S_k) \subseteq S$ for some $i \in \\{1, \ldots, t\\}$ with $\forall j \in \\{1, \ldots, k\\}, \left|S_j / \mathfrak M\right| < \left|S / \mathfrak M\right|$.

Informally, $\mathfrak M$ is called _reasonable_ if every specification $S$, that implementation is feasible and complex enough, can be dissected congruently into a collection of sub-specifications $S_1, \ldots, S_k$, that is easier to implement than $S$. This property allows the following procedure to be used as an incremental development workflow:

1. Start with a formal specification $S_\varepsilon = \\{f : X \rightharpoonup Y \mid \ldots\\}$ of the program's intended behavior and put $\lambda := \varepsilon$ as index variable of recursion.
2. If $\left|S_\lambda / \mathfrak M\right| \leq n$, then $p_\lambda : \mathfrak M_\{p_\lambda\} \in S_\lambda$ is trivial enough to find directly.
3. If $\left|S_\lambda / \mathfrak M\right| > n$, then there is $\empty \sub T_i(S_\{\lambda.1\}, \ldots, S_\{\lambda.k\}) \subseteq S_\lambda, i \in \\{1, \ldots, t\\}$, where $\forall j \in \\{1, \ldots, k\\}, \left|S_\{\lambda.j\} / \mathfrak M\right| < \left|S_\lambda / \mathfrak M\right|$. For each $j$ apply procedure recursively with $\lambda := \lambda.j$ producing $p_\{\lambda.j\} : \mathfrak M_\{p_\{\lambda.j\}\} \in S_\{\lambda.j\}$. By relation of congruity $\mathfrak M_\{p_\{\lambda.1\}\} \in S_\{\lambda.1\} \land \ldots \land \mathfrak M_\{p_\{\lambda.k\}\} \in S_\{\lambda.k\} \rArr \mathfrak M_\{q_i(p_\{\lambda.1\}, \ldots, p_\{\lambda.k\})\} \in T_i(S_\{\lambda.1\}, \ldots, S_\{\lambda.k\})$, so we can settle on $p_\lambda = q_i(p_\{\lambda.1\}, \ldots, p_\{\lambda.k\})$ to have $\mathfrak M_\{p_\lambda\} \in S_\lambda$.

As this procedure is _structurally recursive_, i.e. goes deeper only on incrementally simpler specifications, it eventually stops, producing $p_\varepsilon$ as tree-like application of branching templates to collection of small hand-picked programs as leaves. Soundness of such design, i.e. $\mathfrak M_\{p_\varepsilon\} \in S_\varepsilon$, comes as natural conclusion to three sets of premises:

- proven congruity of templates $q_1 \models T_1, \ldots, q_t \models T_t$;
- proven inclusion of all recursive steps $\empty \sub T_i(S_\{\lambda.1\}, \ldots, S_\{\lambda.k\}) \subseteq S_\lambda$;
- correct picking of all trivial snippets $p_\lambda : \mathfrak M_\{p_\lambda\} \in S_\lambda$.

If all components are in place, the resulting program comes with correctness vindication, which is much stronger than one can be assured with any finite test coverage with a possibility of the counterargument not being found, because the constructive proof exists. The situation of suddenly finding a new input case that reveals the bug, which correction induces cascading degradations of behaviour in other parts of the program, simply cannot arise. Of course, such insurance does not come with no cost — the programmable machine must be reasonable according to the definition above.

At Inferara, we believe in the following informally stated hypothesis:

> All machines with sensible operational semantics are reasonable. For any programming paradigm that allows incremental development in a classic sense, it is possible to construct an exhaustive system of congruent templates that relate to intuitive rules of algorithm modularization. Moreover, the triviality bound for such a system is always manageably small.

## Conclusion

The development workflow described here can be called **verification-driven programming**. This new concept is based on the observation that a classical workflow of test-driven development has unavoidable limitations, that prevent programmers from reliably reaching a state of program correctness when the complexity of their task starts requiring non-trivial modularization of algorithm. Here we propose a new method that allows machine-assisted confirmation of program semantics's adherence to the developer's intentions, formulated as a tightly coupled hierarchy of sub-specifications, descending from the most abstract formalization of observable behaviour to the fine-grain description of algorithm structure. We believe such an approach is an invaluable safety rope over the infamous modular testing tarpit that have been consuming countless human resources. It is feasible to correctly implement programs on the first attempt if an engineering group properly designs a reasoning set before an actual implementation.

## References

- [Program verification: background and notation][1]
- [Iverson bracket][2]
- [Frederick P. Brooks Jr. – The Mythical Man-Month (Anniversary Edition) – 1995 – ark:/13960/t6b339c1v][3]
- [Compcert manual][4]

[1]: {{< ref "/papers/program-verification-background-and-notation" >}}
[2]: https://ozaner.github.io/iverson-bracket/
[3]: https://www.oreilly.com/library/view/mythical-man-month-the/0201835959/
[4]: https://compcert.org/man/manual001.html#sec3

---

Discuss [this paper](https://t.me/inferara/8) in our telegram channel [@inferara](https://t.me/inferara/).
