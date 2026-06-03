// studio/migrate.mjs
// Populates Sanity project yi9utzrz / dataset production with seed data from source/app.js.
//
// Usage (PowerShell):
//   cd studio
//   $env:SANITY_TOKEN="<editor-token>"; node migrate.mjs
//
// Get token: sanity.io/manage → project yi9utzrz → API → Tokens → Add API token (Editor)

import {createClient} from '@sanity/client'
import {randomUUID} from 'crypto'

const client = createClient({
  projectId: 'yi9utzrz',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_TOKEN,
  useCdn: false,
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function key() {
  return randomUUID().replace(/-/g, '').slice(0, 12)
}

// Strip "$", handle dual prices like "$3.50 / $4.00" (take first value)
function parsePrice(str) {
  if (!str) return null
  const n = parseFloat(String(str).split('/')[0].replace(/[^0-9.]/g, ''))
  return isNaN(n) ? null : n
}

// Markdown → Sanity Portable Text
// Handles: ## h2, ### h3, > blockquote, - bullets, **bold**, *italic*, plain paragraphs
function mdToBlocks(md) {
  if (!md) return []
  const blocks = []
  const lines = md.split('\n')
  let i = 0
  while (i < lines.length) {
    const line = lines[i].trim()
    if (!line) { i++; continue }
    if (line.startsWith('### ')) {
      blocks.push(mkBlock('h3', line.slice(4))); i++
    } else if (line.startsWith('## ')) {
      blocks.push(mkBlock('h2', line.slice(3))); i++
    } else if (line.startsWith('> ')) {
      blocks.push(mkBlock('blockquote', line.slice(2))); i++
    } else if (/^[-*] /.test(line)) {
      while (i < lines.length && /^[-*] /.test(lines[i].trim())) {
        blocks.push({
          _type: 'block', _key: key(), style: 'normal',
          listItem: 'bullet', level: 1, markDefs: [],
          children: inlineSpans(lines[i].trim().slice(2)),
        })
        i++
      }
    } else {
      blocks.push(mkBlock('normal', line)); i++
    }
  }
  return blocks
}

function mkBlock(style, text) {
  return {_type: 'block', _key: key(), style, markDefs: [], children: inlineSpans(text)}
}

function inlineSpans(text) {
  const spans = []
  const re = /(\*\*(.+?)\*\*|\*([^*\n]+)\*)/g
  let last = 0, m
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) spans.push({_type: 'span', _key: key(), text: text.slice(last, m.index), marks: []})
    if (m[0].startsWith('**')) spans.push({_type: 'span', _key: key(), text: m[2], marks: ['strong']})
    else spans.push({_type: 'span', _key: key(), text: m[3], marks: ['em']})
    last = m.index + m[0].length
  }
  if (last < text.length) spans.push({_type: 'span', _key: key(), text: text.slice(last), marks: []})
  return spans.length ? spans : [{_type: 'span', _key: key(), text, marks: []}]
}

// ── Seed data (extracted from source/app.js) ──────────────────────────────────

const LOCATIONS_SEED = [
  {
    id: 'atlanta',
    city: 'Atlanta',
    state: 'Georgia',
    status: 'open',
    address: '10305 Medlock Bridge Rd, Johns Creek, GA 30097',
    phone: '+1 (678) 587-5394',
    hours: 'Mon–Sat 8am–2am · Sun 10am–10pm',
    capacity: 250,
    opened: '2026',
  },
]

const HOME_SEED = {
  hero: {
    word1: 'Bites',
    word2: 'Beats',
    word3: 'Booze',
    subModes: ['Modern American', 'Sports Theatre', 'Gold-Room Nightclub'],
    videoSrc: '../assets/hero.mp4',
  },
  marqueeWords: ['Sunday Football', 'Late Kitchen', 'Gold Room', 'Every Day Brunch', 'Private Events', 'Live DJs'],
}

const GAMEDAY_SEED = {
  atlanta: {
    instagram: 'clvch_atlanta',
    facebook: 'clvchatlanta',
    caption: 'Sunday Night Football · Kitchen till 1 AM',
  },
}

