+++
title = '計算機科学における論理入門'
date = 2024-11-09T18:00:00+06:00
draft = false
math = "katex"
summary = "このブログでは、「計算機科学における論理」という本で説明されている命題論理の基礎を概説します。"
tags = ["命題論理", "基礎", "数学"]
aliases = ["/blog/introduction-into-logic-in-computer-science"]
+++

**目次**

- [はじめに](#はじめに)
- [宣言的文](#宣言的文)
  - [重要なポイントのまとめ：](#重要なポイントのまとめ)
- [命題論理](#命題論理)
  - [重要なポイントのまとめ：](#重要なポイントのまとめ-1)
- [構文](#構文)
  - [重要なポイントのまとめ：](#重要なポイントのまとめ-2)
- [意味論](#意味論)
  - [重要なポイントのまとめ：](#重要なポイントのまとめ-3)
- [標準形：](#標準形)
  - [重要なポイントのまとめ：](#重要なポイントのまとめ-4)
- [参考文献](#参考文献)

# はじめに
このブログ投稿は、Micheal HuthとMark Ryanによる「計算機科学における論理」[[1]]のコンスペクトです。第1章の最初の5つの部分をカバーします。このコンスペクトは簡潔さのために非公式に書かれています。そのため、元のテキストからの多くの定理や証明は言及されていません。

# 宣言的文
プログラム検証の主な目標はシンプルです：コンピュータプログラムのコードがあり、そのプログラムがどのように動作すべきかの説明もあります。私たちは、そのプログラムが仕様に従って動作することを確認したいのです。これを行うための多くの方法が既に存在します：
- 異なるケースやシナリオでプログラムが動作することを確認するために、テストスイートを書くことができます。
- プログラムを[_疑似_]ランダムな入力で繰り返し実行し、決して失敗しないことを確認するファザーを書くことができます。
などなど。

しかし、これらの方法の問題は、ほとんど常に不確実性が残ることです。わずかな単体テストだけでプログラムが動作することをどうやって確信できますか？バグを引き起こすチェックしていないケースがあるかもしれません。

>ここに形式手法の特徴的な性質があります：それらはエラーの余地を残さず、プログラムが_常に_期待通りに動作することを確認するために使用できます。
{.important}

しかし、これらの手法を実行するために最初に必要なのは、非常に具体的なプログラム仕様です。それらが「形式的」手法と呼ばれる理由は、数学的な技術を使用して正確性を検証するからです。したがって、厳密に議論を作成し、防御できるプログラム仕様が必要です。直感的に、仕様を書くために自然言語を使いたくなるかもしれません。結局のところ、自然言語で物事を説明するのは私たちにとって直感的です：友達と話すときや、同僚と議論するときに使います。この方法で物事を表現し、推論することに慣れています。しかし、プログラム仕様を書くのに自然言語は適切ではありません。それは、ペンキのブラシの毛でネジをねじ込もうとするようなものです。問題は、自然言語が複雑すぎて曖昧すぎることです。次の文を考えてみてください：
> 男性は望遠鏡を持った女性を見た。

この文には2つの解釈があります：
1. 望遠鏡を覗いている男性が女性を見た。
2. 男性は、望遠鏡を持っている女性を見た。

現実の会話では、正しい意味を推測するための文脈がしばしばありますし、相手に明確化を求めることもできます。しかし、数学的な議論を行うときには、曖昧さの余地は全くありません。したがって、別のものが必要です：私たちが言いたいことを明確にエンコードし、推論できる明確なルールを持つよりシンプルな言語です。プログラムにこの正確性のチェックを自動的に行わせたい場合、それは私たちがこの言語の文を検証し、操作するためのプログラムを書くことができるほど厳密であるべきです。仕事に適さない道具であるにもかかわらず、自然言語は馴染みがあります。したがって、とにかくそれについて考えることから始めて、何かシンプルなものを導き出せるか見てみましょう。

私たちは通常、何かが真であると宣言する文を使って議論を行います。つまり、世界について何かを述べる文です。例えば、次の2つの英語の文を考えてみましょう：
> もし雨が降っていて、私が傘を持っていないなら、私は濡れるでしょう。雨が降っていて、私は濡れなかった。

および
> もし行列が正方で、その行列式がゼロでなければ、その行列は可逆です。その行列は正方で、可逆ではありません。

これらの文から何を推論できますか、そしてそれをどう正当化しますか？これらの文はどちらも世界について全く異なることを述べています（1つは常識で、もう1つは線形代数について）が、その_構造_は同じであり、議論の構造も同じです。例えば、最初の文から次のような議論ができます：
> 私は濡れなかった。したがって、雨が降っていて私が傘を持っていなかったということは真ではありえません。雨が降っていたことを知っているので、私は傘を持っていたに違いありません。

同様に、2番目の文からも_ほとんど同じように_議論を繰り返すことができます。いくつかの単語を入れ替えるだけです！
> その行列は可逆ではありません。したがって、それが正方で行列式がゼロでないということは真ではありえません。行列が正方であることを知っているので、行列式はゼロに違いありません。

さらに、文が実際に何を言っているかを無視して、その構造にだけ注意を払い（そして我々が作った議論についても同じことをします）、それらが同一であることがわかります：
> もし$x$かつ$\lnot y$ならば$z$。$\lnot z$であり、$x$。したがって、$y$。
{.note}

これで、私たちが興味を持っているのは、文が何を述べているかではなく、それらの根底にある論理構造であり、それが私たちが推論できるものだということがわかりました。これらの宣言的文を使って好きなものを記述し、それらの構造を使って正当な議論を行うことができます。

## 重要なポイントのまとめ：
1. プログラムの正確性を検証するためには、その動作の記述が必要であり、それについて議論し、推論できる必要があります。
2. 自然言語はこれらの仕様を書くのに適していません。なぜなら、それは複雑で曖昧だからです。
3. 自然言語では、宣言的文を使って世界を記述し、その構造で議論を行います。

# 命題論理
示されたように、宣言的文を使って世界を記述し、これらの記述を推論するために、文の構造を扱います。しかし、まだ自然言語の領域にあり、それは望ましくない癖が残っています。例えば、次の3つの文を考えてみましょう：
> 私は今日料理をしなかったが、冷蔵庫に残り物がある。

> 冷蔵庫に残り物があり、私は今日料理をしなかった。

> 残り物が冷蔵庫にあるので、私は今日料理をしなかった。

これらはすべて同じ情報を伝えています。これらの3つの文の違いは、情報が読者に提示される方法だけです。会話の文脈では、これらの微妙な違いは非常に重要ですが、私たちの目的では気にしません。我々にとって、これらのバリエーションは言語を扱いにくくするだけです。簡単な英語の文であっても、これらの情報を抽出するプログラムやパーサーを書くことがどれほど難しいか想像してみてください！したがって、私たちの言語はもっと原始的な文法を持ち、情報の構造にだけ焦点を当てるべきです。前のセクションから、これらの「宣言的文」が世界について何を言っているのか実際には知る必要がなかったことを思い出してください。

>したがって、これ以上分解できない文を表すために、単一の文字を使用します：命題原子。
{.note}

それらは**真**または**偽**のいずれかです。そして、それから小さなセットの結合子を使用して、これらの命題原子をより興味深い_論理式_に結合します。以下がルールであり、いくつかの例です：

$p$を最初の命題原子とし、「冬である」を意味します。そして、$q$を2番目の命題原子とし、「寒い」を意味します。すると：

- 結合子$\land$は英語の「そして」のようなものです。それは両側の文または論理式が真であることを意味します。例えば、$p\land q$は「冬であり、寒い」を意味します。この結合子自体は「論理積」と呼ばれ、両側のものは「被積」と呼ばれます。論理積全体は、被積の両方が真である場合にのみ真です。
- 同様に、$\lor$は英語の「または」に似ています。それは少なくとも一方の文が真であることを意味します。$p\lor q$は「冬であるか、寒い」を意味します。この操作は論理和と呼ばれ、両側の論理式は「被加算子」と呼ばれます。論理和全体は、少なくとも一方の被加算子が真である場合に真です。
- $\lnot$は、この中で唯一、実際には2つのものを結合しない演算子で、単一の論理式を反転させます。英語の「ではない」のようなものです。例えば、$\lnot p$は「冬ではない」を意味します。この操作は否定と呼ばれ、否定しているものが偽である場合に真です。
- 最後の結合子は$\rightarrow$で、「含意」と呼ばれます。それは英語の「もし...ならば...」のようなもので、順序が重要です！例えば、$p\rightarrow q$は「もし冬であれば、寒い」を意味し、$q\rightarrow p$は「もし寒ければ、冬である」を意味します。矢印の左側の論理式は「前件」と呼ばれ、右側の論理式は「後件」と呼ばれます。含意は、前件が真で後件が偽である場合にのみ偽となります。

これらの結合子について言及すべき追加のことがいくつかあります。最初は論理和に関連しています：それは英語の「または」に似ていると紹介されましたが、少し違いがあります。英語では、「$a$または$b$」と言うとき、通常は一方または他方、_しかし両方ではない_ことを意味します。これは_排他的_な論理和と呼ばれ、両方のオプションが真であることを_除外_しています。しかし、論理和は_包括的_であり、被加算子の両方が真であっても真です。次の例は、論理的な含意を扱うときに順序が本当に重要であることを強調するものです。次の文を考えてみましょう：
> もし私がパンを作っているなら、私は焼いている。

これは正しいです。しかし、前件と後件を入れ替えると、次のようになります：
> もし私が焼いているなら、私はパンを作っている。

これは明らかに偽です。ケーキを焼いているかもしれません！最後に、論理で含意を扱うとき、私たちは因果関係については気にしません。つまり、何かが別のものを含意すると言うとき、前件と後件の間に関係がある必要はありません。例えば、次の文を考えてみましょう：
> もしエジプト人がピラミッドを建設したなら、ニンジンはオレンジ色である。

英語では、これは意味を成しません。なぜなら、エジプトのピラミッドはニンジンの色と何の関係もないからです。しかし、論理的には、これらの関係は気にしません。

これで、シンプルな文（_命題原子_）を取り、論理結合子を使って、それらを世界についてより興味深いことを述べる論理式に構成する方法ができました。いくつかの例を示します。最初の原子$d$を「中が暗い」を意味し、2番目の原子$s$を「太陽が沈んだ」を意味し、$l$を「電気がついている」を意味するとします：
- $s\land l$：太陽が沈み、電気がついている
- $(s\land(\lnot l))\rightarrow d$：太陽が沈み、電気がついていないなら、中は暗い
- $(\lnot d)\rightarrow ((\lnot s)\lor l)$：中が暗くないなら、太陽が沈んでいないか、電気がついている（これは前の文と同等です）

常に括弧を書くのは面倒なので、代わりに算術と同じように「演算の順序」があります。否定が最初に来て、次に論理積と論理和が来ます。最後に、含意が最後に来ます。したがって、この文を正しく解釈する方法は：
> $\lnot a \lor b \rightarrow c$
{.note}

これは
> $((\lnot a) \lor b) \rightarrow c$
{.note}

## 重要なポイントのまとめ：
- 私たちは具体的な意味ではなく論理構造だけを気にするので、これ以上分解できないシンプルな文（命題原子）を単一の文字で表します。
- 命題原子を論理式に組み合わせるために使用できる4つの結合子のセットがあります。
- 結合子には適用の順序があります。
- これにより、世界についての文を曖昧さなくエンコードし、厳密に議論できる形にします。

# 構文
これで、世界について言いたいことを論理的な文にエンコードできるようになりましたが、まだ大きな問題が残っています。つまり、これらの論理的な文を使ってどのように議論を行うのか？ある文が別の文を導くことをどのように示し、それをどのように正当化できるのか？ここで私たちは2つの道に分かれます。最初の方法は、_意味論_、つまり結合子の_意味_について議論する方法です。これは真理値表を使用して行われ、後で独自のセクションで説明されます。今のところ、2番目の方法について議論しましょう：_構文_、つまり_論理式の構造_について議論する方法です。

まず非常にシンプルなルールのセットから始めます。そのいくつかは非常にシンプルで、数文以上書くのが難しいほどです。そして、議論や証明は次のように構成されます：
- 与えられた論理式、つまり真であることがわかっているものを書きます。
- ルールを論理式に適用します。これにより、真であることがわかっている別の論理式が得られます。
- 望む結果に到達するまでルールを適用し続けます。

難しい部分は、どのルールをどの順序で適用するかを知ることです。それを見つけるのはかなり楽しいパズルになることがあります。各ルールは次のようにリストされます：
$$
\frac{\text{持っているもの}}{\text{推論できるもの}}(\text{ルール名})
$$
例えば、論理積（そして）の導入のルールはこちらです：
$$
\frac{a,b}{a\land b} \medspace (\land_i)
$$
このルールは次のように読みます：「もし$a$が真であり、$b$が真であるなら、$a$かつ$b$が真であると推論できます」。このルールは$\land_i$と名付けられています。また、論理積を取り除く、つまり消去するルールもあります：
$$
\frac{a\land b}{a}\medspace (\land_{e1})\thickspace\frac{a\land b}{b}\medspace (\land_{e2})
$$
最初のものは次のように読みます：「もし$a$と$b$の両方が真であることがわかっているなら、$a$が真であると結論づけることができます」。2番目のルールも同じ考え方です。二重否定のルールもあります：
$$
\frac{a}{\lnot\lnot a}\medspace(\lnot\lnot_i)\thickspace\frac{\lnot\lnot a}{a}\medspace(\lnot\lnot_e)
$$
これは次のように考えてください：「誰かがあなたに『雨が降っていないわけではない』と言ったら、それは『雨が降っている』と言う奇妙な方法ですし、逆もまた然り」。これがこれら2つのルールが言っていることです。次のいくつかのルールを理解するために、証明システムを少し拡張する必要があります。証明の任意の時点で、何かが真であると仮定することができます。しかし、最終的な結果はこの仮定に依存してはなりません。含意のルールを見てみましょう：
$$
\frac{[a\dots b]}{a\rightarrow b}\medspace(\rightarrow_i)
$$
$[a\dots b]$は「$a$を仮定して$b$を結論するサブ証明」を意味します。基本的に、このルールが言っているのは：「もし$a$が真であると仮定して$b$が真であることを示すことができるなら、$a$は$b$を含意する」ということです。これが混乱する場合、含意が成り立つことは、実際には$a$の真理値について何も言っていないからです。例えば、「もし私が疲れているなら、私は寝るだろう」という文は、話者が疲れているかどうかについて何も述べていません。もう一つの含意のルールはこちらです。これははるかにシンプルです：
$$
\frac{a\rightarrow b,a}{b}\medspace(\rightarrow_e)
$$
このルールは「もし$a$が$b$を含意し、$a$が真であるなら、$b$もまた真でなければならない」と言っています。論理和（または）のルールもあります：
$$
\frac{a}{a\lor b}\medspace(\lor_i)\thickspace\frac{a\lor b, [a\dots c], [b\dots c]}{c}\medspace(\lor_e)
$$
最初のルールは、もし$a$が真であるなら、$a$または$b$が真であると述べています。これは、論理和が真であるためには、被加算子のうち_1つだけ_が真であればよいからです。したがって、$a$が真であることがわかっていれば、$b$が真であるかどうかは関係ありません。論理和はまだ成り立ちます。2番目の、より威圧的なルールは論理和を消去するためのものです。$a$または$b$が真であることがわかっているとします。どちらが真であるかわからないので、論理積の消去で行ったように他の被加算子を取り除くことはできません。したがって、$a$または$b$のどちらが真であっても、常に$c$が真であると結論できることを示す必要があります。そのために、2つのサブ証明を提供する必要があります。1つは$a$を仮定して$c$を結論し、もう1つは$b$を仮定して$c$を結論します。これにより、どちらが真であっても、常に$c$に到達する方法があります。

これらのルールを使って、最初の（あまりエキサイティングではない）証明を書くことができます。最初の結果として示したいのは、もし$a$と$b$が真であるなら、$a$または$b$も真であるということです。つまり、次を証明したいのです：$$a\land b \vdash a\lor b$$

>記号$\vdash$は「導く」を意味します。
{.note}

証明はこちらです：
1. $a\land b$ （前提）
2. $a$ $\quad\land_{e1} 1$
3. $a\lor b$ $\quad\lor_i 2$

$a\land b$から始めて、まず1行目にルール$\land_{e1}$を適用し、$a$を得ます。次に、証明を締めくくるために、2行目に$\lor_i$ルールを使用するだけです。注意すべきは、導出が一方向にしか行かないことです。今、$a\land b\vdash a\lor b$を証明しましたが、$a\lor b\vdash a\land b$を証明することはできません。

2つ目の例では、サブ証明を使用します。$a$が$b$と$c$が真であることを含意するなら、$a$は$b$を含意することを示してみましょう。
$$
\begin{aligned}
  \text{1. } & \quad a\rightarrow (b\land c)\quad & \text{（前提）}\\\
  & \begin{bmatrix}
    \text{2. }& \quad a\quad & \text{（仮定）}\\\
    \text{3. }& \quad b\land c\quad & \rightarrow_e 1\\\
    \text{4. }& \quad b \quad & \land_{e1} 3
  \end{bmatrix}\\\
  \text{5. }&\quad a\rightarrow b\quad&\rightarrow_i2-4
\end{aligned}
$$

ここでは、まず$a$が真であると仮定します。仮定の範囲はボックスで示されます。次に、$a$が真であると仮定して、$b\land c$が真であると推論でき、したがって$b$が真であると推論できます。最後に、$a$から$b$を結論するサブ証明があるので、仮定ボックスを閉じて、$a\rightarrow b$と結論します。

最後のいくつかのルールは矛盾を扱います。矛盾は、何かが同時に真であり偽であると示されたときに起こります。それは$\bot$という記号で表されます：
$$
\frac{a,\lnot a}{\bot}\medspace(\bot_i)
$$
>矛盾からは何でも導くことができます：
{.danger}
$$
\frac{\bot}{a}\medspace(\bot_e)
$$
何かを仮定して、それが矛盾につながるなら、仮定したものは真ではありえません。
$$
\frac{[a\dots\bot]}{\lnot a}\medspace(\lnot_i)
$$
そして最後に、このルールは$a$が$b$を含意し、$b$が偽であるなら、$a$も偽でなければならないと述べています。そうでなければ、矛盾が生じるでしょう。このルールは実際には他のいくつかのルールの組み合わせですが、有用なので言及します。

>このルールの名前は「背理法（モーダスポーネンスの否定）」です。
{.important}

$$
\frac{a\rightarrow b,\lnot b}{\lnot a}\medspace\text{M.T.}
$$
すべてのルールが揃ったので、ついに最初のセクションで行ったこれらの文を証明できます。
> もし雨が降っていて、私が傘を持っていないなら、私は濡れるでしょう。雨が降っていて、私は濡れなかった。

まず各原子を文字に割り当てます：$r$を「雨が降っていた」、$w$を「私は濡れた」、$u$を「私は傘を持っていた」とします。すると、前提と証明は次のようになります：
$$
\begin{aligned}
  \text{1. } & \quad (r\land\lnot u)\rightarrow w\quad & \text{（前提）}\\\
  \text{2. } & \quad r\land\lnot w \quad & \text{（前提）}\\\
  \text{3. } & \quad \lnot w \quad & \land_{e2}2\\\
  \text{4. } & \quad r \quad & \land_{e1}2\\\
  \text{5. } & \quad \lnot(r\land\lnot u) \quad & \text{M.T.} 1,3\\\
  & \begin{bmatrix}
    \text{6. }& \quad \lnot u\quad & \text{（仮定）}\\\
    \text{7. }& \quad r\land\lnot u \quad & \land_i 4,6\\\
    \text{8. }& \quad\bot\quad & \bot_i 7,5
  \end{bmatrix}\\\
  \text{9. }&\quad \lnot\lnot u\quad&\lnot_i 6-8\\\
  \text{10. }&\quad u \quad & \lnot\lnot_e 9
\end{aligned}
$$

この証明は背理法によるものです。6行目で、あなたが傘を持って_いなかった_と仮定します。もしそうであれば、雨の中を傘なしで出かけていたことになり、濡れてしまいます。しかし、2つ目の前提では、あなたは濡れ_なかった_と述べています。したがって、矛盾に達しました。つまり、元の仮定は偽であるに違いありません。したがって、あなたは傘を持っていたに違いありません。

最初のセクションで持っていたもう一つの例を思い出してください：
> もし行列が正方で、その行列式がゼロでなければ、その行列は可逆です。その行列は正方で、可逆ではありません。

この論理的な証明は上記と全く同じようになるでしょう。おそらく命題原子を表すために異なる文字を選ぶでしょうが。

## 重要なポイントのまとめ：
- 論理式の構文（構造）を調べることで論理的な議論ができます。
- これは、一連のシンプルなルールを与えられた論理式に適用して新しい論理式を推論することで行われます。これらのルールを適用し続けて、示したいものを推論します。
- 証明にはサブ証明や矛盾が含まれることがあります。

# 意味論
構文的に議論することについての興味深い観察は、それが純粋に記号的であるということです。これを想像してみてください：推論規則を紙に書き留め、それらが実際に何を表しているかを伝えずに他の人に渡すことができます。すると、この人は論理証明を書くことができます。論理式が何を意味しているか全く知らなくてもです。しかし、論理的な議論をする別の方法があります：論理式の構造を扱う代わりに、結合子の_意味_を扱います。次の論理式を考えてみましょう：
> $a \lor b$
{.note}

この論理式が真かどうかは、$a$や$b$が真かどうか、そして結合子$\lor$の_意味_によります。各結合子の「意味」を、_真理値表_と呼ばれるものに書き留めることができます。この表の各行では、各変数に真または偽を割り当て、論理式全体の真理値を書きます。各結合子の真理値表はこちらです：

| $p$ | $q$ | $\lnot p$ | $p\land q$ | $p\lor q$ | $p\rightarrow q$ |
|-----|-----|-----------|------------|-----------|------------------|
| T   |  T  |     F     |  T         |    T      |  T               | 
| T   |  F  |     F     |  F         |    T      |  F               | 
| F   |  T  |     T     |  F         |    T      |  T               | 
| F   |  F  |     T     |  F         |    F      |  T               | 

$\lnot$は真理値をTからF、またはその逆に「反転」するだけであることがわかります。$\land$は被積の両方が真である場合にのみ真です。$\lor$は少なくとも一方の被加算子が真である場合に真です。含意は少し奇妙ですが、なぜそうであるかの良い例があります（Wikipedia[[2]]から引用）：あなたが友人に「もし雨が降っていたら、あなたを訪ねる」と約束したとします。論理では、それは$raining\rightarrow visit$となります。この場合、どのケースであなたは約束を守りますか？
- 雨が降っていて、あなたが彼を訪ねた場合、あなたは約束を守りました。
- 雨が降っていて、あなたが彼を訪ねなかった場合、あなたは約束を破りました。この場合、含意は偽です。
- 雨が降っていなくて、あなたが彼を訪ねた場合、あなたはまだ約束を守っています。友人は「雨が降っているときだけあなたを訪ねることができる」とは言っていません。
- 雨が降っていなくて、あなたが彼を訪ねなかった場合、あなたは約束を破ったことにはなりません。

これで、関与する変数の真理値が与えられたときに論理式の真理値を求めることができるようになったので、実際にどのようにしてある論理式が別の論理式を導くことを示すことができるでしょうか？ある論理式が別の論理式を導く場合、前者が真であるとき、後者も真であるべきであり、これは論理的な含意のようなものです。したがって、両方の論理式の真理値表を並べて書き、それらを比較してこれが成り立つかどうかを確認できます。例えば、$a\land b$は$a\lor b$を導くでしょうか？両方の論理式の真理値表はこちらです：
| $a$ | $b$ | $a\land b$ | $a\lor b$ |
|-----|-----|------------|-----------|
| __T__   |  __T__  |     __T__      |    __T__      |
| T   |  F  |     F      |    T      |
| F   |  T  |     F      |    T      |
| F   |  F  |     F      |    F      |

$a\land b$が真である唯一の行がハイライトされています。そして、この場合、$a\lor b$もまた真であることがわかります。したがって、導出は成り立ちます。しかし、以前に構文を使用して議論したときと同様に、導出は両方向に行われません。$a\lor b$が真で、$a\land b$が偽である行があります。

しかし、2つの論理式に含まれる変数が異なる場合や、変数の数が異なる場合はどうでしょうか？例えば、$\lnot r$は$p\lor\lnot p$を導くでしょうか？$p$は$p\rightarrow(\lnot p\lor q)$を導くでしょうか？これを調べるためには、両方の論理式に含まれるすべての変数を持つ大きな真理値表を書く必要があります。しかし、その後はアイデアは同じです：前提が真であるたびに、結果も真であるべきです。$\lnot r$が$p\lor\lnot p$を導くかどうかを見てみましょう：

| $r$ | $p$ | $\lnot r$ | $p\lor\lnot p$ |
|-----|-----|------------|-----------|
| __T__   |  __T__  |     __F__      |    __T__      |
| __T__   |  __F__  |     __F__      |    __T__      |
| __F__   |  T  |     __T__      |    T      |
| __F__   |  F  |     __T__      |    T      |

$\lnot r$が真である各行がハイライトされています。そして、これらの行では、$p\lor\lnot p$もまた真であることがわかります。したがって、導出は成り立ちます。

これで、命題論理式から結論を導く2つの異なる方法を見てきました。これらの間には非常に良い関係があります。命題論理は_健全_で_完全_であると言われています。

>健全性とは、構文的に何かを証明するたびに、真理値表を書き出したときに結果が成り立つことを意味します。
{.important}

>完全性は逆方向に進みます。真理値表である導出が成り立つことを示すことができれば、そのための構文的な証明が存在するに違いありません。
{.important}

したがって、構文と意味論の間を自由に行き来できます。言い換えれば、**証明可能なものはすべて真であり、真であるものはすべて証明可能です**。

多くの命題原子を扱っている場合、構文的なアプローチを使用する方が賢明かもしれません。なぜなら、変数を1つ追加するごとに、真理値表の行数が2倍になるからです。しかし、多くの努力をしても構文的な証明が見つからない場合、そもそもそのような証明が存在するかどうかを確認するために真理値表を使用できます。

## 重要なポイントのまとめ：
- 両方の論理式の真理値を見て、一方の論理式がもう一方の論理式を導くことを議論できます。つまり、結合子の_意味_について議論することで。
- 構文的に証明可能なものはすべて真であり、真であるものはすべて構文的に証明可能です。

# 標準形：

論理式には知っておくと便利な2つの性質があります。それは_恒真式_と_充足可能性_です。

>論理式が_常に_真である場合、それは恒真式であり、論理式が真となるケース（各命題原子に真と偽を割り当てる）が少なくとも1つある場合、それは充足可能です。
{.important}

一般に、論理式がこれらの性質を持つかどうかを確認するのはそれほど簡単ではありません。特にそれが多くの変数を含む場合はそうです。論理式に変数を1つ追加するごとに、真理値表はサイズが_2倍_になります。したがって、単に真理値表の各行をチェックすることは、最悪の場合$2^n$の操作を要し、すぐに膨大な作業量になります。実際には、SATソルバーと呼ばれるツールが使用され、賢いトリックを使って通常はより早く答えを見つけます。

しかし、恒真式や充足可能性をチェックするのがはるかに簡単な論理式のクラスがあります。その中にはCNF（論理積標準形）とDNF（論理和標準形）があります。まず論理和標準形の論理式を見て、それらがどのように充足可能性を簡単にチェックできるかを見てみましょう。

>論理式が、各節が原子（またはその否定）の論理積である節の論理和である場合、それは論理和標準形であると言われます。
{.important}

いくつかの例を示します：
1. $p\lor\lnot p$
2. $(a\land b\land \lnot c) \lor c \lor (a\land\lnot b)$
3. $p$

論理和標準形の論理式は、いくつかの節の_論理和_であるため、論理式全体が真であるためには、_1つの節だけ_が真であればよいです。つまり、私たちがしなければならないのは、充足可能な1つの節を見つけることだけです。さらに、各節が単に原子またはその否定の論理積であることがわかっています。したがって、節が充足可能で_ない_場合は、それが原子とその否定を含む場合だけです。例えば：
1. $a\land b\land\lnot c$は充足可能です。
2. $a\land b\land\lnot a$は充足可能ではありません。なぜなら、それは$a\land\lnot a$を含み、それは決して真になりえないからです。

したがって、論理和標準形の論理式の充足可能性を線形時間でチェックできます。各節を調べて、原子とその否定を含まないものが少なくとも1つあることを確認するだけです。

次に、論理積標準形を見てみましょう。これはDNFに似ていますが、代わりに各節が原子またはその否定の_論理和_である節の_論理積_です。ここでも、CNFの例をいくつか示します：
1. $(a\lor b\lor\lnot c)\land\lnot b\land (d\lor e)$
2. $a\land\lnot b\land(c\lor e)$
3. $p$

この形では、_恒真式_をチェックするのが簡単です。節の論理積は、1つの節が偽にできる場合にのみ偽になります。ここでは、各節が原子またはその否定の_論理和_であることがわかっています。そのような節が偽にできるのは、それが原子やその否定を含ま_ない_場合だけです。例えば、次の節を考えてみましょう：
$$p\lor\lnot p\lor a$$

これは_常に_真になります：$p$が真であれば、最初の被加算子が成り立ちます。そうでなければ、2番目の被加算子が成り立ちます。いずれにせよ、節は常に真です。したがって、CNFの論理式を線形時間で恒真式かどうかをチェックできます。各節を調べて、それが原子とその否定を含むかどうかを確認するだけです。

これらの形式は扱いやすいですが、残念ながら通常遭遇する論理式はこれらの形式ではありません。代わりに、それらを等価なCNFまたはDNFの論理式に変換する必要があります。これを行うためには、まず含意を次の恒等式を使用して取り除く必要があります：$$a\rightarrow b\equiv \lnot a\lor b$$ この後、否定、論理積、論理和のみを含む論理式が得られます。しかし、それらはおそらく正しい順序にはなっていません。例えば、次の論理式：
$$ \lnot(a\land \lnot(b\lor c)) \lor \lnot a $$ は$\lnot, \lor, \land$のみを含みますが、DNFでもCNFでもありません。これ以降、論理式を正しい形にするためには、いくつかの異なる論理的な等価性を使用する必要があります：
1. $\lnot(a\lor b)\equiv \lnot a\land\lnot b$
2. $\lnot(a\land b)\equiv \lnot a\lor\lnot b$
3. $a\land(b\lor c)\equiv (a\land b)\lor(a\land c)$
4. $(a\lor b)\land c \equiv (a\land c)\lor(b\land c)$

完全なアルゴリズムはここではカバーされていません。興味がある場合は、元のテキストの第1章のセクション5で詳しく説明されています。しかし、主要なポイントは、任意の論理式をCNFまたはDNFに変換できることです。残念ながら、この変換を行うには多くの計算作業が必要であり、場合によっては論理式を非常に大きくすることがあります。したがって、恒真式や充足可能性の問題を解く効率的な方法ではありません。これらの問題は、このコンスペクトの範囲外の他の分野でよく出てきます。

## 重要なポイントのまとめ：
- 論理式は常に真であれば恒真式であり、その真理値表に真となる行があれば充足可能です。
- これらの性質をチェックしやすくする特別な形式があります。DNFは充足可能性をチェックしやすくし、CNFは恒真性をチェックしやすくします。
- 論理式を標準形に変換するために計算作業を投入する必要があるため、恒真性や充足可能性をチェックすることは依然として効率的ではありません。実際には、ヒューリスティックに基づくSATソルバーが使用されます。

# 参考文献
- Michael Huth, Mark Ryan. Logic in Computer Science: Modelling and Reasoning about Systems, 2ed. Cambridge University Press, 2004 [Amazon][1]
- 論理的な含意の例 [Wikipedia][2]

[1]: https://www.amazon.com/Logic-Computer-Science-Modelling-Reasoning/dp/052154310X
[2]: https://simple.wikipedia.org/wiki/Implication_(logic)

{{<post-socials language="jp" page_content_type="blog" telegram_post_id="21" x_post_id="1855443598827032645">}}
{{<ai-translated>}}
