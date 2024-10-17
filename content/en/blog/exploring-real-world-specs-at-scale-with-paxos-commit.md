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

The **Paxos algorithm** is a fault-tolerant distributed consensus protocol. It allows a group of nodes (called "acceptors" in Paxos terminology) to agree on a single value even when some nodes may fail or the network may partition. It ensures that once a value is chosen, it remains chosen, maintaining consistency across the nodes.

Paxos is particularly useful for coordinating actions in distributed systems, such as database replication, leader election, or distributed configuration management. The protocol's key features include:

- **Safety**: Paxos guarantees that only one value is chosen and that chosen values do not change.
- **Fault Tolerance**: It can tolerate failures of some nodes, as long as a majority (quorum) of nodes remain operational.
- **Asynchronous Operation**: Paxos makes no assumptions about message delivery times, making it suitable for networks with unpredictable delays.

Paxos divides participants into three roles:
- **Proposers**: Propose values to be agreed upon.
- **Acceptors**: Vote on proposed values and help reach consensus.
- **Learners**: Learn the chosen value and act on the decision.

Despite its theoretical elegance, Paxos is known for being challenging to understand and implement due to the intricate interplay between its phases and roles. Variants like Multi-Paxos and Raft have been developed to address some of these complexities.

---

### Example of How Paxos Works

To better understand the Paxos algorithm, let’s walk through a simplified example:

1. **Preparation Phase**:
   - A **proposer** (e.g., Node A) selects a proposal number `n` and sends a "prepare" request to a majority of **acceptors**.
   - Each **acceptor** responds with a promise not to accept any proposal with a number less than `n`. If the acceptor has already accepted a proposal with a number `n'` (where `n' < n`), it includes that proposal’s value in its response.

2. **Acceptance Phase**:
   - If the proposer receives a majority of promises, it sends an "accept" request to the same acceptors, proposing a value `v`. If any of the acceptors returned a previously accepted proposal in the preparation phase, the proposer must propose the value from the highest-numbered proposal it received.
   - The **acceptors** then decide whether to accept the proposal based on the conditions of the promise they made earlier.

3. **Commitment Phase**:
   - Once a majority of **acceptors** have accepted a proposal, the value is considered **chosen**.
   - The proposer then sends a message to **learners** (potentially including itself) to inform them of the chosen value.

#### Example Scenario:
- Three nodes (A, B, C) are running Paxos.
- Node A proposes a value `5` with proposal number `n=1` and sends a "prepare" request to B and C.
- B and C promise not to accept any proposals with a number less than `1`.
- A then sends an "accept" request for value `5` with `n=1`.
- If B and C accept this proposal, the value `5` is chosen.
- A then notifies the other nodes that `5` is the agreed-upon value.

The key aspect of Paxos is that even if A crashes after sending the accept request, the agreement on `5` remains intact as long as a majority of nodes remember it. This resilience against failures makes Paxos a reliable choice for consensus in distributed systems.

---

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

