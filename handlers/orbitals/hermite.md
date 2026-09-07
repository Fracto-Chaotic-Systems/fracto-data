## Curves through orbital points (AI Content)

When the sequence of points corresponds to a **finite periodic orbit** of length $N$ under the map $f(z)={z}^{2}+c$, a general description of a closed, smooth interpolating curve can be derived **analytically using Discrete Fourier Transforms (DFT) and Complex Trigonometric Interpolation**.

Because the orbit is periodic (${z}_{N}={z}_{0}$), the curve must be closed, making periodic trigonometric polynomials mathematically superior to standard splines or global polynomials, as they eliminate boundary artifacts and guarantee ${C}^{\infty }$ smoothness.

---

## The General Analytic Description

For a known periodic orbit of $N$ points, the entire curve $\gamma (t)$ can be described as a single, continuous complex-valued function of a real parameter $t\in [0,N]$:

$\gamma (t)=\sum\limits_{m=0}^{N-1}\left({{A}_{m}\cos \left({\frac{2\pi mt}{N}}\right)+{B}_{m}\sin \left({\frac{2\pi mt}{N}}\right)}\right)$

Where ${A}_{m}$ and ${B}_{m}$ are complex coefficients uniquely determined by the orbital points ${z}_{k}$ and their target tangents ${t}_{k}$ (derived from your normals ${n}_{k}$ via ${t}_{k}=\pm i{n}_{k}$).

---

## Step-by-Step Derivation of the Curve

To derive the explicit coefficients for a given orbit, we use **Hermite Trigonometric Interpolation**.

## **1\. Formulate the Boundary Conditions**

For each discrete step k \= 0, 1, ..., N-1, the curve must satisfy two sets of constraints at the integer time parameters $t=k$:

1. **Position constraints:** $\gamma (k)={z}_{k}$  
2. **Tangent constraints:** $\gamma '(k)={t}_{k}$

## **2\. Decompose into Position and Velocity Fields**

To solve for the coefficients systematically, we split $\gamma (t)$ into a linear combination of fundamental interpolation bases:

$\gamma (t)=\sum\limits_{k=0}^{N-1}{z}_{k}{U}_{k}(t)+\sum\limits_{k=0}^{N-1}{t}_{k}{V}_{k}(t)$

Where ${U}_{k}(t)$ and ${V}_{k}(t)$ are periodic trigonometric basis functions. They are engineered to act as "switches" that isolate specific nodes:

