+++
title = 'Exploring real world specs with Paxos Commit'
date = 2024-03-04T20:02:48+08:00
draft = false
math = "katex"
tags = ["Program Verification", "Verification Driven Development"]
summary = "This blog demonstrates a real world specification of a distributed consensus algorithm."
aliases = ["/blog/exploring-real-world-specs-at-scale-with-paxos-commit"]
+++

The goal of this blog is to illustrate what a real-world specification looks like using the Paxos Commit algorithm. 
Paxos commit itself is a complex algorithm and  so we will discuss on it briefly and will mainly focus on TLA+ implementation.

## What is the Paxos Commit?
In the last blog, we discussed Two-Phase Commit (2PC). **Paxos Commit** is a more complex consensus protocol than (2PC), and it's designed to address some of the issues that 2PC has. For example, what if the Resource Manager fails due to internet latency? What if all nodes can't participate in the voting at the same time? Paxos Commit ensures that a group of servers can agree on a single value, even in the presence of network delays or failures, by using a majority-based mechanism. At any time, as long as majority of the nodes are active in a network, it can decide to commit. The down or delayed nodes will update themselves when they come online. We will now try to understand paxos commit with a simple example.

### High-Level Example Scenario
Let’s say we have three servers: **Server A**, **Server B**, and **Server C**. They need to agree on whether to **commit** or **abort** a transaction to transfer money between two accounts.

### Key Players
- **Proposer**: The server that proposes a value (e.g., "Let's commit the transaction").
- **Acceptors**: A majority of servers (including the proposer itself) that need to agree on the proposed value.
- **Learners**: Servers that learn the outcome of the consensus (often the same as acceptors).

### Paxos Commit Process
Paxos Commit can be broken down into three phases: **Prepare Phase**, **Accept Phase**, and **Decide Phase**.

---

### Phase 1: Prepare Phase
1. **Proposer Sends Prepare Request**:
   - Suppose **Server A** is the proposer. It wants to initiate the process for committing the transaction.
   - Server A sends a `PREPARE(n)` message to a majority of acceptors (e.g., A, B, and C).
     - Here, `n` is a unique proposal number, used to ensure that proposals are processed in order.

2. **Acceptors Respond with Promise**:
   - Each acceptor that receives the `PREPARE(n)` message responds with a `PROMISE` if `n` is higher than any previous proposal number it has seen.
   - The acceptors also include information about any previously accepted proposals (if any) with their `PROMISE`.
   - This prevents acceptors from accepting proposals with a lower number later on.

---

### Phase 2: Accept Phase
3. **Proposer Sends Accept Request**:
   - If **Server A** (the proposer) receives `PROMISE` responses from a majority (e.g., B and C), it selects a value (e.g., `COMMIT`).
   - It then sends an `ACCEPT(n, v)` message to the same acceptors, where `v` is the value chosen (in this case, `COMMIT`).

4. **Acceptors Respond**:
   - Each acceptor that receives an `ACCEPT(n, v)` message checks if `n` is still the highest proposal number it has seen.
   - If so, it sends back an `ACCEPTED(n, v)` response, acknowledging that it has accepted this proposal.

---

### Phase 3: Decide Phase
5. **Proposer Decides on a Value**:
   - If the proposer (**Server A**) receives `ACCEPTED` responses from a majority (e.g., B and C), it knows that a majority has agreed on `v = COMMIT`.
   - **Server A** then sends a `DECIDE(COMMIT)` message to all the servers (including the acceptors).

6. **Acceptors Commit the Decision**:
   - Upon receiving the `DECIDE(COMMIT)` message, each server (including A, B, and C) commits the transaction locally.

---

### Summary of the Example
- **Server A** proposes a `COMMIT` for the transaction.
- It gets promises from a majority of servers (B and C).
- After receiving these promises, it sends an `ACCEPT` message with the decision.
- If a majority of servers acknowledge the `ACCEPT`, it finalizes the decision by sending out a `DECIDE(COMMIT)` message.

