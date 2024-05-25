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
The English language is quite complicated. It would be nice to have a smaller "language" that would let us only focus on logical structure, and with rules that are simple enough for a computer to verify. Firstly, remember that we didn't need to know what our sentences were saying about the world. For this reason, we will only use a single letter to represent a declarative statement. Secondly, we used words such as _and_, _or_, _not_, _if_ and _then_ to connect our simple statements and make more complicated ones. We'll denote them using symbols, and give them more precise definitions:

- $\lnot$ will represent negation, like the word "not" in the English language. 
- $\land$ will represent conjunction, like the word "and." $p\land q$ is true if and only if both $p$ is true, and $q$ is true. 
- $\lor$ is disjunction, similar to the English "or." $p\lor q$ is true if either $p$ is true, or $q$ is true, or both $p$ and $q$ are true. This differs slightly from English, where, depending on the context, "or" can mean one or the other, but not both. 
- Finally, $\rightarrow$ will denote implication, similar to "if \_ then \_" in English. Usually when we use that wording, there is some causation between the antecedent and result. For example, the phrase "If you don't wear your jacket, you will catch a cold" makes sense, because not wearing the jacket will cause you to catch a cold. The statement "If the atomic number of carbon is 40, then I like chocolate ice cream" sounds absurd, because there is no sensible connection between the antecedent and result. However, in propositional logic, we do not care about causation, only consequences.

Let $a$ mean "it is sunny", $b$ mean "I was outside", and $c$ mean "I purchased ice cream." Here is our first example in this new logical notation:
- $a$
- $\lnot c$
- $a\land b \rightarrow c$