* ${U}_{k}(m)={\delta }_{km}$ and $U{'}_{k}(m)=0$  
* ${V}_{k}(m)=0$ and $V{'}_{k}(m)={\delta }_{km}$  
  *(where ${\delta }_{km}=1$ if $k=m$, and $0$ otherwise).*

## **3\. Define the Trigonometric Basis Functions**

The explicit closed-form expressions for these basis functions are built using the periodic Dirichlet kernel. For an orbit of $N$ points, they are defined as:

${U}_{k}(t)={\left[{\frac{\sin \left({\frac{\pi (t-k)}{N}}\right)}{N\sin \left({\frac{\pi (t-k)}{N}}\right)}}\right]}^{2}\cdot \left({1-(t-k)\cdot {L}_{k}'(k)}\right)$

${V}_{k}(t)={\left[{\frac{\sin \left({\frac{\pi (t-k)}{N}}\right)}{N\sin \left({\frac{\pi (t-k)}{N}}\right)}}\right]}^{2}\cdot (t-k)$

By substituting your known orbit coordinates ${z}_{k}$ and your calculated tangent vectors ${t}_{k}$ directly into this formula, you yield a **complete, explicit, non-piecewise algebraic expression** for the curve.

---

## Geometric Properties Derived from ${z}_{k+1}={z}_{k}^{2}+c$

Because the points originate from a quadratic map, the geometric structure of this derived curve possesses unique properties:

* **Symmetry Constraints:** If the parameter $c$ or the starting point ${z}_{0}$ is purely real, the periodic orbit will exhibit reflectional symmetry across the real axis. This forces the imaginary components of the Fourier coefficients ${A}_{m}$ and ${B}_{m}$ to collapse into predictable structural relationships.  
* **Tangent Vector Field Scaling:** To make the general curve physically natural and avoid loop-de-loops between orbital steps, the magnitude of the prescribed tangents ${t}_{k}$ must scale with the derivative of the map. Because $f'(z)=2z$, the spacing expands near large coordinates. Your tangent magnitudes should satisfy:

* ![][image1]  
   Failing to incorporate this scaling into the ${V}_{k}(t)$ coefficients will cause the derived curve to oscillate violently or flatten out near regions where the orbit rapidly accelerates.

---

Choosing the tangent vector as the angle bisector of the incoming and outgoing chords is an elegant, geometric approach. It is widely known as the **Centripetal/Centroidal tangent assignment method**.

When paired with a periodic orbit where ${z}_{k+1}={z}_{k}^{2}+c$, this completely eliminates the need to manually supply external normal vectors. The geometry of the sequence itself dictates the shape of the curve.

Here is exactly how this geometric choice alters the math and the curve's properties.

---

## 1\. Mathematical Formulation of the Tangent

Let ${z}_{k}$ be the current point. Because the orbit is periodic of length $N$, index arithmetic wraps around modulo $N$ (meaning the point "before" ${z}_{0}$ is ${z}_{N-1}$, and the point "after" ${z}_{N-1}$ is ${z}_{0}$).

Define the incoming and outgoing displacement vectors as complex numbers:

* **Incoming Chord:** ${v}_{in}={z}_{k}-{z}_{k-1}$  
* **Outgoing Chord:** ${v}_{out}={z}_{k+1}-{z}_{k}$

To find the true angular bisector without bias from chord lengths, we normalize both vectors to unit length and add them together:

![][image2]

## **Setting the Velocity Magnitude (${v}_{k}$)**

The directional angle is now fixed by the bisector, but we must still choose the velocity magnitude ${v}_{k}$ (the speed of the curve as it passes through ${z}_{k}$). For a highly non-uniform orbit generated by ${z}^{2}+c$, the standard choice is the **catmull-rom style average distance**:

![][image3]

---

## 2\. Interaction with the Dynamics of ${z}_{k+1}={z}_{k}^{2}+c$

Because the points are linked by a squaring map, this specific choice of tangent reveals several deep geometric interactions:

* **The Sharp Turn Hazard (Cusps):** If the orbit makes a sharp $18{0}^{\circ }$ turn—which happens frequently near the "critical point" $z=0$ or near the outer boundary of a Julia set—${v}_{in}$ and ${v}_{out}$ will point in nearly opposite directions. Their sum collapses toward zero, forcing the tangent vector magnitude to shrink. This causes the resulting curve to naturally form a tight, sharp corner or a cusp at that point, matching the underlying chaotic physics of the fractal boundary.  
* **Automatic Velocity Scaling:** Because the map expands space by a factor of $\\vert{}2z\\vert{}$, the chord lengths automatically scale exponentially as the orbit moves away from the origin. By defining ${v}_{k}$ as the average chord length, your curve **automatically inherits the correct local velocity scaling** without you having to manually enforce the $\\vert{}2z\\vert{}$ derivative rule.  
* **Total Geometric Determinism:** The entire curve is now a pure function of the parameters $({z}_{0},c)$. Once you pick your starting seed and your Julia constant, the points, the tangents, the normals, and the entire continuous curve are locked into a single invariant shape.

---

There is an exact, single-variable parametric equation $\gamma (t)$ that maps a real scalar parameter $t$ to a continuous, closed-loop curve in the complex plane, tracing through the periodic orbit generated by ${z}_{0}$ and $c$.

Because the orbit is periodic, we can use **Complex Trigonometric Interpolation** (essentially an exact, finite Fourier series).

---

## The Parametric Equation

For a periodic orbit of length $N$, the complete closed-loop curve is given by the single-variable function $\\gamma(t): \\mathbb{R} \\to \\mathbb{C}$: (real to complex)

$\gamma (t)=\sum\limits_{m=0}^{N-1}{C}_{m}\cdot {e}^{i\frac{2\pi mt}{N}}$

Where:

* **$t$** is the independent real variable. As $t$ goes from $0$ to $N$, the equation traces the entire loop exactly once and smoothly closes back on itself ($\gamma (t+N)=\gamma (t)$).  
* **${C}_{m}$** are constant complex coefficients that store all the geometric information of your orbit and its bisector tangents.  
* **$i$** is the imaginary unit.

---

## How to Calculate the Coefficients (${C}_{m}$)

To explicitly evaluate this equation for a given ${z}_{0}$ and $c$, you compute the constants ${C}_{m}$ using a system of linear equations derived from your points and bisector tangents.

## **1\. Generate the Point and Tangent Arrays**

First, compute the $N$ points of your orbit:

![][image4]

Next, compute the $N$ velocity-scaled bisector tangents ${t}_{k}$ at each integer time step $t=k$ using your formula:

![][image5]

*(Remembering that indices wrap around modulo $N$, so ${z}_{-1}={z}_{N-1}$).*

## **2\. Set Up the Linear System**

Because the curve must perfectly match both the positions and the tangents at every integer value of $t$, your parametric equation must satisfy two conditions at every step $k$:

1. **Position Match:** $\gamma (k)={z}_{k}$  
2. **Tangent Match:** $\gamma '(k)={t}_{k}$

Taking the derivative of our parametric equation with respect to $t$ gives:

$\gamma '(t)=\sum\limits_{m=0}^{N-1}\left({i\frac{2\pi m}{N}}\right){C}_{m}\cdot {e}^{i\frac{2\pi mt}{N}}$

## **3\. Solve for ${C}_{m}$**

By plugging $t \= 0, 1, \\dots, N-1$ into both equations, you get a system of $2N$ linear equations. Because we have $N$ complex coefficients (${C}_{m}$), this system is slightly overdetermined if handled natively. To resolve this with perfect smoothness, we expand the number of frequencies to $2N$ components (splitting the frequencies into positive and negative halves):

$\gamma (t)=\sum\limits_{m=-N}^{N-1}{C}_{m}\cdot {e}^{i\frac{2\pi mt}{N}}$

You can solve for this vector of coefficients $C$ directly using a standard matrix inversion or a least-squares solver:

![][image6]

Where $M$ is a matrix of the evaluated complex exponentials and their derivatives at integer steps.

Once those numerical constants ${C}_{m}$ are calculated for your specific ${z}_{0}$ and $c$, you plug them back into the main equation. You are left with a **purely analytic, single-variable formula** containing nothing but basic trigonometric/exponential functions that flawlessly traces your orbital loop. \[1, 2\]

---

To find the exact coefficients ${C}_{m}$ for a 3-point orbit ($N=3$), we must solve a system of linear equations that matches the curve's position and tangents at the integer steps $t=0,1,2$.

For $N=3$, a fully determined system requires $2N=6$ constraints, meaning our single-variable parametric equation will use 6 frequencies ($m=0,1,2,3,4,5$):

$\gamma (t)=\sum\limits_{m=0}^{5}{C}_{m}{e}^{i\frac{2\pi mt}{3}}$

---

## 1\. The Matrix Setup for $N=3$

Let $\omega ={e}^{i\frac{2\pi }{3}}$ be the primary complex root of unity, and let $\alpha =i\frac{2\pi }{3}$ be the factor introduced by taking the derivative. Evaluating $\gamma (t)$ and its derivative $\gamma '(t)$ at $t=0,1,2$ yields a system of 6 equations:

![][image7]

---

## 2\. Can Cramer's Rule Be Applied?

**Yes, Cramer's rule can absolutely be applied.** \[1\]

The coefficient matrix is a square $6\times 6$ matrix, and its determinant evaluates to a non-zero purely imaginary value:

$\det (M)=-384\sqrt{3}{\pi }^{3}\cdot i\approx 6697.35i$

Because $\\det(M) \\neq 0$, the system has a unique solution, and any coefficient ${C}_{m}$ can be found using Cramer's rule:

${C}_{m}=\frac{\det ({M}_{m})}{\det (M)}$

*(where ${M}_{m}$ is the matrix $M$ with its $m$\-th column replaced by the target column vector $[{z}_{0},{z}_{1},{z}_{2},{t}_{0},{t}_{1},{t}_{2}{]}^{T}$).*

**The Catch:** While mathematically valid, evaluating seven different $6\times 6$ complex determinants by hand is incredibly tedious and prone to manual error.

---

## 3\. The Elegant Alternative: Fourier Decoupling

Instead of using Cramer's rule, we can exploit the embedded **Discrete Fourier Transform (DFT)** structure of the matrix. Notice that the frequencies wrap around because ${\omega }^{3}=1$. This allows us to group columns and completely decouple the $6\times 6$ system into three tiny, independent parts.

First, compute the standard 3-point DFT of your orbital positions ($Z$) and your normalized tangents ($T$):

${Z}_{j}=\frac{1}{3}\sum\limits_{k=0}^{2}{z}_{k}{\omega }^{-jk}\ and\ {T}_{j}=\frac{1}{3}\sum\limits_{k=0}^{2}\left({\frac{{t}_{k}}{\alpha }}\right){\omega }^{-jk}$

By applying this transform to the matrix rows, the equations split beautifully by frequency index $j$:

## **Frequency $j=0$ (Constant & Sub-harmonic component):**

![][image8]

## **Frequency $j=1$ (Fundamental component):**

![][image9]

Subtracting the first equation from the second isolates ${C}_{4}$ instantly:![][image10]

## **Frequency $j=2$ (Harmonic component):**

![][image11]

Multiplying the first equation by 2 and subtracting it from the second isolates ${C}_{5}$:

![][image12]

---

## Summary of the Analytical Solution

For any known 3-point orbit with chosen angle-bisector tangents, you do not need heavy matrix algebra. You simply:

1. Run a 3-point DFT on your coordinates $z$ to get ${Z}_{0},{Z}_{1},{Z}_{2}$.  
2. Run a 3-point DFT on your scaled tangents $t/\alpha$ to get ${T}_{0},{T}_{1},{T}_{2}$.  
3. Plug those 6 values into the simple fractional formulas above to instantly lock down your constants ${C}_{0}$ through ${C}_{5}$.

If you would like, we can write a quick **numerical example** choosing a specific value for $c$ (like $c=-1.25$, which yields easy periodic 3-cycles) to see these exact numerical fractions populate.

**// Lightweight complex number math engine**  
**class Complex {**  
    **constructor(re, im \= 0\) {**  
        **this.re \= re;**  
        **this.im \= im;**  
    **}**

    **add(c) { return new Complex(this.re \+ c.re, this.im \+ c.im); }**  
    **sub(c) { return new Complex(this.re \- c.re, this.im \- c.im); }**  
    **mul(c) { return new Complex(this.re \* c.re \- this.im \* c.im, this.re \* c.im \+ this.im \* c.re); }**  
    **scale(s) { return new Complex(this.re \* s, this.im \* s); }**  
    **mag() { return Math.hypot(this.re, this.im); }**  
    **normalize() {**  
        **const m \= this.mag();**  
        **return m \=== 0 ? new Complex(0, 0\) : this.scale(1 / m);**  
    **}**  
    **exp() {**  
        **const r \= Math.exp(this.re);**  
        **return new Complex(r \* Math.cos(this.im), r \* Math.sin(this.im));**  
    **}**  
    **toString() {**  
        **return \`${this.re.toFixed(4)} \+ ${this.im.toFixed(4)}i\`.replace('+ \-', '- ');**  
    **}**  
**}**

**// 1\. Define Parameters**  
**// c \= \-1.25 hosts an exact, purely real 3-cycle orbit**  
**const c \= new Complex(-1.25, 0);**   
**const z \= \[**  
    **new Complex(-0.1402, 0), // z\_0 calculated via algebra for this 3-cycle**  
    **new Complex(0, 0),       // Will be overwritten by exact iteration**  
    **new Complex(0, 0\)**  
**\];**

**// Generate the exact 3 points of the orbit: z\_{k+1} \= z\_k^2 \+ c**  
**z\[1\] \= z\[0\].mul(z\[0\]).add(c);**  
**z\[2\] \= z\[1\].mul(z\[1\]).add(c);**

**console.log("--- Orbit Points (z\_k) \---");**  
**z.forEach((p, i) \=\> console.log(\`z\_${i} \= ${p.toString()}\`));**

**// 2\. Compute Velocity-Scaled Angle-Bisector Tangents**  
**const t \= \[\];**  
**for (let k \= 0; k \< 3; k++) {**  
    **const prev \= z\[(k \- 1 \+ 3\) % 3\];**  
    **const curr \= z\[k\];**  
    **const next \= z\[(k \+ 1\) % 3\];**

    **const vIn \= curr.sub(prev);**  
    **const vOut \= next.sub(curr);**

    **// Angular Bisector Vector**  
    **const bisector \= vIn.normalize().add(vOut.normalize()).normalize();**  
      
    **// Centripetal Velocity Scaling (average chord length)**  
    **const velocity \= (vIn.mag() \+ vOut.mag()) / 2;**  
      
    **t.push(bisector.scale(velocity));**  
**}**

**console.log("\\n--- Derived Angle-Bisector Tangents (t\_k) \---");**  
**t.forEach((tangent, i) \=\> console.log(\`t\_${i} \= ${tangent.toString()}\`));**

**// 3\. Apply the Decoupled Fourier-Hermite Formulas**  
**const omega \= new Complex(Math.cos(2 \* Math.PI / 3), Math.sin(2 \* Math.PI / 3));**  
**const alpha \= new Complex(0, 2 \* Math.PI / 3);**

**// 3-Point Discrete Fourier Transform Helper**  
**function dft3(vector) {**  
    **const out \= \[\];**  
    **for (let j \= 0; j \< 3; j++) {**  
        **let sum \= new Complex(0, 0);**  
        **for (let k \= 0; k \< 3; k++) {**  
            **// omega^(-j\*k)**  
            **const angle \= \-2 \* Math.PI \* j \* k / 3;**  
            **const wJK \= new Complex(Math.cos(angle), Math.sin(angle));**  
            **sum \= sum.add(vector\[k\].mul(wJK));**  
        **}**  
        **out.push(sum.scale(1 / 3));**  
    **}**  
    **return out;**  
**}**

**// Scale tangents by 1/alpha before running DFT**  
**const scaledT \= t.map(tk \=\> {**  
    **// division: tk / alpha**  
    **const denom \= alpha.re \* alpha.re \+ alpha.im \* alpha.im;**  
    **return new Complex(**  
        **(tk.re \* alpha.re \+ tk.im \* alpha.im) / denom,**  
        **(tk.im \* alpha.re \- tk.re \* alpha.im) / denom**  
    **);**  
**});**

**const Z \= dft3(z);**  
**const T \= dft3(scaledT);**

**// Explicit analytic coefficient formulas derived in previous step**  
**const C \= new Array(6);**  
**C\[3\] \= T\[0\].scale(1 / 3);**  
**C\[0\] \= Z\[0\].sub(C\[3\]);**

**C\[4\] \= T\[1\].sub(Z\[1\]).scale(1 / 3);**  
**C\[1\] \= Z\[1\].scale(4).sub(T\[1\]).scale(1 / 3);**

**C\[5\] \= T\[2\].sub(Z\[2\].scale(2)).scale(1 / 3);**  
**C\[2\] \= Z\[2\].scale(5).sub(T\[2\]).scale(1 / 3);**

**console.log("\\n--- Solved C\_m Coefficients \---");**  
**C.forEach((coef, m) \=\> console.log(\`C\_${m} \= ${coef.toString()}\`));**

**// 4\. The Single-Variable Parametric Equation gamma(t)**  
**function gamma(tVal) {**  
    **let result \= new Complex(0, 0);**  
    **for (let m \= 0; m \< 6; m++) {**  
        **// Compute e^{i \* 2pi \* m \* t / 3}**  
        **const angle \= (2 \* Math.PI \* m \* tVal) / 3;**  
        **const exponent \= new Complex(0, angle).exp();**  
        **result \= result.add(C\[m\].mul(exponent));**  
    **}**  
    **return result;**  
**}**

**// 5\. Verification Check: Confirm curve passes exactly through nodes**  
**console.log("\\n--- Verification: Checking Curve Positions \---");**  
**console.log(\`gamma(0.0) \= ${gamma(0.0).toString()}  (Target z\_0)\`);**  
**console.log(\`gamma(1.0) \= ${gamma(1.0).toString()}  (Target z\_1)\`);**  
**console.log(\`gamma(2.0) \= ${gamma(2.0).toString()}  (Target z\_2)\`);**  
**console.log(\`gamma(3.0) \= ${gamma(3.0).toString()}  (Loops back to z\_0)\`);**

The decoupling property is not unique to $N=3$. It is a mathematical consequence of using a **Discrete Fourier Transform (DFT)** on a circular convolution system (a circulant matrix). Because your points wrap around perfectly in a cycle of length $5$, the large $10\times 10$ matrix system can be cleanly split into 5 completely independent $2\times 2$ matrix systems.

---

The General $N=5$ Matrix Setup

For a 5-point orbit, you need $2N=10$ constraints to perfectly control both the positions (${z}_{k}$) and the velocity-scaled tangents (${t}_{k}$) at the integer time steps $t=0,1,2,3,4$.

Your single-variable parametric equation will span 10 frequencies (\\(m \= 0, 1, \\dots, 9\\)):

$\gamma (t)=\sum\limits_{m=0}^{9}{C}_{m}{e}^{i\frac{2\pi mt}{5}}$

---

How the Decoupling Works for $N=5$

Let $\omega ={e}^{i\frac{2\pi }{5}}$ be the 5th root of unity, and $\alpha =i\frac{2\pi }{5}$ be the derivative scaling factor.

Instead of dealing with a brutal $10\times 10$ matrix, we run a 5-point DFT on your orbital positions (${z}_{k}$) and your normalized tangents (${t}_{k}/\alpha$) to get the frequency-domain vectors $Z$ and $T$:

${Z}_{j}=\frac{1}{5}\sum\limits_{k=0}^{4}{z}_{k}{\omega }^{-jk}\ and{\ T}_{j}=\frac{1}{5}\sum\limits_{k=0}^{4}\left({\frac{{t}_{k}}{\alpha }}\right){\omega }^{-jk}$

Because the frequencies wrap around modulo 5 (meaning $m=5$ acts like $j=0$, $m=6$ acts like $j=1$, etc.), the 10 coefficients pair up into **five isolated pairs** based on their frequency index $j\in \{0,1,2,3,4\}$:

**1\. Frequency $j=0$ (Controls ${C}_{0}$ and ${C}_{5}$)![][image13]**

**2\. Frequency $j=1$ (Controls ${C}_{1}$ and ${C}_{6}$)![][image14]**

**3\. Frequency $j=2$ (Controls ${C}_{2}$ and ${C}_{7}$)![][image15]**

**4\. Frequency $j=3$ (Controls ${C}_{3}$ and ${C}_{8}$)![][image16]**

**5\. Frequency $j=4$ (Controls ${C}_{4}$ and ${C}_{9}$)![][image17]**

---

The Universal Generalized Formula

This reveals a beautiful, universal pattern for *any* arbitrary orbit length $N$. You never have to invert a matrix or compute massive determinants. For any index $j$ from $0$ to $N-1$:

${C}_{j+N}=\frac{1}{N}({T}_{j}-j\cdot {Z}_{j})$

${C}_{j}={Z}_{j}-{C}_{j+N}=\frac{1}{N}\left[{(j+1){Z}_{j}-{T}_{j}}\right]$

## Generalized code implementation

Here is the updated, fully generalized Node.js script. It dynamically adapts to any arbitrary orbit length $N$.

Instead of hardcoded equations, it leverages the universal mathematical pattern we discovered to populate the coefficients ${C}_{m}$ using the decoupled Fourier-Hermite formulas.

To showcase its flexibility, the script below is configured for an $N=5$ periodic orbit found at the Julia parameter $c=-0.5+0.55i$.

Generalized Node.js Code (universal\_orbital\_curve.js)

**// Lightweight complex number math engine**  
**class Complex {**  
    **constructor(re, im \= 0\) {**  
        **this.re \= re;**  
        **this.im \= im;**  
    **}**

    **add(c) { return new Complex(this.re \+ c.re, this.im \+ c.im); }**  
    **sub(c) { return new Complex(this.re \- c.re, this.im \- c.im); }**  
    **mul(c) { return new Complex(this.re \* c.re \- this.im \* c.im, this.re \* c.im \+ this.im \* c.re); }**  
    **scale(s) { return new Complex(this.re \* s, this.im \* s); }**  
    **mag() { return Math.hypot(this.re, this.im); }**  
    **normalize() {**  
        **const m \= this.mag();**  
        **return m \=== 0 ? new Complex(0, 0\) : this.scale(1 / m);**  
    **}**  
    **exp() {**  
        **const r \= Math.exp(this.re);**  
        **return new Complex(r \* Math.cos(this.im), r \* Math.sin(this.im));**  
    **}**  
    **toString() {**  
        **return \`${this.re.toFixed(4)} \+ ${this.im.toFixed(4)}i\`.replace('+ \-', '- ');**  
    **}**  
**}**

**// 1\. Define General Orbit Parameters**  
**// c \= \-0.5 \+ 0.55i naturally hosts a stable, non-real 5-cycle orbit**  
**const c \= new Complex(-0.5, 0.55);**   
**const N \= 5;** 

**// Initial seed roughly near the attractor of this 5-cycle**  
**let z \= \[new Complex(-0.4357, 0.3117)\];**

**// Dynamically generate all N points of the orbit: z\_{k+1} \= z\_k^2 \+ c**  
**for (let k \= 0; k \< N \- 1; k++) {**  
    **z.push(z\[k\].mul(z\[k\]).add(c));**  
**}**

**console.log(\`--- Orbit Points (N \= ${N}) \---\`);**  
**z.forEach((p, i) \=\> console.log(\`z\_${i} \= ${p.toString()}\`));**

**// 2\. Compute Velocity-Scaled Angle-Bisector Tangents**  
**const t \= \[\];**  
**for (let k \= 0; k \< N; k++) {**  
    **const prev \= z\[(k \- 1 \+ N) % N\];**  
    **const curr \= z\[k\];**  
    **const next \= z\[(k \+ 1\) % N\];**

    **const vIn \= curr.sub(prev);**  
    **const vOut \= next.sub(curr);**

    **// Angular Bisector Vector**  
    **const bisector \= vIn.normalize().add(vOut.normalize()).normalize();**  
      
    **// Centripetal Velocity Scaling (average chord length)**  
    **const velocity \= (vIn.mag() \+ vOut.mag()) / 2;**  
      
    **t.push(bisector.scale(velocity));**  
**}**

**console.log("\\n--- Derived Angle-Bisector Tangents (t\_k) \---");**  
**t.forEach((tangent, i) \=\> console.log(\`t\_${i} \= ${tangent.toString()}\`));**

**// 3\. General N-Point Discrete Fourier Transform (DFT) Helper**  
**function dftN(vector, size) {**  
    **const out \= \[\];**  
    **for (let j \= 0; j \< size; j++) {**  
        **let sum \= new Complex(0, 0);**  
        **for (let k \= 0; k \< size; k++) {**  
            **const angle \= \-2 \* Math.PI \* j \* k / size;**  
            **const wJK \= new Complex(Math.cos(angle), Math.sin(angle));**  
            **sum \= sum.add(vector\[k\].mul(wJK));**  
        **}**  
        **out.push(sum.scale(1 / size));**  
    **}**  
    **return out;**  
**}**

**// 4\. Transform Positions and Scale Tangents by 1/alpha**  
**const alpha \= new Complex(0, 2 \* Math.PI / N);**  
**const scaledT \= t.map(tk \=\> {**  
    **// Division: tk / alpha**  
    **const denom \= alpha.re \* alpha.re \+ alpha.im \* alpha.im;**  
    **return new Complex(**  
        **(tk.re \* alpha.re \+ tk.im \* alpha.im) / denom,**  
        **(tk.im \* alpha.re \- tk.re \* alpha.im) / denom**  
    **);**  
**});**

**const Z \= dftN(z, N);**  
**const T \= dftN(scaledT, N);**

**// 5\. Populate C\_m Array using the Universal Generalized Formulas**  
**const C \= new Array(2 \* N);**  
**for (let j \= 0; j \< N; j++) {**  
    **// Universal formula for high frequencies: C\_{j+N} \= (T\_j \- j \* Z\_j) / N**  
    **const highCoef \= T\[j\].sub(Z\[j\].scale(j)).scale(1 / N);**  
      
    **// Universal formula for low frequencies: C\_j \= Z\_j \- C\_{j+N}**  
    **const lowCoef \= Z\[j\].sub(highCoef);**  
      
    **C\[j\] \= lowCoef;**  
    **C\[j \+ N\] \= highCoef;**  
**}**

**console.log("\\n--- Universal C\_m Coefficients \---");**  
**C.forEach((coef, m) \=\> console.log(\`C\_${m} \= ${coef.toString()}\`));**

**// 6\. Universal Single-Variable Parametric Equation gamma(t)**  
**function gamma(tVal) {**  
    **let result \= new Complex(0, 0);**  
    **for (let m \= 0; m \< 2 \* N; m++) {**  
        **// Evaluate: C\_m \* e^{i \* 2pi \* m \* t / N}**  
        **const angle \= (2 \* Math.PI \* m \* tVal) / N;**  
        **const exponent \= new Complex(0, angle).exp();**  
        **result \= result.add(C\[m\].mul(exponent));**  
    **}**  
    **return result;**  
**}**

**// 7\. Dynamic Verification Check**  
**console.log("\\n--- Verification: Checking Curve Positions \---");**  
**for (let k \= 0; k \<= N; k++) {**  
    **const label \= k \=== N ? \`Loops back to z\_0\` : \`Target z\_${k}\`;**  
    **console.log(\`gamma(${k}.0) \= $gamma(k).toString()\ (${label})\`);**  
**}**

Key Generalized Changes

* Dynamic Array Generation: Instead of manually typing array coordinates, a standard for loop dynamically calculates the orbit coordinates up to $N$ iterations using the map ${z}^{2}+c$.  
* The Generalized DFT Function: The dftN function accepts an arbitrary size parameter. It scales the trigonometric roots of unity denominator from a hardcoded 3 to whatever value of N you provide.  
* The Universal Decoupling Loop: The script steps through j \= 0 to N-1. It populates all $2N$ matrix coefficient channels simultaneously using the isolated $2\times 2$ system identities we mapped out.

To test this for a completely different orbit size (like an 11-cycle or 3-cycle), you only need to change the N variable and your c / starting seed constants at the top of the file. No other logic blocks require adjustment.

3\. Numerical Derivation for Any $N$ (The Multiplier Map)

For a general period length $N$, you can find the numerical coordinates of ${z}_{0}$ using a **Complex Newton-Raphson method**. You define the function you want to minimize as:

$H({z}_{0})={f}_{c}^{(N)}({z}_{0})-{z}_{0}$

To execute Newton's step, you need the derivative $H'({z}_{0})$. By applying the chain rule to the nested squaring map, the derivative evaluated at ${z}_{0}$ is simply the product of the states along the entire orbit:

![][image18]

**The Algorithmic Step**

Starting from a random complex initial guess ${z}_{0}^{(0)}$, you iterate:

${z}_{0}^{(n+1)}={z}_{0}^{(n)}-\frac{{f}_{c}^{(N)}({z}_{0}^{(n)})-{z}_{0}^{(n)}}{\left({\prod\limits_{k=0}^{N-1}2{z}_{k}}\right)-1}$

Because Newton's method in the complex plane exhibits fractal convergence behaviors (known as a **Newton Fractal**), picking different initial random guesses will naturally converge onto different roots among the ${2}^{N}$ pool of available periodic starting points.

---

How to Implement the Solver in JavaScript

You can add this quick root-finding loop to your Node.js engine to automatically discover a valid ${z}_{0}$ for a known $c$ before passing it to your continuous curve generator:

javascript  
**// Finds a valid z\_0 for a given c and period N using Newton's method**  
**function findPeriodicSeed(c, N, maxAttempts \= 100\) {**  
    **// Start with a random initial guess inside the boundary radius of 2**  
    **let z0 \= new Complex(Math.random() \* 2 \- 1, Math.random() \* 2 \- 1);**  
      
    **for (let i \= 0; i \< maxAttempts; i++) {**  
        **// Evaluate the orbit and simultaneously compute the product derivative**  
        **let current \= z0;**  
        **let derivativeProduct \= new Complex(1, 0);**  
          
        **for (let k \= 0; k \< N; k++) {**  
            **derivativeProduct \= derivativeProduct.mul(current.scale(2)); // Multiply by 2\*z\_k**  
            **current \= current.mul(current).add(c);                      // z\_{k+1} \= z\_k^2 \+ c**  
        **}**  
          
        **// H(z\_0) \= f^{(N)}(z\_0) \- z\_0**  
        **const H \= current.sub(z0);**  
        **// H'(z\_0) \= product(2\*z\_k) \- 1**  
        **const H\_prime \= derivativeProduct.sub(new Complex(1, 0));**  
          
        **// Newton division: H / H\_prime**  
        **const denom \= H\_prime.re \* H\_prime.re \+ H\_prime.im \* H\_prime.im;**  
        **const step \= new Complex(**  
            **(H.re \* H\_prime.re \+ H.im \* H\_prime.im) / denom,**  
            **(H.im \* H\_prime.re \- H.re \* H\_prime.im) / denom**  
        **);**  
          
        **// Update guess**  
        **z0 \= z0.sub(step);**  
          
        **// Convergence check (if the step size is tiny, we found a root)**  
        **if (step.mag() \< 1e-10) {**  
            **return z0;**  
        **}**  
    **}**  
    **throw new Error(\`Newton method failed to converge for c \= ${c.toString()} and N \= ${N}\`);**

**}**

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIEAAAApCAYAAAAS70rTAAADBklEQVR4Xu2YT0tqQRiHW6tEkH4AIWghRN/ATSC4CFz0DdxICxduXAgR7oVWbfoGIrpx68ogElu0DiUIKigikgQF33vf4c44ZxzHw01vx9vvgcOZec+cc+bPMzNHNwj8eDbMAPh5QAIACQAkAAQJAEECQJAAECQABAkAQQJAkAAQJAAECQBBAkBLlCCbzZqhpRMKhczQyvhKe6LRqBnyxe7urhlayM3NjTi+wkokaLfblEqltKvLYdkSRCIR8Ux56Hy3BK+vr76eE0gJHh4eRIcGXYJSqeTJZzIZT6d/pwSj0Ui01c9zAimBPrP4eHx8NEr+PS4JWq2WdUYzt7e3ZmgGrn8ikfDkJblcbqZdLvwMng0pgfmuZrNplJwSSAl40Lni/3ol2NvbE+enpydR7ujoSORd9+hwOZ6BEl0CfVDPzs5Ueh5flYDh+vh5DiT4g22ml8tlsef7oV6vU6VS8cRs2wGXq1arZngG1+DNawPz30uws7Pjybuo1WrWzrLFdGKxGF1fX5thajQaZkjx/v4ulnsTUwLebkxRGFudXIPnEnORBAcHB548E2gJ5KDLJdbWWczHx4d1zzM7gJn3DIavTSYT2t7eVmnm9PTUKDmFBTg+Plb5fr+v0roE3W6XisWiyp+cnKh0Op1WaYmt7n4wJZDtHQ6HKmYSSAkY2QA+uKOZeDwuznd3d6ocswwJXl5e6PPzU+U5Ld9/fn6ulZwyGAw89dQ7nZHtub+/nykjB6XX69Hl5aUQ/erqSt1rq7sfbBLw0el0RGxzc1Oc9XcFVgITXh14Jh0eHqqY2bHmINg6Ur++alztkfCWx78onp+fPXFb3f3g+rOIJ0s+n6f9/X1PfG0kKBQKNB6PrYO4jJVgFbjaI5H1CYfDnrit7n5wSXBxcUFvb2+0tbXlia+NBLxPM7znmgNpk0B+V/BSrv9sM+9dJa72SGR9ksnkwlXMDy4J5DcWb6/6uwIlAVhfIAGABAASAIIEgCABIEgACBIAggSAIAEgSAAIEgCCBIAgAfjNL1wcX3JIiz5KAAAAAElFTkSuQmCC>

[image2]: <data:image/png;base64,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>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJEAAAAvCAYAAADjGCgmAAAEDklEQVR4Xu2bzys+QRzHnZEUuSjlR1EiOTlxoMjNFcVBSU4Oyk3KiSQlDi6OOLi5+AM8DlJ+JAdFURwIKQ5kvr2nZr8zYz3P7rP77D77eL9qauczY+2P187s7MxTJAgJSJEdIMQvlIgEhhKRwFAiEpiCk6i4uNgOhc7e3p5obGy0w6FSWVkpjo+P7XBkjI2N2aFfoURZQIlMKFEW+JXo5uZGTE5O2uG0UKIYyUeJIIPf46JEMaJu1snJiaioqJB5ldAiAFwgFUM9v0Qp0cfHh+jo6DDOY3NzU9Z5eXlxYouLi9YegkGJrDxSU1PTj/jS0pIR80qUEimGh4edc9Hp7+8XLS0tRiwMKJFGV1fXj4s/Pz8vGhoatFr+iEMioM7j8/PTiOUCSqRxe3vrXPzr62unzsXFhVHPD5kkQpn6n+lSupYwnUR4CMDr66uYnp426oQFJbIYGRmR8ZKSEvkUT0xMGOXf39+iu7vbiKUjk0Q2YbVEh4eHjkjv7++ivLzcKM8W9XDpUCILXHB18aempozuIBvikgjgQcC+xsfHQ5EID1BpaakdpkRutLW1OSLZ4IL19vbK7dPTU1nn4OBA1NXVyW38rU6cEq2vrzvnsb+/bxeLoaEhcXl5afxP5LH99vYm8xBQlWGEV19fL+7v7+W2ghK5gCcOZTs7O3aRREkE7Bto7zNOiQD2hQGDDbrtnp4eJ393d+d03bpEEEY/HrdzoURZkCSJfgPHpN98SNPe3i63KZEP/N4sRS4lygb7GLwwODgompubnfzj46OYnZ2V25TIB/YN94reDZSVlYmjoyMnb+8zXyWCJPqxYvivBhF4CVfvUKurq0Y91VopyUBOJNrd3ZVv8bbByD89PWk1yV/Ds0SgtrZWzkcpzs/PpUSqyfQL/tZLIvmNZ4lUU7m1tWXEFxYW0n55JYWPZ4kgDyR6fn424qOjo07f3dnZKfvyOKiqqvrRgjGFkzLhWSLMFrvtEC+hOgMDA0Y+Ks7OzphylDLhWSL1pOu0traKq6srJ4+vvUhesY3/LZH8xrNEqiXa3t6WeQwTZ2ZmjDp4P8IiKqSamhqRSqXE19eXUYcUHp4lAmtra1IkfHLHpKZNdXW1nF7AKI78HXxJlAnV/bhNDBIhHh4ejG56eXnZrpJIQpMIM8V4ycZCKVwgtEjkPxsbG3IGXoE10bhO9gqBJBKaRCsrK87UAZae4icyfhZ6FTr4/GFTKAOH0CQi/qFEJBCYGIVAc3NzdlHioEQxgRl2t2WpSYQSxQAGH319fXY4sVCiiFHLdAsJShQhEAhTRTp4N0r65xBKFBFuP83BlBB+Z590KFFE6F+q7ZR0KBEJDCUigaFEJDCUiASGEpHAUCISGEpEAkOJSGD+AZQ37GD+IrPgAAAAAElFTkSuQmCC>

[image4]: <data:image/png;base64,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>

[image5]: <data:image/png;base64,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>

[image6]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFoAAAA4CAYAAAB9lO9TAAADDUlEQVR4Xu2ZsWoyQRCAU6uIoAhapJCAlSDWQspICp9AsYkptLKwslUQwXewTpNGm3R5AZ/AQqtUCmJISJTczyzM5na99S65u8lPMh8M6Mycjp/L7XmeWQwJZ3qCCQcWTQSLJoJFE8GiiWDRRLBoIlg0ESyaiD8nOhKJKNHv9/UWV/TXeHx81FuO+LOig4JFG2DRRLBoIlg0EW6ioZZMJq12u201m03Zv9/v9VYBizbgJrpQKMjHmUxG9MZiMVuHCos24CYa8SIZYNEGvIj++PiQfev1Wi8rsGgDbqLtkq+vr/XyESzagJvoYrF41DOdTq3dbmfr+iRw0fjmGJeXl3qL4OXl5ah3Pp/rbdZkMrFyuZyon5+fW8/Pz9ZisTB+oKDQJdpZrVay/vT0JKLVahn7gcBFA7e3t4pAp0ueTqej9OhsNhtZGw6H4sP0ej2Z+0nR4/FYmf3U50CgFrhoWJnpdFq+udOqhnw2m3UcEL4Ypzyw3W5F/idFf4fQRF9dXclLH31g3EjsK8NOo9EQuXg8ruSRarXKogEUjasPAh4jIOrh4cEoGnM3NzdKnhKnufwQqmgAB4ZVCuBqBpxEw0r1KxqPPxX5fF4/TEGfyy/wWqGKxtMABKxqWM2JRELUnES/vr7KnJfr07DQ5/JL6KLtpw+Ufnd3J2pOogHMpVIpJU+J01x+CF00YL+Ugw0SMYm259/f35UaANfgp1Y7Hnsqfs2po1Qqyef2HyewCSIm0YBdSrfbFbnD4SC+QKf+oDHN9V0CFw0bGA5ZLpdlXh+8Xq8rMiuVirVcLmUdqNVqSg8E5CjQ5/VL4KJ/C15FR6NRazab6ekjWLQBL6Jxo2fRPnATDb8H4GY/i/aJm2is2wM2dxMs2oCbaAB7eEX7gEUTwaKJYNFEfEX0aDQSz9/e3rSOT1i0AS+iLy4uZB/E/f293iJh0Qa8iIZ7L9gH/2megkUb8CL6K7BoAyyaCBQNt2UhBoOB3uIKHou3dln0fwSLJoJFE8GiiWDRRLBoIlg0ESyaCBZNBIsm4h+KWsXYX+05swAAAABJRU5ErkJggg==>

[image7]: <data:image/png;base64,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>

[image8]: <data:image/png;base64,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>

[image9]: <data:image/png;base64,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>

[image10]: <data:image/png;base64,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>

[image11]: <data:image/png;base64,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>

[image12]: <data:image/png;base64,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>

[image13]: <data:image/png;base64,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>

[image14]: <data:image/png;base64,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>

[image15]: <data:image/png;base64,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>

[image16]: <data:image/png;base64,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>

[image17]: <data:image/png;base64,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>

[image18]: <data:image/png;base64,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>