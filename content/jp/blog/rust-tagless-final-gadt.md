+++
title = "Rust におけるゼロコストな「タグレスイニシャル」GADTスタイルの Enum"
date = 2025-06-03T12:21:00+09:00
draft = false
summary = "enum と never 型を用いてゼロコスト抽象化を実現する「タグレスイニシャル」パターンの Rust 実装を深掘りし、最適化されたアセンブリ出力を示します。"
tags = ["Rust", "型レベルプログラミング", "ゼロコスト抽象化", "タグレスファイナル", "一般化代数的データ型 (GADT)"]
aliases = ["/blog/rust-tagless-final-gadt"]
+++

**目次**

- [はじめに](#はじめに)
- [タグレスイニシャルエンコーディングの目標](#タグレスイニシャルエンコーディングの目標)
- [最初の例: Rust 式とその アセンブリ](#最初の例-rust-式とその-アセンブリ)
- [インタプリタ: シンプルな `eval` 実装](#インタプリタ-シンプルな-eval-実装)
- [舞台裏の魔法: GADT ライクな Enum](#舞台裏の魔法-gadt-ライクな-enum)
- [コアコンポーネント: `Cursor` と `Attic`](#コアコンポーネント-cursor-と-attic)
- [ゼロコストの証明: `never` 型を用いた実験](#ゼロコストの証明-never-型を用いた実験)
- [結論](#結論)

## はじめに

関数型プログラミングの世界において、「タグレスファイナル（Tagless Final）」パターンは、組み込みドメイン固有言語（DSL）を構築するための非常に優れた抽象化技法です。このパターンでは、言語の操作を定義するインターフェースを作成し、評価、整形表示、最適化など複数のインタプリタを、コアとなるプログラムロジックを変更することなく実装できます。

システム言語である Rust でこのような高レベル抽象を取り入れる際の鍵は、その「ゼロコスト性能」という約束を犠牲にしないことです。本記事では、Generalized Algebraic Data Types（GADT）を活用した「タグレスイニシャル（Tagless Initial）」の変種を Rust で実装し、型レベルプログラミングを駆使して表現力豊かな構造を構築しつつ、最終的にはコンパイラがそれらを完全に消去し、最適化されたアセンブリコードを生成する様子を示します。

## タグレスイニシャルエンコーディングの目標

「タグレスイニシャル」エンコーディングは、Serokell の [Introduction to Tagless Final](https://serokell.io/blog/introduction-tagless-final) などで説明されているように、式を表現するために GADT を利用する手法です。Haskell では次のように定義されます。

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

ここで、`Expr a` の型は、その式が生成する値の型 `a` と強く結びついています。本稿の目標は、この構造と `eval` 関数を Rust で再現し、最終的に計算結果だけが残り、抽象部分が完全に消去されたアセンブリが得られることを確かめることです。

## 最初の例: Rust 式とその アセンブリ

さっそく見てみましょう。以下は、GADT スタイルで表現された Rust における複雑な式を構築する関数です。整数定数やラムダ（高階ラムダを含む）、および適用を定義しています。

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

一見すると膨大で複雑な構造ですが、リリースモードでコンパイルし、`eval_expr` のアセンブリを確認すると驚くべき結果が得られます。

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

式ツリーやラムダ、`apply` の呼び出しといったすべての抽象部分が、`leaq` や `addq` といった単純な算術命令の列にまで削ぎ落とされています。インタプリタループも動的ディスパッチもメモリアロケーションも一切含まれていません。まさに「ゼロコスト」という約束が果たされているのです。

## インタプリタ: シンプルな `eval` 実装

どのようにしてこの結果を得られるのでしょうか？評価ロジックは `Eval` トレイトで定義されています。`Gadt` 型に対する実装は、内部を `match` し、再帰的に `eval` を呼び出すだけのシンプルなものです。

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

一見すると、通常のインタプリタにおけるランタイムオーバーヘッドを伴う実装のように思えます。しかし、最適化の要点はこの `Gadt` と `Enum` の定義方法にあります。

## 舞台裏の魔法: GADT ライクな Enum

このテクニックの核心は、Rust の `never` 型（`!`）を用いて、ある型シグネチャに対して同時に構築可能な `enum` のバリアントを一つだけに制限することです。これにより、実際には「タグ」が存在しないように振る舞わせることができます。コンパイラは、どのバリアントが生成されるかをコンパイル時に完全に把握できるため、不要な分岐を排除します。

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

`V01` から `V04` までの型は `Attic` トレイトによって制御されます。これらを `!` に設定することで、対応するバリアントがそもそも構築不可能になります。なぜなら、`!` 型の値は存在しないためです。コンパイラはこのコードパスが絶対に到達しないことを保証できるため、実質的に「タグ」を持たない `enum` として扱うことが可能になります。さらに、`NGuard` トレイトは、`!` によって無効化されたバリアントのサイズを 0 にする役割を果たし、一つだけ有効なバリアントのサイズに `enum` 全体を畳み込みます。

## コアコンポーネント: `Cursor` と `Attic`

この仕組みを成立させる主要なトレイトが `Cursor` と `Attic` です。この二つは型レベルでの設定情報をやり取りしながら、どのバリアントを有効化するかを制御します。

* **`Attic`**: 各 `Enum` コンストラクタを無効化するためのデフォルトを定義します。デフォルトではすべての `_V*` 型が `!` に設定され、すべてのバリアントが無効となります。特定のバリアントを有効にするには、`Attic` の実装で対応する `_V*` に別の型を与えます。
* **`Cursor`**: `Attic` から設定情報を受け取り、式ツリーの各ノードでどのバリアントを有効にするかを型レベルで選択します。

```rust
pub trait Attic {
    // デフォルトではすべて `!`
    type _V01: NGuard = !;
    type _V02: NGuard = !;
    type _V03: NGuard = !;
    type _V04: NGuard = !;
    // …他の関連型…
}

pub trait Cursor {
    // `Attic` から設定を取り出す
    type _V01<Att: Attic>: NGuard = Att::_V01;
    type _V02<Att: Attic>: NGuard = Att::_V02;
    type _V03<Att: Attic>: NGuard = Att::_V03;
    type _V04<Att: Attic>: NGuard = Att::_V04;
    // …他の関連型…
}
```

このメカニズムにより、ある時点で有効なバリアントが型レベルで一意に定まり、`eval` のパターンマッチをコンパイル時に完全に決定可能にすることができます。

## ゼロコストの証明: `never` 型を用いた実験

もしこの不変条件を壊してしまったらどうなるでしょう？ここで実験を行います。`Attic` トレイトのデフォルトを `!` ではなく、ゼロサイズ型 `((),)` に置き換えてみます。これにより、理論上はすべてのバリアントが構築可能になります。

```rust
// Attic のデフォルトを変更:
// from: type _V01: NGuard = !;
// to:   type _V01: NGuard = ((),); // 同様に V02, V03, V04 も同様に
```

すると、コンパイラはどのバリアントが実際に使われるかを保証できなくなり、タグ（判別子）を持たせる必要が生じます。その結果、生成されるアセンブリは爆発的に増加します。

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

このように、`eval` を呼び出す命令が明示的に挿入され、抽象化がランタイム解釈されるようになってしまいます。この事実から、`never` 型がタグレス化を実現し、コンパイラ最適化を保証する重要な要素であることが分かります。

一見すると、`#[inline(always)]` を `eval` に付与することで問題が解消しそうに思えます。実際、単一クレートの単純なケースではインライン展開が最適化を助けることもあります。しかし、複数クレートにまたがる複雑な DSL のネストや、モジュール分割が進む状況では、インライン展開に過度に依存するのは危険です。本質的には、`never` 型を用いることで「構築時点で最適化を約束する」方法の方が、より堅牢で確実なアプローチと言えます。

## 結論

Rust の型システム、特に `never` 型（`!`）を活用することで、「タグレスイニシャル」パターンを実現できることが分かりました。任意の型に対して、同時に構築可能なバリアントを一つだけに制限することで、実質的にタグを排除し、コンパイラが抽象構造全体を消去できるようになります。その結果、複雑な式ツリーも最終的には純粋な算術命令列として出力され、ゼロコスト抽象化が保証されるのです。

この手法は、Rust で高レベルかつ表現力のある DSL を構築しつつ、システム言語としての性能要件を満たすための強力な設計パターンを示しています。ぜひ以下のリンクから実際のコードを試してみてください。

* [Rust Playground](https://play.rust-lang.org/?version=nightly&mode=release&edition=2021&gist=00fa7263e7bce9dcdaf130224ee9a153)
* [Gist with full source](https://gist.github.com/00fa7263e7bce9dcdaf130224ee9a153)


{{<post-socials language="jp" page_content_type="blog" telegram_post_id="34" x_post_id="">}}
{{<ai-translated>}}