This ensures that the transaction is either committed or aborted based on the consensus of a majority of servers, even if some servers fail during the process.

---

### Why is Paxos Commit More Reliable than 2PC?
- **Majority Agreement**: Instead of relying on a single coordinator, the decision depends on a majority of servers. This means that even if one or two servers fail, the protocol can still proceed.
- **Non-Blocking Nature**: If a proposer fails midway, another server can take over as the new proposer using a higher proposal number, making the system more resilient to failures.

### Example of a Potential Failure and Recovery
- If **Server A** fails after sending `ACCEPT(n, COMMIT)` but before sending `DECIDE(COMMIT)`, **Server B** or **Server C** could become a new proposer.
- They can start a new round with a higher proposal number (e.g., `n+1`) and get promises from the other servers to continue the process.

This example illustrates how Paxos Commit builds upon the core ideas of 2PC but with a focus on handling failures and ensuring progress, making it suitable for distributed systems where consensus is critical.

## Defining Paxos Commit Spec in TLA+
We will now use the simplified specs provided by Lamport to demonstraate how Paxos Commit works. Interested ones can read the actual paper "Consensus on Transaction Commit" if they are curious on the total specs that include liveness properties.

#### 1. **Modules and Extending Integers**:
   The Paxos TLA+ module starts with extending standard mathematical modules like `Integers`, which allows us to work with numbers in defining proposal numbers and operations like `maximum`.

   ```tla
   ----------------------------- MODULE Paxos ----------------------------
   EXTENDS Integers
   ```

   This imports arithmetic operations, allowing us to work with sets and choose maximum values, which is crucial for comparing proposal numbers.

#### 2. **Constants Declaration**:
   We declare constants to represent key elements like resource managers (`RM`), acceptors, majorities, and ballot numbers.

   ```tla
  CONSTANT RM, Acceptor, Majority, Ballot
   ```
This line declares four constants:
- `RM`: The set of resource managers (e.g., database nodes).
- `Acceptor`: The set of acceptors (e.g., quorum members).
- `Majority`: The set of majority sets of acceptors.
- `Ballot`: The set of ballot numbers (used in Paxos rounds).

---


#### 3. **State Variables**:
   State variables represent the dynamic parts of the system, including:
   - `rmState`: Tracks the state of each resource manager.
   - `aState`: Represents the state of each acceptor.
   - `msgs`: A set of all messages ever sent during the execution.

   ```tla
   VARIABLES rmState, aState, msgs
   ```

   These variables are updated as the algorithm progresses through its phases.
Certainly! Here’s the full explanation without any omissions.

---


#### 4. CONSTANT Assumptions
```tla
ASSUME  
  /\ Ballot \subseteq Nat
  /\ 0 \in Ballot
  /\ Majority \subseteq SUBSET Acceptor
  /\ \A MS1, MS2 \in Majority : MS1 \cap MS2 # {}
```
This section sets assumptions for the constants:
- `Ballot` is a subset of natural numbers (`Nat`).
- `0` is included in `Ballot`.
- `Majority` consists of subsets of `Acceptor`, representing majority sets.
- Any two majority sets in `Majority` have a non-empty intersection, which is key to ensuring consensus.

---

