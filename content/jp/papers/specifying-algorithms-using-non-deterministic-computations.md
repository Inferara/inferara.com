+++
title = '非決定的計算を用いたアルゴリズムの仕様化'
date = 2024-07-04T10:20:22+05:00
draft = false
math = "katex"
tags = ["プログラム検証", "推論"]
summary = "本記事では、アルゴリズムを仕様化する言語として、非決定的計算の形式主義の使用について議論します。"
aliases = ["/papers/specifying-algorithms-using-non-deterministic-computations"]
+++

## 目次

- [はじめに](#はじめに)
- [非決定性と形式的仕様](#非決定性と形式的仕様)
- [問題](#問題)
- [解決策](#解決策)
- [無関連マシンのスケジューリング例](#無関連マシンのスケジューリング例)
- [結論](#結論)
- [参考文献](#参考文献)

## はじめに

アルゴリズムの形式的検証の普及は、既存の仕様言語とプログラマーが日常的に扱っているものとの間の根本的な違いによって妨げられています。

主要な使用パターンをカバーするテストスイートとともに、非公式だが理解可能なテキストコメントでコードを維持することと、述語論理の理解を必要とする形式的な仕様との間で選択を迫られた場合、プログラムの振る舞いを記述する上で数学的な正確性の利点を認識していても、ほとんどのプログラマーは前者を選ぶでしょう。

この選択は非常に理解できます。実生活で論理形式主義を学び、適用するという分析的複雑性の壁を乗り越えることが、我々が書くコードの信頼性要件を満たすことに真に報われることは稀だからです。

正直に言えば、医療機器、原子炉、輸送用オートパイロットのマイクロコントローラー向けのファームウェアは、エンジニアが生産するコードの中で目に見えないほどのごく一部を占めています。より重要度の低いタスクでは、運用結果に基づく反復的なエラー修正が、完全な形式的検証という代替案が他の応用タスクとはほとんど関連のない極めて複雑な知識領域への深い没頭を必要とすることを考慮すると、非常に受け入れられる開発方法と見なされています。

その結果、プログラムを仕様化するために述語論理を学ぶ人はほとんどいないため、誰も読まないものを書く理由がないので、形式的な仕様はドキュメンテーションの要素としての意味さえ失います。

考えてみると、ここでの主な問題は、論理形式主義を学び適用するという悪名高い分析的複雑性の壁の高さであり、アルゴリズムを仕様化するというタスクはそれと不可分に認識されていることです。

興味深いことに、この不可分性は実際には見かけ上のものであり、任意のプログラムの観察された振る舞いは、述語論理の命題を使用せずに数学的な厳密さで記述することができます。

さらに、チューリング完全な任意のプログラミング言語でのプログラムは、本質的に、非決定的なセマンティクスを持ついくつかの追加の構造を補った同じ言語で仕様化することができます。

## 非決定性と形式的仕様

アルゴリズムの仕様化に関する我々の推論[[1]]が、演算子の集合$Ops = \{op_i : M \to (M \times R_i) \cup \{\blacktriangledown\}, i=\overline{1,n}\}$を持つ任意の抽象マシン$\mathfrak M : P \to X \rightharpoonup Y$に基づいていることを思い出すと、追加の演算子を補った新しいプログラム記述言語$\overline P$を持つ、その非決定的な一般化$\overline {\mathfrak M} : \overline P \to 2^X \rightharpoonup 2^Y$を想像してみましょう。その演算子の型は$\overline{Ops} = \{op_i : 2^M \rightharpoonup 2^{(M \times R_i)}, i \in \{n+1,\ldots\}\}$と記述できます。

ここで、いくつかの重要な側面に注意する必要があります。

1. 新しい演算子は、抽象マシンの個々の状態ではなく、任意の状態の集合上で計算を行います。
2. 古典的な演算子とは異なり、非決定的な演算子は全域的である必要はありません[[2]]。つまり、いくつかの入力では、その計算が終了しない場合があります。
3. 定量的には、新しい演算子は可算無限集合を形成します。なぜなら、それらはネストされたプログラム（決定的および非決定的の両方）によってパラメータ化できるからです。

制御フローグラフの頂点の集合$V$、頂点で実行される演算子の割り当て$\overline{op} : V \to Ops \bigcup \overline{Ops}$、可能な演算子の結果でラベル付けされたエッジの集合$E$、開始頂点の集合$V_\blacktriangle$を持つ非決定的プログラム$\overline p = \langle V, \overline{op}, E, V_\blacktriangle \rangle$の計算セマンティクスは、計算木を構築する反復的なプロセスとして表現できます。そのノードは$(v, M_v) \in V \times 2^M$の形式のペアであり、グラフの頂点をその入力で到達可能なマシン状態の集合と関連付けます。

1. 計算の開始時に、$V_\blacktriangle$の各頂点は集合$M_\blacktriangle = \{m \in M \mid \exists x \in X : m = in(x)\}$と関連付けられます。すなわち、マシンの許容されるすべての初期状態であり、構築される木の根を形成します。
2. 各ステップで、木の中から未処理のノード$(v, M_v)$が選ばれ、そこで実行される演算子$\overline{op}^v$に対して、以下のルールに従って非終端の結果の集合$\overline{op}^v(M_v) \subseteq M \times R_{\overline{op}^v}$が構築されます。
   - もし演算子$\overline{op}^v$が決定的であれば、$\overline{op}^v(M_v) = \{(m, r) \in M \times R_{\overline{op}^v} \mid \exists m_0 \in M_v : (m, r) = \overline{op}^v(m_0)\}$であり、プログラムの各到達可能な入力状態にそれを単純に適用し、$\blacktriangledown$（計算の成功終了）を無視します。
   - もし演算子$\overline{op}^v$が非決定的であれば、計算$\overline{op}^v(M_v)$は以下に列挙する特別なルールに従って実行されます。
3. $v$から少なくとも1つのエッジが導かれる各頂点$w \in V$に対して、$M_w = \{m \in M \mid \exists r \in R_{\overline{op}^v} : (v, r, w) \in E \lor (m, r) \in \overline{op}^v(M_v)\}$が構築されます。すなわち、処理されたノードからそれに遷移するときに到達可能なすべての状態の集合です。
4. 各非空の$M_w$に対して、木は$(w, M_w)$という枝で補われ、これは処理されたノードに対する子となります。プロセスが完了した後、ノード$(v, M_v)$は処理済みとしてマークされ、まだ未処理のノードがある場合、アルゴリズムはステップ**2**から繰り返します。
5. このアルゴリズムは、未処理のノードが尽きると終了するか、無期限に木の構築を続けます。

現時点では、まだ追加の非決定的な命令を導入していないので、本質的にはある種のシンボリック計算について話しているように思えるかもしれません。そして、ある意味では、この類似は正当化されます。もしシンボリックな表現を持つ$M$の部分集合に限定すれば、古典的な演算子に対して、上記のアルゴリズムはかなり直接的に実装できます。

しかし、特定のアルゴリズムのために計算木のインスタンスを構築することが我々の目的ではないことを理解すべきです。我々は、この木の特性がアルゴリズムが特定のクラスに属していることをどのように証明できるかにより興味があります。

これを行うために、次の非決定的な演算子を導入します。

- $total_{\overline{pp}}$は、そのパラメータが任意の非決定的なプログラム$\overline{pp} \in \overline P$である演算子です。この演算子は終端的であり、つまり$R_{total} = \emptyset$です。任意の入力状態の集合$M_v \subseteq M$に対して、計算$total_{\overline{pp}}(M_v)$は、プログラム$\overline{pp}$と$M_v$の任意の有限部分集合に対して構築されたすべての計算木が有限である場合にのみ成功裏に完了します。そうでない場合、計算$total_{\overline{pp}}(M_v)$は終了しません。
- $filter_{\overline{pp}}$は、そのパラメータが任意の非決定的なプログラム$\overline{pp} \in \overline P$である演算子です。この演算子は1つの結果しか持てず、$R_{filter} = \{\checkmark\}$です。任意の状態の部分集合$M_v \subseteq M$に対して、計算$filter_{\overline{pp}}(M_v)$は、各$m \in M$について、$m \in M_w$かつ$\overline{op}^w(m) = \blacktriangledown$となるノード$(w, M_w)$が$M_v$上の$\overline{pp}$の計算木に存在するかどうかを判断できる場合にのみ終了します。結果として得られる$filter_{\overline{pp}}(M_v) = \{(m, \checkmark)\}$は、終端と判断されたすべての$m$を出力に集めます。どの状態の終端性も判断できない場合、計算$filter_{\overline{pp}}(M_v)$は終了しません。

ここで、追加の演算子のセマンティクスを論理的な手段で定義していることが明らかになります。一般的に言えば、記述された計算を実行できる実際の装置を想像するのは困難です。我々は本質的に、抽象マシンのあらゆる可能な状態の空間を反復するアルゴリズムについて話しており、これは興味深い場合には明らかに可能性を超えています。

しかし、アルゴリズムの仕様化に上記のセマンティクスを使用することは、実際に計算木を構築する必要性を意味しません。我々にとっては、その特性について推論できれば十分です。

## 問題

次の例を、Rustを少し拡張した構文で記述された（現時点では架空の）キーワードのセットを用いて考えてみましょう。

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

このコードでは、3つの新しいキーワード（`total`、`filter`、`verify`）と、プリミティブ型の未知のトレイトに関連するいくつかの`::undef()`関数の呼び出しが見られます。これらを順番に見ていきましょう。

- キーワード`total`は、その後に続くブロック（またはこの場合、そのマークされた関数の本体）が、同名の演算子のセマンティクスで非決定的な計算を行うことを宣言します。`total`ブロックは、制御を得ると、許容される各計算が成功裏に完了する場合にのみ、成功裏に副作用なしに完了します。
- キーワード`filter`も、対応する演算子の非決定的な計算を、その後に続くブロック上で行います。`filter`ブロックは、制御を得ると、成功裏に完了する計算のみを保持します。
- キーワード`verify`は、与えられた決定的なコンテキストで非決定的なブロックの実行可能性を保証します。ここでは、例えば、`total`本体を持つ関数の呼び出しへの適用は、マシンが、パラメータ`func`が関数`foobar`を参照する場合、その計算が各入力状態で確実に成功裏に完了するかどうかをチェックしなければならないことを意味します。チェックが成功すると、マシンは状態を変更せずに次の命令に制御を移します。
- 関数`undef`は、`trait Undefinable { fn undef() -> Self where Self: Sized; }`のようなワンライナーで定式化できるトレイトで定義されており、その振る舞いは、計算`T::undef()`は完了が保証され、型`T`の任意の代表を返すことができる、と仕様化できます。

明らかに、そのように拡張されたRustの実際のコンパイラやインタープリタを想像するのは非常に困難です。記述されたセマンティクスを持つ非決定的なブロックを実行することは、本質的に停止問題に帰着するタスクを解くことを意味します。

実際には、構築による全域性の非常に限られたケース（例えば、帰納的データ構造上の引数が減少する不動点関数）を超えて、任意の構文的に正しいコードに対して必要な計算を自動的に生成できるアルゴリズムは存在しないことを意味します。

それにもかかわらず、仮に「`proof()`関数の呼び出しが、`println!(...)`の呼び出しとともに成功裏に完了することを保証できた場合、それは`foobar`関数の振る舞いについて何を伝えてくれるだろうか？」と自問することができます。

読者がこの簡単なパズルを自分で解くことができるように、診断メッセージのテキストには空欄が含まれています。`preserving_count(foobar)`と`procuring_sorted(foobar)`の実行可能性が引き出す引数の特性を決定することで、この空欄を簡単に埋めることができます。興味のある方はここで考えるのを止めることができますが、他の方は次のセクションで解決策を見つけるでしょう。

## 解決策

まず、`verify preserving_count(foobar)`の分析から始めましょう。全域的なセマンティクスを持つブロックを検証する際、入力状態の集合は呼び出しが行われた決定的な計算の単一の要素から成ります。我々は、その中でパラメトリック変数`func`が`foobar`を参照していることしか知りません。以下を実行した後、

```rust
	let arr = Vec<i32>::undef();
	let val = i32::undef();
```

`undef`の仕様に従って、ローカル変数`arr`は32ビット整数の任意のベクトル（その長さと内容は任意）を含むことができ、ローカル変数`val`は任意の32ビット整数であり得ます。したがって、非決定的ブロックのこの時点での到達可能な状態の集合は非自明になります。次に、以下の計算に進みます。

```rust
	let before = count_values(&arr, val);
	func(&mut arr);
	let after = count_values(&arr, val);
```

ここでは、古典的な決定的関数のみが呼び出されているため、各到達可能な状態での計算は独立して実行されます。考えられるすべての組み合わせについて、まず`arr`内の`val`の出現回数を数え、次に`func`を呼び出して`arr`の内容を何らかの方法で変更し、そして再度`val`を数えます。

もし`func(&mut arr)`の呼び出しが、少なくとも1つの入力で終了しなかったり、無効な操作によって中断されたりした場合、全域的ブロックのセマンティクスに従って、非決定的な計算全体が成功できず、以降の推論は意味を失います。

そうでない場合、到達可能な状態の集合は定量的に変化せず、その各要素に対応するカウント結果を含む新しいローカル変数`before`と`after`が現れます。

最後に、非決定的な計算は以下のチェックで完了します。

```rust
	assert!(before == after);
```

各到達可能な状態がこのチェックを独立して通過しなければならないため、`foobar`関数は、それが呼び出される配列の要素数を保持し、つまり要素を並べ替えるだけであるという正当な結論を下すことができます。

この事実を覚えておいて、`verify procuring_sorted(foobar)`の分析に進みましょう。

呼び出された全域的な関数は再び以下から始まります。

```rust
	let arr = Vec<i32>::undef();

	func(&mut arr);
```

つまり、ローカル変数に任意の配列を割り当て、その内容に`foobar`関数を適用します。次に、

```rust
	let i = usize::undef();
	let j = usize::undef();

	filter {
		assert!(i < j);
		assert!(j < arr.len());
	}
```

ここで`filter`キーワードの最初の使用が見られます。ここでは、未知の値を持つ2つのローカルインデックスを導入し、その後、フィルタリングブロックのセマンティクスに従って、少なくとも1つの`assert`に失敗する計算を成功裏に完了したものとして考えます。

計算の早期の成功終了は外部ブロックの全域性に影響を与えられないため、`i`と`j`が`arr`配列の異なる順序付きインデックスである状況のみをチェックする必要があります。最終的な計算

```rust
	assert!(arr[i] <= arr[j]);
```

は、任意の配列に`foobar`関数を適用した後、その中のすべての要素が昇順に並んでいることを示しています。

この時点で、ほとんどの読者はパズルを解決したことでしょう。では、次のような操作を行うアルゴリズムを通常何と呼びますか：

- 配列の要素数が保持される。
- 配列がソートされる。

`proof`関数の診断メッセージの空欄に答えを埋めましょう。

```rust
	println!("foobar is a sorting function");
```

確かに、記述された非決定的なセマンティクスを持つ拡張Rustでコードを実行できるインタープリタがあれば、画面にこの行が表示されることは、`foobar`がソート関数であることを明確に示しています。

特筆すべきは、我々がこの結論に至った推論は、上記の非決定的なコードのためのインタープリタが実際には存在しないという事実によって全く無効化されないことです。

## 無関連マシンのスケジューリング例

マシン上でタスクを処理する広く使用されているアルゴリズムの別の例を考えてみましょう。入力は有限のタスク集合$N$、有限のマシン集合$M$、およびタスク$i \in N$がマシン$j \in M$上で実行される時間を表す自然数$p_{i,j} \in \mathbb{Z}$です。マッピング$f : N \to M$を見つける必要があり、

$$\max_{j \in M} \sum_{i \in N} \left[f(i) = j\right] p_{i,j}$$

が最小化されます[[3]]。

```rust
// 指定された関数はp_{i,j}のn*m配列を取り、その解をサイズnの2番目の配列に出力します。
// 戻り値は解が最適化しようとするミニマックスです。
type sf = fn(&[u32], &mut [usize]) -> u32;

// 入力の有効性をチェックします。
fn valid_input(p: &[u32], n: usize) {
	let nm = p.len();

	assert!(nm > 0); // pは空であってはならない
	assert!(nm % n == 0); // pは長方形でなければならない

	let m = nm / n;

	for j in 0..m {
		let mut acc: u32 = 0;

		for i in 0..n {
			let old = acc;
			acc += p[i * m + j];
			// p_{*,j}の合計がu32をオーバーフローしてはならない
			assert!(acc >= old);
		}
	}
}

// 解候補のミニマックスを計算します。
fn calculate(p: &[u32], f: &[usize]) -> u32 {
    let m = p.len() / f.len();
    // 各jの累積和の配列
    let mut res: Vec<u32> = vec![0; m];

    for (i, &fi) in f.iter().enumerate() {
	    assert!(fi < m);
        res[fi] += p[i * m + fi];
    }

    res.iter().max().unwrap()
}

// グローバルに最適な解の仕様。
total fn optimal(func: sf) {
	let p = Vec<u32>::undef();
	let mut f = Vec<usize>::undef();
	let n = f.len();

	// 入力をチェック
	filter valid_input(&p, n);

	// 指定された関数を実行
	let r = func(&p, &mut f);

	// 戻り値が正しいことを保証
	assert!(r == calculate(&p, &f));

	// 他の可能な解をすべて生成
	for i in 0..n { f[i] = usize::undef(); }

	// 候補解が最良であることを保証
	assert!(r <= filter calculate(&p, &f));
}

fn proof() {
	verify optimal(foobar);

	println!("foobar is an unrelated-machines scheduler");
}
```

## 結論

我々の推論の厳密さのおかげで、提示されたコードは、前回の記事の述語論理の命題と同等に、ソート関数の形式的な仕様として機能します。さらに、この表記法はプログラマーに既に馴染みのあるツールを自然に拡張し、そのような仕様の理解の壁を大幅に低くします。数学的なバックグラウンドのないプログラマーでも、述語論理と比較して、非決定的な計算のセマンティクスをより簡単に把握できます。

しかし、そのような仕様に対して特定の関数の振る舞いを真に確認するためには、論理形式主義を操作する証明支援ツールという形の追加のツールが依然として必要であることを理解すべきです。このトピックの議論は次の記事で続けます。

## 参考文献

- [プログラム検証：背景と表記法][1]
- [全域関数型プログラミング。_ウィキペディア_][2]
- [無関連マシンのスケジューリング。_ウィキペディア_][3]

[1]: {{< ref "/papers/program-verification-background-and-notation" >}}
[2]: https://en.wikipedia.org/wiki/Total_functional_programming
[3]: https://en.wikipedia.org/wiki/Unrelated-machines_scheduling

{{<post-socials language="jp" telegram_post_id="19" x_post_id="1808780136860561828">}}
{{<ai-translated>}}