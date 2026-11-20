"""Crop reference data.

`ranges` = approximate (min, max) per feature. They are APPROXIMATIONS of the value ranges reported for
the public 'Crop Recommendation' dataset (Kaggle, Atharva Ingle) and are used ONLY to generate the
synthetic development dataset when the real CSV is not present. They are not agronomic guidance.
Feature order: N, P, K, temperature (C), humidity (%), ph, rainfall (mm).
"""

FEATURES = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]

def _c(name, ranges, soil, temp, water, season, info):
    return dict(name=name, ranges=ranges, soil=soil, temperature=temp, water=water, season=season, info=info)

CROPS = {
 "rice": _c("Rice", [(60,99),(35,60),(35,45),(20,27),(80,85),(5.0,7.9),(183,298)],
   "Clay or clay-loam that holds water; pH about 5.5-7", "20-30 C", "High - often flooded or very frequently irrigated (about 1000-2000 mm per season)",
   "Kharif / monsoon (also dry-season irrigated)", "Staple cereal. Needs level fields with water control. Nitrogen is split-applied; manage weeds and pests like stem borer."),
 "maize": _c("Maize", [(60,100),(35,60),(15,25),(18,27),(55,75),(5.5,7.0),(60,110)],
   "Well-drained fertile loam; pH 5.8-7", "18-27 C", "Moderate (500-800 mm); sensitive to drought at flowering",
   "Kharif and Rabi in many regions", "Responds strongly to nitrogen. Avoid waterlogging. Watch for fall armyworm."),
 "chickpea": _c("Chickpea", [(20,60),(55,80),(75,85),(17,21),(14,20),(6.0,9.0),(65,95)],
   "Well-drained sandy loam to clay loam; pH 6-9", "17-25 C (cool, dry)", "Low (600-1000 mm total) - dislikes waterlogging",
   "Rabi (winter)", "Legume that fixes nitrogen. Often grown on residual soil moisture. Wilt-resistant varieties help."),
 "kidneybeans": _c("Kidney beans", [(0,40),(55,80),(15,25),(15,25),(18,25),(5.5,6.0),(60,150)],
   "Well-drained loamy soil; slightly acidic pH 5.5-6.5", "15-25 C", "Moderate; avoid waterlogging and drought at flowering",
   "Kharif / cool-season depending on region", "Frost-sensitive legume. Needs support in climbing varieties. Rotate to reduce disease."),
 "pigeonpeas": _c("Pigeon peas", [(0,40),(55,80),(15,25),(18,37),(30,70),(4.5,7.5),(90,200)],
   "Well-drained loam; tolerates a range of pH", "18-35 C", "Low to moderate; drought tolerant once established",
   "Kharif", "Deep-rooted, drought-tolerant legume often intercropped with cereals."),
 "mothbeans": _c("Moth beans", [(0,40),(35,60),(15,25),(24,32),(40,65),(3.5,9.9),(30,75)],
   "Sandy or light soils; very adaptable pH", "24-35 C (heat tolerant)", "Very low - arid and semi-arid crop",
   "Kharif", "Highly drought- and heat-tolerant pulse suited to dry regions."),
 "mungbean": _c("Mung bean", [(0,40),(35,60),(15,25),(27,30),(80,90),(6.2,7.2),(36,60)],
   "Well-drained loam; pH 6.2-7.2", "25-35 C", "Low to moderate (about 400-600 mm)",
   "Kharif and summer", "Short-duration (60-90 days) legume that fits well in rotations."),
 "blackgram": _c("Black gram", [(20,60),(55,80),(15,25),(25,35),(60,70),(6.5,7.8),(60,75)],
   "Loam or clay-loam, well drained; pH 6.5-7.8", "25-35 C", "Moderate (about 600-1000 mm)",
   "Kharif and summer", "Short-duration pulse (urad). Susceptible to yellow mosaic virus - choose resistant varieties."),
 "lentil": _c("Lentil", [(0,40),(55,80),(15,25),(18,30),(60,70),(5.9,7.8),(35,55)],
   "Well-drained loam; pH 6-8", "18-30 C (cool growing season)", "Low (350-500 mm); avoid waterlogging",
   "Rabi (winter)", "Cool-season legume. Sensitive to excess moisture; rotate with cereals."),
 "pomegranate": _c("Pomegranate", [(0,40),(5,30),(35,45),(18,25),(85,95),(5.5,7.2),(102,112)],
   "Well-drained loam or sandy loam; tolerates mild salinity", "15-35 C", "Low to moderate; drip irrigation recommended",
   "Perennial; fruiting 5-7 months after flowering", "Perennial fruit tree. Needs pruning and fruit-borer management."),
 "banana": _c("Banana", [(80,120),(70,95),(45,55),(25,30),(75,85),(5.5,6.5),(90,120)],
   "Deep, rich, well-drained loam; pH 5.5-7", "25-30 C", "High; regular irrigation (about 1200-2200 mm per year)",
   "Year-round (perennial)", "Heavy feeder, especially potassium. Protect from wind. Watch for Panama wilt."),
 "mango": _c("Mango", [(0,40),(15,40),(25,35),(27,36),(45,55),(4.5,7.0),(89,100)],
   "Deep well-drained loam; pH 5.5-7.5", "24-30 C; needs a dry period for flowering", "Moderate; limit irrigation at flowering",
   "Perennial; fruiting in summer", "Long-lived tree. Needs pruning; manage anthracnose and fruit fly."),
 "grapes": _c("Grapes", [(0,40),(120,145),(195,205),(8,42),(80,84),(5.5,6.5),(65,75)],
   "Well-drained sandy loam; pH 5.5-7", "15-35 C", "Moderate; drip irrigation; avoid wet foliage",
   "Perennial; annual pruning cycle", "Needs trellising and careful canopy and pruning management; fungal disease control is key."),
 "watermelon": _c("Watermelon", [(80,120),(5,30),(45,55),(24,27),(80,90),(6.0,7.0),(40,60)],
   "Sandy loam, well drained; pH 6-7", "24-30 C", "Moderate; reduce water near harvest for sweetness",
   "Summer", "Warm-season vine crop. Needs space and pollinators."),
 "muskmelon": _c("Muskmelon", [(80,120),(5,30),(45,55),(27,30),(90,95),(6.0,6.8),(20,30)],
   "Light, well-drained sandy loam; pH 6-6.8", "25-32 C", "Moderate; avoid overhead wetting",
   "Summer", "Sensitive to powdery mildew. Uses drip or furrow irrigation."),
 "apple": _c("Apple", [(0,40),(120,145),(195,205),(21,24),(90,95),(5.5,6.5),(100,125)],
   "Deep well-drained loam; pH 5.5-6.5", "Needs winter chill (<7 C hours) and mild summers", "Moderate; consistent moisture",
   "Perennial; temperate climates", "Needs chilling hours, pollinizers and annual pruning."),
 "orange": _c("Orange", [(0,40),(5,30),(5,15),(10,35),(90,95),(6.0,8.0),(100,120)],
   "Well-drained sandy loam; pH 6-7.5", "13-37 C; frost-sensitive", "Moderate; regular irrigation, avoid waterlogging",
   "Perennial; harvest in cooler months", "Citrus tree. Watch for greening disease and leaf miner."),
 "papaya": _c("Papaya", [(31,70),(46,70),(45,55),(23,44),(90,95),(6.5,7.0),(40,250)],
   "Light, well-drained loam; pH 6-7; very sensitive to waterlogging", "21-33 C", "Moderate-high; drainage essential",
   "Year-round in frost-free areas", "Fast-growing; sensitive to frost and root rot. Virus management is important."),
 "coconut": _c("Coconut", [(0,40),(5,30),(25,35),(25,30),(90,100),(5.5,6.5),(130,230)],
   "Sandy loam to loam, coastal-friendly; pH 5.5-7", "25-32 C", "High; well-distributed rainfall (1500-2500 mm)",
   "Perennial", "Tropical palm for humid coastal regions. Benefits from potassium and chloride."),
 "cotton": _c("Cotton", [(100,140),(35,60),(15,25),(22,26),(75,85),(5.8,8.0),(60,100)],
   "Deep black or alluvial soil; pH 5.8-8", "21-30 C", "Moderate (700-1300 mm)",
   "Kharif", "Fibre crop needing a long warm season. Integrated pest management (bollworm) is essential."),
 "jute": _c("Jute", [(60,100),(35,60),(35,45),(23,27),(70,90),(6.0,7.5),(150,200)],
   "Fertile alluvial loam; pH 6-7.5", "24-37 C", "High; warm humid climate with abundant rain",
   "Kharif", "Natural fibre crop. Harvested before flowering; retting needs clean water."),
 "coffee": _c("Coffee", [(80,120),(15,40),(25,35),(23,28),(50,70),(6.0,7.5),(115,200)],
   "Deep, well-drained loam rich in organic matter; pH 6-6.5", "15-28 C (Arabica cooler)", "Moderate-high; well-distributed rainfall",
   "Perennial; harvest in winter", "Shade-grown at altitude. Needs pruning and berry-borer management."),
}

def slug(name: str) -> str:
    return "".join(ch for ch in name.lower() if ch.isalnum())