#### 5. Messages Definition
```tla
Messages ==
  [type : {"phase1a"}, ins : RM, bal : Ballot \ {0}] 
      \cup
  [type : {"phase1b"}, ins : RM, mbal : Ballot, bal : Ballot \cup {-1},
   val : {"prepared", "aborted", "none"}, acc : Acceptor] 
      \cup
  [type : {"phase2a"}, ins : RM, bal : Ballot \ {0}, val : {"prepared", "aborted"}] 
      \cup
  [type : {"phase2b"}, ins : RM, bal : Ballot \ {0}, acc : Acceptor,
   val : {"prepared", "aborted"}] 
      \cup
  [type : {"Commit", "Abort"}, ins : RM]
```
This defines `Messages` as a set of records representing the various messages that can be sent in the protocol:
- `"phase1a"`: Request to initiate Phase 1.
- `"phase1b"`: Response to a `"phase1a"` message, including details like `mbal` (the highest accepted ballot) and `val` (the value, which could be `"prepared"`, `"aborted"`, or `"none"`).
- `"phase2a"`: Phase 2 initiation message for a particular ballot and value.
- `"phase2b"`: Response to a `"phase2a"` message, specifying the acceptor's response to the proposal.
- `"Commit"` or `"Abort"`: Decision messages that are sent once consensus has been reached.

---

#### 6. PCTypeOK (Type Correctness)
```tla
PCTypeOK ==  
  /\ rmState \in [RM -> {"working", "prepared", "committed", "aborted"}]
  /\ aState  \in [RM -> [Acceptor -> [mbal : Ballot, bal : Ballot \cup {-1}, val : {"prepared", "aborted", "none"}]]]
  /\ msgs \subseteq Messages
```
This invariant enforces that:
- `rmState` for each resource manager is one of the states: `"working"`, `"prepared"`, `"committed"`, or `"aborted"`.
- `aState` keeps track of each acceptor’s `mbal`, `bal`, and `val` values for each instance.
- `msgs` is a subset of `Messages`, ensuring that all messages conform to valid message formats.

---

#### 7. PCInit (Initialization)
```tla
PCInit ==  
  /\ rmState = [r \in RM |-> "working"]
  /\ aState  = [r \in RM |-> [ac \in Acceptor |-> [mbal |-> 0, bal |-> -1, val |-> "none"]]]
  /\ msgs = {}
```
This initialization predicate defines:
- `rmState` starts with each resource manager (`r`) in the `"working"` state.
- `aState` is initialized with each acceptor (`ac`) in each instance having `mbal` as `0`, `bal` as `-1`, and `val` as `"none"`.
- `msgs` is initialized as an empty set, indicating no messages have been sent initially.

---

#### 8. Send Action
```tla
Send(m) == msgs' = msgs \cup {m}
```
The `Send(m)` action represents the act of sending a message by adding it to the `msgs` set.

---

#### 9. RM Actions
##### 9.1 RMPrepare Action
```tla
RMPrepare(r) == 
  /\ rmState[r] = "working"
  /\ rmState' = [rmState EXCEPT ![r] = "prepared"]
  /\ Send([type |-> "phase2a", ins |-> r, bal |-> 0, val |-> "prepared"])
  /\ UNCHANGED aState
```
This action, `RMPrepare(r)`, is executed by a resource manager (`r`) and:
1. Checks if `rmState[r]` is `"working"`.
2. Transitions `rmState[r]` to `"prepared"`.
3. Sends a `"phase2a"` message for ballot `0` with `"prepared"` as the value.
4. Leaves `aState` unchanged.

##### 9.2 RMChooseToAbort Action
```tla
RMChooseToAbort(r) ==
  /\ rmState[r] = "working"
  /\ rmState' = [rmState EXCEPT ![r] = "aborted"]
  /\ Send([type |-> "phase2a", ins |-> r, bal |-> 0, val |-> "aborted"])
  /\ UNCHANGED aState
```
The `RMChooseToAbort(r)` action:
1. Requires that `rmState[r]` is `"working"`.
2. Sets `rmState[r]` to `"aborted"`.
3. Sends a `"phase2a"` message with `"aborted"` as the value for ballot `0`.
4. Leaves `aState` unchanged.

---

