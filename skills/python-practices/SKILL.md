---
name: Python recommended practices
description: Always follow these practices when using Python
---

# Python practices

## Typing

See [typing best practices](https://typing.python.org/en/latest/reference/best_practices.html)

If you must create a new type for exceptions, only create types related to business logic
but re-use existing types otherwise.

If you must create a new type for objects, use `dataclass` and constraint the types
as much as possible.

### Type Aliases

Use `TypeAlias` for type aliases (but not for regular aliases).

Yes:

```py
_IntList: TypeAlias = list[int]
g = os.stat
Path = pathlib.Path
ERROR = errno.EEXIST
```

No:

```py
_IntList = list[int]
g: TypeAlias = os.stat
Path: TypeAlias = pathlib.Path
ERROR: TypeAlias = errno.EEXIST
```

### Ergonomic practices

Using `Any` and `object`,

Generally, use `Any` when a type cannot be expressed appropriately with the current type
system or using the correct type is unergonomic.

If a function accepts every possible object as an argument, for example because it's only
passed to `str()`, use `object` instead of `Any` as type annotation:

```py
def print_formatted(o: object) -> None:
    if isinstance(o, int):
        o = f"{o:02}"
    print(o)
```

Similarly, if the return value of a callback is ignored, annotate it with `object`, not
`Any` or `None`:

```py
def call_cb(cb: Callable[[int], object]) -> None:
cb(42)
```

### Arguments and Return Types

For arguments, prefer protocols and abstract types (`Mapping`, `Sequence`, `Iterable`,
etc.). If an argument accepts literally any value, use `object` instead of `Any`.

For return values, prefer concrete types (`list`, `dict`, etc.) for concrete
implementations. The return values of protocols and abstract base classes must be judged
on a case-by-case basis.

Yes:

```py
def map_it(input: Iterable[str]) -> list[int]: ...
def create_map() -> dict[str, int]: ...
def to_string(o: object) -> str: ... # accepts any object
```

No:

```py
def map_it(input: list[str]) -> list[int]: ...
def create_map() -> MutableMapping[str, int]: ...
def to_string(o: Any) -> str: ...
```

Maybe:

```py
class MyProto(Protocol):
def foo(self) -> list[int]: ...
def bar(self) -> Mapping[str, str]: ...
```

Avoid union return types, since they require `isinstance()` checks.
Use `Any` or `X | Any` if necessary.

### Style

Where possible, use shorthand syntax for unions instead of `Union` or `Optional`. `None`
should be the last element of an union.

Yes:

```py
def foo(x: str | int) -> None: ...
def bar(x: str | None) -> int | None: ...
```

No:

```py
def foo(x: Union[str, int]) -> None: ...
def bar(x: Optional[str]) -> Optional[int]: ...
def baz(x: None | str) -> None: ...
```

Types:

Use `float` instead of `int | float`. Use `None` instead of `Literal[None]`.

Built-in Generics

Yes:

```py
from collections.abc import Iterable

def foo(x: type[MyClass]) -> list[str]: ...
def bar(x: Iterable[str]) -> None: ...
```

No:

```py
from typing import Iterable, List, Type

def foo(x: Type[MyClass]) -> List[str]: ...
def bar(x: Iterable[str]) -> None: ...
```

## Parse don't validate

Prefer parsing over validation. Ensure business logic only accepts correct objects
and provide parsing capabilities from outer types to inner types. There should be
no validation inside core logic, do parsing at the boundaries.

Yes:

```py
@dataclass(frozen=True, kwargs=True)
class User:
    name: str
    age: int

    def __post_init__(self) -> None:
        if not self.name:
            msg = "Name cannot be an empty string."
            raise ValueError(msg)
        if age < 0:
            msg = f"Age cannot be negative, got: {self.age}"
            raise ValueError(msg)

def inner_logic(user: User): ...
```

No:

```py
def inner_logic(user: User):
    if not user.name:
        msg = "Name cannot be an empty string."
        raise ValueError(msg)
    if user.age < 0:
        msg = f"Age cannot be negative, got: {user.age}"
        raise ValueError(msg)
```

## Functional Core Imperative Shell

Default to immutable datastructures and functional programming when implementing core
business logic. Move effects such as I/O, network calls, DB calls, file modifications,
etc. At the boundaries of the system.

Yes:

```py
class Country(enum.StrEnum):
    FR = enum.auto()
    BE = enum.auto()

class Currency(enum.StrEnum):
    EUR = enum.auto()
    USD = enum.auto()

@dataclass(frozen=True, kwargs=True)
class InventoryQuery(QueryData):
    name: str
    price: int
    origin: Country
    currency: Currency

    def __post_init__(self) -> None:
        if not self.name:
            msg = "Name cannot be an empty string."
            raise ValueError(msg)
        if price < 0:
            msg = f"Price cannot be negative, got: {self.price}"
            raise ValueError(msg)

# Functional Core + Parse don't validate
def build_inventory_query(data: Data):
    return InventoryQuery(
        name=data.name,
        price=data.price,
        origin=data.country.lower(),
        currency=data.currency.lower()
        )

def make_select_query(table: DBTable, query: QueryData):
    return SQLQuery(table=table,**query)

# Imperative shell
def call_db(db: DBConnection, query: SQLQuery):
    return db.execute(query)
```

No:

```py
# Do not make raw call to the DB
def call_db(db: DBConnection, query: str):
    return db.execute(query)
```

## Testing

- Unit tests should be atomic and not implement any logic.
- Unit tests should test interfaces, not implementation details.
- Unit tests should be fast with mocking as a last resort for testing external systems.
- Integration tests should test starting state and end state, not interaction.
- Integration tests should always improve understanding of the system.
- Integration tests should always confirm the reliability of the system.
- Integration tests should never touch production systems, use containers or dev
  environments.

## Logging

- Use structured logging with a well-defined schema for the logs.
- Use wide events and collect relevant data to help understanding the system.
- Use sampling to collect always collect rare events and only sample frequent events.
- Always log before and after effectful operations.
- Do not log trivial messages or user facing messages.

## Security

- Never trust user input, always sanitize.
- Never commit `.env` files.
- Remove critical information like passwords and credentials from the string
  representation of objects.
- Always constraint access control as much as possible.
- Always separate configuration per environment, do not use all encompassing settings.
- Always use the most up to date libraries for cryptography related code.
- Write defensive code when used at untrusted boundaries (network, external systems,
  etc).
