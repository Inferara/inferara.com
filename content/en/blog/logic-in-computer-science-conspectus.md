+++
title = 'Logic in computer science conspectus'
date = 2024-05-11T11:06:15+13:00
draft = true
math = "katex"
summary = "This blog outlines the basics of propositional logic, as explained by the book \"Logic in compuer science\"."
tags = ["Propositional logic", "Foundations", "Mathematics"]
+++

## Table of contents

- [Introduction](#introduction)
- [Declarative sentences](#declarative-sentences)
- [Propositional logic](#propositional-logic)
  - [Basic rules]()
  - [Examples]()
  - [Contradictions]()
  - [Derived rules]()
  - [More examples]()
  - [Intuitionistic logic]()
- [Well-formed formulae]()
- [Proof by induction]()
  - [Course-of-values induction]()

# Introduction
This blog post is my conspectus for the book _Logic in Computer Science_ by Micheal Huth and Mark Ryan. I will cover the first five parts of chapter one. 

# Declarative sentences
Our big goal with formal verification is simple: We have a computer program, and a description of how it should behave. We would like to make sure that our program meets this description, or specification. Moreover, we want to be _really sure_ that it behaves correctly - so we would like to use mathematical methods. So how do we translate our plain English ideas into mathematics which we can make rigorous arguments about?

Let's start by taking a close look at how we could make arguments in everyday English. We start with some declarative sentences which _say something about the world_. They can be either true or false:
 - It is sunny.
 - I did not buy ice cream.
 - If it is sunny, and I am outside, then I will buy ice cream.

From these sentences, we can make conclusions:
> I did not buy ice cream, therefore the statement "It is sunny and I am outside" must be false. Therefore, it was either not sunny, or I was not outside. Since it _was_ sunny, it means I was not outside.

Here is another example:
- It is rainy.
- I did not get wet.
- If it is rainy and I do not have an umbrella, I will get wet.
> I did not get wet, therefore the statement "it is rainy and I do not have an umbrella" is false. Therefore, it was either not rainy, or I had an umbrella. Since it was rainy, it means I had an umbrella.

Notice how in both cases, the sentences said different things about the world, but they had the same structure, and we were able to reason about them in the same way. This is interesting, because it means that to make arguments, we don't actually have to care about what these sentences are saying - we just need to know their logical structure. It means that we can describe __anything we like__ using these declarative sentences, reason about them logically, and come to some conclusions. This sounds like just the thing we need for verifying programs!

# Propositional logic
Unfortunately, there are some issues that arise when we use plain English to describe things. Firstly, English can be quite ambiguous. Two people can read the exact same sentence and have different interpretations of it. For example, the sentence
> The man saw the woman with a telescope.

has two interpretations:
  - The man, looking _through_ a telescope, saw the woman.
  - The man saw the woman, who was holding a telescope.

Usually in everyday conversations this doesn't matter, because we have context and can infer the right meaning. However, for our formal verification needs, we cannot have ambiguities like this. On top of this, natural language is quite excessive for our needs. Recall how when making logical arguments, we only needed to care about the structure of our sentences, and not what they were saying. Therefore, it would be great to express our declarative sentences in a smaller, stricter language with a much simpler grammar which would let us only focus on logical manipulation of statements. Perhaps we could even get computers to automatically do some of the manipulations for us.

Propositional logic is this simpler language. Here's how it works:

Since we don't have to know what our sentences are saying, we can take very simple statements that cannot be broken down any further and simply represent them with a single letter. These are called propositional atoms. For example, we could denote the sentence "It is raining" as just $p$.

We can define some logical operators with strict rules that combine these propositional atoms into more complicated statements, so that we can describe some more interesting things. For example, let $p$ mean "It is winter," and let $q$ mean "It is cold outside." Then:

- $\lnot p$ represents the _negation_ of $p$: "It is _not_ winter."
- $p\land q$ represents the _conjunction_ of the two statements, I.E. "It is winter _and_ it is cold outside." This is true if and only if $p$ is true and $q$ is true.
- $p\lor q$ is the _disjunction_ of $p$ and $q$: "It is winter _or_ it is cold outside." This is true if $p$ is true, _or_ $q$ is true, or both.This makes disjunction is similar to the English "or", however sometimes in English when we say "or", we mean one or the other, but not both. This is not the case here.
- $p\rightarrow q$ means that $p$ _implies_ $q$, or in other words that $q$ is a result of $p$: "If it is winter, then it is cold outside." An important thing to note here is that we are not concerned about causation, as we usually are in English. The sentence "If the atomic number of carbon is 15, then I had yogurt for breakfast" doesn't make sense to us, since there is no obvious causality between the two statements. However, in propositional logic, that would be a perfectly fine statement.

Now, consider the formula $p\land q\rightarrow r$. There is some abiguity here, as we can potentially read this in two ways:
- $(p\land q)\rightarrow r$: $r$ is true if $p$ is true and $q$ is true.
- $p\land(q\rightarrow r)$: $p$ is true, and $q$ implies $r$.

In order to avoid situations like this, we establish some rules:
- $\lnot$ binds more tightly than $\land$ and $\lor$, and those two bind more tightly than $\rightarrow$. 
Therefore, the correct interpretation of the above formula is $(p\land q)\rightarrow r$.

Finally, we need some rules for manipulating these formulae so we can arrive at conclusion from them. They will look like this:
$$
\frac{\phi,\psi}{\gamma} n
$$
They read as follows: If we know that everything above the line is true $(\phi, \psi)$, then we can conclude that $\gamma$ is also true. $n$ is the name of the rule.

Firstly, let's consider conjunction ($\land$). We know that if $\phi$ is true, and $\psi$ is true, then $\phi$ _and_ $\psi$ must be true. Hence we get the rule for conjunction introduction:
$$
\frac{\phi,\psi}{\phi\land\psi}\land_i
$$
Likewise, if we know that both $\phi$ and $\psi$ are true, then we can infer that $\phi$ is true. We can also infer that $\psi$ is true. This gives us two rules for conjunction elimination:
$$
\frac{\phi\land\psi}{\phi}\land e_1
\frac{\phi\land\psi}{\psi}\land e_2
$$
The rules for double negation ($\lnot\lnot$) are also quite simple. Consider the sentence "It isn't not winter." This is just a weird way of saying "It is winter," and vice-versa. Therefore we get two more rules:
$$
\frac{\phi}{\lnot\lnot \phi}\lnot\lnot i
\frac{\lnot\lnot\phi}{\phi}\lnot\lnot e
$$
Implication elimination is quite straightforward: If we know that $\phi$ implies $\psi$ (In other words, if $\phi$ is true, then $\psi$ must be true), and we know that $\phi$ is true, then $\psi$ must be true:
$$
\frac{\phi\rightarrow\psi,\phi}{\psi}\rightarrow e
$$
Disjunction introduction is a tiny bit harder. If we know that $\phi$ is true, then we know $\phi\lor\psi$ (or $\psi\lor\phi$) must be true, where $\psi$ can be any other formula. Even if $\psi$ is false, the disjunction still holds, because $\phi$ is true, and we only need at least one of the formulae to be true.
$$
\frac{\phi}{\phi\lor\psi}\lor i_1
\frac{\phi}{\psi\lor\phi}\lor i_2
$$