#### 10. Leader Actions
##### 10.1 Phase1a
```tla
Phase1a(bal, r) ==
  /\ Send([type |-> "phase1a", ins |-> r, bal |-> bal])
  /\ UNCHANGED <<rmState, aState>>
```
The `Phase1a` action initiates the first phase of the Paxos protocol for a given ballot (`bal`) and instance (`r`). It:
1. Sends a `"phase1a"` message.
2. Leaves both `rmState` and `aState` unchanged.
---


Certainly! Here’s the explanation for the **remaining sections**.

---

##### 10.2 Phase2a 
```tla
Phase2a(bal, r, val) ==
  /\ Send([type |-> "phase2a", ins |-> r, bal |-> bal, val |-> val])
  /\ UNCHANGED <<rmState, aState>>
```
The `Phase2a` action represents the leader’s decision to move to the second phase of Paxos for a given ballot (`bal`), instance (`r`), and value (`val`). It:
1. Sends a `"phase2a"` message with the ballot number and chosen value (e.g., `"prepared"` or `"aborted"`).
2. Leaves both `rmState` and `aState` unchanged.

---
#### 11. Acceptor Action
##### 11.1 Phase1b 
```tla
Phase1b(msg) ==
  LET r == msg.ins
      bal == msg.bal
  IN
    /\ msg.type = "phase1a"
    /\ \E ac \in Acceptor :
         /\ aState[r][ac].mbal <= bal
         /\ aState' = [aState EXCEPT ![r][ac] = [aState[r][ac] EXCEPT !.mbal = bal]]
         /\ Send([type |-> "phase1b", ins |-> r, mbal |-> bal, bal |-> aState[r][ac].bal,
                  val |-> aState[r][ac].val, acc |-> ac])
    /\ UNCHANGED rmState
```
In `Phase1b`, an acceptor processes a `"phase1a"` message by:
1. Checking if the message is of type `"phase1a"`.
2. Verifying that there exists an acceptor `ac` such that `aState[r][ac].mbal <= bal`.
3. Updating `aState[r][ac].mbal` to the new ballot value (`bal`).
4. Sending a `"phase1b"` message back, including the instance `r`, updated `mbal`, and the previous ballot and value for that acceptor.
5. Leaving `rmState` unchanged.

---

##### 11.2 Phase2b 
```tla
Phase2b(msg) ==
  LET r == msg.ins
      bal == msg.bal
      val == msg.val
  IN
    /\ msg.type = "phase2a"
    /\ \E ac \in Acceptor :
         /\ aState[r][ac].mbal = bal
         /\ aState' = [aState EXCEPT ![r][ac] = [aState[r][ac] EXCEPT !.bal = bal, !.val = val]]
         /\ Send([type |-> "phase2b", ins |-> r, bal |-> bal, acc |-> ac, val |-> val])
    /\ UNCHANGED rmState
```
In `Phase2b`, an acceptor processes a `"phase2a"` message by:
1. Checking that the message type is `"phase2a"`.
2. Ensuring there is an acceptor `ac` with `aState[r][ac].mbal` equal to `bal`.
3. Updating `aState[r][ac].bal` and `aState[r][ac].val` to reflect the new ballot and value from the `"phase2a"` message.
4. Sending a `"phase2b"` message with the instance, updated ballot, and value.
5. Leaving `rmState` unchanged.

---

#### 12. Commit Action
```tla
Commit(r) ==
  /\ \A ac \in Acceptor : aState[r][ac].val = "prepared"
  /\ rmState' = [rmState EXCEPT ![r] = "committed"]
  /\ Send([type |-> "Commit", ins |-> r])
  /\ UNCHANGED aState
```
In `Commit`, a resource manager commits to the `"prepared"` state by:
1. Ensuring all acceptors (`ac`) for instance `r` have their `aState[r][ac].val` set to `"prepared"`.
2. Updating `rmState[r]` to `"committed"`.
3. Sending a `"Commit"` message for instance `r`.
4. Leaving `aState` unchanged.

---

