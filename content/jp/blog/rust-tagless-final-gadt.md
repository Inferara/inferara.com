+++
title = "Rust で試す Tagless Final ― GADT による初期エンコーディングから最適化まで"
date = 2025-06-03T10:00:00+09:00
draft = false
math = "none"
summary = "GADT ベースの初期エンコーディングから never 型を活用したゼロコスト抽象化、完全インライン化による最適化まで解説します。"
tags = ["Rust", "Tagless Final", "GADT", "Zero-Cost Abstraction"]
aliases = ["/blog/rust-tagless-final-gadt"]
+++

**目次**

- [はじめに](#はじめに)
- [Tagless Final と初期エンコーディング](#tagless-final-と初期エンコーディング)
- [例：`expr` 関数とアセンブリ出力](#例expr-関数とアセンブリ出力)
- [GADT インタプリタの実装](#gadt-インタプリタの実装)
- [コア構造：`Enum`, `NGuard`, `CGuard`, `Repr`](#コア構造enum-nguard-cguard-repr)
- [カーソル＆アティック：`Cursor`／`Attic` トレイト](#カーソルアティックcursorattic-トレイト)
- [never 型 vs `()` タプル：ゼロコストの鍵](#never-型-vs--タプルゼロコストの鍵)
- [完全インライン化と最適化結果](#完全インライン化と最適化結果)
- [まとめと今後の展望](#まとめと今後の展望)

### はじめに

Haskell の Tagless Final は、DSL を初期・最終エンコーディングの両面で型安全に扱える手法です。本記事ではまず Rust で GADT 相当の enum と [never](https://doc.rust-lang.org/std/primitive.never.html) 型を使い、初期エンコーディングを再現します。その後、never 型でタグを排除してゼロコストを実現し、さらに `#[inline(always)]` で完全にインライン化し、生成アセンブリを可視化します。

### Tagless Final と初期エンコーディング

初期エンコーディングでは AST を直接 `enum` で表現します。Rust の never 型 (`!`) コンストラクタを使うことで、タグレスながらパターンマッチ可能な設計が実現します。

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

### 例：`expr` 関数とアセンブリ出力

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

中間コードなしで一つの関数に全展開。

### GADT インタプリタの実装

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

### コア構造：`Enum`, `NGuard`, `CGuard`, `Repr`

```rust
use NGuard as Ng;

pub struct Gadt<Cur: Cursor, Att: Attic>(
    Enum<Cur::_V01<Att>, Cur::_V02<Att>, Cur::_V03<Att>, Cur::_V04<Att>, Cur, Att>,
);

pub enum Enum<V01: Ng, V02: Ng, V03: Ng, V04: Ng, Cur: Cursor, Att: Attic> {
    __Ph__(!, Ph<(V01, V02, V03, V04, Cur, Att)>),
    IntConst(V01, V01::NGuard<isize, Cur, cu::Int, Att>),
    Lambda(/* ... */),
    Apply(/* ... */),
    Add(/* ... */),
}
```

### カーソル＆アティック：`Cursor`／`Attic` トレイト

```rust
pub trait Cursor {
    type Sol<Att: Attic> = ();
    type _V01<Att: Attic>: NGuard = Att::_V01;
    /* ... */
}

pub trait Attic {
    type Fun<Dom, Cod>: FnOnce(Dom) -> Cod = fn(Dom) -> Cod;
    type _V01: NGuard = !;
    /* ... */
}
```

### never 型 vs `()` タプル：ゼロコストの鍵

never 型を `((),)` に置き換えると大きなスタック操作と呼び出しが挿入されます。

```rust
impl NGuard for ((),) {
    const DEFAULT: Self = unreachable!();
}
```

### 完全インライン化と最適化結果

`#[inline(always)]` でインライン化すると：

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

解釈オーバーヘッドが完全消失。

### まとめと今後の展望

* GADT＋never 型で Rust でも Tagless Final 初期エンコーディングが可能。
* never 型でタグ排除、ゼロコスト達成。
* `#[inline(always)]` でインタプリタを一関数に統合。

{{<post-socials language="jp" page_content_type="blog" telegram_post_id="29" x_post_id="1899760615893434710">}}
{{<ai-translated>}}
