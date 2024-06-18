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
- $p\lor q$ is the _disjunction_ of $p$ and $q$: "It is winter _or_ it is cold outside." This is true if $p$ is true, _or_ $q$ is true, or both.This makes disjunction is similar to the English "or", however sometimes in English when we say "or", we mean one or the other, but not both. This is not the case here.
- $p\rightarrow q$ means that $p$ _implies_ $q$, or in other words that $q$ is a result of $p$: "If it is winter, then it is cold outside." An important thing to note here is that we are not concerned about causation, as we usually are in English. The sentence "If the atomic number of carbon is 15, then I had yogurt for breakfast" doesn't make sense to us, since there is no obvious causality between the two statements. However, in propositional logic, that would be a perfectly fine statement.

Now, consider the formula $p\land q\rightarrow r$. There is some abiguity here, as we can potentially read this in two ways:
- $(p\land q)\rightarrow r$: $r$ is true if $p$ is true and $q$ is true.
- $p\land(q\rightarrow r)$: $p$ is true, and $q$ implies $r$.

In order to avoid situations like this, we establish some rules:
- $\lnot$ binds more tightly than $\land$ and $\lor$, and those two bind more tightly than $\rightarrow$. 
Therefore, the correct interpretation of the above formula is $(p\land q)\rightarrow r$.

Finally, we need some rules for manipulating these formulae so we can arrive at conclusions from them. They will look like this:
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
There is another rule we can use to eliminate an implication called _modus tollens_, abbreviated as M.T.:
$$
\frac{\phi\rightarrow\psi,\lnot\psi}{\lnot\phi}M.T.
$$
This rule states that if $\phi$ implies $\psi$ (In other words, if $\phi$ is true, then $\psi$ must be true), and we know that $\psi$ is _false_, then $\phi$ cannot be true since this would lead to a contradiction.

Disjunction introduction is a tiny bit harder. If we know that $\phi$ is true, then we know $\phi\lor\psi$ (or $\psi\lor\phi$) must be true, where $\psi$ can be any other formula. Even if $\psi$ is false, the disjunction still holds, because $\phi$ is true, and we only need at least one of the formulae to be true.
$$
\frac{\phi}{\phi\lor\psi}\lor i_1
\frac{\phi}{\psi\lor\phi}\lor i_2
$$
With these simple rules, we can construct a proof. We usually start a proof with some formulae or propositions that we know to be true. These are called our premises. By applying the above rules to our premises, we can obtain new formulae. We can apply rules to those new formulae, and repeat this process until we arrive at some conclusion. Once we have a valid proof for some conclusion ($\psi$) from some premises $(\phi_1,\phi_2\dots\phi_n)$, we can write the following : $\phi_1,\phi_2\dots\phi_n\vdash\psi$. This expression is called a sequent, and it reads like so: "If we know the formulae $\phi_1, \phi_2, \dots$, and $\phi_n$ are true, then we can infer that $\psi$ is true as well." Typically, we structure a proof like so:
| Line number | What we have | Where we got it from |
|-------------|--------------|----------------------|
| 1           | ....         | ....                 |

As an example, we will prove the sequent $p\land q, q\rightarrow r\vdash p\land r$. Here's how it looks:

1. $p\land q$ (Premise)
2. $q \rightarrow r$ (Premise)
3. $q$ $(\land e_2\space 1)$
4. $r$ $(\rightarrow e\space 2,3)$
5. $p$ $(\land e_1\space 1)$
6. $p\land r$ $(\land_i\space 4,5)$

__TODO: FORMAT THIS SO IT DOESN'T LOOK LIKE GARBAGE__

We got to the conclusion by applying these rules to our premises - therefore the sequent is valid. At each step, we also give justifications. For example, in line 3, we say we have the formula $q$, and we got it by applying the rule $\land e_2$ to line 1.

These aren't all the proof rules - the remaining ones work with _contradictions_ and _assumptions_. A contradiction arises when we can show something is both true and not true at the same time, I.E any statement of the form $\phi\land\lnot\phi$ or $\lnot\phi\land\phi$. We denote the contradiction with $\bot$, and this gives us the following rule:
$$
\frac{\phi,\lnot\phi}{\bot}\lnot e
$$
Perhaps one of the stranger rules is $\bot e$, which states that a contradiction is equivalent to any formula:
$$
\frac{\bot}{\phi}\bot e
$$
__TODO: ADD AN EXPLANATION HERE__

What about assumptions? While we are doing a proof, we may at any point assume that something holds. However, in order for the proof to be valid, we must make sure the conclusion _does not depend on the assumption_. For example, if we assume that some formula $\phi$ is true, and then from working with that assumption we are able to conclude that $\psi$ is true, we can't just say that $\psi$ is true in general, because we had to make an assumption for the proof to work! However, we _are_ able to say that $\phi$ _implies_ $\psi$, because we know that if $\phi$ were to be true, we could prove $\psi$. This leads to the following rule:
$$
\frac{[\phi\dots\psi]}{\phi\rightarrow\psi}\rightarrow i
$$
To me, it reads like this: "If we assume $\phi$ is true, and can show that $\psi$ is true using that assumption, then we may conclude that $\phi$ implies $\psi$."

