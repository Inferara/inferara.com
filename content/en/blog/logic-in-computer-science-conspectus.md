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
- [Syntax](#syntax)
- [Semantics](#semantics)
- [Normal forms](#normal-forms)

# Introduction
This blog post is my conspectus for the book _Logic in Computer Science_ by Micheal Huth and Mark Ryan. I will summarise the first five parts of chapter one. This conspectus is informal and breif, mostly written for my own learning. I have tried to make it approachable for people who haven't heard of the topics before.

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

We usually make arguments by working with sentences that "declare" something to be true, sentences that say something about the world. For example, consider these two English sentences:
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
- Similarly, $\lor$ is akin to the English "or." It means that at least one of the statements is true. $p\lor q$ would mean "It is winter or it is cold." An important thing to know is that, unlike in usual English, this is what's called an "inclusive" or. That means that it's perfectly okay for _both_ statements to be true. The operation is called disjunction, and the formulae on the sides are called "disjuncts." The disjunction as a whole is true if at least one of the disjuncts is true.
- $\lnot$ is the only operator out of the lot which doesn't actually connect two things together - it just inverts a single formula, like the English "not." E.G. $\lnot p$ would mean "it's not winter." The operation is called negation, and it is true if the thing you are negating is false.
- The final connective is $\rightarrow$, which is called "implication." It is like the English "If ... then ...", so the order matters! For example, $p\rightarrow q$ means "If it's winter, then it's cold," whereas $q\rightarrow p$ means "If it's cold, then it's winter." The order is very important, for example consider the sentence "If I am making a loaf of bread, then I am baking." This is true. But if you swap them around and say "If I am baking, then I am making a loaf of bread," it is now false, because perhaps I could be baking a cake instead! The statement to the left of the arrow is called the antecedent, and the one on the right is called the consequent. The final confusing thing about implication is that, in logic, we are not concerned about causation. In English, the sentence "If the moon is blue, then the atomic number of carbon is 12" makes no sense, because there's no obvious reason why the atomic number of carbon has anything to do with the moon, but logically it is an okay statement.
