+++
title = "Rust における自動推論可能な抽象メソッド"
date = 2025-05-18T14:30:00+09:00
draft = false
math = "katex"
summary = "PhantomData ベースのヒント技法を用いてジェネリクスを自動推論し、カーソルベースの抽象 `Method` トレイトを定義する方法を解説します。"
tags = ["Rust", "型レベルプログラミング", "ジェネリックプログラミング"]
aliases = ["/blog/abstract-methods-with-auto-inferred-arguments"]
+++

**目次**

- [はじめに](#はじめに)
- [`Method`トレイトの定義](#methodトレイトの定義)
- [汎用的なメソッド実装の記述](#汎用的なメソッド実装の記述)
- [`hint`技法による型引数の推論](#hint技法による型引数の推論)
- [まとめ：完全な例とテスト](#まとめ完全な例とテスト)
- [結論](#結論)

## はじめに

Rust で高い汎用性と再利用性を追求する API を設計する際、呼び出し時に余分な型注釈を要求しない抽象メソッドを提供できると非常に便利です。本記事では次の点を解説します。

1. ジェネリック引数を **1つだけ** に絞り、カーソルベースの引数バンドルを扱う `Method` トレイトの定義方法  
2. メソッドを通常の関数呼び出しのように扱うための `CallOwn` と `"rust-call"` ABI を使った `FnOnce` 実装  
3. さらに型注釈を一切省略可能にする、PhantomData ベースの **ヒント** 技法による型引数の自動推論  

これらを組み合わせることで、最小限の記述で強力な抽象化を実現します。

## `Method`トレイトの定義

まずは本題となる `Method` トレイトを見てみましょう。ジェネリック引数は **1つだけ**、`A`（アティック／引数バンドル型）です。ですが呼び出し時に明示する必要はありません。

```rust
trait Method {
    /// 引数を読み取るためのカーソル列
    type CurArgs: Curs;
    /// 戻り値を書き込むためのカーソル
    type OutputCur: Cursor;
    /// `A` と実際の引数型を紐づけるためのヒント
    type Hint<A: Atts>;
    /// アティック `A` から得られる、実際の引数タプル型
    type Args<A: Atts>: Tp;
    /// アティック `A` から得られる、戻り値の型
    type Output<A: Atts>;

    /// 唯一の抽象メソッド
    fn method<A: Atts>(self, args: Self::Args<A>) -> Self::Output<A>;
}

* `CurArgs`／`OutputCur` でカーソルと Rust 型の変換方法を定義
* `Hint<A>` がゼロサイズのマーカーとして `A` と具象引数を結びつける
* `Args<A>`／`Output<A>` はアティック `A` に依存した関連型

ジェネリックを 1 つに限定することで、実装側は型パラメータを最小限に抑えつつ、呼び出し側はヒントにより推論だけで済みます。

## `CallOwn`での `FnOnce` 実装

トレイトのメソッドを `call(a, b)` のように呼び出せるよう、`CallOwn` を定義し、Rust の `"rust-call"` ABI を用いて `FnOnce` を実装します。

```rust
struct CallOwn<M: Method, A: Atts>(M, M::Hint<A>);

impl<M: Method, A: Atts> FnOnce<M::Args<A>> for CallOwn<M, A> {
    type Output = M::Output<A>;

    extern "rust-call" fn call_once(self, args: M::Args<A>) -> Self::Output {
        // 抽象メソッドに委譲
        self.0.method(args)
    }
}
```

* `CallOwn` は実装者 `M` とヒント `M::Hint<A>` を保持
* `FnOnce` 実装で `(args…)` の形でそのまま呼び出し可能に

## 汎用的なメソッド実装の記述

例として、`"test01"` というメソッドを実装してみます。`u8` と `u64` を受け取り、合計を `u64` で返すケースです。

```rust
const _: () = {
    // アティックから最初と2番目の要素を取り出すヘルパー
    type Arg1<A> = UHead<A>;
    type Arg2<A> = UHead<UTail<A>>;

    impl Method for Name<"test01"> {
        type CurArgs = Cons<IntoU8Cur, Cons<IntoU64Cur, Nil>>;
        type OutputCur = IntoU64Cur;
        // アティック型 A を 2 要素タプルに固定するヒント
        type Hint<A: Atts> = Ph<(A, Cons<Arg1<A>, Cons<Arg2<A>, Nil>>)>;
        // 実際の引数は Cratic<カーソル, 型>
        type Args<A: Atts> = (Cratic<IntoU8Cur, Arg1<A>>, Cratic<IntoU64Cur, Arg2<A>>);
        // 戻り値も Cratic<カーソル, Attic>
        type Output<A: Atts> = Cratic<IntoU64Cur, impl Attic>;

        fn method<A: Atts>(self, args: Self::Args<A>) -> Self::Output<A> {
            let a = args.0 .0.into();
            let b = args.1 .0.into();
            Cratic::<_, IntoU64Att<u64>>((a as u64) + b)
        }
    }
};
```

* `CurArgs`／`OutputCur` でカーソル型を指定
* `Hint` によってアティック `A` が必ず 2 要素タプルと等価になるよう強制
* `method` 内で値を取り出し、計算後に再び `Cratic` に包んで返却

## `hint`技法による型引数の推論

通常はメソッド呼び出し時に型注釈が必要ですが、以下の小さな `const fn` を使うことで、型 `A` を自動推論させます。

```rust
#[allow(dead_code)]
const fn hint<A>() -> Ph<(A, A)> {
    Ph
}
```

`hint()` は実行時コストゼロのゼロサイズ値であり、内部で `A` が等価であることをコンパイラに示します。

## まとめ：完全な例とテスト

以下のテストでは、型注釈ゼロでメソッドを連鎖呼び出ししています。

```rust
#[test]
fn testprog() {
    let a = Cratic::<_, IntoU8Att<u8>>(1_u8);
    let b = Cratic::<_, IntoU64Att<u64>>(2_u64);

    // "test01": u8 + u64 → u64
    let c = CallOwn(Name::<"test01">, hint())(a, b);

    // 仮に "test02" が u64 を受け取る別メソッドだとすると
    let d = CallOwn(Name::<"test02">, hint())(c);

    assert_eq!(103_u64, d.0.into());
}
```

* [Playground (nightly, debug)](https://play.rust-lang.org/?version=nightly&mode=debug&edition=2021&gist=61dae45291daf09905ab47ad9d89cb47)
* [Gist](https://gist.github.com/rust-play/61dae45291daf09905ab47ad9d89cb47)

## 結論

* ジェネリックを **1つだけ** に絞った `Method` トレイトで抽象化を単純化
* PhantomData ベースの `Hint` で呼び出し時の型注釈を完全に排除
* `CallOwn` による `FnOnce` 実装で通常の関数のように呼び出し可能

これにより、Rust の型システムとエルゴノミクスを両立した、カーソルベースの高度に抽象化された API 設計が可能になります。Happy coding!

この投稿が気に入った方は、[Rust における継続渡しスタイル (CPS) の簡略化]({{< ref "/blog/simplifying-continuation-passing-style-in-rust" >}}) もぜひご覧ください。

{{<post-socials language="jp" page_content_type="blog" telegram_post_id="33" x_post_id="1923983939150152060">}}
{{<ai-translated>}}
