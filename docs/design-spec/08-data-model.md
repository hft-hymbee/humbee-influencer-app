# 08 — Data model and business rules

## Entities
```
Influencer  id, name, mobile, district, trade, status
Manufacturer id, name, shortName, mono, baseUnit, uoms[], subIndustryId
Industry     id, code, name, imageUrl
SubIndustry  id, industryId, label, imageUrl
SKU          id, manufacturerId, label, pointsMultiplier, premium
SkuCategory  id, subIndustryId, label      ← used when no manufacturer is onboarded
VCP          id, name, type (Distributor|Dealer), place, district
Demand       id, influencerId, subIndustryId, manufacturerId?, skuId?, skuCategoryId?,
             quantityValue, quantityUom, status, expectedPoints, createdAt
Allocation   id, demandId?, influencerId, manufacturerId, vcpId,
             quantityValue, quantityUom, normalisedValue, points, allocatedOn
Gift         id, influencerId, manufacturerId, vcpId, gift, kind,
             status, mark, releasedOn
UtsavInvite  id, influencerId, city, venue, date, invitedCount
PointsLedger id, influencerId, manufacturerId, allocationId, points, postedAt
```

## Relationships
- An Influencer belongs to exactly one **district**; district decides which Manufacturers and VCPs they can see.
- A SubIndustry has **zero or more** Manufacturers *in a given district*. Zero triggers the SKU-category path.
- A Demand may exist without a Manufacturer (routed by HUMBEE).
- An Allocation always has a Manufacturer and a VCP, and posts one PointsLedger entry.
- Leaderboard rank is derived from PointsLedger, scoped by manufacturer **and** district.

## Reference data in the current build
### Manufacturers
| id | Name | Sub-industry | UOMs | Base unit | Mono |
| --- | --- | --- | --- | --- | --- |
| welspun | Welspun TMT | TMT | Ton, Kg | Ton | WT |
| dalmia | Dalmia Cement | Cement | Bags, Ton | Bags | DC |
| dp | DP Paints | Paints (`painthw`) | Buckets, Litre | Buckets | DP |
| masterchow | Masterchow | Food | Cases, Units | Cases | MC |

### Industries and sub-industries
| Industry | Sub-industries | Path |
| --- | --- | --- |
| BCM | TMT | Manufacturer (Welspun TMT) |
| BCM | ERW Pipes | SKU category — no manufacturer |
| BCM | Steel Angles | SKU category — no manufacturer |
| BCM | Paints | Manufacturer (DP Paints) |
| BCM | Cement | Manufacturer (Dalmia Cement) |
| FMCG | Food | Manufacturer (Masterchow) |

### SKU catalogue
| Manufacturer | SKUs |
| --- | --- |
| Welspun TMT | Fe 500D 8mm · Fe 500D 10mm · Fe 500D 12mm · Fe 550D 16mm · Fe 550D 20mm |
| Dalmia Cement | OPC 53 Grade 50kg · PPC 50kg · PSC 50kg |
| DP Paints | Interior Emulsion 20L · Exterior Emulsion 10L · Wall Primer 20L |
| Masterchow | Hakka Noodles 400g · Schezwan Sauce 220g · Pad Thai Meal Kit |

### SKU categories (no-manufacturer path)
| Sub-industry | Categories | UOMs |
| --- | --- | --- |
| Steel Angles | MS Angle 25x25x3 · MS Angle 40x40x5 · MS Angle 50x50x6 · MS Flat 50x6 | Kg, Nos |
| ERW Pipes | ERW Pipe 25mm · ERW Pipe 40mm · ERW Square Tube 50mm · ERW Pipe 75mm | Kg, Nos |

## Points rules (illustrative — server owns the real table)
| Manufacturer | Base | Premium tiers |
| --- | --- | --- |
| Welspun TMT | 1 Kg = 1 point | Fe 550D CRS 2 pts/Kg · Corrosion Resistant Plus 3 pts/Kg |
| Dalmia Cement | 1 Bag = 1 point | DSP Cement 2 pts/bag · Rain Protector 3 pts/bag |
| DP Paints | 1 Litre = 1 point | Wall Protection 3 pts/L · Premium Paint 3 pts/L |
| Masterchow | 1 Case = 1 point | Meal kits 2 pts/case |

**Rule: points post only when a VCP allocates**, never on demand submission. The Demand screen may show an expected value, always labelled as expectation ("900 pts expected", "240 pts on allocation").

## Statuses
```
Demand:  Submitted → Confirmed → Allocated → Closed
Gift:    Announced → In Shop  → Gifted    → Redeemed
```
Both are strictly ordered; the UI never lets the influencer change a status.

## Formatting rules
- Numbers: `Intl.NumberFormat('en-IN')` — `21,400`, `1,404`, `15.21 Lakh`.
- Quantities: one decimal for Ton (`8.4 Ton`), zero for Bags/Buckets/Cases/Kg/Litre/Units.
- Dates in UI: `12 Aug 2026` (day, short month, year). API carries ISO.
- Currency, if it ever appears: `₹4,52,000`.
- Points strings always carry a sign or a qualifier: `+4,000 pts`, `900 pts expected`.

## Fixtures
`data/` holds one JSON per endpoint shape:
```
manufacturers.json     industries.json
leaderboard.json       (keyed by manufacturer id)
allocations.json       (keyed by manufacturer id)
rewards.json           (keyed by manufacturer id)
demands.json           home.json           profile.json
```
The values match the prototype exactly, so a screen built on fixtures looks identical to the design.
