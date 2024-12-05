const names = [
  'Han Solo', // Star Wars
  'Kirk', // Star Trek
  'Spock', // Star Trek
  'Sulu', // Star Trek
  'Paris', // Star Trek: Voyager
  'Malcolm', // Firefly
  'Wash', // Firefly
  'Starbuck', // Battlestar Galactica
  'Apollo', // Battlestar Galactica
  'Adama', // Battlestar Galactica
  'Leela', // Futurama
  'Zapp', // Futurama
  'Buck', // Buck Rogers
  'Flash', // Flash Gordon
  'Ripley', // Alien
  'Hicks', // Aliens
  'Korben', // The Fifth Element
  'Ruby', // The Fifth Element
  'Buzz', // Toy Story
  'Shepard', // Mass Effect
  'Garrus', // Mass Effect
  'Nemo', // 20,000 Leagues Under the Sea
  'Bowman', // 2001: A Space Odyssey
  'Hal', // 2001: A Space Odyssey
  'Riker', // Star Trek: TNG
  'Picard', // Star Trek: TNG
  'Mando', // The Mandalorian
  'Ahsoka', // Star Wars
  'Lando', // Star Wars
  'Lone Starr', // Spaceballs
  'Helmet', // Spaceballs
  'Rimmer', // Red Dwarf
  'Ace', // Red Dwarf
  'The Doctor', // Doctor Who
  'River', // Doctor Who
  'Starr', // The Expanse
  'Naomi', // The Expanse
  'Holden', // The Expanse
  'Amos', // The Expanse
];

export const getRandomName = () =>
  names[Math.floor(Math.random() * names.length)];
