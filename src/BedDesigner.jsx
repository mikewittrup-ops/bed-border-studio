import React, { useMemo, useState, useEffect } from "react";
import {
  Sun, CloudSun, Cloudy, Droplets, Ruler, RefreshCw, Wallet,
  Flower2, Sprout, Trees, Leaf, MapPin, Palette, Layers, ChevronDown, ChevronUp
} from "lucide-react";

/* =========================================================================
   PLANT DATABASE
   h = mature height (in), w = mature spread (in), z = [zoneMin, zoneMax]
   form = how it's drawn. cost = rough per-plant nursery price (USD).
   ========================================================================= */
/* =========================================================================
   CULTIVAR EXPANSION TRACKER  (design-distinct popular cultivars, ~2-5/genus)

   >>> MANDATORY when adding ANY genus or cultivar - tag EVERY attribute: <<<
     1. core:  id, name, latin, type, h, w, sun[], water, z[min,max], form, cost
     2. colour: bloom[seasons], bloomColor, foliage (+ fallFoliage if it colours).
        Choose bloomColor so colorFamily() lands ON-PALETTE for the aesthetics it
        should join (tan/grass plumes read "pink" and clash with warm palettes
        unless warmed - see the fountain-grass fix).
     3. foliage-tone tag if applicable: silverleaf / darkleaf / goldleaf.
     4. habit tags: structure / vertical / airy / emergent / texture / edging /
        shade / pollinator / native - match the genus's existing base entry.
     5. SPREAD: add id to SELF_SEED if it self-sows OR runs (root/stolon/rhizome);
        omit only for a clump or a documented-sterile cultivar.
     6. INVASIVE: handled BY STATE in STATE_INVASIVE (keyed by latin). If the
        species is state-listed, add it there; sterile, non-spreading cultivars go
        in STERILE_EXEMPT instead so they stay available.
     7. AESTHETICS: add the id to every AESTHETICS .heroes list it belongs to.
     8. PAIRINGS: add curated combos where they apply.
     9. GLYPH: set optional inflor:"raceme|spike|corymb|umbel|cyme|panicle|head|
        bottle|candelabra|solitary" and (shrubs) silhouette:"rounded|columnar|
        vase|spreading|pyramidal", and basal:0..1 (foliage height fraction; low for
        rosette/scape plants, high for leafy-stemmed). Omit to keep defaults. See glyph-taxonomy.md.
   When a NEW attribute is added later, BACK-FILL it across ALL existing entries.

   Done - Batch 1: Hemerocallis, Hosta, Heuchera, Echinacea, Hydrangea, Iris,
     Baptisia, Salvia, Sedum/Hylotelephium, Nepeta, Coreopsis, Astilbe.
   Phlox fertility: SELF-SEED = fertile paniculata; sterile 'David' + 'Fashionably
     Early' hybrids NOT flagged. Deep-dive: paniculata colour range + divaricata,
     stolonifera, maculata, subulata.
   Done - Batch 2: Monarda, Geranium, Lavandula, Rudbeckia, Phlox, Aster, Achillea,
     Penstemon, Paeonia, Panicum, Tulipa, Allium.
   Done - Batch 3: Helleborus, Helenium, Agastache, Veronica, Dianthus,
     Calamagrostis, Amsonia, Liatris, Eutrochium, + NEW Miscanthus, Hibiscus.
   Done - Fountain grass (Pennisetum): alopecuroides (Hameln/Red Head/Little Bunny),
     orientale (Karley Rose), setaceum (Rubrum/Fireworks - sterile, STERILE_EXEMPT).
   Done - Grasses: Schizachyrium cultivars, Andropogon, Bouteloua, Eragrostis,
     Chasmanthium, Sesleria, Helictotrichon, Festuca, Carex (penn/palm), Panicum
     (Cheyenne Sky), Sporobolus (Tara).
   Done - Batch 4 (airy/structural New-Perennial): Astrantia (NEW genus), Sanguisorba
     (incl. 'Blackthorn'), Thalictrum, Veronicastrum, Knautia (NEW genus).
   Next candidates: shade cultivars (Brunnera, Pulmonaria, Tiarella, Epimedium),
     hot accents (Kniphofia, Crocosmia), Eryngium, umbellifers.
   ========================================================================= */
const PLANTS = [
  // ---- Shrubs / structure ----
  { id:"annabelle", name:"Smooth Hydrangea 'Annabelle'", latin:"Hydrangea arborescens", type:"shrub", h:48, w:60, sun:["full","part"], water:"med", z:[3,9], bloom:["summer","fall"], bloomColor:"#eef2ea", foliage:"#4f7a43", form:"shrub", cost:28, avail:1, tags:["structure"] },
  { id:"boxwood", name:"Boxwood", latin:"Buxus sempervirens", type:"shrub", h:36, w:36, sun:["full","part","shade"], water:"med", z:[5,9], bloom:[], bloomColor:"#cdd9b8", foliage:"#37632f", form:"shrub", cost:32, avail:1, tags:["evergreen","structure","formal"] },
  { id:"limelight", name:"Panicle Hydrangea 'Limelight'", latin:"Hydrangea paniculata", type:"shrub", h:72, w:60, sun:["full","part"], water:"med", z:[3,8], bloom:["summer","fall"], bloomColor:"#e7eed5", foliage:"#4d7741", fallFoliage:"#b8893f", form:"shrub", cost:34, avail:1, tags:["structure"] },
  { id:"spirea", name:"Spirea 'Goldflame'", latin:"Spiraea japonica", type:"shrub", h:30, w:36, sun:["full"], water:"med", z:[4,9], bloom:["spring","summer"], bloomColor:"#e57aa0", foliage:"#7fa24a", fallFoliage:"#d98a3c", form:"mound", cost:22, avail:1, tags:["fallcolor","goldleaf"] },
  { id:"fothergilla", name:"Dwarf Fothergilla", latin:"Fothergilla gardenii", type:"shrub", h:36, w:36, sun:["full","part"], water:"med", z:[4,8], bloom:["spring"], bloomColor:"#f6f8f4", foliage:"#5b8048", fallFoliage:"#e0892f", form:"shrub", cost:30, avail:1, tags:["native","fallcolor"] },
  { id:"weigela", name:"Weigela 'Wine & Roses'", latin:"Weigela florida", type:"shrub", h:48, w:48, sun:["full","part"], water:"med", z:[4,8], bloom:["spring","summer"], bloomColor:"#d65a86", foliage:"#5a4a55", form:"shrub", cost:26, avail:1, tags:["darkleaf"] },
  { id:"ninebark",silhouette:"vase", name:"Ninebark 'Diabolo'", latin:"Physocarpus opulifolius", type:"shrub", h:72, w:60, sun:["full","part"], water:"med", z:[3,7], bloom:["spring"], bloomColor:"#f3e9ec", foliage:"#6e4750", form:"shrub", cost:28, avail:1, tags:["structure","darkleaf"] },
  { id:"baptisia", name:"False Indigo", latin:"Baptisia australis", type:"perennial", h:42, w:42, sun:["full","part"], water:"low", z:[3,9], bloom:["spring"], bloomColor:"#4f63b0", foliage:"#6f8f5e", form:"shrub", cost:18, avail:1, tags:["native","structure"] },

  // ---- Perennials ----
  { id:"echinacea", name:"Purple Coneflower", latin:"Echinacea purpurea", type:"perennial", h:36, w:18, sun:["full"], water:"low", z:[3,9], bloom:["summer","fall"], bloomColor:"#b5547e", foliage:"#4d7038", form:"daisy", cost:12, avail:1, tags:["pollinator","native"] },
  { id:"rudbeckia", name:"Black-eyed Susan", latin:"Rudbeckia fulgida", type:"perennial", h:28, w:18, sun:["full","part"], water:"med", z:[3,9], bloom:["summer","fall"], bloomColor:"#f2b733", foliage:"#46682f", form:"daisy", cost:11, avail:1, tags:["pollinator","native"] },
  { id:"nepeta", name:"Catmint 'Walker's Low'", latin:"Nepeta x faassenii", type:"perennial", h:18, w:24, sun:["full"], water:"low", z:[3,8], bloom:["spring","summer","fall"], bloomColor:"#8d8bd6", foliage:"#7e8f66", form:"mound", cost:12, avail:1, tags:["pollinator"] },
  { id:"salvia", name:"Salvia 'Caradonna'", latin:"Salvia nemorosa", type:"perennial", h:24, w:18, sun:["full"], water:"low", z:[4,8], bloom:["spring","summer"], bloomColor:"#6a59b0", foliage:"#51713f", form:"spike", cost:12, avail:1, tags:["pollinator"] },
  { id:"sedum",basal:0.55, name:"Sedum 'Autumn Joy'", latin:"Hylotelephium", type:"perennial", h:24, w:24, sun:["full"], water:"low", z:[3,9], bloom:["fall"], bloomColor:"#c76b6b", foliage:"#7fa074", form:"clump", cost:13, avail:1, tags:["fall"] },
  { id:"hosta", name:"Hosta 'Frances Williams'", latin:"Hosta", type:"perennial", h:22, w:36, sun:["part","shade"], water:"med", z:[3,8], bloom:["summer"], bloomColor:"#d9c7e8", foliage:"#5f8a4e", form:"mound", cost:16, avail:1, tags:["foliage","shade"] },
  { id:"heuchera", name:"Coral Bells 'Palace Purple'", latin:"Heuchera", type:"perennial", h:14, w:16, sun:["part","shade","full"], water:"med", z:[4,9], bloom:["spring","summer"], bloomColor:"#f2dede", foliage:"#6b4a4f", form:"mound", cost:14, avail:1, tags:["foliage","darkleaf"] },
  { id:"perovskia", name:"Russian Sage", latin:"Salvia yangii", type:"perennial", h:36, w:36, sun:["full"], water:"low", z:[4,9], bloom:["summer","fall"], bloomColor:"#9aa6da", foliage:"#97a78f", form:"spike", cost:15, avail:1, tags:["pollinator","silverleaf","airy"] },
  { id:"shasta", name:"Shasta Daisy 'Becky'", latin:"Leucanthemum x superbum", type:"perennial", h:30, w:24, sun:["full"], water:"med", z:[5,9], bloom:["summer"], bloomColor:"#fbfdf8", foliage:"#4a6c34", form:"daisy", cost:11, avail:1, tags:[] },
  { id:"daylily", name:"Daylily 'Stella d'Oro'", latin:"Hemerocallis", type:"perennial", h:18, w:20, sun:["full","part"], water:"med", z:[3,9], bloom:["summer","fall"], bloomColor:"#f0a92e", foliage:"#4f7a3e", form:"clump", cost:12, avail:1, tags:[] },
  { id:"astilbe",inflor:"panicle", name:"Astilbe 'Fanal'", latin:"Astilbe", type:"perennial", h:24, w:20, sun:["part","shade"], water:"high", z:[3,8], bloom:["summer"], bloomColor:"#c0405a", foliage:"#3f6535", form:"spike", cost:14, avail:1, tags:["shade","moist"] },
  { id:"lavender", name:"Lavender 'Hidcote'", latin:"Lavandula angustifolia", type:"perennial", h:22, w:24, sun:["full"], water:"low", z:[5,9], bloom:["summer"], bloomColor:"#7b6ab0", foliage:"#98a98c", form:"spike", cost:13, avail:1, tags:["pollinator","fragrant","silverleaf"] },
  { id:"coreopsis", name:"Coreopsis 'Moonbeam'", latin:"Coreopsis verticillata", type:"perennial", h:18, w:18, sun:["full"], water:"low", z:[4,9], bloom:["summer","fall"], bloomColor:"#f4e06a", foliage:"#5a7a45", form:"mound", cost:11, avail:1, tags:["pollinator"] },
  { id:"monarda",basal:0.58, name:"Bee Balm 'Jacob Cline'", latin:"Monarda", type:"perennial", h:40, w:24, sun:["full","part"], water:"med", z:[4,9], bloom:["summer"], bloomColor:"#c33b3b", foliage:"#4a6e34", form:"clump", cost:13, avail:1, tags:["pollinator","native"] },
  { id:"phlox",basal:0.6, name:"Garden Phlox 'David'", latin:"Phlox paniculata", type:"perennial", h:36, w:24, sun:["full","part"], water:"med", z:[4,8], bloom:["summer","fall"], bloomColor:"#f6f4f7", foliage:"#46682f", form:"clump", cost:13, avail:1, tags:["fragrant"] },
  { id:"aster", name:"New England Aster 'Purple Dome'", latin:"Symphyotrichum", type:"perennial", h:24, w:24, sun:["full","part"], water:"med", z:[3,8], bloom:["fall"], bloomColor:"#8a5fae", foliage:"#4a6e34", form:"daisy", cost:13, avail:1, tags:["pollinator","native","fall"] },
  { id:"mum", name:"Garden Mum", latin:"Chrysanthemum", type:"perennial", h:20, w:22, sun:["full"], water:"med", z:[5,9], bloom:["fall"], bloomColor:"#c4663f", foliage:"#4f7a3e", form:"mound", cost:9, avail:1, tags:["fall"] },
  { id:"goldenrod", name:"Goldenrod 'Fireworks'", latin:"Solidago rugosa", type:"perennial", h:36, w:24, sun:["full","part"], water:"low", z:[4,9], bloom:["fall"], bloomColor:"#e0b53a", foliage:"#4f7a3e", form:"spike", cost:13, avail:1, tags:["pollinator","native","fall"] },

  // ---- Ornamental grasses ----
  { id:"calamagrostis", name:"Feather Reed Grass 'Karl Foerster'", latin:"Calamagrostis x acutiflora", type:"grass", h:48, w:24, sun:["full","part"], water:"med", z:[4,9], bloom:["summer","fall"], bloomColor:"#d9c79a", foliage:"#6f8a4e", fallFoliage:"#c9b06a", form:"grass", cost:15, avail:1, tags:["structure","vertical"] },
  { id:"littlebluestem", name:"Little Bluestem", latin:"Schizachyrium scoparium", type:"grass", h:36, w:18, sun:["full"], water:"low", z:[3,9], bloom:["fall"], bloomColor:"#cf9d6a", foliage:"#7d9a86", fallFoliage:"#c47a45", form:"grass", cost:13, avail:1, tags:["native"] },
  { id:"pennisetum", name:"Fountain Grass 'Hameln'", latin:"Pennisetum alopecuroides", type:"grass", h:30, w:30, sun:["full"], water:"low", z:[5,9], bloom:["summer","fall"], bloomColor:"#d6b46e", foliage:"#6f8a4e", fallFoliage:"#cdaa72", form:"grass", cost:14, avail:1, tags:["texture"] },

  // ---- Groundcovers / edgers ----
  { id:"creepingphlox", name:"Creeping Phlox", latin:"Phlox subulata", type:"groundcover", h:6, w:18, sun:["full","part"], water:"low", z:[3,9], bloom:["spring"], bloomColor:"#d36fa6", foliage:"#4f7040", form:"mat", cost:9, avail:1, tags:["edging"] },
  { id:"thyme", name:"Creeping Thyme", latin:"Thymus serpyllum", type:"groundcover", h:4, w:14, sun:["full"], water:"low", z:[4,9], bloom:["spring","summer"], bloomColor:"#b06fb0", foliage:"#6f8a5a", form:"mat", cost:8, avail:1, tags:["edging","fragrant"] },
  { id:"ajuga", name:"Bugleweed", latin:"Ajuga reptans", type:"groundcover", h:6, w:14, sun:["part","shade"], water:"med", z:[3,9], bloom:["spring"], bloomColor:"#5b62b0", foliage:"#5a4a55", form:"mat", cost:8, avail:1, tags:["shade","edging","darkleaf"] },
  { id:"lamium", name:"Spotted Deadnettle", latin:"Lamium maculatum", type:"groundcover", h:8, w:18, sun:["part","shade"], water:"med", z:[3,8], bloom:["spring","summer"], bloomColor:"#d98ab8", foliage:"#8fa890", form:"mat", cost:9, avail:1, tags:["shade"] },
  { id:"woodruff", name:"Sweet Woodruff", latin:"Galium odoratum", type:"groundcover", h:8, w:18, sun:["shade","part"], water:"med", z:[4,8], bloom:["spring"], bloomColor:"#f4f7f2", foliage:"#5f8a4e", form:"mat", cost:8, avail:1, tags:["shade"] },

  // ---- Bulbs / accents ----
  { id:"allium", name:"Ornamental Onion 'Purple Sensation'", latin:"Allium", type:"bulb", h:30, w:8, sun:["full","part"], water:"low", z:[4,9], bloom:["spring","summer"], bloomColor:"#8b5fb0", foliage:"#5a7a45", form:"globe", cost:6, avail:1, tags:["bulb","emergent"] },
  { id:"tulip", name:"Tulip (mixed)", latin:"Tulipa", type:"bulb", h:16, w:6, sun:["full","part"], water:"med", z:[3,8], bloom:["spring"], bloomColor:"#d8533f", foliage:"#6f8a4e", form:"bulbflower", cost:3, avail:1, tags:["bulb","spring"] },
  { id:"daffodil", name:"Daffodil", latin:"Narcissus", type:"bulb", h:14, w:6, sun:["full","part"], water:"med", z:[3,9], bloom:["spring"], bloomColor:"#f2c84b", foliage:"#5a7a45", form:"bulbflower", cost:2, avail:1, tags:["bulb","spring"] },

  // ---- Annuals ----
  { id:"zinnia", name:"Zinnia (mixed)", latin:"Zinnia elegans", type:"annual", h:24, w:12, sun:["full"], water:"med", z:[2,11], bloom:["summer","fall"], bloomColor:"#e8643f", foliage:"#5a7a45", form:"daisy", cost:4, avail:1, tags:["annual"] },
  { id:"marigold", name:"Marigold", latin:"Tagetes", type:"annual", h:12, w:10, sun:["full"], water:"med", z:[2,11], bloom:["summer","fall"], bloomColor:"#f0962e", foliage:"#4f7a3e", form:"mound", cost:3, avail:1, tags:["annual","edging"] },
  { id:"salviaA", name:"Annual Salvia 'Victoria Blue'", latin:"Salvia farinacea", type:"annual", h:18, w:10, sun:["full","part"], water:"med", z:[2,11], bloom:["summer","fall"], bloomColor:"#4a59b0", foliage:"#4f7a3e", form:"spike", cost:4, avail:1, tags:["annual","pollinator"] },

  // ---- Shade & foliage / texture ----
  { id:"japanesefern", name:"Japanese Painted Fern", latin:"Athyrium niponicum", type:"perennial", h:16, w:20, sun:["part","shade"], water:"med", z:[3,8], bloom:[], bloomColor:"#97a7a0", foliage:"#93a59d", form:"clump", cost:14, avail:1, tags:["foliage","shade","texture"] },
  { id:"ostrichfern", name:"Ostrich Fern", latin:"Matteuccia struthiopteris", type:"perennial", h:48, w:30, sun:["part","shade"], water:"high", z:[3,7], bloom:[], bloomColor:"#5e7e4a", foliage:"#5e7e4a", form:"clump", cost:16, avail:1, tags:["foliage","shade","texture","native","moist"] },
  { id:"autumnfern", name:"Autumn Fern", latin:"Dryopteris erythrosora", type:"perennial", h:20, w:20, sun:["part","shade"], water:"med", z:[5,9], bloom:[], bloomColor:"#6f8048", foliage:"#6f8048", form:"clump", cost:15, avail:1, tags:["foliage","shade","texture"] },
  { id:"brunnera", name:"Siberian Bugloss 'Jack Frost'", latin:"Brunnera macrophylla", type:"perennial", h:14, w:18, sun:["part","shade"], water:"med", z:[3,8], bloom:["spring"], bloomColor:"#7d97c4", foliage:"#a6b4ab", form:"mound", cost:15, avail:1, tags:["foliage","shade"] },
  { id:"foamflower", name:"Foamflower", latin:"Tiarella cordifolia", type:"perennial", h:10, w:14, sun:["part","shade"], water:"med", z:[3,9], bloom:["spring"], bloomColor:"#f0e6ec", foliage:"#5f8a4e", form:"mat", cost:11, avail:1, tags:["native","shade","edging"] },
  { id:"lungwort", name:"Lungwort 'Mrs. Moon'", latin:"Pulmonaria", type:"perennial", h:10, w:18, sun:["part","shade"], water:"med", z:[3,8], bloom:["spring"], bloomColor:"#8a7fc0", foliage:"#7f9384", form:"mound", cost:12, avail:1, tags:["foliage","shade","edging"] },
  { id:"bleedingheart", name:"Bleeding Heart", latin:"Lamprocapnos spectabilis", type:"perennial", h:30, w:30, sun:["part","shade"], water:"med", z:[3,9], bloom:["spring"], bloomColor:"#e58fb0", foliage:"#6f8f5e", form:"mound", cost:15, avail:1, tags:["shade"] },
  { id:"forestgrass", name:"Japanese Forest Grass 'Aureola'", latin:"Hakonechloa macra", type:"grass", h:14, w:22, sun:["part","shade"], water:"med", z:[5,9], bloom:[], bloomColor:"#cdbf8a", foliage:"#a9b86a", form:"grass", cost:18, avail:1, tags:["foliage","shade","texture","goldleaf"] },
  { id:"hellebore", name:"Lenten Rose", latin:"Helleborus orientalis", type:"perennial", h:16, w:20, sun:["part","shade"], water:"med", z:[4,9], bloom:["spring"], bloomColor:"#cdbfd6", foliage:"#3f5e3a", form:"mound", cost:18, avail:1, tags:["evergreen","shade","foliage"] },
  { id:"carex", name:"Sedge 'Evergold'", latin:"Carex oshimensis", type:"grass", h:12, w:14, sun:["part","shade"], water:"med", z:[5,9], bloom:[], bloomColor:"#b6bd7e", foliage:"#b6bd7e", form:"grass", cost:12, avail:1, tags:["foliage","shade","texture","edging"] },
  { id:"solomonseal", name:"Solomon's Seal", latin:"Polygonatum", type:"perennial", h:24, w:24, sun:["part","shade"], water:"med", z:[3,8], bloom:["spring"], bloomColor:"#eef0e6", foliage:"#6f8f5e", form:"clump", cost:14, avail:1, tags:["native","shade","texture"] },
  { id:"bigrootgeranium", name:"Bigroot Geranium", latin:"Geranium macrorrhizum", type:"perennial", h:14, w:24, sun:["part","shade"], water:"low", z:[3,8], bloom:["spring","summer"], bloomColor:"#cf8fb0", foliage:"#6f8a5a", form:"mat", cost:11, avail:1, tags:["shade","edging","fragrant"] },

  // ---- Texture & structure (sun) ----
  { id:"amsonia", name:"Blue Star", latin:"Amsonia hubrichtii", type:"perennial", h:36, w:36, sun:["full","part"], water:"med", z:[3,9], bloom:["spring"], bloomColor:"#9fb6d6", foliage:"#6f8a5e", fallFoliage:"#d8b24a", form:"mound", cost:16, avail:1, tags:["native","texture","structure"] },
  { id:"seaholly", name:"Sea Holly", latin:"Eryngium", type:"perennial", h:30, w:18, sun:["full"], water:"low", z:[4,9], bloom:["summer"], bloomColor:"#8fa0c4", foliage:"#8a9a93", form:"spike", cost:14, avail:1, tags:["texture","pollinator","structure","silverleaf"] },
  { id:"feathergrass", name:"Mexican Feather Grass", latin:"Nassella tenuissima", type:"grass", h:22, w:22, sun:["full"], water:"low", z:[6,10], bloom:["summer","fall"], bloomColor:"#e6dcc0", foliage:"#b3a673", form:"grass", cost:13, avail:2, tags:["texture"] },
  { id:"yarrow",basal:0.24, name:"Yarrow 'Coronation Gold'", latin:"Achillea", type:"perennial", h:28, w:24, sun:["full"], water:"low", z:[3,9], bloom:["summer","fall"], bloomColor:"#f0d65a", foliage:"#8a9a7a", form:"clump", cost:12, avail:1, tags:["pollinator","native","texture","silverleaf"] },
  { id:"inkberry", name:"Inkberry Holly", latin:"Ilex glabra", type:"shrub", h:60, w:60, sun:["full","part","shade"], water:"med", z:[4,9], bloom:[], bloomColor:"#cdd9b8", foliage:"#34503a", form:"shrub", cost:30, avail:1, tags:["evergreen","structure","native"] },

  // ---- Prairie / naturalistic / native (sun, Zone 5) ----
  { id:"sanguisorba", name:"Great Burnet", latin:"Sanguisorba officinalis", type:"perennial", h:54, w:24, sun:["full","part"], water:"med", z:[4,8], bloom:["summer","fall"], bloomColor:"#8f3b55", foliage:"#6f8a6a", form:"spike", cost:16, avail:2, tags:["texture","pollinator","structure","airy","emergent"] },
  { id:"liatris", name:"Blazing Star 'Kobold'", latin:"Liatris spicata", type:"perennial", h:36, w:14, sun:["full"], water:"med", z:[3,8], bloom:["summer"], bloomColor:"#7d5fb0", foliage:"#5a7a45", form:"spike", cost:11, avail:1, tags:["native","pollinator","vertical","emergent"] },
  { id:"butterflyweed", name:"Butterfly Weed", latin:"Asclepias tuberosa", type:"perennial", h:24, w:18, sun:["full"], water:"low", z:[3,9], bloom:["summer"], bloomColor:"#ef8a2e", foliage:"#5a7a45", form:"clump", cost:12, avail:1, tags:["native","pollinator"] },
  { id:"swampmilkweed",inflor:"umbel", name:"Swamp Milkweed", latin:"Asclepias incarnata", type:"perennial", h:42, w:24, sun:["full","part"], water:"high", z:[3,9], bloom:["summer"], bloomColor:"#d98ab0", foliage:"#5a7a45", form:"clump", cost:12, avail:1, tags:["native","pollinator","moist"] },
  { id:"joepye", name:"Joe Pye Weed 'Baby Joe'", latin:"Eutrochium dubium", type:"perennial", h:48, w:30, sun:["full","part"], water:"med", z:[4,9], bloom:["summer","fall"], bloomColor:"#b06a8f", foliage:"#46682f", form:"clump", cost:14, avail:2, tags:["native","pollinator","structure"] },
  { id:"panicum", name:"Switchgrass 'Shenandoah'", latin:"Panicum virgatum", type:"grass", h:48, w:30, sun:["full"], water:"low", z:[4,9], bloom:["summer","fall"], bloomColor:"#c2937f", foliage:"#6f8a4e", fallFoliage:"#b0682f", form:"grass", cost:15, avail:1, tags:["native","structure","vertical","airy"] },
  { id:"prairiedropseed", name:"Prairie Dropseed", latin:"Sporobolus heterolepis", type:"grass", h:24, w:24, sun:["full"], water:"low", z:[3,9], bloom:["fall"], bloomColor:"#c9b06a", foliage:"#7d9a6a", fallFoliage:"#c79a4a", form:"grass", cost:14, avail:1, tags:["native","texture"] },
  { id:"molinia", name:"Purple Moor Grass 'Skyracer'", latin:"Molinia caerulea", type:"grass", h:60, w:24, sun:["full","part"], water:"med", z:[4,9], bloom:["summer","fall"], bloomColor:"#c9b48a", foliage:"#6f8a4e", fallFoliage:"#cdaa5a", form:"grass", cost:16, avail:1, tags:["structure","vertical","texture","airy"] },
  { id:"deschampsia", name:"Tufted Hair Grass 'Goldtau'", latin:"Deschampsia cespitosa", type:"grass", h:30, w:24, sun:["full","part"], water:"med", z:[4,9], bloom:["summer"], bloomColor:"#cdc79a", foliage:"#5f7a45", form:"grass", cost:14, avail:1, tags:["texture","airy"] },
  { id:"agastache", name:"Hyssop 'Blue Fortune'", latin:"Agastache", type:"perennial", h:36, w:18, sun:["full"], water:"low", z:[5,9], bloom:["summer","fall"], bloomColor:"#8a9ad0", foliage:"#8a9a7a", form:"spike", cost:12, avail:1, tags:["pollinator","fragrant","texture","silverleaf","airy","emergent"] },
  { id:"helenium", name:"Helen's Flower 'Mardi Gras'", latin:"Helenium autumnale", type:"perennial", h:36, w:20, sun:["full"], water:"med", z:[3,8], bloom:["summer","fall"], bloomColor:"#d8662e", foliage:"#46682f", form:"daisy", cost:12, avail:1, tags:["native","pollinator"] },
  { id:"veronicastrum", name:"Culver's Root", latin:"Veronicastrum virginicum", type:"perennial", h:54, w:24, sun:["full","part"], water:"med", z:[3,8], bloom:["summer"], bloomColor:"#e6e4ee", foliage:"#46682f", form:"spike", cost:14, avail:2, tags:["native","pollinator","structure","vertical","airy","emergent"] },
  { id:"echinops", name:"Globe Thistle 'Veitch's Blue'", latin:"Echinops ritro", type:"perennial", h:42, w:24, sun:["full"], water:"low", z:[3,9], bloom:["summer"], bloomColor:"#6f86c9", foliage:"#8a9a93", form:"globe", cost:13, avail:1, tags:["pollinator","texture","structure","silverleaf"] },
  { id:"noddingonion", name:"Nodding Onion", latin:"Allium cernuum", type:"bulb", h:18, w:8, sun:["full","part"], water:"low", z:[3,8], bloom:["summer"], bloomColor:"#d8a8c4", foliage:"#5a7a45", form:"globe", cost:6, avail:1, tags:["native","pollinator","bulb"] },

  // ---- Cottage (Zone 5) ----
  { id:"peony", name:"Peony 'Sarah Bernhardt'", latin:"Paeonia lactiflora", type:"perennial", h:32, w:32, sun:["full","part"], water:"med", z:[3,8], bloom:["spring"], bloomColor:"#f0c0d2", foliage:"#46682f", form:"mound", cost:22, avail:1, tags:["fragrant","structure"] },
  { id:"foxglove",inflor:"raceme", name:"Foxglove", latin:"Digitalis purpurea", type:"perennial", h:48, w:18, sun:["part","full"], water:"med", z:[4,8], bloom:["spring","summer"], bloomColor:"#cf8ab8", foliage:"#46682f", form:"spike", cost:9, avail:1, tags:["structure","vertical","airy","emergent"] },
  { id:"delphinium",inflor:"raceme", name:"Delphinium 'Pacific Giant'", latin:"Delphinium elatum", type:"perennial", h:60, w:18, sun:["full","part"], water:"med", z:[3,7], bloom:["summer"], bloomColor:"#4a59b0", foliage:"#46682f", form:"spike", cost:14, avail:1, tags:["structure","vertical","emergent"] },
  { id:"ladysmantle", name:"Lady's Mantle", latin:"Alchemilla mollis", type:"perennial", h:14, w:18, sun:["part","full"], water:"med", z:[3,8], bloom:["spring","summer"], bloomColor:"#cdd98a", foliage:"#6f8a5a", form:"mound", cost:10, avail:1, tags:["edging"] },
  { id:"lambsear", name:"Lamb's Ears", latin:"Stachys byzantina", type:"groundcover", h:12, w:18, sun:["full"], water:"low", z:[4,8], bloom:["summer"], bloomColor:"#c0a8d0", foliage:"#b6c0a6", form:"mat", cost:9, avail:1, tags:["edging","foliage","texture","silverleaf"] },
  { id:"rozanne", name:"Hardy Geranium 'Rozanne'", latin:"Geranium", type:"perennial", h:18, w:24, sun:["full","part"], water:"med", z:[5,8], bloom:["summer","fall"], bloomColor:"#6f7fc9", foliage:"#5a7a45", form:"mound", cost:13, avail:1, tags:["edging","pollinator"] },
  { id:"dianthus", name:"Cheddar Pinks 'Firewitch'", latin:"Dianthus gratianopolitanus", type:"groundcover", h:8, w:12, sun:["full"], water:"low", z:[3,9], bloom:["spring","summer"], bloomColor:"#c84a7e", foliage:"#8a9a93", form:"mat", cost:9, avail:1, tags:["edging","fragrant"] },

  // ---- Shade (Zone 5) ----
  { id:"epimedium", name:"Barrenwort 'Frohnleiten'", latin:"Epimedium", type:"groundcover", h:10, w:16, sun:["part","shade"], water:"low", z:[4,8], bloom:["spring"], bloomColor:"#f0d65a", foliage:"#5f7a45", form:"mat", cost:13, avail:2, tags:["shade","foliage","edging","texture"] },
  { id:"ligularia", name:"Ligularia 'The Rocket'", latin:"Ligularia", type:"perennial", h:48, w:30, sun:["part","shade"], water:"high", z:[4,8], bloom:["summer"], bloomColor:"#f0c83a", foliage:"#3f5e3a", form:"spike", cost:16, avail:2, tags:["shade","moist","structure"] },
  { id:"rose", name:"Shrub Rose", latin:"Rosa", type:"shrub", h:48, w:42, sun:["full","part"], water:"med", z:[5,9], bloom:["summer","fall"], bloomColor:"#e07a96", foliage:"#3f6b3a", form:"shrub", cost:26, avail:1, tags:["fragrant","structure"] },
  { id:"persicaria", name:"Fleeceflower 'Firetail'", latin:"Persicaria amplexicaulis", type:"perennial", h:42, w:30, sun:["full","part"], water:"med", z:[4,8], bloom:["summer","fall"], bloomColor:"#b23a4e", foliage:"#4a6e34", form:"spike", cost:14, avail:1, tags:["pollinator","structure"] },

  // ===== AESTHETIC EXPANSION (Zone-5 hardy) =====
  // ---- Silver & white ----
  { id:"artemisia", name:"Artemisia 'Silver Mound'", latin:"Artemisia schmidtiana", type:"perennial", h:12, w:18, sun:["full","part"], water:"low", z:[4,8], bloom:[], bloomColor:"#cdd6c2", foliage:"#b6c0a6", form:"mound", cost:12, avail:2, tags:["foliage","silverleaf","edging","texture"] },
  { id:"anemone", name:"Japanese Anemone 'Honorine Jobert'", latin:"Anemone x hybrida", type:"perennial", h:36, w:24, sun:["part","full"], water:"med", z:[4,8], bloom:["fall"], bloomColor:"#f6f6ef", foliage:"#4a6535", form:"daisy", cost:15, avail:1, tags:["fall"] },
  { id:"boltonia", name:"False Aster 'Snowbank'", latin:"Boltonia asteroides", type:"perennial", h:48, w:36, sun:["full","part"], water:"med", z:[3,9], bloom:["fall"], bloomColor:"#f4f5ee", foliage:"#6f8a6a", form:"daisy", cost:13, avail:2, tags:["native","pollinator","fall"] },
  { id:"gaura", name:"Wandflower 'Whirling Butterflies'", latin:"Oenothera lindheimeri", type:"perennial", h:30, w:24, sun:["full"], water:"low", z:[5,9], bloom:["summer","fall"], bloomColor:"#f2eef0", foliage:"#6f8a5e", form:"clump", cost:12, avail:2, tags:["pollinator","texture","airy","emergent"] },
  { id:"calamint", name:"Calamint 'White Cloud'", latin:"Calamintha nepeta", type:"perennial", h:18, w:18, sun:["full","part"], water:"low", z:[5,9], bloom:["summer","fall"], bloomColor:"#f0f0ea", foliage:"#7f9472", form:"mound", cost:12, avail:2, tags:["pollinator","fragrant"] },
  { id:"veronica", name:"Speedwell 'Royal Candles'", latin:"Veronica spicata", type:"perennial", h:18, w:14, sun:["full"], water:"med", z:[3,8], bloom:["summer"], bloomColor:"#6a5fb0", foliage:"#5a7a45", form:"spike", cost:12, avail:1, tags:["pollinator","vertical"] },
  { id:"dustymiller", name:"Dusty Miller", latin:"Senecio cineraria", type:"annual", h:14, w:12, sun:["full","part"], water:"low", z:[2,11], bloom:[], bloomColor:"#d6dcc8", foliage:"#b9c2b2", form:"mound", cost:4, avail:1, tags:["annual","foliage","silverleaf","edging"] },
  // ---- Dark & moody ----
  { id:"smokebush", name:"Smokebush 'Royal Purple'", latin:"Cotinus coggygria", type:"shrub", h:96, w:72, sun:["full"], water:"med", z:[4,8], bloom:["summer"], bloomColor:"#c79aae", foliage:"#4a3340", fallFoliage:"#c0472f", form:"shrub", cost:34, avail:1, tags:["structure","darkleaf"] },
  { id:"sambucus", name:"Elderberry 'Black Lace'", latin:"Sambucus nigra", type:"shrub", h:84, w:72, sun:["full","part"], water:"med", z:[4,7], bloom:["summer"], bloomColor:"#f0d0dc", foliage:"#3e2d3a", form:"shrub", cost:32, avail:1, tags:["structure","darkleaf"] },
  { id:"actaea", name:"Bugbane 'Black Negligee'", latin:"Actaea simplex", type:"perennial", h:60, w:30, sun:["part","shade"], water:"high", z:[4,8], bloom:["fall"], bloomColor:"#f4eef0", foliage:"#4a3742", form:"spike", cost:20, avail:2, tags:["shade","moist","fragrant","darkleaf","structure","vertical"] },
  { id:"eupatoriumchoc", name:"Chocolate Snakeroot", latin:"Ageratina altissima 'Chocolate'", type:"perennial", h:48, w:36, sun:["full","part"], water:"med", z:[4,8], bloom:["fall"], bloomColor:"#f2f2ec", foliage:"#4f3b33", form:"clump", cost:14, avail:3, tags:["native","fall","darkleaf"] },
  { id:"bloodgrass", name:"Japanese Blood Grass 'Red Baron'", latin:"Imperata cylindrica", type:"grass", h:18, w:14, sun:["full","part"], water:"med", z:[5,9], bloom:[], bloomColor:"#8a3a3a", foliage:"#7a3b3b", form:"grass", cost:14, avail:2, tags:["darkleaf","texture"] },
  { id:"penstemon",inflor:"raceme", name:"Beardtongue 'Dark Towers'", latin:"Penstemon", type:"perennial", h:36, w:20, sun:["full"], water:"low", z:[3,8], bloom:["summer"], bloomColor:"#f0dce0", foliage:"#5a3f48", form:"spike", cost:13, avail:1, tags:["native","pollinator","darkleaf","vertical"] },
  { id:"geraniumdark", name:"Geranium 'Espresso'", latin:"Geranium maculatum", type:"perennial", h:18, w:24, sun:["full","part"], water:"med", z:[4,8], bloom:["summer"], bloomColor:"#d8a8c4", foliage:"#5b4842", form:"mound", cost:13, avail:2, tags:["darkleaf","native"] },
  { id:"sedumdark",basal:0.55, name:"Sedum 'Xenox'", latin:"Hylotelephium", type:"perennial", h:18, w:20, sun:["full"], water:"low", z:[3,9], bloom:["fall"], bloomColor:"#c25f7a", foliage:"#6a5560", form:"clump", cost:14, avail:1, tags:["fall","darkleaf"] },
  { id:"hollyhock",inflor:"raceme", name:"Hollyhock 'Nigra'", latin:"Alcea rosea", type:"perennial", h:72, w:24, sun:["full"], water:"med", z:[3,8], bloom:["summer"], bloomColor:"#4a2a36", foliage:"#5a7a45", form:"spike", cost:9, avail:1, tags:["vertical","structure","airy","emergent"] },
  { id:"tulipdark", name:"Tulip 'Queen of Night'", latin:"Tulipa", type:"bulb", h:24, w:6, sun:["full","part"], water:"med", z:[3,8], bloom:["spring"], bloomColor:"#3a2233", foliage:"#6f8a4e", form:"bulbflower", cost:3, avail:1, tags:["bulb","spring"] },
  // ---- Chartreuse & gold foliage ----
  { id:"hostagold", name:"Hosta 'Sum and Substance'", latin:"Hosta", type:"perennial", h:30, w:48, sun:["part","shade"], water:"med", z:[3,8], bloom:["summer"], bloomColor:"#e0d0ec", foliage:"#a8b84e", form:"mound", cost:18, avail:1, tags:["foliage","shade","goldleaf"] },
  { id:"physocarpusgold", name:"Ninebark 'Dart's Gold'", latin:"Physocarpus opulifolius", type:"shrub", h:60, w:60, sun:["full","part"], water:"med", z:[3,7], bloom:["spring"], bloomColor:"#f2e9ec", foliage:"#9aab46", fallFoliage:"#c0902f", form:"shrub", cost:28, avail:1, tags:["structure","goldleaf"] },
  { id:"creepingjenny", name:"Creeping Jenny 'Aurea'", latin:"Lysimachia nummularia", type:"groundcover", h:3, w:18, sun:["part","full"], water:"med", z:[3,9], bloom:["summer"], bloomColor:"#f2d84a", foliage:"#b6c24a", form:"mat", cost:8, avail:1, tags:["edging","goldleaf"] },
  { id:"sedumgold",basal:0.55, name:"Sedum 'Angelina'", latin:"Sedum rupestre", type:"groundcover", h:6, w:16, sun:["full"], water:"low", z:[3,9], bloom:["summer"], bloomColor:"#f2e06a", foliage:"#bcc24e", fallFoliage:"#d8923a", form:"mat", cost:9, avail:1, tags:["edging","goldleaf","texture"] },
  { id:"heucheragold", name:"Coral Bells 'Citronelle'", latin:"Heuchera villosa", type:"perennial", h:12, w:16, sun:["part","shade"], water:"med", z:[4,9], bloom:["summer"], bloomColor:"#f2eaea", foliage:"#aebf4f", form:"mound", cost:14, avail:2, tags:["foliage","goldleaf","shade"] },
  { id:"carexgold", name:"Sedge 'Everillo'", latin:"Carex oshimensis", type:"grass", h:14, w:16, sun:["part","shade"], water:"med", z:[5,9], bloom:[], bloomColor:"#b9c252", foliage:"#b3bf52", form:"grass", cost:13, avail:2, tags:["foliage","shade","goldleaf","texture","edging"] },
  { id:"euphorbia", name:"Cushion Spurge", latin:"Euphorbia polychroma", type:"perennial", h:18, w:24, sun:["full","part"], water:"low", z:[4,9], bloom:["spring"], bloomColor:"#cdd04e", foliage:"#5f7f43", fallFoliage:"#c0492f", form:"mound", cost:13, avail:1, tags:["texture"] },
  // ---- Hot & fiery ----
  { id:"crocosmia", name:"Crocosmia 'Lucifer'", latin:"Crocosmia", type:"perennial", h:36, w:12, sun:["full"], water:"med", z:[5,9], bloom:["summer"], bloomColor:"#cf3320", foliage:"#4f7240", form:"spike", cost:12, avail:2, tags:["pollinator","vertical","emergent"] },
  { id:"kniphofia", name:"Red Hot Poker 'Papaya Popsicle'", latin:"Kniphofia", type:"perennial", h:30, w:20, sun:["full"], water:"med", z:[5,9], bloom:["summer","fall"], bloomColor:"#ef6a2a", foliage:"#6f8a6a", form:"spike", cost:14, avail:2, tags:["pollinator","vertical","emergent"] },
  { id:"heliopsis", name:"False Sunflower 'Summer Sun'", latin:"Heliopsis helianthoides", type:"perennial", h:48, w:24, sun:["full"], water:"med", z:[3,9], bloom:["summer","fall"], bloomColor:"#f4b026", foliage:"#46682f", form:"daisy", cost:13, avail:1, tags:["native","pollinator"] },
  { id:"lobelia", name:"Cardinal Flower", latin:"Lobelia cardinalis", type:"perennial", h:36, w:12, sun:["part","full"], water:"high", z:[3,9], bloom:["summer","fall"], bloomColor:"#c5232a", foliage:"#4a5e34", form:"spike", cost:12, avail:2, tags:["native","pollinator","moist","vertical"] },
  { id:"echinaceaorange", name:"Coneflower 'Hot Papaya'", latin:"Echinacea", type:"perennial", h:32, w:18, sun:["full"], water:"low", z:[4,9], bloom:["summer","fall"], bloomColor:"#e0552c", foliage:"#4d7038", form:"daisy", cost:14, avail:2, tags:["pollinator","native"] },
  { id:"geum", name:"Avens 'Totally Tangerine'", latin:"Geum", type:"perennial", h:28, w:18, sun:["full","part"], water:"med", z:[5,7], bloom:["spring","summer"], bloomColor:"#ef7a2e", foliage:"#4f7240", form:"mound", cost:13, avail:1, tags:["pollinator"] },
  // ---- Cool blue & lavender ----
  { id:"irissiberian", name:"Siberian Iris 'Caesar's Brother'", latin:"Iris sibirica", type:"perennial", h:32, w:20, sun:["full","part"], water:"med", z:[3,8], bloom:["spring","summer"], bloomColor:"#5b4fa0", foliage:"#5a7a4a", form:"spike", cost:13, avail:2, tags:["vertical","emergent"] },
  { id:"camassia", name:"Camas", latin:"Camassia leichtlinii", type:"bulb", h:30, w:6, sun:["full","part"], water:"med", z:[4,8], bloom:["spring"], bloomColor:"#6f7fc4", foliage:"#5a7a45", form:"spike", cost:5, avail:1, tags:["bulb","native","spring","emergent"] },
  { id:"platycodon", name:"Balloon Flower", latin:"Platycodon grandiflorus", type:"perennial", h:24, w:18, sun:["full","part"], water:"med", z:[3,8], bloom:["summer"], bloomColor:"#6a6fc0", foliage:"#4f7240", form:"clump", cost:12, avail:1, tags:["pollinator"] },
  { id:"caryopteris", name:"Bluebeard", latin:"Caryopteris x clandonensis", type:"shrub", h:36, w:36, sun:["full"], water:"low", z:[5,9], bloom:["fall"], bloomColor:"#6f86c9", foliage:"#8fa580", form:"mound", cost:22, avail:1, tags:["pollinator","fall","structure"] },
  { id:"centaurea", name:"Mountain Bluet", latin:"Centaurea montana", type:"perennial", h:18, w:18, sun:["full"], water:"low", z:[3,8], bloom:["spring","summer"], bloomColor:"#5566b8", foliage:"#7f9472", form:"mound", cost:11, avail:1, tags:["pollinator"] },
  { id:"scabiosa", name:"Pincushion 'Butterfly Blue'", latin:"Scabiosa columbaria", type:"perennial", h:16, w:16, sun:["full"], water:"med", z:[4,9], bloom:["summer","fall"], bloomColor:"#8f86c8", foliage:"#5a7a45", form:"mound", cost:12, avail:1, tags:["pollinator"] },
  // ---- Soft pastel romance ----
  { id:"aquilegia", name:"Columbine 'Origami'", latin:"Aquilegia", type:"perennial", h:20, w:14, sun:["part","full"], water:"med", z:[3,8], bloom:["spring"], bloomColor:"#d79ac0", foliage:"#6f8a6a", form:"clump", cost:11, avail:1, tags:["pollinator"] },
  { id:"lupine",inflor:"raceme", name:"Lupine 'Gallery'", latin:"Lupinus", type:"perennial", h:30, w:18, sun:["full","part"], water:"med", z:[4,8], bloom:["spring","summer"], bloomColor:"#b07fc0", foliage:"#5a7a45", form:"spike", cost:12, avail:1, tags:["native","pollinator","vertical"] },
  { id:"centranthus", name:"Jupiter's Beard", latin:"Centranthus ruber", type:"perennial", h:30, w:20, sun:["full"], water:"low", z:[5,8], bloom:["summer","fall"], bloomColor:"#d96a86", foliage:"#8a9a85", form:"clump", cost:11, avail:1, tags:["pollinator","fragrant"] },
  // ---- Sunset & apricot ----
  { id:"yarrowterracotta",basal:0.24, name:"Yarrow 'Terracotta'", latin:"Achillea millefolium", type:"perennial", h:30, w:24, sun:["full"], water:"low", z:[3,8], bloom:["summer","fall"], bloomColor:"#e08a4a", foliage:"#8a9a7a", form:"clump", cost:12, avail:2, tags:["pollinator","texture"] },
  { id:"agastacheapricot", name:"Hyssop 'Apricot Sprite'", latin:"Agastache", type:"perennial", h:24, w:18, sun:["full"], water:"low", z:[5,9], bloom:["summer","fall"], bloomColor:"#ee9a4e", foliage:"#8a9a7a", form:"spike", cost:12, avail:2, tags:["pollinator","fragrant","vertical"] },
  { id:"foxgloveapricot",inflor:"raceme", name:"Foxglove 'Sutton's Apricot'", latin:"Digitalis purpurea", type:"perennial", h:48, w:18, sun:["part","full"], water:"med", z:[4,8], bloom:["summer"], bloomColor:"#efaa72", foliage:"#46682f", form:"spike", cost:9, avail:2, tags:["structure","vertical","airy","emergent"] },
  { id:"heucheracaramel", name:"Coral Bells 'Caramel'", latin:"Heuchera villosa", type:"perennial", h:12, w:18, sun:["part","full"], water:"med", z:[4,9], bloom:["summer"], bloomColor:"#f2ece2", foliage:"#c79a52", form:"mound", cost:14, avail:2, tags:["foliage","goldleaf"] },
  // ---- Autumn embers ----
  { id:"vernonia", name:"Ironweed 'Iron Butterfly'", latin:"Vernonia lettermannii", type:"perennial", h:36, w:24, sun:["full"], water:"med", z:[4,9], bloom:["fall"], bloomColor:"#8a4f9e", foliage:"#4a6034", form:"clump", cost:14, avail:1, tags:["native","pollinator","fall"] },
  { id:"aronia", name:"Black Chokeberry 'Brilliantissima'", latin:"Aronia melanocarpa", type:"shrub", h:60, w:48, sun:["full","part"], water:"med", z:[3,8], bloom:["spring"], bloomColor:"#f2efe8", foliage:"#4f7240", fallFoliage:"#c5331f", form:"shrub", cost:28, avail:1, tags:["native","fallcolor","structure"] },
  { id:"itea", name:"Virginia Sweetspire 'Henry's Garnet'", latin:"Itea virginica", type:"shrub", h:48, w:48, sun:["full","part","shade"], water:"med", z:[5,9], bloom:["summer"], bloomColor:"#f2f2ea", foliage:"#4f7240", fallFoliage:"#8a2f33", form:"shrub", cost:26, avail:1, tags:["native","fallcolor","moist","structure"] },
  // ---- Prairie gold & purple ----
  { id:"pycnanthemum", name:"Mountain Mint", latin:"Pycnanthemum muticum", type:"perennial", h:36, w:24, sun:["full","part"], water:"med", z:[4,8], bloom:["summer","fall"], bloomColor:"#dfe2da", foliage:"#9aae8a", form:"clump", cost:13, avail:2, tags:["native","pollinator","silverleaf"] },
  { id:"silphium", name:"Rosinweed", latin:"Silphium integrifolium", type:"perennial", h:60, w:30, sun:["full"], water:"med", z:[4,8], bloom:["summer","fall"], bloomColor:"#f3b62a", foliage:"#46682f", form:"daisy", cost:15, avail:3, tags:["native","pollinator","structure"] },
  { id:"ratibida", name:"Prairie Coneflower", latin:"Ratibida columnifera", type:"perennial", h:30, w:18, sun:["full"], water:"low", z:[4,9], bloom:["summer","fall"], bloomColor:"#e0a52c", foliage:"#5a7a45", form:"daisy", cost:11, avail:1, tags:["native","pollinator"] },
  // ---- Green & textural ----
  { id:"acanthus", name:"Bear's Breeches", latin:"Acanthus mollis", type:"perennial", h:36, w:36, sun:["part","full"], water:"med", z:[5,9], bloom:["summer"], bloomColor:"#e6dceb", foliage:"#3f6e3a", form:"spike", cost:18, avail:3, tags:["foliage","texture","structure"] },
  { id:"rodgersia", name:"Rodgersleaf 'Bronze Peacock'", latin:"Rodgersia", type:"perennial", h:40, w:36, sun:["part","shade"], water:"high", z:[5,7], bloom:["summer"], bloomColor:"#efd9d2", foliage:"#4a5040", form:"clump", cost:20, avail:3, tags:["foliage","moist","shade","texture","structure"] },
  { id:"bergenia", name:"Pigsqueak", latin:"Bergenia cordifolia", type:"perennial", h:14, w:18, sun:["part","shade","full"], water:"med", z:[3,8], bloom:["spring"], bloomColor:"#d96a9a", foliage:"#3f6a3a", fallFoliage:"#8a3a3a", form:"mound", cost:12, avail:1, tags:["foliage","shade","edging","evergreen"] },
  { id:"sambucusgold", name:"Golden Elderberry 'Sutherland Gold'", latin:"Sambucus nigra", type:"shrub", h:84, w:60, sun:["full","part"], water:"med", z:[4,7], bloom:["summer"], bloomColor:"#f0ead0", foliage:"#a8b84e", fallFoliage:"#c0902f", form:"shrub", cost:30, avail:2, tags:["structure","goldleaf"] },
  { id:"caryopterisgold", name:"Bluebeard 'Worcester Gold'", latin:"Caryopteris x clandonensis", type:"shrub", h:30, w:36, sun:["full"], water:"low", z:[5,9], bloom:["fall"], bloomColor:"#6f86c9", foliage:"#b0bf52", form:"mound", cost:22, avail:2, tags:["goldleaf","pollinator","fall","structure"] },
  { id:"verbena", name:"Tall Verbena", latin:"Verbena bonariensis", type:"annual", h:48, w:20, sun:["full"], water:"low", z:[3,11], bloom:["summer","fall"], bloomColor:"#8a6fb0", foliage:"#4f7240", form:"spike", cost:5, avail:1, tags:["annual","airy","emergent","pollinator","vertical"] },
  { id:"thalictrum", name:"Meadow Rue 'Elin'", latin:"Thalictrum", type:"perennial", h:72, w:30, sun:["part","full"], water:"med", z:[4,8], bloom:["summer"], bloomColor:"#c9b8d6", foliage:"#7f9484", form:"spike", cost:17, avail:2, tags:["airy","emergent","vertical","texture","structure"] },

  // ===== CULTIVAR EXPANSION — BATCH 1 (design-distinct popular cultivars) =====
  // -- Daylily (Hemerocallis): colour + height range --
  { id:"daylilyred", name:"Daylily 'Pardon Me'", latin:"Hemerocallis", type:"perennial", h:18, w:18, sun:["full","part"], water:"med", z:[3,9], bloom:["summer","fall"], bloomColor:"#b8384a", foliage:"#4f7a3e", form:"clump", cost:13, avail:1, tags:["pollinator"] },
  { id:"daylilypink", name:"Daylily 'Rosy Returns'", latin:"Hemerocallis", type:"perennial", h:16, w:18, sun:["full","part"], water:"med", z:[3,9], bloom:["summer","fall"], bloomColor:"#d96a90", foliage:"#4f7a3e", form:"clump", cost:13, avail:1, tags:["pollinator"] },
  { id:"daylilytall", name:"Daylily 'Ruby Spider'", latin:"Hemerocallis", type:"perennial", h:30, w:22, sun:["full","part"], water:"med", z:[3,9], bloom:["summer"], bloomColor:"#a82835", foliage:"#4f7a3e", form:"clump", cost:14, avail:1, tags:["pollinator"] },
  // -- Hosta: size range (mini blue -> giant) + variegation --
  { id:"hostamini", name:"Hosta 'Blue Mouse Ears'", latin:"Hosta", type:"perennial", h:8, w:12, sun:["part","shade"], water:"med", z:[3,8], bloom:["summer"], bloomColor:"#cdbfe0", foliage:"#7d978a", form:"mound", cost:14, avail:1, tags:["foliage","shade","edging"] },
  { id:"hostablue", name:"Hosta 'Blue Angel'", latin:"Hosta", type:"perennial", h:36, w:48, sun:["part","shade"], water:"med", z:[3,8], bloom:["summer"], bloomColor:"#f0f0ea", foliage:"#6f8f86", form:"mound", cost:20, avail:1, tags:["foliage","shade"] },
  { id:"hostapatriot", name:"Hosta 'Patriot'", latin:"Hosta", type:"perennial", h:18, w:30, sun:["part","shade"], water:"med", z:[3,8], bloom:["summer"], bloomColor:"#cdbfe0", foliage:"#4f7a3e", form:"mound", cost:16, avail:1, tags:["foliage","shade"] },
  // -- Coral Bells (Heuchera): full foliage-colour spread --
  { id:"heucherablack", name:"Coral Bells 'Obsidian'", latin:"Heuchera", type:"perennial", h:12, w:16, sun:["part","shade","full"], water:"med", z:[4,9], bloom:["summer"], bloomColor:"#f2eaea", foliage:"#352b33", form:"mound", cost:14, avail:2, tags:["foliage","darkleaf"] },
  { id:"heucherasilver", name:"Coral Bells 'Pewter Veil'", latin:"Heuchera", type:"perennial", h:16, w:18, sun:["part","shade"], water:"med", z:[4,9], bloom:["spring","summer"], bloomColor:"#f0dede", foliage:"#8a9098", form:"mound", cost:14, avail:2, tags:["foliage","silverleaf"] },
  { id:"heucherared", name:"Coral Bells 'Forever Red'", latin:"Heuchera", type:"perennial", h:12, w:16, sun:["part","shade","full"], water:"med", z:[4,9], bloom:["summer"], bloomColor:"#f2eaea", foliage:"#6a2f38", form:"mound", cost:15, avail:2, tags:["foliage","darkleaf"] },
  // -- Coneflower (Echinacea): white / yellow / magenta beyond purple+orange --
  { id:"echinaceawhite", name:"Coneflower 'White Swan'", latin:"Echinacea purpurea", type:"perennial", h:30, w:18, sun:["full"], water:"low", z:[3,9], bloom:["summer","fall"], bloomColor:"#f4f3ec", foliage:"#4d7038", form:"daisy", cost:13, avail:1, tags:["pollinator","native"] },
  { id:"echinaceayellow", name:"Coneflower 'Cleopatra'", latin:"Echinacea", type:"perennial", h:24, w:16, sun:["full"], water:"low", z:[4,8], bloom:["summer","fall"], bloomColor:"#f2cf4e", foliage:"#4d7038", form:"daisy", cost:14, avail:2, tags:["pollinator"] },
  { id:"echinaceamagenta", name:"Coneflower 'PowWow Wild Berry'", latin:"Echinacea purpurea", type:"perennial", h:20, w:16, sun:["full"], water:"low", z:[3,8], bloom:["summer","fall"], bloomColor:"#c43a72", foliage:"#4d7038", form:"daisy", cost:13, avail:1, tags:["pollinator","native"] },
  // -- Hydrangea: dwarf panicle / reblooming mophead / oakleaf (fall colour) --
  { id:"hydrangeabobo", name:"Panicle Hydrangea 'Bobo'", latin:"Hydrangea paniculata", type:"shrub", h:36, w:36, sun:["full","part"], water:"med", z:[3,8], bloom:["summer","fall"], bloomColor:"#f2f2ea", foliage:"#4d7741", form:"shrub", cost:30, avail:1, tags:["structure"] },
  { id:"hydrangeaendless", name:"Bigleaf Hydrangea 'Endless Summer'", latin:"Hydrangea macrophylla", type:"shrub", h:48, w:48, sun:["part","full"], water:"med", z:[5,9], bloom:["summer","fall"], bloomColor:"#9fa6d0", foliage:"#4f7a43", form:"shrub", cost:32, avail:1, tags:["structure"] },
  { id:"hydrangeaoak", name:"Oakleaf Hydrangea 'Ruby Slippers'", latin:"Hydrangea quercifolia", type:"shrub", h:48, w:60, sun:["full","part"], water:"med", z:[5,9], bloom:["summer"], bloomColor:"#f2efe6", foliage:"#4f7a43", fallFoliage:"#8a3340", form:"shrub", cost:34, avail:1, tags:["structure","fallcolor","native"] },
  // -- Iris: bearded colour range + a white Siberian --
  { id:"irisbeardedpink", name:"Tall Bearded Iris 'Beverly Sills'", latin:"Iris germanica", type:"perennial", h:36, w:18, sun:["full"], water:"low", z:[3,9], bloom:["spring","summer"], bloomColor:"#e89aa0", foliage:"#8a9a82", form:"spike", cost:11, avail:2, tags:["vertical"] },
  { id:"irisbeardedpurple", name:"Tall Bearded Iris 'Dusky Challenger'", latin:"Iris germanica", type:"perennial", h:38, w:18, sun:["full"], water:"low", z:[3,9], bloom:["spring","summer"], bloomColor:"#3e2f55", foliage:"#8a9a82", form:"spike", cost:11, avail:2, tags:["vertical"] },
  { id:"irisbeardedyellow", name:"Tall Bearded Iris 'Harvest of Memories'", latin:"Iris germanica", type:"perennial", h:36, w:18, sun:["full"], water:"low", z:[3,9], bloom:["spring","summer"], bloomColor:"#f2cf4e", foliage:"#8a9a82", form:"spike", cost:11, avail:2, tags:["vertical"] },
  { id:"irissiberianwhite", name:"Siberian Iris 'Butter and Sugar'", latin:"Iris sibirica", type:"perennial", h:28, w:20, sun:["full","part"], water:"med", z:[3,8], bloom:["spring","summer"], bloomColor:"#f4f0d8", foliage:"#5a7a4a", form:"spike", cost:13, avail:2, tags:["vertical"] },
  // -- False Indigo (Baptisia): yellow / chocolate / white beyond blue --
  { id:"baptisiayellow", name:"False Indigo 'Carolina Moonlight'", latin:"Baptisia", type:"perennial", h:42, w:36, sun:["full","part"], water:"low", z:[4,9], bloom:["spring"], bloomColor:"#f0d24e", foliage:"#6f8f72", form:"shrub", cost:18, avail:2, tags:["native","structure"] },
  { id:"baptisiachoc", name:"False Indigo 'Dutch Chocolate'", latin:"Baptisia", type:"perennial", h:36, w:30, sun:["full","part"], water:"low", z:[4,9], bloom:["spring"], bloomColor:"#4a3340", foliage:"#6f8f72", form:"shrub", cost:18, avail:2, tags:["native","structure"] },
  { id:"baptisiawhite", name:"False Indigo 'Vanilla Cream'", latin:"Baptisia", type:"perennial", h:30, w:30, sun:["full","part"], water:"low", z:[4,9], bloom:["spring"], bloomColor:"#f2f2ea", foliage:"#6f8f72", form:"shrub", cost:18, avail:2, tags:["native","structure"] },
  // -- Salvia (nemorosa): rose + white beyond deep violet --
  { id:"salviarose", name:"Salvia 'Rose Marvel'", latin:"Salvia nemorosa", type:"perennial", h:18, w:18, sun:["full"], water:"low", z:[4,8], bloom:["spring","summer"], bloomColor:"#c85a86", foliage:"#51713f", form:"spike", cost:12, avail:1, tags:["pollinator"] },
  { id:"salviawhite", name:"Salvia 'Snow Hill'", latin:"Salvia nemorosa", type:"perennial", h:18, w:18, sun:["full"], water:"low", z:[4,8], bloom:["spring","summer"], bloomColor:"#f2f2ea", foliage:"#51713f", form:"spike", cost:12, avail:1, tags:["pollinator"] },
  // -- Sedum: bright upright + a creeping mat --
  { id:"sedumneon",basal:0.55, name:"Sedum 'Neon'", latin:"Hylotelephium", type:"perennial", h:18, w:18, sun:["full"], water:"low", z:[3,9], bloom:["fall"], bloomColor:"#d6457e", foliage:"#7fa074", form:"clump", cost:13, avail:1, tags:["fall","pollinator"] },
  { id:"sedumdragon",basal:0.55, name:"Sedum 'Dragon's Blood'", latin:"Sedum spurium", type:"groundcover", h:4, w:18, sun:["full"], water:"low", z:[3,9], bloom:["summer"], bloomColor:"#b83a52", foliage:"#6a7a4a", fallFoliage:"#9a3a3a", form:"mat", cost:9, avail:2, tags:["edging","fall"] },
  // -- Catmint (Nepeta): dwarf / standard / giant heights --
  { id:"nepetagiant", name:"Catmint 'Six Hills Giant'", latin:"Nepeta x faassenii", type:"perennial", h:30, w:30, sun:["full"], water:"low", z:[3,8], bloom:["spring","summer","fall"], bloomColor:"#8d8bd6", foliage:"#7e8f66", form:"mound", cost:13, avail:1, tags:["pollinator"] },
  { id:"nepetacat", name:"Catmint 'Cat's Pajamas'", latin:"Nepeta", type:"perennial", h:14, w:18, sun:["full"], water:"low", z:[3,8], bloom:["spring","summer","fall"], bloomColor:"#7d7bca", foliage:"#7e8f66", form:"mound", cost:13, avail:1, tags:["pollinator","edging"] },
  // -- Coreopsis: gold threadleaf + a wine-red --
  { id:"coreopsisgold", name:"Coreopsis 'Zagreb'", latin:"Coreopsis verticillata", type:"perennial", h:15, w:18, sun:["full"], water:"low", z:[4,9], bloom:["summer","fall"], bloomColor:"#f0c63a", foliage:"#5a7a45", form:"mound", cost:11, avail:1, tags:["pollinator"] },
  { id:"coreopsisred", name:"Coreopsis 'Mercury Rising'", latin:"Coreopsis", type:"perennial", h:18, w:18, sun:["full"], water:"low", z:[5,9], bloom:["summer","fall"], bloomColor:"#a83040", foliage:"#5a7a45", form:"mound", cost:12, avail:2, tags:["pollinator"] },
  // -- Astilbe: white / pink / raspberry-purple beyond red --
  { id:"astilbewhite",inflor:"panicle", name:"Astilbe 'Deutschland'", latin:"Astilbe", type:"perennial", h:20, w:18, sun:["part","shade"], water:"high", z:[3,8], bloom:["summer"], bloomColor:"#f2f2ec", foliage:"#3f6535", form:"spike", cost:14, avail:1, tags:["shade","moist"] },
  { id:"astilbepink",inflor:"panicle", name:"Astilbe 'Europa'", latin:"Astilbe", type:"perennial", h:24, w:20, sun:["part","shade"], water:"high", z:[3,8], bloom:["summer"], bloomColor:"#e8a8c0", foliage:"#3f6535", form:"spike", cost:14, avail:1, tags:["shade","moist"] },
  { id:"astilbepurple",inflor:"panicle", name:"Astilbe 'Visions'", latin:"Astilbe chinensis", type:"perennial", h:18, w:18, sun:["part","shade","full"], water:"med", z:[3,8], bloom:["summer"], bloomColor:"#b05a9a", foliage:"#3f6535", form:"spike", cost:14, avail:2, tags:["shade"] },

  // ===== CULTIVAR EXPANSION — BATCH 2 (design-distinct popular cultivars) =====
  // -- Bee Balm (Monarda): native species + pink + compact magenta --
  { id:"monardafistulosa",basal:0.58, name:"Wild Bergamot", latin:"Monarda fistulosa", type:"perennial", h:42, w:24, sun:["full","part"], water:"med", z:[3,9], bloom:["summer"], bloomColor:"#b08fc0", foliage:"#5f7a4f", form:"clump", cost:12, avail:1, tags:["pollinator","native"] },
  { id:"monardamarshalls",basal:0.58, name:"Bee Balm 'Marshall's Delight'", latin:"Monarda", type:"perennial", h:34, w:22, sun:["full","part"], water:"med", z:[3,9], bloom:["summer"], bloomColor:"#d96a9a", foliage:"#5f7a4f", form:"clump", cost:13, avail:2, tags:["pollinator"] },
  { id:"monardarockin",basal:0.58, name:"Bee Balm 'Rockin' Raspberry'", latin:"Monarda", type:"perennial", h:22, w:18, sun:["full","part"], water:"med", z:[4,9], bloom:["summer"], bloomColor:"#c0407e", foliage:"#4f6a44", form:"clump", cost:13, avail:2, tags:["pollinator"] },
  // -- Cranesbill (Geranium): true-blue + magenta low spreader --
  { id:"geraniumjohnson", name:"Cranesbill 'Johnson's Blue'", latin:"Geranium", type:"perennial", h:24, w:24, sun:["full","part"], water:"med", z:[4,8], bloom:["spring","summer"], bloomColor:"#5a6fc0", foliage:"#5a7a48", form:"mound", cost:13, avail:1, tags:["pollinator"] },
  { id:"geraniumsanguineum", name:"Bloody Cranesbill", latin:"Geranium sanguineum", type:"perennial", h:10, w:18, sun:["full","part"], water:"low", z:[3,8], bloom:["spring","summer"], bloomColor:"#b0418a", foliage:"#4f6a3e", form:"mound", cost:12, avail:2, tags:["pollinator","edging"] },
  // -- Lavender (Lavandula): compact lighter + large silver lavandin --
  { id:"lavendermunstead", name:"Lavender 'Munstead'", latin:"Lavandula angustifolia", type:"perennial", h:14, w:18, sun:["full"], water:"low", z:[4,9], bloom:["summer"], bloomColor:"#8d8bd0", foliage:"#9aa890", form:"spike", cost:12, avail:1, tags:["pollinator","fragrant","silverleaf"] },
  { id:"lavenderphenomenal", name:"Lavender 'Phenomenal'", latin:"Lavandula x intermedia", type:"perennial", h:30, w:30, sun:["full"], water:"low", z:[4,8], bloom:["summer"], bloomColor:"#7b6ab0", foliage:"#94a48c", form:"spike", cost:15, avail:2, tags:["pollinator","fragrant","silverleaf"] },
  // -- Black-Eyed Susan (Rudbeckia): knee-high + tall airy quilled --
  { id:"rudbeckialittle", name:"Black-Eyed Susan 'Little Goldstar'", latin:"Rudbeckia fulgida", type:"perennial", h:16, w:16, sun:["full","part"], water:"med", z:[4,9], bloom:["summer","fall"], bloomColor:"#f2b521", foliage:"#46662f", form:"daisy", cost:12, avail:2, tags:["pollinator","native"] },
  { id:"rudbeckiahenry", name:"Sweet Coneflower 'Henry Eilers'", latin:"Rudbeckia subtomentosa", type:"perennial", h:60, w:30, sun:["full","part"], water:"med", z:[4,9], bloom:["summer","fall"], bloomColor:"#f0c233", foliage:"#46662f", form:"daisy", cost:15, avail:2, tags:["pollinator","native","airy","emergent","vertical"] },
  // -- Garden Phlox (Phlox paniculata): mildew-resistant lavender-pink + bold magenta --
  { id:"phloxjeana", name:"Garden Phlox 'Jeana'", latin:"Phlox paniculata", type:"perennial", h:48, w:24, sun:["full","part"], water:"med", z:[4,8], bloom:["summer","fall"], bloomColor:"#c47fb0", foliage:"#46662f", form:"clump", cost:14, avail:2, tags:["pollinator","native"] },
  { id:"phloxlaura", name:"Garden Phlox 'Laura'", latin:"Phlox paniculata", type:"perennial", h:32, w:22, sun:["full","part"], water:"med", z:[4,8], bloom:["summer"], bloomColor:"#a85fb0", foliage:"#46662f", form:"clump", cost:13, avail:2, tags:["pollinator"] },
  // -- Aster: late salmon-pink + aromatic sky-blue (fall) --
  { id:"asterpink", name:"New England Aster 'Alma Potschke'", latin:"Symphyotrichum", type:"perennial", h:36, w:24, sun:["full","part"], water:"med", z:[3,8], bloom:["fall"], bloomColor:"#e0517f", foliage:"#46662f", form:"daisy", cost:13, avail:2, tags:["pollinator","native"] },
  { id:"asterblue", name:"Aromatic Aster 'October Skies'", latin:"Symphyotrichum oblongifolium", type:"perennial", h:22, w:30, sun:["full"], water:"low", z:[3,8], bloom:["fall"], bloomColor:"#7e95c8", foliage:"#46662f", form:"daisy", cost:13, avail:2, tags:["pollinator","native"] },
  // -- Yarrow (Achillea): brick-red + cherry-pink beyond gold/apricot --
  { id:"yarrowred",basal:0.24, name:"Yarrow 'Paprika'", latin:"Achillea millefolium", type:"perennial", h:22, w:22, sun:["full"], water:"low", z:[3,9], bloom:["summer","fall"], bloomColor:"#c0432f", foliage:"#6f8466", form:"clump", cost:11, avail:2, tags:["pollinator"] },
  { id:"yarrowpink",basal:0.24, name:"Yarrow 'Cerise Queen'", latin:"Achillea millefolium", type:"perennial", h:24, w:22, sun:["full"], water:"low", z:[3,9], bloom:["summer","fall"], bloomColor:"#c24a78", foliage:"#6f8466", form:"clump", cost:11, avail:2, tags:["pollinator"] },
  // -- Beardtongue (Penstemon): coral-red hummingbird + violet beyond dark-foliage pink --
  { id:"penstemonred",inflor:"raceme", name:"Beardtongue 'Coral Baby'", latin:"Penstemon barbatus", type:"perennial", h:24, w:16, sun:["full"], water:"low", z:[4,9], bloom:["summer"], bloomColor:"#e05a4a", foliage:"#51713f", form:"spike", cost:13, avail:2, tags:["pollinator","hummingbird"] },
  { id:"penstemonpurple",inflor:"raceme", name:"Beardtongue 'Rondo'", latin:"Penstemon", type:"perennial", h:18, w:14, sun:["full"], water:"low", z:[4,9], bloom:["summer"], bloomColor:"#6a5fb0", foliage:"#51713f", form:"spike", cost:13, avail:2, tags:["pollinator"] },
  // -- Peony (Paeonia): white / red / coral beyond pink --
  { id:"peonywhite", name:"Peony 'Festiva Maxima'", latin:"Paeonia lactiflora", type:"perennial", h:34, w:32, sun:["full","part"], water:"med", z:[3,8], bloom:["spring"], bloomColor:"#f4f0e8", foliage:"#3f6535", form:"mound", cost:24, avail:1, tags:["fragrant"] },
  { id:"peonyred", name:"Peony 'Karl Rosenfield'", latin:"Paeonia lactiflora", type:"perennial", h:32, w:32, sun:["full","part"], water:"med", z:[3,8], bloom:["spring"], bloomColor:"#b02838", foliage:"#3f6535", form:"mound", cost:24, avail:1, tags:["fragrant"] },
  { id:"peonycoral", name:"Peony 'Coral Charm'", latin:"Paeonia", type:"perennial", h:36, w:34, sun:["full","part"], water:"med", z:[3,8], bloom:["spring"], bloomColor:"#f08a5f", foliage:"#3f6535", form:"mound", cost:28, avail:2, tags:["fragrant"] },
  // -- Switchgrass (Panicum): blue-grey upright + columnar Northwind --
  { id:"panicumblue", name:"Switchgrass 'Heavy Metal'", latin:"Panicum virgatum", type:"grass", h:48, w:24, sun:["full"], water:"low", z:[4,9], bloom:["summer","fall"], bloomColor:"#c9a9c0", foliage:"#7d977f", fallFoliage:"#d9b96a", form:"grass", cost:16, avail:1, tags:["airy","vertical","native"] },
  { id:"panicumnorthwind", name:"Switchgrass 'Northwind'", latin:"Panicum virgatum", type:"grass", h:60, w:24, sun:["full"], water:"low", z:[4,9], bloom:["summer","fall"], bloomColor:"#cbb58f", foliage:"#6f8a5f", fallFoliage:"#d6b25e", form:"grass", cost:17, avail:1, tags:["airy","emergent","vertical","native","structure"] },
  // -- Tulip (Tulipa): red / white / yellow colour groups --
  { id:"tulipred", name:"Tulip 'Red Darwin'", latin:"Tulipa", type:"bulb", h:22, w:6, sun:["full","part"], water:"med", z:[3,8], bloom:["spring"], bloomColor:"#d33a3a", foliage:"#5f7d68", form:"bulbflower", cost:3, avail:1, tags:["spring"] },
  { id:"tulipwhite", name:"Tulip 'White Triumphator'", latin:"Tulipa", type:"bulb", h:24, w:6, sun:["full","part"], water:"med", z:[3,8], bloom:["spring"], bloomColor:"#f4f2ea", foliage:"#5f7d68", form:"bulbflower", cost:3, avail:1, tags:["spring"] },
  { id:"tulipyellow", name:"Tulip 'Golden Apeldoorn'", latin:"Tulipa", type:"bulb", h:22, w:6, sun:["full","part"], water:"med", z:[3,8], bloom:["spring"], bloomColor:"#f2cf3e", foliage:"#5f7d68", form:"bulbflower", cost:3, avail:1, tags:["spring"] },
  // -- Allium: giant globe / white / drumstick --
  { id:"alliumglobemaster", name:"Ornamental Onion 'Globemaster'", latin:"Allium", type:"bulb", h:34, w:10, sun:["full","part"], water:"low", z:[5,9], bloom:["spring","summer"], bloomColor:"#8a4f9e", foliage:"#6f8a72", form:"globe", cost:14, avail:1, tags:["pollinator"] },
  { id:"alliumwhite", name:"Ornamental Onion 'Mount Everest'", latin:"Allium", type:"bulb", h:36, w:10, sun:["full","part"], water:"low", z:[4,9], bloom:["spring","summer"], bloomColor:"#f0f0e8", foliage:"#6f8a72", form:"globe", cost:6, avail:1, tags:["pollinator"] },
  { id:"alliumdrumstick", name:"Drumstick Allium", latin:"Allium sphaerocephalon", type:"bulb", h:30, w:6, sun:["full"], water:"low", z:[4,9], bloom:["summer"], bloomColor:"#7a2f4a", foliage:"#6f8a72", form:"globe", cost:3, avail:1, tags:["pollinator"] },

  // ===== PHLOX DEEP-DIVE — tall (paniculata) colour range + other species =====
  // -- Tall Garden Phlox (Phlox paniculata): full colour spread --
  { id:"phloxglamour", name:"Garden Phlox 'Glamour Girl'", latin:"Phlox paniculata", type:"perennial", h:36, w:22, sun:["full","part"], water:"med", z:[4,8], bloom:["summer","fall"], bloomColor:"#ef6a8c", foliage:"#46662f", form:"clump", cost:14, avail:2, tags:["pollinator","fragrant"] },
  { id:"phloxrobert", name:"Garden Phlox 'Robert Poore'", latin:"Phlox paniculata", type:"perennial", h:54, w:26, sun:["full","part"], water:"med", z:[4,8], bloom:["summer","fall"], bloomColor:"#b0408a", foliage:"#46662f", form:"clump", cost:14, avail:2, tags:["pollinator","native","fragrant"] },
  { id:"phloxmaterialgirl", name:"Garden Phlox 'Material Girl'", latin:"Phlox paniculata", type:"perennial", h:40, w:24, sun:["full","part"], water:"med", z:[4,8], bloom:["summer","fall"], bloomColor:"#c03a9a", foliage:"#46662f", form:"clump", cost:15, avail:2, tags:["pollinator","fragrant"] },
  { id:"phloxnicky", name:"Garden Phlox 'Nicky'", latin:"Phlox paniculata", type:"perennial", h:36, w:22, sun:["full","part"], water:"med", z:[4,8], bloom:["summer","fall"], bloomColor:"#9c2f86", foliage:"#46662f", form:"clump", cost:13, avail:2, tags:["pollinator","fragrant"] },
  { id:"phloxblueparadise", name:"Garden Phlox 'Blue Paradise'", latin:"Phlox paniculata", type:"perennial", h:36, w:22, sun:["full","part"], water:"med", z:[4,8], bloom:["summer"], bloomColor:"#6a6fc0", foliage:"#46662f", form:"clump", cost:14, avail:1, tags:["pollinator","fragrant"] },
  { id:"phloxfranz", name:"Garden Phlox 'Franz Schubert'", latin:"Phlox paniculata", type:"perennial", h:32, w:22, sun:["full","part"], water:"med", z:[4,8], bloom:["summer"], bloomColor:"#9a8fd0", foliage:"#46662f", form:"clump", cost:13, avail:2, tags:["pollinator","fragrant"] },
  { id:"phloxbrighteyes", name:"Garden Phlox 'Bright Eyes'", latin:"Phlox paniculata", type:"perennial", h:28, w:22, sun:["full","part"], water:"med", z:[4,8], bloom:["summer"], bloomColor:"#eaa0c0", foliage:"#46662f", form:"clump", cost:13, avail:2, tags:["pollinator","fragrant"] },
  { id:"phloxstarfire", name:"Garden Phlox 'Starfire'", latin:"Phlox paniculata", type:"perennial", h:30, w:22, sun:["full","part"], water:"med", z:[4,8], bloom:["summer"], bloomColor:"#c43030", foliage:"#3f5a2c", form:"clump", cost:13, avail:2, tags:["pollinator","fragrant"] },
  { id:"phloxdeltasnow", name:"Garden Phlox 'Delta Snow'", latin:"Phlox paniculata", type:"perennial", h:40, w:24, sun:["full","part"], water:"med", z:[4,8], bloom:["summer","fall"], bloomColor:"#f2f0ea", foliage:"#46662f", form:"clump", cost:14, avail:2, tags:["pollinator","native","fragrant"] },
  { id:"phloxpeppermint", name:"Garden Phlox 'Peppermint Twist'", latin:"Phlox paniculata", type:"perennial", h:20, w:18, sun:["full","part"], water:"med", z:[4,8], bloom:["summer"], bloomColor:"#e85f97", foliage:"#46662f", form:"clump", cost:14, avail:2, tags:["pollinator","edging"] },
  // -- Woodland Phlox (Phlox divaricata): shade, spring, low --
  { id:"phloxdivaricata", name:"Woodland Phlox 'Blue Moon'", latin:"Phlox divaricata", type:"perennial", h:12, w:14, sun:["part","shade"], water:"med", z:[3,8], bloom:["spring"], bloomColor:"#7a86c8", foliage:"#46662f", form:"clump", cost:12, avail:2, tags:["pollinator","native","shade","fragrant"] },
  { id:"phloxdivaricatawhite", name:"Woodland Phlox 'May Breeze'", latin:"Phlox divaricata", type:"perennial", h:12, w:14, sun:["part","shade"], water:"med", z:[3,8], bloom:["spring"], bloomColor:"#eef0e6", foliage:"#46662f", form:"clump", cost:12, avail:2, tags:["pollinator","native","shade","fragrant"] },
  // -- Creeping Woodland Phlox (Phlox stolonifera): shade groundcover, spring --
  { id:"phloxstolonifera", name:"Creeping Phlox 'Sherwood Purple'", latin:"Phlox stolonifera", type:"groundcover", h:8, w:18, sun:["part","shade"], water:"med", z:[3,8], bloom:["spring"], bloomColor:"#7e5fa8", foliage:"#46662f", form:"mat", cost:10, avail:2, tags:["native","shade","edging"] },
  // -- Moss Phlox (Phlox subulata): sun mat, spring, extra colours --
  { id:"phloxsubblue", name:"Moss Phlox 'Emerald Blue'", latin:"Phlox subulata", type:"groundcover", h:6, w:20, sun:["full","part"], water:"low", z:[3,9], bloom:["spring"], bloomColor:"#8d8bd0", foliage:"#4f6a3e", form:"mat", cost:9, avail:1, tags:["edging"] },
  { id:"phloxsubred", name:"Moss Phlox 'Scarlet Flame'", latin:"Phlox subulata", type:"groundcover", h:6, w:20, sun:["full","part"], water:"low", z:[3,9], bloom:["spring"], bloomColor:"#d0356a", foliage:"#4f6a3e", form:"mat", cost:9, avail:1, tags:["edging"] },
  // -- Meadow Phlox (Phlox maculata): cylindrical heads, very mildew-resistant --
  { id:"phloxmaculata", name:"Meadow Phlox 'Natascha'", latin:"Phlox maculata", type:"perennial", h:30, w:20, sun:["full","part"], water:"med", z:[4,8], bloom:["summer"], bloomColor:"#d65f97", foliage:"#46662f", form:"clump", cost:14, avail:2, tags:["pollinator","native","fragrant"] },

  // -- Hybrid Phlox 'Fashionably Early' series (P. carolina x paniculata): early, mildew-proof, STERILE/stoloniferous -> no reseeding --
  { id:"phloxfeprincess", name:"Phlox 'Fashionably Early Princess'", latin:"Phlox hybrid", type:"perennial", h:32, w:24, sun:["full","part"], water:"med", z:[4,8], bloom:["summer","fall"], bloomColor:"#e070a0", foliage:"#46662f", form:"clump", cost:15, avail:2, tags:["pollinator","native","fragrant"] },
  { id:"phloxfeflamingo", name:"Phlox 'Fashionably Early Flamingo'", latin:"Phlox hybrid", type:"perennial", h:32, w:24, sun:["full","part"], water:"med", z:[4,8], bloom:["summer","fall"], bloomColor:"#d98ab8", foliage:"#46662f", form:"clump", cost:15, avail:2, tags:["pollinator","native","fragrant"] },
  { id:"phloxfecrystal", name:"Phlox 'Fashionably Early Crystal'", latin:"Phlox hybrid", type:"perennial", h:32, w:24, sun:["full","part"], water:"med", z:[4,8], bloom:["summer","fall"], bloomColor:"#f0f0ea", foliage:"#46662f", form:"clump", cost:15, avail:2, tags:["pollinator","native","fragrant"] },
  { id:"phloxfelavice", name:"Phlox 'Fashionably Early Lavender Ice'", latin:"Phlox hybrid", type:"perennial", h:30, w:24, sun:["full","part"], water:"med", z:[4,8], bloom:["summer","fall"], bloomColor:"#c9c0e0", foliage:"#46662f", form:"clump", cost:15, avail:2, tags:["pollinator","native","fragrant"] },

  // ===== CULTIVAR EXPANSION — BATCH 3 (design-distinct popular cultivars) =====
  // -- Hellebore (Helleborus): white / slate-black / yellow / pink, winter-spring shade --
  { id:"hellebrwhite", name:"Hellebore 'Molly's White'", latin:"Helleborus x hybridus", type:"perennial", h:14, w:18, sun:["part","shade"], water:"med", z:[4,9], bloom:["spring"], bloomColor:"#f0f0e6", foliage:"#3f5e3a", form:"mound", cost:24, avail:1, tags:["shade","evergreen"] },
  { id:"hellebrslate", name:"Hellebore 'Dark and Handsome'", latin:"Helleborus x hybridus", type:"perennial", h:16, w:20, sun:["part","shade"], water:"med", z:[4,9], bloom:["spring"], bloomColor:"#4a3f52", foliage:"#3f5e3a", form:"mound", cost:26, avail:2, tags:["shade","evergreen"] },
  { id:"hellebryellow", name:"Hellebore 'Golden Lotus'", latin:"Helleborus x hybridus", type:"perennial", h:14, w:18, sun:["part","shade"], water:"med", z:[4,9], bloom:["spring"], bloomColor:"#ecd66a", foliage:"#3f5e3a", form:"mound", cost:26, avail:2, tags:["shade","evergreen"] },
  { id:"hellebrpink", name:"Hellebore 'Penny's Pink'", latin:"Helleborus x hybridus", type:"perennial", h:14, w:18, sun:["part","shade"], water:"med", z:[5,9], bloom:["spring"], bloomColor:"#d98aa8", foliage:"#4a6a48", form:"mound", cost:26, avail:2, tags:["shade","evergreen","silverleaf"] },
  // -- Sneezeweed (Helenium): red / orange / tall yellow, late-season warm fire --
  { id:"heleniumred", name:"Sneezeweed 'Moerheim Beauty'", latin:"Helenium autumnale", type:"perennial", h:40, w:20, sun:["full","part"], water:"med", z:[3,8], bloom:["summer","fall"], bloomColor:"#b0432a", foliage:"#4f6a3a", form:"daisy", cost:13, avail:1, tags:["pollinator","native"] },
  { id:"heleniumorange", name:"Sneezeweed 'Sahin's Early'", latin:"Helenium autumnale", type:"perennial", h:36, w:20, sun:["full","part"], water:"med", z:[3,8], bloom:["summer","fall"], bloomColor:"#e07a2a", foliage:"#4f6a3a", form:"daisy", cost:13, avail:2, tags:["pollinator","native"] },
  { id:"heleniumyellow", name:"Sneezeweed 'Butterpat'", latin:"Helenium autumnale", type:"perennial", h:54, w:24, sun:["full","part"], water:"med", z:[3,8], bloom:["summer","fall"], bloomColor:"#f0c63a", foliage:"#4f6a3a", form:"daisy", cost:13, avail:2, tags:["pollinator","native"] },
  // -- Hyssop (Agastache): orange + rose beyond blue/apricot --
  { id:"agastacheorange", name:"Hyssop 'Tango'", latin:"Agastache", type:"perennial", h:18, w:14, sun:["full"], water:"low", z:[5,9], bloom:["summer","fall"], bloomColor:"#e8742e", foliage:"#8a9a7a", form:"spike", cost:12, avail:2, tags:["pollinator","hummingbird"] },
  { id:"agastacherose", name:"Hyssop 'Rosie Posie'", latin:"Agastache", type:"perennial", h:20, w:16, sun:["full"], water:"low", z:[5,9], bloom:["summer","fall"], bloomColor:"#d05a8a", foliage:"#8a9a7a", form:"spike", cost:13, avail:2, tags:["pollinator","hummingbird"] },
  // -- Speedwell (Veronica): pink + white beyond blue (sterile, stays put) --
  { id:"veronicapink", name:"Speedwell 'Pink Damask'", latin:"Veronica spicata", type:"perennial", h:18, w:14, sun:["full"], water:"med", z:[3,8], bloom:["summer"], bloomColor:"#d878a0", foliage:"#5a7a45", form:"spike", cost:11, avail:1, tags:["pollinator"] },
  { id:"veronicawhite", name:"Speedwell 'Icicle'", latin:"Veronica spicata", type:"perennial", h:20, w:14, sun:["full"], water:"med", z:[3,8], bloom:["summer"], bloomColor:"#f0f0e8", foliage:"#5a7a45", form:"spike", cost:11, avail:2, tags:["pollinator"] },
  // -- Pinks (Dianthus): pale pink + red, silver-blue mats --
  { id:"dianthuswhite", name:"Pinks 'Bath's Pink'", latin:"Dianthus gratianopolitanus", type:"groundcover", h:8, w:12, sun:["full"], water:"low", z:[3,9], bloom:["spring","summer"], bloomColor:"#f0c8d6", foliage:"#8a9a8a", form:"mat", cost:9, avail:1, tags:["edging","fragrant","silverleaf"] },
  { id:"dianthusred", name:"Pinks 'Frosty Fire'", latin:"Dianthus", type:"groundcover", h:8, w:12, sun:["full"], water:"low", z:[3,9], bloom:["spring","summer"], bloomColor:"#c63040", foliage:"#8a9a8a", form:"mat", cost:9, avail:1, tags:["edging","fragrant","silverleaf"] },
  // -- Feather Reed Grass (Calamagrostis): variegated Overdam (sterile, stays put) --
  { id:"calamagrostisoverdam", name:"Feather Reed Grass 'Overdam'", latin:"Calamagrostis x acutiflora", type:"grass", h:42, w:24, sun:["full","part"], water:"med", z:[4,9], bloom:["summer","fall"], bloomColor:"#d8c89a", foliage:"#8aa070", form:"grass", cost:16, avail:1, tags:["vertical","silverleaf"] },
  // -- Blue Star (Amsonia): compact deep-blue 'Blue Ice' beyond tall threadleaf --
  { id:"amsoniablueice", name:"Blue Star 'Blue Ice'", latin:"Amsonia", type:"perennial", h:16, w:18, sun:["full","part"], water:"med", z:[4,9], bloom:["spring"], bloomColor:"#7a8fd0", foliage:"#5f7a4f", fallFoliage:"#e0b84a", form:"mound", cost:14, avail:2, tags:["native"] },
  // -- Blazing Star (Liatris): white + tall violet beyond dwarf purple --
  { id:"liatriswhite", name:"Blazing Star 'Floristan White'", latin:"Liatris spicata", type:"perennial", h:36, w:14, sun:["full"], water:"med", z:[3,8], bloom:["summer"], bloomColor:"#f0f0e8", foliage:"#5a7a45", form:"spike", cost:11, avail:1, tags:["pollinator","native","vertical"] },
  { id:"liatristall", name:"Blazing Star 'Floristan Violet'", latin:"Liatris spicata", type:"perennial", h:42, w:14, sun:["full"], water:"med", z:[3,8], bloom:["summer"], bloomColor:"#8a5fb0", foliage:"#5a7a45", form:"spike", cost:11, avail:2, tags:["pollinator","native","vertical"] },
  // -- Joe Pye Weed (Eutrochium): towering 'Gateway' for the back --
  { id:"joepyetall", name:"Joe Pye Weed 'Gateway'", latin:"Eutrochium maculatum", type:"perennial", h:72, w:36, sun:["full","part"], water:"med", z:[4,9], bloom:["summer","fall"], bloomColor:"#b06a8f", foliage:"#5f7a4f", form:"clump", cost:16, avail:2, tags:["pollinator","native","structure"] },
  // -- Maiden Grass (Miscanthus) [NEW]: Morning Light sterile; Zebrinus fertile (flagged) --
  { id:"miscanthusmorning", name:"Maiden Grass 'Morning Light'", latin:"Miscanthus sinensis", type:"grass", h:60, w:36, sun:["full"], water:"low", z:[5,9], bloom:["fall"], bloomColor:"#d8b0a8", foliage:"#9fb09a", fallFoliage:"#d8c49a", form:"grass", cost:18, avail:2, tags:["structure","vertical","silverleaf"] },
  { id:"miscanthusgracillimus", name:"Maiden Grass 'Gracillimus'", latin:"Miscanthus sinensis", type:"grass", h:66, w:36, sun:["full"], water:"low", z:[5,9], bloom:["fall"], bloomColor:"#c98f9a", foliage:"#7d9a6f", fallFoliage:"#d6bf8a", form:"grass", cost:17, avail:1, tags:["structure","vertical"] },
  { id:"miscanthusadagio", name:"Maiden Grass 'Adagio'", latin:"Miscanthus sinensis", type:"grass", h:42, w:30, sun:["full"], water:"low", z:[5,9], bloom:["fall"], bloomColor:"#e0b8b0", foliage:"#9aab8a", fallFoliage:"#d8c08a", form:"grass", cost:17, avail:2, tags:["structure","silverleaf"] },
  { id:"miscanthuszebra", name:"Zebra Grass 'Zebrinus'", latin:"Miscanthus sinensis", type:"grass", h:66, w:42, sun:["full"], water:"med", z:[5,9], bloom:["fall"], bloomColor:"#d6b59a", foliage:"#7faa5a", fallFoliage:"#d6b870", form:"grass", cost:18, avail:2, tags:["structure","vertical","goldleaf"] },
  // -- Hardy Hibiscus / Rose Mallow (Hibiscus moscheutos) [NEW]: dinner-plate blooms, dark foliage --
  { id:"hibiscusred", name:"Rose Mallow 'Midnight Marvel'", latin:"Hibiscus moscheutos", type:"perennial", h:48, w:48, sun:["full"], water:"high", z:[4,9], bloom:["summer","fall"], bloomColor:"#c0303a", foliage:"#3a2f37", form:"shrub", cost:24, avail:1, tags:["pollinator","native","structure","darkleaf"] },
  { id:"hibiscuspink", name:"Rose Mallow 'Evening Rose'", latin:"Hibiscus moscheutos", type:"perennial", h:44, w:48, sun:["full"], water:"high", z:[4,9], bloom:["summer","fall"], bloomColor:"#d83a78", foliage:"#3a2f37", form:"shrub", cost:24, avail:1, tags:["pollinator","native","structure","darkleaf"] },
  { id:"hibiscuswhite", name:"Rose Mallow 'Cookies and Cream'", latin:"Hibiscus moscheutos", type:"perennial", h:40, w:44, sun:["full"], water:"high", z:[4,9], bloom:["summer","fall"], bloomColor:"#f2efea", foliage:"#3a2f37", form:"shrub", cost:24, avail:1, tags:["pollinator","native","structure","darkleaf"] },

  // ===== FOUNTAIN GRASS (Pennisetum) — full range of types =====
  // hardy P. alopecuroides: full-size, true-dwarf (Hameln already = compact)
  { id:"pennisetumredhead", name:"Fountain Grass 'Red Head'", latin:"Pennisetum alopecuroides", type:"grass", h:48, w:36, sun:["full"], water:"low", z:[5,9], bloom:["summer","fall"], bloomColor:"#6a2f4a", foliage:"#6f8a4e", fallFoliage:"#cdaa72", form:"grass", cost:16, avail:2, tags:["texture","structure"] },
  { id:"pennisetumlittlebunny", name:"Fountain Grass 'Little Bunny'", latin:"Pennisetum alopecuroides", type:"grass", h:16, w:16, sun:["full"], water:"low", z:[5,9], bloom:["summer","fall"], bloomColor:"#d8bd7a", foliage:"#7a9a58", fallFoliage:"#d0b478", form:"grass", cost:12, avail:2, tags:["texture","edging"] },
  // P. orientale: well-behaved rose-plumed type (stays put)
  { id:"pennisetumkarley", name:"Oriental Fountain Grass 'Karley Rose'", latin:"Pennisetum orientale", type:"grass", h:30, w:24, sun:["full","part"], water:"med", z:[5,9], bloom:["summer","fall"], bloomColor:"#c87a9a", foliage:"#5f8a52", fallFoliage:"#d0bf8a", form:"grass", cost:16, avail:2, tags:["texture","pollinator"] },
  // P. setaceum: tender purple + variegated, grown as annuals (frost-killed, sterile)
  { id:"pennisetumrubrum", name:"Purple Fountain Grass 'Rubrum'", latin:"Pennisetum setaceum", type:"annual", h:42, w:30, sun:["full"], water:"low", z:[3,11], bloom:["summer","fall"], bloomColor:"#7e3344", foliage:"#6a2f3a", form:"grass", cost:8, avail:1, tags:["texture","darkleaf","annual"] },
  { id:"pennisetumfireworks", name:"Variegated Fountain Grass 'Fireworks'", latin:"Pennisetum setaceum", type:"annual", h:36, w:24, sun:["full"], water:"low", z:[3,11], bloom:["summer","fall"], bloomColor:"#822c40", foliage:"#a8607a", form:"grass", cost:8, avail:1, tags:["texture","annual"] },

  // ===== MORE GRASSES — native prairie + blue/silver + shade sedges =====
  // Little bluestem (Schizachyrium scoparium) cultivars — native, fiery fall, self-seed
  { id:"littlebluestemovation", name:"Little Bluestem 'Standing Ovation'", latin:"Schizachyrium scoparium", type:"grass", h:48, w:18, sun:["full"], water:"low", z:[3,9], bloom:["fall"], bloomColor:"#d6b46e", foliage:"#7e9a78", fallFoliage:"#c8703a", form:"grass", cost:15, avail:2, tags:["native","vertical","structure"] },
  { id:"littlebluestemblues", name:"Little Bluestem 'The Blues'", latin:"Schizachyrium scoparium", type:"grass", h:32, w:18, sun:["full"], water:"low", z:[3,9], bloom:["fall"], bloomColor:"#d6b46e", foliage:"#8aa890", fallFoliage:"#c87a4a", form:"grass", cost:14, avail:1, tags:["native"] },
  { id:"littlebluestemtwilight", name:"Little Bluestem 'Twilight Zone'", latin:"Schizachyrium scoparium", type:"grass", h:50, w:18, sun:["full"], water:"low", z:[3,9], bloom:["fall"], bloomColor:"#d6b46e", foliage:"#97a3ad", fallFoliage:"#9a5a6a", form:"grass", cost:15, avail:2, tags:["native","vertical","structure","silverleaf"] },
  { id:"littlebluestemcarousel", name:"Little Bluestem 'Carousel'", latin:"Schizachyrium scoparium", type:"grass", h:30, w:16, sun:["full"], water:"low", z:[3,9], bloom:["fall"], bloomColor:"#d6b46e", foliage:"#84987c", fallFoliage:"#c8785a", form:"grass", cost:14, avail:2, tags:["native","texture"] },
  // Big bluestem (Andropogon gerardii) 'Blackhawks' — tall, near-black foliage
  { id:"bigbluestem", name:"Big Bluestem 'Blackhawks'", latin:"Andropogon gerardii", type:"grass", h:60, w:24, sun:["full"], water:"low", z:[3,9], bloom:["fall"], bloomColor:"#7e3548", foliage:"#4a3a44", fallFoliage:"#5a3a48", form:"grass", cost:16, avail:2, tags:["native","vertical","structure","darkleaf"] },
  // Blue grama (Bouteloua gracilis) 'Blonde Ambition' — chartreuse flag seedheads
  { id:"bluegrama", name:"Blue Grama 'Blonde Ambition'", latin:"Bouteloua gracilis", type:"grass", h:28, w:20, sun:["full"], water:"low", z:[4,9], bloom:["summer","fall"], bloomColor:"#c8c060", foliage:"#88a07a", fallFoliage:"#c9a04a", form:"grass", cost:15, avail:2, tags:["native","texture"] },
  // Purple love grass (Eragrostis spectabilis) — airy purple haze, native
  { id:"lovegrass", name:"Purple Love Grass", latin:"Eragrostis spectabilis", type:"grass", h:20, w:20, sun:["full"], water:"low", z:[5,9], bloom:["summer","fall"], bloomColor:"#9a6a9a", foliage:"#6f8a52", fallFoliage:"#b0884a", form:"grass", cost:13, avail:3, tags:["native","airy","texture"] },
  // Northern sea oats (Chasmanthium latifolium) — flat oat seedheads, shade-tolerant; self-seeds hard
  { id:"seaoats", name:"Northern Sea Oats", latin:"Chasmanthium latifolium", type:"grass", h:36, w:24, sun:["full","part"], water:"med", z:[3,8], bloom:["summer","fall"], bloomColor:"#c9a86e", foliage:"#6f8f55", fallFoliage:"#b0823a", form:"grass", cost:14, avail:2, tags:["native","texture","shade"] },
  // Autumn moor grass (Sesleria autumnalis) — fine well-behaved matrix grass
  { id:"moorgrass", name:"Autumn Moor Grass", latin:"Sesleria autumnalis", type:"grass", h:16, w:16, sun:["full","part"], water:"med", z:[5,9], bloom:["fall"], bloomColor:"#cabf90", foliage:"#8aa24e", fallFoliage:"#c0b46a", form:"grass", cost:14, avail:3, tags:["texture","edging"] },
  // Blue oat grass (Helictotrichon sempervirens) — steel-blue spiky mound, evergreenish
  { id:"blueoat", name:"Blue Oat Grass", latin:"Helictotrichon sempervirens", type:"grass", h:26, w:24, sun:["full"], water:"low", z:[4,8], bloom:["summer"], bloomColor:"#cabf90", foliage:"#8aa6b6", form:"grass", cost:15, avail:1, tags:["silverleaf","structure","texture"] },
  // Blue fescue (Festuca glauca) 'Elijah Blue' — compact silver-blue edging mound
  { id:"bluefescue", name:"Blue Fescue 'Elijah Blue'", latin:"Festuca glauca", type:"grass", h:10, w:12, sun:["full"], water:"low", z:[4,8], bloom:["summer"], bloomColor:"#c8bf95", foliage:"#9ab2c2", form:"grass", cost:11, avail:1, tags:["silverleaf","edging"] },
  // Native shade sedges (Carex) — groundcover / matrix, spread slowly by rhizome
  { id:"pennsedge", name:"Pennsylvania Sedge", latin:"Carex pensylvanica", type:"grass", h:8, w:14, sun:["part","shade"], water:"low", z:[3,8], bloom:[], bloomColor:"#9aa86a", foliage:"#6f9050", form:"grass", cost:12, avail:2, tags:["native","shade","edging"] },
  { id:"palmsedge", name:"Palm Sedge", latin:"Carex muskingumensis", type:"grass", h:24, w:22, sun:["part","shade"], water:"med", z:[4,9], bloom:[], bloomColor:"#9aa86a", foliage:"#6f9456", form:"grass", cost:13, avail:2, tags:["native","shade","texture"] },
  // Switchgrass (Panicum) 'Cheyenne Sky' — dwarf, wine-red, native
  { id:"switchcheyenne", name:"Switchgrass 'Cheyenne Sky'", latin:"Panicum virgatum", type:"grass", h:36, w:20, sun:["full"], water:"low", z:[4,9], bloom:["fall"], bloomColor:"#c9a86e", foliage:"#7a8a5a", fallFoliage:"#9a4a52", form:"grass", cost:15, avail:2, tags:["native","vertical"] },
  // Prairie dropseed (Sporobolus heterolepis) 'Tara' — compact, more upright
  { id:"dropseedtara", name:"Prairie Dropseed 'Tara'", latin:"Sporobolus heterolepis", type:"grass", h:28, w:24, sun:["full"], water:"low", z:[3,9], bloom:["fall"], bloomColor:"#d6b46e", foliage:"#7a9458", fallFoliage:"#c89a4a", form:"grass", cost:15, avail:3, tags:["native","texture"] },

  // ===== CULTIVAR EXPANSION - BATCH 4 (airy / structural New-Perennial) =====
  // Astrantia (masterwort) - NEW genus; pincushion bracts, part-shade/moist, cool-summer z4-7. Not invasive.
  { id:"astrantiaroma", name:"Masterwort 'Roma'", latin:"Astrantia major", type:"perennial", h:24, w:18, sun:["full","part"], water:"med", z:[4,7], bloom:["summer"], bloomColor:"#c98aa8", foliage:"#5f7a4e", form:"globe", cost:16, avail:2, tags:["pollinator","texture","shade"] },
  { id:"astrantiaclaret", name:"Masterwort 'Claret'", latin:"Astrantia major", type:"perennial", h:28, w:18, sun:["full","part"], water:"med", z:[4,7], bloom:["summer"], bloomColor:"#7e2f44", foliage:"#557049", form:"globe", cost:16, avail:2, tags:["pollinator","texture","shade"] },
  { id:"astrantiawhite", name:"Masterwort 'Large White'", latin:"Astrantia major", type:"perennial", h:30, w:20, sun:["full","part"], water:"med", z:[4,7], bloom:["summer"], bloomColor:"#e8ece0", foliage:"#5f7a4e", form:"globe", cost:16, avail:2, tags:["pollinator","texture","shade"] },
  { id:"astrantiaruby", name:"Masterwort 'Ruby Wedding'", latin:"Astrantia major", type:"perennial", h:28, w:18, sun:["full","part"], water:"med", z:[4,7], bloom:["summer"], bloomColor:"#8e3550", foliage:"#557049", form:"globe", cost:16, avail:3, tags:["pollinator","texture","shade"] },
  // Sanguisorba (burnet) - airy bottlebrushes on wiry stems; self-seed. Match base officinalis.
  { id:"sangblackthorn", name:"Burnet 'Blackthorn'", latin:"Sanguisorba", type:"perennial", h:66, w:24, sun:["full","part"], water:"med", z:[4,8], bloom:["summer","fall"], bloomColor:"#5e2536", foliage:"#6f8a6a", form:"spike", cost:18, avail:3, tags:["texture","pollinator","structure","airy","emergent"] },
  { id:"sangtanna", name:"Burnet 'Tanna'", latin:"Sanguisorba officinalis", type:"perennial", h:20, w:14, sun:["full","part"], water:"med", z:[4,8], bloom:["summer","fall"], bloomColor:"#7e2f44", foliage:"#6f8a6a", form:"spike", cost:15, avail:2, tags:["texture","pollinator"] },
  { id:"sangcangshan", name:"Burnet 'Cangshan Cranberry'", latin:"Sanguisorba", type:"perennial", h:66, w:20, sun:["full","part"], water:"med", z:[4,8], bloom:["summer","fall"], bloomColor:"#7a3548", foliage:"#7a948a", form:"spike", cost:18, avail:3, tags:["texture","pollinator","structure","airy","emergent"] },
  { id:"sangmenziesii", name:"Menzies' Burnet", latin:"Sanguisorba menziesii", type:"perennial", h:42, w:22, sun:["full","part"], water:"med", z:[3,8], bloom:["summer"], bloomColor:"#a8425e", foliage:"#6f8a6a", form:"spike", cost:17, avail:3, tags:["texture","pollinator","structure","airy"] },
  // Thalictrum (meadow rue) - tall airy veils; self-seed. Match base thalictrum.
  { id:"thalblackstockings", name:"Meadow Rue 'Black Stockings'", latin:"Thalictrum", type:"perennial", h:56, w:24, sun:["full","part"], water:"med", z:[4,8], bloom:["summer"], bloomColor:"#c08ab0", foliage:"#7a8e80", form:"spike", cost:18, avail:3, tags:["airy","emergent","vertical","texture","structure"] },
  { id:"thallavendermist", name:"Meadow Rue 'Lavender Mist'", latin:"Thalictrum rochebrunianum", type:"perennial", h:84, w:30, sun:["full","part"], water:"med", z:[4,8], bloom:["summer"], bloomColor:"#b89ad0", foliage:"#7f9484", form:"spike", cost:18, avail:2, tags:["airy","emergent","vertical","texture","structure"] },
  { id:"thalsplendide", name:"Meadow Rue 'Splendide White'", latin:"Thalictrum delavayi", type:"perennial", h:60, w:24, sun:["full","part"], water:"med", z:[4,7], bloom:["summer"], bloomColor:"#eef0f2", foliage:"#7f9484", form:"spike", cost:18, avail:3, tags:["airy","emergent","vertical","texture","structure"] },
  // Veronicastrum (Culver root) - native vertical candelabra; self-seed. Match base virginicum.
  { id:"veronicasfascination", name:"Culver's Root 'Fascination'", latin:"Veronicastrum virginicum", type:"perennial", h:58, w:24, sun:["full","part"], water:"med", z:[3,8], bloom:["summer"], bloomColor:"#bfa6d4", foliage:"#46682f", form:"spike", cost:17, avail:2, tags:["native","pollinator","structure","vertical","airy","emergent"] },
  { id:"veronicasalbum", name:"Culver's Root 'Album'", latin:"Veronicastrum virginicum", type:"perennial", h:54, w:22, sun:["full","part"], water:"med", z:[3,8], bloom:["summer"], bloomColor:"#eef0ee", foliage:"#46682f", form:"spike", cost:17, avail:3, tags:["native","pollinator","structure","vertical","airy","emergent"] },
  { id:"veronicaserica", name:"Culver's Root 'Erica'", latin:"Veronicastrum virginicum", type:"perennial", h:48, w:22, sun:["full","part"], water:"med", z:[3,8], bloom:["summer"], bloomColor:"#e0c4d2", foliage:"#46682f", form:"spike", cost:17, avail:3, tags:["native","pollinator","structure","vertical","airy"] },
  // Knautia (meadow scabious) - NEW genus; crimson pincushions, prolific self-seeder.
  { id:"knautia", name:"Macedonian Scabious", latin:"Knautia macedonica", type:"perennial", h:28, w:20, sun:["full"], water:"low", z:[5,9], bloom:["summer","fall"], bloomColor:"#9a2f4a", foliage:"#6f8a52", form:"globe", cost:14, avail:2, tags:["pollinator","airy","texture"] },

  // ===== CULTIVAR EXPANSION - BATCH 5 (shade workhorses) =====
  // Brunnera (Siberian bugloss) - silver foliage, blue spring sprays; variegated forms barely spread (stay-put).
  { id:"brunnerajack", name:"Brunnera 'Jack Frost'", latin:"Brunnera macrophylla", type:"perennial", h:14, w:16, sun:["part","shade"], water:"med", z:[3,8], bloom:["spring"], bloomColor:"#7d97c4", foliage:"#b8c4bc", form:"mound", cost:16, avail:1, tags:["foliage","shade","silverleaf"] },
  { id:"brunneralooking", name:"Brunnera 'Looking Glass'", latin:"Brunnera macrophylla", type:"perennial", h:12, w:16, sun:["part","shade"], water:"med", z:[3,8], bloom:["spring"], bloomColor:"#8aa0c8", foliage:"#c8d2cb", form:"mound", cost:17, avail:1, tags:["foliage","shade","silverleaf"] },
  { id:"brunneravariegata", name:"Brunnera 'Variegata'", latin:"Brunnera macrophylla", type:"perennial", h:14, w:18, sun:["part","shade"], water:"med", z:[3,8], bloom:["spring"], bloomColor:"#7d97c4", foliage:"#cdd4ba", form:"mound", cost:16, avail:3, tags:["foliage","shade"] },
  // Pulmonaria (lungwort) - spotted/silver foliage, early pink-blue clusters; named hybrids are clumping (stay-put).
  { id:"lungwortraspberry", name:"Lungwort 'Raspberry Splash'", latin:"Pulmonaria", type:"perennial", h:12, w:16, sun:["part","shade"], water:"med", z:[3,8], bloom:["spring"], bloomColor:"#a85a8a", foliage:"#7f9384", form:"mound", cost:15, avail:1, tags:["foliage","shade","edging"] },
  { id:"lungworttrevi", name:"Lungwort 'Trevi Fountain'", latin:"Pulmonaria", type:"perennial", h:14, w:16, sun:["part","shade"], water:"med", z:[3,8], bloom:["spring"], bloomColor:"#5a6ec0", foliage:"#7f9384", form:"mound", cost:15, avail:2, tags:["foliage","shade","edging"] },
  { id:"lungwortsilver", name:"Lungwort 'Silver Bouquet'", latin:"Pulmonaria", type:"perennial", h:12, w:16, sun:["part","shade"], water:"med", z:[3,8], bloom:["spring"], bloomColor:"#b07ab0", foliage:"#9aa8a0", form:"mound", cost:16, avail:2, tags:["foliage","shade","edging","silverleaf"] },
  // Tiarella (foamflower) - native; frothy spring spikes over cut, dark-marked leaves; clumping selections (stay-put).
  { id:"foamflowerspring", name:"Foamflower 'Spring Symphony'", latin:"Tiarella", type:"perennial", h:10, w:12, sun:["part","shade"], water:"med", z:[4,9], bloom:["spring"], bloomColor:"#f0dce6", foliage:"#5f8a4e", form:"mat", cost:15, avail:1, tags:["native","shade","texture"] },
  { id:"foamflowersugar", name:"Foamflower 'Sugar and Spice'", latin:"Tiarella", type:"perennial", h:10, w:14, sun:["part","shade"], water:"med", z:[4,9], bloom:["spring"], bloomColor:"#f0dce6", foliage:"#5a8048", form:"mat", cost:15, avail:2, tags:["native","shade","texture"] },
  { id:"foamflowerskyrocket", name:"Foamflower 'Pink Skyrocket'", latin:"Tiarella", type:"perennial", h:12, w:12, sun:["part","shade"], water:"med", z:[4,9], bloom:["spring"], bloomColor:"#ecc8d8", foliage:"#557a45", form:"mat", cost:15, avail:2, tags:["native","shade","texture"] },
  // Epimedium (barrenwort) - tough dry-shade groundcover; Frohnleiten runs by rhizome (travels), others clump.
  { id:"epimediumfrohnleiten", name:"Barrenwort 'Frohnleiten'", latin:"Epimedium perralchicum", type:"perennial", h:14, w:18, sun:["part","shade"], water:"low", z:[5,8], bloom:["spring"], bloomColor:"#f0d65a", foliage:"#5f7a45", fallFoliage:"#9a5a32", form:"mat", cost:16, avail:2, tags:["shade","foliage","edging","texture"] },
  { id:"epimediumlilafee", name:"Barrenwort 'Lilafee'", latin:"Epimedium grandiflorum", type:"perennial", h:12, w:14, sun:["part","shade"], water:"low", z:[4,8], bloom:["spring"], bloomColor:"#8a6ac0", foliage:"#5f7a45", form:"mat", cost:16, avail:3, tags:["shade","foliage","edging","texture"] },
  { id:"epimediumrubrum", name:"Red Barrenwort", latin:"Epimedium rubrum", type:"perennial", h:12, w:16, sun:["part","shade"], water:"low", z:[4,8], bloom:["spring"], bloomColor:"#c05a5a", foliage:"#5f7a45", fallFoliage:"#9a4a3a", form:"mat", cost:16, avail:2, tags:["shade","foliage","edging","texture"] },
  { id:"epimediumamber", name:"Barrenwort 'Amber Queen'", latin:"Epimedium", type:"perennial", h:14, w:18, sun:["part","shade"], water:"low", z:[5,8], bloom:["spring"], bloomColor:"#d99a4a", foliage:"#5f7a45", form:"mat", cost:18, avail:3, tags:["shade","foliage","edging","texture"] },
  // Bonus shade gems: gold-leaf + long-blooming bleeding hearts, caramel foamy bells.
  { id:"bleedingheartgold", name:"Bleeding Heart 'Gold Heart'", latin:"Lamprocapnos spectabilis", type:"perennial", h:28, w:28, sun:["part","shade"], water:"med", z:[3,9], bloom:["spring"], bloomColor:"#e58fb0", foliage:"#b0bf50", form:"mound", cost:18, avail:2, tags:["shade","goldleaf"] },
  { id:"dicentraluxuriant", name:"Fringed Bleeding Heart 'Luxuriant'", latin:"Dicentra formosa", type:"perennial", h:14, w:18, sun:["part","shade"], water:"med", z:[3,9], bloom:["spring","summer"], bloomColor:"#d06a86", foliage:"#7a948a", form:"mound", cost:15, avail:2, tags:["shade","texture"] },
  { id:"heucherellasweet", name:"Foamy Bells 'Sweet Tea'", latin:"Heucherella", type:"perennial", h:16, w:22, sun:["part","shade"], water:"med", z:[4,9], bloom:["summer"], bloomColor:"#f2e2e8", foliage:"#c08a4a", form:"mound", cost:18, avail:2, tags:["foliage","goldleaf","shade"] },

  // ===== CULTIVAR EXPANSION - BATCH 6 (hot accents: Kniphofia + Crocosmia) =====
  // Kniphofia (red hot poker) - clumping (stay-put), full sun, hummingbird torches. fiery + sunset.
  { id:"kniphofiapapaya", name:"Red Hot Poker 'Papaya Popsicle'", latin:"Kniphofia", type:"perennial", h:22, w:18, sun:["full"], water:"med", z:[5,9], bloom:["summer","fall"], bloomColor:"#e07a30", foliage:"#6f8a6a", form:"spike", cost:16, avail:1, tags:["pollinator","vertical"] },
  { id:"kniphofiapineapple", name:"Red Hot Poker 'Pineapple Popsicle'", latin:"Kniphofia", type:"perennial", h:20, w:18, sun:["full"], water:"med", z:[5,9], bloom:["summer","fall"], bloomColor:"#e8c23a", foliage:"#6f8a6a", form:"spike", cost:16, avail:2, tags:["pollinator","vertical"] },
  { id:"kniphofiaroyal", name:"Red Hot Poker 'Royal Standard'", latin:"Kniphofia", type:"perennial", h:36, w:20, sun:["full"], water:"med", z:[5,9], bloom:["summer"], bloomColor:"#e0552a", foliage:"#6f8a6a", form:"spike", cost:17, avail:2, tags:["pollinator","vertical","emergent","structure"] },
  { id:"kniphofiaalcazar", name:"Red Hot Poker 'Alcazar'", latin:"Kniphofia", type:"perennial", h:36, w:20, sun:["full"], water:"med", z:[6,9], bloom:["summer"], bloomColor:"#db4f28", foliage:"#6f8a6a", form:"spike", cost:17, avail:3, tags:["pollinator","vertical","emergent","structure"] },
  { id:"kniphofiapercy", name:"Red Hot Poker 'Percy's Pride'", latin:"Kniphofia", type:"perennial", h:36, w:20, sun:["full"], water:"med", z:[5,9], bloom:["summer","fall"], bloomColor:"#c2c64e", foliage:"#6f8a6a", form:"spike", cost:17, avail:3, tags:["pollinator","vertical","emergent","structure"] },
  { id:"kniphofiafireglow", name:"Red Hot Poker 'Fire Glow'", latin:"Kniphofia", type:"perennial", h:42, w:22, sun:["full"], water:"med", z:[6,9], bloom:["summer"], bloomColor:"#d23a26", foliage:"#6f8a6a", form:"spike", cost:17, avail:2, tags:["pollinator","vertical","emergent","structure"] },
  // Crocosmia - corm spreaders (travel). Lucifer = masoniorum hybrid, better-behaved, kept everywhere.
  { id:"crocosmialucifer", name:"Crocosmia 'Lucifer'", latin:"Crocosmia masoniorum", type:"perennial", h:42, w:20, sun:["full"], water:"med", z:[5,9], bloom:["summer"], bloomColor:"#cf2f24", foliage:"#4f7240", form:"spike", cost:16, avail:1, tags:["pollinator","vertical","emergent","structure"] },
  // Old montbretia-type cultivars = Crocosmia x crocosmiiflora -> flagged invasive in CA/OR/WA/HI.
  { id:"crocosmiaemily", name:"Crocosmia 'Emily McKenzie'", latin:"Crocosmia x crocosmiiflora", type:"perennial", h:28, w:16, sun:["full","part"], water:"med", z:[6,9], bloom:["summer","fall"], bloomColor:"#e06a28", foliage:"#4a6a3a", form:"spike", cost:14, avail:3, tags:["pollinator","vertical"] },
  { id:"crocosmiageorge", name:"Crocosmia 'George Davison'", latin:"Crocosmia x crocosmiiflora", type:"perennial", h:24, w:14, sun:["full"], water:"med", z:[6,9], bloom:["summer"], bloomColor:"#e8b832", foliage:"#4f7240", form:"spike", cost:14, avail:3, tags:["pollinator","vertical"] },
  { id:"crocosmiastar", name:"Crocosmia 'Star of the East'", latin:"Crocosmia x crocosmiiflora", type:"perennial", h:30, w:16, sun:["full"], water:"med", z:[6,9], bloom:["summer","fall"], bloomColor:"#e89248", foliage:"#4f7240", form:"spike", cost:15, avail:3, tags:["pollinator","vertical"] },
  { id:"crocosmiasolfatare", name:"Crocosmia 'Solfatare'", latin:"Crocosmia x crocosmiiflora", type:"perennial", h:24, w:14, sun:["full"], water:"med", z:[6,9], bloom:["summer"], bloomColor:"#e0b060", foliage:"#6a5a3a", form:"spike", cost:15, avail:3, tags:["pollinator","vertical","darkleaf"] },
  { id:"crocosmiaprince", name:"Crocosmia 'Prince of Orange'", latin:"Crocosmia x crocosmiiflora", type:"perennial", h:28, w:14, sun:["full"], water:"med", z:[6,9], bloom:["summer"], bloomColor:"#e07830", foliage:"#4f7240", form:"spike", cost:14, avail:3, tags:["pollinator","vertical"] },
  { id:"campanulablue", name:"Carpathian Bellflower 'Blue Clips'", latin:"Campanula carpatica", type:"perennial", h:10, w:12, sun:["full","part"], water:"med", z:[3,8], bloom:["summer"], bloomColor:"#6f8fd8", foliage:"#4f7240", form:"mound", cost:10, avail:1, tags:["edging","pollinator"] },
  { id:"campanulapers", name:"Peach-leaf Bellflower", latin:"Campanula persicifolia", type:"perennial", h:30, w:14, sun:["full","part"], water:"med", z:[3,8], bloom:["summer"], bloomColor:"#7e95d6", foliage:"#4f7240", form:"spike", cost:11, avail:2, tags:["pollinator","vertical"] },
  { id:"campanulasarastro", name:"Bellflower 'Sarastro'", latin:"Campanula", type:"perennial", h:22, w:16, sun:["full","part"], water:"med", z:[4,8], bloom:["summer"], bloomColor:"#7a6bc4", foliage:"#4f7240", form:"spike", cost:13, avail:2, tags:["pollinator"] },
  { id:"tradescantia", name:"Spiderwort 'Sweet Kate'", latin:"Tradescantia x andersoniana", type:"perennial", h:16, w:16, sun:["full","part"], water:"med", z:[4,9], bloom:["summer"], bloomColor:"#5a63c0", foliage:"#b9c24a", form:"clump", cost:12, avail:1, tags:["goldleaf","pollinator"] },
  { id:"tradescantiaconcord", name:"Spiderwort 'Concord Grape'", latin:"Tradescantia x andersoniana", type:"perennial", h:18, w:16, sun:["full","part"], water:"med", z:[4,9], bloom:["summer"], bloomColor:"#6a4fa0", foliage:"#6f8a5e", form:"clump", cost:12, avail:2, tags:["pollinator"] },
  { id:"gaillardia", name:"Blanket Flower 'Arizona Sun'", latin:"Gaillardia x grandiflora", type:"perennial", h:12, w:14, sun:["full"], water:"low", z:[3,9], bloom:["summer","fall"], bloomColor:"#e06a2a", foliage:"#6a8050", form:"daisy", cost:10, avail:1, tags:["pollinator"] },
  { id:"helianthuslemon", name:"Perennial Sunflower 'Lemon Queen'", latin:"Helianthus", type:"perennial", h:84, w:48, sun:["full"], water:"med", z:[4,9], bloom:["summer","fall"], bloomColor:"#f0e06a", foliage:"#5a7340", form:"daisy", cost:16, avail:2, tags:["native","pollinator","structure","emergent"] },
  { id:"filipendula", name:"Queen of the Prairie", latin:"Filipendula rubra", type:"perennial", h:72, w:36, sun:["full","part"], water:"high", z:[3,9], bloom:["summer"], bloomColor:"#e487a8", foliage:"#4a6c34", form:"spike", cost:16, avail:2, tags:["native","structure","moist","texture"] },
  { id:"aruncus",inflor:"panicle", name:"Goat's Beard", latin:"Aruncus dioicus", type:"perennial", h:60, w:36, sun:["part","full"], water:"high", z:[3,7], bloom:["summer"], bloomColor:"#f3f1e4", foliage:"#46682f", form:"spike", cost:18, avail:2, tags:["native","structure","shade","texture"] },
  { id:"chelone", name:"Turtlehead 'Hot Lips'", latin:"Chelone lyonii", type:"perennial", h:30, w:20, sun:["full","part"], water:"high", z:[3,8], bloom:["fall"], bloomColor:"#e07ba0", foliage:"#3f6535", form:"spike", cost:13, avail:2, tags:["native","pollinator","moist"] },
  { id:"physostegia", name:"Obedient Plant 'Miss Manners'", latin:"Physostegia virginiana", type:"perennial", h:28, w:20, sun:["full","part"], water:"high", z:[3,9], bloom:["summer"], bloomColor:"#f6f7ef", foliage:"#3f6235", form:"spike", cost:12, avail:2, tags:["native","pollinator"] },
  { id:"stokesia", name:"Stokes' Aster 'Peachie's Pick'", latin:"Stokesia laevis", type:"perennial", h:16, w:16, sun:["full"], water:"med", z:[5,9], bloom:["summer"], bloomColor:"#7d8fcf", foliage:"#4a6c34", form:"daisy", cost:12, avail:2, tags:["native","pollinator"] },
  { id:"thermopsis", name:"Carolina Lupine", latin:"Thermopsis villosa", type:"perennial", h:48, w:30, sun:["full","part"], water:"med", z:[3,9], bloom:["spring","summer"], bloomColor:"#f0d24a", foliage:"#6f8f5e", form:"spike", cost:14, avail:3, tags:["native","structure","vertical","pollinator"] },
  { id:"painteddaisy", name:"Painted Daisy 'Robinson's Red'", latin:"Tanacetum coccineum", type:"perennial", h:26, w:18, sun:["full"], water:"med", z:[3,7], bloom:["summer"], bloomColor:"#c0314a", foliage:"#4a6c34", form:"daisy", cost:11, avail:2, tags:["pollinator"] },
  { id:"swampmilkweedcinderella",inflor:"umbel", name:"Swamp Milkweed 'Cinderella'", latin:"Asclepias incarnata", type:"perennial", h:42, w:24, sun:["full"], water:"high", z:[3,9], bloom:["summer"], bloomColor:"#df7a9c", foliage:"#5a7a45", form:"clump", cost:12, avail:1, tags:["native","pollinator","moist"] },
  { id:"asiaticlily", name:"Asiatic Lily", latin:"Lilium", type:"bulb", h:36, w:10, sun:["full","part"], water:"med", z:[3,9], bloom:["summer"], bloomColor:"#e8742e", foliage:"#4f6f3a", form:"spike", cost:8, avail:1, tags:["bulb","vertical","pollinator"] },
  { id:"orientalstargazer", name:"Oriental Lily 'Stargazer'", latin:"Lilium", type:"bulb", h:36, w:12, sun:["full","part"], water:"med", z:[4,9], bloom:["summer"], bloomColor:"#c43048", foliage:"#4a6a38", form:"spike", cost:9, avail:1, tags:["bulb","vertical","pollinator"] },
  { id:"orientalcasablanca", name:"Oriental Lily 'Casa Blanca'", latin:"Lilium", type:"bulb", h:42, w:12, sun:["full","part"], water:"med", z:[4,9], bloom:["summer"], bloomColor:"#f6f4ec", foliage:"#4a6a38", form:"spike", cost:10, avail:1, tags:["bulb","vertical","pollinator"] },
  { id:"tigerlily", name:"Tiger Lily", latin:"Lilium lancifolium", type:"bulb", h:48, w:12, sun:["full","part"], water:"med", z:[3,9], bloom:["summer"], bloomColor:"#e8702a", foliage:"#4f6f3a", form:"spike", cost:7, avail:1, tags:["bulb","vertical","pollinator"] },
  { id:"crocus", name:"Dutch Crocus", latin:"Crocus vernus", type:"bulb", h:5, w:3, sun:["full","part"], water:"med", z:[3,8], bloom:["spring"], bloomColor:"#8466bb", foliage:"#6f8a4e", form:"bulbflower", cost:1, avail:1, tags:["bulb","spring"] },
  { id:"muscari", name:"Grape Hyacinth", latin:"Muscari armeniacum", type:"bulb", h:8, w:4, sun:["full","part"], water:"med", z:[4,8], bloom:["spring"], bloomColor:"#4a52a0", foliage:"#6f8a4e", form:"spike", cost:1, avail:1, tags:["bulb","spring"] },
  { id:"hyacinth", name:"Dutch Hyacinth", latin:"Hyacinthus orientalis", type:"bulb", h:10, w:5, sun:["full","part"], water:"med", z:[4,8], bloom:["spring"], bloomColor:"#6a5fb8", foliage:"#6f8a4e", form:"spike", cost:3, avail:1, tags:["bulb","spring"] },
  { id:"galanthus", name:"Snowdrop", latin:"Galanthus nivalis", type:"bulb", h:6, w:3, sun:["full","part"], water:"med", z:[3,8], bloom:["spring"], bloomColor:"#f4f4ee", foliage:"#6f8a4e", form:"bulbflower", cost:2, avail:1, tags:["bulb","spring"] },
  { id:"scilla", name:"Siberian Squill", latin:"Scilla siberica", type:"bulb", h:5, w:3, sun:["full","part"], water:"med", z:[3,8], bloom:["spring"], bloomColor:"#4f6fc0", foliage:"#6f8a4e", form:"bulbflower", cost:1, avail:1, tags:["bulb","spring"] },
  { id:"chionodoxa", name:"Glory-of-the-Snow", latin:"Scilla forbesii", type:"bulb", h:5, w:3, sun:["full","part"], water:"med", z:[3,8], bloom:["spring"], bloomColor:"#6f8fd0", foliage:"#6f8a4e", form:"bulbflower", cost:1, avail:1, tags:["bulb","spring"] },
  { id:"fritillariameleagris", name:"Checkered Lily", latin:"Fritillaria meleagris", type:"bulb", h:10, w:3, sun:["full","part"], water:"med", z:[3,8], bloom:["spring"], bloomColor:"#8a5a86", foliage:"#6f8a4e", form:"bulbflower", cost:3, avail:2, tags:["bulb","spring","moist"] },
  { id:"fritillariaimperialis", name:"Crown Imperial", latin:"Fritillaria imperialis", type:"bulb", h:36, w:10, sun:["full","part"], water:"med", z:[5,8], bloom:["spring"], bloomColor:"#e8732a", foliage:"#5a7340", form:"spike", cost:8, avail:2, tags:["bulb","spring","structure","vertical"] },
  { id:"leucojum", name:"Summer Snowflake", latin:"Leucojum aestivum", type:"bulb", h:18, w:6, sun:["full","part"], water:"med", z:[4,9], bloom:["spring"], bloomColor:"#eef0e4", foliage:"#6f8a4e", form:"bulbflower", cost:3, avail:1, tags:["bulb","spring"] },
  { id:"eranthis", name:"Winter Aconite", latin:"Eranthis hyemalis", type:"bulb", h:4, w:3, sun:["full","part"], water:"med", z:[4,8], bloom:["spring"], bloomColor:"#f2d23a", foliage:"#6f8a4e", form:"bulbflower", cost:2, avail:2, tags:["bulb","spring"] },
  { id:"irisreticulata", name:"Dwarf Iris", latin:"Iris reticulata", type:"bulb", h:5, w:3, sun:["full","part"], water:"med", z:[5,9], bloom:["spring"], bloomColor:"#4a4fa0", foliage:"#6f8a4e", form:"bulbflower", cost:2, avail:1, tags:["bulb","spring"] },
  { id:"lilac", name:"Common Lilac", latin:"Syringa vulgaris", type:"shrub", h:120, w:96, sun:["full","part"], water:"med", z:[3,7], bloom:["spring"], bloomColor:"#9a7bc0", foliage:"#5a7340", form:"shrub", cost:28, avail:1, tags:["structure","pollinator"] },
  { id:"lilacmisskim", name:"Lilac 'Miss Kim'", latin:"Syringa pubescens", type:"shrub", h:72, w:60, sun:["full","part"], water:"med", z:[3,8], bloom:["spring"], bloomColor:"#b6a0d4", foliage:"#5a7340", form:"shrub", cost:30, avail:1, tags:["structure","pollinator"] },
  { id:"lilacbloomerang", name:"Reblooming Lilac 'Bloomerang'", latin:"Syringa x", type:"shrub", h:54, w:54, sun:["full","part"], water:"med", z:[3,7], bloom:["spring","summer","fall"], bloomColor:"#9a6fbe", foliage:"#5a7340", form:"shrub", cost:32, avail:1, tags:["structure","pollinator"] },
  { id:"viburnumcarlesii", name:"Koreanspice Viburnum", latin:"Viburnum carlesii", type:"shrub", h:60, w:60, sun:["full","part"], water:"med", z:[4,7], bloom:["spring"], bloomColor:"#f0e6ec", foliage:"#4f6f3a", fallFoliage:"#b0503a", form:"shrub", cost:30, avail:1, tags:["structure","pollinator"] },
  { id:"viburnumdentatum", name:"Arrowwood Viburnum", latin:"Viburnum dentatum", type:"shrub", h:96, w:72, sun:["full","part"], water:"med", z:[3,8], bloom:["spring"], bloomColor:"#f2f2ea", foliage:"#4f6f3a", fallFoliage:"#b04a52", form:"shrub", cost:26, avail:1, tags:["native","structure"] },
  { id:"viburnumplicatum", name:"Doublefile Viburnum 'Mariesii'", latin:"Viburnum plicatum", type:"shrub", h:108, w:120, sun:["full","part"], water:"med", z:[5,8], bloom:["spring"], bloomColor:"#f4f4ec", foliage:"#4a6a38", fallFoliage:"#9a4a6a", form:"shrub", cost:34, avail:2, tags:["structure"] },
  { id:"cornusarctic", name:"Redtwig Dogwood 'Arctic Fire'", latin:"Cornus sericea", type:"shrub", h:42, w:42, sun:["full","part"], water:"high", z:[3,7], bloom:["spring"], bloomColor:"#f2f2ea", foliage:"#5a7a45", fallFoliage:"#9a4a5a", form:"shrub", cost:22, avail:1, tags:["native","structure","moist"] },
  { id:"ivoryhalo", name:"Variegated Dogwood 'Ivory Halo'", latin:"Cornus alba", type:"shrub", h:60, w:60, sun:["full","part"], water:"med", z:[3,7], bloom:["spring"], bloomColor:"#f2f2ea", foliage:"#b9ccae", form:"shrub", cost:24, avail:2, tags:["structure"] },
  { id:"clethra", name:"Summersweet 'Hummingbird'", latin:"Clethra alnifolia", type:"shrub", h:36, w:36, sun:["full","part"], water:"high", z:[4,9], bloom:["summer"], bloomColor:"#f2f0e6", foliage:"#4f6f3a", form:"shrub", cost:22, avail:2, tags:["native","structure","moist","pollinator"] },
  { id:"forsythia",silhouette:"vase", name:"Forsythia 'Lynwood Gold'", latin:"Forsythia x intermedia", type:"shrub", h:84, w:84, sun:["full","part"], water:"med", z:[4,8], bloom:["spring"], bloomColor:"#f2cf3e", foliage:"#5a7a45", form:"shrub", cost:18, avail:1, tags:["structure"] },
  { id:"hamamelis", name:"Witch Hazel 'Arnold Promise'", latin:"Hamamelis x intermedia", type:"shrub", h:144, w:120, sun:["full","part"], water:"med", z:[5,8], bloom:["spring"], bloomColor:"#f0d23a", foliage:"#5a7340", fallFoliage:"#d2802a", form:"shrub", cost:38, avail:2, tags:["structure"] },
  { id:"hypericumshrub", name:"St. John's Wort 'Sunburst'", latin:"Hypericum frondosum", type:"shrub", h:36, w:36, sun:["full","part"], water:"med", z:[5,8], bloom:["summer"], bloomColor:"#f2cf3e", foliage:"#5a7a45", form:"shrub", cost:18, avail:2, tags:["native","pollinator"] },
  { id:"rhustigereyes", name:"Tiger Eyes Sumac", latin:"Rhus typhina", type:"shrub", h:72, w:72, sun:["full","part"], water:"low", z:[4,8], bloom:["summer"], bloomColor:"#c9c47a", foliage:"#b9c24a", fallFoliage:"#d2502a", form:"shrub", cost:26, avail:1, tags:["native","goldleaf","structure"] },
  { id:"diervilla", name:"Bush Honeysuckle 'Kodiak Black'", latin:"Diervilla rivularis", type:"shrub", h:42, w:48, sun:["full","part"], water:"low", z:[3,7], bloom:["summer"], bloomColor:"#f2cf3e", foliage:"#6a4a44", form:"shrub", cost:22, avail:2, tags:["native","darkleaf","structure"] },
  { id:"calycanthus", name:"Carolina Allspice 'Aphrodite'", latin:"Calycanthus floridus", type:"shrub", h:84, w:72, sun:["full","part"], water:"med", z:[4,9], bloom:["spring","summer"], bloomColor:"#7a2f3a", foliage:"#4f6f3a", form:"shrub", cost:26, avail:2, tags:["native","structure","pollinator"] },
  { id:"sonicbloompink", name:"Weigela 'Sonic Bloom Pink'", latin:"Weigela florida", type:"shrub", h:54, w:54, sun:["full","part"], water:"med", z:[4,8], bloom:["spring","summer","fall"], bloomColor:"#d6488a", foliage:"#4f6f3a", form:"shrub", cost:28, avail:1, tags:["structure","pollinator"] },
  { id:"sonicbloomred", name:"Weigela 'Sonic Bloom Red'", latin:"Weigela florida", type:"shrub", h:54, w:54, sun:["full","part"], water:"med", z:[4,8], bloom:["spring","summer","fall"], bloomColor:"#cc2f44", foliage:"#4f6f3a", form:"shrub", cost:28, avail:1, tags:["structure","pollinator"] },
  { id:"sonicbloompearl", name:"Weigela 'Sonic Bloom Pearl'", latin:"Weigela florida", type:"shrub", h:54, w:54, sun:["full","part"], water:"med", z:[4,8], bloom:["spring","summer","fall"], bloomColor:"#f4eef0", foliage:"#4f6f3a", form:"shrub", cost:28, avail:2, tags:["structure","pollinator"] },
  { id:"sonicbloompunch", name:"Weigela 'Sonic Bloom Punch'", latin:"Weigela florida", type:"shrub", h:40, w:48, sun:["full","part"], water:"med", z:[4,8], bloom:["spring","summer","fall"], bloomColor:"#d23a7a", foliage:"#4f6f3a", form:"shrub", cost:26, avail:2, tags:["edging","pollinator"] },
  { id:"sonicbloomghost", name:"Weigela 'Sonic Bloom Ghost'", latin:"Weigela florida", type:"shrub", h:54, w:54, sun:["full","part"], water:"med", z:[4,8], bloom:["spring","summer","fall"], bloomColor:"#d63a5a", foliage:"#b9c24a", form:"shrub", cost:30, avail:2, tags:["goldleaf","structure","pollinator"] },
  { id:"sonicbloomwine", name:"Weigela 'Sonic Bloom Wine'", latin:"Weigela florida", type:"shrub", h:54, w:42, sun:["full","part"], water:"med", z:[4,8], bloom:["spring","summer","fall"], bloomColor:"#df6aa0", foliage:"#5a4a55", form:"shrub", cost:30, avail:2, tags:["darkleaf","structure","pollinator"] },
  { id:"mymonet", name:"Weigela 'My Monet'", latin:"Weigela florida", type:"shrub", h:16, w:24, sun:["full","part"], water:"med", z:[4,6], bloom:["spring","summer"], bloomColor:"#e08aae", foliage:"#b9ccae", form:"shrub", cost:24, avail:1, tags:["edging","pollinator"] },
  { id:"mymonetpurple", name:"Weigela 'My Monet Purple Effect'", latin:"Weigela florida", type:"shrub", h:22, w:24, sun:["full","part"], water:"med", z:[4,7], bloom:["spring","summer"], bloomColor:"#c87aae", foliage:"#6f8f5a", form:"shrub", cost:26, avail:2, tags:["edging","pollinator"] },
  { id:"mymonetsunset", name:"Weigela 'My Monet Sunset'", latin:"Weigela florida", type:"shrub", h:18, w:24, sun:["full","part"], water:"med", z:[4,6], bloom:["spring","summer"], bloomColor:"#e08aae", foliage:"#c0b56a", form:"shrub", cost:26, avail:2, tags:["edging","pollinator"] },
  { id:"spilledwine", name:"Weigela 'Spilled Wine'", latin:"Weigela florida", type:"shrub", h:30, w:42, sun:["full","part"], water:"med", z:[4,8], bloom:["spring","summer"], bloomColor:"#c0306a", foliage:"#5a4a55", form:"shrub", cost:24, avail:1, tags:["darkleaf","edging","pollinator"] },
  { id:"finewine", name:"Weigela 'Fine Wine'", latin:"Weigela florida", type:"shrub", h:30, w:30, sun:["full","part"], water:"med", z:[4,8], bloom:["spring","summer"], bloomColor:"#d6588e", foliage:"#5a4a55", form:"shrub", cost:24, avail:2, tags:["darkleaf","edging","pollinator"] },
  { id:"midnightwine", name:"Weigela 'Midnight Wine'", latin:"Weigela florida", type:"shrub", h:16, w:24, sun:["full","part"], water:"med", z:[4,6], bloom:["spring","summer"], bloomColor:"#d6588e", foliage:"#54424e", form:"shrub", cost:22, avail:1, tags:["darkleaf","edging","pollinator"] },
  { id:"redprince", name:"Weigela 'Red Prince'", latin:"Weigela florida", type:"shrub", h:66, w:60, sun:["full","part"], water:"med", z:[4,8], bloom:["spring","summer"], bloomColor:"#cc2f3a", foliage:"#4f6f3a", form:"shrub", cost:24, avail:2, tags:["structure","pollinator"] },
  { id:"weigelavariegata", name:"Weigela 'Variegata'", latin:"Weigela florida", type:"shrub", h:60, w:60, sun:["full","part"], water:"med", z:[4,8], bloom:["spring","summer"], bloomColor:"#e08aae", foliage:"#b9ccae", form:"shrub", cost:22, avail:2, tags:["structure","pollinator"] },
  { id:"minuet", name:"Weigela 'Minuet'", latin:"Weigela florida", type:"shrub", h:30, w:36, sun:["full","part"], water:"med", z:[3,8], bloom:["spring","summer"], bloomColor:"#c84a6e", foliage:"#6a6a58", form:"shrub", cost:22, avail:2, tags:["edging","pollinator"] },
  { id:"czechmark", name:"Weigela 'Czechmark Trilogy'", latin:"Weigela florida", type:"shrub", h:60, w:60, sun:["full","part"], water:"med", z:[4,8], bloom:["spring","summer"], bloomColor:"#df6a8e", foliage:"#5a7340", form:"shrub", cost:28, avail:2, tags:["structure","pollinator"] },
  { id:"electriclove", name:"Weigela 'Electric Love'", latin:"Weigela x", type:"shrub", h:30, w:36, sun:["full","part"], water:"med", z:[4,8], bloom:["spring","summer","fall"], bloomColor:"#cc344a", foliage:"#5a4a4a", form:"shrub", cost:26, avail:2, tags:["darkleaf","edging","pollinator"] },
  { id:"tuxedo", name:"Weigela 'Tuxedo'", latin:"Weigela x", type:"shrub", h:54, w:42, sun:["full","part"], water:"med", z:[4,8], bloom:["spring","summer","fall"], bloomColor:"#f4f0ea", foliage:"#4a3f48", form:"shrub", cost:30, avail:2, tags:["darkleaf","structure","pollinator"] },
  { id:"silverbrocade", name:"Artemisia 'Silver Brocade'", latin:"Artemisia stelleriana", type:"groundcover", h:10, w:28, sun:["full","part"], water:"low", z:[3,9], bloom:[], bloomColor:"#d6dcc8", foliage:"#b9c2b2", form:"mat", cost:11, avail:2, tags:["foliage","silverleaf","edging","texture"] },
  { id:"silverlining", name:"Artemisia 'Silver Lining'", latin:"Artemisia x", type:"perennial", h:15, w:36, sun:["full","part"], water:"low", z:[4,9], bloom:[], bloomColor:"#d6dcc8", foliage:"#b6c0aa", form:"mound", cost:14, avail:2, tags:["foliage","silverleaf","texture"] },
  { id:"powiscastle", name:"Artemisia 'Powis Castle'", latin:"Artemisia x", type:"perennial", h:30, w:36, sun:["full"], water:"low", z:[5,8], bloom:[], bloomColor:"#cdd6c2", foliage:"#aebaa0", form:"mound", cost:14, avail:2, tags:["foliage","silverleaf","texture","structure"] },
  { id:"valeriefinnis", name:"Artemisia 'Valerie Finnis'", latin:"Artemisia ludoviciana", type:"perennial", h:24, w:30, sun:["full"], water:"low", z:[4,8], bloom:[], bloomColor:"#d6dcc8", foliage:"#b2bca8", form:"mound", cost:12, avail:2, tags:["foliage","silverleaf","texture"] },
  { id:"barberrycrimson", name:"Japanese Barberry 'Crimson Pygmy'", latin:"Berberis thunbergii", type:"shrub", h:22, w:30, sun:["full","part"], water:"low", z:[4,8], bloom:[], bloomColor:"#d8c860", foliage:"#6a3a44", fallFoliage:"#a83a3a", form:"shrub", cost:18, avail:1, tags:["darkleaf","edging"] },
  { id:"barberryroseglow", name:"Japanese Barberry 'Rose Glow'", latin:"Berberis thunbergii", type:"shrub", h:54, w:54, sun:["full","part"], water:"low", z:[4,8], bloom:[], bloomColor:"#d8c860", foliage:"#7a4452", fallFoliage:"#a83a3a", form:"shrub", cost:22, avail:1, tags:["darkleaf","structure"] },
  { id:"barberrygold", name:"Japanese Barberry 'Aurea'", latin:"Berberis thunbergii", type:"shrub", h:42, w:42, sun:["full","part"], water:"low", z:[4,8], bloom:[], bloomColor:"#d8c860", foliage:"#c4c44e", fallFoliage:"#d08030", form:"shrub", cost:20, avail:2, tags:["goldleaf","structure"] },
  { id:"barberryorange", name:"Japanese Barberry 'Orange Rocket'", latin:"Berberis thunbergii", type:"shrub", h:48, w:24, sun:["full","part"], water:"low", z:[4,8], bloom:[], bloomColor:"#d8c860", foliage:"#c46a3a", fallFoliage:"#c43a2a", form:"shrub", cost:22, avail:1, tags:["structure","vertical"] },
  { id:"barberryconcorde", name:"Japanese Barberry 'Concorde'", latin:"Berberis thunbergii", type:"shrub", h:22, w:24, sun:["full","part"], water:"low", z:[4,8], bloom:[], bloomColor:"#d8c860", foliage:"#5a3340", fallFoliage:"#8a2f3a", form:"shrub", cost:18, avail:2, tags:["darkleaf","edging"] },
  { id:"barberryhelmond", name:"Japanese Barberry 'Helmond Pillar'", latin:"Berberis thunbergii", type:"shrub", h:54, w:18, sun:["full","part"], water:"low", z:[4,8], bloom:[], bloomColor:"#d8c860", foliage:"#5a3340", fallFoliage:"#8a2f3a", form:"shrub", cost:22, avail:2, tags:["darkleaf","structure","vertical"] },
  { id:"barberrymini", name:"Barberry 'Sunjoy Mini Maroon'", latin:"Berberis thunbergii", type:"shrub", h:18, w:24, sun:["full","part"], water:"low", z:[4,8], bloom:[], bloomColor:"#d8c860", foliage:"#6a3a44", fallFoliage:"#a83a3a", form:"shrub", cost:24, avail:2, tags:["darkleaf","edging"] },
  { id:"barberrytodo", name:"Barberry 'Sunjoy Todo'", latin:"Berberis thunbergii", type:"shrub", h:30, w:30, sun:["full","part"], water:"low", z:[4,8], bloom:[], bloomColor:"#d8c860", foliage:"#6e3a46", fallFoliage:"#a83a3a", form:"shrub", cost:24, avail:2, tags:["darkleaf","structure"] },
  { id:"barberrycutie", name:"Barberry 'Crimson Cutie'", latin:"Berberis thunbergii", type:"shrub", h:20, w:24, sun:["full","part"], water:"low", z:[4,8], bloom:[], bloomColor:"#d8c860", foliage:"#6a3a44", fallFoliage:"#a83a3a", form:"shrub", cost:22, avail:2, tags:["darkleaf","edging"] },
  { id:"barberrylemonglow", name:"Barberry 'Lemon Glow'", latin:"Berberis thunbergii", type:"shrub", h:42, w:36, sun:["full","part"], water:"low", z:[4,8], bloom:[], bloomColor:"#d8c860", foliage:"#c8c850", fallFoliage:"#d08030", form:"shrub", cost:24, avail:2, tags:["goldleaf","structure"] },
  { id:"buddleiablack", name:"Butterfly Bush 'Black Knight'", latin:"Buddleia davidii", type:"shrub", h:84, w:60, sun:["full"], water:"low", z:[5,9], bloom:["summer","fall"], bloomColor:"#4a3a6a", foliage:"#6f8470", form:"shrub", cost:24, avail:1, tags:["structure","pollinator"] },
  { id:"buddleiaroyalred", name:"Butterfly Bush 'Royal Red'", latin:"Buddleia davidii", type:"shrub", h:84, w:60, sun:["full"], water:"low", z:[5,9], bloom:["summer","fall"], bloomColor:"#a83a54", foliage:"#6f8470", form:"shrub", cost:24, avail:2, tags:["structure","pollinator"] },
  { id:"buddleiapink", name:"Butterfly Bush 'Pink Delight'", latin:"Buddleia davidii", type:"shrub", h:72, w:54, sun:["full"], water:"low", z:[5,9], bloom:["summer","fall"], bloomColor:"#df7aa6", foliage:"#6f8470", form:"shrub", cost:22, avail:2, tags:["structure","pollinator"] },
  { id:"buddleiananho", name:"Butterfly Bush 'Nanho Blue'", latin:"Buddleia davidii", type:"shrub", h:54, w:48, sun:["full"], water:"low", z:[5,9], bloom:["summer","fall"], bloomColor:"#7a7ac0", foliage:"#6f8470", form:"shrub", cost:22, avail:2, tags:["structure","pollinator"] },
  { id:"buddleiawhite", name:"Butterfly Bush 'White Profusion'", latin:"Buddleia davidii", type:"shrub", h:72, w:54, sun:["full"], water:"low", z:[5,9], bloom:["summer","fall"], bloomColor:"#f2f0e8", foliage:"#6f8470", form:"shrub", cost:22, avail:2, tags:["structure","pollinator"] },
  { id:"buddleiabluechip", name:"Summer Lilac 'Lo & Behold Blue Chip'", latin:"Buddleia davidii", type:"shrub", h:30, w:30, sun:["full"], water:"low", z:[5,9], bloom:["summer","fall"], bloomColor:"#7a7ac8", foliage:"#6f8470", form:"shrub", cost:24, avail:2, tags:["edging","pollinator"] },
  { id:"buddleiapurplehaze", name:"Summer Lilac 'Lo & Behold Purple Haze'", latin:"Buddleia davidii", type:"shrub", h:30, w:48, sun:["full"], water:"low", z:[5,9], bloom:["summer","fall"], bloomColor:"#5a4a8a", foliage:"#6f8470", form:"shrub", cost:24, avail:2, tags:["edging","pollinator"] },
  { id:"buddleiamissmolly", name:"Butterfly Bush 'Miss Molly'", latin:"Buddleia davidii", type:"shrub", h:60, w:48, sun:["full"], water:"low", z:[5,9], bloom:["summer","fall"], bloomColor:"#b03a4a", foliage:"#6f8470", form:"shrub", cost:24, avail:1, tags:["structure","pollinator"] },
  { id:"buddleiamissruby", name:"Butterfly Bush 'Miss Ruby'", latin:"Buddleia davidii", type:"shrub", h:60, w:48, sun:["full"], water:"low", z:[5,9], bloom:["summer","fall"], bloomColor:"#c03a64", foliage:"#6f8470", form:"shrub", cost:24, avail:2, tags:["structure","pollinator"] },
  { id:"buddleiaasianmoon", name:"Butterfly Bush 'Asian Moon'", latin:"Buddleia davidii", type:"shrub", h:66, w:54, sun:["full"], water:"low", z:[5,9], bloom:["summer","fall"], bloomColor:"#6a5a9a", foliage:"#6f8470", form:"shrub", cost:24, avail:2, tags:["structure","pollinator"] },
  { id:"buddleiapugster", name:"Butterfly Bush 'Pugster Blue'", latin:"Buddleia davidii", type:"shrub", h:24, w:24, sun:["full"], water:"low", z:[5,9], bloom:["summer","fall"], bloomColor:"#4a6ac0", foliage:"#6f8470", form:"shrub", cost:26, avail:1, tags:["edging","pollinator"] },
  { id:"petunia", name:"Petunia (mixed)", latin:"Petunia x hybrida", type:"annual", h:10, w:12, sun:["full","part"], water:"med", z:[2,11], bloom:["summer","fall"], bloomColor:"#8a5fb0", foliage:"#5a7a45", form:"mound", cost:4, avail:1, tags:["annual","pollinator"] },
  { id:"begonia", name:"Wax Begonia", latin:"Begonia semperflorens", type:"annual", h:12, w:12, sun:["full","part"], water:"med", z:[2,11], bloom:["summer","fall"], bloomColor:"#e06a82", foliage:"#4f6a3e", form:"mound", cost:4, avail:1, tags:["annual"] },
  { id:"impatiens", name:"Impatiens", latin:"Impatiens walleriana", type:"annual", h:14, w:14, sun:["part","shade"], water:"high", z:[2,11], bloom:["summer","fall"], bloomColor:"#e589a0", foliage:"#4f6a3e", form:"mound", cost:4, avail:1, tags:["annual","shade"] },
  { id:"lantana", name:"Lantana", latin:"Lantana camara", type:"annual", h:24, w:24, sun:["full"], water:"low", z:[2,11], bloom:["summer","fall"], bloomColor:"#e8842e", foliage:"#4f7a3e", form:"mound", cost:5, avail:1, tags:["annual","pollinator"] },
  { id:"angelonia", name:"Angelonia 'Summer Snapdragon'", latin:"Angelonia angustifolia", type:"annual", h:18, w:12, sun:["full"], water:"med", z:[2,11], bloom:["summer","fall"], bloomColor:"#8a6fc0", foliage:"#4f7a3e", form:"spike", cost:5, avail:1, tags:["annual","pollinator"] },
  { id:"pentas", name:"Star Flower (Pentas)", latin:"Pentas lanceolata", type:"annual", h:20, w:16, sun:["full"], water:"med", z:[2,11], bloom:["summer","fall"], bloomColor:"#d6485a", foliage:"#4f6a3e", form:"mound", cost:5, avail:1, tags:["annual","pollinator"] },
  { id:"celosia", name:"Celosia 'Plume'", latin:"Celosia argentea", type:"annual", h:18, w:12, sun:["full"], water:"med", z:[2,11], bloom:["summer","fall"], bloomColor:"#c0304a", foliage:"#5a6a3e", form:"spike", cost:4, avail:1, tags:["annual"] },
  { id:"cosmos", name:"Cosmos", latin:"Cosmos bipinnatus", type:"annual", h:36, w:18, sun:["full"], water:"low", z:[2,11], bloom:["summer","fall"], bloomColor:"#e487a8", foliage:"#6f8a5e", form:"daisy", cost:3, avail:1, tags:["annual","pollinator","airy"] },
  { id:"cleome", name:"Spider Flower (Cleome)", latin:"Cleome hassleriana", type:"annual", h:42, w:18, sun:["full"], water:"low", z:[2,11], bloom:["summer","fall"], bloomColor:"#c87ab0", foliage:"#5a7a45", form:"spike", cost:3, avail:1, tags:["annual","pollinator","airy","vertical"] },
  { id:"nicotiana", name:"Flowering Tobacco", latin:"Nicotiana", type:"annual", h:30, w:16, sun:["full","part"], water:"med", z:[2,11], bloom:["summer","fall"], bloomColor:"#f2f0e8", foliage:"#5a7a45", form:"spike", cost:4, avail:1, tags:["annual","pollinator","fragrant"] },
  { id:"ageratum", name:"Floss Flower (Ageratum)", latin:"Ageratum houstonianum", type:"annual", h:10, w:10, sun:["full","part"], water:"med", z:[2,11], bloom:["summer","fall"], bloomColor:"#8a8fd0", foliage:"#4f6a3e", form:"mound", cost:4, avail:1, tags:["annual","edging","pollinator"] },
  { id:"snapdragon",inflor:"raceme", name:"Snapdragon", latin:"Antirrhinum majus", type:"annual", h:24, w:10, sun:["full","part"], water:"med", z:[2,11], bloom:["spring","summer","fall"], bloomColor:"#df6a8e", foliage:"#4f7a3e", form:"spike", cost:4, avail:1, tags:["annual","pollinator","vertical"] },
  { id:"calendula", name:"Pot Marigold (Calendula)", latin:"Calendula officinalis", type:"annual", h:18, w:12, sun:["full"], water:"med", z:[2,11], bloom:["spring","summer","fall"], bloomColor:"#e8862e", foliage:"#5a7a45", form:"daisy", cost:3, avail:1, tags:["annual"] },
  { id:"gomphrena", name:"Globe Amaranth", latin:"Gomphrena globosa", type:"annual", h:18, w:12, sun:["full"], water:"low", z:[2,11], bloom:["summer","fall"], bloomColor:"#b0488a", foliage:"#5a7a45", form:"globe", cost:4, avail:1, tags:["annual","pollinator"] },
  { id:"scaevola", name:"Fan Flower", latin:"Scaevola aemula", type:"annual", h:8, w:18, sun:["full"], water:"med", z:[2,11], bloom:["summer","fall"], bloomColor:"#6f7fc8", foliage:"#4f7a3e", form:"mound", cost:5, avail:1, tags:["annual","edging"] },
  { id:"pelargonium", name:"Zonal Geranium", latin:"Pelargonium x hortorum", type:"annual", h:16, w:14, sun:["full","part"], water:"med", z:[2,11], bloom:["summer","fall"], bloomColor:"#d2384a", foliage:"#4f6a3e", form:"mound", cost:5, avail:1, tags:["annual"] },
  { id:"dahlia", name:"Dahlia (border)", latin:"Dahlia", type:"annual", h:30, w:18, sun:["full"], water:"med", z:[2,11], bloom:["summer","fall"], bloomColor:"#c0304a", foliage:"#4f6a3e", form:"clump", cost:6, avail:1, tags:["annual","pollinator"] },
];

/* ============================ color helpers ============================ */
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
const hexToRgb = (h)=>{h=h.replace("#","");return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];};
const rgbToHex = (r,g,b)=>{const f=x=>clamp(Math.round(x),0,255).toString(16).padStart(2,"0");return "#"+f(r)+f(g)+f(b);};
const mix = (a,b,t)=>{const A=hexToRgb(a),B=hexToRgb(b);return rgbToHex(A[0]+(B[0]-A[0])*t,A[1]+(B[1]-A[1])*t,A[2]+(B[2]-A[2])*t);};
const lighten = (a,t)=>mix(a,"#ffffff",t);
const darken = (a,t)=>mix(a,"#000000",t);
const warmth = (p)=>{const [r,,b]=hexToRgb(p.bloomColor||p.foliage);return r-b;};
const isPastel = (h)=>{const [r,g,b]=hexToRgb(h);const mn=Math.min(r,g,b),mx=Math.max(r,g,b);return mn>120 && (mx-mn)<120;};
// classify a bloom color into a named family for the "limit colors" control
function colorFamily(hex){
  const [r,g,b]=hexToRgb(hex);
  const mx=Math.max(r,g,b), mn=Math.min(r,g,b), d=mx-mn;
  const light=(mx+mn)/2, sat=mx===0?0:d/mx;
  if(d<26 && mx>200) return "white";
  if(d<22) return light>150 ? "white" : "green";
  let h=0;
  if(mx===r) h=((g-b)/d)%6; else if(mx===g) h=(b-r)/d+2; else h=(r-g)/d+4;
  h*=60; if(h<0) h+=360;
  if(h<16 || h>=334) return sat>0.55 ? "red" : "pink";
  if(h<40)  return (sat<0.4 && light>180) ? "pink" : "orange";
  if(h<72)  return "yellow";
  if(h<205) return "green";
  if(h<250) return "blue";
  if(h<292) return "purple";
  return (sat<0.45 && light>170) ? "pink" : "purple";
}

/* ============================ seeded RNG ============================ */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}

/* ============================ spreading behaviour ============================
   every plant is accounted for.
   SELF_SEED : self-sows / spreads politely, finding gaps in a planting without
               dominating or crowding out its neighbours. Drives the "Plant spread"
               control (default includes both spreaders and clumpers).
   Invasiveness is handled separately and BY STATE — see STATE_INVASIVE below — since
   invasive listings are issued state by state, not by zone. Anything invasive in the
   user's selected state is removed automatically (sterile cultivars bred not to spread
   are exempt), so there is no manual invasive toggle. */
/* SPREAD-BEHAVIOUR REFERENCE  (drives SELF_SEED + the "exclude self-seeders" toggle).
   Flag = "spreads on its own / won't reliably stay put." Mechanism by group:
   - SELF-SEEDS (drops volunteer seedlings): Echinacea purpurea (White Swan, PowWow Wild
     Berry), Baptisia, fertile Garden Phlox (Jeana, Laura, Robert Poore, Nicky, Blue
     Paradise, Franz Schubert, Bright Eyes, Starfire, Delta Snow, Peppermint Twist,
     Material Girl*), Aster, Rudbeckia, Yarrow millefolium (Paprika, Cerise Queen),
     Penstemon (digitalis/barbatus), Switchgrass, Allium 'Mount Everest' + Drumstick,
     Monarda fistulosa.   (*Material Girl unconfirmed — flagged as best guess.)
   - VEGETATIVE RUNNER (rhizome/stolon, little seed; flagged so it can be excluded):
     Coreopsis verticillata (Moonbeam, Zagreb), Monarda didyma cultivars.
   - STERILE / STAYS PUT (NOT flagged): Nepeta x faassenii, Geranium 'Johnson's Blue',
     Allium 'Globemaster' (sterile triploid), Phlox 'Glamour Girl' (grower-confirmed) +
     'Fashionably Early' hybrids (stoloniferous, no seed), Phlox 'David' (sterile),
     Echinacea hybrid 'Cleopatra', Coreopsis 'Mercury Rising', and clump-formers
     (Daylily, Hosta, Heuchera, Hydrangea, Iris, Peony, Astilbe, Tulip, Lavender, upright Sedum).
*/
const SELF_SEED = new Set([
  "baptisia","echinacea","rudbeckia","shasta","coreopsis","monarda","aster","goldenrod",
  "monardafistulosa","monardamarshalls","monardarockin","phloxjeana","phloxlaura",
  "phloxrobert","phloxmaterialgirl","phloxnicky","phloxblueparadise","phloxfranz","phloxbrighteyes","phloxstarfire","phloxdeltasnow","phloxpeppermint","phloxdivaricata","phloxdivaricatawhite","phloxmaculata","asterpink","asterblue","rudbeckialittle","rudbeckiahenry","alliumwhite","alliumdrumstick",
  "littlebluestem","littlebluestemovation","littlebluestemblues","littlebluestemtwilight","littlebluestemcarousel","bigbluestem","lovegrass","seaoats","pennsedge","palmsedge","switchcheyenne","dropseedtara",
  "pennisetum","pennisetumredhead","pennisetumlittlebunny","panicum","prairiedropseed","molinia","deschampsia",
  "thyme","lamium","woodruff","allium","daffodil","noddingonion","zinnia",
  "brunnera","foamflower","lungwort","bleedingheart","hellebore","solomonseal","bigrootgeranium",
  "amsonia","seaholly","echinops","sanguisorba","liatris","butterflyweed","swampmilkweed","joepye",
  "agastache","helenium","veronicastrum","foxglove","delphinium","ladysmantle","lambsear","dianthus",
  "gaura","calamint","centranthus","aquilegia","lupine","hollyhock","centaurea","scabiosa","lobelia",
  "anemone","boltonia","vernonia","heliopsis","ratibida","silphium","pycnanthemum","euphorbia","camassia","verbena","thalictrum",
  "echinaceawhite","echinaceamagenta","baptisiayellow","baptisiachoc","baptisiawhite","coreopsisgold",
  "yarrowred","yarrowpink","penstemon","penstemonred","penstemonpurple","panicumblue","panicumnorthwind",
  "hellebrwhite","hellebrslate","hellebryellow","hellebrpink","heleniumred","heleniumorange","heleniumyellow","agastacheorange","agastacherose","dianthuswhite","dianthusred","amsoniablueice","liatriswhite","liatristall","joepyetall","miscanthuszebra",
  "astrantiaclaret","astrantiawhite","astrantiaruby","sangblackthorn","sangtanna","sangcangshan","sangmenziesii","thalblackstockings","thallavendermist","thalsplendide","veronicasfascination","veronicasalbum","veronicaserica","knautia",
  "epimediumfrohnleiten","bleedingheartgold","dicentraluxuriant",
  "crocosmia","crocosmialucifer","crocosmiaemily","crocosmiageorge","crocosmiastar","crocosmiasolfatare","crocosmiaprince",
  "campanulapers","tradescantia","tradescantiaconcord","gaillardia","helianthuslemon","filipendula","chelone","thermopsis","swampmilkweed",
  "tigerlily","crocus","muscari","galanthus","scilla","chionodoxa","fritillariameleagris","leucojum","eranthis","irisreticulata",
  "lilac","cornusarctic","ivoryhalo","clethra","rhustigereyes","diervilla","calycanthus",
  "silverbrocade","valeriefinnis","barberrycrimson","barberryroseglow","barberrygold","barberryorange","barberryconcorde","barberryhelmond",
  "buddleiablack","buddleiaroyalred","buddleiapink","buddleiananho","buddleiawhite",
]);
const isSelfSeed = (p)=> SELF_SEED.has(p.id);

/* ===== invasive species BY STATE =====
   Compiled from multiple sources per state (state noxious / prohibited weed lists +
   invasive-plant-council assessments), erring toward exclusion: if a species appears
   on EITHER kind of list for a state it is removed for users in that state, in any zone
   (invasive listings are state-based, not zone-based). Keyed by botanical species, so
   every cultivar of that species inherits the listing.
   EXCEPTION: documented-sterile cultivars bred specifically not to set seed or spread
   (STERILE_EXEMPT) are never treated as invasive and stay available everywhere. */
const STATE_INVASIVE = {
  "Miscanthus sinensis":      ["CT","DE","GA","IL","IN","KY","MA","MD","MO","NC","NJ","NY","OH","PA","SC","TN","VA","WI","WV","DC"],
  "Pennisetum alopecuroides": ["CA","CT","DC","DE","MD","NJ","NY","PA","VA"],
  "Pennisetum setaceum":      ["AZ","CA","FL","HI","NV","TX"],
  "Imperata cylindrica":      ["AL","FL","GA","HI","LA","MS","NC","SC","TN","TX","VA"],
  "Nassella tenuissima":      ["AZ","CA","NV","OR","UT","WA"],
  "Spiraea japonica":         ["CT","DE","GA","IL","IN","KY","MA","MD","NC","NJ","NY","OH","PA","SC","TN","VA","WI","WV","DC"],
  "Ajuga reptans":            ["DC","GA","KY","MD","NC","OH","PA","TN","VA","WV"],
  "Centranthus ruber":        ["CA","HI","OR","UT","WA"],
  "Verbena bonariensis":      ["AL","CA","FL","GA","NC","SC","TX"],
  "Crocosmia x crocosmiiflora":["CA","HI","OR","WA"],
  "Berberis thunbergii":["CT","DE","IL","IN","KY","MA","MD","ME","MI","MN","NH","NJ","NY","OH","PA","RI","TN","VA","VT","WI","WV","DC"],
  "Buddleia davidii":["CA","DE","GA","KY","MD","NC","NJ","OR","PA","SC","TN","VA","WA","WV"],
  "Lantana camara":["AL","AZ","CA","FL","GA","HI","LA","MS","NC","SC","TX"],
};
// cultivars bred / known to be sterile (no viable seed) and non-spreading -> exempt
const STERILE_EXEMPT = new Set(["pennisetumrubrum","pennisetumfireworks","barberrymini","barberrytodo","barberrycutie","barberrylemonglow","buddleiabluechip","buddleiapurplehaze","buddleiamissmolly","buddleiamissruby","buddleiaasianmoon","buddleiapugster"]);
const invasiveInState = (p, st)=>{
  if(!st || STERILE_EXEMPT.has(p.id)) return false;
  const list = STATE_INVASIVE[p.latin];
  return !!list && list.includes(st);
};
const US_STATES = [
  ["AL","Alabama"],["AK","Alaska"],["AZ","Arizona"],["AR","Arkansas"],["CA","California"],
  ["CO","Colorado"],["CT","Connecticut"],["DE","Delaware"],["DC","District of Columbia"],
  ["FL","Florida"],["GA","Georgia"],["HI","Hawaii"],["ID","Idaho"],["IL","Illinois"],
  ["IN","Indiana"],["IA","Iowa"],["KS","Kansas"],["KY","Kentucky"],["LA","Louisiana"],
  ["ME","Maine"],["MD","Maryland"],["MA","Massachusetts"],["MI","Michigan"],["MN","Minnesota"],
  ["MS","Mississippi"],["MO","Missouri"],["MT","Montana"],["NE","Nebraska"],["NV","Nevada"],
  ["NH","New Hampshire"],["NJ","New Jersey"],["NM","New Mexico"],["NY","New York"],
  ["NC","North Carolina"],["ND","North Dakota"],["OH","Ohio"],["OK","Oklahoma"],["OR","Oregon"],
  ["PA","Pennsylvania"],["RI","Rhode Island"],["SC","South Carolina"],["SD","South Dakota"],
  ["TN","Tennessee"],["TX","Texas"],["UT","Utah"],["VT","Vermont"],["VA","Virginia"],
  ["WA","Washington"],["WV","West Virginia"],["WI","Wisconsin"],["WY","Wyoming"],
];

// shared compatibility + role helpers (so buildDesign and the editing UI agree)
const sunFits   = (p, sun)=> p.sun.includes(sun);
const moistFits = (p, m)=> m==="dry" ? p.water==="low" : m==="medium" ? (p.water==="low"||p.water==="med") : (p.water==="med"||p.water==="high");
const zoneFits  = (p, z)=> z>=p.z[0] && z<=p.z[1];
const roleStructure = (p)=> p.form==="shrub" || (p.h>=42 && p.type!=="perennial") || p.tags.includes("structure");
const roleFront     = (p)=> p.form==="mat" || (p.h<=14 && p.form!=="grass") || p.tags.includes("edging");
const roleGrass     = (p)=> p.form==="grass";
const roleBulb      = (p)=> p.tags.includes("bulb");
const roleAnnual    = (p)=> p.tags.includes("annual");
const plantCat = (p)=> roleStructure(p)?"shrub" : roleGrass(p)?"grass" : roleFront(p)?"groundcover" : roleBulb(p)?"bulb" : roleAnnual(p)?"annual" : "perennial";
const CAT_LABEL = { shrub:"shrub / structure", grass:"ornamental grass", groundcover:"groundcover / edging", bulb:"bulb", annual:"annual", perennial:"perennial" };
// broad planting layer — used to offer like-for-like replacements across types
// (a mid-border grass and a mid-border perennial fill the same role)
const plantLayer = (p)=>
    roleStructure(p) ? "structure"
  : (p.form==="mat" || p.h<=14 || plantCat(p)==="groundcover") ? "front"
  : "mid";
// foliage tone, used by the aesthetic layer (silver/dark/gold vs ordinary green)
const leafTone = (p)=> p.tags.includes("silverleaf") ? "silver"
                     : p.tags.includes("darkleaf")   ? "dark"
                     : p.tags.includes("goldleaf")   ? "gold" : "green";
// how well a plant fits a chosen aesthetic (colour story / mood). 0 when none set.
function aestheticScore(p, aes){
  if(!aes) return 0;
  let s = 0;
  const tone = leafTone(p);
  const fam = (p.bloom && p.bloom.length) ? colorFamily(p.bloomColor) : null;
  if(aes.foliage && aes.foliage.includes(tone)) s += 1.0;                 // the silver/dark/gold heart of the look
  if(aes.heroes && aes.heroes.includes(p.id)) s += 0.7;                   // a signature plant for this mood
  if(aes.leafy && (p.tags.includes("foliage")||p.tags.includes("texture")||p.form==="grass")) s += 0.6;
  if(aes.season && p.bloom && p.bloom.includes(aes.season)) s += 0.4;     // seasonal lean (e.g. autumn)
  if(fam){
    if(aes.blooms.includes(fam)) s += 0.7;                               // on-palette flower
    else if(fam!=="white" && fam!=="green") s -= 0.6;                    // clashing flower colour
  }
  return s;
}
// compatible enough to anchor a featured pairing under this aesthetic?
const aestheticAllows = (p, aes)=> !aes || aestheticScore(p, aes) >= 0;

/* ============================ design engine ============================ */
function buildDesign(opts, seed){
  const rng = mulberry32(seed >>> 0);
  const shuffle = (arr)=>{const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const W = opts.bed.width, D = opts.bed.depth, area = W*D;

  const sunOK = (p)=>p.sun.includes(opts.sun);
  const waterOK = (p)=>opts.moisture==="dry" ? p.water==="low"
                     : opts.moisture==="medium" ? (p.water==="low"||p.water==="med")
                     : (p.water==="med"||p.water==="high");
  const zoneOK = (p)=>opts.zone>=p.z[0] && opts.zone<=p.z[1];

  let pool = PLANTS.filter(p=>sunOK(p)&&waterOK(p)&&zoneOK(p));
  if(pool.length < 6) pool = PLANTS.filter(p=>sunOK(p)&&zoneOK(p));

  // spreading-behaviour filters (respected as-is, even if the palette shrinks):
  // drop self-seeders, and drop anything invasive in the selected zone
  if(opts.excludeSelfSeed) pool = pool.filter(p=>!isSelfSeed(p));
  pool = pool.filter(p=>!invasiveInState(p, opts.state));
  // plants the user removed / swapped out
  if(opts.excluded && opts.excluded.length) pool = pool.filter(p=>!opts.excluded.includes(p.id));

  // optional color limit: keep flowers in the chosen families, but always keep
  // foliage/structure plants (they read as green, not as a flower color)
  const colors = opts.colors || [];
  if(colors.length){
    const famOK = (p)=> (p.tags.includes("foliage") || p.bloom.length===0) ? true
                      : colors.includes(colorFamily(p.bloomColor));
    const fp = pool.filter(famOK);
    if(fp.length >= 5) pool = fp;   // only constrain when enough plants remain
  }

  const st = opts.style;
  const maxH = opts.maxHeight || 999;
  const score = (p)=>{
    let s = rng()*0.5;
    if(p.h > maxH) s -= 1.6 + (p.h - maxH)/14;   // prefer shorter plants under the cap
    if(opts.palette==="warm") s += warmth(p)>10 ? 0.6 : -0.25;
    if(opts.palette==="cool") s += warmth(p)<0 ? 0.6 : -0.25;
    if(opts.palette==="pastel") s += (p.bloomColor && isPastel(p.bloomColor)) ? 0.55 : 0;
    if(st==="pollinator") s += (p.tags.includes("pollinator")||p.tags.includes("native")) ? 0.7 : 0;
    if(st==="formal") s += (p.tags.includes("formal")||p.tags.includes("evergreen")||p.tags.includes("structure")) ? 0.5 : -0.1;
    if(st==="prairie") s += (p.form==="grass"||p.tags.includes("native")) ? 0.7 : 0;
    if(st==="cottage") s += (p.type==="perennial"||p.tags.includes("annual")||p.tags.includes("fragrant")) ? 0.4 : 0;
    if(st==="designer"){
      s += (p.tags.includes("foliage")||p.tags.includes("texture")||p.form==="grass"||p.tags.includes("structure")) ? 0.55 : 0;
      s += (p.bloomColor && isPastel(p.bloomColor)) ? 0.25 : (warmth(p)>45 ? -0.2 : 0);
      s += p.tags.includes("annual") ? -0.3 : 0;
    }
    if(st==="modern"){
      s += (p.form==="grass"||p.tags.includes("structure")||p.tags.includes("vertical")||p.tags.includes("texture")||p.form==="globe") ? 0.7 : -0.1;
      s += p.tags.includes("annual") ? -0.4 : 0;
    }
    if(st==="farmhouse"){
      s += (p.tags.includes("structure")||p.tags.includes("fragrant")||p.tags.includes("evergreen")) ? 0.45 : 0;
      s += (warmth(p)<0 || (p.bloomColor && isPastel(p.bloomColor))) ? 0.3 : 0;
    }
    if(st==="native") s += p.tags.includes("native") ? 0.9 : -0.25;
    if(st==="prairiegrass"){
      s += p.form==="grass" ? 1.05 : 0;                                          // grasses lead the planting
      s += (p.tags.includes("texture")||p.tags.includes("native")) ? 0.35 : 0;   // fine, see-through company
      s += (p.form==="spike"||p.form==="globe"||p.form==="daisy") ? 0.3 : 0;      // airy verticals & seedheads weave through
      s += (p.form==="shrub"||p.tags.includes("evergreen")) ? -0.55 : 0;         // avoid solid blocks that stop the movement
      s += p.tags.includes("annual") ? -0.25 : 0;
    }
    s += 1.4 * aestheticScore(p, opts.aesthetic);   // colour story / mood bias (0 when none chosen)
    // back-row visual weight: nudge the tall plants that read as the back of the bed
    const backish = p.h>=40 || p.form==="shrub" || p.tags.includes("structure");
    if(backish){
      if(opts.backWeight==="airy"){
        s += (p.tags.includes("airy")||p.form==="spike"||p.form==="grass") ? 0.85 : 0;  // see-through verticals & veils
        s += p.form==="shrub" ? -0.95 : 0;                                              // push solid woody mass out
        s += (p.form==="mound"||p.form==="globe") ? -0.3 : 0;
      } else if(opts.backWeight==="solid"){
        s += (p.form==="shrub"||p.tags.includes("structure")) ? 0.8 : 0;                // favour full, opaque backbone
        s += p.tags.includes("airy") ? -0.45 : 0;
      }
    }
    if(opts.emergent) s += p.tags.includes("emergent") ? 0.15 : 0;                      // gentle nudge; the accent layer is force-included
    if(opts.sourcing!=="all"){ s += p.avail===1 ? 0.22 : p.avail===2 ? 0.12 : -1.9; }  // gently prefer widely-stocked, keep secondary in play, bury specialty
    return s;
  };
  const byScore = (arr)=>[...arr].sort((a,b)=>score(b)-score(a));

  const isStructure = (p)=> p.form==="shrub" || (p.h>=42 && p.type!=="perennial") || p.tags.includes("structure");
  const isFront = (p)=> p.form==="mat" || (p.h<=14 && p.form!=="grass") || p.tags.includes("edging");
  const isGrass = (p)=> p.form==="grass";
  const isBulb = (p)=> p.tags.includes("bulb");
  const isAnnual = (p)=> p.tags.includes("annual");
  const isMid = (p)=> !isStructure(p)&&!isFront(p)&&!isGrass(p)&&!isBulb(p)&&!isAnnual(p);

  const allowShrub = D >= 3;
  const selected = [];
  const taken = new Set();
  const add = (p)=>{ if(p && !taken.has(p.id)){ taken.add(p.id); selected.push(p);} };

  // featured pairings: force-include the chosen plants (only if they suit the
  // current sun / moisture / zone, and don't violate an active behaviour toggle).
  const featured = opts.featured || [];
  const excluded = opts.excluded || [];
  featured.forEach(id=>{
    const p = PLANTS.find(x=>x.id===id);
    if(p && !excluded.includes(id) && sunOK(p) && waterOK(p) && zoneOK(p)
       && !(opts.excludeSelfSeed && isSelfSeed(p))
       && !invasiveInState(p, opts.state)) add(p);
  });
  // user-chosen replacements / additions: force-include if they suit conditions
  (opts.userAdded || []).forEach(id=>{
    const p = PLANTS.find(x=>x.id===id);
    if(p && !excluded.includes(id) && sunOK(p) && waterOK(p) && zoneOK(p)
       && !(opts.excludeSelfSeed && isSelfSeed(p))
       && !invasiveInState(p, opts.state)) add(p);
  });
  // emergent accents: a small, bounded set of tall verticals force-included and
  // scattered as single stems. Prefer non-bulb spires (foxglove, liatris, verbena…);
  // allow alliums too. Only these designated plants are scattered — everything else
  // selected stays in normal drifts.
  let emergentIds = [];
  if(opts.emergent){
    const target = clamp(Math.round(W/6), 1, 4);
    const nonBulb = byScore(pool.filter(p=> p.tags.includes("emergent") && !p.tags.includes("bulb")));
    const bulbEm  = byScore(pool.filter(p=> p.tags.includes("emergent") &&  p.tags.includes("bulb")));
    let n = 0;
    for(const p of [...nonBulb, ...bulbEm]){ if(n>=target) break; if(!taken.has(p.id)){ add(p); emergentIds.push(p.id); n++; } }
  }

  // composition: number of species per category, driven by the mix weights
  const roleFor = { shrub:isStructure, grass:isGrass, perennial:isMid, groundcover:isFront, annual:isAnnual, bulb:isBulb };
  const catOf = (p)=> isStructure(p)?"shrub" : isGrass(p)?"grass" : isFront(p)?"groundcover" : isBulb(p)?"bulb" : isAnnual(p)?"annual" : "perennial";
  // when emergent accents are on, emergent plants are reserved for the scattered
  // accent layer above — keep them out of the dense category drifts (so e.g. alliums
  // punctuate rather than forming a solid block)
  const genPool = opts.emergent ? pool.filter(p=> !p.tags.includes("emergent") || emergentIds.includes(p.id)) : pool;
  const mixW = opts.mix || { shrub:0.18, perennial:0.36, grass:0.16, groundcover:0.14, annual:0.1, bulb:0.06 };
  const speciesBudget = clamp(Math.round(area/7)+3, 5, 16);
  ["shrub","grass","perennial","groundcover","annual","bulb"].forEach(key=>{
    let frac = mixW[key] || 0;
    if(key==="shrub" && !allowShrub) frac = 0;       // no room for woody backbone
    if(key==="shrub"){                               // visual weight shifts the solid backbone up/down
      if(opts.backWeight==="airy")  frac *= 0.3;
      else if(opts.backWeight==="solid") frac = Math.min(0.5, frac*1.3);
    }
    let n = Math.round(frac*speciesBudget);
    if(frac>0.04 && n<1) n = 1;
    if(frac<=0.001) n = 0;                            // category explicitly off
    n = Math.max(0, n - selected.filter(roleFor[key]).length); // featured already fill some
    const cpool = byScore(genPool.filter(roleFor[key]));
    n = Math.min(n, cpool.length);
    for(let i=0;i<n;i++) add(cpool[i]);
  });
  // a little backbone if the bed is deep and shrubs were allowed but none landed
  if(allowShrub && (mixW.shrub||0)>0.001 && !selected.some(isStructure)){
    const s = byScore(genPool.filter(isStructure)); if(s[0]) add(s[0]);
  }
  // guarantee something blooms each season, respecting categories set to zero
  for(const ssn of ["spring","summer","fall"]){
    if(!selected.some(p=>p.bloom.includes(ssn))){
      const cand = byScore(genPool.filter(p=>p.bloom.includes(ssn) && (mixW[catOf(p)]||0)>0.001));
      if(cand[0]) add(cand[0]);
    }
  }

  const instances = placeAll(selected, {W,D,area}, opts, rng, shuffle, {isStructure,isFront,isGrass,isBulb,isAnnual,emergentIds});
  return { selected, instances };
}

function placeAll(selected, dims, opts, rng, shuffle, roles){
  const { W, D } = dims;
  const formal = opts.style === "formal";
  const mixW = opts.mix || {};
  // weave: naturalistic/native/designer intermingle (more, repeating drifts);
  // modern/formal read as bolder, fewer masses.
  const weave = (opts.style==="prairie"||opts.style==="native"||opts.style==="designer") ? 1.6
              : opts.style==="prairiegrass" ? 1.85
              : (opts.style==="modern"||opts.style==="formal") ? 0.7 : 1.0;
  const catOf = (p)=> roles.isStructure(p)?"shrub" : roles.isGrass(p)?"grass" : roles.isFront(p)?"groundcover" : roles.isBulb(p)?"bulb" : roles.isAnnual(p)?"annual" : "perennial";
  let instances = [];

  // Number of depth ranks scales with how deep the bed is: a shallow strip reads as
  // one or two ranks, a deep border as five or six. Plants are ordered front-to-back by
  // height/role, then split into that many overlapping bands that evenly tile the depth.
  const nTiers = clamp(Math.round(D/1.4), 1, 8);
  const hs = selected.map(p=>p.h);
  const minH = hs.length?Math.min(...hs):12, maxH = hs.length?Math.max(...hs):48;
  const rankOf = (p)=>{
    let r = (p.h - minH)/Math.max(1,(maxH-minH));      // taller -> further back
    if(roles.isStructure(p)) r = Math.max(r,0.82);
    if(roles.isFront(p))     r = Math.min(r,0.18);
    if(roles.isGrass(p))     r = Math.max(r,0.5);
    return clamp(r,0,1);
  };
  const tierOf = (p)=> clamp(Math.floor(rankOf(p)*nTiers), 0, nTiers-1);   // 0 = front rank
  const band = (i)=>{ const lo=i/nTiers, hi=(i+1)/nTiers, pad=(hi-lo)*0.45; return [Math.max(0,lo-pad), Math.min(1,hi+pad)]; };

  // Bulbs are placed as an overlay so they don't leave holes when they vanish
  // in summer/fall. Everything else provides continuous ground coverage.
  // emergent accents: only the designated ids (from buildDesign) are scattered as
  // single stems — including emergent bulbs like alliums, so they punctuate rather
  // than forming a dense drift. Everything else keeps normal drift placement.
  const emSet = new Set(roles.emergentIds || []);
  const emergent = selected.filter(p=> emSet.has(p.id));
  const bulbs = selected.filter(p=> roles.isBulb(p) && !emSet.has(p.id));
  const base = selected.filter(p=> !roles.isBulb(p) && !emSet.has(p.id));
  const groups = Array.from({length:nTiers}, ()=>[]);
  base.forEach(p=>groups[tierOf(p)].push(p));

  // Fill a contiguous drift of one species across an x-range, packed so the
  // mature canopies overlap (no visible soil) using a staggered (hex) grid.
  const fillBlock = (p, xa, xb, y0, y1, packing, stepMul)=>{
    const spread = Math.max(0.45, p.w/12);            // mature spread in feet
    const step   = Math.max(0.32, spread*packing*stepMul); // on-center spacing
    const rowStep= Math.max(0.26, step*0.72);
    const nRows  = Math.max(1, Math.round((y1-y0)/rowStep));
    const rs     = (y1-y0)/nRows;
    for(let r=0;r<nRows;r++){
      const yBase  = y0 + (r+0.5)*rs;
      const stagger= rng()*step*0.85;                 // randomized offset so ranks do not align
      const span   = xb - xa;
      const nCols  = Math.max(1, Math.round(span/step));
      const cs     = span/nCols;
      for(let c=0;c<=nCols;c++){
        let x = xa + stagger*0.5 + c*cs;
        let y = yBase;
        if(!formal){ x += (rng()-0.5)*step*0.7; y += (rng()-0.5)*rs*0.95; }   // looser, organic
        if(x < xa-step*0.4 || x > xb+step*0.4) continue;
        x = clamp(x, 0.06, W-0.06);
        y = clamp(y, 0.02, D-0.02);
        instances.push({ plant:p, x, y });
      }
    }
  };

  const layoutTiers = (packing, stepMul)=>{
    instances = [];
    for(let ti=0; ti<nTiers; ti++){
      let list = groups[ti];
      if(list.length===0) continue;
      const [f0,f1] = band(ti);
      const y0 = f0*D, y1 = Math.max(f0*D+0.4, f1*D);
      if(!formal) list = shuffle(list);
      // bold sweeps: wider plants -> fewer, wider drifts across the width
      const avgSpread = list.reduce((a,p)=>a+Math.max(0.6,p.w/12),0)/list.length;
      let nBlocks = Math.round(W/Math.max(1.3, avgSpread*1.5) * weave);
      nBlocks = clamp(nBlocks, list.length, list.length*4);
      // emphasis: how strongly the user asked for more/less of a given plant
      const EMPH_MUL = { "-2":0.3, "-1":0.55, "0":1, "1":1.7, "2":2.6 };
      const emph = (p)=> EMPH_MUL[String((opts.emphasis && opts.emphasis[p.id]) || 0)] || 1;
      // allocate drifts per species in proportion to emphasis (min one each), then
      // round-robin them so drifts stay interleaved. With no emphasis this matches a
      // plain repeating cycle, so ordinary designs are unchanged.
      const totE = list.reduce((a,p)=>a+emph(p), 0);
      const want = list.map(p=> Math.max(1, Math.round(nBlocks * emph(p)/totE)));
      const maxN = Math.max(1, ...want);
      const seq = [];
      for(let k=0;k<maxN;k++) list.forEach((p,i)=>{ if(k<want[i]) seq.push(p); });
      const seqW = seq.map(p=>Math.max(0.6,p.w/12)*(0.5+1.2*(mixW[catOf(p)]||0.12)));
      const tot  = seqW.reduce((a,b)=>a+b,0);
      let xcur = 0;
      for(let i=0;i<seq.length;i++){
        const w = (seqW[i]/tot)*W;
        const airy = seq[i].tags.includes("airy") && (ti >= nTiers-2);
        fillBlock(seq[i], xcur, xcur+w, y0, y1, packing, stepMul*(airy?1.5:1)); // airy = looser, see-through
        xcur += w;
      }
    }
    // bulb overlay: a few natural drifts sprinkled through the front-to-mid zone
    bulbs.forEach((p)=>{
      const spread = Math.max(0.4, p.w/12);
      const nDrifts = clamp(Math.round(W/3.2), 1, 5);
      for(let d=0; d<nDrifts; d++){
        const cx = ((d+0.5)/nDrifts + (rng()-0.5)*0.12) * W;
        const cy = (0.06 + rng()*0.36) * D;
        const cnt = clamp(Math.round(7/spread), 4, 13);
        for(let k=0;k<cnt;k++){
          const a = rng()*Math.PI*2, rad = rng()*spread*1.5;
          const x = clamp(cx + Math.cos(a)*rad, 0.06, W-0.06);
          const y = clamp(cy + Math.sin(a)*rad*0.6, 0.02, D-0.02);
          instances.push({ plant:p, x, y });
        }
      }
    });
    // emergent overlay: sparse single verticals threaded through the mid-to-back
    // depth, so spires and globes rise above the surrounding canopy
    emergent.forEach((p)=>{
      const n = clamp(Math.round(W/4)+1, 2, 8);
      for(let i=0;i<n;i++){
        const x = clamp(((i+0.5)/n)*W + (rng()-0.5)*0.9, 0.08, W-0.08);
        const y = clamp((0.34 + rng()*0.5)*D, 0.04, D-0.04);
        instances.push({ plant:p, x, y });
      }
    });
  };

  // Start dense; if the count gets too high (big beds), loosen spacing and
  // relayout so rendering stays responsive on phones.
  const CAP = 260;
  let packing = (opts.packing || 0.74) * (formal ? 0.92 : 1), stepMul = 1, guard = 0;
  layoutTiers(packing, stepMul);
  while(instances.length > CAP && guard < 4){
    stepMul *= Math.sqrt(instances.length / CAP);
    layoutTiers(packing, stepMul);
    guard++;
  }
  return instances;
}

/* =================== seasonal presentation per plant =================== */
function seasonMods(p, season){
  const isAnnual = p.tags.includes("annual");
  const isSpringBulb = p.tags.includes("bulb") && !p.bloom.includes("summer");
  const isGrass = p.form==="grass";
  let present=true, sizeMul=1, foliage=p.foliage, blooming=p.bloom.includes(season);
  let bloomColor = p.bloomColor;

  if(season==="spring"){
    sizeMul = isAnnual ? 0.45 : isGrass ? 0.55 : isSpringBulb ? 1 : 0.78;
    foliage = lighten(p.foliage, 0.08);
  } else if(season==="summer"){
    if(isSpringBulb) present=false;            // bulb foliage has died back
    sizeMul = isGrass ? 0.94 : 1.0;
  } else { // fall
    if(isSpringBulb){ present=false; }
    sizeMul = isGrass ? 1.08 : isAnnual ? 0.95 : 0.95;
    foliage = p.fallFoliage ? p.fallFoliage : mix(p.foliage, "#c4a14a", 0.22);
    if(p.tags.includes("shade")){ sizeMul *= 0.85; foliage = mix(p.foliage, "#b59a52", 0.4); }
    if(p.id==="allium"){ blooming=true; bloomColor="#cbb98c"; } // dried seedhead
  }
  return { present, sizeMul, foliage, blooming, bloomColor };
}

/* ============================ plant glyphs ============================ */
/* Painterly approach: every mass is built from an irregular silhouette plus
   stacked tones (shaded underside, body, dappled clumps, upper-left sunlight,
   broken-edge leaflets). Light is consistent from the upper-left. No SVG
   filters are used, so it stays fast even with a densely planted bed.        */

// smooth closed blob path through jittered radial points (Catmull-Rom -> bezier)
function blobD(cx, cy, rx, ry, n, jitter, rng){
  const pts=[];
  for(let i=0;i<n;i++){
    const a=(i/n)*Math.PI*2;
    const jr=1 - jitter*0.5 + rng()*jitter;
    pts.push([cx+Math.cos(a)*rx*jr, cy+Math.sin(a)*ry*jr]);
  }
  let d=`M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)} `;
  for(let i=0;i<n;i++){
    const p0=pts[(i-1+n)%n], p1=pts[i], p2=pts[(i+1)%n], p3=pts[(i+2)%n];
    const c1x=p1[0]+(p2[0]-p0[0])/6, c1y=p1[1]+(p2[1]-p0[1])/6;
    const c2x=p2[0]-(p3[0]-p1[0])/6, c2y=p2[1]-(p3[1]-p1[1])/6;
    d+=`C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)} `;
  }
  return d+"Z";
}

// big foliage dome for shrubs / mounds / clumps. ratio: >1 upright, <1 spreading
/* ---- vase / fountain silhouette (arching stems, wider at top) — forsythia, spirea ---- */
function vaseMass(wPx,hPx,color,rng){
  const els=[]; const top=-hPx*0.96, arcs=6+Math.round(rng()*3);
  for(let k=0;k<arcs;k++){
    const side=(k%2?1:-1)*(0.45+rng()*0.55), baseX=(rng()-0.5)*wPx*0.12;
    const tipX=baseX+side*wPx*0.5, tipY=top*(0.66+rng()*0.3), cx2=baseX+side*wPx*0.12, cy2=top*0.46;
    const qx=(t)=>(1-t)*(1-t)*baseX+2*(1-t)*t*cx2+t*t*tipX, qy=(t)=>2*(1-t)*t*cy2+t*t*tipY;
    els.push(<path key={"vs"+k} d={`M ${baseX} 0 Q ${cx2} ${cy2} ${tipX} ${tipY}`} stroke={darken(color,0.1)} strokeWidth={Math.max(1.5,wPx*0.045)} fill="none" strokeLinecap="round"/>);
    for(let j=0;j<3;j++){ const t=0.45+j*0.2, fx=qx(t), fy=qy(t); els.push(<path key={`vc${k}_${j}`} d={blobD(fx,fy,wPx*0.14,hPx*0.1,8,0.36,rng)} fill={j%2?lighten(color,0.08):color} opacity={0.85}/>); }
  }
  els.push(<path key="vt" d={blobD(0,top*0.7,wPx*0.5,hPx*0.2,12,0.3,rng)} fill={color} opacity={0.9}/>);
  els.push(<path key="vh" d={blobD(-wPx*0.2,top*0.78,wPx*0.3,hPx*0.15,9,0.32,rng)} fill={lighten(color,0.16)} opacity={0.7}/>);
  return els;
}
/* ---- pyramidal silhouette (triangular, wide base + central leader) — conifers, some yews ---- */
function pyramidMass(wPx,hPx,color,rng){
  const els=[]; const h=hPx, base=wPx*0.5;
  els.push(<path key="py0" d={`M ${-base} 0 Q ${-base*0.5} ${-h*0.5} 0 ${-h} Q ${base*0.5} ${-h*0.5} ${base} 0 Q 0 ${h*0.05} ${-base} 0 Z`} fill={darken(color,0.16)}/>);
  els.push(<path key="py1" d={`M ${-base*0.9} ${-h*0.04} Q ${-base*0.45} ${-h*0.5} 0 ${-h*0.95} Q ${base*0.45} ${-h*0.5} ${base*0.9} ${-h*0.04} Q 0 ${h*0.02} ${-base*0.9} ${-h*0.04} Z`} fill={color}/>);
  for(let k=0;k<6;k++){ const t=0.12+k*0.14, yy=-h*t, ww=base*(1-t*0.85); els.push(<path key={"pyt"+k} d={blobD(0,yy,ww,h*0.06,9,0.3,rng)} fill={k%2?lighten(color,0.08):darken(color,0.05)} opacity={0.6}/>); }
  els.push(<path key="pyh" d={blobD(-base*0.2,-h*0.6,base*0.3,h*0.12,8,0.3,rng)} fill={lighten(color,0.16)} opacity={0.7}/>);
  return els;
}
function leafMass(wPx,hPx,color,rng,ratio,sil){
  const S=sil||"rounded";
  if(S==="vase") return vaseMass(wPx,hPx,color,rng);
  if(S==="pyramidal") return pyramidMass(wPx,hPx,color,rng);
  const els=[];
  let rx,ry,cy;
  if(S==="columnar"){ rx=wPx*0.34; ry=hPx*0.5*(ratio||1); cy=-hPx*0.5; }
  else if(S==="spreading"){ rx=wPx*0.56; ry=hPx*0.42*(ratio||1); cy=-hPx*0.34; }
  else { rx=wPx*0.53; ry=hPx*0.5*(ratio||1); cy=-hPx*0.5; }
  els.push(<path key="ls" d={blobD(rx*0.06,cy+ry*0.12,rx,ry,11,0.26,rng)} fill={darken(color,0.22)}/>);          // shaded underside
  els.push(<path key="lb" d={blobD(0,cy,rx*0.99,ry*0.99,13,0.24,rng)} fill={color}/>);                          // body
  const clumps=4+Math.round(rng()*3);                                                                            // dappled foliage
  for(let k=0;k<clumps;k++){
    const a=rng()*Math.PI*2, rr=rng()*0.6;
    const x=Math.cos(a)*rx*rr, y=cy+Math.sin(a)*ry*rr, cr=rx*(0.2+rng()*0.16);
    const tone=rng()>0.5?lighten(color,0.06+rng()*0.08):darken(color,0.04+rng()*0.06);
    els.push(<path key={"lc"+k} d={blobD(x,y,cr,cr*0.85,8,0.4,rng)} fill={tone} opacity={0.7}/>);
  }
  els.push(<path key="lh" d={blobD(-rx*0.3,cy-ry*0.3,rx*0.5,ry*0.45,9,0.3,rng)} fill={lighten(color,0.18)} opacity={0.8}/>); // sunlit shoulder
  for(let k=0;k<6;k++) els.push(<circle key={"lhs"+k} cx={-rx*0.3+(rng()*2-1)*rx*0.3} cy={cy-ry*0.3+(rng()*2-1)*ry*0.3} r={Math.max(0.8,rx*0.05)} fill={lighten(color,0.32)} opacity={0.5}/>);
  const edge=9+Math.round(rng()*5);                                                                              // broken silhouette
  for(let k=0;k<edge;k++){
    const a=rng()*Math.PI*2, x=Math.cos(a)*rx*0.95, y=cy+Math.sin(a)*ry*0.95;
    els.push(<circle key={"le"+k} cx={x} cy={y} r={rx*(0.07+rng()*0.06)} fill={rng()>0.5?color:darken(color,0.08)} opacity={0.85}/>);
  }
  els.push(<path key="lp" d={blobD(rx*0.3,cy+ry*0.3,rx*0.4,ry*0.35,8,0.35,rng)} fill={darken(color,0.14)} opacity={0.5}/>); // lower-right pocket
  return els;
}

// low textured foliage base for daisies / spikes
function leafBaseLow(wPx,hPx,color,rng){
  const els=[]; const rx=wPx*0.5, ry=Math.max(3,hPx);
  els.push(<path key="lbl0" d={blobD(0,-ry*0.6,rx,ry,11,0.3,rng)} fill={darken(color,0.12)}/>);
  els.push(<path key="lbl1" d={blobD(0,-ry*0.7,rx*0.92,ry*0.92,11,0.32,rng)} fill={color}/>);
  els.push(<path key="lbl2" d={blobD(-rx*0.25,-ry*0.9,rx*0.4,ry*0.4,8,0.34,rng)} fill={lighten(color,0.14)} opacity={0.8}/>);
  return els;
}

// soft flower puffs (hydrangea, sedum, phlox, bee balm, etc.)
function bloomPuffs(wPx,hPx,color,rng,n,r,fs,cluster){
  const els=[]; const lo=(fs==null?0.45:fs);
  for(let k=0;k<n;k++){
    const cx=(rng()*2-1)*wPx*0.44, cy=-hPx*(lo+rng()*Math.max(0.08,0.96-lo)), R=r*(0.8+rng()*0.5);
    if(cluster){
      // a rounded flower HEAD of many separated florets (hydrangea mophead)
      els.push(<circle key={"bhd"+k} cx={cx+R*0.12} cy={cy+R*0.14} r={R} fill={darken(color,0.22)} opacity={0.4}/>);
      const m=Math.max(7,Math.round(R*1.05));
      for(let j=0;j<m;j++){
        const a=rng()*Math.PI*2, rd=Math.sqrt(rng())*R*0.9, fx=cx+Math.cos(a)*rd, fy=cy+Math.sin(a)*rd*0.92, fr=Math.max(0.9,R*0.19);
        els.push(<circle key={`bg${k}_${j}`} cx={fx+fr*0.18} cy={fy+fr*0.18} r={fr*1.1} fill={darken(color,0.26)} opacity={0.55}/>);
        els.push(<circle key={`bf${k}_${j}`} cx={fx} cy={fy} r={fr} fill={(j%2)?color:lighten(color,0.1)}/>);
        els.push(<circle key={`bp${k}_${j}`} cx={fx-fr*0.22} cy={fy-fr*0.22} r={fr*0.32} fill={lighten(color,0.3)} opacity={0.7}/>);
      }
    } else {
      // a SINGLE distinct flower with a separation gap so blooms read individually
      els.push(<circle key={"bg"+k} cx={cx+R*0.18} cy={cy+R*0.18} r={R*1.08} fill={darken(color,0.28)} opacity={0.5}/>);
      els.push(<path key={"bb"+k} d={blobD(cx,cy,R,R*0.95,8,0.24,rng)} fill={(k%2)?color:lighten(color,0.07)}/>);
      els.push(<circle key={"bc"+k} cx={cx} cy={cy} r={R*0.32} fill={darken(color,0.16)} opacity={0.6}/>);
      els.push(<circle key={"bh"+k} cx={cx-R*0.22} cy={cy-R*0.22} r={R*0.26} fill={lighten(color,0.34)} opacity={0.7}/>);
    }
  }
  return els;
}

// daisy-form flowers (coneflower, rudbeckia, shasta, aster)
function daisyForm(wPx,hPx,color,rng,n,fs,fsz){
  const els=[]; const R=Math.max(3,wPx*0.12*(fsz||1));
  const pale=isPastel(color);
  const disc=pale?"#e3b13a":darken(color,0.42);
  for(let k=0;k<n;k++){
    const lo=(fs==null?0.5:fs); const cx=(rng()*2-1)*wPx*0.38, cy=-hPx*(lo+rng()*Math.max(0.08,0.93-lo)), petals=11+Math.round(rng()*4), tilt=rng()*Math.PI;
    els.push(<circle key={"dsh"+k} cx={cx+R*0.1} cy={cy+R*0.1} r={R*1.05} fill={darken(color,0.25)} opacity={0.35}/>);
    for(let i=0;i<petals;i++){
      const a=tilt+(i/petals)*Math.PI*2, px=cx+Math.cos(a)*R, py=cy+Math.sin(a)*R*0.9;
      els.push(<ellipse key={`dp${k}_${i}`} cx={px} cy={py} rx={R*0.52} ry={R*0.2} fill={i%2?color:lighten(color,0.12)} transform={`rotate(${a*180/Math.PI} ${px} ${py})`}/>);
    }
    els.push(<circle key={"dd"+k} cx={cx} cy={cy} r={R*0.42} fill={disc}/>);
    els.push(<circle key={"dh"+k} cx={cx-R*0.12} cy={cy-R*0.12} r={R*0.2} fill={lighten(disc,0.3)} opacity={0.7}/>);
  }
  return els;
}

// vertical flower wands (salvia, lavender, russian sage, astilbe, goldenrod)
function spikeForm(wPx,hPx,foliage,color,blooming,rng,n,fs,fine,fsz,stemScale,flps,curve){
  const els=[...leafBaseLow(wPx,hPx*(fine?0.26:0.32),foliage,rng)];
  const cv=(curve==null?0:curve);
  for(let k=0;k<n;k++){
    const spread=(n>1?(k/(n-1)-0.5):0);
    const x0=(rng()-0.5)*wPx*0.16;                                   // base near a central crown
    const baseY=-hPx*0.08, topY=-hPx*(0.42+rng()*0.56);
    const xT=x0+spread*wPx*0.78 + (rng()-0.5)*wPx*0.04;              // tip splays outward
    const sw=Math.max(0.8,wPx*0.05*(stemScale==null?1:stemScale)), fLo=-hPx*(fs==null?0.28:fs), fTop=Math.min(topY,fLo-hPx*0.1);
    const side=(spread>=0?1:-1), mx=(x0+xT)/2 + cv*wPx*0.22*side, my=(baseY+topY)*0.5;
    els.push(<path key={"ss"+k} d={`M ${x0} ${baseY} Q ${mx} ${my} ${xT} ${topY}`} stroke={darken(foliage,0.1)} strokeWidth={sw*0.55} fill="none" strokeLinecap="round"/>);
    if(blooming){
      const seg=Math.max(3,Math.round(((fine?5:7)+Math.round(rng()*(fine?2:4)))*(flps==null?1:flps)));
      for(let j=0;j<seg;j++){
        const t=j/seg, yy=fLo+(fTop-fLo)*t, hf=(yy-baseY)/((topY-baseY)||1);
        const fx=x0+(xT-x0)*hf + cv*wPx*0.22*side*Math.sin(hf*Math.PI);   // flowers ride the arching stem
        const ww=sw*((fine?1.1:1.7)*(1-t)+(fine?0.25:0.4))*(fsz||1);
        els.push(<circle key={`sf${k}_${j}`} cx={fx+(rng()-0.5)*sw*0.7} cy={yy} r={ww} fill={j%2?color:lighten(color,0.12)} opacity={fine?0.82:1}/>);
      }
      els.push(<circle key={"sft"+k} cx={xT} cy={fTop} r={sw*0.6} fill={lighten(color,0.3)} opacity={0.7}/>);
    } else els.push(<circle key={"sg"+k} cx={xT} cy={topY} r={sw*0.7} fill={lighten(foliage,0.1)} opacity={0.8}/>);
  }
  return els;
}

// arching ornamental grass with feathery seedheads
function grassForm(wPx,hPx,foliage,color,plume,rng,n){
  const els=[];
  for(let k=0;k<n;k++){
    const x0=(rng()*2-1)*wPx*0.2, dir=(k%2?1:-1), sway=0.18+rng()*0.28;
    const tipX=x0+dir*wPx*sway, tipY=-hPx*(0.8+rng()*0.18), cX=x0+dir*wPx*0.08, cY=-hPx*0.45, sw=Math.max(1,wPx*0.03);
    els.push(<path key={"gb"+k} d={`M ${x0} 0 Q ${cX} ${cY} ${tipX} ${tipY}`} stroke={darken(foliage,0.08)} strokeWidth={sw} fill="none" strokeLinecap="round" opacity={0.95}/>);
    els.push(<path key={"gl"+k} d={`M ${cX} ${cY} Q ${(cX+tipX)/2} ${(cY+tipY)/2} ${tipX} ${tipY}`} stroke={lighten(foliage,0.14)} strokeWidth={sw*0.65} fill="none" strokeLinecap="round" opacity={0.8}/>);
    if(plume) for(let f=0; f<5; f++){
      const fa=-Math.PI/2 + (rng()-0.5)*0.85, fl=hPx*(0.08+rng()*0.1);
      els.push(<path key={`gp${k}_${f}`} d={`M ${tipX} ${tipY} L ${tipX+Math.cos(fa)*fl} ${tipY+Math.sin(fa)*fl}`} stroke={color} strokeWidth={sw*0.6} fill="none" strokeLinecap="round" opacity={0.85}/>);
    }
  }
  return els;
}

// allium-style starburst globes
function globeForm(wPx,hPx,foliage,color,show,rng){
  const els=[]; const stems=2+Math.round(rng()*2);
  for(let k=0;k<stems;k++){
    const x=(rng()*2-1)*wPx*0.3, top=-hPx*(0.8+rng()*0.12), R=Math.max(4,wPx*0.5);
    els.push(<path key={"gst"+k} d={`M ${x} 0 L ${x} ${top}`} stroke={darken(foliage,0.06)} strokeWidth={Math.max(1.2,wPx*0.06)} fill="none" strokeLinecap="round"/>);
    if(show){
      const fl=18;
      for(let i=0;i<fl;i++){
        const a=(i/fl)*Math.PI*2, rr=R*(0.7+rng()*0.3);
        els.push(<path key={`gfl${k}_${i}`} d={`M ${x} ${top} L ${x+Math.cos(a)*rr} ${top+Math.sin(a)*rr}`} stroke={color} strokeWidth={Math.max(0.7,wPx*0.02)} opacity={0.8}/>);
        els.push(<circle key={`gfd${k}_${i}`} cx={x+Math.cos(a)*rr} cy={top+Math.sin(a)*rr} r={Math.max(0.7,wPx*0.025)} fill={lighten(color,0.15)}/>);
      }
      els.push(<circle key={"ghl"+k} cx={x-R*0.3} cy={top-R*0.3} r={R*0.25} fill={lighten(color,0.35)} opacity={0.4}/>);
    } else els.push(<circle key={"gsd"+k} cx={x} cy={top} r={R*0.5} fill={lighten(foliage,0.06)} opacity={0.7}/>);
  }
  return els;
}

// tulips & daffodils
function bulbForm(wPx,hPx,foliage,color,id,rng){
  const els=[]; const stems=2+Math.round(rng()*2);
  for(let k=0;k<stems;k++){
    const x=(rng()*2-1)*wPx*0.4, top=-hPx*(0.72+rng()*0.18);
    els.push(<path key={"bl"+k} d={`M ${x} 0 Q ${x-wPx*0.12} ${top*0.5} ${x-wPx*0.05} ${top*0.9}`} stroke={darken(foliage,0.05)} strokeWidth={Math.max(1.1,wPx*0.07)} fill="none" strokeLinecap="round"/>);
    els.push(<path key={"bs"+k} d={`M ${x} 0 L ${x} ${top}`} stroke={darken(foliage,0.05)} strokeWidth={Math.max(1.1,wPx*0.05)} fill="none" strokeLinecap="round"/>);
    if(id==="tulip"){
      const w=wPx*0.22,h=hPx*0.24;
      els.push(<path key={"btl"+k} d={`M ${x-w} ${top} C ${x-w} ${top-h} ${x-w*0.3} ${top-h*1.2} ${x} ${top-h*0.9} C ${x+w*0.3} ${top-h*1.2} ${x+w} ${top-h} ${x+w} ${top} Q ${x} ${top+h*0.25} ${x-w} ${top} Z`} fill={color}/>);
      els.push(<path key={"bth"+k} d={`M ${x-w*0.2} ${top-h*0.7} Q ${x} ${top-h*0.4} ${x+w*0.1} ${top-h*0.7}`} stroke={lighten(color,0.25)} strokeWidth={w*0.18} fill="none" strokeLinecap="round" opacity={0.6}/>);
    } else {
      const R=Math.max(3,wPx*0.2);
      for(let i=0;i<6;i++){ const a=(i/6)*Math.PI*2, px=x+Math.cos(a)*R*0.7, py=top+Math.sin(a)*R*0.7; els.push(<ellipse key={`bdp${k}_${i}`} cx={px} cy={py} rx={R*0.5} ry={R*0.28} fill={lighten(color,0.1)} transform={`rotate(${a*180/Math.PI} ${px} ${py})`}/>); }
      els.push(<circle key={"bdc"+k} cx={x} cy={top} r={R*0.5} fill={darken(color,0.12)}/>);
      els.push(<circle key={"bdh"+k} cx={x} cy={top} r={R*0.3} fill={lighten(color,0.05)}/>);
    }
  }
  return els;
}

// spreading groundcover mat
function matForm(wPx,hPx,foliage,color,blooming,rng){
  const els=[]; const rx=wPx*0.53, ry=Math.max(3,hPx*0.7);
  els.push(<path key="m0" d={blobD(0,-ry*0.7,rx,ry,12,0.3,rng)} fill={darken(foliage,0.12)}/>);
  els.push(<path key="m1" d={blobD(0,-ry*0.82,rx*0.95,ry*0.92,12,0.32,rng)} fill={foliage}/>);
  for(let k=0;k<8;k++) els.push(<circle key={"md"+k} cx={(rng()*2-1)*rx*0.8} cy={-ry*(0.5+rng()*0.7)} r={Math.max(1,rx*0.08)} fill={rng()>0.5?lighten(foliage,0.12):darken(foliage,0.08)} opacity={0.6}/>);
  if(blooming){
    const n=10+Math.round(rng()*10);
    for(let k=0;k<n;k++){
      const x=(rng()*2-1)*rx*0.85, y=-ry*(0.4+rng()*0.9);
      els.push(<circle key={"mb"+k} cx={x} cy={y} r={Math.max(1,wPx*0.04)} fill={color}/>);
      els.push(<circle key={"mbh"+k} cx={x-0.5} cy={y-0.5} r={Math.max(0.6,wPx*0.02)} fill={lighten(color,0.3)} opacity={0.7}/>);
    }
  }
  return els;
}

/* ---- flower-zone model: fraction of plant height where blooms begin (0 = ground, 1 = top) ---- */
const FORM_FS = { spike:0.30, daisy:0.50, shrub:0.45, mound:0.40, clump:0.45 };
const FS_OVERRIDE = {
  veronicastrum:0.74, veronicasfascination:0.74, veronicasalbum:0.74, veronicaserica:0.74, verbena:0.78, fritillariaimperialis:0.72,
  thalictrum:0.60, thalblackstockings:0.60, thallavendermist:0.60, thalsplendide:0.60, filipendula:0.60, actaea:0.60,
  joepye:0.62, joepyetall:0.62, eupatoriumchoc:0.60, vernonia:0.60, rodgersia:0.60,
  kniphofiapapaya:0.60, kniphofiapineapple:0.60, kniphofiaroyal:0.60, kniphofiaalcazar:0.60, kniphofiapercy:0.60, kniphofiafireglow:0.60,
  sedum:0.58, sedumdark:0.58, sedumneon:0.58,
  phlox:0.56, phloxjeana:0.56, phloxlaura:0.56, phloxglamour:0.56, phloxrobert:0.56, phloxmaterialgirl:0.56, phloxnicky:0.56, phloxblueparadise:0.56, phloxfranz:0.56, phloxbrighteyes:0.56, phloxstarfire:0.56, phloxdeltasnow:0.56, phloxpeppermint:0.56, phloxmaculata:0.56, phloxfeprincess:0.56, phloxfeflamingo:0.56, phloxfecrystal:0.56, phloxfelavice:0.56,
  monarda:0.55, monardafistulosa:0.55, monardamarshalls:0.55, monardarockin:0.55,
  yarrow:0.55, yarrowterracotta:0.55, yarrowred:0.55, yarrowpink:0.55,
  sanguisorba:0.55, sangblackthorn:0.55, sangtanna:0.55, sangcangshan:0.55, sangmenziesii:0.55,
  chelone:0.55, cleome:0.55, heuchera:0.55, heucheracaramel:0.55, heucheragold:0.55, heucherablack:0.55, heucherasilver:0.55, heucherared:0.55,
  amsonia:0.55, amsoniablueice:0.55, euphorbia:0.55, hosta:0.55, hostagold:0.55, hostamini:0.55, hostablue:0.55, hostapatriot:0.55,
  acanthus:0.50, aruncus:0.50, ligularia:0.50, lavender:0.50, lavendermunstead:0.50, lavenderphenomenal:0.50,
  irissiberian:0.50, irissiberianwhite:0.50, irisbeardedpink:0.50, irisbeardedpurple:0.50, irisbeardedyellow:0.50,
  asiaticlily:0.50, orientalstargazer:0.50, orientalcasablanca:0.50, tigerlily:0.50, camassia:0.50,
  gaura:0.50, pycnanthemum:0.50, daylily:0.50, daylilyred:0.50, daylilypink:0.50, daylilytall:0.50,
  butterflyweed:0.50, swampmilkweed:0.50, centranthus:0.50, aquilegia:0.50, dahlia:0.50, nicotiana:0.50,
  brunnera:0.50, brunnerajack:0.50, brunneralooking:0.50, brunneravariegata:0.50, bergenia:0.50, geum:0.50, heucherellasweet:0.50,
  foxglove:0.42, foxgloveapricot:0.42, astilbe:0.42, astilbewhite:0.42, astilbepink:0.42, astilbepurple:0.42,
  delphinium:0.40, hollyhock:0.38, lupine:0.40, penstemon:0.40, penstemonred:0.40, penstemonpurple:0.40, lobelia:0.40,
  agastache:0.40, agastacheapricot:0.40, agastacheorange:0.40, agastacherose:0.40, persicaria:0.40,
  goldenrod:0.45, seaholly:0.45, celosia:0.45, physostegia:0.45, thermopsis:0.45,
  crocosmialucifer:0.45, crocosmiaemily:0.45, crocosmiageorge:0.45, crocosmiastar:0.45, crocosmiasolfatare:0.45, crocosmiaprince:0.45,
  campanulapers:0.40, campanulasarastro:0.40, liatris:0.38, liatriswhite:0.38, liatristall:0.38, snapdragon:0.40, angelonia:0.38, hyacinth:0.35,
  caryopteris:0.35, caryopterisgold:0.35, mum:0.35, scabiosa:0.35, spirea:0.35,
  hellebore:0.32, hellebrwhite:0.32, hellebrslate:0.32, hellebryellow:0.32, hellebrpink:0.32, solomonseal:0.32,
  lungwortraspberry:0.35, lungworttrevi:0.35, lungwortsilver:0.35,
  coreopsis:0.30, coreopsisgold:0.30, coreopsisred:0.30, pelargonium:0.32, lantana:0.30, pentas:0.30, marigold:0.30,
  petunia:0.26, begonia:0.26, impatiens:0.26, ageratum:0.26, scaevola:0.26,
  nepeta:0.18, nepetagiant:0.18, nepetacat:0.18, calamint:0.20,
  geraniumjohnson:0.25, geraniumsanguineum:0.25, rozanne:0.25, geraniumdark:0.25,
};
const FINE_SPIKE = new Set(["salvia","salviarose","salviawhite","veronicapink","veronicawhite","gaura","verbena","perovskia","sanguisorba","sangblackthorn","sangtanna","sangcangshan","sangmenziesii","thalictrum","thalblackstockings","thallavendermist","thalsplendide","veronicastrum","veronicasfascination","veronicasalbum","veronicaserica"]);
const flowerStartFor = (p)=> (FS_OVERRIDE[p.id] != null ? FS_OVERRIDE[p.id] : (FORM_FS[p.form] != null ? FORM_FS[p.form] : 0.40));
const fineFor = (p)=> FINE_SPIKE.has(p.id);
const FLOWER_SCALE = {
  gaura:[0.55,1.3], foxglove:[1.4,1.2], delphinium:[1.4,1.3], sedum:[1.7,0.85], sedumdark:[1.7,0.85], sedumneon:[1.7,0.85], sedumgold:[1.7,0.85], sedumdragon:[1.7,0.85],
  perovskia:[0.8,2.2], salvia:[0.7,2.4], salviarose:[0.7,2.4], salviawhite:[0.7,2.4], veronica:[0.7,2.4], veronicapink:[0.7,2.4], veronicawhite:[0.7,2.4], liatris:[2.0,1], liatriswhite:[2.0,1], liatristall:[2.0,1], sanguisorba:[1.1,1.9], sangblackthorn:[2.3,0.9], sangtanna:[2.0,1], sangcangshan:[2.0,1], sangmenziesii:[2.0,1],
  // [flowerSize, flowerCount] multipliers. Massed small-flowered shrubs (many tiny flowers):
  weigela:[2.2,2], sonicbloompink:[2.2,2], sonicbloomred:[2.2,2], sonicbloompearl:[2.2,2], sonicbloompunch:[2.2,2], sonicbloomghost:[2.2,2], sonicbloomwine:[2.2,2],
  mymonet:[2.2,2], mymonetpurple:[2.2,2], mymonetsunset:[2.2,2], spilledwine:[2.2,2], finewine:[2.2,2], midnightwine:[2.2,2], redprince:[2.2,2], weigelavariegata:[2.2,2], minuet:[2.2,2], czechmark:[2.2,2], electriclove:[2.2,2], tuxedo:[2.2,2],
  spirea:[0.40,2.2], lilac:[1.5,2.0], lilacmisskim:[1.5,2.0], lilacbloomerang:[1.5,2.0],
  buddleiablack:[1.6,0.9], buddleiaroyalred:[1.6,0.9], buddleiapink:[1.6,0.9], buddleiananho:[1.6,0.9], buddleiawhite:[1.6,0.9], buddleiabluechip:[1.6,0.9], buddleiapurplehaze:[1.6,0.9], buddleiamissmolly:[1.6,0.9], buddleiamissruby:[1.6,0.9], buddleiaasianmoon:[1.6,0.9], buddleiapugster:[1.6,0.9],
  forsythia:[0.50,2.2], caryopteris:[0.45,2.0], caryopterisgold:[0.45,2.0],
  viburnumcarlesii:[0.50,4.0], viburnumdentatum:[0.50,4.0], viburnumplicatum:[0.50,4.0],
  aronia:[0.50,1.8], itea:[0.40,2.0], sambucus:[0.38,2.2], sambucusgold:[0.38,2.2], hamamelis:[0.50,1.8],
  cornusarctic:[0.45,1.8], ivoryhalo:[0.45,1.8], clethra:[0.45,1.9], diervilla:[0.50,1.8], fothergilla:[0.50,3.6],
  smokebush:[0.35,2.4], ninebark:[0.50,1.8], physocarpusgold:[0.50,1.8],
  // Big-flowered (few large blooms):
  annabelle:[3.8,0.32], limelight:[1.3,4.2], hydrangeabobo:[1.2,4.0], hydrangeaendless:[3.2,0.7], hydrangeaoak:[1.2,4.0],
  peony:[4,0.7], peonywhite:[4,0.7], peonyred:[4,0.7], peonycoral:[4,0.7],
  rose:[1.2,0.85], hibiscusred:[6,0.5], hibiscuspink:[6,0.5], hibiscuswhite:[6,0.5],
  asiaticlily:[1.6,0.70], orientalstargazer:[1.6,0.70], orientalcasablanca:[1.6,0.70], tigerlily:[1.6,0.70],
  // Tiny flowers massed in plumes / flat heads:
  astilbe:[0.6,1.4], astilbewhite:[0.6,1.4], astilbepink:[0.6,1.4], astilbepurple:[0.6,1.4],
  goldenrod:[0.5,1.5], filipendula:[0.55,1.5], aruncus:[0.55,1.5],
  yarrow:[1.5,1.1], yarrowterracotta:[1.5,1.1], yarrowred:[1.5,1.1], yarrowpink:[1.5,1.1],
};
const flowerScaleFor = (p)=> FLOWER_SCALE[p.id] || [1,1];

/* ---- stem/branch thickness multiplier (fine-spike plants default thin) ---- */
const STEM_SCALE = {
  liatris:1.3, liatriswhite:1.3, liatristall:1.3,
  delphinium:1.3, hollyhock:1.3, lupine:1.2, foxglove:1.2, foxgloveapricot:1.2, ligularia:1.25, acanthus:1.3, cleome:1.15,
  kniphofiapapaya:1.25, kniphofiapineapple:1.25, kniphofiaroyal:1.25, kniphofiaalcazar:1.25, kniphofiapercy:1.25, kniphofiafireglow:1.25,
  crocosmialucifer:1.15, crocosmiaemily:1.15, crocosmiageorge:1.15, crocosmiastar:1.15, crocosmiasolfatare:1.15, crocosmiaprince:1.15,
  hibiscusred:1.2, hibiscuspink:1.2, hibiscuswhite:1.2,
  veronicastrum:0.7, veronicasfascination:0.7, veronicasalbum:0.7, veronicaserica:0.7,
  gaura:0.45, verbena:0.5, thalictrum:0.5, thalblackstockings:0.5, thallavendermist:0.5, thalsplendide:0.5, perovskia:0.6,
  sanguisorba:0.55, sangblackthorn:0.55, sangtanna:0.55, sangcangshan:0.55, sangmenziesii:0.55,
};
const stemScaleFor = (p)=> (STEM_SCALE[p.id] != null ? STEM_SCALE[p.id] : (fineFor(p) ? 0.55 : 1.0));

/* ---- flowers-per-spike multiplier (bloom density along each spike) ---- */
const FLPS = {
  liatris:1.5, liatriswhite:1.5, liatristall:1.5, veronica:1.3, veronicapink:1.3, veronicawhite:1.3,
  salvia:1.25, salviaA:1.25, salviarose:1.25, salviawhite:1.25, agastache:1.3, agastacheapricot:1.3, agastacheorange:1.3, agastacherose:1.3,
  foxglove:1.4, foxgloveapricot:1.4, delphinium:1.4, lupine:1.4, hollyhock:1.3, snapdragon:1.3, lavender:1.3, lavendermunstead:1.3, lavenderphenomenal:1.3,
  veronicastrum:1.4, veronicasfascination:1.4, veronicasalbum:1.4, veronicaserica:1.4, persicaria:1.3, chelone:1.2, physostegia:1.25,
  penstemon:1.15, penstemonred:1.15, penstemonpurple:1.15, lobelia:1.2, celosia:1.3, goldenrod:1.4,
  astilbe:1.4, astilbewhite:1.4, astilbepink:1.4, astilbepurple:1.4,
  gaura:0.45, verbena:0.65, thalictrum:0.6, thalblackstockings:0.6, thallavendermist:0.6, thalsplendide:0.6, perovskia:1.9,
  sanguisorba:0.7, sangblackthorn:0.7, sangtanna:0.7, sangcangshan:0.7, sangmenziesii:0.7,
  asiaticlily:0.45, orientalstargazer:0.45, orientalcasablanca:0.45, tigerlily:0.45,
  irissiberian:0.5, irissiberianwhite:0.5, irisbeardedpink:0.5, irisbeardedpurple:0.5, irisbeardedyellow:0.5,
};
const flpsFor = (p)=> (FLPS[p.id] != null ? FLPS[p.id] : 1.0);

/* ---- inflorescence shape override: "flat" plate, "cone" panicle (else form default) ---- */
const BLOOM_SHAPE = {
  sedum:"flat", sedumdark:"flat", sedumneon:"flat",
  yarrow:"flat", yarrowterracotta:"flat", yarrowred:"flat", yarrowpink:"flat",
  sambucus:"flat", sambucusgold:"flat", viburnumdentatum:"flat", viburnumplicatum:"flat",
  limelight:"cone", hydrangeabobo:"cone", hydrangeaoak:"cone",
  lilac:"cone", lilacmisskim:"cone", lilacbloomerang:"cone",
  buddleiablack:"cone", buddleiaroyalred:"cone", buddleiapink:"cone", buddleiananho:"cone", buddleiawhite:"cone", buddleiabluechip:"cone", buddleiapurplehaze:"cone", buddleiamissmolly:"cone", buddleiamissruby:"cone", buddleiaasianmoon:"cone", buddleiapugster:"cone",
  itea:"cone", clethra:"cone",
  annabelle:"ball", hydrangeaendless:"ball",
  sanguisorba:"bottle", sangblackthorn:"bottle", sangtanna:"bottle", sangcangshan:"bottle", sangmenziesii:"bottle",
  liatris:"bottle", liatriswhite:"bottle", liatristall:"bottle",
  veronicastrum:"candelabra", veronicasfascination:"candelabra", veronicasalbum:"candelabra", veronicaserica:"candelabra", verbena:"candelabra",
};
const bloomShapeFor = (p)=> BLOOM_SHAPE[p.id] || null;
/* ---- stem curvature (wiry / arching stems) ---- */
const STEM_CURVE = {
  sanguisorba:0.5, sangblackthorn:0.5, sangtanna:0.5, sangcangshan:0.5, sangmenziesii:0.5,
  liatris:0.18, liatriswhite:0.18, liatristall:0.18, perovskia:0.18, gaura:0.34, verbena:0.12,
  thalictrum:0.22, thalblackstockings:0.22, thallavendermist:0.22, thalsplendide:0.22,
};
const curveFor = (p)=> (STEM_CURVE[p.id] != null ? STEM_CURVE[p.id] : 0);
/* ---- basal foliage height as a fraction of plant height (foliage low vs leafy-stemmed) ---- */
const BASAL_DEFAULT = { clump:0.36, daisy:0.24, spike:0.26, mound:0.5 };
const basalFracFor = (p)=> (p.basal != null ? p.basal : (BASAL_DEFAULT[p.form] || 0.36));
/* ---- which single-head shape a plant uses, and (candelabra) what sits on each branch ---- */
const INFLOR_HEAD = { corymb:"flat", cyme:"ball", umbel:"umbel", panicle:"cone", head:"puff", solitary:"single" };
const SHAPE_HEAD = { flat:"flat", cone:"cone", ball:"ball" };
const headFor = (p)=>{
  if(p.inflor && INFLOR_HEAD[p.inflor]) return INFLOR_HEAD[p.inflor];
  const sh=bloomShapeFor(p); if(SHAPE_HEAD[sh]) return SHAPE_HEAD[sh];
  return p.form==="clump" ? "puff" : "single";
};
const CANDELABRA_HEAD = { verbena:"flat" };
const GRASS_TYPE={calamagrostis:"reed",calamagrostisoverdam:"reed",pennisetum:"fountain",pennisetumredhead:"fountain",pennisetumlittlebunny:"fountain",pennisetumkarley:"fountain",pennisetumrubrum:"fountain",pennisetumfireworks:"fountain",forestgrass:"forest",carex:"sedge",carexgold:"sedge",pennsedge:"sedge",palmsedge:"sedge",moorgrass:"sedge",feathergrass:"feather",panicum:"switch",panicumblue:"switch",panicumnorthwind:"switch",switchcheyenne:"switch",prairiedropseed:"haze",dropseedtara:"haze",deschampsia:"haze",lovegrass:"haze",molinia:"moor",bloodgrass:"blood",miscanthusmorning:"maiden",miscanthusgracillimus:"maiden",miscanthusadagio:"maiden",miscanthuszebra:"maiden",littlebluestem:"bluestem",littlebluestemovation:"bluestem",littlebluestemblues:"bluestem",littlebluestemtwilight:"bluestem",littlebluestemcarousel:"bluestem",bigbluestem:"turkeyfoot",bluegrama:"grama",seaoats:"oats",blueoat:"fescue",bluefescue:"fescue"};
const GRASS_VG=new Set(["forestgrass","carex","carexgold","miscanthuszebra","miscanthusmorning","pennisetumfireworks","calamagrostisoverdam"]);
const SEDUMS = new Set(["sedum","sedumdark","sedumneon","sedumgold","sedumdragon"]);
const MYMONET = new Set(["mymonet","mymonetsunset","mymonetpurple"]);
const BRANCHED = new Set(["ninebark","physocarpusgold","weigela","sonicbloompink","sonicbloomred","sonicbloompearl","sonicbloompunch","sonicbloomghost","sonicbloomwine","mymonet","mymonetpurple","mymonetsunset","spilledwine","finewine","midnightwine","redprince","weigelavariegata","minuet","czechmark","electriclove","tuxedo","buddleiablack","buddleiaroyalred","buddleiapink","buddleiananho","buddleiawhite","buddleiabluechip","buddleiapurplehaze","buddleiamissmolly","buddleiamissruby","buddleiaasianmoon","buddleiapugster","lilac","lilacmisskim","lilacbloomerang"]);
const VARIEGATED = new Set(["weigelavariegata","mymonet","mymonetsunset","mymonetpurple"]);

/* ---- flat-topped flower plate (sedum, yarrow, elderberry umbels) ---- */
function flatCluster(wPx,hPx,color,rng,n,fs,fsz){
  const els=[]; const lo=(fs==null?0.6:fs);
  for(let k=0;k<n;k++){
    const cx=(rng()*2-1)*wPx*0.4, cy=-hPx*(lo+rng()*Math.max(0.06,0.93-lo));
    const rx=Math.max(4,wPx*0.17*(fsz||1)), ry=rx*0.5;
    els.push(<ellipse key={"fcs"+k} cx={cx} cy={cy+ry*0.32} rx={rx} ry={ry} fill={darken(color,0.22)} opacity={0.5}/>);
    els.push(<ellipse key={"fcb"+k} cx={cx} cy={cy} rx={rx} ry={ry} fill={color}/>);
    const florets=26+Math.round(rng()*20);
    for(let i=0;i<florets;i++){
      const a=rng()*Math.PI*2, rr=Math.sqrt(rng()), fr=Math.max(0.7,rx*0.11);
      const fx=cx+Math.cos(a)*rx*rr*0.96, fy=cy+Math.sin(a)*ry*rr*0.96 - ry*0.16;
      els.push(<circle key={`fcg${k}_${i}`} cx={fx+fr*0.18} cy={fy+fr*0.18} r={fr*1.08} fill={darken(color,0.24)} opacity={0.45}/>);
      els.push(<circle key={`fcf${k}_${i}`} cx={fx} cy={fy} r={fr} fill={rng()>0.5?lighten(color,0.16):color}/>);
    }
    els.push(<ellipse key={"fch"+k} cx={cx-rx*0.22} cy={cy-ry*0.34} rx={rx*0.42} ry={ry*0.34} fill={lighten(color,0.3)} opacity={0.5}/>);
  }
  return els;
}

/* ---- tapered cone / panicle (panicle hydrangea, lilac, butterfly bush) ---- */
function coneSpire(wPx,hPx,foliage,color,blooming,rng,n,fs,fsz){
  const els=[...leafBaseLow(wPx,hPx*0.34,foliage,rng)]; const lo=(fs==null?0.45:fs);
  for(let k=0;k<n;k++){
    const x=(rng()*2-1)*wPx*0.34;
    const baseY=-hPx*(lo+rng()*0.12), coneH=hPx*(0.26+rng()*0.16)*Math.min(1.5,(fsz||1)+0.25), tipY=baseY-coneH;
    const wBase=Math.max(4,wPx*0.16*(fsz||1));
    els.push(<path key={"cnst"+k} d={`M ${x} ${-hPx*0.05} Q ${x} ${baseY*0.5} ${x} ${baseY}`} stroke={darken(foliage,0.06)} strokeWidth={Math.max(1,wPx*0.022)} fill="none" strokeLinecap="round" opacity={0.9}/>);
    els.push(<path key={"cns"+k} d={`M ${x-wBase} ${baseY} Q ${x} ${baseY-coneH*0.35} ${x+wBase} ${baseY} Q ${x+wBase*0.4} ${tipY+coneH*0.2} ${x} ${tipY} Q ${x-wBase*0.4} ${tipY+coneH*0.2} ${x-wBase} ${baseY} Z`} fill={darken(color,0.18)} opacity={0.5}/>);
    if(blooming){
      const layers=15+Math.round(rng()*6);
      for(let j=0;j<layers;j++){
        const t=j/layers, yy=baseY-coneH*t, hw=wBase*(1-t*0.85), per=2+Math.round((1-t)*5);
        for(let i=0;i<per;i++){
          const fx=x+(rng()*2-1)*hw, fy=yy+(rng()-0.5)*coneH*0.05, fr=Math.max(0.8,wBase*0.2*(1-t*0.35));
          els.push(<circle key={`cg${k}_${j}_${i}`} cx={fx+fr*0.16} cy={fy+fr*0.16} r={fr*1.08} fill={darken(color,0.24)} opacity={0.5}/>);
          els.push(<circle key={`cnf${k}_${j}_${i}`} cx={fx} cy={fy} r={fr} fill={(i+j)%2?color:lighten(color,0.12)}/>);
          els.push(<circle key={`ch${k}_${j}_${i}`} cx={fx-fr*0.2} cy={fy-fr*0.2} r={fr*0.3} fill={lighten(color,0.28)} opacity={0.7}/>);
        }
      }
    } else els.push(<path key={"cng"+k} d={`M ${x} ${baseY} L ${x} ${tipY}`} stroke={lighten(foliage,0.08)} strokeWidth={Math.max(1,wBase*0.2)} opacity={0.6}/>);
  }
  return els;
}

/* ---- herbaceous clump foliage (lower, leafy, upright) — NOT a woody dome ---- */
function clumpFoliage(wPx,hPx,foliage,rng,frac){
  const els=[]; const fh=hPx*(frac==null?0.36:frac), rx=wPx*0.44;
  els.push(<path key="cf0" d={blobD(0,-fh*0.3,rx,fh*0.4,12,0.3,rng)} fill={darken(foliage,0.14)}/>);
  els.push(<path key="cf1" d={blobD(0,-fh*0.36,rx*0.95,fh*0.44,13,0.34,rng)} fill={foliage}/>);
  const stems=6+Math.round(rng()*4);
  for(let k=0;k<stems;k++){
    const x0=(rng()*2-1)*rx*0.5, dir=(rng()*2-1)*0.6;
    const tipX=x0+dir*wPx*0.12, tipY=-fh*(0.78+rng()*0.28), sw=Math.max(1,wPx*0.028);
    els.push(<path key={"cfs"+k} d={`M ${x0} 0 Q ${x0+dir*wPx*0.04} ${tipY*0.5} ${tipX} ${tipY}`} stroke={k%2?lighten(foliage,0.05):darken(foliage,0.06)} strokeWidth={sw} fill="none" strokeLinecap="round" opacity={0.85}/>);
    const lv=2+Math.round(rng()*2);
    for(let l=0;l<lv;l++){ const t=0.25+l*(0.6/lv), lx=x0+(tipX-x0)*t, ly=(tipY)*t; els.push(<ellipse key={`cfl${k}_${l}`} cx={lx} cy={ly} rx={wPx*0.05} ry={wPx*0.022} fill={l%2?lighten(foliage,0.08):foliage} transform={`rotate(${dir*38} ${lx} ${ly})`} opacity={0.88}/>); }
  }
  for(let k=0;k<4;k++){ const a=rng()*Math.PI*2, rr=rng()*0.6; els.push(<path key={"cfd"+k} d={blobD(Math.cos(a)*rx*rr,-fh*0.32+Math.sin(a)*fh*0.28,rx*0.18,fh*0.14,8,0.4,rng)} fill={rng()>0.5?lighten(foliage,0.1):darken(foliage,0.05)} opacity={0.55}/>); }
  els.push(<path key="cfh" d={blobD(-rx*0.28,-fh*0.5,rx*0.4,fh*0.24,9,0.32,rng)} fill={lighten(foliage,0.16)} opacity={0.65}/>);
  return els;
}

/* ---- terminal bottlebrush: wiry radiating stems, fuzzy tuft at each tip (burnet, liatris) ---- */
function bottlebrush(wPx,hPx,foliage,color,blooming,rng,n,fs,fsz,stemScale,curve){
  const els=[...leafBaseLow(wPx,hPx*0.3,foliage,rng)];
  const cv=(curve==null?0.4:curve);
  for(let k=0;k<n;k++){
    const spread=(n>1?(k/(n-1)-0.5):0);
    const x0=(rng()-0.5)*wPx*0.18, baseY=-hPx*0.06;
    const topY=-hPx*(0.78+rng()*0.16);
    const xT=x0+spread*wPx*0.74 + (rng()-0.5)*wPx*0.05;
    const sw=Math.max(0.8,wPx*0.035*(stemScale==null?1:stemScale)), side=(spread>=0?1:-1);
    els.push(<path key={"bbs"+k} d={`M ${x0} ${baseY} Q ${(x0+xT)/2+cv*wPx*0.26*side} ${(baseY+topY)*0.5} ${xT} ${topY}`} stroke={darken(foliage,0.08)} strokeWidth={sw} fill="none" strokeLinecap="round"/>);
    if(blooming){
      const tuftLen=hPx*(0.06+0.09*(fsz||1)), tuftW=Math.max(2.2,wPx*0.06*(fsz||1)), florets=16+Math.round(rng()*12);
      for(let j=0;j<florets;j++){
        const tt=rng(), ty=topY - tuftLen*tt + tuftLen*0.12, taper=1-tt*0.45, tx=xT+(rng()-0.5)*tuftW*taper;
        els.push(<circle key={`btf${k}_${j}`} cx={tx} cy={ty} r={Math.max(0.7,tuftW*0.27*(0.7+rng()*0.5))} fill={(j%2)?color:lighten(color,0.14)} opacity={0.92}/>);
      }
      els.push(<circle key={"btt"+k} cx={xT} cy={topY-tuftLen*0.9} r={Math.max(0.8,tuftW*0.3)} fill={lighten(color,0.28)} opacity={0.7}/>);
    }
  }
  return els;
}

/* ---- candelabra: tall bare stems that fork into several slim flower spikes (Culver's root) ---- */
function candelabra(wPx,hPx,foliage,color,blooming,rng,n,fs,fsz,stemScale,headType){
  const els=[...leafBaseLow(wPx,hPx*0.3,foliage,rng)];
  for(let k=0;k<n;k++){
    const x0=(n>1?(k/(n-1)-0.5):0)*wPx*0.5 + (rng()-0.5)*wPx*0.08;
    const stemTop=-hPx*(0.62+rng()*0.1), sw=Math.max(1,wPx*0.04*(stemScale==null?1:stemScale));
    els.push(<path key={"cds"+k} d={`M ${x0} 0 Q ${x0+(rng()-0.5)*wPx*0.04} ${stemTop*0.5} ${x0} ${stemTop}`} stroke={darken(foliage,0.08)} strokeWidth={sw} fill="none" strokeLinecap="round"/>);
    const branches=3+Math.round(rng()*2);
    for(let b=0;b<branches;b++){
      const sp=(branches>1?(b/(branches-1)-0.5):0), bx=x0+sp*wPx*0.18, byTop=-hPx*(0.86+rng()*0.12);
      els.push(<path key={`cdb${k}_${b}`} d={`M ${x0} ${stemTop} Q ${(x0+bx)/2} ${stemTop*1.08} ${bx} ${byTop}`} stroke={darken(foliage,0.06)} strokeWidth={sw*0.7} fill="none" strokeLinecap="round"/>);
      if(blooming){
        if(headType){ els.push(...headAt(bx, byTop, headType, Math.max(2,wPx*0.042*(fsz||1)), color, rng, `cd${k}_${b}_`)); }
        else {
          const seg=6+Math.round(rng()*3), sBase=byTop*0.84;
          for(let j=0;j<seg;j++){ const t=j/seg, yy=sBase+(byTop-sBase)*t, ww=Math.max(0.7,sw*0.9*(1-t*0.5)*(fsz||1)); els.push(<circle key={`cdf${k}_${b}_${j}`} cx={bx+(rng()-0.5)*sw*0.6} cy={yy} r={ww} fill={j%2?color:lighten(color,0.14)} opacity={0.9}/>); }
          els.push(<circle key={`cdt${k}_${b}`} cx={bx} cy={byTop} r={sw*0.5} fill={lighten(color,0.3)} opacity={0.7}/>);
        }
      }
    }
  }
  return els;
}

/* ---- raceme: florets on visible pedicels up an elongated stem, open at the bottom ---- */
function racemeForm(wPx,hPx,foliage,color,blooming,rng,n,fs,fsz,stemScale,curve){
  const els=[...leafBaseLow(wPx,hPx*0.32,foliage,rng)];
  const cv=(curve==null?0:curve);
  for(let k=0;k<n;k++){
    const spread=(n>1?(k/(n-1)-0.5):0);
    const x0=(rng()-0.5)*wPx*0.18, baseY=-hPx*0.10, topY=-hPx*(0.82+rng()*0.14);
    const xT=x0+spread*wPx*0.4+(rng()-0.5)*wPx*0.03;
    const sw=Math.max(0.9,wPx*0.05*(stemScale==null?1:stemScale)), side=(spread>=0?1:-1);
    const mx=(x0+xT)/2+cv*wPx*0.2*side, my=(baseY+topY)*0.5;
    els.push(<path key={"rs"+k} d={`M ${x0} ${baseY} Q ${mx} ${my} ${xT} ${topY}`} stroke={darken(foliage,0.1)} strokeWidth={sw*0.6} fill="none" strokeLinecap="round"/>);
    if(blooming){
      const fLo=-hPx*(fs==null?0.34:fs), span=fLo-topY, cols=Math.max(13,Math.round(17+rng()*6));
      for(let j=0;j<cols;j++){
        const t=j/(cols-1||1), yy=fLo-span*t, hf=(yy-baseY)/((topY-baseY)||1);
        const sx=x0+(xT-x0)*hf+cv*wPx*0.16*side*Math.sin(hf*Math.PI);
        const hw=sw*(1.6*(1-t*0.42)+0.5)*(fsz||1), fr=Math.max(1.0,hw*0.55);
        if(t<0.85){
          const across=1+Math.round((1-t)*1.4);
          for(let a=0;a<across;a++){
            const off=(across>1?(a/(across-1)-0.5):0)*hw*1.1+(rng()-0.5)*hw*0.32, fx=sx+off;
            els.push(<circle key={`rg${k}_${j}_${a}`} cx={fx+fr*0.16} cy={yy+fr*0.16} r={fr*1.06} fill={darken(color,0.26)} opacity={0.5}/>);
            els.push(<circle key={`rf${k}_${j}_${a}`} cx={fx} cy={yy} r={fr} fill={(j+a)%2?color:lighten(color,0.1)}/>);
            els.push(<circle key={`rh${k}_${j}_${a}`} cx={fx-fr*0.22} cy={yy-fr*0.22} r={fr*0.3} fill={lighten(color,0.3)} opacity={0.7}/>);
          }
        } else els.push(<circle key={`rb${k}_${j}`} cx={sx} cy={yy} r={fr*0.55} fill={lighten(foliage,0.06)} opacity={0.8}/>);
      }
    }
  }
  return els;
}

/* ---- umbel: stalks radiating from a single node into a flat or rounded head ---- */
function umbelForm(wPx,hPx,foliage,color,blooming,rng,n,fs,fsz,stemScale,roundish){
  const els=[...leafBaseLow(wPx,hPx*0.22,foliage,rng)];
  for(let k=0;k<n;k++){
    const x=(rng()*2-1)*wPx*0.3, nodeY=-hPx*(fs==null?0.6:fs)-rng()*hPx*0.08, sw=Math.max(0.9,wPx*0.04*(stemScale==null?1:stemScale));
    els.push(<path key={"us"+k} d={`M ${x} ${-hPx*0.04} Q ${x+(rng()-0.5)*wPx*0.04} ${nodeY*0.5} ${x} ${nodeY}`} stroke={darken(foliage,0.1)} strokeWidth={sw} fill="none" strokeLinecap="round"/>);
    if(blooming){
      const R=Math.max(4,wPx*0.18*(fsz||1)), rays=16+Math.round(rng()*10), dome=(roundish?1:0);
      for(let i=0;i<rays;i++){
        const a=(i/rays)*Math.PI*2 + rng()*0.25, rr=R*(0.7+rng()*0.4);
        const fx=x+Math.cos(a)*rr, fy=nodeY - (dome? Math.sin(a)*rr*0.45 + R*0.18 : (0.5-Math.abs(Math.sin(a)))*R*0.12) - R*0.05;
        const fr=Math.max(0.8,R*0.14);
        els.push(<path key={`uk${k}_${i}`} d={`M ${x} ${nodeY} L ${fx} ${fy}`} stroke={darken(foliage,0.05)} strokeWidth={sw*0.3} opacity={0.65}/>);
        els.push(<circle key={`ug${k}_${i}`} cx={fx+fr*0.14} cy={fy+fr*0.14} r={fr*1.06} fill={darken(color,0.24)} opacity={0.45}/>);
        els.push(<circle key={`uf${k}_${i}`} cx={fx} cy={fy} r={fr} fill={i%2?color:lighten(color,0.12)}/>);
      }
    }
  }
  return els;
}

/* ---- flower stalks rising from a basal clump up to the flower zone (connect blooms to foliage) ---- */
function clumpStems(wPx,hPx,foliage,rng,fLo,fHi,n,stemScale){
  const els=[]; const baseY=-hPx*Math.max(0.04,(fHi==null?0.2:fHi)*0.8), topY=-hPx*((fLo==null?0.5:fLo)+0.02);
  if(topY>=baseY) return els;   // flowers sit within the foliage — no visible stalk needed
  for(let k=0;k<n;k++){
    const spread=(n>1?(k/(n-1)-0.5):0);
    const x0=(rng()-0.5)*wPx*0.2, xT=x0+spread*wPx*0.7+(rng()-0.5)*wPx*0.05;
    const sw=Math.max(0.8,wPx*0.028*(stemScale==null?1:stemScale));
    els.push(<path key={"cls"+k} d={`M ${x0} ${baseY} Q ${(x0+xT)/2} ${(baseY+topY)*0.5} ${xT} ${topY}`} stroke={darken(foliage,0.05)} strokeWidth={sw} fill="none" strokeLinecap="round" opacity={0.9}/>);
  }
  return els;
}

/* ======= ONE flower head drawn at a point — the unit every form composes from ======= */
function headRadius(ht, wPx, fsz){
  const f=(fsz||1);
  if(ht==="ball") return Math.max(4, wPx*0.07)*f;
  if(ht==="cone") return Math.max(3, wPx*0.055)*f;
  if(ht==="flat") return Math.max(4, wPx*0.1)*f;
  if(ht==="umbel") return Math.max(3, wPx*0.06)*f;
  if(ht==="puff") return Math.max(2.5, wPx*0.05)*f;
  return Math.max(1.4, wPx*0.022)*f;   // single
}
function headAt(cx,cy,type,R,color,rng,kp,dir){
  const els=[]; const K=kp||"h", D=(dir==null?0:dir);
  if(type==="cone"){           // pyramid pointing OUTWARD along D (panicle)
    const coneH=R*2.1, layers=10+Math.round(R*0.4);
    const ax=Math.sin(D), ay=-Math.cos(D), px=Math.cos(D), py=Math.sin(D), tx=cx+ax*coneH, ty=cy+ay*coneH;
    els.push(<path key={K+"cb"} d={`M ${cx-px*R} ${cy-py*R} L ${tx} ${ty} L ${cx+px*R} ${cy+py*R} Z`} fill={darken(color,0.18)} opacity={0.35}/>);
    for(let j=0;j<layers;j++){ const t=j/layers, cxj=cx+ax*coneH*t, cyj=cy+ay*coneH*t, hw=R*(1-t*0.82), per=1+Math.round((1-t)*3);
      for(let i=0;i<per;i++){ const off=(rng()*2-1)*hw, fx=cxj+px*off, fy=cyj+py*off, fr=Math.max(0.7,R*0.28*(1-t*0.3));
        els.push(<circle key={K+`cg${j}_${i}`} cx={fx+fr*0.16} cy={fy+fr*0.16} r={fr*1.08} fill={darken(color,0.24)} opacity={0.5}/>);
        els.push(<circle key={K+`cf${j}_${i}`} cx={fx} cy={fy} r={fr} fill={(i+j)%2?color:lighten(color,0.12)}/>);
        els.push(<circle key={K+`ch${j}_${i}`} cx={fx-fr*0.2} cy={fy-fr*0.2} r={fr*0.3} fill={lighten(color,0.28)} opacity={0.6}/>); } }
    return els;
  }
  if(type==="flat"){           // flat-topped plate (corymb)
    const rx=R, ry=R*0.5;
    els.push(<ellipse key={K+"fs"} cx={cx} cy={cy+ry*0.3} rx={rx} ry={ry} fill={darken(color,0.22)} opacity={0.45}/>);
    const fl=Math.max(8,Math.round(R*1.6));
    for(let i=0;i<fl;i++){ const a=rng()*Math.PI*2, rr=Math.sqrt(rng()), fx=cx+Math.cos(a)*rx*rr*0.96, fy=cy+Math.sin(a)*ry*rr*0.96-ry*0.14, fr=Math.max(0.7,R*0.17);
      els.push(<circle key={K+`fg${i}`} cx={fx+fr*0.16} cy={fy+fr*0.16} r={fr*1.08} fill={darken(color,0.24)} opacity={0.45}/>);
      els.push(<circle key={K+`ff${i}`} cx={fx} cy={fy} r={fr} fill={rng()>0.5?lighten(color,0.16):color}/>); }
    return els;
  }
  if(type==="umbel"){          // radiating stalks to a domed head
    const rays=12+Math.round(R*0.7);
    for(let i=0;i<rays;i++){ const a=(i/rays)*Math.PI*2+rng()*0.3, rr=R*(0.7+rng()*0.4), fx=cx+Math.cos(a)*rr, fy=cy+Math.sin(a)*rr*0.5-R*0.1, fr=Math.max(0.7,R*0.15);
      els.push(<path key={K+`uk${i}`} d={`M ${cx} ${cy-R*0.05} L ${fx} ${fy}`} stroke={darken(color,0.2)} strokeWidth={Math.max(0.5,R*0.05)} opacity={0.4}/>);
      els.push(<circle key={K+`uf${i}`} cx={fx} cy={fy} r={fr} fill={i%2?color:lighten(color,0.12)}/>); }
    return els;
  }
  if(type==="ball"){   // mophead: fewer, BIGGER, clearly separated florets (Annabelle)
    els.push(<circle key={K+"bs"} cx={cx+R*0.12} cy={cy+R*0.14} r={R} fill={darken(color,0.22)} opacity={0.32}/>);
    const m=Math.max(6, Math.round(R*0.5));
    for(let j=0;j<m;j++){ const a=rng()*Math.PI*2, rd=Math.sqrt(rng())*R*0.8, fx=cx+Math.cos(a)*rd, fy=cy+Math.sin(a)*rd*0.92, fr=Math.max(1.5,R*0.4);
      els.push(<circle key={K+`bg${j}`} cx={fx+fr*0.2} cy={fy+fr*0.2} r={fr*1.14} fill={darken(color,0.3)} opacity={0.6}/>);
      els.push(<circle key={K+`bf${j}`} cx={fx} cy={fy} r={fr} fill={(j%2)?color:lighten(color,0.1)}/>);
      els.push(<circle key={K+`bp${j}`} cx={fx-fr*0.26} cy={fy-fr*0.26} r={fr*0.36} fill={lighten(color,0.32)} opacity={0.7}/>); }
    return els;
  }
  if(type==="puff"){   // small rounded cluster of little florets (clusters at shrub nodes)
    els.push(<circle key={K+"bs"} cx={cx+R*0.12} cy={cy+R*0.14} r={R} fill={darken(color,0.22)} opacity={0.4}/>);
    const m=Math.max(5, Math.round(R*1.0));
    for(let j=0;j<m;j++){ const a=rng()*Math.PI*2, rd=Math.sqrt(rng())*R*0.9, fx=cx+Math.cos(a)*rd, fy=cy+Math.sin(a)*rd*0.92, fr=Math.max(0.8,R*0.30);
      els.push(<circle key={K+`bg${j}`} cx={fx+fr*0.18} cy={fy+fr*0.18} r={fr*1.1} fill={darken(color,0.26)} opacity={0.5}/>);
      els.push(<circle key={K+`bf${j}`} cx={fx} cy={fy} r={fr} fill={(j%2)?color:lighten(color,0.1)}/>);
      els.push(<circle key={K+`bp${j}`} cx={fx-fr*0.22} cy={fy-fr*0.22} r={fr*0.32} fill={lighten(color,0.3)} opacity={0.65}/>); }
    return els;
  }
  // single distinct flower
  els.push(<circle key={K+"sg"} cx={cx+R*0.18} cy={cy+R*0.18} r={R*1.1} fill={darken(color,0.28)} opacity={0.5}/>);
  els.push(<path key={K+"sb"} d={blobD(cx,cy,R,R*0.95,7,0.22,rng)} fill={(K.charCodeAt(1)%2)?color:lighten(color,0.06)}/>);
  els.push(<circle key={K+"sc"} cx={cx} cy={cy} r={R*0.3} fill={darken(color,0.16)} opacity={0.55}/>);
  els.push(<circle key={K+"sh"} cx={cx-R*0.22} cy={cy-R*0.22} r={R*0.24} fill={lighten(color,0.34)} opacity={0.7}/>);
  return els;
}
/* ---- spread heads across the dome SURFACE (all directions, from ~50% up) ---- */
function canopyHeads(wPx,hPx,ratio,ht,R,n,color,rng){
  const els=[]; const rx=wPx*0.5, ry=hPx*0.5*ratio, cyD=-hPx*0.5*ratio, floor=-hPx*0.48;
  for(let k=0;k<n;k++){
    const u=Math.max(-0.99,Math.min(0.99,((k+0.5)/n*2-1)*0.96+(rng()-0.5)*0.2)), surfTop=cyD - ry*Math.sqrt(Math.max(0,1-u*u*0.92));
    let fy=surfTop + rng()*ry*0.55; if(fy>floor) fy=floor - rng()*ry*0.08;
    const fx=u*rx*0.92, dir=Math.atan2(fx, -(fy-cyD));
    els.push(...headAt(fx, fy, ht, R*(0.8+rng()*0.45), color, rng, `c${k}_`, dir));
  }
  return els;
}
/* ---- a head AT THE TOP of each stalk rising from a basal clump (connected) ---- */
function stalkHeads(wPx,hPx,foliage,ht,R,n,color,rng,fLo,fHi,stemScale){
  const els=[]; const baseY=-hPx*Math.max(0.04,(fHi==null?0.2:fHi)*0.7), lo=(fLo==null?0.5:fLo);
  for(let k=0;k<n;k++){
    const spread=(n>1?(k/(n-1)-0.5):0);
    const x0=(rng()-0.5)*wPx*0.22, xT=x0+spread*wPx*0.66+(rng()-0.5)*wPx*0.05;
    const topY=-hPx*(lo + rng()*Math.max(0.04, 0.94-lo)), sw=Math.max(0.8,wPx*0.03*(stemScale==null?1:stemScale));
    if(topY<baseY) els.push(<path key={"sh"+k} d={`M ${x0} ${baseY} Q ${(x0+xT)/2} ${(baseY+topY)*0.5} ${xT} ${topY}`} stroke={darken(foliage,0.05)} strokeWidth={sw} fill="none" strokeLinecap="round" opacity={0.9}/>);
    els.push(...headAt(xT, topY, ht, R*(0.82+rng()*0.4), color, rng, `s${k}_`));
  }
  return els;
}

/* ---- a small foliage clump, optionally variegated ---- */
function leafTuft(cx,cy,size,color,rng,variegated,kp){
  const els=[]; const K=kp||"t";
  els.push(<path key={K+"0"} d={blobD(cx,cy,size,size*0.82,9,0.34,rng)} fill={darken(color,0.1)}/>);
  els.push(<path key={K+"1"} d={blobD(cx-size*0.08,cy-size*0.08,size*0.82,size*0.66,8,0.36,rng)} fill={color}/>);
  if(variegated){
    els.push(<path key={K+"vm"} d={blobD(cx-size*0.06,cy-size*0.06,size*0.74,size*0.60,9,0.36,rng)} fill="#f4eecb"/>);
    els.push(<path key={K+"vi"} d={blobD(cx-size*0.04,cy-size*0.05,size*0.56,size*0.45,8,0.34,rng)} fill={color}/>);
    els.push(<path key={K+"vh"} d={blobD(cx-size*0.16,cy-size*0.16,size*0.34,size*0.28,7,0.32,rng)} fill={lighten(color,0.16)} opacity={0.6}/>);
  } else {
    els.push(<path key={K+"h"} d={blobD(cx-size*0.18,cy-size*0.18,size*0.4,size*0.34,7,0.34,rng)} fill={lighten(color,0.14)} opacity={0.7}/>);
  }
  return els;
}
/* ---- open, woody-branched shrub: visible arching stems, flowers along/at them ---- */
function branchedShrub(wPx,hPx,foliage,color,blooming,headType,R,rng,nFlowers,variegated,leafScale){
  const els=[]; const woody="#6e5c46", woodyD="#4f4232", LS=(leafScale==null?1:leafScale), dense=(headType==="cone");
  const rx=wPx*0.46, ry=hPx*0.5, cyD=-hPx*0.46, nB=6+Math.round(rng()*3);
  // 1. woody branches rising from base, fanning up/out (visible esp. at the open base)
  for(let k=0;k<nB;k++){
    const spread=(nB>1?(k/(nB-1)-0.5):0);
    const baseX=(rng()-0.5)*wPx*0.16, tipX=spread*rx*1.5+(rng()-0.5)*wPx*0.06;
    const fr2=Math.min(1,(tipX/(rx*1.4))*(tipX/(rx*1.4))), tipY=cyD - ry*0.5*Math.sqrt(Math.max(0,1-fr2)) - rng()*hPx*0.06;
    const ctrlX=baseX+spread*rx*0.5, ctrlY=tipY*0.4, bw=Math.max(2,wPx*0.052);
    els.push(<path key={"bw"+k} d={`M ${baseX} 0 Q ${ctrlX} ${ctrlY} ${tipX} ${tipY}`} stroke={woodyD} strokeWidth={bw} fill="none" strokeLinecap="round"/>);
    els.push(<path key={"bl"+k} d={`M ${baseX} 0 Q ${ctrlX} ${ctrlY} ${tipX} ${tipY}`} stroke={woody} strokeWidth={bw*0.5} fill="none" strokeLinecap="round"/>);
  }
  // 2. central foliage mass (dome of leaf tufts) over the middle/upper; lower base left open to show stems
  const baseClumps=(dense?16:11)+Math.round(rng()*4);
  for(let k=0;k<baseClumps;k++){
    const a=rng()*Math.PI*2, rr=Math.sqrt(rng());
    const fx=Math.cos(a)*rx*rr*0.96, fy=cyD + Math.sin(a)*ry*rr*0.6 - ry*0.06;
    if(fy>-hPx*(dense?0.08:0.15)) continue;
    els.push(...leafTuft(fx,fy,wPx*0.13*LS,foliage,rng,variegated,`bm${k}`));
  }
  // 3. flowers distributed across the upper canopy, each pointing outward/upward, small leaves interspersed
  if(blooming){
    for(let k=0;k<nFlowers;k++){
      const u=Math.max(-0.99,Math.min(0.99,(rng()*2-1)));
      const fx=u*rx*0.97, fy=cyD - ry*0.74*Math.sqrt(Math.max(0,1-u*u*0.9)) + rng()*ry*0.42;
      const dir=Math.atan2(fx, -(fy-cyD));
      els.push(...headAt(fx,fy,headType, R*(0.8+rng()*0.45), color, rng, `bh${k}_`, dir));
      if(rng()>0.55) els.push(...leafTuft(fx+(rng()-0.5)*wPx*0.1, fy+wPx*0.05, wPx*0.06*LS, foliage, rng, variegated, `bhl${k}`));
    }
  }
  return els;
}
function wandFlower(wPx,hPx,foliage,color,blooming,rng){
  const els=[]; els.push(...leafBaseLow(wPx,hPx*0.22,foliage,rng));
  const nW=11+Math.round(rng()*6);
  for(let k=0;k<nW;k++){
    const x0=(rng()*2-1)*wPx*0.18, baseY=-hPx*0.06, lean=(rng()*2-1);
    const topY=-hPx*(0.74+rng()*0.24), tipX=x0+lean*wPx*0.3+(rng()-0.5)*wPx*0.05;
    const ctrlX=x0+lean*wPx*0.2, ctrlY=(baseY+topY)*0.42, sw=Math.max(0.7,wPx*0.012);
    els.push(<path key={"ww"+k} d={`M ${x0} ${baseY} Q ${ctrlX} ${ctrlY} ${tipX} ${topY}`} stroke={darken(foliage,0.04)} strokeWidth={sw} fill="none" strokeLinecap="round"/>);
    if(blooming){
      const qx=(t)=>(1-t)*(1-t)*x0+2*(1-t)*t*ctrlX+t*t*tipX, qy=(t)=>(1-t)*(1-t)*baseY+2*(1-t)*t*ctrlY+t*t*topY;
      const nf=6+Math.round(rng()*5);
      for(let j=0;j<nf;j++){
        const t=0.6+(j/(nf-1||1))*0.4, bx=qx(t), by=qy(t), fr=Math.max(1.1,wPx*0.024)*(0.7+t*0.5);
        for(let pp=0;pp<4;pp++){ const a=pp*Math.PI/2+0.3; els.push(<circle key={`wf${k}_${j}_${pp}`} cx={bx+Math.cos(a)*fr*0.72} cy={by+Math.sin(a)*fr*0.72} r={fr*0.55} fill={pp%2?color:lighten(color,0.12)}/>); }
        els.push(<circle key={`wc${k}_${j}`} cx={bx} cy={by} r={fr*0.3} fill={darken(color,0.1)} opacity={0.65}/>);
      }
      els.push(<circle key={`wt${k}`} cx={tipX} cy={topY} r={Math.max(0.8,wPx*0.014)} fill={lighten(color,0.12)} opacity={0.8}/>);
    }
  }
  return els;
}
function sedumMound(wPx,hPx,foliage,color,blooming,R,rng){
  const els=[]; const rx=wPx*0.5, nS=13+Math.round(rng()*8);
  els.push(<path key="sb0" d={blobD(0,-hPx*0.1,rx*0.92,hPx*0.16,12,0.3,rng)} fill={darken(foliage,0.14)}/>);
  els.push(<path key="sb1" d={blobD(0,-hPx*0.12,rx*0.82,hPx*0.14,12,0.32,rng)} fill={foliage}/>);
  for(let k=0;k<nS;k++){
    const x0=(rng()*2-1)*rx*0.88, baseY=-hPx*0.05, lean=(x0/rx)*0.55+(rng()-0.5)*0.25;
    const topY=-hPx*(0.68+rng()*0.28), tipX=x0+lean*wPx*0.16;
    const ctrlX=x0+lean*wPx*0.07, ctrlY=topY*0.46, sw=Math.max(1,wPx*0.022);
    const qx=(t)=>(1-t)*(1-t)*x0+2*(1-t)*t*ctrlX+t*t*tipX, qy=(t)=>(1-t)*(1-t)*baseY+2*(1-t)*t*ctrlY+t*t*topY;
    els.push(<path key={"ss"+k} d={`M ${x0} ${baseY} Q ${ctrlX} ${ctrlY} ${tipX} ${topY}`} stroke={k%2?lighten(foliage,0.06):darken(foliage,0.05)} strokeWidth={sw} fill="none" strokeLinecap="round" opacity={0.95}/>);
    const lv=3+Math.round(rng()*2);
    for(let l=0;l<lv;l++){ const t=0.18+l*(0.6/lv), lx=qx(t), ly=qy(t), rot=lean*30;
      els.push(<ellipse key={`sl${k}_${l}a`} cx={lx-wPx*0.028} cy={ly} rx={wPx*0.05} ry={wPx*0.02} fill={l%2?lighten(foliage,0.08):foliage} transform={`rotate(${-32+rot} ${lx-wPx*0.028} ${ly})`} opacity={0.9}/>);
      els.push(<ellipse key={`sl${k}_${l}b`} cx={lx+wPx*0.028} cy={ly} rx={wPx*0.05} ry={wPx*0.02} fill={foliage} transform={`rotate(${32+rot} ${lx+wPx*0.028} ${ly})`} opacity={0.9}/>);
    }
    if(blooming) els.push(...headAt(tipX, topY, "flat", R*(0.62+rng()*0.4), color, rng, `sh${k}_`, 0));
  }
  return els;
}
function spireHeads(wPx,hPx,foliage,color,rng,n){
  const els=[]; const rx=wPx*0.5, ratio=0.6, ry=hPx*0.5*ratio, cyD=-hPx*0.5*ratio;
  for(let k=0;k<n;k++){
    const u=((k+0.5)/n*2-1)*0.92+(rng()-0.5)*0.12, baseX=u*rx*0.82;
    const baseY=cyD - ry*0.55*Math.sqrt(Math.max(0,1-u*u*0.85));
    const topY=baseY - hPx*(0.32+rng()*0.18), tipX=baseX+(rng()-0.5)*wPx*0.04, sw=Math.max(0.9,wPx*0.018);
    els.push(<path key={"sps"+k} d={`M ${baseX} ${baseY} Q ${(baseX+tipX)/2} ${(baseY+topY)/2} ${tipX} ${topY}`} stroke={darken(foliage,0.06)} strokeWidth={sw} fill="none" strokeLinecap="round"/>);
    const fl=9+Math.round(rng()*5);
    for(let j=0;j<fl;j++){ const t=j/(fl-1), yy=baseY+(topY-baseY)*t, xx=baseX+(tipX-baseX)*t, fr=Math.max(1,wPx*0.02)*(1-t*0.45), op=t<0.82;
      els.push(<circle key={`spf${k}_${j}`} cx={xx+(j%2?fr*0.55:-fr*0.55)} cy={yy} r={op?fr:fr*0.6} fill={op?(j%2?color:lighten(color,0.12)):lighten(foliage,0.08)}/>); }
  }
  return els;
}
function grassClump(wPx,hPx,foliage,color,plume,rng,n,type,vg){
  const els=[]; const T=type||"fountain", bw=Math.max(0.9,wPx*0.016);
  const liteS=lighten(color,0.24), darkS=darken(color,0.14);
  const bcol=(k)=> vg ? ((k%4===0)?"#f1ecca":(k%2?lighten(foliage,0.14):foliage)) : (k%3===0?darken(foliage,0.06):(k%2?lighten(foliage,0.13):foliage));
  // ===== Japanese forest grass: dense flowing one-way cascade mound, no seed heads =====
  if(T==="forest"){
    const nL=Math.round(n*1.9), rx=wPx*0.5;
    for(let k=0;k<nL;k++){
      const u=(rng()*2-1), x0=u*rx*0.4+(rng()-0.5)*wPx*0.05, baseY=-hPx*(0.32+rng()*0.45);
      const dir=(u>=0?1:-1)*(0.5+Math.abs(u)*0.9);
      const tipX=x0+dir*rx*(0.7+rng()*0.55), tipY=baseY+hPx*(0.22+rng()*0.42);
      const cX=x0+dir*rx*0.42, cY=baseY-hPx*0.05;
      els.push(<path key={"fg"+k} d={`M ${x0} ${baseY} Q ${cX} ${cY} ${tipX} ${Math.min(-hPx*0.02,tipY)}`} stroke={bcol(k)} strokeWidth={bw*1.25} fill="none" strokeLinecap="round" opacity={0.9}/>);
    }
    return els;
  }
  const PT=({reed:[0.2,0.12,0.96],switch:[0.3,0.18,0.9],moor:[0.28,0.18,0.9],bluestem:[0.26,0.2,0.88],turkeyfoot:[0.24,0.16,0.94],grama:[0.32,0.22,0.74],blood:[0.34,0.18,0.78],fountain:[0.66,0.62,0.74],maiden:[0.54,0.5,0.86],oats:[0.58,0.55,0.78],feather:[0.64,0.66,0.7],sedge:[0.72,0.62,0.62],haze:[0.62,0.6,0.58],fescue:[1.05,0.7,0.5]})[T]||[0.6,0.55,0.74];
  const fan=PT[0],arch=PT[1],htop=PT[2],pin=(T==="fescue");
  // ===== foliage base mound (fuller; lower than the flowering culms for most types) =====
  const nFol=Math.round(n*(T==="sedge"?1.8:T==="feather"?1.3:1.0)), folH=(T==="sedge"||T==="feather"||T==="fescue")?htop:htop*0.66;
  for(let k=0;k<nFol;k++){
    const u=(nFol>1?(k/(nFol-1)-0.5):0)*2, x0=u*wPx*0.15+(rng()-0.5)*wPx*0.035, baseY=-hPx*0.02;
    let d; if(pin) d=u*1.12; else d=u*(0.7+Math.abs(u)*0.5)+(rng()-0.5)*0.3;
    const tipX=x0+d*wPx*fan*(0.7+rng()*0.5), tipY=-hPx*folH*(0.6+rng()*0.5);
    const cX=x0+d*wPx*fan*0.45, cY=baseY+(tipY-baseY)*0.5*(1-arch*0.3);
    els.push(<path key={"gb"+k} d={`M ${x0} ${baseY} Q ${cX} ${cY} ${tipX} ${tipY}`} stroke={bcol(k)} strokeWidth={bw} fill="none" strokeLinecap="round" opacity={0.85}/>);
  }
  if(!plume) return els;
  // ===== feather grass: fluffy blonde fine strands with wispy tails (diffuse seed head) =====
  if(T==="feather"){
    const nW=Math.round(n*1.5);
    for(let k=0;k<nW;k++){
      const u=(rng()*2-1), x0=u*wPx*0.14, baseY=-hPx*0.04, d=u*(0.7+Math.abs(u)*0.5)+(rng()-0.5)*0.3;
      const tipX=x0+d*wPx*0.72*(0.7+rng()*0.4), tipY=-hPx*(0.72+rng()*0.26), cX=x0+d*wPx*0.4, cY=(baseY+tipY)*0.5;
      els.push(<path key={"ft"+k} d={`M ${x0} ${baseY} Q ${cX} ${cY} ${tipX} ${tipY}`} stroke={lighten(color,0.16)} strokeWidth={bw*0.7} fill="none" strokeLinecap="round" opacity={0.7}/>);
      const ta=Math.atan2(tipY-cY,tipX-cX);
      for(let b=0;b<5;b++){ const tl=hPx*0.09*(0.6+rng()*0.9), aa=ta+(rng()-0.5)*0.55; els.push(<line key={`fw${k}_${b}`} x1={tipX} y1={tipY} x2={tipX+Math.cos(aa)*tl} y2={tipY+Math.sin(aa)*tl} stroke="#efe4c2" strokeWidth={bw*0.5} opacity={0.6} strokeLinecap="round"/>); }
    }
    return els;
  }
  if(T==="blood") return els;
  // ===== flowering culms — one PROMINENT seed head per culm, most stems carry one =====
  const nF=Math.max(6, Math.round(n*0.85));
  for(let k=0;k<nF;k++){
    const u=(nF>1?(k/(nF-1)-0.5):0)*2+(rng()-0.5)*0.18, x0=u*wPx*0.13;
    if(T==="reed"){
      const topY=-hPx*(1.0+rng()*0.05), tx=x0+u*wPx*0.04, pl=hPx*0.34, pw=wPx*0.05;
      els.push(<path key={"cu"+k} d={`M ${x0} ${-hPx*0.08} Q ${x0} ${topY*0.55} ${tx} ${topY}`} stroke={darken(foliage,0.1)} strokeWidth={bw*0.9} fill="none"/>);
      els.push(<ellipse key={"pe"+k} cx={tx} cy={topY+pl*0.5} rx={pw} ry={pl*0.5} fill={color} opacity={0.4}/>);
      for(let b=0;b<22;b++){ const t=b/21, py=topY+pl*t, px=tx+(rng()-0.5)*pw*1.5; els.push(<line key={`pb${k}_${b}`} x1={px} y1={py} x2={px+(rng()-0.5)*pw} y2={py+pl*0.04} stroke={b%2?liteS:color} strokeWidth={bw*0.5} opacity={0.72}/>); }
    } else if(T==="fountain"){
      const side=(u>=0?1:-1), tipX=x0+side*wPx*(0.5+rng()*0.32), tipY=-hPx*(0.78+rng()*0.16), cX=x0+side*wPx*0.12, cY=tipY*0.32;
      els.push(<path key={"cu"+k} d={`M ${x0} ${-hPx*0.05} Q ${cX} ${cY} ${tipX} ${tipY}`} stroke={darken(foliage,0.08)} strokeWidth={bw} fill="none" strokeLinecap="round"/>);
      const fl=hPx*0.26, fa=Math.PI*0.5+side*0.62, fw=wPx*0.055, fcx=tipX+Math.cos(fa)*fl*0.5, fcy=tipY+Math.sin(fa)*fl*0.5;
      els.push(<ellipse key={"fxe"+k} cx={fcx} cy={fcy} rx={fw} ry={fl*0.5} fill={color} opacity={0.4} transform={`rotate(${fa*180/Math.PI-90} ${fcx} ${fcy})`}/>);
      for(let b=0;b<22;b++){ const t=b/21, bx=tipX+Math.cos(fa)*fl*t, by=tipY+Math.sin(fa)*fl*t, taper=Math.sin(t*Math.PI)*fw, ha=fa+Math.PI/2; els.push(<line key={`fx${k}_${b}`} x1={bx-Math.cos(ha)*taper} y1={by-Math.sin(ha)*taper} x2={bx+Math.cos(ha)*taper} y2={by+Math.sin(ha)*taper} stroke={b%2?color:liteS} strokeWidth={bw*0.5} opacity={0.72} strokeLinecap="round"/>); }
    } else if(T==="maiden"){
      const topY=-hPx*(0.92+rng()*0.06), tx=x0+u*wPx*0.1;
      els.push(<path key={"cu"+k} d={`M ${x0} ${-hPx*0.08} Q ${x0+u*wPx*0.05} ${topY*0.5} ${tx} ${topY}`} stroke={darken(foliage,0.08)} strokeWidth={bw} fill="none" strokeLinecap="round"/>);
      els.push(<ellipse key={"mfe"+k} cx={tx} cy={topY-hPx*0.05} rx={wPx*0.13} ry={hPx*0.08} fill={color} opacity={0.2}/>);
      for(let f=0;f<13;f++){ const a=-Math.PI/2+(f/12-0.5)*1.9, fl=hPx*(0.15+rng()*0.07); els.push(<path key={`mf${k}_${f}`} d={`M ${tx} ${topY} Q ${tx+Math.cos(a)*fl*0.5} ${topY+Math.sin(a)*fl*0.5} ${tx+Math.cos(a)*fl} ${topY+Math.sin(a)*fl}`} stroke={f%2?liteS:color} strokeWidth={bw*0.5} fill="none" opacity={0.72} strokeLinecap="round"/>); }
    } else if(T==="switch"||T==="moor"||T==="haze"){
      const topY=-hPx*((T==="moor"?1.02:T==="haze"?0.72:0.9)+rng()*0.08), tx=x0+u*wPx*0.08, cloudR=wPx*0.2, cn=22+Math.round(rng()*14);
      els.push(<path key={"cu"+k} d={`M ${x0} ${-hPx*0.04} Q ${x0} ${topY*0.55} ${tx} ${topY}`} stroke={darken(foliage,0.06)} strokeWidth={bw*0.7} fill="none" opacity={0.8}/>);
      for(let b=0;b<cn;b++){ const a=rng()*Math.PI*2, rr=Math.sqrt(rng()), px=tx+Math.cos(a)*cloudR*rr, py=topY-Math.abs(Math.sin(a))*cloudR*rr+(rng()-0.5)*cloudR*0.3;
        els.push(<line key={`cl${k}_${b}`} x1={tx+Math.cos(a)*cloudR*rr*0.3} y1={topY-Math.abs(Math.sin(a))*cloudR*rr*0.3} x2={px} y2={py} stroke={b%2?color:liteS} strokeWidth={bw*0.32} opacity={0.4}/>);
        els.push(<circle key={`cld${k}_${b}`} cx={px} cy={py} r={Math.max(0.6,wPx*0.01)} fill={b%2?color:liteS} opacity={0.6}/>); }
    } else if(T==="bluestem"){
      const topY=-hPx*(0.9+rng()*0.06), tx=x0+u*wPx*0.06;
      els.push(<path key={"cu"+k} d={`M ${x0} ${-hPx*0.04} Q ${x0} ${topY*0.55} ${tx} ${topY}`} stroke={darken(foliage,0.06)} strokeWidth={bw*0.8} fill="none"/>);
      for(let b=0;b<7;b++){ const t=0.25+b*0.11, py=topY*(1-t)+(-hPx*0.12)*t, px=tx*(1-t)+x0*t; els.push(<circle key={`bf${k}_${b}`} cx={px+(rng()-0.5)*wPx*0.03} cy={py} r={wPx*0.028} fill="#f5f1e6" opacity={0.78}/>); }
    } else if(T==="turkeyfoot"){
      const topY=-hPx*(0.94+rng()*0.05), tx=x0+u*wPx*0.06;
      els.push(<path key={"cu"+k} d={`M ${x0} ${-hPx*0.06} Q ${x0} ${topY*0.55} ${tx} ${topY}`} stroke={darken(foliage,0.08)} strokeWidth={bw*0.9} fill="none"/>);
      for(let f=0;f<3;f++){ const a=-Math.PI/2+(f-1)*0.55, fl=hPx*0.13; const ex=tx+Math.cos(a)*fl, ey=topY+Math.sin(a)*fl; els.push(<line key={`tf${k}_${f}`} x1={tx} y1={topY} x2={ex} y2={ey} stroke={color} strokeWidth={bw*0.9} opacity={0.82}/>); for(let g=0;g<5;g++){ const t=g/4; els.push(<line key={`tfb${k}_${f}_${g}`} x1={tx+(ex-tx)*t} y1={topY+(ey-topY)*t} x2={tx+(ex-tx)*t+(rng()-0.5)*wPx*0.03} y2={topY+(ey-topY)*t+wPx*0.02} stroke={liteS} strokeWidth={bw*0.4} opacity={0.6}/>); } }
    } else if(T==="grama"){
      const topY=-hPx*(0.74+rng()*0.12), el=wPx*0.2, fa=0.18;
      els.push(<path key={"cu"+k} d={`M ${x0} ${-hPx*0.04} L ${x0} ${topY}`} stroke={darken(foliage,0.06)} strokeWidth={bw*0.8} fill="none"/>);
      els.push(<path key={`eb${k}`} d={`M ${x0} ${topY} q ${el*0.5} ${-el*fa} ${el} ${0}`} stroke={color} strokeWidth={bw*1.8} fill="none" strokeLinecap="round" opacity={0.88}/>);
      for(let b=0;b<11;b++){ const t=b/10; els.push(<line key={`ec${k}_${b}`} x1={x0+el*t} y1={topY-el*fa*Math.sin(t*Math.PI)} x2={x0+el*t} y2={topY-el*fa*Math.sin(t*Math.PI)+wPx*0.035} stroke={darkS} strokeWidth={bw*0.45} opacity={0.62}/>); }
    } else if(T==="oats"){
      const side=(u>=0?1:-1), tipX=x0+side*wPx*(0.38+rng()*0.3), tipY=-hPx*(0.72+rng()*0.16), no=4+Math.round(rng()*3);
      els.push(<path key={"cu"+k} d={`M ${x0} ${-hPx*0.06} Q ${x0+side*wPx*0.14} ${tipY*0.45} ${tipX} ${tipY}`} stroke={darken(foliage,0.08)} strokeWidth={bw} fill="none" strokeLinecap="round"/>);
      for(let b=0;b<no;b++){ const ox=tipX+(rng()-0.5)*wPx*0.12, oy=tipY+wPx*0.05+b*wPx*0.06; els.push(<path key={`ot${k}_${b}`} d={blobD(ox,oy,wPx*0.07,wPx*0.03,6,0.18,rng)} fill={b%2?color:liteS} transform={`rotate(${(rng()-0.5)*30} ${ox} ${oy})`} opacity={0.88}/>); els.push(<line key={`otl${k}_${b}`} x1={tipX} y1={tipY+b*wPx*0.02} x2={ox} y2={oy-wPx*0.02} stroke={darkS} strokeWidth={bw*0.35} opacity={0.5}/>); }
    } else if(T==="fescue"){
      const a=-Math.PI/2+(u)*0.5, fl=hPx*(0.55+rng()*0.3), tx=x0+Math.cos(a)*fl*0.3, ty=-hPx*0.5+Math.sin(a)*fl;
      els.push(<path key={"cu"+k} d={`M ${x0} ${-hPx*0.3} Q ${x0} ${ty*0.7} ${tx} ${ty}`} stroke={darken(foliage,0.05)} strokeWidth={bw*0.7} fill="none"/>);
      els.push(<ellipse key={`fw${k}`} cx={tx} cy={ty} rx={wPx*0.025} ry={wPx*0.07} fill={color} opacity={0.65} transform={`rotate(${u*22} ${tx} ${ty})`}/>);
    }
  }
  return els;
}
function drawPlant(p, wPx, hPx, foliage, blooming, bloomColor, rng){
  const fs=flowerStartFor(p), fine=fineFor(p);
  const [fsz,fdn]=flowerScaleFor(p);
  const sc=stemScaleFor(p), flps=flpsFor(p), shape=bloomShapeFor(p), cv=curveFor(p), inf=p.inflor||null, sil=p.silhouette||null;
  // botanical inflorescence dispatch (used when a plant declares p.inflor)
  const inflor=()=>{
    const r0=Math.max(3,wPx*0.1)*fsz;
    switch(inf){
      case "raceme":    return racemeForm(wPx,hPx,foliage,bloomColor,blooming,rng, clamp(Math.round(wPx/14*fdn),3,12), fs, fsz, sc, cv);
      case "spike":     return spikeForm(wPx,hPx,foliage,bloomColor,blooming,rng, clamp(Math.round(wPx/12*fdn),3,20), fs, fine, fsz, sc, flps, cv);
      case "panicle":   return coneSpire(wPx,hPx,foliage,bloomColor,blooming,rng, clamp(Math.round(wPx/28*fdn),3,11), fs, fsz);
      case "corymb":    return flatCluster(wPx,hPx,bloomColor,rng, clamp(Math.round(wPx/22*fdn),3,14), fs, fsz);
      case "umbel":     return umbelForm(wPx,hPx,foliage,bloomColor,blooming,rng, clamp(Math.round(wPx/16*fdn),2,7), fs, fsz, sc, true);
      case "cyme":      return bloomPuffs(wPx,hPx,bloomColor,rng, clamp(Math.round(wPx/26*fdn),3,9), r0, fs, true);
      case "head":      return daisyForm(wPx,hPx,bloomColor,rng, clamp(Math.round(wPx/16*fdn),3,16), fs, fsz);
      case "solitary":  return bloomPuffs(wPx,hPx,bloomColor,rng, clamp(Math.round(wPx/30*fdn),2,8), r0, fs, false);
      case "bottle":    return bottlebrush(wPx,hPx,foliage,bloomColor,blooming,rng, clamp(Math.round(wPx/10*fdn),3,16), fs, fsz, sc, cv);
      case "candelabra":return candelabra(wPx,hPx,foliage,bloomColor,blooming,rng, clamp(Math.round(wPx/16*fdn),2,5), fs, fsz, sc);
      default: return null;
    }
  };
  const ht=headFor(p), Rh=headRadius(ht,wPx,fsz);
  switch(p.form){
    case "shrub": {
      if(p.id==="baptisia") return [...leafMass(wPx,hPx*0.6,foliage,rng,0.95,"rounded"), ...(blooming? spireHeads(wPx,hPx,foliage,bloomColor,rng, clamp(Math.round(wPx/10),8,22)):[])];
      if(BRANCHED.has(p.id)){
        const bHead=(shape==="cone")?"cone":"puff", bR=headRadius(bHead,wPx,fsz);
        let nFl=clamp(Math.round(wPx/8*fdn),6,42); if(MYMONET.has(p.id)) nFl=Math.max(3,Math.round(nFl*0.18));
        return branchedShrub(wPx,hPx,foliage,bloomColor,blooming,bHead,bR,rng,nFl,VARIEGATED.has(p.id),(bHead==="cone")?1.0:0.55);
      }
      return [...leafMass(wPx,hPx,foliage,rng,1.0,sil),  ...(blooming? canopyHeads(wPx,hPx,1.0,ht,Rh, clamp(Math.round(wPx/16*fdn),4,110), bloomColor,rng):[])];
    }
    case "mound": return [...leafMass(wPx,hPx,foliage,rng,0.82,sil), ...(blooming? canopyHeads(wPx,hPx,0.82,ht,Rh, clamp(Math.round(wPx/16*fdn),5,90), bloomColor,rng):[])];
    case "clump": { const bf=basalFracFor(p);
      if(SEDUMS.has(p.id)) return sedumMound(wPx,hPx,foliage,bloomColor,blooming,Rh,rng);
      return [...clumpFoliage(wPx,hPx,foliage,rng,bf), ...(blooming? stalkHeads(wPx,hPx,foliage,ht,Rh, clamp(Math.round(wPx/14*fdn),4,40), bloomColor,rng,fs,bf,sc):[])]; }
    case "daisy": return [...leafBaseLow(wPx,hPx*0.4,foliage,rng), ...(blooming? (inf? (inflor()||daisyForm(wPx,hPx,bloomColor,rng, clamp(Math.round(wPx/16*fdn),3,16), fs, fsz)) : daisyForm(wPx,hPx,bloomColor,rng, clamp(Math.round(wPx/16*fdn),3,16), fs, fsz)) : [])];
    case "spike": {
      if(p.id==="gaura") return wandFlower(wPx,hPx,foliage,bloomColor,blooming,rng);
      if(inf){ const ex=inflor(); if(ex) return ex; }
      return shape==="bottle" ? bottlebrush(wPx,hPx,foliage,bloomColor,blooming,rng, clamp(Math.round(wPx/10*fdn),3,16), fs, fsz, sc, cv)
           : shape==="candelabra" ? candelabra(wPx,hPx,foliage,bloomColor,blooming,rng, clamp(Math.round(wPx/16*fdn),2,5), fs, fsz, sc, CANDELABRA_HEAD[p.id]||null)
           : spikeForm(wPx,hPx,foliage,bloomColor,blooming,rng, clamp(Math.round(wPx/12*fdn),3,20), fs, fine, fsz, sc, flps, cv);
    }
    case "grass": return grassClump(wPx,hPx,foliage,bloomColor,blooming,rng, clamp(Math.round(wPx/3.2),18,42), GRASS_TYPE[p.id]||"fountain", GRASS_VG.has(p.id));
    case "globe": return globeForm(wPx,hPx,foliage,bloomColor,blooming,rng);
    case "bulbflower": return bulbForm(wPx,hPx,foliage,bloomColor,p.id,rng);
    case "mat":   return matForm(wPx,hPx,foliage,bloomColor,blooming,rng);
    default:      return leafMass(wPx,hPx,foliage,rng,1.0,sil);
  }
}

/* ============================ UI tokens ============================ */
const AVAIL_COLOR = { 1:"#3f8f4a", 2:"#c79a3a", 3:"#9aa08f" };
const AVAIL_LABEL = { 1:"Widely available", 2:"Limited availability", 3:"Specialty \u2014 hard to source" };
const C = {
  ink:"#22311c", green:"#2f4a26", greenDk:"#1b2912",
  clay:"#b06a3f", gold:"#bd9742",
  app:"#e7eadf", panel:"#f8faf4", paper:"#ffffff",
  line:"#d4dac6", line2:"#c1c9af",
  text:"#27311f", muted:"#6c7560",
};
const SEASONS = {
  spring:{ label:"Spring", accent:"#7aa45c", icon:Sprout },
  summer:{ label:"Summer", accent:"#bd9742", icon:Sun },
  fall:{ label:"Fall", accent:"#b06a3f", icon:Leaf },
};

/* ============================ design presets ============================ */
const STYLES = [
  ["cottage","Cottage"], ["prairie","Naturalistic"], ["prairiegrass","Prairie"], ["formal","Formal"],
  ["pollinator","Pollinator"], ["designer","Designer"], ["modern","Modern"], ["farmhouse","Farmhouse"], ["native","Native"],
];
const MIX_KEYS = ["shrub","perennial","grass","groundcover","annual","bulb"];
const STYLE_DESC = {
  cottage:    "A romantic, abundant look that layers roses, perennials and self-sowing flowers into soft, overflowing drifts. Expect relaxed color, fragrance and old-fashioned charm, with plants spilling over edges and into one another.",
  prairie:    "A naturalistic, Oudolf-inspired meadow that intermingles perennials and grasses into repeating, woven drifts. It prizes long-season structure, seedheads and movement, looking good well into winter rather than peaking for just a few weeks.",
  prairiegrass:"A grass-led planting where fine, flowing ornamental grasses carry the design and airy perennials weave through them. It's spaced loosely so the whole bed catches the wind and moves, with grasses giving texture and seedheads from summer into winter.",
  formal:     "A structured, symmetrical style built on clipped evergreens, clean edges and a restrained, repeating palette. Order and geometry lead, giving a tidy, architectural look that reads well year-round.",
  pollinator: "A nectar- and pollen-rich planting designed to feed bees, butterflies and other beneficial insects across the seasons. It favors long-blooming natives and perennials in overlapping waves so something is always in flower.",
  designer:   "A texture- and foliage-forward style that balances form, leaf shape and a refined, often muted palette. It leans on grasses, structural perennials and considered repetition for a polished planting that holds interest well beyond bloom time.",
  modern:     "A bold, pared-back look built on grasses, strong forms and large, simple masses of just a few plants. Clean lines and restraint give it an architectural, low-fuss feel suited to contemporary spaces.",
  farmhouse:  "A relaxed, lived-in mix of structural shrubs, fragrant perennials and cottage-style flowers with a homey character. It blends informal abundance with enough backbone to look good from both the house and the street.",
  native:     "A planting drawn from regional native species chosen to support local wildlife and thrive with minimal inputs. It emphasizes locally adapted perennials and grasses for a resilient, ecologically grounded bed that suits its place.",
};
const MIX_ROWS = [
  ["shrub","Shrubs / structure"], ["perennial","Perennials"], ["grass","Ornamental grasses"],
  ["groundcover","Groundcover / edging"], ["annual","Annuals"], ["bulb","Bulbs"],
];
const STYLE_MIX = {
  cottage:    { shrub:15, perennial:40, grass:8,  groundcover:15, annual:15, bulb:7 },
  prairie:    { shrub:8,  perennial:36, grass:36, groundcover:8,  annual:2,  bulb:5 },
  prairiegrass:{ shrub:4, perennial:30, grass:50, groundcover:6,  annual:2,  bulb:8 },
  formal:     { shrub:42, perennial:22, grass:6,  groundcover:20, annual:5,  bulb:5 },
  pollinator: { shrub:10, perennial:42, grass:14, groundcover:10, annual:16, bulb:8 },
  designer:   { shrub:18, perennial:32, grass:24, groundcover:16, annual:2,  bulb:8 },
  modern:     { shrub:24, perennial:18, grass:40, groundcover:6,  annual:0,  bulb:12 },
  farmhouse:  { shrub:32, perennial:30, grass:8,  groundcover:14, annual:8,  bulb:8 },
  native:     { shrub:16, perennial:34, grass:28, groundcover:14, annual:0,  bulb:8 },
};
const DENSITY = ["Airy","Balanced","Full","Lush"];
const DENSITY_PACKING = [1.02, 0.86, 0.72, 0.6];
const STYLE_DENSITY = { cottage:3, prairie:1, prairiegrass:0, formal:2, pollinator:2, designer:2, modern:2, farmhouse:2, native:1 };
const COLOR_CHIPS = [
  ["white","White","#f4f3ea"], ["yellow","Yellow","#f2c84b"], ["orange","Orange","#f0962e"],
  ["red","Red","#c33b3b"], ["pink","Pink","#e58fb0"], ["purple","Purple","#8a5fae"], ["blue","Blue","#6f86c9"],
];

/* ===== aesthetics: a colour story / mood layered on top of a style =====
   blooms = flower colour families the look favours; foliage = special leaf
   tones it wants (silver/dark/gold); leafy = foliage-led; season = a seasonal
   lean; heroes = signature plants; styles = which styles surface it. */
const AESTHETICS = [
  { id:"moonlight", label:"White & Silver", swatch:"#e9ece2",
    desc:"Pale white and cream flowers among silver foliage — luminous at dusk and cooling by day.",
    blooms:["white"], foliage:["silver"], palette:"cool",
    heroes:["artemisia","lambsear","lavender","perovskia","dustymiller","anemone","boltonia","gaura","calamint","shasta","annabelle","seaholly","blueoat","bluefescue","astrantiawhite","veronicasalbum","thalsplendide","brunnerajack","brunneralooking","brunneravariegata","lungwortsilver","aruncus","physostegia","orientalcasablanca","galanthus","leucojum","viburnumcarlesii","viburnumplicatum","ivoryhalo","clethra","sonicbloompearl","mymonet","weigelavariegata","tuxedo","silverbrocade","silverlining","powiscastle","valeriefinnis","buddleiawhite","nicotiana"],
    styles:["cottage","formal","designer","farmhouse"] },
  { id:"midnight", label:"Dark & Moody", swatch:"#4a3340",
    desc:"Deep plum, burgundy and near-black tones in dark foliage, lifted by flashes of silver and lime.",
    blooms:["purple","red"], foliage:["dark"],
    heroes:["smokebush","sambucus","ninebark","heuchera","actaea","bloodgrass","penstemon","sedumdark","hollyhock","tulipdark","sanguisorba","weigela","artemisia","creepingjenny","pennisetumrubrum","bigbluestem","astrantiaclaret","astrantiaruby","sangblackthorn","sangcangshan","knautia","tradescantiaconcord","diervilla","calycanthus","sonicbloomwine","spilledwine","finewine","midnightwine","electriclove","tuxedo","barberrycrimson","barberryroseglow","barberryconcorde","barberryhelmond","barberrymini","barberrytodo","barberrycutie"],
    styles:["designer","modern","formal","cottage"] },
  { id:"cool", label:"Cool Blue & Lavender", swatch:"#7e8fcc",
    desc:"Blues, violets and lavender with silvery leaves — calm, recessive and elegant.",
    blooms:["blue","purple"], foliage:["silver"], palette:"cool",
    heroes:["salvia","nepeta","perovskia","seaholly","delphinium","lavender","baptisia","amsonia","echinops","rozanne","irissiberian","camassia","platycodon","caryopteris","centaurea","scabiosa","veronica","agastache","aster","caryopterisgold","blueoat","bluefescue","thalblackstockings","thallavendermist","veronicasfascination","brunnerajack","brunneralooking","lungworttrevi","lungwortsilver","epimediumlilafee","campanulablue","campanulapers","campanulasarastro","tradescantia","stokesia","tradescantiaconcord","crocus","muscari","hyacinth","scilla","chionodoxa","fritillariameleagris","irisreticulata","lilac","lilacmisskim","lilacbloomerang","powiscastle","valeriefinnis","buddleiablack","buddleiananho","buddleiabluechip","buddleiapurplehaze","buddleiaasianmoon","buddleiapugster","petunia","angelonia","ageratum","scaevola"],
    styles:["cottage","prairie","prairiegrass","formal","pollinator","designer","modern","farmhouse","native"] },
  { id:"pastel", label:"Soft Pastel Romance", swatch:"#e7c6d6",
    desc:"Soft pinks, mauves and cream against fresh green — gentle, romantic and easy on the eye.",
    blooms:["pink","purple","white"], palette:"pastel",
    heroes:["peony","foxglove","rozanne","bigrootgeranium","dianthus","astilbe","phlox","aquilegia","lupine","centranthus","nepeta","weigela","bleedingheart","astrantiaroma","veronicaserica","thalblackstockings","foamflowerspring","foamflowersugar","foamflowerskyrocket","dicentraluxuriant","bleedingheartgold","lungwortraspberry","campanulablue","campanulapers","filipendula","aruncus","chelone","physostegia","stokesia","swampmilkweed","orientalcasablanca","hyacinth","galanthus","fritillariameleagris","leucojum","crocus","lilac","lilacmisskim","lilacbloomerang","viburnumcarlesii","clethra","sonicbloompink","sonicbloompearl","sonicbloompunch","sonicbloomwine","mymonet","mymonetpurple","finewine","midnightwine","weigelavariegata","minuet","czechmark","buddleiapink","buddleiamissruby","begonia","impatiens","cosmos","cleome","snapdragon","gomphrena"],
    styles:["cottage","farmhouse","formal"] },
  { id:"fiery", label:"Hot & Fiery", swatch:"#df5a2a",
    desc:"Scarlet, orange and gold in bold, energetic drifts — best in strong sun.",
    blooms:["red","orange","yellow"], palette:"warm",
    heroes:["crocosmia","kniphofia","heliopsis","lobelia","echinaceaorange","geum","helenium","monarda","rudbeckia","daylily","butterflyweed","persicaria","kniphofiapapaya","kniphofiaroyal","kniphofiaalcazar","kniphofiafireglow","kniphofiapercy","crocosmialucifer","crocosmiaemily","crocosmiastar","crocosmiaprince","gaillardia","painteddaisy","asiaticlily","orientalstargazer","tigerlily","fritillariaimperialis","sonicbloomred","sonicbloomghost","spilledwine","redprince","electriclove","buddleiaroyalred","buddleiamissmolly","pentas","celosia","pelargonium","dahlia"],
    styles:["cottage","pollinator","prairie","farmhouse"] },
  { id:"sunset", label:"Sunset & Apricot", swatch:"#e89a5e",
    desc:"Apricot, peach and soft coral — warm but mellow, like late-afternoon light.",
    blooms:["orange","yellow","pink"], palette:"warm",
    heroes:["yarrowterracotta","agastacheapricot","foxgloveapricot","heucheracaramel","geum","echinaceaorange","helenium","kniphofia","daylily","coreopsis","pennisetumkarley","kniphofiapapaya","kniphofiapineapple","crocosmiastar","crocosmiasolfatare","crocosmiageorge","gaillardia","helianthuslemon","thermopsis","asiaticlily","tigerlily","fritillariaimperialis","eranthis","forsythia","hamamelis","hypericumshrub","diervilla","mymonetsunset","barberryorange","lantana","calendula"],
    styles:["cottage","prairie","designer","pollinator"] },
  { id:"autumn", label:"Autumn Embers", swatch:"#b5732f",
    desc:"Russet, amber and bronze with grasses turning gold and seedheads taking over late in the year.",
    blooms:["orange","red","yellow","purple"], season:"fall",
    heroes:["aster","sedum","sedumdark","helenium","rudbeckia","goldenrod","mum","vernonia","anemone","boltonia","joepye","amsonia","panicum","littlebluestem","molinia","calamagrostis","pennisetum","pennisetumredhead","littlebluestemovation","littlebluestemtwilight","lovegrass","aronia","itea","persicaria","helianthuslemon","viburnumdentatum","cornusarctic","hamamelis","rhustigereyes","mymonetsunset","barberryorange"],
    styles:["prairie","prairiegrass","native","pollinator","modern"] },
  { id:"prairiegold", label:"Prairie Gold & Purple", swatch:"#d9a72c",
    desc:"Golden daisies and warm purples threaded through prairie grasses — the classic naturalistic palette.",
    blooms:["yellow","orange","purple","pink"],
    heroes:["echinacea","rudbeckia","liatris","monarda","sanguisorba","goldenrod","veronicastrum","vernonia","silphium","ratibida","heliopsis","pycnanthemum","agastache","baptisia","panicum","littlebluestem","prairiedropseed","pennisetum","pennisetumredhead","littlebluestemovation","bluegrama","lovegrass","dropseedtara","veronicasfascination","knautia","gaillardia","helianthuslemon","chelone","thermopsis","swampmilkweed"],
    styles:["prairie","prairiegrass","native","pollinator"] },
  { id:"chartreuse", label:"Chartreuse & Burgundy", swatch:"#9aab46",
    desc:"Lime and gold foliage set against deep burgundy leaves — a high-contrast, texture-led look.",
    blooms:["yellow"], foliage:["gold","dark"],
    heroes:["hostagold","physocarpusgold","creepingjenny","sedumgold","heucheragold","carexgold","forestgrass","spirea","euphorbia","ladysmantle","sambucusgold","caryopterisgold","smokebush","ninebark","heuchera","sambucus","bloodgrass","sedumdark","penstemon","pennisetumrubrum","bleedingheartgold","heucherellasweet","tradescantia","rhustigereyes","sonicbloomghost","barberrygold","barberrylemonglow"],
    styles:["designer","modern","formal"] },
  { id:"textural", label:"Green & Textural", swatch:"#5f7f50",
    desc:"Foliage, form and seedheads carry the planting, with flower colour kept quiet — green, structural and restful.",
    blooms:["white","green"], leafy:true,
    heroes:["japanesefern","ostrichfern","autumnfern","hosta","hostagold","forestgrass","carex","carexgold","solomonseal","brunnera","heuchera","amsonia","acanthus","rodgersia","bergenia","calamagrostis","panicum","prairiedropseed","deschampsia","molinia","baptisia","veronicastrum","boxwood","inkberry","sambucusgold","pennisetum","pennisetumredhead","pennisetumlittlebunny","seaoats","moorgrass","dropseedtara","palmsedge","astrantiawhite","veronicasalbum","epimediumfrohnleiten","epimediumrubrum","foamflowersugar","heucherellasweet","brunnerajack","filipendula","aruncus","thermopsis","viburnumdentatum","viburnumplicatum","cornusarctic","ivoryhalo","clethra","silverbrocade","silverlining"],
    styles:["designer","modern","formal","prairie","prairiegrass","native"] },
];
const AES_BY_ID = Object.fromEntries(AESTHETICS.map(a=>[a.id, a]));
const aesFor = (style)=> AESTHETICS.filter(a=> a.styles.includes(style));


/* ===== curated plant pairings (designer combinations), tagged by style ===== */
const STYLE_LABEL = { cottage:"Cottage", prairie:"Naturalistic", prairiegrass:"Prairie", formal:"Formal", pollinator:"Pollinator", designer:"Designer", modern:"Modern", farmhouse:"Farmhouse", native:"Native" };
const PAIRINGS = [
  // Each pairing references two plants by id. Style tags are set here; sun,
  // moisture, zone, color and height are derived from the two plants so the
  // filtering is always accurate. { a, b, s:[styles], n:note }
  // --- shade ---
  {a:"hosta",b:"japanesefern",s:["designer","cottage"],n:"Bold blue leaves beside silvery, lacy fronds."},
  {a:"hosta",b:"autumnfern",s:["cottage","designer"],n:"Broad foliage with fine coppery-green fronds."},
  {a:"hellebore",b:"brunnera",s:["designer","cottage"],n:"Early nodding blooms over silver-veined leaves."},
  {a:"astilbe",b:"hosta",s:["cottage","farmhouse"],n:"Feathery plumes rising above bold foliage."},
  {a:"heuchera",b:"foamflower",s:["designer","native"],n:"Deep ruffled leaves with airy white spires."},
  {a:"bleedingheart",b:"ostrichfern",s:["cottage"],n:"Arching pink lockets among tall ferns."},
  {a:"solomonseal",b:"hosta",s:["designer","native"],n:"Arching stems over rounded leaves."},
  {a:"forestgrass",b:"heuchera",s:["designer"],n:"Chartreuse cascade with deep-toned foliage."},
  {a:"lungwort",b:"epimedium",s:["native","designer"],n:"Spotted leaves and dainty color for dry shade."},
  {a:"ligularia",b:"hosta",s:["farmhouse"],n:"Yellow spikes over big leaves in moist shade."},
  {a:"brunnera",b:"autumnfern",s:["designer"],n:"Silver leaves and rust-toned fronds."},
  {a:"bigrootgeranium",b:"hellebore",s:["cottage","native"],n:"Aromatic groundcover beneath evergreen blooms."},
  {a:"woodruff",b:"hosta",s:["cottage"],n:"A starry white carpet at the feet of hostas."},
  {a:"astilbe",b:"japanesefern",s:["cottage"],n:"Plumes and painted fronds for shade."},
  {a:"carex",b:"heuchera",s:["designer"],n:"Variegated grass with ruffled leaves."},
  {a:"hosta",b:"lamium",s:["cottage"],n:"Bold leaves edged with silver groundcover."},
  // --- cottage (sun) ---
  {a:"peony",b:"nepeta",s:["cottage","farmhouse"],n:"Lush late-spring bloom with a soft blue skirt."},
  {a:"delphinium",b:"shasta",s:["cottage"],n:"Tall blue spires over crisp white daisies."},
  {a:"phlox",b:"rozanne",s:["cottage"],n:"Fragrant pink with weave-through violet-blue."},
  {a:"foxglove",b:"ladysmantle",s:["cottage"],n:"Spires rising from a chartreuse froth."},
  {a:"allium",b:"ladysmantle",s:["cottage","designer"],n:"Purple globes floating over lime-green mounds."},
  {a:"lambsear",b:"nepeta",s:["cottage"],n:"Silver felted edging beneath a blue haze."},
  {a:"dianthus",b:"nepeta",s:["cottage"],n:"Fragrant front-edge pinks with cool blue."},
  {a:"peony",b:"ladysmantle",s:["cottage","farmhouse"],n:"Pink blooms over chartreuse mounds."},
  {a:"salvia",b:"shasta",s:["cottage"],n:"Violet spikes with bright white daisies."},
  {a:"coreopsis",b:"salvia",s:["cottage","pollinator"],n:"Golden stars among violet spikes."},
  {a:"rose",b:"nepeta",s:["cottage","farmhouse"],n:"Romantic blooms over a softening blue edge."},
  {a:"rose",b:"lavender",s:["cottage","farmhouse"],n:"A fragrant pairing of pink and silver."},
  {a:"nepeta",b:"coreopsis",s:["cottage"],n:"Blue and gold, blooming for months."},
  {a:"daylily",b:"phlox",s:["cottage"],n:"Easy summer color in warm and cool tones."},
  {a:"rose",b:"salvia",s:["cottage"],n:"Classic blooms with vertical violet."},
  // --- naturalistic ---
  {a:"pennisetum",b:"sanguisorba",s:["prairie","designer","prairiegrass"],n:"Dark bottlebrushes weaving through soft fountain plumes."},
  {a:"pennisetumrubrum",b:"sedumgold",s:["designer","modern"],n:"Burgundy fountain blades over chartreuse spillover."},
  {a:"pennisetumkarley",b:"echinacea",s:["prairie","cottage","pollinator"],n:"Rose plumes arching among purple coneflowers."},
  {a:"sangblackthorn",b:"pennisetum",s:["prairie","designer","prairiegrass"],n:"Dark burnet buttons floating over soft dwarf fountain plumes."},
  {a:"astrantiaroma",b:"hosta",s:["cottage","designer"],n:"Pink pincushions over bold shade foliage."},
  {a:"brunnerajack",b:"hostablue",s:["designer","cottage"],n:"Silver-frosted hearts beside bold blue hosta."},
  {a:"foamflowerspring",b:"japanesefern",s:["native","designer"],n:"Foamy spires among silvery painted fronds."},
  {a:"epimediumfrohnleiten",b:"hellebore",s:["designer","native"],n:"Tough dry-shade carpet beneath nodding hellebore."},
  {a:"crocosmialucifer",b:"rudbeckia",s:["cottage","pollinator"],n:"Scarlet sprays blazing through golden coneflowers."},
  {a:"kniphofiaroyal",b:"pennisetum",s:["designer","prairiegrass"],n:"Bicolour torches rising over soft fountain plumes."},
  {a:"calamagrostis",b:"echinacea",s:["prairie","modern","prairiegrass"],n:"Strict upright grass with pink coneflower domes."},
  {a:"panicum",b:"sedum",s:["prairie","designer","prairiegrass"],n:"Tall grass behind flat-topped autumn heads."},
  {a:"molinia",b:"sanguisorba",s:["prairie","designer","prairiegrass"],n:"See-through grass with floating catkins."},
  {a:"prairiedropseed",b:"echinacea",s:["prairie","native","prairiegrass"],n:"Fine grass massed around coneflower seedheads."},
  {a:"veronicastrum",b:"calamagrostis",s:["prairie","prairiegrass"],n:"Pale candles against vertical grass."},
  {a:"echinacea",b:"perovskia",s:["prairie","pollinator"],n:"Pink daisies in a lavender-blue haze."},
  {a:"helenium",b:"panicum",s:["prairie","native","prairiegrass"],n:"Hot-toned daisies cooled by upright grass."},
  {a:"seaholly",b:"calamagrostis",s:["prairie","designer","modern","prairiegrass"],n:"Steel-blue cones among reed grass."},
  {a:"sanguisorba",b:"persicaria",s:["prairie","designer"],n:"Wiry catkins hovering over red spikes."},
  {a:"aster",b:"littlebluestem",s:["prairie","native","prairiegrass"],n:"Purple fall asters with russet grass."},
  {a:"deschampsia",b:"echinacea",s:["prairie","designer","prairiegrass"],n:"An airy gold haze around coneflowers."},
  {a:"molinia",b:"echinops",s:["prairie","modern","prairiegrass"],n:"Vertical grass with steel-blue spheres."},
  {a:"sedum",b:"littlebluestem",s:["prairie","native","prairiegrass"],n:"Rosy autumn heads with blue-green grass."},
  {a:"persicaria",b:"molinia",s:["prairie","prairiegrass"],n:"Red spikes threaded through airy grass."},
  // --- native / prairie ---
  {a:"butterflyweed",b:"liatris",s:["native","pollinator"],n:"Vivid orange with violet spikes."},
  {a:"monarda",b:"liatris",s:["native","pollinator"],n:"Lavender bergamot with purple blazing star."},
  {a:"littlebluestem",b:"echinacea",s:["native","prairie","prairiegrass"],n:"Steel-blue grass, pink daisies, winter seedheads."},
  {a:"prairiedropseed",b:"butterflyweed",s:["native","prairiegrass"],n:"Fine grass studded with orange."},
  {a:"swampmilkweed",b:"joepye",s:["native","pollinator"],n:"Pink and mauve for damper ground."},
  {a:"noddingonion",b:"littlebluestem",s:["native","prairiegrass"],n:"Lilac clusters in fine grass."},
  {a:"aster",b:"goldenrod",s:["native","pollinator"],n:"The classic purple-and-gold fall finale."},
  {a:"joepye",b:"panicum",s:["native","prairie","prairiegrass"],n:"Tall mauve domes with prairie grass."},
  {a:"rudbeckia",b:"littlebluestem",s:["native","prairie","prairiegrass"],n:"Golden daisies over russet grass."},
  {a:"veronicastrum",b:"monarda",s:["native","pollinator"],n:"White candles with lavender bergamot."},
  {a:"liatris",b:"yarrow",s:["native","pollinator"],n:"Vertical purple with flat gold."},
  {a:"amsonia",b:"butterflyweed",s:["native","designer"],n:"Threadleaf foliage with orange milkweed."},
  {a:"echinacea",b:"rudbeckia",s:["native","pollinator"],n:"Pink and gold prairie daisies together."},
  // --- pollinator ---
  {a:"echinacea",b:"monarda",s:["pollinator"],n:"A long nectar season for butterflies."},
  {a:"agastache",b:"rudbeckia",s:["pollinator"],n:"Blue hyssop with golden daisies, alive with bees."},
  {a:"nepeta",b:"salvia",s:["pollinator","cottage"],n:"Months of blue bloom for pollinators."},
  {a:"swampmilkweed",b:"echinacea",s:["pollinator"],n:"Host plant alongside rich nectar."},
  {a:"joepye",b:"veronicastrum",s:["pollinator","native"],n:"Tall back-row butterfly favorites."},
  {a:"lavender",b:"seaholly",s:["pollinator","designer"],n:"A drought-tolerant, bee-friendly pairing."},
  {a:"monarda",b:"phlox",s:["pollinator","cottage"],n:"Fragrant midsummer color for hummingbirds."},
  {a:"agastache",b:"echinacea",s:["pollinator"],n:"Blue spikes with pink coneflowers."},
  {a:"liatris",b:"rudbeckia",s:["pollinator"],n:"Purple verticals with gold."},
  // --- designer ---
  {a:"amsonia",b:"allium",s:["designer"],n:"Fine threadleaf foliage with floating globes; gold in fall."},
  {a:"forestgrass",b:"hosta",s:["designer"],n:"Chartreuse cascade against bold leaves."},
  {a:"seaholly",b:"perovskia",s:["designer"],n:"A study in steel-blue and silver texture."},
  {a:"calamagrostis",b:"sedum",s:["designer","modern","prairiegrass"],n:"Architecture with flat autumn bloom."},
  {a:"echinops",b:"seaholly",s:["designer"],n:"Two blue thistles for textural drama."},
  {a:"boxwood",b:"forestgrass",s:["designer","formal"],n:"Clipped form softened by a spilling grass."},
  {a:"allium",b:"nepeta",s:["designer","modern"],n:"Purple globes over a low blue cloud."},
  {a:"amsonia",b:"echinacea",s:["designer","native"],n:"Threadleaf texture with coneflowers."},
  {a:"lambsear",b:"salvia",s:["designer","farmhouse"],n:"Silver and violet, simple and clean."},
  {a:"hellebore",b:"carex",s:["designer"],n:"Evergreen blooms with variegated grass."},
  // --- modern ---
  {a:"calamagrostis",b:"boxwood",s:["modern","formal"],n:"Strict verticals against clipped spheres."},
  {a:"feathergrass",b:"seaholly",s:["modern","designer","prairiegrass"],n:"Fine movement with sculptural blue cones."},
  {a:"inkberry",b:"forestgrass",s:["modern"],n:"Evergreen structure with a chartreuse skirt."},
  {a:"perovskia",b:"prairiedropseed",s:["modern","prairie","prairiegrass"],n:"A repeated haze of blue over fine grass."},
  {a:"boxwood",b:"lavender",s:["modern","formal"],n:"Clipped geometry softened by gray-green."},
  {a:"panicum",b:"echinops",s:["modern","prairie","prairiegrass"],n:"Vertical grass with steel-blue spheres."},
  {a:"feathergrass",b:"allium",s:["modern","prairiegrass"],n:"Minimal movement and floating spheres."},
  {a:"molinia",b:"sedum",s:["modern","prairie","prairiegrass"],n:"Tall grass over rosy heads."},
  // --- farmhouse ---
  {a:"annabelle",b:"boxwood",s:["farmhouse","formal"],n:"White mopheads above a low clipped hedge."},
  {a:"limelight",b:"nepeta",s:["farmhouse"],n:"Lime-green panicles over a blue skirt."},
  {a:"boxwood",b:"shasta",s:["farmhouse","formal"],n:"Tidy structure with cheerful white daisies."},
  {a:"annabelle",b:"hosta",s:["farmhouse"],n:"Foliage and bloom for a shadier spot."},
  {a:"perovskia",b:"phlox",s:["farmhouse","cottage"],n:"Relaxed blue and white."},
  {a:"limelight",b:"rudbeckia",s:["farmhouse"],n:"Lime blooms with golden daisies."},
  {a:"spirea",b:"nepeta",s:["farmhouse"],n:"A mounded shrub with a blue edge."},
  {a:"weigela",b:"nepeta",s:["farmhouse","cottage"],n:"A rosy spring shrub over cool blue."},
  // --- formal ---
  {a:"boxwood",b:"allium",s:["formal","designer"],n:"Architectural globes punctuating clipped green."},
  {a:"boxwood",b:"nepeta",s:["formal","cottage"],n:"Soft blue spilling over crisp edges."},
  {a:"boxwood",b:"salvia",s:["formal"],n:"Formal infill with vertical violet."},
  {a:"inkberry",b:"boxwood",s:["formal","modern"],n:"Layered evergreen structure."},
  {a:"muscari",b:"tulip",s:["cottage","formal","farmhouse"],n:"A classic spring carpet \u2014 grape hyacinth pooling beneath tulips."},
  {a:"galanthus",b:"hellebore",s:["cottage","native","designer"],n:"The first thaw \u2014 snowdrops scattered among hellebores."},
  {a:"rhustigereyes",b:"smokebush",s:["designer","modern"],n:"Chartreuse cutleaf sumac against deep-purple smokebush."},
  {a:"lilac",b:"alliumglobemaster",s:["cottage","designer"],n:"Lilac panicles over floating allium globes."},
  {a:"sonicbloomwine",b:"perovskia",s:["designer","cottage"],n:"Dark wine foliage against a silver-blue haze of Russian sage."},
];

// Plant lookup + accurate pairing filter (sun/moisture/zone/color/height come
// straight from the two plants, so what's shown always fits the chosen options).
const PLANT_BY_ID = Object.fromEntries(PLANTS.map(p=>[p.id,p]));
function waterFits(p, moisture){
  return moisture==="dry" ? p.water==="low"
       : moisture==="medium" ? (p.water==="low"||p.water==="med")
       : (p.water==="med"||p.water==="high");
}
function pairingMatches(pr, opts){
  const A = PLANT_BY_ID[pr.a], B = PLANT_BY_ID[pr.b];
  if(!A || !B) return false;
  if(!pr.s.includes(opts.style)) return false;
  if(!(A.sun.includes(opts.sun) && B.sun.includes(opts.sun))) return false;
  if(!(waterFits(A,opts.moisture) && waterFits(B,opts.moisture))) return false;
  if(!(opts.zone>=A.z[0] && opts.zone<=A.z[1] && opts.zone>=B.z[0] && opts.zone<=B.z[1])) return false;
  if(Math.max(A.h,B.h) > (opts.maxHeight||999)) return false;
  if(opts.excludeSelfSeed && (isSelfSeed(A) || isSelfSeed(B))) return false;
  if(invasiveInState(A,opts.state) || invasiveInState(B,opts.state)) return false;
  if(opts.colors && opts.colors.length){
    const cOK = (p)=> (p.tags.includes("foliage")||p.bloom.length===0) ? true : opts.colors.includes(colorFamily(p.bloomColor));
    if(!(cOK(A)&&cOK(B))) return false;
  }
  return true;
}

// Pick the ideal pairings for the current settings: roughly one per 4 ft of
// width (plus a couple more for interest), favouring this style's signature
// combinations and keeping the plants varied. Returns the list of plant ids.
function autoFeatured(o, width){
  const matching = PAIRINGS.filter(pr=>pairingMatches(pr, o));
  const aes = o.aesthetic || null;
  const onAes = (pr)=> !aes ? 0 :
    ((aestheticAllows(PLANT_BY_ID[pr.a], aes) && aestheticAllows(PLANT_BY_ID[pr.b], aes)) ? 0 : 1);
  // rank: on-aesthetic pairings first, then this style's signature combinations
  const ranked = [...matching].sort((a,b)=>
    (onAes(a)-onAes(b)) || ((a.s[0]===o.style?0:1) - (b.s[0]===o.style?0:1)));
  const target = clamp(Math.ceil(width/4) + 1, 2, 9);
  const chosen = [], used = {};
  for(const pr of ranked){                         // first pass: distinct plants
    if(chosen.length >= target) break;
    if(used[pr.a] || used[pr.b]) continue;
    if(aes && onAes(pr)) continue;                 // keep the backbone on-theme while we can
    chosen.push(pr); used[pr.a] = 1; used[pr.b] = 1;
  }
  for(const pr of ranked){                          // relax if not enough matched
    if(chosen.length >= target) break;
    if(!chosen.includes(pr)) chosen.push(pr);
  }
  return Array.from(new Set(chosen.flatMap(pr=>[pr.a, pr.b])));
}

function Seg({ value, current, onClick, children }){
  const active = value === current;
  return (
    <button onClick={()=>onClick(value)}
      className="px-2.5 py-1.5 text-xs rounded-md transition-colors"
      style={{
        background: active ? C.green : C.paper,
        color: active ? "#fff" : C.muted,
        border: `1px solid ${active ? C.green : C.line}`,
        fontWeight: active ? 600 : 500,
      }}>
      {children}
    </button>
  );
}
function Field({ label, children }){
  return (
    <div className="mb-4">
      <div className="text-[11px] uppercase tracking-wide mb-1.5" style={{ color:C.muted, letterSpacing:"0.06em" }}>{label}</div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

/* ============================ main component ============================ */
const SHOWCASE_IDS = new Set(["weigela","sonicbloompink","sonicbloomred","sonicbloompearl","sonicbloompunch","sonicbloomghost","sonicbloomwine","mymonet","mymonetpurple","mymonetsunset","spilledwine","finewine","midnightwine","redprince","weigelavariegata","minuet","czechmark","electriclove","tuxedo","sedum","sedumdark","sedumneon","yarrow","yarrowterracotta","yarrowred","yarrowpink","sambucus","limelight","hydrangeabobo","hydrangeaoak","annabelle","lilac","lilacmisskim","lilacbloomerang","buddleiablack","buddleiapink","buddleiapugster","buddleiamissmolly","gaura","veronicastrum","veronicasfascination","verbena","perovskia","sanguisorba","sangblackthorn","thalictrum","thallavendermist","peony","peonyred","hibiscusred","hibiscuspink","liatris","foxglove","delphinium"]);

export default function BedDesigner(){
  const [width,setWidth]   = useState(12);
  const [depth,setDepth]   = useState(5);
  const [imgManifest,setImgManifest] = useState({});
  useEffect(()=>{ fetch("/plants/manifest.json").then(r=>r.ok?r.json():{}).then(d=>setImgManifest(d||{})).catch(()=>{}); },[]);
  const plantImg = (id,se)=>{ const e=imgManifest[id]; return (e && e[se]) || null; };
  const [sun,setSun]       = useState("full");
  const [moisture,setMoisture] = useState("medium");
  const [zone,setZone]     = useState(6);
  const [style,setStyle]   = useState("cottage");
  const [palette,setPalette] = useState("mixed");
  const [colors,setColors] = useState([]);                    // limited color families
  const [density,setDensity] = useState(STYLE_DENSITY.cottage);
  const [mix,setMix]       = useState(STYLE_MIX.cottage);
  const [showMix,setShowMix] = useState(false);
  const [maxHeight,setMaxHeight] = useState(72);              // back-row height cap (inches)
  const [excludeSelfSeed,setExcludeSelfSeed] = useState(false); // drop spreaders (default: include both)
  const [stateCode,setStateCode] = useState("");               // user's state -> auto-removes plants invasive there
  const [showHidden,setShowHidden] = useState(false);          // expand the list of plants hidden as invasive
  const [aesthetic,setAesthetic] = useState(null);             // colour story / mood (id or null)
  const [backWeight,setBackWeight] = useState("balanced");     // back-row visual weight: solid|balanced|airy
  const [emergent,setEmergent] = useState(false);             // emergent vertical accents through the mid layer
  const [sourcing,setSourcing] = useState("easy");            // easy = favour widely-stocked plants; all = include specialty
  const [bedFit,setBedFit] = useState("fit");                 // fit = whole border fits the width; actual = pixel scale + horizontal scroll
  const [featured,setFeatured] = useState(()=>               // ideal pairings out of the gate
    autoFeatured({ style:"cottage", sun:"full", moisture:"medium", zone:6, maxHeight:72, colors:[],
                   excludeSelfSeed:false, state:"" }, 12));
  const [season,setSeason] = useState("summer");
  const [seed,setSeed]     = useState(20482);
  const [view,setView] = useState("bed");            // "bed" | "gallery"
  const [gq,setGq] = useState("");                   // gallery search text
  const [gfilter,setGfilter] = useState("showcase"); // gallery quick filter
  // per-plant edits: emphasis {id:level -2..2}, excluded ids, user-added (replacements)
  const [emphasis,setEmphasis] = useState({});
  const [excluded,setExcluded] = useState([]);
  const [userAdded,setUserAdded] = useState([]);
  const [openPlant,setOpenPlant] = useState(null);   // which schedule row is expanded
  const [replacing,setReplacing] = useState(null);   // which row's alternatives are open

  // switching style loads that style's density + plant mix; drop the aesthetic if
  // it isn't one of that style's options
  useEffect(()=>{
    setMix(STYLE_MIX[style]); setDensity(STYLE_DENSITY[style]);
    setAesthetic(a => (a && aesFor(style).some(x=>x.id===a)) ? a : null);
  }, [style]);

  // auto-feature the ideal pairings whenever the core setup, a behaviour toggle,
  // or the aesthetic changes. Manual add/remove sticks until one of those changes.
  useEffect(()=>{
    setFeatured(autoFeatured({ style, sun, moisture, zone, maxHeight, colors, excludeSelfSeed, state:stateCode, aesthetic:AES_BY_ID[aesthetic]||null }, width));
    setEmphasis({}); setExcluded([]); setUserAdded([]); setOpenPlant(null); setReplacing(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [style, sun, moisture, zone, width, excludeSelfSeed, stateCode, aesthetic]);

  const mixTotal = MIX_KEYS.reduce((s,k)=>s+(mix[k]||0),0);
  const mixNorm = useMemo(()=>{
    const t = MIX_KEYS.reduce((s,k)=>s+(mix[k]||0),0);
    const o = {}; MIX_KEYS.forEach(k=> o[k] = t>0 ? (mix[k]||0)/t : 1/MIX_KEYS.length);
    return o;
  },[mix]);
  const packing = DENSITY_PACKING[density];

  const opts = { bed:{ width, depth }, sun, moisture, zone, style, palette, colors, mix:mixNorm, packing, maxHeight, featured, excludeSelfSeed, state:stateCode, emphasis, excluded, userAdded, aesthetic:AES_BY_ID[aesthetic]||null, backWeight, emergent, sourcing };
  const design = useMemo(()=>buildDesign(opts, seed),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [width, depth, sun, moisture, zone, style, palette, seed, colors, density, mix, maxHeight, featured, excludeSelfSeed, stateCode, emphasis, excluded, userAdded, aesthetic, backWeight, emergent, sourcing]);

  const hiddenByState = useMemo(()=> stateCode ? PLANTS.filter(pp=>invasiveInState(pp, stateCode)) : [], [stateCode]);

  // toggle a pairing on/off (adds/removes both its plants from the featured set)
  const togglePairing = (pr)=>{
    setFeatured(prev=>{
      const has = prev.includes(pr.a) && prev.includes(pr.b);
      if(has) return prev.filter(id=> id!==pr.a && id!==pr.b);
      return Array.from(new Set([...prev, pr.a, pr.b]));
    });
  };

  // --- per-plant editing (more / less / replace) ---
  // nudge how much of one plant the design uses (-2 less ... +2 more)
  const adjust = (id, delta)=> setEmphasis(prev=>{
    const lv = clamp((prev[id]||0)+delta, -2, 2);
    const n = { ...prev }; if(lv===0) delete n[id]; else n[id] = lv; return n;
  });
  // swap one chosen plant for a compatible alternative
  const replacePlant = (from, to)=>{
    setExcluded(prev => Array.from(new Set([...prev, from.id])).filter(id=> id!==to.id));
    setUserAdded(prev => Array.from(new Set([...prev, to.id])).filter(id=> id!==from.id));
    setFeatured(prev => prev.includes(from.id) ? prev.filter(id=> id!==from.id) : prev); // breaks that pairing
    setEmphasis(prev => { const n={...prev}; delete n[from.id]; return n; });
    setReplacing(null); setOpenPlant(null);
  };
  // compatible alternatives for a plant: same planting layer, fits conditions,
  // not already used. Same plant type is listed first, then others that fill the
  // same role, ordered by how close they sit in height (so swaps fit the slot).
  const alternativesFor = (p)=>{
    const inDesign = new Set(design.selected.map(x=>x.id));
    return PLANTS.filter(q =>
      q.id!==p.id && plantLayer(q)===plantLayer(p) && !inDesign.has(q.id) && !excluded.includes(q.id)
      && sunFits(q,sun) && moistFits(q,moisture) && zoneFits(q,zone) && q.h<=maxHeight
      && !(excludeSelfSeed && isSelfSeed(q)) && !invasiveInState(q, stateCode)
    ).sort((a,b)=>
      ((plantCat(a)===plantCat(p)?0:1) - (plantCat(b)===plantCat(p)?0:1))   // same type first
      || (Math.abs(a.h-p.h) - Math.abs(b.h-p.h))                            // then closest in height
    ).slice(0, 40);
  };

  // --- projection ---
  // Fixed scale anchored to a 12-ft bed: each foot is PXFT viewBox units, so a
  // plant is the same size at any bed width. The canvas grows with the bed and
  // the view scrolls sideways for anything wider than the ~12-ft default.
  const PXFT = 74, MARGIN_X = 70, VB_H = 700;
  const frontGY = 590, backGY = 330;
  const VB_W = Math.round(MARGIN_X*2 + width*PXFT);
  const REF_VB_W = MARGIN_X*2 + 12*PXFT;            // 12-ft reference width
  const cxScreen = VB_W/2;
  const effPxFt = PXFT;
  const frontHalf = width*PXFT/2;
  // Vertical scale: heights drawn at (nearly) the same px/ft as widths so
  // proportions read true, then shrunk just enough that the tallest plant fits.
  const tallestFt = Math.max(2, ...design.selected.map(p=>p.h/12)) * 1.05;
  const vFactor = clamp((backGY - 14) / (tallestFt * effPxFt * 0.82), 0.55, 0.96);
  const proj = (x,y)=>{
    const t = clamp(y/depth,0,1);
    const halfW = frontHalf*(1-0.16*t);
    return { sx: cxScreen + (x/width-0.5)*2*halfW, gy: frontGY-(frontGY-backGY)*t, ds: 1-0.18*t, t };
  };
  const displayPct = Math.max(100, VB_W/REF_VB_W*100); // ≥12ft scrolls, ≤12ft fits

  // bed footprint corners
  const fl=proj(0,0), fr=proj(width,0), br=proj(width,depth), bl=proj(0,depth);
  const soilPath = `M ${fl.sx} ${fl.gy} L ${fr.sx} ${fr.gy} L ${br.sx} ${br.gy} L ${bl.sx} ${bl.gy} Z`;

  // mulch texture (stable)
  const mulch = useMemo(()=>{
    const r = mulberry32(99); const pts=[];
    for(let i=0;i<55;i++){ const x=r()*width, y=(0.04+r()*0.92)*depth; const pr=proj(x,y); pts.push({ ...pr, k:i, tone:r()>0.5?1:-1 }); }
    return pts;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[width,depth,frontHalf]);

  // front-edge ruler ticks
  const ticks=[]; for(let i=0;i<=Math.round(width);i++){ ticks.push(proj(i,0)); }

  // depth-sorted plant instances (back first)
  const projected = design.instances.map((inst,idx)=>({ inst, idx, ...proj(inst.x,inst.y) }))
    .sort((a,b)=> b.t - a.t || b.sx - a.sx);

  // plant listing + costs
  const counts={}; design.instances.forEach(i=>{counts[i.plant.id]=(counts[i.plant.id]||0)+1;});
  const listing = design.selected.map(p=>({ p, qty:counts[p.id]||0 })).filter(x=>x.qty>0)
    .sort((a,b)=>b.p.h-a.p.h);
  const totalPlants = listing.reduce((s,x)=>s+x.qty,0);
  const totalCost = listing.reduce((s,x)=>s+x.qty*x.p.cost,0);

  const sunIcon = sun==="full" ? Sun : sun==="part" ? CloudSun : Cloudy;
  const SunI = sunIcon;
  const SeasonI = SEASONS[season].icon;

  return (
    <div className="w-full min-h-screen" style={{ background:C.app, color:C.text }}>
      {/* header */}
      <div className="px-5 py-4 flex items-center justify-between" style={{ background:C.greenDk, color:"#eef2e6" }}>
        <div className="flex items-center gap-2.5">
          <Flower2 size={22} style={{ color:"#cdd9b0" }}/>
          <div>
            <div className="font-serif text-lg leading-tight">Bed &amp; Border Studio</div>
            <div className="text-[11px]" style={{ color:"#9fb18f" }}>Plan to scale · spring → summer → fall · seasonal preview</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={()=>setView(view==="bed"?"gallery":"bed")}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm"
            style={{ background:"#5b6b46", color:"#fff", fontWeight:600 }}>
            <Flower2 size={15}/> {view==="bed"?"Plant gallery":"Back to bed"}
          </button>
          <button onClick={()=>setSeed(Math.floor(Math.random()*1e9))}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm"
            style={{ background:C.clay, color:"#fff", fontWeight:600 }}>
            <RefreshCw size={15}/> New variation
          </button>
        </div>
      </div>

      {view==="gallery" && (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background:C.app }}>
          <div className="sticky top-0 z-10 px-5 py-3 flex items-center justify-between gap-3 flex-wrap" style={{ background:C.greenDk, color:"#eef2e6" }}>
            <div className="flex items-center gap-2.5">
              <Flower2 size={20} style={{ color:"#cdd9b0" }}/>
              <div className="font-serif text-lg leading-tight">Plant gallery</div>
              <span className="text-[11px]" style={{ color:"#9fb18f" }}>every plant drawn at mature size, in bloom</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <input value={gq} onChange={e=>setGq(e.target.value)} placeholder="Search name or latin..."
                className="px-3 py-1.5 rounded-md text-sm" style={{ background:"#eef2e6", color:"#26301c", minWidth:"190px", border:"none", outline:"none" }}/>
              <button onClick={()=>setView("bed")} className="px-3 py-1.5 rounded-md text-sm" style={{ background:C.clay, color:"#fff", fontWeight:600 }}>Close</button>
            </div>
          </div>
          <div className="px-5 py-2.5 flex items-center gap-2 flex-wrap" style={{ borderBottom:`1px solid ${C.line}`, background:C.panel }}>
            {[["showcase","Recently refined"],["all","All plants"],["shrub","Shrubs"],["spike","Spikes & wands"],["clump","Clumps"],["mound","Mounds"],["daisy","Daisies"],["grass","Grasses"]].map(([k,lab])=>(
              <button key={k} onClick={()=>setGfilter(k)} className="px-2.5 py-1 rounded-full text-[12px]"
                style={ (!gq && gfilter===k) ? { background:C.green, color:"#fff", fontWeight:600 } : { background:C.paper, color:C.muted, border:`1px solid ${C.line}` }}>{lab}</button>
            ))}
            {gq && <span className="text-[11px]" style={{ color:C.muted }}>search active — chips paused</span>}
          </div>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 max-w-[1700px] mx-auto">
            {(()=>{
              const ql=gq.trim().toLowerCase();
              const shown=PLANTS.filter(p=> ql ? (p.name.toLowerCase().includes(ql)||p.latin.toLowerCase().includes(ql)) : gfilter==="all" ? true : gfilter==="showcase" ? SHOWCASE_IDS.has(p.id) : p.form===gfilter);
              if(!shown.length) return <div className="col-span-full text-sm py-6" style={{ color:C.muted }}>No plants match that search.</div>;
              return shown.map((p,idx)=>{
                const blooming=!!(p.bloom && p.bloom.length);
                const CW=150, CH=168, padB=18, availW=CW-22, availH=CH-padB-12;
                let hPx=availH, wPx=hPx*(p.w/p.h);
                if(wPx>availW){ const f=availW/wPx; wPx*=f; hPx*=f; }
                const r=mulberry32((idx+1)*2654435761 >>> 0);
                const imgU = plantImg(p.id,"summer")||plantImg(p.id,"spring")||plantImg(p.id,"fall");
                return (
                  <div key={p.id} className="rounded-lg p-2 flex flex-col" style={{ background:C.panel, border:`1px solid ${C.line2}` }}>
                    <div style={{ background:"#dfe7df", borderRadius:8, overflow:"hidden" }}>
                      <svg viewBox={`0 0 ${CW} ${CH}`} preserveAspectRatio="xMidYMid meet" className="block" style={{ width:"100%", height:"auto" }}>
                        <line x1="0" y1={CH-padB} x2={CW} y2={CH-padB} stroke="#bcc8b4" strokeWidth="1"/>
                        <g transform={`translate(${CW/2},${CH-padB})`}>
                          <ellipse cx={wPx*0.05} cy={1.5} rx={Math.max(3,wPx*0.5)} ry={Math.max(2,wPx*0.14)} fill="#241f12" opacity="0.13"/>
                          {imgU
                            ? <image href={imgU} x={-wPx/2} y={-hPx} width={wPx} height={hPx} preserveAspectRatio="xMidYMax meet"/>
                            : drawPlant(p, wPx, hPx, p.foliage, blooming, p.bloomColor||p.foliage, r)}
                        </g>
                      </svg>
                    </div>
                    <div className="mt-1.5">
                      <div className="text-[12px] font-medium leading-tight" style={{ color:C.text }}>{p.name}</div>
                      <div className="text-[10px] italic leading-tight" style={{ color:C.muted }}>{p.latin}</div>
                      <div className="text-[10px] mt-0.5" style={{ color:C.muted }}>{p.h}&quot;&times;{p.w}&quot; &middot; {p.type} &middot; {p.form}</div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}
      <div className="flex flex-col lg:grid lg:grid-cols-[20rem_minmax(0,1fr)] xl:grid-cols-[22rem_minmax(0,1fr)] lg:items-start max-w-[1800px] mx-auto w-full">
        {/* ---------- controls ---------- */}
        <div className="p-4 lg:border-r lg:col-start-1 lg:row-start-1 lg:max-h-[54vh] lg:overflow-y-auto" style={{ background:C.panel, borderColor:C.line }}>
          <Field label={`Bed width — ${width} ft`}>
            <input type="range" min={2} max={30} step={1} value={width} onChange={e=>setWidth(+e.target.value)} className="w-full" style={{ accentColor:C.green }}/>
          </Field>
          <Field label={`Bed depth — ${depth} ft`}>
            <input type="range" min={1.5} max={12} step={0.5} value={depth} onChange={e=>setDepth(+e.target.value)} className="w-full" style={{ accentColor:C.green }}/>
          </Field>

          <Field label="Sun exposure">
            <Seg value="full" current={sun} onClick={setSun}>Full sun</Seg>
            <Seg value="part" current={sun} onClick={setSun}>Part shade</Seg>
            <Seg value="shade" current={sun} onClick={setSun}>Shade</Seg>
          </Field>
          <Field label="Soil moisture">
            <Seg value="dry" current={moisture} onClick={setMoisture}>Dry</Seg>
            <Seg value="medium" current={moisture} onClick={setMoisture}>Medium</Seg>
            <Seg value="moist" current={moisture} onClick={setMoisture}>Moist</Seg>
          </Field>
          <Field label={`USDA hardiness zone — ${zone}`}>
            <input type="range" min={3} max={9} step={1} value={zone} onChange={e=>setZone(+e.target.value)} className="w-full" style={{ accentColor:C.green }}/>
          </Field>
          <Field label="State — removes plants invasive there">
            <select value={stateCode} onChange={e=>setStateCode(e.target.value)}
              className="w-full rounded-md px-2.5 py-1.5 text-sm"
              style={{ border:`1px solid ${C.line}`, background:C.paper, color:C.text }}>
              <option value="">— Select your state —</option>
              {US_STATES.map(([code,name])=> <option key={code} value={code}>{name}</option>)}
            </select>
          </Field>
          {stateCode && (
            <div className="text-[10px] -mt-2 mb-4" style={{ color:C.muted }}>
              {hiddenByState.length===0
                ? `Nothing in the plant library is flagged invasive in ${US_STATES.find(x=>x[0]===stateCode)[1]}.`
                : (<>
                    <button onClick={()=>setShowHidden(v=>!v)} style={{ color:C.clay, fontWeight:600 }}>
                      {hiddenByState.length} plant{hiddenByState.length>1?"s":""} hidden — invasive in {US_STATES.find(x=>x[0]===stateCode)[1]} {showHidden?"▾":"▸"}
                    </button>
                    {showHidden && (
                      <div className="mt-1" style={{ lineHeight:1.5 }}>
                        {hiddenByState.map(pp=>pp.name).join(", ")}. Sterile cultivars bred not to spread are kept available.
                      </div>
                    )}
                  </>)}
            </div>
          )}
          <Field label="Style">
            {STYLES.map(([val,lab])=>(
              <Seg key={val} value={val} current={style} onClick={setStyle}>{lab}</Seg>
            ))}
          </Field>
          {STYLE_DESC[style] && (
            <div className="text-[11px] leading-snug -mt-2 mb-4 p-2.5 rounded-lg"
              style={{ color:C.muted, background:C.paper, border:`1px solid ${C.line}` }}>
              {STYLE_DESC[style]}
            </div>
          )}
          <Field label="Aesthetic — colour story">
            <Seg value={null} current={aesthetic} onClick={setAesthetic}>Natural</Seg>
            {aesFor(style).map(a=>(
              <Seg key={a.id} value={a.id} current={aesthetic} onClick={setAesthetic}>{a.label}</Seg>
            ))}
          </Field>
          <div className="text-[11px] leading-snug -mt-2 mb-4 p-2.5 rounded-lg"
            style={{ color:C.muted, background:C.paper, border:`1px solid ${C.line}` }}>
            {aesthetic && AES_BY_ID[aesthetic]
              ? AES_BY_ID[aesthetic].desc
              : `Optional mood for the ${STYLE_LABEL[style]||"current"} style — biases flowers, foliage and season toward a colour story. ${aesFor(style).length} suit this style.`}
          </div>
          <Field label={`Planting density — ${DENSITY[density]}`}>
            {DENSITY.map((d,i)=>(
              <Seg key={d} value={i} current={density} onClick={setDensity}>{d}</Seg>
            ))}
          </Field>
          <Field label={`Back-row height — up to ${maxHeight}″ (${(maxHeight/12).toFixed(1)} ft)`}>
            <input type="range" min={18} max={84} step={6} value={maxHeight} onChange={e=>setMaxHeight(+e.target.value)} className="w-full" style={{ accentColor:C.green }}/>
          </Field>

          <Field label="Back-row visual weight">
            <Seg value="solid"    current={backWeight} onClick={setBackWeight}>Solid</Seg>
            <Seg value="balanced" current={backWeight} onClick={setBackWeight}>Balanced</Seg>
            <Seg value="airy"     current={backWeight} onClick={setBackWeight}>Airy</Seg>
          </Field>
          <div className="text-[10px] -mt-3 mb-4" style={{ color:C.muted }}>
            Solid leans on full shrubs and dense mounds for a screen. Airy favours see-through verticals and veils — verbena, foxglove, hollyhock, meadow rue, tall grasses — so the back stays light and you read through it.
          </div>

          <Field label="Emergent accents">
            <Seg value={false} current={emergent} onClick={setEmergent}>Off</Seg>
            <Seg value={true}  current={emergent} onClick={setEmergent}>On</Seg>
          </Field>
          <div className="text-[10px] -mt-3 mb-4" style={{ color:C.muted }}>
            Threads tall vertical punctuation — giant alliums, liatris, foxglove, verbena — as scattered single stems that rise above the mid-layer canopy.
          </div>

          <Field label="Plant spread">
            <Seg value={false} current={excludeSelfSeed} onClick={setExcludeSelfSeed}>Include both</Seg>
            <Seg value={true}  current={excludeSelfSeed} onClick={setExcludeSelfSeed}>Stay-put only</Seg>
          </Field>
          <div className="text-[10px] -mt-3 mb-4" style={{ color:C.muted }}>
            By default the design draws from every plant that fits your settings — both spreaders and clumpers. Spreaders wander from where you plant them by self-sowing seed or by running roots, stolons, or rhizomes; the rest stay put as a clump and only grow where you divide them. Choose "Stay-put only" for a tidier, lower-edit bed. (Anything invasive in your state is already removed automatically.)
          </div>

          <Field label="Sourcing">
            <Seg value="easy" current={sourcing} onClick={setSourcing}>Easy to source</Seg>
            <Seg value="all"  current={sourcing} onClick={setSourcing}>Include specialty</Seg>
          </Field>
          <div className="text-[10px] -mt-3 mb-4" style={{ color:C.muted }}>
            Every plant is tagged by how widely Midwest wholesalers stock it: <span style={{ color:AVAIL_COLOR[1], fontWeight:700 }}>\u25cf</span> widely available, <span style={{ color:AVAIL_COLOR[2], fontWeight:700 }}>\u25cf</span> limited, <span style={{ color:AVAIL_COLOR[3], fontWeight:700 }}>\u25cf</span> specialty / hard to find. "Easy to source" leans the design on the widely- and moderately-available plants so a client\u2019s order can actually be filled and shipped; "Include specialty" lets rarer collector plants compete. You can always force a specific plant in with Replace. (Availability is an estimate, not live stock \u2014 confirm with your grower.)
          </div>

          <Field label="Color palette">
            <Seg value="mixed" current={palette} onClick={setPalette}>Mixed</Seg>
            <Seg value="warm" current={palette} onClick={setPalette}>Warm</Seg>
            <Seg value="cool" current={palette} onClick={setPalette}>Cool</Seg>
            <Seg value="pastel" current={palette} onClick={setPalette}>Pastel</Seg>
          </Field>

          {/* limit to specific colors */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-[11px] uppercase tracking-wide flex items-center gap-1.5" style={{ color:C.muted, letterSpacing:"0.06em" }}>
                <Palette size={13}/> Limit colors
              </div>
              {colors.length>0 && (
                <button onClick={()=>setColors([])} className="text-[10px] underline" style={{ color:C.muted }}>clear</button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {COLOR_CHIPS.map(([key,lab,sw])=>{
                const on = colors.includes(key);
                return (
                  <button key={key}
                    onClick={()=>setColors(on ? colors.filter(x=>x!==key) : [...colors,key])}
                    className="px-2 py-1 rounded-md text-xs flex items-center gap-1.5"
                    style={{ background:on?C.green:C.paper, color:on?"#fff":C.muted, border:`1px solid ${on?C.green:C.line}` }}>
                    <span style={{ width:10, height:10, borderRadius:9, background:sw, border:"1px solid rgba(0,0,0,0.18)" }}/>{lab}
                  </button>
                );
              })}
            </div>
            <div className="text-[10px] mt-1.5" style={{ color:C.muted }}>
              {colors.length>0 ? "Foliage & structure plants stay regardless." : "Leave blank for all colors."}
            </div>
          </div>

          {/* plant mix / composition */}
          <div className="mb-4">
            <button onClick={()=>setShowMix(s=>!s)}
              className="w-full flex items-center justify-between text-[11px] uppercase tracking-wide mb-1.5"
              style={{ color:C.muted, letterSpacing:"0.06em" }}>
              <span className="flex items-center gap-1.5"><Layers size={13}/> Plant mix</span>
              {showMix ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
            </button>
            {showMix && (
              <div className="pt-1">
                {MIX_ROWS.map(([key,lab])=>(
                  <div key={key} className="mb-2">
                    <div className="flex justify-between text-[11px]" style={{ color:C.text }}>
                      <span>{lab}</span>
                      <span style={{ color:C.muted }}>{mixTotal>0?Math.round((mix[key]||0)/mixTotal*100):0}%</span>
                    </div>
                    <input type="range" min={0} max={50} step={1} value={mix[key]||0}
                      onChange={e=>setMix({ ...mix, [key]:+e.target.value })}
                      className="w-full" style={{ accentColor:C.green }}/>
                  </div>
                ))}
                <div className="text-[10px]" style={{ color:C.muted }}>Relative emphasis. Switching style resets the mix.</div>
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t text-xs" style={{ borderColor:C.line, color:C.muted }}>
            <div className="flex items-center gap-1.5 mb-1"><Ruler size={13}/> Viewed from the front edge, ~5 ft eye height.</div>
            <div className="flex items-center gap-1.5"><MapPin size={13}/> Plants shown at mature size, to scale.</div>
          </div>
        </div>

        {/* ---------- bottom band: the border, full width on desktop ---------- */}
        <div className="p-4 lg:p-6 min-w-0 lg:col-start-1 lg:col-span-2 lg:row-start-2">
          {/* season toggle + readout */}
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="inline-flex rounded-lg p-1" style={{ background:C.paper, border:`1px solid ${C.line}` }}>
              {Object.entries(SEASONS).map(([k,v])=>{
                const I=v.icon, active=k===season;
                return (
                  <button key={k} onClick={()=>setSeason(k)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm transition-colors"
                    style={{ background: active ? v.accent : "transparent", color: active ? "#fff" : C.muted, fontWeight: active?600:500 }}>
                    <I size={15}/> {v.label}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-3 text-xs" style={{ color:C.muted }}>
              <span className="flex items-center gap-1"><SunI size={14}/>{sun==="full"?"Full sun":sun==="part"?"Part shade":"Shade"}</span>
              <span className="flex items-center gap-1"><Droplets size={14}/>{moisture[0].toUpperCase()+moisture.slice(1)}</span>
              <span className="flex items-center gap-1"><Trees size={14}/>Zone {zone}</span>
            </div>
          </div>

          {width > 12 && (
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[11px]" style={{ color:C.muted }}>Border view</span>
              <Seg value="fit" current={bedFit} onClick={setBedFit}>Fit to width</Seg>
              <Seg value="actual" current={bedFit} onClick={setBedFit}>Actual size</Seg>
            </div>
          )}

          {/* the bed view */}
          <div className="rounded-xl" style={{ border:`1px solid ${C.line2}`, boxShadow:"0 1px 2px rgba(0,0,0,0.06)", overflowX:"auto", overflowY:"hidden", WebkitOverflowScrolling:"touch" }}>
            <svg viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid meet" className="block"
              style={{ background:"#dfe7df", width: bedFit==="fit" ? "100%" : `${displayPct.toFixed(1)}%`, height:"auto", maxHeight: bedFit==="fit" ? "44vh" : undefined, margin:"0 auto" }}>
              <defs>
                <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#cfe0e6"/><stop offset="55%" stopColor="#e2ecdf"/><stop offset="100%" stopColor="#eef2e2"/>
                </linearGradient>
                <radialGradient id="sun" cx="24%" cy="15%" r="42%">
                  <stop offset="0%" stopColor="#fffbe9" stopOpacity="0.85"/><stop offset="100%" stopColor="#fffbe9" stopOpacity="0"/>
                </radialGradient>
                <linearGradient id="lawn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#b7c98f"/><stop offset="100%" stopColor="#9cb079"/>
                </linearGradient>
                <linearGradient id="soil" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4d3a2b"/><stop offset="100%" stopColor="#5f4a37"/>
                </linearGradient>
                <radialGradient id="vign" cx="50%" cy="46%" r="72%">
                  <stop offset="68%" stopColor="#1c2415" stopOpacity="0"/><stop offset="100%" stopColor="#1c2415" stopOpacity="0.18"/>
                </radialGradient>
                <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope="0.06"/></feComponentTransfer></filter>
              </defs>

              <rect x="0" y="0" width={VB_W} height={VB_H} fill="url(#sky)"/>
              <rect x="0" y="0" width={VB_W} height={VB_H*0.62} fill="url(#sun)"/>
              <rect x="0" y={backGY-70} width={VB_W} height={VB_H-(backGY-70)} fill="url(#lawn)"/>
              {/* soft lawn horizon haze */}
              <rect x="0" y={backGY-74} width={VB_W} height="26" fill="#cdd9b0" opacity="0.5"/>

              {/* bed soil */}
              <path d={soilPath} fill="url(#soil)" stroke="#6d5942" strokeWidth="2.5"/>
              {mulch.map(m=>(
                <ellipse key={"mu"+m.k} cx={m.sx} cy={m.gy} rx={3.4*m.ds} ry={1.6*m.ds}
                  fill={m.tone>0?"#755d46":"#433427"} opacity={m.tone>0?0.5:0.42}/>
              ))}

              {/* front-edge ruler */}
              {ticks.map((p,i)=>(
                <g key={"tk"+i}>
                  <line x1={p.sx} y1={p.gy} x2={p.sx} y2={p.gy+7} stroke="#5e6b44" strokeWidth="1.4" opacity="0.7"/>
                </g>
              ))}
              <text x={fl.sx} y={fl.gy+22} fontSize="13" fill="#4c5838" fontFamily="ui-sans-serif">0 ft</text>
              <text x={fr.sx} y={fr.gy+22} fontSize="13" fill="#4c5838" textAnchor="end" fontFamily="ui-sans-serif">{width} ft</text>

              {/* plants, back to front */}
              {projected.map(({ inst, idx, sx, gy, ds })=>{
                const p = inst.plant;
                const m = seasonMods(p, season);
                if(!m.present) return null;
                const fuller = (p.form==="mat") ? 1.0 : 1.06;
                const wPx = clamp((p.w/12)*effPxFt*ds*m.sizeMul*fuller, 5, 480);
                const hPx = clamp((p.h/12)*effPxFt*vFactor*ds*m.sizeMul, 5, 520);
                const r = mulberry32(idx*2654435761 >>> 0);
                const imgU = plantImg(p.id, season);
                return (
                  <g key={idx} transform={`translate(${sx},${gy})`}>
                    <title>{p.name} · {p.latin}</title>
                    <ellipse cx={wPx*0.05} cy={1.5} rx={wPx*0.5} ry={Math.max(2.5,wPx*0.15)} fill="#241f12" opacity="0.16"/>
                    <ellipse cx={0} cy={0} rx={wPx*0.34} ry={Math.max(1.5,wPx*0.09)} fill="#241f12" opacity="0.12"/>
                    {imgU
                      ? <image href={imgU} x={-wPx/2} y={-hPx} width={wPx} height={hPx} preserveAspectRatio="xMidYMax meet"/>
                      : drawPlant(p, wPx, hPx, m.foliage, m.blooming, m.bloomColor, r)}
                  </g>
                );
              })}

              {/* atmosphere: vignette + fine paper grain */}
              <rect x="0" y="0" width={VB_W} height={VB_H} fill="url(#vign)" pointerEvents="none"/>
              <rect x="0" y="0" width={VB_W} height={VB_H} fill="#3a3327" opacity="0.5" filter="url(#grain)" pointerEvents="none"/>

              {/* season badge */}
              <g transform="translate(24,28)">
                <rect x="0" y="0" width="120" height="30" rx="15" fill={SEASONS[season].accent} opacity="0.92"/>
                <text x="60" y="20" textAnchor="middle" fontSize="14" fontWeight="600" fill="#fff" fontFamily="ui-sans-serif">{SEASONS[season].label}</text>
              </g>
            </svg>
          </div>
          {width > 12 && bedFit==="actual" && (
            <div className="text-[11px] mt-1.5 flex items-center gap-1.5" style={{ color:C.muted }}>
              <Ruler size={12}/> {width} ft wide — scroll the view sideways to see the whole border.
            </div>
          )}
        </div>

        {/* ---------- top-right: summary + plant schedule ---------- */}
        <div className="p-4 lg:p-6 min-w-0 lg:col-start-2 lg:row-start-1 lg:max-h-[54vh] lg:overflow-y-auto">
          {/* summary bar */}
          <div className="flex items-center gap-4 mt-3 mb-4 text-sm flex-wrap">
            <span className="px-3 py-1.5 rounded-md" style={{ background:C.paper, border:`1px solid ${C.line}` }}>
              <b>{listing.length}</b> species
            </span>
            <span className="px-3 py-1.5 rounded-md" style={{ background:C.paper, border:`1px solid ${C.line}` }}>
              <b>{totalPlants}</b> plants
            </span>
            <span className="px-3 py-1.5 rounded-md flex items-center gap-1.5" style={{ background:C.paper, border:`1px solid ${C.line}` }}>
              <Wallet size={15} style={{ color:C.green }}/> est. plant cost <b>${totalCost.toLocaleString()}</b>
            </span>
            <span className="text-xs" style={{ color:C.muted }}>{width}′ × {depth}′ ({(width*depth).toFixed(0)} sq ft)</span>
          </div>

          {/* plant list */}
          <div className="font-serif text-base mb-2" style={{ color:C.ink }}>Plant schedule</div>
          <div className="text-[11px] mb-2" style={{ color:C.muted }}>Tap any plant to use more or less of it, or swap it for a compatible alternative.</div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2">
            {listing.map(({ p, qty })=>{
              const m = seasonMods(p, season);
              const lvl = emphasis[p.id] || 0;
              const open = openPlant === p.id;
              return (
                <div key={p.id} className="rounded-lg" style={{ background:C.paper, border:`1px solid ${open ? C.green : (m.blooming && m.present ? SEASONS[season].accent : C.line)}` }}>
                  <button type="button" onClick={()=>{ setOpenPlant(open?null:p.id); setReplacing(null); }}
                    className="w-full flex items-center gap-3 p-2.5 text-left">
                    <div className="shrink-0 rounded-md" style={{ width:34, height:34, background:p.foliage, position:"relative" }}>
                      <div className="absolute rounded-full" style={{ width:12, height:12, right:3, top:3, background:p.bloomColor, border:"1px solid rgba(0,0,0,0.15)" }}/>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm truncate" style={{ color:C.text, fontWeight:600 }}>
                        {featured.includes(p.id) && <span style={{ color:C.green }}>★ </span>}{p.name}<span title={AVAIL_LABEL[p.avail||2]} className="inline-block rounded-full align-middle ml-1.5" style={{ width:7, height:7, background:AVAIL_COLOR[p.avail||2] }}/>
                        {lvl>0 && <span className="ml-1 text-[10px]" style={{ color:C.green }}>· more</span>}
                        {lvl<0 && <span className="ml-1 text-[10px]" style={{ color:C.muted }}>· less</span>}
                      </div>
                      <div className="text-[11px] italic truncate" style={{ color:C.muted }}>{p.latin}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[11px]" style={{ color:C.muted }}>{p.h}″ × {p.w}″</div>
                      <div className="flex gap-1 mt-1 justify-end">
                        {["spring","summer","fall"].map(s=>(
                          <span key={s} title={s} className="rounded-full" style={{
                            width:7, height:7,
                            background: p.bloom.includes(s) ? SEASONS[s].accent : C.line2,
                          }}/>
                        ))}
                      </div>
                    </div>
                    <div className="shrink-0 text-sm tabular-nums px-2 py-1 rounded-md" style={{ background:C.app, color:C.text, fontWeight:600 }}>×{qty}</div>
                  </button>

                  {open && (
                    <div className="px-2.5 pb-2.5 pt-2 border-t" style={{ borderColor:C.line }}>
                      <div className="text-[11px] mb-2" style={{ color:C.muted }}>Sourcing: <span style={{ color:AVAIL_COLOR[p.avail||2], fontWeight:600 }}>{AVAIL_LABEL[p.avail||2]}</span></div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] mr-1" style={{ color:C.muted }}>Amount</span>
                        <button type="button" disabled={lvl<=-2} onClick={()=>adjust(p.id,-1)}
                          className="text-[12px] px-2.5 py-1 rounded-md" style={{ background:C.app, color:lvl<=-2?C.line2:C.text, border:`1px solid ${C.line}`, opacity:lvl<=-2?0.5:1 }}>− Less</button>
                        <button type="button" disabled={lvl>=2} onClick={()=>adjust(p.id,1)}
                          className="text-[12px] px-2.5 py-1 rounded-md" style={{ background:C.app, color:lvl>=2?C.line2:C.text, border:`1px solid ${C.line}`, opacity:lvl>=2?0.5:1 }}>More +</button>
                        <button type="button" onClick={()=>setReplacing(replacing===p.id?null:p.id)}
                          className="text-[12px] px-2.5 py-1 rounded-md" style={{ background:replacing===p.id?C.green:C.app, color:replacing===p.id?"#fff":C.text, border:`1px solid ${replacing===p.id?C.green:C.line}` }}>⇄ Replace</button>
                      </div>
                      {replacing===p.id && (()=>{ const alts = alternativesFor(p); return (
                        <div className="mt-2">
                          <div className="text-[11px] mb-1" style={{ color:C.muted }}>Plants that fit this spot — {alts.length} option{alts.length===1?"":"s"}:</div>
                          {alts.length===0
                            ? <div className="text-[11px]" style={{ color:C.muted }}>No alternatives fit the current light, soil, zone and height.</div>
                            : <div className="flex flex-wrap gap-1.5">
                                {alts.map(q=>(
                                  <button key={q.id} type="button" onClick={()=>replacePlant(p,q)}
                                    className="text-[12px] px-2 py-1 rounded-md text-left" style={{ background:C.paper, color:C.text, border:`1px solid ${C.line}` }}>
                                    {q.name} <span className="italic" style={{ color:C.muted }}>· {q.h}″{plantCat(q)!==plantCat(p) ? ` · ${plantCat(q)}` : ""}</span>
                                  </button>
                                ))}
                              </div>}
                        </div>
                      ); })()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* pairings — filtered by every option, selectable to seed the design */}
          {(() => {
            const ps = PAIRINGS.filter(pr => pairingMatches(pr, opts));
            const nm = (id)=> (PLANT_BY_ID[id]?.name) || id;
            return (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-serif text-base" style={{ color:C.ink }}>Featured pairings</div>
                  {featured.length>0 && (
                    <button onClick={()=>setFeatured([])} className="text-[11px] underline" style={{ color:C.muted }}>clear ({featured.length})</button>
                  )}
                </div>
                <div className="text-[11px] mb-2 leading-snug" style={{ color:C.muted }}>
                  The design already features the highlighted combinations (about one per 4 ft). Tap to remove one or add others — all fit your current style, light, soil, zone, colors and height.
                </div>
                {ps.length === 0 ? (
                  <div className="text-[12px] p-3 rounded-lg" style={{ background:C.paper, border:`1px dashed ${C.line2}`, color:C.muted }}>
                    No pairings match every current setting. Try widening the color limit, raising the height, or changing the style.
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-2">
                    {ps.map((pr,i)=>{
                      const on = featured.includes(pr.a) && featured.includes(pr.b);
                      return (
                        <button key={i} onClick={()=>togglePairing(pr)} className="text-left p-2.5 rounded-lg transition-colors"
                          style={{ background: on?"#eef3e6":C.paper, border:`1.5px solid ${on?C.green:C.line}` }}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="text-sm leading-snug" style={{ color:C.text, fontWeight:600 }}>
                              {nm(pr.a)} <span style={{ color:C.clay }}>+</span> {nm(pr.b)}
                            </div>
                            <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full mt-0.5" style={{ background:on?C.green:C.app, color:on?"#fff":C.muted, fontWeight:600 }}>
                              {on?"✓ featured":"+ add"}
                            </span>
                          </div>
                          <div className="text-[11px] mt-0.5 leading-snug" style={{ color:C.muted }}>{pr.n}</div>
                        </button>
                      );
                    })}
                  </div>
                )}
                {featured.length>0 && (
                  <div className="text-[11px] mt-2" style={{ color:C.green }}>
                    Featured plants are built into the design and kept when you generate a new variation.
                  </div>
                )}
              </div>
            );
          })()}

          <div className="mt-4 text-[11px] leading-relaxed" style={{ color:C.muted }}>
            Bloom dots show spring / summer / fall interest per plant. Colored card border = blooming in the selected season.
            Costs are rough nursery estimates for quoting only. Plant data is a curated starter set, not a substitute for local horticultural advice.
          </div>
        </div>
      </div>
    </div>
  );
}