const ARTICLES_SEED = [
  {
    id: 'game-day-at-clvch-atlanta',
    title: 'Game Day at CLVCH Atlanta',
    excerpt: "Every Sunday, we turn the main floor into the best seat in the house. Here's what that actually looks like.",
    body: `## The Setup

Wall-to-wall screens. A kitchen that runs until 1 AM. A bar program that doesn't shut down at halftime.

Game day at CLVCH isn't about survival food and plastic cups — it's about doing it properly. We run our full menu, our full bar, and the energy in the room hits differently when 340 people are watching the same play.

## What to Order

Start with the **Hot Honey Wings** (12 pc) and the **Truffle Fries**. If there's a table of four or more, add the **Prime Smash Sliders** tray. For drinks, the **Smoked Margarita** is the move — or the **Gold Rush Old Fashioned** if it's a late game.

## The Timing

Kitchen opens at noon on Sunday. By 3 PM the room is at capacity. Come early, or reserve a table for the night game.

> "Best game day spot I've found in Atlanta. Tables, full menu, and actual cocktails."`,
    date: '2025-10-12',
    published: true,
    tags: ['gameday', 'atlanta', 'nfl'],
  },
  {
    id: 'why-we-built-clvch',
    title: 'Why We Built CLVCH',
    excerpt: "Three rooms, one address, and a conviction that great food and great atmosphere shouldn't be a trade-off.",
    body: `## The Problem We Kept Running Into

Every city has great restaurants. Every city has great bars. Almost none of them share a building — let alone a menu.

We kept ending up in situations where the food was good but the atmosphere was dead, or the room was electric but you were eating something you'd regret. CLVCH started as a solution to that specific frustration.

## Three Rooms, One Address

The kitchen runs **Modern American** — Southern roots, wood-fired technique, a chef's approach to bar food. The nightlife floor handles Thursday through Saturday, lights down at ten. The Gold Room is what happens when a private dining room and a VIP section have a very good evening together.

## What's Next

Atlanta was chapter one. More cities are coming. The model stays the same: find the right building, build the right team, don't compromise on any of the three rooms.

The house is yours.`,
    date: '2025-09-01',
    published: true,
    tags: ['brand', 'story'],
  },
  {
    id: 'the-perfect-pre-game',
    title: 'The Perfect Pre-Game Setup',
    excerpt: 'How to make the two hours before kickoff the best part of Sunday.',
    body: `## Arrive Before the Rush

The window is 11 AM to 1 PM. Kitchen is warm, bar is moving, and you can actually hear the table next to you. After 2 PM, you're competing with everyone who had the same idea.

## Build the Table Right

For a group of four:

- **Hot Honey Wings** (12 pc) — share these
- **Truffle Fries** — one order per two people
- **Prime Smash Burgers** — one each, order them medium
- **Smoked Margaritas** — two pitchers for the table

## The Rule

Order everything at once. Kitchens run cleaner when the whole table is in sync, and you won't miss the first drive chasing a server.`,
    date: '2025-11-15',
    published: false,
    tags: ['gameday', 'tips'],
  },
]

