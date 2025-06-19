+++
title = "Understanding the C Runtime: crt0, crt1, crti, and crtn"
date = 2025-01-15T11:21:45+09:00
draft = false
math = "katex"
summary = "The C runtime (CRT) is a collection of startup routines, initialization code, standard library support, and sometimes system call wrappers that form the environment in which a C program executes."
tags = ["Clang", "Compilers", "Algorithms"]
aliases = ["/blog/c-runtime"]
+++

**Table of Contents**

- [Introduction](#introduction)
- [What is the C Runtime?](#what-is-the-c-runtime)
- [The Role of `crt0.o` (or `crt1.o` in Modern Toolchains)](#the-role-of-crt0o-or-crt1o-in-modern-toolchains)
  - [Typical Content of `crt0.o` / `crt1.o`](#typical-content-of-crt0o--crt1o)
  - [Linking Phase](#linking-phase)
- [Additional Runtime Files: `crti.o`, `crtn.o`, and Friends](#additional-runtime-files-crtio-crtno-and-friends)
  - [`crti.o`: C Runtime Initialization](#crtio-c-runtime-initialization)
  - [`crtn.o`: C Runtime Termination](#crtno-c-runtime-termination)
- [Putting It All Together](#putting-it-all-together)
- [Example Assembly Snippets](#example-assembly-snippets)
- [Practical Notes on Modern Usage](#practical-notes-on-modern-usage)
- [Conclusion](#conclusion)
- [References](#references)

## Introduction

When you write a simple C program like:

```c
#include <stdio.h>

int main(void) {
    printf("Hello, world!\n");
    return 0;
}
```

and compile it (e.g., `gcc hello.c -o hello`), you might assume that your `main()` function is the first piece of code to execute once the program starts. However, there are actually a few special pieces of code that run *before* and *after* `main()`, preparing the environment for your program. These pieces of code are part of the C runtime (CRT) startup objects. Among them, you may have encountered file names like **`crt0.o`**, **`crt1.o`**, **`crti.o`**, and **`crtn.o`**. This post will discuss what each one does, why they exist, and how they work together to ensure your C (and C++) programs run smoothly.

---

## What is the C Runtime?

The C runtime (CRT) is a collection of startup routines, initialization code, standard library support, and sometimes system call wrappers that form the environment in which a C program executes. Most of this code lives *outside* your application’s own source but is automatically linked in by the compiler driver (e.g., `gcc` or `clang`).

When you compile a program with a command such as:

```bash
gcc main.c -o main
```

or

```bash
clang main.c -o main
```

the compiler driver and linker *implicitly* include startup object files and libraries, including one or more CRT object files. These files contain assembly-level entry points and routines that:

1. Initialize registers and the stack.
2. Set up the program arguments (`argc`, `argv`, `envp`).
3. Invoke global constructors (in C++ programs).
4. Call your `main()` function.
5. Handle the return from `main()` and pass the exit status to the operating system.

## The Role of `crt0.o` (or `crt1.o` in Modern Toolchains)

Historically, **`crt0.o`** (C runtime zero) is a small object file containing the actual entry point routine, often named `_start`. Its responsibilities include:

1. **Program Initialization**  
   - Initializing the stack (on some architectures and OSes, though typically the kernel arranges the stack pointer).  
   - Setting up memory segments if necessary (e.g., data, BSS).  
   - Preparing `argc`, `argv`, and environment pointers from the kernel-provided data.  
   - Invoking constructors for global and static objects (especially in C++).  
   - Possibly calling library initialization functions (for the standard I/O library, etc.).

2. **Transferring Control to `main()`**  
   - After the environment is set up, `crt0.o` calls `main(argc, argv, envp)`.

3. **Cleaning Up**  
   - When `main()` returns, `crt0.o` (or the final exit routine) calls the OS-specific exit syscall (like `_exit` or similar) to terminate the process with the return code from `main()`.

Because `crt0.o` was often a large, monolithic file, many modern toolchains now split it up into more modular components. You might see **`crt1.o`** being used instead of `crt0.o`. The name `crt1.o` typically indicates it's the "first" (or primary) startup object. Despite the naming differences, they serve the same core purpose: they contain the `_start` symbol, which is the default entry point used by the linker.

### Typical Content of `crt0.o` / `crt1.o`
- Low-level assembly code responsible for setting up the runtime.
- A symbol named `_start` (or sometimes `__start`) that acts as the entry point.
- A call to `main()` (or `_main`, depending on the convention).

### Linking Phase
When you link your program, the linker automatically pulls in `crt0.o` (or `crt1.o`) from the C library implementation (e.g., glibc or musl) or from the compiler toolchain. This happens behind the scenes unless you explicitly disable it (e.g., with certain compiler flags like `-nostartfiles`).

## Additional Runtime Files: `crti.o`, `crtn.o`, and Friends

In modern toolchains, the C runtime is often divided into several object files:

- **`crti.o`** (C runtime *initialization*)
- **`crtn.o`** (C runtime *termination*)
- **`crt1.o`** (C runtime *entry point*)

### `crti.o`: C Runtime Initialization

**`crti.o`** typically contains the *prologue* for the runtime initialization procedure. Its primary tasks include:

- **Platform-Specific Setup**  
  For instance, initializing special registers, CPU features, or other architecture-specific resources.  
- **Environment Preparation**  
  It lays the groundwork needed to call the constructors (`.ctors` section for C++).  
- **Hooks for Early Setup**  
  These can be initialization routines required by the OS or the platform, such as thread-local storage (TLS) setup on some systems.

Conceptually, you can think of `crti.o` as the place where the runtime says, “I am starting up the environment; here’s some prologue code.” Once done, control eventually proceeds to `main()` or other initial routines.

### `crtn.o`: C Runtime Termination

**`crtn.o`** contains the *epilogue* of the runtime initialization process and handles finalization routines. It:

- **Finalizes the Initialization Sequence**  
  Completes what `crti.o` started, ensuring all global constructors have been called.  
- **Manages Destructors**  
  For C++ programs, global destructors (`.dtors`) must be invoked at the end of the program. By wrapping the prologue and epilogue around these sections, `crti.o` and `crtn.o` manage that logic properly.  

When the program finishes, the destructors of global objects are called, ensuring resources are cleaned up before the program truly exits.

## Putting It All Together

To visualize how these files fit into the program startup flow, here is a simplified diagram:

```
        ┌─────────────────────┐
        │ Program Entry Point │  (Defined in crt1.o or crt0.o)
        │     _start()        │
        └──────────┬──────────┘
                   │
                   │ (1) Initialize environment, memory, etc.
                   │
        ┌──────────┴──────────┐
        │   crti.o (Prologue) │ 
        │  Calls constructors │
        └──────────┬──────────┘
                   │
                   │ (2) Jump to main()
                   │
        ┌──────────┴──────────┐
        │        main()       │
        └──────────┬──────────┘
                   │
                   │ (3) main returns
                   │
        ┌──────────┴──────────┐
        │   crtn.o (Epilogue) │
        │  Calls destructors  │
        └──────────┬──────────┘
                   │
                   │ (4) exit syscall
                   │
             ┌─────┴──────┐
             │   OS Exit  │
             └────────────┘
```

**Key Steps**:  
1. `_start` (from `crt1.o` or `crt0.o`) does low-level setup, then calls the prologue code from `crti.o`.  
2. Initialization code from `crti.o` finishes, then we jump into `main()`.  
3. When `main()` returns, the epilogue from `crtn.o` is executed, triggering finalizers and destructors.  
4. A final exit syscall terminates the process with the return value from `main()`.  

## Example Assembly Snippets

Below is a **simplified** Linux x86-64 assembly snippet illustrating a minimal `_start` routine (the actual code in `crt1.o` or `crt0.o` can be more complex). Note that in real implementations, there will be additional instructions to manage the environment, thread-local storage, etc.

```asm
    .global _start
_start:
    ; The stack pointer is already set by the OS.
    ; Registers RDI, RSI, and RDX might have pointers to argc, argv, and envp.

    ; Save argc, argv, and envp to the stack, or
    ; pass them to main() directly (depending on calling convention).
    mov rdi, [rsp]               ; argc is at top of stack
    lea rsi, [rsp+8]             ; argv pointer just after argc
    ; envp would be after argv, etc.

    call main                    ; Call main(argc, argv, envp implicitly)

    ; Make an exit system call
    mov rax, 60                  ; sys_exit on Linux x86-64
    syscall
```

A *very* simplified `crti.o` might look like this (C++ style pseudocode/assembly):

```asm
    .section .init
    _init:
        ; Here you'd initialize global constructors, or
        ; set up code that the runtime needs before calling main.
        ; For instance, call __libc_init_array (in some toolchains)
        ret
```

And `crtn.o` might have the counterpart:

```asm
    .section .fini
    _fini:
        ; Cleanup routines and call global destructors.
        ; For instance, call __libc_fini_array
        ret
```

In real toolchains, these sections (`.init` and `.fini`) are automatically run *before* and *after* `main()`, respectively, thanks to GNU linker scripts and the `.init_array` / `.fini_array` or `.ctors` / `.dtors` mechanisms.

## Practical Notes on Modern Usage

- **Static vs. Dynamic Linking**  
  If you build a statically linked executable (`-static`), the C runtime files are fully included in the final binary. For dynamically linked executables, a dynamic version of these CRT objects often handles dynamic loader interaction before calling `main()`.
  
- **Different OSes, Different Implementations**  
  The names and exact details can vary. On Linux with glibc, you might see `crt1.o`, `crti.o`, `crtn.o`, and so on. On other systems (e.g., BSD variants, macOS), the names can differ or the process might be encapsulated differently.
  
- **C++ Constructors and Destructors**  
  The `.ctors` and `.dtors` (or `.init_array` and `.fini_array`) sections are essential for automatically calling global objects’ constructors and destructors. The separate files `crti.o` and `crtn.o` wrap these calls so they happen before `main()` and after `main()` returns (or `exit()` is called).
  
- **Custom Entry Points**  
  Advanced developers sometimes replace the default CRT objects with their own minimalistic versions (using `-nostdlib` or `-nostartfiles`) for freestanding or embedded environments.

## Conclusion

The C runtime (CRT) is a crucial, often overlooked part of any C or C++ program. Files like **`crt0.o`** (or **`crt1.o`**, **`crti.o`**, and **`crtn.o`**) ensure that your code has everything it needs before `main()` executes, including stack setup, global constructors, and library initializations. They also handle cleanup (like global destructors) when `main()` returns. Although these objects are usually included automatically by the compiler, knowing about them helps you understand how your C/C++ application transitions from a raw process image to a fully functioning program—and eventually shuts down in an orderly manner.

Whether you’re developing compilers, working on embedded systems, or just curious about how C really starts up, these insights into the C runtime can help demystify the often-misunderstood “invisible” code behind your `main()` function.

## References

- [GNU C Library (glibc) Source][1] Look for `crt1.o`, `crti.o`, `crtn.o`, etc. in the *sysdeps* directories.
- [musl C Library][2] The musl C library provides a simpler implementation of these files.
- [GCC Documentation][3] Look for startup files, linking, and run-time issues.
- [The Open Group Base Specifications Issue 7][4] Describes standardized process interfaces and environment details.

[1]: https://sourceware.org/git/?p=glibc.git
[2]: https://musl.libc.org/
[3]: https://gcc.gnu.org/onlinedocs/
[4]: http://pubs.opengroup.org/onlinepubs/9699919799/

{{<post-socials page_content_type="blog" telegram_post_id="23" x_post_id="1879448114354123247">}}