Another similar rule is negation introduction. It states that if we assume some $\phi$ is true, and that leads to a contradiction, then $\phi$ must be false:
$$
\frac{[\phi\dots\bot]}{\lnot\phi}\lnot i
$$
Finally, there is disjunction elimination. The formula $\phi\lor\psi$ tells us that $\phi$ is true, or $\psi$ is true, or both. Now, imagine we had a proof for $\phi\vdash\gamma$ and $\psi\vdash\gamma$. This would let us conclude that $\gamma$ is true. Why? Well, we don't know which one of $\phi$ or $\psi$ are true, but it doesn't matter, because regardless of which case it turns out to be, we always can show $\gamma$. This leads to the most intimidating rule of the bunch:
$$
\frac{\phi\lor\psi,[\phi\dots\gamma],[\psi\dots\gamma]}{\gamma}\lor e
$$
This rule is describes what I said above: if we know that
- Either $\phi$ is true, or $\psi$ is true (or both),
- And we can conclude $\gamma$ if we assume $\phi$ to be true,
- And we can also conclude $\gamma$ if we assume $\psi$ to be true,

Then $\gamma$ must be true.
Lastly, we have a rule which states that something must be either true or false:
$$
\frac{}{\phi\lor\lnot\phi}LEM
$$
This rule is called "Law of the excluded middle", and abbreviated as LEM.

# Syntax vs semantics
When we were writing proofs in the previous section using the rules of natural deduction, we were thinking in terms of _structure_. All we had were valid expressions and rules for transforming valid expressions into other valid expressions. Hypothetically, you could show someone just the symbols (atoms, connectives such as $\land,\lor$ etc.) and natural deduction rules, and without even knowing what these symbols represent, they could still construct a proof. When we write $\phi\vdash\psi$, we mean "If $\phi$ is true, then we can infer $\psi$ is true, because we are able to turn $\phi$ into $\psi$ by applying the rules of natural deduction." However, instead of thinking about structure, we could also think about _meaning_: instead of symbols with rules describing how we can manipulate them, we can view connectives as manipulating truth values. For instance, the truth value of the formula $\phi\land\psi$ depends on the truth values of $\phi$ and $\psi$, and the meaning of $\land$. We say that $\phi\land\psi$ is true if and only if both $\phi$ is true, and $\psi$ is true. We can also write out each _valutation_ of this formula (A valuation is simply where we assign each atom to be true or false) and get a truth table:
| $\\phi$ | $\\psi$ | $\\phi\\land\\psi$ |
| ------- | ------- | ------------------ |
| T       | T       | T                  |
| T       | F       | F                  |
| F       | T       | F                  |
| F       | F       | F                  |

And here are the truth tables for the other connectives:
Disjunction is true if at least one of the disjuncts are true.

| $\\phi$ | $\\psi$ | $\\phi\\lor\\psi$ |
| ------- | ------- | ------------------ |
| T       | T       | T                  |
| T       | F       | T                  |
| F       | T       | T                  |
| F       | F       | F                  |

Implication is only false if the assumption is true and the conclusion is false. You can think of this as trying to preserve truth. In the cases where the assumption is false, the implication is true, because there is no truth to be preserved in the first place.

| $\\phi$ | $\\psi$ | $\\phi\\rightarrow\\psi$ |
| ------- | ------- | ------------------ |
| T       | T       | T                  |
| T       | F       | F                  |
| F       | T       | T                  |
| F       | F       | T                  |

Negation just flips true to false, and vice-versa.

| $\\phi$ | $\lnot\phi$|
| ------- | ------------------ |
| T       | F                  |
| F       | T                  |

Now, consider the following sequent: $\phi\land\psi\vdash\phi\rightarrow\psi$. We could prove this using natural deduction, but watch what happens if we write out the truth tables for both formulae:
| $\\phi$ | $\\psi$ | $\\phi\\land\\psi$ | $\\phi\\rightarrow\\psi$ |
| ------- | ------- | ------------------ | ------------------------ |
| **T**   | **T**   | **T**              | **T**                    |
| T       | F       | F                  | F                        |
| F       | T       | F                  | T                        |
| F       | F       | F                  | T                        |

Observe that whenever $\phi\land\psi$ is true, so too is $\phi\rightarrow\psi$. This lets us write something new:
$$
\phi\land\psi\models\phi\rightarrow\psi
$$
This reads as follows: "If we know that $\phi\land\psi$ is true, then we can infer that $\phi\rightarrow\psi$ is true, because we see in the truth tables that whenever the former evaluates to true, so too does the latter." This is different to $\phi\land\psi\vdash\phi\rightarrow\psi$, which instead reads "If we know that $\phi\land\psi$ is true, then we can infer $\phi\rightarrow\psi$ is true, because we were able to turn the former into the latter using our natural deduction rules." This brings us to _soundness_ and _completeness_.

Soundness means that if we can find a proof that $\phi\vdash\psi$ using our natural deduction rules, then it always the case that $\phi\models\psi$.

Completeness goes the other way around: If we find that a formula $\psi$ is always true whenever another formula $\phi$ is true, then there must be a proof using natural deduction rules that $\phi\vdash\psi$.

This means that whenever we want to show that one formula entails another, we are free to switch between working with syntactic proofs ($\vdash$) and semantic entailment ($\models$).
