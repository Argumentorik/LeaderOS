"""Enterprise B2B pricing logic — pure function, no DB/network."""

# Volume discount tiers — must stay in sync with frontend ENTERPRISE_TIERS
_TIERS = [(200, 0.50), (100, 0.40), (50, 0.30), (20, 0.20), (10, 0.15), (5, 0.10), (1, 0.0)]
_SEAT_PRICE = 997.0


def calc_enterprise_discount(employees: int) -> dict:
    """Return per-seat & total pricing for `employees` Leadership OS seats.

    Tiers: 5 MA→10%, 10→15%, 20→20%, 50→30%, 100→40%, 200+→50%.
    """
    if employees < 1:
        raise ValueError("employees muss >= 1 sein")
    discount = 0.0
    for threshold, pct in _TIERS:
        if employees >= threshold:
            discount = pct
            break
    per_seat = round(_SEAT_PRICE * (1 - discount), 2)
    total = round(per_seat * employees, 2)
    return {
        "seats": employees,
        "discount_pct": int(discount * 100),
        "per_seat": per_seat,
        "total": total,
        "seat_price_full": _SEAT_PRICE,
    }
