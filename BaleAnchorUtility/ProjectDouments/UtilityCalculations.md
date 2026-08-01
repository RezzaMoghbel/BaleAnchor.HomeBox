Below are the agreed equations for the application.

## Variables

```text
CW = Cold-water usage in m³
HW = Hot-water usage in m³
AE = Apartment electricity usage in kWh
BE = Boiler electricity usage in kWh
D  = Number of days in the calculation period

WR = Water unit rate per m³
WS = Water standing charge per day
WV = Water VAT rate as a decimal

ER = Electricity unit rate per kWh
ES = Electricity standing charge per day
EV = Electricity VAT rate as a decimal
```

Examples of VAT values:

```text
0% VAT = 0.00
5% VAT = 0.05
```

The VAT factor is:

```text
VAT factor = 1 + VAT rate
```

Therefore:

```text
0% VAT factor = 1.00
5% VAT factor = 1.05
```

---

# 1. Cold-water calculation

## Cold-water usage

```text
Cold-water usage
= Cold-water end reading − Cold-water start reading
```

```text
CW = CW End − CW Start
```

## Cold-water usage cost

```text
Cold-water usage cost
= Cold-water usage × Water unit rate
```

```text
Cold-water usage cost = CW × WR
```

## Water standing charge

The water standing charge is applied **once**, through the Cold Water calculation.

```text
Water standing total
= Number of days × Water standing charge per day
```

```text
Water standing total = D × WS
```

## Cold-water subtotal

```text
Cold-water subtotal before VAT
= Cold-water usage cost + Water standing total
```

```text
Cold-water subtotal = (CW × WR) + (D × WS)
```

## Cold-water VAT

```text
Cold-water VAT
= Cold-water subtotal × Water VAT rate
```

```text
Cold-water VAT = Cold-water subtotal × WV
```

## Cold-water total

```text
Cold-water total
= Cold-water subtotal + Cold-water VAT
```

Combined equation:

```text
Cold-water total
= ((CW × WR) + (D × WS)) × (1 + WV)
```

---

# 2. Hot-water volume calculation

This calculates the **water-volume cost** of the hot water. It does not include the electricity required to heat the water.

## Hot-water usage

```text
Hot-water usage
= Hot-water end reading − Hot-water start reading
```

```text
HW = HW End − HW Start
```

## Hot-water usage cost

```text
Hot-water usage cost
= Hot-water usage × Water unit rate
```

```text
Hot-water usage cost = HW × WR
```

## Hot-water standing charge

There is no separate standing charge for Hot Water because the water standing charge is already included in Cold Water.

```text
Hot-water standing charge = £0.00
```

## Hot-water subtotal

```text
Hot-water subtotal before VAT
= Hot-water usage × Water unit rate
```

```text
Hot-water subtotal = HW × WR
```

## Hot-water VAT

```text
Hot-water VAT
= Hot-water subtotal × Water VAT rate
```

```text
Hot-water VAT = Hot-water subtotal × WV
```

## Hot-water total

```text
Hot-water volume total
= (HW × WR) × (1 + WV)
```

---

# 3. Total Water calculation

Total Water combines:

- Cold-water volume and cost.
- Hot-water volume and cost.
- One water standing charge.

## Total Water usage

```text
Total Water usage
= Cold-water usage + Hot-water usage
```

```text
Total Water usage = CW + HW
```

## Total Water cost

```text
Total Water cost
= Cold-water total + Hot-water volume total
```

Combined equation:

```text
Total Water cost
=
(
    (CW × WR)
    + (HW × WR)
    + (D × WS)
)
× (1 + WV)
```

This can also be simplified to:

```text
Total Water cost
=
(
    ((CW + HW) × WR)
    + (D × WS)
)
× (1 + WV)
```

This works where Cold Water and Hot Water use the same water tariff and VAT for that period.

---

# 4. Apartment Electricity calculation

## Apartment electricity usage

```text
Apartment electricity usage
= Electricity end reading − Electricity start reading
```

```text
AE = Electricity End − Electricity Start
```

## Apartment electricity usage cost

```text
Apartment electricity usage cost
= Apartment electricity usage × Electricity unit rate
```

```text
Apartment usage cost = AE × ER
```

## Electricity standing charge

The electricity standing charge is applied **once**, through Apartment Electricity.

```text
Electricity standing total
= Number of days × Electricity standing charge per day
```

```text
Electricity standing total = D × ES
```

## Apartment electricity subtotal

