+++
title = "Do not die hard with TLA+"
date = 2024-04-10T12:56:17+5:00
draft = false
math = "katex"
summary = "The first part of the conspect of the \"Intoduction to TLA+\" course by Leslie Lamport."
tags = ["Temporal Logic", "TLA+", "Model checking"]
+++

This is the first blog post in the series of the conspects of the "Introduction to TLA+" course by Leslie Lamport. It would directly follows the course structure and would be a good reference for those who are taking the course because it adds some more additional information and explanations to the course material.

## Inroduction to $TLA^+$

$TLA^+$ is a language for **high-level** (design level, above the code) systems (modules, algorithms, etc.) modelling and consists of the following components:

- `TLC` — the model checker;
- `TLAPS` — the $TLA^+$ proof system;
- $TLA^+$ Toolbix — the IDE.

$TLA^+$ system is used to model **critical parts** of digital systems, abstracting away less-critical parts and lower-level implementation details. $TLA^+$ was designed for designing concurrent and **distributed systems** in order to help find and correct **design errors** that are hard to find by testing and **before** writing any single line of code.

OpenComRTOS is a commercial network-centric,real-time operating system [[1]] heavily used $TLA^+$ during the design and development process and shared their experience in the freely available book [[2]]. And showed that using design gratefully reduce the code base size and number of errors and boost the engineering view overall.

Consequently, $TLA^+$ provides programmers and engineers **a new way of thinking** that **makes them better programmers and engineers** even when $TLA^+$ are not useful. $TLA^+$ forces engineers thinking more abstract.

> Abstraction — the process of removing irrelevant details and the most important part of engineering. Without them we cannot design and understand small systems.

As an example of using $TLA^+$ in huge company for vefifying a system that many of us use daily is Amazon Web Services. They use $TLA^+$ to verify the correctness of their distributed algorithms and AWS system design [[3]]. The problematic of alrogithms and communication in distributed systems is well described in the Leslie Lamport's paper "Time, Clocks, and the Ordering of Events in a Distributed System" [[4]].

A system design is expressed in a formal way called _specification_.

> Specification — the precise high-level model.

$TLA^+$ defines the specification, but it cannot produce the code. But it helps come with much clearer architecture, write more precise, accurate, in some cases compact code. It is able to check properties that express conditions on an individual execution (a system satisfies a property if and only if every single execution satisfies it).

The underlying abstraction of $TLA^+$ is as follows: an execution of a system is represented as a sequence of discrete steps, where a step is the change from one state to the next one:

- discrete — continuous evolution is a sequence of discrete events (computer is a discrete events based system);
- sequence — a concurrent system can be simulated with a sequential program;
- step — a state change;
- state — an assignment of values to variables.

> Behavior — a sequence of states.

A state machine in context of $TLA^+$ system is described by:

1. all possible initial states -> \[what the variables are] and \[their possible initial values];
2. what next states can follow any given state -> a relation between their values in the current state and their possible values in the next state;
3. halts if there is no possible next state.

> Control state — the next to be executed statement.

State machines eliminate low-level implementation details, and $TLA^+$ is a language to describe state machines.

## State Machines in $TLA^+$

$TLA^+$ uses ordinary, simple math. Consider a define state machine example for the following `C` code

```c
int i;
void main()
{
	i = someNumber();
	i = i + 1;
}
```

In order to turn this code into the $TLA^+$ state machine definition we need to pack the execution flow of this code into states (sets of variables). For the given example, it is obvious how to define `i` variable. But we also need to instantiate the control state. We call it as `pc` such as:

- `pc = "start"` = `i = someNumber();`
- `pc = "middle"` = `i = i + 1;`
- `pc = "done"` = execution is finished.

_Assume for this example `someNumber()` returns an integer from the `[0:1000]` interval._

To define the system we need to define the _initial_ state of the system the the _next_ possible system state, expressed as a formula, that can be reached afrom the current state.

Here is the **formula** of the `C` code above, not the sequence of execution.

- Initial-state formula: `(i = 0) /\ (pc = "start")`
- Next-state formula:

```tlaplus
\/    /\ pc = "start"
      /\ i' \in 0..1000
      /\ pc' = "middle"
\/    /\ pc = "middle"
      /\ i' = i + 1
      /\ pc' = "done"
```

Since this is the formula, it respects such formulas properties as commutativity, associativity, etc.

Sub-formulas can also be extracted into their own definitions to make a spec more compact.

```tlaplus
A == /\ pc = "start"
     /\ i' \in 0..1000
     /\ pc' = "middle"

B == /\ pc = "middle"
     /\ i' = i + 1
     /\ pc' = "done"

Next == A \/ B
```

From this spec we see that there are two possible _next states_ that can be reached begginging from the _initial_ state. `A` states the beggining of the execution, assigning a number to `i` and moving to the next `pc` state equals `p'`, `B` states the increment of `i` and moving to the final state.

## References

- [OpenComRTOS][1]
- [Eric Verhulst, Raymond T. Boute, José Miguel Faria, Bernhard H C Sputh, Vitaliy Mezhuyev. Formal Development of a Network-Centric RTOS. January 2011. DOI:10.1007/978-1-4419-9736-4. ISBN: 978-1-4419-9735-7][2]
- [Chris Newcombe, Tim Rath, Fan Zhang, Bogdan Munteanu, Marc Brooker and Michael Deardeuff.How Amazon Web Services uses formal methods. 2015, Communications of the ACM][3]
- [Leslie Lamport. Time, Clocks, and the Ordering of Events in a Distributed System. 1978. Massachusetts Computer Associates, Inc.][4]

[1]: https://en.wikipedia.org/wiki/OpenComRTOS
[2]: https://www.researchgate.net/publication/315385340_Formal_Development_of_a_Network-Centric_RTOS
[3]: https://www.amazon.science/publications/how-amazon-web-services-uses-formal-methods
[4]: https://amturing.acm.org/p558-lamport.pdf

---

Discuss [this blog](https://t.me/inferara/) in our telegram channel [@inferara](https://t.me/inferara/).
