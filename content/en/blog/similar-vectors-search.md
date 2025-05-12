+++
title = "Understanding Similarity Vector Search: Algorithms and Applications in Modern AI Systems"
date = 2025-02-06T13:50:00+09:00
draft = false
math = "katex"
tags = ["LLM", "Geometry", "Vector Search"]
summary = "Understanding Similarity Vector Search: Algorithms and Applications in Modern AI Systems"
aliases = ["blog/similar-vectors-search"]
+++

**Table of contents**

- [Introduction](#introduction)
- [Similarity Search Database Algorithms](#similarity-search-database-algorithms)
  - [L1 Distance](#l1-distance)
  - [L2 Distance](#l2-distance)
  - [Inner product](#inner-product)
  - [Cosine distance](#cosine-distance)
  - [Hamming distance](#hamming-distance)
  - [Jaccard distance](#jaccard-distance)
- [Graph-Based and Quantization Methods for Approximate Nearest Neighbor Search](#graph-based-and-quantization-methods-for-approximate-nearest-neighbor-search)
  - [Locality-Sensitive Hashing (LSH)](#locality-sensitive-hashing-lsh)
  - [Product Quantization (PQ)](#product-quantization-pq)
    - [Pseudo-code for Product Quantization](#pseudo-code-for-product-quantization)
    - [Lloyd's algorithm aka Voronoi iteration](#lloyds-algorithm-aka-voronoi-iteration)
    - [Pseudo-code for Lloyd's algorithm](#pseudo-code-for-lloyds-algorithm)
  - [Hierarchical Navigable Small World (HNSW)](#hierarchical-navigable-small-world-hnsw)
    - [ASCII Diagram of HNSW](#ascii-diagram-of-hnsw)
    - [Example: Practical Image Retrieval](#example-practical-image-retrieval)
  - [Performance improvement](#performance-improvement)
    - [Delaunay triangulation](#delaunay-triangulation)
- [The Importance of Similarity Search in Modern AI Systems](#the-importance-of-similarity-search-in-modern-ai-systems)
    - [Pseudo-code for Delaunay Triangulation (2D)](#pseudo-code-for-delaunay-triangulation-2d)
- [Real-World Example: Image Search in E-Commerce](#real-world-example-image-search-in-e-commerce)
- [Conclusion](#conclusion)

## Introduction

Similarity vector search is a core technology behind many modern AI systems. It lies at the heart of applications ranging from large language models (LLMs) and retrieval-augmented generation (RAG) to recommendation engines and autonomous agents. By converting data into high-dimensional vectors, systems can compute the “closeness” between items based on their features or semantics. Leading vector databases such as FAISS, Annoy, Milvus, Weaviate, and Pinecone leverage specialized algorithms to perform fast and accurate nearest neighbor searches. This article explores common similarity search algorithms, explains the underlying distance metrics, and presents real-world examples—like image retrieval and spatial analysis—to illustrate how these techniques are applied.

## Similarity Search Database Algorithms

Vector databases typically offer several search options that use vector similarity search algorithms, such as L2 distance, Inner product, Cosine distance, etc. In this section, we review common distance metrics and similarity measures along with their mathematical formulations and practical applications.

### L1 Distance

**L1 distance** (or Manhattan distance) calculates the sum of absolute differences between corresponding vector components.  
L1 distance is often used when you want to measure the absolute changes between vectors. It tends to perform better in high-dimensional sparse data.

*Example:* In recommender systems for text data, where each dimension represents the frequency of a keyword, the L1 distance is useful because it captures the total change in frequency counts.  
Mathematically:

$$
\sum_{i=1}^{n}\left | x_i - y_i \right |
$$

### L2 Distance

**L2 distance** (Euclidean distance) computes the “straight-line” distance between two points(or vectors) in Euclidean space. It works well when the magnitude of the vector is important for similarity. It gives a higher penalty to large differences and is sensitive to outliers.
*Example:* In image processing, where pixel intensity differences matter, the L2 distance is often used to compare image embeddings.  
Mathematically:

$$
\sqrt{\sum_{n}^{i=1}\left ( x_i - y_i \right )^2}
$$

where $x$ and $y$ are vectors.

### Inner product

The **inner product** measures how aligned two vectors are. It is maximized when the vectors point in the same direction. It is often normalized when used in a search by Cosine Distance.
*Example:* When comparing document embeddings, the inner product can indicate whether two documents share common themes or topics.
Mathematically:

$$
\sum_{n}^{i=1} x_i \cdot y_i
$$

### Cosine distance

**Cosine distance** measures the cosine of the angle between 2 vectors which gives an indication of their orientation regardless of their magnitude. It is widely used in text or document searches where the direction of the vectors (relative distribution of words) is more important than the vectors magnitude. Unlike **L2**, it ignores vector magnitude and focuses purely on the direction.
*Example:* In natural language processing (NLP), two sentences with different lengths but similar word distributions can have a high cosine similarity.  
Mathematically:

$$
\text{Cosine Similarity}(x,y)=\frac{\sum_{i=1}^{n}x_i \cdot y_i}{\sqrt{\sum_{i=1}^{n}x_i^2} \cdot \sqrt{\sum_{i=1}^{n}y_i^2}}
$$
$$
\text{Cosine Distance}(x,y)=1-\text{similarity}
$$

### Hamming distance

**Hamming distance** counts the differences between two vectors comparing each position value. If positions equal, the distance is `0`, otherwise `1`. In machine learning, it is used to measure the dissimilarity between binary feature vectors in models or clustering algorithms.
*Example:* In clustering binary feature representations (such as hashed image features), the Hamming distance quickly identifies differences in bit patterns.  
Mathematically:

$$
d(x,y) = \sum_{i=1}^{n} 1 (x_i \neq y_i)
$$

### Jaccard distance

**Jaccard distance** compares sets—such as tokens or keywords from documents. It is derived from the Jaccard similarity, which measures the ratio of the intersection to the union of two sets.  
*Example:* In document similarity, comparing the sets of unique words between documents can yield a Jaccard distance that reflects their overlap in content.  
Mathematically:

- Jaccard similarity: $J(A,B) = \frac{|A \cap B|}{|A \cup B|}$
- Jaccard distance: $J(A,B) = 1 - J(A,B)$

## Graph-Based and Quantization Methods for Approximate Nearest Neighbor Search

Traditional exact search can be prohibitively slow when dealing with millions of high-dimensional vectors. To overcome this, approximate nearest neighbor (ANN) algorithms trade a small amount of accuracy for dramatic improvements in speed. Below are several key methods (locality-sensitive hashing LSH and product quantization PQ) along with explanations and examples.

### Locality-Sensitive Hashing (LSH)

**Locality-Sensitive Hashing (LSH)** is a fuzzy hashing technique also known as similarity hashing for fetching data that is similar but not exactly the same. It hashes input it takes into the same "buckets" with using **probability**.
*Example:* In a large music recommendation system, LSH can quickly group songs with similar audio features, so a query song finds similar tracks without comparing against every song in the catalog.
**How it works:**
A finite family $F$ of functions $h: M \rightarrow S$ is defined to be an LSH family for
- $(M, d)$: a metric space (a set with a function to measure the distance between elements of this set)
  - $M$ - a metric
  - $d$ - a distance function
- $r>0$ - a threshold
- $c>0$ - an approximation factor
- $p_1 > p_2$ - probabilities
  - if $d(a,b) \leq r \Rightarrow h(a)=h(b)$ e.g. $a$ and $b$ collide with probability **at least** $p_1$
  - if $d(a,b) \geq cr \Rightarrow h(a)=h(b)$ e.g. $a$ and $b$ collide with probability **at most** $p_2$

Such family $F$ is called $(r,cr,p_1,p_2)$-sensitive.

Methods:
- bit-sampling for Hamming distance
- LSH scheme Jaccard index $Pr[h(a) = h(B)]= \frac{|A \cap B|}{|A \cup B|}$

This method is especially effective when dealing with very high-dimensional binary or sparse data.

### Product Quantization (PQ)

The idea of **PQ** is to split a high-dimensional vector into a lower-dimensional subspace with a dimension of the subspace corresponding to multiple dimensions in the original vector.

$V^M \rightarrow \{SS\}^{M/n}$, where $n$ is a number of subspaces.

In other words, **Product Quantization (PQ)** compresses high-dimensional vectors into smaller, lower-dimensional sub-vectors. Each sub-vector is quantized independently by assigning it to the nearest centroid obtained via clustering (commonly k-means).
*Example:* In image search, where each image is represented by a high-dimensional vector from a CNN, PQ dramatically reduces memory usage by storing only the indices of centroids.  
**Steps Involved:**
1. Divide the vector into $m$ sub-vectors.
2. Cluster each subspace using k-means to obtain $k$ centroids.
3. Replace each sub-vector with the index of its nearest centroid.

#### Pseudo-code for Product Quantization

```python
# Pseudo-code for Product Quantization (PQ)
Input: High-dimensional vector V, number of subspaces m, number of centroids per subspace k
1. Divide V into m sub-vectors: V = [v1, v2, ..., vm]
2. For each sub-vector vi:
    a. Run k-means to obtain k centroids.
    b. Assign vi to its nearest centroid.
3. Store the centroid indices for each sub-vector.
```

#### Lloyd's algorithm aka Voronoi iteration

Lloyd’s algorithm (also known as Voronoi iteration) is the foundation of k-means clustering. It iteratively refines centroids by assigning points to the nearest centroid and then updating the centroids to the mean of the assigned points.

<iframe src="https://www.desmos.com/calculator/lhoqlfgmhi?embed" width="500" height="500" style="border: 1px solid #ccc" frameborder=0></iframe>

- initial placement of some number $k$ of point sites
  - repeat:
    - the Voronoi diagram of $k$ sites is computed
    - each cell of the Voronoi diagram is integrated and the centroid is computed
    - each site is then moved to the centroid of its Voronoi cell.

For a 2D cell with $n$ triangular simplices and an accumulated area $A_c=\sum_{i=0}^{n}a_i$, $a_i$ is the area of a triangle simplex.
$C = \frac{1}{A_c}\sum_{i=0}^{n}C_ia_i$ - a new cell centroid.

The overall algorithm is:
1. a high-dimensional vector is divided into several smaller lower-dimensional sub-vectors
2. each sub-vector is quantized independently using $k$-means clustering into one of several centroids
3. instead of storing the full original vector, **PQ** stores the index of the closest centroid for each sub-vector
4. during the search, only the centroids are used to approximate the distances between vectors, making it faster.

#### Pseudo-code for Lloyd's algorithm

```python
# Pseudo-code for Lloyd's Algorithm
Input: Data points X, initial centroids C, iterations T
for t in range(1, T+1):
    for each point x in X:
        assign x to the nearest centroid in C
    for each centroid c in C:
        update c = mean of points assigned to c
```

### Hierarchical Navigable Small World (HNSW)

**HNSW** constructs a graph where each node represents a vector, and nodes are connected to a fixed number of their nearest neighbors. The graph is organized into multiple layers:
- **Upper Layers:** Contain long-range links that help jump across distant areas of the vector space.
- **Lower Layers:** Provide dense, local connections for precise neighbor retrieval.
  
*Example:* In a dataset of 10,000 product images, HNSW allows a query image to quickly “hop” from a high-level overview node to a cluster of similar images without evaluating all 10,000 vectors.
  
#### ASCII Diagram of HNSW

```goat
         [Vector]
            │
 ┌──────────┼──────────┐
[Vector]  [Vector]  [Vector]
            │
         [Vector]
```

```goat
vector space

[vector]────edge──connects──closest──vectors────[vector]

[vector]
                           [vector]
        [vector]
```

```goat
    fewer nodes, longer connections for long-range jumps
L ______\______
E _______\_____
V ________\____
E _____________ denser connections for local navigation
L _____________
S _____________
```

Each node in the graph represents a vector point. Each node is connected to up to $m$ neighbors that are nearby.
When vector fields are indexed for exhaustive $KNN$ the query executes against "all neighbors". For fields indexes for HNSW, the search engine uses HNSW graph to search over a subset of nodes within the vector index.

#### Example: Practical Image Retrieval

Imagine an e-commerce site where a user uploads a photo of a shoe. The system computes its vector embedding and, using HNSW rapidly navigates through layers of the graph to retrieve similar shoe images. This reduces the number of comparisons from thousands to only a few hundred, ensuring fast and accurate recommendations.

### Performance improvement

#### Delaunay triangulation

**Delaunay triangulation** partitions a set of points so that no point lies inside the circumcircle of any triangle. It provides an efficient way to define neighbors in a spatial domain.

Delaunay Triangulation for a given set of points $S$ on the plane, such that for any triangle, all points from $S$ (except its vertices) lie outside the circle circumscribed around the triangle.
The Delaunay triangulation uniquely corresponds to the Voronoi diagram for the same set of points.

Algorithm:
1. Draw a horizontal or vertical line through the middle of the set, and based on this division, split the points into approximately $N/2$ points each. Later, for each group of points, run the division process recursively.
3. Find 2 pairs of points whose segments, together with the fixed triangulations, form a convex figure. These points are connected by segments, and one of the resulting segments is chosen as the starting point for the next pass. On one segment, we "inflate a bubble" inward until the expanding circle of the "bubble" reaches the first point. With this found point, connect it to the point from the segment that was not already connected to it. The resulting segment is checked for intersections with the already existing segments of the triangulation; if any intersections occur, those segments are removed from the triangulation. After that, the new segment is taken as the starting point for the new "bubble." This cycle is repeated until the starting segment coincides with the second segment of the convex hull.

The complexity of the division is $O(\log N)$, and the merging is $O(N)$. For each merge, the overall complexity of the algorithm is $O(N \log N)$.

<iframe src="https://www.desmos.com/calculator/a9dcxauxuu?embed" width="500" height="500" style="border: 1px solid #ccc" frameborder=0></iframe>

The unique property of Delaunay graphs is the definition of neighboring points that are connected by an edge. For example, in an $\Epsilon$-graph, two points are adjacent if they are at most $\Epsilon$ distance apart.
In a kNN graph, a point is connected to all points that are closer than $k$-th smallest distance of that point to any other.
In contrast, in a Delaunay graph a point is adjacent to any point that is its spatial neighbor.

## The Importance of Similarity Search in Modern AI Systems

Similarity vector search is a fundamental enabler for various AI applications:

1. **Large Language Models (LLMs) and RAG:**  
   LLMs retrieve semantically similar documents to enrich their context. For instance, in a RAG system, a user’s query is transformed into a vector and similar documents are retrieved in real time, significantly improving the relevance of the generated responses.
2. **Agentic Systems:**  
   Autonomous agents use similarity search to quickly retrieve past experiences or relevant data, allowing for smarter decision-making in dynamic environments.
3. **Image Retrieval and Recommender Systems:**  
   In e-commerce, when a user uploads a product image, the system computes its vector representation and retrieves visually or semantically similar items. This not only speeds up the search process but also improves customer satisfaction by providing accurate recommendations.
4. **Scalability and Efficiency:**  
   As datasets grow in size and complexity, traditional search methods falter. Advanced algorithms like HNSW, PQ, and LSH ensure that even billions of high-dimensional vectors can be searched quickly, enabling real-time applications.

*Example:* Consider geographic coordinates of cell towers. Delaunay triangulation connects towers that are natural neighbors. A query for the nearest tower to a new location uses this triangulation to quickly narrow the search to adjacent towers.
  
#### Pseudo-code for Delaunay Triangulation (2D)

```python
# Pseudo-code for Delaunay Triangulation using Divide and Conquer
Input: Set of 2D points P
1. Sort P by x-coordinate.
2. Recursively divide P into left (L) and right (R) halves.
3. Compute Delaunay triangulation for L and R.
4. Merge the two triangulations:
    a. Identify the base edge connecting L and R.
    b. Iteratively add edges that satisfy the Delaunay condition.
5. Return the merged triangulation.
```

## Real-World Example: Image Search in E-Commerce

Consider a scenario where a user uploads an image of a sneaker to find similar products. The process involves:
- **Feature Extraction:** A convolutional neural network (CNN) converts the image into a high-dimensional vector.
- **Indexing:** The vector is stored in a vector database that uses HNSW for efficient neighbor search and PQ to reduce memory usage.
- **Query Processing:** When the user submits the query image, the system computes its vector and navigates the HNSW graph to retrieve the closest vectors.
- **Results:** Similar images are returned within milliseconds, significantly enhancing the user experience and increasing the likelihood of a purchase.

## Conclusion

In this article, we examined key similarity search algorithms that power modern vector databases. We explored common distance metrics—including L1, L2, inner product, cosine, Hamming, and Jaccard distances—and delved into advanced ANN techniques such as Locality-Sensitive Hashing, Product Quantization, and Hierarchical Navigable Small World graphs. We also discussed performance enhancements via Delaunay triangulation and provided practical examples—like image retrieval and geographic neighbor search—to illustrate these concepts.

By combining theoretical foundations with real-world applications, similarity vector search emerges as a critical technology for efficient information retrieval and data analysis in AI systems. As datasets continue to grow and AI applications become more context-aware, advanced vector search techniques will play an increasingly vital role in delivering fast, accurate, and scalable solutions.

{{<post-socials page_content_type="blog" telegram_post_id="11" x_post_id="1774985590670573849">}}