```text
Apartment electricity subtotal before VAT
= Apartment usage cost + Electricity standing total
```

```text
Apartment electricity subtotal
= (AE × ER) + (D × ES)
```

## Apartment electricity VAT

```text
Apartment electricity VAT
= Apartment electricity subtotal × Electricity VAT rate
```

```text
Apartment electricity VAT
= Apartment electricity subtotal × EV
```

## Apartment electricity total

```text
Apartment electricity total
=
((AE × ER) + (D × ES)) × (1 + EV)
```

---

# 5. Boiler Electricity calculation

Boiler Electricity is calculated from the amount of hot water consumed.

## Boiler electricity usage in kWh

```text
Boiler kWh
=
Hot-water usage in m³
× Temperature increase in °C
× Water heat capacity
× Water density
÷ kJ-to-kWh conversion factor
```

Using the agreed values:

```text
Boiler kWh
=
HW
× ΔT
× 4.186
× 1,000
÷ 3,600
```

Where:

```text
HW     = Hot-water volume used in m³
ΔT     = Temperature increase in °C
4.186  = Specific heat capacity of water in kJ/kg°C
1,000  = Approximate water density in kg/m³
3,600  = Number of kilojoules in one kWh
```

Temperature increase should be:

```text
ΔT
= Hot-water target temperature − Cold-water inlet temperature
```

For example:

```text
Hot-water target temperature: 55°C
Cold-water inlet temperature: 10°C

ΔT = 55 − 10
ΔT = 45°C
```

Therefore:

```text
BE = HW × ΔT × 4.186 × 1,000 ÷ 3,600
```

## Boiler electricity usage cost

```text
Boiler electricity usage cost
= Boiler kWh × Electricity unit rate
```

```text
Boiler usage cost = BE × ER
```

## Boiler standing charge

There is no separate boiler standing charge because the electricity standing charge is already applied to Apartment Electricity.

```text
Boiler standing charge = £0.00
```

## Boiler VAT

```text
Boiler VAT
= Boiler usage cost × Electricity VAT rate
```

```text
Boiler VAT = (BE × ER) × EV
```

## Boiler electricity total

```text
Boiler electricity total
= (BE × ER) × (1 + EV)
```

Full combined equation:

```text
Boiler electricity total
=
(
    (
        HW
        × ΔT
        × 4.186
        × 1,000
        ÷ 3,600
    )
    × ER
)
× (1 + EV)
```

---

# 6. Total Electricity calculation

## Total Electricity usage

```text
Total Electricity usage
= Apartment electricity usage + Boiler electricity usage
```

```text
Total Electricity usage = AE + BE
```

## Total Electricity cost

```text
Total Electricity cost
= Apartment electricity total + Boiler electricity total
```

Combined equation:

```text
Total Electricity cost
=
(
    (AE × ER)
    + (BE × ER)
    + (D × ES)
)
× (1 + EV)
```

This can be simplified to:

```text
Total Electricity cost
=
(
    ((AE + BE) × ER)
    + (D × ES)
)
× (1 + EV)
```

This simplified version applies where Apartment Electricity and Boiler Electricity use the same electricity tariff and VAT.

---

# 7. Overall utility total

```text
Overall utility total
= Total Water cost + Total Electricity cost
```

```text
Overall Total
=
Cold-water total
+ Hot-water volume total
+ Apartment electricity total
+ Boiler electricity total
```

---

# 8. When rates change during a period

Where there are multiple tariffs, calculate each tariff segment separately and add them together.

For example:

```text
Cold-water total
=
Sum of all cold-water tariff-segment totals
```

Mathematically:

```text
Cold-water total
=
Σ [
    ((Cold usage for segment × Water rate for segment)
    + (Segment days × Water standing rate for segment))
    × Water VAT factor for segment
]
```

For Hot Water:

```text
Hot-water total
=
Σ [
    Hot-water usage for segment
    × Water rate for segment
    × Water VAT factor for segment
]
```

For Apartment Electricity:

```text
Apartment electricity total
=
Σ [
    ((Apartment kWh for segment × Electricity rate for segment)
    + (Segment days × Electricity standing rate for segment))
    × Electricity VAT factor for segment
]
```

For Boiler Electricity:

```text
Boiler electricity total
=
Σ [
    Boiler kWh for segment
    × Electricity rate for segment
    × Electricity VAT factor for segment
]
```

Where no meter reading exists on the tariff-change date, the segment consumption is allocated proportionally by days and labelled as an estimate.
