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
- $p\lor q$ is the _disjunction_ of $p$ and $q$: "It is winter _or_ it is cold outside." This is true if $p$ is true, _or_ $q$ is true, or both.This makes disjunction is similar to the English "or". The difference is that sometimes when we say "or" in English, we mean one option or the other, but not both. In this case, both $p$ and $q$ can be true, and the disjunction will also be true.
- $p\rightarrow q$ means that $p$ _implies_ $q$, or in other words that $q$ is a result of $p$: "If it is winter, then it is cold outside." An important thing to note here is that we are not concerned about causation, as we usually are in English. The sentence "If the atomic number of carbon is 15, then I had yogurt for breakfast" doesn't make sense to us, since there is no obvious causality between the two statements. However, in propositional logic, that would be a perfectly fine statement.

One small note about implication: _It only goes one way!_ For example, consider the following sentence:
> If I make a loaf of bread, then I am baking.

The inverse is not true - you cannot assume that if I am baking, then I must be making a loaf of bread; perhaps I am making a cake instead. It turns out this mistake is common enough to have a [fancy name and its own Wikipedia page.](https://en.wikipedia.org/wiki/Affirming_the_consequent)

Now, consider the formula $p\land q\rightarrow r$. There is some abiguity here, as we can potentially read this in two ways:
- $(p\land q)\rightarrow r$: $r$ is true if $p$ is true and $q$ is true.
- $p\land(q\rightarrow r)$: $p$ is true, and $q$ implies $r$.

In order to avoid situations like this, we establish some rules:
- $\lnot$ binds more tightly than $\land$ and $\lor$
- $\land$ and $\lor$ bind more tightly than $\rightarrow$.

Therefore, the correct interpretation of the above formula is $(p\land q)\rightarrow r$.

Finally, we have a small and concise language we can use to encode logical statements. But how do we go about making rigorous arguments? Usually, we would like to start with some premises (things we know to be true), and show that, given those premises, some other conclusion must also be true. At this point, we are free to choose if we want to argue about the _structure_ of the formula, or about the _meaning_ of the formula.

# Syntax
One way we can argue that a list of premises entail some conclusion is by dealing with the structure of our formulae. We can start with our premises and apply some rules to them, which will give us new formulae. We may then continue applying these rules to the new formulae until we reach the conclusion. I will briefly list the rules below, here is how to interpret them:
$$
\frac{a,b,c}{d} X
$$
This is a rule named $X$. It says that if we have everything _above_ the line (namely $a$, $b$, and $c$), then we can conclude whatever is _below_ the line ($d$).

__Conjunction:__
$$
\frac{\phi,\psi}{\phi\land\psi}\land i
\frac{\phi\land\psi}{\phi}\land e_1
\frac{\phi\land\psi}{\psi}\land e_2
$$
The conjunction introduction rule ($\land i$) states that if we know $\phi$ and $\psi$ are both true, then $\phi$ _and_ $\psi$ is also true. Likewise, the conjunction elimination rules state that if we know $\phi$ and $\psi$ is true, then $\phi$ must be true, and so too must be $\psi$.

__Double negation:__

Consider the sentence "It isn't not winter." This is just a strange way of saying "It is winter", and vice-versa. This leads to the rules for double disjunction:
$$
\frac{\lnot\lnot\phi}{\phi}\lnot\lnot e
\frac{\phi}{\lnot\lnot\phi}\lnot\lnot i
$$

__Disjunction:__
$$
\frac{\phi}{\phi\lor\psi}\lor i_1
\frac{\phi}{\psi\lor\phi}\lor i_2
$$
If we know that $\phi$ is true, then we know that $\phi$ or $\psi$ must be true. This works because disjunction only requires one of the sides to be true in order for it to hold - so even if $\psi$ was false, the disjunction as a whole is still true.

__Assumption:__

The following rules work with the idea of an assumption. When we are writing our proof, we are free at any point to assume that something is true. However, the catch is that our final result _cannot depend on the assumption_, meaning we have to "discharge" it in some way before we finish the proof. For example, if we assume that some formula $a$ is true, and then from working with that assumption we are able to conclude that $b$ is true, we can't just say that $b$ is true in general, because we had to make an assumption for the proof to work! However, we are able to say that $a$ implies $b$, because we know that if $a$ were to be true, we could prove $b$. Furthermore, this implication is true regardless if $a$ happens to be true or not. This gives us a rule for eliminating disjunctions and creating implications.

__Disjunction rules (cont.):__
$$
\frac{\phi\lor\psi,[\phi\dots\gamma],[\psi\dots\gamma]}{\gamma}\lor e
$$
Suppose we were able to show that if $\phi$ is true, then $\gamma$ must be true as well, and we were also able to show that if $\psi$ is true, then $\gamma$ must be true as well. If we know that $\phi\lor\psi$ is true, that means we can then conclude that $\gamma$ must be true. Even if we don't know which one of the two is true, it doesn't matter, because in both cases we are able to show $\gamma$. This is essentially what the rule above is saying - the $[\phi\dots\gamma]$ means "A proof of $\gamma$ assuming that $\phi$ is true."

__Implication:__

$$
\frac{\phi,\phi\rightarrow\psi}{\psi}\rightarrow e
\frac{[\phi\dots\psi]}{\phi\rightarrow\psi}\rightarrow i
\frac{\phi\rightarrow\psi,\lnot\psi}{\lnot\phi} M.T.
$$
The first rule is quite simple: if we know that $\phi$ is true, and we also know that if $\phi$ is true, then $\psi$ must be true as well, then we can conclude $\psi$. The second rule states that if we assume $\phi$ is true, and from that assumption we are able to show that $\psi$ is true, then $\phi$ must imply $\psi$. Finally, the third rule states that if we know $\phi$ implies $\psi$, and $\psi$ isn't true, then $\phi$ can't be true either. If $\phi$ was true, there would be a contradiction. This rule's name, M.T., is an abbreviation for _modus tollens_, which is Latin for something.

__Contradiction:__

Finally, we have rules concerning contradiction. A contradiction is any statement of the form $\phi\land\lnot\phi$ or $\lnot\phi\land\phi$. It is denoted by the symbol $\bot$, and is always false. A strange property of contradiction is that we can derive any formula from it. This leads to the following rules:
$$
\frac{\phi,\lnot\phi}{\bot} \lnot e
\frac{\bot}{\psi} \bot e
$$
Finally, there is also the rule of negation introduction. It states that if we assume some formula $\phi$ is true, and then it leads us to a contradiction, then it must mean $\phi$ is not true.
$$
\frac{[\phi\dots\bot]}{\lnot\phi}\lnot i
$$
With these rules, we can now go about constructing a proof. Proofs can be structured using three columns: the first column is the line number. The second column is the formula that we have, and the third column justifies where we got it from. Let's prove that if $a\land b$ and $b\rightarrow c$ is true, then $a\land c$ is true.

| Line No. | What we have | Where we got it from |
|----------|--------------|----------------------|
| 1        | $a\land b$   | Premise (We start with it) |
| 2        | $b\rightarrow c$| Premise |
| 3        | $b$          | $\land e_2$ 1 (We applied the rule $\land e_2$ to line 1.)|
| 4        | $c$          | $\rightarrow e$ 2,3|
| 5        | $a$          | $\land e_1$ 1 |
| 6        | $a\land c$   | $\land i$ 5,4 |

We were able to conclude $a\land c$ by starting with $a\land b$ and $b\rightarrow c$, and applying natural deduction rules to it. Therefore, we can write
$$
a\land b, b\rightarrow c\vdash a\land c
$$

# Semantics
Another way we can show that one formula entails another is by focusing on the _meaning_ of the formulae. Consider the formula $a\lor b$ - it is either true or false. Its truth value depends on:
- The truth value of $a$ (whether or not it is true)
- The truth value of $b$
- The meaning of $\lor$.

We can show the meaning of a connective by writing out a truth table. In each row of this table, we assign a truth value to $a$ and $b$ (This is called a valuation), and show the resulting truth value of $a\lor b$. We do this for every possible valuation. Here are the truth tables for all the logical connectives.

| $a$ | $b$ | $a\lor b$    |
|---|---|------|
| T | T | T |
| T | F | T |
| F | T | T |
| F | F | F |

| $a$ | $b$ | $a\land b$    |
|---|---|------|
| T | T | T |
| T | F | F |
| F | T | F |
| F | F | F |

| $a$ | $b$ | $a\rightarrow b$    |
|---|---|------|
| T | T | T |
| T | F | F |
| F | T | T |
| F | F | T |

| $a$ | $\lnot a$ |
|-----|-----------|
|  T  |     F     |
|  F  |     T     |

If we have a more complicated formula with more variables, we just expand the truth table. However, each additional variable will double the amount of lines our truth table has - so it can get out of hand quickly. Now, by looking at the meaning, we are able to check that one formula entails another by writing out the truth tables:

| $a$ | $b$ | $c$ | $a\land b$ | $b\rightarrow c$ | $a\land c$ |
|---|---|---|----------|----------------|----------|
| __T__ | __T__ | __T__ | __T__        | __T__              | __T__        |
| T | T | F | T        | F              | F        |
| T | F | T | F        | F              | F        |
| T | F | F | F        | T              | F        |
| F | T | T | F        | T              | T        |
| F | T | F | F        | F              | F        |
| F | F | T | F        | T              | F        |
| F | F | F | F        | T              | F        |

Here we can see that if $a\land b$ is true, and $b\rightarrow c$ is true, then $a\land c$ must be true - the same result we showed in the syntax section. The difference is that this time we reached this conclusion from looking at the truth table - notice how in each row where $a\land b$ is true and $b\rightarrow c$ is true, $a\land c$ is also true (I have highlighted that row in bold). This means we can write 
$$
a\land b, b\rightarrow c\models a\land c
$$
Notice how, just like implication, this relationship only goes one way. Yes, it is true that in each valuation where $a\land b$ and $b\rightarrow c$ are true, so too is $a\land c$, but there are some valuations where $a\land c$ is true and $a\land b$ and $b\rightarrow c$ is false (Look at row 5).

# Soundness and completeness
We have seen two ways of showing that some formulae entail another. The first way is syntactical - it deals with the _structure_ of the formula, and pays no attention to the meaning. When we write 
$$
\phi,\psi\vdash\gamma
$$
We mean "If $\phi$ and $\psi$ are true, $\gamma$ must be true, because we were able to manipulate the structures of $\phi$ and $\psi$ using the natural deduction rules to get $\gamma$." The second approach pays no attention to the structure of the formulae, but rather, their meaning. When we write
$$
\phi,\psi\models\gamma
$$
we mean "If $\phi$ and $\psi$ are true, $\gamma$ must be true, because we wrote out the truth tables and saw that in each case where $\phi$ and $\psi$ were true, so too was $\gamma$."

As it turns out, both of these methods are valid, and there is a relationship between them. _Soundness_ means that if we find a syntactical proof of $a\vdash b$, then write out the truth table of the formulae $a$ and $b$, we will see that $b$ is true whenever $a$ is true. _Completeness_ goes the other way: if we write out the truth tables of two formulae $a$ and $b$, and observe that $a\models b$, then there must be a syntactic proof that $a\vdash b$. This means that we are free to switch between working with syntax and working with semantics.