const MENU_SEED = {
  coffee: [],
  kitchen: [
    {name: 'Grilled Cheese', desc: 'Sourdough, caramelized onions, basil, Dijon, mixed cheese · served with sweet potato chips, house salad & pickles', price: '$14.50', tag: 'Sandwich'},
    {name: 'Chipotle Roasted Chicken', desc: 'Ciabatta, cheddar, pesto, lemon garlic aioli · served with sweet potato chips, house salad & pickles', price: '$16.50', tag: 'Sandwich'},
    {name: 'Turkey Club', desc: 'Sourdough, bacon, cheddar, avocado · served with sweet potato chips, house salad & pickles', price: '$17.50', tag: 'Sandwich'},
    {name: 'Gourmet Ham & Brie', desc: 'Ciabatta, Black Forest ham, Dijon, brie, fig jam · served with sweet potato chips, house salad & pickles', price: '$17.00', tag: 'Sandwich'},
    {name: 'Roasted Beef', desc: 'Ciabatta, blue cheese, caramelized onions · served with sweet potato chips, house salad & pickles', price: '$18.00', tag: 'Sandwich'},
    {name: 'Double Cheese Burger', desc: 'Two prime beef patties, brioche, sharp cheddar, pickles · Add bacon +$3 · Add egg +$1.50', price: '$18.99', tag: 'Burger'},
    {name: 'Tomato Basil Soup', desc: 'Vine-ripened tomato & sweet basil velouté · served with garlic baguette', price: '$6.99', tag: 'Soup'},
    {name: 'Crème of Mushroom', desc: 'Forest mushrooms, fresh cream, thyme, truffle oil · served with garlic baguette', price: '$8.99', tag: 'Soup'},
    {name: 'French Onion Soup', desc: 'Thyme-infused beef broth, Gruyère · served with garlic baguette', price: '$9.99', tag: 'Soup'},
    {name: 'Greek Salad', desc: 'Fresh veggies, Kalamata olives, feta crumbs, lemon oregano dressing', price: '$12.99', tag: 'Salad'},
    {name: 'Cobb Salad', desc: 'Chicken, bacon, avocado, egg, blue cheese', price: '$15.99', tag: 'Salad'},
    {name: 'Kale Caesar', desc: 'Garlic sourdough, parmesan, classic Caesar dressing · Add chicken +$2 · Add salmon +$3', price: '$15.99', tag: 'Salad'},
    {name: 'Nachos', desc: 'Tortilla chips, queso cheese, jalapeños, sour cream, guacamole, salsa', price: '$12.99', tag: 'Appetizer'},
    {name: 'Crispy Onion Rings', desc: 'Lightly battered, golden fried', price: '$9.99', tag: 'Appetizer'},
    {name: 'Sweet Potato Fries', desc: 'Basket of seasoned sweet potato fries', price: '$6.99', tag: 'Appetizer'},
    {name: 'Jalapeño Poppers', desc: 'Stuffed jalapeños, crispy battered', price: '$12.99', tag: 'Appetizer'},
    {name: 'Buffalo Wings', desc: 'Celery, blue cheese dip', price: '$10.99', tag: 'Appetizer'},
    {name: 'Chicken Tenders', desc: 'Sweet potato fries, blue cheese dip', price: '$12.99', tag: 'Appetizer'},
    {name: 'Fish N Chips', desc: 'Sweet potato sauce, tartar sauce', price: '$16.99', tag: 'Appetizer'},
    {name: '10 oz Ribeye', desc: 'Citrus chive potato mash, sautéed vegetables, peppercorn sauce', price: '$27.99', tag: 'Steak'},
    {name: 'New York Strip', desc: 'Citrus chive potato mash, sautéed vegetables, peppercorn sauce', price: '$32.00', tag: 'Steak'},
    {name: 'T-Bone', desc: 'Citrus chive potato mash, sautéed vegetables, peppercorn sauce', price: '$30.00', tag: 'Steak'},
    {name: 'Herb Crusted Salmon / Sea Bass', desc: 'Parsley, tarragon, lemon thyme butter sauce', price: '$28.00', tag: 'Seafood'},
    {name: 'Corn Fed Chicken Breast', desc: 'Thyme butter sauce', price: '$22.00', tag: 'Entrée'},
    {name: 'Country Style Pork Chops', desc: 'With apple sauce', price: '$24.00', tag: 'Entrée'},
    {name: 'Pistachio Crushed Lamb Chops', desc: 'Mint sauce', price: '$24.00', tag: 'Entrée'},
    {name: 'Mac N Cheese', desc: 'Creamy house mac', price: '$14.99', tag: 'Pasta'},
    {name: 'Penne', desc: 'Choice of Classic Tomato, Creamy Pesto, or Creamy Alfredo · Add veg +$2 · chicken +$3.50 · meatballs +$4 · sausage +$4 · shrimp +$6', price: '$14.99', tag: 'Pasta'},
    {name: 'Spaghetti', desc: 'Choice of Classic Tomato, Creamy Pesto, or Creamy Alfredo · Add veg +$2 · chicken +$3.50 · meatballs +$4 · sausage +$4 · shrimp +$6', price: '$14.99', tag: 'Pasta'},
    {name: 'Ravioli', desc: 'Choice of Classic Tomato, Creamy Pesto, or Creamy Alfredo · Add veg +$2 · chicken +$3.50 · meatballs +$4 · sausage +$4 · shrimp +$6', price: '$14.99', tag: 'Pasta'},
    {name: 'New York Cheesecake', desc: 'With blueberry topping', price: '$10.49', tag: 'Dessert'},
    {name: 'Chocolate Brownie', desc: 'With French vanilla ice cream', price: '$11.49', tag: 'Dessert'},
    {name: 'Warm Apple Pie', desc: 'With vanilla ice cream', price: '$9.99', tag: 'Dessert'},
    {name: 'Tres Leches', desc: 'With fresh berries', price: '$9.99', tag: 'Dessert'},
  ],
  brunch: [
    {name: 'Avocado Toast', desc: 'Avocado, multigrain, baby beets, feta', price: '$14.99', tag: 'Toast'},
    {name: 'CLUCH Toast', desc: 'Avocado, multigrain, poached cage-free egg, pumpkin seeds, Oscietra caviar', price: '$16.99', tag: 'Signature'},
    {name: 'Nordic Royal', desc: 'Smoked salmon, caper, dill cream, scrambled egg', price: '$18.99', tag: 'Toast'},
    {name: 'Provençal Sunrise', desc: 'Ratatouille ricotta, sunny side egg', price: '$16.99', tag: 'Toast'},
    {name: 'Smoky Morning Melts', desc: 'Bacon, mushroom, caramelized onions, sunny side egg', price: '$16.99', tag: 'Toast'},
    {name: 'Italian Sunrise', desc: 'Prosciutto ricotta, scrambled egg', price: '$18.99', tag: 'Toast'},
    {name: 'Brioche French Toast', desc: 'Raspberry peach champagne jam, pecans, mascarpone, rose petals, fresh berries', price: '$15.99', tag: 'French Toast'},
    {name: 'Flambéed Foster', desc: 'Caramelized bananas, apple, berries, rum flambé', price: '$16.99', tag: 'French Toast'},
    {name: 'Citrus Ricotta Pancake', desc: 'Lemon ricotta, mascarpone, thyme honey, candied lemon zest', price: '$16.99', tag: ''},
    {name: 'Omelette — Ratatouille, Spinach & Chèvre', desc: '3 cage-free eggs, ratatouille, baby spinach, chèvre · served with toast & house salad', price: '$14.99', tag: 'Eggs'},
    {name: 'Omelette — Fine Herbs & Gruyère', desc: '3 cage-free eggs, fine herbs, Gruyère · served with toast & house salad', price: '$12.99', tag: 'Eggs'},
    {name: 'Omelette — Ham, Mushroom & Cheddar', desc: '3 cage-free eggs, ham, mushroom, cheddar · served with toast & house salad', price: '$13.99', tag: 'Eggs'},
    {name: 'Omelette — Bacon, Cheddar & Gruyère', desc: '3 cage-free eggs, bacon, cheddar, Gruyère · served with toast & house salad', price: '$13.99', tag: 'Eggs'},
    {name: 'Plain Waffle', desc: 'Mascarpone, butter, maple syrup, fresh berries', price: '$12.99', tag: 'Waffle'},
    {name: 'Chicken Potato Waffle', desc: 'Bacon, glazed peaches, sweet potatoes, candied pecans', price: '$14.99', tag: 'Waffle'},
    {name: 'Scandinavian Royal Waffle', desc: 'Smoked salmon, avocado, poached egg', price: '$16.99', tag: 'Waffle'},
    {name: 'Granola', desc: 'Organic granola, berries, honey', price: '$9.75', tag: 'Light'},
    {name: 'Bircher Muesli', desc: 'Overnight soaked oats, cream, nuts, fresh berries', price: '$10.99', tag: "Chef's Special"},
    {name: 'Ham N Cheese Croissant', desc: 'Smoked ham, fig jam, grain mustard, cheddar', price: '$12.99', tag: ''},
    {name: 'Smoked Salmon Bagel', desc: 'Smoked salmon, red onion, capers, tomato, dill cream', price: '$12.99', tag: ''},
    {name: 'Southern Sunrise', desc: 'Bacon, egg & cheddar cheese on biscuit', price: '$12.99', tag: ''},
    {name: 'Quiche Lorraine', desc: 'Cage-free eggs, ham, bacon, Swiss custard, buttery pie crust', price: '$14.99', tag: ''},
    {name: 'Florentine Quiche', desc: 'Baby spinach, cage-free eggs, Swiss custard, buttery pie crust', price: '$13.99', tag: 'Vegetarian'},
    {name: 'Drip Coffee', desc: 'Freshly brewed · Small 8oz / Large 16oz', price: '$3.50 / $4.00', tag: 'Coffee'},
    {name: 'Espresso', desc: 'Single 1oz / Double 2oz', price: '$3.75 / $5.00', tag: 'Coffee'},
    {name: 'Cappuccino', desc: '12oz', price: '$6.00', tag: 'Coffee'},
    {name: 'Cold Brew', desc: 'Small 8oz / Large 16oz', price: '$6.00 / $7.00', tag: 'Coffee'},
    {name: 'Café Latte', desc: '12oz', price: '$7.00', tag: 'Coffee'},
    {name: 'Chai Latte', desc: '12oz', price: '$6.00', tag: ''},
    {name: 'Café Mocha', desc: '12oz', price: '$7.50', tag: 'Coffee'},
    {name: 'Hot Chocolate', desc: '12oz', price: '$6.50', tag: ''},
    {name: 'Selection of Teas', desc: 'English Breakfast, Earl Grey, Camomile, Green Herbal', price: '$4.50', tag: ''},
    {name: 'Soft Drinks', desc: 'Coke, Diet Coke, Sprite', price: '$4.50', tag: ''},
  ],
  bar: [
    {name: 'Citrus Saline Martini', desc: 'Premium dry gin & vodka, citrus peel, dry sherry, saline solution — clean, layered, savory finish', price: '$16', tag: 'Signature'},
    {name: 'Pearl of the Orient', desc: 'Pear-infused vodka, jasmine tea tincture, clarified lemon juice, rose petal garnish', price: '$16', tag: 'Signature'},
    {name: 'Golden Fino Elixir', desc: 'Saffron-infused rum, fino sherry, honey — warm spice, dry elegance, golden finish', price: '$16', tag: 'Signature'},
    {name: 'Indigo Garden', desc: 'Botanical gin, house citrus blend, blue pea flower — color transforms in the glass', price: '$15', tag: 'Signature'},
    {name: 'Kyoto Velvet', desc: 'Japanese whisky, vodka, cardamom syrup — silky, gently spiced', price: '$18', tag: 'Signature'},
    {name: 'Elder Bloom Sour', desc: 'Elderflower gin, oleo syrup, lemon blend — floral, crisp botanical finish', price: '$15', tag: 'Signature'},
    {name: 'Strawberry Negroni', desc: 'Botanical gin, Campari, sweet vermouth, fresh strawberry purée', price: '$16', tag: 'Signature'},
    {name: 'Spiced Tropical Reverie', desc: 'Kaffir lime gin, green chili mango purée — tropical fruit meets lingering heat', price: '$16', tag: 'Signature'},
    {name: 'Island Gold Daiquiri', desc: 'Pineapple-infused rum, fresh lime juice, fine sugar', price: '$14', tag: 'Signature'},
    {name: 'Mango Ember Smash', desc: 'Whisky, mango purée, fresh lime juice, honey', price: '$16', tag: 'Signature'},
    {name: 'Bud Light', desc: 'Domestic lager', price: '$6', tag: 'Beer'},
    {name: 'Miller Lite', desc: 'Domestic lager', price: '$6', tag: 'Beer'},
    {name: 'Michelob Ultra', desc: 'Domestic lager', price: '$6', tag: 'Beer'},
    {name: 'Coors Light', desc: 'Domestic lager', price: '$6', tag: 'Beer'},
    {name: 'Tropicalia', desc: 'Creature Comforts craft ale', price: '$8', tag: 'Craft'},
    {name: 'Duende', desc: 'Craft beer', price: '$8', tag: 'Craft'},
    {name: 'Cosmic Debris', desc: 'Craft beer', price: '$8', tag: 'Craft'},
    {name: 'Basement IPA', desc: 'India pale ale', price: '$8', tag: 'Craft'},
    {name: 'Corona Premier', desc: 'Import lager', price: '$7', tag: 'Import'},
    {name: 'Dos Equis', desc: 'Import lager', price: '$7', tag: 'Import'},
    {name: 'Guinness', desc: 'Irish stout', price: '$8', tag: 'Import'},
    {name: 'Heineken', desc: 'Import lager', price: '$7', tag: 'Import'},
    {name: 'Modelo Especial', desc: 'Import lager', price: '$7', tag: 'Import'},
    {name: 'Stella Artois', desc: 'Belgian lager', price: '$8', tag: 'Import'},
    {name: 'Elite Vodka', desc: 'House pour', price: '$12', tag: 'Vodka'},
    {name: 'Absolut', desc: 'Sweden', price: '$11', tag: 'Vodka'},
    {name: "Tito's Handmade", desc: 'Texas', price: '$12', tag: 'Vodka'},
    {name: 'Grey Goose', desc: 'France', price: '$14', tag: 'Vodka'},
    {name: 'Beluga', desc: 'Russia', price: '$22', tag: 'Vodka'},
    {name: 'Smirnoff', desc: 'Classic', price: '$10', tag: 'Vodka'},
    {name: 'Belvedere 10', desc: 'Poland, premium', price: '$28', tag: 'Vodka'},
    {name: 'Tanqueray No. Ten', desc: 'London Dry', price: '$14', tag: 'Gin'},
    {name: 'Monkey 47', desc: 'Black Forest, Germany', price: '$20', tag: 'Gin'},
    {name: 'Botanist Islay Dry Gin', desc: 'Scotland', price: '$15', tag: 'Gin'},
    {name: 'Beefeater 24', desc: 'London Dry', price: '$14', tag: 'Gin'},
    {name: 'Bombay Sapphire', desc: 'London Dry', price: '$12', tag: 'Gin'},
    {name: 'Hendricks', desc: 'Scotland, cucumber & rose', price: '$14', tag: 'Gin'},
    {name: "Gordon's Gin", desc: 'London Dry', price: '$10', tag: 'Gin'},
    {name: 'Jose Cuervo', desc: 'Mexico', price: '$11', tag: 'Tequila'},
    {name: 'Don Fulani Fuerte', desc: 'Mexico', price: '$16', tag: 'Tequila'},
    {name: 'Don Julio', desc: 'Mexico', price: '$16', tag: 'Tequila'},
    {name: 'Patron', desc: 'Mexico', price: '$16', tag: 'Tequila'},
    {name: '1800 Tequila', desc: 'Mexico', price: '$13', tag: 'Tequila'},
    {name: 'Deleon Añejo', desc: 'Mexico, aged', price: '$18', tag: 'Tequila'},
    {name: 'Marquis de Montesquieu Armagnac', desc: 'France', price: '$28', tag: 'Brandy'},
    {name: 'Rémy Martin VSOP', desc: 'Cognac, France', price: '$18', tag: 'Cognac'},
    {name: 'Hennessy', desc: 'Cognac, France', price: '$16', tag: 'Cognac'},
    {name: 'Nardini Grappa Bianca', desc: 'Italy', price: '$14', tag: 'Brandy'},
    {name: 'La Caravedo Pisco Quebranta', desc: 'Peru', price: '$13', tag: 'Brandy'},
    {name: 'E&J Brandy', desc: 'USA', price: '$10', tag: 'Brandy'},
    {name: 'Buffalo Trace Bourbon', desc: 'Kentucky', price: '$13', tag: 'Bourbon'},
    {name: 'Woodford Reserve', desc: 'Kentucky Straight Bourbon', price: '$15', tag: 'Bourbon'},
    {name: "Maker's Mark", desc: 'Kentucky Bourbon', price: '$14', tag: 'Bourbon'},
    {name: 'Bulleit Bourbon', desc: 'Kentucky', price: '$13', tag: 'Bourbon'},
    {name: 'Mochters US-1 Small Batch', desc: 'Kentucky Bourbon', price: '$18', tag: 'Bourbon'},
    {name: "Jack Daniel's Tennessee", desc: 'Tennessee Whiskey', price: '$12', tag: 'Whiskey'},
    {name: 'Johnnie Walker Black', desc: 'Blended Scotch', price: '$14', tag: 'Scotch'},
    {name: 'Dewars White Label', desc: 'Blended Scotch', price: '$11', tag: 'Scotch'},
    {name: 'Chivas Regal 12 Yr', desc: 'Blended Scotch', price: '$13', tag: 'Scotch'},
    {name: 'Chivas Regal 18 Yr', desc: 'Blended Scotch', price: '$20', tag: 'Scotch'},
    {name: "Ballantine's Finest", desc: 'Blended Scotch', price: '$11', tag: 'Scotch'},
    {name: 'Monkey Shoulder', desc: 'Blended Malt Scotch', price: '$14', tag: 'Scotch'},
    {name: 'Dewars Double Double 21 Yr', desc: 'Premium Blended Scotch', price: '$28', tag: 'Scotch'},
    {name: 'Glenmorangie Original 10 Yr', desc: 'Highlands', price: '$15', tag: 'Single Malt'},
    {name: 'Talisker 10 Yr', desc: 'Isle of Skye', price: '$16', tag: 'Single Malt'},
    {name: 'Laphroaig 10 Yr', desc: 'Islay, peated', price: '$17', tag: 'Single Malt'},
    {name: 'Glenallachie 12 Yr', desc: 'Speyside', price: '$16', tag: 'Single Malt'},
    {name: 'Glenlivet 12 Yr', desc: 'Speyside', price: '$15', tag: 'Single Malt'},
    {name: 'Macallan 12 Yr', desc: 'Speyside', price: '$20', tag: 'Single Malt'},
    {name: 'Glenfiddich 12 Yr', desc: 'Speyside', price: '$15', tag: 'Single Malt'},
    {name: 'Balvenie Doublewood 12 Yr', desc: 'Speyside', price: '$18', tag: 'Single Malt'},
    {name: 'Aberfeldy 12 Yr', desc: 'Highlands', price: '$15', tag: 'Single Malt'},
    {name: 'Oban 14 Yr', desc: 'Highlands', price: '$20', tag: 'Single Malt'},
    {name: 'Lagavulin 16 Yr', desc: 'Islay, peated', price: '$22', tag: 'Single Malt'},
    {name: 'Moët & Chandon Imperial', desc: 'Champagne, France', price: '$110', tag: 'Sparkling'},
    {name: 'Veuve Clicquot Brut', desc: 'Champagne, France', price: '$120', tag: 'Sparkling'},
    {name: 'La Marca Prosecco', desc: 'Italy', price: '$36', tag: 'Sparkling'},
    {name: 'Luc Belaire Luxe', desc: 'France', price: '$75', tag: 'Sparkling'},
    {name: 'Korbel Brut', desc: 'California', price: '$32', tag: 'Sparkling'},
    {name: 'Barefoot Bubbly', desc: 'California', price: '$26', tag: 'Sparkling'},
    {name: "Cook's California", desc: 'California', price: '$28', tag: 'Sparkling'},
    {name: 'Kendall-Jackson Chardonnay', desc: "Vintner's Reserve, California", price: '$42', tag: 'Chardonnay'},
    {name: 'Josh Cellars Chardonnay', desc: 'California', price: '$36', tag: 'Chardonnay'},
    {name: 'Reva Langhe', desc: 'Italy', price: '$65', tag: 'Chardonnay'},
    {name: 'Sonoma-Cutrer Chardonnay', desc: 'California', price: '$58', tag: 'Chardonnay'},
    {name: 'Hartford Court Chardonnay', desc: 'California', price: '$75', tag: 'Chardonnay'},
    {name: 'Chablis', desc: 'France', price: '$70', tag: 'Chardonnay'},
    {name: 'Kim Crawford Sauvignon Blanc', desc: 'New Zealand', price: '$40', tag: 'Sauvignon Blanc'},
    {name: 'Joel Gott Sauvignon Blanc', desc: 'California', price: '$36', tag: 'Sauvignon Blanc'},
    {name: 'Duckhorn Sauvignon Blanc', desc: 'Napa Valley', price: '$75', tag: 'Sauvignon Blanc'},
    {name: 'Oyster Bay Sauvignon Blanc', desc: 'New Zealand', price: '$38', tag: 'Sauvignon Blanc'},
    {name: 'Meiomi Pinot Noir', desc: 'California', price: '$45', tag: 'Pinot Noir'},
    {name: 'La Crema Pinot Noir', desc: 'Sonoma Coast, California', price: '$52', tag: 'Pinot Noir'},
    {name: 'Decoy Pinot Noir', desc: 'Sonoma Coast', price: '$55', tag: 'Pinot Noir'},
    {name: 'Domaine Carneros Pinot Clair', desc: 'California', price: '$75', tag: 'Pinot Noir'},
    {name: 'Bogle Merlot', desc: 'California', price: '$34', tag: 'Merlot'},
    {name: 'Josh Cellars Merlot', desc: 'California', price: '$36', tag: 'Merlot'},
    {name: 'Château Souverain Merlot', desc: 'California', price: '$38', tag: 'Merlot'},
    {name: 'Caymus Cabernet Sauvignon', desc: 'Napa Valley', price: '$160', tag: 'Cabernet'},
    {name: 'Château de Costis Bordeaux Rouge', desc: 'France', price: '$75', tag: 'Cabernet'},
    {name: 'Decoy Cabernet Sauvignon', desc: 'Sonoma', price: '$58', tag: 'Cabernet'},
    {name: 'Robert Mondavi Cabernet', desc: 'California', price: '$50', tag: 'Cabernet'},
  ],
}

