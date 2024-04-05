+++
title = 'Why use formal specification'
date = 2024-03-04T20:02:48+08:00
draft = false
math = "katex"
tags = ["Program Verification", "Verification Driven Development"]
summary = "This blog explores the benefits of formal specification in the context of program verification."
+++

Imagine a programmer tasked with a challenge: to bring a Dutch auction to life through code. With an arsenal of skill and determination, they approach this journey, piecing together logic and functionality, guided by what feels right and what their experience dictates.

Once they reach a point where the digital auction seems ready to face the world, they step back, inviting testers into this creation to scrutinize his work, to ensure it behaves as intended. In this dance between creation and evaluation, both programmers and testers lean on a set of guidelines that are more akin to unwritten rules than formal commandments. This ambiguity can also open a door to endless interpretations, a breeding ground for misunderstandings.

Testers navigate through scenarios they believe will prove the auction's readiness. Each discovery of a flaw sends the project into a loop of corrections, where solving one problem might unwittingly birth another, trapping them in a potentially endless cycle of tweaking.

Contrast this with a world where every stroke of the programmer's keyboard is directed by a formal specification, a map that outlines the operational semantics of the program with precision. In this realm, the programmer's role transforms into one of diligent adherence, ensuring each line of code aligns with the predefined semantics, sculpting the auction into its ideal form.

The tester's role, too, shifts focus — now, they must verify that the real-world behaviour of the code, shaped by the interplay between compiler, operating system, and beyond, truly matches those expectations laid out in the specification. This narrative isn't just about building and testing software; it's about navigating the accurate balance between creativity and conformity, between the freedom of interpretation and the clarity of specification.

It's a journey through the complexities of bringing a concept to life, where each decision can lead to success or endless revision, and the path chosen can make all the difference.

You can read about the software development based on the specification/verification, or as we call it **Verification Driven Development** presented as a mathematical formalism in our post [[1]].

## References

- [Verification-Driven Development][1]

[1]: {{< ref "/papers/verification-driven-development" >}}

---

Discuss [this blog](https://t.me/inferara/5) in our telegram channel [@inferara](https://t.me/inferara/).
