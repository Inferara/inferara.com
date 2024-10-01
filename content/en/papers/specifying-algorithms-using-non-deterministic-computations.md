+++
title = 'Specifying Algorithms Using Non-Deterministic Computations'
date = 2024-07-04T10:20:22+05:00
draft = false
math = "katex"
tags = ["Program Verification", "Inference"]
summary = "In this article, we will discuss the use of the formalism of non-deterministic computations as a language for specifying algorithms."
aliases = ["/papers/specifying-algorithms-using-non-deterministic-computations"]
+++

## Table of Contents

- [Introduction](#introduction)
- [Non-Determinism and Formal Specifications](#non-determinism-and-formal-specifications)
- [Problem](#problem)
- [Solution](#solution)
- [Unrelated-machines scheduling example](#unrelated-machines-scheduling-example)
- [Conclusion](#conclusion)
- [References](#references)

## Introduction

The spread of formal verification of algorithms is hindered by the fundamental differences between existing specification languages and what programmers are accustomed to dealing with in their regular work.

Given the choice between maintaining their code with informal but understandable textual comments along with a test suite covering the main usage patterns, and a formal specification requiring an understanding of predicate logic, most programmers will likely choose the former, even recognizing the benefits of mathematical precision in describing program behavior.

This choice is quite understandable, as overcoming the analytical complexity barrier of studying and applying logical formalism in real life rarely truly compensates for meeting the reliability requirements of the code we write.

Let's face it, firmware for micro-controllers in medical equipment, nuclear reactors, and transport autopilots make up an invisible fraction of the code produced by engineers. In less critical tasks, iterative error correction based on operational results is considered a quite acceptable development method, given that the alternative, full formal verification, requires deep immersion into extremely complex areas of knowledge, hardly related to other applied tasks.

As a result, since few people study predicate logic for specifying their programs, formal specification loses its meaning even as an element of documentation, because why write what no one will read.

If we think about it, the main problem here is precisely the height of the notorious analytical complexity barrier of studying and applying logical formalism, from which the task of specifying algorithms is inseparably perceived.

Interestingly, this inseparability is actually only apparent, as the observed behavior of any program can be described with mathematical rigor without using predicate logic statements.

Moreover, a program in any Turing-complete programming language can be specified, essentially, in the same language, supplemented with just a few additional constructs with non-deterministic semantics.

## Non-Determinism and Formal Specifications

Recalling that our reasoning about algorithm specification [[1]] is based on an arbitrary abstract machine $\mathfrak M : P \to X \rightharpoonup Y$ with a set of operations $Ops = \\{op_i : M \to (M \times R_i) \cup \\{\blacktriangledown\\}, i=\overline{1,n}\\}$, let's imagine its non-deterministic generalization $\overline {\mathfrak M} : \overline P \to 2^X \rightharpoonup 2^Y$ with a new program description language $\overline P$, supplemented with additional operations whose type can be described as $\overline{Ops} = \\{op_i : 2^M \rightharpoonup 2^{(M \times R_i)}, i \in \\{n+1,\ldots\\}\\}$.

Here we should note several important aspects:

1. New operations perform computation not on individual states of the abstract machine, but on arbitrary sets of states.
2. Unlike classic operations, non-deterministic operations do not have to be total [[2]] – on some inputs, their computation may not terminate.
3. Quantitatively, new operations form a countably infinite set, as they can be parameterized by nested programs (both deterministic and non-deterministic).

The computational semantics of a non-deterministic program $\overline p = \langle V, \overline{op}, E, V_\blacktriangle \rangle$, where $V$ is the set of vertices of the control flow graph, $\overline{op} : V \to Ops \bigcup \overline{Ops}$ is the assignment of operations executed at the vertices, $E$ is the set of edges labeled with possible operation results, and $V_\blacktriangle$ is the set of start vertices, can be represented as an iterative process of building a computation tree, whose nodes are pairs of the form $(v, M_v) \in V \times 2^M$, associating the graph vertices with sets of machine states reachable at their input:

1. At the beginning of the computation, each vertex from $V_\blacktriangle$ is associated with the set $M_\blacktriangle = \\{m \in M \mid \exists x \in X : m = in(x)\\}$, i.e., all allowable initial states of the machine, forming the roots of the building tree.
2. At each step, any unprocessed node $(v, M_v)$ is chosen in the tree, and for the operation $\overline{op}^v$ executed at it, a set of non-terminal outcomes $\overline{op}^v(M_v) \subseteq M \times R_{\overline{op}^v}$ is built according to the following rules:
	- If the operation $\overline{op}^v$ is deterministic, then $\overline{op}^v(M_v) = \\{(m, r) \in M \times R_{\overline{op}^v} \mid \exists m_0 \in M_v : (m, r) = \overline{op}^v(m_0)\\}$ simply applies it to each reachable input state of the program, discarding $\blacktriangledown$ (successful computation completions).
	- If the operation $\overline{op}^v$ is non-deterministic, then the computation $\overline{op}^v(M_v)$ is carried out according to special rules, which will be listed below.
3. For each vertex $w \in V$, into which at least one edge leads from $v$, $M_w = \\{m \in M \mid \exists r \in R_{\overline{op}^v} : (v, r, w) \in E \lor (m, r) \in \overline{op}^v(M_v)\\}$ is built, i.e., the set of all states reachable when transitioning to it from the processed node.
4. For each non-empty $M_w$, the tree is supplemented with a branch $(w, M_w)$, a child relative to the processed one. After the process is completed, the node $(v, M_v)$ is marked as processed, and if there are still unprocessed nodes, the algorithm repeats, starting from the step **2**.
5. This algorithm either terminates upon exhaustion of unprocessed nodes or continues building the tree indefinitely.

Currently, since we have not yet introduced additional non-deterministic instructions, it may seem that we are essentially talking about a type of symbolic computation. And yes, in some sense, this parallel is justified - if we limit ourselves to subsets of $M$ having a symbolic representation, then for classical operations, the above algorithm can be implemented quite straightforwardly.

However, it should be understood that building an instance of the computation tree for a specific algorithm is not our goal - we are more interested in how the properties of this tree can testify to the algorithm's belonging to a given class.

To do this, we will introduce the following non-deterministic operations:

- $total_{\overline{pp}}$ is an operation, whose parameter is an arbitrary non-deterministic program $\overline{pp} \in \overline P$. The operation is terminal, i.e., $R_{total} = \emptyset$. For any input set of states $M_v \subseteq M$, the computation $total_{\overline{pp}}(M_v)$ completes successfully if and only if every computation tree built for the program $\overline{pp}$ and any finite subset of $M_v$ is finite. Otherwise, the computation $total_{\overline{pp}}(M_v)$ does not terminate;
- $filter_{\overline{pp}}$ is an operation, whose parameter is an arbitrary non-deterministic program $\overline{pp} \in \overline P$. The operation can only have one result $R_{filter} = \\{\checkmark\\}$. For any subset of states $M_v \subseteq M$, the computation $ filter_{\overline{pp}}(M_v)$ terminates if and only if for each $m \in M$, it can be determined whether there is a node $(w, M_w)$ in the computation tree $\overline{pp}$ over $M_v$ such that $m \in M_w$ and $\overline{op}^w(m) = \blacktriangledown$. The resulting $filter_{\overline{pp}}(M_v) = \\{(m, \checkmark)\\}$ collects at the output all $m$ determined as terminal. If it is impossible to determine the terminality of any state, the computation $filter_{\overline{pp}}(M_v)$ does not terminate.

Here it becomes obvious that we define the semantics of additional operations through logical means, and, generally speaking, it is difficult to imagine a real device capable of performing the described computations - we are essentially talking about algorithms that iterate over the spaces of all possible states of the abstract machine, which for any interesting cases is clearly beyond the possible.

However, the use of the above semantics for algorithm specification does not imply the necessity of actually building computation trees - it is enough for us to be able to reason about their properties.

## Problem

Let's consider the following example, written in a syntax that slightly extends Rust with a set of imaginary (for now) keywords:

```rust
type sf = fn(&mut [i32]);

fn count_values(arr: &[i32], val: i32) -> usize {
	arr.iter().filter(|&&x| x == val).count()
}

total fn preserving_count(func : sf) {
	let arr = Vec<i32>::undef();
	let val = i32::undef();

	let before = count_values(&arr, val);
	func(&mut arr);
	let after = count_values(&arr, val);
	
	assert!(before == after);
}

total fn procuring_sorted(func: sf) {
	let arr = Vec<i32>::undef();

	func(&mut arr);

	let i = usize::undef();
	let j = usize::undef();

	filter {
		assert!(i < j);
		assert!(j < arr.len());
	}

	assert!(arr[i] <= arr[j]);
}

fn proof() {
	verify preserving_count(foobar);
	verify procuring_sorted(foobar);

	println!("foobar is a _______ function");
}
```

In this code, you can see three new keywords (`total`, `filter`, `verify`) and several calls to the function `::undef()`, associated with an unknown trait of primitive types. Let's go through them in order:

- The keyword `total` declares that the block following it (or, in this case, the body of the function marked by it) performs a non-deterministic computation in the semantics of the eponymous operation. A total block, upon gaining control, completes successfully and without any side effects only if each of its allowable computations completes successfully.
- The keyword `filter` also performs a non-deterministic computation of the corresponding operation over the block following it. A filtering block, upon gaining control, retains only those computations that complete successfully.
- The keyword `verify` ensures the executability of a non-deterministic block in a given deterministic context. Here, for example, its application to calls of functions with total bodies means that the machine must check whether their computation is guaranteed to complete successfully on each input state where the parameter `func` refers to the function `foobar`. If the check is successful, the machine transfers control to the next instruction without changing its state.
- The function `undef` is defined in a trait that can be formulated as a one-liner `trait Undefinable { fn undef() -> Self where Self: Sized; }`, and its behavior can be specified as - the computation `T::undef()` is guaranteed to complete and can return any representative of type `T`.

It is quite obvious that it is extremely difficult to imagine a real compiler or interpreter for such a modified Rust - executing non-deterministic blocks with the described semantics essentially implies solving tasks that reduce to the halting problem.

In practice, this means that no algorithm could automatically produce the required computation for any syntactically correct code beyond extremely limited cases of totality by construction (fixpoint functions with a decreasing argument on inductive data structures, for example).

Nevertheless, we can hypothetically ask ourselves, "If we had a way to ensure that the call to the `proof()` function successfully completes with the call to `println!(...)`, what would that tell us about the behavior of the `foobar` function?"

So that readers can try to solve this simple puzzle on their own, the text of the diagnostic message contains a blank, which you can easily fill in by determining what properties of the argument are evidenced by the executability of `preserving_count(foobar)` and `procuring_sorted(foobar)`. The curious can stop now and think, while the rest will find the solution in the next section.

## Solution

Let's start with analyzing `verify preserving_count(foobar)`. When verifying a block with total semantics, the input set of states consists of a single element - the current state of the deterministic computation in which the call was made. We only know about it that the parametric variable `func` refers to `foobar` in it. After executing

```rust
	let arr = Vec<i32>::undef();
	let val = i32::undef();
```

 according to the `undef` specification, the local variable `arr` can contain absolutely any vector of 32-bit integers (both its length and content are arbitrary), and the local variable `val` can be any 32-bit integer. Thus, the set of reachable states at this point of the non-deterministic block becomes non-degenerate. Next, we proceed to the computation

```rust
	let before = count_values(&arr, val);
	func(&mut arr);
	let after = count_values(&arr, val);
```

Since only classical deterministic functions are called here, the computation on each reachable state is performed independently. For all conceivable combinations, we first count how many times `val` occurs in `arr`, then call `func`, somehow changing the content of `arr`, and then recount `val` in it.

If the call to `func(&mut arr)` does not terminate or is interrupted by an invalid operation on at least one input, then according to the semantics of the total block, the entire non-deterministic computation cannot be successful, and further reasoning loses its meaning.

If this does not happen, the set of reachable states does not change quantitatively, but in each of its elements, new local variables `before` and `after` appear, containing the corresponding count results.

Finally, our non-deterministic computation completes with the check

```rust
	assert!(before == after);
```

Since each reachable state must independently pass this check, we can make a justified conclusion that the `foobar` function must preserve the count of elements in the arrays on which it is called, i.e., it only permutes their elements.

Let's remember this fact and move on to analyzing `verify procuring_sorted(foobar)`. 

The called total function, again, starts with

```rust
	let arr = Vec<i32>::undef();

	func(&mut arr);
```

i.e., assigning the local variable an arbitrary array and applying the `foobar` function to its content. Then follows

```rust
	let i = usize::undef();
	let j = usize::undef();

	filter {
		assert!(i < j);
		assert!(j < arr.len());
	}
```

where we see the first use of the `filter` keyword. Here, we first introduce two local indices with unknown values, and then, according to the semantics of the filtering block, we consider all computations that fail at least one of the asserts as successfully completed.

Since premature successful termination of the computation cannot affect the totality of the outer block, we only need to check the situations where `i` and `j` are different and ordered indices of the `arr` array. The final computation

```rust
	assert!(arr[i] <= arr[j]);
```

thus indicates that after applying the `foobar` function to any array, all elements in it end up being ordered in ascending order.

At this point, most readers have probably already solved the puzzle. So, what do we usually call an algorithm that performs some manipulations on an arbitrary array such that:
- the array's element count is preserved;
- the array becomes sorted.

Let's fill in our answer in the diagnostic message of the `proof` function:

```rust
	println!("foobar is a sorting function");
```

Indeed, if we had an interpreter capable of executing code in the extended Rust with the described non-deterministic semantics, then the appearance of this line on the screen would be an unequivocal indication that `foobar` can only be a sorting function.

Most notably, the reasoning by which we arrived at this conclusion is in no way invalidated by the fact that the above-described interpreter for non-deterministic code does not actually exist.

## Unrelated-machines scheduling example

Consider another example of widely used algorithms of processing tasks on machines. The input consists of a finite set of tasks $N$, a finite set of machines $M$, and natural numbers $p_{i,j} \in \mathbb{Z}$ representing the duration of task $i \in N$ on machine $j \in M$. We need to find a mapping $f : N \to M$ such that 
$$\max_{j \in M} \sum_{i \in N} \left[f(i) = j\right] p_{i,j}$$ 
is minimized [[3]].

```rust
// Specified function takes n*m array of p_{i,j} and outputs its
// solution into the second array of size n. Return value is
// minimax that solution aims to optimize.
type sf = fn(&[u32], &mut [usize]) -> u32;

// Checks validity of input.
fn valid_input(p: &[u32], n: usize) {
	let nm = p.len();

	assert!(nm > 0); // p must be non-empty
	assert!(nm % n == 0); // p must be rectangular

	let m = nm / n;

	for j in 0..m {
		let mut acc: u32 = 0;

		for i in 0..n {
			let old = acc;
			acc += p[i * m + j];
			// sum of p_{*,j} must not overflow u32
			assert!(acc >= old);
		}
	}
}

// Calculates minimax of solution candidate.
fn calculate(p: &[u32], f: &[usize]) -> u32 {
    let m = p.len() / f.len();
    // array of running sums for each j
    let mut res: Vec<u32> = vec![0; m];

    for (i, &fi) in f.iter().enumerate() {
	    assert!(fi < m);
        res[fi] += p[i * m + fi];
    }

    res.iter().max().unwrap()
}

// Specification of globally optimal solution.
total fn optimal(func: sf) {
	let p = Vec<u32>::undef();
	let mut f = Vec<usize>::undef();
	let n = f.len();

	// checking input
	filter valid_input(&p, n);

	// running specified function
	let r = func(&p, &mut f);

	// ensuring return value is correct
	assert!(r == calculate(&p, &f));

	// generating all other possible solutions
	for i in 0..n { f[i] = usize::undef(); }

	// ensuring that the candidate solution is the best
	assert!(r <= filter calculate(&p, &f));
}

fn proof() {
	verify optimal(foobar);

	println!("foobar is an unrelated-machines scheduler");
}
```

## Conclusion

Thanks to the rigor of our reasoning, the presented code can serve as a formal specification for a sorting function, comparable to predicate logic statements from the previous article. Moreover, the notation naturally extends a tool already familiar to programmers, making the barrier to understanding such specifications significantly lower. Programmers without a mathematical background can more easily grasp the semantics of non-deterministic computations compared to predicate logic.

However, it should be understood that to truly confirm the behavior of a specific function against such a specification, additional tools in the form of proof assistants, which operate with logical formalisms, will still be necessary. We will continue the discussion of this topic in the next article.

## References

- [Program Verification: Background and Notation][1]
- [Total functional programming. _wiki_][2]
- [Unrelated-machines scheduling. _wiki_][3]

[1]: {{< ref "/papers/program-verification-background-and-notation" >}}
[2]: https://en.wikipedia.org/wiki/Total_functional_programming
[3]: https://en.wikipedia.org/wiki/Unrelated-machines_scheduling

{{<post-socials telegram_post_id="19" x_post_id="1808780136860561828">}}
