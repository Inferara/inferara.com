+++
title = "Zero-Cost 'Tagless Final' in Rust with GADT-style Enums"
date = 2025-06-03T12:21:00+09:00
draft = false
summary = "A deep dive into implementing the 'tagless initial' pattern in Rust using enums and the never type to achieve zero-cost abstractions, demonstrated with optimized assembly output."
tags = ["Rust", "Type-Level Programming", "Zero-Cost Abstractions", "Tagless Final", "GADT"]
aliases = ["/blog/rust-tagless-final-gadt"]
+++

**Table of Contents**

- [Introduction: The Allure of Tagless Final](#introduction-the-allure-of-tagless-final)
- [The Goal: "Tagless Initial" Encoding](#the-goal-tagless-initial-encoding)
- [A First Look: The Rust Expression and Its Assembly](#a-first-look-the-rust-expression-and-its-assembly)
- [The Interpreter: A Simple `eval` Implementation](#the-interpreter-a-simple-eval-implementation)
- [The Magic Behind the Curtain: GADT-like Enums](#the-magic-behind-the-curtain-gadt-like-enums)
- [Core Components: `Cursor` and `Attic`](#core-components-cursor-and-attic)
- [The Zero-Cost Proof: An Experiment with the `never` Type](#the-zero-cost-proof-an-experiment-with-the-never-type)
- [Conclusion](#conclusion)

## Introduction: The Allure of Tagless Final

In the world of functional programming, the "Tagless Final" pattern is a wonderful abstraction for creating embedded domain-specific languages (DSLs). It allows you to define an interface for your language's operations and then write multiple interpreters (e.g., one to evaluate, one to pretty-print, one to optimize) without changing the core program logic.

A key test for a systems language like Rust is its ability to adopt such high-level abstractions without sacrificing its core promise: zero-cost performance. This post explores how to implement the "tagless initial" variant of this pattern, which relies on Generalized Algebraic Data Types (GADTs), in Rust. We will demonstrate that with careful type-level programming, we can build these expressive structures and have the compiler completely erase them, resulting in optimal assembly code.

## The Goal: "Tagless Initial" Encoding

The "tagless initial" encoding, as described in resources like Serokell's [Introduction to Tagless Final](https://serokell.io/blog/introduction-tagless-final), uses a GADT to represent expressions. In Haskell, it looks like this:

```haskell
data Expr a where
    IntConst :: Int                       -> Expr Int
    Lambda   :: (Expr a -> Expr b)        -> Expr (Expr a -> Expr b)
    Apply    :: Expr (Expr a -> Expr b)   -> Expr a -> Expr b
    Add      :: Expr Int -> Expr Int      -> Expr Int

eval :: Expr a -> a
eval (IntConst x) = x
eval (Lambda f)   = f
eval (Apply f x)  = eval (eval f x)
eval (Add l r)    = (eval l) + (eval r)
```

Notice that the type of the expression `Expr a` is tied to the type of value it will produce (`a`). Our goal is to replicate this structure and its `eval` function in Rust and verify that it compiles down to nothing but the computed result.

## A First Look: The Rust Expression and Its Assembly

Let's dive right in. Here is a Rust function that constructs a complex expression using our GADT-style encoding. It defines several integer constants, lambdas (including a higher-order one), and applications.

```rust
fn expr(u: isize, v: isize, w: isize) -> Gadt<cu::Int, impl Attic> {
    let a = int_const(u);
    let b = int_const(v);
    let c = add::<(), _, _>(a, b);
    let d = lambda::<(), _, _, _, _, _>(move |x| {
        let a = int_const(u * 2 + v * 3 + w * 5);
        add::<(), _, _>(a, x)
    });
    let e = apply::<(), _, _, _>(d, c);
    let f = lambda::<(), _, _, _, _, _>(move |x| {
        let a = int_const(u * 3 + v * 5 + w * 13);
        add::<(), _, _>(add::<(), _, _>(a, x), c)
    });
    let j = lambda::<(), _, _, _, _, _>(move |x: Gadt<_, _>| -> Gadt<_, _> {
        apply::<(), _, cu::Int, _>(x, e)
    });
    apply::<(), _, _, _>(j, f)
}

#[inline(never)]
pub extern "C" fn eval_expr(u: isize, v: isize, w: isize) -> isize {
    expr(u, v, w).eval()
}
```

This looks like a heavy, complex structure. However, when we compile this in release mode and inspect the assembly for `eval_expr`, we see something magical:

```asm
playground::eval_expr: # @playground::eval_expr
# %bb.0:
	leaq	(%rdx,%rdx,2), %rax
	leaq	(%rdx,%rax,4), %r8
	addq	%rsi, %rdx
	leaq	(%rdx,%rdx,4), %rdx
	leaq	(%rsi,%rdi,2), %rax
	leaq	(%rax,%rax,2), %rcx
	leaq	(%rdi,%rsi,2), %rax
	addq	%r8, %rax
	addq	%rdx, %rax
	addq	%rcx, %rax
	retq
```

The entire expression tree, the lambdas, the `apply` calls—it has all been boiled down to a series of arithmetic instructions (`leaq`, `addq`). There is no interpreter loop, no dynamic dispatch, no memory allocation. This is the "zero-cost" promise fulfilled.

## The Interpreter: A Simple `eval` Implementation

How is this possible? The evaluation logic is defined in an `Eval` trait. Its implementation for our `Gadt` type is a simple `match` statement that recursively calls `eval` on its components.

```rust
pub trait Eval<Cur: Cursor, Att: Attic> {
    fn eval(self) -> SolOf<Cur, Att>;
}

impl<Cur: Cursor, Att: Attic> Eval<Cur, Att> for Gadt<Cur, Att> {
    fn eval(self) -> SolOf<Cur, Att> {
        match self.0 {
            Enum::IntConst(v01, a) => v01.vu_cast::<_, _, _, _>(&a)(v01.get(a)),
            Enum::Lambda(v02, f) => v02.vu_cast::<_, _, _, _>(&f)(v02.get(f)),
            Enum::Apply(v03, t) => v03._vu_cast::<_, _, _, _, _>(&t)({
                let (f, a) = v03.get(t);
                let f = f.eval();
                f(a).eval()
            }),
            Enum::Add(v04, t) => v04.vu_cast::<_, _, _, _>(&t)({
                let (a, b) = v04.get(t);
                let a = a.eval();
                let b = b.eval();
                a + b
            }),
        }
    }
}
```

At first glance, this looks like a standard interpreter that would involve runtime overhead. The key to its optimization lies in the definition of the `Gadt` and `Enum` types.

## The Magic Behind the Curtain: GADT-like Enums

The core of this technique is an `enum` that uses Rust's `never` type (`!`) to ensure that for any given type signature, only one variant is actually constructible. This effectively removes the "tag" from the enum, as the compiler knows at compile time which variant is in use.

```rust
pub struct Gadt<Cur: Cursor, Att: Attic>(
    Enum<Cur::_V01<Att>, Cur::_V02<Att>, Cur::_V03<Att>, Cur::_V04<Att>, Cur, Att>,
);

pub enum Enum<V01: Ng, V02: Ng, V03: Ng, V04: Ng, Cur: Cursor, Att: Attic> {
    __Ph__(!, Ph<(V01, V02, V03, V04, Cur, Att)>),
    IntConst(V01, V01::NGuard<isize, Cur, cu::Int, Att>),
    Lambda(
        V02,
        V02::NGuard<
            Att::Fun<ReprOf<Att, Cur::_1, Att::_1>, ReprOf<Att, Cur::_2, Att::_2>>,
            Cur,
            cu::ReprFun<Cur::_1, Cur::_2>,
            Att,
        >,
    ),
    Apply(
        V03,
        V03::NGuard<
            (
                ReprOf<Att, cu::ReprFun<Att::DomCur, V03::CGuard<Cur>>, Att::FunAtt>,
                ReprOf<Att, Att::DomCur, _1Of<Att::FunAtt>>,
            ),
            Cur,
            V03::CGuard<Cur>,
            _2Of<Att::FunAtt>,
        >,
    ),
    Add(
        V04,
        V04::NGuard<
            (ReprOf<Att, cu::Int, Att::_1>, ReprOf<Att, cu::Int, Att::_2>),
            Cur,
            cu::Int,
            Att,
        >,
    ),
}
```

The types `V01` through `V04` are controlled by the `Attic` trait. By setting these to `!`, we make it impossible to construct the corresponding variant. Since a value of type `!` can never be created, the compiler can prove that code path is unreachable. The `NGuard` trait is a helper that ensures any variant "disabled" with `!` has a size of zero, allowing the `enum` to collapse to the size of its single active variant.

## Core Components: `Cursor` and `Attic`

The two orchestrating traits are `Cursor` and `Attic`. They work together as a type-level configuration system:

* **`Attic`**: This trait holds the actual information about which `Enum` constructors are disabled. In its default state, it sets all `_V*` types to `!`, effectively disabling all variants. To enable a constructor, a specific `Attic` implementation will provide a non-`!` type.
* **`Cursor`**: This trait acts as a filter or view, selecting which configuration from `Attic` to apply at each point in the expression tree.

```rust
pub trait Attic {
    // ... defaults to `!` ...
    type _V01: NGuard = !;
    type _V02: NGuard = !;
    type _V03: NGuard = !;
    type _V04: NGuard = !;
    // ... other associated types ...
}

pub trait Cursor {
    // ... uses the configuration from Attic ...
    type _V01<Att: Attic>: NGuard = Att::_V01;
    type _V02<Att: Attic>: NGuard = Att::_V02;
    type _V03<Att: Attic>: NGuard = Att::_V03;
    type _V04<Att: Attic>: NGuard = Att::_V04;
    // ... other associated types ...
}
```

Through this mechanism, we can construct a `Gadt` type where only one of the `Enum` variants is valid, making pattern matching in `eval` fully predictable at compile time.

## The Zero-Cost Proof: An Experiment with the `never` Type

What happens if we break this invariant? Let's conduct an experiment. We'll replace `!` with a concrete, zero-sized type like `((),)` in our `Attic` trait. This means that all variants are now theoretically constructible.

```rust
// In Attic, we change the default:
// from: type _V01: NGuard = !;
// to:   type _V01: NGuard = ((),); // and for V02, V03, V04
```

Suddenly, the compiler can no longer guarantee which variant is active. It must now include a tag (discriminant) and perform runtime checks. The generated assembly explodes:

```asm
playground::eval_expr: # @playground::eval_expr
# %bb.0:
	pushq	%r15
	pushq	%r14
	pushq	%r13
	pushq	%r12
	pushq	%rbx
	subq	$32, %rsp
    ...
	callq	<playground::Gadt<Cur,Att> as playground::Eval<Cur,Att>>::eval
    ...
	callq	<playground::Gadt<Cur,Att> as playground::Eval<Cur,Att>>::eval
    ...
	popq	%r15
	retq
```

We now see explicit calls to `eval`. The abstraction is no longer zero-cost; it's being interpreted at runtime. This demonstrates that the `never` type is the critical component for achieving taglessness and enabling compiler optimization.

One might think that simply adding `#[inline(always)]` to `eval` could fix this. Indeed, in this simple case, inlining can help the optimizer untangle the calls and produce much better assembly. However, this is not a robust solution. It relies on optimizer heroics and will likely fail in more complex, modular programs where DSLs are nested or defined across different crates. The `never` type approach guarantees the optimization by construction.

## Conclusion

By carefully using Rust's type system, particularly the `never` type (`!`), we can successfully implement the "tagless initial" pattern. We created a `Gadt`-style enum where only one variant is constructible for any given type, effectively removing the need for a runtime tag. This allows the compiler to see through the abstraction entirely, collapsing a complex expression tree into its raw computational equivalent.

This technique provides a powerful blueprint for building high-level, expressive DSLs in Rust without compromising on the performance expectations of a systems language.

You can experiment with the full code yourself:

* [Rust Playground](https://play.rust-lang.org/?version=nightly&mode=release&edition=2021&gist=a49830a2f791787d72b772144047174f)
* [Gist with full source](https://gist.github.com/rust-play/a49830a2f791787d72b772144047174f)

{{<post-socials page_content_type="blog" telegram_post_id="35" x_post_id="1929746607433830602">}}
