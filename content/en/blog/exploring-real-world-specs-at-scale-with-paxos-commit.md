+++
title = 'Exploring real world specs at scale with Paxos Commit'
date = 2024-03-04T20:02:48+08:00
draft = false
math = "katex"
tags = ["Program Verification", "Verification Driven Development"]
summary = "This blog demonstrates a real world specification of a distributed consensus algorithm."
aliases = ["/blog/exploring-real-world-specs-at-scale-with-paxos-commit"]
+++

### Understanding Paxos: Achieving Consensus in Distributed Systems

In the realm of distributed systems, achieving consensus across multiple nodes or servers is a fundamental challenge, especially when these nodes can fail or experience network issues. The **Paxos algorithm**, a protocol designed by Leslie Lamport, addresses this challenge by enabling a group of nodes to agree on a single value despite failures. It has become a cornerstone for building reliable, fault-tolerant systems. In this blog, we will explore what the Paxos algorithm is, walk through an example of how it works, and look at how it can be formally defined using TLA+.

---

### What is the Paxos Algorithm?
Certainly! **Paxos Commit** is a more complex consensus protocol than Two-Phase Commit (2PC), and it's designed to address some of the issues that 2PC has, like blocking due to the failure of the coordinator. Paxos Commit ensures that a group of servers can agree on a single value, even in the presence of network delays or failures, by using a majority-based mechanism.

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

### Why is Paxos Commit More Reliable?
- **Majority Agreement**: Instead of relying on a single coordinator, the decision depends on a majority of servers. This means that even if one or two servers fail, the protocol can still proceed.
- **Non-Blocking Nature**: If a proposer fails midway, another server can take over as the new proposer using a higher proposal number, making the system more resilient to failures.

### Example of a Potential Failure and Recovery
- If **Server A** fails after sending `ACCEPT(n, COMMIT)` but before sending `DECIDE(COMMIT)`, **Server B** or **Server C** could become a new proposer.
- They can start a new round with a higher proposal number (e.g., `n+1`) and get promises from the other servers to continue the process.

This example illustrates how Paxos Commit builds upon the core ideas of 2PC but with a focus on handling failures and ensuring progress, making it suitable for distributed systems where consensus is critical.

### Defining Paxos in TLA+

The **Temporal Logic of Actions (TLA+)** is a formal specification language designed to model concurrent and distributed systems. It allows us to define systems like Paxos rigorously and verify their properties. Here’s how we can define Paxos in TLA+ and what each section represents:

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

   These constants allow us to define the roles and structure of the Paxos participants.

#### 3. **State Variables**:
   State variables represent the dynamic parts of the system, including:
   - `rmState`: Tracks the state of each resource manager.
   - `aState`: Represents the state of each acceptor.
   - `msgs`: A set of all messages ever sent during the execution.

   ```tla
   VARIABLES rmState, aState, msgs
   ```

   These variables are updated as the algorithm progresses through its phases.

#### 4. **Message Definitions**:
   Messages are defined for each phase of the algorithm, including "prepare", "accept", and decision messages like "Commit" and "Abort".

   ```tla
   Messages == [type : {"phase1a"}, ins : RM, bal : Ballot \ {0}]
        	\cup ...
        	\cup [type : {"Commit", "Abort"}]
   ```

   This definition outlines the types of messages that can be sent between nodes, enabling the system to progress through different states.

#### 5. **Actions**:
   Actions define the transitions between states, specifying how and when messages are sent or decisions are made. For example:

   - **RMPrepare**: A resource manager prepares by sending a phase 2a message.
   - **Phase1a**: The proposer initiates a new round of voting with a new ballot number.
   - **PCDecide**: The leader announces a decision once a majority has accepted a value.

   ```tla
   Send(m) == msgs' = msgs \cup {m}
   RMPrepare(r) == /\ rmState[r] = "working"
               	/\ rmState' = [rmState EXCEPT ![r] = "prepared"]
               	/\ Send([type |-> "phase2a", ins |-> r, bal |-> 0, val |-> "prepared"])
   ```

   These actions describe the transitions of each role within the Paxos protocol.

#### 6. **Invariants and Specification**:
   The complete specification of the Paxos protocol includes defining invariants that ensure type correctness and safety properties.

   ```tla
   PCTypeOK == /\ rmState \in [RM -> {"working", "prepared", "committed", "aborted"}]
           	/\ aState  \in [RM -> [Acceptor -> ...]]
           	/\ msgs \subseteq Messages

   PCSpec == PCInit /\ [][PCNext]_<<rmState, aState, msgs>>
   ```

   - `PCTypeOK` asserts that the system maintains type consistency.
   - `PCSpec` combines the initial state with transitions to form a complete model of Paxos.

#### 7. **Theorems**:
   TLA+ specifications often include theorems to verify that the model satisfies certain properties, such as correctness and consistency of decisions:

   ```tla
   THEOREM PCSpec => []PCTypeOK
   ```

   This theorem asserts that the Paxos specification maintains type correctness across all states.

---

### Conclusion: Why Paxos Matters

The Paxos algorithm represents a critical advancement in distributed computing, allowing systems to maintain consistency and availability even in the presence of failures. While its concepts can be complex, tools like TLA+ make it possible to rigorously specify and verify the behavior of Paxos, ensuring that the implementation matches the intended design.

Understanding Paxos is essential for anyone building distributed systems, from databases to cloud services, where reliability and fault tolerance are key. While the algorithm itself is challenging, its principles are foundational in the development of many modern consensus protocols, making it a topic worth mastering for any aspiring system architect or developer.

By exploring how Paxos works and how it can be defined in TLA+, we gain a deeper appreciation for the complexity of achieving consensus in a distributed world and the mathematical elegance behind its solution.

---

This blog aims to provide a comprehensive yet approachable overview of the Paxos algorithm, its working, and its formal definition using TLA+. For those eager to dive deeper, studying the original papers by Leslie Lamport and experimenting with TLA+ models can offer further insights into this fascinating topic.

