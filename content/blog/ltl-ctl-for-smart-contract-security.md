+++
title = 'LTL and CTL Applications for Smart Contracts Security'
date = 2024-03-14T17:46:15+13:00
draft = false
math = "katex"
summary = "In this blog we explore linear temporal logic as well as computation tree logic, and how we could use them to verify smart-contracts."
tags = ["Temporal Logic", "LTL", "CTL"]
+++

Both `LTL` and `CTL` are fragments of propositional logic and parts of `CTL`\*.

## Linear Temporal Logic (LTL)

`LTL` is a modal temporal logic with modalities referring to time [[1]]. In the context of smart contracts, `LTL` can be used to specify and verify properties that must hold over the sequences of states that a contract might pass through.

For example, it allows developers to make assertions like, "If condition $X$ is $true$, then condition $Y$ will eventually be $true$" (expressed as $X \implies \lozenge Y$ in `LTL`). This is particularly useful for smart contracts, which may need to guarantee certain outcomes after a sequence of events.

Imagine a smart contract that has a critical function to ensure that once a user deposits a certain amount of assets, they will eventually receive interest payments. With `LTL`, we could formally verify this property by expressing it as:

$$
G(\text{deposit} \implies F\text{ interest payment})
$$

This `LTL` formula states that it is globally $true$ ($G$) that if a deposit action occurs, it will be followed eventually ($F$) by an interest payment. This kind of temporal logic allows developers and security analysts to prove that the smart contract will behave as intended over time.

`LTL` uses temporal operators to express logical statements about the future, such as:

- $G$ (Globally): A condition must hold in all future states.
- $F$ (Finally): A condition will eventually hold in some future state.
- $X$ (ne**X**t): A condition will hold in the next state.
- $U$ (Until): A condition will hold until another condition holds.

## Computation Tree Logic (CTL)

While `LTL` is linear and considers the flow of time as a single path, `CTL` allows for branching time, where multiple future possibilities can be considered from any given point [[2]]. `CTL` introduces path quantifiers to specify properties of computation trees — structures representing all possible executions of a system from any given state.

The two path quantifiers are:

- $A$ (for All paths): Specifies that a property must hold on all possible future paths.
- $E$ (there Exists a path): Specifies that there is at least one possible future path where a property holds.

`CTL` uses the same temporal operators as `LTL`, but prefixed with path quantifiers. So, you might see formulas like $AG$ (on all paths, globally) or $EF$ (there exists a path where finally).

For instance, a smart contract might have a function that only allows funds to be withdrawn by a specific party after a certain date. `CTL` can be used to validate this by expressing properties like "For all paths, if the withdrawal function is called, then for every possible continuation of that path, either the caller is the authorized party, and the date is correct, or the withdrawal fails."

In `CTL`, this could be expressed as:

$$
A[\text{withdraw} \implies (E[\text{caller} = \text{authorized} \land \text{date} \geq \text{specified}] \lor E[\text{transaction reverted}])]
$$

This states that along all paths ($A$), if a withdrawal attempt occurs, there exists a path ($E$) where either the caller is authorized and the date is on or after the specified date, or there exists a path where the transaction is reverted, ensuring funds can't be incorrectly withdrawn.

Keeping in mind: `LTL` synthesis and the problem of verification of games against an `LTL` winning condition is 2EXPTIME-complete [[3]].

We think these logics can be used to verify; hence, cover high-level logical scenarios for smart-contract as within a single transaction as in a sequence of blocks.

Of course, for such digital systems as smart contracts, design and modelling based on temporal logic should be done before the actual implementation. [The same is true of any other considered digital system]. This is a part of the **Verification-Driven Development** process [[4]] and to reduce the number of possible errors, it must be a predecessor of code.

## References

- [Linear Temporal Logic][1]
- [Computation Tree Logic][2]
- [2EXPTIME][3]
- [Verification-Driven Development][1]

[1]: https://en.wikipedia.org/wiki/Linear_temporal_logic
[2]: https://en.wikipedia.org/wiki/Computation_tree_logic
[3]: https://en.wikipedia.org/wiki/2-EXPTIME

[4]: {{< ref "/posts/verification-driven-development" >}}

---

Discuss [this post](https://t.me/inferara/10) in our telegram channel [@inferara](https://t.me/inferara/).
