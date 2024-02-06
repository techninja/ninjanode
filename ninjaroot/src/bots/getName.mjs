import data from './data/names.json' assert { type: 'json' };

export const getName = () => 
  '🤖 ' +
  data.prefix[Math.floor(Math.random() * data.prefix.length)] +
  data.suffix[Math.floor(Math.random() * data.suffix.length)];

export default getName;