#### 13. Abort Action
```tla
Abort(r) ==
  /\ \E ac \in Acceptor : aState[r][ac].val = "aborted"
  /\ rmState' = [rmState EXCEPT ![r] = "aborted"]
  /\ Send([type |-> "Abort", ins |-> r])
  /\ UNCHANGED aState
```
In `Abort`, a resource manager aborts the transaction for instance `r` if:
1. Any acceptor (`ac`) has `aState[r][ac].val` set to `"aborted"`.
2. Updates `rmState[r]` to `"aborted"`.
3. Sends an `"Abort"` message for instance `r`.
4. Leaves `aState` unchanged.

---

#### 14. Next (Complete Action Definition)
```tla
Next ==
  \/ \E r \in RM : RMPrepare(r) \/ RMChooseToAbort(r)
  \/ \E bal \in Ballot : \E r \in RM : Phase1a(bal, r)
  \/ \E msg \in msgs : Phase1b(msg) \/ Phase2a(msg.bal, msg.ins, msg.val) \/ Phase2b(msg)
  \/ \E r \in RM : Commit(r) \/ Abort(r)
```
The `Next` action defines all possible transitions in the protocol:
- Resource managers can initiate `RMPrepare` or `RMChooseToAbort`.
- Leaders can initiate `Phase1a`.
- Acceptors respond with `Phase1b`, `Phase2a`, or `Phase2b` based on the received message.
- Resource managers finalize by committing or aborting based on the acceptors’ values.

---

The final part of the specification includes defining the complete specification (`PCSpec`) of the Paxos Commit protocol and verifying its correctness by showing it implements a generic transaction commit protocol (`TCSpec`) from the `TCommit` module. Here’s an explanation of each section with full definitions.

---

#### 15. Complete Specification (PCSpec)
```tla
PCSpec == PCInit /\ [][PCNext]_<<rmState, aState, msgs>>
```
The `PCSpec` (Paxos Commit Specification) defines the complete behavior of the protocol:
1. **Initial State**: `PCInit` specifies the initial conditions for the Paxos Commit protocol.
2. **Invariant on `PCNext` Transitions**: `[][PCNext]_<<rmState, aState, msgs>>` indicates that every transition step, represented by `PCNext`, preserves the overall state variables (`rmState`, `aState`, and `msgs`).

The full specification combines `PCInit` with all allowable actions in `PCNext`, covering the protocol’s entire progression from initialization to termination.

---

##### 15.1 Type Invariant Theorem (`PCTypeOK`)
```tla
THEOREM PCSpec => []PCTypeOK
```
The theorem `PCSpec => []PCTypeOK` asserts that `PCSpec` satisfies `PCTypeOK` at every state. `PCTypeOK` is a type invariant that ensures all values within `PCSpec` (like ballot numbers, instance values, and acceptor states) remain within defined and allowable types. This verification step guarantees that every action within the protocol maintains type consistency.

---

##### 15.2 Transaction Commit Protocol Implementation (`TCSpec`)
```tla
INSTANCE TCommit
```
This line imports the `TCommit` module, which defines a generic transaction commit protocol (`TCSpec`). By importing `TCommit`, the Paxos Commit module can verify that its behavior is consistent with the transaction commit protocol.


```tla
THEOREM PCSpec => TCSpec
```
The theorem `PCSpec => TCSpec` establishes that the Paxos Commit protocol (`PCSpec`) satisfies the requirements of the generic transaction commit protocol (`TCSpec`). It shows that:
- Every execution of `PCSpec` conforms to the transaction commit protocol in `TCommit`.
- The Paxos Commit protocol correctly implements a transaction commit protocol through the two-phase commit actions (prepare and commit/abort).


## Conclusion
This blog aims to provide a comprehensive yet approachable overview of the Paxos algorithm, its working, and its formal definition using TLA+. For those eager to dive deeper, studying the original papers by Leslie Lamport and experimenting with TLA+ models can offer further insights into this fascinating topic.

