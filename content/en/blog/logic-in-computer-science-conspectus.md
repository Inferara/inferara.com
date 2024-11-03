+++
title = 'Logic in computer science conspectus'
date = 2024-11-03T19:00:15+13:00
draft = true
math = "katex"
summary = "This blog outlines the basics of propositional logic, as explained by the book \"Logic in compuer science\"."
tags = ["Propositional logic", "Foundations", "Mathematics"]
+++

## Table of contents

- [Introduction](#introduction)
- [Declarative sentences](#declarative-sentences)
- [Propositional logic](#propositional-logic)
- [Syntax](#syntax)
- [Semantics](#semantics)
- [Normal forms](#normal-forms)

# Introduction
This blog post is a conspectus for the book _Logic in Computer Science_ by Micheal Huth and Mark Ryan. It will cover the first five parts of chapter one. This conspectus is written informaly for the sake of brevity. As such, a lot of theorems and proofs from the original text aren't mentioned.

# Declarative sentences
The main goal in program verification is simple: we have the code for a computer program, and we also have a description of how that program ought to behave. We would like to make sure that the program behaves in accordance with the specification. There are already lots of possible ways to do this:
- You could write a test suite to check that your program works in different cases and scenarios. 
- You could write a fuzzer that repeatedly runs the program with random inputs and makes sure that it never fails.
And so on.

But the problem with these methods is that there is almost always still some uncertainty. How can you be sure that the program works with just a few unit tests? Perhaps there is a case that you didn't check which causes a bug. Herein lies a distinguising property of formal methods: they do not leave any room for error, and they can be used to check that the program _always_ behaves as it should.

The first thing we need to carry out these methods, however, is a very specific program specification. The reason they are called 'formal' methods is because they use mathematical techniques to verify correctness. Therefore, we need a program specification which we can rigorously make and defend arguments about. We may instinctively reach for natural language to write the specification. After all, describing things in natural language is intuitive to us: it's how you talk to a friend, or hold a debate with a colleague; we are used to expressing and reasoning about things in this way. But, natural language is not appropriate for writing a program specification - doing so would be akin to trying to thread a screw with the bristles of a paintbrush. The issue is that natural language is too complicated and too ambiguous. Consider the sentence
> The man saw the woman with a telescope

This sentence has two possible interpretations:
1. The man, who was looking through a telescope, saw the woman.
3. The man saw the woman, who was holding a telescope.

When we are conversing in real life, there is often context that we can use to infer the correct meaning, or ask the other person for clarification. But, when making mathematical arguments, there can be no room for ambiguity at all, so we need something else: a simpler language that unambiguously encodes what we want to say, one with well defined rules which can be reasoned about. If we want computers to automatically do this correctness checking for us, it should be rigid enough so that we can write programs to verify and manipulate statements in this language. Despite natural language being the wrong tool for the job, it is familiar. So let's start off by thinking about it anyway, and see if we can derive something simpler.

We usually make arguments by working with sentences that declare something to be true; sentences that say something about the world. For example, consider these two English sentences:
> If it is raining and I don't have an umbrella, then I will get wet. It was raining and I did not get wet.

and
> If a matrix is square and its determinant is not zero, then it is invertible. The matrix is square, but not invertible.

What can you infer from these sentences, and how would you justify it? Even though both of these sentences say something completely different about the world (one of them is common sense, and the other one is about linear algebra), their _structure_ is the same, and so is the structure of the arguments. For example, from the first sentence we can make this argument:
> I did not get wet. Therefore, it can't be true that it was raining and I didn't have an umbrella. Since I know it was raining, it must mean that I had an umbrella.

And likewise, from the second sentence we can _repeat the argument almost identially_, we just have to swap out a few words!
> The matrix is not invertible. Therefore, it can't be true that it is square and its determinant is not zero. Since I know it is square, it must mean that the determinant is zero.

Moreover, if we ignore what the sentences are actually saying and just pay attention to their structure (and do the same for the arguments we just made), you will see that they are identical:
> If $x$ and not $y$, then $z$. Not $z$, and $x$. Therefore, $y$.

So now we know that we are interested not in what the sentences say, but rather their underlying logical structure, for that is what we can reason about. We can describe whatever we like using these declarative sentences, and then make well justified arguments using their structure.

## Summary of key ideas:
1. To verify the correctness of a program, we need a description of its behaviour that can be argued and reasoned about.
2. Natural language is not a good choice for writing these specifications, because it is complicated and ambiguous.
3. In natural language, we use declarative sentences to describe the world, and we make arguments with their structure.

# Propositional logic
In the last chapter we saw that to describe the world, we can use declarative sentences, and to reason about these descriptions, we work with the structure of these sentences. But, we are still in the domain of natural language, and that means there are still some undesirable quirks. For instance, consider these three sentences:
> I did not cook today, but there are leftovers in the fridge.

> There's leftovers in the fridge, and I didn't cook today.

> Since there are leftovers in the fridge, I didn't cook today.

They all convey the same information. The only difference between these three sentences is the way that this information is presented to the reader. In a conversational context these subtle differences are very important, but for our purposes we don't care. For us, all this variation does is make the language more difficult to work with. Imagine how hard it would be to write a program or a parser that extracts this information, even for simple English sentences! Therefore, our language should have much more primitive grammar, and focus only on the structure of the information. Remember from the last section that we didn't actually need to know what exactly these "declarative sentences" were saying about the world. So we will use single letters to denote statements which cannot be broken down further: propositional atoms. They can be either true, or false. And then, we will use a small set of connectives to join up these propositional atoms into more interesting _formulae_. Here are the rules, with some examples:

Let $p$, our first propositional atom, mean "it is winter." And, let $q$, our second propositional atom, mean "it is cold." Then:

- The connective $\land$ is like the English "and." It means that the statements, or formulae, on both sides are true. For instance, $p\land q$ would mean "It is winter, and it is cold." The connective itself is called "conjunction", and the things on either side are called the "conjuncts." The conjunction as a whole is true if and only if both of the conjuncts are true.
- Similarly, $\lor$ is akin to the English "or." It means that at least one of the statements is true. $p\lor q$ would mean "It is winter or it is cold." The operation is called disjunction, and the formulae on the sides are called "disjuncts." The disjunction as a whole is true if at least one of the disjuncts is true.
- $\lnot$ is the only operator out of the lot which doesn't actually connect two things together - it just inverts a single formula, like the English "not." E.G. $\lnot p$ would mean "it's not winter." The operation is called negation, and it is true if the thing you are negating is false.
- The final connective is $\rightarrow$, which is called "implication." It is like the English "If ... then ...", so the order matters! For example, $p\rightarrow q$ means "If it's winter, then it's cold," whereas $q\rightarrow p$ means "If it's cold, then it's winter." The formula to the left of the arrow is called the "antecedent", and the formula on the right of the arrow is called the "consequent." Implication is only false when the anticedent is true, and the consequent is false. 

There are a few additional things worth mentioning about these connectives. The first one is related to disjunction: it was introduced as being similar to the word "or" in English, but there is a small difference. In English, when we say "$a$ or $b$," we usually mean one or the other, _but not both_. This is what's called an _exclusive_ or, because we are _excluding_ both options from being true. However, disjucntion is _inclusive_ - it's still true if both of the disjuncts are true. The next example is to emphasise that order really matters when working with logical implication. Consider the statement
> If I am making bread, then I am baking.

, which is correct. But if you swap the antecedent and the consequent around, you get this:
> If I am baking, then I am making bread.

Now this is clearly false; perhaps you could be baking a cake instead! Finally, when working with implications in logic, we are not concerned about causality. That is, there doesn't have to be any relationship between the anticedent and the consequent when we say that one thing implies another. For example, consider the sentence
> If the Egyptians built the pyramids, then carrots are orange.

In English, this does not make sense, because the Egyptian pyramids have nothing to do with the color of carrots. But logically, we don't care about these relationships.

Now we have a way of taking simple statements (propositional atoms) and using logical connectives to compose them into formulae that say something more interesting about the world. Here are some examples, if we let the first atom $d$ mean "It is dark inside", the second atom $s$ mean "the sun has set" and $l$ mean "the lights are on:"
- $s\land l$: The sun has set and the lights are on
- $(s\land(\lnot l))\rightarrow d$: If the sun has set and the lights aren't on, then it is dark inside.
- $(\lnot d)\rightarrow ((\lnot s)\lor l)$: If it isn't dark inside, then either the sun hasn't set or the lights are on. (This is equivalent to the last statement.)

Writing brackets all the time is annoying, so instead there is an "order of operations," just like with arithmetic. Negation comes first, followed by conjunctions and disjunctions. Finally, implications come last. Therefore, the correct way to interpret this statement:
> $\lnot a \lor b \rightarrow c$

is 
> $((\lnot a) \lor b) \rightarrow c$

## Summary of key ideas:
- Since we only care about logical structure instead of concrete meaning, we denote simple sentences that can't be broken down further (propositional atoms) using single letters.
- There is a set of four connectives which we can use to combine propositional atoms together into logical formulae.
- The connectives have an order of application.
- This lets us unambiguously encode statements about the world into a form that can be rigorously argued about.

# Syntax
Now that we can encode what we would like to say about the world into logical statements, there is still something big we are missing. That is, how do we make arguments using these logical statements? How can we show that one statement entails another, and how can we justify that? This is where we reach a fork in the road, as there are two ways of doing this. The first way involves arguing about the _semantics_, or _meaning of the connectives_. It's done using truth tables, and will be explained later in its own section. For now, let us discuss the second method: arguing about the _syntax_, or _structure of the formula_.

We start with a set of very simple rules - some of them are so simple that it's awkward to write more than a few sentences about them. Then, the "argument" or proof is structured like this:
- We write down the formulae we are given; what we know to be true.
- We apply a rule to a formula - this gives us another formula which we know to be true.
- We keep applying rules until we reach the desired result.

The tricky part is knowing which rules to apply in which order - figuring that out can be quite an entertaining puzzle. Each rule is listed like this:
$$
\frac{\text{What you have}}{\text{What you can infer}}(\text{Rule name})
$$
For example, here is the rule for introducing a conjuction (and:)
$$
\frac{a,b}{a\land b} \medspace (\land_i)
$$
This rule reads as follows: "If we know that $a$ is true, and we know that $b$ is true, then we can infer that $a$ and $b$ is true." The rule is named $\land_i$. There are also rules for getting rid of, or eliminating, a conjunction:
$$
\frac{a\land b}{a}\medspace (\land_{e1})\thickspace\frac{a\land b}{b}\medspace (\land_{e2})
$$
The first one reads as so: "If we know that $a$ and $b$ are both true, then it follows that $a$ must be true." The idea is the same for the second rule. There are also rules for double negation:
$$
\frac{a}{\lnot\lnot a}\medspace(\lnot\lnot_i)\thickspace\frac{\lnot\lnot a}{a}\medspace(\lnot\lnot_e)
$$
Think of it like this: if someone tells you "It isn't not raining," that's just a weird way of saying "it's raining," and vice-versa. This is what these two rules are saying. In order to understand the next few rules, we need to extend the proof system a little bit. At any point in the proof, you are free to assume that something is true - but the catch is that your final result cannot depend on this assumption. Let's look at the rules for implication:
$$
\frac{[a\dots b]}{a\rightarrow b}\medspace(\rightarrow_i)
$$
The $[a\dots b]$ means "a sub-proof assuming $a$ and concluding $b$." Essentially, what this rule is saying, is this: If we can show that $b$ is true assuming that $a$ is true, then it means $a$ implies $b$. If you find this confusing, we're allowed to do this because the implication holding doesn't actually say anything about the truth value of $a$. For instance, the statement "If I am tired, then I will go to bed" doesn't mention anything about the speaker being tired or not. Here is the other rule for implications; this one is a lot simpler:
$$
\frac{a\rightarrow b,a}{b}\medspace(\rightarrow_e)
$$
This rule says "If $a$ implies $b$, and $a$ is true, then $b$ must be true too." Here are the rules for disjunctions (or:)
$$
\frac{a}{a\lor b}\medspace(\lor_i)\thickspace\frac{a\lor b, [a\dots c], [b\dots c]}{c}\medspace(\lor_e)
$$
The first rule states that, if $a$ is true, then $a$ or $b$ is true. The reason this works is because for disjunction to be true, only _one_ of the disjuncts has to be true. Therefore, if we know that $a$ is true, it doesn't matter if $b$ is true or not - the disjunction will still hold. The second, more intimidating rule is for eliminating a disjunction. Suppose we know that $a$ or $b$ is true - we don't know which one of them is true, so we can't just get rid of the other disjunct like we did with conjunction elimination. So we have to be able to show that, no matter which one of these is true, $a$ or $b$, we can always conclude that $c$ will be true. And to do that, we must provide two subproofs - one assuming $a$ and concluding $c$, and another one assuming $b$ and concluding $c$. That way, no matter which one of the two is true, we always have a way to get to $c$.

With these rules, we can write our first (not very exciting) proofs. The first result we'd like to show is that, if $a$ and $b$ are true, then $a$ or $b$ is also true. That is, we would like to prove $$a\land b \vdash a\lor b$$. The $\vdash$ symbol means "entails." Here is the proof:
1. $a\land b$ (Premise)
2. $a$ $\quad\land_{e1} 1$
3. $a\lor b$ $\quad\lor_e 2$

Starting off with our $a\land b$, we first apply the rule $\land_{e1}$ to line 1, giving us $a$. Then, to conclude the proof, all we have to do is use the $\lor_e$ rule on line 2. Notice that the entailment only goes one way. We've just proved that $a\land b\vdash a\lor b$, but it not possible to prove that $a\lor b\vdash a\land b$. 

For the second example, we'll use a sub-proof. Let's try and show that, if $a$ implies that $b$ and $c$ are true, then $a$ implies $b$.
$$
\begin{aligned}
  \text{1. } & \quad a\rightarrow (b\land c)\quad & \text{(Premise)}\\\
  & \begin{bmatrix}
    \text{2. }& \quad a\quad & \text{(Assumption)}\\\
    \text{3. }& \quad b\land c\quad & \rightarrow_e 1\\\
    \text{4. }& \quad b \quad & \land_{e1} 3
  \end{bmatrix}\\\
  \text{5. }&\quad a\rightarrow b\quad&\rightarrow_i2-4
\end{aligned}
$$

Here, we first assume that $a$ is true. The scope of the assumption is indicated with a box. Then, assuming that $a$ is true, we can infer that $b\land c$ is true, and thus $b$ is true. Finally, we have a sub-proof that concludes $b$ given $a$, thus we can close the assumption box, and conclude that $a\rightarrow b$.

The final few rules deal with contradiction. A contradiction happens when something is shown to be both true and false at the same time. It's represented with the $\bot$ symbol:
$$
\frac{a,\lnot a}{\bot}\medspace(\bot_i)
$$
An interesting property is that you can derive anything from contradiction:
$$
\frac{\bot}{a}\medspace(\bot_e)
$$
If you assume something and it leads to a contradiction, then whatever you assumed can't be true.
$$
\frac{[a\dots\bot]}{\lnot a}\medspace(\lnot_i)
$$
And finally, this rule states that if $a$ implies $b$ and $b$ is false, then $a$ must be false too. Otherwise, there would be a contradiction. This rule is actually a combination of some of the other rules, but it is useful so I will mention it. The name of the rule is "modus tollens."
$$
\frac{a\rightarrow b,\lnot b}{\lnot a}\medspace\text{M.T.}
$$
With all the rules in place, we can finally prove these statements which we made in the first section.
> If it is raining, and I do not have an umbrella, then I will get wet. It was raining and I did not get wet.

First we assign each of the atoms to letters: let $r$ mean "it was raining", $w$ mean "I got wet", and $u$ mean "I had an umbrella." Then here are our premises and the proof:
$$
\begin{aligned}
  \text{1. } & \quad (r\land\lnot u)\rightarrow w\quad & \text{(Premise)}\\\
  \text{2. } & \quad r\land\lnot w \quad & \text{(Premise)}\\\
  \text{3. } & \quad \lnot w \quad & \land_{e2}2\\\
  \text{4. } & \quad r \quad & \land_{e1}2\\\
  \text{5. } & \quad \lnot(r\land\lnot u) \quad & \text{M.T.} 1,3\\\
  & \begin{bmatrix}
    \text{6. }& \quad \lnot u\quad & \text{(Assumption)}\\\
    \text{7. }& \quad r\land\lnot u \quad & \land_i 4,6\\\
    \text{8. }& \quad\bot\quad & \bot_i 7,5
  \end{bmatrix}\\\
  \text{9. }&\quad \lnot\lnot u\quad&\lnot_i 6-8\\\
  \text{10. }&\quad u \quad & \lnot\lnot_e 9
\end{aligned}
$$

This proof is one by contradiction. In line 6 we assume that you _did not_ have an umbrella. If this is the case, then it means you were out in the rain without an umbrella, meaning you would have gotten wet - however in the second premise, it says that you did _not_ get wet. So we've reached a contradiction, meaning that our original assumption must be false. Therefore, you must have had an umbrella. 

Recall the other example that we had from the first section:
> If a matrix is square and its determinant is not zero, then it is invertible. The matrix is square, but not invertible.

The logical proof for this would look the exact same as the one above - except maybe you would choose different letters to represent the propositional atoms.

## Summary of key ideas:
- You can make logical arguments by examining the syntax (structure of the formula.)
- This is done applying a set of simple rules to the formulae you are given in order to infer new formulae. You keep applying these rules until you infer what you wanted to show.
- Proofs can contain sub-proofs and contradictions

# Semantics
An interesting observation about arguing syntactically is that it is purely symbolic. Imagine this: you could just write down the inference rules on a sheet of paper, and give them to someone else without telling them what the connectives actually represent. Then this person would be able to write a logic proof, even though they have no idea what the formulae even mean. But, there is an alternative way of making logical arguments: instead of working with the structure of the formula, you work with the meaning of the connectives. Consider the following formula:
> $a \lor b$ 

Whether this formula is true or not depends on whether $a$ or $b$ are true or not, and also the _meaning_ of the connective $\lor$. We can write down the "meaning" of each connective in what's called a _truth table_. In each row of this table, we assign each variable to be either true or false, and then write down the truth value of the whole formula. Here's the truth table for each connective:

| $p$ | $q$ | $\lnot p$ | $p\land q$ | $p\lor q$ | $p\rightarrow q$ |
|-----|-----|-----------|------------|-----------|------------------|
| T   |  T  |     F     |  T         |    T      |  T               | 
| T   |  F  |     F     |  F         |    T      |  F               | 
| F   |  T  |     T     |  F         |    T      |  T               | 
| F   |  F  |     T     |  F         |    F      |  T               | 

We can see that $\lnot$ just "flips" the truth value from T to F, or vice-versa. $\land$ is true only if both the conjuncts are true. $\lor$ is true if at least one of the disjuncts are true. Implication is a little bit more strange, but here is a good example for why it is the way it is (taken from Wikipeida [[1]]): Suppose you promised to your friend that if it is raining, then you will visit him. In logic, that would be $raining\rightarrow visit$. Now, in which of these cases do you keep your promise?
- If it is raining, and you visit him, then you have kept your promise.
- If it is raining, and you do not visit him, then you have broken your promise, and the implication is false.
- If it is not raining, and you visit him, then you still have kept your promise, as your friend never said that you could _only_ visit him if it was raining.
- If it is not raining, and you do not visit him, then you have not broken your promise either.

Now that we are able to work out the truth value of a formula given the truth value of all the variables involved, how can we actually show that one formula entails another? Well, if one formula entails another, then it means that whenever the former is true, the latter should be true as well, like logical implication. Therefore, if we write out the truth tables of both formulae side-by-side, we can compare them and see if this holds. For example, does $a\land b$ entail $a\lor b$? Here are the truth tables of both formulae:
| $a$ | $b$ | $a\land b$ | $a\lor b$ |
|-----|-----|------------|-----------|
| __T__   |  __T__  |     __T__      |    __T__      |
| T   |  F  |     F      |    T      |
| F   |  T  |     F      |    T      |
| F   |  F  |     F      |    F      |

Highlighted is the only row where $a\land b$ is true. And you can see that, in this case, $a\lor b$ is true as well. Therefore the entailment holds. But, just like before when we were arguing using syntax, the entailment does not go both ways. There are rows where $a\lor b$ is true, but $a\land b$ is false.

But what if the two formulae have different variables involved, or a different amount of them? For example, does $\lnot r$ entail $p\lor\lnot p$? Does $p$ entail $p\rightarrow(\lnot p\lor q)$ ? In order to work that out, we'd need to write one big truth table with all the variables involved on either side. But after that point, the idea is still the same: every time the premises are true, then the result should be true as well. Let's look at whether or not $\lnot r$ entails $p\lor\lnot p$:

| $r$ | $p$ | $\lnot r$ | $p\lor\lnot p$ |
|-----|-----|------------|-----------|
| __T__   |  __T__  |     __T__      |    __T__      |
| __T__   |  __F__  |     __T__      |    __T__      |
| F   |  T  |     F      |    T      |
| F   |  F  |     F      |    T      |

Again, each row where $\lnot r$ is true is highlighted. And, you can see that in each of those rows, $p\lor\lnot p$ is true as well. Thus, the entailment holds.

Now you've seen two different ways of deriving conclusions from propositional formulae. There is a very nice relationship between the two: propositional logic is said to be _sound_ and _complete_. Soundness means that every time you prove something syntactically, the result will hold if you write out the truth tables. Completeness goes the other way around - if you can show that some entailment holds in a truth table, then there must exist a syntactical proof for that. Therefore, you are completely free to switch between working with syntax and semantics. In other words, everything that is provable is true, and everything that is true has a proof.

If you are working with a lot of propositional atoms, it may be wise to use a syntactical approach, because for each additional variable, the number of lines in your truth table will double. However, if you can't find a syntactical proof, even after lots of effort, you can use the truth tables to make sure that such a proof even exists in the first place.

## Summary of key ideas:
- You can argue that one formula entails another one by looking at the truth of both formulae; by arguing about the _meaning_ of the connectives.
- Everything that is provable syntactically is true, and everything that is true is provable syntactically.

# Normal forms:

There are two properties of a formula which are useful to know. They are _validity_ and _satisfiability_. A formula is valid if it is _always_ true, and a formula is satisfiable if there is at least one case (one assignment of true and false to each propositional atom) where it is true. In general, it is actually not that simple to check that a formula has these properties, especially if it contains a lot of variables. For each additional variable that we add to the formula, the truth table _doubles_ in size. Thus, simply checking each line in the truth table will take $2^n$ operations in the worst case, which quickly becomes an unreasonable amount of work. In practice, tools called SAT solvers are used, which employ some clever tricks to usually find the answer faster.

But, there are classes of formulae which are much easier to test for validity or satisfiability. Among them are formulae in CNF (conjunctive normal form) and DNF (disjunctive normal form.) Let us first have a look at formulae in disjunctive normal form, and see how they can be easily checked for satisfiability.

A formula is said to be in disjunctive normal form if it is a disjunction of clauses, where each clause is a conjunction of atoms (or their negations.) Here are a few examples:
1. $p\lor\lnot p$
2. $(a\land b\land \lnot c) \lor c \lor (a\land\lnot b)$
3. $p$

Since formulae in DNF are a _disjunction_ of several clauses, for the whole formula to be true, _only one clause_ has to be true. This means that all we have to do is find just one clause which is satisfiable. Furthermore, we know that each clause will simply be a conjunction of atoms or their negations. Thus, the only time a clause _isn't_ satisfiable is if it contains an atom and its negation. For example:
1. $a\land b\land\lnot c$ is satisfiable
2. $a\land b\land\lnot a$ is not, because it contains $a\land\lnot a$ - which can never be true.

Therefore, you can check the satisfiability of a formula in DNF in linear time by going through each clause and making sure that you find at least one which doesn't contain an atom and it's negation.

Next, let's look at conjunctive normal form. This is similar to DNF, except intead it is a _conjunction_ of clauses, where each clause is a _disjunction_ of atoms or their negations. Again, here are some examples of CNF:
1. $(a\lor b\lor\lnot c)\land\lnot b\land (d\lor e)$
2. $a\land\lnot b\land(c\lor e)$
3. $p$

In this form, it is easy to check for _validity_. The conjunction of clauses will only be false if there is one clause which can be made false. Here, we know that each clause is a _disjunction_ of atoms or their negations. The only time such a clause can be made false is if it _doesn't_ contain an atom or its negation. For example, consider the clause
$$p\lor\lnot p\lor a$$

This will _always_ be true: if $p$ is true then the first disjunct holds. If not, then the second disjunct holds. Either way, the clause is always true. Hence, we can check formulae in CNF for validity in linear time, since all we have to do is go through each clause, and see whether or not it contains an atom and its negation.

These forms are easy to work with, but unfortunately the formulae we usually come across are not in these forms. Instead, we would have to convert them into an equivalent CNF or DNF formula. To do this, we first need to get rid of any implications by using the identity $$a\rightarrow b\equiv \lnot a\lor b$$. After this point, we will have a formula containing only negations, conjunctions, and disjunctions. However, they will most likely not be in the correct order. For instance, the formula
$$ \lnot(a\land \lnot(b\lor c)) \lor \lnot a $$ contains only $\lnot, \lor, \land$, but it is neither in DNF nor CNF. To get the formula in the correct form after this, we need to use a few different logical equivalences:
1. $\lnot(a\lor b)\equiv \lnot a\land\lnot b$
2. $\lnot(a\land b)\equiv \lnot a\lor\lnot b$
3. $a\land(b\lor c)\equiv (a\land b)\lor(a\land c)$
4. $(a\lor b)\land c \equiv (a\land c)\lor(b\land c)$

The complete algorithm is not covered here; if you are interested, it is discussed in greater depth in section 5 of chapter 1 of the original text. But, the main takeaway is that any formula can be converted into CNF or DNF. Unfortunately, doing this conversion will take a lot of computational effort, and in some cases may make the formulae very large. Hence, it is still not a particularly efficient way of solving validity or satisfiability problems. These problems often come up in other fields which are not in the scope of this conspectus.

## Summary of key ideas:
  - A formula is valid if it is always true, and satisfiable if there is a line in its truth table where it is true.
  - There are special forms which make it easier to test for these properties. DNF makes it easy to check satisfiability and CNF makes it easy to check for validitiy.
  - We still have to put in computational work to convert a formula into a normal form, which means checking validitiy or satisfiability is still not efficient. In practice, heuristic based SAT solvers are used.

# References
- [Logical implication example][1]

[1]: https://simple.wikipedia.org/wiki/Implication_(logic)
