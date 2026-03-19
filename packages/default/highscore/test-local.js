const { main } = require('./highscore');

console.log('--- Submit score: Andrax = 5 ---');
console.log(main({ username: 'Andrax', score: '5' }));

console.log('\n--- Submit score: TurboPickle = 12 ---');
console.log(main({ username: 'TurboPickle', score: '12' }));

console.log('\n--- Submit score: Andrax = 8 (should update) ---');
console.log(main({ username: 'Andrax', score: '8' }));

console.log('\n--- Get all scores ---');
console.log(JSON.stringify(main({}), null, 2));
