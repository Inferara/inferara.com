+++
title = "Pocket exchange with UniswapX"
date = 2025-08-13T12:21:00+09:00
draft = false
summary = ""
tags = ["DeFi", "Uniswap"]
aliases = ["/blog/pocket-exchange-with-uniswap-x"]
+++

**Table of Contents**

- [Introduction](#introduction)
- [UniswapX and 1inch Fusion](#uniswapx-and-1inch-fusion)
- [1inch Fusion: The Classic Dutch Auction](#1inch-fusion-the-classic-dutch-auction)
- [Uniswap X: A Two-Stage, Differentiated Auction](#uniswap-x-a-two-stage-differentiated-auction)
- [Learnings](#learnings)
- [Monitoring \& Data Acquisition](#monitoring--data-acquisition)
  - [1. Complex, Multi-Protocol Event Aggregation](#1-complex-multi-protocol-event-aggregation)
  - [2. Sophisticated Filler Identification \& Labeling](#2-sophisticated-filler-identification--labeling)
  - [3. Holistic Transaction-Level Profitability Analysis](#3-holistic-transaction-level-profitability-analysis)
  - [4. Intelligent Token Pair Normalization](#4-intelligent-token-pair-normalization)
  - [Conclusion: The "Server-Side SQL" Value Proposition](#conclusion-the-server-side-sql-value-proposition)
- [Possible profit](#possible-profit)
- [Utilize our expertise](#utilize-our-expertise)
- [Conclusion](#conclusion)


## Introduction

This blog post is meant to share some of our insights and findings from a completed research project.  We were hired to calculate the economical models of the UniswapX protocol from the game-theory perspective in trading. We found the ultimate idea of UniswapX and similar protocols very interesting because it enables owners of substantial capital to participate in the market-making process with less protocol and LP risks. This blog post is a great place for those who have capital and want use it efficiently through an exchange that does not manage the orderbook itself, but just fills the orders provided by Uniswap.

Having become an integral aspect of the new digital economy, the decentralization of financial services has brought many advantages but, has also introduced several problems. Until recently, these problems burdened anyone who needed to move liquidity from one digital asset to another. For years, ordinary users of decentralized crypto exchanges (DEX) have faced a familiar set of headaches: bots that “sandwich” other people’s swaps; sudden spikes in network load that send transaction fees sky high; unpredictable slippage that renders the quote shown in the swap window largely meaningless. Early generation automated market makers (Uniswap V2 and V3) addressed the problem of passive liquidity provision more than they corrected these inherent flaws in the act of swap execution itself.

This situation began to change meaningfully only with the rise of a radically new paradigm; intent-based swap mechanisms. Unlike the traditional approach, which places responsibility for preparing the transaction on the swap initiator (the services merely sign to release funds if the transaction is acceptable), intent protocols let users abstract away entirely from the details of the prepared transaction and its surrounding conditions. By signing a declaration of intent to swap X tokens of one type for at least Y tokens of another, the initiator delegates every other decision to the service and thanks to smart-contract guarantees this happens in a trustless way: with a sound architecture, neither the service nor the selected counterparty can execute a transaction whose parameters deviate from the user’s declared intent.

Here we compare the two most influential realizations of this architectural idea so far. Uniswap X and 1inch Fusion. Both stand on the solid foundation of a classic Dutch auction, yet they differ in implementation details in a way that is significant enough to be economically interesting.


## UniswapX and 1inch Fusion

> UniswapX V2 is the current (time the blog is published) actual and deployed on the mainnet version of the protocol.
{.note}

As usual, the comprehensive documentation about V1 and V2 is available on the Uniswap documentation site.

Let’s begin with a closer look at the conventional workflow whose shortcomings both systems aim to fix. In a standard trade (whether on an exchange or p2p via escrow), the initiator effectively self-services the entire process: they find a source of liquidity with sufficient depth (or several, for larger trades), transfer their tokens into escrow or onto an exchange (paying a network fee the first time), lock in the exchange rate (or abort if it has become unfavorable), and finally, again at their expense, withdraw the proceeds (or the unused input tokens) back to their wallet. Receiving the full amount thus depends on the success of the operation at each liquidity source individually. If an exchange rate slips too far somewhere, the trader has to seek liquidity elsewhere, absorbing sunk costs for the failed attempt. These could include transaction fees, price fluctuations or opportunity costs. Meanwhile, the time gap between choosing a liquidity source and the actual price lock-in inevitably tempts counterparties to manipulate prices for their own profit (MEV). This unfortunate state of affairs raises several pressing questions:

 • MEV threat: Can users be protected from bots that predatorily maximize the value extracted from others’ transactions by manipulating execution order?

 • Liquidity fragmentation: Can a user be given access to hundreds of different liquidity sources scattered across exchanges and private inventories, while abstracting away the integration complexity behind a simple, cost-efficient operation?

 • Sunk-cost risk: Can users avoid paying for transactions that, for whatever reason end up failing?

Both 1inch Fusion and Uniswap X have similar answers to these questions. By reframing the operation as an auction of the swap order among professional executors, present a new alternative. Making counterparties compete for the right to serve the client hits multiple targets at once:

 • Protection from failed transactions: In this model the user does not prepare the transaction; they simply sign, at no cost, an instruction for the service to find the best executor for an order with specified parameters.

 All network fees and potential losses from failure are internalized into the market spread, which executors minimize under competitive pressure by pricing risk accurately.

 • Harnessing MEV for the client: Market makers’ entirely legitimate drive to maximize profit not only comes out of the shadows but also meets a natural check in the form of competition. The order is executed by whoever offers the best spread, and the price promised in the signed contract is fixed before funds leave the user’s wallet, without leaving a temporal window for price manipulation.

 • Transparent aggregation of fragmented liquidity: Because the system merely enforces the contract between the parties, it does not require executors to pre-deposit funds to form a common liquidity pool. From the auction’s perspective it doesn’t matter where the tokens come from, as long as they land in the client’s wallet before the deadline. This allows executors to effectively resell all liquidity available in the market through a single window.

It’s hard not to notice that while this economic model dramatically simplifies the swap for the initiator, it necessarily makes life more complex for the executors. Compared with classic exchanges—where participation can be as simple as depositing liquidity, posting a price, and passively waiting for buyers, the auction scheme forces participants on the execution side to make many more decisions under tight deadlines. Automation here is non-negotiable. It creates a state of constant readiness with hard response times which leaves a human with no chance to beat the robots. Below we dive into which economic decisions compel such automation on both platforms.

Although 1inch Fusion and Uniswap X implement the same core idea schematically, they differ quite substantially in the design of their mechanisms. We’ll examine them separately and then compare them, starting with 1inch.

## 1inch Fusion: The Classic Dutch Auction

This protocol embodies the “simple is elegant” principle. 
Here we break down the process of a transcaction using 1inch Fusion.
An order is configured by only three numbers (start price, reserve price, and auction duration), which is then listed in a continuous auction that begins at the most favorable price for the client and then linearly drifts toward the pessimistic reserve price over the auction’s duration. The auction (in the current version) is closed: executors must register and pass KYC. To act on a listed order, a participant executes the user-signed instruction to transfer tokens from the user’s wallet into a special bi-directional escrow that records the exact timestamp of its on-chain inclusion. The first to do so wins the auction; the resulting price is computed deterministically from the order parameters and the escrow’s recorded opening time. From that moment the executor enjoys an exclusivity period, during which they can fulfill their side of the deal by funding the opposite direction of the escrow with the required amount of the tokens the client wants to receive. 
The final step is closing the escrow, which simultaneously releases the frozen funds in both directions.
This final step is also paid for by the executor before the exclusivity expires. 

> **_Note:_** The concrete timeframes of auction and exclusivity periods are not defined in protocol and are subject to service provider. At the moment of writing in both 1inch advertisements and practice vast majority of swaps complete in 5 minutes.

If something goes wrong and the executor stops midway after freezing the user’s funds, then once the exclusivity period ends the act of closing the escrow becomes public: By paying the network fee, any wallet can either return the user’s tokens in full (if the counter-escrow was never sufficiently funded) or complete the swap (if it was funded but the executor couldn’t close the escrow for technical reasons). To make public closure economically meaningful, the protocol requires auction participants to bond a small amount of their own funds in the escrow alongside freezing the user’s tokens—an amount sufficient to cover network fees. These funds are always paid to whoever signs the escrow closure; during exclusivity they are returned to the executor; after exclusivity they become a reward for the party that completes or cancels the swap. Through this method it allows for fulfilling the client’s needs in a way that remains transparent to them.

## Uniswap X: A Two-Stage, Differentiated Auction

This design is somewhat more complex, but for good reasons. The protocol splits executors into two unequal groups that perform actions at different stages. The first group to interact with the client’s order are registered, KYC-verified Quoters, whose work actually starts before the user signs anything. When the user selects a direction of their trade and types the desired amount (either what they want to sell or what they want to buy) into the form, a draft of the order is broadcast to all Quoters serving that trade direction. Each Quoter is expected to respond very quickly (within roughly half a second) with a quote—i.e., the complementary amount of tokens. If the client sells a fixed quantity of their tokens, the quote is the price the executor is willing to pay. If instead the client wants to buy a fixed quantity of the other token, the quote is the price at which the executor is willing to sell those tokens.

In both cases, Quoters compete to offer the most favorable quote for the client. The platform selects a winner, shows that quote in the swap form, and invites the user to sign a payment instruction. From that moment, the winning Quoter is considered to have taken on an obligation to honor the quote provided the user signs before a countdown timer (30 seconds) expires. This stage is exclusive to the winning Quoter. Execution of the signed instruction is also given a fixed, on-chain deadline; upon expiry, the overdue obligation is deemed breached and the client’s order is considered to have failed the exclusive stage. A Quoter who does not keep their promise to execute the order in time is penalized with a temporary suspension from quoting new orders. 

> **_Note:_** This initial cooldown period which uniswap calls "fading" begins at 15 minutes and increases exponentially with each failure in succession. Though, after each fade ends even one successful fulfillment of order resets penalty escalation.

Only orders abandoned by their winning Quoters proceed to the second stage, which is a more archetypal Dutch auction much like the 1inch Fusion mechanism described above. The most economically significant difference here is that Uniswap X’s second stage is open to the public without registration. From the end of exclusivity period until the auction reaches the client’s reserve price, anyone can act as the executor (a Filler), which should further compress the final spread by intensifying competition.

This added complexity is not wasted: by forcing first-stage Quoters to shoulder an obligation to honor the price shown to the user even before the user decides to swap, Uniswap X creates a valuable user-experience feature that would be hard to reproduce otherwise. By comparison, under 1inch Fusion the exchange rate visible to the client at signing time is merely an approximate, non-binding estimate by the platform; the final price is determined somewhere between the start and reserve prices during the (sometimes lengthy) auction. 

![alt text](image.png)

Under Uniswap X, in the overwhelming majority of cases the user decides to sign while looking at the actual amounts that will be sent and received almost immediately after pressing “Approve and swap”. That’s because instances of a Quoter failing to complete an order are relatively rare; the open Dutch auction plays the role of a safety net rather than the backbone of the system .



A qualitative economic analysis suggests that this undeniably useful feature is not free for the user. The extra obligations and risks shouldered by Quoters in Uniswap X naturally push them toward more conservative expectations of execution profitability for the same nominal spreads. One should expect that for swaps involving more volatile tokens (or during volatile periods for otherwise stable pairs), the simplicity of the classic Dutch auction in 1inch Fusion will, on average, extract a smaller share of value from client orders.

## Learnings 

***this section needs to be reworded further and begin to lean into the consulting & research services***

Our practical experience—gained while economically advising a startup currently building an automated market maker (bot) for Uniswap X, and during a hackathon prototyping cross-chain trading functionality on 1inch Fusion can be summarized as follows:

Regardless of platform choice, an automated market maker for intent-based protocols is a mechanically non-trivial artifact whose success depends not only on solving the technical integration tasks with the platform’s services, but also on adopting a strategy that addresses two interrelated, economically substantial points:

First, the bot’s effectiveness depends directly on its ability to price quotes quickly and accurately for the pairs it serves, and to adapt its pricing algorithms promptly to changing market conditions. The choice of primary signals used by the algorithm to determine the most advantageous quote is critical. Natural candidates include public data from centralized exchanges mark prices for the trading pair and raw spot order book data. These inputs enable quote-estimation algorithms that respond promptly to market dynamics.

Second, any serious optimization of the bot’s profitability is impossible without close attention to efficient liquidity reserve management. Although intent-based protocols allow executors to draw missing liquidity from virtually any source available in the market at any time, maintaining adequate operational reserves on the bot’s own wallets can substantially reduce transaction costs.

Since the model of protocols for addressing the points addressed above has to be algorithmic, i.e., delegating financial decisions to a program, the problem of access to data for market analysis becomes particularly acute. On traditional exchanges, trading participants are naturally divided into three main groups, depending on how they obtain the information on which their strategy is based. Buy and hold investors learn market news from newspapers or other traditional forms of media. Day traders sit in front of several monitors displaying Nansen, Arkham, and Etherscan information panels. Finally, High Frequency Trading (HFT) robots listen to the raw APIs of trading platforms, filtering useful signals from gigabytes of digital noise in real time. In terms of the requirements for market data sources, the automation of order execution for intent-based protocols occupies a middle ground between day trading and HFT. On the one hand, we can no longer place full responsibility for financial decisions on humans, but on the other hand, trading takes place at a fairly calm pace by modern automation standards. The tightest timing in the protocols we reviewed is half a second (500ms) for a quote in Uniswap X, while all other periods are measured in blocks (12 seconds each for Ethereum). Here, unlike with HFT, the speed of reaction to events does not create any significant engineering problems. Since 12 seconds is a rather forgiving time frame for such systems, it would take severe errors in design or execution to fail these requirements.  

Accordingly, the need for accuracy in determining exchange quotes and the optimization of liquidity management present themselves in the auction model. The bots who consistently offer a better price than competitors while remaining profitable take all the revenue from the market.

For the economic tasks at hand, due to such intermediate position of data requirements between day trading and HFT, the usual sources of data create a number of inconveniences. Classic information panels (Nansen, Arkham, and Etherscan), which are mainly aimed at day traders, offer a fairly limited set of market activity projections. Their unquestionable convenience in terms of supporting specific economic decisions in a rapidly changing market environment, unfortunately, does not translate well into supporting the detailed statistical research required to refine the parameters of the algorithm. The need to filter and aggregate data sets that are too large for manual processing makes the use of template GUI representations extremely impractical.

On the other hand, using “raw” blockchain infrastructure APIs and trading platforms, while providing complete freedom of automation, immediately turns any statistical research into a separate engineering task of searching through haystacks for needles. The easiest to access but perhaps also one of the more tedious of the tools that can be used is [Etherscan.](https://etherscan.io/) Etherscan provides a lot of data for transactions, wallets and contracts but navigating it without knowing ahead of time precisely which contract addresses are which or "who is who" can be a frustrating experience. The haystack being the vast amount of information available whereas the needle would be the precise details which we are searching for. In our context it is better purposed as a way to see very precise data such as the transactions of a specific Uniswap X filler. Therefore to avoid this engineering task, before reaching an economist's desk, the data will inevitably have to pass through the hands of a competent data scientist capable of extracting grains of useful information from the mountains of digital slag spewing out of low-level APIs. Fortunately, thanks to the existence of the Dune platform, this problem can be partially avoided.


## Monitoring & Data Acquisition

This is where the [Dune](https://dune.com/) platform emerges as a methodological "sweet spot," uniquely suited to the needs of intent protocol architects. It effectively splits the problem in two: the platform itself handles the monumental engineering task of data ingestion, decoding, and structuring, while the analyst retains the full, granular power of querying this refined dataset.

Dune's server-side SQL model provides a "Goldilocks Zone" for data access. It offers a level of abstraction that is:

*   Higher than Raw APIs: Analysts don't need to decode hex data, reconcile token decimals, or build complex indexing pipelines. The data is already cleaned, structured, and presented in relational tables like erc20.transfers or dex.trades.
*   Lower and Fuller than GUI Dashboards: Unlike the pre-packaged views of Nansen or Arkham, Dune provides direct access to the underlying dataset. There is no artificial limitation on the questions one can ask. An analyst can calculate a custom fee volatility metric, correlate liquidity provision across three different protocols, or model the profitability of a novel MEV strategy all within a single SQL query.

This capability is not merely a convenience; it is a fundamental enabler for the economic design of intent-based systems. The core challenge for these protocols shifts from pure execution speed to economic optimization. The profitability of a solver, and thus the health of the entire network, hinges on their ability to:

1.  Precisely Price Risk and Opportunity: A solver needs to know more than just the current spot price. They must model the probability of a competing solver finding a better route, the likelihood of a large swap moving the market in the next block, and the implicit cost of failing to fill an order. This requires complex, multi-faceted queries that join data from DEXs, lending markets, and bridge transactions.
2.  Optimize Liquidity Sourcing: The "winner-takes-most" dynamic of auction-based models means that marginal improvements in liquidity sourcing are paramount. Solvers must analyze fragmented liquidity across pools and chains, model gas costs, and identify arbitrage opportunities that can be bundled with user intents to offer more competitive quotes. This is a integrative problem ill-suited for static dashboards but perfectly suited for exploratory SQL analysis on a dataset like Dune's.
3.  Conduct Post-Mortem and Competitive Analysis: Why was a specific order won by a competitor? Was their quote abnormally high, suggesting a novel routing strategy? By replaying market conditions for any past block and querying the on-chain activity of competing solvers, protocols can reverse-engineer successful strategies and identify weaknesses in their own models. This forensic capability is native to Dune's historical data access.

In essence, Dune acts as a computational substrate for economic R&D. It allows small teams of researchers and developers to perform the kind of deep, quantitative market analysis that was previously the exclusive domain of large, well funded trading firms with proprietary data pipelines. To illustrate the power and convenience of Dune's server-side SQL methodology, we can point, for example, at [the main SQL query](https://dune.com/queries/5383565) we have used for aggregation of Uniswap X transactions for ROI analysis. Let's deconstruct it to highlight the meaningful parts that would be extremely difficult or impossible to achieve with standard GUI dashboards or raw APIs.

### 1. Complex, Multi-Protocol Event Aggregation

**The Query Part:**
```sql
logs AS (
  SELECT *
  FROM uniswap_ethereum.V2DutchOrderReactor_evt_Fill
  WHERE evt_block_time > now() - interval '{{days_num}}' day
  UNION ALL
  SELECT *
  FROM uniswap_ethereum.ExclusiveDutchOrderReactor_evt_Fill
  WHERE evt_block_time > now() - interval '{{days_num}}' day
)
```

**The Convenience Illustrated:**
- **What it does:** This Common Table Expression (CTE) seamlessly combines fill events from two different Uniswap X Reactor contracts into a single dataset.
- **Why it's powerful:** A GUI dashboard would likely show these as separate pages or filters. Here, an analyst can treat the entire Uniswap X ecosystem as a single entity from the start.
- **The Raw API Alternative:** You would need to:
  1. Know the exact Application Binary Interface (ABI) and deployment addresses for both contracts.
  2. Make separate `eth_getLogs` calls for each contract.
  3. Manually decode the hex data from the logs for both.
  4. Handle any schema differences between the events.

**The Dune Advantage:** The platform has already decoded both smart contracts and presented them as clean SQL tables with identical schemas, making the process of combining them trivial.

### 2. Sophisticated Filler Identification & Labeling

**The Query Part:**
```sql
coalesce(labels.name, cast(x.filler as varchar)) as filler,
x.filler as filler_address,
...
LEFT JOIN query_2812729 labels ON x.filler = labels.address
```

**The Convenience Illustrated:**
- **What it does:** It attempts to resolve a filler's hex address to a human-readable name (like 'jawn.eth' or 'Alpha Filler') by joining to a saved query (`query_2812729`), falling back to the raw address if no label exists.
- **Why it's powerful:** This demonstrates the **composability** of Dune. Someone (either the Dune team or the community) has already created and maintained a mapping of known filler addresses to names. Instead of building this list from scratch, any analyst can leverage this public good.
- **The GUI Alternative:** A platform like Arkham might show labels, but you couldn't easily use this labeled list as a base for your own custom, complex aggregations.
- **The Raw API Alternative:** You would need to create and maintain your own database of entity labels, a massive ongoing curation task.

### 3. Holistic Transaction-Level Profitability Analysis

**The Query Part:**
```sql
tx.gas_used * tx.gas_price / 1e18 * pu.price as tx_fee,
...
SUM(cast(amount as double) / pow(10, decimals) * price) as sent_amount,
...
SUM(cast(amount as double) / pow(10, decimals) * price) as received_amount,
...
SUM(cast(amount as double) / pow(10, decimals) * price) as uniswap_fee
```

**The Convenience Illustrated:**
- **What it does:** It calculates the total cost and value flows for a single trade in USD terms, including:
  - The Ethereum transaction fee (gas).
  - The total value of assets sent by the swapper.
  - The total value of assets received by the swapper.
  - The fees paid to liquidity providers (the "LP reward").
- **Why it's powerful:** This is the core of economic analysis. It allows you to calculate the **net effective cost** for the swapper and the **net profit** for the filler, which is critical for understanding the protocol's health and competitiveness.
- **The Raw API Nightmare:** To do this, you'd need to:
  1. Get the transaction receipt to calculate gas costs.
  2. Get the ETH/USD price at that exact block.
  3. For every ERC20 transfer, you'd need to:
     - Fetch the token's `decimals()` and `symbol()`.
     - Find a reliable price feed for that token at that block time.
  This turns one logical question into hundreds of RPC calls per transaction.

**The Dune Advantage:** The `prices.usd` table is a masterpiece of abstraction. With a simple join on `contract_address` and `minute`, you get a historically accurate price for almost any token, which the query uses to normalize everything to USD.

### 4. Intelligent Token Pair Normalization

**The Query Part:**
```sql
CASE
  WHEN sent.sent_token_symbol <= received.received_token_symbol THEN sent.sent_token_symbol || '-' || received.received_token_symbol
  ELSE received.received_token_symbol || '-' || sent.sent_token_symbol
END as token_pair
...
WHERE token_pair != 'WETH-WETH'
```

**The Convenience Illustrated:**
- **What it does:** It creates a canonical representation for a trading pair (e.g., ensuring both `WETH-USDC` and `USDC-WETH` are stored as `USDC-WETH`) and filters out internal WETH wraps/unwraps.
- **Why it's powerful:** This is essential for clean aggregation. Without it, your analysis would double-count volume for the same economic activity and be polluted with non-trades.
- **The GUI/API Problem:** A low-level API would just give you the raw transfers, leaving you to figure out the logic to filter out wraps. A GUI might filter them out but wouldn't let you define your own canonical pair logic for a custom report.

### Conclusion: The "Server-Side SQL" Value Proposition

This single query performs a task that sits perfectly in the "intermediate position" described above. It is far too complex and specific for a pre-built GUI dashboard, which wouldn't offer this exact view of filler economics. At the same time, it would be a multi-week engineering project using raw APIs, requiring a dedicated data engineer to build and maintain the pipelines for data decoding, price feeds, and entity labeling.

**On Dune, this complexity can be subdued by a single analyst.**

The methodology allows the researcher to focus entirely on the **economic logic** (`CASE` statements, `JOIN` conditions, `SUM` aggregations) rather than the **data engineering plumbing** (decoding logs, fetching prices, managing decimals). This is the ultimate convenience of server-side SQL: it turns deep, custom, protocol-level economic research from an infrastructure problem into a query problem.Due to the open nature of blockchains there is a lot of data that is readily available, however actually parsing and making sense of it can be more difficult. 
Throughout our research phase we used and created several resources to help monitor the transactions and activities of fillers on Uniswap X specifically.
For this specific research our client wanted to focus exclusively on transactions occuring on Ethereum mainnet. Since we can not share the exact mathematical modeling, datasets and fully applied results of our research, we will instead focus on explaining some of the methods used for monitoring & acquiring this data.

<!-- Might just remove these explanations below? Or would have to integrate them into the more complex sections without interrupting the flow of thinking -->
Dune let's anyone create both public and private dashboards which uses on-chain transaction for data visualization. 
During our research phase there were very few public dashboards through which we could see and track the activity of Uniswap X fillers easily, in fact there was only a single reliable dashboard at the time!

The Uniswap X [dashboard by @flashbots](https://dune.com/flashbots/uniswap-x) lists not only the different active fillers but also vital information such as volume, order size, fillers, transaction hashes and more. 
> **_Note:_** This dashboard might be discontinued or no longer up-to-date

Let's take a look at some of the publicly available data here.
There are 2 views by default, the top section shows information based on Weekly statistics, the lower section shows All time data. 

For now let's focus on the Weekly area. The most notable query that helps us get a better understanding of what kind of trades (and their direction) is the [Top 10 Volume Tokens Grouped by Filler](https://dune.com/queries/3053887/5081486) query. This not only shows us the top wallets (fillers) but we can clearly see that the most volume for trades occurs between the USDC & WETH (wrapped Ethereum) pair. 

(insert some pictures)

> **_Note:_** Wrapped Ethereum (wETH) is an ERC-20 token that represents Ethereum (ETH) on a 1:1 basis, making it compatible with decentralized finance (DeFi) applications and other ERC-20 compliant platforms. While ETH is the native currency of the Ethereum blockchain, it is not an ERC-20 token and cannot be used in many dApps.

Although it is quite the useful dashboard, it does not meet all our requirements in this instance. Things such as estimated ROI of fillers, transaction costs, portfolio history & allocation are not easily available or calculated through this dashboard.

Explain how to use Dune to monitor UniswapX, Fillers and so on. Share references on public dashboards we created.


## Possible profit

(insert notes about selecting budget and portfolio management, deployment)

As of writing there are currently more orders being filled on base chain (an Ethereum layer 2) than Ethereum main net. 
https://dune.com/dune/uniswap-x-orders-filled

Although the # of swaps seem to have increased from our initial time of research, the # of unique fillers has not increased proportionally. This shows that existing fillers are enjoying more volume within their markets with minimal competition. 

(something something you could also become a filler and take advantage of this)

(insert some data about a fillers profitiability? can't use angoya data ofc)

## Utilize our expertise 

As we've explained in the Monitoring & Data Acquisition section, there are not just many methods for acquiring information that make things difficult as an individual. There is also the matter of applying it with context of the general market conditions and infrastructure requirements in order to create an efficient market making engine (bot).

Through our research and experience we can alleviate the high barriers of entry that exist when wanting to become a participant in market making platforms such as Uniswap X. 

## Conclusion