// ── Migration ─────────────────────────────────────────────────────────────────

async function migrate() {
  if (!process.env.SANITY_TOKEN) {
    console.error('ERROR: SANITY_TOKEN is not set.')
    console.error('PowerShell: $env:SANITY_TOKEN="<token>"; node migrate.mjs')
    process.exit(1)
  }

  console.log('Starting migration → project yi9utzrz / dataset production\n')

  // 1. Locations — deterministic IDs so re-runs are safe
  console.log('1. Locations...')
  const locationRefs = {}
  for (const loc of LOCATIONS_SEED) {
    const doc = await client.createOrReplace({
      _id: `location-${loc.id}`,
      _type: 'location',
      id: loc.id,
      city: loc.city,
      state: loc.state,
      status: loc.status,
      address: loc.address,
      phone: loc.phone,
      hours: loc.hours,
      capacity: loc.capacity,
      openedYear: parseInt(loc.opened, 10),
    })
    locationRefs[loc.id] = doc._id
    console.log(`   ✓ ${loc.city} → ${doc._id}`)
  }

  // 2. Home page — singleton with deterministic ID
  console.log('\n2. Home page...')
  await client.createOrReplace({
    _id: 'singleton-home-page',
    _type: 'homePage',
    heroTagline: [HOME_SEED.hero.word1, HOME_SEED.hero.word2, HOME_SEED.hero.word3].join(' · '),
    heroSubtitle: HOME_SEED.hero.subModes.join(' · '),
    marqueeWords: HOME_SEED.marqueeWords,
  })
  console.log('   ✓ Home page → singleton-home-page')

  // 3. Menu items — single batched transaction (kitchen: 34, brunch: 33, bar: 102)
  console.log('\n3. Menu items...')
  const tx = client.transaction()
  let menuCount = 0
  for (const tab of ['kitchen', 'brunch', 'bar']) {
    for (const [idx, item] of (MENU_SEED[tab] || []).entries()) {
      tx.create({
        _type: 'menuItem',
        name: item.name,
        description: item.desc || '',
        price: parsePrice(item.price),
        tab,
        tags: item.tag ? [item.tag] : [],
        available: true,
        sortOrder: idx,
        location: {_type: 'reference', _ref: 'location-atlanta'},
      })
      menuCount++
    }
  }
  await tx.commit()
  console.log(`   ✓ ${menuCount} menu items`)

  // 4. Stories
  console.log('\n4. Stories...')
  for (const a of ARTICLES_SEED) {
    await client.create({
      _type: 'story',
      title: a.title,
      slug: {_type: 'slug', current: a.id},
      publishedDate: a.date ? new Date(a.date + 'T12:00:00Z').toISOString() : undefined,
      category: (a.tags || [])[0] || undefined,
      excerpt: a.excerpt || '',
      body: mdToBlocks(a.body),
      published: a.published,
    })
    console.log(`   ✓ "${a.title}" (${a.published ? 'published' : 'draft'})`)
  }

  // 5. Gameday posters
  console.log('\n5. Gameday posters...')
  for (const [cityId, gd] of Object.entries(GAMEDAY_SEED)) {
    const ref = locationRefs[cityId]
    if (!ref) { console.log(`   ✗ No location ref for ${cityId}, skipping`); continue }
    await client.create({
      _type: 'gamedayPoster',
      location: {_type: 'reference', _ref: ref},
      instagramHandle: gd.instagram,
      facebookHandle: gd.facebook,
      caption: gd.caption,
      showSchedule: true,
      showSpecials: false,
    })
    console.log(`   ✓ Gameday poster → ${cityId}`)
  }

  console.log('\n✅ Migration complete.')
  console.log('   Verify at: https://sanity.io/manage/project/yi9utzrz')
}

migrate().catch(err => {
  console.error('\n❌ Migration failed:', err.message)
  process.exit(1)
})
