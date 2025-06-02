+++
title = "Tagless Final in Rust: From Initial Encoding with GADT to Optimizations"
date = 2025-06-03T10:00:00+09:00
draft = false
math = "katex"
summary = "Demonstrating Tagless Final in Rust with GADT-based initial encoding, never-type zero-cost abstractions, and full inlining optimizations."
tags = ["Rust", "Tagless Final", "GADT", "Zero-Cost Abstraction"]
aliases = ["/blog/rust-tagless-final-gadt"]
+++


## English Version

**Table of Contents**

- [English Version](#english-version)
  - [Introduction](#introduction)
  - [Tagless Final \& Initial Encoding](#tagless-final--initial-encoding)
  - [Example: `expr` and Assembly Output](#example-expr-and-assembly-output)
  - [Implementing the GADT Interpreter](#implementing-the-gadt-interpreter)
  - [Core GADT Components: `Enum`, `NGuard`, `CGuard`, `Repr`](#core-gadt-components-enum-nguard-cguard-repr)
  - [Cursor \& Attic Traits](#cursor--attic-traits)
  - [Never Type vs `()` Tuple for Zero-Cost](#never-type-vs--tuple-for-zero-cost)
  - [Full Inlining \& Optimized Output](#full-inlining--optimized-output)
  - [Conclusion](#conclusion)

### Introduction

Haskell's Tagless Final is a powerful approach for embedding DSLs both in their initial and final encodings. In this post, we:

1. Reproduce an **initial encoding** in Rust using GADT-like enums and [never](https://doc.rust-lang.org/std/primitive.never.html) types (`!`).
2. Achieve zero-cost abstraction by wiring constructors with never types, avoiding `Box` and runtime tags.
3. Show how `#[inline(always)]` can fully inline the GADT interpreter, yielding streamlined assembly.

### Tagless Final & Initial Encoding

In the initial encoding of Tagless Final, we represent the AST directly. Rust’s `enum` plus never-type constructors lets us write a tagless variant that still supports pattern matching:

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

### Example: `expr` and Assembly Output

Compiling with `-C opt-level=3` produces:

```asm
playground::eval_expr:
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

No intermediate heap allocations, no dynamic dispatch: everything folds into a single function.

### Implementing the GADT Interpreter

We define an `Eval` trait and match over our tagless `Enum`:

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

### Core GADT Components: `Enum`, `NGuard`, `CGuard`, `Repr`

```rust
use NGuard as Ng;

pub struct Gadt<Cur: Cursor, Att: Attic>(
    Enum<Cur::_V01<Att>, Cur::_V02<Att>, Cur::_V03<Att>, Cur::_V04<Att>, Cur, Att>,
);

pub enum Enum<V01: Ng, V02: Ng, V03: Ng, V04: Ng, Cur: Cursor, Att: Attic> {
    __Ph__(!, Ph<(V01, V02, V03, V04, Cur, Att)>),
    IntConst(V01, V01::NGuard<isize, Cur, cu::Int, Att>),
    Lambda(/* omitted for brevity */),
    Apply( /* ... */ ),
    Add(   /* ... */ ),
}
```

* **`NGuard`**: Ensures never-type constructors are zero-sized.
* **`CGuard`**: Suppresses recursive-destructor checks in recursive enums.
* **`Repr`**: Hides direct use of `Gadt` in trait bounds.

### Cursor & Attic Traits

```rust
pub trait Cursor {
    type Sol<Att: Attic> = ();
    type _1: Cursor = ();
    /* ... */
    type _V01<Att: Attic>: NGuard = Att::_V01;
    /* ... */
}

pub trait Attic {
    type Clause: Clause = ();
    type Fun<Dom, Cod>: FnOnce(Dom) -> Cod = fn(Dom) -> Cod;
    type FunAtt: Attic<Clause = Self::Clause> = (Self::Clause,);
    type _V01: NGuard = !;
    /* ... */
}
```

### Never Type vs `()` Tuple for Zero-Cost

Replacing never-type with `((),)` yields huge stack frames and calls:

```rust
impl NGuard for ((),) {
    const DEFAULT: Self = unreachable!();
}
```

Demonstrates why never-type is key: it eliminates unused constructors entirely.

### Full Inlining & Optimized Output

Adding `#[inline(always)]` to `eval` gives:

```asm
playground::eval_expr:
	leaq	(%rdx,%rdx,2), %rax
	leaq	(%rdx,%rax,4), %rax
	addq	%rsi, %rdx
	leaq	(%rdx,%rdx,4), %rcx
	addq	%rdi, %rsi
	leaq	(%rsi,%rsi,2), %rdx
	addq	%rdi, %rsi
	leaq	(%rax,%rsi,2), %rax
	addq	%rdx, %rax
	addq	%rcx, %rax
	retq
```

All interpreter overhead disappears.

### Conclusion

* Rust can emulate Tagless Final’s initial encoding via GADT-like enums and never types.
* never-type constructors remove tag overhead entirely.
* `#[inline(always)]` inlines the interpreter into a single optimized function.

{{<post-socials page_content_type="blog" telegram_post_id="29" x_post_id="1899760615893434710">}}
