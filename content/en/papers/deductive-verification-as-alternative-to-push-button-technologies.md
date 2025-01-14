+++
title = 'Deductive Verification as an Alternative to "Push-Button" Technologies'
date = 2024-04-05T07:57:12+05:00
draft = false
math = "katex"
tags = ["Program Verification", "SMT", "Model checking"]
summary = "In this paper, the deductive verification approach is compared with other formal verification techniques, emphasizing the importance of correctness certificates in the verification process."
aliases = [ "/papers/deductive-verification-as-alternative-to-push-button-technologies" ]
+++

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Introduction](#introduction)
- [Features and Similarities of Formal Verification Techniques](#features-and-similarities-of-formal-verification-techniques)
- [Correctness Certificate and Its Role in the Verification Process](#correctness-certificate-and-its-role-in-the-verification-process)
- [Deep Specification Methodology](#deep-specification-methodology)
- [Conclusion](#conclusion)
- [References](#references)

## Introduction

Continuing the series of articles on development driven by deductive verification, here we propose a comparison of this methodology with the most closely related techniques that have already secured their place in practical software engineering. By formalizing the description of procedures for both — searching for confirmation of a program's compliance with specifications, and verifying already found solutions, we will try to convince the reader that manually implementing the first procedure while automating the second can become a quite practical compromise, offering several advantages over fully automatic methods.

## Features and Similarities of Formal Verification Techniques

Discussing the automation of formal software verification, it's impossible not to notice that the landscape of this field is extremely vast and encompasses many techniques that are related to each other only in the most general sense. At the same time, even experts tend to use this overarching term, shifting the focus away from the significant methodological differences between the applied techniques in favor of their common goal — mechanically obtaining mathematically convincing confirmation that the observed behavior of the program corresponds to the programmer's intent, expressed in the form of an unambiguous specification. If one attempts to formally highlight the mathematical essence of the idea of automating formal software verification, in broad terms, this can be done based on several basic objects:

- A countable set $\mathcal{L}$, listing all statements of a certain logic capable of describing specifications of the form $S = \\{f : X \rightharpoonup Y \mid l_S\\}$, where $l_S \in \mathcal{L}$;
- A countable set $\mathcal{C}$, listing correctness certificates for algorithms (the meaning of this concept will become clear later);
- A computable function $\texttt{verify} : P \times \mathcal{L} \times \mathcal{C} \to \\{\texttt{Proven}, \texttt{Contra}, \texttt{Invalid}\\}$ such that for every program $p \in P$ and symbolic record of the specification $l_S \in \mathcal{L}$, the equivalences $\mathfrak{M}_p \in S \Leftrightarrow \exists c \in \mathcal{C} : \texttt{verify}(p, l_S, c) = \texttt{Proven}$ and $\mathfrak{M}_p \notin S \Leftrightarrow \exists c \in \mathcal{C} : \texttt{verify}(p, l_S, c) = \texttt{Contra}$ hold.

It's noted that the $\tt verify$ function in practically applicable methods must be easily computable (i.e., at a minimum, belong to the polynomial complexity class) and universally recognized as correct (since its verdict is considered evidence of the correctness of the algorithm being verified). To complete the picture, it remains to define the meaning and method of constructing what we have called a correctness certificate for an algorithm. The meaning of this concept becomes clear if we consider the $\tt verify$ function as a procedure for checking, within polynomial time, the solution to a nondeterministically polynomial problem of whether $\mathfrak M_p$ belongs to $S$, where $c$ acts as a hint from an oracle. This can be most simply illustrated using the previously used example of an algorithm for coloring planar graphs by enumerating all colorings in increasing order of colors up to four:

- $\mathfrak{M}$ — some abstract machine with Turing-complete operational semantics;
- $p$ — the program described in the article "Program verification: background and notation" (section _Example: Graph Colorers_ [[1]]);
- $l_S$ — specification record declaring the success of coloring for any planar graph;
- $c$ — enumeration of 633 configurations that constitute the proof of the Four Color Theorem.

With these components available, the correctness of an algorithm that enumerates all colorings up to four colors can be confirmed mechanically, through relatively straightforward automatic reasoning. Thus, a correctness certificate for an algorithm can be seen as a **symbolic record either of the procedure for mathematically proving the fact of its belonging to the corresponding equivalence class, or of a counterexample disproving this belonging**. Modern engineering practice in most cases implies the automation of constructing a correctness certificate, which can be generalized in terms of a heuristic $\mathtt{evince} : P \times \mathcal L_* \rightharpoonup \mathcal C$ such that $\mathcal L_* \subseteq \mathcal L$, and for every $p \in P, l_S \in \mathcal L_*, c \in \mathcal C$ it holds that $\mathtt{evince}(p, l_S) = c \Rightarrow \mathtt{verify}(p, l_S, c) \neq \mathtt{Invalid}$.

As an example, consider how the mechanism of model checking is described by Yury G. Karpov (the translation below is ours) [[2]], page 83:

> Model checking is a methodology that uses models, techniques, and algorithms to verify the truth of temporal logic formulas (CTL\*, CTL, LTL) with respect to a system model with a finite number of states (Kripke structure), describing the behavior of dynamic systems. Kripke structures serve as a model for representing the behavior of reactive systems (discrete control systems, parallel and distributed algorithms, protocols), and temporal logics are an efficient formalism for describing their properties.
>
> Using variables and parameters of the system being verified, the atomic predicates of interest to the developer are expressed within the Kripke structure—logical expressions that can take the values "true" or "false" in each state of the system. In this context, a system state "false" can be considered as a counterexample to the formula being input.

It should be understood that an arbitrarily complex heuristic $\tt evince$, one should not expect beign able to solve this problem in the general sense, for any arbitrary combination of program and specification. [[3]] For the same reasons that the halting problem is undecidable, for any nontrivial specification, there will always be a program whose certificate of conformity to this specification cannot be constructed by any algorithm. Moreover, even when limiting ourselves to computational models that do not possess algorithmic completeness, and to any nontrivial fragments of first-order logic as the specification language, in terms of computational complexity, we almost always remain in the realm of $\tt PSPACE$-hard problems, which makes the automatic verification of even somewhat nontrivial programs quite problematic.

## Correctness Certificate and Its Role in the Verification Process

The perception of a correctness certificate as a description of a mathematical proof procedure is, unfortunately, more of a theoretical generalization than a practical application, since the engineering culture at present is dominated by approaches that imply automation not only of its verification ($\tt verify$), but of its generation ($\tt evince$) as well. From a utilitarian perspective, it might initially seem that for a provenly reliable correctness certificate verification procedure, the method of its construction should not matter much — after all, what do we need besides assurance of the code's compliance with the specification? Nevertheless, by examining the verification task of algorithms from its mathematical perspective, it becomes evident that existing methods of automatic correctness certificate generation possess a number of significant and, seemingly, insurmountable flaws.

Firstly, due to the fundamental complexity gap between the tasks of finding a proof and confirming it, the sublanguage acceptable for describing the objective of the heuristic $\tt evince$ is always relatively small compared to the logical language of the domain of the function $\tt verify$. Moreover, even those specifications $S$ that can be recorded in the form $l_S \in \mathcal L_*$ often have to be formulated in an extremely unnatural way, adhering to rather esoteric restrictions imposed by specific enumerative strategies used in $\tt evince$.

Secondly, the behavior of $\tt evince$ is inevitably highly sensitive to even minor changes in the algorithm being processed. Since the program's semantics are checked for compliance with the specification in their entirety, no matter how localized the differences between $p$ and $p'$ might be, the computations of the enumerative heuristics $\mathtt{evince}(p, l_S)$ and $\mathtt{evince}(p', l_S)$ will almost always proceed along significantly different paths, leading, in the case of success, to structurally incomparable $c$ and $c'$.

Finally, unlike traditional proofs with which mathematicians are accustomed to working, it is practically impossible to extract any additional information about the relationship between the program and the specification from correctness certificates found by enumerative heuristics, beyond the unequivocal confirmation of correctness. In mathematics, a proof can often contain much more useful information about the connections between the objects it involves than the formulation of the proposition being proved.

The mentioned flaws do not make SMT solvers or model checking methods any less useful in practical terms—the counterexamples they produce accurately localize errors in algorithms, and valid certificates allow for a definitive conclusion in the debugging process of a specific version of the code. However, it may be worth considering whether the automation of constructing a correctness certificate is always a sufficient compensation for the absence of any mathematical meaning in it. Is the industry missing something important in its pursuit of a one-button solution?

## Deep Specification Methodology

The methodology proposed in the article "Verification-Driven development" [[4]] can also be referred to as deep specification methodology. Unlike conventional techniques, it assumes mechanization only of the $\tt verify$ procedure, leaving the construction of the correctness certificate to humans. Although this approach, evidently, places somewhat higher demands on the operator's qualifications compared with the use of automatic heuristics, it is expected that the reward for this will be a number of significant advantages.

Firstly, in the deductive search for proof, there is no need to limit the logical language $\mathcal{L}$ in any way — specifications can be formulated in the most natural manner, without sacrificing clarity and conciseness to the esoteric requirements of automatic solvers. Any statement that can be formulated in Coq or Lean with their impressive expressive power of inductive types can be used in the specification description.

Secondly, a certificate constructed using the methodology of gradual specification refinement is composed of proofs of a multitude of independent statements and is structurally parallel to the verified algorithm — there exists a local correspondence between elements of the certificate and segments of the program code. This allows for the expectation that minor changes in the program or specification will, in most cases, require only minor adjustments to the correctness certificate, thus encouraging incremental development.

Finally, if the hypothesis [[5]] we formulated at the end of the previous article holds true, the parallel construction of the correctness certificate and the program it verifies follows the natural logic of breaking down the task into subtasks. As a result, the correctness certificate becomes not just a confirmation of the program's compliance with the specification of observed behavior, but a formal description of the structure of the algorithm being implemented — effectively, its precise architectural blueprint, which can be used as the foundation for project documentation.

By sacrificing the one-button simplicity of $\tt evince$, we may lose in convenience as traditionally understood, but we hope to gain much more. At Inferara, we suggest that development driven by deductive verification can become a fully independent methodology of software engineering, allowing for seamless scaling of reliability guarantees in large projects. This scaling pertains to both the spatial axis (facilitating the coverage with formal specifications not only of small sections of code considered most critical but also of the entire surrounding infrastructure) and the temporal axis (helping to maintain reliability guarantees when further changes are made to an already verified algorithm).

## Conclusion

Deductive program verification has remained a mathematical artifact for more than half a century, its rare application in practical engineering being regarded as a high art, accessible to only a very few tenacious researchers at the technological frontier. Meanwhile, younger technologies such as SMT solvers and model checking methods have turned into tools of the trade, making the concept of formal verification a routine part of the industrial landscape. Perhaps now, as the blockchain and cryptocurrency industry has definitively become part of the global financial system [[6]], creating direct financial obligations, and tools for deductive theorem proving have matured, the time has come to unveil the true potential of ideas previously considered too extravagant.

## References

- [Program Verification: Background and Notation, Example graph colorers][1]
- [Yuri Glebovich Karpov. MODEL CHECKING. "Verification of Parallel and Distributed Software Systems". BHV-Petersburg, 2010. 560 pages.][2] [ISBN 5977504047, 9785977504041](https://www.abebooks.co.uk/9785977504041/MODEL-CHECKING-Verification-parallel-distributed-5977504047/plp)
- [Why Writing Correct Software Is Hard][3]
- [Verification-Driven Development][4]
- [Verification-Driven Development, Escape from tarpit][5]
- [Statement on the Approval of Spot Bitcoin][6]

[1]: https://www.inferara.com/papers/program-verification-background-and-notation/#example-graph-colorers
[2]: https://books.google.co.uz/books?id=xpui56eRsHgC&pg=PA83&source=gbs_toc_r&cad=2#v=onepage&q&f=false
[3]: https://pron.github.io/posts/correctness-and-complexity

[4]: {{< ref "/papers/verification-driven-development" >}}
[5]: {{< ref "/papers/verification-driven-development" >}}/#escape-from-tarpit
[6]: https://www.sec.gov/news/statement/gensler-statement-spot-bitcoin-011023

{{<post-socials telegram_post_id="13" x_post_id="1776091018150162468">}}
