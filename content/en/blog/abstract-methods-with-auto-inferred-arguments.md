+++
title = "Abstract Methods with Auto-Inferred Arguments in Rust"
date = 2025-05-12T10:00:00+09:00
draft = false
math = "katex"
summary = "Demonstrating how to define a single-argument abstract Method trait in Rust, and use a PhantomData-based hint technique to automatically infer generic types."
tags = ["Rust", "Type-Level Programming", "Generic Programming"]
aliases = ["/blog/abstract-methods-with-auto-inferred-arguments"]
+++

**Table of Contents**

- [Introduction](#introduction)
- [Defining the `Method` Trait](#defining-the-method-trait)
- [Implementing `FnOnce` with `CallOwn`](#implementing-fnonce-with-callown)
- [Writing a Generic Method Implementation](#writing-a-generic-method-implementation)
- [Type Argument Inference via the `hint` Technique](#type-argument-inference-via-the-hint-technique)
- [Putting It All Together: Complete Example and Tests](#putting-it-all-together-complete-example-and-tests)
- [Conclusion](#conclusion)

## Introduction

When building highly generic, composable APIs in Rust, it’s often desirable to write **one** abstract method trait that can adapt to different argument bundles and return types, while keeping the user-facing call site minimal. In this post, we’ll explore:

1. How to define a single-argument `Method` trait that works with a cursor-based argument bundle.
2. How to implement a `FnOnce` adapter called `CallOwn` so your methods can be called like normal functions.
3. How to avoid explicit type annotations on every call by leveraging a PhantomData-based **hint** technique for generic argument inference.

By the end, you’ll see how a single generic parameter unlocks a powerful abstraction for defining and invoking methods in a cursor-driven style.

## Defining the `Method` Trait

First, let’s look at the heart of our abstraction: the `Method` trait. It has only **one** generic argument, `A`, which represents the “attic” (or argument-bundle) type, but that type will be inferred automatically. Here’s the definition:

```rust
trait Method {
    /// The cursor types used to read each argument.
    type CurArgs: Curs;
    /// The cursor type used to write the return value.
    type OutputCur: Cursor;
    /// A PhantomData-style hint tying `A` to the argument types.
    type Hint<A: Atts>;
    /// Given an attic `A`, what actual argument tuple do we expect?
    type Args<A: Atts>: Tp;
    /// Given an attic `A`, what return type do we produce?
    type Output<A: Atts>;
    
    /// The one abstract method: takes `Args<A>` and returns `Output<A>`.
    fn method<A: Atts>(self, args: Self::Args<A>) -> Self::Output<A>;
}
```

* `CurArgs` and `OutputCur` describe how to transform between raw cursors and Rust types.
* `Hint<A>` is a zero-sized marker that “links” the abstract attic `A` to the concrete argument tuple.
* `Args<A>` and `Output<A>` are associated types parameterized by `A`.

By restricting the trait to a single generic parameter, we maintain maximum flexibility: any implementor only needs to specify **one** type parameter, and the compiler can infer it via the hint.

## Implementing `FnOnce` with `CallOwn`

To make our methods callable like normal Rust functions (so we can write `call(a, b)` instead of `method::<_>(a, b)`), we wrap them in a struct and implement the compiler’s `"rust-call"` ABI:

```rust
struct CallOwn<M: Method, A: Atts>(M, M::Hint<A>);

impl<M: Method, A: Atts> FnOnce<M::Args<A>> for CallOwn<M, A> {
    type Output = M::Output<A>;

    extern "rust-call" fn call_once(self, args: M::Args<A>) -> Self::Output {
        // Delegates directly to our abstract method
        self.0.method(args)
    }
}
```

Here:

* `CallOwn` holds both the method implementor `M` and the zero-sized hint `M::Hint<A>`.
* The `FnOnce` impl makes it possible to do `CallOwn(Name, hint())(args…)`.

## Writing a Generic Method Implementation

Let’s see how you’d actually implement `Method` for a specific operation. In this example, we define a method named `"test01"` that takes two inputs—a `u8` and a `u64`—and returns their sum as a `u64`-wrapped type:

```rust
const _: () = {
    // Helpers to extract the first and second elements of an Attic tuple.
    type Arg1<A> = UHead<A>;
    type Arg2<A> = UHead<UTail<A>>;

    impl Method for Name<"test01"> {
        // We read the first arg as u8, second as u64
        type CurArgs = Cons<IntoU8Cur, Cons<IntoU64Cur, Nil>>;
        // We write the result as u64
        type OutputCur = IntoU64Cur;

        // Hint ties A to the two-element tuple (Arg1<A>, Arg2<A>)
        type Hint<A: Atts> = Ph<(A, Cons<Arg1<A>, Cons<Arg2<A>, Nil>>)>;
        
        // These are the actual argument types we expect
        type Args<A: Atts> = (Cratic<IntoU8Cur, Arg1<A>>, Cratic<IntoU64Cur, Arg2<A>>);
        // This is our return type
        type Output<A: Atts> = Cratic<IntoU64Cur, impl Attic>;

        fn method<A: Atts>(self, args: Self::Args<A>) -> Self::Output<A> {
            // Extract the values and compute
            let a = args.0 .0.into();
            let b = args.1 .0.into();
            Cratic::<_, IntoU64Att<u64>>((a as u64) + b)
        }
    }
};
```

Key points:

* We set up `CurArgs` and `OutputCur` using our cursor conversion types (`IntoU8Cur`, `IntoU64Cur`).
* The `Hint` ensures that the attic type `A` *must* unify with a two-element list whose heads correspond to our two parameters.
* Within `method`, we simply convert cursors into Rust values, perform the operation, then wrap the result back into a `Cratic`.

## Type Argument Inference via the `hint` Technique

Rust normally requires you to specify generic parameters when calling an associated method. To avoid this verbosity, we use a small `const fn` that returns our `Ph` hint:

```rust
#[allow(dead_code)]
const fn hint<A>() -> Ph<(A, A)> {
    Ph
}
```

This `hint()` call carries no runtime cost but forces the compiler to equate the two `A` types—one coming from the method implementor, and one from the call site—thus inferring `A` automatically.

## Putting It All Together: Complete Example and Tests

Here’s a test demonstrating two chained calls, with no explicit type annotations:

```rust
#[test]
fn testprog() {
    // Prepare two Cratic values with IntoU8Att and IntoU64Att wrappers
    let a = Cratic::<_, IntoU8Att<u8>>(1_u8);
    let b = Cratic::<_, IntoU64Att<u64>>(2_u64);

    // Call the "test01" method: u8 + u64 => u64
    let c = CallOwn(Name::<"test01">, hint())(a, b);

    // Imagine we have another Method named "test02" that takes a single u64
    let d = CallOwn(Name::<"test02">, hint())(c);

    // Verify the final result
    assert_eq!(103_u64, d.0.into());
}
```

And you can try it yourself:

* [Playground (nightly, debug)](https://play.rust-lang.org/?version=nightly&mode=debug&edition=2021&gist=61dae45291daf09905ab47ad9d89cb47)
* [Gist](https://gist.github.com/rust-play/61dae45291daf09905ab47ad9d89cb47)

## Conclusion

By defining a single-generic-argument `Method` trait, coupled with a zero-sized PhantomData hint, you can:

* Keep each method implementation focused on cursor conversion and business logic.
* Eliminate repetitive generic annotations at call sites.
* Seamlessly integrate your methods into Rust’s `FnOnce` ecosystem via `CallOwn`.

This pattern combines the power of Rust’s type system with ergonomic call syntax, opening the door to more abstract, composable APIs in cursor-based designs. Happy coding!

If you like this blog you may find [Simplifying Continuation-Passing Style (CPS) in Rust]({{< ref "/blog/simplifying-continuation-passing-style-in-rust" >}}) interesting as well.


{{<post-socials page_content_type="blog" telegram_post_id="31">}}
