---
name: illegal-states
description: Make illegal states unrepresentable instead of defending against them. Use when writing or reviewing Python that handles errors or validates data, when tempted to add a fallback, try/except, isinstance check, or new branch to fix a failure, or when a function accumulates defensive checks.
---

# Make illegal states unrepresentable

The reflex this skill exists to override: observe a local failure, add a local
defense. Each defense looks reasonable alone; accumulated, they make the system
less understandable while appearing more robust. The correct fix for a bad
state is usually to make it impossible to construct, not to handle it in one
more place.

**The rule: parse, don't validate.** Convert untrusted, loosely-typed data into
a precise type once, at the boundary. Past that point, the type system carries
the proof and no re-checking is allowed.

## The failure pattern and its inversion

```python
# DEFENSIVE (checks scattered, each caller re-verifies, None leaks everywhere)
def process_order(data: dict) -> dict | None:
    if not isinstance(data, dict):
        return None
    if "items" not in data or not data["items"]:
        return None
    try:
        total = sum(i.get("price", 0) * i.get("qty", 1) for i in data["items"])
    except Exception:
        total = 0  # silently wrong: corrupt data now looks like a free order
    ...
```

```python
# PARSED (one boundary constructs a type that cannot hold the bad states)
from dataclasses import dataclass
from decimal import Decimal

@dataclass(frozen=True, slots=True)
class Line:
    price: Decimal   # not float, not "maybe a string"
    qty: int

    def __post_init__(self) -> None:
        if self.price < 0 or self.qty < 1:
            raise ValueError(f"invalid line: {self.price=} {self.qty=}")

@dataclass(frozen=True, slots=True)
class Order:
    lines: tuple[Line, ...]  # tuple: an Order's lines cannot be mutated or empty

    def __post_init__(self) -> None:
        if not self.lines:
            raise ValueError("order has no lines")

def parse_order(data: object) -> Order: ...   # ALL checking lives here

def process_order(order: Order) -> Receipt: ...  # no checks: Order is proof
```

Everything downstream of `parse_order` is simpler *and* safer: the empty-order
branch, the isinstance checks, and the exception handler don't move — they
cease to exist.

## The three smells, and what to do instead

### 1. `isinstance` sprawl

An `isinstance` check mid-function means the type was lost or never
established. Fixes, in order of preference:

- **Parse earlier** so the function receives the precise type (above).
- **Closed unions + exhaustive match** when a value is legitimately one of N
  shapes:

  ```python
  type Event = Created | Updated | Deleted   # discriminated union

  def apply(event: Event) -> State:
      match event:
          case Created(): ...
          case Updated(): ...
          case Deleted(): ...
      # ty/mypy flag a non-exhaustive match — new variants can't be forgotten
  ```

- **Polymorphism or a dispatch table** when behavior varies by type.

`isinstance` is legitimate in exactly two places: inside a parser at the
boundary, and in `TypeGuard`/narrowing helpers. Anywhere else it is a signal.

### 2. Blind exception swallowing

`except Exception: pass` (or `return None`, or `logging.debug` and carry on)
converts a loud, diagnosable failure into silent corruption discovered much
later. Rules:

- Catch the **narrowest** exception that the operation actually raises, and
  only where you can do something meaningful about it.
- If you cannot recover, **let it propagate**. An unhandled exception with a
  clean traceback is a feature: it is precise, loud, and points at the cause.
- Never catch an exception that your own earlier parsing made impossible. If
  `Order` cannot be empty, `process_order` must not defend against emptiness —
  that handler is dead code that misleads readers about the invariant.
- A fallback value (`or 0`, `.get(k, default)`, `except: return default`) is a
  business decision. Only add one when the spec names it; otherwise it is
  invented behavior that hides bugs.

The mechanical backstops (`BLE001`, `S110`, `S112`, `E722` in ruff) catch the
syntax; this skill covers the intent the linter can't see: a narrow `except
ValueError: return None` can still be swallowing.

### 3. Branch accumulation without looking back

Adding branch N is the moment to re-read branches 1..N-1. If a function has
grown a chain of special cases, the model of the data is wrong — the variation
should live in the data (dispatch table, union variants, strategy) rather than
in control flow. The complexity budget (`C901`, `PLR0912`) fires eventually;
do not wait for it, and never silence it with `# noqa`.

## Before adding ANY defense, answer these

1. **Can this state be made unconstructible instead?** (Frozen dataclass with
   validated `__post_init__`, `NewType`, `Enum`, union of precise shapes,
   non-empty tuple.)
2. **Did the spec ask for this fallback?** If not, don't invent it — failing
   loudly is the specified behavior.
3. **Is this case already impossible** because of parsing that happened
   upstream? Then no code, and the invariant is documented where it's
   established, not re-checked.
4. **Am I fixing the failure or the symptom?** A defense at the crash site for
   data corrupted three calls earlier is a symptom fix.

When reviewing your own diff before commit: count the `try`, `isinstance`, and
`if x is None` you added. For each one, name the state it defends against and
where that state is constructed. If you can't, remove the defense or move the
check to the boundary.
