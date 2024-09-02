+++
title = "Commit to marriage with TLA+ pt.2"
date = 2024-05-01T11:21:45+05:00
draft = false
math = "katex"
summary = "The second part of the conspect of the \"Intoduction to TLA+\" course by Leslie Lamport."
tags = ["Temporal Logic", "TLA+", "Model checking", "Alrorithms"]
aliases = ["/blog/commit-to-marriage-with-tla-plus-2"]
+++

## Table of Contents

- [Introduction](#introduction)
- [Transaction Commit](#transaction-commit)
- [Two-Phase Commit](#two-phase-commit)
- [Conclusion](#conclusion)
- [Notes](#notes)
- [References](#references)

## Introduction

This is the second blog post (here is the first one [[1]]) in the series of the conspectus of the "Introduction to TLA+" course by Leslie Lamport. As usual, all credits are to Leslie Lamport and his course that can be found on his [website][2]. In this part, we will consider the _Transaction Commit_ and _Two-Phase Commit_ algorithms.

## Transaction Commit

In the first part we consider the _Transaction Commit_ algorithm [[3]], pp.2-4. In a distributed system, a transaction commit involves multiple resource managers (RMs) across different nodes that must unanimously decide to either commit or abort a transaction. The protocol ensures that all RMs either reach a committed state or an aborted state, supported by the conditions of stability and consistency, which mandate that once an RM reaches one of these states, it cannot revert, and no RM can be in the opposite state.

A database transaction is performed by a collection of processes called _resource managers_. A transaction can either _commit_ or _abort_. It can commit only iif all resource manages are prepared to commit and must abort if any resource manager wants to abort.

> All resource managers must agree on whether a transaction is committed or aborted.
{.important}

```goat
.------------.                
|   working  +---------.      
'-----+------'         |      
      |                |
      v                |      
.------------.         |      
|  prepared  |         |      
'-----+------'         |      
      |                |     
      v                v
.------------.   .-----------.
|  commited  |   |  aborted  |
'------------'   '-----------'
```

<span class="goat-caption">Fig. 1 The state/transition diagram of each resource manager</span>

Now, we consider the transcation commit spec with the details. You can find the full text below, under the black triangle.

{{< detail-tag "The full TCommit spec text is here" >}}

```tlaplus
------------------------------ MODULE TCommit ------------------------------
(***************************************************************************)
(* This specification is explained in "Transaction Commit", Lecture 5 of   *)
(* the TLA+ Video Course.                                                  *)
(***************************************************************************)
CONSTANT RM       \* The set of participating resource managers

VARIABLE rmState  \* rmState[rm] is the state of resource manager rm.
-----------------------------------------------------------------------------
TCTypeOK == 
  (*************************************************************************)
  (* The type-correctness invariant                                        *)
  (*************************************************************************)
  rmState \in [RM -> {"working", "prepared", "committed", "aborted"}]
        
TCInit ==   rmState = [r \in RM |-> "working"]
  (*************************************************************************)
  (* The initial predicate.                                                *)
  (*************************************************************************)

canCommit == \A r \in RM : rmState[r] \in {"prepared", "committed"}
  (*************************************************************************)
  (* True iff all RMs are in the "prepared" or "committed" state.          *)
  (*************************************************************************)

notCommitted == \A r \in RM : rmState[r] # "committed" 
  (*************************************************************************)
  (* True iff no resource manager has decided to commit.                   *)
  (*************************************************************************)
-----------------------------------------------------------------------------
(***************************************************************************)
(* We now define the actions that may be performed by the RMs, and then    *)
(* define the complete next-state action of the specification to be the    *)
(* disjunction of the possible RM actions.                                 *)
(***************************************************************************)
Prepare(r) == /\ rmState[r] = "working"
              /\ rmState' = [rmState EXCEPT ![r] = "prepared"]

Decide(r)  == \/ /\ rmState[r] = "prepared"
                 /\ canCommit
                 /\ rmState' = [rmState EXCEPT ![r] = "committed"]
              \/ /\ rmState[r] \in {"working", "prepared"}
                 /\ notCommitted
                 /\ rmState' = [rmState EXCEPT ![r] = "aborted"]

TCNext == \E r \in RM : Prepare(r) \/ Decide(r)
  (*************************************************************************)
  (* The next-state action.                                                *)
  (*************************************************************************)
-----------------------------------------------------------------------------
TCConsistent ==  
  (*************************************************************************)
  (* A state predicate asserting that two RMs have not arrived at          *)
  (* conflicting decisions.  It is an invariant of the specification.      *)
  (*************************************************************************)
  \A r1, r2 \in RM : ~ /\ rmState[r1] = "aborted"
                       /\ rmState[r2] = "committed"
-----------------------------------------------------------------------------
(***************************************************************************)
(* The following part of the spec is not discussed in Video Lecture 5.  It *)
(* will be explained in Video Lecture 8.                                   *)
(***************************************************************************)
TCSpec == TCInit /\ [][TCNext]_rmState
  (*************************************************************************)
  (* The complete specification of the protocol written as a temporal      *)
  (* formula.                                                              *)
  (*************************************************************************)

THEOREM TCSpec => [](TCTypeOK /\ TCConsistent)
  (*************************************************************************)
  (* This theorem asserts the truth of the temporal formula whose meaning  *)
  (* is that the state predicate TCTypeOK /\ TCInvariant is an invariant   *)
  (* of the specification TCSpec.  Invariance of this conjunction is       *)
  (* equivalent to invariance of both of the formulas TCTypeOK and         *)
  (* TCConsistent.                                                         *)
  (*************************************************************************)


=============================================================================
```

{{< /detail-tag >}}

<br/>

In $TLA^+$ every value is a set but the semantics of $TLA^+$ does not say what elements of a set are.
The expression `rmState \in [RM -> {"working", "prepared", "committed", "aborted"}]` represents a set of possible states that `rmState` can have according to the Fig. 1.

The `TCInit` declares an initial `rmState` which represents the array with the index set `RM` such that: $[r \in RM \mapsto working][rm]$ is an array, applied to the $rm$ equals the string $working$ for every resource manager $rm$, for all $r$ in $RM$.

Simply saying: $\forall r \in RM, RM(rm) = working$. 

The $TLA^+$ syntax for an array expression is as follows: $[ variable \in set \mapsto expression]$, where $\mapsto$ looks like |-> in ASCII.

> For example: `sqr = [ i \in 1..42 |-> i**2]`, defines `sqr` to be an array with index set from 1 to 42 such that `sqr[i] = i**2` for all `i` in the range from 1 to 42.

**Terminology that used in programming and math for the same things**

Now, we need to take into account the terminology that is used in programming, math, and $TLA^+$. The terms on each row are equivalent.

| Programming | Math                 |
| ----------- | -------------------- |
| array       | function             |
| index set   | domain of a function |
| $f[e]$      | $f(e)$               |

In $TLA^+$ we write formulas, not programs, so it uses the function and domain terminology; however, the $f[e]$ notation is used instead of $f(e)$ to escape possible ambiguity with other mathematical operations.

> $TLA^+$ allows a function to have any set as its domain — even an infinite set, for example, the set of all integers.
{.note}

Consider the group of formulas, including $Prepare$ and $Decide$ formulas, that defines states transitions of resource managers.

The formula $\exists r \in RM : Prepare(r) \lor Decide(r)$ is $true$ iif there exists some $r$ in the set $RM$ where $Prepare(r) \lor Decide(r)$ is $true$.

Suppose `RM = { "r1", "r2", "r3", "r4" }` then this formula equals to the following set of disjunctives:

```tlaplus
\/ Prepare("r1") \/ Decide("r1")
\/ Prepare("r2") \/ Decide("r2")
\/ Prepare("r3") \/ Decide("r3")
\/ Prepare("r4") \/ Decide("r4")
```

$\exists$ declares `r` to be local to a formula.

In case we define this formula with $\forall r$ instead $\exists r$ as follows: $\forall r \in RM : \text{Prepare}(r) \lor \text{Decide}(r)$, reads as "for all $r$ in $\text{RM}$..." in the same assumption regarding the values of $\text{RM}$ as above, this formula equals to the following

```tlaplus
/\ Prepare("r1") \/ Decide("r1")
/\ Prepare("r2") \/ Decide("r2")
/\ Prepare("r3") \/ Decide("r3")
/\ Prepare("r4") \/ Decide("r4")
```

Recall the transition graph of the RM.
$Prepare(r)$ describes the $working \rightarrow prepared$ state of the resource manager $r$.
This step can only take place if the current state of $r$ is $working$.
$Prepare(r) \equiv \land rmState[r] = working$ where $\land rmState[r] = working$ must be $true$.

The spec cannot say what the new state of $rmState'[r] = prepared$ is. It must say what the entire set of the $rmState'$ function is. The value of this function must be a function of the domain $RM$ like the following: $rmState' = [s \in RM \mapsto ...]$ where $...$ must be replaced with the new value of $rmState[s]$ for each resource manager $s$.

If $s$ is a resource manager $r$ then the value of the $RM$ state in a new state should be $prepared$ , any other resource managers should have a value in the new state same as in the old state.

Here is the complete definition:
{{< math >}}
$$
\begin{split} \text{Prepare}(r) \equiv & \land rmState[r] = \text{working} \\
& \land rmState' = [rmState EXCEPT \space ![r] = \text{prepared}]
\end{split}
$$
{{< /math >}}

$\text{Decide}(r)$ describes possible steps in which a resource manager $r$ reaches $\text{commited}$ or $\text{aborted}$ state. Its the disjunctions of two formulas describing the transition $\text{prepared} \rightarrow \text{commited}$ which can only occur if $r$ in the $\text{prepared}$ state.

$r$ can commit only if every resource manager is in the $\text{prepared}$ or in the $\text{commited}$ state. The second disjunction describes possible transitions to the $\text{abord}$ state. This transition can happen if $r$ state is $\text{working}$ or $\text{prepared}$ state. $r$ can abort only if no other resource manager is $\text{committed}$.

{{< math >}}
$$
\begin{split}
\text{Decide}(r) \equiv \lor & \land rmState[r] = \text{prepared} \\
& \land \text{canCommit} \\
& \land rmState' = [rmState EXCEPT \space ![r] = \text{commited}] \\
\lor & \land rmState[r] \in \{ \text{working}, \text{prepared} \} \\
& \land notCommited \\
& \land rmState' = [rmState EXCEPT \space ![r] = \text{aborted}]
\end{split}
$$
{{< /math >}}

Now, we can define two formulas: $\text{canCommit}$ and $\text{notCommited}$.

We can commit a transaction if and only if all resource managers are in either $\text{prepared}$ or $\text{commited}$ state: $\forall s \in \text{RM} : \text{rmState}[s] \in \\{ \text{prepared}, \text{committed} \\}$.
And a transaction is not committed if all resource managers' state not equals $\text{commited}$ : $\forall s \in \text{RM} : \text{rmState}[s] \neq \text{committed}$.

> It is important to remember that to check a model we need to provide a set of invariants to be checked (a formula that is always $true$). This invariant is presented as 
{.important}

{{< math >}}
$$
\begin{split}
TCConsistent \equiv  \forall r1, r2 \in RM : & \neg \land rmState[r1] = \text{aborted} \\
& \land rmState[r2] = \text{committed}
\end{split}
$$
{{< /math >}}

After considering the $TCommit$ spec, and getting familiar with the used formulas and their semantics, we can proceed with more advanced example of the _Two-Phase Commit_ algorithm.

## Two-Phase Commit

To understand the _Two-Phase Commit_ algorithm, we recommend to read about it ([[3]], pp.5-7) and watch a video from Martin Kleppmann, which is a part of his great _Distributed Systems_ course.

In a nutshell, the _Two-Phase Commit_ protocol in distributed systems involves a transaction manager (TM) that coordinates the commitment process among resource managers (RMs), who follow a two-step communication process to either commit or abort a transaction. The protocol starts with an RM entering the prepared state and signaling the TM, which then instructs all RMs to prepare; if all RMs are prepared, the TM commands them to commit, or to abort if any RM cannot prepare. This method ensures consistency but can be costly and vulnerable to blocking if the TM fails.

{{< youtube -_rdWB9hN1c >}}

Before considering the spec for the _Two-Phase Commit_ algorithm, we need to understand the concept of _records_ in the $TLA^+$.

The $r \equiv [ \text{prof} \mapsto \text{"Fred"}, \text{num} \mapsto 42]$ defines $r$ to be a _record_ with two fields $\text{prof}$ and $\text{num}$. It roughly corresponds to `struct` in `C`.

This record is actually a function $f$ with the domain $\\{\text{"prof"},\text{"num"}\\}$, such that $f[\text{"prof"}] = \text{"Fred"}$ and $f[\text{"num"}] = 42$. Actually, record fields are accessible by the dot notation $f.prof$ as an abbreviation for $f[\text{"prof"}]$.

A notation $[f \space \text{EXCEPT!} [\text{"prof"}]=\text{"Red"}]$ equals to the same record as $f$ except its $\text{"prof"}$ field equals to $\text{"Red"}$. This expression can also be written as $[f \space \text{EXCEPT!.prof} = \text{"Red"}]$.

Now, we can consider the _Two-Phase Commit_ spec with the details. You can find the full text below, under the black triangle.

{{< detail-tag "The full TwoPhase spec text is here" >}}

```tlaplus
------------------------------ MODULE twophase ------------------------------

(***************************************************************************)
(* This specification is discussed in "Two-Phase Commit", Lecture 6 of the *)
(* TLA+ Video Course.  It describes the Two-Phase Commit protocol, in      *)
(* which a transaction manager (TM) coordinates the resource managers      *)
(* (RMs) to implement the Transaction Commit specification of module       *)
(* TCommit.  In this specification, RMs spontaneously issue Prepared       *)
(* messages.  We ignore the Prepare messages that the TM can send to the   *)
(* RMs.                                                                    *)
(*                                                                         *)
(* For simplicity, we also eliminate Abort messages sent by an RM when it  *)
(* decides to abort.  Such a message would cause the TM to abort the       *)
(* transaction, an event represented here by the TM spontaneously deciding *)
(* to abort.                                                               *)
(***************************************************************************)
CONSTANT RM  \* The set of resource managers

VARIABLES
  rmState,       \* rmState[r] is the state of resource manager r.
  tmState,       \* The state of the transaction manager.
  tmPrepared,    \* The set of RMs from which the TM has received "Prepared"
                 \* messages.
  msgs           
    (***********************************************************************)
    (* In the protocol, processes communicate with one another by sending  *)
    (* messages.  For simplicity, we represent message passing with the    *)
    (* variable msgs whose value is the set of all messages that have been *)
    (* sent.  A message is sent by adding it to the set msgs.  An action   *)
    (* that, in an implementation, would be enabled by the receipt of a    *)
    (* certain message is here enabled by the presence of that message in  *)
    (* msgs.  For simplicity, messages are never removed from msgs.  This  *)
    (* allows a single message to be received by multiple receivers.       *)
    (* Receipt of the same message twice is therefore allowed; but in this *)
    (* particular protocol, that's not a problem.                          *)
    (***********************************************************************)

Messages ==
  (*************************************************************************)
  (* The set of all possible messages.  Messages of type "Prepared" are    *)
  (* sent from the RM indicated by the message's rm field to the TM.       *)
  (* Messages of type "Commit" and "Abort" are broadcast by the TM, to be  *)
  (* received by all RMs.  The set msgs contains just a single copy of     *)
  (* such a message.                                                       *)
  (*************************************************************************)
  [type : {"Prepared"}, rm : RM]  \cup  [type : {"Commit", "Abort"}]
   
TPTypeOK ==  
  (*************************************************************************)
  (* The type-correctness invariant                                        *)
  (*************************************************************************)
  /\ rmState \in [RM -> {"working", "prepared", "committed", "aborted"}]
  /\ tmState \in {"init", "done"}
  /\ tmPrepared \subseteq RM
  /\ msgs \subseteq Messages

TPInit ==   
  (*************************************************************************)
  (* The initial predicate.                                                *)
  (*************************************************************************)
  /\ rmState = [r \in RM |-> "working"]
  /\ tmState = "init"
  /\ tmPrepared   = {}
  /\ msgs = {}
-----------------------------------------------------------------------------
(***************************************************************************)
(* We now define the actions that may be performed by the processes, first *)
(* the TM's actions, then the RMs' actions.                                *)
(***************************************************************************)
TMRcvPrepared(r) ==
  (*************************************************************************)
  (* The TM receives a "Prepared" message from resource manager r.  We     *)
  (* could add the additional enabling condition r \notin tmPrepared,      *)
  (* which disables the action if the TM has already received this         *)
  (* message.  But there is no need, because in that case the action has   *)
  (* no effect; it leaves the state unchanged.                             *)
  (*************************************************************************)
  /\ tmState = "init"
  /\ [type |-> "Prepared", rm |-> r] \in msgs
  /\ tmPrepared' = tmPrepared \cup {r}
  /\ UNCHANGED <<rmState, tmState, msgs>>

TMCommit ==
  (*************************************************************************)
  (* The TM commits the transaction; enabled iff the TM is in its initial  *)
  (* state and every RM has sent a "Prepared" message.                     *)
  (*************************************************************************)
  /\ tmState = "init"
  /\ tmPrepared = RM
  /\ tmState' = "done"
  /\ msgs' = msgs \cup {[type |-> "Commit"]}
  /\ UNCHANGED <<rmState, tmPrepared>>

TMAbort ==
  (*************************************************************************)
  (* The TM spontaneously aborts the transaction.                          *)
  (*************************************************************************)
  /\ tmState = "init"
  /\ tmState' = "done"
  /\ msgs' = msgs \cup {[type |-> "Abort"]}
  /\ UNCHANGED <<rmState, tmPrepared>>

RMPrepare(r) == 
  (*************************************************************************)
  (* Resource manager r prepares.                                          *)
  (*************************************************************************)
  /\ rmState[r] = "working"
  /\ rmState' = [rmState EXCEPT ![r] = "prepared"]
  /\ msgs' = msgs \cup {[type |-> "Prepared", rm |-> r]}
  /\ UNCHANGED <<tmState, tmPrepared>>
  
RMChooseToAbort(r) ==
  (*************************************************************************)
  (* Resource manager r spontaneously decides to abort.  As noted above, r *)
  (* does not send any message in our simplified spec.                     *)
  (*************************************************************************)
  /\ rmState[r] = "working"
  /\ rmState' = [rmState EXCEPT ![r] = "aborted"]
  /\ UNCHANGED <<tmState, tmPrepared, msgs>>

RMRcvCommitMsg(r) ==
  (*************************************************************************)
  (* Resource manager r is told by the TM to commit.                       *)
  (*************************************************************************)
  /\ [type |-> "Commit"] \in msgs
  /\ rmState' = [rmState EXCEPT ![r] = "committed"]
  /\ UNCHANGED <<tmState, tmPrepared, msgs>>

RMRcvAbortMsg(r) ==
  (*************************************************************************)
  (* Resource manager r is told by the TM to abort.                        *)
  (*************************************************************************)
  /\ [type |-> "Abort"] \in msgs
  /\ rmState' = [rmState EXCEPT ![r] = "aborted"]
  /\ UNCHANGED <<tmState, tmPrepared, msgs>>

TPNext ==
  \/ TMCommit \/ TMAbort
  \/ \E r \in RM : 
       TMRcvPrepared(r) \/ RMPrepare(r) \/ RMChooseToAbort(r)
         \/ RMRcvCommitMsg(r) \/ RMRcvAbortMsg(r)
-----------------------------------------------------------------------------
(***************************************************************************)
(* The material below this point is not discussed in Video Lecture 6.  It  *)
(* will be explained in Video Lecture 8.                                   *)
(***************************************************************************)

TPSpec == TPInit /\ [][TPNext]_<<rmState, tmState, tmPrepared, msgs>>
  (*************************************************************************)
  (* The complete spec of the Two-Phase Commit protocol.                   *)
  (*************************************************************************)

THEOREM TPSpec => []TPTypeOK
  (*************************************************************************)
  (* This theorem asserts that the type-correctness predicate TPTypeOK is  *)
  (* an invariant of the specification.                                    *)
  (*************************************************************************)
-----------------------------------------------------------------------------
(***************************************************************************)
(* We now assert that the Two-Phase Commit protocol implements the         *)
(* Transaction Commit protocol of module TCommit.  The following statement *)
(* imports all the definitions from module TCommit into the current        *)
(* module.                                                                 *)
(***************************************************************************)
INSTANCE TCommit 

THEOREM TPSpec => TCSpec
  (*************************************************************************)
  (* This theorem asserts that the specification TPSpec of the Two-Phase   *)
  (* Commit protocol implements the specification TCSpec of the            *)
  (* Transaction Commit protocol.                                          *)
  (*************************************************************************)
(***************************************************************************)
(* The two theorems in this module have been checked with TLC for six      *)
(* RMs, a configuration with 50816 reachable states, in a little over a    *)
(* minute on a 1 GHz PC.                                                   *)
(***************************************************************************)
=============================================================================
```

{{< /detail-tag >}}

<br/>

In this spec $CONSTANT RM$ and $VARIABLES rmState$ are the same as in the previous spec.
Variables $tmState$ and $tmPrepared$ indicate the state and track $RM$ states of a transaction manager. A transaction manager tracks the state of resource managers memorizing which states are $\text{"committed"}$ and execute a transaction once receives a $\text{"committed"}$ state from all resource managers. $msgs$ describes the messages that are in transit.

{{< math >}}
$$
\begin{split}
TPTypeOK \equiv & \land \text{rmState} \in [RM \rightarrow \{ \text{"working"}, \text{"prepared"}, \text{"committed"}, \text{"aborted"} \}] \\
& \land \text{tmState} \in \{ \text{"init"}, \text{"done"} \} \\
& \land \text{tmPrepared} \subseteq \text{RM} \\
& \land \text{msgs} \subseteq \text{Messages}
\end{split}
$$
{{< /math >}}

The definition of $TPTypeOK$ states sets of possible values for $rmState$ and $tmState$ respectively. The values of $tmPrepared$ must be from the $RM$ and $msgs$ must be from $\text{Messages}$.

> The goal of this spec is to describe the sending of messages. It does not specify the actual mechanism by which the messages are sent, but it specifies only what is required of message passing.

> There is one simplification introduced in the spec: since two-phase commit algorithm does not rely on the order of messages, we do not remove already picked messages from $msgs$. So, $msgs$ hold all ever sent messages and receivers can read messages from it. This is something that can actually happen in the real life, so we need to ensure the algorithm works in this case.
{.note}

The definiton of $Messages$.

$\text{Messages} \equiv [type : \\{\text{"Prepared"}, rm : RM\\}] \cup [type : \\{\text{"Commit"}, \text{"Abort"}\\}]$

The left part of the union is a set of records whose $type$ field is an element of the set containing the single element $\text{"Prepared"}$ and $rm$ consists of the elements of $RM$. It can be written as $[type \mapsto \text{"Prepared"}, rm \mapsto r]$ — represents a _prepared_ message sent by $r$ to the transaction manager.

The right part of the union is a set that represents messages sent by a transaction manager to all resource managers. This set equals to the set containing two elements $\\{[type \mapsto \text{"Commit"}],[type \mapsto \text{"Abort"}]\\}$.

{{< math >}}
$$
\begin{split}
TPInit \equiv & \land rmState = [r \in RM \mapsto \text{"working"}] \\
& \land tmState = \text{"init"} \\
& \land tmPrepared = \{\} \\
& \land msgs = \{\}
\end{split}
$$
{{< /math >}}

In the $TPInit$ formula, $rmState$ — is a formula that assigns the string $\text{"working"}$ to every resource managers;

{{< math >}}
$$
\begin{split}
TMRcvPrepared(r) \equiv & \land tmState = \text{"init"} \\
& \land [type \mapsto \text{"Prepared"}, rm \mapsto r] \in msgs \\
& \land tmPrepared' = tmPrepared \cup \{r\} \\
& \land UNCHANGED \left \langle rmState, tmState, msgs \right \rangle
\end{split}
$$
{{< /math >}}

The $TMRcvPrepared(r)$ sub-formula describes the receipt of a $Prepared$ message from a resource manager $r$ by the transaction manager.

The message can be received only if the transaction manager in the $init$ state and there is a $Prepared$ message from the resource manager $r$ in the set $msgs$ of sent messages.

The new value of $\text{tmPrepared'}$ equals to its value and a union with the set of on element $r$, in another words, it adds $r$ to the set $\text{tmPrepared}$. 

The entire $UNCHANGED$ formula is an equivalent to $\land rmState' = rmState \land tmState' = tmState \land msgs' = msgs$ which asserts that values of $rmState$, $rmState$, and $msgs$ remain unchanged.

> In this formula, the first two conjunctions have no primes.  They are conditions on the first step of the step and called enabling conditions. They should go at the beginning of a formula.
{.note}

The order of conjuncts makes sense, like here the third conjunct declares adding an element $r$ into the $tmPrepared'$ set and all subsequent step occur with $r$ in $tmPrepared$ that implies $tmPrepared$ remain unchanged, because it said to contain either an element or not, it cannot contain two copies of $r$. In another words, on this step $r$ was moved to the $tmPrepared'$ set but not to the $tmPrepared$ set and then _assigned_ to the $tmPrepared'$.

In TwoPhase commit every resource manager has an identical role, they are interchangeable. In TCL the set of possible interchangeable permutations is called a symmetry set. TLC will check fewer states if the model sets a symmetry set to a set of model values.

> Beware that TLC may miss errors if you claim a set is a symmetry set when it is not.
{.danger}

To check that the two-phase commit is an actual transaction commit protocol we should check that formula $TCConsistent$ of the $TCommit$ spec, which asserts that one resource manager cannot commit if another aborts, is also an invariant of the spec.

The statement `INSTANCE TCommit` imports the definitions from $TCommit$ into module $TwoPhase$.

So, in order to ensure the spec has no errors, you need to add **both** $TPTypeOK$ and $TCConsistent$ invariants into the TLA+ toolbox.

## Conclusion

In this blog post, we considered the _Transaction Commit_ and _Two-Phase Commit_ algorithms. We have learned how to define multi-parties protocols, records, and symmetry sets. In the next blog, we will cover the Learning $TLA^+$ course part explaining the _Paxos_ algorithm.

## Notes

If you experience with errors (such as "unknown operator TPInit") when trying to run a model, check this thread https://groups.google.com/u/1/g/tlaplus/c/REfGFm9bJMU/m/BuJ9N8NnGwAJ.

However, this above did not help me, so what I did to solve the problem:
1. Create a new specification (right-click on the tree-view -> new specification)
2. Paste $TwoPhase$ spec
3. Create a new specification inside the current one (right-click on _modules_ -> new specification with the root module file as the current one)
4. Paste $TCommit$ spec into the newly created spec (keep names consistent according to the `INSTANCE TCommit` expression).

It is probably an awkward solution but it works 🐦‍⬛.

## References

- [Do not die hard with TLA+ pt.1][1]
- [Leslie Lamport. Learning TLA+][2]
- [Jim Gray, Leslie Lamport. Consensus on Transaction Commit][3]

[1]: {{< ref "/blog/do-not-die-hard-with-tla-plus-1" >}}
[2]: https://lamport.azurewebsites.net/tla/learning.html
[3]: https://lamport.azurewebsites.net/video/consensus-on-transaction-commit.pdf


---

Discuss [this blog](https://t.me/inferara/16) in our telegram channel [@inferara](https://t.me/inferara/).
